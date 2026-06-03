# WarrantyVault

Application web de gestion de garanties produits — Travail de Fin d'Études, Bachelier Informatique 2026.

**Production :**
- Frontend : https://warranty-vault-mauve.vercel.app
- Backend : https://warranty-vault-production.up.railway.app

---

## Fonctionnalités

- Inscription / connexion sécurisée (JWT + Supabase Auth)
- Ajout, modification et suppression de produits avec suivi de garantie
- Badges de statut : en garantie / expire bientôt / expirée
- Recherche et filtrage par catégorie sur le dashboard
- Scan de factures par OCR (Google Vision API) avec pré-remplissage automatique du formulaire
- Upload de factures (PDF, JPEG, PNG, WEBP — max 10 Mo)
- Alertes email automatiques 30 jours avant expiration (cron quotidien à 8h00)
- Sécurité multicouche : JWT côté API + Row Level Security côté base de données

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Angular 21 (Standalone, Signals) |
| Backend | NestJS 11 (TypeScript) |
| Base de données | Supabase (PostgreSQL + Auth + Storage) |
| OCR | Google Vision API |
| Email | Nodemailer (SMTP Gmail) |
| Déploiement frontend | Vercel |
| Déploiement backend | Railway (Docker) |

---

## Structure du projet

```
warranty-vault/
├── frontend/          # Application Angular 21
│   ├── src/app/
│   │   ├── core/      # Services, guards, intercepteurs, modèles
│   │   └── features/  # Dashboard, produits, auth
│   └── vercel.json    # Rewrite SPA pour Vercel
├── backend/           # API NestJS 11
│   ├── src/
│   │   ├── auth/      # JWT, Passport, inscription/connexion
│   │   ├── products/  # CRUD produits
│   │   ├── invoices/  # Upload et gestion des factures
│   │   ├── ocr/       # Intégration Google Vision API
│   │   ├── alerts/    # Cron alertes email
│   │   └── supabase/  # Client Supabase partagé
│   └── Dockerfile     # Build Node 22-alpine
└── supabase/
    └── migrations/    # Scripts SQL (tables, RLS, triggers)
```

---

## Lancer le projet en local

### Prérequis

- Node.js 22+
- Un projet Supabase configuré
- Une clé Google Vision API
- Un compte SMTP (Gmail recommandé)

### Variables d'environnement

Créer `backend/.env` :

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
GOOGLE_VISION_API_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="WarrantyVault <...>"
FRONTEND_URL=http://localhost:4200
```

### Démarrage

```bash
# Backend (port 3000)
cd backend && npm install && npm run start:dev

# Frontend (port 4200)
cd frontend && npm install && npm start
```

L'application est accessible sur `http://localhost:4200`.

### Migrations SQL

Exécuter les scripts dans Supabase SQL Editor dans l'ordre :

```
supabase/migrations/001_create_products.sql
supabase/migrations/002_create_invoices.sql
supabase/migrations/003_create_alerts.sql
```

---

## Déploiement

### Frontend — Vercel

- Root directory : `frontend/`
- Build command : `npm run build`
- Output directory : `dist/frontend/browser`
- Aucune variable d'environnement requise (valeurs compilées dans le bundle)

### Backend — Railway

- Root directory : `backend/`
- Build : détection automatique du `Dockerfile`
- Variables d'environnement : toutes les clés du `.env` sauf `PORT` (injecté par Railway)
- Networking : configurer le port sur la valeur affichée dans les logs (`PORT=8080`)

---

## Auteur

Nicolas Djomo — Bachelier Informatique, juin 2026
