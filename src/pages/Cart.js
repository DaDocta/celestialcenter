import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchData from '../utils/fetchData';
import { AuthContext } from '../AuthContext';
import '../styles/Cart.css';

const Cart = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext); // Access user and logout
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login'); // Redirect unauthenticated users to login page
      return;
    }

    const fetchCart = async () => {
      try {
        const data = await fetchData(
          `https://celestialcenter-835108787508.us-south1.run.app/api/cart/${user.id}`
        );
        setCartItems(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching cart:', err);
        if (err.message.includes('401')) {
          setError('User not authorized. Please log in again.');
          logout(); // Log out the user
          navigate('/login'); // Redirect to login page
        } else {
          setError(err.message);
        }
        setCartItems([]);
      }
    };
    fetchCart();
  }, [isAuthenticated, user, logout, navigate]);

  const navigateToCheckout = () => {
    navigate('/checkout');
  };

  const handleRemoveFromCart = async (productId) => {
    if (!isAuthenticated || !user) return;

    try {
      await fetchData(
        'https://celestialcenter-835108787508.us-south1.run.app/api/cart/remove',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productId }),
        }
      );
      setCartItems(cartItems.filter((item) => item.productId !== productId));
    } catch (error) {
      console.error('Error removing item from cart:', error);
      if (error.message.includes('401')) {
        setError('User not authorized. Please log in again.');
        logout(); // Log out the user
        navigate('/login'); // Redirect to login page
      } else {
        setError('Error removing item');
      }
    }
  };

  const handleLogout = () => {
    logout(); // Log out the user
    navigate('/login'); // Redirect to login page
  };

  if (!isAuthenticated || !user) {
    // Redirect to login page
    navigate('/login');
    return null; // Return null while redirecting
  }

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>
      <button onClick={handleLogout}>Logout</button>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item) => (
              <li key={item.productId}>
                <h2>{item.name}</h2>
                <p>Quantity: {item.quantity}</p>
                <p>Price per item: ${(item.price ?? 0).toFixed(2)}</p>
                <p>Total: ${(item.price * item.quantity ?? 0).toFixed(2)}</p>
                <button
                  className="remove-item-button"
                  onClick={() => handleRemoveFromCart(item.productId)}
                >
                  Remove Item
                </button>
              </li>
            ))}
          </ul>
          <button onClick={navigateToCheckout}>Proceed to Checkout</button>
        </>
      )}
    </div>
  );
};

export default Cart;
