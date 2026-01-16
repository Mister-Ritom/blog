import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sanity from '@sanity/astro';
import sitemap from '@astrojs/sitemap';
import { sanityConfig } from './src/utils/sanity-client';

// https://astro.build/config
export default defineConfig({
    site: process.env.PUBLIC_SITE_URL || 'https://ritom.netlify.app',
    image: {
        domains: ['cdn.sanity.io']
    },
    integrations: [
        sanity(sanityConfig),
        sitemap()
    ],
    vite: {
        plugins: [tailwindcss()],
        server: {
            hmr: { path: '/vite-hmr/' },
            allowedHosts: ['.netlify.app']
        }
    },
    server: {
        port: 3000
    }
});
