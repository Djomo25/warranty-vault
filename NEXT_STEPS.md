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
- Clé Google Vision API configurée dans `.env` ✅

---

## Ce qu'il faut faire ensuite

### ~~Priorité 1 — OCR Google Vision API~~ ✅ TERMINÉ

### Priorité 1 — Alertes email (Mai)
- [ ] Installer `nodemailer` + `@nestjs/schedule` dans le backend
- [ ] Configurer SMTP (variable `SMTP_*` dans `.env`)
- [ ] Ajouter colonne `alert_sent_at` dans la table `products` (migration 003)
- [ ] Job `@Cron` quotidien : détecte les garanties expirant dans 30 jours
- [ ] Envoyer l'email d'alerte (une seule fois par produit via `alert_sent_at`)
- [ ] Template HTML de l'email

### Priorité 3 — UI/UX & polish (Mai)
- [ ] Page détail produit (`/products/:id`) avec liste des factures intégrée
- [ ] Filtre par catégorie et tri sur le dashboard
- [ ] Messages toast (confirmation après ajout / modification / suppression)
- [ ] Responsive mobile (media queries)
- [ ] Indicateur de facture jointe dans la table du dashboard (icône 📎)

### Priorité 4 — Déploiement (Juin)
- [ ] Déployer le frontend Angular sur Vercel
- [ ] Déployer le backend NestJS sur Railway ou Render (gratuit)
- [ ] Variables d'environnement de production configurées
- [ ] Tester le flux complet en ligne avec de vraies données

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
