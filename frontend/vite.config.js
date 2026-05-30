import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://51.20.89.225:3000',
        changeOrigin: true,
      },
      '/predict': {
        target: 'http://51.20.89.225:5001',
        changeOrigin: true,
      },
    },
  },
})
