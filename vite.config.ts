import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
  },
})
