import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend chalu hole (USE_DEMO_DATA = false), /api request gulo backend e jabe.
// Backend port alada hole nicher target ta change koro.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
