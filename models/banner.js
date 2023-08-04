const mongoose = require('mongoose');

// Define the banner schema
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

// Create the Banner model based on the bannerSchema
const BannerModel = mongoose.model('Banner', bannerSchema);

module.exports = BannerModel;