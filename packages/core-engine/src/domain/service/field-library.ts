/**
 * @file field-library.ts
 * @description 字段库/枚举库管理
 * @layer core-engine — Domain Service
 *
 * @module @ddm/core-engine
 */

import { UniqueId, ValueObject } from '../shared/base'

// ── 值对象定义 ─────────────────────────────────────────────────

/** 字段模板 */
export class FieldTemplate extends ValueObject<{
  id: string
  name: string
  code: string           // 英文缩写，如 user_name
  baseType: string
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  comment: string
  category: string       // 基础字段 / 用户信息 / 订单信息等
  standardId?: string    // 关联的数据标准ID
}> {
  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get code(): string { return this.props.code }
  get baseType(): string { return this.props.baseType }
  get length(): number | undefined { return this.props.length }
  get nullable(): boolean { return this.props.nullable }
  get primaryKey(): boolean { return this.props.primaryKey }
  get comment(): string { return this.props.comment }
  get category(): string { return this.props.category }
  get standardId(): string | undefined { return this.props.standardId }

  static create(props: Omit<FieldTemplate['props'], 'id'>): FieldTemplate {
    return new FieldTemplate({
      ...props,
      id: UniqueId.generate()
    })
  }
}

/** 枚举值 */
export class EnumValue extends ValueObject<{
  code: string           // 枚举键，如 USER_STATUS
  label_ENABLED: string          // 显示标签，如 "启用"
  value: string          // 枚举值，如 "1"
  sortOrder: number
}> {
  get code(): string { return this.props.code }
  get label(): string { return this.props.label }
  get value(): string { return this.props.value }
  get sortOrder(): number { return this.props.sortOrder }
}

/** 枚举组 */
export class CodeEnumGroup extends ValueObject<{
  id: string
  name: string
  code: string           // 枚举组编码，如 user_status
  comment: string
  values: EnumValue[]
}> {
  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get code(): string { return this.props.code }
  get comment(): string { return this.props.comment }
  get values(): EnumValue[] { return this.props.values }

  static create(name: string, code: string, comment: string = ''): CodeEnumGroup {
    return new CodeEnumGroup({
      id: UniqueId.generate(),
      name,
      code,
      comment,
      values: []
    })
  }

  addValue(code: string, label: string, value: string, sortOrder: number = 0): CodeEnumGroup {
    const newValues = [
      ...this.props.values,
      new EnumValue({ code, label, value, sortOrder })
    ]
    return new CodeEnumGroup({
      ...this.props,
      values: newValues
    })
  }
}

// ── 领域服务 ─────────────────────────────────────────────────

/**
 * 字段库服务
 * 
 * 职责：
 * - 字段模板的 CRUD
 * - 模板搜索和过滤
 * - 模板分类管理
 */
export class FieldLibraryService {

  private templates: Map<string, FieldTemplate> = new Map()

  /**
   * 添加字段模板
   */
  addTemplate(template: FieldTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * 根据ID获取模板
   */
  getTemplate(id: string): FieldTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): FieldTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory(category: string): FieldTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category)
  }

  /**
   * 搜索模板（支持名称、编码、注释模糊搜索）
   */
  searchTemplates(keyword: string): FieldTemplate[] {
    const lower = keyword.toLowerCase()
    return this.getAllTemplates().filter(t => 
      t.name.toLowerCase().includes(lower) ||
      t.code.toLowerCase().includes(lower) ||
      t.comment.toLowerCase().includes(lower)
    )
  }

  /**
   * 删除模板
   */
  removeTemplate(id: string): boolean {
    return this.templates.delete(id)
  }

  /**
   * 初始化默认字段模板
   */
  initDefaultTemplates(): void {
    const defaults: Omit<FieldTemplate['props'], 'id'>[] = [
      // 基础字段
      { name: 'ID', code: 'id', baseType: 'INTEGER', nullable: false, primaryKey: true, comment: '主键ID', category: '基础字段' },
      { name: '创建时间', code: 'created_at', baseType: 'DATETIME', nullable: false, comment: '创建时间', category: '基础字段' },
      { name: '更新时间', code: 'updated_at', baseType: 'DATETIME', nullable: true, comment: '更新时间', category: '基础字段' },
      { name: '删除时间', code: 'deleted_at', baseType: 'DATETIME', nullable: true, comment: '删除时间', category: '基础字段' },
      { name: '创建人', code: 'created_by', baseType: 'STRING', length: 64, nullable: true, comment: '创建人', category: '基础字段' },
      { name: '备注', code: 'remark', baseType: 'TEXT', nullable: true, comment: '备注', category: '基础字段' },
      
      // 用户信息
      { name: '用户名', code: 'username', baseType: 'STRING', length: 64, nullable: false, comment: '用户名', category: '用户信息' },
      { name: '密码', code: 'password', baseType: 'STRING', length: 128, nullable: false, comment: '密码', category: '用户信息' },
      { name: '邮箱', code: 'email', baseType: 'STRING', length: 128, nullable: true, comment: '邮箱', category: '用户信息' },
      { name: '手机号', code: 'phone', baseType: 'STRING', length: 20, nullable: true, comment: '手机号', category: '用户信息' },
      { name: '头像', code: 'avatar', baseType: 'STRING', length: 255, nullable: true, comment: '头像URL', category: '用户信息' },
      { name: '状态', code: 'status', baseType: 'STRING', length: 16, nullable: false, comment: '状态', category: '用户信息' },

      // 组织机构
      { name: '组织ID', code: 'org_id', baseType: 'INTEGER', nullable: true, comment: '组织ID', category: '组织机构' },
      { name: '部门ID', code: 'dept_id', baseType: 'INTEGER', nullable: true, comment: '部门ID', category: '组织机构' },
      { name: '岗位ID', code: 'post_id', baseType: 'INTEGER', nullable: true, comment: '岗位ID', category: '组织机构' },

      // 订单相关
      { name: '订单号', code: 'order_no', baseType: 'STRING', length: 64, nullable: false, comment: '订单号', category: '订单信息' },
      { name: '订单金额', code: 'order_amount', baseType: 'DECIMAL', precision: 18, scale: 2, nullable: false, comment: '订单金额', category: '订单信息' },
      { name: '支付方式', code: 'pay_type', baseType: 'STRING', length: 16, nullable: true, comment: '支付方式', category: '订单信息' },
      { name: '支付时间', code: 'pay_time', baseType: 'DATETIME', nullable: true, comment: '支付时间', category: '订单信息' },

      // 通用
      { name: '排序', code: 'sort_order', baseType: 'INTEGER', nullable: true, comment: '排序', category: '通用' },
      { name: '版本号', code: 'version', baseType: 'INTEGER', nullable: false, comment: '乐观锁版本号', category: '通用' },
    ]

    defaults.forEach(t => {
      this.addTemplate(FieldTemplate.create(t))
    })
  }
}

/**
 * 枚举库服务
 */
export class EnumLibraryService {

  private groups: Map<string, CodeEnumGroup> = new Map()

  /**
   * 添加枚举组
   */
  addGroup(group: CodeEnumGroup): void {
    this.groups.set(group.id, group)
  }

  /**
   * 获取枚举组
   */
  getGroup(id: string): CodeEnumGroup | undefined {
    return this.groups.get(id)
  }

  /**
   * 根据编码获取枚举组
   */
  getGroupByCode(code: string): CodeEnumGroup | undefined {
    return Array.from(this.groups.values()).find(g => g.code === code)
  }

  /**
   * 获取所有枚举组
   */
  getAllGroups(): CodeEnumGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * 初始化默认枚举组
   */
  initDefaultEnums(): void {
    // 用户状态
    const userStatus = CodeEnumGroup.create('用户状态', 'user_status', '系统用户状态')
      .addValue('ENABLED', '启用', '1', 1)
      .addValue('DISABLED', '禁用', '2', 2)
      .addValue('DELETED', '已删除', '3', 3)
    this.addGroup(userStatus)

    // 订单状态
    const orderStatus = CodeEnumGroup.create('订单状态', 'order_status', '订单生命周期状态')
      .addValue('PENDING', '待支付', '1', 1)
      .addValue('PAID', '已支付', '2', 2)
      .addValue('SHIPPED', '已发货', '3', 3)
      .addValue('COMPLETED', '已完成', '4', 4)
      .addValue('CANCELLED', '已取消', '5', 5)
    this.addGroup(orderStatus)

    // 性别
    const gender = CodeEnumGroup.create('性别', 'gender', '性别枚举')
      .addValue('MALE', '男', '1', 1)
      .addValue('FEMALE', '女', '2', 2)
      .addValue('UNKNOWN', '未知', '0', 0)
    this.addGroup(gender)

    // 是/否
    const yesNo = CodeEnumGroup.create('是否', 'yes_no', '布尔值枚举')
      .addValue('YES', '是', '1', 1)
      .addValue('NO', '否', '0', 0)
    this.addGroup(yesNo)
  }
}

// ── 默认导出 ─────────────────────────────────────────────────

export const fieldLibrary = new FieldLibraryService()
export const enumLibrary = new EnumLibraryService()

// 初始化默认数据
fieldLibrary.initDefaultTemplates()
enumLibrary.initDefaultEnums()

export default { fieldLibrary, enumLibrary }
