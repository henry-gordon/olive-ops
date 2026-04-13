"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePrimaryPet } from "@/lib/use-primary-pet";

export default function NewTrainingPage() {
  const { pet, loading: petLoading, errorMessage: petError } = usePrimaryPet();
  const [skillName, setSkillName] = useState("");
  const [sessionAt, setSessionAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [successRating, setSuccessRating] = useState("3");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!skillName.trim()) {
      setMessage("Skill name is required.");
      return;
    }

    if (!sessionAt) {
      setMessage("Session time is required.");
      return;
    }

    if (!pet) {
      setMessage(petError ?? "Pet not loaded yet.");
      return;
    }

    setMessage("Saving...");

    const { error } = await supabase.from("training_sessions").insert({
      household_id: pet.household_id,
      pet_id: pet.id,
      skill_name: skillName.trim(),
      session_at: sessionAt,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      success_rating: successRating ? Number(successRating) : null,
      notes: notes.trim() || null,
      created_by: "Henry",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setSkillName("");
    setSessionAt("");
    setDurationMinutes("");
    setSuccessRating("3");
    setNotes("");
    setMessage("Training session saved.");
  }

  const formDisabled = petLoading || !pet;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Add Training</h1>

        {petLoading ? (
          <p className="text-sm text-gray-600">Loading pet…</p>
        ) : petError || !pet ? (
          <p className="text-sm text-red-600">
            {petError ?? "Could not load pet."}
          </p>
        ) : null}

        <p className="text-sm text-gray-600">
          Log what you worked on and how it went.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Skill Name</label>
            <input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Place"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Session Time</label>
            <input
              type="datetime-local"
              value={sessionAt}
              onChange={(e) => setSessionAt(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="10"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Success Rating</label>
            <select
              value={successRating}
              onChange={(e) => setSuccessRating(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option value="1">1 - Rough</option>
              <option value="2">2 - Inconsistent</option>
              <option value="3">3 - Okay</option>
              <option value="4">4 - Strong</option>
              <option value="5">5 - Great</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Held place for 20 seconds with mild distractions"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={formDisabled}
            className="w-full rounded-xl border p-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Training Session
          </button>
        </form>

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </main>
  );
}
