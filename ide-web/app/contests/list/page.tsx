'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export default function ContestsListPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await fetch('/api/contests');
        if (response.ok) {
          const data = await response.json();
          setContests(data.contests || []);
        }
      } catch (error) {
        console.error('Error fetching contests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading contests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            All Contests
          </h1>
          <Link
            href="/admin/contests/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Contest
          </Link>
        </div>

        {contests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No Contests Available
            </h2>
            <p className="text-gray-600 mb-6">
              There are no contests available at the moment. Check back later!
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((contest) => (
              <div key={contest.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {contest.title}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Start:</span>{' '}
                    {new Date(contest.startTime).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">End:</span>{' '}
                    {new Date(contest.endTime).toLocaleString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/contests/${contest.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
                  >
                    View Contest
                  </Link>
                  <Link
                    href={`/contests/${contest.id}/leaderboard`}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded hover:bg-green-700"
                  >
                    Leaderboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}