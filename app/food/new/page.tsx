"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePrimaryPet } from "@/lib/use-primary-pet";

const PRESETS_STORAGE_KEY = "olive-ops-food-presets";

type FoodPreset = {
  id: string;
  name: string;
  amount: string;
  calories: number | null;
};

function loadPresets(): FoodPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p): p is FoodPreset =>
          typeof p === "object" &&
          p !== null &&
          typeof (p as FoodPreset).id === "string" &&
          typeof (p as FoodPreset).name === "string"
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        amount: typeof p.amount === "string" ? p.amount : "",
        calories:
          typeof p.calories === "number" && !Number.isNaN(p.calories)
            ? p.calories
            : null,
      }));
  } catch {
    return [];
  }
}

function persistPresets(presets: FoodPreset[]) {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

export default function NewFoodPage() {
  const { pet, loading: petLoading, errorMessage: petError } = usePrimaryPet();
  const [presets, setPresets] = useState<FoodPreset[]>(loadPresets);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  function applyPreset(id: string) {
    setSelectedPresetId(id);
    if (!id) return;
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setFoodName(p.name);
    setAmount(p.amount);
    setCalories(p.calories != null ? String(p.calories) : "");
  }

  function clearPresetSelection() {
    setSelectedPresetId("");
  }

  function handleSavePreset() {
    setMessage("");
    const name = foodName.trim();
    if (!name) {
      setMessage("🍽️ Enter a food name before saving a preset.");
      return;
    }

    const cal = calories.trim() ? Number(calories) : null;
    if (calories.trim() && (cal === null || Number.isNaN(cal))) {
      setMessage("🔢 Calories must be a valid number for this preset.");
      return;
    }

    const next: FoodPreset = {
      id: crypto.randomUUID(),
      name,
      amount: amount.trim(),
      calories: cal,
    };

    const updated = [...presets, next];
    setPresets(updated);
    persistPresets(updated);
    setSelectedPresetId(next.id);
    setMessage(`⭐ Saved preset “${name}”.`);
  }

  function handleDeletePreset(id: string) {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    persistPresets(updated);
    if (selectedPresetId === id) {
      setSelectedPresetId("");
    }
    setMessage("🧹 Preset removed.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pet) {
      setMessage(petError ?? "🐾 Pet not loaded yet.");
      return;
    }
    setMessage("💾 Saving...");

    const { error } = await supabase.from("food_entries").insert({
      household_id: pet.household_id,
      pet_id: pet.id,
      food_name: foodName,
      calories: calories ? Number(calories) : null,
      amount: amount || null,
      notes: notes || null,
      created_by: "Henry",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setFoodName("");
    setCalories("");
    setAmount("");
    setNotes("");
    clearPresetSelection();
    setMessage("🥣 Food entry saved.");
  }

  const formDisabled = petLoading || !pet;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">🥣 Add Food</h1>

        {petLoading ? (
          <p className="text-sm text-gray-600">🐾 Loading pet…</p>
        ) : petError || !pet ? (
          <p className="text-sm text-red-600">
            {petError ?? "🐾 Could not load pet."}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="food-preset">
              ⚡ Quick pick
            </label>
            <select
              id="food-preset"
              value={selectedPresetId}
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white p-3"
            >
              <option value="">✨ Custom entry</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.amount ? ` 🥄 ${p.amount}` : ""}
                  {p.calories != null ? ` 🔥 ${p.calories} cal` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              ⭐ Choosing a preset fills name, amount, and calories for a usual
              serving.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">🍽️ Food Name</label>
            <input
              value={foodName}
              onChange={(e) => {
                setFoodName(e.target.value);
                clearPresetSelection();
              }}
              className="w-full rounded-xl border p-3"
              placeholder="Kibble"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">🔥 Calories</label>
            <input
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value);
                clearPresetSelection();
              }}
              className="w-full rounded-xl border p-3"
              placeholder="250"
              type="number"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">🥄 Amount</label>
            <input
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                clearPresetSelection();
              }}
              className="w-full rounded-xl border p-3"
              placeholder="1 cup"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">📝 Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Ate quickly"
              rows={4}
            />
          </div>

          <button
            type="button"
            onClick={handleSavePreset}
            className="w-full rounded-xl border border-dashed border-gray-400 p-3 text-sm font-medium text-gray-700"
          >
            ⭐ Save as preset
          </button>
          <p className="text-xs text-gray-500 -mt-2">
            💡 Stores the current name, amount, and calories for the dropdown
            above (saved on this device).
          </p>

          <button
            type="submit"
            disabled={formDisabled}
            className="w-full rounded-xl border p-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            🥣 Save Food Entry
          </button>
        </form>

        {presets.length > 0 ? (
          <section className="space-y-2 rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700">
              ⭐ Saved presets
            </h2>
            <ul className="space-y-2 text-sm">
              {presets.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-gray-800">
                    <span className="font-medium">{p.name}</span>
                    {p.amount ? (
                      <span className="text-gray-600"> 🥄 {p.amount}</span>
                    ) : null}
                    {p.calories != null ? (
                      <span className="text-gray-600"> 🔥 {p.calories} cal</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(p.id)}
                    className="shrink-0 text-xs text-red-600 underline"
                  >
                    🧹 Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </main>
  );
}
