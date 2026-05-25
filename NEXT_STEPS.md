# WarrantyVault — État du projet & prochaines étapes

## Ce qui a été fait

### Séance du 06/05/2026

#### Infrastructure & Auth
- Scaffold Angular 21 (frontend) + NestJS 11 (backend)
- Supabase configuré : PostgreSQL + Auth + Storage
- Authentification complète : inscription, connexion, GET /api/auth/me
- JWT via `passport-jwt` + `JwtAuthGuard` réutilisable
- Fix : `JwtModule.registerAsync` pour lire `JWT_SECRET` après `ConfigModule`
- Fix : restauration synchrone du `User` depuis `localStorage` au démarrage (guard fonctionnel)

#### CRUD Produits
- Table SQL `products` avec RLS, trigger `warranty_end` et `updated_at`
- 5 endpoints REST protégés JWT : `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id`
- Dashboard avec stats (total / en garantie / expirent bientôt / expirées)
- Badges statut vert / orange / rouge selon jours restants
- Formulaire ajout + édition produit (`/products/new`, `/products/:id/edit`)

### Séance du 07/05/2026

#### OCR Google Vision API
- `OcrModule` / `OcrService` / `OcrController` : endpoint `POST /api/ocr` protégé JWT
- Appel REST direct à Vision API (images:annotate pour JPEG/PNG/WEBP, files:annotate pour PDF)
- Parser texte : extraction date d'achat, prix, magasin, nom produit
- Angular `OcrService` + bouton "Scanner la facture" sur le formulaire produit
- Pré-remplissage automatique des champs name / purchaseDate / price / store
- Fallback : champs vides si OCR ne trouve pas la donnée (saisie manuelle)

#### Upload de factures
- Table SQL `invoices` avec RLS (liée à `products` et `auth.users`)
- Bucket Supabase Storage `invoices` (privé, 10 Mo max, PDF/JPEG/PNG/WEBP) avec policies par `user_id`
- 3 endpoints REST protégés JWT :
  - `POST /api/products/:id/invoices` — upload multipart (memoryStorage, multer)
  - `GET  /api/products/:id/invoices` — liste avec signed URLs (TTL 1h)
  - `DELETE /api/invoices/:id`        — supprime DB + Storage (cleanup atomique)
- `InvoiceUploadComponent` Angular : drag-and-drop, click-to-browse, prévisualisation image/PDF
- Validation format + taille côté client ET backend
- Intégré dans la fiche produit (mode édition uniquement)

### Séance du 25/05/2026

#### Dashboard amélioré
- Barre de recherche (nom, marque, modèle) + filtre par catégorie — computed signals
- Lignes de la table cliquables → `/products/:id` (stopPropagation sur les actions)
- État "aucun résultat" avec bouton reset des filtres

#### Page détail produit (`/products/:id`)
- `ProductDetailComponent` : bandeau statut coloré, grille infos/garantie, notes
- Section factures intégrée (upload + liste)
- Bouton Modifier → `/products/:id/edit`

#### Alertes email
- Table SQL `alerts` (product_id, user_id, alert_type, sent_at) avec RLS — migration 003
- `AlertsModule` / `AlertsService` / `AlertsController`
- Cron `@8h00` (Europe/Brussels) : produits expirant dans ≤ 30 jours
- Déduplication : alerte ignorée si déjà envoyée dans les 25 derniers jours
- Email HTML responsive (carte produit, badge expiration, lien fiche)
- SMTP configuré via `SMTP_HOST/PORT/USER/PASS/FROM` dans `.env`
- `POST /api/alerts/trigger` (JWT) pour déclencher manuellement
- Testé : `{ sent: 2, skipped: 0 }` ✅ — emails reçus sur nicolas.djomo@yahoo.com

#### Revue qualité & corrections
- `error.interceptor.ts` : 401 hors `/auth/` → logout + redirect login automatique
- Locale française enregistrée (`registerLocaleData`) — CurrencyPipe `| currency:'fr'` fonctionnel
- `.btn-primary` : `inline-flex` par défaut, `width: 100%` scopé aux pages auth uniquement
- `Validators.min(0)` sur le champ prix du formulaire produit
- Gestion d'erreur sur le chargement initial des factures

---

## Ce qu'il faut faire ensuite

### Priorité 1 — Déploiement (Juin)

#### Frontend → Vercel
- [ ] `ng build --configuration production` et vérifier que le build passe
- [ ] Créer un projet Vercel, connecter le repo GitHub (`warranty-vault`)
- [ ] Répertoire racine : `frontend/`, commande de build : `npm run build`, output : `dist/frontend/browser`
- [ ] Ajouter les variables d'environnement Vercel :
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (visibles côté client, anon key uniquement)
- [ ] Mettre à jour `environment.prod.ts` avec les vraies valeurs (ou via `fileReplacements`)
- [ ] Configurer le rewrite Vercel pour SPA : `{ "source": "/(.*)", "destination": "/index.html" }`
- [ ] Tester le flux complet en ligne

#### Backend → Railway (recommandé) ou Render
- [ ] Créer un `Dockerfile` dans `backend/` (image Node 22-alpine, `npm run build`, `node dist/main`)
- [ ] Pousser sur Railway : connecter repo, répertoire `backend/`
- [ ] Variables d'environnement Railway (copier depuis `.env`, sauf `PORT` géré par Railway) :
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`, `GOOGLE_VISION_API_KEY`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - `FRONTEND_URL` = URL Vercel de production
- [ ] Mettre à jour `FRONTEND_URL` dans Railway après déploiement Vercel (CORS)
- [ ] Tester `POST /api/auth/login` sur l'URL Railway depuis Postman

#### Validation déploiement
- [ ] Connexion / inscription depuis l'URL Vercel
- [ ] Ajout d'un produit, upload d'une facture, scan OCR
- [ ] Vérifier que le cron 8h00 tourne en production (Railway logs)

### Priorité 2 — Finalisation TFE (avant le 25 juin 2026)

#### Polish UI restant
- [ ] Messages toast (confirmation après ajout / modification / suppression)
- [ ] Responsive mobile complet (media queries sur dashboard et formulaire)
- [ ] Indicateur facture jointe (icône 📎) dans la colonne produit du dashboard

#### Rapport TFE
- [ ] Captures d'écran de l'application en production pour le rapport
- [ ] Schéma d'architecture (Angular → NestJS → Supabase + Storage + Auth)
- [ ] Documenter les choix techniques (JWT, RLS, OCR, cron alertes)
- [ ] Section "difficultés rencontrées" : fix JwtModule.registerAsync, immutabilité PostgreSQL, auth guard synchrone, transporter nodemailer lazy

#### Présentation (25 juin 2026)
- [ ] Démo live sur l'URL de production
- [ ] Préparer un jeu de données de démonstration (3-4 produits avec factures, 1 qui expire bientôt)
- [ ] Slide : fonctionnalités clés, architecture, technologies

---

## Pour reprendre le développement

```bash
# Backend (port 3000)
cd backend && npm run start:dev

# Frontend (port 4200)
cd frontend && npm start
```

## Liens utiles
- GitHub : https://github.com/Djomo25/warranty-vault
- Supabase : https://supabase.com/dashboard/project/zxfnlmqqjcgyvnlweqsz
- Présentation TFE : 25 juin 2026
