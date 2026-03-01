/**
 * @file model.assembler.ts
 * @description 模型装配器 — 负责领域对象（BO）与 DTO 之间的双向转换
 * @layer Application Layer — application/assembler
 *
 * 职责：
 *   装配器（Assembler）隔离了领域层与接入层，是应用层的翻译器。
 *   确保领域对象不直接暴露给外部（防止领域知识外泄），
 *   同时也确保接入层的 DTO 不渗透到领域层（防止贫血模型）。
 *
 * @pattern GoF: Facade（对外提供简洁转换接口）
 *           Adapter（适配领域对象与 DTO 接口）
 *
 * @module @ddm/core-engine
 */

import { Model, ModelBranch, ModelRelation } from '../../domain/model/model'
import { Entity } from '../../domain/model/entity'
import { Field } from '../../domain/model/field'
import {
  ModelListDTO,
  ModelDetailDTO,
  EntityDTO,
  FieldDTO,
  RelationDTO,
  BranchDTO,
} from '../dto/model.dto'

/**
 * 模型装配器
 *
 * 单向约定：
 *  - toListDTO：Model → ModelListDTO（轻量视图，用于列表页）
 *  - toDetailDTO：Model → ModelDetailDTO（完整视图，用于详情页/Canvas）
 *  - entityToDTO：Entity → EntityDTO
 *  - fieldToDTO：Field → FieldDTO
 */
export class ModelAssembler {
  /**
   * 将 Model 聚合根转换为列表视图 DTO
   * 不包含完整的 Entity 和 Field 数据（减少传输量）
   *
   * @param model 领域对象
   */
  static toListDTO(model: Model): ModelListDTO {
    const currentBranch = model.branches.find(b => b.id.value === model.currentBranchId.value)
    return {
      id: model.id.value,
      name: model.name,
      description: model.description,
      projectId: model.projectId.value,
      entityCount: model.entities.length,
      currentBranchName: currentBranch?.name ?? 'main',
      createdBy: model.createdBy,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    }
  }

  /**
   * 将 Model 聚合根转换为详情 DTO
   * 包含完整的 Entity、Field、Relation、Branch 数据
   *
   * @param model 领域对象
   */
  static toDetailDTO(model: Model): ModelDetailDTO {
    return {
      id: model.id.value,
      name: model.name,
      description: model.description,
      projectId: model.projectId.value,
      currentBranchId: model.currentBranchId.value,
      entities: model.entities.map(e => ModelAssembler.entityToDTO(e)),
      relations: model.relations.map(r => ModelAssembler.relationToDTO(r)),
      branches: model.branches.map(b => ModelAssembler.branchToDTO(b)),
      createdBy: model.createdBy,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    }
  }

  /**
   * Entity 聚合根 → EntityDTO
   */
  static entityToDTO(entity: Entity): EntityDTO {
    return {
      id: entity.id.value,
      name: entity.name,
      comment: entity.comment,
      layer: entity.layer,
      fields: entity.fields
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(f => ModelAssembler.fieldToDTO(f)),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }
  }

  /**
   * Field 值对象 → FieldDTO
   */
  static fieldToDTO(field: Field): FieldDTO {
    return {
      id: field.id.value,
      name: field.name,
      comment: field.comment,
      baseType: field.dataType.baseType,
      length: field.dataType.length,
      precision: field.dataType.precision,
      scale: field.dataType.scale,
      nullable: field.nullable,
      primaryKey: field.primaryKey,
      unique: field.unique,
      autoIncrement: field.autoIncrement,
      defaultValue: field.defaultValue,
      sortOrder: field.sortOrder,
      standardId: field.standardRef?.standardId,
      standardName: field.standardRef?.standardName,
      hasStandardBinding: field.hasStandardBinding(),
    }
  }

  /**
   * ModelRelation → RelationDTO
   */
  static relationToDTO(relation: ModelRelation): RelationDTO {
    return {
      id: relation.id,
      fromEntityId: relation.fromEntityId.value,
      toEntityId: relation.toEntityId.value,
      type: relation.type,
      comment: relation.comment,
    }
  }

  /**
   * ModelBranch → BranchDTO
   */
  static branchToDTO(branch: ModelBranch): BranchDTO {
    return {
      id: branch.id.value,
      name: branch.name,
      isMain: branch.isMain,
      parentBranchId: branch.parentBranchId?.value,
      createdAt: branch.createdAt.toISOString(),
    }
  }
}
