const { config } = require("../../config/config");
const aws = require("aws-sdk");

const s3 = new aws.S3({
  accessKeyId: config.AWS_ACCESS_KEY,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  Bucket: config.Bucket,
  region: config.region
});

module.exports = s3;

