import React, { useState } from 'react';
import './ContactForm.css';

function ContactForm() {
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'SEND_FAILED');
      }

      setSubmitted(true);
      setFormData({
        email: '',
        message: ''
      });
    } catch (err) {
      console.error('Send order error:', err);
      setError('Không thể gửi đơn hàng về email nhận thông báo. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="contact-form-success">
        <h3>Cảm ơn bạn!</h3>
        <p>Thông tin của bạn đã được gửi. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setSubmitted(false)}
        >
          Gửi thêm yêu cầu
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="Nhập email để nhận phản hồi"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="message">Nội dung</label>
        <textarea
          id="message"
          name="message"
          rows="5"
          placeholder="Nhập yêu cầu hoặc ghi chú cho đơn hàng của bạn"
          value={formData.message}
          onChange={handleChange}
          required
        />
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Đang gửi...' : 'Gửi Đơn'}
      </button>
    </form>
  );
}

export default ContactForm;

