import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://yourclient.com', // ← update before deploy
  vite: {
    plugins: [tailwindcss()],
    json: {
      stringify: 'auto',
    },
  },
});
