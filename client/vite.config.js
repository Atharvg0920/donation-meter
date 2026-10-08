import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host:true exposes the dev server on your LAN so a phone can open the donation page
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
