import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LogOut,
  Ticket as TicketIcon,
  User as UserIcon,
  Shield,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useTicketRefreshStore } from "../../store/ticketRefreshStore";
import api from "../../services/api";
import { campaignService } from "../../services/campaign.service";
import logo from "../../assets/Logo.webp";

export const Header: React.FC = () => {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const refreshVersion = useTicketRefreshStore((s) => s.version);

  const [, setTicketCount] = useState<number>(0);
  // Valor exibido na tela, que "sobe" suavemente até alcançar ticketCount —
  // separado do valor autoritativo pra permitir a animação de contagem.
  const [displayedTicketCount, setDisplayedTicketCount] = useState<number>(0);
  const [ticketBump, setTicketBump] = useState<{ amount: number } | null>(null);
  const displayedRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const bumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstTicketFetchRef = useRef(true);
  // Enquanto a animação de tickets estiver rolando, o Header não pode se
  // esconder pelo scroll — senão o participante perde o efeito justamente
  // quando ganha cupons (ex: rolou a lista de missões pra baixo).
  const bumpActiveRef = useRef(false);

  const [visible, setVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  // Monitora a rolagem para ocultar ou exibir o Header dinamicamente.
  // Só reage a partir de uma rolagem mínima real (SCROLL_HIDE_THRESHOLD) e
  // ignora variações menores que MIN_DELTA — sem isso, qualquer tremor de
  // scroll (reflow de imagem carregando, barra de endereço do celular
  // recolhendo) já escondia o Header inteiro segundos depois da página abrir.
  useEffect(() => {
    const SCROLL_HIDE_THRESHOLD = 96; // não esconde perto do topo
    const MIN_DELTA = 8; // ignora jitter mínimo

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < SCROLL_HIDE_THRESHOLD) {
        setVisible(true);
      } else if (delta > MIN_DELTA) {
        // Rolando para baixo -> esconde o header (a não ser que o efeito de
        // cupons ganhos esteja tocando agora)
        if (!bumpActiveRef.current) setVisible(false);
      } else if (delta < -MIN_DELTA) {
        // Rolando para cima -> mostra o header
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Anima o número exibido subindo suavemente até o novo total, e dispara um
  // "brilho" (bump + shine + "+N" flutuante) quando os tickets aumentam.
  const animateTicketsTo = (target: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const from = displayedRef.current;
    const start = performance.now();
    const duration = 700;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cúbico
      const value = Math.round(from + (target - from) * eased);
      // Só re-renderiza quando o número exibido muda de verdade — evita
      // dezenas de re-renders por segundo enquanto o valor arredondado é
      // sempre o mesmo, o que ajuda a manter a animação CSS (o brilho) fluida.
      if (value !== displayedRef.current) {
        displayedRef.current = value;
        setDisplayedTicketCount(value);
      }
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else if (displayedRef.current !== target) {
        displayedRef.current = target;
        setDisplayedTicketCount(target);
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  const applyTicketCount = (newCount: number, allowBump: boolean) => {
    setTicketCount((prevCount) => {
      // Primeira carga: só define o valor, sem animação (senão pareceria que
      // o participante acabou de ganhar todos os tickets que já tinha).
      if (isFirstTicketFetchRef.current) {
        isFirstTicketFetchRef.current = false;
        displayedRef.current = newCount;
        setDisplayedTicketCount(newCount);
        return newCount;
      }

      // allowBump só é true quando este fetch foi disparado por uma missão
      // recém-concluída (refreshVersion mudou) — nunca no polling periódico
      // nem em qualquer outra recarga, pra não animar à toa.
      if (allowBump && newCount > prevCount) {
        const diff = newCount - prevCount;
        animateTicketsTo(newCount);
        setTicketBump({ amount: diff });

        // Garante que o Header esteja visível pra não perder a animação —
        // mesmo que o participante tenha rolado a tela pra baixo.
        bumpActiveRef.current = true;
        setVisible(true);

        if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current);
        bumpTimeoutRef.current = setTimeout(() => {
          setTicketBump(null);
          bumpActiveRef.current = false;
        }, 1300);
      } else if (newCount !== prevCount) {
        displayedRef.current = newCount;
        setDisplayedTicketCount(newCount);
      }

      return newCount;
    });
  };

  // Só considera "gatilho de missão concluída" quando refreshVersion muda de
  // fato em relação ao último valor já tratado — na montagem inicial (reload
  // de página) os dois começam iguais, então nunca conta como novo gatilho.
  const lastHandledVersionRef = useRef(refreshVersion);

  useEffect(() => {
    let isMounted = true;
    const isTriggeredRefresh = refreshVersion !== lastHandledVersionRef.current;
    lastHandledVersionRef.current = refreshVersion;

    const fetchTickets = async (allowBump: boolean) => {
      if (role === "participant" && user) {
        try {
          const campaign = await campaignService.getActiveCampaign();
          if (!isMounted) return;
          if (!campaign) {
            applyTicketCount(0, allowBump);
            return;
          }

          const res = await api.get(`/campaigns/${campaign.id}/my-tickets`);
          if (!isMounted) return;

          // Formato real da API: { tickets: Ticket[], total: number }
          if (res.data && typeof res.data.total === "number") {
            applyTicketCount(res.data.total, allowBump);
          } else if (Array.isArray(res.data)) {
            const total = res.data.reduce(
              (acc: number, t: any) => acc + (t.quantity || 0),
              0,
            );
            applyTicketCount(total, allowBump);
          } else if (typeof res.data === "number") {
            applyTicketCount(res.data, allowBump);
          } else if (res.data && typeof res.data.quantity === "number") {
            applyTicketCount(res.data.quantity, allowBump);
          }
        } catch (err) {
          console.error("Failed to load tickets count:", err);
        }
      }
    };

    fetchTickets(isTriggeredRefresh);

    // Poll ticket count every 15 seconds to keep it fresh — nunca anima,
    // só reflete o valor real (evita "bump" surgindo do nada em segundo plano).
    const interval = setInterval(() => fetchTickets(false), 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current);
    };
    // refreshVersion muda assim que uma missão é concluída em qualquer lugar do
    // app, forçando a busca imediata dos tickets em vez de esperar o polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user, refreshVersion]);

  const handleLogout = () => {
    logout();
    if (role === "admin") {
      navigate("/admin/login");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className={`fixed top-0 left-0 w-full overflow-x-hidden bg-cyber-surface/70 border-b border-cyber-border/80 backdrop-blur-md z-40 select-none transition-transform duration-300 ${
      visible ? "translate-y-0" : "-translate-y-full"
    }`}>
      {/* Visual cyber line under Header */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-secondary to-transparent" />

      {/*
        min-w-0 é essencial aqui: sem ele, itens flex nunca encolhem abaixo do
        próprio conteúdo (min-width:auto por padrão), e num container "fixed"
        isso faz o conteúdo vazar pra fora da tela — o celular então expande a
        viewport de layout inteira e dá zoom-out pra caber tudo, escondendo o
        que ficou fora da área visível real. overflow-x-hidden no header (não
        só no body) contém esse vazamento na origem.
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-2 min-w-0">
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
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* User Profile Summary */}
            <div className="hidden sm:flex flex-col text-right min-w-0">
              <span className="text-xs font-rajdhani font-bold text-white tracking-wide uppercase truncate">
                {user.name}
              </span>
              <span className="text-[9px] font-mono tracking-widest text-cyber-muted -mt-0.5 uppercase flex items-center justify-end gap-1">
                {role === "admin" ? (
                  <>
                    <Shield size={10} className="text-cyber-accent" />
                    Administrador
                  </>
                ) : (
                  <>
                    <UserIcon size={10} className="text-cyber-secondary" />
                    Participante
                  </>
                )}
              </span>
            </div>

            {/* Ticket / Coin Display (Participant only) */}
            {role === "participant" && (
              <div
                className={`relative overflow-visible min-w-0 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 bg-cyber-success/10 border border-cyber-success/50 rounded px-2 sm:px-3 py-1.5 text-cyber-success ${
                  // pulse-glow-ticket anima box-shadow (repintura cara) — desligado
                  // durante o bump pra não competir com as animações de
                  // transform/opacity do brilho e travar a suavidade.
                  ticketBump ? "animate-ticket-bump will-change-transform" : "animate-pulse-glow-ticket"
                }`}
              >
                {/* "+N" flutuante quando ganha tickets */}
                {ticketBump && (
                  <span className="pointer-events-none absolute -top-4 right-1 font-orbitron font-extrabold text-xs text-cyber-success animate-float-up-fade will-change-transform">
                    +{ticketBump.amount}
                  </span>
                )}

                {/* Brilho passando por cima do badge — o efeito "shiny" */}
                {ticketBump && (
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-ticket-shine will-change-transform rounded" />
                )}

                <TicketIcon size={15} className="shrink-0" />
                <div className="flex items-baseline gap-1">
                  <span className="font-orbitron font-extrabold text-sm tracking-tighter">
                    {displayedTicketCount}
                  </span>
                  <span className="hidden sm:inline font-rajdhani text-[9px] uppercase font-bold tracking-widest">
                    TKTS
                  </span>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sair"
              className="shrink-0 relative p-2 rounded border border-cyber-border hover:border-cyber-danger/50 text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition-all duration-200 cursor-pointer"
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
