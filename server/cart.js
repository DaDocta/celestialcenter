// api/cart.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

// Google Cloud Storage configuration
const storage = new Storage();
const bucketName = 'celestialcenter';
const cartFilePath = 'json/cart.json';
const usersFilePath = 'json/users.json';

// Ensure file exists in the bucket
async function ensureFileExists(filePath, defaultData) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  const [exists] = await file.exists();
  if (!exists) {
    await file.save(JSON.stringify(defaultData, null, 2));
    console.log(`Initialized ${filePath} with default data.`);
  }
}

// Utility function to read JSON file from the bucket
async function readJSONFile(filePath, defaultData) {
  try {
    await ensureFileExists(filePath, defaultData);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const data = (await file.download())[0];
    return JSON.parse(data || JSON.stringify(defaultData));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    throw new Error(`Failed to fetch data from ${filePath}`);
  }
}

// Utility function to write JSON data to the bucket
async function writeJSONFile(filePath, data) {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    await file.save(JSON.stringify(data, null, 2));
    console.log(`${filePath} successfully updated.`);
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err.message);
    throw new Error(`Failed to save data to ${filePath}`);
  }
}

// Add a product to the user's cart
router.post('/add', async (req, res) => {
  const { userId, productId, quantity, name, price } = req.body;

  if (!userId || !productId || !quantity || !name || !price) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const users = await readJSONFile(usersFilePath, []);
    const userExists = users.some(user => user.id === userId);
    if (!userExists) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const cartData = await readJSONFile(cartFilePath, {});
    if (!cartData[userId]) cartData[userId] = [];

    const userCart = cartData[userId];
    const existingItem = userCart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      userCart.push({ productId, quantity, name, price });
    }

    await writeJSONFile(cartFilePath, cartData);
    res.status(200).json({ message: 'Product added to cart', cart: userCart });
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get the user's cart
router.get('/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  try {
    const users = await readJSONFile(usersFilePath, []);
    const userExists = users.some(user => user.id === userId);
    if (!userExists) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const cartData = await readJSONFile(cartFilePath, {});
    const userCart = cartData[userId] || [];
    res.status(200).json(userCart);
  } catch (err) {
    console.error('Error fetching cart:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove a product from the user's cart
router.delete('/remove', async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'Missing userId or productId' });
  }

  try {
    const users = await readJSONFile(usersFilePath, []);
    const userExists = users.some(user => user.id === userId);
    if (!userExists) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const cartData = await readJSONFile(cartFilePath, {});
    if (!cartData[userId]) {
      return res.status(404).json({ message: 'Cart not found for user' });
    }

    cartData[userId] = cartData[userId].filter(item => item.productId !== productId);
    await writeJSONFile(cartFilePath, cartData);

    res.status(200).json({ message: 'Product removed from cart', cart: cartData[userId] });
  } catch (err) {
    console.error('Error removing product from cart:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear the user's cart
router.delete('/clear', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const users = await readJSONFile(usersFilePath, []);
    const userExists = users.some(user => user.id === userId);
    if (!userExists) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const cartData = await readJSONFile(cartFilePath, {});
    if (cartData[userId]) {
      cartData[userId] = [];
    }

    await writeJSONFile(cartFilePath, cartData);
    res.status(200).json({ message: 'Cart cleared', cart: cartData[userId] });
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
