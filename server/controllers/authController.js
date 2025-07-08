const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  // Check if user exists
  const checkUser = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUser, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', err });

    if (results.length > 0)
      return res.status(409).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUser = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(insertUser, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ message: 'DB insert error', err });

      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  const getUser = 'SELECT * FROM users WHERE email = ?';
  db.query(getUser, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', err });

    if (results.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ message: 'Login successful', token });
  });
};

module.exports = { register, login };
