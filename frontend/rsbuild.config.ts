import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  dev: {
    progressBar: true,
  },
  output: {
    assetPrefix: '/',
  },
});
