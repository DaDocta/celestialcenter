// server/index.js
const express = require('express');
const cors = require('cors');

const cartRoutes = require('./cart');
const checkoutRoutes = require('./checkout');
const licenseRoutes = require('./licenses');
const productRoutes = require('./products');
const userRoutes = require('./users');

const app = express();

// ✅ CORS: Allow only your frontend domain
app.use(cors({
  origin: 'https://store.garrettstrange.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// 📦 API Routes
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// 🚀 Start the server on Cloud Run's required port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
