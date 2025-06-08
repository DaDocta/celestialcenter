// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';
import { FaHome, FaAt, FaShoppingBag, FaRocket } from 'react-icons/fa'; // Import icons

const Navbar = () => {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link to="/">
            {isPortrait ? <FaHome /> : 'Home'}
          </Link>
        </li>
        <li>
          <a href="https://garrettstrange.com" target="_blank" rel="noopener noreferrer">
            {isPortrait ? <FaAt /> : 'About'}
          </a>
        </li>
        <li>
          <Link to="/products">
            {isPortrait ? <FaShoppingBag /> : 'Products'}
          </Link>
        </li>
        <li>
          <Link to="/cart">
            {isPortrait ? <FaRocket /> : 'Cart'}
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
