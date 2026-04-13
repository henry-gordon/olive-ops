# Supabase Deployment Runbook

This runbook is for moving Olive Ops from local development toward a protected Vercel preview.

## Current Architecture Constraint

The app currently uses the Supabase anon key in browser-accessible code:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

That is normal for Supabase client apps, but it means security must come from Supabase Row Level Security policies and/or an access gate in front of the app. Today there is no app authentication layer, so a fully public deployment requires care.

For the current household-only preview, use Vercel Deployment Protection or keep the URL private. Before a real public production launch, add Supabase Auth and household-scoped RLS.

## 1. Confirm Project API Settings

In Supabase:

1. Open the Olive Ops Supabase project.
2. Go to Project Settings > API.
3. Copy the Project URL.
4. Copy the anon public key.
5. Do not copy or expose the service role key to the frontend or Vercel public environment variables.

In Vercel:

1. Open the Olive Ops project.
2. Go to Settings > Environment Variables.
3. Add `NEXT_PUBLIC_SUPABASE_URL` with the Supabase Project URL.
4. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the Supabase anon public key.
5. Scope both variables to Preview and Production. Add Development too if you plan to use `vercel env pull`.
6. Redeploy after changing these variables, because `NEXT_PUBLIC_` values are bundled at build time.

## 2. Confirm Required Tables

The canonical model is households and pets. Pets belong to households. Future authenticated users should relate to households through `household_members`.

### `households`

```sql
id uuid primary key default gen_random_uuid(),
name text not null,
created_at timestamptz not null default now()
```

### `pets`

```sql
id uuid primary key default gen_random_uuid(),
household_id uuid not null references households(id),
name text not null,
species text not null default 'dog',
adoption_date date,
birth_estimate date,
notes text,
created_at timestamptz not null default now()
```

The current code reads the first `pets` row as the primary pet. Olive should exist here with `species = 'dog'`.

### `household_members`

```sql
id uuid primary key default gen_random_uuid(),
household_id uuid not null references households(id),
user_id uuid references auth.users(id),
display_name text,
email text,
role text not null default 'member',
created_at timestamptz not null default now()
```

### Activity Tables

Each activity table should have `household_id` and `pet_id`:

- `food_types`: `name`, `unit`, `calories_per_unit`, `created_by`, `created_at`, `updated_at`
- `food_entries`: `food_name`, `calories`, `amount`, `notes`, `fed_at`, `created_by`
- `walks`: `start_time`, `end_time`, `duration_minutes`, `location_note`, `reactivity_level`, `notes`, `created_by`
- `events`: `event_type`, `title`, `starts_at`, `ends_at`, `location`, `notes`, `created_by`
- `training_sessions`: `skill_name`, `session_at`, `duration_minutes`, `success_rating`, `notes`, `created_by`
- `treat_rankings`: `name`, `brand`, `type`, `score` as a 0-100 preference score, `wins`, `losses`, `created_at`, `updated_at`

Legacy `dog_id` columns may still exist from the first iteration, but new app code should use `pet_id`.

## 3. Seed the Household and Olive

In Supabase SQL Editor, create the initial household and pet if they do not already exist:

```sql
insert into households (name)
values ('Olive household')
returning id;
```

Copy the returned household `id`, then:

```sql
insert into pets (household_id, name, species)
values ('PASTE_HOUSEHOLD_ID_HERE', 'Olive', 'dog');
```

## 4. Protected Preview RLS

The project is currently configured for a protected preview:

- RLS is enabled on public app tables.
- `pets` is the canonical pet table.
- Activity tables have `pet_id`.
- Temporary anon policies allow the current read/insert flows.

Those anonymous policies are not production security. They allow any browser with the anon key and project URL to perform the allowed actions. Pair them with Vercel Deployment Protection or another access gate.

Before public production, replace those temporary policies with authenticated household-scoped policies.

## 5. Production Security Direction

When you are ready to make the app more than a protected household preview:

1. Add Supabase Auth.
2. Add a real household membership flow using `household_members`.
3. Replace hardcoded `created_by` values in the app with the authenticated user or a household member profile.
4. Update RLS so users can only read and write rows for households they belong to.
5. Consider adding `updated_at` fields and audit fields once edits/deletes exist.

## 6. Vercel Verification Checklist

After deploying:

1. Open the Vercel preview URL on your phone.
2. Confirm the home page loads Olive's summary.
3. Add a food type on `/food/new`, then open the same page on a second device and confirm the shared food type appears.
4. Add a food entry.
5. Add a manual walk.
6. Start and save a Walk Mode session. GPS requires HTTPS, which Vercel provides.
7. Add an event.
8. Add a training session.
9. Open `/history` and confirm the new rows appear.
10. Open Supabase Table Editor and confirm rows were written with `pet_id`.
11. Open `/treats` on a second device and confirm the shared treat rankings load from Supabase.
