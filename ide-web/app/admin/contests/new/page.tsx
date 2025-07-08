"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateContestPage() {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, startTime, endTime }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create contest");
        return;
      }
      router.push("/admin/contests");
    } catch {
      setError("Failed to create contest");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Contest</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 flex flex-col gap-4">
        <label className="font-semibold">
          Title
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="font-semibold">
          Start Time
          <input
            type="datetime-local"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
          />
        </label>
        <label className="font-semibold">
          End Time
          <input
            type="datetime-local"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
          />
        </label>
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Contest
        </button>
      </form>
    </div>
  );
}
