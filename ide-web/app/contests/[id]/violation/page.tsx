'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ViolationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const contestId = params.id;

  useEffect(() => {
    // Log the violation to the server
    const logViolation = async () => {
      try {
        await fetch('/api/contests/violation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contestId }),
        });
      } catch (error) {
        console.error('Failed to log violation:', error);
      }
    };

    logViolation();
  }, [contestId]);

  const returnToContest = () => {
    router.push(`/contests/${contestId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-8">Security Violation Detected</h1>
        
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg mb-8">
          <p className="text-xl mb-4">
            Multiple security violations have been detected during your contest session.
          </p>
          
          <p className="mb-6">
            These violations may include:
          </p>
          
          <ul className="list-disc text-left ml-8 mb-6">
            <li className="mb-2">Exiting full-screen mode multiple times</li>
            <li className="mb-2">Attempting to copy/paste content</li>
            <li className="mb-2">Switching to other tabs or applications</li>
            <li className="mb-2">Face not visible in webcam monitoring</li>
            <li className="mb-2">Looking away from screen for extended periods</li>
            <li className="mb-2">Multiple people detected in webcam view</li>
          </ul>
          
          <p className="text-red-400 mb-6">
            This incident has been logged and may be reviewed by contest administrators.
          </p>
          
          <p className="italic text-gray-400 mb-8">
            Repeated violations may result in disqualification from the contest.
          </p>
        </div>
        
        <button
          onClick={returnToContest}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          Return to Contest
        </button>
      </div>
    </div>
  );
}
