var express = require('express');
var router = express.Router();

/* GET users listing. */
const adminController = require ('../../controllers/adminController/adminControllers')

router.get('/',adminController.adminIndex)

module.exports = router;
