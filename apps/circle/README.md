# Circle

Application familiale indépendante issue de la maquette Circle V5. Ce dossier contient le front Cloudflare Pages et le schéma Supabase dédiés à Circle.

## Environnements

- Production : https://circle-family.pages.dev
- Supabase : projet `Circle` (`mvlhzhayvthsxldfkqxe`, région Paris)
- Branche de production : `codex/circle-production`

## Démarrage local

```bash
npm install
cp .env.example .env.local
npm run dev -- --port 8098
```

Les variables publiques Vite sont disponibles dans le tableau de bord Supabase. Ne jamais versionner la clé `service_role` ni le mot de passe de la base.

## Vérification

```bash
npm run typecheck
npm run build
SUPABASE_SERVICE_ROLE_KEY=... CIRCLE_BASE_URL=http://127.0.0.1:8098 npm run test:e2e
```

Le parcours E2E crée un utilisateur isolé et un foyer, puis vérifie de bout en bout : l'import et la lecture d'un vrai PDF de contrat, l'ajout d'un contrat, un signalement de maintenance, une routine, un équipement, une amélioration, une réservation scolaire et son document, un abonnement importé, une facture importée, la recherche d'un paiement et la répartition financière. Il rejoue ensuite la connexion et tous les espaces dans un contexte tactile aux dimensions de l'iPhone 17 Pro (`402 × 874`, facteur `3×`), contrôle les débordements, panneaux et images, puis supprime le compte et les fichiers de test. Ajouter `CIRCLE_TEST_CONFIRMATION=1` pour vérifier aussi, avec une réponse Auth simulée sans envoi d'e-mail, l'écran affiché quand une inscription attend sa confirmation. Ajouter `CIRCLE_TEST_PUBLIC_SIGNUP=1` pour passer par une véritable création de compte publique en mode bêta privée.

## Déploiement

```bash
npm run deploy
```

Le dossier `dist/` est publié dans le projet Cloudflare Pages `circle-family`. Les en-têtes de sécurité et le fallback SPA sont définis dans `public/_headers` et `public/_redirects`.

## Données

Les migrations se trouvent dans `supabase/migrations/`. Elles créent les profils, foyers, membres, enregistrements métier et le stockage documentaire privé, avec isolation RLS par foyer, rôles d'accès, publication temps réel et anonymisation de l'auteur lors de la suppression d'un compte.

Circle lit localement le texte des PDF, fichiers texte, CSV et JSON pour préremplir les informations utiles avant validation. Les images et photos sont conservées dans le même espace privé mais demandent une confirmation manuelle : aucune donnée n'est inventée en l'absence d'un véritable service OCR.

La bêta privée connecte l'authentification, le multi-foyer et les principaux workflows: maintenance, passages et routines, contrats et documents, équipements, améliorations, école, abonnements, répartition financière, disponibilités et demandes d'aide. La confirmation d'adresse reste désactivée pendant les tests privés afin de ne pas dépendre du quota e-mail partagé de Supabase; elle devra être réactivée avec un SMTP dédié avant l'ouverture publique. Les exemples éditoriaux restent visibles comme état de démonstration; les actions de l'utilisateur les enrichissent avec des données persistées et isolées par foyer.
