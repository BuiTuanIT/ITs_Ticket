import type { ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Spin } from 'antd';

/** Yêu cầu đăng nhập; nếu chưa xác thực → chuyển về trang đăng nhập */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { inProgress } = useMsal();
  const { isAuthenticated } = useAuth();

  if (inProgress !== 'none') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" tip="Đang đăng nhập..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
