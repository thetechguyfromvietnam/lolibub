import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getMenu } from '../services/api';
import './Home.css';
import { resolveDrinkImage, heroBackgrounds } from '../utils/imageAssets';
import ContactForm from './ContactForm';

const ingredientTranslations = {
  'táo': 'Apple',
  'cà rốt': 'Carrot',
  'củ dền': 'Beetroot',
  'thơm': 'Pineapple',
  'dứa': 'Pineapple',
  'ổi': 'Guava',
  'bạc hà': 'Mint',
  'cải kale': 'Kale',
  'tắc': 'Kumquat',
  'dưa hấu': 'Watermelon',
  'nho': 'Grape',
  'dưa leo': 'Cucumber',
  'cần tây': 'Celery'
};

const translateIngredients = (ingredients) => {
  return ingredients.map((ingredient) => {
    const key = ingredient.trim().toLowerCase();
    return ingredientTranslations[key] || ingredient;
  });
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

const getCategoryTagline = (categoryName = '') => {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes('trà trái cây')) {
    return 'Trà trái cây thơm ngon, tự nhiên';
  }
  if (normalized.includes('cafe')) {
    return 'Cà phê đậm đà, thơm lừng';
  }
  if (normalized.includes('trà sữa')) {
    return 'Trà sữa ngọt ngào, chuẩn vị yêu thích';
  }
  return 'Nước uống tươi ngon, bổ dưỡng';
};

function Home() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  const totalHeroSlides = heroBackgrounds.length;

  useEffect(() => {
    if (totalHeroSlides <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % totalHeroSlides);
    }, 1500);

    return () => clearInterval(interval);
  }, [totalHeroSlides]);

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
        <div className="hero-background">
          {heroBackgrounds.map((image, index) => (
            <div
              key={image}
              className={`hero-background-slide ${index === currentHeroIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url('${image}')` }}
            />
          ))}
        </div>
        <div className="container hero-content">
          <h2 className="hero-title">Lolibub Nước Uống Tốt Cho Sức Khoẻ</h2>
          <p className="hero-subtitle">Tươi mát, tự nhiên, tốt cho sức khỏe của bạn</p>
        </div>
      </section>

      <section className="menu-section">
        <div className="container">
          {categoriesWithItems.map((category, catIndex) => (
            <div key={catIndex} className="category-section">
              <div className="category-header">
                <h3 className="category-title">{category.name}</h3>
                <p className="category-tagline">{getCategoryTagline(category.name)}</p>
              </div>
              
              <div className="menu-cards-grid">
                {category.items.map((item, itemIndex) => {
                  const drinkImage = resolveDrinkImage(category.name, item.name, itemIndex);
                  const drinkIcon = getDrinkIcon(category.name, item.name);
                  const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
                  const ingredientTextVi = ingredients.join(' • ');
                  const ingredientTextEn = translateIngredients(ingredients).join(' • ');
                  const description = item.description ||
                    getDescription(category.name, item.name);
                  const isYogurt = category.name.toLowerCase().includes('yogurt');
                  return (
                    <div
                      key={itemIndex}
                      className={`menu-card standard-card${isYogurt ? ' yogurt-card' : ''}`}
                    >
                      <div className="standard-card-inner">
                        <div className="standard-card-image-wrapper">
                          <img
                            src={drinkImage}
                            alt={item.name}
                            className="standard-card-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallbackIcon = e.target.nextSibling;
                              if (fallbackIcon) {
                                fallbackIcon.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="standard-card-fallback-icon" style={{ display: 'none' }}>
                            {drinkIcon}
                          </div>
                          <div className="standard-card-price-chip">
                            {formatPrice(item.price)} đ
                          </div>
                        </div>
                        <div className="standard-card-info">
                          <div className="standard-card-name">{item.name}</div>
                          {ingredients.length > 0 ? (
                            <div className="standard-card-ingredients">
                              <div className="standard-ingredients-line vi">{ingredientTextVi}</div>
                              <div className="standard-ingredients-line en">{ingredientTextEn}</div>
                            </div>
                          ) : (
                            <div className="standard-card-description">
                              {description}
                            </div>
                          )}
                          <button
                            className="menu-card-btn standard-card-btn"
                            type="button"
                            aria-label={`Thêm ${item.name} vào giỏ hàng`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item, category.name);
                            }}
                          >
                            Đặt Hàng • {formatPrice(item.price)} đ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-section-header">
            <h3 className="contact-title">Đặt Hàng Nhanh</h3>
            <p className="contact-tagline">
              Điền email và ghi chú để chúng tôi liên hệ xác nhận đơn hàng của bạn
            </p>
          </div>
          <ContactForm />
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
