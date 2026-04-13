"use client";

import { useEffect, useMemo, useState } from "react";
import type { PrimaryPetRow } from "@/lib/primary-pet";
import { supabase } from "@/lib/supabase";
import { usePrimaryPet } from "@/lib/use-primary-pet";

const STORAGE_PREFIX = "olive-ops-treat-rankings";

const treatTypes = [
  "crunchy",
  "soft",
  "chew",
  "fresh",
  "frozen",
  "topper",
  "other",
] as const;

type TreatType = (typeof treatTypes)[number];
type FilterType = "all" | TreatType;

type Treat = {
  id: string;
  name: string;
  brand: string;
  type: TreatType;
  score: number;
  wins: number;
  losses: number;
  createdAt: string;
};

type TreatRow = {
  id: string;
  household_id: string;
  pet_id: string;
  name: string;
  brand: string | null;
  type: string;
  score: number;
  wins: number;
  losses: number;
  created_at: string;
};

type DraftTreat = {
  name: string;
  brand: string;
  type: TreatType;
};

type RankingSession = {
  treat: Treat;
  opponents: Treat[];
  index: number;
  workingTreats: Treat[];
};

function getStorageKey(petId: string) {
  return `${STORAGE_PREFIX}:${petId}`;
}

function isTreatType(value: unknown): value is TreatType {
  return typeof value === "string" && treatTypes.includes(value as TreatType);
}

function readLocalTreats(petId: string): Treat[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getStorageKey(petId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is Treat => {
      if (typeof item !== "object" || item === null) return false;
      const treat = item as Treat;
      return (
        typeof treat.id === "string" &&
        typeof treat.name === "string" &&
        typeof treat.brand === "string" &&
        isTreatType(treat.type) &&
        typeof treat.score === "number" &&
        typeof treat.wins === "number" &&
        typeof treat.losses === "number" &&
        typeof treat.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function rankTreats(treats: Treat[]) {
  return [...treats].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

function createTreat(draft: DraftTreat, score: number): Treat {
  return {
    id: crypto.randomUUID(),
    name: draft.name.trim(),
    brand: draft.brand.trim(),
    type: draft.type,
    score,
    wins: 0,
    losses: 0,
    createdAt: new Date().toISOString(),
  };
}

function scoreMatch(winner: Treat, loser: Treat) {
  const expectedWinner =
    1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
  const expectedLoser =
    1 / (1 + Math.pow(10, (winner.score - loser.score) / 400));
  const k = 44;

  return {
    winner: {
      ...winner,
      score: Math.round(winner.score + k * (1 - expectedWinner)),
      wins: winner.wins + 1,
    },
    loser: {
      ...loser,
      score: Math.round(loser.score + k * (0 - expectedLoser)),
      losses: loser.losses + 1,
    },
  };
}

function comparisonCandidates(treats: Treat[]) {
  const ranked = rankTreats(treats);
  const count = Math.min(5, Math.max(3, Math.ceil(ranked.length / 2)));
  if (ranked.length <= count) return ranked;

  const indexes = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    indexes.add(Math.round((i * (ranked.length - 1)) / (count - 1)));
  }

  return [...indexes].map((index) => ranked[index]).filter(Boolean);
}

function rowToTreat(row: TreatRow): Treat | null {
  if (!isTreatType(row.type)) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? "",
    type: row.type,
    score: row.score,
    wins: row.wins,
    losses: row.losses,
    createdAt: row.created_at,
  };
}

function treatToRow(pet: PrimaryPetRow, treat: Treat) {
  return {
    id: treat.id,
    household_id: pet.household_id,
    pet_id: pet.id,
    name: treat.name,
    brand: treat.brand,
    type: treat.type,
    score: treat.score,
    wins: treat.wins,
    losses: treat.losses,
    created_at: treat.createdAt,
    updated_at: new Date().toISOString(),
  };
}

async function fetchTreats(pet: PrimaryPetRow) {
  const { data, error } = await supabase
    .from("treat_rankings")
    .select("id, household_id, pet_id, name, brand, type, score, wins, losses, created_at")
    .eq("pet_id", pet.id)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return { ok: false as const, errorMessage: error.message };

  const treats = ((data ?? []) as TreatRow[])
    .map(rowToTreat)
    .filter((treat): treat is Treat => treat !== null);

  return { ok: true as const, treats: rankTreats(treats) };
}

async function saveTreats(pet: PrimaryPetRow, treats: Treat[]) {
  const { error } = await supabase
    .from("treat_rankings")
    .upsert(treats.map((treat) => treatToRow(pet, treat)));

  if (error) return { ok: false as const, errorMessage: error.message };
  return { ok: true as const };
}

function emptyDraft(type: TreatType = "soft"): DraftTreat {
  return { name: "", brand: "", type };
}

export default function TreatsPage() {
  const { pet, loading: petLoading, errorMessage: petError } = usePrimaryPet();

  if (petLoading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-gray-600">Loading pet...</p>
        </div>
      </main>
    );
  }

  if (petError || !pet) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-red-600">{petError ?? "Could not load pet."}</p>
        </div>
      </main>
    );
  }

  return <TreatRankingApp key={pet.id} pet={pet} />;
}

function TreatRankingApp({ pet }: { pet: PrimaryPetRow }) {
  const [treats, setTreats] = useState<Treat[]>([]);
  const [loadingTreats, setLoadingTreats] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [message, setMessage] = useState("");
  const [bootstrapDrafts, setBootstrapDrafts] = useState<DraftTreat[]>([
    emptyDraft("soft"),
    emptyDraft("crunchy"),
    emptyDraft("chew"),
    emptyDraft("fresh"),
    emptyDraft("frozen"),
  ]);
  const [newTreat, setNewTreat] = useState<DraftTreat>(emptyDraft());
  const [session, setSession] = useState<RankingSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingTreats(true);
      const result = await fetchTreats(pet);
      if (cancelled) return;

      if (!result.ok) {
        setTreats([]);
        setMessage(`Could not load treat rankings: ${result.errorMessage}`);
        setLoadingTreats(false);
        return;
      }

      if (result.treats.length > 0) {
        setTreats(result.treats);
        setLoadingTreats(false);
        return;
      }

      const localTreats = rankTreats(readLocalTreats(pet.id));
      if (localTreats.length > 0) {
        const saveResult = await saveTreats(pet, localTreats);
        if (cancelled) return;
        if (saveResult.ok) {
          setTreats(localTreats);
          setMessage("Synced this device's treat board so it can load on other devices.");
        } else {
          setTreats(localTreats);
          setMessage(`Could not sync local treat board: ${saveResult.errorMessage}`);
        }
      } else {
        setTreats([]);
      }

      setLoadingTreats(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pet]);

  const rankedTreats = useMemo(() => rankTreats(treats), [treats]);
  const filteredTreats = useMemo(() => {
    if (filter === "all") return rankedTreats;
    return rankedTreats.filter((treat) => treat.type === filter);
  }, [filter, rankedTreats]);

  const hasFinishedBootstrap = treats.length >= 3;
  const activeOpponent = session?.opponents[session.index] ?? null;

  function updateBootstrapDraft(index: number, patch: Partial<DraftTreat>) {
    setBootstrapDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...patch } : draft
      )
    );
  }

  async function handleBootstrapSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const filledDrafts = bootstrapDrafts.filter((draft) => draft.name.trim());

    if (filledDrafts.length < 3) {
      setMessage("Add at least 3 favorite treats to start the ranking.");
      return;
    }

    const names = new Set(filledDrafts.map((draft) => draft.name.trim().toLowerCase()));
    if (names.size !== filledDrafts.length) {
      setMessage("Each starting treat needs a unique name.");
      return;
    }

    const startingScore = 1500;
    const seededTreats = filledDrafts.map((draft, index) =>
      createTreat(draft, startingScore - index * 90)
    );

    setIsSaving(true);
    const saveResult = await saveTreats(pet, seededTreats);
    setIsSaving(false);

    if (!saveResult.ok) {
      setMessage(`Could not save starting board: ${saveResult.errorMessage}`);
      return;
    }

    setTreats(rankTreats(seededTreats));
    setMessage("Starting board saved. Add the next treat when Olive finds a new obsession.");
  }

  function handleAddTreat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!newTreat.name.trim()) {
      setMessage("Treat name is required.");
      return;
    }

    const duplicate = treats.some(
      (treat) => treat.name.trim().toLowerCase() === newTreat.name.trim().toLowerCase()
    );
    if (duplicate) {
      setMessage("That treat is already on the board.");
      return;
    }

    const treat = createTreat(newTreat, 1500);
    setSession({
      treat,
      opponents: comparisonCandidates(treats),
      index: 0,
      workingTreats: treats,
    });
    setNewTreat(emptyDraft(newTreat.type));
  }

  async function answerComparison(winnerId: string) {
    if (!session || !activeOpponent) return;

    const newTreatWon = winnerId === session.treat.id;
    const scored = newTreatWon
      ? scoreMatch(session.treat, activeOpponent)
      : scoreMatch(activeOpponent, session.treat);

    const updatedNewTreat = newTreatWon ? scored.winner : scored.loser;
    const updatedOpponent = newTreatWon ? scored.loser : scored.winner;
    const nextWorkingTreats = session.workingTreats.map((treat) =>
      treat.id === updatedOpponent.id ? updatedOpponent : treat
    );
    const nextIndex = session.index + 1;

    if (nextIndex >= session.opponents.length) {
      const nextTreats = rankTreats([...nextWorkingTreats, updatedNewTreat]);
      setIsSaving(true);
      const saveResult = await saveTreats(pet, nextTreats);
      setIsSaving(false);

      if (!saveResult.ok) {
        setMessage(`Could not save ranking: ${saveResult.errorMessage}`);
        return;
      }

      setTreats(nextTreats);
      setSession(null);
      setMessage(`${updatedNewTreat.name} landed on the board.`);
      return;
    }

    setSession({
      treat: updatedNewTreat,
      opponents: session.opponents,
      index: nextIndex,
      workingTreats: nextWorkingTreats,
    });
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-gray-500">Olive Ops</p>
          <h1 className="text-3xl font-bold">Treat Rankings</h1>
          <p className="text-sm text-gray-600">
            Rank what {pet.name ?? "your pet"} loves most, one head-to-head choice at a time.
          </p>
        </header>

        {loadingTreats ? (
          <section className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Loading treat rankings</h2>
            <p className="text-sm text-gray-600">
              Checking the shared board for {pet.name ?? "your pet"}.
            </p>
          </section>
        ) : !hasFinishedBootstrap ? (
          <section className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Start with the favorites</h2>
              <p className="text-sm text-gray-600">
                Add 3 to 5 treats in order, favorite first. This setup only happens once for this pet on this device.
              </p>
            </div>

            <form onSubmit={handleBootstrapSubmit} className="space-y-4">
              {bootstrapDrafts.map((draft, index) => (
                <div key={index} className="space-y-2 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 dark:border-zinc-800">
                  <label className="block text-sm font-medium">
                    {index + 1}. {index < 3 ? "Favorite treat" : "Optional treat"}
                  </label>
                  <input
                    value={draft.name}
                    onChange={(e) => updateBootstrapDraft(index, { name: e.target.value })}
                    className="w-full rounded-lg border p-3"
                    placeholder={index === 0 ? "Chicken jerky" : "Treat name"}
                    required={index < 3}
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <select
                      value={draft.type}
                      onChange={(e) =>
                        updateBootstrapDraft(index, { type: e.target.value as TreatType })
                      }
                      className="w-full rounded-lg border p-3"
                    >
                      {treatTypes.map((type) => (
                        <option key={type} value={type}>
                          {type[0].toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    <input
                      value={draft.brand}
                      onChange={(e) => updateBootstrapDraft(index, { brand: e.target.value })}
                      className="w-full rounded-lg border p-3"
                      placeholder="Brand, if useful"
                    />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-lg border p-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Starting Board"}
              </button>
            </form>
          </section>
        ) : (
          <>
            {session && activeOpponent ? (
              <section className="space-y-4 rounded-lg border border-emerald-600 p-4 dark:border-emerald-500">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Match {session.index + 1} of {session.opponents.length}
                  </p>
                  <h2 className="text-xl font-semibold">
                    Which would {pet.name ?? "your pet"} choose?
                  </h2>
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => answerComparison(session.treat.id)}
                    disabled={isSaving}
                    className="rounded-lg border p-4 text-left font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {session.treat.name}
                    {session.treat.brand ? (
                      <span className="block text-sm font-normal text-gray-500">
                        {session.treat.brand}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => answerComparison(activeOpponent.id)}
                    disabled={isSaving}
                    className="rounded-lg border p-4 text-left font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activeOpponent.name}
                    {activeOpponent.brand ? (
                      <span className="block text-sm font-normal text-gray-500">
                        {activeOpponent.brand}
                      </span>
                    ) : null}
                  </button>
                </div>
              </section>
            ) : (
              <section className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold">Add a treat</h2>
                <form onSubmit={handleAddTreat} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Treat name</label>
                    <input
                      value={newTreat.name}
                      onChange={(e) =>
                        setNewTreat((current) => ({ ...current, name: e.target.value }))
                      }
                      className="w-full rounded-lg border p-3"
                      placeholder="Freeze-dried salmon"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium">Type</label>
                      <select
                        value={newTreat.type}
                        onChange={(e) =>
                          setNewTreat((current) => ({
                            ...current,
                            type: e.target.value as TreatType,
                          }))
                        }
                        className="w-full rounded-lg border p-3"
                      >
                        {treatTypes.map((type) => (
                          <option key={type} value={type}>
                            {type[0].toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium">Brand</label>
                      <input
                        value={newTreat.brand}
                        onChange={(e) =>
                          setNewTreat((current) => ({ ...current, brand: e.target.value }))
                        }
                        className="w-full rounded-lg border p-3"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full rounded-lg border p-3 font-medium">
                    Start Ranking
                  </button>
                </form>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Scoreboard</h2>
                <p className="text-sm text-gray-500">{rankedTreats.length} treats</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["all", ...treatTypes] as FilterType[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      filter === option ? "border-emerald-600 font-semibold text-emerald-700" : ""
                    }`}
                  >
                    {option[0].toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>

              {filteredTreats.length === 0 ? (
                <p className="text-sm text-gray-600">No treats in this filter yet.</p>
              ) : (
                <ol className="space-y-3">
                  {filteredTreats.map((treat, index) => (
                    <li key={treat.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            #{filter === "all" ? index + 1 : rankedTreats.findIndex((item) => item.id === treat.id) + 1}
                          </p>
                          <h3 className="text-lg font-semibold">{treat.name}</h3>
                          <p className="text-sm text-gray-600">
                            {treat.brand ? `${treat.brand} - ` : ""}
                            {treat.type[0].toUpperCase() + treat.type.slice(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-semibold">{treat.score}</p>
                          <p className="text-xs text-gray-500">
                            {treat.wins}-{treat.losses}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </main>
  );
}
