"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePrimaryPet } from "@/lib/use-primary-pet";

const FOOD_TYPES_STORAGE_KEY = "olive-ops-food-types";
const LEGACY_PRESETS_STORAGE_KEY = "olive-ops-food-presets";

type FoodType = {
  id: string;
  name: string;
  unit: string;
  caloriesPerUnit: number;
};

type LegacyFoodPreset = {
  id: string;
  name: string;
  amount?: string;
  calories?: number | null;
};

function isFoodType(value: unknown): value is FoodType {
  const foodType = value as FoodType;
  return (
    typeof foodType?.id === "string" &&
    typeof foodType.name === "string" &&
    typeof foodType.unit === "string" &&
    typeof foodType.caloriesPerUnit === "number" &&
    Number.isFinite(foodType.caloriesPerUnit)
  );
}

function loadFoodTypes(): FoodType[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(FOOD_TYPES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(isFoodType);
      }
    }
  } catch {
    return [];
  }

  return loadLegacyPresets();
}

function loadLegacyPresets(): FoodType[] {
  try {
    const raw = localStorage.getItem(LEGACY_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is LegacyFoodPreset => {
        const preset = item as LegacyFoodPreset;
        return (
          typeof preset?.id === "string" &&
          typeof preset.name === "string" &&
          typeof preset.calories === "number" &&
          Number.isFinite(preset.calories)
        );
      })
      .map((preset) => ({
        id: preset.id,
        name: preset.name,
        unit: preset.amount?.trim() || "serving",
        caloriesPerUnit: preset.calories ?? 0,
      }));
  } catch {
    return [];
  }
}

function persistFoodTypes(foodTypes: FoodType[]) {
  localStorage.setItem(FOOD_TYPES_STORAGE_KEY, JSON.stringify(foodTypes));
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function NewFoodPage() {
  const { pet, loading: petLoading, errorMessage: petError } = usePrimaryPet();
  const [foodTypes, setFoodTypes] = useState<FoodType[]>(loadFoodTypes);
  const [selectedFoodTypeId, setSelectedFoodTypeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodUnit, setNewFoodUnit] = useState("");
  const [newCaloriesPerUnit, setNewCaloriesPerUnit] = useState("");
  const [message, setMessage] = useState("");

  const selectedFoodType = foodTypes.find(
    (foodType) => foodType.id === selectedFoodTypeId
  );

  const totalCalories = useMemo(() => {
    if (!selectedFoodType) return null;
    const parsedQuantity = Number(quantity);
    if (!quantity.trim() || Number.isNaN(parsedQuantity)) return null;
    return parsedQuantity * selectedFoodType.caloriesPerUnit;
  }, [quantity, selectedFoodType]);

  function handleSaveFoodType() {
    setMessage("");

    const name = newFoodName.trim();
    const unit = newFoodUnit.trim();
    const caloriesPerUnit = Number(newCaloriesPerUnit);

    if (!name) {
      setMessage("Enter a food type name before saving.");
      return;
    }

    if (!unit) {
      setMessage("Enter a unit of measurement for this food type.");
      return;
    }

    if (
      !newCaloriesPerUnit.trim() ||
      Number.isNaN(caloriesPerUnit) ||
      caloriesPerUnit < 0
    ) {
      setMessage("Calories per unit must be a valid number.");
      return;
    }

    const duplicate = foodTypes.some(
      (foodType) => foodType.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setMessage("That food type already exists.");
      return;
    }

    const nextFoodType: FoodType = {
      id: crypto.randomUUID(),
      name,
      unit,
      caloriesPerUnit,
    };

    const updated = [...foodTypes, nextFoodType];
    setFoodTypes(updated);
    persistFoodTypes(updated);
    setSelectedFoodTypeId(nextFoodType.id);
    setQuantity("1");
    setNewFoodName("");
    setNewFoodUnit("");
    setNewCaloriesPerUnit("");
    setMessage(`Saved food type "${name}".`);
  }

  function handleDeleteFoodType(id: string) {
    const updated = foodTypes.filter((foodType) => foodType.id !== id);
    setFoodTypes(updated);
    persistFoodTypes(updated);
    if (selectedFoodTypeId === id) {
      setSelectedFoodTypeId("");
      setQuantity("");
    }
    setMessage("Food type removed.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!pet) {
      setMessage(petError ?? "Pet not loaded yet.");
      return;
    }

    if (!selectedFoodType) {
      setMessage("Choose a food type before saving this entry.");
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setMessage("Enter a quantity greater than zero.");
      return;
    }

    const calculatedCalories =
      parsedQuantity * selectedFoodType.caloriesPerUnit;

    setMessage("Saving...");

    const { error } = await supabase.from("food_entries").insert({
      household_id: pet.household_id,
      pet_id: pet.id,
      food_name: selectedFoodType.name,
      calories: calculatedCalories,
      amount: `${formatNumber(parsedQuantity)} ${selectedFoodType.unit}`,
      notes: notes || null,
      created_by: "Henry",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setSelectedFoodTypeId("");
    setQuantity("");
    setNotes("");
    setMessage("Food entry saved.");
  }

  const formDisabled = petLoading || !pet;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Add Food</h1>

        {petLoading ? (
          <p className="text-sm text-gray-600">Loading pet...</p>
        ) : petError || !pet ? (
          <p className="text-sm text-red-600">
            {petError ?? "Could not load pet."}
          </p>
        ) : null}

        <section className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div>
            <h2 className="text-lg font-semibold">Food types</h2>
            <p className="text-sm text-gray-600">
              Add foods like kibble, treats, Kong, or lick mat once with their
              unit and calories.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Food type name</label>
              <input
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
                className="w-full rounded-lg border p-3"
                placeholder="Kibble"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Unit</label>
                <input
                  value={newFoodUnit}
                  onChange={(e) => setNewFoodUnit(e.target.value)}
                  className="w-full rounded-lg border p-3"
                  placeholder="cup"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Calories per unit
                </label>
                <input
                  value={newCaloriesPerUnit}
                  onChange={(e) => setNewCaloriesPerUnit(e.target.value)}
                  className="w-full rounded-lg border p-3"
                  placeholder="320"
                  type="number"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveFoodType}
              className="w-full rounded-lg border border-dashed border-gray-400 p-3 text-sm font-medium text-gray-700"
            >
              Save Food Type
            </button>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="food-type">
              Food type
            </label>
            <select
              id="food-type"
              value={selectedFoodTypeId}
              onChange={(e) => {
                setSelectedFoodTypeId(e.target.value);
                setQuantity(e.target.value ? "1" : "");
              }}
              className="w-full rounded-lg border border-gray-300 bg-white p-3"
              required
            >
              <option value="">Choose food type</option>
              {foodTypes.map((foodType) => (
                <option key={foodType.id} value={foodType.id}>
                  {foodType.name} - {formatNumber(foodType.caloriesPerUnit)} cal
                  / {foodType.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Quantity</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border p-3"
                disabled={!selectedFoodType}
                min="0"
                placeholder={selectedFoodType ? `1 ${selectedFoodType.unit}` : "1"}
                step="0.1"
                type="number"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Unit</label>
              <input
                value={selectedFoodType?.unit ?? ""}
                className="w-full rounded-lg border bg-gray-50 p-3 text-gray-700"
                placeholder="Choose food type"
                readOnly
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium uppercase text-gray-500">
              Total calories
            </p>
            <p className="text-2xl font-semibold">
              {totalCalories == null ? "--" : formatNumber(totalCalories)}
            </p>
            {selectedFoodType ? (
              <p className="text-xs text-gray-500">
                {formatNumber(selectedFoodType.caloriesPerUnit)} calories per{" "}
                {selectedFoodType.unit}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="Ate quickly"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={formDisabled}
            className="w-full rounded-lg border p-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Food Entry
          </button>
        </form>

        {foodTypes.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Saved food types
            </h2>
            <ul className="space-y-2 text-sm">
              {foodTypes.map((foodType) => (
                <li
                  key={foodType.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 p-3"
                >
                  <span className="text-gray-800">
                    <span className="font-medium">{foodType.name}</span>
                    <span className="text-gray-600">
                      {" "}
                      {formatNumber(foodType.caloriesPerUnit)} cal /{" "}
                      {foodType.unit}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFoodType(foodType.id)}
                    className="shrink-0 text-xs text-red-600 underline"
                  >
                    Remove
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
