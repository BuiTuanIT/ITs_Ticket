import { useCallback, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import { isDemo, DEMO_TOKEN } from '../services/demo';
import { useDemoIdentity } from '../context/DemoIdentityContext';

/** Hook cung cấp trạng thái đăng nhập + token gọi API Microsoft.
 *  Trong Demo Mode không cần Entra ID — trả user giả định (theo profile đang chọn). */
export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? null;
  const demoIdentity = useDemoIdentity();

  const login = useCallback(() => {
    if (isDemo) {
      demoIdentity.signIn();
      return Promise.resolve();
    }
    return instance.loginRedirect(loginRequest);
  }, [instance, demoIdentity]);

  const logout = useCallback(() => {
    if (isDemo) {
      demoIdentity.signOut();
      return Promise.resolve();
    }
    return instance.logoutRedirect();
  }, [instance, demoIdentity]);

  /** Lấy access token (silent, fallback redirect) */
  const getToken = useCallback(async (): Promise<string | null> => {
    if (isDemo) return DEMO_TOKEN;
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({ ...loginRequest, account });
      return response.accessToken;
    } catch {
      await instance.acquireTokenRedirect(loginRequest);
      return null;
    }
  }, [instance, account]);

  return useMemo(
    () => ({
      account: isDemo ? ({ username: 'demo@contoso.com', name: 'Demo' } as never) : account,
      isAuthenticated: isDemo ? demoIdentity.loggedIn : !!account,
      email: isDemo ? demoIdentity.email : account?.username ?? '',
      displayName: isDemo ? demoIdentity.name : account?.name ?? '',
      getToken,
      login,
      logout,
    }),
    [account, demoIdentity, getToken, login, logout],
  );
}
