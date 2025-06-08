// server/users.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

const storage = new Storage();
const bucketName = 'celestialcenter';
const usersFile = 'json/users.json';

async function ensureUsers() {
  const file = storage.bucket(bucketName).file(usersFile);
  const [exists] = await file.exists();
  if (!exists) {
    await file.save(JSON.stringify([], null, 2));
  }
}

async function readUsers() {
  await ensureUsers();
  const data = (await storage.bucket(bucketName).file(usersFile).download())[0];
  return JSON.parse(data);
}

async function writeUsers(list) {
  await storage.bucket(bucketName).file(usersFile)
    .save(JSON.stringify(list, null, 2));
}

// Fetch all users
router.get('/', async (req, res) => {
  try {
    res.json(await readUsers());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Signup
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const users = await readUsers();
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ message: 'Email exists' });
    }
    const newUser = { id: users.length+1, name, email, password };
    users.push(newUser);
    await writeUsers(users);
    const { password:_, ...out } = newUser;
    res.status(201).json({ message: 'User created', user: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const users = await readUsers();
    const user = users.find(u => u.email===email && u.password===password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const { password:_, ...out } = user;
    res.json({ message: 'Login successful', user: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
