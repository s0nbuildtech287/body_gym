# BodyGym Google Apps Script

## Cài đặt

1. Mở Google Sheet của BodyGym.
2. Chọn `Extensions -> Apps Script`.
3. Dán nội dung `Code.gs` vào file `Code.gs`.
4. Chạy hàm `setupSheets()` một lần và cấp quyền.
5. Chọn `Deploy -> New deployment`.
6. Chọn loại `Web app`.
7. `Execute as`: Me.
8. `Who has access`: Anyone.
9. Copy URL `/exec` để cấu hình cho frontend.

## API mẫu

```text
GET {WEB_APP_URL}/exec?action=bootstrap&userId=USER_ID
```

```json
{
  "action": "register",
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "password": "secret123"
}
```

Frontend nên gửi POST với header `Content-Type: text/plain;charset=utf-8` để Apps Script nhận body ổn định qua trình duyệt.
