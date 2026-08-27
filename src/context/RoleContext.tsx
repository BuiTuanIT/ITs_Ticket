import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import { getUserRole } from '../services/rolesService';
import { isDemo } from '../services/demo';
import { useDemoIdentity } from './DemoIdentityContext';
import type { Role } from '../types';

interface RoleContextValue {
  role: Role | null; // null = chưa xác định
  loading: boolean;
  can: (permission: RolePermission) => boolean;
  refresh: () => Promise<void>;
  /** Chỉ Demo Mode: đổi role nhanh để test UI */
  setDemoRole: (r: Role) => void;
}

/** Quyền ngữ nghĩa theo nghiệp vụ */
export type RolePermission =
  | 'createTicket'
  | 'reply'
  | 'approve'
  | 'reject'
  | 'requestMoreInfo'
  | 'handleTicket'
  | 'viewInternalComments';

const PERMISSIONS: Record<Role, RolePermission[]> = {
  employee: ['createTicket', 'reply'],
  manager: ['createTicket', 'reply', 'approve', 'reject', 'requestMoreInfo'],
  it: ['createTicket', 'reply', 'requestMoreInfo', 'handleTicket', 'viewInternalComments'],
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { email, getToken, isAuthenticated } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const demoIdentity = useDemoIdentity();

  const refresh = async () => {
    if (isDemo) {
      setRole(demoIdentity.loggedIn ? (demoIdentity.profile?.role ?? 'employee') : null);
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const r = token ? await getUserRole(email, token) : null;
      setRole(r);
    } catch (e) {
      console.error('[RoleContext] Không lấy được role:', e);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (r: Role) => {
    if (isDemo && role !== r) setRole(r);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, email, demoIdentity.profile?.key]);

  const can = (permission: RolePermission) => {
    if (!role) return false;
    return PERMISSIONS[role].includes(permission);
  };

  return (
    <RoleContext.Provider value={{ role, loading, can, refresh, setDemoRole }}>
      {children}
    </RoleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole phải được dùng trong <RoleProvider>');
  return ctx;
}
