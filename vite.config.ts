import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function themeHtml(theme: string): Plugin {
  return {
    name: 'rethink-theme-html',
    transformIndexHtml(html) {
      let out = html.replace(
        '<html lang="pt-BR">',
        `<html lang="pt-BR" data-theme="${theme}">`
      )
      if (theme === 'feira') {
        out = out
          .replace(
            /\s*<script src="https:\/\/unpkg\.com\/@lottiefiles[^>]*><\/script>/g,
            ''
          )
          .replace(
            /family=Inter[^"]*/g,
            'family=Figtree:wght@400;500;600;700;800&display=swap'
          )
      }
      return out
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const theme = env.VITE_THEME === 'cyber' ? 'cyber' : 'feira'

  return {
    plugins: [react(), themeHtml(theme)],
    build: {
      // Ativa source maps somente em dev, reduz tamanho do bundle em prod
      sourcemap: false,
      // Alerta a partir de 400KB por chunk
      chunkSizeWarningLimit: 400,
      rollupOptions: {
        output: {
          // Separação manual de chunks para melhor cache hit e carregamento paralelo
          manualChunks(id: string) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/zustand') || id.includes('node_modules/@tanstack')) {
              return 'vendor-state';
            }
            if (id.includes('node_modules/axios') || id.includes('node_modules/socket.io-client')) {
              return 'vendor-io';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
    // Otimizações de dev server
    server: {
      port: 5173,
      // Escuta em todas as interfaces de rede (não só localhost), permitindo
      // acessar o dev server a partir de outros dispositivos na mesma rede local.
      host: true,
      // Libera qualquer hostname (ex: subdomínio aleatório do ngrok) — o Vite
      // bloqueia hosts desconhecidos por padrão. Uso temporário/dev apenas.
      allowedHosts: true,
    },
  }
})
