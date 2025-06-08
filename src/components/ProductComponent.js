// src/components/ProductComponent.js
import React from 'react';
import '../styles/ProductComponent.css';

const ProductComponent = ({ product, onBackClick }) => {
  return (
    <div className="product">
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <button onClick={onBackClick}>Go Back</button>
    </div>
  );
};

export default ProductComponent;
