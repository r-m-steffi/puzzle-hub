// src/components/games/SpellingBeeSpectator.tsx
import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

interface SpectatorProps {
  score: number;
  foundWords: string[];
}

export default function SpellingBeeSpectator({ score, foundWords }: SpectatorProps) {
  const words = foundWords || [];
  const latestWord = words.length > 0 ? words[0] : null;

  return (
    <div className="flex flex-col gap-3 w-full bg-slate-950 p-4 rounded-lg border border-slate-800/80">
      {/* Live score counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-xl font-black text-slate-100">{score ?? 0}</span>
          <span className="text-xs text-slate-500">pts</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{words.length} words found</span>
        </div>
      </div>

      {/* Latest Word Anagram Preview */}
      <div className="bg-slate-900/90 rounded-md p-2.5 border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Latest solved:</span>
        <span className="font-mono font-bold tracking-wider text-amber-400">
          {latestWord ? `${latestWord.slice(0, 1)}${'*'.repeat(latestWord.length - 1)} (${latestWord.length}L)` : 'None'}
        </span>
      </div>

      {/* Word Length Distribution Progress */}
      <div className="grid grid-cols-4 gap-1 pt-1 text-center font-mono text-[10px]">
        {[4, 5, 6, 7].map((len) => {
          const count = words.filter((w) => (len === 7 ? w.length >= 7 : w.length === len)).length;
          return (
            <div key={len} className="bg-slate-900 border border-slate-800/60 py-1 rounded">
              <span className="text-slate-400 block">{len === 7 ? '7+' : `${len}L`}</span>
              <span className="font-bold text-slate-200">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}