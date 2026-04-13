import { fetchPrimaryDog } from "@/lib/primary-dog";
import { supabase } from "@/lib/supabase";
import HistoryList from "./HistoryList";

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

export default async function HistoryPage() {
  const dogResult = await fetchPrimaryDog();
  const olive = dogResult.ok ? dogResult.dog : null;

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
        .select("id, start_time, end_time, duration_minutes, location_note, reactivity_level, notes")
        .eq("dog_id", olive.id)
        .order("start_time", { ascending: false })
        .limit(20)
    : { data: null, error: null };

  const { data: eventEntries, error: eventError } = olive
    ? await supabase
        .from("events")
        .select("id, event_type, title, starts_at, ends_at, location, notes")
        .eq("dog_id", olive.id)
        .order("starts_at", { ascending: false })
        .limit(20)
    : { data: null, error: null };

  const { data: trainingEntries, error: trainingError } = olive
    ? await supabase
        .from("training_sessions")
        .select("id, skill_name, session_at, duration_minutes, success_rating, notes")
        .eq("dog_id", olive.id)
        .order("session_at", { ascending: false })
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
    ...(eventEntries?.map((entry: EventEntry) => ({
      id: entry.id,
      type: "event" as const,
      timestamp: entry.starts_at,
      data: entry,
    })) ?? []),
    ...(trainingEntries?.map((entry: TrainingEntry) => ({
      id: entry.id,
      type: "training" as const,
      timestamp: entry.session_at,
      data: entry,
    })) ?? []),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md">
        {!dogResult.ok ? (
          <p className="text-sm text-red-600">{dogResult.errorMessage}</p>
        ) : foodError || walkError || eventError || trainingError ? (
          <p className="text-sm text-red-600">Could not load history.</p>
        ) : (
          <HistoryList
            oliveName={olive?.name ?? "your dog"}
            items={combinedHistory}
          />
        )}
      </div>
    </main>
  );
}