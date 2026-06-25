const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const User = require('../models/user');

// GET /login
exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    currentPage: 'login',
    isLoggedIn: false,
    errorMessages: [],
    oldInput: { email: '' },
  });
};

// POST /login — verify credentials against DB
exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email: email.toLowerCase().trim() })
    .then((user) => {
      if (!user) {
        return res.status(401).render('auth/login', {
          pageTitle: 'Login',
          currentPage: 'login',
          isLoggedIn: false,
          errorMessages: ['Invalid email or password.'],
          oldInput: { email },
        });
      }

      return bcrypt.compare(password, user.password).then((match) => {
        if (!match) {
          return res.status(401).render('auth/login', {
            pageTitle: 'Login',
            currentPage: 'login',
            isLoggedIn: false,
            errorMessages: ['Invalid email or password.'],
            oldInput: { email },
          });
        }

        // Store login state + user info in session
        req.session.isLoggedIn = true;
        req.session.userType = user.userType;
        req.session.userId = user._id.toString();
        req.session.username = user.username;

        res.redirect('/');
      });
    })
    .catch((err) => {
      console.error('Login error:', err);
      next(err);
    });
};

// GET /logout
exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

// GET /signup
exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    pageTitle: 'Sign Up',
    currentPage: 'signup',
    isLoggedIn: false,
    errorMessages: [],
    oldInput: {
      username: '',
      email: '',
      password: '',
      userType: '',
      confirmPassword: '',
    },
  });
};

// POST /signup — validate, hash password, save user
exports.postSignup = [

  check('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 5 }).withMessage('Username must be at least 5 characters.')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Username can only contain letters.'),

  check('email')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  check('password')
    .trim()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character (!@#$%^&*).'),

  check('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),

  check('userType')
    .notEmpty().withMessage('Please select a user type.')
    .isIn(['host', 'guest']).withMessage('User type must be host or guest.'),

  check('terms')
    .custom((value) => {
      if (value !== 'on') {
        throw new Error('You must accept the terms and conditions.');
      }
      return true;
    }),

  (req, res, next) => {
    const { username, email, password, userType } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/signup', {
        pageTitle: 'Sign Up',
        currentPage: 'signup',
        isLoggedIn: false,
        errorMessages: errors.array().map((err) => err.msg),
        oldInput: { username, email, password, userType, confirmPassword: '' },
      });
    }

    // Check if email already exists
    User.findOne({ email: email.toLowerCase().trim() })
      .then((existingUser) => {
        if (existingUser) {
          return res.status(422).render('auth/signup', {
            pageTitle: 'Sign Up',
            currentPage: 'signup',
            isLoggedIn: false,
            errorMessages: ['An account with that email already exists.'],
            oldInput: { username, email, password, userType, confirmPassword: '' },
          });
        }

        // Hash password and save
        return bcrypt.hash(password, 12).then((hashedPassword) => {
          const user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            userType,
          });
          return user.save();
        });
      })
      .then((result) => {
        // result is undefined when we returned early (duplicate email), skip redirect
        if (result) {
          console.log('New user registered:', result.email, result.userType);
          res.redirect('/login');
        }
      })
      .catch((err) => {
        console.error('Signup error:', err);

        if (err.code === 11000 && err.keyValue && err.keyValue.email) {
          return res.status(422).render('auth/signup', {
            pageTitle: 'Sign Up',
            currentPage: 'signup',
            isLoggedIn: false,
            errorMessages: ['An account with that email already exists.'],
            oldInput: { username, email, password, userType, confirmPassword: '' },
          });
        }

        next(err);
      });
  },
];
