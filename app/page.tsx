import Link from "next/link";
import { fetchPrimaryPet } from "@/lib/primary-pet";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const petResult = await fetchPrimaryPet();
  const primaryPet = petResult.ok ? petResult.pet : null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const nowIso = new Date().toISOString();

  const { data: latestFood, error: foodError } = primaryPet
    ? await supabase
        .from("food_entries")
        .select("*")
        .eq("pet_id", primaryPet.id)
        .order("fed_at", { ascending: false })
        .limit(1)
    : { data: null, error: null };

  const lastMeal = latestFood?.[0];

  const { data: todaysFood, error: todaysFoodError } = primaryPet
    ? await supabase
        .from("food_entries")
        .select("calories, fed_at")
        .eq("pet_id", primaryPet.id)
        .gte("fed_at", startOfToday.toISOString())
    : { data: null, error: null };

  const todaysCalories =
    todaysFood?.reduce((sum, entry) => sum + (Number(entry.calories) || 0), 0) ?? 0;

  const { data: todaysWalks, error: walksError } = primaryPet
    ? await supabase
        .from("walks")
        .select("id")
        .eq("pet_id", primaryPet.id)
        .gte("start_time", startOfToday.toISOString())
    : { data: null, error: null };

  const todaysWalkCount = todaysWalks?.length ?? 0;

  const { data: upcomingEvents, error: eventsError } = primaryPet
    ? await supabase
        .from("events")
        .select("title, event_type, starts_at, location")
        .eq("pet_id", primaryPet.id)
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(1)
    : { data: null, error: null };

  const nextEvent = upcomingEvents?.[0];

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Olive Ops</p>
          <h1 className="text-3xl font-bold">Today</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A shared home for household pets, starting with Olive’s food, walks, events, and training.
          </p>
          {primaryPet?.household_name ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Household: {primaryPet.household_name}
            </p>
          ) : null}
        </header>

        <section className="rounded-2xl border border-gray-200 p-4 space-y-2 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">
            {primaryPet
              ? `${primaryPet.name ?? "Pet"} Summary (${primaryPet.species})`
              : "Pet Summary"}
          </h2>

          {!petResult.ok ? (
            <p className="text-sm text-red-600">{petResult.errorMessage}</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Last meal:{" "}
                {foodError
                  ? "Could not load"
                  : lastMeal
                    ? `${lastMeal.food_name}${lastMeal.calories ? ` (${lastMeal.calories} cal)` : ""} at ${new Date(lastMeal.fed_at).toLocaleString()}`
                    : "Not logged yet"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Today’s calories: {todaysFoodError ? "Could not load" : todaysCalories}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Today’s walks: {walksError ? "Could not load" : todaysWalkCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Next event:{" "}
                {eventsError
                  ? "Could not load"
                  : nextEvent
                    ? `${nextEvent.title} (${nextEvent.event_type}) at ${new Date(nextEvent.starts_at).toLocaleString()}${nextEvent.location ? ` • ${nextEvent.location}` : ""}`
                    : "None"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Latest training note: None</p>
            </>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/walks/mode"
            className="col-span-2 rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-4 text-center text-base font-semibold text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100"
          >
            🐾 Walk Mode (GPS)
          </Link>
          <Link href="/food/new" className="rounded-2xl border border-gray-200 p-4 font-medium dark:border-zinc-800 dark:bg-zinc-900">
            🥣 Add Food
          </Link>
          <Link href="/treats" className="rounded-2xl border border-gray-200 p-4 font-medium dark:border-zinc-800 dark:bg-zinc-900">
            🦴 Treat Rankings
          </Link>
          <Link href="/walks/new" className="rounded-2xl border border-gray-200 p-4 font-medium dark:border-zinc-800 dark:bg-zinc-900">
            🐕 Add Walk
          </Link>
          <Link href="/events/new" className="rounded-2xl border border-gray-200 p-4 font-medium dark:border-zinc-800 dark:bg-zinc-900">
            📅 Add Event
          </Link>
          <Link href="/training/new" className="rounded-2xl border border-gray-200 p-4 font-medium dark:border-zinc-800 dark:bg-zinc-900">
            🎓 Add Training
          </Link>
        </section>

        <section>
          <Link href="/history" className="text-sm underline">
            📜 View History
          </Link>
        </section>
      </div>
    </main>
  );
}
