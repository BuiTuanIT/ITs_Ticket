import { Badge, Input, List, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { OVERDUE_DAYS, DEFAULT_OVERDUE_DAYS, IT_ACTIVE_STATUS } from '../constants';
import type { Ticket } from '../types';
import PriorityTag from './PriorityTag';
import StatusBadge from './StatusBadge';

interface TicketListProps {
  tickets: Ticket[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /** IT: highlight ticket quá hạn + hiện số ngày đã gửi */
  markOverdue?: boolean;
}

function ageLabel(createdAt: string): string {
  if (!createdAt) return '';
  const days = Math.floor((Date.now() - Date.parse(createdAt)) / 86_400_000);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  return `${days} ngày trước`;
}

function isOverdue(t: Ticket): boolean {
  if (!IT_ACTIVE_STATUS.includes(t.status)) return false;
  const limit = OVERDUE_DAYS[t.priority] ?? DEFAULT_OVERDUE_DAYS;
  return Math.floor((Date.now() - Date.parse(t.createdAt)) / 86_400_000) > limit;
}

function snippet(html: string): string {
  const text = html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
  return text.length > 80 ? text.slice(0, 80) + '…' : text;
}

/** Cột trái danh sách ticket kiểu Outlook: tiêu đề, snippet, ngày, badge chưa đọc */
export default function TicketList({ tickets, selectedId, onSelect, markOverdue = false }: TicketListProps) {
  return (
    <div>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm kiếm ticket..."
        style={{ marginBottom: 8 }}
        // Search sẽ filter ở page level (truyền tickets đã filter)
      />
      <List
        itemLayout="horizontal"
        dataSource={tickets}
        style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        renderItem={(t) => {
          const active = t.id === selectedId;
          const overdue = markOverdue && isOverdue(t);
          return (
            <List.Item
              onClick={() => onSelect(t.id)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderLeft: active ? '3px solid #1677ff' : '3px solid transparent',
                background: active ? '#e6f4ff' : t.isRead ? '#fff' : '#f6ffed',
                borderRight: overdue ? '4px solid #ff4d4f' : '4px solid transparent',
              }}
            >
              <List.Item.Meta
                title={
                  <Space wrap>
                    {!t.isRead && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: 8,
                          background: '#1677ff',
                        }}
                      />
                    )}
                    <Typography.Text strong={!t.isRead} ellipsis>
                      {t.title}
                    </Typography.Text>
                    <PriorityTag priority={t.priority} />
                    <StatusBadge status={t.status} />
                    {overdue && (
                      <Badge count="Trễ" color="red">
                        <span />
                      </Badge>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                      {snippet(t.description)}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {ageLabel(t.createdAt)} · {dayjs(t.createdAt).format('DD/MM/YYYY')} ·{' '}
                      {t.createdBy?.name ?? ''}
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
}
