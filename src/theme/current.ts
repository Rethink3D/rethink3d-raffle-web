export type ThemeId = 'feira' | 'cyber';

export const THEME: ThemeId =
  import.meta.env.VITE_THEME === 'cyber' ? 'cyber' : 'feira';
