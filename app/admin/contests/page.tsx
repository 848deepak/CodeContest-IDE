"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContests() {
      setLoading(true);
      try {
        const res = await fetch("/api/contests");
        const data = await res.json();
        setContests(data);
      } catch (error) {
        console.error('Error fetching contests:', error);
      }
      setLoading(false);
    }
    fetchContests();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin: Contests</h1>
      <Link 
        href="/admin/contests/new" 
        className="inline-block mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Create New Contest
      </Link>
      <div className="bg-white rounded shadow p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Title</th>
                <th className="py-2">Start Time</th>
                <th className="py-2">End Time</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contests.map((contest) => (
                <tr key={contest.id} className="border-t">
                  <td className="py-2">{contest.title}</td>
                  <td className="py-2">{new Date(contest.startTime).toLocaleString()}</td>
                  <td className="py-2">{new Date(contest.endTime).toLocaleString()}</td>
                  <td className="py-2">
                    <Link 
                      href={`/admin/contests/${contest.id}`} 
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
