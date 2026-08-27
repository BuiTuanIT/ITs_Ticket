import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Select, Table, Tabs, Tag, message, Space, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SafetyOutlined, BranchesOutlined } from '@ant-design/icons';
import { useRole } from '../context/RoleContext';
import { isDemo } from '../services/demo';
import { REGIONS, BRANCHES, USER_BRANCHES } from '../services/mockData';
import { ROLE_LABEL } from '../constants';
import type { Role } from '../types';

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'it', label: 'IT Support' },
];

const REGION_OPTIONS = REGIONS.map(r => ({ value: r.name, label: r.name }));
const MANAGER_OPTIONS = [
  { value: 'minh.manager@contoso.com', label: 'Minh Quản Lý (Miền Bắc)' },
  { value: 'huy.manager@contoso.com', label: 'Huy Quản Lý (Miền Nam)' },
];

export default function AdminPage() {
  const { role, can } = useRole();
  const isAdmin = role === 'it' && can('viewInternalComments'); // Only IT admin can access

  return isAdmin ? <AdminConsole /> : (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h3>Chỉ IT Admin mới được truy cập trang quản trị</h3>
    </div>
  );
}

function AdminConsole() {
  // UserRoles tab
  const [userRoles, setUserRoles] = useState<Array<{ email: string; name: string; role: Role; branch?: string }>>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ email: string; name: string; role: Role; branch?: string } | null>(null);
  const [userForm] = Form.useForm();

  // Regions tab
  const [regions, setRegions] = useState<Array<{ name: string; manager: { email: string; name: string } }>>([]);
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<{ name: string; managerEmail: string; managerName: string } | null>(null);
  const [regionForm] = Form.useForm();

  // Branches tab
  const [branches, setBranches] = useState<Array<{ name: string; region: string }>>([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<{ name: string; region: string } | null>(null);
  const [branchForm] = Form.useForm();

  // Load initial data
  useEffect(() => {
    if (isDemo) {
      // Load from mock data
      const roles = Object.entries(USER_BRANCHES).map(([e, branch]) => ({
        email: e,
        name: e.split('@')[0],
        role: 'employee' as Role,
        branch,
      }));
      setUserRoles(roles);
      setRegions(REGIONS.map(r => ({ ...r })));
      setBranches(BRANCHES.map(b => ({ ...b })));
    }
  }, []);

  const saveUser = (values: { email: string; name: string; role: Role; branch?: string }) => {
    if (editingUser) {
      setUserRoles(prev => prev.map(u => u.email === editingUser.email ? { ...u, ...values } : u));
    } else {
      if (userRoles.some(u => u.email === values.email)) {
        message.error('Email đã tồn tại');
        return;
      }
      setUserRoles(prev => [...prev, { ...values }]);
    }
    message.success('Đã lưu user');
    setUserModalOpen(false);
    setEditingUser(null);
  };

  const deleteUser = (email: string) => {
    setUserRoles(prev => prev.filter(u => u.email !== email));
    message.success('Đã xóa user');
  };

  const saveRegion = (values: { name: string; managerEmail: string; managerName: string }) => {
    if (editingRegion) {
      setRegions(prev => prev.map(r => r.name === editingRegion.name ? { ...r, manager: { email: values.managerEmail, name: values.managerName } } : r));
    } else {
      if (regions.some(r => r.name === values.name)) {
        message.error('Khu vực đã tồn tại');
        return;
      }
      setRegions(prev => [...prev, { name: values.name, manager: { email: values.managerEmail, name: values.managerName } }]);
    }
    message.success('Đã lưu khu vực');
    setRegionModalOpen(false);
    setEditingRegion(null);
  };

  const deleteRegion = (name: string) => {
    setRegions(prev => prev.filter(r => r.name !== name));
    message.success('Đã xóa khu vực');
  };

  const saveBranch = (values: { name: string; region: string }) => {
    if (editingBranch) {
      setBranches(prev => prev.map(b => b.name === editingBranch.name ? { ...b, ...values } : b));
    } else {
      if (branches.some(b => b.name === values.name)) {
        message.error('Chi nhánh đã tồn tại');
        return;
      }
      setBranches(prev => [...prev, { name: values.name, region: values.region }]);
    }
    message.success('Đã lưu chi nhánh');
    setBranchModalOpen(false);
    setEditingBranch(null);
  };

  const deleteBranch = (name: string) => {
    setBranches(prev => prev.filter(b => b.name !== name));
    message.success('Đã xóa chi nhánh');
  };

  const userColumns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role', render: (v: Role) => <Tag color={v === 'it' ? 'blue' : v === 'manager' ? 'orange' : 'default'}>{ROLE_LABEL[v]}</Tag> },
    { title: 'Chi nhánh', dataIndex: 'branch', key: 'branch' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: { email: string; name: string; role: Role; branch?: string }) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingUser(record); setUserModalOpen(true); }} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => deleteUser(record.email)} />
        </Space>
      ),
    },
  ];

  const regionColumns = [
    { title: 'Khu vực', dataIndex: 'name', key: 'name' },
    { title: 'Quản lý', dataIndex: 'manager', key: 'manager', render: (m: { email: string; name: string }) => `${m.name} (${m.email})` },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: { name: string; manager: { email: string; name: string } }) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingRegion({ name: record.name, managerEmail: record.manager.email, managerName: record.manager.name }); setRegionModalOpen(true); }} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => deleteRegion(record.name)} />
        </Space>
      ),
    },
  ];

  const branchColumns = [
    { title: 'Chi nhánh', dataIndex: 'name', key: 'name' },
    { title: 'Khu vực', dataIndex: 'region', key: 'region' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: { name: string; region: string }) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingBranch({ name: record.name, region: record.region }); setBranchModalOpen(true); }} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => deleteBranch(record.name)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        <SafetyOutlined style={{ marginRight: 8 }} />
        Quản trị hệ thống (Demo)
      </Typography.Title>

      <Tabs defaultActiveKey="users">
        <Tabs.TabPane tab={<span><UserOutlined /> Quản trị User & Role</span>} key="users">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); setUserModalOpen(true); }}>Thêm user</Button>
          </Space>
          <Table
            columns={userColumns}
            dataSource={userRoles}
            rowKey="email"
            pagination={{ pageSize: 10 }}
          />
          <Modal
            title={editingUser ? 'Sửa user' : 'Thêm user'}
            open={userModalOpen}
            onCancel={() => { setUserModalOpen(false); setEditingUser(null); }}
            onOk={() => userForm.validateFields().then(saveUser).catch(() => {})}
          >
            <Form form={userForm} layout="vertical">
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input disabled={!!editingUser} placeholder="user@contoso.com" />
              </Form.Item>
              <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}>
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
              <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
                <Select options={ROLE_OPTIONS} placeholder="Chọn vai trò" />
              </Form.Item>
              <Form.Item name="branch" label="Chi nhánh">
                <Select placeholder="Chọn chi nhánh" options={branches.map(b => ({ value: b.name, label: b.name }))} />
              </Form.Item>
            </Form>
          </Modal>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><SafetyOutlined /> Quản trị Khu vực</span>} key="regions">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRegion(null); setRegionModalOpen(true); }}>Thêm khu vực</Button>
          </Space>
          <Table
            columns={regionColumns}
            dataSource={regions}
            rowKey="name"
            pagination={{ pageSize: 10 }}
          />
          <Modal
            title={editingRegion ? 'Sửa khu vực' : 'Thêm khu vực'}
            open={regionModalOpen}
            onCancel={() => { setRegionModalOpen(false); setEditingRegion(null); }}
            onOk={() => regionForm.validateFields().then(saveRegion).catch(() => {})}
          >
            <Form form={regionForm} layout="vertical">
              <Form.Item name="name" label="Tên khu vực" rules={[{ required: true }]}>
                <Input placeholder="Miền Bắc / Miền Nam / ..." disabled={!!editingRegion} />
              </Form.Item>
              <Form.Item name="managerEmail" label="Email Manager" rules={[{ required: true, type: 'email' }]}>
                <Select options={MANAGER_OPTIONS} placeholder="Chọn manager" />
              </Form.Item>
              <Form.Item name="managerName" label="Tên Manager" rules={[{ required: true }]}>
                <Input placeholder="Minh Quản Lý" />
              </Form.Item>
            </Form>
          </Modal>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><BranchesOutlined /> Quản trị Chi nhánh</span>} key="branches">
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingBranch(null); setBranchModalOpen(true); }}>Thêm chi nhánh</Button>
          </Space>
          <Table
            columns={branchColumns}
            dataSource={branches}
            rowKey="name"
            pagination={{ pageSize: 10 }}
          />
          <Modal
            title={editingBranch ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
            open={branchModalOpen}
            onCancel={() => { setBranchModalOpen(false); setEditingBranch(null); }}
            onOk={() => branchForm.validateFields().then(saveBranch).catch(() => {})}
          >
            <Form form={branchForm} layout="vertical">
              <Form.Item name="name" label="Tên chi nhánh" rules={[{ required: true }]}>
                <Input placeholder="Hà Nội, TP.HCM, ..." disabled={!!editingBranch} />
              </Form.Item>
              <Form.Item name="region" label="Khu vực" rules={[{ required: true }]}>
                <Select placeholder="Chọn khu vực" options={REGION_OPTIONS} />
              </Form.Item>
            </Form>
          </Modal>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}