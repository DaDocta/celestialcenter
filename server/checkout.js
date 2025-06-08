// server/checkout.js
const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  const { items } = req.body;
  const total = items
    .reduce((sum, i) => sum + i.price * i.quantity, 0) * 100;
  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(total),
      currency: 'usd',
      automatic_payment_methods: { enabled: true }
    });
    res.status(200).json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
