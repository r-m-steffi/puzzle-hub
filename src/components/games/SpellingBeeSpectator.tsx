// src/components/games/SpellingBeeSpectator.tsx
import React from 'react';
import { Trophy, CheckCircle2, Handshake, Swords } from 'lucide-react';

interface SpectatorProps {
  score: number;
  foundWords: string[];
  mode: 'compete' | 'team';
}

export default function SpellingBeeSpectator({ score, foundWords, mode }: SpectatorProps) {
  const words = foundWords || [];
  const latestWord = words.length > 0 ? words[0] : null;

  return (
    <div className="flex flex-col gap-3 w-full bg-slate-950 p-4 rounded-lg border border-slate-800/80">
      {/* Header: Score + Mode indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-xl font-black text-slate-100">{score ?? 0}</span>
          <span className="text-xs text-slate-500">pts</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {mode === 'team' ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded font-medium border border-emerald-400/20">
              <Handshake className="w-3.5 h-3.5" /> Co-op
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-medium border border-slate-700">
              <Swords className="w-3.5 h-3.5" /> Versus
            </span>
          )}
        </div>
      </div>

      {/* Mode-specific word details */}
      {mode === 'team' ? (
        // Co-op Mode: Full word visibility
        <div className="space-y-2">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Words Found:
            </span>
            <span className="font-bold text-slate-200">{words.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
            {words.length === 0 ? (
              <span className="text-[11px] text-slate-600">No words found yet...</span>
            ) : (
              words.map((w) => (
                <span
                  key={w}
                  className="text-[11px] font-mono font-semibold bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700/60"
                >
                  {w}
                </span>
              ))
            )}
          </div>
        </div>
      ) : (
        // Versus Mode: Masked words to prevent cheating
        <>
          <div className="bg-slate-900/90 rounded-md p-2.5 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Latest solved:</span>
            <span className="font-mono font-bold tracking-wider text-amber-400">
              {latestWord ? `${latestWord.slice(0, 1)}${'*'.repeat(latestWord.length - 1)} (${latestWord.length}L)` : 'None'}
            </span>
          </div>

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
        </>
      )}
    </div>
  );
}