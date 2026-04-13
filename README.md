# Olive Ops

Olive Ops is a small shared app for tracking the everyday operations of household pets, starting with Olive: food, walks, reactivity, events, training, and lightweight decision support for the humans who care for her.

The project is intentionally practical. It is a household workflow first and a learning project second: build something useful, keep the data model understandable, ship small increments, and let the same muscles transfer to RevOps and Strategy & Ops work.

## Product Goals

1. Help Olive day to day.
   Track meals, calories, walks, walk reactivity, daycare/training/vet events, training sessions, and eventually encounters, hotspots, and patterns.

2. Learn by building a real operational system.
   Use a real workflow to practice data modeling, CRUD app development, full-stack iteration, source-of-truth thinking, and AI-assisted development without losing control of the system.

3. Build transferable ops skills.
   Treat the app like a small operational dashboard: define entities, capture clean inputs, create useful summaries, and turn logs into decisions.

4. Learn in public credibly.
   The story is not "I vibe-coded an app." It is "I built an operational system from scratch using product thinking, structured data, and AI-assisted software development."

## Current App Surface

- Home dashboard at `/` with household context, the primary pet summary, last meal, calories, walks, next event, and quick actions.
- Food logging at `/food/new`, including device-local food presets.
- Manual walk logging at `/walks/new`.
- Walk Mode at `/walks/mode`, including timer, GPS distance, interaction logging, and after-walk review.
- Event logging at `/events/new` for daycare, training, vet, grooming, playdates, and other schedule items.
- Training logging at `/training/new`.
- Recent history at `/history`, with filters across food, walks, events, and training.
- Treat Rankings at `/treats`, stored in Supabase per pet so the household sees the same board across devices.

## Product Principles

- Shared and simple.
- Mobile-first.
- Incremental, not overbuilt.
- Useful before polished.
- Prefer boring, explicit data flows over clever abstractions.
- Keep the source-of-truth model understandable enough that a future agent or developer can safely extend it.

## Tech Stack

- Next.js `16.2.3` App Router
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- Supabase via `@supabase/supabase-js`
- Vercel-oriented deployment target

## Local Development

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run build
```

## Data Model Notes

The canonical model is households and pets. Pets belong to households; future authenticated users should relate to households through `household_members`.

The app currently expects one primary pet row and reads the first row from `pets`.

Tables used by the app:

- `households`: `id`, `name`, `created_at`
- `pets`: `id`, `household_id`, `name`, `species`, `adoption_date`, `birth_estimate`, `notes`, `created_at`
- `household_members`: `id`, `household_id`, `user_id`, `display_name`, `email`, `role`, `created_at`
- `food_entries`: `household_id`, `pet_id`, `food_name`, `calories`, `amount`, `notes`, `fed_at`, `created_by`
- `walks`: `household_id`, `pet_id`, `start_time`, `end_time`, `duration_minutes`, `location_note`, `reactivity_level`, `notes`, `created_by`
- `events`: `household_id`, `pet_id`, `event_type`, `title`, `starts_at`, `ends_at`, `location`, `notes`, `created_by`
- `training_sessions`: `household_id`, `pet_id`, `skill_name`, `session_at`, `duration_minutes`, `success_rating`, `notes`, `created_by`

There is a legacy `dogs` table and legacy `dog_id` columns from the first app iteration. New app code should use `pets` and `pet_id`. Do not add new dog-centric app concepts unless the product intentionally introduces species-specific behavior.

Treat rankings use the `treat_rankings` table. Existing device-local rankings are migrated into Supabase the first time `/treats` loads for a pet with no shared board yet.

## Vercel Readiness

Vercel should detect this as a Next.js app. Use the default build command:

```bash
npm run build
```

Add the same Supabase environment variables in Vercel for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Important: both variables are intentionally public because the current client code uses the Supabase anon client. Do not add a Supabase service-role key to any `NEXT_PUBLIC_` variable.

The current Supabase setup is for a protected preview: public tables have RLS enabled, with temporary anon policies for the app's current read/insert flows. Until the app has authentication and household-scoped Row Level Security, treat deployed URLs as private household tooling and use Vercel Deployment Protection or another access gate.

## Supabase Deployment Runbook

See [docs/SUPABASE_DEPLOYMENT.md](./docs/SUPABASE_DEPLOYMENT.md) for the step-by-step Supabase changes to make before moving beyond local development.

## Future-Friendly Next Steps

- Add a committed schema/migration file so the Supabase structure is reproducible.
- Replace hardcoded `created_by` values with a household member selector or authentication.
- Add household-scoped Supabase Auth policies before making the app public.
- Add focused tests around data mapping and form validation as the workflows stabilize.
