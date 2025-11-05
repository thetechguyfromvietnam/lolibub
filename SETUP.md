# 🍹 Loli Bub - Hệ Thống Đặt Hàng với React & Node.js

## ✅ Đã Hoàn Thành

Website đã được tạo với đầy đủ tính năng:

### Frontend (React)
- ✅ Trang chủ hiển thị menu
- ✅ Trang đặt hàng với form
- ✅ Chọn món và số lượng
- ✅ Tính tổng tiền tự động
- ✅ UI/UX hiện đại, responsive
- ✅ React Router để điều hướng

### Backend (Node.js/Express)
- ✅ API RESTful
- ✅ Endpoint GET /api/menu
- ✅ Endpoint POST /api/orders
- ✅ Tích hợp gửi đơn qua Zalo
- ✅ Lưu đơn hàng vào file JSON

## 🚀 Bắt Đầu Sử Dụng

### 1. Cài đặt Dependencies

```bash
# Cài đặt tất cả dependencies
npm run install-all

# Hoặc cài đặt riêng:
npm install              # Backend
cd client && npm install  # Frontend
```

### 2. Cấu hình Zalo

Tạo file `.env` từ `env.example`:

```bash
cp env.example .env
```

Mở file `.env` và điền số điện thoại Zalo:

```env
ZALO_PHONE=0912345678  # Thay bằng số của bạn
```

### 3. Chạy Ứng Dụng

**Development mode (khuyến nghị):**
```bash
npm run dev
```

Lệnh này sẽ chạy:
- Backend tại http://localhost:5000
- Frontend tại http://localhost:3000

**Hoặc chạy riêng:**

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run client
```

### 4. Truy Cập Website

Mở trình duyệt và vào: **http://localhost:3000**

## 📦 Build Production

```bash
# Build React app
npm run build

# Chạy production server
npm start
```

Server sẽ serve cả frontend và backend tại http://localhost:5000

## 📁 Cấu Trúc Project

```
lolibub/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # React Components
│   │   │   ├── Header.js
│   │   │   ├── Home.js       # Trang chủ (Menu)
│   │   │   └── Booking.js    # Trang đặt hàng
│   │   ├── services/
│   │   │   └── api.js        # API service
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/
│   └── index.js              # Express Server
├── orders/                   # Lưu đơn hàng (tự động tạo)
├── menu.json                 # Dữ liệu menu
├── package.json              # Root package.json
└── .env                      # Cấu hình (tạo từ env.example)
```

## 🔧 API Endpoints

### GET `/api/menu`
Lấy danh sách menu từ `menu.json`

### POST `/api/orders`
Gửi đơn hàng và tạo link Zalo

**Request:**
```json
{
  "customerName": "Nguyễn Văn A",
  "phone": "0912345678",
  "address": "123 Đường ABC",
  "note": "Giao buổi sáng",
  "items": [
    {
      "name": "Red Energy",
      "price": 39000,
      "quantity": 2,
      "category": "Nước Ép Mix"
    }
  ],
  "total": 78000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đơn hàng đã được gửi thành công!",
  "zaloLink": "https://zalo.me/...",
  "orderMessage": "..."
}
```

## 📝 Chỉnh Sửa Menu

Mở file `menu.json` và chỉnh sửa theo format:

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

## 🛠️ Scripts Có Sẵn

- `npm run dev` - Chạy cả frontend và backend (development)
- `npm run server` - Chỉ chạy backend
- `npm run client` - Chỉ chạy frontend React
- `npm run build` - Build React app cho production
- `npm start` - Chạy production server
- `npm run install-all` - Cài đặt tất cả dependencies

## 💡 Lưu Ý Quan Trọng

1. **File .env**: Phải tạo file `.env` và điền số điện thoại Zalo
2. **Ports**: 
   - Frontend: 3000
   - Backend: 5000
3. **CORS**: Backend đã được cấu hình CORS để cho phép frontend gọi API
4. **Đơn hàng**: Được lưu tự động vào thư mục `orders/` (tự động tạo)

## 🐛 Troubleshooting

**Lỗi: Cannot find module**
→ Chạy `npm run install-all`

**Lỗi: Port already in use**
→ Đổi port trong `.env` hoặc đóng ứng dụng đang dùng port đó

**Lỗi: Zalo không gửi được**
→ Kiểm tra file `.env` đã điền đúng số điện thoại chưa

**Frontend không kết nối được backend**
→ Đảm bảo cả 2 đều đang chạy và check CORS settings

## 📚 Tài Liệu Tham Khảo

- React: https://react.dev
- Express: https://expressjs.com
- React Router: https://reactrouter.com

## 📞 Hỗ Trợ

Nếu có vấn đề, kiểm tra:
1. File `.env` đã được tạo và cấu hình chưa
2. Dependencies đã được cài đặt chưa (`npm run install-all`)
3. Cả frontend và backend đều đang chạy
4. Xem console logs để debug

---

**Chúc bạn sử dụng thành công! 🎉**

