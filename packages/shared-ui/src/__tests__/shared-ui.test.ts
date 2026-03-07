/**
 * @file shared-ui.test.ts
 * @description shared-ui 公共组件库单元测试
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Button } from '../src/components/Button'
import { Input } from '../src/components/Input'
import { Select } from '../src/components/Select'
import { Tabs, TabPane } from '../src/components/Tabs'
import { Pagination } from '../src/components/Pagination'
import { useDebounce, useThrottle, useToggle, useLocalStorage } from '../src/hooks'
import { deepClone, uuid, formatDate, formatFileSize, debounce, throttle, isEmpty } from '../src/utils'

// ── 工具函数测试 ────────────────────────────────────────────────────────────

describe('utils', () => {
  describe('deepClone', () => {
    it('应该深拷贝基本类型', () => {
      expect(deepClone(1)).toBe(1)
      expect(deepClone('test')).toBe('test')
      expect(deepClone(true)).toBe(true)
    })

    it('应该深拷贝对象', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)
      expect(cloned).toEqual(obj)
      expect(cloned.b).not.toBe(obj.b)
    })

    it('应该深拷贝数组', () => {
      const arr = [1, 2, { a: 3 }]
      const cloned = deepClone(arr)
      expect(cloned).toEqual(arr)
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('应该处理 Date 对象', () => {
      const date = new Date('2026-03-07')
      const cloned = deepClone(date)
      expect(cloned).toEqual(date)
      expect(cloned).toBeInstanceOf(Date)
    })

    it('应该处理 null 和 undefined', () => {
      expect(deepClone(null)).toBe(null)
      expect(deepClone(undefined)).toBe(undefined)
    })
  })

  describe('uuid', () => {
    it('应该生成有效的 UUID', () => {
      const id = uuid()
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    })

    it('每次调用应该生成不同的 UUID', () => {
      const id1 = uuid()
      const id2 = uuid()
      expect(id1).not.toBe(id2)
    })
  })

  describe('formatDate', () => {
    it('应该格式化日期', () => {
      const result = formatDate('2026-03-07T10:30:00', 'YYYY-MM-DD')
      expect(result).toBe('2026-03-07')
    })

    it('应该格式化完整时间', () => {
      const result = formatDate(new Date('2026-03-07T10:30:45'), 'YYYY-MM-DD HH:mm:ss')
      expect(result).toMatch(/2026-03-07/)
    })
  })

  describe('formatFileSize', () => {
    it('应该格式化字节', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('应该格式化 KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
    })

    it('应该格式化 MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    })

    it('应该格式化 GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })

  describe('isEmpty', () => {
    it('应该检测 null 和 undefined', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
    })

    it('应该检测空字符串', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('  ')).toBe(false)
    })

    it('应该检测空数组', () => {
      expect(isEmpty([])).toBe(true)
      expect(isEmpty([1])).toBe(false)
    })

    it('应该检测空对象', () => {
      expect(isEmpty({})).toBe(true)
      expect(isEmpty({ a: 1 })).toBe(false)
    })
  })

  describe('debounce', () => {
    it('应该延迟执行函数', async () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(fn).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(100)
      
      expect(fn).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })
  })

  describe('throttle', () => {
    it('应该限制函数执行频率', async () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)
      
      throttledFn()
      throttledFn()
      throttledFn()
      
      expect(fn).toHaveBeenCalledTimes(1)
      
      vi.advanceTimersByTime(100)
      throttledFn()
      
      expect(fn).toHaveBeenCalledTimes(2)
      vi.useRealTimers()
    })
  })
})

// ── Hooks 测试 ────────────────────────────────────────────────────────────

describe('hooks', () => {
  describe('useDebounce', () => {
    it('应该延迟更新值', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(({ value }) => useDebounce(value, 100), {
        initialProps: { value: 'initial' }
      })
      
      expect(result.current).toBe('initial')
      
      // 等待延迟时间
      vi.advanceTimersByTime(100)
      
      vi.useRealTimers()
    })
  })

  describe('useToggle', () => {
    it('应该切换状态', () => {
      const { result } = renderHook(() => useToggle(false))
      const [, toggle, setValue] = result.current
      
      expect(result.current[0]).toBe(false)
      
      act(() => {
        toggle()
      })
      expect(result.current[0]).toBe(true)
      
      act(() => {
        setValue(false)
      })
      expect(result.current[0]).toBe(false)
    })

    it('应该支持初始值', () => {
      const { result } = renderHook(() => useToggle(true))
      expect(result.current[0]).toBe(true)
    })
  })
})
