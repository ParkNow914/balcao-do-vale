import { defineConfig } from 'astro/config';

// SSR nos Cloudflare Workers entra na Onda 2 (adapter @astrojs/cloudflare);
// até lá o site é estático — perfeito para a landing e o guia.
export default defineConfig({
  site: 'https://balcaodovale.com.br',
});
