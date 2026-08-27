import { LogLevel, type Configuration } from '@azure/msal-browser';
import { isDemo } from '../services/demo';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;

if ((!clientId || !tenantId) && !isDemo) {
  throw new Error(
    'Thiếu cấu hình VITE_AZURE_CLIENT_ID / VITE_AZURE_TENANT_ID trong file .env (hoặc bật VITE_DEMO_MODE=true)',
  );
}

// Demo: dùng giá trị giữ chỗ để MSAL khởi tạo mà không crash
const resolvedClientId = clientId ?? 'demo-client-id';
const resolvedTenantId = tenantId ?? 'common';

export const msalConfig: Configuration = {
  auth: {
    clientId: resolvedClientId,
    authority: `https://login.microsoftonline.com/${resolvedTenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error('[MSAL]', message);
      },
    },
  },
};

/**
 * Scopes:
 * - User.Read: đọc hồ sơ người dùng
 * - Sites.Read.All / Files.ReadWrite.All: đọc/ghi SharePoint List & tải file lên
 *   (nếu đã khai báo "api://<clientId>/access_as_user" cho custom API thì thêm vào)
 */
export const loginRequest = {
  scopes: [
    'User.Read',
    'Sites.Read.All',
    'Files.ReadWrite.All',
    // 'api://your-client-id/access_as_user', // custom API Power Automate
  ],
};

export const graphEndpoint = 'https://graph.microsoft.com/v1.0';
