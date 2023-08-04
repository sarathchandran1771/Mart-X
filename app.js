const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const multer = require('multer'); 
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const { errorHandler } = require('./middleware/errorHandler');
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

const app = express();

const MONGO_URL = 'mongodb+srv://MartX:MartX@mart-x.cpejvr5.mongodb.net/MyCart?retryWrites=true&w=majority';
// Connect to MongoDB
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.use('/admin/lib', express.static(path.join(__dirname, 'public/lib')));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/categoryUpload', express.static('uploads/categoryUpload'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
 
app.use(flash());
app.use('/', indexRouter);
app.use('/admin', adminRouter);

app.use((err, req, res, next) => {
  // Handle errors and redirect to the appropriate error page
  if (err.status === 404) {
    // Render the server404.ejs page for a 404 Bad Request error
    res.status(404).render('server404');
  } else {
    // For other errors or non-400 errors, render the server500.ejs page
    res.status(500).render('server500');
  }
});

module.exports = app;

