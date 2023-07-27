const express = require('express');
const session = require('express-session');
const router = express.Router();
const User = require('../../models/user');
const ProductModel  =  require('../../models/productsModel');
const CategoryModel = require('../../models/categoryModel');
const croppie= require('croppie')
const { format } = require('date-fns');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { log } = require('console');


const getIndex = async (req, res, next) => {
  try {
    res.render('signin', {layout:"admin_Layout",adminIndex:false, successMessage: req.flash('success'), errorMessage: req.flash('error') });
  } catch (err) {
    console.log(err);
  }
};


const getLogin = (req, res) => {

  res.render("signin",{layout:"admin_Layout",adminIndex:false})
};
const postIndex = async(req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log(req.body)
    if (username === 'admin' && password === 'admin') {
      req.session.isLoggedIn = true;
      
      const users = await User.find({});
            const orderList = [];
      
            for (const user of users) {
              const orders = user.orders;
      
              for (const order of orders) {
                const processedOrder = {
                  id: order.id,
                  numbers: order.numbers,
                  status: order.status,
                  date: order.date,
                  time: order.time,
                  ETA: order.ETA,
                  address: order.address,
                  paymentMethod: order.paymentMethod,
                  paymentID: order.paymentID,
                  amount: order.amount,
                  product: order.product
                };
      
                orderList.push(processedOrder);
                console.log("processedOrder", processedOrder);
              }
            }
      
            // Calculate the number of orders and total amount
            const numberOfOrders = orderList.length;
            const paymentMethodCounts = orderList.reduce((counts, order) => {
              if (order.paymentMethod === "COD") {
                counts.COD = (counts.COD || 0) + order.amount;
              } else if (order.paymentMethod === "Online") {
                counts.Online = (counts.Online || 0) + order.amount;
              }
              return counts;
            }, {});
            
            const totalAmountCOD = paymentMethodCounts.COD || 0;
            const totalAmountOnline = paymentMethodCounts.Online || 0;
            
            const totalAmount = totalAmountCOD + totalAmountOnline;
      
            // Prepare data for the chart
            const chartData = {
              labels: [`${numberOfOrders}`, 'Payment Method'],
              datasets: [
                {
                  label: `COD: ${totalAmountCOD || 0}`, 
                  data: ['', totalAmountCOD || 0],
                  backgroundColor: "rgba(235, 22, 22, .5)"
                },
                {
                  label: `Online: ${totalAmountOnline || 0}`,
                  data: ['', totalAmountOnline || 0], 
                  backgroundColor: "rgba(235, 22, 22, .3)"
                }
              ]
            };

      res.render('adminIndex', { 
        layout: "admin_Layout",
        adminIndex: true,
        orderList: JSON.stringify(orderList),
        chartData: JSON.stringify(chartData),
        totalAmount: totalAmount.toString(),
        numberOfOrders: numberOfOrders.toString(),
        codAmount: (paymentMethodCounts.COD || 0).toString(),
        onlineAmount: (paymentMethodCounts.Online || 0).toString(),
        successMessage: req.flash('success'),
        errorMessage: req.flash('error')
      }); // Redirect to adminIndex if authentication is successful
    } else {
      req.flash('error', 'Invalid username or password');
      res.redirect('/admin'); // Redirect back to the signin page if authentication fails
    }
  } catch (err) {
    console.log(err);
  }
};


const logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.clearCookie('user');
        const errorMessage = 'Logout Successfully';
        res.render('login', { error: errorMessage });
      }
    });
  };




const getItems = async (req, res, next) => {
  try {
    console.log("Get item try");
    const item = await ProductModel.find({});
    const categories = await CategoryModel.find({});
    res.render('items', { item, categories,layout:"admin_Layout",adminIndex:true });
  } catch (err) {
    console.log("Get item err");
  } 
};

const postCreateItem = async (req, res, next) => {
  try {
    const {
      category,
      SellPrice,
      OfferedPrice,
      Model,
      brand,
      varient,
      rating,
      description,
      quantity
    } = req.body;
    const itemImages = req.files.map(file => file.filename);
    const productList = new ProductModel({
      SellPrice: SellPrice,
      OfferedPrice: OfferedPrice,
      moreInfo: {
        brand: brand,
        varient: varient,
        rating: rating
      },
      Model: Model,
      itemImage: itemImages,
      description: description,
      quantity: quantity,
      category: category,
    });

    await productList.save();

    req.flash('success', 'Item added successfully!');
    res.redirect('/admin/items');
  } catch (err) {
    console.error('newItemPost error', err);
    req.flash('error', 'Error saving item');
    res.redirect('/admin/items');
  }
};


const updateProductStatus = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const isDeleted = req.body.isDeleted;
    console.log("productID", req.params.id);
    console.log("isDeleted", req.body.isDeleted);
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    product.isDeleted = isDeleted;
    await product.save();
    res.json({ message: 'Product status updated successfully' });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Error updating product status' });
  }
};

const updateCategorytatus = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const isDeleted = req.body.isDeleted;
    console.log("productID", req.params.id);
    console.log("isDeleted", req.body.isDeleted);
    const product = await CategoryModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    product.isDeleted = isDeleted;
    await product.save();
    res.json({ message: 'Product status updated successfully' });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Error updating product status' });
  }
};


const geteditNewItem = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const updateCategory = await CategoryModel.findById(productId);
    const updateProduct = await ProductModel.findById(productId);
    if (!updateCategory && !updateProduct) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin');
    }
    res.render('admin/items', { updateCategory, updateProduct, layout:"admin_Layout",adminIndex:true });
  } catch (error) {
    next(error);
  }
};

const postEditItem = async (req, res, next) => {
  try {
    
    const itemId = req.params.id;
    const {
      category,
      SellPrice,
      OfferedPrice,
      Model,
      brand,
      varient,
      rating,
      description,
      quantity
    } = req.body;
    console.log("body",req.body)
    const product = await ProductModel.findByIdAndUpdate(itemId);
    product.category = category;
    product.SellPrice = SellPrice;
    product.OfferedPrice = OfferedPrice;
    product.Model = Model;
    product.moreInfo.brand = brand;
    product.moreInfo.varient = varient;
    product.moreInfo.rating = rating;
    product.description = description;
    product.quantity = quantity;
    await product.save();
    req.flash('success', 'Item updated successfully!');
    res.redirect('/admin/items');
  } catch (err) {
    console.log("editItemPost error", err);
    req.flash('error', 'Error updating item');
    res.redirect('/admin/items');
  }
};

const getCategory = async (req, res, next) => {
  try {
    const products = await CategoryModel.find({});
    res.render('category', { products,layout:"admin_Layout",adminIndex:true });
  } catch (err) {
    console.log(err);
  }
};




const getEditProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await CategoryModel.findById(productId);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin');
    }
    res.render('admin', { product,layout:"admin_Layout",adminIndex:true });
  } catch (error) {
    next(error);
  }
};

const posteditCategory = async (req, res, next) => {
  try {
    console.log(req.body);
    const productId = req.params.id;
    const { title, icon } = req.body;
    const updatedProduct = { title, icon };

    const product = await CategoryModel.findByIdAndUpdate(productId, updatedProduct);

    if (!product) {
      req.flash('error', 'Product not found');
    } else {
      req.flash('success', 'Product updated successfully!');
    }

    res.redirect('/admin/category');
  } catch (error) {
    next(error);
  }
};

const getdeleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const result = await CategoryModel.deleteOne({ _id: productId });

    if (result.deletedCount === 0) {
      req.flash('error', 'Product not found');
    } else {
      req.flash('success', 'Product deleted successfully!');
    }

    res.redirect('/admin/category');
  } catch (error) {
    next(error);
  }
};

const getUserdetails = async (req, res, next) => {
  try {
    const users = await User.find({ isAdmin: false }, { username: 1, number: 1 });
    console.log("users",users);
    res.render('userManagement', { layout: "admin_Layout", adminIndex: true, users });
  } catch (error) {
    console.error(error);
    res.render('userManagement', { layout: "admin_Layout", adminIndex: true, error: true });
  }
};


const postUserDetails = async (req, res, next) => {
  res.render('userManagement');
} 


const createCategory = async (req, res, next) => {
  try {
    const { title } = req.body;
    const categoryImage = req.file.filename;
    const categoryList = new CategoryModel({
      title: title,
      image: categoryImage
    });
    await categoryList.save();
    req.flash('success', 'Category added successfully!');
    res.redirect('/admin/category');
  } catch (err) {
    console.error('Error saving category:', err);
    req.flash('error', 'Error saving category');
    res.redirect('/admin');
  }
};

const updateUsertatus = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const isDeleted = req.body.isDeleted;
    console.log("userId", req.params.id);
    console.log("isDeleted", req.body.isDeleted);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }
    user.isDeleted = isDeleted;
    await user.save();
    res.json({ message: 'user status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Error updating user status' });
  }
};

const updateOrderStatus = async (req, res, next) => {
  const orderId = req.params.orderId; // Update the variable name here to match the route parameter
  const newStatus = req.body.status;
  console.log("orderId", orderId); 
  console.log("newStatus", newStatus);

  try {
    const updatedOrder = await User.findOneAndUpdate(
      { 'orders._id': orderId },
      { $set: { 'orders.$.status': newStatus } },
      { new: true }
    );
    console.log("error", updatedOrder);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error("error", err);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
};



const getOrderManagement = async (req, res, next) => {
  try {
    const userList = await User.find().populate('orders.product');

    const processedOrderList = [];

    for (const user of userList) {
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
    
    console.log("orderItems",processedOrderList);
    res.render('orderManagement', {
      layout: "admin_Layout",
      adminIndex: true,
      orderList: processedOrderList,
    });
  } catch (err) {
    next(err);
  }
};





const getAdminReviews = async (req, res, next) => {
  res.render('reviews', { layout: "admin_Layout", adminIndex: true });
};


const getAdminDashboard = async (req, res, next) => {
  try {
    const users = await User.find({});
    const orderList = [];

    for (const user of users) {
      const orders = user.orders;

      for (const order of orders) {
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
          product: order.product
        };
        orderList.push(processedOrder);
      }
    }
    // Calculate the number of orders and total amount
    const numberOfOrders = orderList.length;
    const paymentMethodCounts = orderList.reduce((counts, order) => {
      if (order.paymentMethod === "COD") {
        counts.COD = (counts.COD || 0) + order.amount;
      } else if (order.paymentMethod === "Online") {
        counts.Online = (counts.Online || 0) + order.amount;
      }
      return counts;
    }, {});
    const totalAmountCOD = paymentMethodCounts.COD || 0;
    const totalAmountOnline = paymentMethodCounts.Online || 0;
    const totalAmount = totalAmountCOD + totalAmountOnline;
    
    const dateNow = {
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm:ss'),
    };
    const ETADate = {
      date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    };
    // Extract year, month, and date from dateNow and ETADate
    const yearNow = new Date(dateNow.date).getFullYear();
    const monthNow = new Date(dateNow.date).getMonth() + 1; 
    const dayNow = new Date(dateNow.date).getDate();

    // Prepare data for the chart
    const chartData = {
      labels: [`${dayNow}/${monthNow}/${yearNow}`, 'Payment Method'],
      datasets: [
        {
          label: `${numberOfOrders}`,
          data: [totalAmount.toString(), ''],
          backgroundColor: "rgba(235, 22, 22, .7)"
        },
        {
          label: `COD: ${totalAmountCOD || 0}`, 
          data: ['', totalAmountCOD || 0],
          backgroundColor: "rgba(235, 22, 22, .5)"
        },
        {
          label: `Online: ${totalAmountOnline || 0}`,
          data: ['', totalAmountOnline || 0], 
          backgroundColor: "rgba(235, 22, 22, .3)"
        }
      ]
    };
    chartData.datasets.forEach((dataset) => {
      const ratio = totalAmount / numberOfOrders;
      const dynamicData = Array(chartData.labels.length).fill(ratio);
      dataset.data = dynamicData;
      console.log("dataset.data", dataset.data);
    });
    const sortingOption = req.query.sort || 'default';

    let filteredOrders = [];
    if (sortingOption === 'last_7_days') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredOrders = orderList.filter(order => new Date(order.date) >= oneWeekAgo);
    } else if (sortingOption === 'last_month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filteredOrders = orderList.filter(order => new Date(order.date) >= oneMonthAgo);
    } else if (sortingOption === 'last_year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filteredOrders = orderList.filter(order => new Date(order.date) >= oneYearAgo);
    } else {
      filteredOrders = orderList;
    }
    // Render the template with filteredOrders
    res.render('adminIndex', {
      layout: "admin_Layout",
      adminIndex: true,
      orderList: JSON.stringify(filteredOrders),
      chartData: JSON.stringify(chartData),
      yearNow,
      monthNow,
      dayNow,
      totalAmount: totalAmount.toString(),
      numberOfOrders: numberOfOrders.toString(),
      codAmount: (paymentMethodCounts.COD || 0).toString(),
      onlineAmount: (paymentMethodCounts.Online || 0).toString()
    });

  } catch (err) {
    next(err);
  }
};

const adminSortSalesData = async (req,res)=>{
  try {
    const { interval } = req.body;
    console.log("SDRCFesc")

    // Implement the sorting logic based on the selected interval
    let sortCriteria = {};
    if (interval === 'daily') {
      sortCriteria = { createdAt: { $gte: calculateStartDate('daily') } };
    } else if (interval === 'weekly') {
      sortCriteria = { createdAt: { $gte: calculateStartDate('weekly') } };
    } else if (interval === 'monthly') {
      sortCriteria = { createdAt: { $gte: calculateStartDate('monthly') } };
    }

    const users = await User.find({});
    const orderList = [];

    for (const user of users) {
      const orders = user.orders;

      for (const order of orders) {
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
          product: order.product
        };
        orderList.push(processedOrder);
      }
    }
console.log("orderList",orderList);
    // Calculate sales statistics
    const numberOfOrders = orderList.length;
    const paymentMethodCounts = orderList.reduce((counts, order) => {
      if (order.paymentMethod === "COD") {
        counts.COD = (counts.COD || 0) + order.amount;
      } else if (order.paymentMethod === "Online") {
        counts.Online = (counts.Online || 0) + order.amount;
      }
      return counts;
    }, {});

    const totalAmountCOD = paymentMethodCounts.COD || 0;
    const totalAmountOnline = paymentMethodCounts.Online || 0;
    const totalAmount = totalAmountCOD + totalAmountOnline;
    console.log("totalAmountCOD",typeof totalAmountCOD);
    console.log("totalAmountOnline",typeof totalAmountOnline);
    console.log("totalAmount",typeof totalAmount);
    console.log("numberOfOrders",typeof numberOfOrders);
  
    // Return the sales data as a JSON response
    res.json({
      numberOfOrders,
      totalAmountCOD,
      totalAmountOnline,
      totalAmount
    });
  } catch (error) {
    console.error('Error sorting sales data:', error);
    res.status(500).json({ error: 'An error occurred while sorting sales data' });
  }
}

const calculateStartDate = (interval) => {
  const currentDate = new Date();
  if (interval === 'daily') {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  } else if (interval === 'weekly') {
    const firstDayOfWeek = currentDate.getDate() - currentDate.getDay();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDayOfWeek);
  } else if (interval === 'monthly') {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }
};


const formatSalesReportData = (orderList) => {
  const formattedData = [];
  for (const order of orderList) {
    const formattedOrder = {
      id: order.id,
      date: order.date,
      time: order.time,
      product: order.product,
      status: order.status,
      paymentMethod: order.paymentMethod,
      amount: order.amount
    };
    formattedData.push(formattedOrder);
  }
  return formattedData;
};

// Function to generate the PDF document
const generateSalesReportPDF = (orderList) => {
  const doc = new PDFDocument();
  doc.fontSize(16).text('Sales Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Date: ${format(new Date(), 'yyyy-MM-dd')}`, { align: 'left' });
  doc.moveDown();
  // Format the sales report data
  const formattedData = formatSalesReportData(orderList);
  // Add sales report data to the PDF
  for (const order of formattedData) {
    doc.fontSize(12).text(`Order ID: ${order.id}`);
    doc.fontSize(12).text(`Date: ${order.date}`);
    doc.fontSize(12).text(`Time: ${order.time}`);
    doc.fontSize(12).text(`Product: ${order.product}`);
    doc.fontSize(12).text(`Status: ${order.status}`);
    doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);
    doc.fontSize(12).text(`Amount: ${order.amount}`);
    doc.moveDown();
  }
  // Return the PDF document
  return doc;
};

const downloadSalesReportPDF = async (orderList, req, res) => {
  try {
    // Format the sales report data
    const formattedData = formatSalesReportData(orderList);
    console.log("downloadSalesReportPDF",formattedData);

    // Create the PDF document
    const pdfDoc = generateSalesReportPDF(formattedData);
 

    // Set the headers for the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
    // Wait for the PDF generation to complete
    await new Promise((resolve, reject) => {
      pdfDoc.on('end', resolve);
      pdfDoc.on('error', reject);
      pdfDoc.end(); // Finalize the PDF stream
    });
    // Pipe the PDF data to the response
    pdfDoc.pipe(res);
  } catch (err) {
    res.status(500).send('Error generating the PDF');
  }
};


const handleDownloadSalesReportPDF = async (req, res, next) => {
  try {
    // Get the sorting option from the query string
    const sortingOption = req.query.sort || 'default';

    // Fetch all users from the database
    const users = await User.find({});

    // Process the orders from the users and create the orderList
    const orderList = [];
    for (const user of users) {
      const orders = user.orders;
      for (const order of orders) {
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
          product: order.product
        };
        orderList.push(processedOrder);
      }
    }

    // Implement the logic to filter the orders based on sortingOption
    let filteredOrders = [];
    if (sortingOption === 'last_7_days') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredOrders = orderList.filter(order => new Date(order.date) >= oneWeekAgo);
    } else if (sortingOption === 'last_month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filteredOrders = orderList.filter(order => new Date(order.date) >= oneMonthAgo);
    } else if (sortingOption === 'last_year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filteredOrders = orderList.filter(order => new Date(order.date) >= oneYearAgo);
    } else {
      // Default: no filtering, use all orders
      filteredOrders = orderList;
    }
    // Ensure that filteredOrders is not empty before generating the PDF
    if (filteredOrders.length === 0) {
      return res.status(404).send('No data available for the sales report.');
    }
    // Create the PDF document
    const pdfDoc = generateSalesReportPDF(filteredOrders);

    // Set the headers for the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

    // Pipe the PDF data to the response
    pdfDoc.pipe(res);
    pdfDoc.end(); // Finalize the PDF stream and send it to the client
  } catch (err) {
    next(err);
  }
};


  module.exports = {
    getLogin, postIndex,
    logout, getIndex, 
    getItems, updateProductStatus,
    geteditNewItem, postEditItem,
    getCategory, getAdminDashboard,
    getEditProduct,posteditCategory,
    getdeleteProduct, createCategory, 
    postCreateItem,updateCategorytatus,
    getOrderManagement,getAdminReviews,
    getUserdetails,postUserDetails,
    updateUsertatus,updateOrderStatus,
    downloadSalesReportPDF,handleDownloadSalesReportPDF,
    adminSortSalesData
   };