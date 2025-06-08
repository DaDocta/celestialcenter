const express = require('express');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const mime = require('mime-types');
const router = express.Router();

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = 'celestialcenter';
const fileName = 'products.json';

// Utility function to find file path in the bucket
const findFilePathInBucket = async (bucketName, fileName, prefix = '') => {
  try {
    console.log(`Searching for file '${fileName}' in bucket '${bucketName}'...`);
    const bucket = storage.bucket(bucketName);

    // Use the prefix to narrow the search
    const [files] = await bucket.getFiles({ prefix });

    const file = files.find(f => f.name.endsWith(fileName));
    if (!file) {
      console.error(`File '${fileName}' not found in bucket '${bucketName}'`);
      return null;
    }

    console.log(`File '${fileName}' found: ${file.name}`); // Logs the full file path
    return file.name; // Return the full file path
  } catch (error) {
    console.error('Error searching for file in bucket:', error.message);
    throw error;
  }
};


// Utility function to read JSON files from Google Cloud Storage
const readJSONFileFromBucket = async (bucketName, filePath) => {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.error(`File does not exist: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`File found: ${filePath}. Downloading...`);
    const contents = (await file.download())[0];
    console.log(`File downloaded successfully: ${filePath}`);
    return JSON.parse(contents);
  } catch (error) {
    console.error(`Error reading file from bucket: ${error.message}`);
    throw error;
  }
};

// GET /api/products - List all products
router.get('/', async (req, res) => {
  try {
    const filePath = await findFilePathInBucket(bucketName, fileName);
    const products = await readJSONFileFromBucket(bucketName, filePath);

    // Remove sensitive path info from response
    const sanitizedProducts = products.map(({ id, name, description, price }) => ({
      id, name, description, price
    }));

    res.status(200).json(sanitizedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/products/:id - Get product details
router.get('/:id', async (req, res) => {
  try {
    // Find the file path dynamically
    const filePath = await findFilePathInBucket(bucketName, fileName);
    if (!filePath) {
      return res.status(404).json({ message: 'Products file not found in bucket' });
    }

    const productId = parseInt(req.params.id, 10);
    const products = await readJSONFileFromBucket(bucketName, filePath);

    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    console.log(`Request received to download product with ID: ${productId}`);

    // Fetch products.json from the bucket
    const filePath = await findFilePathInBucket(bucketName, fileName);
    if (!filePath) {
      return res.status(404).json({ message: 'Products file not found in bucket' });
    }

    const products = await readJSONFileFromBucket(bucketName, filePath);

    // Find the requested product by ID
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error(`Product not found for ID: ${productId}`);
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify product file exists
    const productFilePath = product.path.replace(/^\//, ''); // Remove leading slash for GCS
    const file = storage.bucket(bucketName).file(productFilePath);

    const [exists] = await file.exists();
    if (!exists) {
      console.error(`Product file not found: ${productFilePath}`);
      return res.status(404).json({ message: 'Product file not found' });
    }

    console.log(`Product file found. Preparing to stream: ${productFilePath}`);
    const fileStats = await file.getMetadata();
    const contentType = fileStats[0].contentType || 'application/octet-stream';

    // Set headers and stream the file
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${path.basename(productFilePath)}"`
    );

    const fileStream = file.createReadStream();
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error while streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });

    fileStream.on('end', () => {
      console.log(`File successfully streamed: ${productFilePath}`);
    });

  } catch (error) {
    console.error('Download error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

module.exports = router;
