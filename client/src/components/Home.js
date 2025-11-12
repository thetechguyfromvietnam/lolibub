import React, { useState, useEffect, useMemo, useRef } from 'react';
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
const getDescription = () => '';

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

const HERO_HIGHLIGHTS = [
  {
    icon: '🍃',
    title: 'Trọn vị trái cây tươi',
    description: 'Ép lạnh giữ nguyên dưỡng chất & không pha loãng'
  },
  {
    icon: '🥭',
    title: 'Nguyên liệu chọn lọc',
    description: 'Trái cây theo mùa từ Đà Lạt, miền Tây & vườn hữu cơ'
  },
  {
    icon: '⚡',
    title: 'Giao trong 30 phút',
    description: 'Đóng chai lạnh an toàn, giao tận tay vẫn tươi mát'
  }
];

const BRAND_PILLARS = [
  {
    icon: '🧊',
    title: 'Giữ lạnh chuẩn Spa',
    description: 'Công nghệ ép chậm & bảo quản 4-6°C giúp hương vị luôn trọn vẹn'
  },
  {
    icon: '🛵',
    title: 'Giao nhanh nội thành',
    description: 'Đội ngũ giao hàng chuyên nước lạnh, đảm bảo không tan đá'
  },
  {
    icon: '💚',
    title: 'Không chất bảo quản',
    description: 'Ngọt thanh từ trái cây & mật ong, nói không với syrup công nghiệp'
  }
];

const getFlavorProfile = () => '';

const buildCardTags = () => [];

function Home() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const menuSectionRef = useRef(null);
  
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

  const categoriesWithItems = useMemo(() => {
    if (!menuData?.categories) {
      return [];
    }

    return menuData.categories.filter((cat) => Array.isArray(cat.items) && cat.items.length > 0);
  }, [menuData]);

  const bestSellers = useMemo(() => {
    if (!menuData?.categories) {
      return [];
    }

    const picks = [];

    menuData.categories.forEach((category) => {
      category.items.slice(0, 3).forEach((item, itemIndex) => {
        picks.push({
          ...item,
          categoryName: category.name,
          ingredientList: Array.isArray(item.ingredients) ? item.ingredients : [],
          image: resolveDrinkImage(category.name, item.name, itemIndex)
        });
      });
    });

    return picks.slice(0, 4);
  }, [menuData]);

  const menuStats = useMemo(() => {
    const totalItems = categoriesWithItems.reduce((acc, cat) => acc + cat.items.length, 0);
    return {
      totalItems,
      totalCategories: categoriesWithItems.length,
      heroSignature: bestSellers[0]?.name || null
    };
  }, [categoriesWithItems, bestSellers]);

  const scrollToMenu = () => {
    if (menuSectionRef.current) {
      menuSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">Fresh & Balanced Lifestyle</span>
            <h2 className="hero-title">Lolibub - Nước Uống Tốt Cho Sức Khỏe Mỗi Ngày</h2>
            <p className="hero-subtitle">
              Chai nước ép lạnh ép từ trái cây tươi nguyên, không pha loãng, giao tận tay trong 30 phút.
              Tặng thêm năng lượng xanh cho ngày mới của bạn.
            </p>
            <div className="hero-cta-group">
              <button
                className="btn btn-primary hero-cta"
                type="button"
                onClick={scrollToMenu}
              >
                Đặt hàng ngay
              </button>
              <button
                className="hero-cta-secondary"
                type="button"
                onClick={scrollToMenu}
              >
                Khám phá menu
              </button>
            </div>
            <div className="hero-highlights">
              {HERO_HIGHLIGHTS.map((highlight) => (
                <div key={highlight.title} className="hero-highlight">
                  <div className="hero-highlight-icon">{highlight.icon}</div>
                  <div className="hero-highlight-text">
                    <div className="hero-highlight-title">{highlight.title}</div>
                    <div className="hero-highlight-description">{highlight.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-media-wrapper">
            <div className="hero-media">
              <div className="hero-media-slider">
                {heroBackgrounds.map((image, index) => (
                  <div
                    key={image}
                    className={`hero-media-slide ${index === currentHeroIndex ? 'active' : ''}`}
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                ))}
              </div>
              <div className="hero-slider-indicators">
                {heroBackgrounds.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`hero-slider-dot ${index === currentHeroIndex ? 'active' : ''}`}
                    aria-label={`Xem ảnh số ${index + 1}`}
                    onClick={() => setCurrentHeroIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-story">
        <div className="container brand-story-inner">
          <div className="brand-story-copy">
            <span className="section-eyebrow">Câu chuyện Lolibub</span>
            <h3>Chúng tôi ép lạnh để giữ trọn vị tươi</h3>
            <p>
              Mỗi sáng, đội ngũ Lolibub chọn lọc trái cây theo mùa, xử lý dịu nhẹ để giữ trọn dưỡng chất,
              sau đó làm lạnh nhanh và giao tận tay bạn. Mục tiêu của chúng tôi là trở thành thói quen chăm
              sóc sức khỏe nhẹ nhàng nhưng cực kỳ ngon miệng.
            </p>
            <div className="brand-story-metrics">
              <div>
                <strong>{menuStats.totalCategories}</strong>
                <span>nhóm đồ uống đa dạng</span>
              </div>
              <div>
                <strong>{menuStats.totalItems}</strong>
                <span>công thức pha chế độc quyền</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>điểm hài lòng từ khách hàng</span>
              </div>
            </div>
          </div>
          <div className="brand-story-grid">
            {BRAND_PILLARS.map((pillar) => (
              <div key={pillar.title} className="brand-story-card">
                <div className="brand-story-icon">{pillar.icon}</div>
                <div className="brand-story-title">{pillar.title}</div>
                <p>{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="best-sellers" id="signature">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Signature Drinks</span>
              <h3>Top món được đặt nhiều nhất tuần này</h3>
              <p>
                Gợi ý những chai nước Lolibub gây thương nhớ. Hãy bắt đầu bằng một trong các món best seller,
                bạn sẽ hiểu vì sao khách hàng quay lại mỗi tuần.
              </p>
            </div>
            <div className="best-sellers-grid">
              {bestSellers.map((item, index) => {
                const tags = buildCardTags(item.categoryName, item.ingredientList);
                return (
                  <div key={`${item.name}-${index}`} className="best-seller-card">
                    <div className="best-seller-rank">#{index + 1}</div>
                    <div className="best-seller-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="best-seller-info">
                      <div className="best-seller-name">{item.name}</div>
                      <div className="best-seller-category">{item.categoryName}</div>
                      {Boolean(item.description || getFlavorProfile(item.categoryName, item.ingredientList)) && (
                        <div className="best-seller-description">
                          {item.description || getFlavorProfile(item.categoryName, item.ingredientList)}
                        </div>
                      )}
                      {tags.length > 0 && (
                        <div className="best-seller-tags">
                          {tags.map((tag) => (
                            <span key={tag} className="best-seller-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="best-seller-footer">
                        <span className="best-seller-price">{formatPrice(item.price)} đ</span>
                        <button
                          type="button"
                          className="best-seller-btn"
                          onClick={() => handleAddToCart(item, item.categoryName)}
                        >
                          Thêm ngay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="menu-section">
        <div className="container" ref={menuSectionRef} id="menu">
          <div className="menu-intro">
            <div className="menu-intro-text">
              <span className="section-eyebrow">Menu Lolibub</span>
              <h3>Chọn vị bạn yêu thích & đặt giao ngay</h3>
              <p>
                Từ nước ép detox, trà trái cây, yogurt tới cà phê rang mới. Mỗi món đều được thử nghiệm
                nhiều lần để cân bằng dưỡng chất và hương vị sảng khoái.
              </p>
            </div>
            <div className="menu-metrics">
              <div>
                <strong>{menuStats.totalItems}</strong>
                <span>công thức đang phục vụ</span>
              </div>
              <div>
                <strong>{menuStats.totalCategories}</strong>
                <span>phân khúc nước uống</span>
              </div>
              {menuStats.heroSignature && (
                <div>
                  <strong>{menuStats.heroSignature}</strong>
                  <span>được đặt nhiều nhất hôm nay</span>
                </div>
              )}
            </div>
          </div>

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
                  const flavorProfile = getFlavorProfile(category.name, ingredients);
                  const tags = buildCardTags(category.name, ingredients);
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
                          {ingredients.length > 0 && (
                            <div className="standard-card-ingredients">
                              <div className="standard-ingredients-line vi">{ingredientTextVi}</div>
                              <div className="standard-ingredients-line en">{ingredientTextEn}</div>
                            </div>
                          )}
                          {Boolean(description) && (
                            <div className="standard-card-description">
                              {description}
                            </div>
                          )}
                          {Boolean(flavorProfile) && (
                            <div className="standard-card-highlight">
                              {flavorProfile}
                            </div>
                          )}
                          {tags.length > 0 && (
                            <div className="standard-card-tags">
                              {tags.map((tag) => (
                                <span key={tag} className="standard-card-tag">{tag}</span>
                              ))}
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
