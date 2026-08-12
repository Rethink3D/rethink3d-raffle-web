interface ImportMetaEnv {
  readonly VITE_THEME?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
