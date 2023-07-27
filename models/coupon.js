const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    voucherCode: {
      type: String,
      required: true
    },
    description: {
        type: String,
        required: true
    },
  });
  
  const couponModel = mongoose.model('coupon', couponSchema);
  
  module.exports = couponModel;