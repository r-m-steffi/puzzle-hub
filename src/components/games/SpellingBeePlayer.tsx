// src/components/games/SpellingBeePlayer.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateSpellingBee, calculateWordPoints, SpellingBeePuzzle } from '@/lib/spellingBee';
import { Delete, Shuffle, Send } from 'lucide-react';

interface Props {
  seed: string;
  onStateChange: (data: { foundWords: string[]; score: number }) => void;
}

export default function SpellingBeePlayer({ seed, onStateChange }: Props) {
  const [puzzle, setPuzzle] = useState<SpellingBeePuzzle | null>(null);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [outerLetters, setOuterLetters] = useState<string[]>([]);

  // Unique storage key scoped to this exact room/seed
  const storageKey = `spelling_bee_save_${seed.toLowerCase()}`;

  // 1. Initialize foundWords and score from localStorage
  const [foundWords, setFoundWords] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved).foundWords || [] : [];
    } catch {
      return [];
    }
  });

  const [score, setScore] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved).score || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Keep a ref to onStateChange to safely trigger on initial mount
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // 2. Generate puzzle and broadcast restored progress on initial mount/refresh
  useEffect(() => {
    const p = generateSpellingBee(seed);
    setPuzzle(p);
    setOuterLetters(p.outerLetters);

    // Announce existing progress to peers if returning to an active game
    if (foundWords.length > 0 || score > 0) {
      onStateChangeRef.current({ foundWords, score });
    }
  }, [seed]);

  // 3. Save progress to localStorage whenever words or score update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({ foundWords, score }));
    }
  }, [foundWords, score, storageKey]);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 1800);
  };

  const handleInputLetter = (char: string) => {
    if (currentInput.length < 16) {
      setCurrentInput((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleShuffle = () => {
    setOuterLetters((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleSubmit = useCallback(() => {
    if (!puzzle) return;
    const word = currentInput.toUpperCase();

    if (word.length < 4) {
      showNotification('Too short (min 4 letters)');
      return;
    }
    if (!word.includes(puzzle.centerLetter)) {
      showNotification(`Missing center letter (${puzzle.centerLetter})`);
      return;
    }
    if (foundWords.includes(word)) {
      showNotification('Already found');
      return;
    }
    if (!puzzle.validWords.has(word)) {
      showNotification('Not in word list');
      return;
    }

    const { points, isPangram } = calculateWordPoints(word);
    const newScore = score + points;
    const updatedWords = [word, ...foundWords];

    setScore(newScore);
    setFoundWords(updatedWords);
    setCurrentInput('');
    showNotification(isPangram ? 'PANGRAM! +' + points : `+${points}`);

    // Broadcast live state to spectator peers
    onStateChange({ foundWords: updatedWords, score: newScore });
  }, [currentInput, puzzle, foundWords, score, onStateChange]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!puzzle) return;
      const key = e.key.toUpperCase();

      if (key === 'ENTER') {
        handleSubmit();
      } else if (key === 'BACKSPACE') {
        handleDelete();
      } else if (puzzle.outerLetters.includes(key) || puzzle.centerLetter === key) {
        handleInputLetter(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [puzzle, handleSubmit]);

  if (!puzzle) return <div className="text-slate-400">Loading puzzle...</div>;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto select-none">
      {/* Score Tracker */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl">
        <div>
          <span className="text-xs uppercase text-slate-400 tracking-wider font-semibold">Your Score</span>
          <div className="text-2xl font-black text-amber-400">{score}</div>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase text-slate-400 tracking-wider font-semibold">Words Found</span>
          <div className="text-lg font-bold text-slate-200">{foundWords.length}</div>
        </div>
      </div>

      {/* Floating notification */}
      <div className="h-6 mb-2">
        {message && (
          <span className="bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow-md animate-bounce">
            {message}
          </span>
        )}
      </div>

      {/* Current typed string */}
      <div className="h-12 flex items-center justify-center tracking-widest text-3xl font-extrabold mb-6 text-slate-100">
        {currentInput.split('').map((char, i) => (
          <span key={i} className={char === puzzle.centerLetter ? 'text-amber-400' : 'text-slate-100'}>
            {char}
          </span>
        ))}
        <span className="w-0.5 h-7 bg-amber-400 ml-1 animate-pulse" />
      </div>

      {/* Honeycomb Hive Layout */}
      <div className="relative w-64 h-64 mb-8">
        <button
          onClick={() => handleInputLetter(puzzle.centerLetter)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-2xl font-black shadow-lg transition active:scale-95"
        >
          {puzzle.centerLetter}
        </button>

        {outerLetters.map((char, index) => {
          const angle = (index * 60 * Math.PI) / 180;
          const radius = 72;
          const x = Math.round(radius * Math.cos(angle));
          const y = Math.round(radius * Math.sin(angle));

          return (
            <button
              key={char + index}
              onClick={() => handleInputLetter(char)}
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
              }}
              className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-xl font-bold border border-slate-700 shadow-md transition active:scale-95"
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* Game controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition"
        >
          <Delete className="w-4 h-4" /> Delete
        </button>
        <button
          onClick={handleShuffle}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          title="Shuffle letters"
        >
          <Shuffle className="w-5 h-5" />
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-sm font-bold shadow-md transition"
        >
          <Send className="w-4 h-4" /> Enter
        </button>
      </div>

      {/* Found words list */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-36 overflow-y-auto">
        <div className="text-xs uppercase font-bold text-slate-500 mb-2">Discovered Words</div>
        <div className="flex flex-wrap gap-1.5">
          {foundWords.length === 0 ? (
            <span className="text-xs text-slate-600">No words found yet...</span>
          ) : (
            foundWords.map((w) => (
              <span key={w} className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded text-xs font-semibold">
                {w}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}