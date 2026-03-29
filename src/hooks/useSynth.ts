import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const CHORDS = {
  celestial: ["G4", "B4", "D5", "F#5"],
  ethereal: ["F4", "A4", "C5", "E5"],
  major: ["C4", "E4", "G4"],
  minor: ["A3", "C4", "E4"],
  deep: ["E2", "G2", "B2"]
};

export const useSynth = (hands: any) => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const isPinching = useRef(false);

  const initialize = async () => {
    if (isInitialized) return;
    
    await Tone.start();
    
    // Create a compressor to prevent clipping and add punch
    const limiter = new Tone.Limiter(-1).toDestination();
    
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" }, // More audible than sine
      envelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).connect(limiter);
    
    synthRef.current.volume.value = -6; // Boost volume slightly
    
    setIsInitialized(true);
    console.log("Synth engine initialized");
  };

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || !synthRef.current || !hands || !hands.landmarks) return;

    const landmarks = hands.landmarks[0];
    if (!landmarks) {
      if (isPinching.current) {
        synthRef.current.releaseAll();
        isPinching.current = false;
        setActiveChord(null);
      }
      return;
    }

    // Pinch Detection: Thumb tip (4) and Index tip (8)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );

    const currentlyPinching = distance < 0.05;

    // Y-Axis Mapping: Hand height (using palm base 0)
    const handY = landmarks[0].y;
    let newChord: keyof typeof CHORDS = 'major';
    
    if (handY < 0.35) newChord = 'celestial';
    else if (handY < 0.5) newChord = 'ethereal';
    else if (handY < 0.65) newChord = 'major';
    else if (handY < 0.8) newChord = 'minor';
    else newChord = 'deep';

    if (currentlyPinching && !isPinching.current) {
      // Start Pinch
      synthRef.current.triggerAttack(CHORDS[newChord]);
      isPinching.current = true;
      setActiveChord(newChord);
    } else if (currentlyPinching && isPinching.current && newChord !== activeChord) {
      // Chord Change while pinching
      synthRef.current.releaseAll();
      synthRef.current.triggerAttack(CHORDS[newChord]);
      setActiveChord(newChord);
    } else if (!currentlyPinching && isPinching.current) {
      // End Pinch
      synthRef.current.releaseAll();
      isPinching.current = false;
      setActiveChord(null);
    }
  }, [hands, activeChord]);

  return { activeChord, initialize, isInitialized };
};

