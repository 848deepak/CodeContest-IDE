'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  title: string;
  points: number;
}

interface Contest {
  id: string;
  title: string;
  questions?: Question[];
}

export default function SubmitPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await fetch(`/api/contests/${contestId}`);
        if (response.ok) {
          const data = await response.json();
          setContest(data.contest);
        }
      } catch (error) {
        console.error('Error fetching contest:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contestId) {
      fetchContest();
    }
  }, [contestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Contest not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {contest.title} - Submit Solution
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Contest Problems</h2>
            <div className="space-y-4">
              {contest.questions?.map((question: Question, index: number) => (
                <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        Problem {index + 1}: {question.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Points: {question.points}
                      </p>
                    </div>
                    <Link
                      href={`/contests/${contestId}/problems/${question.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Solve Problem
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <Link
              href={`/contests/${contestId}`}
              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Contest
            </Link>
            <Link
              href={`/contests/${contestId}/leaderboard`}
              className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}