<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Olive Ops Agent Notes

Olive Ops is a mobile-first household operations app for household pets, starting with Olive. Keep changes aligned with the product goals in `README.md`: useful before polished, shared and simple, incremental, and grounded in a clear source-of-truth data model.

Before editing Next.js code, read the relevant local Next docs from `node_modules/next/dist/docs/`. Useful starting points for this repo:

- `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`

Implementation preferences:

- Preserve the App Router structure under `app/`.
- Keep forms mobile-first and simple.
- Prefer explicit Supabase field mapping over clever generic helpers until repetition is painful.
- Do not introduce service-role Supabase keys into client code or `NEXT_PUBLIC_` variables.
- Treat `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the only required local env vars for the current app.
- Use `pets` and `pet_id` as the canonical app model. `Olive` is a pet with `species = 'dog'`.
- The legacy `dogs` table and legacy `dog_id` columns may still exist for compatibility. Do not build new app behavior on them.
- Remember that `/treats` currently uses `localStorage`, not Supabase, so it is device-local by design.
- The current app assumes the first row in `pets` is the primary pet. If multi-pet selection is added, change `lib/primary-pet.ts` intentionally and update the docs.

Deployment notes:

- Vercel should use `npm run build`.
- Supabase setup and RLS guidance lives in `docs/SUPABASE_DEPLOYMENT.md`.
- Supabase is currently configured for a protected preview with temporary anon RLS policies. Until auth and household-scoped RLS exist, deployed URLs should be treated as protected/private household tooling.
