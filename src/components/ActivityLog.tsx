import { Timeline } from 'antd';
import { ClockCircleOutlined, EditOutlined, CommentOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { getComments } from '../services/ticketsService';
import type { Ticket, TicketComment, Person } from '../types';

interface ActivityLogProps {
  ticket: Ticket;
  token: string;
}

const ACTIVITY_ICONS = {
  created: ClockCircleOutlined,
  status_change: EditOutlined,
  comment: CommentOutlined,
  assigned: UserOutlined,
  approved: CheckCircleOutlined,
} as const;

function formatActivityTime(dateStr: string) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : dateStr;
}

/** Sinh lịch sử hoạt động từ ticket + comments */
function generateActivities(ticket: Ticket, comments: TicketComment[]) {
  const activities: Array<{
    key: string;
    type: 'created' | 'status_change' | 'comment' | 'assigned' | 'approved';
    time: string;
    content: string;
    user: { name: string; email: string };
  }> = [];

  // Helper to normalize Person to {name, email}
  const norm = (p: Person | null | undefined) => ({
    name: p?.name ?? 'Unknown',
    email: p?.email ?? '',
  });

  // 1. Ticket created
  activities.push({
    key: `created-${ticket.id}`,
    type: 'created',
    time: ticket.createdAt,
    content: `Tạo ticket: "${ticket.title}"`,
    user: norm(ticket.createdBy),
  });

  // 2. Comments
  comments.forEach(c => {
    activities.push({
      key: c.id,
      type: 'comment',
      time: c.createdAt,
      content: c.isInternal ? `[Nội bộ] ${c.content.replace(/<[^>]*>/g, '').slice(0, 100)}...` : c.content.replace(/<[^>]*>/g, '').slice(0, 100) + '...',
      user: norm(c.createdBy),
    });
  });

  // 3. Status changes inferred from updatedAt (simplified)
  if (ticket.updatedAt !== ticket.createdAt) {
    const updater = ticket.assignedTo ?? ticket.managerApprover;
    activities.push({
      key: `updated-${ticket.id}`,
      type: 'status_change',
      time: ticket.updatedAt,
      content: `Cập nhật trạng thái thành: ${ticket.status}`,
      user: norm(updater),
    });
  }

  // 4. Assigned
  if (ticket.assignedTo?.email) {
    activities.push({
      key: `assigned-${ticket.id}`,
      type: 'assigned',
      time: ticket.approvedDate ?? ticket.updatedAt,
      content: `Gán cho IT xử lý: ${ticket.assignedTo.name}`,
      user: norm(ticket.managerApprover),
    });
  }

  // 5. Approved
  if (ticket.approvedDate && ticket.managerApprover?.email) {
    activities.push({
      key: `approved-${ticket.id}`,
      type: 'approved',
      time: ticket.approvedDate,
      content: `Manager duyệt ticket`,
      user: norm(ticket.managerApprover),
    });
  }

  // Sort by time descending
  return activities.sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf());
}

export default function ActivityLog({ ticket, token }: ActivityLogProps) {
  const [comments, setComments] = useState<TicketComment[]>([]);

  useEffect(() => {
    let mounted = true;
    getComments(token, ticket.id).then(data => {
      if (mounted) setComments(data);
    });
    return () => { mounted = false; };
  }, [token, ticket.id]);

  const activities = useMemo(() => generateActivities(ticket, comments), [ticket, comments]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Lịch sử hoạt động</div>
      <Timeline
        mode="left"
        items={activities.map(a => ({
          key: a.key,
          time: formatActivityTime(a.time),
          label: (
            <span>
              <strong>{a.user.name}</strong> <span style={{ color: '#888', fontSize: 12 }}>({a.user.email})</span>
            </span>
          ),
          children: a.content,
          icon: (
            <span style={{ color: '#1677ff' }}>
              {React.createElement(ACTIVITY_ICONS[a.type])}
            </span>
          ),
        }))}
      />
    </div>
  );
}