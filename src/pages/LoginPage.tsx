import { Navigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Row, Space, Tabs, Tag, Typography } from 'antd';
import { LoginOutlined, RocketOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/useAuth';
import { DEMO_PROFILES } from '../services/demo';
import { useState } from 'react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'azure' | 'demo'>('azure');

  if (isAuthenticated) return <Navigate to="/inbox" replace />;

  const handleLogin = () => {
    if (activeTab === 'azure') {
      login();
    } else {
      // Demo mode: just trigger signIn via DemoIdentityContext
      login();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1677ff 0%, #0b3a8f 100%)',
        padding: 24,
      }}
    >
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={22} sm={18} md={12} lg={10} xl={8}>
          <Card style={{ borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: 'none' }}>
            <div style={{ textAlign: 'center', padding: '32px 24px 16px' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #1677ff 0%, #0b3a8f 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 16px rgba(22, 119, 255, 0.3)',
                }}
              >
                <LoginOutlined style={{ fontSize: 32, color: '#fff' }} />
              </div>
              <Typography.Title level={3} style={{ margin: 0, color: '#fff' }}>
                IT Support Ticket System
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
                Quản lý yêu cầu hỗ trợ IT với Microsoft 365
              </Typography.Paragraph>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as 'azure' | 'demo')}
              items={[
                {
                  key: 'azure',
                  label: <span><LoginOutlined /> Đăng nhập Microsoft 365</span>,
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      <Alert
                        type="info"
                        showIcon
                        message="Đăng nhập với tài khoản Microsoft 365 (Entra ID)"
                        description="Cần cấu hình Azure AD App Registration và Power Automate flows để sử dụng tính năng đầy đủ."
                        style={{ borderRadius: 8 }}
                      />
                      <Button
                        type="primary"
                        size="large"
                        icon={<LoginOutlined />}
                        block
                        onClick={handleLogin}
                        style={{ height: 48, fontSize: 16 }}
                      >
                        Đăng nhập với Microsoft 365
                      </Button>
                    </Space>
                  ),
                },
                {
                  key: 'demo',
                  label: <span><RocketOutlined /> Demo Mode (Không cần tài khoản)</span>,
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      <Alert
                        type="info"
                        showIcon
                        message="Chế độ Demo"
                        description="Không cần tài khoản Azure AD. Hệ thống sẽ tạo dữ liệu mẫu để bạn trải nghiệm toàn bộ tính năng."
                        style={{ borderRadius: 8 }}
                      />
                      <Button
                        type="primary"
                        size="large"
                        icon={<RocketOutlined />}
                        block
                        onClick={handleLogin}
                        style={{ height: 48, fontSize: 16 }}
                      >
                        Vào chế độ xem thử (Demo)
                      </Button>
                      <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 8 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                          Profile demo có sẵn:
                        </Typography.Text>
                        {DEMO_PROFILES.map(p => (
                          <Tag key={p.key} color={p.role === 'it' ? 'blue' : p.role === 'manager' ? 'orange' : 'default'}>
                            {p.name} ({p.role}{p.branch ? ` · ${p.branch}` : ''}{p.region ? ` · ${p.region}` : ''})
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  ),
                },
              ]}
              style={{ marginBottom: 24 }}
            />

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                IT Support Ticket System v1.0 &copy; 2024
              </Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}