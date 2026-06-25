// Core Module
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

// Local Module
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');
const rootDir = require('./utils/pathUtil');
const errorsController = require('./controllers/errors');

const DB_PATH =
  'mongodb+srv://madhurichavan15122003:madhuri123@cluster0.ebzbryk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session store
const store = new mongodbStore({
  uri: DB_PATH,
  collection: 'sessions',
});

// Body parser — must come before routes
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(rootDir, 'public')));

// Session
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: true,
    store: store,
  })
);

// Attach login state + user info to every request
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn || false;
  req.userType = req.session.userType || null;
  req.userId = req.session.userId || null;
  req.username = req.session.username || null;
  next();
});

// Auth routes (login, logout, signup)
app.use(authRouter);

// Store routes (public)
app.use(storeRouter);

// Host routes — protected (must be logged in AND be a host)
app.use('/host', (req, res, next) => {
  if (req.isLoggedIn && req.userType === 'host') {
    next();
  } else if (!req.isLoggedIn) {
    res.redirect('/login');
  } else {
    // Logged in but not a host
    res.status(403).render('403', {
      pageTitle: 'Access Denied',
      currentPage: '',
      isLoggedIn: req.isLoggedIn,
      userType: req.userType,
    });
  }
});
app.use('/host', hostRouter);

// 404 fallback
app.use(errorsController.pageNotFound);

const PORT = process.env.PORT || 3000;

mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log('Connected to Mongo');
    const server = app.listen(PORT, () => {
      console.log(`Server running on address http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try using a different PORT environment variable or stop the process using this port.`);
        process.exit(1);
      }
      throw err;
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
