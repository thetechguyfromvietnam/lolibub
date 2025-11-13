import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { submitOrder } from '../services/api';
import './Cart.css';
import { resolveDrinkImage } from '../utils/imageAssets';
import { translateCategoryName } from '../utils/translations';

function Cart() {
  const {
    cartItems,
    updateQuantity,
    clearCart,
    getTotalPrice,
    setShowCart
  } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    note: '',
    paymentProof: null,
    paymentMethod: 'bank_transfer'
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setNotification({ type: 'error', message: 'Your cart is empty!' });
      return;
    }
    setShowCheckout(true);
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setNotification({ type: 'error', message: 'File size must not exceed 5MB.' });
        return;
      }
      setFormData((prev) => ({ ...prev, paymentProof: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setNotification({ type: 'error', message: 'Your cart is empty!' });
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
      orderFormData.append('items', JSON.stringify(cartItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      }))));
      orderFormData.append('total', getTotalPrice());
      orderFormData.append('paymentMethod', formData.paymentMethod);

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

      // Reset form and cart
      setFormData({
        customerName: '',
        phone: '',
        address: '',
        note: '',
        paymentProof: null,
        paymentMethod: 'bank_transfer'
      });
      setPaymentProofPreview(null);
      clearCart();
      setShowCheckout(false);

      setTimeout(() => {
        setShowCart(false);
        setNotification(null);
      }, 5000);
    } catch (error) {
      setNotification({
        type: 'error',
        message:
          error.response?.data?.error ||
          error.message ||
          'Something went wrong while submitting the order.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !showCheckout) {
    return (
      <div className="cart-overlay" onClick={() => setShowCart(false)}>
        <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h3>Cart</h3>
            <button className="close-cart" onClick={() => setShowCart(false)}>×</button>
          </div>
          <div className="cart-empty">
            <p>Your cart is empty</p>
            <button className="btn btn-primary" onClick={() => setShowCart(false)}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-overlay" onClick={() => setShowCart(false)}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        {notification && (
          <div className={`cart-notification notification-${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="cart-header">
          <h3>{showCheckout ? 'Checkout' : 'Cart'}</h3>
          <button className="close-cart" onClick={() => {
            setShowCart(false);
            setShowCheckout(false);
          }}>×</button>
        </div>

        {!showCheckout ? (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-main-row">
                    <div className="cart-item-image-wrapper">
                      <img 
                        src={resolveDrinkImage(item.category, item.name)}
                        alt={item.name}
                        className="cart-item-image"
                      />
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-category">{translateCategoryName(item.category)}</div>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-total">
                      {formatPrice(item.price * item.quantity)} đ
                    </div>
                  </div>
                  <div className="cart-item-category-row">
                    <div className="cart-item-name">{item.name}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <strong>Total: {formatPrice(getTotalPrice())} đ</strong>
              </div>
              <button className="btn btn-primary btn-checkout" onClick={handleCheckout}>
                Go to Checkout
              </button>
            </div>
          </>
        ) : (
          <form className="checkout-form" onSubmit={handleSubmit} method="POST">
            <div className="form-group">
              <label htmlFor="checkout-name">Full Name *</label>
              <input
                type="text"
                id="checkout-name"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-phone">Phone Number *</label>
              <input
                type="tel"
                id="checkout-phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-address">Delivery Address *</label>
              <textarea
                id="checkout-address"
                rows="3"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter delivery address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-note">Notes</label>
              <textarea
                id="checkout-note"
                rows="2"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Additional notes (optional)"
              />
            </div>

            <div className="checkout-summary">
              <h4>Order:</h4>
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)} đ</span>
                </div>
              ))}
              <div className="summary-total">
                <strong>Total: {formatPrice(getTotalPrice())} đ</strong>
              </div>
            </div>

            <div className="payment-section">
              <h4>Payment</h4>
              <div className="payment-method-options">
                <label
                  className={`payment-method-option ${formData.paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
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
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={() => handlePaymentMethodChange('cash')}
                  />
                  <span className="payment-method-title">Cash</span>
                  <span className="payment-method-desc">Pay directly when you receive the order</span>
                </label>
              </div>

              {formData.paymentMethod === 'bank_transfer' ? (
                <>
                  <div className="qr-code-section">
                    <p className="qr-instruction">Please scan the QR code to transfer:</p>
                    <div className="qr-code-wrapper">
                      <img 
                        src="/images/ma-qr-chuyen-khoan.jpg" 
                        alt="Bank Transfer QR Code" 
                        className="qr-code-image"
                      />
                    </div>
                    <p className="qr-amount">Amount: <strong>{formatPrice(getTotalPrice())} đ</strong></p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="payment-proof">
                      Upload Bank Transfer Receipt
                      <span className="required-note">(Required for bank transfers)</span>
                    </label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="payment-proof"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                        required={formData.paymentMethod === 'bank_transfer'}
                      />
                      <label htmlFor="payment-proof" className="file-label">
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
                </>
              ) : (
                <div className="cash-payment-note">
                  <p>
                    You will pay in cash upon delivery. Please prepare{' '}
                    <strong>{formatPrice(getTotalPrice())} đ</strong> for a smooth handoff.
                  </p>
                </div>
              )}
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCheckout(false);
                  setPaymentProofPreview(null);
                  setFormData((prev) => ({ ...prev, paymentProof: null }));
                }}
              >
                Go Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  submitting || (formData.paymentMethod === 'bank_transfer' && !formData.paymentProof)
                }
              >
                {submitting ? 'Sending...' : 'Confirm Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Cart;

