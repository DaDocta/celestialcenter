// src/pages/Product.js
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import fetchData from '../utils/fetchData';
import { AuthContext } from '../AuthContext';
import '../styles/Product.css';

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext); // Access user from AuthContext
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await fetchData('https://celestialcenter-835108787508.us-south1.run.app/server/products');
        setProducts(data);
        setError(null);

        if (id !== undefined) {
          const foundProduct = data.find((p) => p.id === parseInt(id, 10));
          setProduct(foundProduct);
        }
      } catch (err) {
        setError(err.message);
        setProducts([]);
        setProduct(null);
      }
    };

    fetchProducts();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login'); // Redirect to login page
      return;
    }


    const cartData = {
      userId: user.id || user.userId, // Adjust based on your user object
      productId: product.id,
      quantity: 1,
      name: product.name,
      price: product.price,
    };

    console.log('Adding to cart with data:', cartData);
    console.log('User object:', user);
    console.log('Product object:', product);

    if (product.price === undefined) {
      console.error('Product price is undefined.');
      setCartMessage('Error: Product price is missing.');
      return;
    }

    try {
      await fetchData('https://celestialcenter-835108787508.us-south1.run.app/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData),
      });
      setCartMessage('Product added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.message.includes('401')) {
        setCartMessage('User not authorized. Please log in again.');
      } else {
        setCartMessage('Error adding to cart');
      }
    }
  };

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  if (id === undefined) {
    return (
      <div className="product-list">
        <h1>Products</h1>
        <ul>
          {products.map((product) => (
            <li key={product.id} onClick={() => navigate(`/product/${product.id}`)}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-detail">
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
      {cartMessage && <p>{cartMessage}</p>}
      <button onClick={() => navigate('/products')}>Back to Products</button>
    </div>
  );
};

export default Product;
