  const mongoose = require('mongoose');
  const { Schema } = mongoose;

  const userSchema = new Schema({
    username: String,
    password: String,
    number: {
      type: String,
      unique: true,
    },
    storedOTP: String,
    isAdmin: { type: Boolean, default: false },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'CategoryModel',
    },
    products: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    cart: {
      type: [{
        id: String,
        quantity: Number,
        description: String
      }],
      default: []
    },
    address: [{
      name: {
        firstName: String,
        lastName: String,
      },
      building: String,
      street: String,
      city: String,
      state: String,
      pin: Number,
      landmark: String,
      addressType: String,
      default: String,
      phone: Number,
    }],
    shipping: {
      shippingAddress: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      }
    },
    orders: [{
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
      numbers: Number,
      date: String,
      time: String,
      ETA: String,
      address: {
        name: {
          firstName: String,
          lastName: String,
        },
        building: String,
        street: String,
        city: String,
        state: String,
        pin: Number,
        landmark: String,
        addressType: String,
        default: String,
        phone: Number,
      },
      paymentMethod: String,
      paymentID: String,
      amount: Number,
      status: {
        type: String,
        default: 'pending',
      },
    }],
  

    isDeleted: {
      type: Boolean,
      default: false,
    }
  });

  const User = mongoose.model('User', userSchema);

  module.exports = User;


