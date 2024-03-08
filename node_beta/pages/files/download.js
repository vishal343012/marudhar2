const aws = require("aws-sdk");
const fs = require("fs");
const { config } = require("../../config/config");
const s3 = require("./settings");


const fileDownload = (req, res) => {
  const filePath = req.body.filePath;
  const originalFileName = req.body.originalFileName;

  const params = {
    Bucket: config.Bucket,
    Key: filePath,
  };

  res.set("Content-Disposition", "attachment;filename=originalFileName");

  let file = fs.createWriteStream(`./${originalFileName}`);

  s3.getObject(params)
    .createReadStream()
    .on("end", () => {
      res.status(200).json("File Downloaded Successfully!");
    })
    .on("error", function (err) {
      res.status(500).json({ error: "Error -> " + err });
    })
    .pipe(file);
};

module.exports = fileDownload;
