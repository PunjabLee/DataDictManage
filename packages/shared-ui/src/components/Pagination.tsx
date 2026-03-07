import React from 'react';
import type { PaginationProps } from '../types';

export const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = true,
  showTotal = true,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange(page, pageSize);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    gap: '16px',
  };

  const infoStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: disabled ? '#f3f4f6' : '#fff',
    color: disabled ? '#9ca3af' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
  });

  const pageStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    border: '1px solid',
    borderColor: isActive ? '#3b82f6' : '#d1d5db',
    borderRadius: '4px',
    backgroundColor: isActive ? '#3b82f6' : '#fff',
    color: isActive ? '#fff' : '#374151',
    cursor: 'pointer',
    fontSize: '14px',
  });

  const renderPages = () => {
    const pages: React.ReactNode[] = [];
    const maxVisible = 7;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          style={pageStyle(i === current)}
          onClick={() => goToPage(i)}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div style={containerStyle}>
      <div style={infoStyle}>
        {showTotal && `共 ${total} 条记录`}
      </div>
      <div style={controlsStyle}>
        <button
          style={btnStyle(current === 1)}
          onClick={() => goToPage(current - 1)}
          disabled={current === 1}
        >
          上一页
        </button>
        {renderPages()}
        <button
          style={btnStyle(current === totalPages)}
          onClick={() => goToPage(current + 1)}
          disabled={current === totalPages}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default Pagination;
