import { useState } from 'react';
import { Alert, Button, Space, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../auth/useAuth';
import { assignIT, addComment, requestMoreInfo, updateStatus } from '../services/ticketsService';
import { STATUS } from '../constants';
import type { Ticket } from '../types';
import RichTextEditor from './RichTextEditor';

type ManagerAction = 'reject' | 'moreinfo' | null;

/**
 * Nút hành động của Manager (Approve / Reject / More Information).
 * Khi bấm Reject hoặc More Information mới hiện box trả lời phía dưới.
 * Dùng chung cho trang Inbox lẫn trang chi tiết.
 */
export default function ManagerActions({
  ticket,
  token,
  onChanged,
}: {
  ticket: Ticket;
  token: string;
  onChanged: () => void;
}) {
  const { role } = useRole();
  const { getToken } = useAuth();
  const [action, setAction] = useState<ManagerAction>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (role !== 'manager' || ticket.status !== STATUS.PENDING_APPROVAL) return null;

  const approve = async () => {
    setLoading(true);
    try {
      const t = await getToken();
      await assignIT(t ?? token, ticket.id, 'it@contoso.com');
      message.success('Đã duyệt · gán cho IT (Đang chờ xử lý)');
      setAction(null);
      setNote('');
      onChanged();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!note.trim()) {
      message.warning('Vui lòng nhập nội dung phản hồi');
      return;
    }
    setLoading(true);
    try {
      const t = await getToken();
      const tk = t ?? token;
      if (action === 'reject') {
        await updateStatus(tk, ticket.id, STATUS.REJECTED, note);
        await addComment(tk, ticket.id, { content: note, isInternal: false });
        message.warning('Ticket đã bị từ chối');
      } else {
        await requestMoreInfo(tk, ticket.id, note);
        message.info('Đã yêu cầu bổ sung thông tin');
      }
      setAction(null);
      setNote('');
      onChanged();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space>
        <Button type="primary" icon={<CheckCircleOutlined />} loading={loading} onClick={() => void approve()}>
          Approve
        </Button>
        <Button
          icon={<InfoCircleOutlined />}
          type={action === 'moreinfo' ? 'primary' : 'default'}
          onClick={() => {
            setAction((a) => (a === 'moreinfo' ? null : 'moreinfo'));
            setNote('');
          }}
        >
          More Information
        </Button>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          type={action === 'reject' ? 'primary' : 'default'}
          onClick={() => {
            setAction((a) => (a === 'reject' ? null : 'reject'));
            setNote('');
          }}
        >
          Reject
        </Button>
      </Space>

      {action && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            background: '#fafafa',
          }}
        >
          <Alert
            type={action === 'reject' ? 'error' : 'info'}
            showIcon
            message={
              action === 'reject'
                ? 'Bạn đang từ chối ticket. Ghi rõ lý do để gửi phản hồi cho employee.'
                : 'Bạn đang yêu cầu bổ sung thông tin. Nhập nội dung cần employee phản hồi.'
            }
            style={{ marginBottom: 12 }}
          />
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder="Nhập nội dung phản hồi..."
            minHeight={160}
          />
          <Space style={{ marginTop: 8, width: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setAction(null);
                setNote('');
              }}
            >
              Hủy
            </Button>
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => void submit()}>
              {action === 'reject' ? 'Xác nhận từ chối' : 'Gửi yêu cầu'}
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}