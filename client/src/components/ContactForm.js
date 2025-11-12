import React, { useState } from 'react';
import './ContactForm.css';

const FORMCARRY_ENDPOINT = 'https://formcarry.com/s/jqXIdgSA5Ag';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
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
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Vui lòng điền đầy đủ thông tin trước khi gửi.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(FORMCARRY_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload.code === 200) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          message: ''
        });
        return;
      }

      setError(payload?.message || 'Không thể gửi đơn hàng. Vui lòng thử lại sau.');
    } catch (err) {
      console.error('Formcarry error:', err);
      setError(err?.message || 'Không thể gửi đơn hàng. Vui lòng thử lại sau.');
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
          onClick={() => {
            setSubmitted(false);
            setError(null);
          }}
        >
          Gửi thêm yêu cầu
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label htmlFor="name">Tên của bạn</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Nhập họ và tên"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

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
        <div className="form-error" role="alert">
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

