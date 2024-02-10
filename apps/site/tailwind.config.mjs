import flowBitePlugin from 'flowbite/plugin';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  content: ['src/**/*.{ts,tsx}', '../../node_modules/flowbite-react/lib/esm/**/*.js'],
  plugins: [
    ({ addComponents }) => {
      flowBitePlugin,
        addComponents({
          '.layer-absolute': {
            '@apply absolute left-0 top-0 w-full h-full': {},
          },
        });
    },
  ],
};
