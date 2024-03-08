const express = require("express");
const router = express.Router();
const {encrypt, decrypt} = require('./encrypt-decrypt');

//Routes
router.post('/encrypt', encrypt);
router.post('/decrypt', decrypt);
module.exports = router