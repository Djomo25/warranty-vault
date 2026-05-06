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

#### Qualité
- Zéro erreur TypeScript frontend et backend
- Commits atomiques avec messages conventionnels

---

## Ce qu'il faut faire ensuite

### Priorité 1 — Upload de facture (Avril)
- [ ] Configurer Supabase Storage (bucket `invoices`, policy par `user_id`)
- [ ] Endpoint `POST /api/products/:id/invoice` : upload PDF/image vers Supabase Storage
- [ ] Stocker l'URL dans `products.invoice_url`
- [ ] Bouton "Joindre une facture" dans le formulaire produit (Angular)
- [ ] Afficher un lien/aperçu de la facture dans le dashboard

### Priorité 2 — OCR Google Vision API (Avril)
- [ ] Créer un compte Google Cloud, activer Vision API, récupérer la clé
- [ ] Ajouter `@google-cloud/vision` dans le backend
- [ ] Endpoint `POST /api/products/ocr` : envoie l'image à Vision API, retourne le texte extrait
- [ ] Algorithme de parsing : extraire nom du produit, date d'achat, montant
- [ ] Pré-remplir le formulaire Angular avec les données extraites
- [ ] Prévoir un fallback manuel si l'OCR échoue

### Priorité 3 — Alertes email (Mai)
- [ ] Installer `nodemailer` dans le backend
- [ ] Configurer un compte SMTP (Gmail app password ou Mailtrap pour les tests)
- [ ] Job planifié (`@nestjs/schedule` + `@Cron`) : vérification quotidienne des garanties
- [ ] Envoyer un email 30 jours avant expiration (une seule fois par produit)
- [ ] Ajouter un champ `alert_sent_at` dans la table `products` pour éviter les doublons

### Priorité 4 — UI/UX & polish (Mai)
- [ ] Page détail produit (`/products/:id`)
- [ ] Filtre par catégorie et tri sur le dashboard
- [ ] Formulaire : validation visuelle plus claire, champs optionnels masquables
- [ ] Responsive mobile (media queries)
- [ ] Messages de confirmation (toast) après ajout / suppression

### Priorité 5 — Déploiement (Juin)
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
