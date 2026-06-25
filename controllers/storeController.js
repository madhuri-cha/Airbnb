const Home = require('../models/home');
const Booking = require('../models/booking');

exports.getIndex = (req, res, next) => {
  // Hosts go straight to their listings dashboard
  if (req.isLoggedIn && req.userType === 'host') {
    return res.redirect('/host/host-home-list');
  }

  Home.find({ hostId: { $exists: true, $ne: null } })
    .then((registeredHomes) => {
      res.render('store/index', {
        registeredHomes,
        pageTitle: 'Airbnb — Find your next stay',
        currentPage: 'index',
        isLoggedIn: req.isLoggedIn,
        userType: req.userType,
      });
    })
    .catch(next);
};

exports.getHomes = (req, res, next) => {
  Home.find({ hostId: { $exists: true, $ne: null } })
    .then((registeredHomes) => {
      const bookingPromise = req.isLoggedIn && req.userType === 'guest'
        ? Booking.find({ userId: req.userId })
        : Promise.resolve([]);

      return bookingPromise.then((bookings) => {
        const bookedHomeIds = bookings.map((booking) => booking.houseId.toString());
        res.render('store/home-list', {
          registeredHomes,
          pageTitle: 'Homes List',
          currentPage: 'Home',
          isLoggedIn: req.isLoggedIn,
          userType: req.userType,
          bookedHomeIds,
        });
      });
    })
    .catch(next);
};

exports.getBookings = (req, res, next) => {
  Booking.find({ userId: req.userId })
    .populate('houseId')
    .then((bookings) => {
      res.render('store/bookings', {
        pageTitle: 'Bookings',
        currentPage: 'bookings',
        isLoggedIn: req.isLoggedIn,
        userType: req.userType,
        bookings,
      });
    })
    .catch(next);
};

exports.postBooking = (req, res, next) => {
  const homeId = req.body.homeId;
  if (!homeId || req.userType !== 'guest') {
    return res.redirect('/homes');
  }

  Booking.findOne({ userId: req.userId, houseId: homeId })
    .then((existingBooking) => {
      if (existingBooking) {
        return res.redirect(`/homes/${homeId}`);
      }
      return Home.findById(homeId).then((home) => {
        if (!home) {
          return res.redirect('/homes');
        }
        const booking = new Booking({
          userId: req.userId,
          houseId: homeId,
        });
        return booking.save().then(() => res.redirect('/bookings'));
      });
    })
    .catch(next);
};

// Cancel a booking (any HTTP method)
exports.cancelBooking = (req, res, next) => {
  const bookingId = req.params.bookingId;
  if (!bookingId) return res.redirect('/bookings');

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return res.redirect('/bookings');

  const method = req.method;
  console.log(`Cancel booking ${method} attempt: bookingId=${bookingId} userId=${req.userId}`);

  Booking.findOneAndDelete({ _id: bookingId, userId: req.userId })
    .then((deleted) => {
      if (!deleted) console.log(`Cancel booking ${method}: no matching booking found for ${bookingId}`);
      res.redirect('/bookings');
    })
    .catch((err) => {
      console.error(`Error cancelling booking (${method}):`, err);
      next(err);
    });
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId)
    .then((home) => {
      if (!home) return res.redirect('/homes');
      const bookingQuery = req.isLoggedIn && req.userType === 'guest'
        ? Booking.exists({ userId: req.userId, houseId: home._id })
        : Promise.resolve(false);

      return bookingQuery.then((alreadyBooked) => {
        res.render('store/home-detail', {
          home,
          pageTitle: 'Home Detail',
          currentPage: 'Home',
          isLoggedIn: req.isLoggedIn,
          userType: req.userType,
          alreadyBooked: !!alreadyBooked,
        });
      });
    })
    .catch(next);
};
