export type ThemeId = 'padrao' | 'cyber';

export const THEME: ThemeId =
  import.meta.env.VITE_THEME === 'cyber' ? 'cyber' : 'padrao';
