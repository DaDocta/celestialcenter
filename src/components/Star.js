// src/components/Star.js
import React from 'react';
import '../styles/Star.css';

const Star = ({ onClick }) => {
  return (
    <img
      src={require('../assets/star.png')}
      alt="Star"
      className="star"
      onClick={onClick}
      style={{
        position: 'absolute',
        top: `${Math.random() * 80 + 10}%`, // Random top position
        left: `${Math.random() * 80 + 10}%`, // Random left position
      }}
    />
  );
};

export default Star;
