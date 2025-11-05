const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../orders/payment-proofs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)'));
    }
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// API Routes

// Get menu
app.get('/api/menu', (req, res) => {
  try {
    const menuData = JSON.parse(fs.readFileSync(path.join(__dirname, '../menu.json'), 'utf8'));
    res.json(menuData);
  } catch (error) {
    res.status(500).json({ error: 'Không thể tải menu' });
  }
});

// Send order to Zalo (with payment proof)
app.post('/api/orders', upload.single('paymentProof'), async (req, res) => {
  try {
    const { customerName, phone, address, note, items, total } = req.body;
    const paymentProofFile = req.file;

    // Validate
    if (!customerName || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: 'Thông tin đơn hàng không đầy đủ' });
    }

    // Check if payment proof is required
    if (!paymentProofFile) {
      return res.status(400).json({ error: 'Vui lòng upload ảnh chứng từ chuyển khoản!' });
    }

    // Parse items JSON string
    const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;

    // Create order message with payment proof info
    const orderMessage = createOrderMessage({
      customerName,
      phone,
      address,
      note: note || '',
      items: itemsArray,
      total: parseFloat(total),
      paymentProof: paymentProofFile.filename
    });

    // Send to Zalo
    const zaloResult = await sendToZalo(orderMessage, phone);

    // Save order to file with payment proof info
    saveOrderToFile({
      customerName,
      phone,
      address,
      note: note || '',
      items: itemsArray,
      total: parseFloat(total),
      paymentProof: paymentProofFile.filename,
      paymentProofPath: paymentProofFile.path,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Đơn hàng đã được gửi thành công! Bếp sẽ xác nhận sau khi kiểm tra chứng từ.',
      zaloLink: zaloResult.link,
      orderMessage: orderMessage
    });
  } catch (error) {
    console.error('Error processing order:', error);
    
    // Clean up uploaded file if order processing fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: error.message || 'Có lỗi xảy ra khi xử lý đơn hàng' 
    });
  }
});

// Helper function to create order message
function createOrderMessage(orderData) {
  let message = `🍹 *ĐƠN HÀNG LOLI BUB*\n\n`;
  message += `👤 *Khách hàng:* ${orderData.customerName}\n`;
  message += `📞 *SĐT:* ${orderData.phone}\n`;
  message += `📍 *Địa chỉ:* ${orderData.address}\n\n`;
  
  if (orderData.note) {
    message += `📝 *Ghi chú:* ${orderData.note}\n\n`;
  }
  
  message += `📋 *Chi tiết đơn hàng:*\n`;
  orderData.items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} (${item.category})\n`;
    message += `   Số lượng: ${item.quantity} x ${formatPrice(item.price)} đ = ${formatPrice(item.price * item.quantity)} đ\n`;
  });
  
  message += `\n💰 *Tổng tiền:* ${formatPrice(orderData.total)} đ\n\n`;
  
  if (orderData.paymentProof) {
    message += `✅ *Đã nhận chứng từ chuyển khoản*\n`;
    message += `📎 File: ${orderData.paymentProof}\n\n`;
  }
  
  message += `_Đơn hàng được đặt qua website_`;
  
  return message;
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

// Send to Zalo
async function sendToZalo(message, phone) {
  const zaloPhone = process.env.ZALO_PHONE || '';
  const zaloOAId = process.env.ZALO_OA_ID || '';
  
  if (!zaloPhone && !zaloOAId) {
    return {
      success: false,
      message: 'Chưa cấu hình Zalo. Vui lòng cấu hình trong file .env',
      link: null
    };
  }

  const encodedMessage = encodeURIComponent(message);
  const targetId = zaloPhone || zaloOAId;
  const cleanTargetId = targetId.replace(/[\s\-\(\)]/g, '');
  const zaloLink = `https://zalo.me/${cleanTargetId}?text=${encodedMessage}`;

  return {
    success: true,
    link: zaloLink,
    message: 'Đơn hàng đã được gửi!'
  };
}

// Save order to file (optional)
function saveOrderToFile(orderData) {
  const ordersDir = path.join(__dirname, '../orders');
  if (!fs.existsSync(ordersDir)) {
    fs.mkdirSync(ordersDir, { recursive: true });
  }

  const orderFile = path.join(ordersDir, `order_${Date.now()}.json`);
  fs.writeFileSync(orderFile, JSON.stringify(orderData, null, 2), 'utf8');
}

// Catch all handler: send back React's index.html file
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📱 API: http://localhost:${PORT}/api`);
});

