import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useDrawStore } from '../store/drawStore';
import type { DrawParticipantPreview, DrawWinner } from '../store/drawStore';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:3000';

// Instância única do socket, namespace '/draw'
export const socket: Socket = io(`${SOCKET_URL}/draw`, {
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  // Sem isso, o ngrok free tier intercepta o polling/handshake do socket.io
  // com uma página HTML de aviso em vez de deixar passar pro backend.
  extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
});

// Conecta ao namespace /draw e entra na sala da campanha (isolamento real via
// Socket.IO rooms no backend — sem isso, sorteios de campanhas diferentes se
// misturariam). Usado tanto pela tela pública de sorteio quanto pelo admin.
export const useSocket = (campaignId?: string) => {
  const navigate = useNavigate();
  const { token, role } = useAuthStore();
  const {
    setDrawStarted,
    setParticipants,
    setWinner,
    setSessionEnded,
    setOnlineCount,
    setRevoked,
    clearDraw,
  } = useDrawStore();

  useEffect(() => {
    if (token) {
      socket.auth = { token };
      if (!socket.connected) socket.connect();
    } else if (socket.connected) {
      socket.disconnect();
    }
  }, [token]);

  useEffect(() => {
    if (!campaignId) return;

    const join = () => socket.emit('join', { campaignId });
    socket.on('connect', join);
    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      socket.emit('leave', { campaignId });
    };
  }, [campaignId]);

  useEffect(() => {
    const onDrawStarted = (data: { drawId: string; sessionId?: string }) => {
      setDrawStarted(data);
      if (role === 'participant') navigate('/draw/watch');
    };

    const onParticipants = (data: { participants: DrawParticipantPreview[]; totalTickets: number; othersTickets: number; othersCount: number }) => {
      setParticipants(data);
    };

    const onWinner = (data: DrawWinner) => {
      setWinner(data);
    };

    const onSessionEnded = (data: { reason: 'exhausted' | 'manual' }) => {
      setSessionEnded(data.reason);
    };

    const onCancelled = () => {
      clearDraw();
      if (role === 'participant') navigate('/dashboard');
    };

    const onStats = (data: { onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
    };

    const onRevoked = () => {
      setRevoked();
    };

    socket.on('draw:started', onDrawStarted);
    socket.on('draw:participants', onParticipants);
    socket.on('draw:winner', onWinner);
    socket.on('draw:sessionEnded', onSessionEnded);
    socket.on('draw:cancelled', onCancelled);
    socket.on('draw:stats', onStats);
    socket.on('draw:revoked', onRevoked);

    return () => {
      socket.off('draw:started', onDrawStarted);
      socket.off('draw:participants', onParticipants);
      socket.off('draw:winner', onWinner);
      socket.off('draw:sessionEnded', onSessionEnded);
      socket.off('draw:cancelled', onCancelled);
      socket.off('draw:stats', onStats);
      socket.off('draw:revoked', onRevoked);
    };
  }, [role, navigate, setDrawStarted, setParticipants, setWinner, setSessionEnded, setOnlineCount, setRevoked, clearDraw]);

  return { socket, isConnected: socket.connected };
};
