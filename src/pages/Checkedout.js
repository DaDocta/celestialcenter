import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchData from '../utils/fetchData';
import { AuthContext } from '../AuthContext';
import '../styles/Checkedout.css';

const Checkedout = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [licenses, setLicenses] = useState([]);
  const [licenseError, setLicenseError] = useState(null);
  const [cartError, setCartError] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({});
  const navigate = useNavigate();
  
  const BACKEND_URL = 'https://celestialcenter-835108787508.us-south1.run.app';

  const downloadProduct = async (productId, productName) => {
    try {
      setDownloadStatus(prev => ({ ...prev, [productId]: 'downloading' }));
      
      const response = await fetch(`${BACKEND_URL}/api/products/${productId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = productName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadStatus(prev => ({ ...prev, [productId]: 'completed' }));
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus(prev => ({ ...prev, [productId]: 'failed' }));
    }
  };

  // Update downloadAllProducts function
  const downloadAllProducts = async (products) => {
    console.log('Starting downloads for products:', products);
    
    for (const product of products) {
      try {
        console.log(`Attempting download for product ${product.productId}: ${product.name}`);
        
        // First verify product exists
        const productCheck = await fetch(`${BACKEND_URL}/api/products/${product.productId}`);
        if (!productCheck.ok) {
          throw new Error(`Product verification failed: ${productCheck.status}`);
        }
        
        setDownloadStatus(prev => ({ ...prev, [product.productId]: 'downloading' }));
        
        // Then attempt download
        const downloadResponse = await fetch(`${BACKEND_URL}/api/products/${product.productId}/download`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add if using auth
            'Accept': 'application/octet-stream'
          }
        });

        if (!downloadResponse.ok) {
          throw new Error(`Download failed with status: ${downloadResponse.status}`);
        }

        const contentType = downloadResponse.headers.get('content-type');
        console.log(`Download response type: ${contentType}`);
        
        const blob = await downloadResponse.blob();
        console.log(`Received blob size: ${blob.size} bytes`);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Get file extension from content-type or default to .zip
        const extension = contentType?.split('/')[1] || 'zip';
        a.download = `${product.name}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`Download completed for ${product.name}`);
        setDownloadStatus(prev => ({ ...prev, [product.productId]: 'completed' }));
      } catch (error) {
        console.error(`Download failed for ${product.name}:`, error);
        setDownloadStatus(prev => ({ ...prev, [product.productId]: 'failed' }));
        // Continue with next product instead of stopping
      }
      
      // Delay between downloads
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    // Modify createLicensesAndClearCart
    const createLicensesAndClearCart = async () => {
      try {
        // Get cart items
        const cartItems = await fetchData(`${BACKEND_URL}/api/cart/${user.id}`);
        console.log('Cart items:', cartItems);
        
        if (!cartItems || cartItems.length === 0) {
          setLicenseError('Your cart is empty');
          return;
        }
    
        // Create licenses
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
        console.log('Licenses created:', licenseResponse);
    
        // Fetch updated licenses
        const userLicenses = await fetchData(`${BACKEND_URL}/api/licenses/${user.id}`);
        console.log('User licenses fetched:', userLicenses);
        setLicenses(userLicenses.licenses);
    
        // Download all products
        console.log('Starting download process...');
        await downloadAllProducts(cartItems);
        console.log('All downloads completed');
    
        // Clear cart only after downloads complete
        await fetchData(`${BACKEND_URL}/api/cart/clear`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        console.log('Cart cleared successfully');
    
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
              <h2>{license.name}</h2>
              <p><strong>License Key:</strong> {license.licenseKey}</p>
              <p><strong>Uses Remaining:</strong> {license.usesRemaining}</p>
            </div>
          ))}
        </div>
      )}

      <button className="home-button" onClick={() => navigate('/')}>
        Return Home
      </button>
    </div>
  );
};

export default Checkedout;
