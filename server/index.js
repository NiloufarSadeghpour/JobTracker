// index.js
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadsRouter = require('./routes/uploads');
const cron = require('node-cron');
const helmet = require('helmet');

dotenv.config();

const app = express();

/* -------------------- CORS (credentials) -------------------- */
const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
};

const { notifyThreeDaysLeft } = require('./cron/deadlineNotifier'); 

cron.schedule('5 * * * *', async () => {
  try {
    await notifyThreeDaysLeft();
  } catch (e) {
    console.error('3-day notifier failed:', e);
  }
});

app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use('/uploads', uploadsRouter);

/* -------------------- Parsers -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

/* -------------------- Routes -------------------- */
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');
const coverLetterRoutes = require("./routes/coverLetter");
const notificationsRoute = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', require('./routes/jobs'));         
app.use('/api/projects', require('./routes/projects'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/resume', require('./routes/resume'));
app.use('/api/admin', adminRoutes);
app.use("/api/cover-letter", coverLetterRoutes);
app.use('/api/contact', require('./routes/contact'));
app.use('/api/notifications', notificationsRoute);


/* -------------------- Static (uploads) -------------------- */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found', path: req.path }));


/* -------------------- Healthcheck -------------------- */
app.get('/', (req, res) => {
  res.send('API is running');
});
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

/* -------------------- Start -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
