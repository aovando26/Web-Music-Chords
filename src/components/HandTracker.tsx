import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface HandTrackerProps {
  onHandsDetected: (results: any) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onHandsDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        setLandmarker(handLandmarker);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Failed to setup hand tracking:", err);
        setError("Camera access or hand tracking model failed to load.");
      }
    }
    setup();
  }, []);

  useEffect(() => {
    if (!landmarker || !videoRef.current) return;

    let animationFrameId: number;
    const detect = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(videoRef.current, startTimeMs);
        onHandsDetected(results);
      }
      animationFrameId = requestAnimationFrame(detect);
    };
    detect();

    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarker, onHandsDetected]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white p-4 text-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
      playsInline
      muted
    />
  );
};
