# Power Automate Flows

## Chiến lược chung

- Mỗi flow dùng trigger **"When an HTTP request is received"** (manual), nhận JSON body từ React app.
- Bật **Azure AD authentication** cho trigger để chỉ app có token mới gọi được.
- Flow dùng connection **SharePoint** (service account) để đọc/ghi List + gửi email qua **Outlook**.
- App khai báo URL trigger trong `.env` (`VITE_FLOW_*`).

Danh sách flow cần tạo:

| Flow | Trigger (key) | Vai trò |
|---|---|---|
| 1 | `getUserRole` | Trả role của user |
| 2 | `createTicket` | Tạo ticket + thông báo Manager |
| 3 | `getTickets` | Lấy danh sách ticket theo role |
| 4 | `getTicket` | Lấy chi tiết 1 ticket |
| 5 | `updateStatus` | Đổi status + thông báo |
| 6 | `requestMoreInfo` | Yêu cầu bổ sung + thông báo |
| 7 | `assignIT` | Duyệt + gán IT + thông báo |
| 8 | `addComment` | Thêm comment + thông báo người liên quan |
| 9 | `getComments` | Lấy comment của ticket |
| 10 | `markRead` | Đánh dấu đã đọc |

---

## Flow 2: When a new ticket is created → notify Manager

**Trigger:** HTTP request (JSON: `title, description, priority, category`)

**Steps:**
1. **HTTP Request** (received)
2. **SharePoint - Create item** (`Tickets`): `Title`, `Description`, `Priority`, `Category`, `Status = Pending Approval`
3. **SharePoint - Get items** (`UserRoles`) filter `Role eq 'manager'`
4. **Outlook - Send email** gửi từng Manager: tiêu đề, mô tả, link ticket
5. **Respond to HTTP** trả `{ id: <ticketId> }`

```json
{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json",
    "triggers": {
      "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": { "method": "POST", "schema": { "type": "object" } }
      }
    },
    "actions": {
      "Create_item": {
        "type": "OpenApiConnection",
        "inputs": {
          "host": { "connectionName": "shared_sharepointonline" },
          "operationId": "CreateItem",
          "parameters": {
            "dataset": "@{triggerBody()?['dataset']}",
            "table": "@{triggerBody()?['table']}",
            "item/Title": "@triggerBody()?['title']",
            "item/Status": "Pending Approval",
            "item/Priority": "@triggerBody()?['priority']",
            "item/Category": "@triggerBody()?['category']",
            "item/Description": "@triggerBody()?['description']"
          }
        },
        "runAfter": {}
      },
      "Respond_to_a_HTTP_trigger": {
        "type": "Response",
        "inputs": {
          "statusCode": 200,
          "body": { "id": "@outputs('Create_item')?['body/ID']" }
        },
        "runAfter": { "Create_item": ["Succeeded"] }
      }
    }
  }
}
```

---

## Flow 7: When Manager Approves → update Status + assign IT + notify

**Trigger:** HTTP (JSON: `ticketId, itEmail`)

**Steps:**
1. **HTTP Request** (received)
2. **SharePoint - Get item** (`Tickets`, id = `ticketId`)
3. **SharePoint - Update item**: `Status = Assigned to IT`, `AssignedTo = itEmail`, `ApprovedDate = utcNow()`
4. **SharePoint - Get users** (`UserRoles`) filter `Role eq 'it'`
5. **Outlook - Send email** cho IT + Employee: "Ticket đã được duyệt, xử lý ngay"
6. **Respond** 200

---

## Flow 6: When Manager requests more info → update Status + notify Employee

**Trigger:** HTTP (JSON: `ticketId, note`)

**Steps:**
1. **HTTP Request**
2. **SharePoint - Update item**: `Status = Need More Info`
3. **SharePoint - Create item** (`TicketComments`): `Content = note`, `IsInternal = false`
4. **Outlook - Send email** cho Employee: "Vui lòng bổ sung thông tin"
5. **Respond** 200

---

## Flow 8: When new comment is added → notify relevant users

**Trigger:** HTTP (JSON: `ticketId, content, isInternal`)

**Steps:**
1. **HTTP Request**
2. **SharePoint - Create item** (`TicketComments`)
3. **SharePoint - Get item** (`Tickets`) để lấy `CreatedBy`, `AssignedTo`, `ManagerApprover`
4. Nếu `isInternal = true` → chỉ gửi IT; ngược lại gửi cho các bên liên quan
5. **Outlook - Send email**
6. **Respond** 200

---

## Flow 5: When IT changes status → notify Employee

**Trigger:** HTTP (JSON: `ticketId, status, note`)

**Steps:**
1. **HTTP Request**
2. **SharePoint - Update item**: `Status = status`
3. **Outlook - Send email** cho Employee: trạng thái mới + note
4. **Respond** 200

---

## Lưu ý cấu hình trigger

Mở flow → Trigger "When an HTTP request is received" → **Settings**:
- Bật **"Azure AD authentication"** (`Authentication type = Azure AD OpenID`).
- Sau khi lưu, copy URL trigger dán vào `.env`.

> URL dạng:
> `https://prod-00.westus.logic.azure.com/workflows/.../triggers/manual/paths/invoke?api-version=...&sp=...&sv=...&sig=...`
