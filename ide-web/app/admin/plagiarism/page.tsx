'use client';

import { useEffect, useState } from 'react';

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  submissionId: string;
  submittedAt: string;
}

interface PlagiarismResult {
  similarity: number;
  method: string;
  question: string;
  users: [User, User];
}

interface PlagiarismReport {
  totalSubmissions: number;
  suspiciousPairs: number;
  threshold: number;
  results: PlagiarismResult[];
}

interface ComparisonData {
  submission1: {
    id: string;
    code: string;
    language: string;
    submittedAt: string;
    user: {
      username: string;
      name: string;
    };
  };
  submission2: {
    id: string;
    code: string;
    language: string;
    submittedAt: string;
    user: {
      username: string;
      name: string;
    };
  };
  similarity: {
    overall: number;
    jaccard: number;
    levenshtein: number;
  };
  method: string;
}

export default function PlagiarismCheckPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(70);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PlagiarismReport | null>(null);
  const [comparing, setComparing] = useState<{ sub1: string; sub2: string } | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const response = await fetch('/api/contests');
      if (response.ok) {
        const data = await response.json();
        setContests(data);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    }
  };

  const handlePlagiarismCheck = async () => {
    if (!selectedContest) {
      alert('Please select a contest');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/plagiarism', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: selectedContest,
          threshold: threshold / 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        const error = await response.json();
        alert(`Error checking plagiarism: ${error.error}`);
      }
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      alert('Error checking plagiarism. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareSubmissions = async (sub1: string, sub2: string) => {
    setComparing({ sub1, sub2 });
    try {
      const response = await fetch(`/api/plagiarism?submission1=${sub1}&submission2=${sub2}`);
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data);
      }
    } catch (error) {
      console.error('Error comparing submissions:', error);
    }
  };

  const getSeverityColor = (similarity: number) => {
    if (similarity >= 90) return 'text-red-600 bg-red-50';
    if (similarity >= 80) return 'text-orange-600 bg-orange-50';
    if (similarity >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getSeverityLabel = (similarity: number) => {
    if (similarity >= 90) return 'Very High';
    if (similarity >= 80) return 'High';
    if (similarity >= 70) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Plagiarism Detection</h1>
            <p className="mt-2 text-gray-600">Check for similar code submissions in contests</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Contest
                </label>
                <select
                  value={selectedContest}
                  onChange={(e) => setSelectedContest(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a contest...</option>
                  {contests.map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      {contest.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Similarity Threshold (%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 mt-1">{threshold}%</div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handlePlagiarismCheck}
                  disabled={loading || !selectedContest}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking...
                    </>
                  ) : (
                    'Check Plagiarism'
                  )}
                </button>
              </div>
            </div>

            {report && (
              <div className="mt-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Plagiarism Report</h3>
                      <p className="text-blue-700">
                        Found {report.suspiciousPairs} suspicious pairs out of {report.totalSubmissions} submissions
                        (threshold: {report.threshold * 100}%)
                      </p>
                    </div>
                  </div>
                </div>

                {report.results.length > 0 ? (
                  <div className="space-y-4">
                    {report.results.map((result, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {result.question}
                            </h4>
                            <p className="text-sm text-gray-600">Detection method: {result.method}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(result.similarity)}`}>
                              {getSeverityLabel(result.similarity)}
                            </span>
                            <span className="text-2xl font-bold text-gray-900">
                              {result.similarity}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.users.map((user, userIndex) => (
                            <div key={userIndex} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-600">@{user.username}</div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(user.submittedAt).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Submission ID: {user.submissionId}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleCompareSubmissions(result.users[0].submissionId, result.users[1].submissionId)}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                          >
                            Compare Code
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No plagiarism detected above the threshold
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Code Comparison Modal */}
        {comparing && comparisonData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Code Comparison</h3>
                  <button
                    onClick={() => {
                      setComparing(null);
                      setComparisonData(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Overall Similarity: {comparisonData.similarity.overall}% 
                  (Jaccard: {comparisonData.similarity.jaccard}%, Levenshtein: {comparisonData.similarity.levenshtein}%)
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {comparisonData.submission1.user.name} (@{comparisonData.submission1.user.username})
                    </h4>
                    <div className="text-sm text-gray-600 mb-3">
                      Submitted: {new Date(comparisonData.submission1.submittedAt).toLocaleString()}
                    </div>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto border">
                      <code>{comparisonData.submission1.code}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      {comparisonData.submission2.user.name} (@{comparisonData.submission2.user.username})
                    </h4>
                    <div className="text-sm text-gray-600 mb-3">
                      Submitted: {new Date(comparisonData.submission2.submittedAt).toLocaleString()}
                    </div>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto border">
                      <code>{comparisonData.submission2.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
