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
SUPABASE_SERVICE_ROLE_KEY=... CIRCLE_BASE_URL=http://127.0.0.1:8098 npm run test:e2e:people
```

Le parcours E2E général crée un utilisateur isolé et un foyer, puis vérifie de bout en bout : l'import et la lecture d'un vrai PDF de contrat, l'ajout d'un contrat, un signalement de maintenance, une routine, un équipement, une amélioration, un profil et son rendez-vous, un abonnement importé, une facture importée, la recherche d'un paiement et la répartition financière. Il rejoue ensuite la connexion et tous les espaces dans un contexte tactile aux dimensions de l'iPhone 17 Pro (`402 × 874`, facteur `3×`), contrôle les débordements, panneaux et images, puis supprime le compte et les fichiers de test.

Le test `test:e2e:people` part lui aussi d'un compte neuf. Il contrôle l'état réellement vide, la création, la modification et la suppression de profils, les rendez-vous, routines et proches, puis crée deux foyers portant exactement le même nom. Il vérifie dans l'interface et directement dans Supabase que leurs UUID et leurs données restent distincts. Ajouter `CIRCLE_TEST_CONFIRMATION=1` au test général pour vérifier aussi, avec une réponse Auth simulée sans envoi d'e-mail, l'écran affiché quand une inscription attend sa confirmation. Ajouter `CIRCLE_TEST_PUBLIC_SIGNUP=1` pour passer par une véritable création de compte publique en mode bêta privée.

## Déploiement

```bash
npm run deploy
```

Le dossier `dist/` est publié dans le projet Cloudflare Pages `circle-family`. Les en-têtes de sécurité et le fallback SPA sont définis dans `public/_headers` et `public/_redirects`.

## Données

Les migrations se trouvent dans `supabase/migrations/`. Elles créent les profils, foyers, membres, enregistrements métier et le stockage documentaire privé, avec isolation RLS par foyer, rôles d'accès, publication temps réel et anonymisation de l'auteur lors de la suppression d'un compte.

Circle lit localement le texte des PDF, fichiers texte, CSV et JSON pour préremplir les informations utiles avant validation. Les images et photos sont conservées dans le même espace privé mais demandent une confirmation manuelle : aucune donnée n'est inventée en l'absence d'un véritable service OCR.

La bêta privée connecte l'authentification, le multi-foyer et les principaux workflows: personnes, proches, rendez-vous, routines, maintenance, contrats et documents, équipements, améliorations, abonnements et répartition financière. La confirmation d'adresse reste désactivée pendant les tests privés afin de ne pas dépendre du quota e-mail partagé de Supabase; elle devra être réactivée avec un SMTP dédié avant l'ouverture publique.

Le sélecteur de foyers, le bandeau du foyer, les notifications et tout l'espace Personnes n'utilisent aucune donnée d'exemple : un foyer neuf est réellement vide. Les contenus éditoriaux encore présents dans Habitation, Abonnements et Finances sont traités comme la couche suivante à connecter, module par module, sans les confondre avec des données créées par l'utilisateur.
