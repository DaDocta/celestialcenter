const express = require('express');
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');
const router = express.Router();

// Google Cloud Storage configuration
const storage = new Storage();
const bucketName = 'celestialcenter';
const licensesFile = 'json/licenses.json';

// Utility function to ensure licenses file exists in bucket
async function ensureLicensesFile() {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(licensesFile);

  const [exists] = await file.exists();
  if (!exists) {
    // Initialize file with an empty licenses array
    await file.save(JSON.stringify({ licenses: [] }, null, 2));
  }
}

// Read licenses file from Google Cloud Storage
async function readLicenses() {
  try {
    await ensureLicensesFile();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(licensesFile);

    // Download and parse JSON data
    const data = (await file.download())[0];
    console.log('Licenses data read from bucket:', data); // Log raw data
    const parsedData = JSON.parse(data);
    console.log('Parsed licenses data:', parsedData); // Log parsed data
    return parsedData;
  } catch (error) {
    console.error('Error reading licenses:', error.message);
    throw error;
  }
}


// Write licenses file to Google Cloud Storage
async function writeLicenses(data) {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(licensesFile);

    // Save data as a string to the bucket
    await file.save(JSON.stringify(data, null, 2));
  } catch (error) {
    throw error;
  }
}

// Generate unique license key
function generateLicenseKey() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

router.post('/', async (req, res) => {
  try {
    const { userId, products } = req.body;

    if (!userId || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Invalid input. Required: userId and non-empty products array'
      });
    }

    const data = await readLicenses();

    // Ensure `licenses` is an array
    if (!Array.isArray(data.licenses)) {
      console.warn('Invalid licenses data structure. Resetting to empty array.');
      data.licenses = [];
    }

    const timestamp = new Date().toISOString();

    // Create new licenses only if they do not already exist
    const existingLicenses = data.licenses.filter(
      (license) => license.userId === userId
    );

    const newLicenses = products
      .filter(
        (product) =>
          !existingLicenses.find(
            (license) => license.productId === product.id
          )
      )
      .map((product) => ({
        licenseKey: generateLicenseKey(),
        userId,
        productId: product.id,
        name: product.name,
        quantity: product.quantity,
        usesRemaining: product.quantity,
        created: timestamp,
        status: 'active',
      }));

    // Append only new licenses
    if (newLicenses.length > 0) {
      data.licenses.push(...newLicenses);
      await writeLicenses(data);
      console.log(`Added ${newLicenses.length} new licenses.`);
    } else {
      console.log('No new licenses to add.');
    }

    res.status(201).json({
      message: 'Licenses created successfully',
      licenses: newLicenses,
    });
  } catch (error) {
    console.error('License creation error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// GET /api/licenses/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await readLicenses();

    const userLicenses = data.licenses.filter(
      license => license.userId === userId && license.status === 'active'
    );

    res.json({ licenses: userLicenses });
  } catch (error) {
    console.error('License fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
