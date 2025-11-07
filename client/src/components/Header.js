import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Cart from './Cart';
import './Header.css';

function Header() {
  const location = useLocation();
  const { getTotalItems, showCart, setShowCart } = useCart();
  const totalItems = getTotalItems();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <div className="logo-badge">
            <img src="/images/logo.png" alt="Loli Bub Logo" className="logo-image" />
          </div>
          <div>
            <h1>Loli Bub</h1>
            <p>Healthy Drinks</p>
          </div>
        </div>
        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
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
