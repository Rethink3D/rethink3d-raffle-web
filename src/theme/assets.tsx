import React from 'react';
import { THEME } from './current';
import nika from '../assets/nika.gif';
import agree from '../assets/agree.gif';
import random3 from '../assets/random3.gif';

export type AssetKind = 'loader' | 'waiting' | 'celebrate' | 'quizFail' | 'heroDecor';

interface ThemeAssetProps {
  kind: AssetKind;
  size?: number;
  className?: string;
}

const PokeballLoader: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{ width: size, height: size }}
    dangerouslySetInnerHTML={{
      __html: `<lottie-player
        src="/Pokeball Loading.json"
        background="transparent"
        speed="1.2"
        style="width: 100%; height: 100%;"
        loop
        autoplay
      ></lottie-player>`,
    }}
  />
);

const RingLoader: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" role="img" aria-label="Carregando">
    <circle
      cx="25" cy="25" r="20" fill="none" strokeWidth="4"
      stroke="rgb(var(--c-border))"
    />
    <circle
      cx="25" cy="25" r="20" fill="none" strokeWidth="4" strokeLinecap="round"
      stroke="rgb(var(--c-primary))"
      strokeDasharray="90 126"
    >
      <animateTransform
        attributeName="transform" type="rotate"
        from="0 25 25" to="360 25 25"
        dur="0.9s" repeatCount="indefinite"
      />
    </circle>
  </svg>
);

const EmptyState: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Nada por aqui ainda">
    <rect x="14" y="26" width="68" height="48" rx="8"
          fill="rgb(var(--c-surface))" stroke="rgb(var(--c-border))" strokeWidth="3" />
    <path d="M14 42h68" stroke="rgb(var(--c-border))" strokeWidth="3" />
    <circle cx="28" cy="34" r="3" fill="rgb(var(--c-muted))" />
    <rect x="26" y="52" width="30" height="5" rx="2.5" fill="rgb(var(--c-border))" />
    <rect x="26" y="62" width="18" height="5" rx="2.5" fill="rgb(var(--c-border))" />
  </svg>
);

const SuccessSeal: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Concluído">
    <circle cx="48" cy="48" r="40" fill="rgb(var(--c-primary))" />
    <circle cx="48" cy="48" r="32" fill="none" stroke="rgb(var(--c-highlight))" strokeWidth="3" />
    <path d="M33 49l11 11 20-22" fill="none" stroke="rgb(var(--c-highlight))"
          strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RetryMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Não foi dessa vez">
    <circle cx="48" cy="48" r="40" fill="rgb(var(--c-surface))"
            stroke="rgb(var(--c-border))" strokeWidth="3" />
    <path d="M62 40a18 18 0 10-2 20" fill="none" stroke="rgb(var(--c-muted))"
          strokeWidth="6" strokeLinecap="round" />
    <path d="M62 28v14h-14" fill="none" stroke="rgb(var(--c-muted))"
          strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeroPolygons: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 300" className={className} aria-hidden="true">
    <polygon points="40,250 130,60 210,250" fill="rgb(var(--c-primary))" opacity="0.9" />
    <polygon points="150,250 240,110 330,250" fill="rgb(var(--c-secondary))" opacity="0.85" />
    <polygon points="230,250 300,150 370,250" fill="rgb(var(--c-highlight))" />
    <polygon points="95,250 155,165 215,250" fill="rgb(var(--c-accent))" opacity="0.75" />
  </svg>
);

const HeroOrbit: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 300" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="orbit-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgb(var(--c-primary))" />
        <stop offset="1" stopColor="rgb(var(--c-accent))" />
      </linearGradient>
      <radialGradient id="orbit-planet" cx="0.35" cy="0.35" r="0.7">
        <stop offset="0" stopColor="rgb(var(--c-glow))" />
        <stop offset="1" stopColor="rgb(var(--c-highlight))" />
      </radialGradient>
    </defs>
    <circle cx="230" cy="170" r="96" fill="none" stroke="url(#orbit-ring)" strokeWidth="6" />
    <circle cx="303" cy="108" r="11" fill="rgb(var(--c-strong))" />
    <circle cx="160" cy="236" r="9" fill="rgb(var(--c-strong))" />
    <circle cx="230" cy="170" r="44" fill="url(#orbit-planet)" opacity="0.9" />
    <ellipse cx="230" cy="170" rx="70" ry="14" fill="none" stroke="rgb(var(--c-secondary))"
             strokeWidth="3" opacity="0.8" transform="rotate(-18 230 170)" />
    <path d="M90 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="rgb(var(--c-strong))" opacity="0.85" />
    <path d="M350 230l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="rgb(var(--c-strong))" opacity="0.7" />
  </svg>
);

const gifByKind: Partial<Record<AssetKind, string>> = {
  waiting: nika,
  celebrate: agree,
  quizFail: random3,
};

const padraoByKind = {
  waiting: EmptyState,
  celebrate: SuccessSeal,
  quizFail: RetryMark,
};

export const ThemeAsset: React.FC<ThemeAssetProps> = ({ kind, size = 100, className }) => {
  if (kind === 'loader') {
    return (
      <div className={className}>
        {THEME === 'cyber' ? <PokeballLoader size={size} /> : <RingLoader size={size} />}
      </div>
    );
  }

  if (kind === 'heroDecor') {
    if (THEME === 'cyber') return null;
    return THEME === 'universoif'
      ? <HeroOrbit className={className} />
      : <HeroPolygons className={className} />;
  }

  if (THEME === 'cyber') {
    return <img src={gifByKind[kind]} alt="" className={className} draggable={false} />;
  }

  const Padrao = padraoByKind[kind];
  return (
    <div className={className}>
      <Padrao size={size} />
    </div>
  );
};
