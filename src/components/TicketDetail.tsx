import { Button, Descriptions, Divider, Empty, Select, Space, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { STATUS, STATUS_LIST, STATUS_LABELS } from '../constants';
import type { Ticket, TicketStatus } from '../types';
import PriorityTag from './PriorityTag';
import StatusBadge from './StatusBadge';
import RichTextViewer from './RichTextViewer';
import AttachmentList from './AttachmentList';
import TicketComments from './TicketComments';
import ActivityLog from './ActivityLog';
import type { ReactNode } from 'react';

interface TicketDetailProps {
  ticket: Ticket;
  token: string;
  canReply: boolean;
  isIT: boolean;
  onChanged?: () => void;
  version?: number;
  extra?: ReactNode;
  /** IT: bật combo đổi trạng thái ngay ở thanh trạng thái */
  onChangeStatus?: (status: TicketStatus) => void;
  statusLoading?: boolean;
}

/** Cột phải: thông tin + mô tả + file + trao đổi của 1 ticket */
export default function TicketDetail({
  ticket,
  token,
  canReply,
  isIT,
  onChanged,
  version = 0,
  extra,
  onChangeStatus,
  statusLoading = false,
}: TicketDetailProps) {
  if (!ticket) return <Empty description="Chọn 1 ticket để xem chi tiết" style={{ paddingTop: 80 }} />;

  return (
    <div style={{ maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', padding: '0 16px' }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {ticket.title}
      </Typography.Title>

      <Space wrap style={{ marginBottom: 8 }}>
        {onChangeStatus ? (
          <>
            <Select
              value={ticket.status}
              loading={statusLoading}
              style={{ minWidth: 220 }}
              onChange={(v: TicketStatus) => onChangeStatus(v)}
              options={STATUS_LIST.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={statusLoading}
              onClick={() => onChangeStatus(STATUS.RESOLVED)}
            >
              Đã xử lý
            </Button>
          </>
        ) : (
          <StatusBadge status={ticket.status} />
        )}
        <PriorityTag priority={ticket.priority} />
        {extra}
      </Space>

      <Descriptions size="small" column={2} style={{ marginBottom: 8 }}>
        <Descriptions.Item label="Category">{ticket.category}</Descriptions.Item>
        <Descriptions.Item label="Người tạo">{ticket.createdBy?.name ?? ticket.createdBy?.email ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="IT xử lý">{ticket.assignedTo?.name ?? ticket.assignedTo?.email ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Người duyệt">{ticket.managerApprover?.name ?? ticket.managerApprover?.email ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">{ticket.createdAt ? dayjs(ticket.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
        {ticket.approvedDate && (
          <Descriptions.Item label="Ngày duyệt">{dayjs(ticket.approvedDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
        )}
      </Descriptions>

      <Divider>
        <Typography.Text strong>Mô tả</Typography.Text>
      </Divider>
      <RichTextViewer html={ticket.description} />

      <Divider>
        <Typography.Text strong>File đính kèm</Typography.Text>
      </Divider>
      <AttachmentList ticketId={ticket.id} token={token} />

<TicketComments
        ticketId={ticket.id}
        canReply={canReply}
        isIT={isIT}
        onChanged={onChanged}
        version={version}
      />
      <ActivityLog ticket={ticket} token={token} />
    </div>
  );
}

