// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Gamepad2 } from 'lucide-react';

export default function LobbyPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoom = () => {
    // Generate a clean 6-character room code (e.g., K9X2P4)
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/room/${randomCode}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode) {
      router.push(`/room/${cleanCode}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-amber-400 selection:text-slate-950">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-xs font-semibold text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Realtime Multiplayer Puzzle Hub</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-50 flex items-center justify-center gap-3">
            <Gamepad2 className="w-10 h-10 text-amber-400" />
            HiveMind
          </h1>
          <p className="text-sm text-slate-400">
            Play solo or invite your friends to compete and spectate live attempts in real time.
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Create Button */}
          <button
            onClick={handleCreateRoom}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-lg transition active:scale-[0.98]"
          >
            Create New Room
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative flex items-center justify-center">
            <span className="absolute border-t border-slate-800 w-full" />
            <span className="relative bg-slate-900 px-3 text-xs uppercase font-bold text-slate-500">
              or join existing room
            </span>
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoinRoom} className="space-y-3">
            <input
              type="text"
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 outline-none rounded-xl px-4 py-3 font-mono text-center tracking-widest text-slate-100 placeholder:text-slate-600 transition font-bold"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold rounded-xl transition text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}