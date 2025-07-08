'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

interface WebcamMonitorProps {
  enabled: boolean;
  onViolation: (message: string) => void;
  onWarning: (message: string) => void;
}

export default function WebcamMonitor({ enabled, onViolation, onWarning }: WebcamMonitorProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebcamPermission, setHasWebcamPermission] = useState<boolean | null>(null);
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faceVisible, setFaceVisible] = useState(false);
  const [lookingAway, setLookingAway] = useState(false);
  const [lastFaceDetection, setLastFaceDetection] = useState(Date.now());
  const [consecutiveNoFace, setConsecutiveNoFace] = useState(0);
  const [consecutiveLookingAway, setConsecutiveLookingAway] = useState(0);
  
  // Load TensorFlow models
  useEffect(() => {
    if (!enabled) return;

    async function loadModels() {
      try {
        setIsLoading(true);
        
        // Load face detection model
        await tf.ready();
        const blazeFaceModel = await blazeface.load();
        setModel(blazeFaceModel);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setHasWebcamPermission(false);
      }
    }
    
    loadModels();
    
    return () => {
      // Cleanup
      if (model) {
        // No explicit dispose method for BlazeFace model
      }
    };
  }, [enabled]);
  
  // Webcam permission check
  useEffect(() => {
    if (!enabled) return;
    
    async function checkPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasWebcamPermission(true);
        
        // Clean up the stream
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setHasWebcamPermission(false);
        onWarning('Webcam access denied. Please enable webcam access for this site.');
      }
    }
    
    checkPermission();
  }, [enabled, onWarning]);
  
  // Face detection loop
  useEffect(() => {
    if (!enabled || isLoading || !model || hasWebcamPermission !== true) return;
    
    let animationId: number;
    let lastWarnTime = 0;
    let lastViolationTime = 0;
    
    const detectFace = async () => {
      if (!webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4) {
        animationId = requestAnimationFrame(detectFace);
        return;
      }
      
      const video = webcamRef.current.video;
      
      try {
        // Use BlazeFace for face detection
        const predictions = await model.estimateFaces(video, false);
        
        const hasFace = predictions.length > 0;
        setFaceVisible(hasFace);
        
        if (hasFace) {
          setLastFaceDetection(Date.now());
          setConsecutiveNoFace(0);
          
          // Get the main face prediction
          const face = predictions[0];
          
          // Simple face orientation check based on BlazeFace landmarks
          // BlazeFace provides 6 keypoints: 4 for eyes, 1 for nose, 1 for mouth
          const landmarks = face.landmarks as number[][];
          
          // Simplified check for looking away using BlazeFace landmarks
          // We'll use the relative positions of eyes, nose, and mouth to approximate gaze
          const isLookingAway = simplifiedLookingAwayCheck(landmarks, 
                                                         face.topLeft as number[], 
                                                         face.bottomRight as number[]);
          setLookingAway(isLookingAway);
          
          if (isLookingAway) {
            setConsecutiveLookingAway(prev => prev + 1);
            
            // Send warning after 3 consecutive looking away frames (about 0.5s)
            if (consecutiveLookingAway >= 3 && Date.now() - lastWarnTime > 3000) {
              onWarning('Please look at the screen during the contest.');
              lastWarnTime = Date.now();
            }
            
            // Send violation after 10 consecutive looking away frames (about 1.5s)
            if (consecutiveLookingAway >= 10 && Date.now() - lastViolationTime > 10000) {
              onViolation('Looking away from screen detected.');
              lastViolationTime = Date.now();
            }
          } else {
            setConsecutiveLookingAway(0);
          }
          
          // Draw face landmarks if canvas is available
          if (canvasRef.current) {
            drawFaceBox(face.topLeft as number[], 
                      face.bottomRight as number[], 
                      landmarks, 
                      canvasRef.current);
          }
        } else {
          setConsecutiveNoFace(prev => prev + 1);
          
          // Send warning after 30 consecutive no-face frames (about 1s)
          if (consecutiveNoFace >= 30 && Date.now() - lastWarnTime > 3000) {
            onWarning('Face not detected. Please position yourself in front of the camera.');
            lastWarnTime = Date.now();
          }
          
          // Send violation after 90 consecutive no-face frames (about 3s)
          if (consecutiveNoFace >= 90 && Date.now() - lastViolationTime > 10000) {
            onViolation('Face not visible for an extended period.');
            lastViolationTime = Date.now();
          }
          
          // Clear canvas
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
        }
      } catch (error) {
        console.error('Error in face detection:', error);
      }
      
      animationId = requestAnimationFrame(detectFace);
    };
    
    detectFace();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled, isLoading, model, hasWebcamPermission, consecutiveNoFace, consecutiveLookingAway, onWarning, onViolation]);
  
  // Helper functions
  const simplifiedLookingAwayCheck = (landmarks: number[][], topLeft: number[], bottomRight: number[]) => {
    if (!landmarks || landmarks.length < 6) {
      return false;
    }
    
    // BlazeFace provides 6 keypoints in this order:
    // Right eye, left eye, nose, mouth, right ear, left ear
    // We'll use these to determine if someone is looking away
    
    const rightEye = landmarks[0];
    const leftEye = landmarks[1];
    const nose = landmarks[2];
    const mouth = landmarks[3];
    
    // Calculate face width based on bounding box
    const faceWidth = bottomRight[0] - topLeft[0];
    
    // Calculate midpoint between eyes
    const eyesMidpointX = (rightEye[0] + leftEye[0]) / 2;
    
    // Check if nose is offset significantly from the midpoint between eyes
    const noseDeltaX = Math.abs(nose[0] - eyesMidpointX);
    
    // If nose is too far to either side compared to eyes midpoint, person is likely looking away
    return noseDeltaX > faceWidth * 0.15; // Threshold can be adjusted
  };
  
  const drawFaceBox = (topLeft: number[], bottomRight: number[], landmarks: number[][], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bounding box
    ctx.strokeStyle = faceVisible ? (lookingAway ? 'orange' : 'green') : 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
    ctx.stroke();
    
    // Draw landmarks
    ctx.fillStyle = faceVisible ? (lookingAway ? 'orange' : 'green') : 'red';
    
    landmarks.forEach(landmark => {
      ctx.beginPath();
      ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw status text
    ctx.font = '16px Arial';
    ctx.fillStyle = faceVisible ? (lookingAway ? 'orange' : 'green') : 'red';
    ctx.fillText(
      faceVisible ? (lookingAway ? 'Looking Away' : 'Face Detected') : 'No Face Detected',
      10, 30
    );
  };
  
  if (!enabled) {
    return null;
  }
  
  return (
    <div className="webcam-monitor">
      {hasWebcamPermission === false && (
        <div className="bg-red-600 text-white p-4 mb-2 rounded">
          Webcam access is required for this contest. Please enable your webcam.
        </div>
      )}
      
      {isLoading && (
        <div className="bg-blue-500 text-white p-4 mb-2 rounded">
          Loading face detection models...
        </div>
      )}
      
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
          className="rounded border-2 border-gray-300"
          style={{ 
            width: '240px', 
            height: '180px',
            objectFit: 'cover',
            position: 'absolute',
            right: '20px',
            top: '20px',
            zIndex: 10
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            width: '240px',
            height: '180px',
            position: 'absolute',
            right: '20px',
            top: '20px',
            zIndex: 11
          }}
        />
        
        {!faceVisible && (
          <div className="absolute right-20 top-20 bg-red-600 bg-opacity-70 text-white p-1 z-20 rounded text-xs">
            Face not detected
          </div>
        )}
        
        {faceVisible && lookingAway && (
          <div className="absolute right-20 top-20 bg-yellow-600 bg-opacity-70 text-white p-1 z-20 rounded text-xs">
            Looking away
          </div>
        )}
      </div>
    </div>
  );
}
