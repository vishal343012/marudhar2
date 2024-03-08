var pdfHtml = require('pdf-creator-node');
const fs = require('fs');
const moment = require('moment')
const momentTz = require('moment-timezone');
let options = { format: 'A4', orientation: 'portrait' };
const path = require('path');
const ejs = require('ejs');
var cron = require('node-cron');
const {showrooms_warehouse}=require('../../modals/Master')

let optionIs = module.exports = {
    format: 'A3',
    orientation: 'portrait'
};
const { sales } = require("../../modals/Sales");
const { item } = require('../../modals/Master');
const { customer } = require('../../modals/MasterReference');
const { uploadPdf, listPdfs, deletePdfs } = require('../files/uploadPdf');
const quotationNew = async (req, res) => {
    try {
        const html = fs.readFileSync("quotation1.html", 'utf-8');
        // let quotationNo = "MM/QN/22-23/00006";
        let { quotationNo } = req.query;
        if (quotationNo == undefined || quotationNo.length == 0) {
            return res.status(200).json({ isSuccess: true, data: null, message: "Please provide quotation no" });
        }
        // console.log(quotationNo);
        quotationNoFormat = quotationNo.replace(/bhbcbs|\/|bhjcbc/g, '-');
        let exist = false;
        // const testFolder = path.join(__dirname, '../', '../', 'public');
        // const fs = require('fs');
        // console.log(testFolder)
        // fs.readdir(testFolder, async (err, files) => {
        //     // console.log(files);
        //     exist = files.includes(quotationNoFormat + '.pdf');
        // });
        // console.log(quotationNoFormat);
        // return;
        let getPdfs = await listPdfs();
        for (i = 0; i < getPdfs.length; i++) {
            if (getPdfs[i].Key == `${quotationNoFormat}.pdf`) {
                exist = true;
            }
        }
        // if (exist) {
        //     return res.status(200).json({ isSuccess: true, data: `https://s3.ap-south-1.amazonaws.com/pdf.marudhar.app/${quotationNoFormat}.pdf`, name: `${quotationNoFormat}.pdf`, message: "Pdf already exist" });

        // }
        // return;
        let getQuotation = await sales.aggregate([
            {
                $match: {
                    "quotation_no": quotationNo
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            }
        ]);
        if (getQuotation.length > 0) {
            let quotationDate = new Date(getQuotation[0].quotation_date);
            let dateFormat = moment.unix(getQuotation[0].quotation_date).format("DD/MM/YYYY");
            let quotationItems = getQuotation[0].quotation_item_details
            let quotationCharge = getQuotation[0].quotation_other_charges;
            let finalAmount = 0;
            // console.log(parseFloat(127411.20000000001).toFixed(2))
            quotationItems.forEach(object => {
                // console.log(typeof object.net_value)
                if ((typeof object.net_value) == 'string') {
                    finalAmount += parseFloat(parseFloat(object.net_value).toFixed(2));
                    // console.log(parseFloat(object.net_value).toFixed(2))
                }
                else {
                    finalAmount += parseFloat(object.net_value.toFixed(2))
                }
            })
            // console.log(finalAmount)
            // console.log(getQuotation[0])
            let customer = "";
            if (getQuotation[0].customerData.length > 0) {
                customer = getQuotation[0].customerData[0].company_name
            }
            let mobileNo = ""
            if (getQuotation[0].customerData.length > 0) {
                mobileNo = getQuotation[0].customerData[0].contact_person[0].txt_whatsapp
            }
            let otherCharge = 0;

            let allCharge = [];
            // let mobileNo = ""
            customerDetails = {};
            // if (getQuotation[0].customerData.length > 0) {
            //     mobileNo = getQuotation[0].customerData[0].contact_person[0].txt_whatsapp
            // }
            if (getQuotation[0].customerData.length > 0 && getQuotation[0].customerData[0].company_name != undefined) {
                customerDetails = { ...customerDetails, ...{ name: getQuotation[0].customerData[0].company_name } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_street != undefined) {
                customerDetails = { ...customerDetails, ...{ street: getQuotation[0].customerData[0].address[0].txt_street } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_area_label != undefined) {
                customerDetails = { ...customerDetails, ...{ area: getQuotation[0].customerData[0].address[0].ddl_area_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ area: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_city != undefined) {
                customerDetails = { ...customerDetails, ...{ city: getQuotation[0].customerData[0].address[0].txt_city } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_state_label != undefined) {
                customerDetails = { ...customerDetails, ...{ state: getQuotation[0].customerData[0].address[0].ddl_state_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ state: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_pin != undefined) {
                customerDetails = { ...customerDetails, ...{ pin: getQuotation[0].customerData[0].address[0].txt_pin } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ pin: "" } }
            }
            // let customerDetails = {
            //     name: getQuotation[0].customerData[0].company_name || "",
            //     street: getQuotation[0].customerData[0].address[0].txt_street || "",
            //     area: getQuotation[0].customerData[0].address[0].ddl_area_label || "",
            //     city: getQuotation[0].customerData[0].address[0].txt_city || "",
            //     state: getQuotation[0].customerData[0].address[0].ddl_state_label || "",
            //     pin: getQuotation[0].customerData[0].address[0].txt_pin || ""
            // }
            console.log("checkpoint1")
            quotationCharge.forEach((object) => {
                if (object.charge_type == "+") {
                    if ((typeof object.charge_amount) == 'string') {
                        otherCharge += parseFloat(parseFloat(object.charge_amount).toFixed(2));
                    }
                    else {
                        otherCharge += parseFloat(object.charge_amount.toFixed(2));
                    }
                }
                else {
                    if ((typeof object.charge_amount) == 'string') {
                        otherCharge -= parseFloat(parseFloat(object.charge_amount).toFixed(2));

                    }
                    else {
                        otherCharge -= parseFloat(object.charge_amount.toFixed(2));

                    }
                }
                let amount = object.charge_amount;
                if (object.charge_amount.includes(".")) {
                    amount = "00" + object.charge_amount;
                }
                else {
                    amount = object.charge_amount + ".00"
                }

                allCharge.push({ ...object, ...{ amount: amount } });
            });

            quotationCharge = allCharge;
            // console.log(finalAmount + "  " + otherCharge)
            let totalValue = finalAmount + otherCharge;
            // console.log(totalValue)
            let arrIs = [];
            console.log("checkpoint1")
            for (i = 0; i < quotationItems.length; i++) {
                let getItemData = await item.aggregate([{
                    $match: {
                        item_id: quotationItems[i].item_id
                    }
                }]);
                imgIs = ""
                let totalValue;
                if (getItemData.length > 0 && ('picture_path' in getItemData[0])) {
                    imgIs = getItemData[0].picture_path
                }
                else {
                    imgIs = "";

                }

                console.log("image " + imgIs)
                if (getItemData.length > 0 && ('item' in getItemData[0])) {
                    nameIs = getItemData[0].item
                }
                else {
                    nameIs = quotationItems[i].item_id;

                }
                mrpIs = quotationItems[i].rate;
                if (quotationItems[i].rate.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                }
                else {
                    mrpIs = quotationItems[i].rate + ".00"
                }

                disc_valueIs = quotationItems[i].disc_value;
                if (quotationItems[i].disc_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].disc_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        disc_valueIs = disc_valueIs.toString() + "0";
                    }
                }
                else {
                    disc_valueIs = quotationItems[i].disc_value + ".00"
                }

                gstIs = quotationItems[i].gst_value;
                if (quotationItems[i].gst_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].gst_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        gstIs = gstIs.toString() + "0";
                    }
                }
                else {
                    gstIs = quotationItems[i].gst_value + ".00"
                }
                net_valueIs = quotationItems[i].net_value;
                if (quotationItems[i].net_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].net_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        net_valueIs = net_valueIs.toString() + "0";
                    }
                }
                else {
                    net_valueIs = quotationItems[i].net_value + ".00"
                }
                net_valueIs = parseFloat(net_valueIs).toFixed(2)
                // quotationItems[i].net_value
                let objIs = {
                    sno: i + 1, qty: quotationItems[i].quantity, disc_value
                        : disc_valueIs, mrp: mrpIs, per: "Pcs", disc: quotationItems[i].disc_percentage, gst: quotationItems[i].gst_percentage, gst_value: gstIs, prprice: net_valueIs
                }
                arrIs.push({ ...objIs, ...{ name: nameIs, img: imgIs } });
            }
            console.log("checkpoint1")
            let finalAmountIs = finalAmount;

            if (finalAmountIs.toString().includes(".")) {
                finalAmount = finalAmount.toString().split(".");
                if (finalAmount[finalAmount.length - 1].length == 1) {
                    finalAmount = finalAmountIs.toString() + "0";
                }
                else {
                    finalAmount = finalAmountIs;
                }

            }
            else {
                finalAmount = finalAmountIs.toString() + ".00"
            }
            // console.log(totalValue)
            let totalIs = totalValue;
            // console.log(totalIs)
            if (totalIs.toString().includes(".")) {

                totalValue = totalValue.toString().split(".");
                if (totalValue[totalValue.length - 1].length == 1) {
                    totalValue = totalIs.toString() + "0";
                }
                else {
                    totalValue = totalIs;
                }
            }
            else {
                totalValue = totalIs.toString() + ".00"
            }
            // console.log(totalValue)
            const obj = {
                curdate: new Date().toDateString(),
                qno: quotationNo,
                isQuotation: true,
                date: dateFormat,
                prodlist: arrIs,
                customer: customer,
                extra: otherCharge,
                finalAmount: finalAmount,
                totalAmount: totalValue,
                customerDetails: customerDetails,
                quotationCharge: quotationCharge,
                mobileNo: mobileNo
            }
            // return res.render('quotation1', obj);
            const pdf = await printPDF(obj, true, quotationNoFormat);
            // res.contentType("application/pdf");
            // return res.send(pdf);
            // const document = {
            //     html: html,
            //     data: {
            //         products: obj
            //     },
            //     path: path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`)
            // }
            let uploadpdfIs = "";
            uploadpdfIs = await uploadPdf(`${quotationNoFormat}`);
            // return res.send(pdf)
            //         console.log(uploadpdfIs)
            // await pdfHtml.create(document, options)
            //     .then(async (resp) => {
            //         console.log("pdf write")
            //         uploadpdfIs = await uploadPdf(`${quotationNoFormat}`);
            //         console.log(uploadpdfIs)
            //         // console.log(resp);
            //     }).catch(error => {
            //         console.log(error);
            //     });


            // return res.download(path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`))
            return res.status(200).json({ isSuccess: true, data: uploadpdfIs, name: `${quotationNoFormat}.pdf`, message: "Pdf Generated Successfully" });
        }
        return res.status(200).json({ isSuccess: true, data: null, message: "No Any Data Found for this quotation" });
    }
    catch (err) {
        return res.status(500).json({ isSuccess: false, data: null, message: err.message || "having issue in server" })
    }
};
const puppeteer = require('puppeteer')

async function printPDF(obj, isQuotation, name) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // console.log(obj)
    //   await page.goto('https://blog.risingstack.com', {waitUntil: 'networkidle0'});
    if (isQuotation == true) {
        pageContent = await ejs.renderFile(path.join(__dirname, '../', '../', 'views', 'quotation1.ejs'), {
            curdate: obj.curdate,
            customerDetails: obj.customerDetails,
            qno: obj.qno,
            isQuotation: isQuotation,
            date: obj.date,
            prodlist: obj.prodlist,
            customer: obj.customer,
            extra: obj.extra,
            mobileNo: obj.mobileNo,
            finalAmount: obj.finalAmount,
            totalAmount: obj.totalAmount,
            quotationCharge: obj.quotationCharge
        })
    }
    else {
        // console.log(obj.finalAmount)
        pageContent = await ejs.renderFile(path.join(__dirname, '../', '../', 'views', 'quotation1.ejs'), {
            curdate: obj.curdate,
            qno: obj.qno,
            customerDetails: obj.customerDetails,
            isQuotation: isQuotation,
            date: obj.date,
            prodlist: obj.prodlist,
            customer: obj.customer,
            extra: obj.extra,
            sno: obj.sno,
            sdate: obj.sdate,
            mobileNo: obj.mobileNo,
            finalAmount: obj.finalAmount,
            totalAmount: obj.totalAmount,
            quotationCharge: obj.quotationCharge
        })
    }

    // console.log(pageContent);//This is sudo code. Check ejs docs on how to do this
    // await page.goto(`data:text/html,${pageContent}`, { waitUntil: 'networkidle0' });

    await page.setContent(pageContent, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
        margin: {
            top: 30,
            bottom: 50,
            left: 30,
            right: 30
        }
        , path: path.join(__dirname, '../', '../', 'public', `${name}.pdf`), format: 'A4', headerTemplate: `<div></div>`,
        footerTemplate: `<div style="width: 100%; font-size: 10px; margin: 0 1cm; color: #bbb; height: 20px; text-align: right;">
		<span class="pageNumber" style="font-size: 10px;"></span> / <span class="totalPages" style="font-size: 10px"></span>
</div>`,
        displayHeaderFooter: true,
        scale: 1,
    });
    // 
    await browser.close();
    // return pdf
    return pageContent;
    // return path.join(__dirname, '../', '../', 'public', `${name}.pdf`);
}

async function printPDFDel(obj, isQuotation, name) {
    console.log("this run")
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // console.log(obj)
    //   await page.goto('https://blog.risingstack.com', {waitUntil: 'networkidle0'});
    if (isQuotation == true) {
        pageContent = await ejs.renderFile(path.join(__dirname, '../', '../', 'views', 'delivery.ejs'), {
            qno: obj.qno,
            isQuotation: isQuotation,
            date: obj.date,
            prodlist: obj.prodlist,
            customer: obj.customer,
            customerDetails: obj.customerDetails,
            extra: obj.extra,
            finalAmount: obj.finalAmount,
            totalAmount: obj.totalAmount,
            quotationCharge: obj.quotationCharge,
            mobileNo:obj.mobileNo
        })
    }
    else {
        // console.log(obj.finalAmount)
        pageContent = await ejs.renderFile(path.join(__dirname, '../', '../', 'views', 'delivery.ejs'), {
            qno: obj.qno,
            sman:obj.sman,

            isQuotation: isQuotation,
            date: obj.date,
            mobileNo: obj.mobileNo,
            prodlist: obj.prodlist,
            customer: obj.customer,
            extra: obj.extra,
            sno: obj.sno,
            sdate: obj.sdate,
            finalAmount: obj.finalAmount,
            totalAmount: obj.totalAmount,
            customerDetails: obj.customerDetails,
            quotationCharge: obj.quotationCharge
        })
    }

    // console.log(pageContent);//This is sudo code. Check ejs docs on how to do this
    // await page.goto(`data:text/html,${pageContent}`, { waitUntil: 'networkidle0' });

    await page.setContent(pageContent, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
        margin: {
            top: 30,
            bottom: 50,
            left: 30,
            right: 30
        }
        , path: path.join(__dirname, '../', '../', 'public', `${name}.pdf`), format: 'A4', headerTemplate: `<div></div>`,
        footerTemplate: `<div style="width: 100%; font-size: 10px; margin: 0 1cm; color: #bbb; height: 20px; text-align: right;">
		<span class="pageNumber" style="font-size: 10px;"></span> / <span class="totalPages" style="font-size: 10px"></span>
</div>`,
        displayHeaderFooter: true,
        scale: 1,
    });
    // 
    await browser.close();
    // return pdf
    return path.join(__dirname, '../', '../', 'public', `${name}.pdf`);
}



//For salesOrder PDF
    // from softech
    /*
const salesNew = async (req, res) => {
    try {
        const html = fs.readFileSync("quotation1.html", 'utf-8');
        // let quotationNo = "MM/QN/22-23/00006";
        let { salesNo } = req.query;
        if (salesNo == undefined || salesNo.length == 0) {
            return res.status(200).json({ isSuccess: true, data: null, message: "Please provide sales no" });
        }
        const quotationNo = salesNo;
        // console.log(quotationNo);
        quotationNoFormat = quotationNo.replace(/bhbcbs|\/|bhjcbc/g, '-');
        let exist = false;
        // const testFolder = path.join(__dirname, '../', '../', 'public');
        // const fs = require('fs');
        // console.log(testFolder)
        // fs.readdir(testFolder, async (err, files) => {
        //     // console.log(files);
        //     exist = files.includes(quotationNoFormat + '.pdf');
        // });
        // console.log(quotationNoFormat);
        // return;
        let getPdfs = await listPdfs();
        for (i = 0; i < getPdfs.length; i++) {
            if (getPdfs[i].Key == `${quotationNoFormat}.pdf`) {
                exist = true;
            }
        }
        // if (exist) {
        //     return res.status(200).json({ isSuccess: true, data: `https://s3.ap-south-1.amazonaws.com/pdf.marudhar.app/${quotationNoFormat}.pdf`, name: `${quotationNoFormat}.pdf`, message: "Pdf already exist" });

        // }
        // return;
        let getQuotation = await sales.aggregate([
            {
                $match: {
                    "sales_order_no": quotationNo
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            }
        ]);
        if (getQuotation.length > 0) {
            // let salesman = getDelivery[0].enquiry_details[0].sales_exe_name;

            let quotationDate = new Date(getQuotation[0].quotation_date);
            let dateFormat = moment.unix(getQuotation[0].quotation_date).format("DD/MM/YYYY");
            let sdateFormat = moment.unix(getQuotation[0].sales_order_date).format("DD/MM/YYYY");
            let quotationItems = getQuotation[0].quotation_item_details
            let quotationCharge = getQuotation[0].quotation_other_charges;
            let quotationNoIs = getQuotation[0].quotation_no[0];
            let finalAmount = 0;
            quotationItems.forEach(object => {
                if ((typeof object.net_value) == 'string') {
                    finalAmount += parseFloat(parseFloat(object.net_value).toFixed(2));
                    // console.log(parseFloat(object.net_value).toFixed(2))
                }
                else {
                    finalAmount += parseFloat(object.net_value.toFixed(2))
                }
            })
            // console.log(getQuotation[0])
            let customer = "";
            if (getQuotation[0].customerData.length > 0) {
                customer = getQuotation[0].customerData[0].company_name
            }
            let mobileNo = ""
            customerDetails = {};
            if (getQuotation[0].customerData.length > 0) {
                mobileNo = getQuotation[0].customerData[0].contact_person[0].txt_whatsapp
            }
            if (getQuotation[0].customerData.length > 0 && getQuotation[0].customerData[0].company_name != undefined) {
                customerDetails = { ...customerDetails, ...{ name: getQuotation[0].customerData[0].company_name } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_street != undefined) {
                customerDetails = { ...customerDetails, ...{ street: getQuotation[0].customerData[0].address[0].txt_street } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_area_label != undefined) {
                customerDetails = { ...customerDetails, ...{ area: getQuotation[0].customerData[0].address[0].ddl_area_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ area: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_city != undefined) {
                customerDetails = { ...customerDetails, ...{ city: getQuotation[0].customerData[0].address[0].txt_city } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_state_label != undefined) {
                customerDetails = { ...customerDetails, ...{ state: getQuotation[0].customerData[0].address[0].ddl_state_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ state: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_pin != undefined) {
                customerDetails = { ...customerDetails, ...{ pin: getQuotation[0].customerData[0].address[0].txt_pin } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ pin: "" } }
            }
            // let customerDetails = {
            //     name: getQuotation[0].customerData[0].company_name || "",
            //     street: getQuotation[0].customerData[0].address[0].txt_street || "",
            //     area: getQuotation[0].customerData[0].address[0].ddl_area_label || "",
            //     city: getQuotation[0].customerData[0].address[0].txt_city || "",
            //     state: getQuotation[0].customerData[0].address[0].ddl_state_label || "",
            //     pin: getQuotation[0].customerData[0].address[0].txt_pin || ""
            // }
            let otherCharge = 0;
            let allCharge = [];
            quotationCharge.forEach((object) => {
                if (object.charge_type == "+") {
                    if ((typeof object.charge_amount) == 'string') {
                        otherCharge += parseFloat(parseFloat(object.charge_amount).toFixed(2));
                    }
                    else {
                        otherCharge += parseFloat(object.charge_amount.toFixed(2));
                    }
                }
                else {
                    if ((typeof object.charge_amount) == 'string') {
                        otherCharge -= parseFloat(parseFloat(object.charge_amount).toFixed(2));

                    }
                    else {
                        otherCharge -= parseFloat(object.charge_amount.toFixed(2));

                    }
                }
                let amount = object.charge_amount;
                if (object.charge_amount.includes(".")) {
                    amount = "00" + object.charge_amount;
                }
                else {
                    amount = object.charge_amount + ".00"
                }


                console.log(amount)
                allCharge.push({ ...object, ...{ amount: amount } });
            });

            quotationCharge = allCharge;
            let totalValue = finalAmount + otherCharge;
            let arrIs = [];
            for (i = 0; i < quotationItems.length; i++) {
                let getItemData = await item.aggregate([{
                    $match: {
                        item_id: quotationItems[i].item_id
                    }
                }]);
                let totalValue;
                imgIs = ""
                if (getItemData.length > 0 && ('picture_path' in getItemData[0])) {
                    imgIs = getItemData[0].picture_path
                }
                else {
                    imgIs = "";

                }

                if (getItemData.length > 0 && ('item' in getItemData[0])) {
                    nameIs = getItemData[0].item
                } else {
                    nameIs = quotationItems[i].item_id;

                } mrpIs = quotationItems[i].rate;
                if (quotationItems[i].rate.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].rate.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        mrpIs = mrpIs.toString() + "0";
                    }
                }
                else {
                    mrpIs = quotationItems[i].rate + ".00"
                }

                disc_valueIs = quotationItems[i].disc_value;
                if (quotationItems[i].disc_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].disc_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        disc_valueIs = disc_valueIs.toString() + "0";
                    }
                }
                else {
                    disc_valueIs = quotationItems[i].disc_value + ".00"
                }

                gstIs = quotationItems[i].gst_value;
                if (quotationItems[i].gst_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].gst_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        gstIs = gstIs.toString() + "0";
                    }
                }
                else {
                    gstIs = quotationItems[i].gst_value + ".00"
                }
                net_valueIs = quotationItems[i].net_value;
                if (quotationItems[i].net_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].net_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        net_valueIs = net_valueIs.toString() + "0";
                    }
                }
                else {
                    net_valueIs = quotationItems[i].net_value + ".00"
                }
                net_valueIs = parseFloat(net_valueIs).toFixed(2)
                let objIs = {
                    sno: i + 1, qty: quotationItems[i].quantity, disc_value
                        : disc_valueIs, mrp: mrpIs, per: "Pcs", disc: quotationItems[i].disc_percentage, gst: quotationItems[i].gst_percentage, gst_value: gstIs, prprice: net_valueIs
                }
                arrIs.push({ ...objIs, ...{ name: nameIs, img: imgIs } });
            }
            let finalAmountIs = finalAmount;
            if (finalAmountIs.toString().includes(".")) {
                finalAmount = finalAmount.toString().split(".");
                if (finalAmount[finalAmount.length - 1].length == 1) {
                    finalAmount = finalAmountIs.toString() + "0";
                }
                else {
                    finalAmount = finalAmountIs;
                }

            }
            else {
                finalAmount = finalAmountIs.toString() + ".00"
            }
            let totalIs = totalValue;
            if (totalIs.toString().includes(".")) {

                totalValue = totalValue.toString().split(".");
                if (totalValue[totalValue.length - 1].length == 1) {
                    totalValue = totalIs.toString() + "0";
                }
                else {
                    totalValue = totalIs;
                }
            }
            else {
                totalValue = totalIs.toString() + ".00"
            }
            console.log(totalValue)
            const obj = {
                curdate: new Date().toDateString(),
                qno: quotationNoIs,
                sman:salesman,

                sno: quotationNo,
                customerDetails: customerDetails,
                isQuotation: false,
                date: dateFormat,
                sdate: sdateFormat,
                prodlist: arrIs,
                customer: customer,
                extra: otherCharge,
                finalAmount: finalAmount,
                totalAmount: totalValue,
                quotationCharge: quotationCharge,
                mobileNo: mobileNo
            }
            const pdf = await printPDF(obj, false, quotationNoFormat);
            // res.contentType("application/pdf");
            // return res.send(pdf);
            // const document = {
            //     html: html,
            //     data: {
            //         products: obj
            //     },
            //     path: path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`)
            // }
            let uploadpdfIs = "";
            uploadpdfIs = await uploadPdf(`${quotationNoFormat}`);
            // return res.send(pdf);
            // console.log(uploadpdfIs)
            // await pdfHtml.create(document, options)
            //     .then(async (resp) => {
            //         console.log("pdf write")

            //         // console.log(resp);
            //     }).catch(error => {
            //         console.log(error);
            //     });


            // return res.download(path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`))
            return res.status(200).json({ isSuccess: true, data: uploadpdfIs, name: `${quotationNoFormat}.pdf`, message: "Pdf Generated Successfully" });
        }
        return res.status(200).json({ isSuccess: true, data: null, message: "No Any Data Found for this quotation" });
    }
    catch (err) {
        return res.status(500).json({ isSuccess: false, data: null, message: err.message || "having issue in server" })
    }
}; */
//running cron for every 24 hour


//For salesOrder PDF
/* 11-09-23
const salesNew = async (req, res) => {
    try {
        const html = fs.readFileSync("quotation1.html", 'utf-8');
        // let quotationNo = "MM/QN/22-23/00006";
        let { salesNo } = req.query;
        
        if (salesNo == undefined || salesNo.length == 0) {
            return res.status(200).json({ isSuccess: true, data: null, message: "Please provide sales no" });
        }
        const quotationNo = salesNo;
        
        // console.log(quotationNo);
        quotationNoFormat = quotationNo.replace(/bhbcbs|\/|bhjcbc/g, '-');
        let exist = false;
        // const testFolder = path.join(__dirname, '../', '../', 'public');
        // const fs = require('fs');
        // console.log(testFolder)

        // fs.readdir(testFolder, async (err, files) => {
        //     // console.log(files);
        //     exist = files.includes(quotationNoFormat + '.pdf');
        // });
        // console.log(quotationNoFormat);
        // return;
        let getPdfs = await listPdfs();

        for (i = 0; i < getPdfs.length; i++) {
            if (getPdfs[i].Key == `${quotationNoFormat}.pdf`) {
                exist = true;
            }
        }
        // if (exist) {
        //     return res.status(200).json({ isSuccess: true, data: `https://s3.ap-south-1.amazonaws.com/pdf.marudhar.app/${quotationNoFormat}.pdf`, name: `${quotationNoFormat}.pdf`, message: "Pdf already exist" });

        // }
        // return;
        let getQuotation = await sales.aggregate([
            {
                $match: {
                    "sales_order_no": quotationNo
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            }
        ]);
        if (getQuotation.length > 0) {
            let salesman = getDelivery[0].enquiry_details[0].sales_exe_name;

            let quotationDate = new Date(getQuotation[0].quotation_date);
            let dateFormat = moment.unix(getQuotation[0].quotation_date).format("DD/MM/YYYY");
            let sdateFormat = moment.unix(getQuotation[0].sales_order_date).format("DD/MM/YYYY");
            let quotationItems = getQuotation[0].quotation_item_details
            let quotationCharge = getQuotation[0].quotation_other_charges;
            let quotationNoIs = getQuotation[0].quotation_no[0];
            let finalAmount = 0;
            quotationItems.forEach(object => {
                if ((typeof object.net_value) == 'string') {
                    finalAmount += parseFloat(parseFloat(object.net_value).toFixed(2));
                    // console.log(parseFloat(object.net_value).toFixed(2))
                }
                else {
                    finalAmount += parseFloat(object.net_value.toFixed(2))
                }
            })
            console.log(getQuotation[0], "ehydfue ---------------------------------------");
            // console.log(getQuotation[0])
            let customer = "";
            if (getQuotation[0].customerData.length > 0) {
                customer = getQuotation[0].customerData[0].company_name
            }
            let mobileNo = ""
            customerDetails = {};
            if (getQuotation[0].customerData.length > 0) {
                mobileNo = getQuotation[0].customerData[0].contact_person[0].txt_whatsapp
            }
            if (getQuotation[0].customerData.length > 0 && getQuotation[0].customerData[0].company_name != undefined) {
                customerDetails = { ...customerDetails, ...{ name: getQuotation[0].customerData[0].company_name } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_street != undefined) {
                customerDetails = { ...customerDetails, ...{ street: getQuotation[0].customerData[0].address[0].txt_street } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_area_label != undefined) {
                customerDetails = { ...customerDetails, ...{ area: getQuotation[0].customerData[0].address[0].ddl_area_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ area: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_city != undefined) {
                customerDetails = { ...customerDetails, ...{ city: getQuotation[0].customerData[0].address[0].txt_city } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_state_label != undefined) {
                customerDetails = { ...customerDetails, ...{ state: getQuotation[0].customerData[0].address[0].ddl_state_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ state: "" } }
            }
            if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_pin != undefined) {
                customerDetails = { ...customerDetails, ...{ pin: getQuotation[0].customerData[0].address[0].txt_pin } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ pin: "" } }
            }
            // let customerDetails = {
            //     name: getQuotation[0].customerData[0].company_name || "",
            //     street: getQuotation[0].customerData[0].address[0].txt_street || "",
            //     area: getQuotation[0].customerData[0].address[0].ddl_area_label || "",
            //     city: getQuotation[0].customerData[0].address[0].txt_city || "",
            //     state: getQuotation[0].customerData[0].address[0].ddl_state_label || "",
            //     pin: getQuotation[0].customerData[0].address[0].txt_pin || ""
            // }
            let otherCharge = 0;
            let allCharge = [];
            quotationCharge.forEach((object) => {
                if (object.charge_type == "+") {
                    if ((typeof object.charge_amount) == 'string') {
                        otherCharge += parseFloat(parseFloat(object.charge_amount).toFixed(2));
                    }
                    else {
                        otherCharge += parseFloat(object.charge_amount.toFixed(2));
                    }
                }
                else {
                    if ((typeof object.charge_amount) == 'string') {
                        otherCharge -= parseFloat(parseFloat(object.charge_amount).toFixed(2));

                    }
                    else {
                        otherCharge -= parseFloat(object.charge_amount.toFixed(2));

                    }
                }
                let amount = object.charge_amount;
                if (object.charge_amount.includes(".")) {
                    amount = "00" + object.charge_amount;
                }
                else {
                    amount = object.charge_amount + ".00"
                }


                console.log(amount)
                allCharge.push({ ...object, ...{ amount: amount } });
            });

            quotationCharge = allCharge;
            let totalValue = finalAmount + otherCharge;
            let arrIs = [];
            for (i = 0; i < quotationItems.length; i++) {
                let getItemData = await item.aggregate([{
                    $match: {
                        item_id: quotationItems[i].item_id
                    }
                }]);
                let totalValue;
                imgIs = ""
                if (getItemData.length > 0 && ('picture_path' in getItemData[0])) {
                    imgIs = getItemData[0].picture_path
                }
                else {
                    imgIs = "";

                }

                if (getItemData.length > 0 && ('item' in getItemData[0])) {
                    nameIs = getItemData[0].item
                } else {
                    nameIs = quotationItems[i].item_id;

                } mrpIs = quotationItems[i].rate;
                if (quotationItems[i].rate.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].rate.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        mrpIs = mrpIs.toString() + "0";
                    }
                }
                else {
                    mrpIs = quotationItems[i].rate + ".00"
                }

                disc_valueIs = quotationItems[i].disc_value;
                if (quotationItems[i].disc_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].disc_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        disc_valueIs = disc_valueIs.toString() + "0";
                    }
                }
                else {
                    disc_valueIs = quotationItems[i].disc_value + ".00"
                }

                gstIs = quotationItems[i].gst_value;
                if (quotationItems[i].gst_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].gst_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        gstIs = gstIs.toString() + "0";
                    }
                }
                else {
                    gstIs = quotationItems[i].gst_value + ".00"
                }
                net_valueIs = quotationItems[i].net_value;
                if (quotationItems[i].net_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].net_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        net_valueIs = net_valueIs.toString() + "0";
                    }
                }
                else {
                    net_valueIs = quotationItems[i].net_value + ".00"
                }
                net_valueIs = parseFloat(net_valueIs).toFixed(2)
                let objIs = {
                    sno: i + 1, qty: quotationItems[i].quantity, disc_value
                        : disc_valueIs, mrp: mrpIs, per: "Pcs", disc: quotationItems[i].disc_percentage, gst: quotationItems[i].gst_percentage, gst_value: gstIs, prprice: net_valueIs
                }
                arrIs.push({ ...objIs, ...{ name: nameIs, img: imgIs } });
            }
            let finalAmountIs = finalAmount;
            if (finalAmountIs.toString().includes(".")) {
                finalAmount = finalAmount.toString().split(".");
                if (finalAmount[finalAmount.length - 1].length == 1) {
                    finalAmount = finalAmountIs.toString() + "0";
                }
                else {
                    finalAmount = finalAmountIs;
                }

            }
            else {
                finalAmount = finalAmountIs.toString() + ".00"
            }
            let totalIs = totalValue;
            if (totalIs.toString().includes(".")) {

                totalValue = totalValue.toString().split(".");
                if (totalValue[totalValue.length - 1].length == 1) {
                    totalValue = totalIs.toString() + "0";
                }
                else {
                    totalValue = totalIs;
                }
            }
            else {
                totalValue = totalIs.toString() + ".00"
            }
            console.log(totalValue)
            const obj = {
                curdate: new Date().toDateString(),
                qno: quotationNoIs,
                sman:salesman,
                sno: quotationNo,
                customerDetails: customerDetails,
                isQuotation: false,
                date: dateFormat,
                sdate: sdateFormat,
                prodlist: arrIs,
                customer: customer,
                extra: otherCharge,
                finalAmount: finalAmount,
                totalAmount: totalValue,
                quotationCharge: quotationCharge,
                mobileNo: mobileNo
            }
            const pdf = await printPDF(obj, false, quotationNoFormat);
            // res.contentType("application/pdf");
            // return res.send(pdf);
            // const document = {
            //     html: html,
            //     data: {
            //         products: obj
            //     },
            //     path: path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`)
            // }
            let uploadpdfIs = "";
            uploadpdfIs = await uploadPdf(`${quotationNoFormat}`);
            // return res.send(pdf);
            // console.log(uploadpdfIs)
            // await pdfHtml.create(document, options)
            //     .then(async (resp) => {
            //         console.log("pdf write")

            //         // console.log(resp);
            //     }).catch(error => {
            //         console.log(error);
            //     });


            // return res.download(path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`))
            return res.status(200).json({ isSuccess: true, data: uploadpdfIs, name: `${quotationNoFormat}.pdf`, message: "Pdf Generated Successfully" });
        }
        return res.status(200).json({ isSuccess: true, data: null, message: "No Any Data Found for this quotation" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ isSuccess: false, data: null, message: err.message || "having issue in server" })
    }
};
*/

//running cron for every 24 hour


//For salesOrder PDF
// 12-09-2023
/*
const salesNew = async (req, res) => {
    try {
        console.log("thisn is log--------------------")
        const html = fs.readFileSync("quotation1.html", 'utf-8');
        // let quotationNo = "MM/QN/22-23/00006";
        let { salesNo } = req.query;
        console.log("salesNo----------", salesNo)
        if (salesNo == undefined || salesNo.length == 0) {
            return res.status(200).json({ isSuccess: true, data: null, message: "Please provide sales no" });
        }
        const quotationNo = salesNo;
        console.log("quotationNoquotationNo", quotationNo)

        // console.log(quotationNo);
        quotationNoFormat = quotationNo.replace(/bhbcbs|\/|bhjcbc/g, '-');
        let exist = false;
        // const testFolder = path.join(__dirname, '../', '../', 'public');
        // const fs = require('fs');
        // console.log(testFolder)

        // fs.readdir(testFolder, async (err, files) => {
        //     // console.log(files);
        //     exist = files.includes(quotationNoFormat + '.pdf');
        // });
        // console.log(quotationNoFormat);
        // return;
        let getPdfs = await listPdfs();

        for (i = 0; i < getPdfs.length; i++) {
            if (getPdfs[i].Key == `${quotationNoFormat}.pdf`) {
                exist = true;
            }
        }
        // if (exist) {
        //     return res.status(200).json({ isSuccess: true, data: `https://s3.ap-south-1.amazonaws.com/pdf.marudhar.app/${quotationNoFormat}.pdf`, name: `${quotationNoFormat}.pdf`, message: "Pdf already exist" });

        // }
        // return;
        let getQuotation = await sales.aggregate([
            {
                $match: {
                    "sales_order_no": quotationNo
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            }
        ]);
        console.log("getQuotation :-", getQuotation);
        let { deliveryNo } = req.query;
        console.log("deliveryNo", deliveryNo);
        // const data = await sales.find()
        // console.log(data);
        let getDelivery = await sales.aggregate([
            {
                $match: {
                    delivery_order_no: {
                        $elemMatch: {
                            $eq: deliveryNo
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "enquiry_details.sales_executive_id",
                    foreignField: "user_id",
                    as: "userData"
                }
            }
        ]);
        console.log("getDelivery 787980-=:- ", getDelivery);

        if (getQuotation.length > 0) {
            if (getDelivery.length > 0) {
                let salesman = getDelivery[0].enquiry_details[0].sales_exe_name;

                let quotationDate = new Date(getQuotation[0].quotation_date);
                let dateFormat = moment.unix(getQuotation[0].quotation_date).format("DD/MM/YYYY");
                let sdateFormat = moment.unix(getQuotation[0].sales_order_date).format("DD/MM/YYYY");
                let quotationItems = getQuotation[0].quotation_item_details
                let quotationCharge = getQuotation[0].quotation_other_charges;
                let quotationNoIs = getQuotation[0].quotation_no[0];
                let finalAmount = 0;
                quotationItems.forEach(object => {
                    if ((typeof object.net_value) == 'string') {
                        finalAmount += parseFloat(parseFloat(object.net_value).toFixed(2));
                        // console.log(parseFloat(object.net_value).toFixed(2))
                    }
                    else {
                        finalAmount += parseFloat(object.net_value.toFixed(2))
                    }
                })
                console.log(getQuotation[0], "ehydfue ---------------------------------------");
                // console.log(getQuotation[0])
                let customer = "";
                if (getQuotation[0].customerData.length > 0) {
                    customer = getQuotation[0].customerData[0].company_name
                }
                let mobileNo = ""
                customerDetails = {};
                if (getQuotation[0].customerData.length > 0) {
                    mobileNo = getQuotation[0].customerData[0].contact_person[0].txt_whatsapp
                }
                if (getQuotation[0].customerData.length > 0 && getQuotation[0].customerData[0].company_name != undefined) {
                    customerDetails = { ...customerDetails, ...{ name: getQuotation[0].customerData[0].company_name } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_street != undefined) {
                    customerDetails = { ...customerDetails, ...{ street: getQuotation[0].customerData[0].address[0].txt_street } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ street: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_area_label != undefined) {
                    customerDetails = { ...customerDetails, ...{ area: getQuotation[0].customerData[0].address[0].ddl_area_label } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ area: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_city != undefined) {
                    customerDetails = { ...customerDetails, ...{ city: getQuotation[0].customerData[0].address[0].txt_city } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ street: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_state_label != undefined) {
                    customerDetails = { ...customerDetails, ...{ state: getQuotation[0].customerData[0].address[0].ddl_state_label } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ state: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_pin != undefined) {
                    customerDetails = { ...customerDetails, ...{ pin: getQuotation[0].customerData[0].address[0].txt_pin } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ pin: "" } }
                }
                // let customerDetails = {
                //     name: getQuotation[0].customerData[0].company_name || "",
                //     street: getQuotation[0].customerData[0].address[0].txt_street || "",
                //     area: getQuotation[0].customerData[0].address[0].ddl_area_label || "",
                //     city: getQuotation[0].customerData[0].address[0].txt_city || "",
                //     state: getQuotation[0].customerData[0].address[0].ddl_state_label || "",
                //     pin: getQuotation[0].customerData[0].address[0].txt_pin || ""
                // }
                let otherCharge = 0;
                let allCharge = [];
                quotationCharge.forEach((object) => {
                    if (object.charge_type == "+") {
                        if ((typeof object.charge_amount) == 'string') {
                            otherCharge += parseFloat(parseFloat(object.charge_amount).toFixed(2));
                        }
                        else {
                            otherCharge += parseFloat(object.charge_amount.toFixed(2));
                        }
                    }
                    else {
                        if ((typeof object.charge_amount) == 'string') {
                            otherCharge -= parseFloat(parseFloat(object.charge_amount).toFixed(2));

                        }
                        else {
                            otherCharge -= parseFloat(object.charge_amount.toFixed(2));

                        }
                    }
                    let amount = object.charge_amount;
                    if (object.charge_amount.includes(".")) {
                        amount = "00" + object.charge_amount;
                    }
                    else {
                        amount = object.charge_amount + ".00"
                    }


                    console.log(amount)
                    allCharge.push({ ...object, ...{ amount: amount } });
                });

                quotationCharge = allCharge;
                let totalValue = finalAmount + otherCharge;
                let arrIs = [];
                for (i = 0; i < quotationItems.length; i++) {
                    let getItemData = await item.aggregate([{
                        $match: {
                            item_id: quotationItems[i].item_id
                        }
                    }]);
                    let totalValue;
                    imgIs = ""
                    if (getItemData.length > 0 && ('picture_path' in getItemData[0])) {
                        imgIs = getItemData[0].picture_path
                    }
                    else {
                        imgIs = "";

                    }

                    if (getItemData.length > 0 && ('item' in getItemData[0])) {
                        nameIs = getItemData[0].item
                    } else {
                        nameIs = quotationItems[i].item_id;

                    } mrpIs = quotationItems[i].rate;
                    if (quotationItems[i].rate.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].rate.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            mrpIs = mrpIs.toString() + "0";
                        }
                    }
                    else {
                        mrpIs = quotationItems[i].rate + ".00"
                    }

                    disc_valueIs = quotationItems[i].disc_value;
                    if (quotationItems[i].disc_value.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].disc_value.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            disc_valueIs = disc_valueIs.toString() + "0";
                        }
                    }
                    else {
                        disc_valueIs = quotationItems[i].disc_value + ".00"
                    }

                    gstIs = quotationItems[i].gst_value;
                    if (quotationItems[i].gst_value.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].gst_value.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            gstIs = gstIs.toString() + "0";
                        }
                    }
                    else {
                        gstIs = quotationItems[i].gst_value + ".00"
                    }
                    net_valueIs = quotationItems[i].net_value;
                    if (quotationItems[i].net_value.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].net_value.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            net_valueIs = net_valueIs.toString() + "0";
                        }
                    }
                    else {
                        net_valueIs = quotationItems[i].net_value + ".00"
                    }
                    net_valueIs = parseFloat(net_valueIs).toFixed(2)
                    let objIs = {
                        sno: i + 1, qty: quotationItems[i].quantity, disc_value
                            : disc_valueIs, mrp: mrpIs, per: "Pcs", disc: quotationItems[i].disc_percentage, gst: quotationItems[i].gst_percentage, gst_value: gstIs, prprice: net_valueIs
                    }
                    arrIs.push({ ...objIs, ...{ name: nameIs, img: imgIs } });
                }
                let finalAmountIs = finalAmount;
                if (finalAmountIs.toString().includes(".")) {
                    finalAmount = finalAmount.toString().split(".");
                    if (finalAmount[finalAmount.length - 1].length == 1) {
                        finalAmount = finalAmountIs.toString() + "0";
                    }
                    else {
                        finalAmount = finalAmountIs;
                    }

                }
                else {
                    finalAmount = finalAmountIs.toString() + ".00"
                }
                let totalIs = totalValue;
                if (totalIs.toString().includes(".")) {

                    totalValue = totalValue.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        totalValue = totalIs.toString() + "0";
                    }
                    else {
                        totalValue = totalIs;
                    }
                }
                else {
                    totalValue = totalIs.toString() + ".00"
                }
                console.log(totalValue)
                const obj = {
                    curdate: new Date().toDateString(),
                    qno: quotationNoIs,
                    sman: salesman,
                    sno: quotationNo,
                    customerDetails: customerDetails,
                    isQuotation: false,
                    date: dateFormat,
                    sdate: sdateFormat,
                    prodlist: arrIs,
                    customer: customer,
                    extra: otherCharge,
                    finalAmount: finalAmount,
                    totalAmount: totalValue,
                    quotationCharge: quotationCharge,
                    mobileNo: mobileNo
                }
                const pdf = await printPDF(obj, false, quotationNoFormat);
                // res.contentType("application/pdf");
                // return res.send(pdf);
                // const document = {
                //     html: html,
                //     data: {
                //         products: obj
                //     },
                //     path: path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`)
                // }
                let uploadpdfIs = "";
                uploadpdfIs = await uploadPdf(`${quotationNoFormat}`);
                // return res.send(pdf);
                // console.log(uploadpdfIs)
                // await pdfHtml.create(document, options)
                //     .then(async (resp) => {
                //         console.log("pdf write")

                //         // console.log(resp);
                //     }).catch(error => {
                //         console.log(error);
                //     });


                // return res.download(path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`))
                return res.status(200).json({ isSuccess: true, data: uploadpdfIs, name: `${quotationNoFormat}.pdf`, message: "Pdf Generated Successfully" });
            } else {
                res.status(200).json({ isSuccess: true, data: null, message: "No delivery found" });
            }
        } else {
            return res.status(200).json({ isSuccess: true, data: null, message: "No Any Data Found for this quotation" });
        }


    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ isSuccess: false, data: null, message: err.message || "having issue in server" })
    }
};
*/
//running cron for every 24 hour


//For salesOrder PDF
const salesNew = async (req, res) => {
    try {
        //console.log("thisn is log--------------------")
        const html = fs.readFileSync("quotation1.html", 'utf-8');
        // let quotationNo = "MM/QN/22-23/00006";
        let { salesNo } = req.query;
        //console.log("salesNo----------", salesNo)
        if (salesNo == undefined || salesNo.length == 0) {
            return res.status(200).json({ isSuccess: true, data: null, message: "Please provide sales no" });
        }
        const quotationNo = salesNo;
        //console.log("quotationNoquotationNo", quotationNo)

        // console.log(quotationNo);
        quotationNoFormat = quotationNo.replace(/bhbcbs|\/|bhjcbc/g, '-');
        let exist = false;
        // const testFolder = path.join(__dirname, '../', '../', 'public');
        // const fs = require('fs');
        // console.log(testFolder)

        // fs.readdir(testFolder, async (err, files) => {
        //     // console.log(files);
        //     exist = files.includes(quotationNoFormat + '.pdf');
        // });
        // console.log(quotationNoFormat);
        // return;
        let getPdfs = await listPdfs();

        for (i = 0; i < getPdfs.length; i++) {
            if (getPdfs[i].Key == `${quotationNoFormat}.pdf`) {
                exist = true;
            }
        }
        // if (exist) {
        //     return res.status(200).json({ isSuccess: true, data: `https://s3.ap-south-1.amazonaws.com/pdf.marudhar.app/${quotationNoFormat}.pdf`, name: `${quotationNoFormat}.pdf`, message: "Pdf already exist" });

        // }
        // return;
        let getQuotation = await sales.aggregate([
            {
                $match: {
                    "sales_order_no": quotationNo
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            }
        ]);
        //console.log("getQuotation :-", getQuotation);
        //let { deliveryNo } = req.query;
        //console.log("deliveryNo", deliveryNo);
        // const data = await sales.find()
        // console.log(data);
        let getDelivery = await sales.aggregate([
            {
                // $match: {
                //     delivery_order_no: {
                //         $elemMatch: {
                //             $eq: salesNo
                //         }
                //     }
                // }
                $match: {
                    sales_order_no: quotationNo
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "enquiry_details.sales_executive_id",
                    foreignField: "user_id",
                    as: "userData"
                }
            }
        ]);
        console.log("getDelivery 787980-=:- ", getDelivery);

        if (getQuotation.length > 0) {
            if (getDelivery.length > 0) {
                let salesman = getDelivery[0].enquiry_details[0].sales_exe_name;

                let quotationDate = new Date(getQuotation[0].quotation_date);
                // let dateFormat = moment.unix(getQuotation[0].quotation_date).format("DD/MM/YYYY");
                // let sdateFormat = moment.unix(getQuotation[0].sales_order_date).format("DD/MM/YYYY");
                let dateFormat = moment.unix(getQuotation[0].quotation_date).tz("Asia/Kolkata").format("DD/MM/YYYY");
                let sdateFormat = moment.unix(getQuotation[0].sales_order_date).tz("Asia/Kolkata").format("DD/MM/YYYY");
                let quotationItems = getQuotation[0].quotation_item_details
                let quotationCharge = getQuotation[0].sales_order_other_charges;
                let quotationNoIs = getQuotation[0].quotation_no[0];
                let finalAmount = 0;
                quotationItems.forEach(object => {
                    if ((typeof object.net_value) == 'string') {
                        finalAmount += parseFloat(parseFloat(object.net_value).toFixed(2));
                        // console.log(parseFloat(object.net_value).toFixed(2))
                    }
                    else {
                        finalAmount += parseFloat(object.net_value.toFixed(2))
                    }
                })
                console.log(getQuotation[0], "ehydfue ---------------------------------------");
                // console.log(getQuotation[0])
                let customer = "";
                if (getQuotation[0].customerData.length > 0) {
                    customer = getQuotation[0].customerData[0].company_name
                }
                let mobileNo = ""
                customerDetails = {};
                if (getQuotation[0].customerData.length > 0) {
                    mobileNo = getQuotation[0].customerData[0].contact_person[0].txt_whatsapp
                }
                if (getQuotation[0].customerData.length > 0 && getQuotation[0].customerData[0].company_name != undefined) {
                    customerDetails = { ...customerDetails, ...{ name: getQuotation[0].customerData[0].company_name } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_street != undefined) {
                    customerDetails = { ...customerDetails, ...{ street: getQuotation[0].customerData[0].address[0].txt_street } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ street: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_area_label != undefined) {
                    customerDetails = { ...customerDetails, ...{ area: getQuotation[0].customerData[0].address[0].ddl_area_label } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ area: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_city != undefined) {
                    customerDetails = { ...customerDetails, ...{ city: getQuotation[0].customerData[0].address[0].txt_city } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ street: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].ddl_state_label != undefined) {
                    customerDetails = { ...customerDetails, ...{ state: getQuotation[0].customerData[0].address[0].ddl_state_label } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ state: "" } }
                }
                if (getQuotation[0].customerData[0].address.length > 0 && getQuotation[0].customerData[0].address[0].txt_pin != undefined) {
                    customerDetails = { ...customerDetails, ...{ pin: getQuotation[0].customerData[0].address[0].txt_pin } }
                }
                else {
                    customerDetails = { ...customerDetails, ...{ pin: "" } }
                }
                // let customerDetails = {
                //     name: getQuotation[0].customerData[0].company_name || "",
                //     street: getQuotation[0].customerData[0].address[0].txt_street || "",
                //     area: getQuotation[0].customerData[0].address[0].ddl_area_label || "",
                //     city: getQuotation[0].customerData[0].address[0].txt_city || "",
                //     state: getQuotation[0].customerData[0].address[0].ddl_state_label || "",
                //     pin: getQuotation[0].customerData[0].address[0].txt_pin || ""
                // }
                let otherCharge = 0;
                let allCharge = [];
                quotationCharge.forEach((object) => {
                    if (object.charge_type == "+") {
                        if ((typeof object.charge_amount) == 'string') {
                            otherCharge += parseFloat(parseFloat(object.charge_amount).toFixed(2));
                        }
                        else {
                            otherCharge += parseFloat(object.charge_amount.toFixed(2));
                        }
                    }
                    else {
                        if ((typeof object.charge_amount) == 'string') {
                            otherCharge -= parseFloat(parseFloat(object.charge_amount).toFixed(2));

                        }
                        else {
                            otherCharge -= parseFloat(object.charge_amount.toFixed(2));

                        }
                    }
                    let amount = object.charge_amount;
                    if (object.charge_amount.includes(".")) {
                        amount = "00" + object.charge_amount;
                    }
                    else {
                        amount = object.charge_amount + ".00"
                    }


                    console.log(amount)
                    allCharge.push({ ...object, ...{ amount: amount } });
                });

                quotationCharge = allCharge;
                let totalValue = finalAmount + otherCharge;
                let arrIs = [];
                for (i = 0; i < quotationItems.length; i++) {
                    let getItemData = await item.aggregate([{
                        $match: {
                            item_id: quotationItems[i].item_id
                        }
                    }]);
                    let totalValue;
                    imgIs = ""
                    if (getItemData.length > 0 && ('picture_path' in getItemData[0])) {
                        imgIs = getItemData[0].picture_path
                    }
                    else {
                        imgIs = "";

                    }

                    if (getItemData.length > 0 && ('item' in getItemData[0])) {
                        nameIs = getItemData[0].item
                    } else {
                        nameIs = quotationItems[i].item_id;

                    } mrpIs = quotationItems[i].rate;
                    if (quotationItems[i].rate.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].rate.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            mrpIs = mrpIs.toString() + "0";
                        }
                    }
                    else {
                        mrpIs = quotationItems[i].rate + ".00"
                    }

                    disc_valueIs = quotationItems[i].disc_value;
                    if (quotationItems[i].disc_value.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].disc_value.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            disc_valueIs = disc_valueIs.toString() + "0";
                        }
                    }
                    else {
                        disc_valueIs = quotationItems[i].disc_value + ".00"
                    }

                    gstIs = quotationItems[i].gst_value;
                    if (quotationItems[i].gst_value.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].gst_value.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            gstIs = gstIs.toString() + "0";
                        }
                    }
                    else {
                        gstIs = quotationItems[i].gst_value + ".00"
                    }
                    net_valueIs = quotationItems[i].net_value;
                    if (quotationItems[i].net_value.toString().includes(".")) {
                        // amount = "00" + object.charge_amount;
                        totalValue = quotationItems[i].net_value.toString().split(".");
                        if (totalValue[totalValue.length - 1].length == 1) {
                            net_valueIs = net_valueIs.toString() + "0";
                        }
                    }
                    else {
                        net_valueIs = quotationItems[i].net_value + ".00"
                    }
                    net_valueIs = parseFloat(net_valueIs).toFixed(2)
                    let objIs = {
                        sno: i + 1, qty: quotationItems[i].quantity, disc_value
                            : disc_valueIs, mrp: mrpIs, per: "Pcs", disc: quotationItems[i].disc_percentage, gst: quotationItems[i].gst_percentage, gst_value: gstIs, prprice: net_valueIs
                    }
                    arrIs.push({ ...objIs, ...{ name: nameIs, img: imgIs } });
                }
                let finalAmountIs = finalAmount;
                if (finalAmountIs.toString().includes(".")) {
                    finalAmount = finalAmount.toString().split(".");
                    if (finalAmount[finalAmount.length - 1].length == 1) {
                        finalAmount = finalAmountIs.toString() + "0";
                    }
                    else {
                        finalAmount = finalAmountIs;
                    }

                }
                else {
                    finalAmount = finalAmountIs.toString() + ".00"
                }
                let totalIs = totalValue;
                if (totalIs.toString().includes(".")) {

                    totalValue = totalValue.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        totalValue = totalIs.toString() + "0";
                    }
                    else {
                        totalValue = totalIs;
                    }
                }
                else {
                    totalValue = totalIs.toString() + ".00"
                }
                console.log(totalValue)
                const obj = {
                    curdate: new Date().toDateString(),
                    qno: quotationNoIs,
                    sman: salesman,
                    sno: quotationNo,
                    customerDetails: customerDetails,
                    isQuotation: false,
                    date: dateFormat,
                    sdate: sdateFormat,
                    prodlist: arrIs,
                    customer: customer,
                    extra: otherCharge,
                    finalAmount: finalAmount,
                    totalAmount: totalValue,
                    quotationCharge: quotationCharge,
                    mobileNo: mobileNo
                }
                const pdf = await printPDF(obj, false, quotationNoFormat);
                // res.contentType("application/pdf");
                // return res.send(pdf);
                // const document = {
                //     html: html,
                //     data: {
                //         products: obj
                //     },
                //     path: path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`)
                // }
                let uploadpdfIs = "";
                uploadpdfIs = await uploadPdf(`${quotationNoFormat}`);
                // return res.send(pdf);
                // console.log(uploadpdfIs)
                // await pdfHtml.create(document, options)
                //     .then(async (resp) => {
                //         console.log("pdf write")

                //         // console.log(resp);
                //     }).catch(error => {
                //         console.log(error);
                //     });


                // return res.download(path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`))
                return res.status(200).json({ isSuccess: true, data: uploadpdfIs, name: `${quotationNoFormat}.pdf`, message: "Pdf Generated Successfully" });
            } else {
                res.status(200).json({ isSuccess: true, data: null, message: "No delivery found" });
            }
        } else {
            return res.status(200).json({ isSuccess: true, data: null, message: "No Any Data Found for this quotation" });
        }


    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ isSuccess: false, data: null, message: err.message || "having issue in server" })
    }
};
//running cron for every 24 hour



const deliveryNew = async (req, res) => {
    try {
        const html = fs.readFileSync("deliveryPdf.html", 'utf-8');
        // let deliveryNo = "MM/DO/22-23/00193";
        let { deliveryNo } = req.query;
        if (deliveryNo == undefined || deliveryNo.length == 0) {
            return res.status(200).json({ isSuccess: true, data: null, message: "Please provide delivery no" });
        }
        // const deliveryNo = salesNo;
        // console.log(quotationNo);
        deliveryNoFormat = deliveryNo.replace(/bhbcbs|\/|bhjcbc/g, '-');
        let exist = false;
        // const testFolder = path.join(__dirname, '../', '../', 'public');
        // const fs = require('fs');
        // console.log(testFolder)
        // fs.readdir(testFolder, async (err, files) => {
        //     // console.log(files);
        //     exist = files.includes(quotationNoFormat + '.pdf');
        // });
        // console.log(quotationNoFormat);
        // return;
        let getPdfs = await listPdfs();
        for (i = 0; i < getPdfs.length; i++) {
            if (getPdfs[i].Key == `${deliveryNoFormat}.pdf`) {
                exist = true;
            }
        }
        if (exist) {
            return res.status(200).json({ isSuccess: true, data: `https://s3.ap-south-1.amazonaws.com/pdf.marudhar.app/${deliveryNoFormat}.pdf`, message: "Pdf already exist" });

        }

        // return;
        let getDelivery = await sales.aggregate([
            {
                $match: {
                    "delivery_order_no": deliveryNo
                }
            },
            {
                $lookup: {
                    from: "t_400_customers",
                    localField: "customer_id",
                    foreignField: "customer_id",
                    as: "customerData"
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"enquiry_details.sales_executive_id",
                    foreignField:"user_id",
                    as:"userData"
                }
            }
        ]);
        if (getDelivery.length > 0) {
            let salesman = getDelivery[0].enquiry_details[0].sales_exe_name;
            if((salesman==undefined||salesman==null||salesman.length==0)&&getDelivery[0].userData.length>0) {
                salesman=getDelivery[0].userData[0].name
            }
            let quotationDate = new Date(getDelivery[0].quotation_date);
            let dateFormat = moment.unix(getDelivery[0].quotation_date).format("DD/MM/YYYY");
            let sdateFormat = moment.unix(getDelivery[0].
                delivery_order_details[0].
                delivery_order_date
            ).format("DD/MM/YYYY");
            let quotationItems = getDelivery[0].delivery_order_item_details
            let quotationCharge = getDelivery[0].quotation_other_charges;
            let quotationNoIs = getDelivery[0].quotation_no[0];
            let finalAmount = 0;
            quotationItems.forEach(object => finalAmount += parseFloat(object.net_value))
            // console.log(getQuotation[0])
            let customer = "";
            if (getDelivery[0].customerData.length > 0) {
                customer = getDelivery[0].customerData[0].company_name
            }
            let mobileNo = ""
            customerDetails = {};
            if (getDelivery[0].customerData.length > 0) {
                mobileNo = getDelivery[0].customerData[0].contact_person[0].txt_whatsapp
            }
            if (getDelivery[0].customerData.length > 0 && getDelivery[0].customerData[0].company_name != undefined) {
                customerDetails = { ...customerDetails, ...{ name: getDelivery[0].customerData[0].company_name } }
            }
            if (getDelivery[0].customerData[0].address.length > 0 && getDelivery[0].customerData[0].address[0].txt_street != undefined) {
                customerDetails = { ...customerDetails, ...{ street: getDelivery[0].customerData[0].address[0].txt_street } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getDelivery[0].customerData[0].address.length > 0 && getDelivery[0].customerData[0].address[0].ddl_area_label != undefined) {
                customerDetails = { ...customerDetails, ...{ area: getDelivery[0].customerData[0].address[0].ddl_area_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ area: "" } }
            }
            if (getDelivery[0].customerData[0].address.length > 0 && getDelivery[0].customerData[0].address[0].txt_city != undefined) {
                customerDetails = { ...customerDetails, ...{ city: getDelivery[0].customerData[0].address[0].txt_city } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ street: "" } }
            }
            if (getDelivery[0].customerData[0].address.length > 0 && getDelivery[0].customerData[0].address[0].ddl_state_label != undefined) {
                customerDetails = { ...customerDetails, ...{ state: getDelivery[0].customerData[0].address[0].ddl_state_label } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ state: "" } }
            }
            if (getDelivery[0].customerData[0].address.length > 0 && getDelivery[0].customerData[0].address[0].txt_pin != undefined) {
                customerDetails = { ...customerDetails, ...{ pin: getDelivery[0].customerData[0].address[0].txt_pin } }
            }
            else {
                customerDetails = { ...customerDetails, ...{ pin: "" } }
            }
            let otherCharge = 0;
            let allCharge = [];
            quotationCharge.forEach((object) => {
                if (object.charge_type == "+") {
                    otherCharge += parseFloat(object.charge_amount);
                }
                else {
                    otherCharge -= parseFloat(object.charge_amount);
                }
                let amount = object.charge_amount;
                if (object.charge_amount.includes(".")) {
                    amount = "00" + object.charge_amount;
                }

                allCharge.push({ ...object, ...{ amount: amount } });
            });

            quotationCharge = allCharge;
            let totalValue = finalAmount + otherCharge;
            let arrIs = [];
            for (i = 0; i < quotationItems.length; i++) {
                let getItemData = await item.aggregate([{
                    $match: {
                        item_id: quotationItems[i].item_id
                    }
                }]);
                imgIs = ""
                if (getItemData.length > 0 && ('picture_path' in getItemData[0])) {
                    imgIs = getItemData[0].picture_path
                }
                else {
                    imgIs = "";

                }
                if (getItemData.length > 0 && ('item' in getItemData[0])) {
                    nameIs = getItemData[0].item
                } else {
                    nameIs = quotationItems[i].item_id;

                } mrpIs = quotationItems[i].rate;
                if (quotationItems[i].rate.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].rate.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        mrpIs = mrpIs.toString() + "0";
                    }
                }
                else {
                    mrpIs = quotationItems[i].rate + ".00"
                }

                disc_valueIs = quotationItems[i].disc_value;
                if (quotationItems[i].disc_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].disc_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        disc_valueIs = disc_valueIs.toString(2) + "0";
                    }
                }
                else {
                    disc_valueIs = quotationItems[i].disc_value
                }

                gstIs = quotationItems[i].gst_value;
                if (quotationItems[i].gst_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].gst_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        gstIs = gstIs.toString() + "0";
                    }
                }
                else {
                    gstIs = quotationItems[i].gst_value + ".00"
                }
                net_valueIs = quotationItems[i].net_value;
                if (quotationItems[i].net_value.toString().includes(".")) {
                    // amount = "00" + object.charge_amount;
                    totalValue = quotationItems[i].net_value.toString().split(".");
                    if (totalValue[totalValue.length - 1].length == 1) {
                        net_valueIs = net_valueIs.toString() + "0";
                    }
                }
                else {
                    net_valueIs = quotationItems[i].net_value + ".00"
                }
                let warehouseName="";
                let regexIs=/([0-9]+)_([0-9]+)/;
                for (key in quotationItems[i]){
                    let result=regexIs.test(key);
                    if(result){
                    
                        let warehouseId=key.split("_")[0];
                    console.log(warehouseId)
                        if(warehouseId!=undefined&&warehouseId!=null){
                        
                        let getWarehose=await showrooms_warehouse.aggregate([{$match:{showrooms_warehouse_id:parseInt(warehouseId)}}]);
                        console.log(getWarehose.length);
                        if(getWarehose.length > 0){warehouseName=getWarehose[0].showrooms_warehouse}
                    }
                    }
                }
                console.log("warehouse name")
              console.log(warehouseName)
                let objIs = {
                    sno: i + 1, qty: quotationItems[i].delivered_qty, disc_value
                        : disc_valueIs, mrp: mrpIs, per: "Pcs", disc: quotationItems[i].disc_percentage, gst: quotationItems[i].gst_percentage, gst_value: gstIs, prprice: net_valueIs
                }
                arrIs.push({ ...objIs, ...{ name: nameIs , img: imgIs,wname:warehouseName} });
            }
            let finalAmountIs = finalAmount;
            if (finalAmountIs.toString().includes(".")) {
                finalAmount = finalAmount.toString().split(".");
                if (finalAmount[finalAmount.length - 1].length == 1) {
                    finalAmount = finalAmountIs.toString() + "0";
                }
                else {
                    finalAmount = finalAmountIs;
                }

            }
            else {
                finalAmount = finalAmountIs.toString() + ".00"
            }
            let totalIs = totalValue;
            if (totalIs.toString().includes(".")) {

                totalValue = totalValue.toString().split(".");
                if (totalValue[totalValue.length - 1].length == 1) {
                    totalValue = totalIs.toString() + "0";
                }
                else {
                    totalValue = totalIs;
                }
            }
            else {
                totalValue = totalIs.toString() + ".00"
            }
            // console.log(mobileNo)
            
            // console.log(totalValue)
            console.log(salesman)
            const obj = {
                sman:salesman,
                qno: quotationNoIs,
                sno: deliveryNo,
                customerDetails: customerDetails,
                isQuotation: false,
                date: dateFormat,
                sdate: sdateFormat,
                prodlist: arrIs,
                customer: customer,
                extra: otherCharge,
                finalAmount: finalAmount,
                totalAmount: totalValue,
                quotationCharge: quotationCharge,
                mobileNo: mobileNo

            }
            const pdf = await printPDFDel(obj, false, deliveryNoFormat);
            // res.contentType("application/pdf");
            // return res.send(pdf);
            // const document = {
            //     html: html,
            //     data: {
            //         products: obj
            //     },
            //     path: path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`)
            // }
            let uploadpdfIs = "";
            uploadpdfIs = await uploadPdf(`${deliveryNoFormat}`);
            // console.log(uploadpdfIs)
            // await pdfHtml.create(document, options)
            //     .then(async (resp) => {
            //         console.log("pdf write")

            //         // console.log(resp);
            //     }).catch(error => {
            //         console.log(error);
            //     });


            // return res.download(path.join(__dirname, '../', '../', 'public', `${quotationNoFormat}.pdf`))
            return res.status(200).json({ isSuccess: true, data: uploadpdfIs, message: "Pdf Generated Successfully" });
        }
        return res.status(200).json({ isSuccess: true, data: null, message: "No Any Data Found for this quotation" });
    }
    catch (err) {
        return res.status(500).json({ isSuccess: false, data: null, message: err.message || "having issue in server" })
    }
};




cron.schedule('0 0 23 * *', async () => {
    const removePdfIs = await deletePdfs();
    console.log(await listPdfs())

    console.log('running a task every minute');
});

module.exports = { quotationNew, salesNew, deliveryNew }