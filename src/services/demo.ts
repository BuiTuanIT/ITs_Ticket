/**
 * Chế độ Demo: chạy UI thuần không cần Entra ID / SharePoint / Power Automate.
 * Bật bằng VITE_DEMO_MODE=true trong .env (hoặc để trống Client ID).
 */

export const isDemo: boolean =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  !import.meta.env.VITE_AZURE_CLIENT_ID;

export const DEMO_TOKEN = 'demo-token';
export const DEMO_EMAIL = 'demo@contoso.com';
export const DEMO_NAME = 'Demo User';

export interface DemoProfile {
  key: string;
  email: string;
  name: string;
  role: 'employee' | 'manager' | 'it';
  branch?: string; // user thuộc chi nhánh nào
  region?: string; // manager phụ trách khu vực nào
}

/** Các profile để test UI: employee theo chi nhánh, manager theo khu vực, IT */
export const DEMO_PROFILES: DemoProfile[] = [
  { key: 'emp-hn', email: 'lan.nguyen@contoso.com', name: 'Lan Nguyễn', role: 'employee', branch: 'Hà Nội' },
  { key: 'emp-ct', email: 'phuong.employee@contoso.com', name: 'Phương', role: 'employee', branch: 'Cần Thơ' },
  { key: 'mgr-north', email: 'minh.manager@contoso.com', name: 'Minh Quản Lý', role: 'manager', region: 'Miền Bắc' },
  { key: 'mgr-south', email: 'huy.manager@contoso.com', name: 'Huy Quản Lý', role: 'manager', region: 'Miền Nam' },
  { key: 'it', email: 'hoa.it@contoso.com', name: 'Hoa IT Support', role: 'it' },
];
