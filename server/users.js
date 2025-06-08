const express = require('express');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

// Google Cloud Storage configuration
const storage = new Storage();
const bucketName = 'celestialcenter';
const usersFilePath = 'json/users.json';

// Ensure the users file exists in the bucket
async function ensureUsersFile() {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(usersFilePath);

  const [exists] = await file.exists();
  if (!exists) {
    // Initialize file with an empty users array
    await file.save(JSON.stringify([], null, 2));
    console.log(`Initialized ${usersFilePath} with an empty array.`);
  }
}

// Utility function to read users.json from the bucket
async function readUsersFile() {
  try {
    await ensureUsersFile();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(usersFilePath);

    // Download and parse JSON data
    const data = (await file.download())[0];
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading users.json:', err.message);
    throw new Error('Failed to fetch users data');
  }
}

// Utility function to write to users.json in the bucket
async function writeUsersFile(users) {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(usersFilePath);

    // Save data as a string to the bucket
    await file.save(JSON.stringify(users, null, 2));
    console.log(`${usersFilePath} successfully updated.`);
  } catch (err) {
    console.error('Error writing to users.json:', err.message);
    throw new Error('Failed to save users data');
  }
}

// GET /api/users - Fetch all users
router.get('/', async (req, res) => {
  try {
    const users = await readUsersFile();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/users - Create a new user (Signup)
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const users = await readUsersFile();

    if (users.find(user => user.email === email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = { id: users.length + 1, name, email, password };
    users.push(newUser);

    await writeUsersFile(users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/users/login - Authenticate a user (Login)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  try {
    const users = await readUsersFile();

    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Error logging in user:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
