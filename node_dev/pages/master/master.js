const router = require("express").Router();
const moment = require("moment");
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { trackChange } = require("../../config/global");
const { apiList } = require("../../config/api");
var express = require("express");
var jsonDiff = require('json-diff')

const {
  modules,
  terms,
  vehicle,
  area,
  category,
  brand,
  statutory_type,
  uom,
  item,
  showrooms_warehouse,
  role,
  source,
  bank,
  enquiry,
  opening_stock,
  categorySchemaDef,
  menu,
  waste
} = require("../../modals/Master");
const {
  tax_master,
  ledger_account,
  ledger_account_Schema,
  ledger_group,
  charges,
  primary_group,
  master_group,
} = require("../../modals/MasterAccounts");
const { User, userSchema } = require("../../modals/User");
const { customer, reference, vendor } = require("../../modals/MasterReference");
const { direct_purchase, purchase, purchase_return } = require("../../modals/Purchase");
const {
  sales,
  status,
  task_todo,
  serial_no,
  stock_transfer,
  stock_movement,
  sales_return
} = require("../../modals/Sales");
const { receipt_payment, journal } = require("../../modals/Account");

const { storage,itemStock } = require("../../modals/ledgerStorage");
const { accessSync } = require("fs");

// var isoDate = new Date().toISOString();
//var isodate = require("isodate");

// const moduleInsert = async (req, res) => {
//   const data = req.body;
//   const errors = {};
//   let newModule = new modules(data);
//   const insertedModule = await newModule.save();
//   return res.status(200).json({ _id: insertedModule._id });
// };

// FOR VIEW NAME BY _id
const nameById = (all_item, id, name, name_id) => {
  if (id === 0) return "--";
  for (let iCtr = 0; iCtr < all_item.length; iCtr++) {
    if (all_item[iCtr][name_id] === id) return all_item[iCtr][`${name}`];
  }
};

const generateSerialNumber = async (serialType, inserted_date) => {
  const allSerial_no = await serial_no.find({}, (err, allEnq) => {
    if (err) {
      return 1;
    } else {
      return allEnq;
    }
  });

  let retSerialNumber = 0;
  let data = {};
  let condition = {};
  const zeroPrefix = ["0000", "000", "00", "0"];


  let insertedYear = moment(inserted_date * 1000).format("YY")
  let insertedMonth = moment(inserted_date * 1000).format("MM")
  // let dateRange = ''
  // if (Number(insertedMonth) <= 3) {
  //   dateRange = `${Number(insertedYear) - 1}-${Number(insertedYear)}`
  // } else {
  //   dateRange = `${Number(insertedYear)}-${Number(insertedYear) + 1}`
  // }
  // let dateRange = "22-23";
  let financialYr = fy.split("-")

  let Year1 = moment(financialYr[0], "YYYY").format("YY")
  let Year2 = moment(financialYr[1], "YYYY").format("YY")
  let dateRange = `${Year1}-${Year2}`;

  if (serialType === "ENQUIRY") {
    retSerialNumber = allSerial_no[0]["enquiry_no"] + 1;

    // Update the sequence
    data = { enquiry_no: retSerialNumber };

    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/EN/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/EN/" +
      dateRange +
      "/" +
      retSerialNumber;


  } else if (serialType === "QUOTATION") {
    retSerialNumber = allSerial_no[0]["quotation_no"] + 1;
    // Update the sequence
    data = { quotation_no: retSerialNumber };

    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/QN/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/QN/" +
      dateRange +
      "/" +
      retSerialNumber

  } else if (serialType === "SALES_ORDER") {
    retSerialNumber = allSerial_no[0]["sales_order_no"] + 1;
    // Update the sequence
    data = { sales_order_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/SO/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/SO/" +
      dateRange +
      "/" +
      retSerialNumber
  } else if (serialType === "PURCHASE_ORDER") {
    retSerialNumber = allSerial_no[0]["purchase_order_no"] + 1;
    // Update the sequence
    data = { purchase_order_no: retSerialNumber };

    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/PO/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/PO/" +
      dateRange +
      "/" +
      retSerialNumber

  } else if (serialType === "PURCHASE_RETURN_ORDER") {
    // console.log(allSerial_no[0]["purchase_return_no"] ,"purchasereturn1234")
    retSerialNumber = allSerial_no[0]["purchase_return_no"] + 1;
    // retSerialNumber = allSerial_no[0]["purchase_no"] + 1;
    // Update the sequence
    data = { purchase_return_no: retSerialNumber };

    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/PR/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/PR/" +
      dateRange +
      "/" +
      retSerialNumber

  }
  else if (serialType === "SALES_RETURN") {
    //console.log(allSerial_no[0]["sales_return_no"] ,"sales_return_no111")
    retSerialNumber = allSerial_no[0]["sales_return_no"] + 1;
    data = { sales_return_no: retSerialNumber };

    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/SR/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/SR/" +
      dateRange +
      "/" +
      retSerialNumber
  }
  else if (serialType === "DELIVERY_ORDER") {
    retSerialNumber = allSerial_no[0]["delivery_order_no"] + 1;
    // Update the sequence
    data = { delivery_order_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/DO/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/DO/" +
      dateRange +
      "/" +
      retSerialNumber

  } else if (serialType === "DISPATCH_ORDER") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["dispatch_order_no"] + 1;
    // Update the sequence
    data = { dispatch_order_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/DO/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/DO/" +
      dateRange +
      "/" +
      retSerialNumber

  } else if (serialType === "DIRECT PURCHASE") {
    retSerialNumber = allSerial_no[0]["grn_no"] + 1;
    // Update the sequence
    data = { grn_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/GR/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/GR/" +
      dateRange +
      "/" +
      retSerialNumber

    // console.log(retSerialNumber);
  } else if (serialType === "DIRECT_INVOICE") {
    //console.log("reached DI")
    retSerialNumber = allSerial_no[0]["invoice_no"] + 1;
    // Update the sequence
    data = { invoice_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/DI/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/DI/" +
      dateRange +
      "/" +
      retSerialNumber


  } else if (serialType === "ITEMRECEIVED") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["grn_no"] + 1;
    // Update the sequence
    data = { grn_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/GR/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/GR/" +
      dateRange +
      "/" +
      retSerialNumber
    // console.log(retSerialNumber);
  } else if (serialType === "PURCHASE_ORDER") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["puchase_order_no"] + 1;
    // Update the sequence
    data = { puchase_order_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/PO/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/PO/" +
      dateRange +
      "/" +
      retSerialNumber

  } else if (serialType === "R") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
    // Update the sequence
    data = { voucher_no: retSerialNumber };
    // console.log(zeroPrefix[retSerialNumber.toString().length - 1]?zeroPrefix[retSerialNumber.toString().length - 1]:'',"sen12081")

    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/AR/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/AR/" +
      dateRange +
      "/" + retSerialNumber

    // console.log(retSerialNumber);
  } else if (serialType === "BR") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
    // Update the sequence
    data = { voucher_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/AB/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/AB/" +
      dateRange +
      "/" +
      retSerialNumber
    // console.log(retSerialNumber);
  } else if (serialType === "P") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
    // Update the sequence
    data = { voucher_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/AP/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/AP/" +
      dateRange +
      "/" +
      retSerialNumber
    // console.log(retSerialNumber);
  } else if (serialType === "BP") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
    // Update the sequence
    data = { voucher_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/AB/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/AB/" +
      dateRange +
      "/" +
      retSerialNumber
    // console.log(retSerialNumber);
  } else if (serialType === "J") {
    //   console.log("Journal Entry")
    retSerialNumber = allSerial_no[0]['voucher_no'] + 1;
    // Update the sequence
    data = { "voucher_no": retSerialNumber }
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/JO/" + dateRange + "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/JO/" +
      dateRange +
      "/" +
      retSerialNumber
    // console.log(retSerialNumber);

  }
  else if (serialType === "STOCK_TRANSFER") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["stock_transfer_no"] + 1;
    // Update the sequence
    data = { stock_transfer_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/STF/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/STF/" +
      dateRange +
      "/" +
      retSerialNumber
    // console.log(retSerialNumber);
  } else if (serialType === "INVOICE") {
    // console.log("Dispatch action triggered")
    retSerialNumber = allSerial_no[0]["invoice_no"] + 1;
    // Update the sequence
    data = { invoice_no: retSerialNumber };
    zeroPrefix[retSerialNumber.toString().length - 1] ?
      retSerialNumber =
      "MM/IN/" +
      dateRange +
      "/" +
      zeroPrefix[retSerialNumber.toString().length - 1] +
      retSerialNumber
      :
      retSerialNumber =
      "MM/IN/" +
      dateRange +
      "/" +
      retSerialNumber
    // console.log(retSerialNumber);
  }

  // update
  await serial_no.findOneAndUpdate(condition, data, (err, obj) => { });
  return retSerialNumber;
};
// const generateSerialNumber = async (serialType,inserted_date) => {
//   const allSerial_no = await serial_no.find({}, (err, allEnq) => {
//     if (err) {
//       return 1;
//     } else {
//       return allEnq;
//     }
//   });

//   let retSerialNumber = 0;
//   let data = {};
//   let condition = {};
//   const zeroPrefix = ["0000", "000", "00", "0"];


//   let insertedYear = moment(inserted_date * 1000).format("YY")
//   let insertedMonth = moment(inserted_date * 1000).format("MM")
//   // let dateRange = ''
//   // if (Number(insertedMonth) <= 3) {
//   //   dateRange = `${Number(insertedYear) - 1}-${Number(insertedYear)}`
//   // } else {
//   //   dateRange = `${Number(insertedYear)}-${Number(insertedYear) + 1}`
//   // }
//   let dateRange = "22-23";


//   if (serialType === "ENQUIRY") {
//     retSerialNumber = allSerial_no[0]["enquiry_no"] + 1;

//     // Update the sequence
//     data = { enquiry_no: retSerialNumber };

//     retSerialNumber =
//       "MM/EN/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//   } else if (serialType === "QUOTATION") {
//     retSerialNumber = allSerial_no[0]["quotation_no"] + 1;
//     // Update the sequence
//     data = { quotation_no: retSerialNumber };

//     retSerialNumber =
//       "MM/QN/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//   } else if (serialType === "SALES_ORDER") {
//     retSerialNumber = allSerial_no[0]["sales_order_no"] + 1;
//     // Update the sequence
//     data = { sales_order_no: retSerialNumber };
//     retSerialNumber =
//       "MM/SO/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//   } else if (serialType === "PURCHASE_ORDER") {
//     retSerialNumber = allSerial_no[0]["purchase_order_no"] + 1;
//     // Update the sequence
//     data = { purchase_order_no: retSerialNumber };

//     retSerialNumber =
//       "MM/PO/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//   }else if (serialType === "PURCHASE_RETURN_ORDER") {
//     console.log(allSerial_no[0]["purchase_return_no"] ,"purchasereturn1234")
//     retSerialNumber = allSerial_no[0]["purchase_return_no"] + 1;
//     // retSerialNumber = allSerial_no[0]["purchase_no"] + 1;
//     // Update the sequence
//     data = { purchase_return_no: retSerialNumber };

//     retSerialNumber =
//       "MM/PR/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//       console.log(retSerialNumber,"returnNO")
// } 
// else if (serialType === "SALES_RETURN") {
//   console.log(allSerial_no[0]["sales_return_no"] ,"sales_return_no111")
//   retSerialNumber = allSerial_no[0]["sales_return_no"] + 1;
//   data = { sales_return_no: retSerialNumber };

//   retSerialNumber =
//     "MM/SR/" +
//     dateRange +
//     "/" +
//     zeroPrefix[retSerialNumber.toString().length - 1] +
//     retSerialNumber;
//     console.log(retSerialNumber,"returnNO")
// }
//   else if (serialType === "DELIVERY_ORDER") {
//     retSerialNumber = allSerial_no[0]["delivery_order_no"] + 1;
//     // Update the sequence
//     data = { delivery_order_no: retSerialNumber };

//     retSerialNumber =
//       "MM/DO/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//   } else if (serialType === "DISPATCH_ORDER") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["dispatch_order_no"] + 1;
//     // Update the sequence
//     data = { dispatch_order_no: retSerialNumber };

//     retSerialNumber =
//       "MM/DO/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   } else if (serialType === "DIRECT PURCHASE") {
//     retSerialNumber = allSerial_no[0]["grn_no"] + 1;
//     // Update the sequence
//     data = { grn_no: retSerialNumber };

//     retSerialNumber =
//       "MM/GR/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;

//     // console.log(retSerialNumber);
//   } else if (serialType === "DIRECT_INVOICE") {
//     console.log("reached DI")
//     retSerialNumber = allSerial_no[0]["invoice_no"] + 1;
//     // Update the sequence
//     data = {invoice_no: retSerialNumber };

//     retSerialNumber =
//       "MM/DI/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;

//     console.log(retSerialNumber,"diNo");
//   }else if (serialType === "ITEMRECEIVED") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["grn_no"] + 1;
//     // Update the sequence
//     data = { grn_no: retSerialNumber };

//     retSerialNumber =
//       "MM/GR/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   } else if (serialType === "PURCHASE_ORDER") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["puchase_order_no"] + 1;
//     // Update the sequence
//     data = { puchase_order_no: retSerialNumber };

//     retSerialNumber =
//       "MM/PO/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   } else if (serialType === "R") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
//     // Update the sequence
//     data = { voucher_no: retSerialNumber };

//     retSerialNumber =
//       "MM/AR/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   }else if (serialType === "BR") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
//     // Update the sequence
//     data = { voucher_no: retSerialNumber };

//     retSerialNumber =
//       "MM/AB/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   } else if (serialType === "P") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
//     // Update the sequence
//     data = { voucher_no: retSerialNumber };

//     retSerialNumber =
//       "MM/AP/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   }else if (serialType === "BP") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["voucher_no"] + 1;
//     // Update the sequence
//     data = { voucher_no: retSerialNumber };

//     retSerialNumber =
//       "MM/AB/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   }else  if(serialType==="J")
//   {
//          console.log("Journal Entry")
//             retSerialNumber=allSerial_no[0]['voucher_no']+1;
//             // Update the sequence
//             data={"voucher_no":retSerialNumber}

//             retSerialNumber="MM/JO/"+dateRange+"/"+zeroPrefix[retSerialNumber.toString().length-1]+retSerialNumber;
//      console.log(retSerialNumber);

//     } 
//   else if (serialType === "STOCK_TRANSFER") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["stock_transfer_no"] + 1;
//     // Update the sequence
//     data = { stock_transfer_no: retSerialNumber };

//     retSerialNumber =
//       "MM/STF/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   } else if (serialType === "INVOICE") {
//     // console.log("Dispatch action triggered")
//     retSerialNumber = allSerial_no[0]["invoice_no"] + 1;
//     // Update the sequence
//     data = { invoice_no: retSerialNumber };

//     retSerialNumber =
//       "MM/IN/" +
//       dateRange +
//       "/" +
//       zeroPrefix[retSerialNumber.toString().length - 1] +
//       retSerialNumber;
//     // console.log(retSerialNumber);
//   }

//   // update
//   await serial_no.findOneAndUpdate(condition, data, (err, obj) => {});
//   return retSerialNumber;
// };

const getAllGRNDetails = async (purchase_id) => {
  const grn_details = await purchase
    .find({ purchase_id: purchase_id }, (err, purchaseDetails) => {
      if (err) {
        return;
      } else {
        return purchaseDetails;
      }
    })
    .select({ received_item_details: 1, grn_details: 1, _id: 0 });

  return grn_details[0];
};

const getAllDeliveryDetails = async (sales_id) => {
  const delivery_details = await sales
    .find({ sales_id: sales_id }, (err, salesDetails) => {
      if (err) {
        return;
      } else {
        return salesDetails;
      }
    })
    .select({ delivery_order_item_details: 1, delivery_order_no: 1, delivery_order_details: 1, _id: 0 });

  return delivery_details[0];
};

const getAllDispatchDetails = async (sales_id) => {
  const dispatch_details = await sales
    .find({ sales_id: sales_id }, (err, salesDetails) => {
      if (err) {
        return;
      } else {
        return salesDetails;
      }
    })
    .select({ dispatch_order_item_details: 1, sales_order_item_details: 1, dispatch_order_no: 1, dispatch_order_details: 1, _id: 0 });

  return dispatch_details[0];
};

const getAllInvoiceDetails = async (sales_id) => {
  const invoice_details = await sales
    .find({ sales_id: sales_id }, (err, salesDetails) => {
      if (err) {
        return;
      } else {
        return salesDetails;
      }
    })
    .select({ invoice_item_details: 1, invoice_other_charges: 1, invoice_no: 1, invoice_details: 1, _id: 0 });
  // console.log("tam", invoice_details);

  return invoice_details[0];
};

const masterInsert = async (req, res) => {
  const data = req.body;
  const URL = req.url;
  const errors = {};
  let newMaster = "";

  switch (URL) {
    //storage
    case "/storage/insert":
      newMaster = new storage(data);
      break;
    case "/module/insert":
      newMaster = new modules(data);
      break;

    case "/terms/insert":
      newMaster = new terms(data);
      break;

    case "/vehicle/insert":
      newMaster = new vehicle(data);
      break;

    case "/area/insert":
      newMaster = new area(data);
      break;


    case "/category/insert":
      newMaster = new category(data);
      break;

    case "/brand/insert":
      newMaster = new brand(data);
      break;

    case "/statutory_type/insert":
      newMaster = new statutory_type(data);
      break;

    case "/uom/insert":
      newMaster = new uom(data);
      break;

    case "/item/insert":

      // console.log("IT===>>",data)

      newMaster = new item(data);
      break;

    case "/showrooms-warehouse/insert":
      newMaster = new showrooms_warehouse(data);
      break;

    case "/tax_master/insert":
      newMaster = new tax_master(data);
      break;

    case "/charges/insert":
      newMaster = new charges(data);
      break;

    case "/menu/insert":
      newMaster = new menu(data);
      break;

    case "/primary_group/insert":
      newMaster = new primary_group(data);
      break;

    case "/source/insert":
      newMaster = new source(data);
      break;

    case "/role/insert":
      newMaster = new role(data);
      break;

    case "/users/insert":
      newMaster = new User(data);
      break;

    case "/master_group/insert":
      newMaster = new master_group(data);
      break;

    case "/customer/insert":
      newMaster = new customer(data);
      break;

    case "/vendor/insert":
      newMaster = new vendor(data);
      break;

      case "/waste/insert":
        newMaster = new waste(data);

        if (data.wasteType === "Converted") {
          await itemStock.findOneAndUpdate(
            {
              item_id: data.waste_item_id,
              showroom_warehouse_id: Number(data.showroom_warehouse_id)
            },
            {
              $inc: {
                closingStock: - Number(data.quantity)
              }
            }
          )
  
          await itemStock.findOneAndUpdate(
            {
              item_id: data.convertedToId,
              showroom_warehouse_id: Number(data.showroom_warehouse_id)
            },
            {
              $inc: {
                closingStock: Number(data.convertedQty)
              }
            }
          )
        }
        else{
          await itemStock.findOneAndUpdate(
            {
              item_id: data.waste_item_id,
              showroom_warehouse_id: Number(data.showroom_warehouse_id)
            },
            {
              $inc: {
                closingStock: - Number(data.quantity)
              }
            }
          )
        }
  
        break;

    //NEW
    case "/journal/insert":
      //  console.log("HK",data)
      let newData_Journal = data
      const serial_no_Journal = await generateSerialNumber("J")
      newData_Journal = { ...newData_Journal, voucher_no: serial_no_Journal }
      newMaster = new journal(newData_Journal);
      break;

    case "/bank/insert":
      newMaster = new bank(data);
      break;
    case "/enquiry/insert":
      newMaster = new enquiry(data);
      break;
    case "/receipt_payment/insert":
      let newData3 = data;
      // const serial_no_rp = await generateSerialNumber("R");
      const serial_no_rp = await generateSerialNumber(newData3.receipt_payment_type);
      newData3 = { ...newData3, voucher_no: serial_no_rp };
      newMaster = new receipt_payment(newData3);
      break;

    case "/stock_transfer/insert":
      let newData4 = data;
      const serial_no_st = await generateSerialNumber(data.module);

      newData4 = { ...newData4, stock_transfer_no: serial_no_st };

      newMaster = new stock_transfer(newData4);

      data.stock_transfer_details.map(async (r) => {
        await itemStock.findOneAndUpdate(
          {
            item_id: r.item_id,
            showroom_warehouse_id: data.from_showroom_warehouse_id
          },
          {
            $inc: {
              closingStock: - Number(r.quantity)
            }
          }
        )

        await itemStock.findOneAndUpdate(
          {
            item_id: r.item_id,
            showroom_warehouse_id: data.to_showroom_warehouse_id
          },
          {
            $inc: {
              closingStock: Number(r.quantity)
            }
          }
        )
      })
      
      break;

    case "/opening_stock/insert":
      newMaster = new opening_stock(data);
      break;
    case "/direct_purchase/insert":
      newMaster = new direct_purchase(data);
      break;

    //Purchse Return
    case "/purchase_return/insert":
      let newData9 = data;
      const serial_no_return = await generateSerialNumber(data.module);

      if (data.module === "PURCHASE_RETURN_ORDER") {

        newData9 = { ...newData9, purchase_return_no: serial_no_return };
      }

      newMaster = new purchase_return(newData9);

      data.return_details[0].item_details.map(async (r) => {
        await itemStock.findOneAndUpdate(
          {
            item_id: r.item_id,
            showroom_warehouse_id: data.showroom_warehouse_id
          },
          {
            $inc: {
              closingStock: - Number(r.return_qty)
            }
          }
        )
      })

      break;


    //Sales Return
    case "/sales_return/insert":
      let newData10 = data;
      const serial_no_sales_return = await generateSerialNumber(data.module);

      if (data.module === "SALES_RETURN") {

        newData10 = { ...newData10, sales_return_no: serial_no_sales_return };
      }

      newMaster = new sales_return(newData10);

      break;

    case "/purchase/insert":
      let newData2 = data;
      if (data.module === "DIRECT PURCHASE") {
        const serial_no = await generateSerialNumber(data.module, data.grn_details[0]?.grn_date);
        // console.log(serial_no);
        // console.log("vvvvvv");
        newData2 = { ...newData2, grn_no: serial_no };
      }

      if (data.module === "PURCHASE_ORDER") {
        const serial_no = await generateSerialNumber(data.module, data.po_date);

        newData2 = { ...newData2, po_number: serial_no };
      }

      newMaster = new purchase(newData2);
      break;

    case "/status/insert":
      newMaster = new status(data);
      break;

    case "/task_todo/insert":
      newMaster = new task_todo(data);
      break;
    case "/stock_movement/insert":
      // console.log("29033",data)
      newMaster = new stock_movement(data);
      break;

    case "/sales/insert":
      let newData = data;

      if (data.module === "ENQUIRY") {

        const serial_number = await generateSerialNumber(data.module, data.enquiry_details.enquiry_date);
        newData = { ...newData, enquiry_no: serial_number };
      }
      else if (data.module === "DIRECT_QUOTATION") {

        const enquiry_number = await generateSerialNumber("ENQUIRY");
        const quotation_number = await generateSerialNumber("QUOTATION");
        newData = {
          ...newData,
          quotation_no: quotation_number,
          enquiry_no: enquiry_number,
        };
      } else if (data.module === "DIRECT_SALES_ORDER") {

        const enquiry_number = await generateSerialNumber("ENQUIRY");
        const quotation_number = await generateSerialNumber("QUOTATION");
        const sales_order_number = await generateSerialNumber("SALES_ORDER");

        newData = {
          ...newData,
          quotation_no: quotation_number,
          enquiry_no: enquiry_number,
          sales_order_no: sales_order_number,
        };
      } else if (data.module === "DIRECT_INVOICE") {

        const enquiry_number = await generateSerialNumber("ENQUIRY");
        const quotation_number = await generateSerialNumber("QUOTATION");
        const sales_order_number = await generateSerialNumber("SALES_ORDER");
        const direct_invoice_order_number = await generateSerialNumber("DIRECT_INVOICE");

        newData = {
          ...newData,
          quotation_no: quotation_number,
          enquiry_no: enquiry_number,
          sales_order_no: sales_order_number,
          invoice_no: direct_invoice_order_number,
          invoice_details: [{ ...newData.invoice_details, invoice_no: direct_invoice_order_number }]
        };

        data.invoice_item_details.map( async(r)=>{
          await itemStock.findOneAndUpdate(
            {
            item_id: r.item_id,
            showroom_warehouse_id: r.showroom_warehouse_id
          },
          {
            $inc:{
              closingStock: - Number(r.now_dispatch_qty)
            }
          }
          )
        })
      }

      newMaster = new sales(newData);
      break;
  }

  const validatePayload = (data, schemaDef) => {
    let error = [];
    let obj = {};
    const schemaFields = Object.keys(schemaDef);
    for (let iCtr = 0; iCtr < schemaFields.length; iCtr++) {
      if (schemaDef[schemaFields[iCtr]]["required"] === true) {
        if (typeof schemaDef[schemaFields[iCtr]]["default"] === "undefined") {
          if (
            typeof data[schemaFields[iCtr]] === "undefined" ||
            data[schemaFields[iCtr]] === ""
          ) {
            error.push(schemaFields[iCtr]);
          }
        }
      }
    }

    if (error.length > 0) {
      obj = { Required: error };
    }
    return obj;
  };
  // let returnValid=validatePayload(data, categorySchemaDef)
  // return res.status(200).json(returnValid)

  const insertedMaster = await newMaster.save();
  // console.log(insertedMaster,"2706");

  // if(data.module === "STOCK_TRANSFER" && insertedMaster?.stock_tranfer_details ){
  //   insertedMaster?.stock_tranfer_details.map((item =>{
  //      const data = {
  //        transaction_type:"STF",
  //        transaction_id:insertedMaster.stock_transfer_id,
  //        transaction_date:insertedMaster.inserted_by_date,
  //        showroom_warehouse_id:insertedMaster.to_showroom_warehouse_id,
  //        item_id:item.item_id,
  //        plus_qty:item.quantity,
  //        unit_id:item.uom_id,
  //      }

  //      const newData = new stock_movement(data);

  //      newData.save();
  //   }))
  //   insertedMaster?.stock_tranfer_details.map((item =>{
  //     const data = {
  //       transaction_type:"STF",
  //       transaction_id:insertedMaster.stock_transfer_id,
  //       transaction_date:insertedMaster.inserted_by_date,
  //       showroom_warehouse_id:insertedMaster.from_showroom_warehouse_id,
  //       item_id:item.item_id,
  //       minus_qty:item.quantity,
  //       unit_id:item.uom_id,
  //     }
  //     const newData = new stock_movement(data);
  //     newData.save();
  //   }))

  // }

  return res.status(200).json({
    ...insertedMaster._doc,
    _id: insertedMaster._id,
    enquiry_no: insertedMaster?.enquiry_no,
    quotation_no: insertedMaster?.quotation_no,
    sales_order_no: insertedMaster?.sales_order_no,
    sales_id: insertedMaster?.sales_id,
    grn_no: insertedMaster?.grn_no,
    po_number: insertedMaster?.po_number,
    stock_transfer_no: insertedMaster?.stock_transfer_no,
    voucher_no: insertedMaster?.voucher_no,
    invoice_no: insertedMaster?.invoice_no,
    sales_return_no: insertedMaster?.sales_return_no,
  });
};

const viewCatgeory = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const category_id = req.body.category_id;
  const parent_category_id = req.body.parent_category_id;
  const category_name = req.body.category;
  const hsn_code = req.body.hsn_code;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const serachQuery = req.body.query;

  // Fetching all categories for showing Parent Category



  // Details by ID
  if (category_id) {
    condition = { ...condition, category_id: category_id };
  }

  // Details by Parent Category ID
  if (parent_category_id >= 0) {
    condition = { ...condition, parent_category_id: parent_category_id };
  }

  // Details by Name
  if (category_name) {
    condition = {
      ...condition,
      category: { $regex: "^" + category_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (serachQuery) {
    condition = {
      ...condition,
      $or: [
        { category: { $regex: serachQuery, $options: "i" } },
        { details: { $regex: serachQuery, $options: "i" } },
      ],
    }; // Matching string also compare incase-sensitive
  }


  let categoriesData = await category.aggregate([
    {
      $match: condition
    },
    {
      $addFields: {
        action_items: {

          can_edit: true,
          can_delete: false,
          can_activate: "$active_status" === "Y" ? false : true,
          can_deactivate: "$active_status" === "Y" ? true : false,

        }
      }
    },

    {
      $project:
      {
        // "parent_category_name": 1,
        "parent_category_id": 1,
        "picture_path": 1,
        "hsn": 1,
        "gst": 1,
        "action_items": 1,
        "active_status": 1,
        "inserted_by_id": 1,
        "category_id": 1,
        "category": 1,
        "details": 1,
        "edited_by_id": 1,
        "deleted_by_id": 1,
        "edit_log": 1,
        "inserted_by_date": 1,
        "edit_by_date": 1,
        "deleted_by_date": 1,
        "__v": 1,
      },
    },

    /////////////////////////////////////
    {
      $lookup: {
        from: "t_100_categories",
        let: { "parent_category_id": "$parent_category_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$parent_category_id", "$$parent_category_id"] } } },
          { $project: { "category": 1 } }
        ],
        as: 'primary_data',
      },
    },
    { $addFields: { parent_category_name: { $first: "$primary_data.category" } } },
    { $unset: ["primary_data"] },

    {
      $sort: {
        category: 1
      }
    }
  ]);

  if (categoriesData) {

    return res.status(200).json(categoriesData);
  } else {
    return res.status(200).json([]);
  }

};




const deleteCategory = async (req, res) => {
  const category_id = req.body.category_id;
  const condition = { category_id: category_id };
  await category.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updateCategory = async (req, res) => {
  const condition = { category_id: req.body.category_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.Category_List,
    data: condition,
  });


  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const categoryDetails = myData.data;
  // data.edit_log = categoryDetails;

  await category.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const viewBrand = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const brand_id = req.body.brand_id;
  const parent_brand_id = req.body.parent_brand_id;
  const brand_name = req.body.brand;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const serachQuery = req.body.query;


  // Details by ID
  if (brand_id) {
    condition = { ...condition, brand_id: brand_id };
  }

  // Details by Parent Brand ID
  if (parent_brand_id >= 0) {
    condition = { ...condition, parent_brand_id: parent_brand_id };
  }

  // Details by Name
  if (brand_name) {
    condition = {
      ...condition,
      brand: { $regex: "^" + brand_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (serachQuery) {
    condition = {
      ...condition,
      $or: [
        { brand: { $regex: serachQuery, $options: "i" } },
        { details: { $regex: serachQuery, $options: "i" } },
      ],
    }; // Matching string also compare incase-sensitive
  }

  let brandData = await brand.aggregate([
    {
      $match: condition
    },
    {
      $addFields: {
        action_items: {

          can_edit: true,
          can_delete: false,
          can_activate: "$active_status" === "Y" ? false : true,
          can_deactivate: "$active_status" === "Y" ? true : false,

        }
      }
    },

    {
      $project: {

        "action_items": 1,
        "active_status": 1,
        "inserted_by_id": 1,
        "parent_brand_id": 1,
        "brand": 1,
        "details": 1,
        "brand_id": 1,
        "edited_by_id": 1,
        "deleted_by_id": 1,
        "edit_log": 1,
        "inserted_by_date": 1,
        "edit_by_date": 1,
        "deleted_by_date": 1,
        "__v": 1,

      },
    },

    {
      $sort: {
        brand: 1
      }
    }
  ]);
  if (brandData) {

    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }

};

const deleteBrand = async (req, res) => {
  const brand_id = req.body.brand_id;
  const condition = { brand_id: brand_id };
  await brand.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updateBrand = async (req, res) => {
  const condition = { brand_id: req.body.brand_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.Brand_List,
    data: condition,
  });


  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);



  // const brandDetails = myData.data;
  // data.edit_log = brandDetails;

  await brand.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

// warehouse rooms
const view_showrooms_warehouse = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const showrooms_warehouse_id = req.body.showrooms_warehouse_id;
  const showrooms_warehouse_type = req.body.showrooms_warehouse_type;
  const showrooms_warehouse_name = req.body.showrooms_warehouse;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;


  // Details by ID
  if (showrooms_warehouse_id) {
    condition = {
      ...condition,
      showrooms_warehouse_id: showrooms_warehouse_id,
    };
  }

  // Details by Name
  if (showrooms_warehouse_name) {
    condition = {
      ...condition,
      showrooms_warehouse_name: {
        $regex: "^" + showrooms_warehouse_name + "$",
        $options: "i",
      },
    };
  } // Matching exact text but incase-sensitive

  // Details by Type
  if (showrooms_warehouse_type) {
    condition = {
      ...condition,
      showrooms_warehouse_type: {
        $regex: "^" + showrooms_warehouse_type + "$",
        $options: "i",
      },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { showrooms_warehouse_name: { $regex: searchQuery, $options: "i" } },
        { showrooms_warehouse_type: { $regex: searchQuery, $options: "i" } },
      ],
    }; // Matching string also compare incase-sensitive
  }

  let showrooms_warehouseData = await showrooms_warehouse.aggregate([
    {
      $match: condition
    },
    {
      $addFields: {
        action_items: {

          can_edit: true,
          can_delete: false,
          can_activate: "$active_status" === "Y" ? false : true,
          can_deactivate: "$active_status" === "Y" ? true : false,

        }
      }
    },

    {
      $project: {

        "action_items": 1,
        "gst": 1,
        "address": 1,
        "active_status": 1,
        "inserted_by_id": 1,
        "showrooms_warehouse_id": 1,
        "showrooms_warehouse_type": 1,
        "showrooms_warehouse": 1,
        "edited_by_id": 1,
        "deleted_by_id": 1,
        "edit_log": 1,
        "inserted_by_date": 1,
        "edit_by_date": 1,
        "deleted_by_date": 1,
        "__v": 1,




      },
    },

    {
      $sort: {
        name: 1
      }
    }
  ]);
  if (showrooms_warehouseData) {

    return res.status(200).json(showrooms_warehouseData);
  } else {
    return res.status(200).json([]);
  }


};

const view_module = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const module_id = req.body.module_id;
  const module_name = req.body.module;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (module_id) {
    condition = { ...condition, module_id: module_id };
  }

  // Details by Name
  if (module_name) {
    condition = {
      ...condition,
      module_name: { $regex: "^" + module_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ module_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await modules
    .find(condition, (err, moduleData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (moduleData) {
        let returnDataArr = moduleData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { module_id: 1, module: 1, _id: 0 })
    .sort({ module: 1 });
};
const deleteModule = async (req, res) => {
  const module_id = req.body.module_id;
  const condition = { module_id: module_id };
  await modules.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};
const updateModules = async (req, res) => {
  const condition = { module_id: req.body.module_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.Modules_List,
    data: condition,
  });


  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const modulesDetails = myData.data;
  // data.edit_log = modulesDetails;

  await modules.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const view_terms = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const terms_id = req.body.terms_id;
  const terms_name = req.body.terms;

  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  let all_modules = await modules
    .find({}, (err, modulesData) => {
      return modulesData;
    })
    .select({ module_id: 1, module: 1, _id: 0 });
  const modulesById = (all_modules, module_id) => {
    if (module_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_modules.length; iCtr++) {
      if (all_modules[iCtr]["module_id"] === module_id)
        return all_modules[iCtr]["module"];
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (terms_id) {
    condition = { ...condition, terms_id: terms_id };
  }

  // Details by Name
  if (terms_name) {
    condition = {
      ...condition,
      terms_name: { $regex: "^" + terms_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ terms_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await terms
    .find(condition, (err, termsData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (termsData) {
        let returnDataArr = termsData.map((data) => ({
          module_name: modulesById(all_modules, data.module_id),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { terms_id: 1, terms: 1, _id: 0 })
    .sort({ terms: 1 });
};




const view_vehicle = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const vehicle_id = req.body.vehicle_id;
  const vehicle_no = req.body.vehicle_no;

  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.keyword_pharse;


  // Details by ID
  if (vehicle_id) {
    condition = { ...condition, vehicle_id: vehicle_id };
  }

  // Details by Name
  if (vehicle_no) {
    condition = {
      ...condition,
      vehicle_no: { $regex: "^" + vehicle_no + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  // console.log(vehicle_no,"WB42AB1001")
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { vehicle_no: new RegExp(searchQuery, "i") },
        { contact_person: new RegExp(searchQuery, "i") },
        { contact_no: new RegExp(searchQuery, "i") },
        { vehicle_type: new RegExp(searchQuery, "i") },


      ],
    };
    ; // Matching string also compare incase-sensitive
  }
  let vehicleData = await vehicle.aggregate([
    {
      $match: condition
    },
    {
      $addFields: {
        action_items: {

          can_edit: true,
          can_delete: false,
          can_activate: "$active_status" === "Y" ? false : true,
          can_deactivate: "$active_status" === "Y" ? true : false,

        }
      }
    },

    {
      $project: {

        "action_items": 1,
        "active_status": 1,
        "inserted_by_id": 1,
        "vehicle_id": 1,
        "vehicle_no": 1,
        "vehicle_type": 1,
        "contact_no": 1,
        "contact_person": 1,
        "details": 1,
        "edited_by_id": 1,
        "deleted_by_id": 1,
        "edit_log": 1,
        "inserted_by_date": 1,
        "edit_by_date": 1,
        "deleted_by_date": 1,
        "__v": 1,

      },
    },

    {
      $sort: {
        contact_person: 1
      }
    }
  ]);

  if (vehicleData) {
    return res.status(200).json(vehicleData);
  } else {
    return res.status(200).json([]);
  }

};




const deleteVehicle = async (req, res) => {
  const vehicle_id = req.body.vehicle_id;
  const condition = { vehicle_id: vehicle_id };
  await vehicle.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updateVehicle = async (req, res) => {
  const condition = { vehicle_id: req.body.vehicle_id };
  const data = req.body;
  // console.log(req.body,"bodyyy");
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.Vehicle_list,
    data: condition,
  });

  // const vehicleDetails = myData.data;
  // data.edit_log = vehicleDetails;

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);



  await vehicle.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};



const view_area = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const area_id = req.body.area_id;


  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  let all_modules = await modules
    .find({}, (err, modulesData) => {
      return modulesData;
    })
    .select({ module_id: 1, module: 1, _id: 0 });
  const modulesById = (all_modules, module_id) => {
    if (module_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_modules.length; iCtr++) {
      if (all_modules[iCtr]["module_id"] === module_id)
        return all_modules[iCtr]["module"];
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (area_id) {
    condition = { ...condition, area_id: area_id };
  }



  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ terms_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await area
    .find(condition, (err, termsData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (termsData) {
        let returnDataArr = termsData.map((data) => ({
          module_name: modulesById(all_modules, data.module_id),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { terms_id: 1, terms: 1, _id: 0 })
    .sort({ terms: 1 });
};




const updateArea = async (req, res) => {
  const condition = { area_id: req.body.area_id };
  const data = req.body;
  //console.log(req.body,"bodyyy");
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.area_list,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);



  // const areaDetails = myData.data;
  // data.edit_log = areaDetails;

  await area.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};




const deleteArea = async (req, res) => {
  const area_id = req.body.area_id;
  const condition = { area_id: area_id };
  await area.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};





const updateTerms = async (req, res) => {
  const condition = { terms_id: req.body.terms_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.Terms_List,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);




  // const termsDetails = myData.data;
  // data.edit_log = termsDetails;

  await terms.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const deleteTerms = async (req, res) => {
  const terms_id = req.body.terms_id;
  const condition = { terms_id: terms_id };
  await terms.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};


const view_statutory = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const statutory_id = req.body.statutory_id;
  const statutory_name = req.body.statutory;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (statutory_id) {
    condition = { ...condition, statutory_id: statutory_id };
  }

  // Details by Name
  if (statutory_name) {
    condition = {
      ...condition,
      statutory_name: { $regex: "^" + statutory_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ statutory_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await statutory_type
    .find(condition, (err, statutoryData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (statutoryData) {
        let returnDataArr = statutoryData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { statutory_id: 1, statutory: 1, _id: 0 })
    .sort({ statutory_type: 1 });
};
const deleteStatutory = async (req, res) => {
  const statutory_type_id = req.body.statutory_type_id;
  const condition = { statutory_type_id: statutory_type_id };
  await statutory_type.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};
const updateStatutory = async (req, res) => {
  const condition = { statutory_type_id: req.body.statutory_type_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.Statutory_type_List,
    data: condition,
  });

  const statutoryDetails = myData.data;
  data.edit_log = statutoryDetails;

  await statutory_type.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const view_tax_master = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const tax_master_id = req.body.tax_master_id;
  const tax_master_name = req.body.tax_master;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  let all_ledger_account = await ledger_account
    .find({}, (err, ledger_accountData) => {
      return ledger_accountData;
    })
    .select({ ledger_account_id: 1, ledger_account: 1, _id: 0 });
  const ledger_accountById = (all_ledger_account, ledger_account_id) => {
    if (ledger_account_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_ledger_account.length; iCtr++) {
      if (all_ledger_account[iCtr]["ledger_account_id"] === ledger_account_id)
        return all_ledger_account[iCtr]["ledger_account"];
    }
  };
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (tax_master_id) {
    condition = { ...condition, tax_master_id: tax_master_id };
  }

  // Details by Name
  if (tax_master_name) {
    condition = {
      ...condition,
      tax_master_name: { $regex: "^" + tax_master_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ tax_master_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await tax_master
    .find(condition, (err, tax_masterData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (tax_masterData) {
        let returnDataArr = tax_masterData.map((data) => ({
          ledger_account_name: ledger_accountById(
            all_ledger_account,
            data.ledger_account_id
          ),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { tax_master_id: 1, tax_master: 1, _id: 0 });
};

const updateTaxMaster = async (req, res) => {
  const condition = { tax_master_id: req.body.tax_master_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.tax_master_List,
    data: condition,
  });


  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const taxMasterDetails = myData.data;
  // data.edit_log = taxMasterDetails;

  await tax_master.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};
const deleteTaxMaster = async (req, res) => {
  const tax_master_id = req.body.tax_master_id;
  const condition = { tax_master_id: tax_master_id };
  await tax_master.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const view_uom = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const uom_id = req.body.uom_id;
  const uom_name = req.body.uom
    ;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;


  // Details by ID
  if (uom_id) {
    condition = { ...condition, uom_id: uom_id };
  }

  // Details by Name
  if (uom_name) {
    condition = {
      ...condition,
      uom_name: { $regex: "^" + uom_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ uom_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }


  let uomData = await uom.aggregate([
    {
      $match: condition
    },
    {
      $addFields: {
        action_items: {

          can_edit: true,
          can_delete: false,
          can_activate: "$active_status" === "Y" ? false : true,
          can_deactivate: "$active_status" === "Y" ? true : false,

        }
      }
    },

    {
      $project: {
        "higher_unit": 1,
        "lower_unit": 1,
        "higher_unit_value": 1,
        "lower_unit_value": 1,
        "caption": 1,
        "lower_caption": 1,
        "uom_id": 1,
        "action_items": 1,
        "active_status": 1,
        "inserted_by_id": 1,
        "edited_by_id": 1,
        "deleted_by_id": 1,
        "edit_log": 1,
        "inserted_by_date": 1,
        "edit_by_date": 1,
        "deleted_by_date": 1,
        "__v": 1,

      },
    },

    {
      $sort: {
        higher_unit: 1
      }
    }
  ]);


  if (uomData) {

    return res.status(200).json(uomData);
  } else {
    return res.status(200).json([]);
  }
};

const updateUom = async (req, res) => {
  const condition = { uom_id: req.body.uom_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.uom_list,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const uomDetails = myData.data;
  // data.edit_log = uomDetails;

  await uom.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};
const deleteUom = async (req, res) => {
  const uom_id = req.body.uom_id;
  const condition = { uom_id: uom_id };
  await uom.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};


const view_ledger_account_search = async (req, res) => {
  let condition = {
     deleted_by_id: 0 ,
   
  
  };
  let condi = {  };


  const ledger_account_id = req.body.ledger_account_id;
  const ledger_account_name = req.body.ledger_account;
  const dr_cr_status = req.body.dr_cr_status;
  // const closingBalance = req.body.closingBalance;


  const ledger_group_id = req.body.ledger_group_id;
  const ledger_group_mis = req.body.ledger_group_mis;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;


 


  let all_ledger_group = await ledger_group
    .find({}, (err, ledger_groupData) => {
      return ledger_groupData;
    })
    .select({ ledger_group_id: 1, ledger_group: 1, _id: 0 });

  const ledger_groupById = (all_ledger_group, ledger_group_id) => {
    if (ledger_group_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_ledger_group.length; iCtr++) {
      if (all_ledger_group[iCtr]["ledger_group_id"] === ledger_group_id)
        return all_ledger_group[iCtr]["ledger_group"];
    }
  };

  let dataLedgerStorage = await storage.find(
    {},
    { closingBalance: 1, closeCrDrStatus: 1,ledgerId:1 }
  );

  const ledgerClosing = (ledgerId) => {
    if (ledgerId === 0) return "--";
    for (let iCtr = 0; iCtr < dataLedgerStorage.length; iCtr++) {
      if (dataLedgerStorage[iCtr]["ledgerId"] === ledgerId)
        return dataLedgerStorage[iCtr].closingBalance;
    }
  };

  const ledgerClosingStatus = (ledgerId) => {
    if (ledgerId === 0) return "--";
    for (let iCtr = 0; iCtr < dataLedgerStorage.length; iCtr++) {
      if (dataLedgerStorage[iCtr]["ledgerId"] === ledgerId)
        return dataLedgerStorage[iCtr].closeCrDrStatus;
    }
  };
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (ledger_account_id) {
    condition = { ...condition, ledger_account_id: ledger_account_id };
  }
  if (ledger_group_id) {
    condition = { ...condition, ledger_group_id: ledger_group_id };
  }

 

  if (ledger_group_mis) {
    condition = { ...condition, ledger_group_id: ledger_group_mis };
  }

  // Details by Name
  if (ledger_account_name) {
    // console.log(ledger_account_name,"999freched");
    condition = {
      ...condition,
      // ledger_account_name: {
      //   $regex: "^" + ledger_account_name + "$",
      //   $options: "i",
      // },
      ledger_account: ledger_account_name,
    };
  } // Matching exact text but incase-sensitive
  //console.log(condition,"conditionconditioncondition")
  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ ledger_account_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await ledger_account
    .find(condition, (err, ledger_accountData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (ledger_accountData) {
        console.log(ledger_accountData);
        let returnDataArr = ledger_accountData.map((data) => ({
          ledger_group_name: ledger_groupById(
            all_ledger_group,
            data.ledger_group_id
          ),
          ledgerClosingBalance: ledgerClosing(data.ledger_account_id),
          ledgerClosingStatus:ledgerClosingStatus(data.ledger_account_id),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(
      short_data === true && {
        ledger_account_id: 1,
        ledger_account: 1,
        ledger_group_id: 1,
        opening_balance: 1,
        dr_cr_status: 1,
        _id: 0,
      }
    )
    .sort({ ledger_account: 1 });
};


const view_ledger_account = async (req, res) => {
  const condition = {
    deleted_by_id: 0,
  };

  const {ledger_account_id , searchQuery, ledger_group_id, type} = req.body;
  
  const ledger_account_name = req.body.ledger_account;
 

  if (ledger_account_id) {
    condition.ledger_account_id = ledger_account_id;
  }

  if (ledger_account_name) {
    condition.ledger_account = ledger_account_name;
  }
  if (ledger_group_id) {
    condition.ledger_group_id = ledger_group_id;
  }
  if (type) {
    condition.type = type;
  }


  if (searchQuery) {
    condition.$or = [
      { ledger_account_name: { $regex: searchQuery, $options: "i" } },
    ];
  }

  const ledger_accountData = await ledger_account.aggregate([
    {
      $match: condition,
    },
    {
      $project:{
        ledger_account_id: 1,
        ledger_account: 1,
        ledger_group_id: 1,
        opening_balance: 1,
        dr_cr_status: 1,
      }
    },
    // {
    //         $sort: { ledger_account: 1 },
    //       },
  ])
    

  if (ledger_accountData) {
    return res.status(200).json(ledger_accountData);
  } else {
    return res.status(200).json([]);
  }
};

//New

// const view_ledger_account = async (req, res) => {
//   try {
//     const pipeline = [
//       { $match: { deleted_by_id: 0 } },
//       { $project: { ledger_account_id: 1, ledger_account: 1, _id: 0 } },
//       { $sort: { ledger_account: 1 } }
//     ];

//     const ledger_accountData = await ledger_account.aggregate(pipeline).toArray();

//     res.status(200).json(ledger_accountData);
//   } catch (err) {
//     res.status(500).json({ Error: err.message });
//   }
// };

// const view_ledger_account = async (req, res) => {
//   let condition = { deleted_by_id: 0 };
//   const ledger_account_id = req.body.ledger_account_id;
//   const ledger_account_name = req.body.ledger_account;
//   const ledger_group_id = req.body.ledger_group_id;
//   const ledger_group_mis = req.body.ledger_group_mis;
//   const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
//   const searchQuery = req.body.query;

//   let all_ledger_group = await ledger_group
//     .find({}, (err, ledger_groupData) => {
//       return ledger_groupData;
//     })
//     .select({ ledger_group_id: 1, ledger_group: 1, _id: 0 });

//   const ledger_groupById = (all_ledger_group, ledger_group_id) => {
//     if (ledger_group_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_ledger_group.length; iCtr++) {
//       if (all_ledger_group[iCtr]["ledger_group_id"] === ledger_group_id)
//         return all_ledger_group[iCtr]["ledger_group"];
//     }
//   };
//   const actionValues = (active_status) => {
//     return {
//       can_edit: true,
//       can_delete: false,
//       can_activate: active_status === "Y" ? false : true,
//       can_deactivate: active_status === "Y" ? true : false,
//     };
//   };

//   // Details by ID
//   if (ledger_account_id) {
//     condition = { ...condition, ledger_account_id: ledger_account_id };
//   }
//   if (ledger_group_id) {
//     condition = { ...condition, ledger_group_id: ledger_group_id };
//   }

//   if (ledger_group_mis) {
//     condition = { ...condition, ledger_group_id: ledger_group_mis };
//   }

//   // Details by Name
//   if (ledger_account_name) {
//     // console.log(ledger_account_name,"999freched");
//     condition = {
//       ...condition,
//       // ledger_account_name: {
//       //   $regex: "^" + ledger_account_name + "$",
//       //   $options: "i",
//       // },
//       ledger_account: ledger_account_name
//     };

//   } // Matching exact text but incase-sensitive
//   //console.log(condition,"conditionconditioncondition")
//   // Search
//   if (searchQuery) {
//     condition = {
//       ...condition,
//       $or: [{ ledger_account_name: { $regex: searchQuery, $options: "i" } }],
//     }; // Matching string also compare incase-sensitive
//   }

//   await ledger_account
//     .find(condition, (err, ledger_accountData) => {
//       if (err) {
//         return res.status(500).json({ Error: err });
//       }
//       if (ledger_accountData) {
//         let returnDataArr = ledger_accountData.map((data) => ({
//           ledger_group_name: ledger_groupById(
//             all_ledger_group,
//             data.ledger_group_id
//           ),
//           action_items: actionValues(data.active_status),
//           ...data["_doc"],
//         }));
//         return res.status(200).json(returnDataArr);
//       } else {
//         return res.status(200).json([]);
//       }
//     })
//     .select(
//       short_data === true && { ledger_account_id: 1, ledger_account: 1, ledger_group_id: 1, opening_balance: 1, dr_cr_status: 1, _id: 0 }
//     )
//     .sort({ ledger_account: 1 });


// };

const view_ledger_account_byName = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  // const ledger_account_id = req.body.ledger_account_id;
  const ledger_account_id = 2499;
  const type_id = req.body.type_id;
  const type = req.body.type;
  const ledger_account_name = req.body.ledger_account;
  const ledger_group_id = req.body.ledger_group_id;
  const ledger_group_mis = req.body.ledger_group_mis;
  //console.log(ledger_account_name)

  if (type_id) {
    condition = { ...condition, type_id: type_id };
  }
  if (type) {
    condition = { ...condition, type: type};
  }

  if (ledger_account_name) {
    condition = { ...condition, ledger_account: { $regex: ledger_account_name, $options: "i" } };
  }


  let ledgerInfo = await ledger_account.aggregate([

    // { $match:{ ledger_account: "Alcor Paper Packaging Llp" }},
    // {$match:{ledger_account:{ $regex: ledger_account_name , $options: "i" } }},
    // {$match:{type_id:type_id }},

    // {
    //   $project:{
    //     _id:0,
    //     ledger_account:1,
    //     ledger_account_id:1
    //   }
    // },
    {
      $match: condition
    },
  ])

  if (ledgerInfo) {
    return res.status(200).json(ledgerInfo);
  } else {
    return res.status(200).json([]);
  }
};
const deleteLedgerAccount = async (req, res) => {
  const ledger_account_id = req.body.ledger_account_id;
  const condition = { ledger_account_id: ledger_account_id };
  await ledger_account.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updateLedgerAccount = async (req, res) => {
  const condition = { ledger_account_id: req.body.ledger_account_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");
  const myData = await axios({
    method: "post",
    url: apiURL + apiList.ledger_account_list,
    data: condition,
  });

  // const changed = trackChange(myData.data[0], req.body)
  // data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);

  const ledgerAccountDetails = myData.data;
  data.edit_log = ledgerAccountDetails;

  await ledger_account.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const view_ledger_group = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const ledger_group_name = req.body.ledger_group;
  const ledger_group_id = req.body.ledger_group_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  let all_primary_group = await primary_group
    .find({}, (err, primary_groupData) => {
      return primary_groupData;
    })
    .select({ primary_group_id: 1, primary_group: 1, _id: 0 });
  const primary_groupById = (all_primary_group, primary_group_id) => {
    if (primary_group_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_primary_group.length; iCtr++) {
      if (all_primary_group[iCtr]["primary_group_id"] === primary_group_id)
        return all_primary_group[iCtr]["primary_group"];
    }
  };
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (ledger_group_id) {
    condition = { ...condition, ledger_group_id: ledger_group_id };
  }

  // Details by Name
  if (ledger_group_name) {
    condition = {
      ...condition,
      ledger_group_name: {
        $regex: "^" + ledger_group_name + "$",
        $options: "i",
      },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ ledger_group_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }


  const ledger_groupData = await ledger_group.aggregate
    ([
      {
        $match: condition,
      },
      {
        $lookup: {
          from: "t_200_primary_groups",
          let: { "primary_group_id": "$primary_group_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$primary_group_id", "$$primary_group_id"] } } },
            { $project: { "primary_group": 1 } }
          ],
          as: 'primary_data',
        },
      },
      { $addFields: { primary_group_name: { $first: "$primary_data.primary_group" } } },
      { $unset: ["primary_data"] },

      {
        $addFields: {
          action_items: {

            can_edit: true,
            can_delete: false,
            can_view: true,
            can_activate: "$active_status" === "Y" ? false : true,
            can_deactivate: "$active_status" === "Y" ? true : false,

          }
        }
      },
      {
        $project:
        {
          "action_items": 1,
          "active_status": 1,
          "inserted_by_id": 1,
          "edited_by_id": 1,
          "deleted_by_id": 1,
          "inserted_by_date": 1,
          "edit_by_date": 1,
          "deleted_by_date": 1,
          "edit_log": 1,

          "primary_group_name": 1,
          "primary_group_id": 1,
          "account_nature_id": 1,
          "account_nature_name": 1,
          "sequence": 1,
          "ledger_group": 1,
          "alias": 1,
          "sub_group_status": 1,
          "ledger_group_id": 1,



        }
      },
    ])
  if (ledger_groupData) {
    return res.status(200).json(ledger_groupData);
  } else {
    return res.status(200).json([]);
  }
};

const deleteLedgerGroup = async (req, res) => {
  const ledger_group_id = req.body.ledger_group_id;
  const condition = { ledger_group_id: ledger_group_id };
  await ledger_group.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};
const updateLedgerGroup = async (req, res) => {
  const condition = { ledger_group_id: req.body.ledger_group_id };
  const data = req.body;

  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.ledger_group_list,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);



  // const ledgerGroupDetails = myData.data;
  // data.edit_log = ledgerGroupDetails;

  await ledger_group.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const view_charges = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const charges_name = req.body.charges;
  const charges_id = req.body.charges_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;


  // Details by ID
  if (charges_id) {
    condition = { ...condition, charges_id: charges_id };
  }

  // Details by Name
  if (charges_name) {
    condition = {
      ...condition,
      charges: charges_name,
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ charges_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }


  const chargesData = await charges.aggregate
    ([
      {
        $match: condition,
      },
      {
        $lookup: {
          from: "t_200_ledger_accounts",
          let: { "ledger_account_id": "$ledger_account_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$ledger_account_id", "$$ledger_account_id"] } } },
            { $project: { "ledger_account": 1 } }
          ],
          as: 'ledger_data',
        },
      },
      { $addFields: { ledger_account_name: { $first: "$ledger_data.ledger_account" } } },
      { $unset: ["ledger_data"] },

      {
        $addFields: {
          action_items: {

            can_edit: true,
            can_delete: false,
            can_view: true,
            can_activate: "$active_status" === "Y" ? false : true,
            can_deactivate: "$active_status" === "Y" ? true : false,

          }
        }
      },

      {
        $project:
        {
          "action_items": 1,
          "ledger_account_name": 1,
          "ledger_account_id": 1,
          "active_status": 1,
          "inserted_by_id": 1,
          "edited_by_id": 1,
          "deleted_by_id": 1,
          "charges": 1,
          "sac_code": 1,
          "details": 1,
          "inserted_by_date": 1,
          "edit_by_date": 1,
          "deleted_by_date": 1,
          "charges_id": 1,
          "edit_log": 1,
        }
      },
      {
        $sort: {
          charges: 1
        }
      }

    ])
  if (chargesData) {

    return res.status(200).json(chargesData);
  } else {
    return res.status(200).json([]);
  }


};

const deleteCharges = async (req, res) => {
  const charges_id = req.body.charges_id;
  const condition = { charges_id: charges_id };
  await charges.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updateCharges = async (req, res) => {
  const condition = { charges_id: req.body.charges_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.charges_list,
    data: condition,
  });


  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const chargesDetails = myData.data;
  // data.edit_log = chargesDetails;

  await charges.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

//  PRIMARY GROUP
const view_primary_group = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const group_id = req.body.group_id;
  const group_name = req.body.group;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const natureByLetter = (nature) => {
    switch (nature) {
      case "A":
        return "Assets";
      case "E":
        return "Expenses";
      case "I":
        return "Income";
      case "L":
        return "Liabilities";
      case "P":
        return "Provision";
      default:
        return "";
    }
  };

  // Function to prepare action items for each category
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (group_id) {
    condition = { ...condition, group_id: group_id };
  }

  // Details by Name
  if (group_name) {
    condition = {
      ...condition,
      group_name: { $regex: "^" + group_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive
  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ group_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await primary_group
    .find(condition, (err, groupData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (groupData) {
        // (v => ({...v, isActive: true}))

        //  categoriesData.forEach(data){

        //  }

        let returnDataArr = groupData.map((data) => ({
          nature_name: natureByLetter(data.nature),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { group_id: 1, group: 1, _id: 0 });
};

const deletePrimaryGroup = async (req, res) => {
  const primary_group_id = req.body.primary_group_id;
  const condition = { primary_group_id: primary_group_id };
  await primary_group.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updatePrimaryGroup = async (req, res) => {
  const condition = { primary_group_id: req.body.primary_group_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.primary_group_list,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);

  // const primaryGroupDetails = myData.data;
  // data.edit_log = primaryGroupDetails;

  await primary_group.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const updateshowrooms_warehouse = async (req, res) => {
  const condition = { showrooms_warehouse_id: req.body.showrooms_warehouse_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.showrooms_warehouse_List,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const showroomsWarehouseDetails = myData.data;
  // data.edit_log = showroomsWarehouseDetails;

  await showrooms_warehouse.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const deleteshowrooms_warehouse = async (req, res) => {
  const showrooms_warehouse_id = req.body.showrooms_warehouse_id;

  const condition = { showrooms_warehouse_id: showrooms_warehouse_id };
  await showrooms_warehouse.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const view_sources = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const sources_name = req.body.sources;
  const sources_id = req.body.sources_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (sources_id) {
    condition = { ...condition, sources_id: sources_id };
  }

  // Details by Name
  if (sources_name) {
    condition = {
      ...condition,
      sources_name: { $regex: "^" + sources_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ sources_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await source
    .find(condition, (err, sourcesData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (sourcesData) {
        let returnDataArr = sourcesData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { sources_id: 1, sources: 1, _id: 0 })
    .sort({ source: 1 });
};

const updatesource = async (req, res) => {
  const condition = { source_id: req.body.source_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.source_List,
    data: condition,
  });

  const sourceDetails = myData.data;
  data.edit_log = sourceDetails;

  await source.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const deletesource = async (req, res) => {
  const source_id = req.body.source_id;

  const condition = { source_id: source_id };
  await source.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const view_role = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const role_name = req.body.role;
  const role_id = req.body.role_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (role_id) {
    condition = { ...condition, role_id: role_id };
  }

  // Details by Name
  if (role_name) {
    condition = {
      ...condition,
      role_name: { $regex: "^" + role_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ role_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await role
    .find(condition, (err, roleData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (roleData) {
        let returnDataArr = roleData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { role_id: 1, role: 1, _id: 0 })
    .sort({ role: 1 });
};

const updaterole = async (req, res) => {
  const condition = { role_id: req.body.role_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.role_List,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);



  // const roleDetails = myData.data;
  // data.edit_log = roleDetails;

  await role.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const deleterole = async (req, res) => {
  const role_id = req.body.role_id;

  const condition = { role_id: role_id };
  await role.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const viewuser = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const user_name = req.body.user;
  const user_id = req.body.user_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;


  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (user_id) {
    condition = { ...condition, user_id: user_id };
  }

  // Details by Name
  if (user_name) {
    condition = {
      ...condition,
      user_name: { $regex: "^" + user_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ user_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }
  let userData = await User.aggregate([
    {
      $match: condition
    },
    {
      $addFields: {
        action_items: {

          can_edit: true,
          can_delete: false,
          can_activate: "$active_status" === "Y" ? false : true,
          can_deactivate: "$active_status" === "Y" ? true : false,

        }
      }
    },


    {
      $lookup: {
        from: "t_100_roles",
        let: { "role_id": "$role_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$role_id", "$role_id"] }, },
          },
          { $project: { "role": 1, "_id": 0 } }
        ],
        as: "role_details"
      },
    },

    { $addFields: { role_name: { $first: "$role_details.role" } } },
    { $unset: ["role_details"] },

    {
      $project: {

        "action_items": 1,
        "role_name": 1,
        "role_id": 1,
        "active_status": 1,
        "inserted_by_id": 1,
        "edited_by_id": 1,
        "deleted_by_id": 1,
        "edit_log": 1,
        "inserted_by_date": 1,
        "edit_by_date": 1,
        "deleted_by_date": 1,
        "name": 1,
        "email": 1,
        "password": 1,
        "mobile": 1,
        "user_id": 1,
        "showroom_warehouse_id": 1,
        "accessible_menus": 1,
        "weekDays": 1

      },
    },

    {
      $sort: {
        name: 1
      }
    }
  ]);


  if (userData) {

    return res.status(200).json(userData);
  } else {
    return res.status(200).json([]);
  }

};

const updateuser = async (req, res) => {
  const condition = { user_id: req.body.user_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.user_List,
    data: condition,
  });

  //data.edit_log = myData.data;
  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  await User.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const deleteuser = async (req, res) => {
  const user_id = req.body.user_id;

  const condition = { user_id: user_id };
  await User.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const view_master_group = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const master_group_id = req.body.master_group_id;
  const master_group_name = req.body.master_group;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (master_group_id) {
    condition = { ...condition, master_group_id: master_group_id };
  }

  // Details by Name
  if (master_group_name) {
    condition = {
      ...condition,
      master_group_name: {
        $regex: "^" + master_group_name + "$",
        $options: "i",
      },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ master_group_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await master_group
    .find(condition, (err, master_groupData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (master_groupData) {
        let returnDataArr = master_groupData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(
      short_data === true && { master_group_id: 1, master_group: 1, _id: 0 }
    )
    .sort({ group: 1 });
};

const deletemaster_group = async (req, res) => {
  const master_group_id = req.body.master_group_id;
  const condition = { master_group_id: master_group_id };
  await master_group.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updatemaster_group = async (req, res) => {
  const condition = { master_group_id: req.body.master_group_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.master_group_list,
    data: condition,
  });

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const master_groupDetails = myData.data;
  // data.edit_log = master_groupDetails;

  await master_group.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

// const viewitem = async (req, res) => {
//   let condition = { deleted_by_id: 0 };

//   const item_name = req.body.item;
//   const item_id = req.body.item_id;
//   const showroom_warehouse_id = req.body.showroom_warehouse_id;
//   const category_id = req.body.category_id;
//   const brand_id = req.body.brand_id;
//   const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
//   const searchQuery = req.body.query;
// console.log("CAT",category_id)
// console.log("BRAND",brand_id)
// console.log("REQBODY",req.body)
// console.log("QUERY",req.body.query)



//   let all_brand = await brand
//     .find({}, (err, brandData) => {
//       return brandData;
//     })
//     .select({ brand_id: 1, brand: 1, _id: 0 });
//   const brandById = (all_brand, brand_id) => {
//     if (brand_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_brand.length; iCtr++) {
//       if (all_brand[iCtr]["brand_id"] === brand_id)
//         return all_brand[iCtr]["brand"];
//     }
//   };

//   let all_ledger_account = await ledger_account
//     .find({}, (err, ledger_accountData) => {
//       return ledger_accountData;
//     })
//     .select({ ledger_account_id: 1, ledger_account: 1, _id: 0 });
//   const ledger_accountById = (all_ledger_account, ledger_account_id) => {
//     if (ledger_account_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_ledger_account.length; iCtr++) {
//       if (all_ledger_account[iCtr]["ledger_account_id"] === ledger_account_id)
//         return all_ledger_account[iCtr]["ledger_account"];
//     }
//   };

//   let all_uom = await uom
//     .find({}, (err, uomData) => {
//       return uomData;
//     })
//     .select({ uom_id: 1, higher_unit: 1, lower_unit: 1, caption: 1, lower_caption: 1, _id: 0 });

//   const uomById = (all_uom, uom_id) => {
//     if (uom_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_uom.length; iCtr++) {
//       if (all_uom[iCtr]["uom_id"] === uom_id)
//         return all_uom[iCtr]["caption"];
//     }
//   };

//   const altUomById = (all_uom, uom_id) => {
//     if (uom_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_uom.length; iCtr++) {
//       if (all_uom[iCtr]["uom_id"] === uom_id)
//         return all_uom[iCtr]["lower_caption"];
//     }
//   };

//   const altUnitUomById = (all_uom, uom_id) => {
//     if (uom_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_uom.length; iCtr++) {
//       if (all_uom[iCtr]["uom_id"] === uom_id)
//         return all_uom[iCtr]["lower_unit"];
//     }
//   };

//   let all_category = await category
//     .find({}, (err, categoryData) => {
//       return categoryData;
//     })
//     .select({ category_id: 1, category: 1, _id: 0 });

//   const categoryById = (all_category, category_id) => {
//     if (category_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_category.length; iCtr++) {
//       if (all_category[iCtr]["category_id"] === category_id)
//         return all_category[iCtr]["category"];
//     }
//   };

//   const actionValues = (active_status) => {
//     return {
//       can_edit: true,
//       can_delete: false,
//       can_activate: active_status === "Y" ? false : true,
//       can_deactivate: active_status === "Y" ? true : false,
//     };
//   };
//   // Details by ID
//   if (item_id) {
//     condition = { ...condition, item_id: item_id };
//   }

//   //Details by ID

//   if (showroom_warehouse_id) {
//     condition = {
//       ...condition,
//       "stock_by_location.showroom_warehouse_id": showroom_warehouse_id,
//     };
//   }

//   // Details by Category ID
//   if (category_id && category_id > 0) {
//     condition = { ...condition, category_id: category_id };
//   }

//   // Details by Brand ID
//   if (brand_id && brand_id > 0) {
//     condition = { ...condition, brand_id: brand_id };
//   }

//   // Details by Name
//   if (item_name) {
//     condition = {
//       ...condition,
//       item: { $regex: "^" + item_name + "$", $options: "i" },
//     };
//   } // Matching exact text but incase-sensitive

//   // Search
//   if (searchQuery) {
//     condition = {
//       ...condition,
//     $or: [
//        { item: { $regex: searchQuery, $options: "i" } },
//        { item_own_code: { $regex: searchQuery, $options: "i" } },
//        { details: { $regex: searchQuery, $options: "i" } },
//       ],



//     }; // Matching string also compare incase-sensitive
//   }
//   console.log(condition,"conditionnnn")
//   await item
//     .find(condition, (err, itemData) => {
//       if (err) {
//         return res.status(500).json({ Error: err });
//       }

//       if (itemData) {
//         let returnDataArr = itemData.map((data) => ({
//           brand_name: brandById(all_brand, data.brand_id),
//           category_name: categoryById(all_category, data.category_id),
//           uom_name: uomById(all_uom, data.uom_id),
//           alt_uom_name: altUomById(all_uom, data.uom_id),
//           alt_unit_uom_name: altUnitUomById(all_uom, data.uom_id),

//           reorder_level_uom_name: uomById(all_uom, data.reorder_level_uom_id),
//           reorder_quantity_uom_name: uomById(
//             all_uom,
//             data.reorder_quantity_uom_id
//           ),
//           opening_stock_uom_name: uomById(all_uom, data.opening_stock_uom_id),
//           ledger_account_name: ledger_accountById(
//             all_ledger_account,
//             data.ledger_account_id
//           ),
//           item_action: actionValues(data.active_status),
//           ...data["_doc"],
//         }));

//         return res.status(200).json(returnDataArr);
//       } else {
//         return res.status(200).json([]);
//       }
//     })
//     .select(short_data === true && { item_id: 1, item: 1, _id: 0 });
// };

const view_item_withAgg = async (req, res) => {


  let condition = { deleted_by_id: 0 };
  const item_name = req.body.item;
  const item_id = req.body.item_id;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;
  const category_id = req.body.category_id;
  const brand_id = req.body.brand_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const from_date = req.body.from_date;
  const to_date = req.body.to_date;

  // console.log("CAT", category_id)
  //console.log("BRAND", brand_id)
  // console.log("REQBODY", req.body)
  // console.log("QUERY", req.body.query)

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (item_id) {
    condition = { ...condition, item_id: item_id };
  }
  //Details by ID
  if (showroom_warehouse_id) {
    condition = {
      ...condition,
      "stock_by_location.showroom_warehouse_id": showroom_warehouse_id,
    };
  }
  // Details by Category ID
  //console.log(category_id,"category123")
  if (category_id && category_id > 0) {
    condition = { ...condition, category_id: category_id };
  }
  // Details by Brand ID
  if (brand_id && brand_id > 0) {
    condition = { ...condition, brand_id: brand_id };
  }
  // Details by Name
  if (item_name) {
    condition = {
      ...condition,
      item: { $regex: item_name, $options: "i" },
    };
  } // Matching exact text but incase-sensitive
  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { item: { $regex: searchQuery, $options: "i" } },
        { item_own_code: { $regex: searchQuery, $options: "i" } },
        { details: { $regex: searchQuery, $options: "i" } },
      ],
    }; // Matching string also compare incase-sensitive
  }

  let itemData = await item.aggregate([
    {
      $match: condition
    },
    {
      $project: {
        item_id: 1,
        brand_id: 1,
        category_id: 1,
        uom_id: 1,
        lower_unit_value: 1,
        reorder_level_uom_id: 1,
        reorder_quantity_uom_id: 1,
        opening_stock_uom_id: 1,
        ledger_account_id: 1,
        stock_by_location: 1,
        item_own_code: 1,
        item_company_code: 1,
        alt_uom_id: 1,
        item: 1,
        mrp: 1,
        cgst_percentage: 1,
        details: 1,
        hsn_code: 1,
        active_status: 1,
        picture_path: 1,
        opening_rate: 1,
        reorder_level:1,
        reorder_quantity:1,
        reorder_level_uom_name:1,
        reorder_quantity_uom_name:1,
      }
    },
    //////Brand Lookup
    {
      $lookup:
      {
        from: "t_100_brands",
        let: { "brand_id": "$brand_id" },
        pipeline: [
          {
            $match:
            {
              $expr:
              {
                $eq: ["$brand_id", "$$brand_id"]
              }
            }
          },
          {
            $project: {
              brand: 1
            }
          }
        ],
        as: "brand_details"
      }
    },
    {
      $addFields: {
        brand_name: { $first: "$brand_details.brand" }
      }
    },
    { $unset: ["brand_details"] },
    /////categories LookUp
    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$category_id", "$$category_id"] } }
          },
          {
            $project: { category: 1 }
          }
        ],
        as: "category_details"
      }
    },
    {
      $addFields: { category_name: { $first: "$category_details.category" } }
    },
    { $unset: ["category_details"] },
    ////UOM lookUp
    {
      $lookup: {
        from: "t_100_uoms",
        let: { "uom_id": "$uom_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$uom_id", "$$uom_id"] }
            }
          },
          {
            $project:
            {
              _id: 0,
              uom_id: 1,
              caption: 1,
              lower_caption: 1,
              lower_unit: 1,
              lower_unit_value: 1,
            }
          },
        ],
        as: "uom_details"
      }
    },
    {
      $addFields: {
        uom_name: { $first: "$uom_details.caption" },
        alt_uom_name: { $first: "$uom_details.lower_caption" },
        lower_unit_value: { $first: "$uom_details.lower_unit_value" },
        alt_unit_uom_name: { $first: "$uom_details.lower_unit" },
        // reorder_level_uom_name: "$uom_details.lower_unit",
        reorder_quantity_uom_name: "$uom_details.lower_unit",
        // reorder_level_uom_name: "$uom_details.lower_unit",
        opening_stock_uom_name: "$uom_details.lower_unit",
      }
    },
    // { $unset: "uom_details" },
    ///ledger account lookup
    {
      $lookup:
      {
        from: "t_200_ledger_accounts",
        let: { "ledger_account_id": "$ledger_account_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$ledger_account_id", "$$ledger_account_id"] }
            }
          },
          {
            $project: {
              _id: 0,
              ledger_account: 1,
              ledger_account_id: 1
            }
          }
        ],
        as: "ledger_details"
      }
    },
    {
      $addFields: {
        ledger_account_name: { $first: "$ledger_details.ledger_account" },
        ledger_account_id: { $first: "$ledger_details.ledger_account_id" }
      }
    },
    { $unset: "ledger_details" },
    ///stock movement
    {
      $lookup: {
        from: "t_900_stock_movements",
        let: { 'item_id': '$item_id' },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$item_id', '$$item_id'] } }
              ],
            },
          },

          {
            $project: {
              transaction_id: 1,
              item_id: 1,
              showroom_warehouse_id: 1,
              unit_id: 1,
              transaction_date: 1,
              Opening_Plus: {
                $cond: { if: { $and: [{ $in: ["$transaction_type", ["PR", "DR"]] }, { $lt: ["$transaction_date", from_date] }] }, then: "$plus_qty", else: 0 }
              },
              Opening_Minus: {
                $cond: { if: { $and: [{ $in: ["$transaction_type", ["D"]] }, { $lt: ["$transaction_date", from_date] }] }, then: "$minus_qty", else: 0 }
              },
              purchase: {
                $cond: { if: { $and: [{ $in: ["$transaction_type", ["PR", "DR"]] }, { $gte: ["$transaction_date", from_date] }, { $lte: ["$transaction_date", to_date] }] }, then: "$plus_qty", else: 0 }
              },
              sales: {
                $cond: { if: { $and: [{ $in: ["$transaction_type", ["D"]] }, { $gte: ["$transaction_date", from_date] }, { $lte: ["$transaction_date", to_date] }] }, then: "$minus_qty", else: 0 }
              },
              purchase_return: {
                $cond: { if: { $and: [{ $in: ["$transaction_type", ["RP"]] }, { $gte: ["$transaction_date", from_date] }, { $lte: ["$transaction_date", to_date] }] }, then: "$minus_qty", else: 0 }
              },
              sales_return: {
                $cond: { if: { $and: [{ $in: ["$transaction_type", ["RD"]] }, { $gte: ["$transaction_date", from_date] }, { $lte: ["$transaction_date", to_date] }] }, then: "$plus_qty", else: 0 }
              },

            },
          },

          {
            $group: {
              _id: "$item_id",
              showroom_warehouse_id: { $first: "$showroom_warehouse_id" },
              unit_id: { $first: "$unit_id" },
              sumOpeningPlus: { $sum: "$Opening_Plus" },
              sumOpeningMinus: { $sum: "$Opening_Minus" },
              sumPurchase: { $sum: "$purchase" },
              sumSales: { $sum: "$sales" },
              sumPurchaseReturn: { $sum: "$purchase_return" },
              sumSalesReturn: { $sum: "$sales_return" },
            },
          },
          //},
          //{ $project: { "higher_unit": 1, "_id":0 }}
        ],
        as: "stock_details"
      }
    },
    {
      $addFields: {
        current_over_stock: { $sum: "$stock_by_location.quantity" }
      }
    }

  ])

  if (itemData) {
    return res.status(200).send(itemData)
  } else {
    return res.status(200).json([]);
  }
};


const item_dropDown = async (req, res) => {


  let condition = { deleted_by_id: 0 };  
  const item_id = req.body.item_id;

  // Details by ID
  if (item_id) {
    condition = { ...condition, item_id: item_id };
  }

  let itemData = await item.aggregate([
    {
      $match: condition
    },
    {
      $project: {
        item_id: 1,    
        item: 1,
        
      }
    },
 
  ])

  if (itemData) {
    return res.status(200).send(itemData)
  } else {
    return res.status(200).json([]);
  }
};


const deleteitem = async (req, res) => {
  const item_id = req.body.item_id;
  const condition = { item_id: item_id };
  await item.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updateitem = async (req, res) => {
  const condition = { item_id: req.body.item_id };

  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.item_list,
    data: condition,
  });

  // const changed=trackChange( myData.data[0],req.body)
  // if(myData.data[0].edit_log)
  // {
  //   data.edit_log = ([JSON.stringify(changed), ... myData.data[0].edit_log]);
  // }
  // else{
  //   data.edit_log = JSON.stringify(changed);
  // }


  const itemDetails = myData.data;
  data.edit_log = itemDetails;
  //console.log("amana data", data);

  await item.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      //  console.log("Ana jana");
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const updateitemstock = async (req, res) => {
  // console.log(req.body.item_id,"89")
  const condition = { item_id: req.body.item_id };
  const data = req.body;

  const item_id = req.body.item_id;
  const current_over_stock = req.body.current_over_stock;
  const stock_by_location = req.body.stock_by_location;

  //console.log(current_over_stock,"5050")
  //   console.log(current_over_stock,"ATK")
  // console.log(stock_by_location,"ATK")


  if (item_id || current_over_stock || stock_by_location) {
    //  console.log("reached")
    await item.findOneAndUpdate(condition, data, (err, obj) => {

      if (err) {

        return res.status(500).json({ Error: err });
      }
      return res.status(200).json(obj);
    });
  } else {
    return res.status(500).json({ Error: "Couldn't update stock" });
  }
};


const viewOnlyCustomer = async (req, res) => {
  let condition = { deleted_by_id: 0 };


  // const myCustomerData=await customer.aggregate
  // ([

  // {
  //   $match:condition
  // },


  // {
  //   $project:
  //   {

  //      "company_name":1,

  //      "customer_id":1,
  //   }
  // },

  // {
  //   $sort : {
  //     company_name:1
  //   }
  //  }
  // ])

  const myCustomerData = await customer.find(
    {
      // condition

    },

    {

      "company_name": 1,
      "customer_id": 1,
    },
  ).sort({"company_name":1})

  if (myCustomerData) {
    return res.status(200).json(myCustomerData);
  } else {
    return res.status(200).json([]);
  }
};



const viewcustomer = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const customer_id = req.body.customer_id;
  const customer_name = req.body.customer;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const exclude_fields = (req.body.exclude_fields ? req.body.exclude_fields : ["not_applicable_to_exclude"]);
  const searchQuery = req.body.keyword_pharse;
  const group_id = req.body.group_id;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_view: true,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (customer_id) {
    condition = { ...condition, customer_id: customer_id };
  }

  //for group
  if (group_id) {
    condition = { ...condition, group_id: group_id };
  }

  // Details by Name
  if (customer_name) {
    condition = {
      ...condition,
      customer_name: { $regex: "^" + customer_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search

  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { company_name: new RegExp(searchQuery, "i") },
        { "contact_person.txt_name": new RegExp(searchQuery, "i") },
        { gst_no: new RegExp(searchQuery, "i") },
        { "contact_person.txt_whatsapp": new RegExp(searchQuery, "i") },
        { "contact_person.txt_mobile": new RegExp(searchQuery, "i") },
        { "contact_person.txt_email": new RegExp(searchQuery, "i") },
      ],
    };
    ; // Matching string also compare incase-sensitive
  }


  const myCustomerData = await customer.aggregate
    ([

      {
        $match: condition
      },
      {
        $lookup: {
          from: "t_200_master_groups",
          let: { "group_id": "$group_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$master_group_id", "$$group_id"] } } },
            { $project: { "group": 1, "_id": 0 } }
          ],
          as: 'group_data',
        },
      },
      { $addFields: { group_name: { $first: "$group_data.group" } } },
      { $unset: ["group_data"] },

      //For Reference
      {
        $lookup: {
          from: "t_300_references",
          let: { "reference_id": "$reference_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$reference_id", "$$reference_id"] } } },
            { $project: { "name": 1, "_id": 0 } }
          ],
          as: 'reference_data',
        },



      },
      { $addFields: { reference_name: { $first: "$reference_data.name" } } },
      { $unset: ["reference_data"] },

      {
        $addFields: {
          action_items: {

            can_edit: true,
            can_delete: false,
            can_view: true,
            can_activate: "$active_status" === "Y" ? false : true,
            can_deactivate: "$active_status" === "Y" ? true : false,

          }
        }
      },

      {
        $project:
        {
          "action_items": 1,
          "group_name": 1,
          "group_id": 1,
          "reference_name": 1,
          "reference_id": 1,
          "contact_person": 1,
          "address": 1,
          "active_status": 1,
          "inserted_by_id": 1,
          "edited_by_id": 1,
          "deleted_by_id": 1,
          "company_name": 1,
          "opening_balance": 1,
          "dr_cr": 1,
          "customer_id": 1,
        }
      },

      { $unset: exclude_fields },

      {
        $sort: {
          company_name: 1
        }
      }
    ])

  if (myCustomerData) {
    return res.status(200).json(myCustomerData);
  } else {
    return res.status(200).json([]);
  }
};

const deletecustomer = async (req, res) => {
  const customer_id = req.body.customer_id;
  const condition = { customer_id: customer_id };
  await customer.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updatecustomer = async (req, res) => {
  const condition = { customer_id: req.body.customer_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.customer_list,
    data: condition,
  });
  //console.log(myData,"chech");
  const changed = trackChange(myData.data[0], req.body)
  if (myData.data[0].edit_log) {
    data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);
  }
  else {
    data.edit_log = JSON.stringify(changed);
  }

  // const customerDetails = myData.data;
  // data.edit_log = customerDetails;

  await customer.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const viewvendor = async (req, res) => {
  let condition = { deleted_by_id: 0 };

  const vendor_id = req.body.vendor_id;
  const vendor_name = req.body.vendor;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const group_id = req.body.group_id;
  const searchQuery = req.body.keyword_pharse;

  //console.log(group_id,"groupid")


  let all_group = await master_group
    .find({}, (err, groupData) => {
      return groupData;
    })
    .select({ master_group_id: 1, group: 1, _id: 0 });

  const groupById = (all_group, master_group_id) => {
    if (master_group_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_group.length; iCtr++) {
      if (all_group[iCtr]["master_group_id"] === master_group_id)
        return all_group[iCtr]["group"];
    }
  };

  let all_reference = await reference
    .find({}, (err, referenceData) => {
      return referenceData;
    })
    .select({ reference_id: 1, name: 1, _id: 0 });
  const referenceById = (all_reference, reference_type_id) => {
    if (reference_type_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_reference.length; iCtr++) {
      if (all_reference[iCtr]["reference_id"] === reference_type_id)
        return all_reference[iCtr]["name"];
    }
  };
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_view: true,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by ID
  if (vendor_id) {
    condition = { ...condition, vendor_id: vendor_id };
  }

  if (group_id) {
    condition = { ...condition, group_id: group_id };
  }

  // Details by Name
  if (vendor_name) {
    condition = {
      ...condition,
      // vendor_name: { $regex: "^" + vendor_name + "$", $options: "i" },
      company_name: vendor_name,
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { company_name: new RegExp(searchQuery, "i") },
        { "contact_person.txt_name": new RegExp(searchQuery, "i") },
        { gst_no: new RegExp(searchQuery, "i") },
        { "contact_person.txt_whatsapp": new RegExp(searchQuery, "i") },
        { "contact_person.txt_mobile": new RegExp(searchQuery, "i") },
        { "contact_person.txt_email": new RegExp(searchQuery, "i") },
      ],
    }; // Matching string also compare incase-sensitive
  }

  //   await vendor
  //     .find(condition, (err, vendorData) => {
  //       if (err) {
  //         return res.status(500).json({ Error: err });
  //       }
  //       if (vendorData) {
  //         let returnDataArr = vendorData.map((data) => ({
  //           group_name: groupById(all_group, data.group_id),
  //           reference_name: referenceById(all_reference, data.reference_id),
  //           action_items: actionValues(data.active_status),
  //           ...data["_doc"],
  //         }));

  //         return res.status(200).json(returnDataArr);
  //       } else {
  //         return res.status(200).json([]);
  //       }
  //     })
  //     .select(short_data === true && { vendor_id: 1, vendor: 1, _id: 0 });
  // };

  const myVendorData = await vendor.aggregate([

    {
      $match: condition
    },
    {
      $lookup: {
        from: "t_200_master_groups",
        let: { "group_id": "$group_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$master_group_id", "$$group_id"] } } },
          { $project: { "group": 1, "_id": 0 } }
        ],
        as: 'group_data',
      },
    },
    { $addFields: { group_name: { $first: "$group_data.group" } } },
    { $unset: ["group_data"] },

    //For Reference
    {
      $lookup: {
        from: "t_300_references",
        let: { "reference_id": "$reference_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$reference_id", "$$reference_id"] } } },
          { $project: { "name": 1, "_id": 0 } }
        ],
        as: 'reference_data',
      },



    },
    { $addFields: { reference_name: { $first: "$reference_data.name" } } },
    { $unset: ["reference_data"] },

    {
      $addFields: {
        action_items: {

          can_edit: true,
          can_delete: false,
          can_view: true,
          can_activate: "$active_status" === "Y" ? false : true,
          can_deactivate: "$active_status" === "Y" ? true : false,

        }
      }
    },

    {
      $project:
      {
        "action_items": 1,
        "group_name": 1,
        "group_id": 1,
        "reference_name": 1,
        "reference_id": 1,
        "contact_person": 1,
        "address": 1,
        "active_status": 1,
        "inserted_by_id": 1,
        "edited_by_id": 1,
        "deleted_by_id": 1,
        "company_name": 1,
        "opening_balance": 1,
        "dr_cr": 1,
        "vendor_id": 1,
        gst_no: 1,
        website: 1,

      }
    },
    {
      $sort: {
        company_name: 1
      }
    }


  ])

  if (myVendorData) {
    return res.status(200).json(myVendorData);
  } else {
    return res.status(200).json([]);
  }
};

const updatevendor = async (req, res) => {
  const condition = { vendor_id: req.body.vendor_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.vendor_list,
    data: condition,
  });

  // const vendorDetails = myData.data;
  // data.edit_log = vendorDetails;

  const changed = trackChange(myData.data[0], req.body)
  // data.edit_log = ([JSON.stringify(changed), ... myData.data[0].edit_log]);
  if (myData.data[0].edit_log) {
    data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);
  }
  else {
    data.edit_log = JSON.stringify(changed);
  }

  await vendor.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const deletevendor = async (req, res) => {
  const vendor_id = req.body.vendor_id;
  const condition = { vendor_id: vendor_id };
  await vendor.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const view_bank = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const bank_id = req.body.bank_id;
  const bank_name = req.body.bank;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (bank_id) {
    condition = { ...condition, bank_id: bank_id };
  }

  // Details by Name
  if (bank_name) {
    condition = {
      ...condition,
      bank_name: { $regex: "^" + bank_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ bank_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await bank
    .find(condition, (err, bankData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (bankData) {
        let returnDataArr = bankData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { bank_id: 1, bank: 1, _id: 0 })
    .sort({ bank_name: 1 });
};

const deletebank = async (req, res) => {
  const bank_id = req.body.bank_id;
  const condition = { bank_id: bank_id };
  await bank.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updatebank = async (req, res) => {
  const condition = { bank_id: req.body.bank_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.bank_list,
    data: condition,
  });

  // const bankDetails = myData.data;
  // data.edit_log = bankDetails;

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  await bank.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const view_enquiry = async (req, res) => {
  let condition = { deleted_by_id: 0 };

  const enquiry_id = req.body.enquiry_id;
  const enquiry_name = req.body.enquiry;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  let all_source = await source
    .find({}, (err, groupData) => {
      return groupData;
    })
    .select({ source_id: 1, source: 1, _id: 0 });
  let all_showroom_warehouse = await showrooms_warehouse
    .find({}, (err, groupData) => {
      return groupData;
    })
    .select({ showrooms_warehouse_id: 1, showrooms_warehouse: 1, _id: 0 });

  const customerById = async (customer_id) => {
    const findCustomer = await customer.find(
      { customer_id: customer_id },
      (err, groupData) => {
        return groupData;
      }
    );
    return findCustomer;
  };
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (enquiry_id) {
    condition = { ...condition, enquiry_id: enquiry_id };
  }

  // Details by Name
  if (enquiry_name) {
    condition = {
      ...condition,
      enquiry_name: { $regex: "^" + enquiry_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ enquiry_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await enquiry
    .find(condition, (err, enquiryData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (enquiryData) {
        let returnDataArr = enquiryData.map((data) => ({
          source_name: nameById(
            all_source,
            data.source_id,
            "source",
            "source_id"
          ),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));

        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { enquiry_id: 1, enquiry: 1, _id: 0 });
};

const deleteenquiry = async (req, res) => {
  const enquiry_id = req.body.enquiry_id;
  const condition = { bank_id: enquiry_id };
  await enquiry.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const updateenquiry = async (req, res) => {
  const condition = { enquiry_id: req.body.enquiry_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.enquiry_list,
    data: condition,
  });

  const enquiryDetails = myData.data;
  data.edit_log = enquiryDetails;

  await enquiry.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const view_direct_purchase = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const direct_purchase_id = req.body.direct_purchase_id;
  const vendor_id = req.body.direct_purchase;

  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (direct_purchase_id) {
    condition = { ...condition, direct_purchase_id: direct_purchase_id };
  }

  // Details by Name
  if (vendor_id) {
    condition = {
      ...condition,
      vendor_id: { $regex: "^" + vendor_id + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ vendor_id: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await direct_purchase
    .find(condition, (err, bankData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (direct_purchaseData) {
        let returnDataArr = direct_purchaseData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(
      short_data === true && {
        direct_purchase_id: 1,
        direct_purchase: 1,
        _id: 0,
      }
    );
};

const delete_direct_purchase = async (req, res) => {
  const direct_purchase_id = req.body.direct_purchase_id;
  const condition = { direct_purchase_id: direct_purchase_id };
  await direct_purchase.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const update_direct_purchase = async (req, res) => {
  const condition = { direct_purchase_id: req.body.direct_purchase_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.direct_purchase_list,
    data: condition,
  });

  const direct_purchaseDetails = myData.data;
  data.edit_log = direct_purchaseDetails;

  await direct_purchase.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json({ ...obj._doc });
  });
};

const view_purchase_return = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  //Purchase_return
  const purchase_return_id = req.body.purchase_return_id;
  const purchase_return_no = req.body.purchase_return_no;
  const purchase_return_date = req.body.purchase_return_date;
  const purchase_return_to_date = req.body.purchase_return_to_date;
  const challan_no = req.body.challan_no;
  const vehicle_no = req.body.vehicle_no;
  const way_bill_no = req.body.way_bill_no;
  const vendor_id = req.body.vendor_id;

  // console.log(purchase_return_from_date,"purchase_return_date")

  let all_vendor = await vendor
    .find({}, (err, vendorData) => {
      return vendorData;
    })
    .select({ vendor_id: 1, contact_person: 1, _id: 0 });
  const vendorById = (all_vendor, vendor_id) => {
    if (vendor_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_vendor.length; iCtr++) {
      if (all_vendor[iCtr]["vendor_id"] === vendor_id)
        return all_vendor[iCtr]["contact_person"];
    }
  };




  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by Purchase_return
  if (purchase_return_id) {
    condi = { ...condi, purchase_return_id: purchase_return_id };
  }


  if (purchase_return_no) {
    condi = { ...condi, purchase_return_no: purchase_return_no };
  }

  //datefilter
  if (purchase_return_date) {
    condi = { ...condi, "purchase_return_date": purchase_return_date };
  }

  //datefilter
  if (purchase_return_to_date) {
    condi = { ...condi, "purchase_return_date": purchase_return_to_date };
  }

  //both date filter
  if (purchase_return_date && purchase_return_to_date) {
    condi = {
      ...condi,
      "purchase_return_date": {
        $gte: purchase_return_date,
        $lte: purchase_return_to_date,
      },
    };
  }


  if (challan_no) {
    // console.log(challan_no,"challan nooooo")
    condi = { ...condi, challan_no: challan_no };
  }


  if (vehicle_no) {
    condi = { ...condi, vehicle_no: vehicle_no };
  }

  if (way_bill_no) {
    condi = { ...condi, waybill_no: way_bill_no };
  }

  if (vendor_id) {
    condi = { ...condi, vendor_id: vendor_id };
  }

  console.log("condi condi", condi);


  //below line doing filter of data , passing condition.
  await purchase_return
    .find({ $or: [condi] }, (err, returnData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (returnData) {
        //console.log("returnData + "+returnData);
        let returnDataArr = returnData.map((data) => ({
          vendor_name: vendorById(all_vendor, data.vendor_id),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        // console.log(returnData);

        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { purchase_return_id: 1, purchase_return: 1, _id: 0 });
};




//SALES RETURN

const view_sales_return = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  //Purchase_return
  const sales_return_id = req.body.sales_return_id;
  const sales_return_no = req.body.sales_return_no;
  const sales_return_from_date = req.body.sales_return_from_date;
  const sales_return_to_date = req.body.sales_return_to_date;
  const customer_id = req.body.customer_id;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;
  const invoice_no = req.body.invoice_no;
  const invoice_date = req.body.invoice_date;






  let all_customer = await customer
    .find({}, (err, customerData) => {
      return customerData;
    })
    .select({ customer_id: 1, contact_person: 1, _id: 0 });

  const customerById = (all_customer, customer_id) => {
    if (customer_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
      if (all_customer[iCtr]["customer_id"] === customer_id)
        return all_customer[iCtr]["contact_person"];
    }
  };

  let sales_data = await sales
    .find({}, (err, salesData) => {
      return salesData;
    })
    .select({ sales_id: 1, invoice_details: 1, invoice_item_details: 1, _id: 0 });

  const salesById = (sales_data, sales_id) => {
    // console.log("sank23077",invoice_no)
    if (sales_id === 0) return "--";
    for (let iCtr = 0; iCtr < sales_data.length; iCtr++) {

      // console.log("sank23008",(sales_data[iCtr]["invoice_item_details.invoice_no"] ===  RegExp.invoice_no))
      if (sales_data[iCtr]["sales_id"] === sales_id)
        return sales_data[iCtr]


          ;
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by Purchase_return
  if (sales_return_id) {
    condi = { ...condi, sales_return_id: sales_return_id };
  }

  if (sales_return_no) {
    condi = { ...condi, sales_return_no: new RegExp(sales_return_no, "i") };
  }

  if (invoice_no) {
    condi = { ...condi, 'invoice_item_details.invoice_no': new RegExp(invoice_no, "i") };
  }
  // if (invoice_date) {
  //   condi = { ...condi, 'invoice_details.invoice_date' : invoice_date}; 
  // }


  //both date filter
  if (sales_return_from_date && sales_return_to_date) {
    condi = {
      ...condi,
      "sales_return_date": {
        $gte: sales_return_from_date,
        $lte: sales_return_to_date,
      },
    };
  }

  if (customer_id) {
    condi = { ...condi, customer_id: customer_id };
  }

  if (showroom_warehouse_id) {
    condi = { ...condi, showroom_warehouse_id: showroom_warehouse_id };
  }

  //console.log("condi condi", condi);


  //below line doing filter of data , passing condition.
  await sales_return
    .find({ $or: [condi] }, (err, returnData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (returnData) {

        let returnDataArr = returnData.map((data) => (
          //console.log("Data + ", salesById(sales_data, data.sales_id)),
          {
            customer_name: customerById(all_customer, data.customer_id)[0].txt_name,
            sales: salesById(sales_data, data.sales_id),


            action_items: actionValues(data.active_status),
            ...data["_doc"],
          }));
        //console.log(returnData);

        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { sales_return_id: 1, sales_return: 1, _id: 0, sales_return_other_charges:1  });
};

//Update Sales Return



const updateSalesReturn = async (req, res) => {
  const condition = { sales_return_id: req.body.sales_return_id };
  const data = req.body;
  data.edited_by_id = req.body.edited_by_id
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.sales_return,
    data: condition,
  });

  const sale_return_Details = myData.data;
  data.edit_log = sale_return_Details;

  let show = await sales_return.find(
    {
      sales_return_id: req.body.sales_return_id
    },
    {
      _id: 0,
      showroom_warehouse_id: 1
    })

  data.dispatch_return_item_details.map(async (r) => {
    await itemStock.findOneAndUpdate(
      {
        item_id: r.item_id,
        showroom_warehouse_id: show[0].showroom_warehouse_id
      },
      {
        $inc: {
          closingStock: Number(r.actualRetrun)
        }
      }
    )
  })
  await sales_return.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};
const view_purchase = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const purchase_id = req.body.purchase_id;
  const bill_no = req.body.bill_no;
  //console.log(req.body,"7878")
  const grn_no = req.body.grn_no;
  const grn_date_from_date = req.body.grn_date_from_date;
  const grn_date_to_date = req.body.grn_date_to_date;

  const status = req.body.ddl_status;

  const po_date_from_date = req.body.po_date_from_date;
  const po_date_to_date = req.body.po_date_to_date;
  const po_no = req.body.po_no;
  const vendor_id = req.body.vendor_id;
  const item_vendor_id = req.body.item_vendor_id;
  //console.log(item_vendor_id, "yoooo");

  const showroom_warehouse_id = req.body.showroom_warehouse_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  const direct_purchase_from_date = req.body.direct_purchase_from_date;
  const direct_purchase_to_date = req.body.direct_purchase_to_date;
  const purchase_from_date = req.body.purchase_from_date;
  const purchase_to_date = req.body.purchase_to_date;

  const direct_purchase_keyword = req.body.direct_purchase_keyword;
  const purchase_keyword = req.body.purchase_keyword;

  //Module fro purchaseReturn
  const module = req.body.module;

  let all_vendor = await vendor
    .find({}, (err, vendorData) => {
      return vendorData;
    })
    .select({ vendor_id: 1, company_name: 1, _id: 0 });
  const vendorById = (all_vendor, vendor_id) => {
    if (vendor_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_vendor.length; iCtr++) {
      if (all_vendor[iCtr]["vendor_id"] === vendor_id)
        return all_vendor[iCtr]["company_name"];
    }
  };


  let all_showrooms_warehouse = await showrooms_warehouse
  .find({}, (err, showrooms_warehouseData) => {
    return showrooms_warehouseData;
  })
  .select({ showrooms_warehouse_id: 1, showrooms_warehouse: 1, _id: 0 });

  const showrooms_warehouseById = (all_showrooms_warehouse, showrooms_warehouse_id) => {
    if (showrooms_warehouse_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_showrooms_warehouse.length; iCtr++) {
      if (all_showrooms_warehouse[iCtr]["showrooms_warehouse_id"] === showrooms_warehouse_id)
        return all_showrooms_warehouse[iCtr]["showrooms_warehouse"];
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (purchase_id) {
    condition = { ...condition, purchase_id: purchase_id };
  }

  // Details by Name

  if (vendor_id) {
    condition = { ...condition, vendor_id: vendor_id };
  }

  if (item_vendor_id) {
    condition = { ...condition, "grn_details.vendor_id": item_vendor_id };
  } // Matching exact text but incase-sensitive

  if (showroom_warehouse_id) {
    condition = { ...condition, showroom_warehouse_id: showroom_warehouse_id };
  } // Matching exact text but incase-sensitive
  if (bill_no) {
    condition = {
      ...condition,
      "grn_details.bill_no": new RegExp(bill_no, "i"),
    };
  }
  if (po_no) {
    condition = { ...condition, po_number: new RegExp(po_no, "i") };
  }

  //any =1,0=not approved,2==approved
  //console.log("5050",condition)
  // if(status){

  if (status === 0) {
    // console.log("50504",status)
    condition = { ...condition, approve_id: 0 };
  } else if (status === 2) {
    //  console.log("50505",status)
    condition = { ...condition, approve_id: { $ne: 0 } };
  } else {
    condition = { ...condition, };
  }

  // }

  // if (grn_no) {
  //   condition = { ...condition, "grn_details.grn_no": new RegExp(grn_no, "i") };
  // }

  if (module === "ITEMRECEIVED") {
    if (grn_no) {
      condition = { ...condition, "grn_details.grn_no": new RegExp(grn_no, "i") };
    }
  } else {
    if (grn_no) {
      condition = { ...condition, "grn_no": new RegExp(grn_no, "i") };
    }
  }

  //For date search DIRECT PURCHASE
  if (direct_purchase_from_date) {
    condition = {
      ...condition,
      "grn_details.grn_date": direct_purchase_from_date,
    };
  }
  if (direct_purchase_to_date) {
    condition = {
      ...condition,
      "grn_details.grn_date": direct_purchase_to_date,
    };
  }
  //both date filter
  if (direct_purchase_from_date && direct_purchase_to_date) {
    condition = {
      ...condition,
      "grn_details.grn_date": {
        $gte: direct_purchase_from_date,
        $lte: direct_purchase_to_date,
      },
    };
  }


  //both date filter
  if (purchase_from_date && purchase_to_date) {
    condition = {
      ...condition,
      po_date: { $gte: purchase_from_date, $lte: purchase_to_date },
    };
  }

  //For date search PURCHASE
  else if (purchase_from_date) {
    condition = { ...condition, po_date: purchase_from_date };
  }
  else if (purchase_to_date) {
    condition = { ...condition, po_date: purchase_to_date };
  }

  //search date for item received

  if (grn_date_from_date) {
    condition = { ...condition, "grn_details.grn_date": grn_date_from_date };
  }
  if (grn_date_to_date) {
    condition = { ...condition, "grn_details.grn_date": grn_date_to_date };
  }
  //both date filter
  if (grn_date_from_date && grn_date_to_date) {
    condition = {
      ...condition,
      "grn_details.grn_date": {
        $gte: grn_date_from_date,
        $lte: grn_date_to_date,
      },
    };
  }

  //search date for purchase order

  if (po_date_from_date) {
    condition = { ...condition, po_date: po_date_from_date };
  }
  if (po_date_to_date) {
    condition = { ...condition, po_date: po_date_to_date };
  }
  //both date filter
  if (po_date_from_date && po_date_to_date) {
    condition = {
      ...condition,
      po_date: { $gte: po_date_from_date, $lte: po_date_to_date },
    };
  }

  //FOR KEYWORD SEARCH
  if (direct_purchase_keyword) {
    condition = {
      ...condition,
      $or: [
        { purchase_id: new RegExp(direct_purchase_keyword, "i") },
        { "grn_details.bill_value": new RegExp(direct_purchase_keyword, "i") },
      ],
    }; // Matching string also compare incase-sensitive
  }

  if (purchase_keyword) {
    condition = {
      ...condition,
      $or: [
        { purchase_id: new RegExp(purchase_keyword, "i") },
        { "grn_details.bill_value": new RegExp(purchase_keyword, "i") },
      ],
    }; // Matching string also compare incase-sensitive
  }

  // console.log("PO_cond", condition );

  await purchase
    .find(condition, (err, purchaseData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (purchaseData) {

        //  console.log("7879",purchaseData)

        let returnDataArr = purchaseData.map((data) => ({
          vendor_name: vendorById(all_vendor, data.vendor_id),
          showrooms_warehouse: showrooms_warehouseById(all_showrooms_warehouse, data.showroom_warehouse_id),
          action_items: actionValues(data.active_status),

          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { purchase_id: 1, purchase: 1, _id: 0 });
};

const view_purchase_aggregate = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const purchase_id = req.body.purchase_id;
  const bill_no = req.body.bill_no;
  //console.log(req.body,"7878")
  const grn_no = req.body.grn_no;
  const grn_date_from_date = req.body.grn_date_from_date;
  const grn_date_to_date = req.body.grn_date_to_date;

  const status = req.body.ddl_status;

  const po_date_from_date = req.body.po_date_from_date;
  const po_date_to_date = req.body.po_date_to_date;
  const po_no = req.body.po_no;
  const vendor_id = req.body.vendor_id;
  const item_vendor_id = req.body.item_vendor_id;
  // console.log(item_vendor_id, "yoooo");

  const showroom_warehouse_id = req.body.showroom_warehouse_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  const direct_purchase_from_date = req.body.direct_purchase_from_date;
  const direct_purchase_to_date = req.body.direct_purchase_to_date;
  const purchase_from_date = req.body.purchase_from_date;
  const purchase_to_date = req.body.purchase_to_date;

  const direct_purchase_keyword = req.body.direct_purchase_keyword;
  const purchase_keyword = req.body.purchase_keyword;

  //Module fro purchaseReturn
  const module = req.body.module;

  let all_vendor = await vendor
    .find({}, (err, vendorData) => {
      return vendorData;
    })
    .select({ vendor_id: 1, company_name: 1, _id: 0 });
  const vendorById = (all_vendor, vendor_id) => {
    if (vendor_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_vendor.length; iCtr++) {
      if (all_vendor[iCtr]["vendor_id"] === vendor_id)
        return all_vendor[iCtr]["company_name"];
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (purchase_id) {
    condition = { ...condition, purchase_id: purchase_id };
  }

  // Details by Name

  if (vendor_id) {
    condition = { ...condition, vendor_id: vendor_id };
  }

  if (item_vendor_id) {
    condition = { ...condition, "grn_details.vendor_id": item_vendor_id };
  } // Matching exact text but incase-sensitive

  if (showroom_warehouse_id) {
    condition = { ...condition, showroom_warehouse_id: showroom_warehouse_id };
  } // Matching exact text but incase-sensitive
  if (bill_no) {
    condition = {
      ...condition,
      "grn_details.bill_no": new RegExp(bill_no, "i"),
    };
  }
  if (po_no) {
    condition = { ...condition, po_number: new RegExp(po_no, "i") };
  }

  //any =1,0=not approved,2==approved
  //console.log("5050",condition)
  // if(status){

  if (status === 0) {
    //   console.log("50504",status)
    condition = { ...condition, approve_id: 0 };
  } else if (status === 2) {
    //    console.log("50505",status)
    condition = { ...condition, approve_id: { $ne: 0 } };
  } else {
    condition = { ...condition, };
  }

  // }

  // if (grn_no) {
  //   condition = { ...condition, "grn_details.grn_no": new RegExp(grn_no, "i") };
  // }

  if (module === "ITEMRECEIVED") {
    if (grn_no) {
      condition = { ...condition, "grn_details.grn_no": new RegExp(grn_no, "i") };
    }
  } else {
    if (grn_no) {
      condition = { ...condition, "grn_no": new RegExp(grn_no, "i") };
    }
  }

  //For date search DIRECT PURCHASE
  if (direct_purchase_from_date) {
    condition = {
      ...condition,
      "grn_details.bill_date": direct_purchase_from_date,
    };
  }
  if (direct_purchase_to_date) {
    condition = {
      ...condition,
      "grn_details.bill_date": direct_purchase_to_date,
    };
  }
  //both date filter
  if (direct_purchase_from_date && direct_purchase_to_date) {
    condition = {
      ...condition,
      "grn_details.bill_date": {
        $gte: direct_purchase_from_date,
        $lte: direct_purchase_to_date,
      },
    };
  }


  //both date filter
  if (purchase_from_date && purchase_to_date) {
    condition = {
      ...condition,
      po_date: { $gte: purchase_from_date, $lte: purchase_to_date },
    };
  }

  //For date search PURCHASE
  else if (purchase_from_date) {
    condition = { ...condition, po_date: purchase_from_date };
  }
  else if (purchase_to_date) {
    condition = { ...condition, po_date: purchase_to_date };
  }

  //search date for item received

  if (grn_date_from_date) {
    condition = { ...condition, "grn_details.grn_date": grn_date_from_date };
  }
  if (grn_date_to_date) {
    condition = { ...condition, "grn_details.grn_date": grn_date_to_date };
  }
  //both date filter
  if (grn_date_from_date && grn_date_to_date) {
    condition = {
      ...condition,
      "grn_details.grn_date": {
        $gte: grn_date_from_date,
        $lte: grn_date_to_date,
      },
    };
  }

  //search date for purchase order

  if (po_date_from_date) {
    condition = { ...condition, po_date: po_date_from_date };
  }
  if (po_date_to_date) {
    condition = { ...condition, po_date: po_date_to_date };
  }
  //both date filter
  if (po_date_from_date && po_date_to_date) {
    condition = {
      ...condition,
      po_date: { $gte: po_date_from_date, $lte: po_date_to_date },
    };
  }

  //FOR KEYWORD SEARCH
  if (direct_purchase_keyword) {
    condition = {
      ...condition,
      $or: [
        { purchase_id: new RegExp(direct_purchase_keyword, "i") },
        { "grn_details.bill_value": new RegExp(direct_purchase_keyword, "i") },
      ],
    }; // Matching string also compare incase-sensitive
  }

  if (purchase_keyword) {
    condition = {
      ...condition,
      $or: [
        { purchase_id: new RegExp(purchase_keyword, "i") },
        { "grn_details.bill_value": new RegExp(purchase_keyword, "i") },
      ],
    }; // Matching string also compare incase-sensitive
  }

  // console.log("PO_cond", condition );

  // await purchase
  //   .find(condition, (err, purchaseData) => {
  //     if (err) {
  //       return res.status(500).json({ Error: err });
  //     }
  //     if (purchaseData) {

  //       console.log("7879",purchaseData)

  //       let returnDataArr = purchaseData.map((data) => ({
  //         vendor_name: vendorById(all_vendor, data.vendor_id),
  //         action_items: actionValues(data.active_status),

  //         ...data["_doc"],
  //       }));
  //       return res.status(200).json(returnDataArr);
  //     } else {
  //       return res.status(200).json([]);
  //     }
  //   })
  //   .select(short_data === true && { purchase_id: 1, purchase: 1, _id: 0 });


};


const delete_purchase = async (req, res) => {
  const purchase_id = req.body.purchase_id;
  const condition = { purchase_id: purchase_id };
  await purchase.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};
const update_purchase = async (req, res) => {
  const condition = { purchase_id: req.body.purchase_id };
  const data = req.body;
  const purchase_id = req.body.purchase_id;



  data.edit_by_date = moment().format("X");

  //console.log("app", data.approve_by_id);

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.purchase_list,
    data: condition,
  });
  //console.log("sen==>>",myData)

  // data.inserted_by_id = req.body.inserted_by_id >0 ? req.body.inserted_by_id : myData.inserted_by_id;

  // data.edited_by_id = req.body.edited_by_id >0 ? req.body.edited_by_id :myData.edited_by_id;

  let newData = data;

  if (data.module === "ITEMRECEIVED") {
    // console.log(serial_no,"serial_item_received");
    const updatingItemReceived = req.body.updatingItemReceived;
    const receivedDetails = await getAllGRNDetails(newData.purchase_id);
    // newData = {...newData,grn_details:[...receivedDetails.grn_details,{...newData.grn_details,grn_no:serial_no}],received_item_details:[...receivedDetails.received_item_details,{...newData.received_item_details,grn_no:serial_no}]}
    const serial_no = await generateSerialNumber(data.module, data.grn_details[0]?.grn_date);

    // newData = { ...newData, grn_no: serial_no };

    for (let iCtr = 0; iCtr < newData.received_item_details.length; iCtr++) {
      newData.received_item_details[iCtr].grn_no = serial_no;
      receivedDetails.received_item_details.push(
        newData.received_item_details[iCtr]
      );
      //newData.received_item_console.log(receivedDetails.received_item_details)
    }

    //console.log(newData.received_item_details,receivedDetails.received_item_details)

    let grn_details = [];
    if (updatingItemReceived) {
      let updated_grn_detail_index = receivedDetails.grn_details.findIndex(
        (grn_detail_in_arr) =>
          grn_detail_in_arr.grn_no === newData.grn_details.grn_no
      );
      if (updated_grn_detail_index >= 0)
        receivedDetails.grn_details[updated_grn_detail_index] =
          newData.grn_details;
      grn_details = receivedDetails.grn_details;
    } else {
      grn_details = [
        ...receivedDetails.grn_details,
        { ...newData.grn_details, grn_no: serial_no },
      ];
    }

    newData = {
      ...newData,
      grn_details,
    };
    newData = {
      ...newData,
      received_item_details: receivedDetails.received_item_details,
    };
  }

  if (data.approve_id) {
    newData = {
      ...newData,
      approve_id: data.approve_id,
      approved_by_date: data.approved_by_date
    };
  }

  console.log("app90901", data);

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);


  // const purchaseDetails = myData.data;
  // data.edit_log = purchaseDetails;

  let showRoom = await purchase.find({ purchase_id: purchase_id }, { showroom_warehouse_id: 1 })

  if(data.module === "DIRECT PURCHASE"){
    data.item_details.map(async (r) => {
      await itemStock.findOneAndUpdate(
        {
          item_id: r.item_id,
          showroom_warehouse_id: showRoom[0].showroom_warehouse_id
        },
        {
          $inc: {
            closingStock: Number(r.quantity)
          }
        }
      )
    })
  }
  else if (data.module === "ITEMRECEIVED"){
    console.log("I===>>",data)
    data.received_item_details.map(async (r) => {
      await itemStock.findOneAndUpdate(
        {
          item_id: r.item_id,
          showroom_warehouse_id: showRoom[0].showroom_warehouse_id
        },
        {
          $inc: {
            closingStock: Number(r.receivedQty)
          }
        }
      )
    })
  }
 

  await purchase.findOneAndUpdate(condition, newData, (err, obj) => {
    if (err) {
      // console.log("reached90901")
      return res.status(500).json({ Error: err });
    }
    //console.log("reached909012",newData)
    let received_grn_no = newData?.received_item_details ? newData?.received_item_details[0]?.grn_no : newData.grn_no
    return res.status(200).json({ ...obj, "received_grn_no": received_grn_no });
  });
};

const view_sales = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };

  const sales_id = req.body.sales_id;
  const invoice_no = req.body.invoice_no;
  const source_id = req.body.source_id;

  //FOR ENQUIRY SEARCH
  const enquiry_no = req.body.enq_no;
  const enquiry_from_date = req.body.enquiry_from_date;
  const enquiry_to_date = req.body.enquiry_to_date;
  const searchQuery = req.body.keyword_pharse;
  const enquiry_status = req.body.enquiry_status;
  const customer_id = req.body.customer_id;
  const invoice_id = req.body.invoice_id;

  //FOR QUOTATION SEARCH
  const quotation_no = req.body.quotation_no;
  const quotation_from_date = req.body.quotation_from_date;
  const quotation_to_date = req.body.quotation_to_date;
  const quotation_status = req.body.quotation_status;
  const quotation_keyword = req.body.quotation_keyword;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only

  //FOR SALES ORDER SEARCH
  const sales_order_no = req.body.sales_order_no;
  const sales_customer = req.body.sales_customer;
  const sales_status = req.body.sales_status;
  const sales_order_from_date = req.body.sales_order_from_date;
  const sales_order_to_date = req.body.sales_order_to_date;
  const sales_key_phrase = req.body.sales_key_phrase;

  //FOR DELIVERY_ORDER SEARCH
  const delivery_order_no = req.body.delivery_order_no;
  const delivery_customer = req.body.delivery_customer;
  const delivery_sales_order_from_date = req.body.delivery_sales_order_from_date;
  const delivery_sales_order_to_date = req.body.delivery_sales_order_to_date;

  //FOR DISPATCH ORDER SEARCH
  const dispatch_order_no = req.body.dispatch_order_no;
  const dispatch_order_from_date = req.body.dispatch_order_from_date;
  const dispatch_order_to_date = req.body.dispatch_order_to_date;
  const delivery_date_from = req.body.delivery_date_from;
  const delivery_date_to = req.body.delivery_date_to;
  const dispatch_customer = req.body.dispatch_customer;

  //for invoice search
  const invoice_date_from = req.body.invoice_date_from;
  const invoice_date_to = req.body.invoice_date_to;
  const bill_no_sales = req.body.bill_no;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;
  //vehicle No
  const vehicle_id = req.body.vehicle_id;

  //   let all_vehicle = await vehicle
  //   .find({}, (err, vehicleData) => {
  //     return vehicleData;
  //   })
  //   .select({ customer_id: 1, contact_person: 1, _id: 0 });
  // const customerById = (all_customer, customer_id) => {
  //   if (customer_id === 0) return "--";
  //   for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
  //     if (all_customer[iCtr]["customer_id"] === customer_id)
  //       return all_customer[iCtr]["contact_person"];
  //   }
  // };

  let all_source = await source
    .find({}, (err, groupData) => {
      return groupData;
    })
    .select({ source_id: 1, source: 1, _id: 0 });

  const sourceById = (all_source, source_id) => {
    // console.log("source id "+source_id);
    if (source_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_source.length; iCtr++) {
      if (all_source[iCtr]["source_id"] === source_id)
        return all_source[iCtr]["source"];
    }
  };

  let all_customer = await customer
    .find({}, (err, customerData) => {
      return customerData;
    })
    .select({ customer_id: 1, contact_person: 1,
      company_name:1,address:1,gst_no:1,  _id: 0 });
  const customerById = (all_customer, customer_id) => {
    if (customer_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
      if (all_customer[iCtr]["customer_id"] === customer_id)
        return all_customer[iCtr]["address"]
    }
  };
  const customerByIdC = (all_customer, customer_id) => {
    if (customer_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
      if (all_customer[iCtr]["customer_id"] === customer_id)
        return all_customer[iCtr]["company_name"]
    }
  };
  const customerById1 = (all_customer, customer_id) => {
    if (customer_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
      if (all_customer[iCtr]["customer_id"] === customer_id)
        return all_customer[iCtr]["gst_no"]
    }
  };

  let all_showrooms_warehouse = await showrooms_warehouse
    .find({}, (err, showrooms_warehouseData) => {
      return showrooms_warehouseData;
    })
    .select({ showrooms_warehouse_id: 1, showrooms_warehouse: 1, _id: 0 });
  const showrooms_warehouseById = (
    all_showrooms_warehouse,
    showrooms_warehouse_id
  ) => {
    if (showrooms_warehouse_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_showrooms_warehouse.length; iCtr++) {
      if (
        all_showrooms_warehouse[iCtr]["showrooms_warehouse_id"] ===
        showrooms_warehouse_id
      )
        return all_showrooms_warehouse[iCtr]["showrooms_warehouse"];
    }
  };

  let all_User = await User.find({}, (err, UserData) => {
    return UserData;
  }).select({ user_id: 1, name: 1, mobile:1, _id: 0 });
  const UserById = (all_User, user_id) => {
    if (user_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_User.length; iCtr++) {
      if (all_User[iCtr]["user_id"] === user_id) return all_User[iCtr]["name"];
    }
  };

  const UserByIdPh = (all_User, user_id) => {
    if (user_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_User.length; iCtr++) {
      if (all_User[iCtr]["user_id"] === user_id) 
      return all_User[iCtr]["mobile"];
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };
  // Details by vehicle ID
  if (vehicle_id) {
    condition = { ...condition, vehicle_id: vehicle_id };
  }
  // Details by ID
  if (sales_id) {
    condi = { ...condi, sales_id: sales_id };
  }
  if (invoice_no) {
    condi = { ...condi, invoice_no: invoice_no };
  }

  // Details by enquiry no
  if (enquiry_no) {
    condi = { ...condi, enquiry_no: new RegExp(enquiry_no, "i") };
  }

  // Details by quotation no
  if (quotation_no) {
    condi = { ...condi, quotation_no: new RegExp(quotation_no, "i") };
  }

  //Details by sales orders no
  if (sales_order_no) {
    condi = { ...condi, sales_order_no: new RegExp(sales_order_no, "i") };
  }

  //Details by delivery order no
  if (delivery_order_no) {
    condi = { ...condi, delivery_order_no: new RegExp(delivery_order_no, "i") };
  }

  //Details by dispatch order no
  if (dispatch_order_no) {
    condi = { ...condi, dispatch_order_no: new RegExp(dispatch_order_no, "i") };
  }

  if (dispatch_customer) {
    condi = { ...condi, customer_id: dispatch_customer };
  }


  if (bill_no_sales) {
    condi = { ...condi, invoice_no: new RegExp(bill_no_sales, "i") };
  }

  // console.log(showroom_warehouse_id,"ssss");

  if (showroom_warehouse_id) {
    condi = {
      ...condi,
      "invoice_item_details.showroom_warehouse_id": new RegExp(
        showroom_warehouse_id,
        "i"
      ),
    };
  }

  if (searchQuery) {
    condi = {
      ...condi,
      $or: [
        { "enquiry_details.cust_name": new RegExp(searchQuery, "i") },
        { "enquiry_details.sales_exe_name": new RegExp(searchQuery, "i") },
        { "enquiry_details.showroom_name": new RegExp(searchQuery, "i") },
        { enquiry_no: new RegExp(searchQuery, "i") },

      ],
    };
  }

  //search by source id .
  if (source_id) {
    condi = { ...condi, "enquiry_details.source_id": source_id };
  }

  if (customer_id) {
    condi = { ...condi, customer_id: customer_id };
  }

  if (invoice_id) {
    condi = { ...condi, "invoice_details.invoice_id": invoice_id };
  }

  // Search by keyword and phrase

  //For enquiry
  if (searchQuery) {
    condi = {
      ...condi,
      $or: [
        { "enquiry_details.cust_name": new RegExp(searchQuery, "i") },
        { "enquiry_details.sales_exe_name": new RegExp(searchQuery, "i") },
        { "enquiry_details.showroom_name": new RegExp(searchQuery, "i") },
        { "enquiry_details.inv_gross_amount": new RegExp(searchQuery, "i") },
        { enquiry_no: new RegExp(searchQuery, "i") },

      ],
    }; // Matching string also compare incase-sensitive
  }

  //keyword search for quotation

  //For quotation
  if (quotation_keyword) {
    condi = {
      ...condi,
      $or: [
        { enquiry_no: new RegExp(quotation_keyword, "i") },
        {
          "enquiry_details.sales_exe_name": new RegExp(quotation_keyword, "i"),
        },
      ],
    }; // Matching string also compare incase-sensitive
  }

  //key phrase search by sales order

  if (sales_key_phrase) {
    condi = {
      ...condi,
      $or: [
        { enquiry_no: new RegExp(sales_key_phrase, "i") },
        { quotation_no: new RegExp(sales_key_phrase, "i") },
        { sales_order_no: new RegExp(sales_key_phrase, "i") },
        { "enquiry_details.cust_name": new RegExp(sales_key_phrase, "i") },


      ],
    }; // Matching string also compare incase-sensitive
  }

  //datefilter
  if (enquiry_from_date) {
    condi = { ...condi, "enquiry_details.enquiry_date": enquiry_from_date };
  }

  //datefilter
  if (enquiry_to_date) {
    condi = { ...condi, "enquiry_details.enquiry_date": enquiry_to_date };
  }

  //both date filter
  if (enquiry_from_date && enquiry_to_date) {
    condi = {
      ...condi,
      "enquiry_details.enquiry_date": {
        $gte: enquiry_from_date,
        $lte: enquiry_to_date,
      },
    };
  }

  //FOR QUOTATION SEARCH PURPOSE BY DATE BETWEEN

  if (quotation_from_date) {
    condi = { ...condi, quotation_date: quotation_from_date };
  }

  //datefilter
  if (quotation_to_date) {
    condi = { ...condi, quotation_date: quotation_to_date };
  }

  //both date filter
  if (quotation_from_date && quotation_to_date) {
    condi = {
      ...condi,
      quotation_date: { $gte: quotation_from_date, $lte: quotation_to_date },
    };
  }

  // For sales order date search
  if (sales_order_from_date) {
    condi = { ...condi, sales_order_date: sales_order_from_date };
  }

  //datefilter
  if (sales_order_to_date) {
    condi = { ...condi, sales_order_date: sales_order_to_date };
  }

  //both date filter
  if (sales_order_from_date && sales_order_to_date) {
    condi = {
      ...condi,
      sales_order_date: {
        $gte: sales_order_from_date,
        $lte: sales_order_to_date,
      },
    };
  }

  //delivery Sales date search
  if (delivery_sales_order_from_date) {
    condi = { ...condi, delivery_order_date: delivery_sales_order_from_date };
  }

  //datefilter
  if (delivery_sales_order_to_date) {
    condi = { ...condi, delivery_order_date: delivery_sales_order_to_date };
  }

  //both date filter
  if (delivery_sales_order_from_date && delivery_sales_order_to_date) {
    condi = {
      ...condi,
      delivery_order_date: {
        $gte: delivery_sales_order_from_date,
        $lte: delivery_sales_order_to_date,
      },
    };
  }

  // For dispatch order date search
  if (dispatch_order_from_date) {
    condi = { ...condi, dispatch_order_date: dispatch_order_from_date };
  }

  // //datefilter
  if (dispatch_order_to_date) {
    condi = { ...condi, dispatch_order_date: dispatch_order_to_date };
  }

  //both date filter
  if (dispatch_order_from_date && dispatch_order_to_date) {
    condi = {
      ...condi,
      dispatch_order_date: {
        $gte: dispatch_order_from_date,
        $lte: dispatch_order_to_date,
      },
    };
  }

  //SEARCH DATe for SALES REGISTER PAGES
  //datefilter
  //  if(invoice_date_from )
  //  {
  //     condi={...condi,'invoice_date': invoice_date_from };
  //  }

  //  //datefilter
  //  if(invoice_date_to )
  //  {
  //    condi={...condi,'invoice_date': invoice_date_to };
  //  }

  //both date filter
  if (invoice_date_from && invoice_date_to) {
    condi = { ...condi, 'invoice_date': { '$gte': (invoice_date_from), '$lte': (invoice_date_to) } };
  }

  // For dispatch delivery order date search
  if (delivery_date_from) {
    condi = { ...condi, delivery_order_date: delivery_date_from };
  }

  // //datefilter
  if (delivery_date_to) {
    condi = { ...condi, delivery_order_date: delivery_date_to };
  }

  //both date filter
  if (delivery_date_from && delivery_date_to) {
    condi = {
      ...condi,
      delivery_order_date: { $gte: delivery_date_from, $lte: delivery_date_to },
    };
  }

  //enquiry status filter
  if (enquiry_status) {
    // console.log("statis:-"+active_status);
    condi = { ...condi, enquiry_status: enquiry_status };
  }

  //for all Sales Status
  if (quotation_status) {
    condi = { ...condi, quotation_status: quotation_status };
  }

  //for sales order status search

  if (sales_status) {
    condi = { ...condi, sales_status: sales_status };
  }

  //for sales order customer search filter

  if (sales_customer) {
    condi = { ...condi, customer_id: sales_customer };
  }

  //for delivery order customer search

  if (delivery_customer) {
    condi = { ...condi, customer_id: delivery_customer };
  }

  //below line doing filter of data , passing condition.
  await sales
    .find({ $or: [condi] }, (err, salesData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (salesData && salesData.customer_id!==undefined){
        let returnDataArr = salesData?.map((data) => ({
          
          customer_name: customerById(all_customer, data?.customer_id)[0]?.txt_name,
          mobile: customerById(all_customer, data?.customer_id)[0]?.txt_mobile,
          city: customerById(all_customer, data?.customer_id)[0]?.txt_city,
          state:customerById(all_customer, data?.customer_id)[0]?.ddl_state_label,
          street:customerById(all_customer, data?.customer_id)[0]?.txt_street,
          area:customerById(all_customer, data?.customer_id)[0]?.ddl_area_label,
          pin:customerById(all_customer, data?.customer_id)[0]?.txt_pin,
          police:customerById(all_customer, data?.customer_id)[0]?.txt_police_station,
          street:customerById(all_customer, data?.customer_id)[0]?.txt_street,
          gst_no: customerById1(all_customer, data?.customer_id),
          
          
          company_name: customerByIdC(all_customer, data?.customer_id),
          

          source_name: sourceById(
            all_source,
            data?.enquiry_details[0]?.source_id
          ),
          showroom_warehouse_name: showrooms_warehouseById(
            all_showrooms_warehouse,
            data?.enquiry_details[0]?.showroom_warehouse_id
          ),
          sales_executive_name: UserById(
            all_User,
            data?.enquiry_details[0]?.sales_executive_id
          ),
          sales_phone: UserByIdPh(
            all_User,
            data?.enquiry_details[0]?.sales_executive_id ),

          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }
        ));

        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { sales_id: 1, sales: 1, _id: 0 });
};

//For delivery return
const view_delivery_return = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const customer_id = req.body.customer_id;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const sales_id = req.body.sales_id;

  //for invoice search
  const invoice_date_from = req.body.invoice_date_from;
  const invoice_date_to = req.body.invoice_date_to;
  const bill_no_sales = req.body.bill_no;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;
  //console.log("HK12",showroom_warehouse_id)

  // let all_customer = await customer
  //   .find({}, (err, customerData) => {
  //     return customerData;
  //   })
  //   .select({ customer_id: 1, contact_person: 1, _id: 0 });

  // const customerById = (all_customer, customer_id) => {
  //   if (customer_id === 0) return "--";
  //   for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
  //     if (all_customer[iCtr]["customer_id"] === customer_id)
  //       return all_customer[iCtr]["contact_person"];
  //   }
  // };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  if (showroom_warehouse_id) {
    condi = {
      ...condi,
      "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id
    };
  }
  //console.log("DEY",showroom_warehouse_id)


  // Details by ID
  if (sales_id) {
    condi = { ...condi, sales_id: sales_id };
  }

  //Details by bill no
  if (bill_no_sales) {
    condi = { ...condi, 'invoice_details.invoice_no': new RegExp(bill_no_sales, "i") };
  }

  if (customer_id) {
    condi = { ...condi, customer_id: customer_id };
  }

  //both date filter
  if (invoice_date_from && invoice_date_to) {
    condi = { ...condi, 'invoice_details.invoice_date': { '$gte': (invoice_date_from), '$lte': (invoice_date_to) } };
  }

  let salesData = await sales.aggregate([
    { "$unwind": "$invoice_details" },

    { $match: condi },


    {
      $lookup: {
        from: "t_400_customers",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$customer_id", "$$customer_id"] }, },
          },
          { $project: { "contact_person.txt_name": 1, "_id": 0, "gst_no": 1 } }
        ],
        as: "customer_details"
      },
    },

    {
      $addFields: {
        customer_name: { $first: "$customer_details.contact_person.txt_name" },
        gst_no: { $first: "$customer_details.gst_no" },
        invoice_date: { $first: "$customer_details.invoice_date" }

      }
    },
    { $unset: ["customer_details"] },

    {
      $sort: { "invoice_date": 1 }
    },


  ]);

  if (salesData) {

    let returnDataArr = salesData.map((data) => {
      let req_invoice_item_details = data.invoice_item_details.filter((o) => o.invoice_no === data.invoice_details.invoice_no);
      let req_invoice_other_charges = data.invoice_other_charges.filter((o) => o.invoice_no === data.invoice_details.invoice_no);
      let req_dispatch_order_details = data.dispatch_order_details.filter((o) => o.dispatch_order_no === data.invoice_details.dispatch_order_no);
      //let req_invoice_item_details = data.invoice_item_details;
      //let req_invoice_other_charges = data.invoice_other_charges;
      //let req_dispatch_order_details = data.dispatch_order_details;

      return ({
        sales_id: data.sales_id,
        customer_id: data.customer_id,
        customer_name: data.customer_name, //customerById(all_customer, data.customer_id)[0].txt_name,
        // mobile: customerById(all_customer, data.customer_id)[0].txt_mobile,
        // email: customerById(all_customer, data.customer_id)[0].txt_email,
        // company_name : customerById(all_customer, data.customer_id)[0].company_name,
        //source_name: sourceById(all_source,data.enquiry_details[0].source_id),
        invoice_date: data.invoice_details.invoice_date,
        invoice_no: data.invoice_details.invoice_no,
        invoice_details: data.invoice_details,
        invoice_item_details: req_invoice_item_details.length ? req_invoice_item_details : data.invoice_item_details,
        invoice_other_charges: req_invoice_other_charges,
        quotation_no: data.quotation_no,
        enquiry_no: data.enquiry_no,
        sales_order_no: data.sales_order_no,
        dispatch_order_details: req_dispatch_order_details,
        action_items: actionValues(data.active_status),
        ...data["_doc"],
      })
    });
    // console.log("sD", returnDataArr.length);

    if (showroom_warehouse_id) {
      returnDataArr = returnDataArr.filter(d => d.invoice_item_details.filter(o => o.showroom_warehouse_id === showroom_warehouse_id).length > 0);
    }

    return res.status(200).json(returnDataArr);
  } else {
    return res.status(200).json([]);
  }
};

//hey
const view_invoice = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const customer_id = req.body.customer_id;
  // const short_data = req.body.short_data ? req.body.short_data : false; 
  const sales_id = req.body.sales_id;
  const item = req.body.item;

  //for invoice search
  const invoice_date_from = req.body.invoice_date_from;
  const invoice_date_to = req.body.invoice_date_to;
  const bill_no_sales = req.body.bill_no;
  const sales_order_no = req.body.sales_order_no;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  if (showroom_warehouse_id) {
    condi = {
      ...condi,
      "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id,
    };
  }
  //console.log("DEY",showroom_warehouse_id)

  // Details by ID
  if (sales_id) {
    condi = { ...condi, sales_id: sales_id };
  }

  //Details by bill no
  if (bill_no_sales) {
    condi = {
      ...condi,
      "invoice_details.invoice_no": new RegExp(bill_no_sales, "i"),
    };
  }

  if (sales_order_no) {
    condi = { ...condi, sales_order_no: new RegExp(sales_order_no, "i") };
  }

  if (customer_id) {
    condi = { ...condi, customer_id: customer_id };
  }
  if (item) {
    condi = {
      ...condi,
      "invoice_item_details.item": { $regex: item, $options: "i" },
    };
  }

  //both date filter
  if (invoice_date_from && invoice_date_to) {
    condi = {
      ...condi,
      "invoice_details.invoice_date": {
        $gte: invoice_date_from,
        $lte: invoice_date_to,
      },
    };
  }

  let salesData = await sales.aggregate([
    { $unwind: "$invoice_details" },

    { $match: condi },

    {
      $lookup: {
        from: "t_400_customers",
        let: { customer_id: "$customer_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$customer_id", "$$customer_id"] } },
          },
          {
             $project: 
            { 
              "contact_person.txt_name": 1,
               _id: 0,
                gst_no: 1,
                address:1,
              
              } 
            },
        ],
        as: "customer_details",
      },
    },

    {
      $addFields: {
        customer_name: { $first: "$customer_details.contact_person.txt_name" },
        gst_no: { $first: "$customer_details.gst_no" },
        invoice_date: { $first: "$customer_details.invoice_date" },
        address:{$first:"$customer_details.address"}
      },
    },
    { $unset: ["customer_details"] },

    // {
    //   $sort: { invoice_date: 1, invoice_no: -1 },
    // },
  ]);

  if (salesData) {

    const returnDataArr = await Promise.all(
     salesData.map(async(data) => {
      let req_invoice_item_details = data.invoice_item_details.filter(
        (o) => o.invoice_no === data.invoice_details.invoice_no
      );
      let req_invoice_other_charges = data.invoice_other_charges.filter(
        (o) => o.invoice_no === data.invoice_details.invoice_no
      );
      let req_dispatch_order_details = data.dispatch_order_details.filter(
        (o) => o.dispatch_order_no === data.invoice_details.dispatch_order_no
      );

      return {
        sales_id: data.sales_id,
        customer_id: data.customer_id,
        customer_name: data.customer_name, 
        address:data.address,
        invoice_date: data.invoice_details.invoice_date,
        invoice_no: data.invoice_details.invoice_no,
        invoice_details: data.invoice_details,
        invoice_item_details: req_invoice_item_details.length
          ? req_invoice_item_details
          : data.invoice_item_details,
        invoice_other_charges: req_invoice_other_charges,
        quotation_no: data.quotation_no,
        enquiry_no: data.enquiry_no,
        sales_order_no: data.sales_order_no,
        dispatch_order_details: req_dispatch_order_details,
        action_items: actionValues(data.active_status),
        ...data["_doc"],
      };
    })
    );
    
    

    if (showroom_warehouse_id) {
      returnDataArr = returnDataArr.filter(
        (d) =>
          d.invoice_item_details.filter(
            (o) => o.showroom_warehouse_id === showroom_warehouse_id
          ).length > 0
      );
    }

    return res.status(200).json(returnDataArr);
  } else {
    return res.status(200).json([]);
  }
};




const updatesales = async (req, res) => {
  const condition = { sales_id: req.body.sales_id };
  let total_do = req.body.total_do;
  let s_edit = req.body.edit;

  const data = req.body;
  delete data["total_do"];
  delete data["edit"];

  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.sales_list,
    data: condition,
  });
  const salesDetails = myData.data;
  data.edit_log = salesDetails;

  let all_status = await status
    .find({}, (err, statusData) => {
      return statusData;
    })
    .select({ status_id: 1, status_for: 1, status_name: 1, _id: 0 });

  //console.log("vus", all_customer);

  const statusByName = (all_status, status_for, status_name) => {
    for (let iCtr = 0; iCtr < all_status.length; iCtr++) {
      if (all_status[iCtr]["status_for"] === status_for && all_status[iCtr]["status_name"] === status_name)
        return all_status[iCtr]["status_id"];
    }
  };

  let newData = data;

  if (s_edit) {
    if (data.module === "DELIVERY_ORDER") {
      let so_quantity = salesDetails.sales_order_item_details?.reduce((p, c) => p + Number(c.quantity), 0);
      //  console.log("mmplk", total_do, " :: ", so_quantity);

      if (total_do >= so_quantity) {
        newData = { ...newData, sales_status: statusByName(all_status, "Sales-Order", "D.O. Gen. fully") };
      }

      else {
        newData = { ...newData, sales_status: statusByName(all_status, "Sales-Order", "	D.O. Gen. partly") };
      }
    }
  }

  else {
    let serial_number = ''
    if (data.module === "QUOTATION") {
      serial_number = await generateSerialNumber(data.module, data.quotation_date);

      newData = { ...newData, quotation_no: serial_number };
    } else if (data.module === "SALES_ORDER") {
      serial_number = await generateSerialNumber(data.module, data.sales_order_date);

      newData = { ...newData, sales_order_no: serial_number };
    } else if (data.module === "DELIVERY_ORDER") {
      // console.log(data,"deldata")
      serial_number = await generateSerialNumber(data.module, data.delivery_order_date);

      const deliveryDetails = await getAllDeliveryDetails(newData.sales_id);
      //  console.log("NDT", newData);

      //newData = {...newData,delivery_order_no:serial_number}

      for (
        let iCtr = 0;
        iCtr < newData.delivery_order_item_details.length;
        iCtr++
      ) {
        newData.delivery_order_item_details[iCtr].delivery_no = serial_number;
        deliveryDetails.delivery_order_item_details.push(
          newData.delivery_order_item_details[iCtr]
        );
      }

      deliveryDetails.delivery_order_details.push({
        delivery_order_no: serial_number,
        delivery_order_date: newData.delivery_order_date,
        delivery_order_from_date: newData.delivery_order_from_date,
        delivery_order_to_date: newData.delivery_order_to_date,
        delivery_order_note: newData.delivery_order_note,
        delivery_status: statusByName(all_status, "Delivery-Order", "New"),
      });

      deliveryDetails.delivery_order_no.push(serial_number);

      newData = {
        ...newData,
        delivery_order_no: [...deliveryDetails.delivery_order_no],
      };

      newData = {
        ...newData,
        delivery_order_item_details: deliveryDetails.delivery_order_item_details,
      };

      newData = {
        ...newData,
        delivery_order_details: deliveryDetails.delivery_order_details,
      };

      ['delivery_order_date', 'delivery_order_from_date', 'delivery_order_to_date', 'delivery_order_note', 'delivery_status'].forEach(
        e => delete newData[e]
      );

      let so_quantity = salesDetails.sales_order_item_details?.reduce((p, c) => p + Number(c.quantity), 0);
      // console.log("mmplk", total_do, " :: ", so_quantity);

      if (total_do >= Number(so_quantity)) {
        newData = { ...newData, sales_status: statusByName(all_status, "Sales-Order", "D.O. Gen. fully") };
      }

      else {
        newData = { ...newData, sales_status: statusByName(all_status, "Sales-Order", "D.O. Gen. partly") };
      }
    }

    else if (data.module === "DISPATCH_ORDER") {
      serial_number = await generateSerialNumber(data.module, data.dispatch_order_date);

      //newData = { ...newData, dispatch_order_no: serial_number };
      const dispatchDetails = await getAllDispatchDetails(newData.sales_id);
      const deliveryDetails = await getAllDeliveryDetails(newData.sales_id);
      const corr_do_no = newData.do_num;
      // console.log("cdo", corr_do_no);
      //delete newData.do_num;
      //console.log("klg", deliveryDetails.delivery_order_item_details, "::", corr_do_no);
      //deliveryDetails.delivery_order_item_details.filter((ob) => ob.delivery_no === corr_do_no )[0].delivery_status = 27;
      //console.log("shan2", deliveryDetails.delivery_order_item_details);


      //newData = {...newData,delivery_order_no:serial_number}

      for (
        let iCtr = 0;
        iCtr < newData.dispatch_order_item_details.length;
        iCtr++
      ) {
        newData.dispatch_order_item_details[iCtr].dispatch_no = serial_number;
        dispatchDetails.dispatch_order_item_details.push(
          newData.dispatch_order_item_details[iCtr]
        );

        if (Number(newData.dispatch_order_item_details[iCtr].quantity) >= newData.dispatch_order_item_details[iCtr].now_dispatch_qty) {
          newData.sales_status = statusByName(all_status, "Sales-Order", "D.O. Gen. partly");
        }
      }

      dispatchDetails.dispatch_order_details.push({
        dispatch_order_no: serial_number,
        delivery_order_no: corr_do_no,
        dispatch_order_date: newData.dispatch_order_date,
        vehicle_id: newData.vehicle_id,
        contractor_id: newData.contractor_id,
        dispatch_order_note: newData.dispatch_order_note,
        status: statusByName(all_status, "Dispatch", "Unbilled"),
      });

      dispatchDetails.dispatch_order_no.push(serial_number);

      newData = {
        ...newData,
        dispatch_order_no: [...dispatchDetails.dispatch_order_no],
      };

      newData = {
        ...newData,
        dispatch_order_details: [...dispatchDetails.dispatch_order_details],
      };

      newData = {
        ...newData,
        delivery_order_item_details: deliveryDetails.delivery_order_item_details,
        dispatch_order_item_details: dispatchDetails.dispatch_order_item_details,
      };

      //console.log("dgv", newData.dispatch_order_item_details.filter((o) => 
      //o.delivery_order_no === corr_do_no));
      // console.log("addp", newData);

      const all_disp_do = newData.dispatch_order_item_details.filter(
        (o) => o.delivery_order_no === corr_do_no);
      const all_dos = newData.delivery_order_item_details.filter(
        (o) => o.delivery_no === corr_do_no
      );

      const all_swids = [... new Set(all_dos.map(o => {
        return Object.keys(o).filter(b => b.split("_")[1] == o.item_id && o[b] > 0).map(b => Number(b.split("_")[0]));
      }).flat())];

      let wh_current_disp = [];

      all_dos.map(dor => {
        let all_disp_item = all_disp_do.filter(o => o.item_id === dor.item_id);
        //console.log("all dis item", all_disp_item);

        if (all_disp_item.length > 0)
          wh_current_disp = [...new Set(wh_current_disp.concat(all_disp_item.map(b => Number(b.showroom_warehouse_id))))];
      });

      // console.log("hongshini ", all_swids, " :: ", wh_current_disp);

      if (all_swids.length === wh_current_disp.length && all_swids.every((val) => wh_current_disp.includes(val))) {
        ///newData = { ...newData, sales_status: 29 };
        // console.log("dolaaa1", deliveryDetails.delivery_order_details);
        deliveryDetails.delivery_order_details.filter((o) => o.delivery_order_no === corr_do_no)[0].delivery_status = statusByName(all_status, "Delivery-Order", "Dis.Order Gen.Fully");
        newData = {
          ...newData,
          delivery_order_details: [...deliveryDetails.delivery_order_details],
        };

        // let unmatched = false;

        // dispatchDetails.sales_order_item_details.map((r, i) => {
        //   const sum_qtys = newData.dispatch_order_item_details.filter(o => o.item_id === r.item_id).reduce((p, c) => p + Number(c.now_dispatch_qty), 0);
        //   if(sum_qtys !== r.quantity)
        //     unmatched = true;
        // });

        // if(!unmatched)
        //   newData.sales_status = statusByName(all_status, "Sales-Order", "D.O. Gen. fully");


        let so_quantity = dispatchDetails.sales_order_item_details.reduce((p, c) => p + Number(c.quantity), 0);
        let sum_disp_qty = newData.dispatch_order_item_details.reduce((p, c) => p + Number(c.now_dispatch_qty), 0);

        if (so_quantity === sum_disp_qty)
          newData.sales_status = statusByName(all_status, "Sales-Order", "D.O. Gen. fully");
      }

      else {
        // console.log("dolaaa2", deliveryDetails.delivery_order_details);
        deliveryDetails.delivery_order_details.filter((o) => o.delivery_order_no === corr_do_no)[0].delivery_status = statusByName(all_status, "Delivery-Order", "Dis.Order Gen.partly");
        newData = {
          ...newData,
          delivery_order_details: [...deliveryDetails.delivery_order_details],
        };
      }


    }

    else if (data.module === "INVOICE") {
      serial_number = await generateSerialNumber(data.module, data.invoice_details.invoice_date);

      const invoiceDetails = await getAllInvoiceDetails(newData.sales_id);
      const dispatchDetails = await getAllDispatchDetails(newData.sales_id);
      // console.log("NDT", invoiceDetails);
      // newData = { ...newData, invoice_no: serial_number };

      for (
        let iCtr = 0;
        iCtr < newData.invoice_item_details.length;
        iCtr++
      ) {
        newData.invoice_item_details[iCtr].invoice_no = serial_number;
        invoiceDetails.invoice_item_details.push(
          newData.invoice_item_details[iCtr]
        );
      }

      for (
        let iCtr = 0;
        iCtr < newData.invoice_other_charges.length;
        iCtr++
      ) {
        newData.invoice_other_charges[iCtr].invoice_no = serial_number;
        invoiceDetails.invoice_other_charges.push(
          newData.invoice_other_charges[iCtr]
        );
      }

      newData.invoice_details['invoice_no'] = serial_number;
      invoiceDetails.invoice_details.push(newData.invoice_details);


      invoiceDetails.invoice_no.push(serial_number);

      newData = {
        ...newData,
        invoice_no: [...invoiceDetails.invoice_no],
      };

      dispatchDetails.dispatch_order_details.filter((o) =>
        o.dispatch_order_no === newData.invoice_details.dispatch_order_no)[0].status = statusByName(all_status, "Dispatch", "Billed");
      newData = {
        ...newData,
        dispatch_order_details: [...dispatchDetails.dispatch_order_details],
        invoice_details: [...invoiceDetails.invoice_details],
      };

      newData = {
        ...newData,
        invoice_item_details: invoiceDetails.invoice_item_details,
        invoice_other_charges: invoiceDetails.invoice_other_charges,
      };

      data.invoice_item_details.map( async(r)=>{
        await itemStock.findOneAndUpdate(
          {
          item_id: r.item_id,
          showroom_warehouse_id: r.showroom_warehouse_id
        },
        {
          $inc:{
            closingStock: - Number(r.now_dispatch_qty)
          }
        }
        )
      })
    }
  }
  

  
  await sales.findOneAndUpdate(condition, newData, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    // console.log(obj);
    return res.status(200).json({
      ...obj.data,
      quotation_no: newData.quotation_no,
      enquiry_no: newData.enquiry_no,
      sales_order_no: newData.sales_order_no,
      delivery_order_no: newData.delivery_order_no,
      dispatch_order_no: newData.dispatch_order_no,
      sales_id: newData.sales_id,
      sales_status: newData.sales_status,
      invoice_no: newData.invoice_no,
      ...newData,
      
    });
  });
};

const deletesales = async (req, res) => {
  const sales_id = req.body.sales_id;
  const condition = { sales_id: sales_id };
  await sales.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};

const view_status = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const status_id = req.body.status_id;
  const status_name = req.body.status;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (status_id) {
    condition = { ...condition, status_id: status_id };
  }

  // Details by Name
  if (status_name) {
    condition = {
      ...condition,
      status_name: { $regex: "^" + status_name + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ status_name: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await status
    .find(condition, (err, statusData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (statusData) {
        let returnDataArr = statusData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { status_id: 1, status: 1, _id: 0 })
    .sort({ status_name: 1 });
};

const updatestatus = async (req, res) => {
  const condition = { status_id: req.body.status_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.status_list,
    data: condition,
  });


  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);



  // const statusDetails = myData.data;
  // data.edit_log = statusDetails;

  await status.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};
const deletestatus = async (req, res) => {
  const status_id = req.body.status_id;
  const condition = { status_id: status_id };
  await status.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};
const view_task_todo = async (req, res) => {
  let condition = { deleted_by_id: 0, active_status: "Y" };
  const task_todo_id = req.body.task_todo_id;
  const module = req.body.module;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  const user_id = req.body.user_id;
  // console.log("1105=>>",user_id)

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (task_todo_id) {
    condition = { ...condition, "task_todo_id": task_todo_id };
  }
  if (user_id) {
    condition = { ...condition, "for_users.value": user_id };
  }
  // // Details by Name
  // if (module) {
  //   condition = {
  //     ...condition,
  //     module: { $regex: "^" + module + "$", $options: "i" },
  //   };
  // } // Matching exact text but incase-sensitive

  // // Search
  // if (searchQuery) {
  //   condition = {
  //     ...condition,
  //     $or: [{ module: { $regex: searchQuery, $options: "i" } }],
  //   }; // Matching string also compare incase-sensitive
  // }

  let todo_data = await task_todo.aggregate([
    { $unwind: "$for_users" },
    {
      // $match: {deleted_by_id: 0 ,"for_users.value" : user_id }
      $match: condition
    },
    {
      $sort: { "date": 1 }
    },
  ])

  if (todo_data) {
    return res.status(200).send(todo_data);
  } else {
    return res.status(200).json([]);
  }
  // await task_todo
  //   .find(condition, (err, task_todoData) => {
  //     if (err) {
  //       return res.status(500).json({ Error: err });
  //     }
  //     if (task_todoData) {
  //       let returnDataArr = task_todoData.map((data) => ({
  //         action_items: actionValues(data.active_status),
  //         ...data["_doc"],
  //       }));
  //       return res.status(200).json(returnDataArr);
  //     } else {
  //       return res.status(200).json([]);
  //     }
  //   })
  //   .select(short_data === true && { task_todo_id: 1, task_todo: 1, _id: 0 });
};
// const view_task_todo = async (req, res) => {
//   let condition = { deleted_by_id: 0 };
//   const task_todo_id = req.body.task_todo_id;
//   const module = req.body.module;
//   const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
//   const searchQuery = req.body.query;
//   const user_id =  req.body.user_id;
//   console.log("1105=>>",user_id)

//   const actionValues = (active_status) => {
//     return {
//       can_edit: true,
//       can_delete: false,
//       can_activate: active_status === "Y" ? false : true,
//       can_deactivate: active_status === "Y" ? true : false,
//     };
//   };

//   // // Details by ID
//   // if (task_todo_id) {
//   //   condition = { ...condition, task_todo_id: task_todo_id };
//   // }

//   // // Details by Name
//   // if (module) {
//   //   condition = {
//   //     ...condition,
//   //     module: { $regex: "^" + module + "$", $options: "i" },
//   //   };
//   // } // Matching exact text but incase-sensitive

//   // // Search
//   // if (searchQuery) {
//   //   condition = {
//   //     ...condition,
//   //     $or: [{ module: { $regex: searchQuery, $options: "i" } }],
//   //   }; // Matching string also compare incase-sensitive
//   // }

//   let todo_data = await task_todo.aggregate([
//     {$unwind: "$for_users"},
//     {
//       $match: {"for_users.value" : user_id }
//     }
//   ])

//   if (todo_data){
//     return res.status(200).send(todo_data);
//   }else{
//     return res.status(200).json([]);
//   }
//   // await task_todo
//   //   .find(condition, (err, task_todoData) => {
//   //     if (err) {
//   //       return res.status(500).json({ Error: err });
//   //     }
//   //     if (task_todoData) {
//   //       let returnDataArr = task_todoData.map((data) => ({
//   //         action_items: actionValues(data.active_status),
//   //         ...data["_doc"],
//   //       }));
//   //       return res.status(200).json(returnDataArr);
//   //     } else {
//   //       return res.status(200).json([]);
//   //     }
//   //   })
//   //   .select(short_data === true && { task_todo_id: 1, task_todo: 1, _id: 0 });
// };

const updatetask_todo = async (req, res) => {
  const condition = { task_todo_id: req.body.task_todo_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");
  // console.log(condition,"dateee")

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.task_todo_list,
    data: condition,
  });

  const task_todoDetails = myData.data;
  data.edit_log = task_todoDetails;



  await task_todo.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};

const view_stock_transfer = async (req, res) => {
  // console.log(req.body.query)
  let condition = { deleted_by_id: 0 };
  const from_showroom_warehouse_id = req.body.from_showroom_warehouse_id;
  const to_showroom_warehouse_id = req.body.to_showroom_warehouse_id;
  const stock_from_date = req.body.stock_transfer_from_date;
  const stock_to_date = req.body.stock_transfer_to_date;
  const stock_transfer_id = req.body.stock_transfer_id;
  const module = req.body.module;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  let all_showrooms_warehouse = await showrooms_warehouse
    .find({}, (err, showrooms_warehouseData) => {
      return showrooms_warehouseData;
    })
    .select({ showrooms_warehouse_id: 1, showrooms_warehouse: 1, _id: 0 });

  const showrooms_warehouseById = (
    all_showrooms_warehouse,
    from_showroom_warehouse_id
  ) => {
    if (from_showroom_warehouse_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_showrooms_warehouse.length; iCtr++) {
      if (
        all_showrooms_warehouse[iCtr]["showrooms_warehouse_id"] ===
        from_showroom_warehouse_id
      )
        return all_showrooms_warehouse[iCtr]["showrooms_warehouse"];
    }
  };

  const showrooms_warehouseByIdTo = (
    all_showrooms_warehouse,
    to_showroom_warehouse_id
  ) => {
    if (to_showroom_warehouse_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_showrooms_warehouse.length; iCtr++) {
      if (
        all_showrooms_warehouse[iCtr]["showrooms_warehouse_id"] ===
        to_showroom_warehouse_id
      )
        return all_showrooms_warehouse[iCtr]["showrooms_warehouse"];
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by From showroomwarehouse

  if (from_showroom_warehouse_id && from_showroom_warehouse_id > 0) {
    condition = {
      ...condition,
      from_showroom_warehouse_id: from_showroom_warehouse_id,
    };
  }

  // Details by From showroomwarehouse
  if (to_showroom_warehouse_id && to_showroom_warehouse_id > 0) {
    condition = {
      ...condition,
      to_showroom_warehouse_id: to_showroom_warehouse_id,
    };
  }

  // Details by ID
  if (stock_transfer_id) {
    condition = { ...condition, stock_transfer_id: stock_transfer_id };
  }

  // Details by Name
  if (module) {
    condition = {
      ...condition,
      module: { $regex: "^" + module + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ module: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }
  // console.log("stockkkkkkkkkkkkk");
  //datefilter
  if (stock_from_date) {
    condition = { ...condition, stock_transfer_date: stock_from_date };
  }

  //datefilter
  if (stock_to_date) {
    condition = { ...condition, stock_transfer_date: stock_to_date };
  }

  //both date filter
  if (stock_from_date && stock_to_date) {
    condition = {
      ...condition,
      stock_transfer_date: { $gte: stock_from_date, $lte: stock_to_date },
    };
  }

  // console.log(condition)
  await stock_transfer
    .find(condition, (err, stock_transferData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (stock_transferData) {
        // console.log(all_showrooms_warehouse);
        let returnDataArr = stock_transferData.map((data) => ({
          stock_transfer_from_name: showrooms_warehouseById(
            all_showrooms_warehouse,
            data.from_showroom_warehouse_id
          ),
          stock_transfer_to_name: showrooms_warehouseByIdTo(
            all_showrooms_warehouse,
            data.to_showroom_warehouse_id
          ),

          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(
      short_data === true && { stock_transfer_id: 1, stock_transfer: 1, _id: 0 }
    );
};

const updatestock_transfer = async (req, res) => {
  const condition = { stock_transfer_id: req.body.stock_transfer_id };
  const data = req.body;
  data.edited_by_id = 10;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.stock_transfer_list,
    data: condition,
  });

  const stock_transferDetails = myData.data;
  data.edit_log = stock_transferDetails;

  await stock_transfer.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};



const view_delivery = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  // console.log(req.body, "rq")

  const sales_id = req.body.sales_id;
  const invoice_no = req.body.invoice_no;
  const source_id = req.body.source_id;



  //FOR DELIVERY_ORDER SEARCH

  const delivery_order_no = req.body.delivery_order_no;
  const sales_order_no = req.body.sales_order_no;
  const quotation_no = req.body.quotation_no;
  const delivery_customer_id = req.body.delivery_customer_id;
  const delivery_status = req.body.delivery_status;
  const delivery_date_from = req.body.delivery_date_from;
  const delivery_date_to = req.body.delivery_date_to;
  const delivery_sales_order_from_date = req.body.delivery_sales_order_from_date;
  const delivery_sales_order_to_date = req.body.delivery_sales_order_to_date;

  let all_customer = await customer
    .find({}, (err, customerData) => {
      return customerData;
    })
    .select({ customer_id: 1, contact_person: 1, company_name:1,gst_no:1, address:1, _id: 0 });

  //console.log("vus", all_customer);

  const customerById = (all_customer, customer_id) => {
    if (customer_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
      if (all_customer[iCtr]["customer_id"] === customer_id)
        return all_customer[iCtr]["address"];
    }
  };

  const customerByIdC = (all_customer, customer_id) => {
    if (customer_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
      if (all_customer[iCtr]["customer_id"] === customer_id)
        return all_customer[iCtr]["company_name"]
    }
  };

  const customerById1 = (all_customer, customer_id) => {
    if (customer_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
      if (all_customer[iCtr]["customer_id"] === customer_id)
        return all_customer[iCtr]["gst_no"];
    }
  };

  let all_item = await item
    .find({}, (err, itemData) => {
      return itemData;
    })
    .select({ item_id: 1, item: 1, _id: 0 });

  const itemById = (all_item, item_id) => {
    if (item_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_item.length; iCtr++) {
      if (all_item[iCtr]["item_id"] === item_id)
        return all_item[iCtr]["item"];
    }
  };

  let all_uom = await uom
    .find({}, (err, uomData) => {
      return uomData;
    })
    .select({ uom_id: 1, higher_unit: 1, lower_unit: 1, caption: 1, lower_caption: 1, lower_unit_value: 1, _id: 0 });

    const uomById = (all_uom, uom_id) => {
      if (uom_id === 0) return { value1: "--", value2: null };
  
      for (let iCtr = 0; iCtr < all_uom.length; iCtr++) {
        if (all_uom[iCtr]["uom_id"] === uom_id)
          return {
            value1: all_uom[iCtr]["lower_unit_value"],
            value2: all_uom[iCtr]["lower_caption"],
          };
      }
    };

  let all_showrooms_warehouse = await showrooms_warehouse
    .find({}, (err, showrooms_warehouseData) => {
      return showrooms_warehouseData;
    })
    .select({ showrooms_warehouse_id: 1, showrooms_warehouse: 1, _id: 0 });

  const showrooms_warehouseById = (
    all_showrooms_warehouse,
    showrooms_warehouse_id
  ) => {
    if (showrooms_warehouse_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_showrooms_warehouse.length; iCtr++) {
      if (
        all_showrooms_warehouse[iCtr]["showrooms_warehouse_id"] ===
        showrooms_warehouse_id
      )
        return all_showrooms_warehouse[iCtr]["showrooms_warehouse"];
    }
  };

  let get_showrooms_from_attributes = (delivery_order_item_details) => {
    // let req_delivery_order_item_details = delivery_order_item_details.filter((o) => o.item_id == row.item_id )
    // let all_quantity_codes = Object.keys(delivery_order_item_details).filter((o) => {
    //   return o.split("_")[1] === delivery_order_item_details.item_id.toString()
    // });
    // let all_showrooms = all_quantity_codes.map((p) => {
    //   return { showroom_name: showrooms_warehouseById(all_showrooms_warehouse, Number(p.split("_")[0])),
    //           quantity: delivery_order_item_details[p] }
    // });
    // console.log(all_showrooms, "ascv");
    // return all_showrooms;
    //console.log("do_det1", delivery_order_item_details);
    let do_sr_details = delivery_order_item_details.map((dor) => {
      let all_quantity_codes = Object.keys(dor).filter((o) => {
        return o.split("_")[1] === dor.item_id.toString()
      });
      return all_quantity_codes.map((p) => {
        return {
          showroom_name: showrooms_warehouseById(all_showrooms_warehouse, Number(p.split("_")[0])),
          quantity: dor[p],
           uom_details: uomById(all_uom, dor.uom_id),
          lower_unit: Math.round(dor[p] / uomById(all_uom, dor.uom_id).value1),
          lower_caption: uomById(all_uom, dor.uom_id).value2,
        }
      });
    });
    return do_sr_details;
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  if (sales_id) {
    condi = { ...condi, sales_id: sales_id };
  }

  if (delivery_order_no) {
    condi = { ...condi, 'delivery_order_details.delivery_order_no': new RegExp(delivery_order_no, 'i') };
  }

  if (sales_order_no) {
    condi = { ...condi, 'sales_order_no': new RegExp(sales_order_no, 'i') };
  }

  if (quotation_no) {
    condi = { ...condi, 'quotation_no': new RegExp(quotation_no, 'i') };
  }

  if (delivery_customer_id) {
    condi = { ...condi, customer_id: delivery_customer_id };
  }

  if (delivery_status) {
    condi = { ...condi, 'delivery_order_details.delivery_status': Number(delivery_status) };
  }

  if (delivery_date_from && delivery_date_to) {
    condi = {
      ...condi,
      'delivery_order_details.delivery_order_date': {
        $gte: delivery_date_from,
        $lte: delivery_date_to,
      },
    };
  }

  if (delivery_sales_order_from_date && delivery_sales_order_to_date) {
    condi = {
      ...condi,
      sales_order_date: {
        $gte: delivery_sales_order_from_date,
        $lte: delivery_sales_order_to_date,
      },
    };
  }

  // console.log("concon", condi);

  //below line doing filter of data , passing condition.
  let salesData = await sales.aggregate([
    // { $unwind: "$sales_order_item_details"},
    { $unwind: "$delivery_order_details" },
    { $unwind: "$enquiry_details" },

    { $match: condi },
    {
      $lookup: {
        from: "users",
        let: {
          sales_executive_id: "$enquiry_details.sales_executive_id",
        },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$user_id", "$$sales_executive_id"] },
            },
          },
        ],
        as: "salesExecutive",
      },
    },
    {
      $addFields: {
        sales_executive_name: { $first: "$salesExecutive.name" },
        sales_phone:{$first:"$salesExecutive.mobile"}

      },
    },
    {
      $unset: [ "salesExecutive",],
    },

    // { $lookup: {
    //   from: "t_100_uoms",
    //   let : { "uom_id": "$sales_order_item_details.uom_id" },
    //   pipeline: [
    //     {
    //       $match:
    //         { $expr:{$eq:["$uom_id", "$$uom_id" ]},},
    //     },
    //     { $project: { "lower_unit_value": 1,"higher_unit_value":1,"_id":0 ,"uom_id":1}},
    //     {$group:
    //       {
    //         _id:"$uom_id",
    //         lower_unit_value:{$first: "$lower_unit_value"}
    //       }

    //   }


    //   ],
    //   as: "uom_details"
    // },},
    // {$addFields:{
    //   // lower_unit_value:{$first:"$uom_details.lower_unit_value"},     

    // }},
    // {$unset:["uom_details"]},
    // {$unset:["uom_details"]},
    {
      $sort: {
        delivery_order_no: -1
      }
    }
  ]);


  if (salesData) {


    let returnDataArr = salesData.map((data) => {
      let req_delivery_order_item_details = data.delivery_order_item_details.filter((o) => o.delivery_no === data.delivery_order_details.delivery_order_no);
      let req_dispatch_order_item_details = data.dispatch_order_item_details.filter((o) => o.delivery_order_no === data.delivery_order_details.delivery_order_no);
      let other_dois = data.delivery_order_item_details.filter((o) => o.delivery_no !== data.delivery_order_details.delivery_order_no);

      return ({
        sales_id: data.sales_id,
        // uom_details:data.uom_details,
        customer_name: customerById(all_customer, data.customer_id)[0]?.txt_name,
        customer_id: data.customer_id,
        mobile: customerById(all_customer, data?.customer_id)[0]?.txt_mobile,
        city: customerById(all_customer, data?.customer_id)[0]?.txt_city,
        state:customerById(all_customer, data?.customer_id)[0]?.ddl_state_label,
        street:customerById(all_customer, data?.customer_id)[0]?.txt_street,
        area:customerById(all_customer, data?.customer_id)[0]?.ddl_area_label,
        pin:customerById(all_customer, data?.customer_id)[0]?.txt_pin,
        police:customerById(all_customer, data?.customer_id)[0]?.txt_police_station,
        street:customerById(all_customer, data?.customer_id)[0]?.txt_street,
        gst_no:customerById1(all_customer,data?.customer_id),
        company_name: customerByIdC(all_customer, data?.customer_id),
        item_name: itemById(all_item, data.delivery_order_item_details.item_id),
        lower_unit_value: data.lower_unit_value,
        sales_order_no: data.sales_order_no,
        sales_order_date: data.sales_order_date,
        quotation_no: data.quotation_no,
        enquiry_no: data.enquiry_no,
        enquiry_details: data.enquiry_details,
        delivery_order_date: data.delivery_order_details.delivery_order_date,
        sales_order_item_details: data.sales_order_item_details,
        delivery_order_no: data.delivery_order_details.delivery_order_no,
        delivery_order_item_details: req_delivery_order_item_details,
        other_dois: other_dois,
        dispatch_order_item_details: req_dispatch_order_item_details,
        delivery_status: data.delivery_order_details.delivery_status,
        sales_executive_name:data.sales_executive_name,
        sales_phone:data.sales_phone,

        showroom_details: get_showrooms_from_attributes(req_delivery_order_item_details),
        action_items: actionValues(data.active_status),
        ...data["_doc"],
      })
    });
    // console.log("sD", returnDataArr.length);


    return res.status(200).json(returnDataArr);
    // return res.status(200).json(salesData);

  } else {
    return res.status(200).json([]);
  }
  //  (err, salesData) => {
  //     if (err) {
  //       return res.status(500).json({ Error: err });
  //     }

  //   })
  //  .select(short_data === true && { sales_id: 1, sales: 1, _id: 0 });
};

///new api//////////

const view_dispatch = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  // console.log(req.body, "rq")

  const sales_id = req.body.sales_id;
  const invoice_no = req.body.invoice_no;
  const source_id = req.body.source_id;



  //FOR DELIVERY_ORDER SEARCH

  const dispatch_order_no = req.body.dispatch_order_no;
  const delivery_order_no = req.body.delivery_order_no;
  const sales_order_no = req.body.sales_order_no;
  const quotation_no = req.body.quotation_no;
  const dispatch_customer_id = req.body.dispatch_customer_id;
  const dispatch_status = req.body.dispatch_status;
  const dispatch_date_from = req.body.dispatch_date_from;
  const dispatch_date_to = req.body.dispatch_date_to;
  const dispatch_delivery_from_date = req.body.dispatch_delivery_sales_order_from_date;
  const dispatch_delivery_to_date = req.body.dispatch_delivery_sales_order_to_date;

  const startCount = req.body.startCount;
  const endCount = req.body.endCount;

  // let all_customer = await customer
  //   .find({}, (err, customerData) => {
  //     return customerData;
  //   })
  //   .select({ customer_id: 1, contact_person: 1, _id: 0 });

  // //console.log("vus", all_customer);

  // const customerById = (all_customer, customer_id) => {
  //   if (customer_id === 0) return "--";
  //   for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
  //     if (all_customer[iCtr]["customer_id"] === customer_id)
  //       return all_customer[iCtr]["contact_person"];
  //   }
  // };

  // let all_vehicle = await vehicle
  //   .find({}, (err, vehicleData) => {
  //     return vehicleData;
  //   })
  //   .select({ vehicle_id: 1, vehicle_no: 1, _id: 0 });

  // console.log("all_vehicleall_vehicle", all_vehicle);
  // const vehicleById = (all_vehicle, vehicle_id) => {
  //   if (vehicle_id === 0) return "--";
  //   for (let iCtr = 0; iCtr < all_vehicle.length; iCtr++) {
  //     if (all_vehicle[iCtr]["vehicle_id"] === vehicle_id)
  //       return all_vehicle[iCtr]["vehicle_no"];
  //   }
  // };

  // let all_item = await item
  //   .find({}, (err, itemData) => {
  //     return itemData;
  //   })
  //   .select({ item_id: 1, item: 1, _id: 0 });

  // const itemById = (all_item, item_id) => {
  //   if (item_id === 0) return "--";
  //   for (let iCtr = 0; iCtr < all_item.length; iCtr++) {
  //     if (all_item[iCtr]["item_id"] === item_id)
  //       return all_item[iCtr]["item"];
  //   }
  // };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  if (sales_id) {
    condi = { ...condi, sales_id: sales_id };
  }

  if (dispatch_order_no) {
    condi = { ...condi, 'dispatch_order_details.dispatch_order_no': new RegExp(dispatch_order_no, 'i') };
  }

  if (delivery_order_no) {
    condi = { ...condi, 'dispatch_order_details.delivery_order_no': new RegExp(delivery_order_no, 'i') };
  }

  if (sales_order_no) {
    condi = { ...condi, 'sales_order_no': new RegExp(sales_order_no, 'i') };
  }

  if (quotation_no) {
    condi = { ...condi, 'quotation_no': new RegExp(quotation_no, 'i') };
  }

  if (dispatch_customer_id) {
    condi = { ...condi, customer_id: dispatch_customer_id };
  }

  if (dispatch_status) {
    condi = { ...condi, 'dispatch_order_details.status': dispatch_status };
  }

  if (dispatch_date_from && dispatch_date_to) {
    condi = {
      ...condi,
      'dispatch_order_details.dispatch_order_date': {
        $gte: dispatch_date_from,
        $lte: dispatch_date_to,
      },
    };
  }

  // console.log("concon", condi);

  //below line doing filter of data , passing condition.
  let salesData = await sales.aggregate([
    { "$unwind": "$dispatch_order_details" },
    { $match: condi },
    ///////customer lookup//////////
    {
      $lookup: {
        from: "t_400_customers",
        let: {
          "customer_id": "$customer_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$customer_id", "$$customer_id"]
              }
            }
          },
          {
            $project: { "company_name": 1, contact_person: 1, "_id": 0 }
          }
        ],
        as: "customer_details"
      }
    },
    {
      $addFields: {
        contact_person: { $first: "$customer_details.contact_person" },
        customer_name: { $first: "$customer_details.company_name" }
      }
    },
    { $unset: ["customer_details"] },
    ///////item lookup//////////

    {
      $lookup: {
        from: "t_100_items",
        let: { "item_id": "$dispatch_order_item_details.item_id" },
        pipeline: [
          {
            $match: {
              $expr:
                { $eq: ["$item_id", "$$item_id"] }
            }
          }, {
            $project: {
              "item": 1, "_id": 0
            }
          }
        ],
        as: "item_details"
      }
    },
    { $addFields: { item_name: { $first: "$item_details.item" } } },
    { $unset: ["item_details"] },
    /////////////vehicle///////////
    { $unwind: "$dispatch_order_details" },
    {
      $lookup: {
        from: "t_000_vehicles",
        let: { "vehicle_id": "$dispatch_order_details.vehicle_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$vehicle_id", "$$vehicle_id"] }, },
          },
          { $project: { "vehicle_no": 1, "_id": 0 } }
        ],
        as: "vehicle_details"
      },
    },
    { $addFields: { vehicle_no: { $first: "$vehicle_details.vehicle_no" } } },
    { $unset: ["vehicle_details"] },


    {
      $sort: {
        dispatch_order_no: -1,
        // customer_name:-1
      }
    },
    // { $skip: startCount },
    // { $limit: endCount }
  ]);

  if (salesData) {
    let returnDataArr = salesData.map(async (data) => {
      let req_dispatch_order_item_details = data.dispatch_order_item_details.filter((o) => o.dispatch_no === data.dispatch_order_details.dispatch_order_no);
      return ({

        sales_id: data.sales_id,
        // vehicle_no: vehicleById(all_vehicle, data.dispatch_order_details.vehicle_id)[0].txt_vehicle,
        vehicle_no: data.vehicle_no,
        // customer_name: customerById(all_customer, data.customer_id)[0].txt_name,
        customer_name: data.customer_name,
        contact_person: data.contact_person,
        // item_name: itemById(all_item, data.dispatch_order_item_details.item_id),
        item_name: data.item_name,
        sales_order_no: data.sales_order_no,
        sales_order_date: data.sales_order_date,
        quotation_no: data.quotation_no,
        enquiry_no: data.enquiry_no,
        enquiry_details: data.enquiry_details[0],
        dispatch_order_date: data.dispatch_order_details.dispatch_order_date,
        sales_order_item_details: data.sales_order_item_details,
        sales_order_other_charges: data.sales_order_other_charges,
        dispatch_order_no: data.dispatch_order_details.dispatch_order_no,
        dispatch_order_details: data.dispatch_order_details,
        dispatch_order_item_details: req_dispatch_order_item_details,
        //dispatch_status: req_dispatch_order_details.dispatch_status,
        //showroom_details: get_showrooms_from_attributes(req_dispatch_order_item_details),
        action_items: actionValues(data.active_status),
        ...data["_doc"],
      })
    });
    // console.log("RETURNNNNdata", returnDataArr.length);



    // const promises = returnDataArr.map(async (item) => {      
    //   return item;
    // });

    const finalResults = await Promise.all(returnDataArr);

    if (finalResults.length > 0) {
      return res.status(200).send(finalResults);
    } else {
      return res.status(200).json([]);
    }

    // return res.status(200).json(returnDataArr);
    // return res.status(200).json(salesData);

  } else {
    return res.status(200).json([]);
  }
};

// const view_dispatch = async (req, res) => {
//   // let condition={deleted_by_id:0};
//   let condi = { deleted_by_id: 0 };
//   console.log(req.body, "rq")

//   const sales_id = req.body.sales_id;
//   const invoice_no = req.body.invoice_no;
//   const source_id = req.body.source_id;



//   //FOR DELIVERY_ORDER SEARCH

//   const dispatch_order_no = req.body.dispatch_order_no;
//   const delivery_order_no = req.body.delivery_order_no;
//   const sales_order_no = req.body.sales_order_no;
//   const quotation_no = req.body.quotation_no;
//   const dispatch_customer_id = req.body.dispatch_customer_id;
//   const dispatch_status = req.body.dispatch_status;
//   const dispatch_date_from = req.body.dispatch_date_from;
//   const dispatch_date_to = req.body.dispatch_date_to;
//   const dispatch_delivery_from_date = req.body.dispatch_delivery_sales_order_from_date;
//   const dispatch_delivery_to_date = req.body.dispatch_delivery_sales_order_to_date;

//   let all_customer = await customer
//     .find({}, (err, customerData) => {
//       return customerData;
//     })
//     .select({ customer_id: 1, contact_person: 1, _id: 0 });

//   //console.log("vus", all_customer);

//   const customerById = (all_customer, customer_id) => {
//     if (customer_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
//       if (all_customer[iCtr]["customer_id"] === customer_id)
//         return all_customer[iCtr]["contact_person"];
//     }
//   };

//   let all_vehicle = await vehicle
//     .find({}, (err, vehicleData) => {
//       return vehicleData;
//     })
//     .select({ vehicle_id: 1, vehicle_no: 1, _id: 0 });

//   console.log("all_vehicleall_vehicle", all_vehicle);
//   const vehicleById = (all_vehicle, vehicle_id) => {
//     if (vehicle_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_vehicle.length; iCtr++) {
//       if (all_vehicle[iCtr]["vehicle_id"] === vehicle_id)
//         return all_vehicle[iCtr]["vehicle_no"];
//     }
//   };

//   let all_item = await item
//     .find({}, (err, itemData) => {
//       return itemData;
//     })
//     .select({ item_id: 1, item: 1, _id: 0 });

//   const itemById = (all_item, item_id) => {
//     if (item_id === 0) return "--";
//     for (let iCtr = 0; iCtr < all_item.length; iCtr++) {
//       if (all_item[iCtr]["item_id"] === item_id)
//         return all_item[iCtr]["item"];
//     }
//   };

//   const actionValues = (active_status) => {
//     return {
//       can_edit: true,
//       can_delete: false,
//       can_activate: active_status === "Y" ? false : true,
//       can_deactivate: active_status === "Y" ? true : false,
//     };
//   };

//   if(sales_id) {
//     condi = { ...condi, sales_id: sales_id };
//   }

//   if (dispatch_order_no) {
//     condi = { ...condi, 'dispatch_order_details.dispatch_order_no': new RegExp(dispatch_order_no, 'i') };
//   }

//   if (delivery_order_no) {
//     condi = { ...condi, 'dispatch_order_details.delivery_order_no': new RegExp(delivery_order_no, 'i') };
//   }

//   if (sales_order_no) {
//     condi = { ...condi, 'sales_order_no': new RegExp(sales_order_no, 'i') };
//   }

//   if (quotation_no) {
//     condi = { ...condi, 'quotation_no': new RegExp(quotation_no, 'i') };
//   }

//   if (dispatch_customer_id) {
//     condi = { ...condi, customer_id: dispatch_customer_id };
//   }

//   if (dispatch_status) {
//     condi = { ...condi, 'dispatch_order_details.status': dispatch_status };
//   }

//   if (dispatch_date_from && dispatch_date_to) {
//     condi = {
//       ...condi,
//       'dispatch_order_details.dispatch_order_date': {
//         $gte: dispatch_date_from,
//         $lte: dispatch_date_to,
//       },
//     };
//   }

//   // if (delivery_sales_order_from_date && delivery_sales_order_to_date) {
//   //   condi = {
//   //     ...condi,
//   //     delivery_order_date: {
//   //       $gte: delivery_sales_order_from_date,
//   //       $lte: delivery_sales_order_to_date,
//   //     },
//   //   };
//   // }

//   console.log("concon", condi);

//   //below line doing filter of data , passing condition.
//   let salesData = await sales.aggregate([
//     { "$unwind": "$dispatch_order_details"},
//     { $match: condi },
//   ]);

//   if (salesData) {


//     let returnDataArr = salesData.map((data) => {
//       let req_dispatch_order_item_details = data.dispatch_order_item_details.filter((o) => o.dispatch_no === data.dispatch_order_details.dispatch_order_no );
//       return ({

//         sales_id: data.sales_id,


//         vehicle_no:vehicleById(all_vehicle, data.dispatch_order_details.vehicle_id)[0].txt_vehicle,

//         customer_name: customerById(all_customer, data.customer_id)[0].txt_name,
//         item_name: itemById(all_item, data.dispatch_order_item_details.item_id),
//         sales_order_no: data.sales_order_no,
//         sales_order_date: data.sales_order_date,
//         quotation_no: data.quotation_no,
//         enquiry_no: data.enquiry_no,
//         enquiry_details: data.enquiry_details[0],
//         dispatch_order_date: data.dispatch_order_details.dispatch_order_date,
//         sales_order_item_details: data.sales_order_item_details,
//         sales_order_other_charges: data.sales_order_other_charges,
//         dispatch_order_no: data.dispatch_order_details.dispatch_order_no,
//         dispatch_order_details: data.dispatch_order_details,
//         dispatch_order_item_details: req_dispatch_order_item_details,
//         //dispatch_status: req_dispatch_order_details.dispatch_status,
//         //showroom_details: get_showrooms_from_attributes(req_dispatch_order_item_details),
//         action_items: actionValues(data.active_status),
//         ...data["_doc"],
//       })
//     });
//     console.log("RETURNNNNdata", returnDataArr.length);


//     return res.status(200).json(returnDataArr);
//   } else {
//     return res.status(200).json([]);
//   }
// };


const view_stock_movement = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const stock_movement_id = req.body.stock_movement_id;
  const module = req.body.module;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  let all_showrooms_warehouse = await showrooms_warehouse
    .find({}, (err, showrooms_warehouseData) => {
      return showrooms_warehouseData;
    })
    .select({ showrooms_warehouse_id: 1, showrooms_warehouse: 1, _id: 0 });
  const showrooms_warehouseById = (
    all_showrooms_warehouse,
    showrooms_warehouse_id
  ) => {
    if (showrooms_warehouse_id === 0) return "--";
    for (let iCtr = 0; iCtr < all_showrooms_warehouse.length; iCtr++) {
      if (
        all_showrooms_warehouse[iCtr]["showrooms_warehouse_id"] ===
        showrooms_warehouse_id
      )
        return all_showrooms_warehouse[iCtr]["showrooms_warehouse"];
    }
  };

  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (stock_movement_id) {
    condition = { ...condition, stock_movement_id: stock_movement_id };
  }

  // Details by Name
  if (module) {
    condition = {
      ...condition,
      module: { $regex: "^" + module + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ module: { $regex: searchQuery, $options: "i" } }],
    }; // Matching string also compare incase-sensitive
  }

  await stock_movement
    .find(condition, (err, stock_movementData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (stock_movementData) {
        let returnDataArr = stock_movementData.map((data) => ({
          showroom_warehouse: showrooms_warehouseById(
            all_showrooms_warehouse,
            data.showroom_warehouse_id
          ),
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(
      short_data === true && { stock_movement_id: 1, stock_movement: 1, _id: 0 }
    );
};


const data_migration = async (req, res) => {

  // console.log("from server", req.body.selectedValue);

  const selectedModule = req.body.selectedValue;
  const selectedExcel = req.body.items;
  const selectedWarehouse = req.body.showroom_warehouse_id;

  const allStates = [
    { value: "andhra", label: "Andhra Pradesh" },
    { value: "arunachal", label: "Arunachal Pradesh" },
    { value: "assam", label: "Assam" },
    { value: "bihar", label: "Bihar" },
    { value: "chhattisgarh", label: "Chhattisgarh" },
    { value: "goa", label: "Goa" },
    { value: "gujarat", label: "Gujarat" },
    { value: "haryana", label: "Haryana" },
    { value: "himachal", label: "Himachal Pradesh" },
    { value: "jharkhand", label: "Jharkhand" },
    { value: "karnataka", label: "Karnataka" },
    { value: "kerala", label: "Kerala" },
    { value: "madhya", label: "Madhya Pradesh" },
    { value: "maharashtra", label: "Maharashtra" },
    { value: "manipur", label: "Manipur" },
    { value: "meghalaya", label: "Meghalaya" },
    { value: "mizoram", label: "Mizoram" },
    { value: "nagaland", label: "Nagaland" },
    { value: "odisha", label: "Odisha" },
    { value: "punjab", label: "Punjab" },
    { value: "rajasthan", label: "Rajasthan" },
    { value: "sikkim", label: "Sikkim" },
    { value: "tamil Nadu", label: "Tamil Nadu" },
    { value: "telangana", label: "Telangana" },
    { value: "tripura", label: "Tripura" },
    { value: "uttar Pradesh", label: "Uttar Pradesh" },
    { value: "uttarakhand", label: "Uttarakhand" },
    { value: "west Bengal", label: "West Bengal" },
  ]



  const ledger_groupByName = async (ledger_group_name) => {

    let all_ledger_group = await ledger_group
      .find({}, (err, ledger_groupData) => {
        return ledger_groupData;
      })
      .select({ ledger_group_id: 1, ledger_group: 1, _id: 0 });

    if (!ledger_group_name || ledger_group_name === '') return 0;
    for (let iCtr = 0; iCtr < all_ledger_group.length; iCtr++) {
      if (all_ledger_group[iCtr]["ledger_group"] === ledger_group_name)
        return all_ledger_group[iCtr]["ledger_group_id"];
    }
  };

  const masterGroupByName = async (master_group_name) => {
    let all_group = await master_group
      .find({}, (err, groupData) => {
        return groupData;
      })
      .select({ master_group_id: 1, group: 1, _id: 0 });



    let master_group_id = 0;
    // console.log("mgname", all_group);
    if (!master_group_name || master_group_name === '') return master_group_id;

    for (let iCtr = 0; iCtr < all_group.length; iCtr++) {
      if (all_group[iCtr]["group"] === master_group_name) {
        master_group_id = all_group[iCtr]["master_group_id"];

        //  console.log("matched ", master_group_id);
        break;
      }

    }

    if (master_group_id === 0) {
      let newMasterGroup = new master_group({
        group: master_group_name,
        vendor_status: "Y",
        customer_status: "Y",
        reference_status: "Y",
        details: "",
      });

      const res = await newMasterGroup.save();
      master_group_id = res.master_group_id;
    }

    return master_group_id;
  };

  const referenceByName = async (reference_type_name) => {
    let all_reference = await reference
      .find({}, (err, referenceData) => {
        return referenceData;
      })
      .select({ reference_id: 1, name: 1, _id: 0 });

    let reference_type_id = 0;
    if (!reference_type_name || reference_type_name === '') return reference_type_id;

    for (let iCtr = 0; iCtr < all_reference.length; iCtr++) {
      if (all_reference[iCtr]["name"] === reference_type_name)
        reference_type_id = all_reference[iCtr]["reference_id"];
    }

    if (reference_type_id === 0) {
      let newRefr = new reference({
        name: reference_type_name,
        mobile: "NIL",
        email: "NIL",
        whatsapp: "NIL",
      });

      const res = await newRefr.save();
      reference_type_id = res.reference_id;
    }

    // console.log("sadfe", reference_type_id);
    return reference_type_id;
  };

  //Group By UOM As
  const uomByName = async (uom_unit, alt_uom_unit) => {

    let all_uom = await uom
      .find({}, (err, uomData) => {
        return uomData;
      })
      .select({ uom_id: 1, higher_unit: 1, lower_unit: 1, _id: 0 });


    let uom_id = 0;
    if (!uom_unit || uom_unit === '') return uom_id;

    for (let iCtr = 0; iCtr < all_uom.length; iCtr++) {
      if (all_uom[iCtr]["higher_unit"] === uom_unit && all_uom[iCtr]["lower_unit"] === alt_uom_unit)
        uom_id = all_uom[iCtr]["uom_id"];
    }

    if (uom_id === 0) {
      let newUom = new uom({
        higher_unit: uom_unit,
        lower_unit: alt_uom_unit,
        higher_unit_value: 1,
        lower_unit_value: 1,
        caption: uom_unit,
        lower_caption: alt_uom_unit,
      });

      const res = await newUom.save();
      uom_id = res.uom_id;
    }

    return uom_id;
  };

  //Get id by Ledger Name
  const ledger_accountByName = async (ledger_account_name, ledger_group_name) => {

    let all_ledger_account = await ledger_account
      .find({}, (err, ledger_accountData) => {
        return ledger_accountData;
      })
      .select({ ledger_account_id: 1, ledger_account: 1, _id: 0 });

    let ledger_account_id = 0;
    if (!ledger_account_name || ledger_account_name === '') return ledger_account_id;

    for (let iCtr = 0; iCtr < all_ledger_account.length; iCtr++) {
      if (all_ledger_account[iCtr]["ledger_account"] === ledger_account_name)
        ledger_account_id = all_ledger_account[iCtr]["ledger_account_id"];
    }

    if (ledger_account_id === 0) {
      let newLedgerAccount = new ledger_account({
        ledger_group_id: await ledger_groupByName(ledger_group_name),
        opening_balance: 0,
        dr_cr_status: "Dr",
        credit_limit: 0,
        ledger_account: ledger_account_name,
        alias: ledger_account_name,
        as_on_date: moment().format("X"),
      });

      const res = await newLedgerAccount.save();
      ledger_account_id = res.ledger_account_id;
    }

    return ledger_account_id;
  };

  //Grouping By Brand Name As

  const brandByName = async (brand_name) => {
    let all_brands = await brand
      .find({}, (err, brandData) => {
        return brandData;
      })
      .select({ brand_id: 1, brand: 1, _id: 0 });
    // console.log(all_brands,"all_brands7")


    let brand_id = 0;
    if (!brand_name || brand_name === '') return brand_id;

    for (let iCtr = 0; iCtr < all_brands.length; iCtr++) {

      if (all_brands[iCtr]["brand"] === brand_name)

        brand_id = all_brands[iCtr]["brand_id"];
    }

    // console.log(brand_name,"all_brands8")
    if (brand_id === 0) {
      let newBrand = new brand({
        brand: brand_name,
        parent_brand_id: 0,
        details: "",
      });

      const res = await newBrand.save();
      brand_id = res.brand_id;
    }

    return brand_id;
  };


  //Grouping Category As
  const categoryByName = async (category_name) => {

    let all_categories = await category
      .find({}, (err, categoriesData) => {
        return categoriesData;
      })
      .select({ category_id: 1, category: 1, _id: 0 })
      .sort({ category_name: 1 });


    let category_id = 0;
    if (!category_name || category_name === '') return category_id;

    for (let iCtr = 0; iCtr < all_categories.length; iCtr++) {
      if (all_categories[iCtr]["category"] === category_name)
        category_id = all_categories[iCtr]["category_id"];
    }

    if (category_id === 0) {
      let newCategory = new category({
        category: category_name,
        parent_category_id: 0,
        details: "",
      });

      const res = await newCategory.save();
      category_id = res.category_id;
    }

    return category_id;
  };

  let all_areas = await area
    .find({}, (err, areaData) => {
      return areaData;
    })
    .select({ area_id: 1, area: 1, _id: 0 })
    .sort({ area: 1 });

  const areaByName = async (all_areas, area_name) => {
    let area_id = 0;
    if (!area_name || area_name === '') return area_id;
    for (let iCtr = 0; iCtr < all_areas.length; iCtr++) {
      if (all_areas[iCtr]["area"] === area_name)
        area_id = all_areas[iCtr]["area_id"];
    }

    if (area_id === 0) {
      let newArea = new area({
        area: area_name,
      });

      const res = await newArea.save();
      area_id = res.area_id;
    }

    return area_id;
  };

  let all_banks = await bank
    .find({}, (err, bankData) => {
      return bankData;
    })
    .select({ bank_id: 1, bank_name: 1, _id: 0 })
    .sort({ bank_name: 1 });

  const bankByName = async (all_banks, bank_name) => {
    let bank_id = 0;
    if (!bank_name || bank_name === '') return 0;

    for (let iCtr = 0; iCtr < all_banks.length; iCtr++) {
      if (all_banks[iCtr]["bank_name"] === bank_name)
        bank_id = all_banks[iCtr]["bank_id"];
    }

    if (bank_id === 0) {
      let newBank = new reference({
        name: bank_name,
        details: "",
      });

      const res = await newBank.save();
      bank_id = res.bank_id;
    }

    return bank_id;
  };

  const itemByName = async (item_name) => {
    let all_item = await item
      .find({}, (err, itemData) => {
        return itemData;
      });

    if (item_name === '') return "--";
    for (let iCtr = 0; iCtr < all_item.length; iCtr++) {
      if (all_item[iCtr]["item"] === item_name)
        return all_item[iCtr];
    }
  };

  const toTitleCase = (str) => {
    if (str) {
      return str.replace(
        /\w\S*/g,
        function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
      );
    }

    else {
      return "";
    }

  }

  //Vendor
  if (selectedModule === 1) {
    for (let i = 0; i < selectedExcel.length; i++) {
      // console.log("nana", selectedExcel[i]);
      let newMigrationDetail = new vendor({
        group_id: await masterGroupByName(selectedExcel[i].group),
        reference_id: await referenceByName(selectedExcel[i].reference),
        company_name: toTitleCase(selectedExcel[i].company_name),
        gst_no: selectedExcel[i].gst_no,
        website: selectedExcel[i].website,
        opening_balance: selectedExcel[i].opening_balance,
        dr_cr: selectedExcel[i].dr_cr_status,
        contact_person: [
          {
            txt_name: selectedExcel[i].company_name
          }
        ]
      });
      let cus = await newMigrationDetail.save();

      let newLedgerAccountDetails = new ledger_account({
        ledger_group_id: await ledger_groupByName("Sundry Creditors"),
        opening_balance: selectedExcel[i].opening_balance,
        dr_cr_status: selectedExcel[i].dr_cr_status,
        credit_limit: 0,
        ledger_account: toTitleCase(selectedExcel[i].company_name),
        alias: selectedExcel[i].company_name,
        as_on_date: moment().format("X"),
      });
      cus = await newLedgerAccountDetails.save();
      // console.log("from server", i, selectedExcel[i]);
    }
    res.send(200);
  }
  //customer
  else if (selectedModule === 2) {
    for (let i = 0; i < selectedExcel.length; i++) {
      let newMigrationDetail = new customer({
        group_id: await masterGroupByName(selectedExcel[i].group),
        reference_id: await referenceByName(selectedExcel[i].reference),
        company_name: toTitleCase(selectedExcel[i].company_name),
        gst_no: selectedExcel[i].gst_no,
        website: selectedExcel[i].website,
        opening_balance: selectedExcel[i].opening_balance,
        dr_cr: selectedExcel[i].dr_cr_status,
        contact_person: [
          {
            txt_name: toTitleCase(selectedExcel[i].company_name),
            txt_email: selectedExcel[i].email,
            txt_mobile: selectedExcel[i].mobile,
            txt_whatsapp: selectedExcel[i].mobile,
          }
        ]
      });
      let cus = await newMigrationDetail.save();

      let newLedgerAccountDetails = new ledger_account({
        ledger_group_id: await ledger_groupByName("Sundry Debtors"),
        opening_balance: selectedExcel[i].opening_balance,
        dr_cr_status: selectedExcel[i].dr_cr_status,
        credit_limit: 0,
        ledger_account: toTitleCase(selectedExcel[i].company_name),
        alias: selectedExcel[i].company_name,
        as_on_date: moment().format("X"),
      });
      cus = await newLedgerAccountDetails.save();
      // console.log("from server", i, selectedExcel[i]);
    }
    res.send(200);
  }
  //items
  else if (selectedModule === 3) {
    for (let i = 0; i < selectedExcel.length; i++) {
      let uom_id = await uomByName(selectedExcel[i].uom, selectedExcel[i].alt_uom);
      //let uom_id = await uomByName(selectedExcel[i].uom, selectedExcel[i].alt_uom);
      let newMigrationDetail = new item({
        brand_id: await brandByName(selectedExcel[i].brand),
        category_id: await categoryByName(selectedExcel[i].category),
        ledger_account_id: await ledger_accountByName(selectedExcel[i].ledger_account, "Purchase"),
        uom_id: uom_id,
        alt_uom_id: uom_id,
        item_own_code: selectedExcel[i].item_own_code,
        item_company_code: selectedExcel[i].item_company_code,
        item: selectedExcel[i].item,
        size: selectedExcel[i].size,
        details: selectedExcel[i].details,
        hsn_code: selectedExcel[i].hsn_code,
        igst_percentage: selectedExcel[i].gst_percentage ? Number(selectedExcel[i].gst_percentage) : 0,
        sgst_percentage: selectedExcel[i].gst_percentage ? Number(selectedExcel[i].gst_percentage) / 2 : 0,
        cgst_percentage: selectedExcel[i].gst_percentage ? Number(selectedExcel[i].gst_percentage) / 2 : 0,
        reorder_level: selectedExcel[i].reorder_level,
        reorder_level_uom_id: uom_id,
        reorder_quantity: selectedExcel[i].reorder_quantity,
        reorder_quantity_uom_id: uom_id,
        opening_stock: selectedExcel[i].opening_stock,
        opening_stock_uom_id: uom_id,
        opening_stock_date: moment().format("X"),
        selling_price: selectedExcel[i].selling_price,
        selling_date: moment().format("X"),
        mrp: selectedExcel[i].mrp,
        mrp_date: moment().format("X"),
        picture_path: selectedExcel[i].picture_path,
        original_file_name: selectedExcel[i].original_file_name,
        qty: selectedExcel[i].qty,
      });
      let cus = await newMigrationDetail.save();
    }
    res.send(200);
  }

  // stocks
  else if (selectedModule === 4) {
    //  console.log("sel-length", selectedExcel.length);
    for (let i = 0; i < selectedExcel.length; i++) {
      let itma = await itemByName(selectedExcel[i]["item_name"]);
      //console.log("datam", itma);

      if (itma) {
        let condition = { item_id: itma.item_id };
        let new_stock_by_location = [
          {
            showroom_warehouse_id: selectedWarehouse,
            quantity: selectedExcel[i]["quantity"],
            rate: selectedExcel[i]["rate"],
            value: selectedExcel[i]["quantity"] * selectedExcel[i]["rate"],
            date: new Date().toISOString().slice(0, 10),
          }
        ];

        let newData = itma;
        newData.stock_by_location = [...itma.stock_by_location, ...new_stock_by_location];
        delete itma["edit_log"];
        // console.log("itma stocka", i);

        await item.findOneAndUpdate(condition, newData, (err, obj) => {
          if (err) {
            return res.status(500).json({ Error: err });
          }

          else {
            return res.status(200);
          }
        });
      }
    }
    res.send(200);
  }

  //////new.////
  //Update Stock
  else if (selectedModule === 5) {

    let updated_items = []

    for (let i = 0; i < selectedExcel.length; i++) {
      // let uom_id = await uomByName(selectedExcel[i].uom, selectedExcel[i].alt_uom);
      const myData = await axios({
        method: "post",
        url: apiURL + apiList.item_list,
        data: { item_own_code: selectedExcel[i].item_own_code },
      });
      const item_details = myData.data;
      req.body.items.edit_log = item_details;
      const condition = { item_own_code: selectedExcel[i].item_own_code }
      selectedExcel[i],


        selectedExcel.map((a, b) => {
          updated_items.push({
            ...a,
            mrp_date: moment().format("x")
          })
        })
      //console.log("sen=>",updated_items)


      await item.findOneAndUpdate(
        condition,
        // selectedExcel[i],
        updated_items[i],
        (err, obj) => {
          // console.log("sen2106=>s",selectedExcel[i])
          if (err) {
            return res.status(500).json({ Error: err });
          }
          // return res.status(200).json(obj);


        }
      )
    }
    return res.send(200);
  }
  // //Update item prices
  // else if (selectedModule === 5) {


  //   for (let i = 0; i < selectedExcel.length; i++) {
  //     // let uom_id = await uomByName(selectedExcel[i].uom, selectedExcel[i].alt_uom);

  //     const myData = await axios({
  //       method: "post",
  //       url: apiURL + apiList.item_list,
  //       data: {item_own_code:selectedExcel[i].item_own_code},
  //     });
  //     const item_details = myData.data;
  //     req.body.items.edit_log=item_details;
  //     const condition = {item_own_code:selectedExcel[i].item_own_code}
  //     await item.findOneAndUpdate(
  //       condition,
  //       selectedExcel[i],
  //       (err,obj)=>{
  //         // console.log("sen2106=>s",selectedExcel[i])
  //         if (err) {
  //           return res.status(500).json({ Error: err });
  //         }
  //         // return res.status(200).json(obj);


  //       }
  //       )
  //   }
  //  return res.send(200);
  // }
};

const itemPriceUpdate = (req, res) => {
  const selectedExcel = req.body.items;

  let up = []
  //new
 let a = selectedExcel.map(async (r, i) =>{

    await item.findOneAndUpdate(
      {
        item_id: r.item_id
      },
      {
        $set: { mrp: r.mrp }
      },
      {
        new: true
      },
      (error, r) => {
        if (error) {
          return [];
        }
        else {
          return r
        }
      }
    )
  })

    return res.status(200).json(a)

  // console.log(a)

  // return res.status(200).json(a)
  //old
  // for (let i = 0; i < selectedExcel.length; i++) {
  //   // let uom_id = await uomByName(selectedExcel[i].uom, selectedExcel[i].alt_uom);
  //   const myData = await axios({
  //     method: "post",
  //     url: apiURL + apiList.item_list,
  //     data: { item_id: selectedExcel[i].item_id },
  //   });
  //   const item_details = myData.data;
  //   req.body.items.edit_log = item_details;
  //   const condition = { item_id: selectedExcel[i].item_id }
  //   selectedExcel[i],


  //     selectedExcel.map((a, b) => {
  //       updated_items.push({
  //         ...a,
  //         mrp_date: moment().format("x")
  //       })
  //     })
  //   //console.log("sen=>",updated_items)


  //   await item.findOneAndUpdate(
  //     condition,
  //     // selectedExcel[i],
  //     updated_items[i],
  //     (err, obj) => {
  //       // console.log("sen2106=>s",selectedExcel[i])
  //       if (err) {
  //         return res.status(500).json({ Error: err });
  //       }
  //       // return res.status(200).json(obj);


  //     }
  //   )
  // }
  // return res.send(200);
}


const view_menu = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const menu_id = req.body.menu_id;

  const parent_menu = req.body.parent_menu;
  const sub_menu = req.body.sub_menu;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  const status_name = req.body.status;
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: false,
      can_activate: active_status === "Y" ? false : true,
      can_deactivate: active_status === "Y" ? true : false,
    };
  };

  // Details by ID
  if (menu_id) {
    condition = { ...condition, menu_id: menu_id };
  }

  if (parent_menu) {
    condition = { ...condition, parent_id: parent_menu };
  }
  if (sub_menu) {
    condition = { ...condition, subMenu_name: sub_menu };
  }


  // Details by Name
  if (status_name) {
    condition = {
      ...condition,
      active_status: { $regex: "^" + status_name + "$", $options: "i" },
    };
  }

  // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ status_name: { $regex: searchQuery, $options: "i" } }],
    };

  }

  await menu
    .find(condition, (err, statusData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (statusData) {
        let returnDataArr = statusData.map((data) => ({
          action_items: actionValues(data.active_status),
          ...data["_doc"],
        }));
        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(short_data === true && { menu_id: 1, menu: 1, _id: 0 })
    .sort({ menu_name: 1 });
};

const updatemenu = async (req, res) => {
  const condition = { menu_id: req.body.menu_id };
  const data = req.body;
  data.edited_by_id = 0;
  data.edit_by_date = moment().format("X");

  const myData = await axios({
    method: "post",
    url: apiURL + apiList.menu_list,
    data: condition,
  });
  // const menuDetails = myData.data;
  // data.edit_log = menuDetails;

  const changed = trackChange(myData.data[0], req.body)
  data.edit_log = ([JSON.stringify(changed), ...myData.data[0].edit_log]);



  await menu.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ Error: err });
    }
    return res.status(200).json(obj);
  });
};



const deletemenu = async (req, res) => {
  const menu_id = req.body.menu_id;
  const condition = { menu_id: menu_id };
  await menu.deleteOne(condition, (err, obj) => {
    return res.status(200).json(obj);
  });
};


// view_deliver_view

// const view_return_delivery_view = async (req, res) => {
//   let condi = { deleted_by_id: 0 };
//   const return_delivery_id = req.body.return_delivery_id;
//   // const customer_id = req.body.customer_id;
//   // const customer_name = req.body.customer;
//   // const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only

//   // const searchQuery = req.body.keyword_pharse;
//   // const group_id = req.body.group_id;

//   // console.log("hahahahahahaha",req.body)

//   // let all_group = await master_group
//   //   .find({}, (err, groupData) => {
//   //     return groupData;
//   //   })
//   //   .select({ master_group_id: 1, group: 1, _id: 0 });
//   // const groupById = (all_group, group_id) => {
//   //   if (group_id === 0) return "--";
//   //   for (let iCtr = 0; iCtr < all_group.length; iCtr++) {
//   //     if (all_group[iCtr]["master_group_id"] === group_id)
//   //       return all_group[iCtr]["group"];
//   //   }
//   // };

//   // let all_reference = await reference
//   //   .find({}, (err, referenceData) => {
//   //     return referenceData;
//   //   })
//   //   .select({ reference_id: 1, name: 1, _id: 0 });
//   // const referenceById = (all_reference, reference_type_id) => {
//   //   if (reference_type_id === 0) return "--";
//   //   for (let iCtr = 0; iCtr < all_reference.length; iCtr++) {
//   //     if (all_reference[iCtr]["reference_id"] === reference_type_id)
//   //       return all_reference[iCtr]["name"];
//   //   }
//   // };


//   if(return_delivery_id) {
//     condi = { ...condi, "sales_return_id": return_delivery_id };
//   }

//   console.log(condi,"sank406")

// const view_return_delivery_view=await sales_return.aggregate([

// {
//   $match:condi
// },
// {
//   $lookup:{
//     from:"t_900_sales", 
//     let : {"sales_id":"$sales_id"},
//     pipeline:[
//       {$match:{$expr:{$eq:["$$sales_id", "$sales_id"]}}},
//       {$project:{ "invoice_item_details.now_dispatch_qty":1,
//                   "invoice_item_details.net_value":1,
//                   "invoice_details.name":1,
//                   "invoice_date":1,


//                   "_id":0,}}
//     ],
//     as:'group_data',
//   },
// },
// {"$unwind": "$group_data"},
// {$addFields:{dispatch_qty:{$sum:"$group_data.invoice_item_details.now_dispatch_qty",}}},
// {$addFields:{dispatch_invoice_value:{$sum:"$group_data.invoice_item_details.net_value"}}},
// {$addFields:{dispatch_name:{$first:"$group_data.invoice_details.name"}}},
// {$addFields:{dispatch_value:{$sum:"$group_data.invoice_date"}}},

// {$unset:["group_data"]},

// //For Reference
// // {
// //   $lookup:{
// //     from:"t_300_references", 
// //     let : {"reference_id":"$reference_id"},
// //     pipeline:[
// //       {$match:{$expr:{$eq:["$reference_id", "$$reference_id"]}}},
// //       {$project:{"name":1,"_id":0}}
// //     ],
// //     as:'reference_data',
// //   },



// // },
// // {$addFields:{reference_name:{$first:"$reference_data.name"}}},
// // {$unset:["reference_data"]},

// // {$addFields:{action_items:{

// //   can_edit: true,
// //   can_delete: false,
// //   can_view: true,
// //   can_activate: "$active_status" === "Y" ? false : true,
// //   can_deactivate: "$active_status" === "Y" ? true : false,

// // }}},

// {
//   $project:
//   {
// "sales_return_item_details.item_id":1,
// "sales_return_item_details.return_qty":1,
// "sales_return_item_details.mrp":1,
// "sales_return_item_details.rate":1, 
// "sales_return_item_details.gst_percentage":1, 
// "sales_return_bill_value":1,
// "showroom_warehouse_id":1,
// "sales_return_date":1,
// "sales_return_no":1,
// "invoice_no":1,
// "dispatch_qty":1,
// "sales_return_item_details.net_value":1,
// "dispatch_name":1,
// "dispatch_date":1, 
// "dispatch_invoice_value" :1,
// "dispatch_value":1,
// "dispatch_date":1 ,
// "invoice_date" :1

//   }
// }



// ])

// if (view_return_delivery_view) 
// {



//           return res.status(200).json(view_return_delivery_view);
//                 } else {
//                   return res.status(200).json([]);
//                 }
// };


//updated
const view_return_delivery_view = async (req, res) => {
  let condi = { deleted_by_id: 0 };
  const return_delivery_id = req.body.return_delivery_id;
  // const customer_id = req.body.customer_id;
  // const customer_name = req.body.customer;
  // const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only

  // const searchQuery = req.body.keyword_pharse;
  // const group_id = req.body.group_id;

  // console.log("hahahahahahaha",req.body)

  // let all_group = await master_group
  //   .find({}, (err, groupData) => {
  //     return groupData;
  //   })
  //   .select({ master_group_id: 1, group: 1, _id: 0 });
  // const groupById = (all_group, group_id) => {
  //   if (group_id === 0) return "--";
  //   for (let iCtr = 0; iCtr < all_group.length; iCtr++) {
  //     if (all_group[iCtr]["master_group_id"] === group_id)
  //       return all_group[iCtr]["group"];
  //   }
  // };

  // let all_reference = await reference
  //   .find({}, (err, referenceData) => {
  //     return referenceData;
  //   })
  //   .select({ reference_id: 1, name: 1, _id: 0 });
  // const referenceById = (all_reference, reference_type_id) => {
  //   if (reference_type_id === 0) return "--";
  //   for (let iCtr = 0; iCtr < all_reference.length; iCtr++) {
  //     if (all_reference[iCtr]["reference_id"] === reference_type_id)
  //       return all_reference[iCtr]["name"];
  //   }
  // };


  if (return_delivery_id) {
    condi = { ...condi, "sales_return_id": return_delivery_id };
  }

  // console.log(condi,"sank406")

  const view_return_delivery_view = await sales_return.aggregate([

    {
      $match: condi
    },
    {
      $lookup: {
        from: "t_900_sales",
        let: { "sales_id": "$sales_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$sales_id", "$sales_id"] } } },
          {
            $project: {
              "invoice_item_details.now_dispatch_qty": 1,
              "invoice_item_details.net_value": 1,
              "invoice_details.name": 1,
              "invoice_date": 1,
              "sales_order_item_details.quantity": 1,

              "_id": 0,
            }
          }
        ],
        as: 'group_data',
      },
    },
    { "$unwind": "$group_data" },
    { $addFields: { dispatch_qty: { $sum: "$group_data.invoice_item_details.now_dispatch_qty", } } },
    { $addFields: { dispatch_invoice_value: { $sum: "$group_data.invoice_item_details.net_value" } } },
    { $addFields: { dispatch_name: { $first: "$group_data.invoice_details.name" } } },
    { $addFields: { dispatch_value: { $sum: "$group_data.invoice_date" } } },
    { $addFields: { invoice_qty: { $sum: "$group_data.sales_order_item_details.quantity", } } },
    { $unset: ["group_data"] },

    //For Reference
    // {
    //   $lookup:{
    //     from:"t_300_references", 
    //     let : {"reference_id":"$reference_id"},
    //     pipeline:[
    //       {$match:{$expr:{$eq:["$reference_id", "$$reference_id"]}}},
    //       {$project:{"name":1,"_id":0}}
    //     ],
    //     as:'reference_data',
    //   },



    // },
    // {$addFields:{reference_name:{$first:"$reference_data.name"}}},
    // {$unset:["reference_data"]},

    // {$addFields:{action_items:{

    //   can_edit: true,
    //   can_delete: false,
    //   can_view: true,
    //   can_activate: "$active_status" === "Y" ? false : true,
    //   can_deactivate: "$active_status" === "Y" ? true : false,

    // }}},

    {
      $project:
      {
        "sales_return_item_details.item_id": 1,
        "sales_return_item_details.return_qty": 1,
        "sales_return_item_details.mrp": 1,
        "sales_return_item_details.rate": 1,
        "sales_return_item_details.gst_percentage": 1,
        "sales_return_bill_value": 1,
        "showroom_warehouse_id": 1,
        "sales_return_date": 1,
        "sales_return_no": 1,
        "invoice_no": 1,
        "dispatch_qty": 1,
        "sales_return_item_details.net_value": 1,
        "dispatch_name": 1,
        "dispatch_date": 1,
        "dispatch_invoice_value": 1,
        "dispatch_value": 1,
        "dispatch_date": 1,
        "invoice_date": 1,
        "invoice_qty": 1,
        "dispatch_return_item_details.balanceQty": 1,

      }
    }



  ])

  if (view_return_delivery_view) {



    return res.status(200).json(view_return_delivery_view);
  } else {
    return res.status(200).json([]);
  }
};



const view_waste = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const waste_id = req.body.waste_id;
  const waste_item_id = req.body.waste_item_id;
  const waste_item_name = req.body.
  waste_item_name;

 
  


  if (waste_item_name) {
    condition = {
      ...condition,      
       waste_item_name: { $regex: waste_item_name, $options: "i" },
    };
  }
  
  if (waste_id) {
    condition = { ...condition, waste_id: waste_id };
  }
  if (waste_item_id) {
    condition = { ...condition, waste_item_id: waste_item_id };
  }


  let wasteData = await waste.aggregate([
    {
      $match: condition
    },
    {
      $lookup: {
        from: "t_100_items",
        let: { "item_id": "$waste_item_id" },
        pipeline: [
          {
            $match: {
              $expr:
                { $eq: ["$item_id", "$$item_id"] }
            }
          }, 
        ],
        as: "item_details"
      }
    },
    { $addFields: { item_name: { $first: "$item_details.item" } } },
   {$addFields:{waste_date:"$inserted_by_date"}},
    

    {
      $project: {

       "item_name":1,
        "uom_name":1,        
        "quantity":1,
        "wasteType":1,
        "convertedQty":1,
        "convertedTo":1,
        waste_date:1,
        waste_item_name:1,


      },
    },

   
  ]);

  if (wasteData) {
    return res.status(200).json(wasteData);
  } else {
    return res.status(200).json([]);
  }
};



//Trialbalance//

const view_trialBalance = async (req, res) => {
  let condition = {};
  const ledgerId = req.body.ledgerId;
  const ledger_account_name = req.body.ledger_account;
  const ledgerGroupIdArray = req.body.ledgerGroupIdArray;
  const ledgerGroupId = req.body.ledgerGroupId;

  // const ledgerId = 43;

 

 
  


  // if (ledger_account_name) {
  //   condition = {
  //     ...condition,      
  //     ledger_account_name: { $regex: ledger_account_name, $options: "i" },
  //   };
  // }
  if (ledgerId) {
    condition = { ...condition, ledgerId: ledgerId };
  }
  
  // if (ledgerIdArray) {
  //   condition = { ...condition, ledgerId: {$in:ledgerIdArray} };
  // }
  if (ledgerGroupIdArray) {
    condition = { ...condition, ledgerGroupId: {$in:ledgerGroupIdArray} };
  }
  if (ledgerGroupId) {
    condition = { ...condition, ledgerGroupId: ledgerGroupId };
  }
// console.log(condition)

  let trialBalanceData = await storage.aggregate([
   
{
  $match: condition
 
},

    {
      $project: {

       "ledgerId":1,
        "ledgerGroupId":1,        
        "ledgerName":1,
        "openCrDrStatus":1,
        "closeCrDrStatus":1,
        "openingBalance":1,
        closingBalance:1,
        


      },
    },
{
  $group:{
    _id:'$ledgerId',
    ledgerId:{$first:'$ledgerId'},
    openCrDrStatus:{$first:'$openCrDrStatus'},
    closeCrDrStatus:{$first:'$closeCrDrStatus'},
    openingBalance:{$first:"$openingBalance"},
    ledgerName:{$first:'$ledgerName'},
    closingBalance:{$first:'$closingBalance'},
    

  } 
},
{$sort: {ledgerName:1}}
   
  ]);

  if (trialBalanceData) {
    return res.status(200).json(trialBalanceData);
  } else {
    return res.status(200).json([]);
  }
};


const view_trialBalanceSundayCredit = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const vendor_id = req.body.vendor_id;
  // const txt_to_date = req.body.txt_to_date;
  const txt_to_date = moment().unix();
  const txt_from_date = req.body.txt_from_date;
  // For date search PURCHASE
  // if (from_date) {
  //   condition = { ...condition, 'grn_details.bill_date': from_date };
  // }
  // if (to_date) {
  //   condition = { ...condition, 'grn_details.bill_date': to_date };
  // }
  // //both date filter
  // if (from_date && to_date) {
  //   condition = { ...condition, 'grn_details.bill_date': { '$gte': (from_date), '$lte': (to_date) } };
  // }
  if (vendor_id) {
    condition = { ...condition, vendor_id: vendor_id };
  }

  let PurchaseData = await vendor.aggregate([
    { $match: condition },
    {
      $project: {
        vendor_id: 1,
        company_name: 1,
      },
    },
       {
      $lookup: {
        from: "t_800_purchases",
        let: { vendor_id: "$vendor_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ["$approve_id", 0] },
                  { $eq: ["$vendor_id", "$$vendor_id"] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              vendor_id: 1,
              grn_no:1,
              purchase_value: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {$toDouble:{ $sum: "$item_details.net_value" }},
                  else: {$toDouble:{ $sum: "$received_item_details.net_value" }},
                },
              },
            },
          },
          {
            $group: {
              _id: "$vendor_id",
              sumPurchase_value: { $sum:"$purchase_value" },
            },
          },
        ],
        as: "purchase_details",
      },
    },

    { $addFields: { sumPurchase_value: "$purchase_details.sumPurchase_value"}},
    {
      $lookup: {
        from: "t_200_ledger_accounts",
        let: { "type_id": "$vendor_id", "ledger_account": "$company_name" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and:[
                  { $eq: ["$deleted_by_id", 0] },
                  {
                    $or: [
                      { $eq: ["$type_id", "$$type_id"] },
                      { $eq: ["$ledger_account", "$$ledger_account"] },
                    ],
                  }
                ]
              },
            },
          },
          {
            $project: {
              _id: 0,
              ledger_account_id: 1,
              ledger_account: 1,
              opening_balance: 1,
              dr_cr_status: 1,
              ledger_group_id:1

            },
          },
        ],
        as: "ledger_account_details",
      },
    },
    {
      $unwind: {
        path: "$ledger_account_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    // // /////////////////////////////////////////////////////////////////
    {
      $addFields: {
        ledger_acc_id: "$ledger_account_details.ledger_account_id",
        ledger_group_id:"$ledger_account_details.ledger_group_id"
      },
    },
    {
      $lookup: {
        from: "t_200_journals",
        let: { ledger_account_id: "$ledger_acc_id" },
        pipeline: [
          { $unwind: "$journal_details" },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      "$$ledger_account_id",
                      "$journal_details.ddl_ledger_id",
                    ],
                  },
                  { $eq: ["$deleted_by_id", 0] },
                  // { $eq: ["$transaction_type", "Direct Purchase"] },
                ],
              },
            },
          },
          // { $match: { transaction_type: { $exists: false } } },
          {
            $project: {
              _id: 0,
              ledger_account_id: 1,
              journal_id: 1,
              journal_details: 1,
              voucher_date: 1,

              debit_balance: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$journal_details.dr_cr", 1] },
                      { $lte: ["$voucher_date", txt_to_date] },
                    ],
                  },
                  then: "$voucher_amount",
                  else: 0,
                },
              },
              credit_balance: {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ["$journal_details.dr_cr", 2] },
                      { $lte: ["$voucher_date", txt_to_date] },
                    ],
                  },
                  then: "$voucher_amount",
                  else: 0,
                },
              },
            },
          },
          {
            $group: {
              _id: "$journal_details.ddl_ledger_id",
              debit_balance: { $sum: "$debit_balance" },
              credit_balance: { $sum: "$credit_balance" },
            },
          },
        ],
        as: "journals",
      },
    },
    {
      $lookup: {
        from: "t_200_receipt_payments",
        let: { ledger_account_id: "$ledger_acc_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$$ledger_account_id", "$ledger_account_id"] },
                      { $eq: ["$$ledger_account_id", "$bank_id"] },
                    ],
                  },
                  { $eq: ["$deleted_by_id", 0] },
                ],
              },
            },
          },

          //push
          {
            $project: {
              _id: 0,
              //ledger_account_id: 1,
              // $bank_id:1
              ledger_account_id: {
                $cond: {
                  if: { $eq: ["$ledger_account_id", "$$ledger_account_id"] },

                  then: "$ledger_account_id",
                  else: "$bank_id",
                },
              },
              receipt_payment_id: 1,
              receipt_payment_type: 1,
              voucher_date: 1,
              amount: 1,
              debit_balance: {
                $cond: {
                  if: {
                    $or: [
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["R", "BP"]] },
                          { $lt: ["$voucher_date", txt_to_date] },
                          { $eq: ["$bank_id", "$$ledger_account_id"] },
                        ],
                      },
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["P", "BR"]] },
                          { $lt: ["$voucher_date", txt_to_date] },
                          {
                            $eq: ["$ledger_account_id", "$$ledger_account_id"],
                          },
                        ],
                      },
                    ],
                  },
                  then: "$amount",
                  else: 0,
                },
              },
              credit_balance: {
                $cond: {
                  if: {
                    $or: [
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["P", "BR"]] },
                          { $lt: ["$voucher_date", txt_to_date] },
                          { $eq: ["$bank_id", "$$ledger_account_id"] },
                        ],
                      },
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["R", "BP"]] },
                          { $lt: ["$voucher_date", txt_to_date] },
                          {
                            $eq: ["$ledger_account_id", "$$ledger_account_id"],
                          },
                        ],
                      },
                    ],
                  },
                  then: "$amount",
                  else: 0,
                },
              },
              dr_cr_status: {
                //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
                $cond: {
                  if: {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$bank_id", "$$ledger_account_id"] },
                          { $eq: ["$receipt_payment_type", "R"] },
                        ],
                      },
                      {
                        $and: [
                          {
                            $eq: ["$ledger_account_id", "$$ledger_account_id"],
                          },
                          { $eq: ["$receipt_payment_type", "P"] },
                        ],
                      },
                    ],
                  },
                  then: "Dr",
                  else: "Cr",
                },
              },
            },
          },
          {
            $group: {
              _id: "$ledger_account_id",
              debit_balance: { $sum: "$debit_balance" },
              credit_balance: { $sum: "$credit_balance" },
            },
          },
        ],
        as: "receipt_payments",
      },
    },
    {
      $unwind: {
        path: "$journals",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$receipt_payments",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $addFields: { dr_cr_status: "$ledger_account_details.dr_cr_status" } },
    {
      $group: {
        _id: "$vendor_id",
        //sales_no: { $addToSet: "$salesNo" },
        company_name: { $addToSet: "$company_name" },
        sumPurchase_value: {$first:{ $first: "$sumPurchase_value" }},
        // receipt_payments:{$addToSet:"$receipt_payments"},
        // journals:{$addToSet:"$journals"},

        //  closing_balance: { $first: "$closing_balance" },

        dr_cr_status: { $first: "$dr_cr_status" },
        // action_items: { $first: "$action_items" },
        
ledger_group_id: { $first: "$ledger_group_id" },
        
        ledger_account_id: { $first: "$ledger_acc_id" },
        receipt_payments_dr: {
          $first: { $ifNull: ["$receipt_payments.debit_balance", 0] },
        },
        receipt_payments_cr: {
          $first: { $ifNull: ["$receipt_payments.credit_balance", 0] },
        },
        journals_dr: { $first: { $ifNull: ["$journals.debit_balance", 0] } },
        journals_cr: { $first: { $ifNull: ["$journals.credit_balance", 0] } },
        opening_balance: { $first: "$ledger_account_details.opening_balance" },
      },
    },

    {
      $addFields: {
        closing_balance: {
          $cond: {
            if: { $gt: ["$opening_balance", 0] },
            then: {
              $cond: {
                if: { $eq: ["$dr_cr_status", "Dr"] },
                then: {
                  $subtract: [
                    {
                      $sum: [
                        "$opening_balance",
                        "$journals_dr",
                        "$receipt_payments_dr",
                      ],
                    },
                    { $sum: ["$journals_cr", "$receipt_payments_cr"] },
                  ],
                },
                else: {
                  $subtract: [
                    {
                      $sum: [
                        "$opening_balance",
                        "$journals_cr",
                        "$receipt_payments_cr",
                      ],
                    },
                    { $sum: ["$journals_dr", "$receipt_payments_dr"] },
                  ],
                },
              },
            },
            else: {
              $subtract: [
                { $sum: ["$journals_dr", "$receipt_payments_dr"] },
                { $sum: ["$journals_cr", "$receipt_payments_cr"] },
              ],
              // {
              //   $sum: ["$ledger_account_details.opening_balance",
              //     { $sum: [0, "$receipt_payments.credit_balance",] }]
              // },
              // { $sum: [0, "$receipt_payments.debit_balance","$netValue"] }]
            },
          },
        },
      },
    },
    // // ////DR CR status/////////////////////////////////////
    // {
    //   $addFields: {
    //     current_dr_cr: {
    //       $switch: {
    //         branches: [
    //           {
    //             //// Case 1 op!=0 && o.drcr = dr
    //             case: {
    //               $and: [
    //                 { $ne: ["$opening_balance", 0] },
    //                 { $eq: ["$dr_cr_status", "Dr"] },
    //                 {
    //                   $gte: [
    //                     {
    //                       $subtract: [
    //                         {
    //                           $sum: [
    //                             "$opening_balance",
    //                             "$receipt_payments_dr",
    //                             "$journals_dr",
                                
    //                           ],
    //                         },
    //                         { $sum: ["$journals_cr", "$receipt_payments_cr"] },
    //                       ],
    //                     },
    //                     0,
    //                   ],
    //                 },
    //               ],
    //             },
    //             then: "Dr",
    //           },

    //           {
    //             //// Case 1.2 op!=0 && o.drcr = dr && cr>dr
    //             case: {
    //               $and: [
    //                 { $ne: ["$opening_balance", 0] },
    //                 { $eq: ["$dr_cr_status", "Dr"] },
    //                 {
    //                   $gte: [
    //                     {
    //                       $subtract: [
    //                         { $sum: ["$journals_cr", "$receipt_payments_cr"] },
    //                         {
    //                           $sum: [
    //                             "$opening_balance",
    //                             "$receipt_payments_dr",
    //                             "$journals_dr",
                                
    //                           ],
    //                         },
    //                       ],
    //                     },
    //                     0,
    //                   ],
    //                 },
    //               ],
    //             },
    //             then: "Cr",
    //           },

    //           //////case 2op!=0 && o.drcr =cr
    //           {
    //             case: {
    //               $and: [
    //                 { $ne: ["$opening_balance", 0] },
    //                 { $eq: ["$dr_cr_status", "Cr"] },
    //                 {
    //                   $gte: [
    //                     {
    //                       $subtract: [
    //                         {
    //                           $sum: [
    //                             "$opening_balance",
    //                             "$receipt_payments.cr",
    //                             "$journals_cr",
    //                           ],
    //                         },
    //                         {
    //                           $sum: [
    //                             "$journals_dr",
    //                             "$receipt_payments.dr",
                               
    //                           ],
    //                         },
    //                       ],
    //                     },
    //                     0,
    //                   ],
    //                 },
    //               ],
    //             },
    //             then: "Cr",
    //           },
    //           //// Case 2.1 op!=0 && o.drcr = dr && dr>cr
    //           {
    //             case: {
    //               $and: [
    //                 { $ne: ["$opening_balance", 0] },
    //                 { $eq: ["$dr_cr_status", "Cr"] },
    //                 {
    //                   $gte: [
    //                     {
    //                       $subtract: [
    //                         {
    //                           $sum: [
    //                             "$journals_dr",
    //                             "$receipt_payments.dr",
                               
    //                           ],
    //                         },
    //                         {
    //                           $sum: [
    //                             "$opening_balance",
    //                             "$receipt_payments.cr",
    //                             "$journals_cr",
    //                           ],
    //                         },
    //                       ],
    //                     },
    //                     0,
    //                   ],
    //                 },
    //               ],
    //             },
    //             then: "Cr",
    //           },
    //           //////Case 3 op=0
    //           {
    //             case: {
    //               $and: [
    //                 { $eq: ["$opening_balance", 0] },
    //                 {
    //                   $gte: [
    //                     {
    //                       $subtract: [
    //                         {
    //                           $sum: [
    //                             "$journals_dr",
    //                             "$receipt_payments.dr",
    //                             "$sumSalesOrderNetValue",
    //                           ],
    //                         },
    //                         { $sum: ["$journals_cr", "$receipt_payments.cr"] },
    //                       ],
    //                     },
    //                     0,
    //                   ],
    //                 },
    //               ],
    //             },
    //             then: "Dr",
    //           },
    //           {
    //             case: {
    //               $and: [
    //                 { $eq: ["$opening_balance", 0] },
    //                 {
    //                   $gte: [
    //                     {
    //                       $subtract: [
    //                         { $sum: ["$journals_cr", "$receipt_payments.cr"] },
    //                         {
    //                           $sum: [
    //                             "$journals_dr",
    //                             "$receipt_payments.dr",
    //                             "$sumSalesOrderNetValue",
    //                           ],
    //                         },
    //                       ],
    //                     },
    //                     0,
    //                   ],
    //                 },
    //               ],
    //             },
    //             then: "Cr",
    //           },
    //         ],
    //         default: "-",
    //       },
    //     },
    //   },
    // },
    {
      $addFields: {

        current_dr_cr: {
          $switch: {
            branches: [
              {
                //// Case 1 op!=0 && o.drcr = dr
                case: {
                  $and: [
                    { $ne: ["$opening_balance", 0] },
                    { $eq: ["$dr_cr_status", "Dr"] },
                    {
                      $gte: [
                        {
                          $subtract: [
                            { $sum: ["$opening_balance", "$receipt_payments.debit_balance", "$journals.debit_balance"] },
                            { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
                          ]
                        }, 0]
                    }
                  ]
                },
                then: "Dr"
              },
              {
                //// Case 1.1 op!=0 && o.drcr = dr && cr>dr
                case: {
                  $and: [
                    { $ne: ["$opening_balance", 0] },
                    { $eq: ["$dr_cr_status", "Dr"] },
                    {
                      $gte: [
                        {
                          $subtract: [
                            { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] },
                            { $sum: ["$opening_balance", "$receipt_payments.debit_balance", "$journals.debit_balance"] }

                          ]
                        }, 0]
                    }
                  ]
                },
                then: "Cr"
              },
              //////case 2op!=0 && o.drcr =cr 
              {
                case: {
                  $and: [
                    { $ne: ["$opening_balance", 0] },
                    { $eq: ["$dr_cr_status", "Cr"] },
                    {
                      $gte: [
                        {
                          $subtract: [
                            { $sum: ["$opening_balance", "$receipt_payments.credit_balance", "$journals.credit_balance"] },
                            { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }
                          ]
                        }, 0]
                    }
                  ]
                },
                then: "Cr"
              },
              {
                case: {
                  $and: [
                    { $ne: ["$opening_balance", 0] },
                    { $eq: ["$dr_cr_status", "Cr"] },
                    {
                      $gte: [
                        {
                          $subtract: [
                            { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] },
                            { $sum: ["$opening_balance", "$receipt_payments.credit_balance", "$journals.credit_balance"] },

                          ]
                        }, 0]
                    }
                  ]
                },
                then: "Dr"
              },
              //////Case 3: op=0 && Dr-Cr>0
              {
                case: {
                  $and: [
                    { $eq: ["$opening_balance", 0] },
                    {
                      $gte: [
                        {
                          $subtract: [
                            { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] },
                            { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
                          ]
                        }, 0]
                    }
                  ]
                },
                then: "Dr"
              },

              //////Case 4: op=0 && Dr-Cr<0
              {
                case: {
                  $and: [
                    { $eq: ["$opening_balance", 0] },
                    {
                      $gte: [
                        {
                          $subtract: [
                            { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] },
                            { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }
                          ]
                        }, 0]
                    }
                  ]
                },
                then: "Cr"
              }
            ],
            default: "-"
          }
        }
      }
    },
  ]);

  if (PurchaseData) {
    // console.log("r",txt_to_date);
    return res.status(200).json(PurchaseData);
  } else {

    // console.log("e");

    return res.status(200).json([]);
  }
};



const view_ledger_account_name = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  let condi = {};

  const ledger_account_id = req.body.ledger_account_id;
  const ledger_account_name = req.body.ledger_account;
  const dr_cr_status = req.body.dr_cr_status;
  // const closingBalance = req.body.closingBalance;

  const ledger_group_id = req.body.ledger_group_id;
  const ledger_group_mis = req.body.ledger_group_mis;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  if (ledger_account_id) {
    condition = { ...condition, ledger_account_id: ledger_account_id };
  }
  if (ledger_group_id) {
    condition = { ...condition, ledger_group_id: ledger_group_id };
  }

  if (ledger_group_mis) {
    condition = { ...condition, ledger_group_id: ledger_group_mis };
  }

  // Details by Name
  if (ledger_account_name) {
    condition = {
      ...condition,
      ledger_account: ledger_account_name,
    };
  }
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [{ ledger_account_name: { $regex: searchQuery, $options: "i" } }],
    };
  }

  // let ledger_account_by_name = await ledger_group.aggregate([
  //   { $match: condition },
  //   {
  //     $project: { ledger_group_id: 1, ledger_group: 1 }
  //   },
  //   {
  //     $lookup: {
  //       from: "t_900_ledgerstorages",
  //       let: { ledgerGroupId: "$ledger_group_id" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$ledgerGroupId", "$$ledgerGroupId"]
  //             }
  //           }
  //         },
  //         {
  //           $project: {
  //             ledgerId: 1,
  //             openingBalance: 1,
  //             closingBalance: 1,
  //             openCrDrStatus: 1,
  //             closeCrDrStatus: 1,
  //             ledgerName: 1,
  //             typeId: 1,
  //             type: 1
  //           }
  //         }
  //       ],
  //       as: "storage"
  //     }
  //   },
  //   {
  //     $unwind: {
  //       path: "$storage"
  //     }
  //   },
  //   {
  //     $addFields: {
  //       ledger_account_id: "$storage.ledgerId",
  //       openingBalance: "$storage.openingBalance",
  //       closingBalance: "$storage.closingBalance",
  //       openCrDrStatus: "$storage.openCrDrStatus",
  //       closeCrDrStatus: "$storage.closeCrDrStatus",
  //       ledgerName: "$storage.ledgerName",
  //       typeId: "$storage.typeId",
  //       type: "$storage.type"
  //     }
  //   },
  //   {
  //     $unset: "storage"
  //   },
  //   {
  //     $lookup: {
  //       from: "t_500_vendors",
  //       let: {
  //         vendor_id: "$typeId",
  //         type: "V"
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$vendor_id", "$$vendor_id"]
  //             }
  //           }
  //         },
  //         {
  //           $project: {
  //             group_id: 1,
  //             company_name: 1
  //           }
  //         }
  //       ],
  //       as: "vendor"
  //     }
  //   },
  //   {
  //     $unwind: {
  //       path: "$vendor"
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: "t_400_customers",
  //       let: {
  //         customer_id: "$typeId",
  //         type: "C"
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and:[
  //               {$eq: ["$customer_id", "$$customer_id"]},
  //               { $eq: ["$type", "$$type"] }
  //               ]
  //             },

  //           }
  //         },
  //         {
  //           $project: {
  //             group_id: 1,
  //             company_name: 1
  //           }
  //         }
  //       ],
  //       as: "customer"
  //     }
  //   },
  //   {
  //     $unwind: {
  //       path: "$customer"
  //     }
  //   }
  // ]);

  // let ledger_account_by_name = await ledger_group.aggregate([
  //   { $match: condition },
  //   {
  //     $project: { ledger_group_id: 1, ledger_group: 1 },
  //   },
  //   {
  //     $lookup: {
  //       from: "t_900_ledgerstorages",
  //       let: { ledgerGroupId: "$ledger_group_id" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$ledgerGroupId", "$$ledgerGroupId"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             ledgerId: 1,
  //             openingBalance: 1,
  //             closingBalance: 1,
  //             openCrDrStatus: 1,
  //             closeCrDrStatus: 1,
  //             ledgerName: 1,
  //             typeId: 1,
  //             type: 1,
  //           },
  //         },
  //       ],
  //       as: "storage",
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$storage",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       ledger_account_id: "$storage.ledgerId",
  //       openingBalance: "$storage.openingBalance",
  //       closingBalance: "$storage.closingBalance",
  //       openCrDrStatus: "$storage.openCrDrStatus",
  //       closeCrDrStatus: "$storage.closeCrDrStatus",
  //       ledgerName: "$storage.ledgerName",
  //       typeId: "$storage.typeId",
  //       type: "$storage.type",
  //     },
  //   },
  //   {
  //     $unset: "storage",
  //   },
  //   {
  //     $lookup: {
  //       from: "t_500_vendors",
  //       let: {
  //         vendor_id: "$typeId",
  //         type: "V",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ["$vendor_id", "$$vendor_id"] },
  //                 { $eq: ["$type", "$$type"] },
  //               ],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             group_id: 1,
  //             company_name: 1,
  //           },
  //         },
  //       ],
  //       as: "vendor",
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$vendor",
  //       preserveNullAndEmptyArrays: true,
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "t_400_customers",
  //       let: {
  //         customer_id: "$typeId",
  //         type: "C",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ["$customer_id", "$$customer_id"] },
  //                 { $eq: ["$type", "$$type"] },
  //               ],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             group_id: 1,
  //             company_name: 1,
  //           }
  //         }
  //       ],
  //       as: "Customer"
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$Customer",
  //       preserveNullAndEmptyArrays: true,
  //     },
  //   },

  // ]);

  // let ledger_account_by_name = await ledger_account.aggregate([
  //   { $match: condition },
  //   {
  //     $project: {
  //       ledger_group_id: 1,
  //       ledger_group: 1,
  //       ledger_account_id: 1,
  //       type: 1,
  //       type_id: 1,
  //     },
  //   },

  //   {
  //     $lookup: {
  //       from: "t_500_vendors",
  //       let: {
  //         vendor_id: "$typeId",
         
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ["$vendor_id", "$$vendor_id"] },
  //                 {}
                 
  //               ],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             group_id: 1,
  //             company_name: 1,
  //           },
  //         },
  //       ],
  //       as: "vendor",
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$vendor",
  //       preserveNullAndEmptyArrays: true, // Preserve documents even if there is no matching vendor
  //     },
  //   },
  //   // {
  //   //   $lookup: {
  //   //     from: "t_900_ledgerstorages",
  //   //     let: { ledgerGroupId: "$ledger_group_id" },
  //   //     pipeline: [
  //   //       {
  //   //         $match: {
  //   //           $expr: {
  //   //             $eq: ["$ledgerGroupId", "$$ledgerGroupId"],
  //   //           },
  //   //         },
  //   //       },
  //   //       {
  //   //         $project: {
  //   //           ledgerId: 1,
  //   //           openingBalance: 1,
  //   //           closingBalance: 1,
  //   //           openCrDrStatus: 1,
  //   //           closeCrDrStatus: 1,
  //   //           ledgerName: 1,
  //   //           typeId: 1,
  //   //           type: 1,
  //   //         },
  //   //       },
  //   //     ],
  //   //     as: "storage",
  //   //   },
  //   // },
  //   // {
  //   //   $unwind: {
  //   //     path: "$storage",
  //   //   },
  //   // },
  //   // {
  //   //   $addFields: {
  //   //     ledger_account_id: "$storage.ledgerId",
  //   //     openingBalance: "$storage.openingBalance",
  //   //     closingBalance: "$storage.closingBalance",
  //   //     openCrDrStatus: "$storage.openCrDrStatus",
  //   //     closeCrDrStatus: "$storage.closeCrDrStatus",
  //   //     ledgerName: "$storage.ledgerName",
  //   //     typeId: "$storage.typeId",
  //   //     type: "$storage.type",
  //   //   },
  //   // },
  //   // {
  //   //   $unset: "storage",
  //   // },
    
  //   // {
  //   //   $lookup: {
  //   //     from: "t_400_customers",
  //   //     let: {
  //   //       customer_id: "$typeId",
  //   //       type: "C",
  //   //     },
  //   //     pipeline: [
  //   //       {
  //   //         $match: {
  //   //           $expr: {
  //   //             $and: [
  //   //               { $eq: ["$customer_id", "$$customer_id"] },
  //   //               { $eq: ["$type", "$$type"] },
  //   //             ],
  //   //           },
  //   //         },
  //   //       },
  //   //       {
  //   //         $project: {
  //   //           group_id: 1,
  //   //           company_name: 1,
  //   //         },
  //   //       },
  //   //     ],
  //   //     as: "customer",
  //   //   },
  //   // },
  //   // {
  //   //   $unwind: {
  //   //     path: "$customer",
  //   //     preserveNullAndEmptyArrays: true, // Preserve documents even if there is no matching customer
  //   //   },
  //   // },
  // ]);

  // let ledger_account_by_name = await ledger_account.aggregate([
  //   { $match: condition },
  //   {
  //     $project: {
  //       ledger_group_id: 1,        
  //       ledger_account: 1,
  //       ledger_account_id: 1,
  //       type: 1,
  //       type_id: 1,
  //     },
  //   },
  //      {
  //     $lookup: {
  //       from: "t_900_ledgerstorages",
  //       let: { ledgerId: "$ledger_account_id" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$ledgerId", "$$ledgerId"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             ledgerId: 1,
  //             openingBalance: 1,
  //             closingBalance: 1,
  //             openCrDrStatus: 1,
  //             closeCrDrStatus: 1,
  //             ledgerName: 1,
  //             typeId: 1,
  //             type: 1,
  //           },
  //         },
  //       ],
  //       as: "storage",
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$storage",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       ledger_account_id: "$storage.ledgerId",
  //       openingBalance: "$storage.openingBalance",
  //       closingBalance: "$storage.closingBalance",
  //       openCrDrStatus: "$storage.openCrDrStatus",
  //       closeCrDrStatus: "$storage.closeCrDrStatus",
  //       ledgerName: "$storage.ledgerName",
  //       typeId: "$storage.typeId",
  //       type: "$storage.type",
  //     },
  //   },
  //   {
  //     $unset: "storage",
  //   },

  //   {
  //     $lookup: {
  //       from: "t_500_vendors",
  //       let: {
  //         vendor_id: "$typeId",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ["$type", "V"] },
  //                 { $eq: ["$vendor_id", "$$vendor_id"] },
                  
  //               ],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             group_id: 1,
  //             company_name: 1,
  //           },
  //         },
  //       ],
  //       as: "vendor",
  //     },
  //   },
    


  
   
  // ]);

  let ledger_account_by_name = await ledger_account.aggregate([
    { $match: condition },
    {
      $project: {
        ledger_group_id: 1,
        ledger_account: 1,
        ledger_account_id: 1,
        type: 1,
        type_id: 1,
      },
    },
    
    {
      $lookup: {
        from: "t_900_ledgerstorages",
        let: { ledgerId: "$ledger_account_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$ledgerId", "$$ledgerId"],
              },
            },
          },
          {
            $project: {
              ledgerId: 1,
              openingBalance: 1,
              closingBalance: 1,
              openCrDrStatus: 1,
              closeCrDrStatus: 1,
              ledgerName: 1,
              typeId: 1,
              type: 1,
            },
          },
        ],
        as: "storage",
      },
    },
    {
      $unwind: {
        path: "$storage",
      },
    },
    {
      $addFields: {
        ledger_account_id: "$storage.ledgerId",
        openingBalance: "$storage.openingBalance",
        closingBalance: "$storage.closingBalance",
        openCrDrStatus: "$storage.openCrDrStatus",
        closeCrDrStatus: "$storage.closeCrDrStatus",
        ledgerName: "$storage.ledgerName",
        typeId: "$storage.typeId",
        type: "$storage.type",
      },
    },
    {
      $unset: "storage",
    },
    {
      $lookup: {
        from: "t_500_vendors",
        let: {
          company_name: "$ledgerName",
          type:"V"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  // { $eq: ["$type", "V"] },
                  { $eq: ["$company_name", "$$company_name"] },
                ],
              },
            },
          },
          {
            $project: {
              group_id: 1,
              company_name: 1,
            },
          },
        ],
        as: "vendor",
      },
    },
    {
      $unwind: {
        path: "$vendor",
        preserveNullAndEmptyArrays: true,
    },
  },


  {
    $lookup: {
      from: "t_400_customers",
      let: {
        company_name: "$ledgerName",
        type:"C"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$company_name", "$$company_name"]
            }
          }
        },
        {
          $project: {
            group_id: 1,
            company_name: 1
          }
        }
      ],
      as: "customer"
    }
  },
  {
    $unwind: {
      path: "$customer",
      preserveNullAndEmptyArrays: true,

    }
  },
    
 
  
  
  
 
  {
    $lookup: {
      from: "t_200_ledger_groups",
      let: {
        ledger_group_id: "$ledger_group_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
               
                { $eq: ["$ledger_group_id", "$$ledger_group_id"] },
              ],
            },
          },
        },
        {
          $project: {
            ledger_group: 1,
           
          },
        },
      ],
      as: "ledger_group",
    },
  },

  {
    $group:{
      _id:"$ledger_account_id",
      ledger_account_id:{$first:"$ledger_account_id"},
      ledger_group_id:{$first:"$ledger_group_id"},
      openingBalance:{$first:"$openingBalance"},
      closingBalance:{$first:"$closingBalance"},
      openCrDrStatus:{$first:"$openCrDrStatus"},
      closeCrDrStatus:{$first:"$closeCrDrStatus"},
      ledgerName:{$first:"$ledgerName"},
      typeId:{$first:"$typeId"},
      type:{$first:"$type"},
      Vendorgroup_id:{$first:"$vendor.group_id"},
      vendor_name:{$first:"$vendor.company_name"},
      customergroup_id:{$first:"$customer.group_id"},
      customer_name:{$first:"$customer.company_name"}

    }
  },

  {
    $lookup: {
      from: "t_200_ledger_groups",
      let: {
        ledger_group_id: "$ledger_group_id",
       
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$ledger_group_id", "$$ledger_group_id"]
            }
          }
        },
        {
          $project: {
         
            ledger_group: 1
          }
        }
      ],
      as: "ledger_group"
    }
  },

  { $addFields: { ledger_group_name: { $first: "$ledger_group.ledger_group" } } },
  
 

  
    {
      $lookup: {
        from: "t_200_master_groups",
        let: {
          master_group_id: {
            $cond: [
              { $ifNull: ["$master_group_id", false] },
              "$master_group_id",
              { $ifNull: ["$customergroup_id", "$Vendorgroup_id"] }
            ]
          }
        },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$master_group_id", "$$master_group_id"] }
            }
          },
          { $project: { group: 1, _id: 0 } }
        ],
        as: "group_data"
      }
    },
    { $addFields: { group_name: { $first: "$group_data.group" } } }
  
  
  
  
  
  
 
  
  ]);
  


  

  if (ledger_account_by_name) {
    return res.status(200).json(ledger_account_by_name);
  } else {
    return res.status(200).json([]);
  }
};




//view for ledger_by_sales_order

const view_ledger_by_salesorder = async (req, res) => {
  let condi = { deleted_by_id: 0 };

  const sales_id = req.body.sales_id;
  const sales_order_no = req.body.sales_order_no;

  if (sales_id) {
    condi = { ...condi, sales_id: sales_id };
  }

  if (sales_order_no) {
    condi = { ...condi, sales_order_no: new RegExp(sales_order_no, "i") };
  }

  let salesData = await sales.aggregate([
    {
      $unwind: "$enquiry_details",
    },
    {
      $match: condi,
    },

    {
      $project: {
        sales_id: 1,
        customer_id: 1,
        enquiry_no: 1,
        quotation_no: 1,
        sales_order_no: 1,
        sales_order_date: 1,
        sales_status: 1,
        sales_order_item_details: 1,
        sales_order_other_charges: 1,
      },
    },
    {
      $lookup: {
        from: "t_400_customers",
        let: { customer_id: "$customer_id" },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$customer_id", "$$customer_id"],
              },
            },
          },
          {
            $unwind: "$contact_person",
          },
        ],
        as: "customer_details",
      },
    },
    {
      $addFields: {
        customer_name: { $first: "$customer_details.company_name" },
      },
    },
    {
      $lookup: {
        from: "t_900_statuses",
        let: { sales_status: "$sales_status" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toDouble: "$$sales_status" }, "$status_id"],
              },
            },
          },
          {
            $project: {
              status_name: 1,
            },
          },
        ],
        as: "status",
      },
    },
    {
      $addFields: {
        status_name: { $first: "$status.status_name" },
      },
    },
  ]);

  if (salesData) {
    // console.log("sen1306=>", salesData)
    return res.status(200).send(salesData);
  } else {
    return res.status(200).json([]);
  }
};


const view_create_delivery_order = async (req, res) => {
  try {
    let condi = { deleted_by_id: 0 };

    const sales_id = req.body.sales_id;

    if (sales_id) {
      condi = { ...condi, sales_id: sales_id };
    }

    let salesData = await sales.aggregate([
      {
        $unwind: "$enquiry_details",
      },
      {
        $match: condi,
      },
      {
        $project: {
          _id: 1,
          sales_id: 1,
          customer_id: 1,
          enquiry_no: 1,
          quotation_no: 1,
          sales_order_no: 1,
          sales_order_date: 1,
          sales_status: 1,
          sales_order_item_details: 1,
          sales_order_other_charges: 1,
          delivery_order_item_details: 1,
          dispatch_order_item_details: 1,
        },
      },
      {
        $lookup: {
          from: "t_400_customers",
          let: { customer_id: "$customer_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$customer_id", "$$customer_id"],
                },
              },
            },
            {
              $unwind: "$contact_person",
            },
          ],
          as: "customer_details",
        },
      },
      {
        $addFields: {
          customer_name: { $first: "$customer_details.company_name" },
        },
      },
      {
        $lookup: {
          from: "t_900_statuses",
          let: { sales_status: "$sales_status" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toDouble: "$$sales_status" }, "$status_id"],
                },
              },
            },
            {
              $project: {
                status_name: 1,
              },
            },
          ],
          as: "status",
        },
      },
      {
        $addFields: {
          status_name: { $first: "$status.status_name" },
        },
      },
      
    ]);

    if (salesData.length > 0) {
      return res.status(200).send(salesData);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error("An error occurred while retrieving sales data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const view_delivery_order = async (req, res) => {
  try {
    let condi = { deleted_by_id: 0 };

    const sales_id = req.body.sales_id;

    if (sales_id) {
      condi = { ...condi, sales_id: sales_id };
    }

    let salesData = await sales.aggregate([
      {
        $unwind: "$enquiry_details",
      },
      {
        $match: condi,
      },
      {
        $project: {
          _id: 1,
          sales_id: 1,
          customer_id: 1,
          enquiry_no: 1,
          quotation_no: 1,
          sales_order_no: 1,
          sales_order_date: 1,
          sales_status: 1,
          sales_order_item_details: 1,
          sales_order_other_charges: 1,
          delivery_order_item_details: 1,
          dispatch_order_item_details: 1,
          delivery_order_details:1,
        },
      },
      {
        $lookup: {
          from: "t_400_customers",
          let: { customer_id: "$customer_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$customer_id", "$$customer_id"],
                },
              },
            },
            {
              $unwind: "$contact_person",
            },
          ],
          as: "customer_details",
        },
      },
      {
        $addFields: {
          customer_name: { $first: "$customer_details.company_name" },
        },
      },
      {
        $lookup: {
          from: "t_900_statuses",
          let: { sales_status: "$sales_status" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toDouble: "$$sales_status" }, "$status_id"],
                },
              },
            },
            {
              $project: {
                status_name: 1,
              },
            },
          ],
          as: "status",
        },
      },
      {
        $addFields: {
          status_name: { $first: "$status.status_name" },
        },
      },
      {
        $lookup: {
          from: "t_000_showrooms_warehouses",
          let: {
            showrooms_warehouse_id: "$enquiry_details.showroom_warehouse_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$showrooms_warehouse_id", "$$showrooms_warehouse_id"],
                },
              },
            },
          ],
          as: "showroom",
        },
      },
      {
        $addFields: {
          showroom_warehouse_name: { $first: "$showroom.showrooms_warehouse" },
        },
      }
      
    ]);

    if (salesData.length > 0) {
      return res.status(200).send(salesData);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error("An error occurred while retrieving sales data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const create_dispatch_order = async (req, res) => {
  try {
    let condi = { deleted_by_id: 0 };

    const delivery_order_no = req.body.delivery_order_no;
    const sales_id = req.body.sales_id;



  if (sales_id) {
      condi = { ...condi, sales_id: sales_id };
    }
    
    if (delivery_order_no) {
      condi = { ...condi, delivery_order_no: new RegExp(delivery_order_no, "i") };
    }

    let salesData = await sales.aggregate([
      {
        $unwind: "$enquiry_details",
      },
      { $unwind: "$delivery_order_details" },
      {
        $match: condi,
      },
      {
        $project: {
          _id: 1,
          sales_id: 1,
          customer_id: 1,
          enquiry_no: 1,
          quotation_no: 1,
          sales_order_no: 1,
          sales_order_date: 1,
          sales_status: 1,
          sales_order_item_details: 1,
          sales_order_other_charges: 1,
          delivery_order_item_details: 1,
          dispatch_order_item_details: 1,
          delivery_order_details: 1,
          req_delivery_order_item_details: {
            $filter: {
              input: "$delivery_order_item_details",
              as: "o",
              cond: {
                $eq: ["$$o.delivery_no", "$delivery_order_details.delivery_order_no"]
              }
            }
          },
          req_dispatch_order_item_details: {
            $filter: {
              input: "$dispatch_order_item_details",
              as: "o",
              cond: {
                $eq: ["$$o.delivery_order_no", "$delivery_order_details.delivery_order_no"]
              }
            }
          },
          other_dois: {
            $filter: {
              input: "$delivery_order_item_details",
              as: "o",
              cond: {
                $ne: ["$$o.delivery_no", "$delivery_order_details.delivery_order_no"]
              }
            }
          }
        },
      },
      {
        $lookup: {
          from: "t_400_customers",
          let: { customer_id: "$customer_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$customer_id", "$$customer_id"],
                },
              },
            },
            {
              $unwind: "$contact_person",
            },
          ],
          as: "customer_details",
        },
      },
      {
        $addFields: {
          customer_name: { $first: "$customer_details.company_name" },
        },
      },
      {
        $lookup: {
          from: "t_900_statuses",
          let: { sales_status: "$sales_status" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toDouble: "$$sales_status" }, "$status_id"],
                },
              },
            },
            {
              $project: {
                status_name: 1,
              },
            },
          ],
          as: "status",
        },
      },
      {
        $addFields: {
          status_name: { $first: "$status.status_name" },
        },
      },
    ]);

    if (salesData.length > 0) {
      return res.status(200).send(salesData);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error("An error occurred while retrieving sales data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const ledger_check_by_customer_name = async (req, res) =>{
  try {
    let condi = { deleted_by_id: 0 };

    const {type_id, type, ledger_account_name} = req.body;

    if (type_id) {
      condi = { ...condi, type_id: type_id };
    }
    if (type) {
      condi = { ...condi, type: type };
    }
    if (ledger_account_name) {
      condi = { ...condi, ledger_account: ledger_account_name };
    }

    let ledgerData = await ledger_account.aggregate([
      {
        $match: condi,
      },
      {
        $project: {
          _id: 1,
          ledger_account: 1,
          ledger_account_id: 1,
        },
      }      
    ]);

    if (ledgerData.length > 0) {
      const responseObj = {
        status_code: 'success',
        data: ledgerData,
      };
    
      // Sending the object as a JSON response with a 200 status code
      return res.status(200).json(responseObj);

    } else {
      const responseObj = {
        status_code: 'failed',
        data: ledgerData,
      };
      return res.status(200).json(responseObj);
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}


module.exports = {
  deletemenu,
  view_menu,
  updatemenu,
  masterInsert,
  viewCatgeory,
  deleteCategory,
  updateCategory,
  viewBrand,
  deleteBrand,
  updateBrand,
  view_showrooms_warehouse,
  updateshowrooms_warehouse,
  deleteshowrooms_warehouse,
  view_module,
  deleteModule,
  updateModules,
  view_terms,
  deleteTerms,
  view_statutory,
  deleteStatutory,
  updateStatutory,
  view_tax_master,
  updateTaxMaster,
  deleteTaxMaster,
  view_uom,
  updateUom,
  deleteUom,
  updateTerms,
  view_ledger_account,
  view_ledger_account_byName,
  deleteLedgerAccount,
  updateLedgerAccount,
  view_ledger_group,
  deleteLedgerGroup,
  updateLedgerGroup,
  view_charges,
  deleteCharges,
  updateCharges,
  view_primary_group,
  deletePrimaryGroup,
  updatePrimaryGroup,
  view_sources,
  updatesource,
  deletesource,
  view_role,
  updaterole,
  deleterole,
  viewuser,
  updateuser,
  deleteuser,
  view_master_group,
  deletemaster_group,
  updatemaster_group,
  // viewitem,
  updateitem,
  deleteitem,
  updateitemstock,
  viewcustomer,
  viewOnlyCustomer,
  deletecustomer,
  updatecustomer,
  viewvendor,
  updatevendor,
  deletevendor,
  view_bank,
  deletebank,
  updatebank,
  view_enquiry,
  deleteenquiry,
  updateenquiry,
  view_direct_purchase,
  delete_direct_purchase,
  update_direct_purchase,
  view_purchase,
  delete_purchase,
  update_purchase,
  view_sales,
  view_invoice,
  updatesales,
  deletesales,
  view_status,
  updatestatus,
  deletestatus,
  view_task_todo,
  updatetask_todo,
  view_stock_transfer,
  updatestock_transfer,
  view_stock_movement,
  data_migration,
  view_delivery,
  view_dispatch,
  view_vehicle,
  deleteVehicle,
  updateVehicle,
  view_area,
  updateArea,
  deleteArea,
  view_purchase_return,
  view_sales_return,
  updateSalesReturn,
  view_return_delivery_view,
  view_item_withAgg,
  item_dropDown,
  view_delivery_return,
  itemPriceUpdate,
  view_waste,
  view_trialBalance,
  view_trialBalanceSundayCredit,
  view_ledger_account_name,
  view_ledger_account_search,
  view_ledger_by_salesorder,
  view_create_delivery_order,
  view_delivery_order,
  create_dispatch_order,
  ledger_check_by_customer_name





};
