import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages project site is served under /<repo>/; './' keeps
  // assets relative so the same build works for Pages and Capacitor.
  base: './',
  plugins: [react(), tailwindcss()],
});
