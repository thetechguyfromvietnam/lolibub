// Cấu hình Zalo - Thay đổi thông tin tại đây
// Bạn chỉ cần điền một trong các cách dưới đây

const ZALO_CONFIG = {
    // Cách 1: Sử dụng số điện thoại Zalo (khuyến nghị)
    // Ví dụ: '0912345678' (không có dấu cách, không có dấu +)
    phone: 'YOUR_ZALO_PHONE',
    
    // Cách 2: Sử dụng Zalo Official Account ID
    // Nếu bạn có Zalo OA, điền ID tại đây
    oaId: 'YOUR_ZALO_OA_ID',
    
    // Cách 3: Link Zalo chat trực tiếp (nếu có)
    chatLink: ''
};

// Export để sử dụng trong script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZALO_CONFIG;
}

