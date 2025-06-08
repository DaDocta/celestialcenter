// src/pages/Checkout.js
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import fetchData from '../utils/fetchData';
import { AuthContext } from '../AuthContext';
import '../styles/Checkout.css';

// Pick the correct backend URL based on mode
const BACKEND_URL =
  process.env.REACT_APP_STRIPE_MODE === 'live'
    ? process.env.REACT_APP_BACKEND_URL_LIVE
    : process.env.REACT_APP_BACKEND_URL_TEST;

// Pick the correct publishable key
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_MODE === 'live'
    ? process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY_LIVE
    : process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY_TEST
);

const CheckoutForm = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const fetchCartAndIntent = async () => {
      setIsLoading(true);
      try {
        // 1️⃣ Fetch cart
        const data = await fetchData(`${BACKEND_URL}/api/cart/${user.id}`);
        setCartItems(data);

        // 2️⃣ Create PaymentIntent
        const resp = await fetch(
          `${BACKEND_URL}/api/checkout/create-payment-intent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: data })
          }
        );

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.message || 'Server error');
        }

        const { clientSecret } = await resp.json();
        if (!clientSecret) {
          throw new Error('No clientSecret returned');
        }
        setClientSecret(clientSecret);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to set up payment. Please try again.');
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartAndIntent();
  }, [isAuthenticated, user, navigate]);

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system is not ready. Please try later.');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card element not found');

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: user.name,
            email: user.email
          }
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        navigate('/checkedout');
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment error. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      {isLoading ? (
        <p>Loading…</p>
      ) : cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <form onSubmit={handlePayment}>
          <ul className="cart-items">
            {cartItems.map((item) => (
              <li key={item.productId}>
                <h2>{item.name}</h2>
                <p>Quantity: {item.quantity}</p>
                <p>Total: ${(item.price * item.quantity).toFixed(2)}</p>
              </li>
            ))}
          </ul>
          <div className="card-element">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' }
                  },
                  invalid: { color: '#9e2146' }
                }
              }}
            />
          </div>
          <button type="submit" disabled={!stripe || isProcessingPayment}>
            {isProcessingPayment ? 'Processing…' : 'Pay Now'}
          </button>
        </form>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

const Checkout = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default Checkout;
