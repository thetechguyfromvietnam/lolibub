import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import './ContactForm.css';

function ContactForm() {
  const [state, handleSubmit] = useForm('xqawzddv');

  if (state.succeeded) {
    return (
      <div className="contact-form-success">
        <h3>Cảm ơn bạn!</h3>
        <p>Đơn hàng đã được gửi. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="Nhập email để nhận phản hồi"
          required
        />
        <ValidationError prefix="Email" field="email" errors={state.errors} />
      </div>

      <div className="form-row">
        <label htmlFor="message">Nội dung</label>
        <textarea
          id="message"
          name="message"
          rows="5"
          placeholder="Nhập yêu cầu hoặc ghi chú cho đơn hàng của bạn"
          required
        />
        <ValidationError prefix="Message" field="message" errors={state.errors} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={state.submitting}>
        {state.submitting ? 'Đang gửi...' : 'Gửi Đơn'}
      </button>
    </form>
  );
}

export default ContactForm;

