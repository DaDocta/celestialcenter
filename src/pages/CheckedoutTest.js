import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import fetchData from '../utils/fetchData';
import { AuthContext } from '../AuthContext';

const Checkedout = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [licenses, setLicenses] = useState([]);
  const [licenseError, setLicenseError] = useState(null);
  const [cartError, setCartError] = useState(null);
  const navigate = useNavigate();
  
  const BACKEND_URL = 'https://celestialcentral-835108787508.us-central1.run.app';

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const createLicensesAndClearCart = async () => {
      try {
        // 1. Fetch cart items first
        const cartItems = await fetchData(`${BACKEND_URL}/api/cart/${user.id}`);
        
        if (!cartItems || cartItems.length === 0) {
          setLicenseError('Your cart is empty');
          return;
        }

        // 2. Create licenses for cart items
        const licenseResponse = await fetchData(`${BACKEND_URL}/api/licenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            products: cartItems.map(item => ({
              id: item.productId,
              name: item.name,
              quantity: item.quantity
            }))
          })
        });

        // 3. Fetch user's licenses
        const userLicenses = await fetchData(`${BACKEND_URL}/api/licenses/${user.id}`);
        setLicenses(userLicenses.licenses);

        // 4. Clear the cart
        await fetchData(`${BACKEND_URL}/api/cart/clear`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });

        setLicenseError(null);
        setCartError(null);

      } catch (error) {
        console.error('Checkout process error:', error);
        setLicenseError('Failed to process checkout. Please contact support.');
      }
    };

    createLicensesAndClearCart();
  }, [isAuthenticated, user, navigate, BACKEND_URL]);

  return (
    <div className="checkedout-container">
      <h1>Thank you for your purchase!</h1>

      {licenseError ? (
        <div className="error-message">{licenseError}</div>
      ) : (
        <div className="licenses-container">
          {licenses.map(license => (
            <div key={license.licenseKey} className="license-card">
              <h2>License Details</h2>
              <p><strong>License Key:</strong> {license.licenseKey}</p>
              <p><strong>Product:</strong> {license.name}</p>
              <p><strong>Uses Remaining:</strong> {license.usesRemaining}</p>
              <p><strong>Status:</strong> {license.status}</p>
            </div>
          ))}
        </div>
      )}

      {cartError && <div className="error-message">{cartError}</div>}

      <button 
        className="home-button"
        onClick={() => navigate('/')}
      >
        Return Home
      </button>
    </div>
  );
};

export default Checkedout;
