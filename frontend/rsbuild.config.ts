import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [
    pluginReact({
      fastRefresh: false,
    }),
  ],

  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://backend:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_TARGET || 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
  dev: {
    progressBar: true,
  },
  output: {
    assetPrefix: '/',
    legalComments: 'none',
  },
  performance: {
    // 开启 Bundle 分析，看看到底是什么占用了空间
    // bundleAnalyze: {}, 
    chunkSplit: {
      strategy: 'split-by-experience',
    },
    buildCache: true,
  },
  tools: {
     rspack: (config, { appendPlugins, rspack }) => {
       // 过滤 dayjs 的语言包，只保留中文
       appendPlugins(new rspack.IgnorePlugin({
         resourceRegExp: /^\.\/locale$/,
         contextRegExp: /dayjs$/,
       }));
     },
  },
});
