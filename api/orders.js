const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

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

    // Save order info (file is already in /tmp, will be cleaned up automatically)
    const orderData = {
      customerName,
      phone,
      address,
      note,
      items,
      total,
      paymentProof: paymentProofFile.originalFilename,
      timestamp: new Date().toISOString()
    };

    // Try to save order to file (optional, for logging)
    try {
      const ordersDir = path.join(process.cwd(), 'orders');
      if (!fs.existsSync(ordersDir)) {
        fs.mkdirSync(ordersDir, { recursive: true });
      }
      const orderFile = path.join(ordersDir, `order_${Date.now()}.json`);
      fs.writeFileSync(orderFile, JSON.stringify(orderData, null, 2), 'utf8');
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

// Send to Zalo
async function sendToZalo(message, phone) {
  const zaloPhone = process.env.ZALO_PHONE || '';
  const zaloOAId = process.env.ZALO_OA_ID || '';
  
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

