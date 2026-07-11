import React from 'react';
import { Trophy, Ticket as TicketIcon } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  // ID do usuário logado — realça a linha dele na lista, se estiver no top 10.
  highlightUserId?: string;
}

const RANK_STYLES: Record<number, { badge: string; row: string }> = {
  1: {
    badge: 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-black shadow-[0_0_12px_rgba(250,204,21,0.5)]',
    row: 'border-yellow-400/50 bg-yellow-400/5',
  },
  2: {
    badge: 'bg-gradient-to-br from-slate-200 to-slate-400 text-black shadow-[0_0_10px_rgba(203,213,225,0.4)]',
    row: 'border-slate-300/40 bg-slate-300/5',
  },
  3: {
    badge: 'bg-gradient-to-br from-orange-400 to-orange-600 text-black shadow-[0_0_10px_rgba(251,146,60,0.4)]',
    row: 'border-orange-400/40 bg-orange-400/5',
  },
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, highlightUserId }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 font-mono text-cyber-muted text-xs uppercase">
        Ninguém pontuou nesta campanha ainda.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const podium = RANK_STYLES[entry.rank];
        const isMe = entry.userId === highlightUserId;

        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              podium ? podium.row : 'border-cyber-border/60 bg-cyber-surface/40'
            } ${isMe ? 'ring-2 ring-cyber-secondary/70' : ''}`}
          >
            <div
              className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-full font-orbitron font-black text-sm ${
                podium ? podium.badge : 'bg-cyber-bg border border-cyber-border text-cyber-muted'
              }`}
            >
              {entry.rank}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-rajdhani font-bold text-white truncate">
                {entry.name}
                {isMe && <span className="ml-2 text-[10px] font-mono text-cyber-secondary uppercase">Você</span>}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-cyber-success font-orbitron font-extrabold text-sm">
              <TicketIcon size={13} />
              {entry.tickets}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Card de destaque pra posição de quem pediu o ranking, usado quando ela cai
// fora do top 10 exibido acima — sem isso o participante não saberia onde está.
export const MyPositionCard: React.FC<{ entry: LeaderboardEntry }> = ({ entry }) => (
  <div className="flex items-center gap-3 rounded-lg border border-cyber-secondary/60 bg-cyber-secondary/10 p-3">
    <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-cyber-bg border border-cyber-secondary text-cyber-secondary font-orbitron font-black text-sm">
      <Trophy size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-mono text-cyber-secondary uppercase tracking-widest">Sua posição</p>
      <p className="text-sm font-rajdhani font-bold text-white">{entry.rank}º lugar</p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0 text-cyber-success font-orbitron font-extrabold text-sm">
      <TicketIcon size={13} />
      {entry.tickets}
    </div>
  </div>
);

export default Leaderboard;
