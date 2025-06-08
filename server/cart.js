// server/cart.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

// Cloud Storage setup
const storage = new Storage();
const bucketName = 'celestialcenter';
const cartFilePath = 'json/cart.json';
const usersFilePath = 'json/users.json';

async function ensureFileExists(path, defaultData) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) {
    await file.save(JSON.stringify(defaultData, null, 2));
  }
}

async function readJSONFile(path, defaultData) {
  await ensureFileExists(path, defaultData);
  const data = (await storage.bucket(bucketName).file(path).download())[0];
  return JSON.parse(data || JSON.stringify(defaultData));
}

async function writeJSONFile(path, data) {
  await storage.bucket(bucketName).file(path)
    .save(JSON.stringify(data, null, 2));
}

// Add to cart
router.post('/add', async (req, res) => {
  const { userId, productId, quantity, name, price } = req.body;
  if (!userId || !productId || !quantity || !name || !price) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const users = await readJSONFile(usersFilePath, []);
    if (!users.some(u => u.id === userId)) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    const cartData = await readJSONFile(cartFilePath, {});
    cartData[userId] = cartData[userId] || [];
    const item = cartData[userId].find(i => i.productId === productId);
    if (item) item.quantity += quantity;
    else cartData[userId].push({ productId, quantity, name, price });
    await writeJSONFile(cartFilePath, cartData);
    res.status(200).json({ message: 'Product added', cart: cartData[userId] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get cart
router.get('/:userId', async (req, res) => {
  const uid = parseInt(req.params.userId, 10);
  try {
    const users = await readJSONFile(usersFilePath, []);
    if (!users.some(u => u.id === uid)) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    const cartData = await readJSONFile(cartFilePath, {});
    res.status(200).json(cartData[uid] || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove item
router.delete('/remove', async (req, res) => {
  const { userId, productId } = req.body;
  if (!userId || !productId) {
    return res.status(400).json({ message: 'Missing userId or productId' });
  }
  try {
    const users = await readJSONFile(usersFilePath, []);
    if (!users.some(u => u.id === userId)) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    const cartData = await readJSONFile(cartFilePath, {});
    cartData[userId] = (cartData[userId] || [])
      .filter(i => i.productId !== productId);
    await writeJSONFile(cartFilePath, cartData);
    res.status(200).json({ message: 'Removed', cart: cartData[userId] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear cart
router.delete('/clear', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });
  try {
    const users = await readJSONFile(usersFilePath, []);
    if (!users.some(u => u.id === userId)) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    const cartData = await readJSONFile(cartFilePath, {});
    cartData[userId] = [];
    await writeJSONFile(cartFilePath, cartData);
    res.status(200).json({ message: 'Cleared', cart: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
