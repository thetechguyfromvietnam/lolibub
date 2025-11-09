// Configuration
const CONFIG = {
    // Zalo Official Account ID - Thay bằng OA ID của bạn
    zaloOAId: 'YOUR_ZALO_OA_ID',
    // Hoặc số điện thoại Zalo để mở chat
    zaloPhone: '0911091449',
    // Hoặc link Zalo chat trực tiếp
    zaloChatLink: 'https://zalo.me/0911091449'
};

// Global variables
let menuData = [];
let selectedItems = {}; // {itemId: quantity}

// Load menu data
async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        menuData = await response.json();
        displayMenu();
        if (window.location.pathname.includes('booking.html')) {
            displayBookingMenu();
        }
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menu-container').innerHTML = 
            '<div class="loading">Không thể tải menu. Vui lòng thử lại sau.</div>';
    }
}

// Display menu on index page
function displayMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = '';

    menuData.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';
        
        let categoryHTML = `
            <div class="category-title">${category.name}</div>
        `;

        if (category.price) {
            categoryHTML += `<div class="category-price">Giá: ${formatPrice(category.price)} đ</div>`;
        }

        category.items.forEach(item => {
            categoryHTML += `
                <div class="menu-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">${formatPrice(item.price)} đ</span>
                </div>
            `;
        });

        categoryDiv.innerHTML = categoryHTML;
        container.appendChild(categoryDiv);
    });
}

// Display menu on booking page
function displayBookingMenu() {
    const container = document.getElementById('menu-selection');
    if (!container) return;

    container.innerHTML = '';

    menuData.categories.forEach(category => {
        category.items.forEach(item => {
            const itemId = `${category.name}_${item.name}`.replace(/\s+/g, '_');
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'menu-option';
            optionDiv.dataset.itemId = itemId;
            
            optionDiv.innerHTML = `
                <div class="menu-option-header">
                    <span class="menu-option-name">${item.name}</span>
                    <span class="menu-option-price">${formatPrice(item.price)} đ</span>
                </div>
                <div class="menu-option-category" style="font-size: 12px; color: #7f8c8d; margin-bottom: 10px;">
                    ${category.name}
                </div>
                <div class="menu-option-quantity" style="display: none;">
                    <button type="button" class="quantity-btn" onclick="decreaseQuantity('${itemId}')">-</button>
                    <input type="number" class="quantity-input" id="qty-${itemId}" value="1" min="1" 
                           onchange="updateQuantity('${itemId}', this.value)">
                    <button type="button" class="quantity-btn" onclick="increaseQuantity('${itemId}')">+</button>
                </div>
            `;

            optionDiv.addEventListener('click', function(e) {
                if (!e.target.classList.contains('quantity-btn') && 
                    !e.target.classList.contains('quantity-input')) {
                    toggleItemSelection(itemId, item, category.name);
                }
            });

            container.appendChild(optionDiv);
        });
    });
}

// Toggle item selection
function toggleItemSelection(itemId, item, categoryName) {
    const optionDiv = document.querySelector(`[data-item-id="${itemId}"]`);
    const quantityDiv = optionDiv.querySelector('.menu-option-quantity');
    
    if (selectedItems[itemId]) {
        // Deselect
        optionDiv.classList.remove('selected');
        quantityDiv.style.display = 'none';
        delete selectedItems[itemId];
    } else {
        // Select
        optionDiv.classList.add('selected');
        quantityDiv.style.display = 'flex';
        selectedItems[itemId] = {
            name: item.name,
            price: item.price,
            category: categoryName,
            quantity: 1
        };
    }
    
    updateOrderSummary();
}

// Quantity controls
function increaseQuantity(itemId) {
    if (selectedItems[itemId]) {
        selectedItems[itemId].quantity++;
        document.getElementById(`qty-${itemId}`).value = selectedItems[itemId].quantity;
        updateOrderSummary();
    }
}

function decreaseQuantity(itemId) {
    if (selectedItems[itemId] && selectedItems[itemId].quantity > 1) {
        selectedItems[itemId].quantity--;
        document.getElementById(`qty-${itemId}`).value = selectedItems[itemId].quantity;
        updateOrderSummary();
    }
}

function updateQuantity(itemId, value) {
    if (selectedItems[itemId]) {
        const qty = parseInt(value) || 1;
        selectedItems[itemId].quantity = Math.max(1, qty);
        document.getElementById(`qty-${itemId}`).value = selectedItems[itemId].quantity;
        updateOrderSummary();
    }
}

// Update order summary
function updateOrderSummary() {
    const orderItemsDiv = document.getElementById('order-items');
    const totalPriceSpan = document.getElementById('total-price');
    
    if (!orderItemsDiv || !totalPriceSpan) return;

    const items = Object.values(selectedItems);
    
    if (items.length === 0) {
        orderItemsDiv.innerHTML = '<p class="empty-cart">Chưa có món nào được chọn</p>';
        totalPriceSpan.textContent = '0';
        return;
    }

    let total = 0;
    let itemsHTML = '';

    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHTML += `
            <div class="order-item">
                <span>${item.name} x${item.quantity}</span>
                <span>${formatPrice(itemTotal)} đ</span>
            </div>
        `;
    });

    orderItemsDiv.innerHTML = itemsHTML;
    totalPriceSpan.textContent = formatPrice(total);
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitOrder();
        });
    }
});

// Submit order to Zalo
function submitOrder() {
    const formData = {
        customerName: document.getElementById('customer-name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        note: document.getElementById('note').value || '',
        items: Object.values(selectedItems),
        total: calculateTotal()
    };

    // Validate
    if (formData.items.length === 0) {
        alert('Vui lòng chọn ít nhất một món!');
        return;
    }

    // Create order message
    const orderMessage = createOrderMessage(formData);

    // Send to Zalo
    sendToZalo(orderMessage, formData.phone);
}

// Create order message
function createOrderMessage(formData) {
    let message = `🍹 *ĐƠN HÀNG LOLI BUB*\n\n`;
    message += `👤 *Khách hàng:* ${formData.customerName}\n`;
    message += `📞 *SĐT:* ${formData.phone}\n`;
    message += `📍 *Địa chỉ:* ${formData.address}\n\n`;
    
    if (formData.note) {
        message += `📝 *Ghi chú:* ${formData.note}\n\n`;
    }
    
    message += `📋 *Chi tiết đơn hàng:*\n`;
    formData.items.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (${item.category})\n`;
        message += `   Số lượng: ${item.quantity} x ${formatPrice(item.price)} đ = ${formatPrice(item.price * item.quantity)} đ\n`;
    });
    
    message += `\n💰 *Tổng tiền:* ${formatPrice(formData.total)} đ\n\n`;
    message += `_Đơn hàng được đặt qua website_`;
    
    return message;
}

// Calculate total
function calculateTotal() {
    return Object.values(selectedItems).reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Send to Zalo
function sendToZalo(message, phone) {
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Method 1: Use Zalo chat link (if phone number is provided)
    if (CONFIG.zaloPhone && CONFIG.zaloPhone !== 'YOUR_ZALO_PHONE') {
        // Remove any spaces or special characters from phone number
        const cleanPhone = CONFIG.zaloPhone.replace(/[\s\-\(\)]/g, '');
        const zaloLink = `https://zalo.me/${cleanPhone}?text=${encodedMessage}`;
        window.open(zaloLink, '_blank');
        
        // Reset form after successful submission
        setTimeout(() => {
            document.getElementById('booking-form').reset();
            selectedItems = {};
            updateOrderSummary();
            // Show success message
            showNotification('✅ Đơn hàng đã được gửi! Vui lòng kiểm tra Zalo để xác nhận.', 'success');
        }, 500);
        return;
    }
    
    // Method 2: Use Zalo OA chat link
    if (CONFIG.zaloOAId && CONFIG.zaloOAId !== 'YOUR_ZALO_OA_ID') {
        const zaloOALink = `https://zalo.me/${CONFIG.zaloOAId}?text=${encodedMessage}`;
        window.open(zaloOALink, '_blank');
        setTimeout(() => {
            document.getElementById('booking-form').reset();
            selectedItems = {};
            updateOrderSummary();
            showNotification('✅ Đơn hàng đã được gửi! Vui lòng kiểm tra Zalo để xác nhận.', 'success');
        }, 500);
        return;
    }
    
    // Method 3: Copy to clipboard and show instructions
    navigator.clipboard.writeText(message).then(() => {
        showNotification('📋 Đơn hàng đã được sao chép! Vui lòng mở Zalo và dán vào chat với Loli Bub.', 'info');
        setTimeout(() => {
            document.getElementById('booking-form').reset();
            selectedItems = {};
            updateOrderSummary();
        }, 2000);
    }).catch(() => {
        // Fallback: Show message in modal
        showOrderModal(message);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show order modal (fallback)
function showOrderModal(message) {
    const modal = document.createElement('div');
    modal.className = 'order-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Đơn hàng của bạn</h3>
            <div class="modal-message">${message.replace(/\n/g, '<br>')}</div>
            <div class="modal-actions">
                <button onclick="copyOrderMessage()" class="btn btn-primary">Sao Chép</button>
                <button onclick="closeModal()" class="btn" style="background: #95a5a6; color: white;">Đóng</button>
            </div>
        </div>
    `;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-message {
            margin: 20px 0;
            white-space: pre-wrap;
            font-family: monospace;
        }
        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    window.copyOrderMessage = function() {
        navigator.clipboard.writeText(message);
        alert('Đã sao chép! Vui lòng dán vào Zalo.');
    };
    
    window.closeModal = function() {
        modal.remove();
    };
}

