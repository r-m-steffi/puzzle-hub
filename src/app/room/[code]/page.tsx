// src/app/room/[code]/page.tsx
'use client';

import React, { useState, useId, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useRealtimeGame } from '@/hooks/useRealtimeGame';
import SpellingBeePlayer from '@/components/games/SpellingBeePlayer';
import SpellingBeeSpectator from '@/components/games/SpellingBeeSpectator';
import { Users, Gamepad2, Copy, Check, LogOut, Crown } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomCode = (params.code as string) || '';
  const fallbackId = useId();

  // Stable session user identity
  const [currentUser] = useState<{ id: string; name: string }>(() => {
    if (typeof window === 'undefined') {
      return { id: 'ssr-user', name: 'Player' };
    }
    const savedId = sessionStorage.getItem('puzzle_user_id');
    const savedName = sessionStorage.getItem('puzzle_user_name');
    const id = savedId || 'user-' + Math.random().toString(36).substring(2, 9);
    const name = savedName || 'Player-' + Math.floor(1000 + Math.random() * 9000);

    if (!savedId) sessionStorage.setItem('puzzle_user_id', id);
    if (!savedName) sessionStorage.setItem('puzzle_user_name', name);
    return { id, name };
  });

  // Track room host status
  const [isHost, setIsHost] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostKey = `room_host_${roomCode.toLowerCase()}`;
    const isHostParam = searchParams.get('host') === 'true';

    if (isHostParam) {
      sessionStorage.setItem(hostKey, 'true');
      setIsHost(true);
    } else {
      setIsHost(sessionStorage.getItem(hostKey) === 'true');
    }
  }, [roomCode, searchParams]);

  const [viewMode, setViewMode] = useState<'play' | 'spectate'>('play');
  const [copied, setCopied] = useState(false);

  const { peers, broadcastState } = useRealtimeGame(roomCode, currentUser);

  // Generates clean invite link without the ?host=true parameter
  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const cleanUrl = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(cleanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Leave room: generates a new unique solo room code
  const handleLeaveRoom = () => {
    const soloCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/room/${soloCode}?host=true`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Room</span>
              {isHost && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                  <Crown className="w-2.5 h-2.5" /> Host
                </span>
              )}
            </div>
            <span className="text-xl font-black text-amber-400 font-mono">{roomCode}</span>
          </div>

          {/* Only the Host gets the invite button */}
          {isHost && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-xs font-semibold rounded-lg text-amber-300 border border-amber-400/30 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Invite Players'}
            </button>
          )}

          {/* Leave Room Button */}
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 text-xs font-semibold rounded-lg text-slate-400 border border-slate-700 transition cursor-pointer"
            title="Leave room and start your own game"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave & Play Solo</span>
          </button>
        </div>

        {/* View Switcher: Play vs Spectate */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('play')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'play'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> My Game
          </button>
          <button
            onClick={() => setViewMode('spectate')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                <p className="text-xs text-slate-600 mt-1">
                  {isHost ? 'Use the Invite button above to send the link to friends!' : 'Waiting for host and peers...'}
                </p>
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