# 🍹 Loli Bub - Website Đặt Hàng với React & Node.js

Website đặt hàng nước uống được xây dựng bằng React (frontend) và Node.js/Express (backend), tích hợp gửi đơn hàng tự động qua Zalo.

## ✨ Tính Năng

- ✅ **Frontend React**: UI hiện đại, responsive
- ✅ **Backend Node.js/Express**: API RESTful
- ✅ **Hiển thị menu**: Tự động load từ JSON
- ✅ **Trang đặt hàng**: Form đầy đủ với validation
- ✅ **Tính tổng tiền**: Tự động cập nhật
- ✅ **Gửi đơn qua Zalo**: Tích hợp tự động
- ✅ **Lưu đơn hàng**: Lưu vào file JSON (optional)

## 🚀 Cài Đặt và Chạy

### Yêu Cầu
- Node.js >= 14.x
- npm hoặc yarn

### Bước 1: Cài đặt dependencies

```bash
# Cài đặt dependencies cho cả project
npm run install-all

# Hoặc cài đặt riêng từng phần:
npm install                    # Backend dependencies
cd client && npm install       # Frontend dependencies
```

### Bước 2: Cấu hình môi trường

Tạo file `.env` trong thư mục root (copy từ `env.example`):

```bash
cp env.example .env
```

Chỉnh sửa file `.env`:
```env
PORT=5000
NODE_ENV=development
ZALO_PHONE=0912345678  # Thay bằng số điện thoại Zalo của bạn
ZALO_OA_ID=           # Hoặc Zalo OA ID (nếu có)
```

### Bước 3: Chạy ứng dụng

**Development mode (cả frontend và backend):**
```bash
npm run dev
```

Hoặc chạy riêng từng phần:

```bash
# Terminal 1: Chạy backend
npm run server

# Terminal 2: Chạy frontend
npm run client
```

**Production mode:**
```bash
# Build React app
npm run build

# Chạy server (sẽ serve cả frontend build)
npm start
```

### Truy cập ứng dụng

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- API Menu: http://localhost:5000/api/menu

## 📁 Cấu Trúc Project

```
lolibub/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Header.js
│   │   │   ├── Home.js
│   │   │   └── Booking.js
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js backend
│   └── index.js           # Express server
├── orders/                 # Lưu đơn hàng (tự động tạo)
├── menu.json              # Dữ liệu menu
├── package.json           # Root package.json
└── .env                   # Environment variables
```

## 🔧 API Endpoints

### GET `/api/menu`
Lấy danh sách menu

**Response:**
```json
{
  "categories": [
    {
      "name": "Nước Ép Mix",
      "price": 39000,
      "items": [...]
    }
  ]
}
```

### POST `/api/orders`
Gửi đơn hàng

**Request Body:**
```json
{
  "customerName": "Nguyễn Văn A",
  "phone": "0912345678",
  "address": "123 Đường ABC",
  "note": "Giao hàng vào buổi sáng",
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

Mở file `menu.json` để thêm/sửa/xóa món:

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

## 🔐 Cấu Hình Zalo

### Cách 1: Sử dụng số điện thoại (Khuyến nghị)
Trong file `.env`:
```env
ZALO_PHONE=0912345678
```

### Cách 2: Sử dụng Zalo Official Account ID
```env
ZALO_OA_ID=your_oa_id
```

## 📦 Build cho Production

```bash
# Build React app
npm run build

# Set NODE_ENV=production trong .env
# Chạy server
npm start
```

Server sẽ tự động serve file build từ `client/build`.

## 🛠️ Scripts

- `npm run dev` - Chạy cả frontend và backend (development)
- `npm run server` - Chỉ chạy backend
- `npm run client` - Chỉ chạy frontend
- `npm run build` - Build React app cho production
- `npm start` - Chạy production server
- `npm run install-all` - Cài đặt tất cả dependencies

## 💡 Lưu Ý

- Đảm bảo số điện thoại Zalo được cấu hình đúng trong `.env`
- Trong development, frontend chạy ở port 3000, backend ở port 5000
- Đơn hàng được lưu tự động vào thư mục `orders/` (tự động tạo)
- API sử dụng CORS để cho phép frontend gọi từ port khác

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra file `.env` đã được cấu hình chưa
2. Kiểm tra `menu.json` có đúng format không
3. Kiểm tra cả frontend và backend đều đang chạy
4. Xem console logs để debug

## 📄 License

MIT

