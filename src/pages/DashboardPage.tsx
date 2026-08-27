import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Table, DatePicker, Alert } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs, { type Dayjs } from 'dayjs';
import { useAuth } from '../auth/useAuth';
import { useRole } from '../context/RoleContext';
import { useDemoIdentity } from '../context/DemoIdentityContext';
import { listTickets } from '../services/ticketsService';
import { REGIONS, USER_BRANCHES } from '../services/mockData';
import { STATUS } from '../constants';
import type { Ticket } from '../types';

const COLORS = ['#1677ff', '#faad14', '#52c41a', '#ff4d4f', '#722ed1', '#fa8c16', '#13c2c2'];

const SLA_DAYS: Record<string, number> = {
  Critical: 1,
  High: 2,
  Medium: 5,
  Low: 7,
};

/** Khu vực mà manager đang phụ trách (tra theo email trong danh sách khu vực) */
function regionNameForManager(email: string): string {
  return REGIONS.find((r) => r.manager.email.toLowerCase() === email.toLowerCase())?.name ?? '';
}

function calcSLADays(status: string, createdAt: string): number {
  const days = Math.floor((Date.now() - Date.parse(createdAt)) / 86_400_000);
  const limit = (SLA_DAYS as Record<string, number>)[status] ?? 3;
  return days - limit; // positive = overdue
}

export default function DashboardPage() {
  const { getToken, email } = useAuth();
  const { role } = useRole();
  const demoIdentity = useDemoIdentity();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | []>([]);

  const isManager = role === 'manager';
  const managerRegion = useMemo(() => {
    if (!isManager) return '';
    return demoIdentity.profile?.region ?? regionNameForManager(email);
  }, [isManager, demoIdentity.profile, email]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await getToken();
      if (!t) return;
      const data = await listTickets(t, '');
      setTickets(data);
    } catch (e) {
      message.error(`Không tải được dữ liệu: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  // Manager khu vực: chỉ xem ticket thuộc khu vực mình phụ trách (managerApprover = email)
  const regionFiltered = useMemo(() => {
    if (!isManager) return tickets;
    return tickets.filter((t) => t.managerApprover?.email?.toLowerCase() === email.toLowerCase());
  }, [tickets, isManager, email]);

  // Lọc theo khoảng thời gian (từ ngày → đến ngày, chọn bất kỳ lúc nào)
  const filtered = useMemo(() => {
    let result = regionFiltered;
    if (dateRange.length === 2) {
      const start = dateRange[0].startOf('day').valueOf();
      const end = dateRange[1].endOf('day').valueOf();
      result = result.filter(t => {
        const created = Date.parse(t.createdAt);
        return created >= start && created <= end;
      });
    }
    return result;
  }, [regionFiltered, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const byStatus = filtered.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byPriority = filtered.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byCategory = filtered.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {} as Record<string, number>);
    const resolved = filtered.filter(t => t.status === STATUS.RESOLVED || t.status === STATUS.CLOSED);
    const avgResolveDays = resolved.length
      ? resolved.reduce((sum, t) => sum + (Date.parse(t.updatedAt) - Date.parse(t.createdAt)) / 86_400_000, 0) / resolved.length
      : 0;

    const byBranch = filtered.reduce((acc, t) => {
      const e = t.createdBy?.email?.toLowerCase() ?? '';
      const branch = USER_BRANCHES[e] ?? 'Khác';
      acc[branch] = (acc[branch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byStatus, byPriority, byCategory, byBranch, avgResolveDays: Math.round(avgResolveDays * 10) / 10 };
  }, [filtered]);

  // SLA Data
  const slaData = useMemo(() => {
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    return priorities.map(p => {
      const ticketsP = filtered.filter(t => t.priority === p);
      const total = ticketsP.length;
      const resolved = ticketsP.filter(t => t.status === STATUS.RESOLVED || t.status === STATUS.CLOSED);
      const overdue = ticketsP.filter(t => calcSLADays(t.priority, t.createdAt) > 0);
      const onTime = resolved.filter(t => calcSLADays(t.priority, t.createdAt) <= 0).length;
      const overdueDays = overdue.reduce((sum, t) => sum + Math.max(0, calcSLADays(t.priority, t.createdAt)), 0);
      return {
        priority: p,
        total,
        resolved: resolved.length,
        overdue: overdue.length,
        onTimeRate: total ? (onTime / total) * 100 : 100,
        avgOverdueDays: overdue.length ? overdueDays / overdue.length : 0,
      };
    });
  }, [filtered]);

  // CSAT Data (mock - in real app would come from survey responses)
  const csatData = useMemo(() => {
    const closed = filtered.filter(t => t.status === STATUS.CLOSED);
    return closed.map(t => ({
      id: t.id,
      title: t.title,
      creator: t.createdBy?.name ?? '',
      closedAt: dayjs(t.updatedAt).format('DD/MM/YYYY'),
      rating: null, // would come from survey
      feedback: '', // would come from survey
    }));
  }, [filtered]);

  if (loading) return <Spin size="large" style={{ padding: 100 }} />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard Thống Kê{isManager && managerRegion ? ` · Khu vực ${managerRegion}` : ''}</h2>
          <span style={{ color: '#888', fontSize: 13 }}>
            {isManager
              ? `Manager chỉ thấy ticket thuộc khu vực ${managerRegion || 'của mình'}`
              : 'Dữ liệu toàn hệ thống'}
          </span>
        </div>
        <DatePicker.RangePicker
          format="DD/MM/YYYY"
          value={dateRange.length === 2 ? dateRange : undefined}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
            else setDateRange([]);
          }}
          placeholder={['Từ ngày', 'Đến ngày']}
          style={{ width: 320 }}
        />
      </div>

      {isManager && managerRegion && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Bạn là Manager khu vực ${managerRegion} - Dashboard chỉ tổng hợp ticket thuộc khu vực này.`}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng ticket" value={stats.total} precision={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đang xử lý" value={(stats.byStatus[STATUS.ASSIGNED_TO_IT] ?? 0) + (stats.byStatus[STATUS.IN_PROGRESS] ?? 0)} precision={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Đã giải quyết" value={(stats.byStatus[STATUS.RESOLVED] ?? 0) + (stats.byStatus[STATUS.CLOSED] ?? 0)} precision={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Thời gian TB giải quyết (ngày)" value={stats.avgResolveDays} precision={1} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="Ticket theo Trạng thái">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                >
                  {Object.entries(stats.byStatus).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Ticket theo Mức độ ưu tiên">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.byPriority).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                >
                  {Object.entries(stats.byPriority).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Card title="Ticket theo Danh mục">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1677ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {isManager && (
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card title={`Ticket theo Chi nhánh ${managerRegion ? `(Khu vực ${managerRegion})` : ''}`}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(stats.byBranch).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#fa8c16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* SLA Report */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Báo cáo SLA (Ticket quá hạn theo Priority)">
            <Table
              columns={[
                { title: 'Priority', dataIndex: 'priority', key: 'priority' },
                { title: 'Tổng', dataIndex: 'total', key: 'total' },
                { title: 'Đã giải quyết', dataIndex: 'resolved', key: 'resolved' },
                { title: 'Quá hạn SLA', dataIndex: 'overdue', key: 'overdue' },
                { title: 'Tỷ lệ đúng hạn (%)', dataIndex: 'onTimeRate', key: 'onTimeRate', render: (v: number) => `${v.toFixed(1)}%` },
                { title: 'TB ngày quá hạn', dataIndex: 'avgOverdueDays', key: 'avgOverdueDays', render: (v: number) => v.toFixed(1) },
              ]}
              dataSource={slaData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* CSAT Survey */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Khảo sát hài lòng (CSAT) - Ticket đã đóng">
            <Table
              columns={[
                { title: 'Ticket ID', dataIndex: 'id', key: 'id' },
                { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
                { title: 'Người tạo', dataIndex: 'creator', key: 'creator' },
                { title: 'Ngày đóng', dataIndex: 'closedAt', key: 'closedAt' },
                { title: 'Đánh giá', dataIndex: 'rating', key: 'rating', render: (v: number | null) => v ? `${v}/5 ⭐` : 'Chưa đánh giá' },
                { title: 'Phản hồi', dataIndex: 'feedback', key: 'feedback' },
              ]}
              dataSource={csatData}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}