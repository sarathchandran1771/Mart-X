const express = require('express');
const adminRouter = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const storage = multer.diskStorage({
  destination: './public/uploads/categoryUpload/',
  filename: function (req, file, cb) {
    const uniqueID = uuidv4(); // Generate unique ID
    const extension = path.extname(file.originalname);
    cb(null, uniqueID + extension);
  }
});
const upload = multer({storage: storage}).single('productImage');



const additionalImagesStorage = multer.diskStorage({
  destination: './public/uploads/productUpload',
  filename: function (req, file, cb) {
    const uniqueID = uuidv4(); 
    const extension = path.extname(file.originalname);
    cb(null, uniqueID + extension);
  }
});
const uploads = multer({ storage: additionalImagesStorage }).array('additionalImages', 5*1024*1024);

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads/BannerImage/'); // Store the uploaded images in the 'uploads' directory
  },
   filename: function (req, file, cb) {
      cb(null, `${Date.now()}.${file.originalname}`);
    },
  });

// Initialize Multer upload with the defined storage settings
const uploadBanner = multer({ storage: bannerStorage });



const CategoryModel = require('../models/categoryModel');

const ProductModel =  require('../models/productsModel');

const OfferModel = require('../models/offers');

const couponModel = require('../models/coupon');

const bannerModel = require("../models/banner")

const { errorHandler } = require('../middleware/errorHandler');


const adminController = require('../controller/adminController/adminController');

const offerController = require('../controller/adminController/offerController');

adminRouter.get('/', adminController.getIndex);

 adminRouter.get('/admin/signin', adminController.getAdminDashboard);

// adminRouter.get('/admin/signin', adminController.getLogin);

// adminRouter.post('/signin', adminController.postLogin);
adminRouter.post("/signin",adminController.postIndex);


adminRouter.get('/logout', adminController.logout);


adminRouter.get('/orderManagement',adminController.getOrderManagement);
adminRouter.patch('/updateOrderStatus/:orderId', adminController.updateOrderStatus);



adminRouter.get('/reviews',adminController.getAdminReviews)

adminRouter.get('/category', adminController.getCategory);

// adminRouter.get('/edit-product/:id', adminController.getEditProduct);

adminRouter.get('/items',adminController.getItems);

adminRouter.patch('/items/:id', adminController.updateProductStatus);

adminRouter.patch('/userManagement/:id', adminController.updateUsertatus);

adminRouter.get('/delete-product/:id', adminController.getdeleteProduct);


adminRouter.get('/edit-newItem/:id', adminController.geteditNewItem);

adminRouter.post('/edit-category/:id', adminController.posteditCategory);

adminRouter.post('/edit-product/:id', adminController.postEditItem);

adminRouter.post('/category',upload,adminController.createCategory);

adminRouter.post('/items',uploads,adminController.postCreateItem);

adminRouter.get('/delete-product/:id', adminController.updateCategorytatus);

adminRouter.get('/userManagement', adminController.getUserdetails);

adminRouter.post('/userManagement', adminController.postUserDetails);



adminRouter.get('/adminIndex',adminController.getAdminDashboard);

adminRouter.get('/coupon',offerController.getAdminCoupon);

adminRouter.post('/addcoupon',offerController.createCoupon);

adminRouter.post('/addProductOffer',offerController.productOffer);

adminRouter.post('/addategoryOffer',offerController.createCategoryOffer);



adminRouter.get('/applyOffer',offerController.getProductOffer);

adminRouter.get('/sales-report-pdf',adminController. downloadSalesReportPDF);

// Separate route to trigger PDF download
adminRouter.get('/download-sales-report-pdf', adminController.handleDownloadSalesReportPDF);

adminRouter.get('/dashboard',adminController.adminSortSalesData);


adminRouter.get("/addBanner",adminController.getBanner)
adminRouter.post("/addBanner", uploadBanner.single('banner'), adminController.postBanner)
adminRouter.post('/edit-banner/:id', uploadBanner.single('banner'), adminController.postEdit)
adminRouter.get("/delete-banner/:id",adminController.deleteBanner)

// Add the errorHandler middleware at the end of the middleware stack 
adminRouter.use(errorHandler);
adminRouter.use((req, res, next) => {
    res.status(404).render('server404'); // Render server404.ejs for all 404 errors
  });
  
adminRouter.get('/triggerError500', adminController.triggerError500);



module.exports = adminRouter;
