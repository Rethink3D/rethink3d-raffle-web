import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type ThemeId = 'padrao' | 'cyber' | 'universoif'

interface SobrioHtml {
  fonts: string
  favicon: string
  themeColor: string
  description: string
  title: string
}

const sobrioHtml: Record<Exclude<ThemeId, 'cyber'>, SobrioHtml> = {
  padrao: {
    fonts: 'family=Raleway:wght@600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap',
    favicon: 'type="image/png" href="/favicon-padrao.png"',
    themeColor: '#0B63CE',
    description:
      'Participe do sorteio da Rethink3D na Feira do Empreendedor. Complete desafios, acumule cupons e concorra a prêmios de impressão 3D.',
    title: 'Rethink3D · Sorteio na Feira do Empreendedor',
  },
  universoif: {
    fonts: 'family=Exo+2:wght@600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap',
    favicon: 'type="image/svg+xml" href="/favicon-universoif.svg"',
    themeColor: '#080E34',
    description:
      'Participe do sorteio da Rethink3D no Universo IF 2026 "Ciência Delas". Complete desafios, acumule cupons e concorra a prêmios de impressão 3D.',
    title: 'Rethink3D · Sorteio no Universo IF 2026',
  },
}

function resolveTheme(value: string | undefined): ThemeId {
  return value === 'cyber' || value === 'universoif' ? value : 'padrao'
}

function themeHtml(theme: ThemeId): Plugin {
  return {
    name: 'rethink-theme-html',
    transformIndexHtml(html) {
      const style = theme === 'cyber' ? 'cyber' : 'sobrio'
      const out = html.replace(
        '<html lang="pt-BR">',
        `<html lang="pt-BR" data-theme="${theme}" data-style="${style}">`
      )
      if (theme === 'cyber') return out

      const t = sobrioHtml[theme]
      return out
        .replace(
          /\s*<script src="https:\/\/unpkg\.com\/@lottiefiles[^>]*><\/script>/g,
          ''
        )
        .replace(/family=Inter[^"]*/g, t.fonts)
        .replace('type="image/svg+xml" href="/favicon.svg"', t.favicon)
        .replace('content="#0B63CE"', `content="${t.themeColor}"`)
        .replace(
          'Participe do sorteio gamificado da Rethink3D. Complete missões, acumule cupons e concorra a prêmios exclusivos de impressão 3D em tempo real.',
          t.description
        )
        .replace(
          'Complete missões, acumule cupons e concorra a prêmios exclusivos de impressão 3D.',
          'Complete desafios, acumule cupons e concorra a prêmios de impressão 3D.'
        )
        .replace(
          'Sorteio gamificado ao vivo com missões e prêmios 3D.',
          'Sorteio ao vivo com desafios e prêmios 3D.'
        )
        .replace(/Rethink3D Raffle — Sorteio Gamificado/g, t.title)
        .replace('// Sorteio Gamificado', 'Sorteio Rethink3D')
        .replace(/Sorteio Gamificado/g, t.title)
        .replace('Iniciando sistema...', 'Carregando')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const theme = resolveTheme(env.VITE_THEME)

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
