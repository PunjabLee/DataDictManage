/**
 * @file db-dialect.test.ts
 * @description 数据库方言单元测试
 * @layer Test — db-dialect
 */

import { describe, it, expect } from 'vitest'
import { MySQLDialect } from '../src/dialects/mysql.dialect'
import { OracleDialect } from '../src/dialects/oracle.dialect'
import { DaMengDialect } from '../src/dialects/dameng.dialect'
import { KingbaseDialect } from '../src/dialects/kingbase.dialect'
import { DialectRegistry } from '../src/dialect.registry'
import { Entity, Field } from '@ddm/core-engine'
import { DataType, FieldBaseType, ModelLayer } from '@ddm/core-engine'

// ── 辅助函数 ────────────────────────────────────────────────────────────

function createTestEntity(name: string = 'test_table') {
  const entity = Entity.create({
    name,
    comment: '测试表',
    layer: ModelLayer.PHYSICAL,
    createdBy: 'test',
  })
  return entity
}

function addTestFields(entity: Entity) {
  entity.addField({
    name: 'id',
    comment: '主键',
    dataType: DataType.varchar(36),
    nullable: false,
    primaryKey: true,
    unique: true,
    sortOrder: 0,
  })
  
  entity.addField({
    name: 'username',
    comment: '用户名',
    dataType: DataType.varchar(100),
    nullable: false,
    sortOrder: 1,
  })
  
  entity.addField({
    name: 'age',
    comment: '年龄',
    dataType: DataType.int(),
    nullable: true,
    sortOrder: 2,
  })
  
  entity.addField({
    name: 'salary',
    comment: '工资',
    dataType: DataType.decimal(18, 2),
    nullable: true,
    sortOrder: 3,
  })
  
  entity.addField({
    name: 'created_at',
    comment: '创建时间',
    dataType: DataType.datetime(),
    nullable: false,
    sortOrder: 4,
  })
  
  return entity
}

// ── MySQL 方言测试 ────────────────────────────────────────────────────────

describe('MySQLDialect', () => {
  const dialect = new MySQLDialect()

  it('应该生成 CREATE TABLE 语句', () => {
    const entity = addTestFields(createTestEntity('sys_user'))
    const sql = dialect.generateCreateTable(entity)
    
    expect(sql).toContain('CREATE TABLE `sys_user`')
    expect(sql).toContain('`id` VARCHAR(36) NOT NULL PRIMARY KEY')
    expect(sql).toContain('`username` VARCHAR(100) NOT NULL')
    expect(sql).toContain('`age` INT')
    expect(sql).toContain('`salary` DECIMAL(18,2)')
    expect(sql).toContain('`created_at` DATETIME NOT NULL')
    expect(sql).toContain('ENGINE=InnoDB')
    expect(sql).toContain('DEFAULT CHARSET=utf8mb4')
  })

  it('应该正确映射数据类型', () => {
    expect(dialect.mapType('STRING')).toBe('VARCHAR')
    expect(dialect.mapType('INT')).toBe('INT')
    expect(dialect.mapType('BIGINT')).toBe('BIGINT')
    expect(dialect.mapType('TEXT')).toBe('TEXT')
    expect(dialect.mapType('DATETIME')).toBe('DATETIME')
  })

  it('应该生成 ALTER TABLE ADD COLUMN', () => {
    const entity = createTestEntity('test')
    entity.addField({
      name: 'new_field',
      comment: '新字段',
      dataType: DataType.varchar(50),
      nullable: true,
      sortOrder: 0,
    })
    
    const sql = dialect.generateAddColumn(entity, entity.fields[0])
    expect(sql).toContain('ALTER TABLE `test` ADD COLUMN')
    expect(sql).toContain('`new_field` VARCHAR(50)')
  })

  it('应该生成分页查询', () => {
    const sql = dialect.generatePaginateQuery('SELECT * FROM users', 10, 20)
    expect(sql).toContain('LIMIT 20 OFFSET 10')
  })
})

// ── Oracle 方言测试 ────────────────────────────────────────────────────────

describe('OracleDialect', () => {
  const dialect = new OracleDialect()

  it('应该生成 Oracle 格式的 CREATE TABLE', () => {
    const entity = addTestFields(createTestEntity('sys_user'))
    const sql = dialect.generateCreateTable(entity)
    
    expect(sql).toContain('CREATE TABLE "sys_user"')
    expect(sql).toContain('"id" VARCHAR2(36) NOT NULL PRIMARY KEY')
    expect(sql).toContain('"username" VARCHAR2(100) NOT NULL')
  })

  it('Oracle 使用 VARCHAR2', () => {
    expect(dialect.mapType('STRING')).toBe('VARCHAR2')
  })

  it('应该生成分页查询 (ROWNUM)', () => {
    const sql = dialect.generatePaginateQuery('SELECT * FROM users', 10, 20)
    expect(sql).toContain('ROWNUM')
  })
})

// ── 达梦方言测试 ────────────────────────────────────────────────────────────

describe('DaMengDialect', () => {
  const dialect = new DaMengDialect()

  it('应该生成达梦格式的 CREATE TABLE', () => {
    const entity = addTestFields(createTestEntity('sys_user'))
    const sql = dialect.generateCreateTable(entity)
    
    expect(sql).toContain('CREATE TABLE "sys_user"')
    expect(sql).toContain('"id" VARCHAR(36) NOT NULL PRIMARY KEY')
  })

  it('达梦使用 VARCHAR', () => {
    expect(dialect.mapType('STRING')).toBe('VARCHAR')
  })
})

// ── 金仓方言测试 ────────────────────────────────────────────────────────────

describe('KingbaseDialect', () => {
  const dialect = new KingbaseDialect()

  it('应该生成金仓格式的 CREATE TABLE', () => {
    const entity = addTestFields(createTestEntity('sys_user'))
    const sql = dialect.generateCreateTable(entity)
    
    expect(sql).toContain('CREATE TABLE "sys_user"')
    expect(sql).toContain('"id" VARCHAR(36) NOT NULL PRIMARY KEY')
  })
})

// ── DialectRegistry 测试 ──────────────────────────────────────────────────

describe('DialectRegistry', () => {
  it('应该能注册和获取方言', () => {
    const dialect = new MySQLDialect()
    DialectRegistry.register('TEST', dialect)
    
    expect(DialectRegistry.get('TEST')).toBe(dialect)
  })

  it('应该能列出所有支持的数据库', () => {
    const dialects = DialectRegistry.listDialects()
    expect(dialects).toContain('MYSQL')
    expect(dialects).toContain('ORACLE')
    expect(dialects).toContain('DAMENG')
    expect(dialects).toContain('KINGBASE')
    expect(dialects).toContain('POSTGRESQL')
    expect(dialects).toContain('SQLSERVER')
    expect(dialects).toContain('CLICKHOUSE')
  })

  it('获取不存在的方言应该返回 undefined', () => {
    expect(DialectRegistry.get('NON_EXISTENT')).toBeUndefined()
  })
})
