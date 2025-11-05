import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getMenu } from '../services/api';
import './Home.css';

// Image mapping for different drink types
const getDrinkImage = (category, name, index) => {
  // Nước Ép Mix
  if (category.includes('Ép Mix')) {
    const juiceImages = [
      '/images/juice.jpeg',
      '/images/z7157243406689_0bc80b09531414fb1125863d4e179ba2.jpg',
      '/images/z7157243416577_23d1b721088788d5d04003297310d10d.jpg',
      '/images/z7157243466308_30ae76d7cc337d25a38be87943a597b2.jpg',
      '/images/z7157243471507_c056cb924d59925cb8daf1bd60cc5f7e.jpg'
    ];
    return juiceImages[index % juiceImages.length] || juiceImages[0];
  }
  
  // Nước Ép Nguyên Vị
  if (category.includes('Nguyên Vị')) {
    return '/images/juice.jpeg';
  }
  
  // Trà Trái Cây
  if (category.includes('Trà Trái Cây')) {
    const teaImages = [
      '/images/tea.jpeg',
      '/images/z7183821906972_481f98f7002f9c406075e39992978fc7.jpg',
      '/images/z7183821907048_1e5e0b4fa52d9feb5da072f9c05deac6.jpg'
    ];
    return teaImages[index % teaImages.length] || teaImages[0];
  }
  
  // Trà Sữa
  if (category.includes('Trà Sữa')) {
    return '/images/milk-tea.webp';
  }
  
  // Yogurt
  if (category.includes('Yogurt')) {
    return '/images/yoghurt.webp';
  }
  
  // Cafe
  if (category.includes('Cafe')) {
    return '/images/ca-phe.jpeg';
  }
  
  // Default
  return '/images/juice.jpeg';
};

// Icon mapping for fallback
const getDrinkIcon = (category, name) => {
  if (category.includes('Ép')) return '🥤';
  if (category.includes('Trà')) return '🍵';
  if (category.includes('Sữa')) return '🧋';
  if (category.includes('Yogurt')) return '🥛';
  if (category.includes('Cafe')) return '☕';
  return '💧';
};

// Description mapping
const getDescription = (category, name) => {
  if (name.includes('Energy') || name.includes('Boost')) {
    return 'Tăng cường năng lượng tự nhiên';
  }
  if (name.includes('Green') || name.includes('Detox')) {
    return 'Thanh lọc cơ thể, tốt cho sức khỏe';
  }
  if (name.includes('Vitality') || name.includes('Refresh')) {
    return 'Tươi mát, sảng khoái';
  }
  if (category.includes('Trà')) {
    return 'Trà trái cây thơm ngon, tự nhiên';
  }
  if (category.includes('Cafe')) {
    return 'Cà phê đậm đà, thơm lừng';
  }
  return 'Nước uống tươi ngon, bổ dưỡng';
};

// Get tags for drink
const getTags = (category, name) => {
  const tags = [];
  if (name.includes('Green') || name.includes('Detox')) {
    tags.push('Healthy');
  }
  if (name.includes('Energy') || name.includes('Boost')) {
    tags.push('Năng lượng');
  }
  if (category.includes('Trà')) {
    tags.push('Tự nhiên');
  }
  if (category.includes('Ép')) {
    tags.push('Tươi');
  }
  return tags.length > 0 ? tags : ['Tươi ngon'];
};

function Home() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await getMenu();
      setMenuData(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải menu. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleAddToCart = (item, category) => {
    addToCart(item, category);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Đang tải menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  // Group items by category
  const categoriesWithItems = menuData.categories.filter(cat => cat.items.length > 0);

  return (
    <div className="home">
      <section className="hero">
        <div 
          className="hero-background"
          style={{
            backgroundImage: `url('/images/background-hero.jpg')`
          }}
        ></div>
        <div className="container hero-content">
          <h2 className="hero-title">💧 Menu Nước Uống Healthy</h2>
          <p className="hero-subtitle">Tươi mát, tự nhiên, tốt cho sức khỏe của bạn</p>
        </div>
      </section>

      <section className="menu-section">
        <div className="container">
          {categoriesWithItems.map((category, catIndex) => (
            <div key={catIndex} className="category-section">
              <div className="category-header">
                <h3 className="category-title">{category.name}</h3>
                {category.price && (
                  <p className="category-subtitle">Giá: {formatPrice(category.price)} đ</p>
                )}
              </div>
              
              <div className="menu-cards-grid">
                {category.items.map((item, itemIndex) => {
                  const drinkImage = getDrinkImage(category.name, item.name, itemIndex);
                  const drinkIcon = getDrinkIcon(category.name, item.name);
                  const description = getDescription(category.name, item.name);
                  const tags = getTags(category.name, item.name);
                  
                  return (
                    <div
                      key={itemIndex}
                      className="menu-card"
                      onClick={() => handleAddToCart(item, category.name)}
                    >
                      <div className="menu-card-badge">{category.name}</div>
                      
                      <div className="menu-card-image-wrapper">
                        <img 
                          src={drinkImage} 
                          alt={item.name}
                          className="menu-card-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="menu-card-icon" style={{ display: 'none' }}>
                          {drinkIcon}
                        </div>
                      </div>
                      
                      <div className="menu-card-content">
                        <h3 className="menu-card-name">{item.name}</h3>
                        
                        <div className="menu-card-price">{formatPrice(item.price)} đ</div>
                        
                        <div className="menu-card-description">
                          {description}
                        </div>
                        
                        {tags.length > 0 && (
                          <div className="menu-card-tags">
                            {tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="menu-card-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <button className="menu-card-btn">
                          Thêm Vào Giỏ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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

export default Home;
