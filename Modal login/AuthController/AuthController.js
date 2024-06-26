const express = require('express');
const session = require('express-session');
const router = express.Router();
const jwt = require('jsonwebtoken');
const accountSid = "ACf15b330146c8ba15b1ac9a7b1411d2a9";
const authToken = "3e9bc044c74b964f5ee13d05d7df92b6";
const client = require("twilio")(accountSid, authToken);
const User = require('../../models/user');
const ProductModel  =  require('../../models/productsModel');
const CategoryModel = require('../../models/categoryModel');

router.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));


const authPost = async (req, res) => {
  try {
    const generatedOTP = Math.floor(Math.random() * 8999 + 1000);
    req.session.OTP = generatedOTP;
    console.log("OTP from /:", req.session.OTP);
    const username =  req.body.username;
    req.session.username = username
    const phoneNumber = "+91" + req.body.number;
    req.session.number = phoneNumber
    console.log("phoneNumber", phoneNumber);
 
    // await client.messages.create({
    //   body: `Your OTP verification for MartX.com is ${generatedOTP}`,
    //   to: phoneNumber,
    //   from: "+14177945664",
    // });
    req.session.storedOTP = generatedOTP;
    res.redirect('/verifyOTP');
    console.log("Message sent successfully");
  } catch (err) {
    console.error(err, "Error");
  }
};

const authUserPost = async (req, res) => {
  try {
    const enteredOTP = Object.values(req.body.otp);
    console.log("enteredOTP", enteredOTP);
    const storedOTP = req.session.storedOTP;
    const username = req.session.username;
    const number = req.session.number;
    const enteredOTPString = enteredOTP.join("");
    const storedOTPString = storedOTP.toString();
    if (enteredOTPString === storedOTPString) {
      req.session.isAuthenticated = true;
      const user = new User({
        username: username,
        storedOTP: storedOTP,
        isAdmin: req.body.username === 'admin',
        number: number // Save the number if it is provided in the request body
      });
      if (req.body.number) {
        user.number = req.body.number;
      }  
      await user.save();
      console.log("User saved:", user);
      res.redirect('/');
    } else {
      console.log("Invalid OTP");
      res.render('partials/user-partials', { error: true});
    }
  } catch (error) {
    console.error("Error retrieving OTP from database:", error);
    res.render('partials/user-partials', { error: true});
  }
}; 


const authuserGet = async (req, res) => {
  res.render('partials/user-partials', { error: false });
};



const getUserSignup = async (req, res) => {
  res.render('userSignup');
};

const postSignup = async (req, res) => {
  const { username, password, number, otp } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.redirect('/userLogin');
    } else {
      const newUser = new User({ username });  
      if (password) {
        newUser.password = password;
      } else if (number && otp) {
        newUser.number = number;
        newUser.storedOTP = otp.join('');
      }   
      await newUser.save();
      req.session.userId = newUser._id;
      res.redirect('/');
    }
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
};

const authLoginPost = async (req, res) => {
  try {
    const generatedOTP = Math.floor(Math.random() * 8999 + 1000);
    req.session.OTP = generatedOTP;
    console.log("OTP from /:", req.session.OTP);
    const username =  req.body.username;
    req.session.username = username
    const phoneNumber = "+91" + req.body.number;
    req.session.number = phoneNumber
    console.log("phoneNumber", phoneNumber);

    // await client.messages.create({
    //   body: `Your OTP verification for MartX.com is ${generatedOTP}`,
    //   to: phoneNumber,
    //   from: "+14177945664",
    // });
    req.session.storedOTP = generatedOTP;
    res.json({ success: true }); // Return the response as JSON object
    console.log("Message sent successfully");
  } catch (err) {
    res.status(500).json({ success: false, error: err.message }); // Return the error response as JSON object
  }
};

const authUserLoginGet = async (req, res) => {
  const categories = await CategoryModel.find({});
  const products = await ProductModel.find({});
  console.log("authUserLoginGet true");
  res.render('index',{categories, 
    products});
};

const authUserLoginPost = async (req, res) => {
  try {
    const enteredOTP = Object.values(req.body); // Updated this line
    console.log("enteredOTP", enteredOTP);
    const storedOTP = req.session.storedOTP;
    const enteredOTPString = enteredOTP.join(""); // Updated this line
    const storedOTPString = storedOTP.otp.toString(); // Updated this line

    if (enteredOTPString === storedOTPString) {
      console.log("isAuthenticated true");
      req.session.isAuthenticated = true;
      const existingUser = await User.findOne({ number: storedOTP.number }); // Updated this line
      if (existingUser) {
        console.log("existingUser LoggedIn");
        res.redirect('/');
      } else {
        const newUser = new User({
          storedOTP: storedOTP,
          isAdmin: req.body.username === 'admin',
          number: storedOTP.number // Updated this line
        });
        await newUser.save();
        console.log("User saved:", newUser);
        res.redirect('/');
      }
    } else {
      console.log("Invalid OTP");
      res.redirect('/partials/user-partials'); // Modify this to the appropriate URL that displays the error alert
    }
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.number) {
      console.error("Number already exists:", storedOTP.number);
      res.render('partials/user-partials', { error: true });
    } else {
      console.error("Error retrieving OTP from database:", error);
      res.render('partials/user-partials', { error: true });
    }
  }
};


const getUserLogin = async (req, res) => {
  console.error("getUserLogin");
  res.render('index', { error: false }); // Render the main page that includes the login modal
};

const postLogin = async (req, res) => {
  const { number, otp } = req.body;
  try {
    const existingUser = await User.findOne({ number });
    if (existingUser) {
      if (existingUser.storedOTP === otp.join('')) {
        req.session.userId = existingUser._id;
        console.error("postLogin");
        res.redirect('/');
      } else {
        res.render('partials/user-partials/verifyLoginOTP', { error: true }); // Render the login modal with the error message
      }
    } else {
      // New number, no need to save in DB for validation only
      req.session.tempNumber = number;
      req.session.tempOTP = otp.join('');
      console.error("else  postLogin");
      res.redirect('/');
    }
  } catch (error) {
    console.error(error);
    res.render('partials/user-partials/verifyLoginOTP', { error: true }); // Render the login modal with the error message
  }
};

const getLogout = (req, res) => {
  // Destroy the session and log out the user
  console.log("getLogout");
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect('/');
  });
};







module.exports = { 
  router,
  postSignup,getUserSignup,
  getUserLogin,postLogin,
  authuserGet,authUserPost,authPost,
  getLogout,
  authLoginPost,authUserLoginGet,authUserLoginPost
};
