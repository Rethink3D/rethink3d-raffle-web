import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LogOut,
  Ticket as TicketIcon,
  User as UserIcon,
  Shield,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import logo from "../../assets/Logo.webp";

export const Header: React.FC = () => {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  // Monitora a rolagem para ocultar ou exibir o Header dinamicamente
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // Sempre visível no topo da página
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Rolando para baixo -> esconde o header
        setVisible(false);
      } else {
        // Rolando para cima -> mostra o header
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      if (role === "participant" && user) {
        try {
          const res = await api.get("/tickets/me");
          if (!isMounted) return;

          if (Array.isArray(res.data)) {
            const total = res.data.reduce(
              (acc: number, t: any) => acc + (t.quantity || 0),
              0,
            );
            setTicketCount(total);
          } else if (typeof res.data === "number") {
            setTicketCount(res.data);
          } else if (res.data && typeof res.data.total === "number") {
            setTicketCount(res.data.total);
          } else if (res.data && typeof res.data.quantity === "number") {
            setTicketCount(res.data.quantity);
          }
        } catch (err) {
          console.error("Failed to load tickets count:", err);
        }
      }
    };

    fetchTickets();

    // Poll ticket count every 15 seconds to keep it fresh
    const interval = setInterval(fetchTickets, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [role, user]);

  const handleLogout = () => {
    logout();
    if (role === "admin") {
      navigate("/admin/login");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className={`fixed top-0 left-0 w-full bg-cyber-surface/70 border-b border-cyber-border/80 backdrop-blur-md z-40 select-none transition-transform duration-300 ${
      visible ? "translate-y-0" : "-translate-y-full"
    }`}>
      {/* Visual cyber line under Header */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-secondary to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-2">
        <Link
          to={role === "admin" ? "/admin" : "/"}
          className="group flex items-center shrink-0"
        >
          <img
            src={logo}
            alt="Rethink3D x MageXP"
            className="h-12 sm:h-20 md:h-24 w-auto object-contain shrink-0"
            draggable={false}
          />
        </Link>

        {/* User Identity and Actions */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* User Profile Summary */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-rajdhani font-bold text-white tracking-wide uppercase">
                {user.name}
              </span>
              <span className="text-[9px] font-mono tracking-widest text-cyber-muted -mt-0.5 uppercase flex items-center justify-end gap-1">
                {role === "admin" ? (
                  <>
                    <Shield size={10} className="text-cyber-accent" />
                    [ADMIN]
                  </>
                ) : (
                  <>
                    <UserIcon size={10} className="text-cyber-secondary" />
                    [PARTICIPANT]
                  </>
                )}
              </span>
            </div>

            {/* Ticket / Coin Display (Participant only) */}
            {role === "participant" && (
              <div className="flex items-center gap-2 bg-cyber-accent/10 border border-cyber-accent/50 rounded px-3 py-1.5 glow-accent text-cyber-accent animate-pulse-glow">
                <TicketIcon size={15} />
                <div className="flex items-baseline gap-1">
                  <span className="font-orbitron font-extrabold text-sm tracking-tighter">
                    {ticketCount}
                  </span>
                  <span className="font-rajdhani text-[9px] uppercase font-bold tracking-widest">
                    TKTS
                  </span>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout session"
              className="relative p-2 rounded border border-cyber-border hover:border-cyber-danger/50 text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={16} />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyber-danger rounded-full opacity-0 hover:opacity-100 transition-opacity" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Link
              to="/login"
              className="text-xs font-orbitron uppercase border border-cyber-border text-cyber-muted px-3 sm:px-4 py-2 hover:border-cyber-secondary hover:text-cyber-secondary transition-all rounded shrink-0 whitespace-nowrap"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="text-xs font-orbitron uppercase border border-cyber-primary bg-cyber-primary/10 text-white px-3 sm:px-4 py-2 hover:bg-cyber-primary hover:glow-primary transition-all rounded shrink-0 whitespace-nowrap"
            >
              Cadastrar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
