import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Header } from './Header';
import { useAuthStore } from '../../store/authStore';
import {
  Menu, X, LayoutDashboard, Award,
  Target, Users, Gift, PlayCircle, Trophy
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { role, user } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = role === 'admin';

  // Links de navegação do menu administrativo
  const adminLinks = [
    { name: 'Painel', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Campanhas', path: '/admin/campaigns', icon: <Award size={18} /> },
    { name: 'Missões', path: '/admin/missions', icon: <Target size={18} /> },
    { name: 'Participantes', path: '/admin/participants', icon: <Users size={18} /> },
    { name: 'Prêmios', path: '/admin/prizes', icon: <Gift size={18} /> },
    { name: 'Sorteio', path: '/admin/draw-control', icon: <PlayCircle size={18} /> },
    { name: 'Ranking', path: '/admin/ranking', icon: <Trophy size={18} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative pt-24">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 pointer-events-none cyber-grid opacity-10 z-0" />

      {/* Top Header */}
      <Header />

      <div className="flex flex-1 relative z-10">
        {/* Admin Navigation Sidebar (Desktop) */}
        {isAdmin && user && (
          <aside className="hidden md:flex flex-col w-64 bg-cyber-surface/90 border-r border-cyber-border/80 p-5 shrink-0">
            <div className="text-[10px] font-mono tracking-widest text-cyber-accent uppercase mb-5">
              Menu Administrativo
            </div>

            <nav className="flex-1 flex flex-col gap-2">
              {adminLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded font-rajdhani font-bold text-sm tracking-wider uppercase transition-all duration-200 border
                      ${active 
                        ? 'bg-cyber-primary/10 border-cyber-primary text-white glow-primary' 
                        : 'border-transparent text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/50 hover:border-cyber-border/50'}
                    `}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

          </aside>
        )}

        {/* Mobile Admin Sidebar Toggle Trigger */}
        {isAdmin && user && (
          <div className="md:hidden fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3.5 rounded-full bg-cyber-primary text-white glow-primary border border-cyber-primary focus:outline-none shadow-lg cursor-pointer"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}

        {/* Mobile Admin Sidebar Drawer Overlay */}
        {isAdmin && user && sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar drawer content */}
            <aside className="relative flex flex-col w-64 max-w-xs bg-cyber-surface border-r border-cyber-border h-full p-5 z-50">
              <div className="text-[10px] font-mono tracking-widest text-cyber-accent uppercase mb-6">
                Menu Administrativo
              </div>

              <nav className="flex-1 flex flex-col gap-2">
                {adminLinks.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded font-rajdhani font-bold text-sm tracking-wider uppercase transition-all duration-200 border
                        ${active 
                          ? 'bg-cyber-primary/10 border-cyber-primary text-white glow-primary' 
                          : 'border-transparent text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface/50 hover:border-cyber-border/50'}
                      `}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>

            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};
