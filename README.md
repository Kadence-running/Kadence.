# 🏃 Kadence

Plateforme d'entraînement course à pied personnalisée.

## Prérequis

- [Node.js](https://nodejs.org/) v18+
- Un compte [Stripe](https://stripe.com/) avec un produit/prix configuré

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env à partir du template
cp .env.example .env

# 3. Remplir les variables dans .env (voir section ci-dessous)

# 4. Lancer le serveur
npm start
```

## Configuration Stripe

### 1. Créer un produit dans Stripe

1. Aller sur [Stripe Dashboard → Produits](https://dashboard.stripe.com/products)
2. Cliquer **+ Ajouter un produit**
3. Nom : `Kadence Premium`
4. Prix : `9,90 €` / mois (récurrent)
5. Copier le **Price ID** (commence par `price_`)

### 2. Configurer le webhook

1. Aller sur [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer **+ Ajouter un endpoint**
3. URL : `https://kadence.desec.io/api/payment/webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copier le **Webhook Secret** (commence par `whsec_`)

### 3. Variables .env

```env
PORT=3000
STRIPE_SECRET_KEY=sk_live_XXXX        # Clé secrète Stripe (Dashboard → API Keys)
STRIPE_WEBHOOK_SECRET=whsec_XXXX      # Secret du webhook
STRIPE_PRICE_ID=price_XXXX            # ID du prix Kadence Premium
BASE_URL=https://kadence.desec.io
```

> ⚠️ **Ne jamais commiter le fichier .env** — il contient vos clés secrètes.

## Déploiement sur Railway

1. Créer un compte sur [railway.app](https://railway.app/)
2. Connecter votre repo GitHub
3. Railway détecte automatiquement Node.js
4. Ajouter les variables d'environnement dans Railway (Settings → Variables)
5. Railway fournit une URL — configurer votre DNS `kadence.desec.io` vers cette URL

### Alternative : VPS (Ubuntu)

```bash
# Sur le serveur
git clone <votre-repo> /opt/kadence
cd /opt/kadence
npm install --production
cp .env.example .env
# Remplir .env

# Avec PM2 pour le process management
npm install -g pm2
pm2 start server.js --name kadence
pm2 save
pm2 startup
```

Puis configurer Nginx en reverse proxy :

```nginx
server {
    listen 80;
    server_name kadence.desec.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis `certbot --nginx -d kadence.desec.io` pour le HTTPS.

## Structure du projet

```
kadence/
├── server.js              # Serveur Express principal
├── package.json           # Dépendances
├── .env.example           # Template variables d'environnement
├── .gitignore
├── Dockerfile
├── db/
│   └── init.js            # Initialisation SQLite
├── routes/
│   └── payment.js         # Routes API Stripe
└── public/                # Fichiers statiques
    ├── index.html
    ├── profil.html
    ├── plan.html
    ├── conseils.html
    ├── outils.html
    ├── premium.html
    ├── styles.css
    └── app.js
```

## Licence

Propriétaire — Tous droits réservés © 2026 Kadence
