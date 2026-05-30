import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const backend =import.meta.env.BACKEND;
const ai = import.meta.env.AI;
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `${backend}`,
        changeOrigin: true,
      },
      '/predict': {
        target: `${ai}`,
        changeOrigin: true,
      },
    },
  },
})
