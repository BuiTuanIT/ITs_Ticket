import { graphEndpoint } from '../auth/authConfig';

/**
 * Client Graph API thao tác trực tiếp với SharePoint:
 * - Đọc List items
 * - Tạo/cập nhật item
 * - Upload/đọc file từ Document Library
 *
 * Mỗi hàm nhận token; quyền được quản lý qua Entra ID.
 */

export interface GraphListRequestParams {
  siteId?: string;
  listName?: string;
  filter?: string;
  select?: string[];
  expand?: string[];
  top?: number;
  orderby?: string;
}

/** Định danh site: dùng host+path hoặc siteId có sẵn */
export function buildSitePath() {
  const host = import.meta.env.VITE_SHAREPOINT_SITE_HOST;
  const path = import.meta.env.VITE_SHAREPOINT_SITE_PATH ?? '/sites/ITSupport';
  if (!host) return null;
  return `${host}${path}`;
}

export async function graphFetch<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      `Graph API failed: ${response.status}`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function buildListUrl(listName: string, params: GraphListRequestParams = {}): string {
  const sitePath = buildSitePath();
  const p = new URLSearchParams();
  if (params.select?.length) p.append('$select', params.select.join(','));
  if (params.filter) p.append('$filter', params.filter);
  if (params.expand?.length) p.append('$expand', params.expand.join(','));
  if (params.top) p.append('$top', String(params.top));
  if (params.orderby) p.append('$orderby', params.orderby);

  const qs = p.toString();
  const base = sitePath
    ? `${graphEndpoint}/sites/${sitePath}/lists/${listName}/items`
    : `${graphEndpoint}/sites/${params.siteId}/lists/${listName}/items`;
  return qs ? `${base}?${qs}` : base;
}

export async function getListItems<T>(
  token: string,
  listName: string,
  params: GraphListRequestParams = {},
): Promise<T[]> {
  const url = buildListUrl(listName, params);
  const data = await graphFetch<{ value: T[] }>(token, url);
  return data.value ?? [];
}

export async function getListItem<T>(token: string, listName: string, itemId: string | number, params: GraphListRequestParams = {}): Promise<T> {
  const url = buildListUrl(listName, params).replace('/items', `/items/${itemId}`);
  return graphFetch<T>(token, url);
}

export async function createListItem<T>(
  token: string,
  listName: string,
  fields: Record<string, unknown>,
): Promise<T> {
  const url = buildListUrl(listName);
  return graphFetch<T>(token, url, { method: 'POST', body: JSON.stringify({ fields }) });
}

export async function updateListItem<T>(
  token: string,
  listName: string,
  itemId: string | number,
  fields: Record<string, unknown>,
): Promise<T> {
  const url = buildListUrl(listName).replace('/items', `/items/${itemId}`);
  return graphFetch<T>(token, url, { method: 'PATCH', body: JSON.stringify({ fields }) });
}

/** URL gốc của Document Library: /sites/{site}/drive */
export function buildDriveUrl(): string {
  const sitePath = buildSitePath();
  return `${graphEndpoint}/sites/${sitePath}/drive`;
}

/** Root folder trong thư mục theo ticketId */
export function buildTicketFolderUrl(ticketId: string): string {
  return `${buildDriveUrl()}/root:/Tickets/${ticketId}`;
}
