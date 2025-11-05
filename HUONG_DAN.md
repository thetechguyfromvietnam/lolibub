# Hướng Dẫn Sử Dụng Website Đặt Hàng Loli Bub

## Cấu Hình Zalo

Để website có thể gửi đơn hàng tự động đến Zalo, bạn cần cấu hình trong file `script.js`:

### Cách 1: Sử dụng số điện thoại Zalo
1. Mở file `script.js`
2. Tìm dòng `zaloPhone: 'YOUR_ZALO_PHONE'`
3. Thay `YOUR_ZALO_PHONE` bằng số điện thoại Zalo của bạn (ví dụ: `0912345678`)

### Cách 2: Sử dụng Zalo Official Account ID
1. Mở file `script.js`
2. Tìm dòng `zaloOAId: 'YOUR_ZALO_OA_ID'`
3. Thay `YOUR_ZALO_OA_ID` bằng OA ID của bạn

### Cách 3: Sử dụng link Zalo chat trực tiếp
1. Mở file `script.js`
2. Tìm dòng `zaloChatLink: 'https://zalo.me/YOUR_ZALO_PHONE'`
3. Thay `YOUR_ZALO_PHONE` bằng số điện thoại của bạn

## Cách Chạy Website

### Cách 1: Mở trực tiếp
1. Mở file `index.html` bằng trình duyệt web
2. Hoặc double-click vào file `index.html`

### Cách 2: Sử dụng Local Server (Khuyến nghị)
Nếu bạn có Python:
```bash
cd "/Users/anhmai/Desktop/F&B Doanh Nghiệp/lolibub"
python3 -m http.server 8000
```
Sau đó mở trình duyệt và truy cập: `http://localhost:8000`

Nếu bạn có Node.js:
```bash
cd "/Users/anhmai/Desktop/F&B Doanh Nghiệp/lolibub"
npx http-server -p 8000
```

## Cấu Trúc Website

- `index.html` - Trang chủ hiển thị menu
- `booking.html` - Trang đặt hàng
- `styles.css` - File CSS styling
- `script.js` - JavaScript logic và tích hợp Zalo
- `menu.json` - Dữ liệu menu

## Tính Năng

✅ Hiển thị menu đầy đủ với giá cả
✅ Trang đặt hàng với form thông tin khách hàng
✅ Chọn món và số lượng
✅ Tính tổng tiền tự động
✅ Gửi đơn hàng qua Zalo tự động
✅ Responsive design (tương thích mobile)

## Lưu Ý

- Đảm bảo số điện thoại Zalo được cấu hình chính xác
- Website cần được chạy qua HTTP server để tránh lỗi CORS khi load menu.json
- Nếu không cấu hình Zalo, website sẽ copy đơn hàng vào clipboard để bạn paste vào Zalo thủ công

