import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: false,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/uploads': 'http://127.0.0.1:3001',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'react-vendor'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
