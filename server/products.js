// server/products.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');
const path   = require('path');
const mime   = require('mime-types');
const router = express.Router();

const storage = new Storage();
const bucketName = 'celestialcenter';
const productsJson = 'products.json';

async function findFile(name) {
  const [files] = await storage.bucket(bucketName).getFiles({ prefix: '' });
  const file = files.find(f => f.name.endsWith(name));
  if (!file) throw new Error(`File not found: ${name}`);
  return file.name;
}

async function readJson(name) {
  const file = storage.bucket(bucketName).file(name);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`Missing file: ${name}`);
  const data = (await file.download())[0];
  return JSON.parse(data);
}

// List products
router.get('/', async (req, res) => {
  try {
    const filePath = await findFile(productsJson);
    const items = await readJson(filePath);
    const sanitized = items.map(({ id, name, description, price }) =>
      ({ id, name, description, price }));
    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const filePath = await findFile(productsJson);
    const items = await readJson(filePath);
    const prod = items.find(p => p.id === +req.params.id);
    if (!prod) return res.status(404).json({ message: 'Not found' });
    res.json({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: prod.price
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Download product file
router.get('/:id/download', async (req, res) => {
  try {
    const filePath = await findFile(productsJson);
    const items = await readJson(filePath);
    const prod = items.find(p => p.id === +req.params.id);
    if (!prod) return res.status(404).json({ message: 'Not found' });

    const objPath = prod.path.replace(/^\//, '');
    const file = storage.bucket(bucketName).file(objPath);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ message: 'File missing' });

    const meta = await file.getMetadata();
    res.setHeader('Content-Type', meta[0].contentType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${path.basename(objPath)}"`
    );
    file.createReadStream().pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

module.exports = router;
