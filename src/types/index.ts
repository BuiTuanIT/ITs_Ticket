// ===== Domain types for the IT Ticket system =====

export type Role = 'employee' | 'manager' | 'it';

export type TicketStatus =
  | 'Pending Approval'
  | 'Need More Info'
  | 'Assigned to IT'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketCategory = 'Hardware' | 'Software' | 'Network' | 'Account' | 'Security' | 'Other';

/** Số tương ứng với trường CreatedBy Person của SharePoint */
export interface Person {
  id?: string;
  email?: string;
  name?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string; // HTML rich text
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdBy: Person;
  assignedTo: Person | null;
  managerApprover: Person | null;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean; // đã đọc (theo user hiện tại)
  attachmentCount: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string; // HTML rich text
  createdBy: Person;
  createdAt: string;
  isInternal: boolean;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  name: string;
  size: number;
  contentType: string;
  webUrl: string;
  createdAt: string;
}

export type InboxFolder = 'inbox' | 'sent' | 'need-action' | 'all' | 'handled';

export interface NewTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}

export interface NewCommentInput {
  content: string;
  isInternal: boolean;
}
