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
      setError('Please complete all fields before submitting.');
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

      setError(payload?.message || 'Unable to send your request. Please try again later.');
    } catch (err) {
      console.error('Formcarry error:', err);
      setError(err?.message || 'Unable to send your request. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="contact-form-success">
        <h3>Thank you!</h3>
        <p>Your details have been sent. We'll respond as soon as possible.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSubmitted(false);
            setError(null);
          }}
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label htmlFor="name">Your Name</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Enter your full name"
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
          placeholder="Enter your email for a reply"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows="5"
          placeholder="Enter your request or any notes"
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
        {submitting ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}

export default ContactForm;

