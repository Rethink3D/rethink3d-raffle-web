export type ThemeId = 'padrao' | 'cyber' | 'universoif';

const THEMES: readonly ThemeId[] = ['padrao', 'cyber', 'universoif'];

export const THEME: ThemeId = THEMES.includes(import.meta.env.VITE_THEME as ThemeId)
  ? (import.meta.env.VITE_THEME as ThemeId)
  : 'padrao';
