import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { getMenu } from '../services/api';
import './Home.css';
import { resolveDrinkImage, heroBackgrounds } from '../utils/imageAssets';
import { translateCategoryName } from '../utils/translations';
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
    return 'Fragrant and naturally brewed fruit tea';
  }
  if (normalized.includes('cafe')) {
    return 'Bold and aromatic coffee selections';
  }
  if (normalized.includes('trà sữa')) {
    return 'Silky milk tea brewed to perfection';
  }
  return 'Fresh, energising beverages for every mood';
};

const HERO_HIGHLIGHTS = [
  {
    icon: '🍃',
    title: 'Pure cold-pressed fruit',
    description: 'Cold-pressed to lock in nutrients with zero dilution'
  },
  {
    icon: '🥭',
    title: 'Handpicked ingredients',
    description: 'Seasonal produce from Da Lat, the Mekong Delta, and organic farms'
  },
  {
    icon: '⚡',
    title: 'Delivered within 30 minutes',
    description: 'Chilled bottles arrive fresh and vibrant right to your door'
  }
];

const BRAND_PILLARS = [
  {
    icon: '🧊',
    title: 'Spa-grade chilling',
    description: 'Cold-pressed and stored at 4-6°C to preserve full flavour'
  },
  {
    icon: '🛵',
    title: 'Citywide fast delivery',
    description: 'Dedicated chilled-delivery team keeps every bottle frosty'
  },
  {
    icon: '💚',
    title: 'No preservatives',
    description: 'Naturally sweet from fruit and honey—no artificial syrups'
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
      setError('Unable to load the menu. Please try again later.');
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
        <div className="loading">Loading menu...</div>
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
            <h2 className="hero-title">Lolibub — Wellness Drinks for Every Day</h2>
            <p className="hero-subtitle">
              Cold-pressed juices made from whole fresh fruit, never diluted, delivered in under 30 minutes.
              Give your day a clean boost of green energy.
            </p>
            <div className="hero-cta-group">
              <button
                className="btn btn-primary hero-cta"
                type="button"
                onClick={scrollToMenu}
              >
                Order Now
              </button>
              <button
                className="hero-cta-secondary"
                type="button"
                onClick={scrollToMenu}
              >
                Browse the Menu
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
                    aria-label={`View slide ${index + 1}`}
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
            <span className="section-eyebrow">The Lolibub Story</span>
            <h3>We cold-press to preserve fresh flavour</h3>
            <p>
              Every morning the Lolibub team handpicks seasonal fruit, prepares it gently to retain nutrients,
              then quick-chills each bottle before delivering it straight to you. We exist to make daily self-care
              effortless, refreshing, and genuinely delicious.
            </p>
            <div className="brand-story-metrics">
              <div>
                <strong>{menuStats.totalCategories}</strong>
                <span>distinct drink categories</span>
              </div>
              <div>
                <strong>{menuStats.totalItems}</strong>
                <span>signature recipes crafted in-house</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>customer satisfaction score</span>
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
              <h3>Most-loved sips this week</h3>
              <p>
                Meet the Lolibub bottles customers can’t stop reordering. Start with one of these crowd favourites
                and you’ll see why guests come back every week.
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
                      <div className="best-seller-category">{translateCategoryName(item.categoryName)}</div>
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
                          Add to Cart
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
              <span className="section-eyebrow">Lolibub Menu</span>
              <h3>Choose your favourite flavour & get it delivered</h3>
              <p>
                From detox cold-pressed juices and fruit teas to yogurt bowls and freshly roasted coffee.
                Every recipe is tested repeatedly to balance nutrients with a bright, feel-good taste.
              </p>
            </div>
            <div className="menu-metrics">
              <div>
                <strong>{menuStats.totalItems}</strong>
                <span>recipes currently on the menu</span>
              </div>
              <div>
                <strong>{menuStats.totalCategories}</strong>
                <span>beverage categories</span>
              </div>
              {menuStats.heroSignature && (
                <div>
                  <strong>{menuStats.heroSignature}</strong>
                  <span>today’s most-ordered drink</span>
                </div>
              )}
            </div>
          </div>

          {categoriesWithItems.map((category, catIndex) => (
            <div key={catIndex} className="category-section">
              <div className="category-header">
                <h3 className="category-title">{translateCategoryName(category.name)}</h3>
                <p className="category-tagline">{getCategoryTagline(category.name)}</p>
              </div>
              
              <div className="menu-cards-grid">
                {category.items.map((item, itemIndex) => {
                  const drinkImage = resolveDrinkImage(category.name, item.name, itemIndex);
                  const drinkIcon = getDrinkIcon(category.name, item.name);
                  const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
                  const ingredientTextOriginal = ingredients.join(' • ');
                  const ingredientTextEnglish = translateIngredients(ingredients).join(' • ');
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
                              <div className="standard-ingredients-line">{ingredientTextEnglish}</div>
                              {ingredientTextOriginal && ingredientTextOriginal !== ingredientTextEnglish && (
                                <div className="standard-ingredients-line en">{ingredientTextOriginal}</div>
                              )}
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
                            aria-label={`Add ${item.name} to cart`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item, category.name);
                            }}
                          >
                            Order Now • {formatPrice(item.price)} đ
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
            <h3 className="contact-title">Quick Order</h3>
            <p className="contact-tagline">
              Leave your email and note so we can confirm your order right away
            </p>
          </div>
          <ContactForm />
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

export default Home;
