$('body').mousemove(function(event) {
    var e = $('.eye');
    var x = (e.offset().left) + (e.width() / 2);
    var y = (e.offset().top) + (e.height() / 2);
    var rad = Math.atan2(event.pageX - x, event.pageY - y);
    var rot = (rad * (180 / Math.PI) * -1) + 180;
    e.css({
      '-webkit-transform': 'rotate(' + rot + 'deg)',
      'transform': 'rotate(' + rot + 'deg)'
    });
  });
  


  // const renderHomePage = async (req, res, next) => {
//   try {
//     const categories = await CategoryModel.find({});
//     const products = await ProductModel.find({});
//     const usercategories = await User.find({});
//     const loggedInUser = req.session.username;
//     const users = await User.findOne({ username: loggedInUser });
//     console.log("loggedInUser", loggedInUser);

//     // Extract product names into an array
//     const productNames = products.map(product => product.Model);
//     const categoryNames = categories.map(category => category.title);
//     const processedProducts = products.map((product) => ({
//       ...product.toObject(),
//       id: product._id.toString(),
//     }));

//     res.render('index', {
//       usercategories,
//       categories,
//       products: processedProducts,
//       admin: false,
//       productNames: JSON.stringify(productNames),
//       categoryNames: JSON.stringify(categoryNames),
//     });
//   } catch (err) {
//     // Handle errors and redirect to the appropriate error page
//     if (err.name === 'MongoError') {
//       // Assuming a MongoError indicates a 500 Internal Server Error
//       res.status(500).render('internalSeveral_500');
//     } else {
//       // For other errors, render the server400.ejs page
//       res.status(400).render('server400');
//     }
//   }
// };
