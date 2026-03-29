import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  hands: any;
  activeChords: (string | null)[];
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index finger
  [0, 9], [9, 10], [10, 11], [11, 12], // middle finger
  [0, 13], [13, 14], [14, 15], [15, 16], // ring finger
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17] // palm
];

export const Visualizer: React.FC<VisualizerProps> = ({ hands, activeChords }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw hand landmarks (skeleton)
      if (hands && hands.landmarks) {
        hands.landmarks.forEach((landmark: any, handIdx: number) => {
          const activeChord = activeChords[handIdx] ?? null;
          const color = activeChord ? '#22d3ee' : '#ffffff';
          
          // Draw connections
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          HAND_CONNECTIONS.forEach(([start, end]) => {
            const startPoint = landmark[start];
            const endPoint = landmark[end];
            if (startPoint && endPoint) {
              ctx.moveTo((1 - startPoint.x) * canvas.width, startPoint.y * canvas.height);
              ctx.lineTo((1 - endPoint.x) * canvas.width, endPoint.y * canvas.height);
            }
          });
          ctx.stroke();

          // Draw landmarks
          landmark.forEach((point: any, i: number) => {
            const x = (1 - point.x) * canvas.width;
            const y = point.y * canvas.height;
            
            const isTip = [4, 8, 12, 16, 20].includes(i);
            const isPinchPoint = i === 4 || i === 8;

            ctx.beginPath();
            ctx.arc(x, y, isTip ? 4 : 2, 0, Math.PI * 2);
            ctx.fillStyle = isPinchPoint && activeChord ? '#22d3ee' : 'white';
            ctx.fill();

            if (isPinchPoint && activeChord) {
              ctx.shadowBlur = 15;
              ctx.shadowColor = '#22d3ee';
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          });

          // Draw active chord visualizer
          if (activeChord) {
            const palm = landmark[0];
            const px = (1 - palm.x) * canvas.width;
            const py = palm.y * canvas.height;

            ctx.beginPath();
            ctx.arc(px, py, 40, 0, Math.PI * 2);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '10px monospace';
            ctx.fillStyle = '#22d3ee';
            ctx.textAlign = 'center';
            ctx.fillText(activeChord.toUpperCase(), px, py + 60);
          }
        });
      }

      requestAnimationFrame(animate);
    };

    const frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [hands, activeChords]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full bg-black"
    />
  );
};

