// src/hooks/useRealtimeGame.ts
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PlayerPeer {
  userId: string;
  displayName: string;
  gameData: any;
  score: number;
  isFinished: boolean;
}

export function useRealtimeGame(
  roomCode: string,
  currentUser: { id: string; name: string }
) {
  const [peers, setPeers] = useState<Record<string, PlayerPeer>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Keep the latest local game data in a ref so we can send it when new peers arrive
  const latestLocalStateRef = useRef<{ gameData: any; score: number; isFinished: boolean }>({
    gameData: null,
    score: 0,
    isFinished: false,
  });

  // Reliable broadcast emitter
  const broadcastState = useCallback(
    (gameData: any, score = 0, isFinished = false) => {
      latestLocalStateRef.current = { gameData, score, isFinished };

      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'player_move',
        payload: {
          userId: currentUser.id,
          displayName: currentUser.name,
          gameData,
          score,
          isFinished,
        },
      });
    },
    [currentUser]
  );

  useEffect(() => {
    if (!roomCode || !currentUser.id) return;

    // Supabase Channel with self: false and proper presence tracking
    const channel: RealtimeChannel = supabase.channel(`game_room_${roomCode.toLowerCase()}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: currentUser.id },
      },
    });

    // 1. Listen for moves from other players
    channel.on('broadcast', { event: 'player_move' }, ({ payload }) => {
      if (!payload || payload.userId === currentUser.id) return;

      setPeers((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          displayName: payload.displayName || 'Anonymous',
          gameData: payload.gameData,
          score: payload.score ?? 0,
          isFinished: payload.isFinished ?? false,
        },
      }));
    });

    // 2. When someone joins, send our current state so they immediately see our score/words!
    channel.on('presence', { event: 'join' }, ({ key }) => {
      if (key !== currentUser.id && latestLocalStateRef.current.gameData) {
        channel.send({
          type: 'broadcast',
          event: 'player_move',
          payload: {
            userId: currentUser.id,
            displayName: currentUser.name,
            ...latestLocalStateRef.current,
          },
        });
      }
    });

    // 3. Remove peer when they close the tab
    channel.on('presence', { event: 'leave' }, ({ key }) => {
      setPeers((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: currentUser.id,
          displayName: currentUser.name,
          joinedAt: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, currentUser.id, currentUser.name]);

  return { peers, broadcastState };
}