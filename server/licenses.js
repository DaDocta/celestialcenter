// server/licenses.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');
const router = express.Router();

const storage = new Storage();
const bucketName = 'celestialcenter';
const filePath   = 'json/licenses.json';

async function ensureFile() {
  const file = storage.bucket(bucketName).file(filePath);
  const [exists] = await file.exists();
  if (!exists) {
    await file.save(JSON.stringify({ licenses: [] }, null, 2));
  }
}

async function readLicenses() {
  await ensureFile();
  const data = (await storage.bucket(bucketName).file(filePath).download())[0];
  return JSON.parse(data);
}

async function writeLicenses(data) {
  await storage.bucket(bucketName).file(filePath)
    .save(JSON.stringify(data, null, 2));
}

function genKey() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

router.post('/', async (req, res) => {
  const { userId, products } = req.body;
  if (!userId || !Array.isArray(products) || !products.length) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  try {
    const data = await readLicenses();
    data.licenses = Array.isArray(data.licenses) ? data.licenses : [];
    const ts = new Date().toISOString();

    const existing = data.licenses.filter(l => l.userId === userId);
    const toAdd = products
      .filter(p => !existing.some(e => e.productId === p.id))
      .map(p => ({
        licenseKey: genKey(),
        userId,
        productId: p.id,
        name: p.name,
        quantity: p.quantity,
        usesRemaining: p.quantity,
        created: ts,
        status: 'active'
      }));
    if (toAdd.length) {
      data.licenses.push(...toAdd);
      await writeLicenses(data);
    }
    res.status(201).json({ message: 'Licenses created', licenses: toAdd });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const data = await readLicenses();
    const list = data.licenses.filter(
      l => l.userId === req.params.userId && l.status === 'active'
    );
    res.json({ licenses: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
