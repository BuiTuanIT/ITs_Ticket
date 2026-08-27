/**
 * Client gọi Power Automate HTTP-trigger flows.
 * Mỗi flow nhận JSON body và trả về JSON.
 */

export type FlowKey =
  | 'getUserRole'
  | 'createTicket'
  | 'getTickets'
  | 'getTicket'
  | 'updateStatus'
  | 'requestMoreInfo'
  | 'addComment'
  | 'getComments'
  | 'markRead'
  | 'assignIT';

const FLOW_URLS: Record<FlowKey, string | undefined> = {
  getUserRole: import.meta.env.VITE_FLOW_GET_USER_ROLE as string | undefined,
  createTicket: import.meta.env.VITE_FLOW_CREATE_TICKET as string | undefined,
  getTickets: import.meta.env.VITE_FLOW_GET_TICKETS as string | undefined,
  getTicket: import.meta.env.VITE_FLOW_GET_TICKET as string | undefined,
  updateStatus: import.meta.env.VITE_FLOW_UPDATE_STATUS as string | undefined,
  requestMoreInfo: import.meta.env.VITE_FLOW_REQUEST_MORE_INFO as string | undefined,
  addComment: import.meta.env.VITE_FLOW_ADD_COMMENT as string | undefined,
  getComments: import.meta.env.VITE_FLOW_GET_COMMENTS as string | undefined,
  markRead: import.meta.env.VITE_FLOW_MARK_READ as string | undefined,
  assignIT: import.meta.env.VITE_FLOW_ASSIGN_IT as string | undefined,
};

export class FlowError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'FlowError';
    this.status = status;
    this.body = body;
  }
}

export async function callFlow<T = unknown>(
  flowKey: FlowKey,
  token: string,
  body: Record<string, unknown> = {},
): Promise<T | null> {
  const url = FLOW_URLS[flowKey];
  if (!url) {
    throw new FlowError(`Chưa cấu hình URL cho flow "${flowKey}"`, 0, null);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    const message =
      (errorBody as { message?: string })?.message ??
      `Flow "${flowKey}" failed: ${response.status}`;
    throw new FlowError(message, response.status, errorBody);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text) as T;
}
