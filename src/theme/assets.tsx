import React from 'react';
import { THEME } from './current';

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

export const ThemeAsset: React.FC<ThemeAssetProps> = ({ kind, size = 100, className }) => {
  if (kind === 'loader') {
    return (
      <div className={className}>
        {THEME === 'cyber' ? <PokeballLoader size={size} /> : <RingLoader size={size} />}
      </div>
    );
  }
  return null;
};
