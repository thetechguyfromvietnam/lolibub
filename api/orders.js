const fs = require('fs');
const path = require('path');
const { formidable } = require('formidable');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

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

    const getFieldValue = (value) => {
      if (Array.isArray(value)) {
        return value[0];
      }
      return value;
    };

    const getFileValue = (value) => {
      if (Array.isArray(value)) {
        return value[0];
      }
      return value;
    };
    
    const customerName = getFieldValue(fields.customerName) || 'Khách hàng';
    const phone = getFieldValue(fields.phone);
    const address = getFieldValue(fields.address);
    const note = getFieldValue(fields.note) || '';
    const resolvedPaymentMethod = getFieldValue(fields.paymentMethod)?.toLowerCase() || 'bank_transfer';
    let items;
    try {
      items = JSON.parse(getFieldValue(fields.items) || '[]');
    } catch (parseError) {
      return res.status(400).json({ error: 'Danh sách món không hợp lệ' });
    }
    const total = parseFloat(getFieldValue(fields.total) || '0');
    const paymentProofFile = getFileValue(files.paymentProof);

    // Validate
    if (!phone || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Thông tin đơn hàng không đầy đủ' });
    }

    if (resolvedPaymentMethod === 'bank_transfer' && !paymentProofFile) {
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
      paymentProof: paymentProofFile ? (paymentProofFile.originalFilename || 'payment-proof.jpg') : null,
      paymentMethod: resolvedPaymentMethod
    });

    const orderRecord = {
      customerName,
      phone,
      address,
      note,
      items,
      total,
      paymentMethod: resolvedPaymentMethod,
      paymentProof: paymentProofFile ? paymentProofFile.originalFilename : null,
      paymentProofPath: paymentProofFile ? paymentProofFile.filepath : null,
      timestamp: new Date().toISOString()
    };

    const [sheetResult, notificationResult] = await Promise.allSettled([
      appendOrderToGoogleSheet(orderRecord),
      sendOrderNotification(orderRecord, orderMessage)
    ]);

    if (notificationResult.status === 'rejected') {
      console.error('Failed to send order notification email:', notificationResult.reason);

      if (paymentProofFile && paymentProofFile.filepath && fs.existsSync(paymentProofFile.filepath)) {
        fs.unlinkSync(paymentProofFile.filepath);
      }

      return res.status(502).json({
        success: false,
        error: 'Không thể gửi đơn hàng về email nhận thông báo. Vui lòng thử lại sau.'
      });
    }

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
function createOrderMessage(orderData = {}) {
  const {
    customerName = 'Khách hàng',
    phone = '',
    address = '',
    note = '',
    items = [],
    total = 0,
    paymentMethod = 'bank_transfer',
    paymentProof = null
  } = orderData || {};

  if (!Array.isArray(items)) {
    throw new Error('Invalid order items payload');
  }

  let message = `🍹 *ĐƠN HÀNG LOLI BUB*\n\n`;
  message += `👤 *Khách hàng:* ${customerName}\n`;
  message += `📞 *SĐT:* ${phone}\n`;
  message += `📍 *Địa chỉ:* ${address}\n\n`;
  
  if (note) {
    message += `📝 *Ghi chú:* ${note}\n\n`;
  }

  const paymentLabel = paymentMethod === 'cash'
    ? 'Tiền mặt khi nhận hàng'
    : 'Chuyển khoản';
  message += `💳 *Thanh toán:* ${paymentLabel}\n`;
  
  message += `📋 *Chi tiết đơn hàng:*\n`;
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} (${item.category})\n`;
    message += `   Số lượng: ${item.quantity} x ${formatPrice(item.price)} đ = ${formatPrice(item.price * item.quantity)} đ\n`;
  });
  
  message += `\n💰 *Tổng tiền:* ${formatPrice(total)} đ\n\n`;
  
  if (paymentMethod === 'bank_transfer' && paymentProof) {
    message += `✅ *Đã nhận chứng từ chuyển khoản*\n`;
    message += `📎 File: ${paymentProof}\n\n`;
  }
  
  if (paymentMethod === 'cash') {
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

function getMailTransporter() {
  if (getMailTransporter.transporter) {
    return getMailTransporter.transporter;
  }

  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('Missing email credentials. Skipping email notification.');
    return null;
  }

  const transporter = nodemailer.createTransport(
    process.env.GMAIL_USER
      ? {
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
          }
        }
      : {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT || 465),
          secure: typeof process.env.SMTP_SECURE === 'string'
            ? process.env.SMTP_SECURE.toLowerCase() === 'true'
            : Number(process.env.SMTP_PORT || 465) === 465,
          auth: {
            user,
            pass
          }
        }
  );

  getMailTransporter.transporter = transporter;
  return transporter;
}

async function sendOrderNotification(orderData, orderMessage) {
  const transporter = getMailTransporter();

  if (!transporter) {
    throw new Error('Email transporter not configured');
  }

  const senderName = process.env.EMAIL_FROM_NAME || 'Loli Bub';
  const senderEmail = process.env.GMAIL_USER || process.env.SMTP_FROM || process.env.SMTP_USER;
  const recipients = (process.env.EMAIL_TO || process.env.ORDER_RECEIVER || senderEmail || '')
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error('No email recipients configured');
  }

  const itemsText = (orderData.items || [])
    .map((item) => {
      const name = item.name || 'Không rõ';
      const category = item.category || 'Không rõ';
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      return `- ${name} (${category}) x${quantity} = ${formatPrice(price * quantity)} đ`;
    })
    .join('\n');

  const textMessage = [
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
      ? `Chứng từ tạm lưu tại: ${orderData.paymentProofPath}`
      : null,
    '',
    'Email tự động từ hệ thống Lolibub.'
  ]
    .filter(Boolean)
    .join('\n');

  const htmlMessage = [
    '<h2>Đơn hàng mới từ website Lolibub</h2>',
    `<p><strong>Khách hàng:</strong> ${orderData.customerName || ''}</p>`,
    `<p><strong>SĐT:</strong> ${orderData.phone || ''}</p>`,
    `<p><strong>Địa chỉ:</strong> ${orderData.address || ''}</p>`,
    orderData.note ? `<p><strong>Ghi chú:</strong> ${orderData.note}</p>` : null,
    `<p><strong>Thanh toán:</strong> ${
      orderData.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'
    }</p>`,
    '<h3>Chi tiết đơn hàng</h3>',
    '<ul>',
    ...(orderData.items || []).map((item) => {
      const name = item.name || 'Không rõ';
      const category = item.category || 'Không rõ';
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      return `<li>${name} (${category}) x${quantity} = ${formatPrice(price * quantity)} đ</li>`;
    }),
    '</ul>',
    `<p><strong>Tổng tiền:</strong> ${formatPrice(orderData.total || 0)} đ</p>`,
    orderData.paymentMethod === 'bank_transfer' && orderData.paymentProof
      ? `<p>Đã nhận chứng từ: ${orderData.paymentProof}</p>`
      : null,
    '<p>Email tự động từ hệ thống Lolibub.</p>'
  ]
    .filter(Boolean)
    .join('\n');

  const attachments = [];

  if (orderData.paymentProofPath && fs.existsSync(orderData.paymentProofPath)) {
    attachments.push({
      filename: path.basename(orderData.paymentProofPath),
      path: orderData.paymentProofPath
    });
  }

  await transporter.sendMail({
    from: `"${senderName}" <${senderEmail}>`,
    to: recipients,
    subject: `Đơn hàng mới từ ${orderData.customerName || 'Khách hàng'}`,
    text: orderMessage ? orderMessage.replace(/\*/g, '') : textMessage,
    html: htmlMessage,
    attachments
  });
}

