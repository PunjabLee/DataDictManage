/**
 * @file DDLModal.tsx
 * @description DDL 预览弹窗 — 生成并展示 SQL 语句
 * @layer Desktop CE — Renderer / Components
 *
 * @module @ddm/desktop-ce
 */

import React, { useState, useEffect } from 'react'
import { useModelActions } from '../hooks/useModel'
import { useModelStore } from '../store/model.store'

interface DDLModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * DDL 预览弹窗
 */
export const DDLModal: React.FC<DDLModalProps> = ({ isOpen, onClose }) => {
  const { currentModel } = useModelStore()
  const { generateDDL } = useModelActions()

  const [dbType, setDbType] = useState('MYSQL')
  const [ddl, setDDL] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const dbTypes = [
    { value: 'MYSQL', label: 'MySQL 8.0' },
    { value: 'POSTGRESQL', label: 'PostgreSQL 15' },
    { value: 'ORACLE', label: 'Oracle 19c' },
    { value: 'DAMENG', label: '达梦 DM8' },
    { value: 'KINGBASE', label: '金仓 KingbaseES' },
    { value: 'SQLSERVER', label: 'SQL Server 2019' },
    { value: 'CLICKHOUSE', label: 'ClickHouse 24' },
  ]

  useEffect(() => {
    if (isOpen && currentModel) {
      handleGenerate()
    }
  }, [isOpen, dbType])

  const handleGenerate = async () => {
    if (!currentModel) return
    setLoading(true)
    try {
      const result = await generateDDL(dbType)
      setDDL(result.sql || '-- 无 SQL 生成')
    } catch (err) {
      setDDL(`-- 生成失败: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ddl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">DDL 预览</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
          >
            ×
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-100">
          <label className="text-sm text-slate-600">目标数据库:</label>
          <select
            value={dbType}
            onChange={e => setDbType(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dbTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-sm rounded-lg"
          >
            {loading ? '生成中...' : '重新生成'}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm rounded-lg"
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>

        {/* SQL 内容 */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <span className="animate-pulse">生成中...</span>
            </div>
          ) : (
            <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg overflow-x-auto">
              {ddl}
            </pre>
          )}
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default DDLModal
