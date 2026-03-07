// ==================== 类型定义 ====================

export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface InputProps extends BaseProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onChange?: (value: string) => void;
  onEnter?: () => void;
}

export interface SelectProps<T = string> extends BaseProps {
  value?: T;
  options: Array<{ label: string; value: T; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: T) => void;
}

export interface ModalProps extends BaseProps {
  open: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  maskClosable?: boolean;
  onClose?: () => void;
  footer?: React.ReactNode;
}

export interface TabsProps extends BaseProps {
  activeKey?: string;
  onChange?: (key: string) => void;
}

export interface TabPaneProps {
  key: string;
  title: string;
  children?: React.ReactNode;
}

export interface TreeNodeProps {
  key: string;
  title: string;
  children?: TreeNodeProps[];
  icon?: React.ReactNode;
  selectable?: boolean;
  expanded?: boolean;
}

export interface TreeProps extends BaseProps {
  data: TreeNodeProps[];
  selectedKeys?: string[];
  expandedKeys?: string[];
  onSelect?: (keys: string[]) => void;
  onExpand?: (keys: string[]) => void;
}

export interface DropdownProps extends BaseProps {
  trigger?: 'click' | 'hover';
  overlay: React.ReactNode;
}

export interface TooltipProps extends BaseProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
}

export interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  showTotal?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseProps {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  onRowClick?: (record: T, index: number) => void;
  pagination?: PaginationProps;
}
