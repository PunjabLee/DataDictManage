import React from 'react';
import type { TableProps, TableColumn } from '../types';

export function Table<T = any>({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  onRowClick,
  className = '',
  style,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey] ?? index);
  };

  const containerStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    ...style,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    fontSize: '14px',
    color: '#374151',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px',
    color: '#374151',
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  };

  return (
    <div style={containerStyle} className={className}>
      {loading ? (
        <div style={loadingStyle}>加载中...</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...thStyle,
                    textAlign: col.align || 'left',
                    width: col.width,
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                style={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      ...tdStyle,
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render
                      ? col.render(
                          col.dataIndex ? record[col.dataIndex] : undefined,
                          record,
                          index
                        )
                      : (col.dataIndex ? record[col.dataIndex] : null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Table;
