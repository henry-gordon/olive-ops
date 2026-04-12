"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewTrainingPage() {
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

    setMessage("Saving...");

    const { error } = await supabase.from("training_sessions").insert({
      household_id: "fb2d14e0-289c-4e24-9998-9d7f9928fc03",
      dog_id: "ca061b23-5812-4900-bb29-1b5dd444c313",
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

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Add Training</h1>
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
            className="w-full rounded-xl border p-3 font-medium"
          >
            Save Training Session
          </button>
        </form>

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </main>
  );
}