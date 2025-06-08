// server/index.js
const express = require('express');
const cors    = require('cors');

const cartRoutes     = require('./cart');
const checkoutRoutes = require('./checkout');
const licenseRoutes  = require('./licenses');
const productRoutes  = require('./products');
const userRoutes     = require('./users');

const app = express();

// ✅ CORS: allow prod site & local dev
app.use(cors({
  origin: [
    'https://store.garrettstrange.com',
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

app.use(express.json());

// 📦 API endpoints
app.use('/api/cart',     cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users',    userRoutes);

// 🚀 listen on Cloud Run port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
