"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

interface WebcamMonitorProps {
  isActive: boolean;
  onFaceDetected: (detected: boolean) => void;
  onMultipleFaces: (count: number) => void;
  onViolation: (type: string, details: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

interface FaceDetection {
  detected: boolean;
  count: number;
  confidence: number;
  lastDetection: number;
}

export default function WebcamMonitor({
  isActive,
  onFaceDetected,
  onMultipleFaces,
  onViolation,
  className = "",
  width = 320,
  height = 240
}: WebcamMonitorProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<FaceDetection>({
    detected: false,
    count: 0,
    confidence: 0,
    lastDetection: 0
  });
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [error, setError] = useState<string>("");

  // Detection intervals and thresholds
  const DETECTION_INTERVAL = 3000; // Check every 3 seconds
  const NO_FACE_THRESHOLD = 10000; // Alert after 10 seconds without face
  const MULTIPLE_FACE_THRESHOLD = 5000; // Alert after 5 seconds with multiple faces

  // Request webcam permission
  const requestWebcamPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false 
      });
      
      setPermissionStatus('granted');
      setError("");
      
      // Stop the stream immediately as Webcam component will handle it
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Webcam permission denied:', err);
      setPermissionStatus('denied');
      setError("Webcam access is required for contest monitoring");
      onViolation('WEBCAM_PERMISSION_DENIED', 'User denied webcam access');
    }
  }, [onViolation]);

  // Mock face detection (in production, you would use TensorFlow.js BlazeFace model)
  const performFaceDetection = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current || !isWebcamReady) {
      return;
    }

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      
      if (!video || video.readyState !== 4) {
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Mock face detection logic (replace with actual TensorFlow.js implementation)
      const mockDetection = mockFaceDetectionLogic();
      
      setDetectionStatus(mockDetection);
      onFaceDetected(mockDetection.detected);

      // Handle multiple faces
      if (mockDetection.count > 1) {
        onMultipleFaces(mockDetection.count);
        onViolation('MULTIPLE_FACES', `Detected ${mockDetection.count} faces in frame`);
      }

      // Handle no face detection
      if (!mockDetection.detected) {
        const timeSinceLastDetection = Date.now() - mockDetection.lastDetection;
        if (timeSinceLastDetection > NO_FACE_THRESHOLD) {
          onViolation('NO_FACE_DETECTED', 'No face detected for extended period');
        }
      }

    } catch (error) {
      console.error('Face detection error:', error);
      setError("Face detection failed");
    }
  }, [isWebcamReady, onFaceDetected, onMultipleFaces, onViolation]);

  // Mock face detection logic (replace with actual ML model)
  const mockFaceDetectionLogic = useCallback((): FaceDetection => {
    // Simulate realistic face detection behavior
    const random = Math.random();
    
    // 85% chance of detecting exactly one face
    if (random < 0.85) {
      return {
        detected: true,
        count: 1,
        confidence: 0.8 + Math.random() * 0.2,
        lastDetection: Date.now()
      };
    }
    // 10% chance of no face
    else if (random < 0.95) {
      return {
        detected: false,
        count: 0,
        confidence: 0,
        lastDetection: detectionStatus.lastDetection
      };
    }
    // 5% chance of multiple faces
    else {
      return {
        detected: true,
        count: 2 + Math.floor(Math.random() * 3), // 2-4 faces
        confidence: 0.7 + Math.random() * 0.3,
        lastDetection: Date.now()
      };
    }
  }, [detectionStatus.lastDetection]);

  // Initialize webcam when component mounts
  useEffect(() => {
    if (isActive && permissionStatus === 'pending') {
      requestWebcamPermission();
    }
  }, [isActive, permissionStatus, requestWebcamPermission]);

  // Start face detection when webcam is ready
  useEffect(() => {
    if (!isActive || !isWebcamReady || permissionStatus !== 'granted') {
      return;
    }

    const detectionInterval = setInterval(performFaceDetection, DETECTION_INTERVAL);
    
    return () => {
      clearInterval(detectionInterval);
    };
  }, [isActive, isWebcamReady, permissionStatus, performFaceDetection]);

  // Handle webcam ready state
  const handleWebcamReady = useCallback(() => {
    setIsWebcamReady(true);
    setError("");
  }, []);

  // Handle webcam errors
  const handleWebcamError = useCallback((error: string | DOMException) => {
    console.error('Webcam error:', error);
    setIsWebcamReady(false);
    setError(`Webcam error: ${error}`);
    onViolation('WEBCAM_ERROR', `Webcam encountered an error: ${error}`);
  }, [onViolation]);

  // Retry webcam connection
  const retryWebcam = useCallback(() => {
    setError("");
    setPermissionStatus('pending');
    setIsWebcamReady(false);
    requestWebcamPermission();
  }, [requestWebcamPermission]);

  if (!isActive) {
    return null;
  }

  return (
    <div className={`webcam-monitor ${className}`}>
      <div className="relative">
        {/* Webcam feed */}
        {permissionStatus === 'granted' ? (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              width={width}
              height={height}
              mirrored={true}
              onUserMedia={handleWebcamReady}
              onUserMediaError={handleWebcamError}
              className="rounded-lg"
              videoConstraints={{
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
              }}
            />
            
            {/* Detection overlay */}
            <div className="absolute top-2 left-2 right-2">
              <div className="flex justify-between items-center">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  detectionStatus.detected 
                    ? detectionStatus.count === 1 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {detectionStatus.detected 
                    ? detectionStatus.count === 1 
                      ? 'Face Detected' 
                      : `${detectionStatus.count} Faces`
                    : 'No Face'
                  }
                </div>
                
                <div className={`w-3 h-3 rounded-full ${
                  isWebcamReady ? 'bg-green-500' : 'bg-red-500'
                }`} title={isWebcamReady ? 'Webcam Active' : 'Webcam Inactive'}></div>
              </div>
            </div>

            {/* Confidence indicator */}
            {detectionStatus.detected && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  Confidence: {(detectionStatus.confidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="flex flex-col items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg p-4"
               style={{ width, height }}>
            <div className="text-red-600 text-center">
              <div className="text-lg font-semibold mb-2">Webcam Access Required</div>
              <div className="text-sm mb-3">Please enable webcam access to continue</div>
              <button
                onClick={retryWebcam}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg"
               style={{ width, height }}>
            <div className="text-gray-600 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm">Requesting webcam access...</div>
            </div>
          </div>
        )}

        {/* Hidden canvas for face detection processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Error display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-90 rounded-lg">
            <div className="text-red-800 text-center p-2">
              <div className="font-medium mb-1">Error</div>
              <div className="text-xs">{error}</div>
              <button
                onClick={retryWebcam}
                className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status information */}
      <div className="mt-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={
            isWebcamReady ? 'text-green-600' : 'text-red-600'
          }>
            {isWebcamReady ? 'Active' : 'Inactive'}
          </span>
        </div>
        {detectionStatus.detected && (
          <div className="flex justify-between">
            <span>Last Detection:</span>
            <span>{new Date(detectionStatus.lastDetection).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Real-world implementation note:
// To implement actual face detection, you would:
// 1. Install @tensorflow/tfjs and @tensorflow-models/blazeface
// 2. Load the BlazeFace model
// 3. Replace mockFaceDetectionLogic with actual TensorFlow.js face detection
// 
// Example implementation:
// import * as tf from '@tensorflow/tfjs';
// import * as blazeface from '@tensorflow-models/blazeface';
//
// const model = await blazeface.load();
// const predictions = await model.estimateFaces(video, false);
// 
// return {
//   detected: predictions.length > 0,
//   count: predictions.length,
//   confidence: predictions[0]?.probability || 0,
//   lastDetection: Date.now()
// };