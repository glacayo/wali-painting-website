import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://walipainting.com',
  vite: {
    plugins: [tailwindcss()],
    json: {
      stringify: 'auto',
    },
  },
});
