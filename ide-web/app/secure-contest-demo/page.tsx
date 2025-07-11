"use client";
import React, { useState, useCallback } from 'react';
import SecureContestView from '@/components/SecureContestView';
import WebcamMonitor from '@/components/WebcamMonitor';
import SolutionValidator from '@/components/SolutionValidator';

// Mock contest data
const mockContest = {
  id: 'demo-contest-1',
  title: 'Secure Programming Contest Demo',
  startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Started 10 minutes ago
  endTime: new Date(Date.now() + 50 * 60 * 1000).toISOString(), // Ends in 50 minutes
  questions: [
    {
      id: 'q1',
      title: 'Two Sum Problem',
      points: 100
    },
    {
      id: 'q2', 
      title: 'Binary Search Implementation',
      points: 150
    },
    {
      id: 'q3',
      title: 'Dynamic Programming Challenge',
      points: 200
    }
  ]
};

// Mock code submissions for validation demo
const mockSubmissions = [
  {
    code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    language: 'python',
    timestamp: new Date().toISOString(),
    userId: 'demo-user',
    questionId: 'q1'
  }
];

export default function SecureContestDemo() {
  const [violations, setViolations] = useState<any[]>([]);
  const [faceDetected, setFaceDetected] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  // Handle security violations
  const handleViolation = useCallback((violation: any) => {
    console.log('Security violation:', violation);
    setViolations(prev => [...prev, violation]);
  }, []);

  // Handle face detection
  const handleFaceDetected = useCallback((detected: boolean) => {
    setFaceDetected(detected);
  }, []);

  // Handle multiple faces
  const handleMultipleFaces = useCallback((count: number) => {
    console.log(`Multiple faces detected: ${count}`);
    handleViolation({
      type: 'MULTIPLE_FACES',
      details: `${count} faces detected in webcam feed`
    });
  }, [handleViolation]);

  // Handle webcam violations
  const handleWebcamViolation = useCallback((type: string, details: string) => {
    handleViolation({ type, details });
  }, [handleViolation]);

  // Handle validation results
  const handleValidationComplete = useCallback((result: any) => {
    console.log('Validation complete:', result);
    setValidationResults(prev => [...prev, result]);
  }, []);

  // Handle suspicious activities
  const handleSuspiciousActivity = useCallback((activity: string, details: string) => {
    console.log('Suspicious activity:', activity, details);
    handleViolation({
      type: activity,
      details
    });
  }, [handleViolation]);

  // Handle contest time up
  const handleTimeUp = useCallback(() => {
    alert('Contest time is up!');
  }, []);

  if (!showDemo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-6">Secure Contest System Demo</h1>
          
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔒 Security Features</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Webcam monitoring with face detection</li>
                <li>• Full-screen mode enforcement</li>
                <li>• Tab switching and window change detection</li>
                <li>• Code plagiarism and quality analysis</li>
                <li>• Real-time violation tracking</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ What to Expect</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Request for webcam and fullscreen permissions</li>
                <li>• Live face detection monitoring</li>
                <li>• Security status indicators</li>
                <li>• Code validation on submission</li>
                <li>• Violation alerts and tracking</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Demo Notice</h3>
              <p className="text-sm text-yellow-700">
                This is a demonstration of the secure contest system. Some features use mock data 
                for illustration purposes. In a real contest environment, all security measures 
                would be fully active.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDemo(true)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Start Secure Contest Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo controls - only visible in demo mode */}
      <div className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="font-semibold">Security Demo Dashboard</h2>
            <button
              onClick={() => setWebcamActive(!webcamActive)}
              className={`px-3 py-1 rounded text-sm ${
                webcamActive ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              Webcam: {webcamActive ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span>Violations: {violations.length}</span>
            <span>Face: {faceDetected ? '✅' : '❌'}</span>
            <button
              onClick={() => setShowDemo(false)}
              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
            >
              Exit Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main secure contest view */}
      <SecureContestView
        contest={mockContest}
        onViolation={handleViolation}
        onTimeUp={handleTimeUp}
      />

      {/* Demo panels - side by side with main content */}
      <div className="fixed bottom-4 right-4 space-y-4 max-w-sm">
        {/* Webcam Monitor Demo */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold mb-3">Webcam Monitor</h3>
          <WebcamMonitor
            isActive={webcamActive}
            onFaceDetected={handleFaceDetected}
            onMultipleFaces={handleMultipleFaces}
            onViolation={handleWebcamViolation}
            width={200}
            height={150}
          />
        </div>

        {/* Solution Validator Demo */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold mb-3">Solution Validator</h3>
          <SolutionValidator
            submission={mockSubmissions[0]}
            previousSubmissions={[]}
            onValidationComplete={handleValidationComplete}
            onSuspiciousActivity={handleSuspiciousActivity}
          />
        </div>

        {/* Violations Log */}
        {violations.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-3">Security Violations</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {violations.slice(-5).map((violation, index) => (
                <div key={index} className="text-sm text-red-700">
                  <div className="font-medium">{violation.type}</div>
                  <div className="text-xs">{violation.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
