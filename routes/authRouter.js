const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/authController.js');

authRouter.get('/login', authController.getLogin);
authRouter.post('/login', authController.postLogin); // ✅ Add POST handler
authRouter.get('/logout', authController.postLogout); // ✅ Add logout handler
authRouter.get('/signup', authController.getSignup); // ✅ Add signup handler
authRouter.post('/signup', authController.postSignup); // ✅ Add signup handler

module.exports = authRouter; // ✅ Export the router directly
