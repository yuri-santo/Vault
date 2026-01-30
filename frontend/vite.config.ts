import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // garante dist
  build: { outDir: 'dist' },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    allowedHosts: [
      'vault-ep2w.onrender.com',
      '.onrender.com',
    ],
  },
})
