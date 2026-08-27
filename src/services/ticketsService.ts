import { callFlow } from './flowClient';
import { getListItems, getListItem, createListItem, updateListItem } from './graphClient';
import { isDemo } from './demo';
import { mockTickets, mockComments, findManagerForUser } from './mockData';
import type {
  NewCommentInput,
  NewTicketInput,
  Ticket,
  TicketComment,
  TicketStatus,
} from '../types';

// ===== Demo state (in-memory, reset khi refresh) =====
const demoStore = {
  tickets: [...mockTickets],
  comments: JSON.parse(JSON.stringify(mockComments)) as Record<string, TicketComment[]>,
};

/**
 * Business service cho Tickets & TicketComments.
 * Ưu tiên gọi Power Automate flow (xử lý nghiệp vụ + thông báo),
 * fallback trực tiếp Graph API để vẫn chạy được khi chưa cấu hình flow.
 */

function mapPerson(field: unknown): { id?: string; email?: string; name?: string } | null {
  if (!field) return null;
  const p = field as {
    email?: string;
    mail?: string;
    displayName?: string;
    name?: string;
  };
  return {
    email: p.email ?? p.mail ?? '',
    name: p.displayName ?? p.name ?? '',
  };
}

export function mapTicket(item: {
  id: string;
  fields: Record<string, unknown>;
  readState?: boolean;
  attachmentCount?: number;
}): Ticket {
  const f = item.fields;
  const createdBy = mapPerson(f.CreatedBy) ?? mapPerson(f.Requester) ?? { name: 'Unknown' };
  const assignedTo = mapPerson(f.AssignedTo);
  const managerApprover = mapPerson(f.ManagerApprover);
  return {
    id: item.id,
    title: (f.Title as string) ?? '',
    description: (f.Description as string) ?? '',
    status: (f.Status as TicketStatus) ?? 'Pending Approval',
    priority: (f.Priority as Ticket['priority']) ?? 'Medium',
    category: (f.Category as Ticket['category']) ?? 'Other',
    createdBy,
    assignedTo,
    managerApprover,
    approvedDate: (f.ApprovedDate as string) ?? undefined,
    createdAt: (f.Created as string) ?? '',
    updatedAt: (f.Modified as string) ?? '',
    isRead: item.readState ?? false,
    attachmentCount: item.attachmentCount ?? 0,
  };
}

export async function listTickets(token: string, email: string): Promise<Ticket[]> {
  if (isDemo) return [...demoStore.tickets];
  try {
    const result = await callFlow<{ value: unknown[] }>('getTickets', token, { email });
    if (result?.value) return result.value.map((v) => mapTicket(v as never));
  } catch (e) {
    console.warn('[ticketsService] Flow getTickets thất bại, fallback Graph:', e);
  }

  const items = await getListItems(token, 'Tickets', {
    select: [
      'Title',
      'Description',
      'Status',
      'Priority',
      'Category',
      'CreatedBy',
      'AssignedTo',
      'ManagerApprover',
      'ApprovedDate',
      'Created',
      'Modified',
    ],
    expand: ['CreatedBy'],
    orderby: 'Created desc',
  });
  return items.map((it) => mapTicket(it as never));
}

export async function getTicket(token: string, id: string): Promise<Ticket | null> {
  if (isDemo) return demoStore.tickets.find((t) => t.id === id) ?? null;
  try {
    const result = await callFlow<{ fields: Record<string, unknown> }>('getTicket', token, { id });
    if (result) return mapTicket({ id, fields: result.fields });
  } catch (e) {
    console.warn('[ticketsService] Flow getTicket thất bại, fallback Graph:', e);
  }
  const item = await getListItem(token, 'Tickets', id, { expand: ['CreatedBy'] });
  return mapTicket(item as never);
}

export async function createTicket(
  token: string,
  input: NewTicketInput,
  requesterEmail = 'demo@contoso.com',
): Promise<Ticket> {
  if (isDemo) {
    // ManagerApprover = Manager phụ trách khu vực của chi nhánh user
    const managerApprover = findManagerForUser(requesterEmail);
    const ticket: Ticket = {
      id: String(Date.now()),
      title: input.title,
      description: input.description,
      status: 'Pending Approval',
      priority: input.priority,
      category: input.category,
      createdBy: { email: requesterEmail, name: requesterEmail.split('@')[0] },
      assignedTo: null,
      managerApprover,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: false,
      attachmentCount: 0,
    };
    demoStore.tickets.unshift(ticket);
    demoStore.comments[ticket.id] = [];
    return ticket;
  }
  try {
    const result = await callFlow<{ id: string }>('createTicket', token, {
      ...input,
      requesterEmail,
    });
    if (result?.id) return (await getTicket(token, result.id))!;
  } catch (e) {
    console.warn('[ticketsService] Flow createTicket thất bại, fallback Graph:', e);
  }
  const item = await createListItem(token, 'Tickets', {
    Title: input.title,
    Description: input.description,
    Priority: input.priority,
    Category: input.category,
    Status: 'Pending Approval',
  });
  return mapTicket(item as never);
}

export async function updateStatus(
  token: string,
  ticketId: string,
  status: TicketStatus,
  note = '',
  assignee?: { email: string; name: string },
): Promise<void> {
  if (isDemo) {
    const t = demoStore.tickets.find((x) => x.id === ticketId);
    if (t) {
      t.status = status;
      t.updatedAt = new Date().toISOString();
      // Auto-assign: người đổi trạng thái trở thành người xử lý
      if (assignee) t.assignedTo = assignee;
    }
    return;
  }
  try {
    await callFlow('updateStatus', token, { ticketId, status, note, assignee });
    return;
  } catch (e) {
    console.warn('[ticketsService] Flow updateStatus thất bại, fallback Graph:', e);
  }
  await updateListItem(token, 'Tickets', ticketId, {
    Status: status,
    ...(assignee ? { AssignedTo: { email: assignee.email } } : {}),
  });
}

export async function requestMoreInfo(
  token: string,
  ticketId: string,
  note: string,
): Promise<void> {
  await updateStatus(token, ticketId, 'Need More Info', note);
}

export async function assignIT(token: string, ticketId: string, itEmail: string): Promise<void> {
  if (isDemo) {
    const t = demoStore.tickets.find((x) => x.id === ticketId);
    if (t) {
      t.status = 'Assigned to IT';
      t.assignedTo = { email: 'hoa.it@contoso.com', name: 'Hoa IT Support' };
      t.approvedDate = new Date().toISOString();
      t.updatedAt = new Date().toISOString();
    }
    return;
  }
  try {
    await callFlow('assignIT', token, { ticketId, itEmail });
    return;
  } catch (e) {
    console.warn('[ticketsService] Flow assignIT thất bại, fallback Graph:', e);
  }
  await updateListItem(token, 'Tickets', ticketId, {
    Status: 'Assigned to IT',
    AssignedTo: { email: itEmail },
    ApprovedDate: new Date().toISOString(),
  });
}

export async function markRead(token: string, ticketId: string, email: string): Promise<void> {
  if (isDemo) return;
  try {
    await callFlow('markRead', token, { ticketId, email });
  } catch (e) {
    console.warn('[ticketsService] Flow markRead thất bại (bỏ qua):', e);
  }
}

// ===== Comments =====

export function mapComment(item: {
  id: string;
  fields: Record<string, unknown>;
}): TicketComment {
  const f = item.fields;
  return {
    id: item.id,
    ticketId: String(f.TicketId ?? ''),
    content: (f.Content as string) ?? '',
    createdBy: mapPerson(f.CreatedBy) ?? { name: 'Unknown' },
    createdAt: (f.Created as string) ?? '',
    isInternal: Boolean(f.IsInternal),
  };
}

export async function getComments(token: string, ticketId: string): Promise<TicketComment[]> {
  if (isDemo) return demoStore.comments[ticketId] ?? [];
  try {
    const result = await callFlow<{ value: unknown[] }>('getComments', token, { ticketId });
    if (result?.value) return result.value.map((v) => mapComment(v as never));
  } catch (e) {
    console.warn('[ticketsService] Flow getComments thất bại, fallback Graph:', e);
  }
  const items = await getListItems(token, 'TicketComments', {
    filter: `fields/TicketId/Id eq ${ticketId}`,
    orderby: 'Created asc',
  });
  return items.map((it) => mapComment(it as never));
}

export async function addComment(
  token: string,
  ticketId: string,
  input: NewCommentInput,
  assignee?: { email: string; name: string },
): Promise<void> {
  if (isDemo) {
    const comment: TicketComment = {
      id: String(Date.now()),
      ticketId,
      content: input.content,
      createdBy: { email: 'demo@contoso.com', name: 'Demo User' },
      createdAt: new Date().toISOString(),
      isInternal: input.isInternal,
    };
    demoStore.comments[ticketId] = [...(demoStore.comments[ticketId] ?? []), comment];
    // Auto-assign: IT trả lời → trở thành người xử lý
    if (assignee) {
      const t = demoStore.tickets.find((x) => x.id === ticketId);
      if (t) t.assignedTo = assignee;
    }
    return;
  }
  try {
    await callFlow('addComment', token, { ticketId, ...input, assignee });
    return;
  } catch (e) {
    console.warn('[ticketsService] Flow addComment thất bại, fallback Graph:', e);
  }
  await createListItem(token, 'TicketComments', {
    TicketId: ticketId,
    Content: input.content,
    IsInternal: input.isInternal,
  });
  if (assignee) {
    await updateListItem(token, 'Tickets', ticketId, { AssignedTo: { email: assignee.email } });
  }
}
