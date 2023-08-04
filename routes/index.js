const express = require('express');
const userRouter = express.Router();

// Sample product data
let products = [];

/* GET home page. */
const ProductModel =  require('../models/productsModel');
const CategoryModel = require('../models/categoryModel');
const User = require('../models/user');
const userController = require('../controller/UserController/userController');
const AuthControllers = require('../controller/AuthController/AuthController');
const offerController = require('../controller/adminController/offerController');
const { errorHandler } = require('../middleware/errorHandler');


userRouter.get('/verifyOTP',AuthControllers.authuserGet);
userRouter.post('/verifyOTP', AuthControllers.authUserPost);

userRouter.post('/generateOTP', AuthControllers.authPost);

userRouter.get("/userLogin", AuthControllers.getUserLogin);
userRouter.post("/userLogin", AuthControllers.postLogin)
userRouter.post('/generateLoginOTP',AuthControllers.authLoginPost);
userRouter.get('/verifyLoginOTP',AuthControllers.authUserLoginGet);
userRouter.post('/verifyLoginOTP', AuthControllers.authUserLoginPost);


userRouter.get("/userSignup", AuthControllers.getUserSignup);
userRouter.post("/userSignup", AuthControllers.postSignup);


userRouter.get('/logout', AuthControllers.getLogout);

// HomePage
userRouter.get('/', userController.renderHomePage);




// detail---
userRouter.get('/detail', userController.renderproductPage);

// cart---
userRouter.get('/cart', userController.getCart);

userRouter.post('/cart', userController.postCart);

userRouter.post('/updateCartItem', userController.updateCartItem);

userRouter.get('/delete-cartItem/:id', userController.deleteCart);

// checkOut---
userRouter.get('/checkOut', userController.getCheckOut);

userRouter.post('/checkOut', userController.postAddressSave);

userRouter.get('/checkOut', userController.getShippingAddress);

// ShippingAddress---
userRouter.post('/edit-address/:id', userController.postEditAddress);

userRouter.get('/edit-address/:id', userController.geteditAddress);

userRouter.get('/delete-address/:id', userController.deleteAddress);

userRouter.post('/saveShippingAddress', userController.postShippingAddress);


userRouter.post('/postPlaceOrder', userController.postPlaceOrder);

// Order_Success---
userRouter.get('/thankYou', userController.getThankYou);

// verifyPayment
userRouter.get('/verifyPayment',userController.verifyPayment);

// orderList---
userRouter.get('/orderList',userController.getOrderList);

userRouter.get('/UserProfile',userController.getUserProfile);

// order cancel
userRouter.patch('/cancelOrder/:orderId/cancel', userController.cancelOrder);

// Route to get the updated order details after order cancellation
userRouter.get('/shop', userController.allProducts);

// coupon---
userRouter.post('/applycoupon',offerController.applycoupon);

userRouter.get('/handle404Error', errorHandler, userController.handle404Error);

userRouter.get('/triggerError500', userController.triggerError500);


module.exports = userRouter;



