import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useDrawStore } from '../store/drawStore';
import type { DrawWinner } from '../store/drawStore';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:3000';

// Single socket instance for the '/draw' namespace
export const socket: Socket = io(`${SOCKET_URL}/draw`, {
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export const useSocket = (campaignId?: string) => {
  const navigate = useNavigate();
  const { token, user, role } = useAuthStore();
  const {
    setStatus,
    setDrawDetails,
    setWinner,
    setIsSpinning,
    setStats,
    clearDraw,
  } = useDrawStore();

  // 1. Manage socket connection state based on authentication token
  useEffect(() => {
    if (token) {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();
      }
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
    }

    return () => {
      // We don't necessarily disconnect on every re-render, only when token changes/unmounts
    };
  }, [token]);

  // 2. Manage room joins on connect and/or when user/campaignId changes
  useEffect(() => {
    const handleConnect = () => {
      console.log('Socket connected successfully to /draw namespace');
      if (role === 'participant' && user && campaignId) {
        socket.emit('participant:join', { userId: user.id, campaignId });
        console.log(`Joined campaign room: ${campaignId} as participant: ${user.id}`);
      } else if (role === 'admin' && user) {
        socket.emit('admin:join', { adminId: user.id });
        console.log(`Joined admin room as admin: ${user.id}`);
      }
    };

    socket.on('connect', handleConnect);

    // If socket is already connected when this effect runs, join room immediately
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [role, user, campaignId]);

  // 3. Register real-time draw and stats event listeners
  useEffect(() => {
    const onDrawStarted = (data: { drawId: string; campaignName: string; prize: any }) => {
      console.log('Socket Event - draw:started:', data);
      setStatus('IN_PROGRESS');
      setDrawDetails({
        drawId: data.drawId,
        campaignName: data.campaignName,
        prize: data.prize,
      });
      if (role === 'participant') {
        navigate('/draw/watch');
      }
    };

    const onDrawSpinning = () => {
      console.log('Socket Event - draw:spinning');
      setIsSpinning(true);
    };

    const onDrawWinner = (winner: DrawWinner) => {
      console.log('Socket Event - draw:winner:', winner);
      setIsSpinning(false);
      setWinner(winner);
      setStatus('COMPLETED');
    };

    const onDrawCancelled = () => {
      console.log('Socket Event - draw:cancelled');
      clearDraw();
      if (role === 'participant') {
        navigate('/dashboard');
      }
    };

    const onStatsUpdate = (stats: { participantCount?: number; onlineCount?: number }) => {
      console.log('Socket Event - stats:update:', stats);
      setStats(stats);
    };

    socket.on('draw:started', onDrawStarted);
    socket.on('draw:spinning', onDrawSpinning);
    socket.on('draw:winner', onDrawWinner);
    socket.on('draw:cancelled', onDrawCancelled);
    socket.on('stats:update', onStatsUpdate);

    return () => {
      socket.off('draw:started', onDrawStarted);
      socket.off('draw:spinning', onDrawSpinning);
      socket.off('draw:winner', onDrawWinner);
      socket.off('draw:cancelled', onDrawCancelled);
      socket.off('stats:update', onStatsUpdate);
    };
  }, [role, navigate, setStatus, setDrawDetails, setIsSpinning, setWinner, clearDraw, setStats]);

  return {
    socket,
    isConnected: socket.connected,
  };
};
