const express = require("express");
const router = express.Router();
const aws = require('aws-sdk');
const {fileUpload} = require('./upload');
const fileDownload = require('./download');
const { config } = require('../../config/config');

const s3 = new aws.S3({
  accessKeyId: config.AWS_ACCESS_KEY,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  Bucket: config.Bucket
});

//Routes
router.post('/upload', fileUpload);

router.post('/download', fileDownload);


module.exports = router
