import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { submitOrder } from '../services/api';
import './Cart.css';

// Image mapping helper (same as Home)
const getDrinkImage = (category, name) => {
  if (category.includes('Ép Mix')) {
    return '/images/juice.jpeg';
  }
  if (category.includes('Nguyên Vị')) {
    return '/images/juice.jpeg';
  }
  if (category.includes('Trà Trái Cây')) {
    return '/images/tea.jpeg';
  }
  if (category.includes('Trà Sữa')) {
    return '/images/milk-tea.webp';
  }
  if (category.includes('Yogurt')) {
    return '/images/yoghurt.webp';
  }
  if (category.includes('Cafe')) {
    return '/images/ca-phe.jpeg';
  }
  return '/images/juice.jpeg';
};

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
    paymentProof: null
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
      setNotification({ type: 'error', message: 'Giỏ hàng trống!' });
      return;
    }
    setShowCheckout(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setNotification({ type: 'error', message: 'Kích thước file không được vượt quá 5MB' });
        return;
      }
      setFormData({ ...formData, paymentProof: file });
      
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
      setNotification({ type: 'error', message: 'Giỏ hàng trống!' });
      return;
    }

    if (!formData.paymentProof) {
      setNotification({ type: 'error', message: 'Vui lòng upload ảnh chứng từ chuyển khoản!' });
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
      orderFormData.append('paymentProof', formData.paymentProof);

      const result = await submitOrder(orderFormData);

      if (result.zaloLink) {
        window.open(result.zaloLink, '_blank');
      }

      setNotification({
        type: 'success',
        message: 'Đơn hàng đã được gửi thành công! Bếp sẽ xác nhận sau khi kiểm tra chứng từ.'
      });

      // Reset form and cart
      setFormData({
        customerName: '',
        phone: '',
        address: '',
        note: '',
        paymentProof: null
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
        message: error.response?.data?.error || 'Có lỗi xảy ra khi gửi đơn hàng'
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
            <h3>Giỏ Hàng</h3>
            <button className="close-cart" onClick={() => setShowCart(false)}>×</button>
          </div>
          <div className="cart-empty">
            <p>Giỏ hàng trống</p>
            <button className="btn btn-primary" onClick={() => setShowCart(false)}>
              Tiếp Tục Mua Sắm
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
          <h3>{showCheckout ? 'Thanh Toán' : 'Giỏ Hàng'}</h3>
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
                        src={getDrinkImage(item.category, item.name)} 
                        alt={item.name}
                        className="cart-item-image"
                      />
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-category">{item.category}</div>
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
                <strong>Tổng Tiền: {formatPrice(getTotalPrice())} đ</strong>
              </div>
              <button className="btn btn-primary btn-checkout" onClick={handleCheckout}>
                Thanh Toán
              </button>
            </div>
          </>
        ) : (
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="checkout-name">Họ và Tên *</label>
              <input
                type="text"
                id="checkout-name"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-phone">Số Điện Thoại *</label>
              <input
                type="tel"
                id="checkout-phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-address">Địa Chỉ Giao Hàng *</label>
              <textarea
                id="checkout-address"
                rows="3"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Nhập địa chỉ giao hàng"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-note">Ghi Chú</label>
              <textarea
                id="checkout-note"
                rows="2"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>

            <div className="checkout-summary">
              <h4>Đơn Hàng:</h4>
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)} đ</span>
                </div>
              ))}
              <div className="summary-total">
                <strong>Tổng: {formatPrice(getTotalPrice())} đ</strong>
              </div>
            </div>

            <div className="payment-section">
              <h4>Thanh Toán</h4>
              <div className="qr-code-section">
                <p className="qr-instruction">Vui lòng quét mã QR để chuyển khoản:</p>
                <div className="qr-code-wrapper">
                  <img 
                    src="/images/qr-code.jpg" 
                    alt="QR Code Chuyển Khoản" 
                    className="qr-code-image"
                  />
                </div>
                <p className="qr-amount">Số tiền: <strong>{formatPrice(getTotalPrice())} đ</strong></p>
              </div>

              <div className="form-group">
                <label htmlFor="payment-proof">
                  Upload Ảnh Chứng Từ Chuyển Khoản *
                  <span className="required-note">(Bắt buộc)</span>
                </label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id="payment-proof"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                    required
                  />
                  <label htmlFor="payment-proof" className="file-label">
                    {paymentProofPreview ? '✓ Đã chọn ảnh' : 'Chọn ảnh chứng từ'}
                  </label>
                </div>
                {paymentProofPreview && (
                  <div className="payment-proof-preview">
                    <img src={paymentProofPreview} alt="Chứng từ chuyển khoản" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => {
                        setFormData({ ...formData, paymentProof: null });
                        setPaymentProofPreview(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <p className="file-note">Chấp nhận: JPG, PNG, GIF (tối đa 5MB)</p>
              </div>
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCheckout(false);
                  setPaymentProofPreview(null);
                  setFormData({ ...formData, paymentProof: null });
                }}
              >
                Quay Lại
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !formData.paymentProof}
              >
                {submitting ? 'Đang gửi...' : 'Xác Nhận Đơn Hàng'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Cart;

