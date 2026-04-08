import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['hommies.site', 'www.hommies.site'],
  },
  preview: {
    host: true,
    allowedHosts: ['hommies.site', 'www.hommies.site'],
  },
})
