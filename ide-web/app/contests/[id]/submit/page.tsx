'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  questionId: string;
  questionTitle: string;
  score: number;
  status: string;
  submittedAt: string;
}

interface LeaderboardEntry {
  username: string;
  totalScore: number;
  rank: number;
  lastSubmissionTime: string;
}

export default function ContestSubmitPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const contestId = params.id;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [contestTitle, setContestTitle] = useState('');

  // Prevent back navigation after submission
  useEffect(() => {
    // Create multiple history entries to make it harder to go back
    for (let i = 0; i < 20; i++) {
      window.history.pushState(null, '', window.location.href);
    }
    
    // Ensure navigation history is filled with current URL
    // This makes it much harder to navigate back to the contest
    const fillHistoryInterval = setInterval(() => {
      window.history.pushState(null, '', window.location.href);
    }, 500);
    
    // Handle popstate (back button) events
    const handlePopState = () => {
      // Push state again to prevent navigation back to the contest
      window.history.pushState(null, '', window.location.href);
      
      // Show alert to notify the user
      alert('Back navigation is not allowed after submitting the contest.');
    };
    
    // Add event listener
    window.addEventListener('popstate', handlePopState);
    
    // Capture F5 and other navigation attempts
    const preventNavKeys = (e: KeyboardEvent) => {
      // Block more navigation keys and shortcuts
      if (
        (e.key === 'F5') || // Refresh
        (e.key === 'Backspace' && document.activeElement === document.body) || // Backspace when no input focused
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) || // Alt+Left/Right for browser back/forward
        (e.ctrlKey && (e.key === '[' || e.key === ']')) || // Ctrl+[ or Ctrl+] for back/forward in some browsers
        (e.ctrlKey && e.key === 'r') || // Ctrl+R for refresh
        (e.ctrlKey && e.key === 'h') || // Ctrl+H for history
        (e.metaKey && e.key === '[') || // Cmd+[ for back on Mac
        (e.metaKey && e.key === ']') // Cmd+] for forward on Mac
      ) {
        e.preventDefault();
        e.stopPropagation();
        alert('Navigation shortcuts are disabled after contest submission.');
      }
    };
    
    window.addEventListener('keydown', preventNavKeys, true);

    // Intercept link clicks that might navigate back
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        // Allow only specific links that don't navigate back to contest
        if (href && (href.includes('/contests') && !href.includes('/contests/list'))) {
          // Check if it's potentially navigating back to the contest
          if (!href.includes(`/contests/${contestId}/submit`)) {
            e.preventDefault();
            e.stopPropagation();
            alert('Navigation back to the contest is not allowed after submission.');
          }
        }
      }
    };
    
    document.addEventListener('click', handleLinkClick, true);
    
    // Clean up
    return () => {
      clearInterval(fillHistoryInterval);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', preventNavKeys, true);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [contestId]);

  // Set session flags to prevent back navigation to contest
  useEffect(() => {
    // Store the contest ID and submission state in session storage
    // This will be used to prevent navigation back to the contest
    sessionStorage.setItem('contestSubmitted', 'true');
    sessionStorage.setItem('lastContestId', contestId);
    
    // Get user info for more accurate tracking
    const userId = localStorage.getItem('userId') || 'anonymous';
    
    // Log the submission completion in local storage with timestamp
    const submissionLog = {
      contestId,
      userId,
      submittedAt: new Date().toISOString(),
      totalScore,
      userRank
    };
    
    // Store in local storage - could be synced to server later
    const existingLogs = JSON.parse(localStorage.getItem('contestSubmissions') || '[]');
    localStorage.setItem('contestSubmissions', JSON.stringify([...existingLogs, submissionLog]));
    
    return () => {
      // Don't remove session flags here to ensure they persist
      // They will be cleared after 30 minutes on the contests page
    };
  }, [contestId, totalScore, userRank]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch contest details
        const contestRes = await fetch(`/api/contests/${contestId}`);
        if (contestRes.ok) {
          const contestData = await contestRes.json();
          setContestTitle(contestData.title);
        }

        // Fetch user submissions for this contest
        const submissionsRes = await fetch(`/api/contests/${contestId}/submissions`);
        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData.submissions || []);
          setTotalScore(submissionsData.totalScore || 0);
          setUserRank(submissionsData.rank || null);
        }

        // Fetch leaderboard
        const leaderboardRes = await fetch(`/api/contests/${contestId}/leaderboard`);
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [contestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading submission data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {contestTitle} - Submission Summary
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Contest Completed</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You have completed the contest. You cannot return to the contest after submission. 
                  Your results are displayed below.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Contest Results</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm uppercase font-medium">Total Score</p>
                <p className="text-3xl font-bold text-blue-600">{totalScore}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm uppercase font-medium">Your Rank</p>
                <p className="text-3xl font-bold text-blue-600">
                  {userRank !== null ? `#${userRank}` : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-500 text-sm uppercase font-medium">Problems Solved</p>
                <p className="text-3xl font-bold text-blue-600">
                  {submissions.filter(s => s.status === 'ACCEPTED').length}/{submissions.length}
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3">Your Submissions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Problem</th>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Status</th>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Score</th>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{submission.questionTitle}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            submission.status === 'ACCEPTED'
                              ? 'bg-green-100 text-green-800'
                              : submission.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">{submission.score}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                      No submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Rank</th>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Username</th>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Score</th>
                  <th className="py-3 px-4 text-left text-gray-700 font-semibold">Last Submission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <tr 
                      key={entry.username}
                      className={`hover:bg-gray-50 ${entry.rank === userRank ? 'bg-blue-50' : ''}`}
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">#{entry.rank}</td>
                      <td className="py-3 px-4 text-gray-800">{entry.username}</td>
                      <td className="py-3 px-4 text-gray-800">{entry.totalScore}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {entry.lastSubmissionTime ? new Date(entry.lastSubmissionTime).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                      No leaderboard data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/contests/list"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to All Contests
          </Link>
        </div>
      </div>
    </div>
  );
}
