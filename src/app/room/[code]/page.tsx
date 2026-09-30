'use client';

import React, { useState, useId } from 'react';
import { useParams } from 'next/navigation';
import { useRealtimeGame } from '@/hooks/useRealtimeGame';
import SpellingBeePlayer from '@/components/games/SpellingBeePlayer';
import SpellingBeeSpectator from '@/components/games/SpellingBeeSpectator';
import { Users, Gamepad2, Copy, Check } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const roomCode = (params.code as string) || '';

  // Generate a temporary local user ID and random guest name for testing
  const fallbackId = useId();
  const [currentUser] = useState(() => {
    if (typeof window === 'undefined') {
      return { id: 'ssr-user', name: 'Player' };
    }
    let id = sessionStorage.getItem('puzzle_user_id');
    let name = sessionStorage.getItem('puzzle_user_name');
    if (!id) {
      id = 'user-' + Math.random().toString(36).substring(2, 9);
      name = 'Player-' + Math.floor(1000 + Math.random() * 9000);
      sessionStorage.setItem('puzzle_user_id', id);
      sessionStorage.setItem('puzzle_user_name', name);
    }
    return { id, name };
  });

  const [viewMode, setViewMode] = useState<'play' | 'spectate'>('play');
  const [copied, setCopied] = useState(false);

  // Hook into the Supabase WebSocket channel
  const { peers, broadcastState } = useRealtimeGame(roomCode, currentUser);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Room</span>
            <span className="text-xl font-black text-amber-400 font-mono">{roomCode}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Invite'}
          </button>
        </div>

        {/* View Switcher: Play vs Spectate */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('play')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'play'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> My Game
          </button>
          <button
            onClick={() => setViewMode('spectate')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'spectate'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Spectate ({Object.keys(peers).length})
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex items-center justify-center">
        {viewMode === 'play' ? (
          <SpellingBeePlayer
            seed={roomCode}
            onStateChange={({ foundWords, score }) =>
              broadcastState({ foundWords, score }, score)
            }
          />
        ) : (
          <div className="w-full">
            {Object.keys(peers).length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No other players connected yet.</p>
                <p className="text-xs text-slate-600 mt-1">Open this link in another tab or send it to a friend!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(peers).map((peer) => (
                  <div key={peer.userId} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-200">{peer.displayName}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Live
                      </span>
                    </div>
                    <SpellingBeeSpectator
                      score={peer.score || 0}
                      foundWords={peer.gameData?.foundWords || []}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}