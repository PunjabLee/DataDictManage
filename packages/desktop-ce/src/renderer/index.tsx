/**
 * @file index.tsx
 * @description React 渲染进程入口
 * @layer Desktop CE — Renderer
 *
 * @module @ddm/desktop-ce
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
