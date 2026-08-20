import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Дев-прокси на локальный PHP-бэк raion-handoff (HANDOFF §9: php -S localhost:8000).
// Адрес переопределяется через VITE_API_TARGET; без бэка работают MSW-моки (npm run dev:mock).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': { target: env.VITE_API_TARGET || 'http://localhost:8000', changeOrigin: true },
      },
    },
  }
})
