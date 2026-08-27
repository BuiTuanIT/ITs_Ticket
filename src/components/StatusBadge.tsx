import { Tag } from 'antd';
import { STATUS_LABELS } from '../constants';
import type { TicketStatus } from '../types';

const STATUS_COLOR: Record<TicketStatus, string> = {
  'Pending Approval': 'gold',
  'Need More Info': 'orange',
  'Assigned to IT': 'blue',
  'In Progress': 'processing',
  Resolved: 'green',
  Closed: 'default',
  Rejected: 'red',
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  const color = STATUS_COLOR[status] ?? 'default';
  return <Tag color={color}>{STATUS_LABELS[status] ?? status}</Tag>;
}
