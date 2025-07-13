// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/favorites', require('./routes/favorites'));


// Default route
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const path = require('path');
app.use('/api/resume', require('./routes/resume'));
app.use('/uploads/resumes', express.static(path.join(__dirname, 'uploads/resumes')));
