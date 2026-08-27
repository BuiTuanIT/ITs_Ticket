import { updateStatus } from '../services/ticketsService';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Spin,
  Space,
  message,
} from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { type Dayjs } from 'dayjs';
import { useAuth } from '../auth/useAuth';
import { useRole } from '../context/RoleContext';
import { listTickets, markRead } from '../services/ticketsService';
import {
  EMPLOYEE_REPLYABLE_STATUS,
  HANDLED_STATUS,
  IT_ACTIVE_STATUS,
  OVERDUE_DAYS,
  DEFAULT_OVERDUE_DAYS,
} from '../constants';
import { isDemo } from '../services/demo';
import { mockComments } from '../services/mockData';
import type { InboxFolder, Ticket, TicketStatus } from '../types';
import VirtualTicketList from '../components/VirtualTicketList';
import ManagerActions from '../components/ManagerActions';
import TicketDetail from '../components/TicketDetail';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useUnreadCounts } from '../context/UnreadContext';

const PAGE_SIZE = 20;

function folderFromPath(path: string): InboxFolder {
  if (path.startsWith('/sent')) return 'sent';
  if (path.startsWith('/need-action')) return 'need-action';
  if (path.startsWith('/handled')) return 'handled';
  if (path.startsWith('/all')) return 'all';
  return 'inbox';
}

/** Xác định ticket đã có trao đổi (Manager/IT đã phản hồi). */
function hasExchange(ticketId: string): boolean {
  if (isDemo) return (mockComments[ticketId]?.length ?? 0) > 0;
  return true;
}

/** Số ngày kể từ khi ticket được tạo */
function ticketAgeDays(createdAt: string): number {
  if (!createdAt) return 0;
  const diff = Date.now() - Date.parse(createdAt);
  return Math.max(0, Math.floor(diff / 86_400_000));
}

/** Ticket có quá hạn xử lý hay không (theo Priority) */
function isOverdue(t: Ticket): boolean {
  if (!IT_ACTIVE_STATUS.includes(t.status)) return false;
  const limit = OVERDUE_DAYS[t.priority] ?? DEFAULT_OVERDUE_DAYS;
  return ticketAgeDays(t.createdAt) > limit;
}

/** Lọc danh sách theo folder + role */
function filterTickets(
  tickets: Ticket[],
  folder: InboxFolder,
  role: string,
  email: string,
): Ticket[] {
  const mine = (t: Ticket) => t.createdBy?.email?.toLowerCase() === email.toLowerCase();
  const byRegion = (t: Ticket) => t.managerApprover?.email?.toLowerCase() === email.toLowerCase();
  switch (folder) {
    case 'inbox':
      if (role === 'manager') return tickets.filter((t) => t.status === 'Pending Approval' && byRegion(t));
      if (role === 'it') return tickets.filter((t) => IT_ACTIVE_STATUS.includes(t.status));
      return tickets.filter((t) => mine(t) && hasExchange(t.id));
    case 'sent':
      return tickets.filter(mine);
    case 'need-action':
      if (role === 'manager') return tickets.filter((t) => t.status === 'Pending Approval' && byRegion(t));
      if (role === 'it') return tickets.filter((t) => IT_ACTIVE_STATUS.includes(t.status));
      return tickets.filter((t) => t.status === 'Need More Info' && mine(t));
    case 'handled':
      return tickets.filter((t) => HANDLED_STATUS.includes(t.status));
    default:
      return tickets;
  }
}

export default function InboxPage() {
  const location = useLocation();
  const { email, displayName, getToken } = useAuth();
  const { role } = useRole();
  const folder = useMemo(() => folderFromPath(location.pathname), [location.pathname]);
  const { updateCounts } = useUnreadCounts();

  const [all, setAll] = useState<Ticket[]>([]);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Search & Filter state
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | []>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);

  // Polling
  const pollingRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Load tickets
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await getToken();
      if (!t) return;
      setToken(t);
      const data = await listTickets(t, email);
      setAll(data);
      setCurrentPage(1);

      // Cập nhật số lượng chưa đọc
      const mine = (t: Ticket) => t.createdBy?.email?.toLowerCase() === email.toLowerCase();
      const byRegion = (t: Ticket) => t.managerApprover?.email?.toLowerCase() === email.toLowerCase();
      const inboxUnread = data.filter(t => !t.isRead && (
        role === 'manager' ? (t.status === 'Pending Approval' && byRegion(t)) :
        role === 'it' ? IT_ACTIVE_STATUS.includes(t.status) :
        (mine(t) && hasExchange(t.id))
      )).length;
      const sentUnread = data.filter(t => !t.isRead && mine(t)).length;
      const needActionUnread = data.filter(t => !t.isRead && (
        role === 'manager' ? (t.status === 'Pending Approval' && byRegion(t)) :
        role === 'it' ? IT_ACTIVE_STATUS.includes(t.status) :
        (t.status === 'Need More Info' && mine(t))
      )).length;
      const handledUnread = data.filter(t => !t.isRead && HANDLED_STATUS.includes(t.status)).length;
      const allUnread = data.filter(t => !t.isRead).length;

      updateCounts({
        inbox: inboxUnread,
        sent: sentUnread,
        'need-action': needActionUnread,
        handled: handledUnread,
        all: allUnread,
      });
    } catch (e) {
      message.error(`Không tải được ticket: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [getToken, email, role, updateCounts]);

  // Polling setup
  useEffect(() => {
    isMountedRef.current = true;
    pollingRef.current = window.setInterval(() => {
      if (isMountedRef.current) {
        load();
      }
    }, 30_000);
    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    if (token) await markRead(token, id, email);
    void load();
  };

  // Search & Filter helpers
  function matchesSearch(t: Ticket): boolean {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.id.includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false) ||
      (t.createdBy?.name?.toLowerCase().includes(q) ?? false)
    );
  }

  function matchesFilter(t: Ticket): boolean {
    if (statusFilter.length && !statusFilter.includes(t.status)) return false;
    if (priorityFilter.length && !priorityFilter.includes(t.priority)) return false;
    if (categoryFilter.length && !categoryFilter.includes(t.category)) return false;
    if (dateRange.length === 2) {
      const start = dateRange[0].startOf('day').valueOf();
      const end = dateRange[1].endOf('day').valueOf();
      const created = Date.parse(t.createdAt);
      if (created < start || created > end) return false;
    }
    return true;
  }

  const filtered = useMemo(
    () => (filterTickets(all, folder, role ?? 'employee', email) ?? []).filter(matchesSearch).filter(matchesFilter),
    [all, folder, role, email, searchText, statusFilter, priorityFilter, categoryFilter, dateRange],
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  const pagedTickets = useMemo(() => (filtered ?? []).slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);

  // Overdue alert for IT
  const overdueCount = useMemo(
    () => all.filter(isOverdue).length,
    [all],
  );

  const selected = useMemo(() => all.find((t) => t.id === selectedId) ?? null, [all, selectedId]);

  // Reply permissions
  const canReply =
    role === 'it'
      ? true
      : role === 'employee'
        ? selected ? EMPLOYEE_REPLYABLE_STATUS.includes(selected.status) : false
        : false;

  // IT status change handler
  const handleStatusChange = async (status: TicketStatus) => {
    if (!selected) return;
    try {
      await updateStatus(token, selected.id, status, '', { email, name: displayName });
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  if (loading && all.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Row
      gutter={16}
      style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fff', height: 'calc(100vh - 140px)', overflow: 'hidden' }}
    >
      {/* Left: List + Toolbar */}
      <Col xs={24} md={9} style={{ borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
        {/* Toolbar: Search + Filter */}
        <div style={{ padding: 12, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <Input
            placeholder="Tìm kiếm (ID, tiêu đề, nội dung, người tạo)..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            allowClear
            style={{ width: '100%', marginBottom: 8 }}
          />
          <Row gutter={8}>
            <Col span={12}>
              <Select
                mode="multiple"
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                options={['Pending Approval', 'Need More Info', 'Assigned to IT', 'In Progress', 'Resolved', 'Closed', 'Rejected'].map((s) => ({ value: s, label: s }))}
              />
            </Col>
            <Col span={12}>
              <Select
                mode="multiple"
                placeholder="Ưu tiên"
                value={priorityFilter}
                onChange={setPriorityFilter}
                style={{ width: '100%' }}
                options={['Low', 'Medium', 'High', 'Critical'].map((s) => ({ value: s, label: s }))}
              />
            </Col>
            <Col span={12}>
              <Select
                mode="multiple"
                placeholder="Phân loại"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: '100%' }}
                options={['Hardware', 'Software', 'Network', 'Account', 'Security', 'Other'].map((s) => ({ value: s, label: s }))}
              />
            </Col>
            <Col span={12}>
              <DatePicker.RangePicker
                format="DD/MM/YYYY"
                value={dateRange.length === 2 ? dateRange : undefined}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  } else {
                    setDateRange([]);
                  }
                }}
                style={{ width: '100%' }}
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Col>
          </Row>
          <Space style={{ marginTop: 8 }}>
            <Button icon={<SyncOutlined />} onClick={() => void load()} loading={loading}>
              Làm mới
            </Button>
            <Button icon={<FilterOutlined />} onClick={() => { setStatusFilter([]); setPriorityFilter([]); setCategoryFilter([]); setDateRange([]); }}>
              Xóa bộ lọc
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              Tải lại
            </Button>
          </Space>
        </div>

        {/* Overdue Alert */}
        {role === 'it' && overdueCount > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`Có ${overdueCount} ticket quá hạn chưa xử lý (theo hạn mức từng ưu tiên)`}
            style={{ margin: '8px 8px 0', fontSize: 13 }}
          />
        )}

        {/* Virtual List */}
        <div style={{ flex: 1, overflow: 'hidden', padding: 8 }}>
          <ErrorBoundary fallback={<div style={{ height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4f' }}>Lỗi hiển thị danh sách. <button onClick={() => window.location.reload()}>Tải lại</button></div>}>
            <VirtualTicketList
              key={filtered.length + '-' + currentPage + '-' + (role || '')}
              tickets={pagedTickets}
              selectedId={selectedId}
              onSelect={handleSelect}
              markOverdue={role === 'it' ? true : false}
            />
          </ErrorBoundary>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            showQuickJumper
            showSizeChanger
            current={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onChange={(page) => setCurrentPage(page)}
            onShowSizeChange={() => { setCurrentPage(1); }}
            style={{ margin: '8px', justifyContent: 'center' }}
            showTotal={(total) => `Tổng ${total} ticket`}
          />
        )}
      </Col>

      {/* Right: Detail */}
      <Col xs={24} md={15} style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
        {selected ? (
          <div>
            <TicketDetail
              ticket={selected}
              token={token}
              canReply={canReply}
              isIT={role === 'it'}
              onChanged={() => void load()}
              version={selected.updatedAt ? Date.parse(selected.updatedAt) : 0}
              onChangeStatus={role === 'it' ? (s) => void handleStatusChange(s) : undefined}
            />
            {role === 'manager' && selected.status === 'Pending Approval' && (
              <div style={{ padding: '0 16px 16px' }}>
                <ManagerActions ticket={selected} token={token} onChanged={() => void load()} />
              </div>
            )}
          </div>
        ) : (
          <Empty description="Chọn 1 ticket để xem chi tiết" style={{ paddingTop: 100 }} />
        )}
      </Col>
    </Row>
  );
}
