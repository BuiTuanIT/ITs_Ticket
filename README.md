# IT Support · Ticket System

Ứng dụng **IT Support Ticket System** — full-stack Microsoft 365 + React.

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI | Ant Design (giao diện kiểu Outlook) |
| Rich Text Editor | TipTap (khung soạn thảo lớn, chỉnh chu) |
| Authentication | Microsoft Entra ID (MSAL.js) |
| Database | SharePoint Lists (Graph API / Power Automate) |
| File & Ảnh | SharePoint Document Library (Graph Drive API) |
| Backend / Tự động hóa | Power Automate |

## Tính năng chính

- **Ticket Inbox kiểu Outlook**: sidebar folder (Inbox, Sent, Need Action, All Tickets), danh sách bên trái + chi tiết bên phải, badge chưa đọc, preview.
- **Rich Text Editor**: bold/italic/heading/list, chèn link, chèn ảnh (upload hoặc paste), đính kèm file.
- **Phân quyền theo role** (`employee` / `manager` / `it`) đọc từ List `UserRoles`.
- **Luồng nghiệp vụ**: Pending Approval → Assigned to IT → In Progress → Resolved → Closed (Reject / Need More Info).
- **Comment nội bộ IT** (`IsInternal`), lưu toàn bộ lịch sử + file đính kèm.

## Cấu trúc

```
src/
├─ main.tsx / App.tsx        # entry, MsalProvider + RoleProvider + routes
├─ auth/                     # MSAL config, instance, useAuth hook
├─ context/RoleContext.tsx   # nạp role + ma trận quyền
├─ routes/                   # ProtectedRoute, RoleRoute (guard theo role)
├─ pages/                    # Login, Inbox, NewTicket, TicketDetail, Unauthorized
├─ components/               # AppLayout, RichTextEditor, TicketInbox/List/Detail, Comments, uploads, badges
├─ services/                 # flowClient (Power Automate), graphClient, tickets, roles, attachments
├─ constants/ + types/       # enum status/priority/category + domain types
└─ index.css                 # style TipTap + render HTML
```

## Chạy local

```bash
npm install
cp .env.example .env     # điền Entra ID + URLs Power Automate
npm run dev              # http://localhost:5173
npm run build            # build production
```

### Demo Mode (kiểm tra UI không cần backend)

Mặc định `.env.example` bật `VITE_DEMO_MODE=true`: **không cần Entra ID / SharePoint / Power Automate** — dùng dữ liệu mẫu. Có **công tắc đổi role** (Employee/Manager/IT) ngay trên header để xem đủ các trang và luồng theo từng vai.

Tắt demo: để `VITE_DEMO_MODE=false` hoặc bỏ dòng đó + điền Client ID thật.

## Tài liệu

- [Kiến trúc & luồng dữ liệu](docs/architecture.md)
- [Thiết kế SharePoint Lists & Document Library](docs/sharepoint-lists.md)
- [Power Automate Flows (JSON)](docs/power-automate-flows.md)
- [Hướng dẫn triển khai từng bước](docs/deployment-guide.md)
- [Cách lấy API của List (gửi để tôi sửa luồng)](docs/get-list-api.md)
- [Gợi ý cải tiến](docs/improvements.md)

## Roles

| Role | Quyền chính |
|---|---|
| `employee` | Tạo ticket, xem ticket của mình, trả lời khi được yêu cầu bổ sung |
| `manager` | Approve / Reject / yêu cầu bổ sung thông tin |
| `it` | Toàn quyền xử lý ticket sau khi duyệt, comment nội bộ |
