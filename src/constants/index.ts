import type { TicketCategory, TicketPriority, TicketStatus, Role } from '../types';

export const ROLES: { label: string; value: Role }[] = [
  { label: 'Employee', value: 'employee' },
  { label: 'Manager', value: 'manager' },
  { label: 'IT', value: 'it' },
];

export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Employee',
  manager: 'Manager',
  it: 'IT Support',
};

export const STATUS: Record<string, TicketStatus> = {
  PENDING_APPROVAL: 'Pending Approval',
  NEED_MORE_INFO: 'Need More Info',
  ASSIGNED_TO_IT: 'Assigned to IT',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

export const STATUS_LIST: TicketStatus[] = [
  STATUS.PENDING_APPROVAL,
  STATUS.NEED_MORE_INFO,
  STATUS.ASSIGNED_TO_IT,
  STATUS.IN_PROGRESS,
  STATUS.RESOLVED,
  STATUS.CLOSED,
  STATUS.REJECTED,
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  'Pending Approval': 'Chờ duyệt',
  'Need More Info': 'Cần bổ sung',
  'Assigned to IT': 'Approve · Đang chờ xử lý',
  'In Progress': 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng',
  Rejected: 'Từ chối',
};

/** Trạng thái mà Employee được phép trả lời khi đã có trao đổi */
export const EMPLOYEE_REPLYABLE_STATUS: TicketStatus[] = [
  STATUS.PENDING_APPROVAL,
  STATUS.NEED_MORE_INFO,
  STATUS.ASSIGNED_TO_IT,
  STATUS.IN_PROGRESS,
];

/** Trạng thái còn cần IT xử lý (dùng để nhắc quá hạn) */
export const IT_ACTIVE_STATUS: TicketStatus[] = [
  STATUS.ASSIGNED_TO_IT,
  STATUS.IN_PROGRESS,
];

/** Trạng thái đã xử lý xong (đã giải quyết/đóng/từ chối) */
export const HANDLED_STATUS: TicketStatus[] = [
  STATUS.RESOLVED,
  STATUS.CLOSED,
  STATUS.REJECTED,
];

/** Số ngày quá hạn để nhắc IT xử lý (theo Priority) */
export const OVERDUE_DAYS: Record<TicketPriority, number> = {
  Critical: 1,
  High: 2,
  Medium: 5,
  Low: 7,
};

/** Mặc định cho ticket không có priority */
export const DEFAULT_OVERDUE_DAYS = 3;

export const PRIORITY_LIST: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Khẩn cấp',
};

export const CATEGORY_LIST: TicketCategory[] = [
  'Hardware',
  'Software',
  'Network',
  'Account',
  'Security',
  'Other',
];
