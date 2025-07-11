"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

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
}

export default function ContestDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [contest, setContest] = useState<Contest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
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
        const contestRes = await fetch(`/api/contests`);
        const contests = await contestRes.json();
        const currentContest = contests.find((c: Contest) => c.id === contestId);
        setContest(currentContest || {
          id: contestId,
          title: `Contest ${contestId}`,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });
        
        // Fetch questions
        const questionsRes = await fetch(`/api/questions?contestId=${contestId}`);
        const questionsData = await questionsRes.json();
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    }
    fetchData();
  }, [contestId]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{contest?.title}</h1>
      <div className="mb-6 text-gray-600">
        <div>Start: {contest ? new Date(contest.startTime).toLocaleString() : "-"}</div>
        <div>End: {contest ? new Date(contest.endTime).toLocaleString() : "-"}</div>
        <div className="mt-2">
          <Link 
            href={`/contests/${contestId}`} 
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            View Contest (User View) →
          </Link>
        </div>
      </div>
      
      <div className="mb-4 flex space-x-3">
        <Link 
          href={`/admin/contests/${contestId}/questions/new`} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Question
        </Link>
        <Link 
          href="/admin/contests" 
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          ← Back to Contests
        </Link>
      </div>
      
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Questions ({questions.length})</h2>
        {loading ? (
          <div className="text-center py-4">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No questions added yet.
            <div className="mt-2">
              <Link 
                href={`/admin/contests/${contestId}/questions/new`} 
                className="text-blue-600 hover:underline"
              >
                Add the first question
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3 font-medium">Title</th>
                  <th className="py-3 font-medium">Points</th>
                  <th className="py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, index) => (
                  <tr key={q.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-medium">{q.title}</div>
                      <div className="text-sm text-gray-500">Question {index + 1}</div>
                    </td>
                    <td className="py-3">{q.points}</td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/contests/${contestId}/questions/${q.id}/edit`} 
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </Link>
                        <Link 
                          href={`/contests/${contestId}/problems/${q.id}`} 
                          className="text-green-600 hover:underline text-sm"
                          target="_blank"
                        >
                          Preview
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
