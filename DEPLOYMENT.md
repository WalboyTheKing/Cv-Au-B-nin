# Déploiement en Production — CV Pro Bénin

## 1. Architecture recommandée (Économique / Gratuit au démarrage)
- **Base de données persistante** : Supabase PostgreSQL (tier gratuit)
- **Serveur complet (Frontend compilé + API Express + OCR + Gemini Proxy)** : Render Web Service (avec `render.yaml`) ou Railway / VPS Node.js persistant.
  > **Important** : Ne déployez pas le serveur Express dans un environnement serverless éphémère si vous n'avez pas configuré Supabase (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`), car les fichiers `server-data/*.json` locaux y sont réinitialisés à chaque redémarrage.

## 2. Mise en place Supabase PostgreSQL (Obligatoire avant mise en vente)
1. Créez un projet gratuit sur [Supabase](https://supabase.com).
2. Ouvrez l'**éditeur SQL** de Supabase et exécutez dans l'ordre :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_production_alignment.sql`
3. Récupérez dans *Project Settings -> API* :
   - `Project URL` -> `SUPABASE_URL` (et `VITE_SUPABASE_URL`)
   - `service_role` secret key -> `SUPABASE_SERVICE_ROLE_KEY` (**strictement côté serveur**)
   - `anon` public key -> `VITE_SUPABASE_ANON_KEY`
4. Migrez les données JSON locales existantes sans perte :
   ```bash
   npm run migrate:supabase
   ```

## 3. Variables d'environnement obligatoires en production
Voir `.env.example` :
- `AUTH_SALT` : chaîne aléatoire secrète (64+ caractères).
- `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` : activent automatiquement le mode PostgreSQL.
- `GEMINI_API_KEY` : clé Google AI Studio côté serveur uniquement (jamais exposée au navigateur).
- `MOOV_BENEFICIARY_NAME`, `MOOV_BENEFICIARY_PHONE`, `MOOV_USSD_CODE`.

## 4. Sécurité post-déploiement (Obligatoire)
1. Connectez-vous immédiatement sur `/#admin` avec `admin@cvprobenin.bj` et **modifiez le mot de passe administrateur** (ou mettez à jour le hash en base).
2. Vérifiez que `/api/health` renvoie `{"ok":true,"storage":"supabase"}` (ou `"json"` en test local).
3. Vérifiez le quota Gemini dans Google Cloud / AI Studio et configurez des alertes de facturation.
