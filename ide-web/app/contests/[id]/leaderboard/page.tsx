"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  totalScore: number;
  lastSubmissionTime: string | null;
  rank: number;
}

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export default function LeaderboardPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [contestId, setContestId] = useState<string>("");

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setContestId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (!contestId) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch contest info
        const contestRes = await fetch(`/api/contests/${contestId}`);
        if (contestRes.ok) {
          const contestData = await contestRes.json();
          setContest(contestData);
        }
        
        // Fetch leaderboard
        const leaderboardRes = await fetch(`/api/contests/${contestId}/leaderboard`);
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    }
    
    fetchData();
    
    // Auto-refresh leaderboard every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [contestId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading leaderboard...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/contests/${contestId}`} className="text-blue-600 hover:text-blue-800">
                ← Back to Contest
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {contest?.title} - Leaderboard
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                Auto-refreshing every 30s
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No submissions yet. Be the first to submit!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Submission
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={entry.id}
                      className={index < 3 ? "bg-gradient-to-r from-yellow-50 to-transparent" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                            index === 0 ? "bg-yellow-400 text-yellow-900" :
                            index === 1 ? "bg-gray-300 text-gray-700" :
                            index === 2 ? "bg-orange-300 text-orange-900" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {entry.rank}
                          </div>
                          {index < 3 && (
                            <span className="ml-2 text-lg">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">
                          {entry.totalScore}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.lastSubmissionTime 
                          ? new Date(entry.lastSubmissionTime).toLocaleString()
                          : "No submissions"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {contest && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Contest Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Start Time:</span> {new Date(contest.startTime).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">End Time:</span> {new Date(contest.endTime).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
