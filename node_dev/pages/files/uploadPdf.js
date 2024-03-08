const aws = require('aws-sdk');
const { config } = require('../../config/config');
const path = require('path');
const fs = require('fs');
const { resolve } = require('path');
const s3 = new aws.S3({
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.region
});

const uploadPdf = async (fileName) => {
    try {
        console.log("uploading pdf" + fileName)
        const testFolder = path.join(__dirname, '../', '../', 'public', `${fileName}.pdf`)
        console.log(testFolder)
        const fileContent = fs.readFileSync(testFolder)
        // const s3 = new aws.S3();
        var data = {
            Bucket: 'pdf.marudhar.app',
            Key: `${fileName}.pdf`,
            Body: fileContent,
            acl: 'public-read',
            ContentType: 'application/pdf'
        };

        return new Promise((resolve, reject) => {
            s3.upload(data, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    fs.unlinkSync(testFolder)
                    // console.log(data.Location)
                    resolve(data.Location)

                }
            });
        });
    }
    catch (error) {
        console.log("Error" + error.message)
        return "Error"
    }
}
const deletePdfs = async () => {
    try {
        //getting list of pdfs
        let getPdfs = await listPdfs();
        console.log("total pdf " + getPdfs.length)
        if (getPdfs.length > 0) {
            let objIs = [];
            for (i = 0; i < getPdfs.length; i++) {
                objIs.push({ Key: getPdfs[i].Key });
            }
            var options = {
                Bucket: 'pdf.marudhar.app',
                Delete: {
                    Objects: objIs
                }
            };
            console.log("all is up")
            return new Promise((resolve, reject) => {
                s3.deleteObjects(options, function (err, data) {
                    if (err) {
                        // console.log(err.message)
                        reject(err)
                    } else {
                        console.log("files will be removed")
                        resolve(data);
                    }
                });
            });
        }
        else {
            return new Promise((resolve, reject) => {
                console.log("no any file found")
                reject("there is no any files");
            })
        }
    }
    catch (error) {
        console.log("Error" + error.message)
        return "Error"
    }
}

const listPdfs = async () => {
    try {

        // const s3 = new aws.S3();
        var params = {
            Bucket: 'pdf.marudhar.app',
            Delimiter: '/'
        }


        return new Promise((resolve, reject) => {
            s3.listObjects(params, function (err, data) {
                if (err) { reject(err) };
                resolve(data.Contents);
            })
        });
    }
    catch (error) {
        console.log("Error" + error.message)
        return "Error"
    }
}

module.exports = {
    uploadPdf: uploadPdf,
    listPdfs: listPdfs,
    deletePdfs: deletePdfs
}