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
    return THEME === 'cyber' ? null : <HeroPolygons className={className} />;
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
