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
CIRCLE_BASE_URL=http://127.0.0.1:8098 npm run test:e2e
```

Le parcours E2E crée un utilisateur isolé, un foyer, un signalement de maintenance et une réservation scolaire. Il vérifie ensuite leur persistance Supabase ainsi que les vues ordinateur et mobile.

## Déploiement

```bash
npm run deploy
```

Le dossier `dist/` est publié dans le projet Cloudflare Pages `circle-family`. Les en-têtes de sécurité et le fallback SPA sont définis dans `public/_headers` et `public/_redirects`.

## Données

Les migrations se trouvent dans `supabase/migrations/`. Elles créent les profils, foyers, membres et enregistrements métier, avec isolation RLS par foyer, rôles d'accès, publication temps réel et anonymisation de l'auteur lors de la suppression d'un compte.

La bêta connecte déjà l'authentification, le multi-foyer, les signalements de maintenance, les réservations scolaires et l'ajout de contrats. Les autres contenus riches de la maquette restent des données de démonstration jusqu'à leur raccordement progressif aux mêmes primitives métier.
