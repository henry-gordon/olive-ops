import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data: dogs, error: dogError } = await supabase
    .from("dogs")
    .select("*")
    .limit(1);

  const olive = dogs?.[0];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const nowIso = new Date().toISOString();

  const { data: latestFood, error: foodError } = olive
    ? await supabase
        .from("food_entries")
        .select("*")
        .eq("dog_id", olive.id)
        .order("fed_at", { ascending: false })
        .limit(1)
    : { data: null, error: null };

  const lastMeal = latestFood?.[0];

  const { data: todaysFood, error: todaysFoodError } = olive
    ? await supabase
        .from("food_entries")
        .select("calories, fed_at")
        .eq("dog_id", olive.id)
        .gte("fed_at", startOfToday.toISOString())
    : { data: null, error: null };

  const todaysCalories =
    todaysFood?.reduce((sum, entry) => sum + (Number(entry.calories) || 0), 0) ?? 0;

  const { data: todaysWalks, error: walksError } = olive
    ? await supabase
        .from("walks")
        .select("id")
        .eq("dog_id", olive.id)
        .gte("start_time", startOfToday.toISOString())
    : { data: null, error: null };

  const todaysWalkCount = todaysWalks?.length ?? 0;

  const { data: upcomingEvents, error: eventsError } = olive
    ? await supabase
        .from("events")
        .select("title, event_type, starts_at, location")
        .eq("dog_id", olive.id)
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(1)
    : { data: null, error: null };

  const nextEvent = upcomingEvents?.[0];

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-gray-500">Olive Ops</p>
          <h1 className="text-3xl font-bold">Today</h1>
          <p className="text-sm text-gray-600">
            A shared home for Olive’s food, walks, events, and training.
          </p>
        </header>

        <section className="rounded-2xl border p-4 space-y-2">
          <h2 className="text-lg font-semibold">
            {olive ? `${olive.name} Summary` : "Dog Summary"}
          </h2>

          {dogError ? (
            <p className="text-sm text-red-600">Could not load dog data.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Last meal:{" "}
                {foodError
                  ? "Could not load"
                  : lastMeal
                    ? `${lastMeal.food_name}${lastMeal.calories ? ` (${lastMeal.calories} cal)` : ""} at ${new Date(lastMeal.fed_at).toLocaleString()}`
                    : "Not logged yet"}
              </p>
              <p className="text-sm text-gray-600">
                Today’s calories: {todaysFoodError ? "Could not load" : todaysCalories}
              </p>
              <p className="text-sm text-gray-600">
                Today’s walks: {walksError ? "Could not load" : todaysWalkCount}
              </p>
              <p className="text-sm text-gray-600">
                Next event:{" "}
                {eventsError
                  ? "Could not load"
                  : nextEvent
                    ? `${nextEvent.title} (${nextEvent.event_type}) at ${new Date(nextEvent.starts_at).toLocaleString()}${nextEvent.location ? ` • ${nextEvent.location}` : ""}`
                    : "None"}
              </p>
              <p className="text-sm text-gray-600">Latest training note: None</p>
            </>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link href="/food/new" className="rounded-2xl border p-4 font-medium">
            Add Food
          </Link>
          <Link href="/walks/new" className="rounded-2xl border p-4 font-medium">
            Add Walk
          </Link>
          <Link href="/events/new" className="rounded-2xl border p-4 font-medium">
            Add Event
          </Link>
          <Link href="/training/new" className="rounded-2xl border p-4 font-medium">
            Add Training
          </Link>
        </section>

        <section>
          <Link href="/history" className="text-sm underline">
            View History
          </Link>
        </section>
      </div>
    </main>
  );
}