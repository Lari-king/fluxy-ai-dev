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

Le test `test:e2e:people` part lui aussi d'un compte neuf. Il contrôle la création automatique du profil de co-parent, la création, la modification et la suppression des autres profils, les rendez-vous, routines et proches, puis crée deux foyers portant exactement le même nom. Il vérifie dans l'interface et directement dans Supabase que leurs UUID et leurs données restent distincts. Ajouter `CIRCLE_TEST_CONFIRMATION=1` au test général pour vérifier aussi, avec une réponse Auth simulée sans envoi d'e-mail, l'écran affiché quand une inscription attend sa confirmation. Ajouter `CIRCLE_TEST_PUBLIC_SIGNUP=1` pour passer par une véritable création de compte publique en mode bêta privée.

Le test `test:e2e:school` utilise un compte QA existant fourni par `CIRCLE_TEST_EMAIL` et `CIRCLE_TEST_PASSWORD`. Il crée un foyer temporaire et un profil enfant, recherche l'école dans l'annuaire officiel, enregistre les horaires et tarifs, organise les accueils et le mercredi, range un document, prépare une période de vacances, recharge l'application, contrôle le rendu iPhone 17 Pro puis supprime uniquement le foyer créé par cette exécution.

## Déploiement

```bash
npm run deploy
```

Le dossier `dist/` est publié dans le projet Cloudflare Pages `circle-family`. Les en-têtes de sécurité et le fallback SPA sont définis dans `public/_headers` et `public/_redirects`.

## Données

Les migrations se trouvent dans `supabase/migrations/`. Elles créent les profils, foyers, membres, enregistrements métier et le stockage documentaire privé, avec isolation RLS par foyer, rôles d'accès, publication temps réel et anonymisation de l'auteur lors de la suppression d'un compte.

Circle lit localement le texte des PDF, fichiers texte, CSV et JSON pour préremplir les informations utiles avant validation. Les images et photos sont conservées dans le même espace privé mais demandent une confirmation manuelle : aucune donnée n'est inventée en l'absence d'un véritable service OCR.

La bêta privée connecte l'authentification, le multi-foyer et les principaux workflows: personnes, proches, rendez-vous, routines, maintenance, contrats et documents, équipements, améliorations, abonnements et répartition financière. La confirmation d'adresse reste désactivée pendant les tests privés afin de ne pas dépendre du quota e-mail partagé de Supabase; elle devra être réactivée avec un SMTP dédié avant l'ouverture publique.

Le sélecteur de foyers, le bandeau du foyer, les notifications et tout l'espace Personnes n'utilisent aucune donnée d'exemple : un foyer neuf contient uniquement le profil réel de son créateur, lié au compte comme co-parent. Les photos de profil sont privées et les rubriques École, Santé et Organisation sont enregistrées dans le profil concerné. Les contenus éditoriaux encore présents dans Habitation, Abonnements et Finances sont traités comme la couche suivante à connecter, module par module, sans les confondre avec des données créées par l'utilisateur.

## Assistant École

L'assistant interroge l'Annuaire de l'Éducation nationale à partir de la ville et du nom saisis. L'utilisateur choisit l'établissement proposé avant toute sauvegarde. L'identifiant UAI, l'adresse, le téléphone, l'e-mail, le statut et les indications disponibles sur la restauration conservent leur provenance et leur date de mise à jour.

La fonction Supabase `school-enrichment-agent` complète ensuite la proposition avec les sources municipales. Rouen dispose d'un socle officiel intégré: horaires des accueils maternels, délai J-2, majoration sans réservation, portail famille et grille tarifaire par quotient. Tant que le quotient n'est pas renseigné, Circle applique le tarif maximal rouennais; la saisie du quotient recalcule immédiatement chaque service. Les réservations restent liées à une semaine datée et l'estimation mensuelle explique ses hypothèses.

Si le secret serveur `GEMINI_API_KEY` est configuré sur le projet Supabase Circle, la fonction utilise Gemini avec Google Search et URL Context pour rechercher les règles locales publiées, puis renvoie un objet structuré et ses sources. Sans ce secret, elle reste sur les données officielles déterministes connues, sans exposer de clé au navigateur et sans inventer d'information. Dans tous les cas, le parent valide la proposition avant son enregistrement.

```bash
npx supabase secrets set GEMINI_API_KEY=... --project-ref mvlhzhayvthsxldfkqxe
npx supabase functions deploy school-enrichment-agent --project-ref mvlhzhayvthsxldfkqxe
```

La suppression d'un foyer est réservée à son propriétaire et exige la saisie exacte de son nom. Les fichiers sont d'abord supprimés via l'API Storage autorisée, puis la fonction Supabase supprime le foyer et ses données relationnelles en cascade.
