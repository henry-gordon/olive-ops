"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewEventPage() {
  const [eventType, setEventType] = useState("daycare");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!title.trim()) {
      setMessage("Title is required.");
      return;
    }

    if (!startsAt) {
      setMessage("Start time is required.");
      return;
    }

    if (endsAt) {
      const start = new Date(startsAt);
      const end = new Date(endsAt);

      if (end.getTime() <= start.getTime()) {
        setMessage("End time must be after start time.");
        return;
      }
    }

    setMessage("Saving...");

    const { error } = await supabase.from("events").insert({
      household_id: "fb2d14e0-289c-4e24-9998-9d7f9928fc03",
      dog_id: "ca061b23-5812-4900-bb29-1b5dd444c313",
      event_type: eventType,
      title: title.trim(),
      starts_at: startsAt,
      ends_at: endsAt || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
      created_by: "Henry",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setEventType("daycare");
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setLocation("");
    setNotes("");
    setMessage("Event saved.");
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Add Event</h1>
        <p className="text-sm text-gray-600">
          Log daycare, training, vet visits, and other scheduled events.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option value="daycare">Daycare</option>
              <option value="training">Training</option>
              <option value="vet">Vet</option>
              <option value="grooming">Grooming</option>
              <option value="playdate">Playdate</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Daycare at Wag Hotel"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Wag Hotel Sunnyvale"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border p-3"
              placeholder="Bring training treats"
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border p-3 font-medium"
          >
            Save Event
          </button>
        </form>

        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </main>
  );
}