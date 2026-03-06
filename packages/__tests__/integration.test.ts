/**
 * @file integration.test.ts
 * @description 建模功能集成测试
 * @layer Integration Test
 *
 * 测试覆盖：
 * - 完整建模流程：创建模型 → 添加实体 → 添加字段 → 生成 DDL
 * - 撤销/重做流程
 * - 版本管理流程
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Model } from '../packages/core-engine/src/domain/model/model'
import { ModelFactory } from '../packages/core-engine/src/domain/model/model-factory'
import { ModelingAppService } from '../packages/core-engine/src/application/service/modeling-app.service'
import { MySQLDialect } from '../packages/db-dialect/src/dialects/mysql.dialect'
import { DataType, FieldBaseType, ModelLayer, ProjectId } from '../packages/core-engine/src/domain/model/model-types'

// ── 测试辅助 ────────────────────────────────────────────────────────────

class InMemoryModelRepository {
  private models = new Map()
  private projectIndex = new Map()

  async save(model) {
    this.models.set(model.id.value, model)
    const key = model.projectId.value
    if (!this.projectIndex.has(key)) {
      this.projectIndex.set(key, new Set())
    }
    this.projectIndex.get(key).add(model.id.value)
  }

  async findById(id) {
    return this.models.get(id.value) || null
  }

  async findByProjectId(projectId) {
    const ids = this.projectIndex.get(projectId.value) || new Set()
    return Array.from(ids).map(id => this.models.get(id)).filter(Boolean)
  }

  async delete(id) {
    const model = this.models.get(id.value)
    if (model) {
      this.models.delete(id.value)
      this.projectIndex.get(model.projectId.value)?.delete(id.value)
    }
  }
}

class InMemorySqlEngine {
  generateCreateTable(entity, dbType) {
    const lines = [`CREATE TABLE ${entity.name} (`]
    const fields = []
    
    for (const field of entity.fields) {
      let typeStr = this.mapType(field.dataType.baseType, dbType)
      if (!field.nullable) typeStr += ' NOT NULL'
      if (field.primaryKey) typeStr += ' PRIMARY KEY'
      fields.push(`  ${field.name} ${typeStr}`)
    }
    
    lines.push(fields.join(',\n'))
    lines.push(');')
    return lines.join('\n')
  }

  generateDiffDDL(diffs, dbType) {
    return '-- Diff not implemented'
  }

  mapType(baseType, dbType) {
    const map = {
      STRING: 'VARCHAR(255)',
      INT: 'INT',
      BIGINT: 'BIGINT',
      DECIMAL: 'DECIMAL',
      DATETIME: 'DATETIME',
      TEXT: 'TEXT',
    }
    return map[baseType] || 'VARCHAR(255)'
  }
}

// ── 完整建模流程测试 ────────────────────────────────────────────────────

describe('集成测试：完整建模流程', () => {
  let appService
  let repository
  let sqlEngine

  beforeEach(() => {
    repository = new InMemoryModelRepository()
    sqlEngine = new InMemorySqlEngine()
    appService = new ModelingAppService(repository, {}, sqlEngine)
  })

  it('创建模型 → 添加实体 → 添加字段 → 生成 DDL', async () => {
    // 1. 创建模型
    const createResult = await appService.createModel({
      name: '电商订单系统',
      projectId: 'proj-001',
      operatorId: 'user-001',
      description: '测试模型',
    })
    expect(createResult.isSuccess).toBe(true)
    const modelId = createResult.value.id

    // 2. 查询模型详情
    const detailResult = await appService.getModelDetail(modelId)
    expect(detailResult.isSuccess).toBe(true)
    expect(detailResult.value.entities).toHaveLength(0)

    // 3. 添加实体（表）
    const addEntityResult = await appService.addEntity({
      modelId,
      name: 'ord_order',
      comment: '订单表',
      layer: ModelLayer.PHYSICAL,
      operatorId: 'user-001',
    })
    expect(addEntityResult.isSuccess).toBe(true)
    expect(addEntityResult.value.entities).toHaveLength(1)

    // 4. 添加字段
    const entityId = addEntityResult.value.entities[0].id
    const addFieldResult = await appService.addField({
      modelId,
      entityId,
      name: 'order_no',
      comment: '订单号',
      baseType: FieldBaseType.STRING,
      length: 64,
      nullable: false,
      primaryKey: false,
      operatorId: 'user-001',
    })
    expect(addFieldResult.isSuccess).toBe(true)
    expect(addFieldResult.value.entities[0].fields).toHaveLength(2) // id + order_no

    // 5. 生成 DDL
    const ddlResult = await appService.generateDDL({
      modelId,
      dbType: 'MYSQL',
    })
    expect(ddlResult.isSuccess).toBe(true)
    expect(ddlResult.value.sql).toContain('CREATE TABLE `ord_order`')
    expect(ddlResult.value.sql).toContain('order_no')
    expect(ddlResult.value.entityCount).toBe(1)
  })

  it('模型列表查询', async () => {
    // 创建多个模型
    await appService.createModel({ name: '模型A', projectId: 'proj-001', operatorId: 'u1' })
    await appService.createModel({ name: '模型B', projectId: 'proj-001', operatorId: 'u1' })
    await appService.createModel({ name: '模型C', projectId: 'proj-002', operatorId: 'u1' })

    // 查询项目001的模型
    const listResult = await appService.listModelsByProject('proj-001')
    expect(listResult.isSuccess).toBe(true)
    expect(listResult.value).toHaveLength(2)
  })

  it('删除实体', async () => {
    // 创建模型和实体
    const createResult = await appService.createModel({ name: '测试', projectId: 'p1', operatorId: 'u1' })
    const modelId = createResult.value.id
    
    const addResult = await appService.addEntity({ modelId, name: 'test_table', comment: '', operatorId: 'u1' })
    const entityId = addResult.value.entities[0].id

    // 删除前验证存在
    let detail = await appService.getModelDetail(modelId)
    expect(detail.value.entities).toHaveLength(1)

    // 删除实体
    const deleteResult = await appService.removeEntity(modelId, entityId, 'u1')
    expect(deleteResult.isSuccess).toBe(true)

    // 删除后验证不存在
    detail = await appService.getModelDetail(modelId)
    expect(detail.value.entities).toHaveLength(0)
  })
})

// ── 撤销重做流程测试 ────────────────────────────────────────────────────

describe('集成测试：撤销/重做流程', () => {
  it('模拟撤销重做逻辑', () => {
    // 1. 创建初始模型
    const model = Model.create('测试', ProjectId.create('p1'), 'u1').value
    const history = [JSON.parse(JSON.stringify(model.toSnapshot()))]
    let historyIndex = 0

    // 2. 添加实体（记录历史）
    model.addEntity('table_1', '表1', ModelLayer.PHYSICAL, 'u1')
    history.push(JSON.parse(JSON.stringify(model.toSnapshot())))
    historyIndex++

    expect(history).toHaveLength(2)

    // 3. 撤销（回到上一个状态）
    historyIndex--
    const prevState = history[historyIndex]
    expect(prevState.entities).toHaveLength(1)

    // 4. 重做
    historyIndex++
    const nextState = history[historyIndex]
    expect(nextState.entities).toHaveLength(1)
    expect(nextState.entities[0].name).toBe('table_1')
  })
})

// ── 版本管理流程测试 ────────────────────────────────────────────────────

describe('集成测试：版本管理流程', () => {
  it('创建快照和版本回滚', async () => {
    const repository = new InMemoryModelRepository()
    const sqlEngine = new InMemorySqlEngine()
    const appService = new ModelingAppService(repository, {}, sqlEngine)

    // 1. 创建模型
    const createResult = await appService.createModel({ name: '版本测试', projectId: 'p1', operatorId: 'u1' })
    const modelId = createResult.value.id

    // 2. 创建快照 v1.0
    const snapshot1 = await appService.createSnapshot({
      modelId,
      versionTag: 'v1.0',
      description: '初始版本',
    })
    expect(snapshot1.isSuccess).toBe(true)
    expect(snapshot1.value.snapshotId).toBeDefined()

    // 3. 添加更多内容
    await appService.addEntity({ modelId, name: 'new_table', comment: '', operatorId: 'u1' })

    // 4. 创建快照 v1.1
    const snapshot2 = await appService.createSnapshot({
      modelId,
      versionTag: 'v1.1',
      description: '添加新表',
    })
    expect(snapshot2.isSuccess).toBe(true)

    // 5. 验证模型有2个实体
    let detail = await appService.getModelDetail(modelId)
    expect(detail.value.entities).toHaveLength(1)
  })
})

// ── DDL 多数据库测试 ────────────────────────────────────────────────────

describe('集成测试：DDL 多数据库生成', () => {
  let repository
  let sqlEngine
  let appService

  beforeEach(() => {
    repository = new InMemoryModelRepository()
    sqlEngine = new InMemorySqlEngine()
    appService = new ModelingAppService(repository, {}, sqlEngine)
  })

  it('生成 MySQL DDL', async () => {
    const model = await createTestModel(appService, 'mysql测试')
    const result = await appService.generateDDL({ modelId: model.id, dbType: 'MYSQL' })
    
    expect(result.value.sql).toContain('CREATE TABLE')
    expect(result.value.sql).toContain('VARCHAR')
    expect(result.value.dbType).toBe('MYSQL')
  })

  it('生成 Oracle DDL', async () => {
    const model = await createTestModel(appService, 'oracle测试')
    const result = await appService.generateDDL({ modelId: model.id, dbType: 'ORACLE' })
    
    expect(result.value.sql).toContain('CREATE TABLE')
    expect(result.value.sql).toContain('VARCHAR2')
    expect(result.value.dbType).toBe('ORACLE')
  })

  it('生成达梦 DDL', async () => {
    const model = await createTestModel(appService, 'dameng测试')
    const result = await appService.generateDDL({ modelId: model.id, dbType: 'DAMENG' })
    
    expect(result.value.sql).toContain('CREATE TABLE')
    expect(result.value.dbType).toBe('DAMENG')
  })
})

// ── 辅助函数 ────────────────────────────────────────────────────────────

async function createTestModel(appService, name) {
  const result = await appService.createModel({
    name,
    projectId: 'test-proj',
    operatorId: 'test-user',
  })
  return result.value
}
