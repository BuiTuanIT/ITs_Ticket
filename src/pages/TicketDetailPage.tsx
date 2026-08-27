import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Divider, Spin, message } from 'antd';
import { useAuth } from '../auth/useAuth';
import { useRole } from '../context/RoleContext';
import { getTicket, updateStatus } from '../services/ticketsService';
import { EMPLOYEE_REPLYABLE_STATUS } from '../constants';
import type { Ticket, TicketStatus } from '../types';
import TicketDetail from '../components/TicketDetail';
import ManagerActions from '../components/ManagerActions';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { email, displayName, getToken } = useAuth();
  const { role, can } = useRole();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const t = await getToken();
      if (t) setToken(t);
      setTicket(await getTicket(t!, id));
      setVersion((v) => v + 1);
    } catch (e) {
      message.error(`Không tải được ticket: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  // IT đổi trạng thái ngay ở thanh trạng thái (combo box) → auto-assign người đổi
  const changeStatus = async (status: TicketStatus) => {
    try {
      await updateStatus(token, id!, status, '', { email, name: displayName });
      message.success(`Đã đổi trạng thái: ${status}`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!ticket) {
    return <Card>Không tìm thấy ticket</Card>;
  }

  // Employee trả lời được khi ticket ở trạng thái "hoạt động" + ĐÃ có trao đổi
  // (kiểm tra hasExchange trong TicketComments). Manager trả lời qua ManagerActions.
  const canReply =
    role === 'it'
      ? can('reply')
      : role === 'employee'
        ? EMPLOYEE_REPLYABLE_STATUS.includes(ticket.status)
        : false;

  return (
    <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8 }}>
      <TicketDetail
        ticket={ticket}
        token={token}
        canReply={canReply}
        isIT={role === 'it'}
        onChanged={() => void load()}
        version={version}
        onChangeStatus={role === 'it' ? (s) => void changeStatus(s) : undefined}
      />
      {role === 'manager' && ticket.status === 'Pending Approval' && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ padding: 16, background: '#fff' }}>
            <ManagerActions ticket={ticket} token={token} onChanged={() => void load()} />
          </div>
        </>
      )}
    </Card>
  );
}