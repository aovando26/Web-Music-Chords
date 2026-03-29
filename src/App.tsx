/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { HandTracker } from './components/HandTracker';
import { Visualizer } from './components/Visualizer';
import { useSynth } from './hooks/useSynth';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [hands, setHands] = useState<any>(null);
  const [started, setStarted] = useState(false);
  const [awaitingHands, setAwaitingHands] = useState(false);
  const noHandsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasAwaiting = useRef(false);
  const overlayShownAt = useRef<number | null>(null);

  const playPing = useCallback(() => {
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.4 },
    }).toDestination();
    synth.volume.value = -10;
    synth.triggerAttackRelease('C5', '16n', Tone.now());
    synth.triggerAttackRelease('E5', '16n', Tone.now() + 0.1);
    setTimeout(() => synth.dispose(), 1000);
  }, []);

  const showOverlay = useCallback(() => {
    wasAwaiting.current = true;
    overlayShownAt.current = Date.now();
    setAwaitingHands(true);
  }, []);

  const dismissOverlay = useCallback(() => {
    if (!overlayShownAt.current) return;
    const elapsed = Date.now() - overlayShownAt.current;
    const remaining = Math.max(0, 2000 - elapsed);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      playPing();
      wasAwaiting.current = false;
      overlayShownAt.current = null;
      setAwaitingHands(false);
    }, remaining);
  }, [playPing]);

  const handleHandsDetected = useCallback((results: any) => {
    setHands(results);
  }, []);

  const { activeChord, activeChords, initialize, isInitialized } = useSynth(hands);

  const handleStart = async () => {
    await initialize();
    setStarted(true);
    showOverlay();
  };

  useEffect(() => {
    if (!started) return;
    const hasHands = (hands?.landmarks?.length ?? 0) > 0;
    if (hasHands) {
      if (noHandsTimer.current) {
        clearTimeout(noHandsTimer.current);
        noHandsTimer.current = null;
      }
      if (wasAwaiting.current) {
        dismissOverlay();
      }
    } else if (!noHandsTimer.current) {
      // Only schedule if a timer isn't already pending — the effect
      // runs every frame so we must not reset it on every re-render.
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      noHandsTimer.current = setTimeout(() => {
        noHandsTimer.current = null;
        showOverlay();
      }, 1500);
    }
  }, [hands, started, dismissOverlay, showOverlay]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      <Visualizer hands={hands} activeChords={activeChords} />
      
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-12"
            >
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-2 italic uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                AetherSynth
              </h1>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-500 to-transparent mb-4" />
              <p className="text-zinc-400 text-sm font-mono tracking-[0.3em] uppercase">Gesture-Controlled Polyphonic Synth</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mb-12 text-left border-t border-zinc-800 pt-8">
              <div>
                <h3 className="text-xs font-mono text-cyan-400 uppercase mb-2">01 / Trigger</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Pinch your thumb and index finger together to trigger the synthesizer.</p>
              </div>
              <div>
                <h3 className="text-xs font-mono text-cyan-400 uppercase mb-2">02 / Pitch</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Move your hand vertically to change chords: Top (Ethereal), Middle (Major), Bottom (Minor).</p>
              </div>
              <div>
                <h3 className="text-xs font-mono text-cyan-400 uppercase mb-2">03 / Visuals</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Watch the aether react to your movements and the harmonic vibrations.</p>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="group relative px-16 py-5 bg-white text-black font-bold uppercase tracking-[0.2em] overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Initialize Synth</span>
              <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {started && awaitingHands && (
          <motion.div
            key="awaiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="relative flex items-center justify-center mb-10">
              <div className="absolute w-36 h-36 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-28 h-28 rounded-full border border-cyan-400/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
              <div className="w-20 h-20 rounded-full border-2 border-zinc-700 border-t-cyan-400 animate-spin" style={{ animationDuration: '1.2s' }} />
              <div className="absolute w-12 h-12 rounded-full border border-cyan-400/40 animate-pulse" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-cyan-400 mb-3">Awaiting Detection</p>
            <p className="text-sm text-zinc-400">Place your hands in front of the camera</p>
          </motion.div>
        )}
      </AnimatePresence>

      {started && (
        <>
          <HandTracker onHandsDetected={handleHandsDetected} />
          
          <div className="absolute bottom-8 left-8 z-10 pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)] ${isInitialized ? 'bg-cyan-400' : 'bg-zinc-600'}`} />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400">
                  Synth Engine: {isInitialized ? 'Active' : 'Initializing'} // {hands?.landmarks?.length || 0} Hands
                </span>
              </div>
              {activeChords.some(c => c) && (
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400 animate-pulse">
                  Playing: {activeChords.filter(Boolean).map(c => c!.toUpperCase()).join(' + ')}
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute top-8 right-8 z-10 text-right pointer-events-none">
            <div className="space-y-4">
              <div>
                <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-1">Y-Axis Control</h2>
                <div className="space-y-1">
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChords.includes('celestial') ? 'text-cyan-400' : 'text-zinc-700'}`}>↑ Celestial</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChords.includes('ethereal') ? 'text-cyan-400' : 'text-zinc-700'}`}>- Ethereal</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChords.includes('major') ? 'text-cyan-400' : 'text-zinc-700'}`}>- Major</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChords.includes('minor') ? 'text-cyan-400' : 'text-zinc-700'}`}>- Minor</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChords.includes('deep') ? 'text-cyan-400' : 'text-zinc-700'}`}>↓ Deep</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


