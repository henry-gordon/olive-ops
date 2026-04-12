"use client";

import { useMemo, useState } from "react";

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
    reactivity_level: string | null;
    notes: string | null;
  };

type EventEntry = {
  id: string;
  event_type: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
};

type TrainingEntry = {
  id: string;
  skill_name: string;
  session_at: string;
  duration_minutes: number | null;
  success_rating: number | null;
  notes: string | null;
};

type HistoryItem =
  | { id: string; type: "food"; timestamp: string; data: FoodEntry }
  | { id: string; type: "walk"; timestamp: string; data: WalkEntry }
  | { id: string; type: "event"; timestamp: string; data: EventEntry }
  | { id: string; type: "training"; timestamp: string; data: TrainingEntry };

type FilterType = "all" | "food" | "walk" | "event" | "training";

export default function HistoryList({
  oliveName,
  items,
}: {
  oliveName: string;
  items: HistoryItem[];
}) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.type === filter);
  }, [filter, items]);

  const filterOptions: FilterType[] = ["all", "food", "walk", "event", "training"];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-gray-500">Olive Ops</p>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-sm text-gray-600">Recent activity for {oliveName}.</p>
      </header>

      <section className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-full border px-3 py-2 text-sm ${
              filter === option ? "font-semibold" : ""
            }`}
          >
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </section>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-gray-600">No matching history yet.</p>
      ) : (
        <section className="space-y-3">
          {filteredItems.map((item) => (
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
                    <p className="text-sm text-gray-600">Notes: {item.data.notes}</p>
                  ) : null}
                </div>
              ) : item.type === "walk" ? (
                <div className="mt-2 space-y-1">
                  <p className="font-medium">Walk</p>
                  <p className="text-sm text-gray-600">
                    Duration: {item.data.duration_minutes ?? "—"} minutes
                  </p>
                  <p className="text-sm text-gray-600">
                    Location: {item.data.location_note ?? "—"}
                  </p>
                  {item.data.notes ? (
                    <p className="text-sm text-gray-600">Notes: {item.data.notes}</p>
                  ) : null}
                </div>
              ) : item.type === "event" ? (
                <div className="mt-2 space-y-1">
                  <p className="font-medium">{item.data.title}</p>
                  <p className="text-sm text-gray-600">
                    Type: {item.data.event_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    Location: {item.data.location ?? "—"}
                  </p>
                  {item.data.ends_at ? (
                    <p className="text-sm text-gray-600">
                      Ends: {new Date(item.data.ends_at).toLocaleString()}
                    </p>
                  ) : null}
                  {item.data.notes ? (
                    <p className="text-sm text-gray-600">Notes: {item.data.notes}</p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  <p className="font-medium">{item.data.skill_name}</p>
                  <p className="text-sm text-gray-600">
                    Duration: {item.data.duration_minutes ?? "—"} minutes
                  </p>
                  <p className="text-sm text-gray-600">
                    Success: {item.data.success_rating ?? "—"} / 5
                  </p>
                  {item.data.notes ? (
                    <p className="text-sm text-gray-600">Notes: {item.data.notes}</p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}