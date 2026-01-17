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
    minify: false,
  },
  performance: {
    // 开启 Bundle 分析，看看到底是什么占用了空间
    // bundleAnalyze: {}, 
    chunkSplit: {
      strategy: 'split-by-experience',
    },
    buildCache: true,
  },
  html: {
    template: './public/index.html', // 自定义 HTML
    inject: true,
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-dom/client': 'ReactDOMClient',
    antd: 'antd',
  },
  tools: {
    rspack: (config, { appendPlugins, rspack }) => {
      // 外部化 React/ReactDOM/antd
      config.externals = {
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOMClient',
        antd: 'antd',
      };

      // 禁止拆分这些库
      if (config.optimization?.splitChunks) {
        config.optimization.splitChunks.cacheGroups = {
          default: false,
          vendors: false,
        };
      }
    },
  },
});
