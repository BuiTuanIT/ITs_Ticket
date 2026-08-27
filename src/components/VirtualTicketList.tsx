import { List as FixedSizeList } from 'react-window';
import { useEffect, useRef, useState } from 'react';
import { Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { OVERDUE_DAYS, DEFAULT_OVERDUE_DAYS, IT_ACTIVE_STATUS } from '../constants';
import type { Ticket } from '../types';
import PriorityTag from './PriorityTag';
import StatusBadge from './StatusBadge';

interface VirtualTicketListProps {
  tickets: Ticket[];
  selectedId?: string;
  onSelect: (id: string) => void;
  markOverdue?: boolean;
  /** Chiều cao cụ thể (px). Mặc định tự lấp đầy chiều cao cha (height: 100%). */
  height?: number;
  itemHeight?: number;
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

function TicketRow({
  ticket,
  selected,
  onSelect,
  markOverdue,
}: {
  ticket: Ticket;
  selected: boolean;
  onSelect: () => void;
  markOverdue: boolean;
}) {
  const overdue = markOverdue && isOverdue(ticket);
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 12px',
        cursor: 'pointer',
        borderLeft: selected ? '3px solid #1677ff' : '3px solid transparent',
        background: selected ? '#e6f4ff' : ticket.isRead ? '#fff' : '#f6ffed',
        borderRight: overdue ? '4px solid #ff4d4f' : '4px solid transparent',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Space wrap={false} style={{ gap: 8, width: '100%' }}>
        {!ticket.isRead && (
          <span
            style={{
              display: 'inline-block',
              flex: 'none',
              width: 8,
              height: 8,
              borderRadius: 8,
              background: '#1677ff',
            }}
          />
        )}
        <Typography.Text strong={!ticket.isRead} ellipsis style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
          {ticket.title}
        </Typography.Text>
        <span style={{ flex: 'none' }}>
          <PriorityTag priority={ticket.priority} />
        </span>
        <span style={{ flex: 'none' }}>
          <StatusBadge status={ticket.status} />
        </span>
        {overdue && (
          <Typography.Text type="danger" style={{ fontSize: 11, flex: 'none' }}>
            ⏰ Trễ
          </Typography.Text>
        )}
      </Space>
      <Space direction="vertical" size={0} style={{ marginTop: 4 }}>
        <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
          {ticket.description?.replace(/<[^>]*>/g, ' ').slice(0, 100)}...
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {ageLabel(ticket.createdAt)} · {dayjs(ticket.createdAt).format('DD/MM/YYYY')} ·{' '}
          {ticket.createdBy?.name ?? ''}
        </Typography.Text>
      </Space>
    </div>
  );
}

interface RowData {
  tickets: Ticket[];
  selectedId?: string;
  onSelect: (id: string) => void;
  markOverdue: boolean;
}

function Row({ index, style, tickets, selectedId, onSelect, markOverdue }: RowData & { index: number; style: React.CSSProperties }) {
  if (index < 0 || index >= tickets.length) {
    return <div style={style} />;
  }
  const ticket = tickets[index];
  if (!ticket || !ticket.id) {
    return <div style={style} />;
  }
  const selected = ticket.id === selectedId;
  return (
    <div style={style}>
      <TicketRow
        ticket={ticket}
        selected={selected}
        onSelect={() => onSelect(ticket.id)}
        markOverdue={markOverdue}
      />
    </div>
  );
}

export default function VirtualTicketList({
  tickets,
  selectedId,
  onSelect,
  markOverdue = false,
  height,
  itemHeight = 100,
}: VirtualTicketListProps) {
  // Defensive: ensure tickets is always an array, filter out null/undefined
  const safeTickets = Array.isArray(tickets) ? tickets.filter(Boolean) : [];
  const wrapHeight: number | string = height ?? '100%';

  // Khi không truyền height: đo chiều cao thật của khung chứa để list luôn
  // cuộn trong box (thanh cuộn riêng) thay vì kéo giãn trang ra vô hạn
  const wrapRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(0);
  useEffect(() => {
    if (height != null || !wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => setMeasured(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);
  const listHeight: number = height ?? (measured > 0 ? measured : 400);

  if (safeTickets.length === 0) {
    return (
      <div style={{ height: wrapHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', background: '#fafafa', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ color: '#999' }}>Không có ticket</div>
        </div>
      </div>
    );
  }

  // @ts-ignore
  return (
    <div ref={wrapRef} style={{ height: wrapHeight, width: '100%', overflow: 'hidden' }}>
      <FixedSizeList
        height={listHeight}
        rowCount={safeTickets.length}
        rowHeight={itemHeight}
        rowComponent={Row}
        // @ts-ignore react-window v2 maps forbidden keys (index/style) to never
        rowProps={{
          tickets: safeTickets,
          selectedId,
          onSelect,
          markOverdue,
        }}
        rowKey={(index) => safeTickets[index]?.id ?? index}
        overscanCount={5}
      />
    </div>
  );
}
