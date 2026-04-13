"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { usePrimaryDog } from "@/lib/use-primary-dog";

type InteractionKind = "dogs" | "strangers" | "wildlife" | "other";

const INTERACTION_LABELS: Record<InteractionKind, string> = {
  dogs: "Dogs",
  strangers: "Strangers",
  wildlife: "Wildlife",
  other: "Other",
};

type WalkInteraction = {
  kind: InteractionKind;
  reaction: number;
  lat: number | null;
  lng: number | null;
  elapsedSeconds: number;
};

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function reactivityLevelFromScore(score: number): string {
  const map = ["none", "low", "medium", "high", "very_high"] as const;
  return map[Math.min(5, Math.max(1, score)) - 1];
}

function pullLabel(value: string): string {
  const labels: Record<string, string> = {
    none: "none",
    light: "light",
    moderate: "moderate",
    heavy: "heavy",
  };
  return labels[value] ?? value;
}

function buildWalkNotes(params: {
  distanceMeters: number;
  interactions: WalkInteraction[];
  overallReactivity: number;
  pull: string;
  walkRating: number;
}): string {
  const lines: string[] = [];
  lines.push("Walk Mode session.");
  lines.push(
    params.distanceMeters >= 25
      ? `Tracked ≈ ${formatDistance(params.distanceMeters)}.`
      : "Little or no GPS distance (permission, signal, or standing still)."
  );
  if (params.interactions.length === 0) {
    lines.push("No logged interactions.");
  } else {
    lines.push("");
    lines.push("Interactions:");
    for (const i of params.interactions) {
      const label = INTERACTION_LABELS[i.kind];
      const coord =
        i.lat != null && i.lng != null
          ? ` @ ${i.lat.toFixed(5)}, ${i.lng.toFixed(5)}`
          : "";
      lines.push(
        `• ${label} — reaction ${i.reaction}/5 (at ${formatElapsed(i.elapsedSeconds)})${coord}`
      );
    }
  }
  lines.push("");
  lines.push(
    `After walk: overall reactivity ${params.overallReactivity}/5, pulling: ${pullLabel(params.pull)}, walk rating ${params.walkRating}/5.`
  );
  return lines.join("\n");
}

function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

type Phase = "idle" | "walking" | "review";

export default function WalkModePage() {
  const { dog, loading: dogLoading, errorMessage: dogError } = usePrimaryDog();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<WalkInteraction[]>([]);
  const [pendingKind, setPendingKind] = useState<InteractionKind | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const [overallReactivity, setOverallReactivity] = useState(3);
  const [pullLevel, setPullLevel] = useState<
    "none" | "light" | "moderate" | "heavy"
  >("moderate");
  const [walkRating, setWalkRating] = useState(3);

  const walkStartMsRef = useRef<number>(0);
  const walkEndMsRef = useRef<number>(0);
  const distanceAccumRef = useRef(0);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTracking = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTracking(), [clearTracking]);

  const startWalk = useCallback(() => {
    setGpsError(null);
    setSaveMessage("");
    walkEndMsRef.current = 0;
    setInteractions([]);
    distanceAccumRef.current = 0;
    lastPosRef.current = null;
    setDistanceMeters(0);
    setElapsedSeconds(0);
    walkStartMsRef.current = Date.now();
    setPhase("walking");

    tickRef.current = setInterval(() => {
      const sec = Math.floor(
        (Date.now() - walkStartMsRef.current) / 1000
      );
      setElapsedSeconds(sec);
    }, 1000);

    if (!navigator.geolocation) {
      setGpsError("This browser does not support GPS.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const last = lastPosRef.current;
        if (last) {
          const delta = haversineMeters(
            last.lat,
            last.lng,
            latitude,
            longitude
          );
          if (delta < 200) {
            distanceAccumRef.current += delta;
            setDistanceMeters(distanceAccumRef.current);
          }
        }
        lastPosRef.current = { lat: latitude, lng: longitude };
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Location permission denied — timer still runs; distance may stay at 0."
            : "Could not read GPS — timer still runs."
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
  }, []);

  const stopWalk = useCallback(() => {
    clearTracking();
    walkEndMsRef.current = Date.now();
    setElapsedSeconds(
      Math.floor((walkEndMsRef.current - walkStartMsRef.current) / 1000)
    );
    setDistanceMeters(distanceAccumRef.current);
    setPhase("review");
  }, [clearTracking]);

  const discardWalk = useCallback(() => {
    setPhase("idle");
    setElapsedSeconds(0);
    setDistanceMeters(0);
    distanceAccumRef.current = 0;
    lastPosRef.current = null;
    setInteractions([]);
    setSaveMessage("");
    setOverallReactivity(3);
    setPullLevel("moderate");
    setWalkRating(3);
  }, []);

  const confirmInteraction = useCallback(
    async (reaction: number) => {
      if (!pendingKind) return;
      const coords = await getCurrentCoords();
      const elapsed = Math.floor(
        (Date.now() - walkStartMsRef.current) / 1000
      );
      setInteractions((prev) => [
        ...prev,
        {
          kind: pendingKind,
          reaction,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          elapsedSeconds: elapsed,
        },
      ]);
      setPendingKind(null);
    },
    [pendingKind]
  );

  async function saveWalkToSupabase() {
    if (!dog) {
      setSaveMessage(dogError ?? "Dog not loaded.");
      return;
    }
    setSaveMessage("Saving...");
    const startMs = walkStartMsRef.current;
    const endMs = walkEndMsRef.current;
    const durationMinutes = Math.max(
      1,
      Math.round((endMs - startMs) / 60000)
    );

    const notes = buildWalkNotes({
      distanceMeters: distanceAccumRef.current,
      interactions,
      overallReactivity,
      pull: pullLevel,
      walkRating,
    });

    const { error } = await supabase.from("walks").insert({
      household_id: dog.household_id,
      dog_id: dog.id,
      start_time: new Date(startMs).toISOString(),
      end_time: new Date(endMs).toISOString(),
      duration_minutes: durationMinutes,
      location_note:
        distanceAccumRef.current >= 25
          ? `Walk Mode · ${formatDistance(distanceAccumRef.current)}`
          : "Walk Mode",
      reactivity_level: reactivityLevelFromScore(overallReactivity),
      notes,
      created_by: "Henry",
    });

    if (error) {
      setSaveMessage(`Error: ${error.message}`);
      return;
    }

    setPhase("idle");
    setInteractions([]);
    setElapsedSeconds(0);
    setDistanceMeters(0);
    distanceAccumRef.current = 0;
    lastPosRef.current = null;
    setOverallReactivity(3);
    setPullLevel("moderate");
    setWalkRating(3);
    setSaveMessage("Walk saved.");
  }

  const dogReady = !dogLoading && dog;
  const walkActionsDisabled = !dogReady;

  return (
    <main className="min-h-screen bg-zinc-50 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {dogLoading ? (
          <p className="mb-2 text-sm text-zinc-600">Loading dog…</p>
        ) : dogError || !dog ? (
          <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {dogError ?? "Could not load dog."}
          </p>
        ) : null}

        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Walk Mode
            </p>
            <h1 className="text-2xl font-bold text-zinc-900">On a walk</h1>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Home
          </Link>
        </header>

        {phase === "idle" ? (
          <div className="flex flex-1 flex-col justify-center gap-6">
            {saveMessage ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900">
                {saveMessage}
              </p>
            ) : null}
            <p className="text-center text-sm text-zinc-600">
              Start when you leave the house. Keep the screen on if you can —
              iOS may pause GPS when the tab is in the background.
            </p>
            <button
              type="button"
              onClick={startWalk}
              disabled={walkActionsDisabled}
              className="rounded-2xl bg-emerald-600 py-5 text-lg font-semibold text-white shadow-sm active:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              Start walk
            </button>
            <Link
              href="/walks/new"
              className="text-center text-sm text-zinc-500 underline"
            >
              Log a walk manually instead
            </Link>
          </div>
        ) : null}

        {phase === "walking" ? (
          <div className="flex flex-1 flex-col gap-5">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    Time
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-zinc-900">
                    {formatElapsed(elapsedSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    Distance
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-zinc-900">
                    {formatDistance(distanceMeters)}
                  </p>
                </div>
              </div>
              {gpsError ? (
                <p className="mt-3 text-center text-xs text-amber-800">
                  {gpsError}
                </p>
              ) : (
                <p className="mt-3 text-center text-xs text-zinc-400">
                  GPS updating…
                </p>
              )}
            </section>

            <section>
              <p className="mb-2 text-sm font-medium text-zinc-700">
                Log a reaction
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(INTERACTION_LABELS) as InteractionKind[]).map(
                  (kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setPendingKind(kind)}
                      disabled={walkActionsDisabled}
                      className="rounded-2xl border-2 border-zinc-200 bg-white py-4 text-base font-semibold text-zinc-800 active:border-emerald-500 active:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {INTERACTION_LABELS[kind]}
                    </button>
                  )
                )}
              </div>
            </section>

            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={stopWalk}
                className="w-full rounded-2xl border-2 border-red-300 bg-red-50 py-4 text-base font-semibold text-red-800 active:bg-red-100"
              >
                End walk
              </button>
            </div>
          </div>
        ) : null}

        {phase === "review" ? (
          <div className="flex flex-1 flex-col gap-5">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Summary</p>
              <p className="mt-2">
                Duration: {formatElapsed(elapsedSeconds)} (
                {Math.max(1, Math.round(elapsedSeconds / 60))}{" "}
                min)
              </p>
              <p>Distance: ≈ {formatDistance(distanceMeters)}</p>
              <p>Interactions logged: {interactions.length}</p>
            </section>

            <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  Overall reactivity
                </p>
                <p className="text-xs text-zinc-500">
                  How reactive was she for the whole walk?
                </p>
                <div className="mt-2 flex justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setOverallReactivity(n)}
                      className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
                        overallReactivity === n
                          ? "bg-emerald-600 text-white"
                          : "border border-zinc-200 bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-center text-xs text-zinc-400">
                  1 calm · 5 very reactive
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-800">
                  How much did she pull?
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["none", "None"],
                      ["light", "Light"],
                      ["moderate", "Moderate"],
                      ["heavy", "Heavy"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPullLevel(value)}
                      className={`rounded-xl py-3 text-sm font-medium ${
                        pullLevel === value
                          ? "bg-emerald-600 text-white"
                          : "border border-zinc-200 bg-zinc-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-800">
                  How was the walk?
                </p>
                <p className="text-xs text-zinc-500">Your overall rating</p>
                <div className="mt-2 flex justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setWalkRating(n)}
                      className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
                        walkRating === n
                          ? "bg-emerald-600 text-white"
                          : "border border-zinc-200 bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-center text-xs text-zinc-400">
                  1 rough · 5 great
                </p>
              </div>
            </section>

            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={saveWalkToSupabase}
                disabled={walkActionsDisabled}
                className="rounded-2xl bg-emerald-600 py-4 text-base font-semibold text-white active:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                Save walk
              </button>
              <button
                type="button"
                onClick={discardWalk}
                className="rounded-2xl border border-zinc-300 py-3 text-sm font-medium text-zinc-600"
              >
                Discard
              </button>
            </div>
            {saveMessage ? (
              <p className="text-center text-sm text-zinc-600">{saveMessage}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {pendingKind ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reaction-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2
              id="reaction-dialog-title"
              className="text-lg font-bold text-zinc-900"
            >
              {INTERACTION_LABELS[pendingKind]}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              How strong was her reaction? (1 = minimal, 5 = big reaction)
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => confirmInteraction(n)}
                  className="rounded-xl bg-zinc-100 py-4 text-lg font-bold text-zinc-900 active:bg-emerald-200"
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPendingKind(null)}
              className="mt-4 w-full rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
