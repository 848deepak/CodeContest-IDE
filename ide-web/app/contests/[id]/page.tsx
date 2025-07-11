"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Question {
  id: string;
  title: string;
  points: number;
}

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  questions: Question[];
}

function getStatus(contest: Contest) {
  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}

function getTimeRemaining(endTime: string) {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const distance = end - now;

  if (distance < 0) return "Contest Ended";

  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function ContestDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [contestId, setContestId] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setContestId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (!contestId) return;
    
    async function fetchContest() {
      setLoading(true);
      try {
        const res = await fetch(`/api/contests/${contestId}`);
        if (res.ok) {
          const data = await res.json();
          setContest(data);
        }
      } catch (error) {
        console.error('Error fetching contest:', error);
      }
      setLoading(false);
    }
    fetchContest();
  }, [contestId]);

  // Update countdown timer
  useEffect(() => {
    if (!contest) return;
    
    const timer = setInterval(() => {
      if (getStatus(contest) === "ongoing") {
        setTimeRemaining(getTimeRemaining(contest.endTime));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [contest]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading contest...</div>
    </div>
  );
  
  if (!contest) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Contest not found.</div>
    </div>
  );

  const status = getStatus(contest);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/contests" className="text-blue-600 hover:text-blue-800">
                ← Back to Contests
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">{contest.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {status === "ongoing" && timeRemaining && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded font-mono">
                  {timeRemaining}
                </div>
              )}
              <Link 
                href={`/contests/${contest.id}/leaderboard`}
                className="text-blue-600 hover:text-blue-800"
              >
                Leaderboard
              </Link>
              <Link 
                href={`/contests/${contest.id}/discussion`}
                className="text-blue-600 hover:text-blue-800"
              >
                Discussion
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{contest.title}</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              status === "ongoing" ? "bg-green-100 text-green-800" :
              status === "upcoming" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Start Time:</span> {new Date(contest.startTime).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">End Time:</span> {new Date(contest.endTime).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Problems:</span> {contest.questions.length}
            </div>
            <div>
              <span className="font-medium">Total Points:</span> {contest.questions.reduce((sum, q) => sum + q.points, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Problems</h3>
          
          {status === "upcoming" ? (
            <div className="text-center py-8 text-gray-500">
              Contest has not started yet. Problems will be visible when the contest begins.
            </div>
          ) : (
            <div className="space-y-3">
              {contest.questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{question.title}</div>
                      <div className="text-sm text-gray-600">{question.points} points</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {status === "ongoing" ? (
                      <Link
                        href={`/contests/${contest.id}/problems/${question.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Solve
                      </Link>
                    ) : (
                      <Link
                        href={`/contests/${contest.id}/problems/${question.id}`}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
