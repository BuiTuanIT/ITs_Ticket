# Thiết kế SharePoint Lists & Document Library

Tạo tại site SharePoint (VD: `https://contoso.sharepoint.com/sites/ITSupport`).

## 1. List: `Tickets`

| Tên cột (Internal) | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| `Title` | Single line of text | Tiêu đề ticket |
| `Description` | Multiple lines of text (Enhanced / HTML) | Nội dung rich text |
| `Status` | Choice | `Pending Approval`, `Need More Info`, `Assigned to IT`, `In Progress`, `Resolved`, `Closed`, `Rejected` |
| `Priority` | Choice | `Low`, `Medium`, `High`, `Critical` |
| `Category` | Choice | `Hardware`, `Software`, `Network`, `Account`, `Security`, `Other` |
| `CreatedBy` | Person/Group | Người tạo (hệ thống tự gán) |
| `AssignedTo` | Person/Group | IT xử lý |
| `ManagerApprover` | Person/Group | Manager duyệt |
| `ApprovedDate` | Date and Time | Thời điểm duyệt |
| `IsRead*` | Yes/No | Đánh dấu đã đọc theo từng user (tuỳ chọn) |
| `Created` | (hệ thống) | Ngày tạo |
| `Modified` | (hệ thống) | Ngày sửa |

\* Nếu cần unread theo từng user, thêm List `TicketReadState`:

## 2. List: `TicketReadState` (tuỳ chọn)

| Cột | Kiểu |
|---|---|
| `TicketId` | Lookup → Tickets |
| `UserEmail` | Single line |
| `IsRead` | Yes/No |

## 3. List: `TicketComments`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `TicketId` | Lookup → Tickets | Liên kết ticket |
| `Content` | Multiple lines of text (Enhanced) | Nội dung rich text |
| `CreatedBy` | Person/Group | Người gửi |
| `IsInternal` | Yes/No | `true` = chỉ IT thấy |
| `Created` | (hệ thống) | Ngày gửi |

## 4. List: `UserRoles`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `User` | Person/Group | User (email) |
| `Role` | Choice | `employee`, `manager`, `it` |

## 5. Document Library: `TicketAttachments`

- Chứa cây thư mục: `Tickets/{ticketId}/...`
- Mỗi file là một **DriveItem**; metadata (ticketId) suy ra từ đường dẫn thư mục.
- Có thể thêm cột metadata `TicketId` (Lookup) nếu muốn tìm theo metadata thay vì folder.
- Truy cập qua Graph: `/sites/{site}/drive/root:/Tickets/{ticketId}`

## Quyền (Permissions)

| List | Người tạo | Người đọc | Người ghi |
|---|---|---|---|
| Tickets | Employee | Employee(own) / Manager / IT | Manager(duyệt) / IT(xử lý) |
| TicketComments | Tất cả | Tất cả (nội bộ chỉ IT) | Tất cả |
| UserRoles | Admin | Admin | Admin |
| TicketAttachments | Employee | Tất cả liên quan | Tất cả liên quan |

> Khuyến nghị: không mở quyền ghi trực tiếp cho User qua List; thay vào đó các **Power Automate flow** (chạy bằng service account có quyền rộng) đảm nhận ghi/đọc, còn app chỉ gọi flow. Điều này tránh lộ dữ liệu và tăng kiểm soát.
