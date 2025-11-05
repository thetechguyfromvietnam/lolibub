# Hướng Dẫn Nhanh

## Cài Đặt

```bash
# 1. Cài đặt dependencies
npm run install-all

# 2. Tạo file .env (copy từ env.example)
cp env.example .env

# 3. Sửa file .env và điền số điện thoại Zalo:
# ZALO_PHONE=0912345678
```

## Chạy Ứng Dụng

```bash
# Development (chạy cả frontend và backend)
npm run dev
```

Mở trình duyệt:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Build Production

```bash
npm run build
npm start
```

## Cấu Trúc

- `client/` - React frontend
- `server/` - Node.js backend
- `menu.json` - Dữ liệu menu
- `.env` - Cấu hình (Zalo phone, etc.)

Xem `README_REACT.md` để biết chi tiết hơn.

