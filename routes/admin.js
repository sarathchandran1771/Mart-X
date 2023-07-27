const express = require('express');
const router = express.Router();
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

const CategoryModel = require('../models/categoryModel');

const ProductModel =  require('../models/productsModel');

const OfferModel = require('../models/offers');

const couponModel = require('../models/coupon');



const adminController = require('../controller/adminController/adminController');

const offerController = require('../controller/adminController/offerController');


const adminMiddleWare = require('../middleware/adminMiddleWare/loginMiddleWare');


router.get('/', adminController.getIndex);

 router.get('/admin/signin', adminController.getAdminDashboard);

// router.get('/admin/signin', adminController.getLogin);

// router.post('/signin', adminController.postLogin);
router.post("/signin",adminController.postIndex);


router.get('/logout', adminController.logout);


router.get('/orderManagement',adminController.getOrderManagement);
router.patch('/updateOrderStatus/:orderId', adminController.updateOrderStatus);



router.get('/reviews',adminController.getAdminReviews)

router.get('/category', adminController.getCategory);

// router.get('/edit-product/:id', adminController.getEditProduct);

router.get('/items',adminController.getItems);

router.patch('/items/:id', adminController.updateProductStatus);

router.patch('/userManagement/:id', adminController.updateUsertatus);

router.get('/delete-product/:id', adminController.getdeleteProduct);


router.get('/edit-newItem/:id', adminController.geteditNewItem);

router.post('/edit-category/:id', adminController.posteditCategory);

router.post('/edit-product/:id', adminController.postEditItem);

router.post('/category',upload,adminController.createCategory);

router.post('/items',uploads,adminController.postCreateItem);

router.get('/delete-product/:id', adminController.updateCategorytatus);

router.get('/userManagement', adminController.getUserdetails);

router.post('/userManagement', adminController.postUserDetails);



router.get('/adminIndex',adminController.getAdminDashboard);

router.get('/coupon',offerController.getAdminCoupon);

router.post('/addcoupon',offerController.createCoupon);

router.post('/addProductOffer',offerController.productOffer);

router.post('/addategoryOffer',offerController.createCategoryOffer);



router.get('/applyOffer',offerController.getProductOffer);

router.get('/sales-report-pdf',adminController. downloadSalesReportPDF);

// Separate route to trigger PDF download
router.get('/download-sales-report-pdf', adminController.handleDownloadSalesReportPDF);

router.get('/dashboard',adminController.adminSortSalesData);
// adminRouter.post('/sort_sales_data',adminmiddlewear.adminlogin,adminController.adminSortSalesData);
module.exports = router;
