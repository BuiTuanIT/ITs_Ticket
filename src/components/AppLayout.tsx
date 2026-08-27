import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Select, Space, Tag, Typography } from 'antd';
import {
  AreaChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  LogoutOutlined,
  PlusOutlined,
  SafetyOutlined,
  SendOutlined,
  TagOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/useAuth';
import { useRole } from '../context/RoleContext';
import { useDemoIdentity } from '../context/DemoIdentityContext';
import { useUnreadCounts } from '../context/UnreadContext';
import { ROLE_LABEL } from '../constants';
import { isDemo, DEMO_PROFILES } from '../services/demo';

const { Sider, Header, Content } = Layout;

/** Sidebar chính kiểu Outlook: danh mục folder theo role */
export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { displayName, email, logout } = useAuth();
  const { role } = useRole();
  const demoIdentity = useDemoIdentity();
  const { counts } = useUnreadCounts();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const menuItems = [
    { key: '/inbox', icon: <InboxOutlined />, label: 'Inbox', count: counts.inbox },
    { key: '/sent', icon: <SendOutlined />, label: 'Sent', count: counts.sent },
    ...(role === 'manager' || role === 'it'
      ? [{ key: '/need-action', icon: <TagOutlined />, label: 'Need Action', count: counts['need-action'] }]
      : []),
    ...(role === 'it' || role === 'manager'
      ? [{ key: '/dashboard', icon: <AreaChartOutlined />, label: 'Dashboard' }]
      : []),
    ...(role === 'it'
      ? [
          { key: '/handled', icon: <CheckCircleOutlined />, label: 'Đã xử lý', count: counts.handled },
          { key: '/all', icon: <FolderOpenOutlined />, label: 'All Tickets', count: counts.all },
          { key: '/admin', icon: <SafetyOutlined />, label: 'Admin' },
        ]
      : []),
  ];

  const userMenu = {
    items: [
      { key: 'email', label: email, disabled: true },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 18,
          }}
        >
          🎫 {collapsed ? 'IT' : 'IT Support'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[menuItems.find((m) => isActive(m.key))?.key ?? '/inbox']}
          onClick={({ key }) => navigate(key)}
        >
          {menuItems.map((item) => (
            <Menu.Item key={item.key}>
              {item.icon}
              <span>{item.label}</span>
              {item.count && item.count > 0 && (
                <Badge count={item.count} style={{ marginLeft: 8 }} />
              )}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Space size="large">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {menuItems.find((m) => isActive(m.key))?.label ?? 'IT Support'}
            </Typography.Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/new')}
            >
              New Ticket
            </Button>
          </Space>

          <Space size="large">
            <Button type="text" icon={<BellOutlined />} />
            {isDemo && (
              <Space>
                <Tag color="purple">Demo</Tag>
                <Select
                  value={demoIdentity.profile?.key ?? DEMO_PROFILES[0].key}
                  style={{ width: 240 }}
                  onChange={(key) => demoIdentity.setProfile(key)}
                  options={DEMO_PROFILES.map((p) => ({
                    value: p.key,
                    label: `${p.name} (${p.role}${p.branch ? ` · ${p.branch}` : ''}${p.region ? ` · ${p.region}` : ''})`,
                  }))}
                />
              </Space>
            )}
            <Dropdown menu={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>
                  {displayName} <Typography.Text type="secondary">({ROLE_LABEL[role ?? 'employee']})</Typography.Text>
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
