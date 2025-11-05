import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Home from './components/Home';
import Booking from './components/Booking';
import './App.css';
import './performance.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;

