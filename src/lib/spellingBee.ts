// src/lib/spellingBee.ts
import dictionaryData from './dictionary.json';

export interface SpellingBeePuzzle {
  centerLetter: string;
  outerLetters: string[];
  validWords: Set<string>; // O(1) fast lookup
  maxScore: number;
}

// 1. Convert the entire dictionary into a fast lookup Set once on boot
const FULL_WORD_SET = new Set<string>(dictionaryData.words);
const PANGRAM_LIST: string[] = dictionaryData.pangrams;

// PRNG to ensure every player with the same seed gets the exact same honeycomb
function seedRandom(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function generateSpellingBee(seed: string): SpellingBeePuzzle {
  const rand = seedRandom(seed);

  // Pick a base 7-letter pangram from the curated list
  const basePangram = PANGRAM_LIST[Math.floor(rand() * PANGRAM_LIST.length)] || "PACKAGE";
  const uniqueLetters = Array.from(new Set(basePangram));

  // Deterministically select the golden center letter
  const centerIdx = Math.floor(rand() * uniqueLetters.length);
  const centerLetter = uniqueLetters[centerIdx];
  const outerLetters = uniqueLetters.filter((_, idx) => idx !== centerIdx);

  const allowedSet = new Set(uniqueLetters);
  const validWords = new Set<string>();
  let maxScore = 0;

  // Filter candidate words that can be made with this 7-letter hive
  for (const word of dictionaryData.words) {
    if (word.length >= 4 && word.includes(centerLetter)) {
      let canBuild = true;
      for (let i = 0; i < word.length; i++) {
        if (!allowedSet.has(word[i])) {
          canBuild = false;
          break;
        }
      }
      if (canBuild) {
        validWords.add(word);
        const isPangram = new Set(word).size === 7;
        maxScore += (word.length === 4 ? 1 : word.length) + (isPangram ? 7 : 0);
      }
    }
  }

  return {
    centerLetter,
    outerLetters,
    validWords,
    maxScore: Math.max(maxScore, 50),
  };
}

export function calculateWordPoints(word: string): { points: number; isPangram: boolean } {
  const isPangram = new Set(word).size === 7;
  const points = (word.length === 4 ? 1 : word.length) + (isPangram ? 7 : 0);
  return { points, isPangram };
}