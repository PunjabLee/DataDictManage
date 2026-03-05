/**
 * @file code-generator.ts
 * @description 代码生成服务
 * @layer core-engine — Application Service
 *
 * 支持 Java、Python 等代码生成
 *
 * @module @ddm/core-engine
 */

import { Entity } from '../domain/model/entity'
import { Field } from '../domain/model/field'

// ── 代码模板 ─────────────────────────────────────────────────

/** Java Entity 模板 */
const JAVA_ENTITY_TEMPLATE = `package {{packageName}};

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * {{tableComment}}
 * @author {{author}}
 * @date {{date}}
 */
@Data
public class {{className}} implements Serializable {
    private static final long serialVersionUID = 1L;

{{fields}}
}
`

/** Java Field 模板 */
const JAVA_FIELD_TEMPLATE = `    /** {{comment}} */
    private {{type}} {{fieldName}};`

/** Java Mapper 模板 */
const JAVA_MAPPER_TEMPLATE = `package {{packageName}};

import org.apache.ibatis.annotations.Mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import {{entityFullName}};

/**
 * {{tableComment}} Mapper
 */
@Mapper
public interface {{mapperName}} extends BaseMapper<{{entityName}}> {
}
`

/** Java Service 模板 */
const JAVA_SERVICE_TEMPLATE = `package {{packageName}};

import com.baomidou.mybatisplus.extension.service.IService;
import {{entityFullName}};

/**
 * {{tableComment}} Service
 */
public interface {{serviceName}} extends IService<{{entityName}}> {
}
`

/** Java ServiceImpl 模板 */
const JAVA_SERVICE_IMPL_TEMPLATE = `package {{packageName}};

import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import {{mapperFullName}};
import {{entityFullName}};
import {{serviceName}};

/**
 * {{tableComment}} Service 实现
 */
@Service
public class {{serviceImplName}} extends ServiceImpl<{{mapperName}}, {{entityName}}> implements {{serviceName}} {
}
`

/** Python Model 模板 */
const PYTHON_MODEL_TEMPLATE = `# -*- coding: utf-8 -*-
"""
{{tableComment}}
@author: {{author}}
@date: {{date}}
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Numeric, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class {{className}}(Base):
    __tablename__ = '{{tableName}}'
    __table_args__ = {
        'comment': '{{tableComment}}'
    }

{{fields}}
`

/** Python Field 模板 */
const PYTHON_FIELD_TEMPLATE = `    {{fieldName}} = Column({{type}}{{nullable}}, comment='{{comment}}'{{primaryKey}})`

// ── 类型映射 ─────────────────────────────────────────────────

const JAVA_TYPE_MAP: Record<string, string> = {
  'STRING': 'String',
  'INTEGER': 'Integer',
  'BIGINT': 'Long',
  'DECIMAL': 'BigDecimal',
  'BOOLEAN': 'Boolean',
  'DATE': 'LocalDate',
  'DATETIME': 'LocalDateTime',
  'TEXT': 'String',
  'BLOB': 'byte[]',
  'JSON': 'String',
}

const PYTHON_TYPE_MAP: Record<string, string> = {
  'STRING': 'String({{length}})',
  'INTEGER': 'Integer',
  'BIGINT': 'BigInteger',
  'DECIMAL': 'Numeric({{precision}},{{scale}})',
  'BOOLEAN': 'Boolean',
  'DATE': 'Date',
  'DATETIME': 'DateTime',
  'TEXT': 'Text',
  'BLOB': 'LargeBinary',
  'JSON': 'JSON',
}

// ── 生成器类 ─────────────────────────────────────────────────

export interface CodeGenOptions {
  packageName?: string
  author?: string
  date?: string
}

export class CodeGenerator {

  /**
   * 生成 Java Entity
   */
  static generateJavaEntity(entity: Entity, options: CodeGenOptions = {}): string {
    const { packageName = 'com.example.model', author = 'System', date = new Date().toISOString().split('T')[0] } = options

    const fields = entity.getFields().map(field => {
      const type = JAVA_TYPE_MAP[field.baseType] || 'String'
      return JAVA_FIELD_TEMPLATE
        .replace('{{comment}}', field.comment || field.name)
        .replace('{{type}}', type)
        .replace('{{fieldName}}', this.toCamelCase(field.name))
    }).join('\n')

    return JAVA_ENTITY_TEMPLATE
      .replace('{{packageName}}', packageName)
      .replace('{{author}}', author)
      .replace('{{date}}', date)
      .replace('{{className}}', this.toPascalCase(entity.name))
      .replace('{{tableComment}}', entity.comment || entity.name)
      .replace('{{fields}}', fields)
  }

  /**
   * 生成 Java Mapper
   */
  static generateJavaMapper(entity: Entity, options: CodeGenOptions = {}): string {
    const { packageName = 'com.example.mapper' } = options

    return JAVA_MAPPER_TEMPLATE
      .replace('{{packageName}}', packageName)
      .replace('{{mapperName}}', `${this.toPascalCase(entity.name)}Mapper`)
      .replace('{{entityName}}', this.toPascalCase(entity.name))
      .replace('{{entityFullName}}', `${packageName.replace('mapper', 'entity')}.${this.toPascalCase(entity.name)}`)
      .replace('{{tableComment}}', entity.comment || entity.name)
  }

  /**
   * 生成 Java Service
   */
  static generateJavaService(entity: Entity, options: CodeGenOptions = {}): string {
    const { packageName = 'com.example.service' } = options
    const entityName = this.toPascalCase(entity.name)

    return JAVA_SERVICE_TEMPLATE
      .replace('{{packageName}}', packageName)
      .replace('{{serviceName}}', `I${entityName}Service`)
      .replace('{{entityName}}', entityName)
      .replace('{{entityFullName}}', `${packageName.replace('service', 'entity')}.${entityName}`)
      .replace('{{tableComment}}', entity.comment || entity.name)
  }

  /**
   * 生成 Java ServiceImpl
   */
  static generateJavaServiceImpl(entity: Entity, options: CodeGenOptions = {}): string {
    const { packageName = 'com.example.service.impl' } = options
    const entityName = this.toPascalCase(entity.name)

    return JAVA_SERVICE_IMPL_TEMPLATE
      .replace('{{packageName}}', packageName)
      .replace('{{serviceImplName}}', `${entityName}ServiceImpl`)
      .replace('{{serviceName}}', `I${entityName}Service`)
      .replace('{{mapperName}}', `${entityName}Mapper`)
      .replace('{{mapperFullName}}', `${packageName.replace('service.impl', 'mapper')}.${entityName}Mapper`)
      .replace('{{entityName}}', entityName)
      .replace('{{entityFullName}}', `${packageName.replace('service.impl', 'entity')}.${entityName}`)
      .replace('{{tableComment}}', entity.comment || entity.name)
  }

  /**
   * 生成 Python SQLAlchemy Model
   */
  static generatePythonModel(entity: Entity, options: CodeGenOptions = {}): string {
    const { author = 'System', date = new Date().toISOString().split('T')[0] } = options

    const fields = entity.getFields().map(field => {
      const typeTemplate = PYTHON_TYPE_MAP[field.baseType] || 'String(255)'
      let type = typeTemplate
        .replace('{{length}}', String(field.length || 255))
        .replace('{{precision}}', String(field.precision || 18))
        .replace('{{scale}}', String(field.scale || 4))

      let nullable = field.nullable ? '' : ', nullable=False'
      let primaryKey = field.primaryKey ? ', primary_key=True' : ''
      let comment = field.comment ? `, comment='${field.comment}'` : ''

      return PYTHON_FIELD_TEMPLATE
        .replace('{{fieldName}}', this.toSnakeCase(field.name))
        .replace('{{type}}', type)
        .replace('{{nullable}}', nullable)
        .replace('{{primaryKey}}', primaryKey)
        .replace('{{comment}}', field.comment || field.name)
    }).join('\n')

    return PYTHON_MODEL_TEMPLATE
      .replace('{{author}}', author)
      .replace('{{date}}', date)
      .replace('{{className}}', this.toPascalCase(entity.name))
      .replace('{{tableName}}', this.toSnakeCase(entity.name))
      .replace('{{tableComment}}', entity.comment || entity.name)
      .replace('{{fields}}', fields)
  }

  // ── 辅助方法 ─────────────────────────────────────────────

  private static toPascalCase(str: string): string {
    return str
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  private static toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  private static toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }
}

export default CodeGenerator
