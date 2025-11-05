# Images Directory

Thư mục này chứa tất cả các hình ảnh cho website Loli Bub.

## Cách sử dụng trong React

Để sử dụng các hình ảnh trong React components, bạn có thể reference chúng như sau:

```jsx
// Cách 1: Sử dụng đường dẫn tuyệt đối từ public
<img src="/images/logo.png" alt="Logo" />

// Cách 2: Sử dụng require (cho dynamic imports)
<img src={require('./images/logo.png')} alt="Logo" />

// Cách 3: Sử dụng import
import logo from './images/logo.png';
<img src={logo} alt="Logo" />
```

## Danh sách hình ảnh

- `logo.png` - Logo của Loli Bub
- `juice.jpeg` - Hình ảnh nước ép
- `tea.jpeg` - Hình ảnh trà trái cây
- `milk-tea.webp` - Hình ảnh trà sữa
- `yoghurt.webp` - Hình ảnh yogurt
- `ca-phe.jpeg` - Hình ảnh cà phê
- `qr-code.jpg` - QR code thanh toán
- `background-hero.jpg` - Background cho hero section
- `anh-nen.jpg` - Hình nền
- Các file `z7*.jpg` - Hình ảnh sản phẩm khác

## Lưu ý

- Tất cả hình ảnh trong thư mục `public/images` có thể được truy cập trực tiếp từ URL `/images/filename.jpg`
- Khi build production, các file này sẽ được copy vào thư mục `build/images`
- Đảm bảo tên file không có khoảng trắng hoặc ký tự đặc biệt

