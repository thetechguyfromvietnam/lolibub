# 🍹 Loli Bub - Website Đặt Hàng Online

Website đặt hàng nước uống với tính năng gửi đơn hàng tự động qua Zalo.

## ✨ Tính Năng

- ✅ Hiển thị menu đầy đủ với giá cả
- ✅ Trang đặt hàng với form thông tin khách hàng
- ✅ Chọn món và số lượng dễ dàng
- ✅ Tính tổng tiền tự động
- ✅ Gửi đơn hàng qua Zalo tự động
- ✅ Responsive design (tương thích mobile & desktop)
- ✅ UI/UX hiện đại và đẹp mắt

## 🚀 Cách Chạy Website

### Cách 1: Mở trực tiếp (đơn giản nhất)
Double-click vào file `index.html` để mở bằng trình duyệt.

### Cách 2: Sử dụng HTTP Server (Khuyến nghị)

**Với Python:**
```bash
cd "/Users/anhmai/Desktop/F&B Doanh Nghiệp/lolibub"
python3 -m http.server 8000
```
Truy cập: `http://localhost:8000`

**Với Node.js:**
```bash
cd "/Users/anhmai/Desktop/F&B Doanh Nghiệp/lolibub"
npx http-server -p 8000
```

## ⚙️ Cấu Hình Zalo

Để website có thể gửi đơn hàng tự động đến Zalo:

1. Mở file `script.js`
2. Tìm phần `CONFIG` ở đầu file
3. Thay `YOUR_ZALO_PHONE` bằng số điện thoại Zalo của bạn (ví dụ: `0912345678`)

```javascript
const CONFIG = {
    zaloPhone: '0912345678',  // ← Thay số điện thoại của bạn ở đây
    zaloOAId: 'YOUR_ZALO_OA_ID',
    zaloChatLink: 'https://zalo.me/YOUR_ZALO_PHONE'
};
```

## 📁 Cấu Trúc Website

- `index.html` - Trang chủ hiển thị menu
- `booking.html` - Trang đặt hàng
- `styles.css` - File CSS styling
- `script.js` - JavaScript logic và tích hợp Zalo
- `menu.json` - Dữ liệu menu (có thể chỉnh sửa)

## 📝 Chỉnh Sửa Menu

Mở file `menu.json` để thêm/sửa/xóa món trong menu. Format:
```json
{
  "categories": [
    {
      "name": "Tên Danh Mục",
      "price": 35000,
      "items": [
        {
          "name": "Tên Món",
          "price": 35000
        }
      ]
    }
  ]
}
```

## 📱 Menu Hiện Tại

### Nước Ép Mix (39,000đ)
- Red Energy
- Energy Boost
- Green Vitality
- Heart Shine
- Green Detox
- Refresh
- Refresh Balance

### Nước Ép Nguyên Vị / Nước Ép Chai (35,000đ)

### Trà Trái Cây (35,000đ)
- Trà Đác Thơm
- Trà Đào
- Trà Atiso Đỏ
- Trà Vải Hoa Anh Đào

### Trà Sữa
- Trà Sữa Loli: 39,000đ
- Trà Sữa Truyền Thống: 35,000đ

### Yogurt
- Mix Ngũ Cốc Nướng: 35,000đ
- Trái Cây Tô Yogurt: 30,000đ

### Cafe
- Cafe Đen Đá: 20,000đ
- Cafe Sữa: 25,000đ
- Bạc Xíu: 25,000đ

## 💡 Lưu Ý

- Website cần được chạy qua HTTP server để tránh lỗi CORS khi load menu.json
- Nếu không cấu hình Zalo, website sẽ copy đơn hàng vào clipboard để paste vào Zalo thủ công
- Đảm bảo số điện thoại Zalo được cấu hình chính xác (không có dấu cách, dấu +)

## 📞 Hỗ Trợ

Nếu có vấn đề, vui lòng kiểm tra:
1. File `menu.json` có đúng format không
2. Số điện thoại Zalo trong `script.js` đã được cấu hình chưa
3. Website đang chạy qua HTTP server chưa

