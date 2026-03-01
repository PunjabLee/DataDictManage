import { Model } from './model'
import { Entity } from './entity'
import { Field } from './field'
import { ModelLayer, RelationType } from './model-types'

/**
 * Diff 结果类型定义
 */
export interface ModelDiffResult {
  addedEntities: Entity[]
  removedEntities: Entity[]
  modifiedEntities: EntityDiff[]
  addedRelations: import('./model').ModelRelation[]
  removedRelations: import('./model').ModelRelation[]
  summary: string
}

export interface EntityDiff {
  entityId: string
  entityName: string
  addedFields: Field[]
  removedFields: Field[]
  modifiedFields: FieldDiff[]
}

export interface FieldDiff {
  fieldId: string
  fieldName: string
  changes: Record<string, { old: unknown; new: unknown }>
}

/**
 * 模型 Diff 领域服务
 * 跨聚合逻辑：对比两个 Model 聚合根的差异
 * GoF: Strategy Pattern（不同比对维度可替换策略）
 */
export class ModelDiffService {
  /**
   * 对比两个模型的结构差异
   * @param baseModel  基准模型（旧版本）
   * @param targetModel 目标模型（新版本）
   */
  diff(baseModel: Model, targetModel: Model): ModelDiffResult {
    const baseEntities = new Map(baseModel.entities.map(e => [e.name, e]))
    const targetEntities = new Map(targetModel.entities.map(e => [e.name, e]))

    const addedEntities: Entity[] = []
    const removedEntities: Entity[] = []
    const modifiedEntities: EntityDiff[] = []

    // 找新增的表
    for (const [name, entity] of targetEntities) {
      if (!baseEntities.has(name)) addedEntities.push(entity)
    }

    // 找删除的表
    for (const [name, entity] of baseEntities) {
      if (!targetEntities.has(name)) removedEntities.push(entity)
    }

    // 找修改的表
    for (const [name, baseEntity] of baseEntities) {
      const targetEntity = targetEntities.get(name)
      if (!targetEntity) continue
      const entityDiff = this.diffEntity(baseEntity, targetEntity)
      if (entityDiff.addedFields.length > 0 ||
          entityDiff.removedFields.length > 0 ||
          entityDiff.modifiedFields.length > 0) {
        modifiedEntities.push(entityDiff)
      }
    }

    const total = addedEntities.length + removedEntities.length + modifiedEntities.length
    const summary = total === 0
      ? '两个版本模型完全一致，无差异'
      : `共发现 ${total} 处差异：新增表 ${addedEntities.length} 个，删除表 ${removedEntities.length} 个，修改表 ${modifiedEntities.length} 个`

    return {
      addedEntities,
      removedEntities,
      modifiedEntities,
      addedRelations: [],   // TODO: 关系 Diff（后续迭代）
      removedRelations: [],
      summary,
    }
  }

  private diffEntity(base: Entity, target: Entity): EntityDiff {
    const baseFields = new Map(base.fields.map(f => [f.name, f]))
    const targetFields = new Map(target.fields.map(f => [f.name, f]))

    const addedFields: Field[] = []
    const removedFields: Field[] = []
    const modifiedFields: FieldDiff[] = []

    for (const [name, field] of targetFields) {
      if (!baseFields.has(name)) addedFields.push(field)
    }

    for (const [name, field] of baseFields) {
      if (!targetFields.has(name)) removedFields.push(field)
    }

    for (const [name, baseField] of baseFields) {
      const targetField = targetFields.get(name)
      if (!targetField) continue

      const changes: Record<string, { old: unknown; new: unknown }> = {}
      if (baseField.dataType.toString() !== targetField.dataType.toString()) {
        changes['dataType'] = { old: baseField.dataType.toString(), new: targetField.dataType.toString() }
      }
      if (baseField.nullable !== targetField.nullable) {
        changes['nullable'] = { old: baseField.nullable, new: targetField.nullable }
      }
      if (baseField.comment !== targetField.comment) {
        changes['comment'] = { old: baseField.comment, new: targetField.comment }
      }

      if (Object.keys(changes).length > 0) {
        modifiedFields.push({
          fieldId: baseField.id.value,
          fieldName: name,
          changes,
        })
      }
    }

    return {
      entityId: base.id.value,
      entityName: base.name,
      addedFields,
      removedFields,
      modifiedFields,
    }
  }
}
