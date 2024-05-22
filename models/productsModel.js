const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema({
  
  SellPrice: {
    type: Number,
    required: true
  }, 
  OfferedPrice: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  Model: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  itemImage: {
    type: [String],
    required: true
  },
  moreInfo: {
    brand: String,
    varient: String,
    rating: Number
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
}); 

const ProductModel = mongoose.model('Product', productSchema);

module.exports = ProductModel;
