/**
 * @file FieldEditor.tsx
 * @description 字段编辑器 — 完整字段属性编辑表单
 * @layer Desktop CE — Renderer / Components
 *
 * @module @ddm/desktop-ce
 */

import React, { useState, useEffect } from 'react'
import { useModelStore } from '../store/model.store'
import { useModelActions } from '../hooks/useModel'
import type { FieldDTO } from '@ddm/core-engine'

/**
 * 字段编辑器组件
 * 当选中字段后显示完整的编辑表单
 */
export const FieldEditor: React.FC<{
  entityId: string
  field: FieldDTO
  onClose: () => void
}> = ({ entityId, field, onClose }) => {
  const { currentModel, updateModel, setError } = useModelStore()
  const { addField, modifyField, removeField } = useModelActions()

  const [formData, setFormData] = useState({
    name: field.name,
    comment: field.comment || '',
    baseType: field.baseType,
    length: field.length || '',
    precision: field.precision || '',
    scale: field.scale || '',
    nullable: field.nullable,
    primaryKey: field.primaryKey,
    unique: field.unique,
    autoIncrement: field.autoIncrement,
    defaultValue: field.defaultValue || '',
  })

  const [saving, setSaving] = useState(false)

  const baseTypes = [
    { value: 'STRING', label: '字符串' },
    { value: 'INT', label: '整数' },
    { value: 'BIGINT', label: '长整数' },
    { value: 'DECIMAL', label: '小数' },
    { value: 'DATETIME', label: '日期时间' },
    { value: 'TEXT', label: '文本' },
    { value: 'BOOLEAN', label: '布尔' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentModel) return

    setSaving(true)
    try {
      await modifyField({
        modelId: currentModel.id,
        entityId: entityId,
        fieldId: field.id,
        name: formData.name,
        comment: formData.comment,
        baseType: formData.baseType,
        length: formData.length ? Number(formData.length) : undefined,
        precision: formData.precision ? Number(formData.precision) : undefined,
        scale: formData.scale ? Number(formData.scale) : undefined,
      })
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentModel) return
    if (!confirm(`确定删除字段 "${field.name}" 吗？`)) return

    try {
      await removeField(currentModel.id, entityId, field.id)
      onClose()
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 字段名 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          字段名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(s => ({ ...s, name: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例如: user_name"
          required
        />
      </div>

      {/* 字段注释 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          注释
        </label>
        <input
          type="text"
          value={formData.comment}
          onChange={e => setFormData(s => ({ ...s, comment: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="字段说明"
        />
      </div>

      {/* 字段类型 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          类型 <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.baseType}
          onChange={e => setFormData(s => ({ ...s, baseType: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {baseTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* 长度/精度 */}
      {(formData.baseType === 'STRING' || formData.baseType === 'DECIMAL') && (
        <div className="grid grid-cols-2 gap-2">
          {formData.baseType === 'STRING' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">长度</label>
              <input
                type="number"
                value={formData.length}
                onChange={e => setFormData(s => ({ ...s, length: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="255"
              />
            </div>
          )}
          {formData.baseType === 'DECIMAL' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">精度</label>
                <input
                  type="number"
                  value={formData.precision}
                  onChange={e => setFormData(s => ({ ...s, precision: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">小数位</label>
                <input
                  type="number"
                  value={formData.scale}
                  onChange={e => setFormData(s => ({ ...s, scale: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="4"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* 约束条件 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">约束</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.nullable}
              onChange={e => setFormData(s => ({ ...s, nullable: e.target.checked }))}
              className="rounded text-blue-500"
            />
            <span>可空</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.primaryKey}
              onChange={e => setFormData(s => ({ ...s, primaryKey: e.target.checked }))}
              className="rounded text-blue-500"
            />
            <span>主键</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.unique}
              onChange={e => setFormData(s => ({ ...s, unique: e.target.checked }))}
              className="rounded text-blue-500"
            />
            <span>唯一</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.autoIncrement}
              onChange={e => setFormData(s => ({ ...s, autoIncrement: e.target.checked }))}
              className="rounded text-blue-500"
            />
            <span>自增</span>
          </label>
        </div>
      </div>

      {/* 默认值 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">默认值</label>
        <input
          type="text"
          value={formData.defaultValue}
          onChange={e => setFormData(s => ({ ...s, defaultValue: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="无"
        />
      </div>

      {/* 按钮组 */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 text-red-500 border border-red-200 hover:bg-red-50 rounded-lg text-sm"
        >
          删除
        </button>
      </div>
    </form>
  )
}

/**
 * 添加新字段表单
 */
export const AddFieldForm: React.FC<{
  entityId: string
  onClose: () => void
}> = ({ entityId, onClose }) => {
  const { currentModel, setError } = useModelStore()
  const { addField } = useModelActions()

  const [formData, setFormData] = useState({
    name: '',
    comment: '',
    baseType: 'STRING',
    length: '255',
    nullable: true,
    primaryKey: false,
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentModel) return

    setSaving(true)
    try {
      await addField({
        modelId: currentModel.id,
        entityId: entityId,
        name: formData.name,
        comment: formData.comment,
        baseType: formData.baseType,
        length: formData.length ? Number(formData.length) : undefined,
        nullable: formData.nullable,
        primaryKey: formData.primaryKey,
      })
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          字段名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(s => ({ ...s, name: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="例如: user_name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">注释</label>
        <input
          type="text"
          value={formData.comment}
          onChange={e => setFormData(s => ({ ...s, comment: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
        <select
          value={formData.baseType}
          onChange={e => setFormData(s => ({ ...s, baseType: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="STRING">字符串</option>
          <option value="INT">整数</option>
          <option value="BIGINT">长整数</option>
          <option value="DECIMAL">小数</option>
          <option value="DATETIME">日期时间</option>
          <option value="TEXT">文本</option>
          <option value="BOOLEAN">布尔</option>
        </select>
      </div>

      {formData.baseType === 'STRING' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">长度</label>
          <input
            type="number"
            value={formData.length}
            onChange={e => setFormData(s => ({ ...s, length: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.nullable}
            onChange={e => setFormData(s => ({ ...s, nullable: e.target.checked }))}
          />
          <span>可空</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.primaryKey}
            onChange={e => setFormData(s => ({ ...s, primaryKey: e.target.checked }))}
          />
          <span>主键</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !formData.name}
          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-sm rounded-lg"
        >
          {saving ? '添加中...' : '添加字段'}
        </button>
      </div>
    </form>
  )
}

export default FieldEditor
