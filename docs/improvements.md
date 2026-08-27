# Gợi ý cải tiến sau này

## Real-time
- Thay polling bằng **Microsoft Graph change notification / subscription** cho List `Tickets` (webhook) để cập nhật live.
- Dùng **SignalR** (Azure) để đẩy sự kiện mới tới client mà không cần poll.

## Tìm kiếm & lọc
- Tích hợp **Graph Search** (`/search/query`) để tìm full-text trong Description/comment.
- Thêm filter theo Category, Priority, Khoảng thời gian, người tạo.

## UX
- **Split pane có thể kéo** (resizable) giữa danh sách & chi tiết.
- Virtualized list (react-window) khi có hàng nghìn ticket.
- Dark mode (Ant Design theme token).
- Drag & drop file trực tiếp lên editor; xem trước ảnh trong lightbox.

## Nghiệp vụ
- **SLA + cảnh báo trễ hạn**: tự động escalate ticket `Critical`/`High` quá hạn.
- **CSAT survey** sau khi đóng ticket.
- **Tự động phân loại** bằng Copilot / AI (trích xuất category, mức ưu tiên, gợi ý bài viết KB).
- Knowledge base: liên kết ticket → bài viết giải pháp.

## Quản trị
- Trang **Admin** quản lý `UserRoles` và danh mục ngay trên UI.
- Audit log mọi thao tác.
- Phân trang phía server + caching (TanStack Query) để giảm tải SharePoint.

## Bảo mật
- Mở rộng scopes tối thiểu (Least privilege), dùng **custom API** thay cho client gọi Graph trực tiếp khi cần.
- Quản lý role qua **Microsoft Entra groups** thay vì List để tập trung.

## Cấu trúc code
- Thêm **TanStack Query** cho data fetching/cache/invalidate.
- Tách trang theo lazy-load (`React.lazy`) để giảm bundle.
- Thêm **Zustand** cho global state nhẹ (folder, selection).
- Unit test (Vitest + Testing Library) và E2E (Playwright).
