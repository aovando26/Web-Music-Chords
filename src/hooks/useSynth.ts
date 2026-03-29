import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const CHORDS = {
  celestial: ["G4", "B4", "D5", "F#5"],
  ethereal: ["F4", "A4", "C5", "E5"],
  major: ["C4", "E4", "G4"],
  minor: ["A3", "C4", "E4"],
  deep: ["E2", "G2", "B2"]
};

type ChordName = keyof typeof CHORDS;

function getChordForY(y: number): ChordName {
  if (y < 0.35) return 'celestial';
  if (y < 0.50) return 'ethereal';
  if (y < 0.65) return 'major';
  if (y < 0.80) return 'minor';
  return 'deep';
}

interface HandState {
  isPinching: boolean;
  chord: ChordName | null;
}

export const useSynth = (hands: any) => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeChords, setActiveChords] = useState<(ChordName | null)[]>([null, null]);
  const handStates = useRef<HandState[]>([
    { isPinching: false, chord: null },
    { isPinching: false, chord: null },
  ]);

  const initialize = async () => {
    if (isInitialized) return;

    await Tone.start();

    const limiter = new Tone.Limiter(-1).toDestination();

    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).connect(limiter);

    synthRef.current.volume.value = -6;

    setIsInitialized(true);
    console.log("Synth engine initialized");
  };

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || !synthRef.current) return;

    const synth = synthRef.current;
    const states = handStates.current;
    const landmarkSets: any[] = hands?.landmarks ?? [];
    const updated: (ChordName | null)[] = [null, null];

    for (let i = 0; i < 2; i++) {
      const landmarks = landmarkSets[i];
      const state = states[i];

      if (!landmarks) {
        if (state.isPinching && state.chord) {
          synth.triggerRelease(CHORDS[state.chord]);
          state.isPinching = false;
          state.chord = null;
        }
        continue;
      }

      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2)
      );

      const currentlyPinching = distance < 0.05;
      const newChord = getChordForY(landmarks[0].y);

      if (currentlyPinching && !state.isPinching) {
        synth.triggerAttack(CHORDS[newChord]);
        state.isPinching = true;
        state.chord = newChord;
      } else if (currentlyPinching && state.isPinching && newChord !== state.chord) {
        if (state.chord) synth.triggerRelease(CHORDS[state.chord]);
        synth.triggerAttack(CHORDS[newChord]);
        state.chord = newChord;
      } else if (!currentlyPinching && state.isPinching) {
        if (state.chord) synth.triggerRelease(CHORDS[state.chord]);
        state.isPinching = false;
        state.chord = null;
      }

      updated[i] = state.chord;
    }

    setActiveChords([...updated]);
  }, [hands, isInitialized]);

  // Keep singular activeChord for backward-compat (first active hand wins)
  const activeChord = activeChords[0] ?? activeChords[1] ?? null;

  return { activeChord, activeChords, initialize, isInitialized };
};

