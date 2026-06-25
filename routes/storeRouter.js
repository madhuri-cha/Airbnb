const express = require('express');
const storeRouter = express.Router();
const storeController = require('../controllers/storeController');

// Middleware: require login
const requireLogin = (req, res, next) => {
  if (req.isLoggedIn) return next();
  res.redirect('/login');
};

// Public routes
storeRouter.get('/', storeController.getIndex);
storeRouter.get('/homes', storeController.getHomes);
storeRouter.get('/homes/:homeId', storeController.getHomeDetails);

// Protected routes (any logged-in user)
storeRouter.get('/bookings', requireLogin, storeController.getBookings);
storeRouter.post('/bookings', requireLogin, storeController.postBooking);
// Cancel a booking (only owner can cancel) for any HTTP method
storeRouter.all('/bookings/cancel/:bookingId', requireLogin, storeController.cancelBooking);

module.exports = storeRouter;
