import React, { useState } from 'react';
import type { TreeProps, TreeNodeProps } from '../types';

const TreeNode: React.FC<{
  node: TreeNodeProps;
  level: number;
  selectedKeys: string[];
  expandedKeys: string[];
  onSelect: (keys: string[]) => void;
  onExpand: (keys: string[]) => void;
}> = ({ node, level, selectedKeys, expandedKeys, onSelect, onExpand }) => {
  const isSelected = selectedKeys.includes(node.key);
  const isExpanded = expandedKeys.includes(node.key);
  const hasChildren = node.children && node.children.length > 0;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    paddingLeft: `${level * 16 + 8}px`,
    cursor: node.selectable !== false ? 'pointer' : 'default',
    backgroundColor: isSelected ? '#dbeafe' : 'transparent',
    borderRadius: '4px',
    gap: '6px',
  };

  const expandIcon = hasChildren ? (
    <span
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={(e) => {
        e.stopPropagation();
        if (isExpanded) {
          onExpand(expandedKeys.filter((k) => k !== node.key));
        } else {
          onExpand([...expandedKeys, node.key]);
        }
      }}
    >
      {isExpanded ? '▼' : '▶'}
    </span>
  ) : (
    <span style={{ width: '14px', display: 'inline-block' }} />
  );

  return (
    <>
      <div
        style={rowStyle}
        onClick={() => {
          if (node.selectable !== false) {
            onSelect([node.key]);
          }
        }}
      >
        {expandIcon}
        {node.icon && <span>{node.icon}</span>}
        <span style={{ flex: 1 }}>{node.title}</span>
      </div>
      {hasChildren && isExpanded && (
        <>
          {node.children!.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              level={level + 1}
              selectedKeys={selectedKeys}
              expandedKeys={expandedKeys}
              onSelect={onSelect}
              onExpand={onExpand}
            />
          ))}
        </>
      )}
    </>
  );
};

export const Tree: React.FC<TreeProps> = ({
  data,
  selectedKeys = [],
  expandedKeys = [],
  className = '',
  style,
  onSelect,
  onExpand,
}) => {
  const [innerSelected, setInnerSelected] = useState<string[]>(selectedKeys);
  const [innerExpanded, setInnerExpanded] = useState<string[]>(expandedKeys);

  const handleSelect = (keys: string[]) => {
    setInnerSelected(keys);
    onSelect?.(keys);
  };

  const handleExpand = (keys: string[]) => {
    setInnerExpanded(keys);
    onExpand?.(keys);
  };

  return (
    <div style={style} className={className}>
      {data.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          level={0}
          selectedKeys={innerSelected}
          expandedKeys={innerExpanded}
          onSelect={handleSelect}
          onExpand={handleExpand}
        />
      ))}
    </div>
  );
};

export default Tree;
