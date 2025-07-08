'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  questions: {
    id: string;
    title: string;
    points: number;
  }[];
}

function getStatus(contest: Contest) {
  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}

export default function ContestListPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContests() {
      try {
        const res = await fetch('/api/contests');
        if (res.ok) {
          const data = await res.json();
          setContests(data);
        }
      } catch (error) {
        console.error('Error fetching contests:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContests();
    
    // Block back navigation attempts
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading contests...</div>
      </div>
    );
  }

  const upcomingContests = contests.filter(contest => getStatus(contest) === "upcoming");
  const ongoingContests = contests.filter(contest => getStatus(contest) === "ongoing");
  const pastContests = contests.filter(contest => getStatus(contest) === "past");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Coding Contests</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {ongoingContests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ongoing Contests</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {ongoingContests.map((contest) => (
                <div
                  key={contest.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-green-200 hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{contest.title}</h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Ongoing
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>Start: {new Date(contest.startTime).toLocaleString()}</p>
                      <p>End: {new Date(contest.endTime).toLocaleString()}</p>
                      <p>Problems: {contest.questions.length}</p>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href={`/contests/${contest.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        View Contest
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingContests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Contests</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {upcomingContests.map((contest) => (
                <div
                  key={contest.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{contest.title}</h3>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Upcoming
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>Start: {new Date(contest.startTime).toLocaleString()}</p>
                      <p>End: {new Date(contest.endTime).toLocaleString()}</p>
                      <p>Problems: {contest.questions.length}</p>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href={`/contests/${contest.id}`}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastContests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Contests</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {pastContests.map((contest) => (
                <div
                  key={contest.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{contest.title}</h3>
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Past
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>Start: {new Date(contest.startTime).toLocaleString()}</p>
                      <p>End: {new Date(contest.endTime).toLocaleString()}</p>
                      <p>Problems: {contest.questions.length}</p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Link
                        href={`/contests/${contest.id}/leaderboard`}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded transition-colors"
                      >
                        Leaderboard
                      </Link>
                      <Link
                        href={`/contests/${contest.id}`}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {contests.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contests available</h3>
            <p className="text-gray-500">Check back later for upcoming coding contests.</p>
          </div>
        )}
      </div>
    </div>
  );
}
