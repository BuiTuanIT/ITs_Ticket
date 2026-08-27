import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { isDemo, DEMO_PROFILES, type DemoProfile } from '../services/demo';

interface DemoIdentityValue {
  profile: DemoProfile | null;
  setProfile: (key: string) => void;
  /** current email/name/role theo profile đang chọn (Demo) */
  email: string;
  name: string;
  /** Demo: user đã "đăng nhập" (enter hệ thống) hay chưa */
  loggedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

const DemoIdentityContext = createContext<DemoIdentityValue | null>(null);

/** Chỉ có ý nghĩa trong Demo Mode: cho phép đổi "người dùng hiện tại" để test
 *  employee chi nhánh / manager khu vực / IT. Ngoài demo thì trả null. */
export function DemoIdentityProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<string>(DEMO_PROFILES[0].key);
  const [loggedIn, setLoggedIn] = useState<boolean>(!isDemo); // demo mặc định CHƯA đăng nhập

  const value = useMemo<DemoIdentityValue>(() => {
    const profile = isDemo ? DEMO_PROFILES.find((p) => p.key === key) ?? DEMO_PROFILES[0] : null;
    return {
      profile,
      setProfile: (k: string) => setKey(k),
      email: loggedIn ? profile?.email ?? '' : '',
      name: loggedIn ? profile?.name ?? '' : '',
      loggedIn: isDemo ? loggedIn : true,
      signIn: () => {
        setKey(DEMO_PROFILES[0].key);
        setLoggedIn(true);
      },
      signOut: () => setLoggedIn(false),
    };
  }, [key, loggedIn]);

  return <DemoIdentityContext.Provider value={value}>{children}</DemoIdentityContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoIdentity() {
  const ctx = useContext(DemoIdentityContext);
  if (!ctx) throw new Error('useDemoIdentity phải dùng trong <DemoIdentityProvider>');
  return ctx;
}
