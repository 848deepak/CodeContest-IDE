"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  questions: Array<{
    id: string;
    title: string;
    points: number;
  }>;
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

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function ContestListPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

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

  // Update countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeRemaining: Record<string, string> = {};
      contests.forEach(contest => {
        if (getStatus(contest) === "ongoing") {
          newTimeRemaining[contest.id] = getTimeRemaining(contest.endTime);
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [contests]);

  const ongoing = contests.filter(c => getStatus(c) === "ongoing");
  const upcoming = contests.filter(c => getStatus(c) === "upcoming");
  const past = contests.filter(c => getStatus(c) === "past");

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Coding Contests</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/contests" className="text-blue-400 hover:text-blue-300">Admin Panel</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-300">Loading contests...</div>
          </div>
        ) : (
          <>
            <Section 
              title="🔴 Live Contests" 
              contests={ongoing} 
              timeRemaining={timeRemaining}
              showTimer={true}
            />
            <Section 
              title="⏰ Upcoming Contests" 
              contests={upcoming} 
              timeRemaining={timeRemaining}
            />
            <Section 
              title="📚 Past Contests" 
              contests={past} 
              timeRemaining={timeRemaining}
            />
          </>
        )}
      </div>
    </div>
  );
}

function Section({ 
  title, 
  contests, 
  timeRemaining, 
  showTimer = false 
}: { 
  title: string; 
  contests: Contest[]; 
  timeRemaining: Record<string, string>;
  showTimer?: boolean;
}) {
  if (!contests.length) return null;
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contests.map(contest => (
          <div key={contest.id} className="bg-[#222222] rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-[#333333]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-white">{contest.title}</h3>
              {showTimer && timeRemaining[contest.id] && (
                <div className="bg-[#471818] text-red-400 px-2 py-1 rounded text-sm font-mono">
                  {timeRemaining[contest.id]}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-300 mb-4">
              <div>Start: {new Date(contest.startTime).toLocaleString()}</div>
              <div>End: {new Date(contest.endTime).toLocaleString()}</div>
            </div>
            
            <div className="text-sm text-gray-300 mb-4">
              {contest.questions?.length || 0} problems
            </div>
            
            <div className="flex justify-between items-center">
              <Link 
                href={`/contests/${contest.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                {getStatus(contest) === "ongoing" ? "Participate" : "View"}
              </Link>
              
              <Link 
                href={`/contests/${contest.id}/leaderboard`}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
