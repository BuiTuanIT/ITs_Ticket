import { callFlow } from './flowClient';
import { getListItems, createListItem } from './graphClient';
import { isDemo } from './demo';
import type { Role } from '../types';

/** Mặc định mọi user đều là employee; role override theo List UserRoles */
export const DEFAULT_ROLE: Role = 'employee';

/**
 * Lấy role của user hiện tại từ List UserRoles.
 * Ưu tiên gọi qua Power Automate flow; fallback gọi trực tiếp Graph.
 */
export async function getUserRole(email: string, token: string): Promise<Role> {
  if (isDemo) return 'manager'; // Demo: khởi tạo manager, có thể đổi qua header
  if (!email || !token) return DEFAULT_ROLE;

  // 1) Power Automate flow
  try {
    const result = await callFlow<{ role?: Role }>('getUserRole', token, { email });
    if (result?.role) return result.role;
  } catch (e) {
    console.warn('[rolesService] Flow getUserRole thất bại, fallback Graph:', e);
  }

  // 2) Graph fallback
  try {
    const items = await getListItems<{ fields: { User?: { email?: string }; Role?: string } }>(
      token,
      'UserRoles',
      { select: ['User', 'Role'] },
    );
    const match = items.find(
      (it) => it.fields.User?.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match?.fields.Role) return match.fields.Role as Role;
  } catch (e) {
    console.warn('[rolesService] Graph fallback thất bại:', e);
  }

  return DEFAULT_ROLE;
}

/** Tạo/ghi đè role cho user (dùng cho demo/admin) */
export async function setUserRole(
  email: string,
  role: Role,
  token: string,
): Promise<void> {
  await createListItem(token, 'UserRoles', { User: { email }, Role: role });
}
