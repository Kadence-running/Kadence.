/* ============================================
   KADENCE — Express Server
   ============================================ */

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const { initDatabase } = require('./db/init');
const paymentRoutes = require('./routes/payment');
const paypalRoutes = require('./routes/paypal');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database ───────────────────────────────
initDatabase();

// ── Security ───────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.paypal.com", "https://www.sandbox.paypal.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com", "https://www.paypal.com", "https://www.sandbox.paypal.com"],
            frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com", "https://www.paypal.com", "https://www.sandbox.paypal.com"],
        },
    },
}));

// ── Middleware ──────────────────────────────
// Stripe webhook needs raw body, so mount it BEFORE express.json()
app.post('/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
        // Attach raw body for Stripe signature verification
        req.rawBody = req.body;
        next();
    }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());

// ── Static Files ───────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────
app.use('/api/payment', paymentRoutes);
app.use('/api/paypal', paypalRoutes);

// ── Public Config (no secrets) ─────────────
app.get('/api/config', (req, res) => {
    res.json({
        paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
        paypalMode: process.env.PAYPAL_MODE || 'sandbox'
    });
});

// ── Health Check ───────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ── SPA Fallback — Serve index.html for all non-API routes ──
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Route non trouvée' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error Handler ──────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ── Start ──────────────────────────────────
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║   🏃 Kadence est en ligne !           ║
  ║                                       ║
  ║   → http://localhost:${PORT}             ║
  ║   → ${process.env.BASE_URL || 'https://kadence.desec.io'}  ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
