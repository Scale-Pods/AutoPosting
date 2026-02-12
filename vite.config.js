import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/webhook': {
          target: env.VITE_WEBHOOK_BASE_URL,
          changeOrigin: true,
          secure: false, // In case of self-signed certs, though hstgr is likely valid
        }
      }
    }
  }
})
