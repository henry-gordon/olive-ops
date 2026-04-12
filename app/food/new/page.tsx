"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewFoodPage() {
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Saving...");

    const { error } = await supabase.from("food_entries").insert({
      household_id: "fb2d14e0-289c-4e24-9998-9d7f9928fc03",
      dog_id: "ca061b23-5812-4900-bb29-1b5dd444c313",
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
    setMessage("Food entry saved.");
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Add Food</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Food Name</label>
            <input
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Kibble"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Calories</label>
            <input
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="250"
              type="number"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="1 cup"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Ate quickly"
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border p-3 font-medium"
          >
            Save Food Entry
          </button>
        </form>

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </main>
  );
}