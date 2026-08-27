# Hướng dẫn triển khai từng bước

## Bước 1 — Tạo SharePoint site & Lists

1. Tạo site `ITSupport` (Communication site) tại `https://<tenant>.sharepoint.com`.
2. Tạo 3 Lists theo `docs/sharepoint-lists.md`:
   - `Tickets`
   - `TicketComments`
   - `UserRoles`
3. Tạo Document Library `TicketAttachments`.
4. Thêm cột `UserRoles.Role` mẫu: `employee`, `manager`, `it`; thêm user thật cho manager/IT.

## Bước 2 — Đăng ký App trong Microsoft Entra ID

1. Portal → **Microsoft Entra ID → App registrations → New registration**.
2. Đặt tên `IT-Ticket-SPA`; **Redirect URI**: `http://localhost:5173` và URL production.
3. **Authentication → Platform: Single-page application** → thêm redirect URIs.
4. **API permissions** thêm:
   - `User.Read`
   - `Sites.Read.All`
   - `Files.ReadWrite.All`
   - (tuỳ chọn custom API Power Automate: `api://<clientId>/access_as_user`)
5. **Expose an API** → Add scope `access_as_user` (nếu dùng custom API).
6. Copy **Application (client) ID** và **Directory (tenant) ID**.

## Bước 3 — Tạo Power Automate flows

1. Tạo 10 flow theo `docs/power-automate-flows.md`.
2. Kết nối SharePoint (dùng tài khoản service/IT) và Outlook.
3. Bật Azure AD authentication cho mỗi trigger; copy URL vào `.env`.

## Bước 4 — Cấu hình React app

Tạo `.env` từ `.env.example`:

```env
VITE_AZURE_CLIENT_ID=<Client ID>
VITE_AZURE_TENANT_ID=<Tenant ID>
VITE_SHAREPOINT_SITE_HOST=https://<tenant>.sharepoint.com
VITE_SHAREPOINT_SITE_PATH=/sites/ITSupport
VITE_FLOW_GET_USER_ROLE=<url flow 1>
VITE_FLOW_CREATE_TICKET=<url flow 2>
... (các flow khác)
```

## Bước 5 — Chạy local & build

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build production → dist/
npm run preview    # xem bản build
```

## Bước 6 — Deploy production

- **Tùy chọn A — Azure Static Web Apps:** upload `dist/`, cấu hình env vars.
- **Tùy chọn B — Azure Storage Static Website:** tải `dist/` lên blob container `$web`.
- **Tùy chọn C — SharePoint hosting:** tải lên thư mục Site Assets, dùng `?tab=SinglePageApp`.
- **Tùy chọn D — Vercel/Netlify:** build + set env vars.

Sau deploy, thêm Redirect URI production vào App registration (Bước 2).

## Kiểm tra nhanh (Smoke test)

1. Đăng nhập user **employee** → tạo ticket → email Manager được gửi.
2. Đăng nhập **manager** → Need Action → Approve → status `Assigned to IT`, IT nhận email.
3. Đăng nhập **it** → nhận xử lý → đổi status → Employee nhận email.
4. Thử Reject / yêu cầu bổ sung → Employee chỉ trả lời khi `Need More Info`.
