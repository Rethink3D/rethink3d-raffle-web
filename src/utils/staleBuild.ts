const RELOAD_MARK_KEY = 'stale-build-reload-at';
const RELOAD_GUARD_MS = 30_000;

export const reloadOnceForStaleBuild = (): boolean => {
  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_MARK_KEY) ?? 0);
    if (Date.now() - lastReload < RELOAD_GUARD_MS) return false;
    sessionStorage.setItem(RELOAD_MARK_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
};

export const isStaleBuildError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(message);
};
