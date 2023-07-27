var express = require('express');
var router = express.Router();

/* GET home page. */
const userController = require('../../controllers/userControllers/userControllers')

router.get('/',userController.userIndex)

module.exports = router;
