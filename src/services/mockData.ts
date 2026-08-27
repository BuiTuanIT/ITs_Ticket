import type { Ticket, TicketComment, TicketAttachment, Person } from '../types';

/** Dữ liệu mẫu phục vụ Demo Mode (không dùng database). */

// ===== Khu vực (Region) & Chi nhánh (Branch) =====
// Manager quản lý theo khu vực; user được gán chi nhánh thuộc khu vực đó.

export const REGIONS = [
  { name: 'Miền Bắc', manager: { email: 'minh.manager@contoso.com', name: 'Minh Quản Lý' } },
  { name: 'Miền Nam', manager: { email: 'huy.manager@contoso.com', name: 'Huy Quản Lý' } },
] as const;

export const BRANCHES: { name: string; region: string }[] = [
  { name: 'Hà Nội', region: 'Miền Bắc' },
  { name: 'Hải Phòng', region: 'Miền Bắc' },
  { name: 'TP.HCM', region: 'Miền Nam' },
  { name: 'Cần Thơ', region: 'Miền Nam' },
];

/** Gán chi nhánh cho từng user */
export const USER_BRANCHES: Record<string, string> = {
  'demo@contoso.com': 'Hà Nội', // Miền Bắc → Minh
  'lan.nguyen@contoso.com': 'Hà Nội', // Miền Bắc → Minh
  'phuong.employee@contoso.com': 'Cần Thơ', // Miền Nam → Huy
};

/** Tìm Manager phụ trách khu vực của chi nhánh mà user thuộc về */
export function findManagerForUser(email: string): Person | null {
  const branchName = USER_BRANCHES[email.toLowerCase()];
  if (!branchName) return null;
  const branch = BRANCHES.find((b) => b.name === branchName);
  if (!branch) return null;
  const region = REGIONS.find((r) => r.name === branch.region);
  return region ? { ...region.manager } : null;
}

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const DEMO_PERSON = {
  demo: { email: 'demo@contoso.com', name: 'Demo User' },
  emp: { email: 'lan.nguyen@contoso.com', name: 'Lan Nguyễn' },
  phuong: { email: 'phuong.employee@contoso.com', name: 'Phương' },
  mgr: { email: 'minh.manager@contoso.com', name: 'Minh Quản Lý' },
  huy: { email: 'huy.manager@contoso.com', name: 'Huy Quản Lý' },
  it: { email: 'hoa.it@contoso.com', name: 'Hoa IT Support' },
};

export const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Màn hình laptop bị nhấp nháy liên tục',
    description:
      '<p>Màn hình <strong>Dell Latitude</strong> của tôi bị nhấp nháy khi cắm sạc.</p><ul><li>Đã thử khởi động lại</li><li>Cập nhật driver</li></ul><p>Vẫn không hết. Nhờ hỗ trợ kiểm tra sớm.</p>',
    status: 'Pending Approval',
    priority: 'High',
    category: 'Hardware',
    createdBy: DEMO_PERSON.phuong,
    assignedTo: null,
    managerApprover: DEMO_PERSON.huy,
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
    isRead: false,
    attachmentCount: 1,
  },
  {
    id: '2',
    title: 'Không truy cập được email Outlook công ty',
    description:
      '<p>Kể từ hôm qua tôi không đăng nhập được vào <a href="https://outlook.com">Outlook</a>.</p><p>Báo lỗi <code>0x8004def7</code>.</p>',
    status: 'Need More Info',
    priority: 'Critical',
    category: 'Account',
    createdBy: DEMO_PERSON.demo,
    assignedTo: null,
    managerApprover: DEMO_PERSON.mgr,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    isRead: true,
    attachmentCount: 0,
  },
  {
    id: '3',
    title: 'Cài đặt phần mềm kế toán mới',
    description:
      '<p>Đơn vị tôi cần cài phần mềm <em>MISA</em> cho 3 máy phòng kế toán.</p><p>Vui lòng hỗ trợ cài đặt và phân quyền.</p>',
    status: 'Assigned to IT',
    priority: 'Medium',
    category: 'Software',
    createdBy: DEMO_PERSON.demo,
    assignedTo: DEMO_PERSON.it,
    managerApprover: DEMO_PERSON.mgr,
    approvedDate: daysAgo(0),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
    isRead: false,
    attachmentCount: 0,
  },
  {
    id: '4',
    title: 'Mạng WiFi văn phòng bị chập chờn',
    description:
      '<p>WiFi tầng 3 thường xuyên mất kết nối, nhất là buổi chiều.</p><ol><li>Kiểm tra access point</li><li>Kiểm tra switch</li></ol>',
    status: 'In Progress',
    priority: 'High',
    category: 'Network',
    createdBy: DEMO_PERSON.emp,
    assignedTo: DEMO_PERSON.it,
    managerApprover: DEMO_PERSON.mgr,
    approvedDate: daysAgo(3),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(0),
    isRead: true,
    attachmentCount: 2,
  },
  {
    id: '5',
    title: 'Cấp quyền truy cập thư mục dự án A',
    description:
      '<p>Cần cấp quyền <code>Read</code> cho nhóm <strong>Dự án A</strong> truy cập thư mục chia sẻ.</p>',
    status: 'Resolved',
    priority: 'Low',
    category: 'Account',
    createdBy: DEMO_PERSON.demo,
    assignedTo: DEMO_PERSON.it,
    managerApprover: DEMO_PERSON.mgr,
    approvedDate: daysAgo(5),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
    isRead: true,
    attachmentCount: 0,
  },
  {
    id: '6',
    title: 'Yêu cầu máy in mới cho phòng nhân sự',
    description: '<p>Máy in cũ hư, cần thay máy in đa năng mới cho phòng HR.</p>',
    status: 'Pending Approval',
    priority: 'Medium',
    category: 'Hardware',
    createdBy: DEMO_PERSON.emp,
    assignedTo: null,
    managerApprover: DEMO_PERSON.mgr,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
    isRead: false,
    attachmentCount: 0,
  },
  {
    id: '7',
    title: 'Đóng ticket cũ không còn nhu cầu',
    description: '<p>Ticket mua phần mềm thiết kế không còn nhu cầu, xin đóng lại.</p>',
    status: 'Closed',
    priority: 'Low',
    category: 'Other',
    createdBy: DEMO_PERSON.demo,
    assignedTo: DEMO_PERSON.it,
    managerApprover: DEMO_PERSON.mgr,
    approvedDate: daysAgo(8),
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
    isRead: true,
    attachmentCount: 0,
  },
];

export const mockComments: Record<string, TicketComment[]> = {
  '1': [
    {
      id: 'c1-1',
      ticketId: '1',
      content: '<p>Bạn cho tôi biết model chính xác của laptop và tình trạng bảo hành?</p>',
      createdBy: DEMO_PERSON.mgr,
      createdAt: daysAgo(0),
      isInternal: false,
    },
  ],
  '2': [
    {
      id: 'c2-1',
      ticketId: '2',
      content:
        '<p>Bạn vui lòng cho biết thêm <strong>thời điểm</strong> bắt đầu lỗi và <strong>tên miền</strong> email?</p>',
      createdBy: DEMO_PERSON.mgr,
      createdAt: daysAgo(1),
      isInternal: false,
    },
  ],
  '3': [
    {
      id: 'c3-1',
      ticketId: '3',
      content: '<p>Đã liên hệ phòng kế toán để sắp lịch cài đặt.</p>',
      createdBy: DEMO_PERSON.it,
      createdAt: daysAgo(0),
      isInternal: true,
    },
  ],
  '4': [
    {
      id: 'c4-1',
      ticketId: '4',
      content: '<p>Đã kiểm tra access point tầng 3, đang chờ thay thế router.</p>',
      createdBy: DEMO_PERSON.it,
      createdAt: daysAgo(1),
      isInternal: false,
    },
    {
      id: 'c4-2',
      ticketId: '4',
      content: '<p>Ghi chú nội bộ: đã đặt hàng router mới, dự kiến đến thứ 5.</p>',
      createdBy: DEMO_PERSON.it,
      createdAt: daysAgo(0),
      isInternal: true,
    },
  ],
  '5': [
    {
      id: 'c5-1',
      ticketId: '5',
      content: '<p>Đã cấp quyền cho nhóm Dự án A. Anh/chị kiểm tra giúp.</p>',
      createdBy: DEMO_PERSON.it,
      createdAt: daysAgo(2),
      isInternal: false,
    },
  ],
};

export const mockAttachments: Record<string, TicketAttachment[]> = {
  '1': [
    {
      id: 'f1',
      ticketId: '1',
      name: 'lỗi-màn-hình.jpg',
      size: 154000,
      contentType: 'image/jpeg',
      webUrl: 'https://demo.local/f1.jpg',
      createdAt: daysAgo(0),
    },
  ],
  '4': [
    {
      id: 'f4a',
      ticketId: '4',
      name: 'so-do-mang.pdf',
      size: 420000,
      contentType: 'application/pdf',
      webUrl: 'https://demo.local/f4a.pdf',
      createdAt: daysAgo(3),
    },
    {
      id: 'f4b',
      ticketId: '4',
      name: 'log-router.txt',
      size: 8000,
      contentType: 'text/plain',
      webUrl: 'https://demo.local/f4b.txt',
      createdAt: daysAgo(2),
    },
  ],
};
