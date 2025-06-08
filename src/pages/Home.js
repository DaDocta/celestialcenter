// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import Star from '../components/Star';
import Navbar from '../components/Navbar';
import products from '../data/products';

const Home = () => {
  const navigate = useNavigate();
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStarClick = (id) => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="home-content">
      <Navbar />
      <p>Welcome to Celestial Center</p>
      {!isPortrait && (
        <div className="stars-container">
          {products.map((product) => (
            <Star key={product.id} onClick={() => handleStarClick(product.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
