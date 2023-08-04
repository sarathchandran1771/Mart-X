const express = require('express');
const session = require('express-session');
const router = express.Router();
const User = require('../../models/user');
const ProductModel  =  require('../../models/productsModel');
const CategoryModel = require('../../models/categoryModel');
const OfferModel = require('../../models/offers');
const couponModel = require('../../models/coupon');




const getAdminCoupon = async (req, res, next) => {
    try {
        console.log("Get productOffer try");
        const product = await ProductModel.find({});
        const categories = await CategoryModel.find({});
        const offers = await OfferModel.find({});
        const coupon = await couponModel.find({});

    
        res.render('coupon', { coupon, offers, product, categories, layout: "admin_Layout", adminIndex: true });
      } catch (err) {
        console.log("Get item err");
      }
  };

  const createCoupon = async (req, res, next) => {
    try {
      const { 
        name,
        voucherCode,
        price,
        description
    } = req.body;
      const couponList = new couponModel({
        name: name,
        voucherCode: voucherCode,
        price: price,
        description: description
      });
      console.log("createCoupon",couponList);

      await couponList.save();
      res.redirect('/admin/coupon');
    } catch (err) {
      console.error('Error saving createCoupon:', err);
      req.flash('error', 'Error saving createCoupon');
      res.redirect('/admin');
    }
  };

  const productOffer = async (req, res, next) => {
    try {
      const {
        category,
        products,
        name,
        price,
        priceType,
        minSpent,
        usageLimit,
        voucherCode,
        startTime,
        endTime,
      } = req.body;
      // Check if priceType is either 'flat' or 'percentage'
      if (priceType !== 'flat' && priceType !== 'percentage') {
        throw new Error('Invalid priceType. Must be either "flat" or "percentage".');
      }
      const productOfferData = {
        category: category,
        products: products,
        name: name,
        price: price,
        priceType: priceType,
        minSpent: minSpent,
        usageLimit: usageLimit,
        voucherCode: voucherCode,
        startTime: startTime,
        endTime: endTime,
      };
      const newProductOffer = new OfferModel(productOfferData);  
      await newProductOffer.save();
      req.flash('success', 'ProductOffer added successfully!');
      res.redirect('/admin/coupon');
    } catch (err) {
      console.error('Error saving ProductOffer:', err);
      req.flash('error', 'Error saving ProductOffer');
      res.redirect('/admin');
    }
  };
  
  const createCategoryOffer = async (req, res, next) => {
    try {
        const {
            category,
            products,
            name,
            price,
            priceType,
            minSpent,
            usageLimit,
            voucherCode,
            startTime,
            endTime,
          } = req.body;
      
          if (priceType !== 'flat' && priceType !== 'percentage') {
            throw new Error('Invalid priceType. Must be either "flat" or "percentage".');
          }
      
          const categoyOfferList = {
            category: category,
            products: products,
            name: name,
            price: price,
            priceType: priceType,
            minSpent: minSpent,
            usageLimit: usageLimit,
            voucherCode: voucherCode,
            startTime: startTime,
            endTime: endTime,
          };

    const categoyOffer = new OfferModel(categoyOfferList);
      await categoyOffer.save();
      req.flash('success', 'createCoupon added successfully!');
      res.redirect('/admin/coupon');
    } catch (err) {
      console.error('Error saving createCoupon:', err);
      req.flash('error', 'Error saving createCoupon');
      res.redirect('/admin');
    }
  };

const applycoupon = async (req, res, next) => {
  try {
    const enteredCouponCode = req.body.couponCode;
    const { number } = req.session;
    console.log("couponCode", enteredCouponCode);
    const users = await User.find({ number: req.session.number });
    const dbCoupon = await couponModel.findOne({ voucherCode: enteredCouponCode });

    if (!users) {
      // User not found
      return res.redirect('/');
    }

    // Fetch the cart items along with the relevant product details
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
          OfferedPrice: { $arrayElemAt: ["$product.OfferedPrice", 0] }
        }
      },
    ]);

    // Apply offers to cart items
    for (const cartItem of cartItems) {
      const productIdsInCart = [cartItem.productID];
      const offer = await OfferModel.findOne({ products: { $in: productIdsInCart } });

      if (offer) {
        const productPrice = cartItem.SellPrice;

        if (offer.priceType === 'percentage') {
          const reducedPrice = productPrice - (offer.price / 100) * productPrice;
          cartItem.productOfferedPrice = reducedPrice;
        } else if (offer.priceType === 'fixed') {
          const reducedPrice = productPrice - offer.price;
          cartItem.productOfferedPrice = reducedPrice;
        } else {
          // Handle invalid price types here
          console.log('Invalid price type in offer.');
          cartItem.productOfferedPrice = productPrice;
        }
      } else {
        // If no offer is found, set the productOfferedPrice to the original OfferedPrice
        cartItem.productOfferedPrice = cartItem.OfferedPrice;
      }
    }

    // Now that we have the updated cart items with the correct productOfferedPrice, we can calculate the discounted total.
    let discountedTotal = 0;
    for (const cartItem of cartItems) {
      discountedTotal += cartItem.productOfferedPrice * cartItem.quantity;
    }

    // Apply the coupon discount to the discounted total
    if (!dbCoupon) {
      console.log("Coupon not found");
      return res.json({ success: false, message: "Invalid coupon code. Please try again." });
    }

    const now = new Date();

    if (now > dbCoupon.endDate) {
      return res.json({ success: false, message: 'Coupon has expired.' });
    }

    const discountPrice = dbCoupon.price;
    const totalAmount = discountedTotal;
    const discountAmount = totalAmount - discountPrice;

    // Check if the total amount is greater than or equal to 1000
    if (totalAmount < 1000) {
      console.log("Total amount should be at least 1000 to apply the coupon");
      return res.json({ success: false, message: "Total amount should be at least 1000 to apply the coupon" });
    }

    // Return the success response with the discounted total and the cart items
    return res.json({ success: true, discountedTotal, cartItems });

  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.json({ success: false, message: "An error occurred while applying the coupon. Please try again later." });
  }
};


  // const applycoupon = async (req, res, next) => {
  //   try {
  //     const enteredCouponCode = req.body.couponCode;
  //     const { number } = req.session;
  //     console.log("couponCode", enteredCouponCode);
  //     const users = await User.find({ number: req.session.number });
  //     const dbCoupon = await couponModel.findOne({ voucherCode: enteredCouponCode });

  //     if (!users) {
  //       // User not found
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
  //                 cartSellPrice:1,
  //                 cartOfferedPrice:1,
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
  //           cartSellPrice: "$cart.SellPrice",
  //           cartOfferedPrice: "$cart.OfferedPrice",
  //         }
  //       },
  
  //     ]);
  //     let productOfferedPrice
  //     let productquantity
  //     for (const cartItem of cartItems) {
  //       productOfferedPrice = cartItem.OfferedPrice;
  //       productquantity = cartItem.quantity
  //      console.log("reducedOfferedPrice:", productOfferedPrice);
  //      console.log("cartItems:", cartItem);
  //     }

  //     if (!dbCoupon) {
  //       console.log("Coupon not found");
  //       return res.json({ success: false, message: "Invalid coupon code. Please try again." });
  //     }

  //     const now =new Date()
      
  //     if (now > dbCoupon.endDate) {
  //       return res.json({ success: false, message: 'Coupon has expired.' });
  //     }

  //     const discountPrice = dbCoupon.price;
  //     const totalAmount = productOfferedPrice * productquantity;
  //     const discountAmount = (totalAmount - discountPrice)
  //     const discountedTotal = discountAmount;
  
  //     console.log("Discounted total:", discountedTotal);
  //     if (totalAmount < 10000) {
  //       console.log("Total amount should be at least 1000 to apply the coupon");
  //       return res.json({ success: false, message: "Total amount should be at least 1000 to apply the coupon" });
  //     }
  //   //   users.usedCoupons.push(dbCoupon._id);
  //   // await users.save();
  
  //     return res.json({ success: true, discountedTotal,cartItems:cartItems });
  
  //   } catch (error) {
  //     console.error("Error applying coupon:", error);
  //     return res.json({ success: false, message: "An error occurred while applying the coupon. Please try again later." });
  //   }
  // };

  // const Coupon = async (req, res, next) => {
  //     try {
  //       const { couponCode } = req.body;
  //       const { number } = req.session;
  //       const users = await User.find({ number: req.session.number });
  //       const user = await User.findOne({ number }).populate('address');
  //       const couponDetails = await couponModel.findOne({ voucherCode: couponCode });
  //       const categories = await CategoryModel.find({});
  //       const products = await ProductModel.find({})


  //       if (!user) {
  //         console.log("No user");
  //         return res.redirect('/');
  //       }
  //       const productId = req.query.productId;

  //       const cartItems = await User.aggregate([
  //         {
  //           $match: { number: number }
  //         },
  //         {
  //           $unwind: "$cart"
  //         },
  //         {
  //           $lookup: {
  //             from: "products",
  //             let: { productId: { $toObjectId: "$cart.id" } },
  //             pipeline: [
  //               {
  //                 $match: {
  //                   $expr: { $eq: ["$_id", "$$productId"] }
  //                 }
  //               },
  //               {
  //                 $project: {
  //                   _id: 1,
  //                   SellPrice: 1,
  //                   OfferedPrice: 1,
  //                   Model:1,
  //                 }
  //               }
  //             ],
  //             as: "product"
  //           }
  //         },
  //         {
  //           $project: {
  //             productID: { $arrayElemAt: ["$product._id", 0] },
  //             quantity: "$cart.quantity",
  //             SellPrice: { $arrayElemAt: ["$product.SellPrice", 0] },
  //             OfferedPrice: { $arrayElemAt: ["$product.OfferedPrice", 0] },
  //             Model: { $arrayElemAt: ["$product.Model", 0] },
  //             cartSellPrice: "$cart.SellPrice",
  //             cartOfferedPrice: "$cart.OfferedPrice",
  //             amount: { $multiply: ["$cart.quantity", "$cart.SellPrice"] }
  //           }
  //         },
  //       ]);
  //       const productNames = products.map(product => product.Model);
  //       const categoryNames = categories.map(category => category.title);
  //       const selectedAddress = user.address.id(user.shipping.shippingAddress);
  //       const address = user.address;

  //       let totalPrice = cartItems.length > 0 ? cartItems[0].totalAmount : 0;
  //       if (couponDetails) {
  //         totalPrice -= couponDetails.discountAmount;
  //       }
  //       const successMessage = req.flash('success');
       
  //       console.log("categoryNames ",categoryNames );

  //       res.render('checkOut', {
  //         admin: false,
  //         users: users,
  //         cartItems: cartItems.length > 0 ? cartItems[0].cartItems : [],
  //         totalAmount: cartItems.length > 0 ? cartItems[0].totalAmount : 0,
  //         productId: productId, // Pass the productId to the template
  //         totalAmount: totalPrice,
  //         successMessage: successMessage, 
  //         couponDetails:couponDetails,
  //         address: address, // Pass the `address` variable to the template
  //         selectedAddress: selectedAddress, // Pass the `selectedAddress` variable to the template
  //         productNames: JSON.stringify(productNames),
  //         categoryNames: JSON.stringify(categoryNames),
  //       });
  //     } catch (err) {
  //       console.log(err);
  //       res.redirect('/checkOut');
  //     }
  //   };

    // const categories = await CategoryModel.find({});
    // const products = await ProductModel.find({})
    // productNames: JSON.stringify(productNames),
    // categoryNames: JSON.stringify(categoryNames),
    // const productNames = products.map(product => product.Model);
    // const categoryNames = categories.map(category => category.title);

    const getProductOffer = async (req, res, next) => {
      try {
        const productId = req.query.productId;
        const product = await ProductModel.findById(productId);
        const totalAmount = calculateTotalAmount(product);
    
        const offer = await OfferModel.findOne({
          category: product.category,
          products: product._id,
          startTime: { $lte: new Date() },
          endTime: { $gte: new Date() },
        });
    
        if (offer && totalAmount >= offer.minSpent) {
          // Apply the offer based on the offer type (flat or percentage)
          let newTotalAmount;
          if (offer.priceType === 'percentage') {
            const discountAmount = totalAmount * (offer.price / 100);
            newTotalAmount = totalAmount - discountAmount;
          } else {
            newTotalAmount = totalAmount - offer.price;
          } 
          // Respond with the new total amount
          res.json({ newTotalAmount: newTotalAmount.toFixed(2) });
        } else {
          // If the offer cannot be applied, return the original total amount
          res.json({ newTotalAmount: totalAmount.toFixed(2) });
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
    
  module.exports = {
    getAdminCoupon,
    createCoupon,
    productOffer,
    createCategoryOffer,
    applycoupon,getProductOffer
  };