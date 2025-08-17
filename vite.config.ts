import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || process.cwd()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
  // Dev server config adjusted for GitHub Codespaces / remote proxies
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    // Force local HMR websocket to ws://localhost:5173 to avoid wss proxy issues in remote dev environments
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173,
    },
  },
})
