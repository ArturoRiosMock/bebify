import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { homeContentDevApi } from './scripts/vite-home-content-dev.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const shopDomain =
    env.VITE_SHOPIFY_STORE_DOMAIN?.replace(/\r?\n/g, '').trim() ||
    'mr-brown-mayoreo.myshopify.com'

  return {
    plugins: [
      react(),
      tailwindcss(),
      homeContentDevApi(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],

    server: {
      proxy: {
        '/tools/customr': {
          target: `https://${shopDomain}`,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
