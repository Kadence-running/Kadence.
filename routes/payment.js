/* ============================================
   KADENCE — Payment Routes (Stripe)
   ============================================ */

const express = require('express');
const router = express.Router();
const {
    findSubscriberByEmail,
    findSubscriberByCustomerId,
    upsertSubscriber,
    updateSubscriberByCustomerId,
    addPayment
} = require('../db/init');

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ──────────────────────────────────────────────
// POST /api/payment/create-checkout
// Creates a Stripe Checkout session for Premium subscription
// ──────────────────────────────────────────────
router.post('/create-checkout', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Email invalide' });
        }

        if (!process.env.STRIPE_PRICE_ID) {
            return res.status(500).json({ error: 'Configuration Stripe incomplète. STRIPE_PRICE_ID manquant.' });
        }

        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

        // Create or retrieve Stripe customer
        let customer;
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({ email });
        }

        // Save/update subscriber in DB
        upsertSubscriber({ email, stripe_customer_id: customer.id });

        // Create Checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            }],
            success_url: `${baseUrl}/premium.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/premium.html?payment=cancelled`,
            metadata: { email },
            subscription_data: { metadata: { email } },
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('❌ Erreur Stripe Checkout:', error.message);
        res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
    }
});

// ──────────────────────────────────────────────
// POST /api/payment/webhook
// Handles Stripe webhook events
// ──────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } else {
            console.warn('⚠️  STRIPE_WEBHOOK_SECRET non configuré — webhook non vérifié');
            event = JSON.parse(req.rawBody.toString());
        }
    } catch (err) {
        console.error('❌ Webhook signature invalide:', err.message);
        return res.status(400).json({ error: 'Signature invalide' });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const email = session.metadata?.email || session.customer_email;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                if (email) {
                    upsertSubscriber({
                        email,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        status: 'active',
                        plan: 'premium'
                    });

                    addPayment({
                        email,
                        stripe_checkout_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent,
                        amount: session.amount_total,
                        currency: 'eur',
                        status: 'succeeded'
                    });

                    console.log(`✅ Premium activé pour ${email}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const status = subscription.status;
                const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

                updateSubscriberByCustomerId(customerId, {
                    status: status === 'active' ? 'active' : 'inactive',
                    current_period_end: periodEnd
                });

                console.log(`📋 Abonnement mis à jour pour customer ${customerId}: ${status}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                updateSubscriberByCustomerId(customerId, {
                    status: 'cancelled',
                    plan: 'free'
                });

                console.log(`🔴 Abonnement annulé pour customer ${customerId}`);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const customerId = invoice.customer;

                updateSubscriberByCustomerId(customerId, {
                    status: 'past_due'
                });

                console.log(`⚠️  Paiement échoué pour customer ${customerId}`);
                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.error('❌ Erreur traitement webhook:', err.message);
    }

    res.json({ received: true });
});

// ──────────────────────────────────────────────
// GET /api/payment/status?email=xxx
// Check if a user has an active premium subscription
// ──────────────────────────────────────────────
router.get('/status', (req, res) => {
    const { email } = req.query;
    if (!email) return res.json({ premium: false });

    const subscriber = findSubscriberByEmail(email);

    if (subscriber && subscriber.status === 'active' && subscriber.plan === 'premium') {
        return res.json({
            premium: true,
            plan: subscriber.plan,
            status: subscriber.status,
            periodEnd: subscriber.current_period_end,
        });
    }

    res.json({ premium: false });
});

// ──────────────────────────────────────────────
// POST /api/payment/verify-session
// Verify a checkout session after redirect
// ──────────────────────────────────────────────
router.post('/verify-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'Session ID manquant' });

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const email = session.metadata?.email || session.customer_email;

            upsertSubscriber({
                email,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                status: 'active',
                plan: 'premium'
            });

            return res.json({ premium: true, email });
        }

        res.json({ premium: false });
    } catch (error) {
        console.error('❌ Erreur vérification session:', error.message);
        res.status(500).json({ error: 'Erreur de vérification' });
    }
});

module.exports = router;
