import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data: dogs, error: dogError } = await supabase
    .from("dogs")
    .select("*")
    .limit(1);

  const olive = dogs?.[0];

  const { data: latestFood, error: foodError } = olive
    ? await supabase
        .from("food_entries")
        .select("*")
        .eq("dog_id", olive.id)
        .order("fed_at", { ascending: false })
        .limit(1)
    : { data: null, error: null };

  const lastMeal = latestFood?.[0];

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
                Household ID: {olive?.household_id ?? "Not available"}
              </p>
              <p className="text-sm text-gray-600">
                Last meal:{" "}
                {foodError
                  ? "Could not load"
                  : lastMeal
                    ? `${lastMeal.food_name}${lastMeal.calories ? ` (${lastMeal.calories} cal)` : ""}`
                    : "Not logged yet"}
              </p>
              <p className="text-sm text-gray-600">Today’s walks: 0</p>
              <p className="text-sm text-gray-600">Next event: None</p>
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