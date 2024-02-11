import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [react(), tailwind()],
  ...(process.env.NODE_ENV === 'production' && {
    site: 'https://mati365.github.io',
    base: '/ts-c-compiler',
  }),
});
