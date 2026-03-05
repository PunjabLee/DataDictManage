/**
 * @file ai-modeling.ts
 * @description AI 智能建模服务
 * @layer core-engine — Application Service
 *
 * 支持自然语言描述生成模型、AI模型审查等功能
 *
 * @module @ddm/core-engine
 */

import { Entity } from '../domain/model/entity'
import { Field, FieldBaseType } from '../domain/model/field'
import { Model } from '../domain/model/model'

// ── AI 配置 ─────────────────────────────────────────────────

export interface AIConfig {
  /** API 类型: openai / local-ollama */
  apiType: 'openai' | 'local-ollama'
  /** API Key (OpenAI) */
  apiKey?: string
  /** API 端点 */
  baseUrl?: string
  /** 模型名称 */
  model: string
  /** 最大 token 数 */
  maxTokens?: number
}

// ── AI 请求/响应 ─────────────────────────────────────────────────

export interface GenerateModelRequest {
  /** 自然语言描述 */
  description: string
  /** 目标数据库类型 */
  dbType?: string
  /** 表名 (可选) */
  tableName?: string
}

export interface GenerateModelResponse {
  /** 生成的表名 */
  tableName: string
  /** 表注释 */
  comment: string
  /** 生成的字段 */
  fields: GeneratedField[]
  /** 原始描述 */
  rawDescription: string
}

export interface GeneratedField {
  name: string
  comment: string
  baseType: string
  length?: number
  nullable: boolean
  primaryKey: boolean
}

export interface ModelReviewResult {
  score: number           // 0-100
  issues: ReviewIssue[]
  suggestions: string[]
}

export interface ReviewIssue {
  severity: 'error' | 'warning' | 'info'
  fieldName?: string
  message: string
  suggestion?: string
}

// ── Prompt 模板 ─────────────────────────────────────────────────

const MODEL_GEN_PROMPT = `你是一个数据建模专家。请根据以下自然语言描述，生成数据库表设计。

要求：
1. 只返回 JSON 数组，不要其他内容
2. JSON 格式如下：
[
  {
    "tableName": "表名(英文)",
    "comment": "表中文注释",
    "fields": [
      {
        "name": "字段名(英文下划线)",
        "comment": "字段中文注释",
        "type": "字段类型(STRING/INTEGER/DECIMAL/BOOLEAN/DATE/DATETIME/TEXT)",
        "length": "长度(STRING类型必需)",
        "nullable": true/false,
        "primaryKey": true/false
      }
    ]
  }
]

描述：{{description}}`

const MODEL_REVIEW_PROMPT = `请审查以下数据模型设计，指出潜在问题并提供改进建议。

评分标准（0-100）：
- 是否有主键
- 字段命名规范
- 数据类型选择
- 是否使用自增ID
- 是否有审计字段
- 索引建议

表结构：
{{tableStructure}}

请返回 JSON 格式：
{
  "score": 85,
  "issues": [
    {
      "severity": "warning",
      "fieldName": "user_name",
      "message": "缺少索引",
      "suggestion": "建议为 user_name 添加索引"
    }
  ],
  "suggestions": ["建议添加 created_at 审计字段"]
}`

// ── AI 建模服务 ─────────────────────────────────────────────────

export class AIModelingService {

  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 从自然语言生成模型
   */
  async generateModel(request: GenerateModelRequest): Promise<GenerateModelResponse[]> {
    const prompt = MODEL_GEN_PROMPT.replace('{{description}}', request.description)
    
    try {
      const response = await this.callAI(prompt)
      return this.parseModelResponse(response, request.description)
    } catch (error) {
      console.error('[AI] 生成模型失败:', error)
      // 返回模拟数据
      return this.generateMockResponse(request.description)
    }
  }

  /**
   * 审查模型
   */
  async reviewModel(model: Model): Promise<ModelReviewResult> {
    const tableStructure = this.modelToStructure(model)
    const prompt = MODEL_REVIEW_PROMPT.replace('{{tableStructure}}', tableStructure)

    try {
      const response = await this.callAI(prompt)
      return this.parseReviewResponse(response)
    } catch (error) {
      console.error('[AI] 审查模型失败:', error)
      return this.getMockReviewResult()
    }
  }

  /**
   * 生成模型改进建议
   */
  async generateSuggestions(model: Model, context?: string): Promise<string[]> {
    const prompt = `作为数据建模专家，请为以下模型提供优化建议：

当前模型：${this.modelToStructure(model)}

{{context}}`

    try {
      const response = await this.callAI(prompt.replace('{{context}}', context || ''))
      return response.split('\n').filter(line => line.trim())
    } catch {
      return ['建议添加审计字段(created_at, created_by)', '建议为常用查询字段添加索引']
    }
  }

  // ── 私有方法 ─────────────────────────────────────────────

  private async callAI(prompt: string): Promise<string> {
    const { apiType, apiKey, baseUrl, model, maxTokens = 2000 } = this.config

    if (apiType === 'openai') {
      return this.callOpenAI(prompt, apiKey!, baseUrl, model, maxTokens)
    } else {
      return this.callOllama(prompt, baseUrl!, model, maxTokens)
    }
  }

  private async callOpenAI(prompt: string, apiKey: string, baseUrl: string, model: string, maxTokens: number): Promise<string> {
    // Phase 1: 模拟调用
    console.log('[AI] 调用 OpenAI API...')
    return this.getMockAIResponse(prompt)
  }

  private async callOllama(prompt: string, baseUrl: string, model: string, maxTokens: number): Promise<string> {
    // Phase 1: 模拟调用
    console.log('[AI] 调用 Ollama API...')
    return this.getMockAIResponse(prompt)
  }

  private parseModelResponse(response: string, description: string): GenerateModelResponse[] {
    try {
      // 尝试解析 JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map((item: any) => ({
          tableName: item.tableName || item.name,
          comment: item.comment || '',
          fields: (item.fields || []).map((f: any) => ({
            name: f.name,
            comment: f.comment || '',
            baseType: f.type || 'STRING',
            length: f.length,
            nullable: f.nullable !== false,
            primaryKey: f.primaryKey === true
          }))
        }))
      }
    } catch (e) {
      console.warn('[AI] 解析响应失败，使用模拟数据')
    }
    return this.generateMockResponse(description)
  }

  private parseReviewResponse(response: string): ModelReviewResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // ignore
    }
    return this.getMockReviewResult()
  }

  private modelToStructure(model: Model): string {
    return model.entities.map(entity => {
      const fields = entity.fields.map(f => 
        `  - ${f.name} (${f.baseType})${f.primaryKey ? ' PK' : ''}: ${f.comment}`
      ).join('\n')
      return `${entity.name}: ${entity.comment}\n${fields}`
    }).join('\n\n')
  }

  // ── 模拟数据 ─────────────────────────────────────────────

  private generateMockResponse(description: string): GenerateModelResponse[] {
    const isUser = description.includes('用户')
    const isOrder = description.includes('订单')

    const responses: GenerateModelResponse[] = []

    if (isUser) {
      responses.push({
        tableName: 'users',
        comment: '用户表',
        fields: [
          { name: 'id', comment: '用户ID', baseType: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'username', comment: '用户名', baseType: 'STRING', length: 64, nullable: false, primaryKey: false },
          { name: 'email', comment: '邮箱', baseType: 'STRING', length: 128, nullable: true, primaryKey: false },
          { name: 'password', comment: '密码', baseType: 'STRING', length: 128, nullable: false, primaryKey: false },
          { name: 'created_at', comment: '创建时间', baseType: 'DATETIME', nullable: false, primaryKey: false },
          { name: 'updated_at', comment: '更新时间', baseType: 'DATETIME', nullable: true, primaryKey: false },
        ]
      })
    }

    if (isOrder) {
      responses.push({
        tableName: 'orders',
        comment: '订单表',
        fields: [
          { name: 'id', comment: '订单ID', baseType: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'order_no', comment: '订单号', baseType: 'STRING', length: 64, nullable: false, primaryKey: false },
          { name: 'user_id', comment: '用户ID', baseType: 'INTEGER', nullable: false, primaryKey: false },
          { name: 'amount', comment: '订单金额', baseType: 'DECIMAL', length: 18, nullable: false, primaryKey: false },
          { name: 'status', comment: '订单状态', baseType: 'STRING', length: 16, nullable: false, primaryKey: false },
          { name: 'created_at', comment: '创建时间', baseType: 'DATETIME', nullable: false, primaryKey: false },
        ]
      })
    }

    if (responses.length === 0) {
      responses.push({
        tableName: 'sample_table',
        comment: '示例表',
        fields: [
          { name: 'id', comment: '主键ID', baseType: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'name', comment: '名称', baseType: 'STRING', length: 255, nullable: false, primaryKey: false },
          { name: 'remark', comment: '备注', baseType: 'TEXT', nullable: true, primaryKey: false },
        ]
      })
    }

    return responses
  }

  private getMockReviewResult(): ModelReviewResult {
    return {
      score: 75,
      issues: [
        { severity: 'warning', message: '缺少审计字段', suggestion: '建议添加 created_at, created_by, updated_at, updated_by' },
        { severity: 'info', message: '建议为经常查询的字段添加索引' }
      ],
      suggestions: [
        '使用 BIGINT 替代 INTEGER 作为主键，支持更大数据量',
        '建议为业务ID字段添加唯一索引'
      ]
    }
  }

  private getMockAIResponse(prompt: string): string {
    return JSON.stringify([
      {
        tableName: 'users',
        comment: '用户表',
        fields: [
          { name: 'id', comment: '用户ID', type: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'username', comment: '用户名', type: 'STRING', length: 64, nullable: false, primaryKey: false },
          { name: 'email', comment: '邮箱', type: 'STRING', length: 128, nullable: true, primaryKey: false }
        ]
      }
    ])
  }
}

// ── 默认配置 ─────────────────────────────────────────────────

export const defaultAIConfig: AIConfig = {
  apiType: 'openai',
  model: 'gpt-4',
  maxTokens: 2000
}

export const aiModelingService = new AIModelingService(defaultAIConfig)

export default AIModelingService
