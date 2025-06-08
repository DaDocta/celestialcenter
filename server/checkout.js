// server/checkout.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// **Checkout route**
router.post('/create-payment-intent', async (req, res) => {
    const { items } = req.body;

    // Calculate total amount (in cents)
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount),
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating PaymentIntent:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
