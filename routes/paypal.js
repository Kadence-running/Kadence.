/* ============================================
   KADENCE — PayPal Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const {
    findSubscriberByEmail,
    upsertSubscriber,
    addPayment
} = require('../db/init');

// ──────────────────────────────────────────────
// POST /api/paypal/create-order
// Creates a PayPal order for one month of Premium
// ──────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Email invalide' });
        }

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const paypalBase = process.env.PAYPAL_MODE === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        if (!clientId || !clientSecret) {
            return res.status(500).json({ error: 'Configuration PayPal incomplète.' });
        }

        // Get PayPal access token
        const authResponse = await fetch(`${paypalBase}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        const authData = await authResponse.json();

        if (!authData.access_token) {
            throw new Error('Impossible d\'obtenir un token PayPal');
        }

        // Create PayPal order
        const orderResponse = await fetch(`${paypalBase}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authData.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'EUR',
                        value: '9.90'
                    },
                    description: 'Kadence Premium — Abonnement mensuel'
                }],
                application_context: {
                    brand_name: 'Kadence',
                    locale: 'fr-FR',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW'
                }
            })
        });

        const orderData = await orderResponse.json();

        if (orderData.id) {
            // Save subscriber with pending status
            upsertSubscriber({ email, paypal_order_id: orderData.id });
            res.json({ orderId: orderData.id });
        } else {
            throw new Error(orderData.message || 'Erreur création commande PayPal');
        }
    } catch (error) {
        console.error('❌ Erreur PayPal create-order:', error.message);
        res.status(500).json({ error: 'Erreur lors de la création de la commande PayPal' });
    }
});

// ──────────────────────────────────────────────
// POST /api/paypal/capture-order
// Captures payment after user approves on PayPal
// ──────────────────────────────────────────────
router.post('/capture-order', async (req, res) => {
    try {
        const { orderId, email } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID manquant' });
        }

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const paypalBase = process.env.PAYPAL_MODE === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        // Get PayPal access token
        const authResponse = await fetch(`${paypalBase}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        const authData = await authResponse.json();

        // Capture the order
        const captureResponse = await fetch(`${paypalBase}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authData.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const captureData = await captureResponse.json();

        if (captureData.status === 'COMPLETED') {
            const payerEmail = email || captureData.payer?.email_address;

            // Activate premium
            upsertSubscriber({
                email: payerEmail,
                status: 'active',
                plan: 'premium',
                paypal_order_id: orderId,
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            // Record payment
            addPayment({
                email: payerEmail,
                paypal_order_id: orderId,
                amount: 990,
                currency: 'eur',
                method: 'paypal',
                status: 'completed'
            });

            console.log(`✅ Premium activé via PayPal pour ${payerEmail}`);
            return res.json({ premium: true, email: payerEmail });
        }

        res.json({ premium: false, error: 'Paiement non complété' });
    } catch (error) {
        console.error('❌ Erreur PayPal capture:', error.message);
        res.status(500).json({ error: 'Erreur lors de la capture du paiement' });
    }
});

module.exports = router;
