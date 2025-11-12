import nodemailer from 'nodemailer';

const parseBody = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return {};
    }
  }

  return body;
};

const createTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    SMTP_SERVICE
  } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP credentials. Please configure SMTP_USER and SMTP_PASS.');
  }

  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }

  if (!SMTP_HOST) {
    throw new Error('Missing SMTP_HOST. Please configure SMTP_HOST or SMTP_SERVICE.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: typeof SMTP_SECURE === 'string'
      ? SMTP_SECURE.toLowerCase() === 'true'
      : Number(SMTP_PORT || 465) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const formData = parseBody(request.body);
  const email = (formData.email || '').trim();
  const message = (formData.message || '').trim();
  const name = (formData.name || '').trim();
  const phone = (formData.phone || '').trim();

  if (!email || !message) {
    return response.status(400).json({ message: 'Thông tin chưa đầy đủ.' });
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Lolibub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.ORDER_RECEIVER || process.env.SMTP_USER,
      replyTo: email,
      subject: 'Yêu cầu mới từ Lolibub',
      text: [
        name ? `Khách hàng: ${name}` : '',
        phone ? `Số điện thoại: ${phone}` : '',
        `Email: ${email}`,
        '',
        'Nội dung:',
        message
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <h2>Yêu cầu mới từ Lolibub</h2>
        <ul>
          ${name ? `<li><strong>Khách hàng:</strong> ${name}</li>` : ''}
          ${phone ? `<li><strong>Số điện thoại:</strong> ${phone}</li>` : ''}
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <p><strong>Nội dung:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Send mail error:', error);
    return response.status(500).json({
      message: 'Không thể gửi đơn hàng về email nhận thông báo. Vui lòng thử lại sau.'
    });
  }
}

