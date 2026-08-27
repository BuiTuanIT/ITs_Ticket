# Cách lấy API của SharePoint List (để gửi cho tôi sửa luồng xử lý)

Bạn không cần liên kết database/backend để xem UI (đang dùng **Demo Mode**).
Khi muốn tôi đọc & sửa lại luồng xử lý thật, hãy thu thập các thông tin sau rồi dán vào đây.

## 1. Lấy Site ID + List ID qua Graph API

Dùng **Graph Explorer** (`https://developer.microsoft.com/en-us/graph/graph-explorer`) đăng nhập quản trị:

**a. Lấy Site ID** (thay host + path site của bạn):
```http
GET https://graph.microsoft.com/v1.0/sites/{host}:/{path}?$select=id,webUrl
```
Ví dụ:
```http
GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/ITSupport?$select=id,webUrl
```
→ kết quả `{ "id": "contoso.sharepoint.com,<guid>,<guid>" }` (chính là `siteId`).

**b. Lấy danh sách các List + List ID:**
```http
GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists?$select=id,displayName
```

**c. Lấy item của List Tickets:**
```http
GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists/{listId}/items?$expand=fields
```

**d. Lấy Document Library (Drive) cho file đính kèm:**
```http
GET https://graph.microsoft.com/v1.0/sites/{siteId}/drive
```

## 2. Lấy URL trigger của Power Automate flows

Mỗi flow mở trong **Power Automate** → trigger **"When an HTTP request is received"**:
- Bấm **"..."** → **Settings** → bật **Azure AD authentication**.
- Bấm **Save**; cửa sổ trigger hiện **HTTP POST URL** — copy toàn bộ URL dạng:
  ```
  https://prod-00.westus.logic.azure.com/workflows/{id}/triggers/manual/paths/invoke?api-version=...&sp=...&sv=...&sig=...
  ```

## 3. Thông tin tôi cần bạn gửi

> Gửi theo mẫu này, dán thẳng vào chat để tôi điều chỉnh `graphClient.ts` / `ticketsService.ts` cho đúng tenant & cấu trúc List.

```text
1. siteId:  <dán ở mục 1a>
2. Site path: /sites/ITSupport
3. List:  Tickets     -> listId <...>
          TicketComments -> listId <...>
          UserRoles   -> listId <...>
4. Drive:  TicketAttachments -> driveId <...>
5. URL các flow (nếu có):
   VITE_FLOW_CREATE_TICKET  = <URL>
   VITE_FLOW_GET_TICKETS    = <URL>
   ...
6. Cấu trúc cột thực tế của List Tickets (nếu khác mặc định)
```

> **Mẹo:** nếu bạn chỉ muốn chạy UI (không dùng flow), tôi sẽ sửa `ticketsService` để gọi **Graph API trực tiếp** bằng `siteId/listId` bạn cung cấp — không cần Power Automate. Bạn chỉ cần gửi đúng `siteId` + `listId` ở trên.
