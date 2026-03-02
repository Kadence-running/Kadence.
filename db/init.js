/* ============================================
   KADENCE — Database (JSON file-based)
   ============================================ */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'kadence-data.json');

// Default data structure
const defaultData = {
  subscribers: [],
  payments: []
};

// Load or create database
function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('⚠️  Erreur lecture DB, réinitialisation:', err.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function initDatabase() {
  const data = loadDb();
  saveDb(data);
  console.log('✅ Base de données initialisée');
}

// ── Subscriber Operations ──────────────────

function findSubscriberByEmail(email) {
  const data = loadDb();
  return data.subscribers.find(s => s.email === email) || null;
}

function findSubscriberByCustomerId(customerId) {
  const data = loadDb();
  return data.subscribers.find(s => s.stripe_customer_id === customerId) || null;
}

function upsertSubscriber(subscriber) {
  const data = loadDb();
  const index = data.subscribers.findIndex(s => s.email === subscriber.email);

  if (index >= 0) {
    data.subscribers[index] = {
      ...data.subscribers[index],
      ...subscriber,
      updated_at: new Date().toISOString()
    };
  } else {
    data.subscribers.push({
      id: data.subscribers.length + 1,
      status: 'inactive',
      plan: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...subscriber
    });
  }

  saveDb(data);
  return findSubscriberByEmail(subscriber.email);
}

function updateSubscriberByCustomerId(customerId, updates) {
  const data = loadDb();
  const index = data.subscribers.findIndex(s => s.stripe_customer_id === customerId);

  if (index >= 0) {
    data.subscribers[index] = {
      ...data.subscribers[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDb(data);
    return data.subscribers[index];
  }

  return null;
}

// ── Payment Operations ─────────────────────

function addPayment(payment) {
  const data = loadDb();
  data.payments.push({
    id: data.payments.length + 1,
    created_at: new Date().toISOString(),
    ...payment
  });
  saveDb(data);
}

module.exports = {
  initDatabase,
  findSubscriberByEmail,
  findSubscriberByCustomerId,
  upsertSubscriber,
  updateSubscriberByCustomerId,
  addPayment
};
