import { Tag } from 'antd';
import type { TicketPriority } from '../types';

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  Low: 'default',
  Medium: 'blue',
  High: 'volcano',
  Critical: 'red',
};

export default function PriorityTag({ priority }: { priority: TicketPriority }) {
  return <Tag color={PRIORITY_COLOR[priority] ?? 'default'}>{priority}</Tag>;
}
