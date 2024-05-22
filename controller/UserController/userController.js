const express = require('express');
const session = require('express-session');
const userRouter = express.Router();
const User = require('../../models/user');
const mongoose = require('mongoose');
const ProductModel  =  require('../../models/productsModel');
const CategoryModel = require('../../models/categoryModel');
const couponModel = require('../../models/coupon');
const OfferModel = require('../../models/offers');
const BannerModel= require('../../models/banner')

const { format } = require('date-fns');
const Razorpay = require('razorpay');
var instance = new Razorpay({
  key_id: 'rzp_test_eeSd13cwpqz7vF',
  key_secret: 'jhrIwbh7rjyqsV6ixY4yCQMM',
});

userRouter.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));


const getProductDetails = async (selectedProduct) => {
  try {
    const productDetails = await ProductModel.findOne({ Model: selectedProduct });
    console.log("productDetails", productDetails);

    return productDetails;
  } catch (err) {
    console.error('Error fetching product details:', err);
    throw new Error('Server error');
  }
};

const handleGetProductDetails = async (req, res) => {
  try {
    const selectedProduct = req.body.product; // Assuming the selected product name is sent in the request body
    console.log("selectedProduct", selectedProduct);

    const productDetails = await getProductDetails(selectedProduct);
    console.log("productDetails", productDetails);

    // Return the product details as JSON response
    res.json(productDetails);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Endpoint to handle the AJAX request and fetch product details
const getProductDetailsRoute = '/getProductDetails';

const renderHomePage = async (req, res, next) => {
  try {
    const categories = await CategoryModel.find({});
    const products = await ProductModel.find({});
    const usercategories = await User.find({});
    const banners = await BannerModel.find();
console.log("banners",banners);
    const loggedInUser = req.session.username;
    const users = await User.findOne({ username: loggedInUser });
    // Extract product names into an array
    const productNames = products.map(product => product.Model);
    const categoryNames = categories.map(category => category.title);
    const processedProducts = products.map((product) => ({
      ...product.toObject(),
      id: product._id.toString(),
    }));
    res.render('index', {
      usercategories,
      categories,
      products: processedProducts,
      productNames: JSON.stringify(productNames),
      categoryNames: JSON.stringify(categoryNames),
    });
    
  } catch (err) {
    next(err);
  }
};

const renderproductPage = async (req, res, next) => {
  try {
    const categories = await CategoryModel.find({});
    const productId = req.query.id;
    const categoryID = req.query.id;
    const category = await CategoryModel.find({categoryID});
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }
    const usercategories = await User.find({});
    // Wrap the single product object in an array
    const products = [product];
    // Extract product names into an array (for suggestion dropdown on other pages)
    const productNames = products.map((product) => product.Model);
    const categoryNames = categories.map((category) => category.title);
    const currentDate = new Date();

    // Find the applicable offer
    const offer = await OfferModel.findOne({
      products: productId,
      startTime: { $lte: currentDate },
      endTime: { $gte: currentDate },
    });
    console.log('Offer:', offer);
    if (offer) {
      if (offer.priceType === 'percentage') {
        const finalOfferedPrice = product.OfferedPrice - (offer.price / 100) * product.OfferedPrice;
        offer.minSpent = finalOfferedPrice;
        console.log('finalOfferedPrice (percentage):', finalOfferedPrice);
      } else if (offer.priceType === 'fixed') {
        const finalOfferedPrice = product.OfferedPrice - offer.price;
        offer.minSpent = finalOfferedPrice;
        console.log('finalOfferedPrice (fixed):', finalOfferedPrice);
      } else {
        console.log('Invalid price type selected.');
      }
    }
    
    res.render('detail', {
      offer,
      usercategories,
      categories,
      products,
      productNames: JSON.stringify(productNames),
      categoryNames: JSON.stringify(categoryNames),
    });
  } catch (err) {
    next(err);
  }
};


const updateCartItem = async (req, res, next) => {
  try {
    const { quantity, totalPrice } = req.body;
    const cartItemId = req.params.cartItemId;

    const user = await User.findOne({ number: req.session.number });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cartItem = user.cart.find((item) => item.cartItemId === cartItemId);
    if (!cartItem) {
      console.log("No cartItem", cartItem);
      return res.status(404).json({ error: 'Cart item not found' });
    }

    cartItem.quantity = quantity;
    cartItem.totalAmount = totalPrice;
    cartItem.cartItemId = cartItemId;
    await user.save();

    console.log("Cart item updated successfully", cartItem);
    res.status(200).json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.log("Error updating cart item", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const postCart = async (req, res, next) => {
  try {
    const { productId } = req.body; 
    const product = await ProductModel.findById(productId);
    console.log("productId",productId);
    const categories = await CategoryModel.find({});
    const products = await ProductModel.find({})
    if (!product) {
      res.redirect('/cart?success=true');
    }
    const user = await User.findOne({ number: req.session.number });
    console.log("user", user);
    if (!user) {
      res.redirect("/userLogin")
    }
    user.cart = user.cart || []; 
    const existingCartItem = user.cart.find((item) => item.id === productId);
    if (existingCartItem) {
      // Increase the quantity and total amount
      existingCartItem.quantity += 1;
      existingCartItem.totalAmount += product.SellPrice;
      console.log("existingCartItem",existingCartItem);
    } else {
      // Add the product to the cart
      const cartItem = {
        id: product._id.toString(),
        SellPrice: product.SellPrice,
        OfferedPrice:product.OfferedPrice,
        description: product.description,
        itemImage: product.itemImage,
        quantity: 1,
        totalAmount: product.SellPrice
      };
      user.cart.push(cartItem);
    }
    await user.save();
    const addedCartItem = user.cart.find((item) => item.id === productId);
    if (!addedCartItem) {
      console.log("addedCartItem",addedCartItem);
      return res.status(404).json({ error: 'Added cart item not found' });
    }
    res.redirect('/cart?success=true');
  } catch (error) {
    console.log("post error cart",error);
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const { number } = req.session;
    const categories = await CategoryModel.find({});
    const products = await ProductModel.find({});
    const users = await User.find({ number: req.session.number });
    const user = await User.findOne({ number: number }).populate('cart.id');
    const productNames = products.map(product => product.Model);
    const categoryNames = categories.map(category => category.title);

    if (!user || !user.cart) {
      const cartItems = [];
      return res.render('cart', {
        cartItems,
        users: users,
        productNames: JSON.stringify(productNames),
        categoryNames: JSON.stringify(categoryNames),
      });
    }

    // Fetch cart items using User.aggregate and rename the variable to avoid conflict
    const cartItemsData = await User.aggregate([
      {
        $match: { number: number }
      },
      {
        $unwind: "$cart"
      },
      {
        $lookup: {
          from: "products",
          let: { productId: { $toObjectId: "$cart.id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$productId"] }
              }
            },
            {
              $project: {
                _id: 1,
                itemImage: 1,
                SellPrice: 1,
                description: 1,
                Model:1,
                OfferedPrice:1,

              }
            }
          ],
          as: "product"
        }
      },
      {
        $project: {
          _id: "$cart._id",
          quantity: "$cart.quantity",
          product: { $arrayElemAt: ["$product", 0] }
        }
      }
    ]);

    // Fetch the offer for the products in the cart and update cartItemsData with reduced prices

    for (const cartItem of cartItemsData) {
      const productIdsInCart = [cartItem.product._id];
      const offer = await OfferModel.findOne({ products: { $in: productIdsInCart } });
    
      if (offer) {
        // Apply offer reduction to the cart item's product price
        const productPrice = cartItem.product.SellPrice;
    
        if (offer.priceType === 'percentage') {
          const reducedPrice = productPrice - (offer.price / 100) * productPrice;
          // cartItem.product.SellPrice = reducedPrice;
          cartItem.reducedSellPrice = reducedPrice;
        } else if (offer.priceType === 'fixed') {
          const reducedPrice = productPrice - offer.price;
          // cartItem.product.SellPrice = reducedPrice;
          cartItem.reducedSellPrice = reducedPrice;
        } else {
          // Handle invalid price types here
          console.log('Invalid price type in offer.');
          cartItem.reducedSellPrice = productPrice;
        }
      } else {
        // If no offer is found, set the reducedSellPrice to the original SellPrice
        cartItem.reducedSellPrice = cartItem.product.OfferedPrice;
      }
    }
    

    res.render('cart', {
      cartItems: cartItemsData, // Use the updated cartItemsData
      users: users,
      productNames: JSON.stringify(productNames),
      categoryNames: JSON.stringify(categoryNames),
    });
  } catch (error) {
    console.log("errorgetCart");
    next(error);
  }
};



// const getCart = async (req, res, next) => {
//   try {
//     const { number } = req.session;
//     const categories = await CategoryModel.find({});
//     const products = await ProductModel.find({});
//     const offer = await OfferModel.find({});
//     const users = await User.find({number: req.session.number}) 
//     const user = await User.findOne({ number:number }).populate('cart.id');
//     const productNames = products.map(product => product.Model);
//     const categoryNames = categories.map(category => category.title);
    
//     if (!user || !user.cart) {
//       const cartItems = [];
//       return res.render('cart', { cartItems,users: users,
//         productNames: JSON.stringify(productNames),
//         categoryNames: JSON.stringify(categoryNames), 
//        });
      
//     }
//     const currentDate = new Date();

//     const productOffer = await OfferModel.findOne({
//       startTime: { $lte: currentDate },
//       endTime: { $gte: currentDate },
//     });
    
//     console.log('Offer:', productOffer);

//     if (productOffer) {
//       // If offer is available, reduce the OfferModel price from OfferedPrice
//       const finalOfferedPrice =
//         products.SellPrice - (productOffer.priceType === 'percentage' ? (productOffer.price / 100) * products.SellPrice : productOffer.price);
//       products.OfferedPrice = finalOfferedPrice;
//       console.log('finalOfferedPrice', finalOfferedPrice);
//     }

//     const cartItems = await User.aggregate([
//       {
//         $match: { number: number }
//       },
//       {
//         $unwind: "$cart"
//       },
//       {
//         $lookup: {
//           from: "products",
//           let: { productId: { $toObjectId: "$cart.id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$_id", "$$productId"] }
//               }
//             },
//             {
//               $project: {
//                 _id: 1,
//                 itemImage: 1,
//                 SellPrice: 1,
//                 description: 1

//               }
//             }
//           ],
//           as: "product"
//         }
//       },
//       {
//         $project: {
//           _id: "$cart._id",
//           quantity: "$cart.quantity",
//           product: { $arrayElemAt: ["$product", 0] }
//         }
//       }
//     ]);

//     res.render('cart', { 
//       offer:productOffer,
//       cartItems,
//       users: users,
//       productNames: JSON.stringify(productNames),
//       categoryNames: JSON.stringify(categoryNames),     
//     });
//   } catch (error) {
//     console.log("errorgetCart");
//     next(error);
//   }
// };


const deleteCart = async (req, res, next) => {
  try {
    const { number } = req.session;
    const user = await User.findOne({ number: req.session.number  });
    const categories = await CategoryModel.find({});
    const products = await ProductModel.find({});

    const cartId = req.params.id;
    if (!user) {
      res.redirect("/userLogin")
      } 
    const cart = await User.updateOne(
      { _id: user._id },
      { $pull: { cart: { _id: cartId } } }
    );
    console.log("success: cart deleted successfully!");
    const cartItems = user.cart;
    req.session.cartItems = cartItems; // Store cartItems in session
    res.redirect("/cart?deletedSuccess=true");
  } catch (error) {
    console.log('deleteCart error:', error);
    next(error);
  }
};

const postAddressSave = async (req, res, next) => {
  try {
    const {
      number,
      firstName,
      lastName,
      address,
      building,
      street,
      city,
      state,
      pin,
      landmark,
      addressType,
      
    } = req.body;


    const user = await User.findOne({ number: req.session.number });
    if (!user) {
      return res.redirect('/');
    }
    const addressSave = {
      name: {
        firstName: firstName,
        lastName: lastName,
      },
      number: number,
      street: street,
      building: building,
      city: city,
      state: state,
      pin: pin,
      address: address,
      landmark: landmark,
      addressType: addressType,
    };
    user.address.push(addressSave);
    await user.save();
    res.redirect('/checkOut');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

//*************Good code******/

const getCheckOut = async (req, res, next) => {
  try {
    const { productId,couponCode } = req.body; 
    console.log("getproductId",productId);
    const { number } = req.session;
    const users = await User.find({ number: req.session.number });
    const user = await User.findOne({ number }).populate('address');

    if (!user) {
      console.log("No user");
      return res.redirect('/');
    }
    const cartItems = await User.aggregate([
      {
        $match: { number: number }
      },
      {
        $unwind: "$cart"
      },
      {
        $lookup: {
          from: "products",
          let: { productId: { $toObjectId: "$cart.id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$productId"] }
              }
            },
            {
              $project: {
                _id: 1,
                SellPrice: 1,
                OfferedPrice: 1,
                Model:1,
              }
            }
          ],
          as: "product"
        }
      },
      {
        $project: {
          productID: { $arrayElemAt: ["$product._id", 0] },
          quantity: "$cart.quantity",
          SellPrice: { $arrayElemAt: ["$product.SellPrice", 0] },
          OfferedPrice: { $arrayElemAt: ["$product.OfferedPrice", 0] },
          Model: { $arrayElemAt: ["$product.Model", 0] },
          cartSellPrice: "$cart.SellPrice",
          cartOfferedPrice: "$cart.OfferedPrice",
          amount: { $multiply: ["$cart.quantity", "$cart.SellPrice"] }
        }
      },

    ]);

    for (const cartItem of cartItems) {
      const productIdsInCart = [cartItem.productID];
      const offer = await OfferModel.findOne({ products: { $in: productIdsInCart } });
    
      if (offer) {
        // Apply offer reduction to the cart item's product price
        const productPrice = cartItem.SellPrice;
    
        if (offer.priceType === 'percentage') {
          const reducedPrice = productPrice - (offer.price / 100) * productPrice;
          // cartItem.product.SellPrice = reducedPrice;
          cartItem.reducedSellPrice = reducedPrice;
        } else if (offer.priceType === 'fixed') {
          const reducedPrice = productPrice - offer.price;
          // cartItem.product.SellPrice = reducedPrice;
          cartItem.reducedSellPrice = reducedPrice;
        } else {
          // Handle invalid price types here
          console.log('Invalid price type in offer.');
          cartItem.reducedSellPrice = productPrice;
        }
      } else {
        // If no offer is found, set the reducedSellPrice to the original SellPrice
        cartItem.reducedSellPrice = cartItem.OfferedPrice;
      }
    }
    const selectedAddress = user.address.id(user.shipping.shippingAddress);
    const address = user.address;
    const couponDetails = await couponModel.findOne({ voucherCode: couponCode });
    const successMessage = req.flash('success');

    res.render('checkOut', {
      selectedAddress: selectedAddress,
      address: address,
      admin: false,
      users: users,
      cartItems: cartItems.length > 0 ? cartItems[0].cartItems : [],
      totalAmount: cartItems.length > 0 ? cartItems[0].totalAmount : 0,
      productId,
      successMessage: successMessage, 
      cartItems: cartItems,
      couponDetails: couponDetails,
    });
  } catch (err) {
    console.log(err);
    res.redirect('/checkOut');
  }
};


const postEditAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const { 
      number,
      firstName,
      lastName,
      address,
      building,
      street,
      city,
      state,
      pin,
      landmark,
      addressType 
    } = req.body;
    const user = await User.findOne({ number: req.session.number });
    if (!user) {
      console.log("No user");
      return res.redirect('/');
    }
    const updateAddress = user.address.id(addressId);

    if (!updateAddress) {
      throw new Error("Address not found");
    }

    updateAddress.name.firstName = firstName;
    updateAddress.name.lastName = lastName;
    updateAddress.building = building;
    updateAddress.street = street;
    updateAddress.city = city;
    updateAddress.state = state;
    updateAddress.pin = pin;
    updateAddress.landmark = landmark;
    updateAddress.addressType = addressType;
    updateAddress.number = number;
    await user.save();
    console.log("Address updated successfully!");
    res.redirect('/checkOut');
  } catch (err) {
    console.log("updateAddress error", err);
    req.flash('error', 'Error updating item');
    res.redirect('/checkOut');
  }
};

const geteditAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id; 
    const updateAddress = await User.findById(addressId);
    if (!updateAddress) {
      console.log("NO updateAddress");
      return res.redirect('/checkOut');
    }
    res.render('checkOut', { updateAddress, admin: false });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const user = await User.findOne({ number: req.session.number });
    if (!user) {
      console.log("No user");
      return res.redirect('/');
    }
    const result = await User.updateOne(
      { _id: user._id },
      { $pull: { address: { _id: addressId } } }
    );
    console.log("success: Address deleted successfully!");
    res.redirect('/checkOut');
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("error",error);
    next(error);
  }
};


const getShippingAddress = async (req, res, next) => {
  try {
    const { number } = req.session;
    const users = await User.find({ number: req.session.number });
    if (!users) {
      // User not found
      return res.redirect('/');
    }
    const productNames = products.map(product => product.Model);
    const categoryNames = categories.map(category => category.title);
    const selectedAddress = await User.findById(users[0]._id).populate('shipping.shippingAddress');
    res.render('checkOut', { 
      admin: false, 
      users: users, 
      selectedAddress: selectedAddress.shipping.shippingAddress,
      productNames: JSON.stringify(productNames),
      categoryNames: JSON.stringify(categoryNames),
     });
  } catch (err) {
    console.log("An error occurred",err);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const postShippingAddress = async (req, res, next) => {
  try {
    const { number } = req.session;
    const { addressId } = req.body;

    const user = await User.findOne({ number });
    if (!user) {
      // User not found
      console.log("No user");
      return res.redirect('/');
    }

    const selectedAddress = user.address.id(addressId);
    if (!selectedAddress) {
      // Address not found
      console.log("No selectedAddress",selectedAddress);
      return res.redirect('/checkout');
    }

    user.shipping.shippingAddress = selectedAddress._id;
    await user.save();
    console.log("selectedAddressselectedAddress",selectedAddress);

    res.redirect('/checkout');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};


const getThankYou = async (req, res, next) => {
  try {
    const categories = await CategoryModel.find({});
    const products = await ProductModel.find({});
    const productNames = products.map(product => product.Model);
    const categoryNames = categories.map(category => category.title);
    res.render('thankYou',{
      productNames: JSON.stringify(productNames),
      categoryNames: JSON.stringify(categoryNames),
    }); 
  } catch (error) {
    console.error('An error occurred', error);
    res.status(500).json({ error: 'An error occurred' });
    next(error);
  }
};

// const postPlaceOrder = async (req, res, next) => {
//   try {
//     const { paymentMethod } = req.body;
//     const { number } = req.session;
//     const user = await User.findOne({ number }).populate('address');

//     if (!user) {
//       console.log("No user");
//       return res.redirect('/');
//     }

//     const cartItems = await User.aggregate([
//       {
//         $match: { number: number }
//       },
//       {
//         $unwind: "$cart"
//       },
//       {
//         $lookup: {
//           from: "products",
//           let: { productId: { $toObjectId: "$cart.id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$_id", "$$productId"] }
//               }
//             },
//             {
//               $project: {
//                 _id: 1,
//                 SellPrice: 1,
//                 OfferedPrice: 1,
//                 Model: 1,
//               }
//             }
//           ],
//           as: "product"
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           productId: "$cart.id",
//           quantity: "$cart.quantity",
//           SellPrice: { $arrayElemAt: ["$product.SellPrice", 0] },
//           OfferedPrice: { $arrayElemAt: ["$product.OfferedPrice", 0] },
//           Model: { $arrayElemAt: ["$product.Model", 0] },
//           cartSellPrice: "$cart.SellPrice",
//           cartOfferedPrice: "$cart.OfferedPrice",
//           amount: { $multiply: ["$cart.quantity", { $arrayElemAt: ["$product.SellPrice", 0] }] },
//         }
//       },
//     ]);

//     let quantity = 0;
//     let totalAmount = 0;
//     const orderedProducts = []; // Array to store the ordered products

//     cartItems.forEach((item) => {
//       quantity += item.quantity;
//       totalAmount += item.OfferedPrice * item.quantity;

//       // Create an ordered product object
//       const orderedProduct = {
//         productId: item.productId, // Use item.productId directly if it is already a valid ObjectId
//         quantity: item.quantity,
//         SellPrice: item.SellPrice,
//         OfferedPrice: item.OfferedPrice,
//         Model: item.Model,
//       };

//       orderedProducts.push(orderedProduct); // Add the ordered product to the array
//     });

//     const dateNow = {
//       date: format(new Date(), 'yyyy-MM-dd'),
//       time: format(new Date(), 'HH:mm:ss'),
//     };

//     const ETADate = {
//       date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
//     };

//     const selectedAddress = user.address.id(user.shipping.shippingAddress);

//     const status = paymentMethod === 'COD' ? 'pending' : 'placed';

//     const order = orderedProducts.map(product => ({
//       product: product.productId, // Use the existing productId directly
//         status: status,
//       date: dateNow.date,
//       time: dateNow.time,
//       ETA: ETADate.date,
//       address: selectedAddress,
//       paymentMethod: paymentMethod,
//       paymentID: '',
//       amount: totalAmount * 100,
//     }));
    

//     if (paymentMethod === "COD") {
//       user.orders.push(order);
//       user.cart = [];
//       for (const item of cartItems) {
//         const product = await ProductModel.findById(item.productId); // Use the productId
//         if (product) {
//           product.quantity -= item.quantity;
//           await product.save();
//           await ProductModel.updateOne(
//             { _id: item.productId }, // Use the productId
//             { $inc: { quantity: -item.quantity } }
//           );
//         }
//       }
//       await user.save(); // Save the updated user document
    
//       return res.json({ codSuccess: true });
//     } else {
//       // Handle online payment method here
//       const orderOptions = {
//         amount: totalAmount * 100,
//         currency: "INR",
//         receipt: "", // Assign receipt ID later
//         notes: {
//           key1: "value3",
//           key2: "value2",
//         },
//       };

//       const paymentOrder = await instance.orders.create(orderOptions);
//       console.error('An order:', paymentOrder);
//       order.paymentMethod = paymentMethod;
//       order.paymentID = paymentOrder.id;
//       order.receipt = paymentOrder.id;
//       orderOptions.receipt = paymentOrder.id;

//       user.orders.push(order);
//       await user.save();

//       for (const item of cartItems) {
//         await ProductModel.updateOne(
//           { _id: item.productId }, // Use the productId
//           { $inc: { quantity: -item.quantity } }
//         );
//       }
//       user.cart = [];
//       await user.save();

//       return res.json(paymentOrder);
//     }
//   } catch (error) {
//     console.error('An error occurred', error);
//     res.status(500).json({ error: 'An error occurred' });
//     next(error);
//   }
// };
//old correct one ***


//new updated one
// const postPlaceOrder = async (req, res, next) => {
//   try {
//     const { paymentMethod } = req.body;
//     const { number } = req.session;
//     const user = await User.findOne({ number }).populate('address');

//     if (!user) {
//       console.log("No user");
//       return res.redirect('/');
//     }

//     const cartItems = await User.aggregate([
//       {
//         $match: { number: number }
//       },
//       {
//         $unwind: "$cart"
//       },
//       {
//         $lookup: {
//           from: "products",
//           let: { productId: { $toObjectId: "$cart.id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$_id", "$$productId"] }
//               }
//             },
//             {
//               $project: {
//                 _id: 1,
//                 SellPrice: 1,
//                 OfferedPrice: 1,
//                 Model: 1,
//               }
//             }
//           ],
//           as: "product"
//         }
//       },
//       {
//         $project: {
//           productID: { $arrayElemAt: ["$product._id", 0] },
//           quantity: "$cart.quantity",
//           SellPrice: { $arrayElemAt: ["$product.SellPrice", 0] },
//           OfferedPrice: { $arrayElemAt: ["$product.OfferedPrice", 0] },
//           Model: { $arrayElemAt: ["$product.Model", 0] },
//           cartSellPrice: "$cart.SellPrice",
//           cartOfferedPrice: "$cart.OfferedPrice",
//           amount: { $multiply: ["$cart.quantity", { $arrayElemAt: ["$product.SellPrice", 0] }] },
//         }
//       },
//     ]);
//     let totalAmount = 0;
//     const orderedProducts = []; // Array to store the ordered products
    
//     for (const cartItem of cartItems) {
//       const productIdsInCart = cartItem.productID.toString();
//       const productPrice = cartItem.SellPrice;
//       const productOfferPrice = cartItem.OfferedPrice;
//       let productsInOffer = []; // Initialize productsInOffer as an empty array
    
//       const offers = await OfferModel.find({ products: { $in: productIdsInCart } });
//       console.log("productIdsInCart:", productIdsInCart);
//       console.log("offers", offers);
    
//       for (const offer of offers) {
//         productsInOffer = offer.products.map(productId => productId.toString());
    
//         if (productsInOffer.includes(productIdsInCart)) {
//           // Apply offer reduction to the cart item's product price
//           if (offer.priceType === 'percentage') {
//             const reducedPrice = productPrice - (offer.price / 100) * productPrice;
//             cartItem.reducedSellPrice = reducedPrice;
//           } else if (offer.priceType === 'fixed') {
//             const reducedPrice = productPrice - offer.price;
//             cartItem.reducedSellPrice = reducedPrice;
//           } else {
//             // Handle invalid price types here
//             console.log('NO price type in offer.');
//             cartItem.reducedSellPrice = productOfferPrice;
//           }
//           totalAmount += cartItem.reducedSellPrice * cartItem.quantity;
//     totalAmount += cartItem.totalAmount;

//           break; // Exit the loop after finding the applicable offer
//         }
//         console.log("1 Products in offer:", productsInOffer);
//       }
    
    
//       // If no applicable offer found, use the regular OfferedPrice
//       if (!productsInOffer.includes(productIdsInCart)) {
//         console.log("NO 1 Products in offer:", productsInOffer);
//         cartItem.reducedSellPrice = productOfferPrice;
//         totalAmount += cartItem.reducedSellPrice * cartItem.quantity;
//     totalAmount += cartItem.totalAmount;

//       }
//       console.log("totalAmount", totalAmount);
    
//       // Create an ordered product object
//       const orderedProduct = {
//         productId: productIdsInCart, // Use cartItem.productId directly if it is already a valid ObjectId
//         quantity: cartItem.quantity,
//         totalAmount: totalAmount, // Use the individual product's total amount
//         SellPrice: cartItem.SellPrice,
//         OfferedPrice: cartItem.reducedSellPrice,
//         Model: cartItem.Model,
//       };
//       orderedProducts.push(orderedProduct); // Add the ordered product to the array
//     }
//     console.log("orderedProducts",orderedProducts);

//     const dateNow = {
//       date: format(new Date(), 'yyyy-MM-dd'),
//       time: format(new Date(), 'HH:mm:ss'),
//     };

//     const ETADate = {
//       date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
//     };

//     const selectedAddress = user.address.id(user.shipping.shippingAddress);

//     const status = paymentMethod === 'COD' ? 'pending' : 'placed';

//     const order = orderedProducts.map(product => ({
//       product: product.productId, // Use the existing productId directly
//       status: status,
//       date: dateNow.date,
//       time: dateNow.time,
//       ETA: ETADate.date,
//       address: selectedAddress,
//       paymentMethod: paymentMethod,
//       paymentID: '',
//       amount: product.totalAmount * 100,
//     }));
//     console.log("order",order);

//     if (paymentMethod === "COD") {
//       user.orders.push(order);
//       user.cart = [];
//       for (const item of cartItems) {
//         const product = await ProductModel.findById(item.productID);
//         console.log("product",product);
//         if (product) {
//           product.quantity -= item.quantity;
//           await product.save();
//           await ProductModel.updateOne(
//             { _id: item.productID }, // Use the productId
//             { $inc: { quantity: -item.quantity } }
//           );
//         }
//       }
//       await user.save(); // Save the updated user document
    
//       return res.json({ codSuccess: true });
//     } else {
//       // Handle online payment method here
//       const orderOptions = {
//         amount: totalAmount * 100,
//         currency: "INR",
//         receipt: "", // Assign receipt ID later
//         notes: {
//           key1: "value3",
//           key2: "value2",
//         },
//       };

//       const paymentOrder = await instance.orders.create(orderOptions);
//       console.error('An order:', paymentOrder);
//       order.paymentMethod = paymentMethod;
//       order.paymentID = paymentOrder.id;
//       order.receipt = paymentOrder.id;
//       orderOptions.receipt = paymentOrder.id;
// console.log("paymentOrder",paymentOrder);
//       user.orders.push(order);
//       await user.save();

//       for (const item of cartItems) {
//         await ProductModel.updateOne(
//           { _id: item.productId }, // Use the productId
//           { $inc: { quantity: -item.quantity } }
//         );
//       }
//       user.cart = [];
//       await user.save();

//       return res.json(paymentOrder);
//     }
//   } catch (error) {
//     console.error('An error occurred', error);
//     res.status(500).json({ error: 'An error occurred' });
//     next(error);
//   }
// };
//Invalid amount (should be passed in integer paise.minimum value is 100paise, i.e rs.1)
const postPlaceOrder = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const { number } = req.session;
    const user = await User.findOne({ number }).populate('address');

    if (!user) {
      console.log("No user");
      return res.redirect('/');
    }
    const cartItems = await User.aggregate([
      {
        $match: { number: number }
      },
      {
        $unwind: "$cart"
      },
      {
        $lookup: {
          from: "products",
          let: { productId: { $toObjectId: "$cart.id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$productId"] }
              }
            },
            {
              $project: {
                _id: 1,
                SellPrice: 1,
                OfferedPrice: 1,
                Model: 1,
              }
            }
          ],
          as: "product"
        }
      },
      {
        $project: {
          productID: { $arrayElemAt: ["$product._id", 0] },
          quantity: "$cart.quantity",
          SellPrice: { $arrayElemAt: ["$product.SellPrice", 0] },
          OfferedPrice: { $arrayElemAt: ["$product.OfferedPrice", 0] },
          Model: { $arrayElemAt: ["$product.Model", 0] },
          cartSellPrice: "$cart.SellPrice",
          cartOfferedPrice: "$cart.OfferedPrice",
          amount: { $multiply: ["$cart.quantity", { $arrayElemAt: ["$product.SellPrice", 0] }] },
        }
      },
    ]);
    let totalAmount = 0;
    const orderedProducts = [];
    for (const cartItem of cartItems) {
      const productIdsInCart = cartItem.productID.toString();
      const productObjectId = new mongoose.Types.ObjectId(productIdsInCart);
      const productPrice = cartItem.SellPrice;
      let productsInOffer = [];
      const offers = await OfferModel.find({ products: { $in: productIdsInCart } });
      for (const offer of offers) {
        productsInOffer = offer.products.map(productId => productId.toString());

        if (productsInOffer.includes(productIdsInCart)) {
          // Apply offer reduction to the cart item's product price
          if (offer.priceType === 'percentage') {
            const reducedPrice = productPrice - (offer.price / 100) * productPrice;
            cartItem.reducedSellPrice = reducedPrice;
          } else if (offer.priceType === 'fixed') {
            const reducedPrice = productPrice - offer.price;
            cartItem.reducedSellPrice = reducedPrice;
          } else {
            // Handle invalid price types here
            console.log('NO price type in offer.');
            cartItem.reducedSellPrice = productPrice;
          }
          break; // Exit the loop after finding the applicable offer
        }
      }    
      // If no applicable offer found, use the regular SellPrice
      if (!productsInOffer.includes(productIdsInCart)) {
        console.log("NO Products in offer:", productsInOffer);
        cartItem.reducedSellPrice = productPrice;
      }
      console.log("cartItem.reducedSellPrice", cartItem.reducedSellPrice);
      // Calculate the total amount for this cart item
      const itemTotalAmount = cartItem.reducedSellPrice * cartItem.quantity;
      totalAmount += itemTotalAmount;
      // Create an ordered product object
      const orderedProduct = {
        productId: productObjectId, 
        quantity: cartItem.quantity,
        totalAmount: itemTotalAmount, // Use the individual product's total amount
        SellPrice: cartItem.SellPrice,
        OfferedPrice: cartItem.reducedSellPrice,
        Model: cartItem.Model,
      };
      orderedProducts.push(orderedProduct); // Add the ordered product to the array
    }
    console.log("orderedProducts", orderedProducts);
    const dateNow = {
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm:ss'),
    };
    const ETADate = {
      date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    };
    const selectedAddress = user.address.id(user.shipping.shippingAddress);
    const status = paymentMethod === 'COD' ? 'pending' : 'placed';
    const order = orderedProducts.map(product => ({
      product: product.productId,
      status: status,
      date: dateNow.date,
      time: dateNow.time,
      ETA: ETADate.date,
      address: selectedAddress,
      paymentMethod: paymentMethod,
      paymentID: '',
      amount: product.totalAmount * 100,
    }));
    console.log("order",order);
    if (paymentMethod === "COD") {
      user.orders.push(order);
      user.cart = [];
      for (const item of cartItems) {
        const product = await ProductModel.findById(item.productID);
        console.log("product",product);
        if (product) {
          product.quantity -= item.quantity;
          await product.save();
          await ProductModel.updateOne(
            { _id: item.productID }, // Use the productId
            { $inc: { quantity: -item.quantity } }
          );
        }
      }
      await user.save(); // Save the updated user document 
      return res.json({ codSuccess: true });
    } else {
      // Handle online payment method here
      const orderOptions = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "", // Assign receipt ID later
        notes: {
          key1: "value3",
          key2: "value2",
        },
      };
      console.log('An order orderOptions:', orderOptions);
      const paymentOrder = await instance.orders.create(orderOptions);
      order.paymentMethod = paymentMethod;
      order.paymentID = paymentOrder.id;
      order.receipt = paymentOrder.id;
      orderOptions.receipt = paymentOrder.id;
console.log("paymentOrder",paymentOrder);
      user.orders.push(...order);
      await user.save();
      for (const item of cartItems) {
        await ProductModel.updateOne(
          { _id: item.productId }, // Use the productId
          { $inc: { quantity: -item.quantity } }
        );
      }
      user.cart = [];
      await user.save();
      return res.json(paymentOrder);
    }
  } catch (error) {
    console.error('An error occurred', error);
    res.status(500).json({ error: 'An error occurred' });
    next(error);
  }
};

const verifyPayment = async (req, res) => {
  console.log("verifyPaymentverifyPayment");
  try {
    const { paymentMethod, order } = req.body;
    console.log("verifyPayment paymentMethod",paymentMethod);
    console.log("verifyPayment",order);

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentMethod;
    // Verify the payment signature
    const signature = crypto.createHmac('sha256', 'jhrIwbh7rjyqsV6ixY4yCQMM')
      .update(`${order.id}|${razorpay_payment_id}`)
      .digest('hex');
    if (signature !== razorpay_signature) {
      console.error('Payment verification failed');
      return res.status(400).json({ error: 'Payment verification failed' });
    }
    // Mark the order as paid and update the payment details
    const user = await User.findOneAndUpdate(
      { 'orders.paymentID': order.paymentID },
      {
        $set: {
          'orders.$.status': 'paid',
          'orders.$.paymentDetails': {
            razorpayPaymentID: razorpay_payment_id,
            razorpayOrderID: razorpay_order_id,
            razorpaySignature: razorpay_signature
          }
        }
      },
      { new: true }
    );

    if (!user) {
      console.error('User not found');
      return res.status(400).json({ error: 'User not found' });
    }

    console.log('Payment verification successful');
    res.json({ message: 'Payment verification successful' });
  } catch (error) {
    console.error('An error PaymentPayment occurred', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const getOrderList = async (req, res, next) => {
  try {
    const { number } = req.session;
    const users = await User.find({ number: req.session.number });
    const categories = await CategoryModel.find({});
    const products = await ProductModel.find({});
    
    if (users.length === 0) {
      console.log("No user");
      return res.redirect('/');
    }

    const user = users[0];
    const productId = await User.find().populate('orders.product');

    const processedOrderList = [];

    for (const user of productId) {
      for (const order of user.orders) {
        const productID = order.product;
        const processedOrder = {
          id: order._id,
          numbers: order.numbers,
          status: order.status,
          date: order.date,
          time: order.time,
          ETA: order.ETA,
          address: order.address,
          paymentMethod: order.paymentMethod,
          paymentID: order.paymentID,
          amount: order.amount,
          product: productID,
        };
    
        const productList = await ProductModel.findById(productID);
        if (productList) {
          const processedProduct = {
            _id: productList._id,
            quantity: productList.quantity,
            description: productList.description,
            itemImage: productList.itemImage[0],
            Model: productList.Model,
            SellPrice: productList.SellPrice,
          };
          processedOrder.product = processedProduct;
        }
    
        processedOrderList.push(processedOrder);
      }
    }
    const productNames = products.map(product => product.Model);
    const categoryNames = categories.map(category => category.title);
    res.render('orderList', { 
      orderList: processedOrderList,
        user, 
        admin: false,
        productNames: JSON.stringify(productNames),
        categoryNames: JSON.stringify(categoryNames),
      });
} catch (err) {
    console.log("errerrerr", err);
    next(err);
  }
}


const getUserProfile = async (req, res, next) => {  try {
  const { number } = req.session;
  const users = await User.find({ number: req.session.number });
  const user = await User.findOne({ number }).populate('address');
  const categories = await CategoryModel.find({});
  const products = await ProductModel.find({});
  if (!user) {
    console.log("No user");
    return res.redirect('/');
  }
  const cartItems = await User.aggregate([
    {
      $match: { number: number }
    },
    {
      $unwind: "$cart"
    },
    {
      $lookup: {
        from: "products",
        let: { productId: { $toObjectId: "$cart.id" } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$productId"] }
            }
          },
          {
            $project: {
              _id: 1,
              SellPrice: 1,
              OfferedPrice: 1,
              Model:1,
              quantity:1,
              itemImage:1,
            }
          }
        ],
        as: "product"
      }
    },
    {
      $project: {
        _id: 0,
        quantity: "$cart.quantity",
        SellPrice: { $arrayElemAt: ["$product.SellPrice", 0] },
        OfferedPrice: { $arrayElemAt: ["$product.OfferedPrice", 0] },
        Model: { $arrayElemAt: ["$product.Model", 0] },
        cartSellPrice: "$cart.SellPrice",
        cartOfferedPrice: "$cart.OfferedPrice",
        amount: { $multiply: ["$cart.quantity", "$cart.SellPrice"] },
        itemImage: { $arrayElemAt: ["$product.itemImage", 0] }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        cartItems: { $push: "$$ROOT" }
      }
    },
  ]);
  const ordersList = await User.aggregate([
    {
      $match: { number: number }
    },
    {
      $unwind: "$orders"
    },
    {
      $lookup: {
        from: "products",
        let: { productId: { $toObjectId: "$orders.id" } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$productId"] }
            }
          },
          {
            $project: {
              _id: 1,
              SellPrice: 1,
              OfferedPrice: 1,
              Model: 1,
              itemImage: 1
            }
          }
        ],
        as: "product"
      }
    },
    {
      $project: {
        _id: 0,
        id: "$orders.id",
        numbers: "$orders.numbers",
        status: "$orders.status",
        date: "$orders.date",
        time: "$orders.time",
        ETA: "$orders.ETA",
        address: "$orders.address",
        paymentMethod: "$orders.paymentMethod",
        paymentID: "$orders.paymentID",
        amount: "$orders.amount",
      }
    }
  ]);
  const productNames = products.map(product => product.Model);
  const categoryNames = categories.map(category => category.title);

  const address = user.address;
  console.log("address",address);

  res.render('UserProfile', {
    ordersList,
    address: address,
    admin: false,
    users: users,
    cartItems: cartItems.length > 0 ? cartItems[0].cartItems : [],
    totalAmount: cartItems.length > 0 ? cartItems[0].totalAmount : 0,
    productNames: JSON.stringify(productNames),
    categoryNames: JSON.stringify(categoryNames),
  });
} catch (err) {
  console.log(err);
  res.redirect('/UserProfile');
}
};


const cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    console.log("orderId",orderId);
    // Find the user by ID
    const user = await User.findOne({ 'orders.id': orderId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Find the order in the user's orders array
    const order = user.orders.find((order) => order.id === orderId);
    console.log("order",order);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }
    // Optionally, update the product quantities and total amount
    await updateProductQuantities(order);
    // Update the order status to 'cancelled'
    order.status = 'cancelled';
    // Save the updated user
    await user.save();
    // Return a success response
    return res.json({ success: true });
  } catch (error) {
    console.error('An error occurred', error);
    res.status(500).json({ error: 'An error occurred' });
    next(error);
  }
};


const allProducts = async (req, res, next) => {
  try {
    const categoryID = req.query.categoryID;
    const categories = await CategoryModel.find({});
    const products = await ProductModel.find({});
  
    let productsList = [];
    if (categoryID) {
      productsList = await ProductModel.find({ category: categoryID });
    } else {
      productsList = await ProductModel.find({});
    }

    if (categoryID && productsList.length === 0) {
      const error = new Error('Product not found');
      error.status = 404;
      return res.status(404).render('error', { message: 'Product not found', error });
    }

    const currentDate = new Date();

    // Find the applicable offer
    const offer = await OfferModel.findOne({
      products: categoryID || null, // Use categoryID if provided, otherwise null for all products
      startTime: { $lte: currentDate },
      endTime: { $gte: currentDate },
    });

    if (offer) {
      if (offer.priceType === 'percentage') {
        products.forEach((product) => {
          const finalOfferedPrice = product.OfferedPrice - (offer.price / 100) * product.OfferedPrice;
          product.OfferedPrice = finalOfferedPrice;
        });
      } else if (offer.priceType === 'fixed') {
        products.forEach((product) => {
          const finalOfferedPrice = product.OfferedPrice - offer.price;
          product.OfferedPrice = finalOfferedPrice;
        });
      } else {
        console.log('Invalid price type selected.');
      }
    }   

    const productNames = products.map(product => product.Model);
    const categoryNames = categories.map(category => category.title);
    res.render('shop', {
      offer,
      admin: false,
      categories,
      products,
      productsList,
      categoryID: req.query.categoryID,
      productNames: JSON.stringify(productNames),
      categoryNames: JSON.stringify(categoryNames),
    });
  } catch (err) {
    next(err);
  }
};

// Route to trigger a 500 error (if needed)
const triggerError500 = (req, res, next) => {
  try {
    throw new Error('This is a simulated 500 error');
  } catch (err) {
    next(err);
  }
};

// errorHandlers.js
const handle404Error = (req, res, next) => {
  res.status(404).render('server404');
};


module.exports = { 
  handle404Error,
  renderHomePage,renderproductPage,
  getCart, getCheckOut,
  postCart,deleteCart,
  postAddressSave,
  postEditAddress,geteditAddress,
  deleteAddress,updateCartItem,
  postShippingAddress,getShippingAddress,
  postPlaceOrder, getThankYou,
  verifyPayment,getOrderList,
  getUserProfile, 
  cancelOrder,
  allProducts,
  triggerError500,
  handleGetProductDetails, getProductDetailsRoute
};
