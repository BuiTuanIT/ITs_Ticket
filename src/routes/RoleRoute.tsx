import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useRole } from '../context/RoleContext';
import type { Role } from '../types';

/** Guard theo role: chỉ render children khi user có 1 trong các role cho phép */
export default function RoleRoute({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
