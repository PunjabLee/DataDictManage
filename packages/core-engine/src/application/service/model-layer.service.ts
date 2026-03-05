/**
 * @file model-layer.service.ts
 * @description 三层建模切换服务
 * @layer core-engine — Application Service
 *
 * 支持概念层 → 逻辑层 → 物理层的切换
 * 各层有独立的视图和属性集
 *
 * @module @ddm/core-engine
 */

import { Model, ModelLayer } from '../domain/model/model'
import { Entity } from '../domain/model/entity'
import { Field, FieldBaseType } from '../domain/model/field'

/**
 * 三层建模服务
 * 
 * 职责：
 * - 维护三层模型之间的映射关系
 * - 实现层间转换逻辑
 * - 支持自动布局计算
 */
export class ModelLayerService {

  /**
   * 创建带三层结构的新模型
   */
  static createModelWithLayers(name: string, description?: string): Model {
    const model = Model.create(name, description)
    // 初始化三层分支
    model.createBranch('main', '主分支')
    return model
  }

  /**
   * 切换当前活跃层
   */
  static switchLayer(model: Model, targetLayer: ModelLayer): Model {
    model.setCurrentLayer(targetLayer)
    return model
  }

  /**
   * 从概念层推导逻辑层
   * - 将业务实体转换为数据表
   * - 生成字段名和类型
   */
  static conceptualToLogical(sourceEntity: Entity, targetEntity: Entity): void {
    // 概念层字段 → 逻辑层字段
    for (const field of sourceEntity.getFields()) {
      const logicalField = Field.builder()
        .name(this.toSnakeCase(field.name))  // 用户名 → user_name
        .comment(field.comment)
        .baseType(this.inferLogicalType(field.baseType))
        .nullable(field.nullable)
        .primaryKey(field.primaryKey)
        .build()
      
      targetEntity.addField(logicalField)
    }
  }

  /**
   * 从逻辑层推导物理层
   * - 添加数据库特定属性
   * - 设置长度、精度等
   */
  static logicalToPhysical(sourceEntity: Entity, targetEntity: Entity, dbType: string): void {
    for (const field of sourceEntity.getFields()) {
      const physicalField = Field.builder()
        .name(field.name)
        .comment(field.comment)
        .baseType(field.baseType)
        .length(this.getDefaultLength(field.baseType, dbType))
        .nullable(field.nullable)
        .primaryKey(field.primaryKey)
        .autoIncrement(this.shouldAutoIncrement(field.baseType, dbType))
        .build()
      
      targetEntity.addField(physicalField)
    }
  }

  /**
   * ER 图自动布局算法（力导向布局）
   * 返回每个实体节点的坐标
   */
  static calculateLayout(entities: Entity[], options: LayoutOptions = {}): Map<string, LayoutPosition> {
    const positions = new Map<string, LayoutPosition>()
    const { width = 1200, height = 800, padding = 200 } = options
    
    if (entities.length === 0) return positions

    // 简单网格布局（力导向的简化版本）
    const cols = Math.ceil(Math.sqrt(entities.length))
    const cellWidth = (width - padding * 2) / cols
    const cellHeight = (height - padding * 2) / Math.ceil(entities.length / cols)

    entities.forEach((entity, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      
      positions.set(entity.id.value, {
        x: padding + col * cellWidth + cellWidth / 2,
        y: padding + row * cellHeight + cellHeight / 2,
        width: 180,
        height: 100 + entity.getFields().length * 24
      })
    })

    return positions
  }

  /**
   * 获取层次布局（父子关系）
   */
  static hierarchicalLayout(entities: Entity[], relations: any[]): Map<string, LayoutPosition> {
    const positions = new Map<string, LayoutPosition>()
    const width = 1200
    const height = 800
    const padding = 150

    // 找出根实体（没有父关系的）
    const childIds = new Set(relations.map(r => r.toEntityId))
    const rootEntities = entities.filter(e => !childIds.has(e.id.value))

    let currentY = padding
    const levelWidth = (width - padding * 2) / 3 // 假设最多3层

    const layoutLevel = (entityList: Entity[], level: number, startY: number): number => {
      let y = startY
      const x = padding + level * levelWidth

      for (const entity of entityList) {
        const height = 100 + entity.getFields().length * 24
        positions.set(entity.id.value, {
          x,
          y,
          width: 180,
          height
        })

        // 查找子实体
        const children = entities.filter(e => 
          relations.some(r => r.fromEntityId === entity.id.value && r.toEntityId === e.id.value)
        )
        if (children.length > 0) {
          y = layoutLevel(children, level + 1, y)
        } else {
          y += height + 30
        }
      }
      return y
    }

    layoutLevel(rootEntities, 0, currentY)

    // 处理孤立实体
    const positionedIds = new Set(positions.keys())
    const orphanEntities = entities.filter(e => !positionedIds.has(e.id.value))
    let orphanY = currentY
    orphanEntities.forEach(entity => {
      const height = 100 + entity.getFields().length * 24
      positions.set(entity.id.value, {
        x: width - padding - 180,
        y: orphanY,
        width: 180,
        height
      })
      orphanY += height + 30
    })

    return positions
  }

  // ── 私有辅助方法 ─────────────────────────────────────────────

  /**
   * 转换为下划线命名
   */
  private static toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }

  /**
   * 推断逻辑层类型
   */
  private static inferLogicalType(baseType: FieldBaseType): FieldBaseType {
    // 概念层类型直接映射到逻辑层
    return baseType
  }

  /**
   * 获取数据库默认长度
   */
  private static getDefaultLength(baseType: FieldBaseType, dbType: string): number {
    const defaults: Record<string, Record<string, number>> = {
      'MYSQL': { 'STRING': 255, 'INTEGER': 0, 'DECIMAL': 0 },
      'ORACLE': { 'STRING': 255, 'INTEGER': 0, 'DECIMAL': 0 },
      'POSTGRESQL': { 'STRING': 255, 'INTEGER': 0, 'DECIMAL': 0 },
    }
    return defaults[dbType]?.[baseType] ?? 255
  }

  /**
   * 是否应该自增
   */
  private static shouldAutoIncrement(baseType: FieldBaseType, dbType: string): boolean {
    if (baseType === FieldBaseType.INTEGER) {
      return ['MYSQL', 'POSTGRESQL', 'ORACLE'].includes(dbType.toUpperCase())
    }
    return false
  }
}

// ── 类型定义 ───────────────────────────────────────────────────

export interface LayoutOptions {
  width?: number
  height?: number
  padding?: number
}

export interface LayoutPosition {
  x: number
  y: number
  width: number
  height: number
}

export default ModelLayerService
