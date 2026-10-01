// src/hooks/useRealtimeGame.ts
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type GameMode = 'compete' | 'team';

export interface PlayerPeer {
  userId: string;
  displayName: string;
  gameData: any;
  score: number;
  isFinished: boolean;
}

export function useRealtimeGame(
  roomCode: string,
  currentUser: { id: string; name: string },
  onTeamWordReceived?: (word: string, contributor: string) => void,
  onModeChanged?: (mode: GameMode) => void
) {
  const [peers, setPeers] = useState<Record<string, PlayerPeer>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  const latestLocalStateRef = useRef<{ gameData: any; score: number; isFinished: boolean }>({
    gameData: null,
    score: 0,
    isFinished: false,
  });

  // Keep callback handlers fresh in refs to avoid re-subscribing channels unnecessarily
  const onTeamWordReceivedRef = useRef(onTeamWordReceived);
  useEffect(() => {
    onTeamWordReceivedRef.current = onTeamWordReceived;
  }, [onTeamWordReceived]);

  const onModeChangedRef = useRef(onModeChanged);
  useEffect(() => {
    onModeChangedRef.current = onModeChanged;
  }, [onModeChanged]);

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

  // Broadcast word found during Co-op Team mode
  const broadcastTeamWord = useCallback(
    (word: string) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'team_word_sync',
        payload: { word, contributor: currentUser.name, userId: currentUser.id },
      });
    },
    [currentUser]
  );

  // Broadcast mode change from the host
  const broadcastGameMode = useCallback((mode: GameMode) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'game_mode_change',
      payload: { mode },
    });
  }, []);

  useEffect(() => {
    if (!roomCode || !currentUser.id) return;

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

    // 2. Listen for Co-op Team shared words
    channel.on('broadcast', { event: 'team_word_sync' }, ({ payload }) => {
      if (!payload || payload.userId === currentUser.id) return;
      if (onTeamWordReceivedRef.current) {
        onTeamWordReceivedRef.current(payload.word, payload.contributor);
      }
    });

    // 3. Listen for Mode Changes from the Host
    channel.on('broadcast', { event: 'game_mode_change' }, ({ payload }) => {
      if (onModeChangedRef.current && payload?.mode) {
        onModeChangedRef.current(payload.mode);
      }
    });

    // 4. Sync current state when a new peer joins
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

    // 5. Clean up disconnected peers
    channel.on('presence', { event: 'leave' }, ({ key }) => {
      setPeers((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    });

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

  return { peers, broadcastState, broadcastTeamWord, broadcastGameMode };
}