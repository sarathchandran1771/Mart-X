const express = require('express');
const router = express.Router();

// Sample product data
let products = [];

/* GET home page. */
const ProductModel =  require('../models/productsModel');
const CategoryModel = require('../models/categoryModel');
const User = require('../models/user');
const userController = require('../controller/UserController/userController');
const AuthControllers = require('../controller/AuthController/AuthController');
const offerController = require('../controller/adminController/offerController');
  

router.get('/verifyOTP',AuthControllers.authuserGet);
router.post('/verifyOTP', AuthControllers.authUserPost);

router.post('/generateOTP', AuthControllers.authPost);

router.get("/userLogin", AuthControllers.getUserLogin);
router.post("/userLogin", AuthControllers.postLogin)
router.post('/generateLoginOTP',AuthControllers.authLoginPost);
router.get('/verifyLoginOTP',AuthControllers.authUserLoginGet);
router.post('/verifyLoginOTP', AuthControllers.authUserLoginPost);


router.get("/userSignup", AuthControllers.getUserSignup);
router.post("/userSignup", AuthControllers.postSignup);


router.get('/logout', AuthControllers.getLogout);

// HomePage
router.get('/', userController.renderHomePage);




// detail---
router.get('/detail', userController.renderproductPage);

// cart---
router.get('/cart', userController.getCart);

router.post('/cart', userController.postCart);

router.post('/updateCartItem', userController.updateCartItem);

router.get('/delete-cartItem/:id', userController.deleteCart);

// checkOut---
router.get('/checkOut', userController.getCheckOut);

router.post('/checkOut', userController.postAddressSave);

router.get('/checkOut', userController.getShippingAddress);

// ShippingAddress---
router.post('/edit-address/:id', userController.postEditAddress);

router.get('/edit-address/:id', userController.geteditAddress);

router.get('/delete-address/:id', userController.deleteAddress);

router.post('/saveShippingAddress', userController.postShippingAddress);


router.post('/postPlaceOrder', userController.postPlaceOrder);

// Order_Success---
router.get('/thankYou', userController.getThankYou);

// verifyPayment
router.get('/verifyPayment',userController.verifyPayment);

// orderList---
router.get('/orderList',userController.getOrderList);

router.get('/UserProfile',userController.getUserProfile);

// order cancel
router.patch('/cancelOrder/:orderId/cancel', userController.cancelOrder);

// Route to get the updated order details after order cancellation
router.get('/shop', userController.allProducts);


// coupon---

router.post('/applycoupon',offerController.applycoupon);


module.exports = router;

