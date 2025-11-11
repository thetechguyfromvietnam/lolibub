const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');
const axios = require('axios');
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

// Receive order and forward to Formspree (with payment proof)
app.post('/api/orders', upload.single('paymentProof'), async (req, res) => {
  try {
    const { customerName, phone, address, note, items, total, paymentMethod } = req.body;
    const paymentProofFile = req.file;
    const resolvedPaymentMethod = (paymentMethod || 'bank_transfer').toLowerCase();

    let itemsArray;
    try {
      itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (parseError) {
      return res.status(400).json({ error: 'Danh sách món không hợp lệ' });
    }

    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống, vui lòng chọn ít nhất một món' });
    }

    if (!customerName || !phone || !address) {
      return res.status(400).json({ error: 'Thông tin đơn hàng không đầy đủ' });
    }

    // Check if payment proof is required
    if (resolvedPaymentMethod === 'bank_transfer' && !paymentProofFile) {
      return res.status(400).json({ error: 'Vui lòng upload ảnh chứng từ chuyển khoản!' });
    }

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

    const [sheetResult, notificationResult] = await Promise.allSettled([
      appendOrderToGoogleSheet(orderRecord),
      sendOrderNotification(orderRecord, orderMessage)
    ]);

    if (notificationResult.status === 'rejected') {
      console.error('Failed to send order notification email:', notificationResult.reason);

      // Clean up uploaded file if notification delivery failed
      if (paymentProofFile && fs.existsSync(paymentProofFile.path)) {
        fs.unlinkSync(paymentProofFile.path);
      }

      return res.status(502).json({
        success: false,
        error: 'Không thể gửi đơn hàng về email nhận thông báo. Vui lòng thử lại sau.'
      });
    }

    // Save order to file with payment proof info (best effort)
    saveOrderToFile(orderRecord);

    res.json({
      success: true,
      message: 'Đơn hàng đã được gửi thành công! Bếp sẽ xác nhận sau khi kiểm tra chứng từ.',
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

async function sendOrderNotification(orderData, orderMessage) {
  const formspreeEndpoint = getFormspreeEndpoint();

  if (!formspreeEndpoint) {
    return;
  }

  const recipients = (process.env.EMAIL_TO || 'thestoriesguys@gmail.com')
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  const itemsText = (orderData.items || [])
    .map((item) => {
      const name = item.name || 'Không rõ';
      const category = item.category || 'Không rõ';
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      return `- ${name} (${category}) x${quantity} = ${formatPrice(price * quantity)} đ`;
    })
    .join('\n');

  const message = [
    `Đơn hàng mới từ ${orderData.customerName || 'Khách hàng'}`,
    `SĐT: ${orderData.phone || ''}`,
    `Địa chỉ: ${orderData.address || ''}`,
    orderData.note ? `Ghi chú: ${orderData.note}` : null,
    `Hình thức thanh toán: ${
      orderData.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'
    }`,
    '',
    'Chi tiết:',
    itemsText || '(Không có mặt hàng)',
    '',
    `Tổng tiền: ${formatPrice(orderData.total || 0)} đ`,
    orderData.paymentProofPath
      ? `Chứng từ lưu tại: ${orderData.paymentProofPath}`
      : null,
    '',
    'Email tự động từ hệ thống Lolibub.'
  ]
    .filter(Boolean)
    .join('\n');

  await axios.post(
    formspreeEndpoint,
    {
      email: recipients[0] || 'thestoriesguys@gmail.com',
      message,
      ...(orderMessage ? { summary: orderMessage.replace(/\*/g, '') } : {})
    },
    {
      headers: {
        Accept: 'application/json'
      }
    }
  );
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

function getFormspreeEndpoint() {
  return process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/xqawzddv';
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

