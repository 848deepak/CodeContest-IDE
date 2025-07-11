"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Link from 'next/link';

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

interface Violation {
  id: string;
  type: 'TAB_SWITCH' | 'WINDOW_SWITCH' | 'FULLSCREEN_EXIT' | 'FACE_NOT_DETECTED' | 'MULTIPLE_FACES';
  timestamp: string;
  details: string;
}

interface SecureContestViewProps {
  contest: Contest;
  onViolation: (violation: Omit<Violation, 'id' | 'timestamp'>) => void;
  onTimeUp?: () => void;
}

export default function SecureContestView({ 
  contest, 
  onViolation, 
  onTimeUp 
}: SecureContestViewProps) {
  // State management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [violations, setViolations] = useState<Violation[]>([]);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [warningVisible, setWarningVisible] = useState(false);
  const [contestStarted, setContestStarted] = useState(false);

  // Refs
  const webcamRef = useRef<Webcam>(null);
  const lastViolationRef = useRef<number>(0);

  // Constants
  const VIOLATION_COOLDOWN = 5000; // 5 seconds cooldown between similar violations

  // Check if contest is active
  const isContestActive = useCallback(() => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    return now >= start && now <= end;
  }, [contest]);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date().getTime();
    const end = new Date(contest.endTime).getTime();
    const distance = end - now;

    if (distance < 0) {
      onTimeUp?.();
      return "Contest Ended";
    }

    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [contest.endTime, onTimeUp]);

  // Log violation with cooldown
  const logViolation = useCallback((type: Violation['type'], details: string) => {
    const now = Date.now();
    if (now - lastViolationRef.current < VIOLATION_COOLDOWN) {
      return; // Skip if within cooldown period
    }

    const violation: Violation = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      timestamp: new Date().toISOString(),
      details
    };

    setViolations(prev => [...prev, violation]);
    onViolation(violation);
    lastViolationRef.current = now;

    // Show warning
    setWarningVisible(true);
    setTimeout(() => setWarningVisible(false), 3000);
  }, [onViolation]);

  // Fullscreen management
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Event handlers
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = Boolean(document.fullscreenElement);
    setIsFullscreen(isCurrentlyFullscreen);
    
    if (!isCurrentlyFullscreen && contestStarted && isContestActive()) {
      logViolation('FULLSCREEN_EXIT', 'User exited fullscreen mode during contest');
    }
  }, [contestStarted, isContestActive, logViolation]);

  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    setIsTabVisible(isVisible);
    
    if (!isVisible && contestStarted && isContestActive()) {
      logViolation('TAB_SWITCH', 'User switched to another tab during contest');
    }
  }, [contestStarted, isContestActive, logViolation]);

  const handleWindowBlur = useCallback(() => {
    if (contestStarted && isContestActive()) {
      logViolation('WINDOW_SWITCH', 'User switched to another window during contest');
    }
  }, [contestStarted, isContestActive, logViolation]);

  // Start secure contest mode
  const startSecureMode = useCallback(async () => {
    try {
      // Request webcam permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setWebcamEnabled(true);
      stream.getTracks().forEach(track => track.stop()); // Stop initial stream
      
      // Enter fullscreen
      await enterFullscreen();
      
      setContestStarted(true);
    } catch (error) {
      console.error('Failed to start secure mode:', error);
      alert('Please enable webcam and allow fullscreen to start the contest');
    }
  }, [enterFullscreen]);

  // Effects
  useEffect(() => {
    // Timer update
    const timer = setInterval(() => {
      if (isContestActive()) {
        setTimeRemaining(calculateTimeRemaining());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isContestActive, calculateTimeRemaining]);

  useEffect(() => {
    // Event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Disable right-click during contest
    const handleContextMenu = (e: MouseEvent) => {
      if (contestStarted) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Disable certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (contestStarted) {
        // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C')
        ) {
          e.preventDefault();
          logViolation('TAB_SWITCH', `Attempted to use developer tools: ${e.key}`);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contestStarted, handleFullscreenChange, handleVisibilityChange, handleWindowBlur, logViolation]);

  // Face detection (placeholder - would integrate with TensorFlow.js)
  useEffect(() => {
    if (!webcamEnabled || !contestStarted) return;

    const detectFaces = () => {
      // Placeholder for face detection logic
      // In a real implementation, you would use TensorFlow.js BlazeFace model
      const faceDetected = Math.random() > 0.1; // 90% chance of face detection
      
      if (!faceDetected) {
        logViolation('FACE_NOT_DETECTED', 'No face detected in webcam feed');
      }
      
      setFaceDetected(faceDetected);
    };

    const faceDetectionInterval = setInterval(detectFaces, 5000); // Check every 5 seconds
    return () => clearInterval(faceDetectionInterval);
  }, [webcamEnabled, contestStarted, logViolation]);

  // Don't render if contest hasn't started
  if (!isContestActive() && !contestStarted) {
    const now = new Date();
    const start = new Date(contest.startTime);
    
    if (now < start) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Contest hasn't started yet</h1>
            <p className="text-gray-600">
              Contest starts at: {new Date(contest.startTime).toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Security Warning Overlay */}
      {warningVisible && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 text-center">
          <div className="font-bold">SECURITY VIOLATION DETECTED</div>
          <div className="text-sm">Please maintain contest integrity. Violations are being recorded.</div>
        </div>
      )}

      {/* Pre-contest security setup */}
      {!contestStarted && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Contest Security Setup</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${webcamEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Webcam Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${isFullscreen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Fullscreen Mode</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <ul className="list-disc list-inside space-y-1">
                <li>Your webcam will be monitored during the contest</li>
                <li>You must remain in fullscreen mode</li>
                <li>Tab switching and window changes are tracked</li>
                <li>Developer tools are disabled</li>
              </ul>
            </div>
            <button
              onClick={startSecureMode}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Start Secure Contest Mode
            </button>
          </div>
        </div>
      )}

      {/* Main contest interface */}
      {contestStarted && (
        <>
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold text-gray-900">{contest.title}</h1>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {faceDetected ? 'Face Detected' : 'No Face'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {timeRemaining && (
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded font-mono">
                      {timeRemaining}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Violations: {violations.length}
                  </div>
                  <button
                    onClick={exitFullscreen}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Exit Contest
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webcam monitor (small overlay) */}
          {webcamEnabled && (
            <div className="fixed top-20 right-4 z-30">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <Webcam
                  ref={webcamRef}
                  width={160}
                  height={120}
                  mirrored={true}
                  className="rounded"
                />
                <div className="text-xs text-gray-600 text-center mt-1">Monitoring Active</div>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contest Problems</h2>
              
              <div className="grid gap-4">
                {contest.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Problem {index + 1}: {question.title}
                        </h3>
                        <p className="text-gray-600">Points: {question.points}</p>
                      </div>
                      <Link
                        href={`/contests/${contest.id}/problems/${question.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Solve
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security status */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Security Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Fullscreen:</span>
                    <span className={isFullscreen ? 'text-green-600' : 'text-red-600'}>
                      {isFullscreen ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tab Visible:</span>
                    <span className={isTabVisible ? 'text-green-600' : 'text-red-600'}>
                      {isTabVisible ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Webcam:</span>
                    <span className={webcamEnabled ? 'text-green-600' : 'text-red-600'}>
                      {webcamEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Face Detection:</span>
                    <span className={faceDetected ? 'text-green-600' : 'text-red-600'}>
                      {faceDetected ? 'Detected' : 'Not Detected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent violations */}
              {violations.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Security Violations</h3>
                  <div className="space-y-2">
                    {violations.slice(-3).map((violation) => (
                      <div key={violation.id} className="text-sm text-red-700">
                        <span className="font-medium">{violation.type}:</span> {violation.details}
                        <span className="text-red-500 ml-2">
                          ({new Date(violation.timestamp).toLocaleTimeString()})
                        </span>
                      </div>
                    ))}
                  </div>
                  {violations.length > 3 && (
                    <Link
                      href={`/contests/${contest.id}/violation`}
                      className="text-red-600 hover:text-red-800 text-sm mt-2 inline-block"
                    >
                      View all violations →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}