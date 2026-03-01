# @ddm/canvas-render

> DDM ER 图 Canvas 渲染引擎 — 基于原生 Canvas 2D API 的高性能数据模型可视化库

## 特性

- 🚀 **高性能**：基于 `requestAnimationFrame` 的渲染循环 + 脏标记优化，只在数据变化时重绘
- 🔍 **虚拟化渲染**：视口外的节点自动跳过渲染，支持超大型 ER 图（1000+ 表）
- 🖥️ **HiDPI 支持**：自动适配 Retina 屏幕（devicePixelRatio），显示清晰
- 🎨 **数据表卡片**：美观的节点渲染（标题栏/字段列表/主键标记/数据标准绑定标记）
- 🔗 **多种连线样式**：直线/正交折线/贝塞尔曲线
- 🖱️ **完整交互**：拖拽节点/画布平移/滚轮缩放/点击选中/双击编辑
- 📐 **视口管理**：缩放（0.1x~4x）/平移/适配内容/聚焦节点

## 安装

```bash
pnpm add @ddm/canvas-render
```

## 快速上手

```typescript
import { CanvasEngine, RenderGraph, NodeState, EdgeStyle } from '@ddm/canvas-render'

// 1. 准备 Canvas 元素
const canvas = document.getElementById('er-canvas') as HTMLCanvasElement

// 2. 创建引擎
const engine = new CanvasEngine({
  canvas,
  hiDPI: true,
  virtualRendering: true,
})

// 3. 准备渲染数据
const graph: RenderGraph = {
  nodes: [
    {
      id: 'sys_user',
      name: 'sys_user',
      comment: '用户表',
      position: { x: 100, y: 100 },
      size: { width: 240, height: 140 },
      state: NodeState.NORMAL,
      layerColor: '#1677FF',
      collapsed: false,
      zIndex: 1,
      fields: [
        {
          id: 'f1',
          name: 'id',
          comment: '主键',
          typeLabel: 'VARCHAR(36)',
          isPrimaryKey: true,
          isForeignKey: false,
          isNotNull: true,
          hasStandard: false,
        },
      ],
    },
  ],
  edges: [],
  backgroundColor: '#F8FAFF',
  showGrid: true,
  gridSize: 20,
}

// 4. 设置渲染图
engine.setGraph(graph)

// 5. 监听事件
engine.on('node:select', (event) => {
  console.log('选中节点:', event.target)
})

engine.on('node:dblclick', (event) => {
  console.log('双击节点，打开编辑:', event.target)
})

// 6. 适配视图
engine.fitContent()

// 7. 清理（页面卸载时）
engine.destroy()
```

## API 文档

### CanvasEngine

主引擎类，负责整体协调。

```typescript
const engine = new CanvasEngine(options: CanvasEngineOptions)
```

| 方法 | 说明 |
|------|------|
| `setGraph(graph)` | 设置/更新渲染图数据 |
| `on(type, listener)` | 注册事件监听 |
| `fitContent()` | 将所有节点缩放到视口内 |
| `focusNode(nodeId)` | 将指定节点移动到视口中心 |
| `setNodeState(nodeId, state)` | 更新节点状态（选中/悬停等） |
| `resetViewport()` | 重置视口（100%，居中） |
| `destroy()` | 销毁引擎，释放资源 |

### 事件类型

| 事件 | 触发时机 |
|------|---------|
| `node:select` | 节点被点击选中 |
| `node:dblclick` | 节点被双击 |
| `node:move` | 节点被拖动 |
| `node:contextmenu` | 节点右键菜单 |
| `canvas:click` | 点击画布空白区域 |
| `canvas:zoom` | 缩放变化 |
| `canvas:pan` | 平移变化 |

## 与 core-engine 集成

```typescript
import type { ModelDetailDTO } from '@ddm/core-engine'
import { CanvasEngine, RenderGraph, NodeState, EdgeStyle, RelationMark } from '@ddm/canvas-render'

function modelToGraph(model: ModelDetailDTO): RenderGraph {
  return {
    nodes: model.entities.map((entity, i) => ({
      id: entity.id,
      name: entity.name,
      comment: entity.comment,
      position: { x: 60 + (i % 4) * 280, y: 60 + Math.floor(i / 4) * 220 },
      size: { width: 240, height: 36 + entity.fields.length * 28 + 8 },
      state: NodeState.NORMAL,
      layerColor: '#1677FF',
      collapsed: false,
      zIndex: 1,
      fields: entity.fields.map(f => ({
        id: f.id,
        name: f.name,
        comment: f.comment,
        typeLabel: f.baseType + (f.length ? `(${f.length})` : ''),
        isPrimaryKey: f.primaryKey,
        isForeignKey: false,
        isNotNull: !f.nullable,
        hasStandard: f.hasStandardBinding,
      })),
    })),
    edges: model.relations.map(r => ({
      id: r.id,
      fromNodeId: r.fromEntityId,
      toNodeId: r.toEntityId,
      style: EdgeStyle.BEZIER,
      fromMark: RelationMark.ONE,
      toMark: r.type === 'ONE_TO_MANY' ? RelationMark.MANY : RelationMark.ONE,
      selected: false,
    })),
    backgroundColor: '#F8FAFF',
    showGrid: true,
    gridSize: 20,
  }
}
```
