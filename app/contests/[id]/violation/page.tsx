'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Violation {
  id: string;
  type: string;
  details: string;
  timestamp: string;
  evidence?: string;
}

export default function ViolationPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [violations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since we don't have a real violations table yet, just show a placeholder
    setLoading(false);
  }, [contestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading violations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Security Violations
            </h1>
            <Link
              href={`/contests/${contestId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Contest
            </Link>
          </div>
          
          {violations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛡️</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                No Violations Detected
              </h2>
              <p className="text-gray-600">
                All contest security measures are functioning properly.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => (
                <div key={violation.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-red-800">
                        {violation.type}
                      </h3>
                      <p className="text-red-700 mt-1">
                        {violation.details}
                      </p>
                      <p className="text-sm text-red-600 mt-2">
                        {new Date(violation.timestamp).toLocaleString()}
                      </p>
                    </div>
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