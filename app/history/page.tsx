import { supabase } from "@/lib/supabase";

type FoodEntry = {
  id: string;
  fed_at: string;
  food_name: string;
  calories: number | null;
  amount: string | null;
  notes: string | null;
};

type WalkEntry = {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  location_note: string | null;
  notes: string | null;
};

type HistoryItem =
  | {
      id: string;
      type: "food";
      timestamp: string;
      data: FoodEntry;
    }
  | {
      id: string;
      type: "walk";
      timestamp: string;
      data: WalkEntry;
    };

export default async function HistoryPage() {
  const { data: dogs } = await supabase.from("dogs").select("*").limit(1);
  const olive = dogs?.[0];

  const { data: foodEntries, error: foodError } = olive
    ? await supabase
        .from("food_entries")
        .select("id, fed_at, food_name, calories, amount, notes")
        .eq("dog_id", olive.id)
        .order("fed_at", { ascending: false })
        .limit(20)
    : { data: null, error: null };

  const { data: walkEntries, error: walkError } = olive
    ? await supabase
        .from("walks")
        .select("id, start_time, end_time, duration_minutes, location_note, notes")
        .eq("dog_id", olive.id)
        .order("start_time", { ascending: false })
        .limit(20)
    : { data: null, error: null };

  const combinedHistory: HistoryItem[] = [
    ...(foodEntries?.map((entry: FoodEntry) => ({
      id: entry.id,
      type: "food" as const,
      timestamp: entry.fed_at,
      data: entry,
    })) ?? []),
    ...(walkEntries?.map((entry: WalkEntry) => ({
      id: entry.id,
      type: "walk" as const,
      timestamp: entry.start_time,
      data: entry,
    })) ?? []),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-gray-500">Olive Ops</p>
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-sm text-gray-600">
            Recent food and walk activity for {olive?.name ?? "your dog"}.
          </p>
        </header>

        {foodError || walkError ? (
          <p className="text-sm text-red-600">Could not load history.</p>
        ) : combinedHistory.length === 0 ? (
          <p className="text-sm text-gray-600">No history yet.</p>
        ) : (
          <section className="space-y-3">
            {combinedHistory.map((item) => (
              <div key={`${item.type}-${item.id}`} className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {item.type}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>

                {item.type === "food" ? (
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">{item.data.food_name}</p>
                    <p className="text-sm text-gray-600">
                      Calories: {item.data.calories ?? "—"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Amount: {item.data.amount ?? "—"}
                    </p>
                    {item.data.notes ? (
                      <p className="text-sm text-gray-600">
                        Notes: {item.data.notes}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">Walk</p>
                    <p className="text-sm text-gray-600">
                      Duration: {item.data.duration_minutes ?? "—"} minutes
                    </p>
                    <p className="text-sm text-gray-600">
                      Location: {item.data.location_note ?? "—"}
                    </p>
                    {item.data.notes ? (
                      <p className="text-sm text-gray-600">
                        Notes: {item.data.notes}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}