const mongoose = require('mongoose');
const favourite = require('./favourite');
const Booking = require('./booking');

const homeSchema = mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  houseName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  photoUrl: String,
  description: String,
});

homeSchema.pre('findOneAndDelete', async function (next) {
  const homeId = this.getQuery()._id;
  await Promise.all([
    favourite.deleteMany({ houseId: homeId }),
    Booking.deleteMany({ houseId: homeId }),
  ]);
  next();
});

module.exports = mongoose.model('Home', homeSchema);
