const Home = require('../models/home');

// Helper: resolve the photo value from either an uploaded file or a typed URL
function resolvePhoto(file, bodyUrl) {
  if (file) {
    return '/uploads/' + file.filename;
  }
  if (bodyUrl && bodyUrl.trim()) {
    return bodyUrl.trim();
  }
  return '';
}

exports.getAddHome = (req, res, next) => {
  res.render('host/edit-home', {
    pageTitle: 'Add Home to Airbnb',
    currentPage: 'addHome',
    editing: false,
    isLoggedIn: req.isLoggedIn,
    userType: req.userType,
    errorMessage: null,
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === 'true';

  // Only allow the host who owns this home to edit it
  Home.findOne({ _id: homeId, hostId: req.userId })
    .then((home) => {
      if (!home) {
        return res.redirect('/host/host-home-list');
      }
      res.render('host/edit-home', {
        home,
        pageTitle: 'Edit your Home',
        currentPage: 'host-homes',
        editing,
        isLoggedIn: req.isLoggedIn,
        userType: req.userType,
        errorMessage: null,
      });
    })
    .catch(next);
};

exports.getHostHomes = (req, res, next) => {
  // Only fetch homes that belong to the logged-in host
  Home.find({ hostId: req.userId })
    .then((registeredHomes) => {
      res.render('host/host-home-list', {
        registeredHomes,
        pageTitle: 'My Listings',
        currentPage: 'host-homes',
        isLoggedIn: req.isLoggedIn,
        userType: req.userType,
      });
    })
    .catch(next);
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating, photoUrl, description } = req.body;
  const photo = resolvePhoto(req.file, photoUrl);
  const parsedPrice = Number(price);
  const parsedRating = Number(rating);

  if (Number.isNaN(parsedPrice) || Number.isNaN(parsedRating)) {
    return res.status(422).render('host/edit-home', {
      pageTitle: 'Add Home to Airbnb',
      currentPage: 'addHome',
      editing: false,
      isLoggedIn: req.isLoggedIn,
      userType: req.userType,
      errorMessage: 'Price and rating must be valid numbers.',
      home: {
        houseName,
        price,
        location,
        rating,
        photoUrl,
        description,
      },
    });
  }

  const home = new Home({
    hostId: req.userId,   // tie this home to the logged-in host
    houseName,
    price: parsedPrice,
    location,
    rating: parsedRating,
    photoUrl: photo,
    description,
  });

  home
    .save()
    .then(() => {
      res.redirect('/host/host-home-list');
    })
    .catch(next);
};

exports.postEditHome = (req, res, next) => {
  const { id, houseName, price, location, rating, photoUrl, description } = req.body;
  const parsedPrice = Number(price);
  const parsedRating = Number(rating);

  if (Number.isNaN(parsedPrice) || Number.isNaN(parsedRating)) {
    return Home.findOne({ _id: id, hostId: req.userId })
      .then((home) => {
        return res.status(422).render('host/edit-home', {
          pageTitle: 'Edit your Home',
          currentPage: 'host-homes',
          editing: true,
          isLoggedIn: req.isLoggedIn,
          userType: req.userType,
          errorMessage: 'Price and rating must be valid numbers.',
          home: {
            _id: id,
            houseName,
            price,
            location,
            rating,
            photoUrl,
            description,
          },
        });
      })
      .catch(next);
  }

  // Only allow the host who owns this home to update it
  Home.findOne({ _id: id, hostId: req.userId })
    .then((home) => {
      if (!home) {
        return res.redirect('/host/host-home-list');
      }
      home.houseName = houseName;
      home.price = parsedPrice;
      home.location = location;
      home.rating = parsedRating;
      home.description = description;

      const newPhoto = resolvePhoto(req.file, photoUrl);
      if (newPhoto) {
        home.photoUrl = newPhoto;
      }

      return home.save().then(() => {
        res.redirect('/host/host-home-list');
      });
    })
    .catch(next);
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;

  // Only allow the host who owns this home to delete it
  Home.findOneAndDelete({ _id: homeId, hostId: req.userId })
    .then(() => {
      res.redirect('/host/host-home-list');
    })
    .catch(next);
};
