import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Checkbox, Divider, Empty, Space, Spin, Typography, message } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TicketComment } from '../types';
import { useAuth } from '../auth/useAuth';
import { useRole } from '../context/RoleContext';
import { getComments, addComment } from '../services/ticketsService';
import RichTextEditor from './RichTextEditor';
import RichTextViewer from './RichTextViewer';

interface TicketCommentsProps {
  ticketId: string;
  canReply: boolean;
  /** true nếu là IT (được tạo comment nội bộ) */
  isIT?: boolean;
  onChanged?: () => void;
  /** tăng lên khi nội dung thay đổi từ bên ngoài (VD manager reject/moreinfo) để load lại */
  version?: number;
}

export default function TicketComments({
  ticketId,
  canReply,
  isIT = false,
  onChanged,
  version = 0,
}: TicketCommentsProps) {
  const { getToken } = useAuth();
  const { role } = useRole();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const list = await getComments(token, ticketId);
      setComments(list);
    } catch {
      message.error('Không tải được bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, version]);

  const submit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const token = await getToken();
      if (!token) return;
      await addComment(token, ticketId, { content, isInternal });
      setContent('');
      setIsInternal(false);
      await load();
      onChanged?.();
      message.success('Đã gửi phản hồi');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const visible = isIT ? comments : comments.filter((c) => !c.isInternal);

  // Employee CHỈ được trả lời khi đã có trao đổi từ Manager/IT (có comment trước đó).
  const hasExchange = comments.length > 0;
  const showReply = canReply && !(role === 'employee' && !hasExchange);

  return (
    <div>
      <Divider>
        <Typography.Text strong>Trao đổi ({visible.length})</Typography.Text>
      </Divider>

      {visible.length === 0 && !loading ? (
        <Empty description="Chưa có trao đổi nào" style={{ padding: '16px 0' }} />
      ) : (
        visible.map((c) => (
          <div key={c.id} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
            <Space style={{ marginBottom: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <Typography.Text strong>{c.createdBy.name ?? 'Unknown'}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(c.createdAt).format('DD/MM/YYYY HH:mm')}
              </Typography.Text>
              {c.isInternal && (
                <Typography.Text type="warning" style={{ fontSize: 12 }}>
                  [Nội bộ IT]
                </Typography.Text>
              )}
            </Space>
            <RichTextViewer html={c.content} />
          </div>
        ))
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin />
        </div>
      )}

      {showReply && (
        <div style={{ marginTop: 16 }}>
          {isInternal && isIT && (
            <Alert
              type="info"
              showIcon
              message='Bạn đang ở chế độ IT. Bật "Nội bộ IT" để comment chỉ IT thấy.'
              style={{ marginBottom: 8 }}
            />
          )}
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Nhập câu trả lời..."
            minHeight={180}
          />
          <Space style={{ marginTop: 8, width: '100%', justifyContent: 'flex-end' }}>
            {isIT && (
              <Checkbox checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)}>
                Nội bộ IT
              </Checkbox>
            )}
            <Button type="primary" icon={<SendOutlined />} loading={sending} disabled={!content.trim()} onClick={() => void submit()}>
              Gửi
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}

