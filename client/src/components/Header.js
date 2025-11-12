import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Cart from './Cart';
import './Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems, showCart, setShowCart } = useCart();
  const totalItems = getTotalItems();

  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMenuClick = (event) => {
    event.preventDefault();

    if (location.pathname === '/') {
      scrollToMenu();
      return;
    }

    navigate('/');

    setTimeout(scrollToMenu, 120);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <div className="logo-badge">
            <img src="/images/logo.png" alt="Lolibub Logo" className="logo-image" />
          </div>
          <div>
            <h1>Lolibub</h1>
            <p>Healthy Drinks</p>
          </div>
        </div>
        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={handleMenuClick}
          >
            Menu
          </Link>
          <div className="cart-toggle" onClick={() => setShowCart(!showCart)}>
            <span className="cart-icon">🛒</span>
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
            <span className="cart-text">Giỏ Hàng</span>
          </div>
        </nav>
      </div>
      {showCart && <Cart />}
    </header>
  );
}

export default Header;
