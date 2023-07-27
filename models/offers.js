
const mongoose = require('mongoose');

const { Schema } = mongoose;


const offerSchema = new mongoose.Schema({
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product',
      }],
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    priceType: {
      type: String,
      enum: ['flat', 'percentage'],
      default: 'flat'
    },
    minSpent: {
      type: Number,
      required: true
    },
    usageLimit: {
      type: Number,
      required: true
    },
    voucherCode: {
      type: String,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
     status: Boolean
  });

const OfferModel = mongoose.model('Offer', offerSchema);

module.exports = OfferModel;