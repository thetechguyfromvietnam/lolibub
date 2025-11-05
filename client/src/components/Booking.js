import React, { useState, useEffect } from 'react';
import { getMenu, submitOrder } from '../services/api';
import './Booking.css';

function Booking() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await getMenu();
      setMenuData(data);
      setLoading(false);
    } catch (err) {
      setNotification({ type: 'error', message: 'Không thể tải menu' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(selectedItems).length === 0) {
      setNotification({ type: 'error', message: 'Vui lòng chọn ít nhất một món!' });
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        ...formData,
        items: Object.values(selectedItems),
        total: calculateTotal()
      };

      const result = await submitOrder(orderData);

      if (result.zaloLink) {
        window.open(result.zaloLink, '_blank');
      }

      setNotification({ 
        type: 'success', 
        message: 'Đơn hàng đã được gửi thành công! Vui lòng kiểm tra Zalo.' 
      });

      // Reset form
      setFormData({
        customerName: '',
        phone: '',
        address: '',
        note: ''
      });
      setSelectedItems({});

      setTimeout(() => {
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
        <div className="loading">Đang tải menu...</div>
      </div>
    );
  }

  return (
    <div className="booking">
      {showNotification()}
      <section className="booking-section">
        <div className="container">
          <h2 className="section-title">Đặt Hàng</h2>
          <p className="section-subtitle">
            Vui lòng điền thông tin và chọn món bạn muốn đặt
          </p>

          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label htmlFor="customer-name">Họ và Tên *</label>
              <input
                type="text"
                id="customer-name"
                name="customerName"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Số Điện Thoại *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa Chỉ Giao Hàng *</label>
              <textarea
                id="address"
                name="address"
                rows="3"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Nhập địa chỉ giao hàng"
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">Ghi Chú</label>
              <textarea
                id="note"
                name="note"
                rows="3"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>

            <div className="form-group">
              <label>Chọn Món *</label>
              <div className="menu-selection">
                {menuData.categories.map((category) =>
                  category.items.map((item, itemIndex) => {
                    const itemId = `${category.name}_${item.name}`.replace(/\s+/g, '_');
                    const isSelected = !!selectedItems[itemId];

                    return (
                      <div
                        key={`${category.name}-${itemIndex}`}
                        className={`menu-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => !isSelected && toggleItemSelection(itemId, item, category.name)}
                      >
                        <div className="menu-option-header">
                          <span className="menu-option-name">{item.name}</span>
                          <span className="menu-option-price">{formatPrice(item.price)} đ</span>
                        </div>
                        <div className="menu-option-category">{category.name}</div>
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
              <h3>Tổng Đơn Hàng</h3>
              <div className="order-items">
                {Object.keys(selectedItems).length === 0 ? (
                  <p className="empty-cart">Chưa có món nào được chọn</p>
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
                  Tổng Tiền: <span>{formatPrice(calculateTotal())}</span> đ
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Gửi Đơn Hàng Qua Zalo'}
            </button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Loli Bub. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}

export default Booking;

