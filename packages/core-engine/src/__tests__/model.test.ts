/**
 * @file model.test.ts
 * @description Model 聚合根单元测试
 * @layer Test — core-engine
 *
 * 测试覆盖：
 *   - Model 创建（工厂方法）
 *   - Entity 添加（不变量校验）
 *   - Field 添加（字段名唯一性）
 *   - 领域事件生成
 *   - ModelDiff 差异对比
 *   - Result 模式（成功/失败）
 */

import { describe, it, expect } from 'vitest'
import { Model } from '../domain/model/model'
import { ModelDiffService } from '../domain/model/model-diff.service'
import { DataType, FieldBaseType, ModelLayer, ProjectId, RelationType } from '../domain/model/model-types'
import { Result } from '../shared/base'

// ── 测试辅助函数 ────────────────────────────────────────────────────────────

function createTestModel(name = '测试模型') {
  const result = Model.create(name, ProjectId.create('proj-001'), 'user-001')
  if (result.isFailure) throw new Error(result.error)
  return result.value
}

// ── Model 创建测试 ──────────────────────────────────────────────────────────

describe('Model.create()', () => {
  it('应该成功创建一个新 Model', () => {
    const result = Model.create('用户中心', ProjectId.create('proj-001'), 'user-001')
    expect(result.isSuccess).toBe(true)
    expect(result.value.name).toBe('用户中心')
    expect(result.value.branches).toHaveLength(1)
    expect(result.value.branches[0]?.isMain).toBe(true)
    expect(result.value.branches[0]?.name).toBe('main')
  })

  it('名称为空时应该失败', () => {
    const result = Model.create('', ProjectId.create('proj-001'), 'user-001')
    expect(result.isFailure).toBe(true)
    expect(result.error).toContain('名称不能为空')
  })

  it('名称超过 128 字符时应该失败', () => {
    const longName = 'a'.repeat(129)
    const result = Model.create(longName, ProjectId.create('proj-001'), 'user-001')
    expect(result.isFailure).toBe(true)
  })

  it('创建时应该注册 ModelCreatedEvent 领域事件', () => {
    const model = createTestModel()
    const events = model.pullDomainEvents()
    expect(events).toHaveLength(1)
    expect(events[0]?.eventType).toBe('MODEL_CREATED')
  })

  it('pullDomainEvents 应该清空事件队列', () => {
    const model = createTestModel()
    model.pullDomainEvents()
    const events2 = model.pullDomainEvents()
    expect(events2).toHaveLength(0)
  })
})

// ── Entity 操作测试 ──────────────────────────────────────────────────────────

describe('Model.addEntity()', () => {
  it('应该成功添加数据表', () => {
    const model = createTestModel()
    const result = model.addEntity('sys_user', '用户表', ModelLayer.PHYSICAL, 'user-001')
    expect(result.isSuccess).toBe(true)
    expect(model.entities).toHaveLength(1)
    expect(model.entities[0]?.name).toBe('sys_user')
  })

  it('同名表不能重复添加', () => {
    const model = createTestModel()
    model.addEntity('sys_user', '用户表', ModelLayer.PHYSICAL, 'user-001')
    const result2 = model.addEntity('sys_user', '用户表2', ModelLayer.PHYSICAL, 'user-001')
    expect(result2.isFailure).toBe(true)
    expect(result2.error).toContain('已存在')
  })

  it('添加 Entity 应该生成 EntityAddedToModelEvent 事件', () => {
    const model = createTestModel()
    model.pullDomainEvents() // 清空 CREATE 事件
    model.addEntity('order', '订单表', ModelLayer.PHYSICAL, 'user-001')
    const events = model.pullDomainEvents()
    expect(events).toHaveLength(1)
    expect(events[0]?.eventType).toBe('ENTITY_ADDED')
  })

  it('应该可以添加多张表', () => {
    const model = createTestModel()
    model.addEntity('table_a', '表A', ModelLayer.PHYSICAL, 'user-001')
    model.addEntity('table_b', '表B', ModelLayer.PHYSICAL, 'user-001')
    model.addEntity('table_c', '表C', ModelLayer.PHYSICAL, 'user-001')
    expect(model.entities).toHaveLength(3)
  })
})

describe('Model.removeEntity()', () => {
  it('应该成功删除存在的表', () => {
    const model = createTestModel()
    const addResult = model.addEntity('sys_user', '用户表', ModelLayer.PHYSICAL, 'user-001')
    const entityId = addResult.value!.id
    const removeResult = model.removeEntity(entityId, 'user-001')
    expect(removeResult.isSuccess).toBe(true)
    expect(model.entities).toHaveLength(0)
  })

  it('删除不存在的表应该失败', () => {
    const model = createTestModel()
    const { EntityId } = require('../domain/model/model-types')
    const fakeId = EntityId.create('non-existent-id')
    const result = model.removeEntity(fakeId, 'user-001')
    expect(result.isFailure).toBe(true)
  })

  it('删除表时应该清理相关关系', () => {
    const model = createTestModel()
    const e1 = model.addEntity('user', '用户表', ModelLayer.PHYSICAL, 'u').value!
    const e2 = model.addEntity('order', '订单表', ModelLayer.PHYSICAL, 'u').value!
    model.addRelation(e1.id, e2.id, RelationType.ONE_TO_MANY)
    expect(model.relations).toHaveLength(1)

    model.removeEntity(e1.id, 'u')
    expect(model.relations).toHaveLength(0) // 关系应该被清理
  })
})

// ── Relation 测试 ────────────────────────────────────────────────────────────

describe('Model.addRelation()', () => {
  it('应该成功添加两个表之间的关系', () => {
    const model = createTestModel()
    const e1 = model.addEntity('user', '用户表', ModelLayer.PHYSICAL, 'u').value!
    const e2 = model.addEntity('order', '订单表', ModelLayer.PHYSICAL, 'u').value!
    const result = model.addRelation(e1.id, e2.id, RelationType.ONE_TO_MANY)
    expect(result.isSuccess).toBe(true)
    expect(model.relations).toHaveLength(1)
    expect(model.relations[0]?.type).toBe(RelationType.ONE_TO_MANY)
  })

  it('不在模型中的表不能建立关系', () => {
    const model = createTestModel()
    const { EntityId } = require('../domain/model/model-types')
    const fakeId = EntityId.create()
    const e1 = model.addEntity('user', '用户表', ModelLayer.PHYSICAL, 'u').value!
    const result = model.addRelation(e1.id, fakeId, RelationType.ONE_TO_MANY)
    expect(result.isFailure).toBe(true)
  })
})

// ── ModelDiffService 测试 ────────────────────────────────────────────────────

describe('ModelDiffService.diff()', () => {
  const diffService = new ModelDiffService()

  it('两个相同的空模型应该无差异', () => {
    const base = createTestModel('m1')
    const target = createTestModel('m2')
    const result = diffService.diff(base, target)
    expect(result.addedEntities).toHaveLength(0)
    expect(result.removedEntities).toHaveLength(0)
    expect(result.modifiedEntities).toHaveLength(0)
  })

  it('应该检测到新增的表', () => {
    const base = createTestModel('base')
    const target = createTestModel('target')
    target.addEntity('new_table', '新表', ModelLayer.PHYSICAL, 'u')

    const result = diffService.diff(base, target)
    expect(result.addedEntities).toHaveLength(1)
    expect(result.addedEntities[0]?.name).toBe('new_table')
  })

  it('应该检测到删除的表', () => {
    const base = createTestModel('base')
    base.addEntity('old_table', '旧表', ModelLayer.PHYSICAL, 'u')
    const target = createTestModel('target')

    const result = diffService.diff(base, target)
    expect(result.removedEntities).toHaveLength(1)
    expect(result.removedEntities[0]?.name).toBe('old_table')
  })

  it('应该检测到字段变更', () => {
    const base = createTestModel('base')
    const entity = base.addEntity('user', '用户表', ModelLayer.PHYSICAL, 'u').value!
    entity.addField({
      name: 'username',
      comment: '用户名',
      dataType: DataType.varchar(64),
      nullable: false,
    })

    const target = createTestModel('target')
    const targetEntity = target.addEntity('user', '用户表', ModelLayer.PHYSICAL, 'u').value!
    targetEntity.addField({
      name: 'username',
      comment: '登录账号',  // 注释变了
      dataType: DataType.varchar(128), // 长度变了
      nullable: false,
    })

    const result = diffService.diff(base, target)
    expect(result.modifiedEntities).toHaveLength(1)
    expect(result.modifiedEntities[0]?.modifiedFields).toHaveLength(1)
    expect(result.modifiedEntities[0]?.modifiedFields[0]?.changes['dataType']).toBeDefined()
  })
})

// ── Snapshot（Memento）测试 ──────────────────────────────────────────────────

describe('Model.toSnapshot()', () => {
  it('应该生成包含所有 Entity 的快照', () => {
    const model = createTestModel()
    model.addEntity('user', '用户表', ModelLayer.PHYSICAL, 'u')
    model.addEntity('order', '订单表', ModelLayer.PHYSICAL, 'u')

    const snapshot = model.toSnapshot() as Record<string, unknown>
    expect(snapshot['modelId']).toBe(model.id.value)
    expect((snapshot['entities'] as unknown[]).length).toBe(2)
    expect(snapshot['snapshotAt']).toBeDefined()
  })
})

// ── Result 工具测试 ──────────────────────────────────────────────────────────

describe('Result', () => {
  it('Result.ok() 应该表示成功', () => {
    const r = Result.ok(42)
    expect(r.isSuccess).toBe(true)
    expect(r.isFailure).toBe(false)
    expect(r.value).toBe(42)
  })

  it('Result.fail() 应该表示失败', () => {
    const r = Result.fail<number>('出错了')
    expect(r.isFailure).toBe(true)
    expect(r.isSuccess).toBe(false)
    expect(r.error).toBe('出错了')
  })

  it('Result.ok() 不带参数时 value 为 undefined', () => {
    const r = Result.ok()
    expect(r.isSuccess).toBe(true)
    expect(r.value).toBeUndefined()
  })
})
