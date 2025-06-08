import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import fetchData from '../utils/fetchData';
import { AuthContext } from '../AuthContext';
import '../styles/Checkout.css';

const BACKEND_URL = 'https://celestialcenter-835108787508.us-south1.run.app';
const STRIPE_PUBLISHABLE_KEY_TEST = 'pk_test_51N9va6BN4zP2cNNUC13AU2YRhukbIX01xUKoggNBsdxpbyR1KJKGL5AbcUwgBaAN2iofOpxn8S1gUO8uyZm2hBNH00Heo0LJxF';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY_TEST);

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

        const fetchCartAndPaymentIntent = async () => {
            setIsLoading(true);
            try {
                const data = await fetchData(`${BACKEND_URL}/api/cart/${user.id}`);
                setCartItems(data);

                const response = await fetch(`${BACKEND_URL}/api/checkout/create-payment-intent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: data }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Server error');
                }

                const paymentIntent = await response.json();

                if (!paymentIntent.clientSecret) {
                    throw new Error('PaymentIntent clientSecret not returned');
                }

                setClientSecret(paymentIntent.clientSecret);
                setError(null);
            } catch (err) {
                console.error('Error fetching cart or creating PaymentIntent:', err);
                setError('Failed to load cart or payment setup. Please try again.');
                setCartItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartAndPaymentIntent();
    }, [isAuthenticated, user, navigate]);

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            console.error('Stripe or Elements not loaded, or PaymentIntent not set up.');
            setError('Payment system is not ready. Please try again later.');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        setIsProcessingPayment(true);

        try {
            const cardElement = elements.getElement(CardElement);

            if (!cardElement) {
                console.error('CardElement not found or not mounted.');
                throw new Error('CardElement not found');
            }

            console.log('CardElement is mounted:', cardElement);

            const paymentResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: user.name,
                        email: user.email,
                    },
                },
            });

            if (paymentResult.error) {
                console.error('Stripe payment failed:', paymentResult.error.message);
                setError(paymentResult.error.message);
            } else if (paymentResult.paymentIntent.status === 'succeeded') {
                console.log('Payment successful');
                navigate('/checkedout');
            } else {
                console.error('Unexpected payment status:', paymentResult.paymentIntent.status);
                setError('Payment failed. Please try again.');
            }
        } catch (err) {
            console.error('Payment failed:', err);
            setError('Failed to process payment. Please try again.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    return (
        <div className="checkout-container">
            <h1>Checkout</h1>
            {isLoading ? (
                <p>Loading...</p>
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
                                        '::placeholder': {
                                            color: '#aab7c4',
                                        },
                                    },
                                    invalid: {
                                        color: '#9e2146',
                                    },
                                },
                            }}
                        />
                    </div>
                    <button type="submit" disabled={!stripe || isProcessingPayment}>
                        {isProcessingPayment ? 'Processing...' : 'Pay Now'}
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
