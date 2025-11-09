const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const ZALO_CONFIG = require('../config');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data with file upload
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
      uploadDir: '/tmp' // Vercel serverless functions use /tmp
    });

    const [fields, files] = await form.parse(req);
    
    const customerName = fields.customerName?.[0];
    const phone = fields.phone?.[0];
    const address = fields.address?.[0];
    const note = fields.note?.[0] || '';
    const items = JSON.parse(fields.items?.[0] || '[]');
    const total = parseFloat(fields.total?.[0] || '0');
    const paymentProofFile = files.paymentProof?.[0];

    // Validate
    if (!customerName || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: 'Thông tin đơn hàng không đầy đủ' });
    }

    if (!paymentProofFile) {
      return res.status(400).json({ error: 'Vui lòng upload ảnh chứng từ chuyển khoản!' });
    }

    // Create order message with payment proof info
    const orderMessage = createOrderMessage({
      customerName,
      phone,
      address,
      note,
      items,
      total,
      paymentProof: paymentProofFile.originalFilename || 'payment-proof.jpg'
    });

    // Send to Zalo
    const zaloResult = await sendToZalo(orderMessage, phone);

    const orderRecord = {
      customerName,
      phone,
      address,
      note,
      items,
      total,
      paymentMethod: 'bank_transfer',
      paymentProof: paymentProofFile.originalFilename,
      paymentProofPath: paymentProofFile.filepath,
      timestamp: new Date().toISOString()
    };

    await Promise.allSettled([
      appendOrderToGoogleSheet(orderRecord),
      sendOrderEmailNotification(orderRecord, orderMessage, zaloResult.link)
    ]);

    // Try to save order to file (optional, for logging)
    try {
      const ordersDir = path.join(process.cwd(), 'orders');
      if (!fs.existsSync(ordersDir)) {
        fs.mkdirSync(ordersDir, { recursive: true });
      }
      const orderFile = path.join(ordersDir, `order_${Date.now()}.json`);
      fs.writeFileSync(orderFile, JSON.stringify(orderRecord, null, 2), 'utf8');
    } catch (fileError) {
      console.error('Error saving order file:', fileError);
      // Continue even if file save fails
    }

    res.status(200).json({
      success: true,
      message: 'Đơn hàng đã được gửi thành công! Bếp sẽ xác nhận sau khi kiểm tra chứng từ.',
      zaloLink: zaloResult.link,
      orderMessage: orderMessage
    });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ 
      error: error.message || 'Có lỗi xảy ra khi xử lý đơn hàng' 
    });
  }
};

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
      message: 'Chưa cấu hình Zalo. Vui lòng cấu hình trong Vercel Environment Variables',
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

