import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/**
 * Vite 配置 — desktop-ce 渲染进程
 * 渲染进程使用 Vite + React，输出到 dist/renderer/
 */
export default defineConfig({
  plugins: [react()],
  base: './',  // Electron file:// 协议需要相对路径
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  resolve: {
    alias: {
      '@ddm/core-engine': resolve(__dirname, '../core-engine/src/index.ts'),
      '@ddm/canvas-render': resolve(__dirname, '../canvas-render/src/index.ts'),
      '@ddm/db-dialect': resolve(__dirname, '../db-dialect/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
  },
})
