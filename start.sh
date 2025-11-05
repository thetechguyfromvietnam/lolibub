#!/bin/bash

# Script để chạy website Loli Bub
# Sử dụng: ./start.sh hoặc bash start.sh

echo "🍹 Đang khởi động website Loli Bub..."
echo ""

# Kiểm tra Python
if command -v python3 &> /dev/null; then
    echo "✓ Tìm thấy Python3"
    echo "🌐 Website đang chạy tại: http://localhost:8000"
    echo "📱 Nhấn Ctrl+C để dừng server"
    echo ""
    python3 -m http.server 8000
# Kiểm tra Node.js
elif command -v node &> /dev/null; then
    echo "✓ Tìm thấy Node.js"
    echo "🌐 Website đang chạy tại: http://localhost:8000"
    echo "📱 Nhấn Ctrl+C để dừng server"
    echo ""
    npx http-server -p 8000
else
    echo "❌ Không tìm thấy Python hoặc Node.js"
    echo ""
    echo "Vui lòng cài đặt một trong hai:"
    echo "  - Python: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    echo ""
    echo "Hoặc mở trực tiếp file index.html bằng trình duyệt"
    exit 1
fi

