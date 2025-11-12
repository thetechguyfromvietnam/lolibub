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
    GMAIL_USER,
    GMAIL_APP_PASSWORD,
    GMAIL_PASS,
    EMAIL_FROM_NAME,
    EMAIL_TO,
  } = process.env;

  const user = GMAIL_USER || SMTP_USER;
  const pass = GMAIL_APP_PASSWORD || GMAIL_PASS || SMTP_PASS;

  if (!user || !pass) {
    throw new Error('Missing SMTP credentials. Please configure GMAIL_USER/GMAIL_APP_PASSWORD or SMTP_USER/SMTP_PASS.');
  }

  if (GMAIL_USER) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD || GMAIL_PASS
      }
    });
  }

  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: {
        user,
        pass
      }
    });
  }

  if (!SMTP_HOST) {
    throw new Error('Missing SMTP_HOST. Please configure SMTP_HOST, SMTP_SERVICE, or provide GMAIL_* variables.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: typeof SMTP_SECURE === 'string'
      ? SMTP_SECURE.toLowerCase() === 'true'
      : Number(SMTP_PORT || 465) === 465,
    auth: {
      user,
      pass
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

    const fromAddress = process.env.GMAIL_USER || process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Lolibub';
    const recipients = (process.env.EMAIL_TO || process.env.ORDER_RECEIVER || fromAddress || '')
      .split(',')
      .map((recipient) => recipient.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      throw new Error('No email recipients configured. Please set EMAIL_TO or ORDER_RECEIVER.');
    }

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: recipients,
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

