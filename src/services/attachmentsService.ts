import { buildTicketFolderUrl, buildDriveUrl, graphFetch } from './graphClient';
import { isDemo } from './demo';
import { mockAttachments } from './mockData';
import type { TicketAttachment } from '../types';

// ===== Demo state =====
const demoStore = JSON.parse(JSON.stringify(mockAttachments)) as Record<
  string,
  TicketAttachment[]
>;

function demoTicketAttachments(ticketId: string): TicketAttachment[] {
  return demoStore[ticketId] ?? [];
}

/**
 * Quản lý file/ảnh đính kèm trong SharePoint Document Library "TicketAttachments".
 * Mỗi ticket có 1 folder con: Tickets/{ticketId}.
 * Files được mô tả bằng DriveItem của Graph.
 */

interface DriveItem {
  id: string;
  name: string;
  size: number;
  file?: { mimeType?: string };
  webUrl?: string;
  createdDateTime?: string;
  parentReference?: { path?: string };
}

function mapAttachment(item: DriveItem, ticketId: string): TicketAttachment {
  return {
    id: item.id,
    ticketId,
    name: item.name,
    size: item.size ?? 0,
    contentType: item.file?.mimeType ?? 'application/octet-stream',
    webUrl: item.webUrl ?? '',
    createdAt: item.createdDateTime ?? '',
  };
}

export async function listAttachments(
  token: string,
  ticketId: string,
): Promise<TicketAttachment[]> {
  if (isDemo) return demoTicketAttachments(ticketId);
  const url = `${buildTicketFolderUrl(ticketId)}:/children?$expand=thumbnails`;
  const data = await graphFetch<{ value: DriveItem[] }>(token, url);
  return (data.value ?? []).map((it) => mapAttachment(it, ticketId));
}

export async function uploadAttachment(
  token: string,
  ticketId: string,
file: File,
  onProgress?: (percent: number) => void,
): Promise<TicketAttachment> {
  if (isDemo) {
    if (onProgress) onProgress(100);
    const att: TicketAttachment = {
      id: `demo-${Date.now()}`,
      ticketId,
      name: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
      webUrl: `https://demo.local/${encodeURIComponent(file.name)}`,
      createdAt: new Date().toISOString(),
    };
    demoStore[ticketId] = [...(demoStore[ticketId] ?? []), att];
    return att;
  }
  const folderUrl = buildTicketFolderUrl(ticketId);
  // Đảm bảo folder tồn tại
  await ensureFolder(token, ticketId);

  // Upload nội dung file lên item
  const uploadUrl = `${folderUrl}:/${encodeURIComponent(file.name)}:/content`;
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', uploadUrl);
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
  if (onProgress) {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
  }

  const result = await new Promise<DriveItem>((resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as DriveItem);
      } else {
        reject(new Error(`Upload thất bại: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload thất bại (network)'));
    xhr.send(file);
  });

  return mapAttachment(result, ticketId);
}

/** Tạo folder Tickets/{ticketId} nếu chưa tồn tại */
async function ensureFolder(_token: string, ticketId: string): Promise<void> {
  const url = `${buildDriveUrl()}/root:/Tickets:/children`;
  const body = { name: ticketId, folder: {} };
  await graphFetch(_token, url, { method: 'POST', body: JSON.stringify(body) });
}

export function attachmentDownloadUrl(attachmentId: string): string {
  // Endpoint trả nội dung file (cần kèm Bearer token khi gọi)
  return `${buildDriveUrl()}/items/${attachmentId}/content`;
}

/** Hiển thị thumbnails (ảnh) */
export async function getThumbnails(
  token: string,
  attachmentId: string,
): Promise<string | null> {
  const url = `${buildDriveUrl()}/items/${attachmentId}/thumbnails/0/c300x300`;
  try {
    const data = await graphFetch<{ url?: string }>(token, url);
    return data.url ?? null;
  } catch {
    return null;
  }
}

