import React, { useState, useEffect } from 'react';
import { getMenu, submitOrder } from '../services/api';
import { translateCategoryName, translateDrinkName } from '../utils/translations';
import './Booking.css';

function Booking() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'bank_transfer',
    paymentProof: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await getMenu();
      setMenuData(data);
      setLoading(false);
    } catch (err) {
      setNotification({ type: 'error', message: 'Unable to load the menu.' });
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const toggleItemSelection = (itemId, item, categoryName) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (newItems[itemId]) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = {
          name: item.name,
          price: item.price,
          category: categoryName,
          quantity: 1
        };
      }
      return newItems;
    });
  };

  const updateQuantity = (itemId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: qty }
    }));
  };

  const calculateTotal = () => {
    return Object.values(selectedItems).reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handlePaymentMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
      paymentProof: method === 'bank_transfer' ? prev.paymentProof : null
    }));

    if (method !== 'bank_transfer') {
      setPaymentProofPreview(null);
    }
  };

  const handleFileChange = (e) => {
    if (formData.paymentMethod !== 'bank_transfer') {
      return;
    }

    const file = e.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setNotification({ type: 'error', message: 'File size must not exceed 5MB.' });
        return;
      }

      setFormData((prev) => ({ ...prev, paymentProof: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, paymentProof: null }));
      setPaymentProofPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(selectedItems).length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one item!' });
      return;
    }

    if (formData.paymentMethod === 'bank_transfer' && !formData.paymentProof) {
      setNotification({ type: 'error', message: 'Please upload your transfer receipt image!' });
      return;
    }

    setSubmitting(true);

    try {
      const orderFormData = new FormData();
      orderFormData.append('customerName', formData.customerName);
      orderFormData.append('phone', formData.phone);
      orderFormData.append('address', formData.address);
      orderFormData.append('note', formData.note || '');
      orderFormData.append('paymentMethod', formData.paymentMethod);
      orderFormData.append('items', JSON.stringify(Object.values(selectedItems)));
      orderFormData.append('total', calculateTotal());

      if (formData.paymentMethod === 'bank_transfer' && formData.paymentProof) {
        orderFormData.append('paymentProof', formData.paymentProof);
      }

      const result = await submitOrder(orderFormData);

      if (!result?.success) {
        throw new Error(result?.error || 'The order could not be delivered to the notification inbox.');
      }

      setNotification({ 
        type: 'success', 
        message: 'Order sent successfully! Details have been delivered to Formsheet.' 
      });

      // Reset form
      setFormData({
        customerName: '',
        phone: '',
        address: '',
        note: '',
        paymentMethod: 'bank_transfer',
        paymentProof: null
      });
      setSelectedItems({});
      setPaymentProofPreview(null);

      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || error.message || 'Something went wrong while submitting the order.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const showNotification = () => {
    if (!notification) return null;

    return (
      <div className={`notification notification-${notification.type}`}>
        {notification.message}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="booking">
      {showNotification()}
      <section className="booking-section">
        <div className="container">
          <h2 className="section-title">Place an Order</h2>
          <p className="section-subtitle">
            Please fill in your details and pick the drinks you would like to order.
          </p>

          <form onSubmit={handleSubmit} className="booking-form" method="POST">
            <div className="form-group">
              <label htmlFor="customer-name">Full Name *</label>
              <input
                type="text"
                id="customer-name"
                name="customerName"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address *</label>
              <textarea
                id="address"
                name="address"
                rows="3"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter delivery address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">Notes</label>
              <textarea
                id="note"
                name="note"
                rows="3"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Additional notes (optional)"
              />
            </div>

            <div className="form-group payment-method-group">
              <label>Payment Method *</label>
              <div className="payment-method-options">
                <label
                  className={`payment-method-option ${formData.paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="bookingPaymentMethod"
                    value="bank_transfer"
                    checked={formData.paymentMethod === 'bank_transfer'}
                    onChange={() => handlePaymentMethodChange('bank_transfer')}
                  />
                  <span className="payment-method-title">Bank transfer</span>
                  <span className="payment-method-desc">Scan the QR code and upload the transfer receipt</span>
                </label>

                <label
                  className={`payment-method-option ${formData.paymentMethod === 'cash' ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="bookingPaymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={() => handlePaymentMethodChange('cash')}
                  />
                  <span className="payment-method-title">Cash</span>
                  <span className="payment-method-desc">Pay directly when you receive the order</span>
                </label>
              </div>

              {formData.paymentMethod === 'bank_transfer' ? (
                <div className="payment-transfer-details">
                  <div className="qr-code-section">
                    <p className="qr-instruction">Please scan the QR code to transfer:</p>
                    <div className="qr-code-wrapper">
                      <img
                        src="/images/qr-code.jpg"
                        alt="Bank Transfer QR Code"
                        className="qr-code-image"
                      />
                    </div>
                    <p className="qr-amount">Amount: <strong>{formatPrice(calculateTotal())} đ</strong></p>
                  </div>

                  <div className="payment-proof-upload">
                    <label htmlFor="booking-payment-proof">
                      Upload Bank Transfer Receipt
                      <span className="required-note">(Required for bank transfers)</span>
                    </label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="booking-payment-proof"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                        required={formData.paymentMethod === 'bank_transfer'}
                      />
                      <label htmlFor="booking-payment-proof" className="file-label">
                        {paymentProofPreview ? '✓ Image selected' : 'Choose receipt image'}
                      </label>
                    </div>
                    {paymentProofPreview && (
                      <div className="payment-proof-preview">
                        <img src={paymentProofPreview} alt="Transfer receipt preview" />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, paymentProof: null }));
                            setPaymentProofPreview(null);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <p className="file-note">Accepted formats: JPG, PNG, GIF (max 5MB)</p>
                  </div>
                </div>
              ) : (
                <div className="cash-payment-note">
                  <p>
                    You will pay in cash upon delivery. Please prepare{' '}
                    <strong>{formatPrice(calculateTotal())} đ</strong> for a smooth handoff.
                  </p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Select Items *</label>
              <div className="menu-selection">
                {menuData.categories.map((category) =>
                  category.items.map((item, itemIndex) => {
                    const itemId = `${category.name}_${item.name}`.replace(/\s+/g, '_');
                    const isSelected = !!selectedItems[itemId];
                    const displayCategoryName = translateCategoryName(category.name);
                    const translatedName = translateDrinkName(item.name);
                    const showOriginalName = translatedName !== item.name;

                    return (
                      <div
                        key={`${category.name}-${itemIndex}`}
                        className={`menu-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleItemSelection(itemId, item, category.name)}
                      >
                        <div className="menu-option-header">
                          <span className="menu-option-name">
                            {translatedName}
                            {showOriginalName && (
                              <span className="menu-option-name-original">{item.name}</span>
                            )}
                          </span>
                          <span className="menu-option-price">{formatPrice(item.price)} đ</span>
                        </div>
                        <div className="menu-option-category">{displayCategoryName}</div>
                        {isSelected && (
                          <div className="menu-option-quantity">
                            <button
                              type="button"
                              className="quantity-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(itemId, selectedItems[itemId].quantity - 1);
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              className="quantity-input"
                              value={selectedItems[itemId].quantity}
                              min="1"
                              onChange={(e) => {
                                e.stopPropagation();
                                updateQuantity(itemId, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              type="button"
                              className="quantity-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(itemId, selectedItems[itemId].quantity + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="order-items">
                {Object.keys(selectedItems).length === 0 ? (
                  <p className="empty-cart">No items selected yet</p>
                ) : (
                  Object.values(selectedItems).map((item, index) => (
                    <div key={index} className="order-item">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)} đ</span>
                    </div>
                  ))
                )}
              </div>
              <div className="order-total">
                <strong>
                  Total: <span>{formatPrice(calculateTotal())} đ</span>
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Order via Formsheet'}
            </button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Loli Bub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Booking;

