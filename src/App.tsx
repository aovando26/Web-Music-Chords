/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { HandTracker } from './components/HandTracker';
import { Visualizer } from './components/Visualizer';
import { useSynth } from './hooks/useSynth';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [hands, setHands] = useState<any>(null);
  const [started, setStarted] = useState(false);

  const handleHandsDetected = useCallback((results: any) => {
    setHands(results);
  }, []);

  const { activeChord, initialize, isInitialized } = useSynth(hands);

  const handleStart = async () => {
    await initialize();
    setStarted(true);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      <Visualizer hands={hands} activeChord={activeChord} />
      
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
              {activeChord && (
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400 animate-pulse">
                  Playing: {activeChord.toUpperCase()} Chord
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute top-8 right-8 z-10 text-right pointer-events-none">
            <div className="space-y-4">
              <div>
                <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-1">Y-Axis Control</h2>
                <div className="space-y-1">
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChord === 'celestial' ? 'text-cyan-400' : 'text-zinc-700'}`}>↑ Celestial</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChord === 'ethereal' ? 'text-cyan-400' : 'text-zinc-700'}`}>- Ethereal</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChord === 'major' ? 'text-cyan-400' : 'text-zinc-700'}`}>- Major</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChord === 'minor' ? 'text-cyan-400' : 'text-zinc-700'}`}>- Minor</p>
                  <p className={`text-[10px] tracking-widest uppercase transition-colors ${activeChord === 'deep' ? 'text-cyan-400' : 'text-zinc-700'}`}>↓ Deep</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


