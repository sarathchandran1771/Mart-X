const mongoose = require("mongoose");
const schema = mongoose.Schema;

const categorySchema = new schema({
  title: String,
  image: String
})

const CategoryModel = mongoose.model('Category', categorySchema);

module.exports = CategoryModel;
