const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const ZALO_CONFIG = require('../config');
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
    const { customerName, phone, address, note, items, total, paymentMethod } = req.body;
    const paymentProofFile = req.file;
    const resolvedPaymentMethod = (paymentMethod || 'bank_transfer').toLowerCase();

    // Validate
    if (!customerName || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: 'Thông tin đơn hàng không đầy đủ' });
    }

    // Check if payment proof is required
    if (resolvedPaymentMethod === 'bank_transfer' && !paymentProofFile) {
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
      paymentProof: paymentProofFile ? paymentProofFile.filename : null,
      paymentMethod: resolvedPaymentMethod
    });

    // Send to Zalo
    const zaloResult = await sendToZalo(orderMessage, phone);

    const orderRecord = {
      customerName,
      phone,
      address,
      note: note || '',
      items: itemsArray,
      total: parseFloat(total),
      paymentMethod: resolvedPaymentMethod,
      paymentProof: paymentProofFile ? paymentProofFile.filename : null,
      paymentProofPath: paymentProofFile ? paymentProofFile.path : null,
      timestamp: new Date().toISOString()
    };

    await Promise.allSettled([
      appendOrderToGoogleSheet(orderRecord),
      sendOrderEmailNotification(orderRecord, orderMessage, zaloResult.link)
    ]);

    // Save order to file with payment proof info
    saveOrderToFile(orderRecord);

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

  const paymentLabel = orderData.paymentMethod === 'cash'
    ? 'Tiền mặt khi nhận hàng'
    : 'Chuyển khoản';
  message += `💳 *Thanh toán:* ${paymentLabel}\n`;
  
  message += `📋 *Chi tiết đơn hàng:*\n`;
  orderData.items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} (${item.category})\n`;
    message += `   Số lượng: ${item.quantity} x ${formatPrice(item.price)} đ = ${formatPrice(item.price * item.quantity)} đ\n`;
  });
  
  message += `\n💰 *Tổng tiền:* ${formatPrice(orderData.total)} đ\n\n`;
  
  if (orderData.paymentMethod === 'bank_transfer' && orderData.paymentProof) {
    message += `✅ *Đã nhận chứng từ chuyển khoản*\n`;
    message += `📎 File: ${orderData.paymentProof}\n\n`;
  }

  if (orderData.paymentMethod === 'cash') {
    message += `💵 *Thu tiền mặt khi giao hàng*\n\n`;
  }
  
  message += `_Đơn hàng được đặt qua website_`;
  
  return message;
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

async function appendOrderToGoogleSheet(orderData) {
  const sheetsClientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const sheetsPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!sheetsClientEmail || !sheetsPrivateKey || !spreadsheetId) {
    return;
  }

  try {
    const auth = new google.auth.JWT(
      sheetsClientEmail,
      null,
      sheetsPrivateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const range = process.env.GOOGLE_SHEETS_RANGE || 'Orders!A:H';
    const timestamp = orderData.timestamp || new Date().toISOString();

    const itemsText = (orderData.items || [])
      .map((item) => {
        const name = item.name || 'Không rõ';
        const category = item.category || 'Không rõ';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        return `${name} (${category}) x${quantity} - ${formatPrice(price * quantity)} đ`;
      })
      .join('\n');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          timestamp,
          orderData.customerName || '',
          orderData.phone || '',
          orderData.address || '',
          orderData.note || '',
          orderData.paymentMethod || '',
          itemsText,
          formatPrice(orderData.total || 0)
        ]]
      }
    });
  } catch (error) {
    console.error('Failed to append order to Google Sheets:', error.message || error);
  }
}

async function sendOrderEmailNotification(orderData, orderMessage, zaloLink) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return;
  }

  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '465', 10);
  const emailFrom = process.env.EMAIL_FROM || emailUser;
  const emailRecipients = (process.env.EMAIL_TO || 'lolibub688@gmail.com')
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  try {
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const itemsHtml = (orderData.items || [])
      .map((item) => {
        const name = item.name || 'Không rõ';
        const category = item.category || 'Không rõ';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        return `<li><strong>${name}</strong> (${category}) x${quantity} - ${formatPrice(price * quantity)} đ</li>`;
      })
      .join('');

    const attachments = [];
    if (orderData.paymentProofPath && fs.existsSync(orderData.paymentProofPath)) {
      attachments.push({
        filename: orderData.paymentProof || 'payment-proof.jpg',
        path: orderData.paymentProofPath
      });
    }

    await transporter.sendMail({
      from: emailFrom,
      to: emailRecipients,
      subject: `Đơn hàng mới từ ${orderData.customerName || 'Khách hàng'}`,
      text: orderMessage ? orderMessage.replace(/\*/g, '') : 'Đơn hàng mới',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="margin-bottom: 12px;">Đơn hàng mới từ ${orderData.customerName || 'Khách hàng'}</h2>
          <p><strong>Số điện thoại:</strong> ${orderData.phone || ''}</p>
          <p><strong>Địa chỉ:</strong> ${orderData.address || ''}</p>
          ${orderData.note ? `<p><strong>Ghi chú:</strong> ${orderData.note}</p>` : ''}
          <p><strong>Hình thức thanh toán:</strong> ${orderData.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
          <p><strong>Chi tiết đơn hàng:</strong></p>
          <ul>${itemsHtml}</ul>
          <p><strong>Tổng tiền:</strong> ${formatPrice(orderData.total || 0)} đ</p>
          ${zaloLink ? `<p><a href="${zaloLink}" target="_blank" rel="noopener noreferrer">Mở tin nhắn Zalo</a></p>` : ''}
          <p style="margin-top: 20px; font-size: 12px; color: #888;">Email tự động từ hệ thống Lolibub.</p>
        </div>
      `,
      attachments
    });
  } catch (error) {
    console.error('Failed to send order email:', error.message || error);
  }
}

// Send to Zalo
async function sendToZalo(message, phone) {
  const zaloPhone = process.env.ZALO_PHONE || (ZALO_CONFIG && ZALO_CONFIG.phone) || '';
  const zaloOAId = process.env.ZALO_OA_ID || (ZALO_CONFIG && ZALO_CONFIG.oaId) || '';
  
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

