"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewWalkPage() {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [reactivityLevel, setReactivityLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!startTime) {
      setMessage("Start time is required.");
      return;
    }

    if (!endTime && !durationMinutes) {
      setMessage("Please provide either an end time or a duration.");
      return;
    }

    let finalDuration: number | null = durationMinutes
      ? Number(durationMinutes)
      : null;

    if (!finalDuration && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.round(diffMs / 60000);

      if (diffMinutes <= 0) {
        setMessage("End time must be after start time.");
        return;
      }

      finalDuration = diffMinutes;
    }

    setMessage("Saving...");

    const { error } = await supabase.from("walks").insert({
      household_id: "PASTE_HOUSEHOLD_ID_HERE",
      dog_id: "PASTE_DOG_ID_HERE",
      start_time: startTime,
      end_time: endTime || null,
      duration_minutes: finalDuration,
      location_note: locationNote || null,
      reactivity_level: reactivityLevel || null,
      notes: notes || null,
      created_by: "Henry",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setStartTime("");
    setEndTime("");
    setDurationMinutes("");
    setLocationNote("");
    setReactivityLevel("");
    setNotes("");
    setMessage("Walk saved.");
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Add Walk</h1>
        <p className="text-sm text-gray-600">
          Log a start time, plus either an end time or a duration.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border p-3"
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
              placeholder="35"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Location Note</label>
            <input
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Bay Trail"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Reactivity Level</label>
            <select
              value={reactivityLevel}
              onChange={(e) => setReactivityLevel(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option value="">Select one</option>
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="very_high">Very high</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Lots of sniffing, saw 2 dogs"
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border p-3 font-medium"
          >
            Save Walk
          </button>
        </form>

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </main>
  );
}