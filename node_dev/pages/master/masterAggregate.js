const router = require("express").Router();
// const moment = require("moment");
const moment = require("moment-timezone");
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { apiList } = require("../../config/api");
var express = require("express");

var cron = require("node-cron");
// const schedule = require('node-schedule');
// let rule = new schedule.RecurrenceRule();
// // your timezone
// rule.tz = 'Asia/Kolkata';

// // runs at 15:00:00
// rule.second = 0;
// rule.minute = 45;
// rule.hour = 10;

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
} = require("../../modals/Master");
const {
  tax_master,
  ledger_account,
  ledger_group,
  charges,
  primary_group,
  master_group,
} = require("../../modals/MasterAccounts");
const { User, userSchema } = require("../../modals/User");
const { customer, reference, vendor } = require("../../modals/MasterReference");
const {
  direct_purchase,
  purchase,
  purchase_return,
} = require("../../modals/Purchase");
const {
  sales,
  status,
  task_todo,
  serial_no,
  stock_transfer,
  stock_movement,
  sales_return,
} = require("../../modals/Sales");
const { receipt_payment, journal } = require("../../modals/Account");

const { storage } = require("../../modals/ledgerStorage");

// // old //For Invoice Search Only
// const view_sales_invoice_agg = async (req, res) => {
//   let condi = { deleted_by_id: 0 };
//   const customer_id = req.body.customer_id;
//   const sales_id = req.body.sales_id;

//   //for invoice search
//   const invoice_date_from = req.body.invoice_date_from;
//   const invoice_date_to = req.body.invoice_date_to;
//   const bill_no_sales = req.body.bill_no;
//   const showroom_warehouse_id = req.body.showroom_warehouse_id;

//   if (showroom_warehouse_id) {
//     condi = {
//       ...condi,
//       "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id,
//     };
//   }

//   // Details by ID
//   if (sales_id) {
//     condi = { ...condi, sales_id: sales_id };
//   }

//   //Details by bill no
//   if (bill_no_sales) {
//     condi = {
//       ...condi,
//       "invoice_details.invoice_no": new RegExp(bill_no_sales, "i"),
//     };
//   }

//   if (customer_id) {
//     condi = { ...condi, customer_id: customer_id };
//   }

//   //both date filter
//   if (invoice_date_from && invoice_date_to) {
//     condi = {
//       ...condi,
//       "invoice_details.invoice_date": {
//         $gte: invoice_date_from,
//         $lte: invoice_date_to,
//       },
//       // "invoice_details.invoice_no": { $eq: "invoice_item_details.invoice_no" }
//     };
//   }
// console.log(invoice_date_from,invoice_date_to)

//   let invoiceData = await sales.aggregate([
//     { $unwind: "$invoice_details" },
//     { $unwind: "$invoice_item_details"},
//     // { $unwind: "$invoice_other_charges" },

//     {
//       $match:
//       {
//         $expr: {
//           $and: [
//             { $lte: ["$invoice_details.invoice_date", invoice_date_to] },
//             { $gte: ["$invoice_details.invoice_date", invoice_date_from] },
//             { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
//             {
//               $cond: {
//                 if: bill_no_sales,
//                 then:
//                 {
//                   $regexMatch: {
//                     input: "$invoice_details.invoice_no",
//                     regex: bill_no_sales,
//                     options: 'i'
//                   }
//                 },
//                 else: ''
//               }
//             },
//             {
//               $cond: {
//                 if: customer_id,
//                 then: { $eq: ["$customer_id", customer_id] },
//                 else: ''
//               }
//             },
//             {
//               $cond: {
//                 if: showroom_warehouse_id,
//                 then: { $eq: ["$invoice_item_details.showroom_warehouse_id", showroom_warehouse_id] },
//                 else: ''
//               }
//             }
//           ]
//         }
//       },
//     },
//     {
//       $lookup: {
//         from: "t_400_customers",
//         let: { customer_id: "$customer_id" },
//         pipeline: [
//           {
//             $match: { $expr: { $eq: ["$customer_id", "$$customer_id"] } },
//           },
//           { $project: { company_name: 1, _id: 0 } },
//         ],
//         as: "customer_details",
//       },
//     },
//     {
//       $addFields: {
//         company_name: { $first: "$customer_details.company_name" },
//       },
//     },
//     { $unset: ["customer_details"] },
//     //{"$unwind": "$invoice_details"},
//     //{"$unwind": "$invoice_item_details"},
//     {
//       $project: {
//         sales_id: 1,
//         quotation_no: 1,
//         company_name: 1,
//         invoice_item_details: 1,
//         invoice_other_charges: 1,
//         invoice_details: 1,
//         // net_value: {"$sum":"$invoice_item_details.net_value"},
//         //"invoice_item_details.invoice_no":1
//       },
//     },
//     {
//       $addFields: {
//         invoice_no: "$invoice_details.invoice_no"
//       }
//     },
//     {
//       $group: {

//         _id: "$invoice_no",
//         net_value: { $sum: "$invoice_item_details.net_value" },
//         sales_id:{$first: "$sales_id"},
//         customer_name: {$first: "$company_name"},
//         invoice_date: {$first:"$invoice_details.invoice_date"},
//         invoice_no:{$first: "$invoice_no"},
//         invoice_details:{$addToSet: "$invoice_details"},
//         invoice_item_details: {$addToSet:"$invoice_item_details"},
//         invoice_other_charges: { $first:"$invoice_other_charges"},
//         quotation_no:{$first: "$quotation_no"},
//         enquiry_no: {$first:"$enquiry_no"},
//         sales_order_no: {$first:"$sales_order_no"},
//         // debit_balance: { $sum: "$debit_balance" },
//         // credit_balance: { $sum: "$credit_balance" },
//       }
//     }
//   ]);
//   console.log(invoiceData)
//   if (invoiceData) {
//     // let returnDataArr = invoiceData.map((data) => {

//     //   let req_invoice_item_details = data.invoice_item_details.filter(
//     //     (o) => o.invoice_no === data.invoice_details.invoice_no
//     //   );
//     //   let req_invoice_other_charges = data.invoice_other_charges.filter(
//     //     (o) => o.invoice_no === data.invoice_details.invoice_no
//     //   );
//     //   //let req_dispatch_order_details = data.dispatch_order_details.filter((o) => o.dispatch_order_no === data.invoice_details.dispatch_order_no);
//     //   //let req_invoice_item_details = data.invoice_item_details;
//     //   //let req_invoice_other_charges = data.invoice_other_charges;
//     //   //let req_dispatch_order_details = data.dispatch_order_details;

//     //   return {
//     //     sales_id: data.sales_id,
//     //     customer_id: data.customer_id,
//     //     customer_name: data.company_name,
//     //     invoice_date: data.invoice_details.invoice_date,
//     //     invoice_no: data.invoice_details.invoice_no,
//     //     invoice_details: data.invoice_details,
//     //     invoice_item_details: req_invoice_item_details.length
//     //       ? req_invoice_item_details
//     //       : data.invoice_item_details,
//     //     net_value: req_invoice_item_details.reduce(
//     //       (p, c) => p + c.net_value,
//     //       0
//     //     ),
//     //     invoice_other_charges: req_invoice_other_charges,
//     //     quotation_no: data.quotation_no,
//     //     enquiry_no: data.enquiry_no,
//     //     sales_order_no: data.sales_order_no,
//     //     //dispatch_order_details: req_dispatch_order_details,
//     //     //action_items: actionValues(data.active_status),
//     //     ...data["_doc"],
//     //   };
//     // });

//     return res.status(200).send(invoiceData);
//   } else {
//     return res.status(200).json([]);
//   }
// };

// //For Invoice Search Only
// const view_sales_invoice_agg = async (req, res) => {
//   let condi = { deleted_by_id: 0 };
//   const customer_id = req.body.customer_id;
//   const sales_id = req.body.sales_id;

//   //for invoice search
//   const invoice_date_from = req.body.invoice_date_from;
//   const invoice_date_to = req.body.invoice_date_to;
//   const bill_no_sales = req.body.bill_no;
//   const showroom_warehouse_id = req.body.showroom_warehouse_id;

//   if (showroom_warehouse_id) {
//     condi = {
//       ...condi,
//       "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id,
//     };
//   }

//   // Details by ID
//   if (sales_id) {
//     condi = { ...condi, sales_id: sales_id };
//   }

//   //Details by bill no
//   if (bill_no_sales) {
//     condi = {
//       ...condi,
//       "invoice_details.invoice_no": new RegExp(bill_no_sales, "i"),
//     };
//   }

//   if (customer_id) {
//     condi = { ...condi, customer_id: customer_id };
//   }

//   //both date filter
//   if (invoice_date_from && invoice_date_to) {
//     condi = {
//       ...condi,
//       "invoice_details.invoice_date": {
//         $gte: invoice_date_from,
//         $lte: invoice_date_to,
//       },
//       // "invoice_details.invoice_no": { $eq: "invoice_item_details.invoice_no" }
//     };
//   }
//   console.log(invoice_date_from, invoice_date_to)

//   let invoiceData = await sales.aggregate([
//     { $unwind: "$invoice_details" },
//     { $unwind: "$invoice_item_details" },
//     // { $unwind: "$invoice_other_charges" },

//     {
//       $match:
//       {
//         $expr: {
//           $and: [
//             { $lte: ["$invoice_details.invoice_date", invoice_date_to] },
//             { $gte: ["$invoice_details.invoice_date", invoice_date_from] },
//             { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
//             {
//               $cond: {
//                 if: bill_no_sales,
//                 then:
//                 {
//                   $regexMatch: {
//                     input: "$invoice_details.invoice_no",
//                     regex: bill_no_sales,
//                     options: 'i'
//                   }
//                 },
//                 else: ''
//               }
//             },
//             {
//               $cond: {
//                 if: customer_id,
//                 then: { $eq: ["$customer_id", customer_id] },
//                 else: ''
//               }
//             },
//             {
//               $cond: {
//                 if: showroom_warehouse_id,
//                 then: { $eq: ["$invoice_item_details.showroom_warehouse_id", showroom_warehouse_id] },
//                 else: ''
//               }
//             }
//           ]
//         }
//       },
//     },
//     {
//       $lookup: {
//         from: "t_400_customers",
//         let: { customer_id: "$customer_id" },
//         pipeline: [
//           {
//             $match: { $expr: { $eq: ["$customer_id", "$$customer_id"] } },
//           },
//           { $project: { company_name: 1, _id: 0 } },
//         ],
//         as: "customer_details",
//       },
//     },
//     {
//       $addFields: {
//         company_name: { $first: "$customer_details.company_name" },
//       },
//     },
//     { $unset: ["customer_details"] },
//     //{"$unwind": "$invoice_details"},
//     //{"$unwind": "$invoice_item_details"},
//     {
//       $project: {
//         sales_id: 1,
//         quotation_no: 1,
//         company_name: 1,
//         invoice_item_details: 1,
//         invoice_other_charges: 1,
//         invoice_details: 1,
//         invoice_no: "$invoice_details.invoice_no"
//         // net_value: {"$sum":"$invoice_item_details.net_value"},
//         //"invoice_item_details.invoice_no":1
//       },
//     },
//     {
//       $lookup: {
//         from: "t_900_sales",
//         let: { invoice_no: "$invoice_no" },
//         pipeline: [
//           {
//             $unwind: {
//               path: "$invoice_other_charges",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $match: {
//               $expr: {
//                 $eq: ["$$invoice_no", "$invoice_other_charges.invoice_no"],
//               },
//             },
//           },
//           {
//             $project: {
//               invoice_other_charges: 1,
//             }
//           }
//         ], as: "invoice",
//       }
//     },
//     {
//       $addFields: {
//         invoice_no: "$invoice_details.invoice_no",
//         invoice_other_charges: "$invoice.invoice_other_charges"
//       }
//     },
//     {
//       $group: {

//         _id: "$invoice_no",
//         net_value: { $sum: "$invoice_item_details.net_value" },
//         sales_id: { $first: "$sales_id" },
//         customer_name: { $first: "$company_name" },
//         invoice_date: { $first: "$invoice_details.invoice_date" },
//         invoice_no: { $first: "$invoice_no" },
//         invoice_details: { $addToSet: "$invoice_details" },
//         invoice_item_details: { $addToSet: "$invoice_item_details" },
//         invoice_other_charges: { $first: "$invoice_other_charges" },
//         quotation_no: { $first: "$quotation_no" },
//         enquiry_no: { $first: "$enquiry_no" },
//         sales_order_no: { $first: "$sales_order_no" },
//         // debit_balance: { $sum: "$debit_balance" },
//         // credit_balance: { $sum: "$credit_balance" },
//       }
//     }
//   ]);
//   console.log(invoiceData)
//   if (invoiceData) {
//     // let returnDataArr = invoiceData.map((data) => {

//     //   let req_invoice_item_details = data.invoice_item_details.filter(
//     //     (o) => o.invoice_no === data.invoice_details.invoice_no
//     //   );
//     //   let req_invoice_other_charges = data.invoice_other_charges.filter(
//     //     (o) => o.invoice_no === data.invoice_details.invoice_no
//     //   );
//     //   //let req_dispatch_order_details = data.dispatch_order_details.filter((o) => o.dispatch_order_no === data.invoice_details.dispatch_order_no);
//     //   //let req_invoice_item_details = data.invoice_item_details;
//     //   //let req_invoice_other_charges = data.invoice_other_charges;
//     //   //let req_dispatch_order_details = data.dispatch_order_details;

//     //   return {
//     //     sales_id: data.sales_id,
//     //     customer_id: data.customer_id,
//     //     customer_name: data.company_name,
//     //     invoice_date: data.invoice_details.invoice_date,
//     //     invoice_no: data.invoice_details.invoice_no,
//     //     invoice_details: data.invoice_details,
//     //     invoice_item_details: req_invoice_item_details.length
//     //       ? req_invoice_item_details
//     //       : data.invoice_item_details,
//     //     net_value: req_invoice_item_details.reduce(
//     //       (p, c) => p + c.net_value,
//     //       0
//     //     ),
//     //     invoice_other_charges: req_invoice_other_charges,
//     //     quotation_no: data.quotation_no,
//     //     enquiry_no: data.enquiry_no,
//     //     sales_order_no: data.sales_order_no,
//     //     //dispatch_order_details: req_dispatch_order_details,
//     //     //action_items: actionValues(data.active_status),
//     //     ...data["_doc"],
//     //   };
//     // });

//     return res.status(200).send(invoiceData);
//   } else {
//     return res.status(200).json([]);
//   }
// };

//For Invoice Search Only
const view_sales_invoice_agg = async (req, res) => {
  let condi = { deleted_by_id: 0 };
  const customer_id = req.body.customer_id;
  const sales_id = req.body.sales_id;

  //for invoice search
  const invoice_date_from = req.body.invoice_date_from;
  const invoice_date_to = req.body.invoice_date_to;
  const bill_no_sales = req.body.bill_no;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;

  if (showroom_warehouse_id) {
    condi = {
      ...condi,
      "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id,
    };
  }

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

  if (customer_id) {
    condi = { ...condi, customer_id: customer_id };
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

  let invoiceData = await sales.aggregate([
    { $unwind: "$invoice_details" },
    {
      $match: condi,
    },
    {
      $lookup: {
        from: "t_400_customers",
        let: { customer_id: "$customer_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$customer_id", "$$customer_id"] } },
          },
          { $project: { company_name: 1, _id: 0 } },
        ],
        as: "customer_details",
      },
    },
    {
      $addFields: {
        company_name: { $first: "$customer_details.company_name" },
      },
    },
    { $unset: ["customer_details"] },
    //{"$unwind": "$invoice_details"},
    //{"$unwind": "$invoice_item_details"},
    {
      $project: {
        sales_id: 1,

        company_name: 1,
        invoice_item_details: 1,
        invoice_other_charges: 1,
        invoice_details: 1,
        // net_value: {"$sum":"$invoice_item_details.net_value"},
        //"invoice_item_details.invoice_no":1
      },
    },
    // {
    //     $group: {

    //         _id: "$invoice_details.invoice_no",
    //         net_value:{$push:"$net_value"}

    //         // debit_balance: { $sum: "$debit_balance" },
    //         // credit_balance: { $sum: "$credit_balance" },
    //       }
    // }
  ]);

  if (invoiceData) {
    let returnDataArr = invoiceData.map((data) => {
      let req_invoice_item_details = data.invoice_item_details.filter(
        (o) => o.invoice_no === data.invoice_details.invoice_no
      );
      let req_invoice_other_charges = data.invoice_other_charges.filter(
        (o) => o.invoice_no === data.invoice_details.invoice_no
      );
      //let req_dispatch_order_details = data.dispatch_order_details.filter((o) => o.dispatch_order_no === data.invoice_details.dispatch_order_no);
      //let req_invoice_item_details = data.invoice_item_details;
      //let req_invoice_other_charges = data.invoice_other_charges;
      //let req_dispatch_order_details = data.dispatch_order_details;

      return {
        sales_id: data.sales_id,
        customer_id: data.customer_id,
        customer_name: data.company_name,
        invoice_date: data.invoice_details.invoice_date,
        invoice_no: data.invoice_details.invoice_no,
        invoice_details: data.invoice_details,
        invoice_item_details: req_invoice_item_details.length
          ? req_invoice_item_details
          : data.invoice_item_details,
        net_value: req_invoice_item_details.reduce(
          (p, c) => p + c.net_value,
          0
        ),
        invoice_other_charges: req_invoice_other_charges,
        quotation_no: data.quotation_no,
        enquiry_no: data.enquiry_no,
        sales_order_no: data.sales_order_no,
        //dispatch_order_details: req_dispatch_order_details,
        //action_items: actionValues(data.active_status),
        ...data["_doc"],
      };
    });

    return res.status(200).send(returnDataArr);
  } else {
    return res.status(200).json([]);
  }
};
const view_sales_agg = async (req, res) => {
  // console.log(req.rawHeader, "rawchecking")
  let condi = { deleted_by_id: 0 };
  const exclude_fields = req.body.exclude_fields
    ? req.body.exclude_fields
    : ["not_applicable_to_exclude"];

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
  const delivery_sales_order_from_date =
    req.body.delivery_sales_order_from_date;
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
  // if (sales_order_no) {
  //     condi = { ...condi, sales_order_no: sales_order_no };
  // }
  if (sales_order_no) {
    condi = { ...condi, sales_order_no: new RegExp(sales_order_no, "i") };
  }

  //Details by delivery order no
  if (delivery_order_no) {
    condi = { ...condi, delivery_order_no: delivery_order_no };
  }

  //Details by dispatch order no
  if (dispatch_order_no) {
    condi = { ...condi, dispatch_order_no: dispatch_order_no };
  }

  if (dispatch_customer) {
    condi = { ...condi, customer_id: dispatch_customer };
  }

  if (bill_no_sales) {
    condi = { ...condi, invoice_no: bill_no_sales };
  }

  // console.log(showroom_warehouse_id,"ssss");

  if (showroom_warehouse_id) {
    condi = {
      ...condi,
      "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id,
    };
  }

  // if (searchQuery) {
  //     condi = {
  //         ...condi,
  //         $or: [
  //             { "enquiry_details.cust_name": searchQuery },
  //             { "enquiry_details.sales_exe_name": searchQuery },
  //             { "enquiry_details.showroom_name": searchQuery },
  //             { enquiry_no: searchQuery },

  //         ],
  //     };
  // }

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
        { "enquiry_details.cust_name": { $regex: searchQuery, $options: "i" } },
        {
          "enquiry_details.sales_exe_name": {
            $regex: searchQuery,
            $options: "i",
          },
        },
        {
          "enquiry_details.showroom_name": {
            $regex: searchQuery,
            $options: "i",
          },
        },
        { "enquiry_details.inv_gross_amount": searchQuery },
        { enquiry_no: { $regex: searchQuery, $options: "i" } },
      ],
    }; // Matching string also compare incase-sensitive
  }

  //keyword search for quotation

  //For quotation
  if (quotation_keyword) {
    condi = {
      ...condi,
      $or: [
        { enquiry_no: { $regex: quotation_keyword, $options: "i" } },
        {
          "enquiry_details.sales_exe_name": {
            $regex: quotation_keyword,
            $options: "i",
          },
        },
        {
          "enquiry_details.cust_name": {
            $regex: quotation_keyword,
            $options: "i",
          },
        },
      ],
    }; // Matching string also compare incase-sensitive
  }

  //key phrase search by sales order

  // if (sales_key_phrase) {
  //     condi = {
  //         ...condi,
  //         $or: [
  //             { enquiry_no: sales_key_phrase },
  //             { quotation_no: sales_key_phrase },
  //             { sales_order_no: sales_key_phrase },
  //             { "enquiry_details.cust_name": sales_key_phrase },

  //         ],
  //     }; // Matching string also compare incase-sensitive
  // }

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

  //both date filter
  if (invoice_date_from && invoice_date_to) {
    condi = {
      ...condi,
      invoice_date: { $gte: invoice_date_from, $lte: invoice_date_to },
    };
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

  console.log("sen1306=>", condi);

  let salesData = await sales.aggregate([
    {
      $unwind: "$enquiry_details",
    },
    {
      $match: condi,
    },

    /////////customer lookup name by id
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
      $addFields: {
        mobile: { $first: "$customer_details.contact_person.txt_mobile" },
      },
    },
    {
      $addFields: {
        email: { $first: "$customer_details.contact_person.txt_email" },
      },
    },
    {
      $addFields: {
        company_name: { $first: "$customer_details.company_name" },
      },
    },

    ////////sales executive by id///////////////////////

    {
      $lookup: {
        from: "users",
        let: { sales_executive_id: "$enquiry_details.sales_executive_id" },
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
        sales_executive_name: { $first: "$salesExecutive.name" } ,
        sales_phone:{$first:"$salesExecutive.mobile"}
    },
    },
    { $addFields: { enquiry_date: "$enquiry_details.enquiry_date" } },

      //uom lookup

      // {
      //   $unwind: {
      //     path: "$enquiry_item_details",
      //     preserveNullAndEmptyArrays: true
      //   }
      // },
  
      // {
      //   $lookup: {
      //     from: "t_100_uoms",
      //     let: { "uom_id": "$enquiry_item_details.uom_id" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: { $eq: ["$uom_id", "$$uom_id"] },
      //         },
      //       },
      //       {
      //         $project: { "lower_unit_value": 1,lower_caption:1, "higher_unit_value": 1, "_id": 0, "uom_id": 1 },
      //       },
      //       {
      //         $group: {
      //           _id: "$uom_id",
      //           lower_unit_value: { $first: "$lower_unit_value" },
      //           lower_caption:{$first:"$lower_caption"}
      //         },
      //       },
      //     ],
      //     as: "uom_details",
      //   },
      // },
      // {
      //   $addFields: {
      //     lower_unit_value: {
            
      //          $first: "$uom_details.lower_unit_value" 
              
            
      //     },
      //     lower_caption:{
      //       $first:"$uom_details.lower_caption"
      //     }
      //   },
      // },

    ////showrooms lookup/////////////////
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
    },
    //exclude_fields///////////
    {
      $unset: ["showroom", "salesExecutive"],
    },
    {
      $unset: exclude_fields,
    },
  
    {
      $sort: {
        enquiry_no: -1,
      },
    },
    //    {$limit:10},
  ]).allowDiskUse(true);

  if (salesData) {
    // console.log("sen1306=>", salesData)
    return res.status(200).send(salesData);
  } else {
    return res.status(200).json([]);
  }
};

const keyword_pharse_search = async (req, res) => {
  let keyword_pharse = req.body.keyword_pharse;
  const enquiry_status = req.body.enquiry_status;
  const enquiry_from_date = req.body.enquiry_from_date;
  const enquiry_to_date = req.body.enquiry_to_date;

  let condition = {};
  if (keyword_pharse) {
    condition = {
      ...condition,
      $or: [
        { company_name: { $regex: keyword_pharse, $options: "i" } },
        { name: { $regex: keyword_pharse } },
        { showroom_name: { $regex: keyword_pharse } },

        // { "enquiry_no": new RegExp(keyword_pharse, 'i') },
      ],
    };
  }
  console.log(condition);
  let keywordData = await customer.aggregate([
    {
      $match: condition,
    },
    {
      $project: {
        customer_id: 1,
        company_name: 1,
        // mobile: "$contact_person.txt_mobile",
        // email: "$contact_person.txt_email",
      },
    },
    //user (Salesman Name)
    {
      $unionWith: {
        coll: "users",
        // let:{"name":condition.name},
        pipeline: [
          {
            $match: { name: { $regex: keyword_pharse, $options: "i" } },
          },
          {
            $project: {
              name: 1,
              user_id: 1,
            },
          },
        ],
        // as:"salesman"
      },
    },
    //showroom search
    {
      $unionWith: {
        coll: "t_000_showrooms_warehouses",
        pipeline: [
          {
            $match: {
              showrooms_warehouse: { $regex: keyword_pharse, $options: "i" },
            },
          },
          {
            $project: {
              showrooms_warehouse: 1,
              showrooms_warehouse_id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "t_900_sales",
        let: {
          customer_id: "$customer_id",
          showrooms_warehouse_id: "$showrooms_warehouse_id",
          user_id: "$user_id",
        },
        pipeline: [
          {
            $unwind: "$enquiry_details",
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$customer_id", "$$customer_id"] },
                      {
                        $eq: [
                          "$enquiry_details.showroom_warehouse_id",
                          "$$showrooms_warehouse_id",
                        ],
                      },
                      {
                        $eq: [
                          "$enquiry_details.sales_executive_id",
                          "$$user_id",
                        ],
                      },
                    ],
                  },
                  {
                    $gte: ["$enquiry_details.enquiry_date", enquiry_from_date],
                  },
                  { $lte: ["$enquiry_details.enquiry_date", enquiry_to_date] },
                  // { $eq: ["$enquiry_status", enquiry_status] },
                ],
              },
            },
          },
          /////////customer lookup name by id
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
            $addFields: {
              mobile: { $first: "$customer_details.contact_person.txt_mobile" },
            },
          },
          {
            $addFields: {
              email: { $first: "$customer_details.contact_person.txt_email" },
            },
          },
          {
            $addFields: {
              company_name: { $first: "$customer_details.company_name" },
            },
          },

          ////////sales executive by id///////////////////////

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
            },
          },
          { $addFields: { enquiry_date: "$enquiry_details.enquiry_date" } },

          ////showrooms lookup/////////////////
          {
            $lookup: {
              from: "t_000_showrooms_warehouses",
              let: {
                showrooms_warehouse_id:
                  "$enquiry_details.showroom_warehouse_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        "$showrooms_warehouse_id",
                        "$$showrooms_warehouse_id",
                      ],
                    },
                  },
                },
              ],
              as: "showroom",
            },
          },
          {
            $addFields: {
              showroom_warehouse_name: {
                $first: "$showroom.showrooms_warehouse",
              },
            },
          },
          //exclude_fields///////////
          {
            $unset: ["showroom", "salesExecutive", "customer_details"],
          },
        ],
        as: "sales",
      },
    },
  ]);
  if (keywordData) {
    // console.log("sen1306=>", salesData)
    return res.status(200).send(keywordData);
  } else {
    return res.status(200).json([]);
  }
};

//for quotation
const keyword_pharse_quotation_search = async (req, res) => {
  let keyword_pharse = req.body.keyword_pharse;
  const enquiry_status = req.body.enquiry_status;
  const quatation_from_date = req.body.quatation_from_date;
  const quatation_to_date = req.body.quatation_to_date;

  let condition = {};
  if (keyword_pharse) {
    condition = {
      ...condition,
      $or: [
        { company_name: { $regex: keyword_pharse, $options: "i" } },
        { name: { $regex: keyword_pharse } },
        { showroom_name: { $regex: keyword_pharse } },

        // { "enquiry_no": new RegExp(keyword_pharse, 'i') },
      ],
    };
  }
  console.log(condition);
  let keywordData = await customer.aggregate([
    {
      $match: condition,
    },
    {
      $project: {
        customer_id: 1,
        company_name: 1,
        // mobile: "$contact_person.txt_mobile",
        // email: "$contact_person.txt_email",
      },
    },
    //user (Salesman Name)
    {
      $unionWith: {
        coll: "users",
        // let:{"name":condition.name},
        pipeline: [
          {
            $match: { name: { $regex: keyword_pharse, $options: "i" } },
          },
          {
            $project: {
              name: 1,
              user_id: 1,
            },
          },
        ],
        // as:"salesman"
      },
    },
    //showroom search
    {
      $unionWith: {
        coll: "t_000_showrooms_warehouses",
        pipeline: [
          {
            $match: {
              showrooms_warehouse: { $regex: keyword_pharse, $options: "i" },
            },
          },
          {
            $project: {
              showrooms_warehouse: 1,
              showrooms_warehouse_id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "t_900_sales",
        let: {
          customer_id: "$customer_id",
          showrooms_warehouse_id: "$showrooms_warehouse_id",
          user_id: "$user_id",
        },
        pipeline: [
          {
            $unwind: "$enquiry_details",
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$customer_id", "$$customer_id"] },
                      {
                        $eq: [
                          "$enquiry_details.showroom_warehouse_id",
                          "$$showrooms_warehouse_id",
                        ],
                      },
                      {
                        $eq: [
                          "$enquiry_details.sales_executive_id",
                          "$$user_id",
                        ],
                      },
                    ],
                  },
                  // {$gte: ["$enquiry_details.enquiry_date", quatation_from_date]},
                  // { $lte: ["$enquiry_details.enquiry_date", quatation_to_date] },
                  { $gte: ["$quotation_date", quatation_from_date] },
                  { $lte: ["$quotation_date", quatation_to_date] },
                  // { $eq: ["$enquiry_status", enquiry_status] },
                ],
              },
            },
          },
          /////////customer lookup name by id
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
            $addFields: {
              mobile: { $first: "$customer_details.contact_person.txt_mobile" },
            },
          },
          {
            $addFields: {
              email: { $first: "$customer_details.contact_person.txt_email" },
            },
          },
          {
            $addFields: {
              company_name: { $first: "$customer_details.company_name" },
            },
          },

          ////////sales executive by id///////////////////////

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
            },
          },
          { $addFields: { enquiry_date: "$enquiry_details.enquiry_date" } },

          ////showrooms lookup/////////////////
          {
            $lookup: {
              from: "t_000_showrooms_warehouses",
              let: {
                showrooms_warehouse_id:
                  "$enquiry_details.showroom_warehouse_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        "$showrooms_warehouse_id",
                        "$$showrooms_warehouse_id",
                      ],
                    },
                  },
                },
              ],
              as: "showroom",
            },
          },
          {
            $addFields: {
              showroom_warehouse_name: {
                $first: "$showroom.showrooms_warehouse",
              },
            },
          },
          //exclude_fields///////////
          {
            $unset: ["showroom", "salesExecutive", "customer_details"],
          },
        ],
        as: "sales",
      },
    },
  ]);
  if (keywordData) {
    // console.log("sen1306=>", salesData)
    return res.status(200).send(keywordData);
  } else {
    return res.status(200).json([]);
  }
};

//for sales
const keyword_pharse_sales_search = async (req, res) => {
  let keyword_pharse = req.body.keyword_pharse;
  const enquiry_status = req.body.enquiry_status;
  const sales_from_date = req.body.sales_from_date;
  const sales_to_date = req.body.sales_to_date;

  let condition = {};
  if (keyword_pharse) {
    condition = {
      ...condition,
      $or: [
        { company_name: { $regex: keyword_pharse, $options: "i" } },
        { name: { $regex: keyword_pharse } },
        { showroom_name: { $regex: keyword_pharse } },

        // { "enquiry_no": new RegExp(keyword_pharse, 'i') },
      ],
    };
  }
  console.log(condition);
  let keywordData = await customer.aggregate([
    {
      $match: condition,
    },
    {
      $unwind: "$address",
    },
    {
      $project: {
        customer_id: 1,
        company_name: 1,
        area:"$address.ddl_area_label",
        state:"$address.ddl_state_label",
        city:"$address.txt_city",
        name:"$address.txt_name",
        street:"$address.txt_street",
        
        mobile: "$address.txt_mobile",
        email: "$contact_person.txt_email",
        gst_no:1,
      },
    },
    //user (Salesman Name)
    {
      $unionWith: {
        coll: "users",
        // let:{"name":condition.name},
        pipeline: [
          {
            $match: { name: { $regex: keyword_pharse, $options: "i" } },
          },
          {
            $project: {
              name: 1,
              user_id: 1,
            },
          },
        ],
        // as:"salesman"
      },
    },
    //showroom search
    {
      $unionWith: {
        coll: "t_000_showrooms_warehouses",
        pipeline: [
          {
            $match: {
              showrooms_warehouse: { $regex: keyword_pharse, $options: "i" },
            },
          },
          {
            $project: {
              showrooms_warehouse: 1,
              showrooms_warehouse_id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "t_900_sales",
        let: {
          customer_id: "$customer_id",
          showrooms_warehouse_id: "$showrooms_warehouse_id",
          user_id: "$user_id",
        },
        pipeline: [
          {
            $unwind: "$enquiry_details",
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$customer_id", "$$customer_id"] },
                      {
                        $eq: [
                          "$enquiry_details.showroom_warehouse_id",
                          "$$showrooms_warehouse_id",
                        ],
                      },
                      {
                        $eq: [
                          "$enquiry_details.sales_executive_id",
                          "$$user_id",
                        ],
                      },
                    ],
                  },
                  // {$gte: ["$enquiry_details.enquiry_date", quatation_from_date]},
                  // { $lte: ["$enquiry_details.enquiry_date", quatation_to_date] },
                  { $gte: ["$sales_order_date", sales_from_date] },
                  { $lte: ["$sales_order_date", sales_to_date] },
                  // { $eq: ["$enquiry_status", enquiry_status] },
                ],
              },
            },
          },
          /////////customer lookup name by id
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
            $addFields: {
              mobile: { $first: "$customer_details.contact_person.txt_mobile" },
            },
          },
          {
            $addFields: {
              email: { $first: "$customer_details.contact_person.txt_email" },
            },
          },
          {
            $addFields: {
              company_name: { $first: "$customer_details.company_name" },
            },
          },

          ////////sales executive by id///////////////////////

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
            },
          },
          { $addFields: { enquiry_date: "$enquiry_details.enquiry_date" } },

          ////showrooms lookup/////////////////
          {
            $lookup: {
              from: "t_000_showrooms_warehouses",
              let: {
                showrooms_warehouse_id:
                  "$enquiry_details.showroom_warehouse_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        "$showrooms_warehouse_id",
                        "$$showrooms_warehouse_id",
                      ],
                    },
                  },
                },
              ],
              as: "showroom",
            },
          },
          {
            $addFields: {
              showroom_warehouse_name: {
                $first: "$showroom.showrooms_warehouse",
              },
            },
          },
          //exclude_fields///////////
          {
            $unset: ["showroom", "salesExecutive", "customer_details"],
          },
        ],
        as: "sales",
      },
    },
  ]);
  if (keywordData) {
    // console.log("sen1306=>", salesData)
    return res.status(200).send(keywordData);
  } else {
    return res.status(200).json([]);
  }
};

/////////////////////////// Ledger BackUp Storage Automation///////////////////////////////////////////////
/// N.B.: Handle with care Danger

console.log("curentDate", moment(moment().endOf('day').format("x"), "x").unix())


//update ledger
cron.schedule('0 11 * * * ', async () => 
// schedule.scheduleJob(rule, async () => 
{
  const startOfToday = moment(moment("2022-12-17").format("x"), "x").unix();
  const endOfToday = moment(moment("2022-12-17").format("x"), "x").unix() + 86399;

  // const startOfToday2 = moment(moment("2022-04-01").format("x"), "x").unix();
  // const endOfToday2 = moment(moment("2022-11-18").format("x"), "x").unix() + 86399;


  // const startOfToday = moment(moment().startOf('day').format("x"), "x").unix();
  // const endOfToday = moment(moment().endOf('day').format("x"), "x").unix();

   //start of day with timezone
  //  const startOfToday = moment().tz('Asia/Calcutta').startOf('day').unix()
  //  const endOfToday = moment().tz('Asia/Calcutta').endOf('day').unix()
  const curentDate = moment(moment().format("MMMM Do YYYY, hh:mm"), "MMMM Do YYYY, hh:mm").unix()
  console.log("curentDate", rule)

  const invoiceData = await sales.aggregate([
    { "$unwind": "$invoice_details" },
    {
      $match:
      {
        $expr: {
          $and: [
            // {$eq:["$customer_id",23210]},
            { $gte: ["$invoice_details.invoice_date", startOfToday] },
            { $lte: ["$invoice_details.invoice_date", endOfToday] },
          ]
        }
      }
    },
    {
      $lookup: {
        from: "t_400_customers",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$customer_id", "$$customer_id"] }, },
          },
          { $project: { "company_name": 1, "_id": 0 } }
        ],
        as: "customer_details"
      },
    },
    { $addFields: { company_name: { $first: "$customer_details.company_name" } } },
    { $unset: ["customer_details"] },
    {
      $project: {
        _id: 0,
        invoice_no: "$invoice_details.invoice_no",
        company_name: 1,
        customer_id: 1,
      }
    },
    ///lookup 1
    {
      $lookup: {
        from: "t_900_sales",
        let: { "invoice_no": "$invoice_no" },
        pipeline: [
          { $unwind: "$invoice_item_details" },

          {
            $match: {
              $expr: {
                $eq: ["$$invoice_no", "$invoice_item_details.invoice_no"],
              },
            }
          },
          {
            $project:
            {
              "invoice_item_details.net_value": 1,
              "invoice_item_details.invoice_no": 1
            }
          },
          {
            $group: {
              _id: "$invoice_item_details.invoice_no",
              netValue: { $sum: { $toDouble: "$invoice_item_details.net_value" } }
            }
          }
        ],
        as: "invoice1"
      }
    },
    {
      $unwind:
      {
        path: "$invoice1",
        preserveNullAndEmptyArrays: true
      }
    },
    { $addFields: { sumInvoiceNetValue: { $sum: { $toDouble: "$invoice1.netValue" } } } },
    { $unset: ["invoice1"] },
    // // //LOOKUP 2////////////////////////////////////////////////////////////////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { "invoice_no": "$invoice_no" },
        pipeline: [
          {
            $unwind:
            {
              path: "$invoice_other_charges",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $eq: ["$$invoice_no", "$invoice_other_charges.invoice_no"],
              },
            }
          },
          {
            $project:
            {
              other_charges_add: {
                $cond: {
                  if: { $eq: ["$invoice_other_charges.charge_type", "+"] },
                  then: { $sum: { $toDouble: "$invoice_other_charges.charge_amount" } },
                  else: 0
                }
              },
              other_charges_minus: {
                $cond: {
                  if: { $eq: ["$invoice_other_charges.charge_type", "-"] },
                  then: { $sum: { $toDouble: "$invoice_other_charges.charge_amount" } },
                  else: 0
                }
              },
            }
          }
        ],
        as: "invoice2"
      }
    },
    ///////////////////////////////////////////////////////////
    // INVOICE VALUE BEING CALCULATED WITH OTHER CHARGES//
    ///////////////////////////////////////////////////////////
    {
      $addFields: {
        netValue: {
          $subtract: [{
            $sum: [{ $toDouble: "$sumInvoiceNetValue" },
            { $sum: "$invoice2.other_charges_add" }]
          },
          { $sum: "$invoice2.other_charges_minus" }]
        }
      }
    },
    { $unset: ["invoice2"] },
    {
      $group: {
        _id: "$customer_id",
        netValue: { $sum: "$netValue" },
        name: { $first: "$company_name" },
        customer_id: { $first: "$customer_id" },

      }
    },
    {
      $lookup: {
        from: 't_200_ledger_accounts',
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$customer_id", "$type_id"]
              }
            }
          },
          {
            $project: {
              _id: 0,
              ledger_account_id: 1,
            }
          }
        ], as: "ledger"
      }
    },
    {
      $addFields: {
        ledgerId: {
          $first: "$ledger.ledger_account_id"
        }
      }
    }
  ])
    .then((res) => {
      console.log(res)
      res.map(async (r, i) => {
        const autoStorage = await storage.findOneAndUpdate(

          { customerId: r.customer_id },
          // { ledgerId: r.ledger_account_id },
          //updated data
          {
            $inc: { "netValue": r.netValue },
            "updatedDate": curentDate,
            "customerId": r._id,
            "ledgerId": r.ledgerId
          },
          {
            upsert: true,
            new: true
          }

        );
        console.log(autoStorage, "check_netvalue")
      })
    })
    console.log(invoiceData)

  // //journal entry


  let ledgerBalanceData = await journal.aggregate(
    [
      { $unwind: "$journal_details" },
      {
        $match: {
          $and: [
            // { "journal_details.ddl_ledger_id": { $eq: 1857 } },
            { "voucher_date": { $gte: startOfToday } },
            { "voucher_date": { $lte: endOfToday } },

          ]
        }
      },
      {
        $project:
        {
          journal_id: 1,
          voucher_date: 1,
          journal_details: 1,
          debit_balance: {
            $cond: {
              if: {
                $and: [{ $in: ["$journal_details.dr_cr", [1]] },
                { $gte: ["$voucher_date", startOfToday] }, { $lt: ["$voucher_date", endOfToday] }]
              },
              then: "$journal_details.amount", else: 0
            }
          },
          credit_balance: {
            $cond: {
              if: {
                $and: [{ $in: ["$journal_details.dr_cr", [2]] },
                { $gte: ["$voucher_date", startOfToday] }, { $lt: ["$voucher_date", endOfToday] }]
              },
              then: "$journal_details.amount", else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: "$journal_details.ddl_ledger_id",
          debit_balance: { $sum: "$debit_balance" },
          credit_balance: { $sum: "$credit_balance" },
          ddl_ledger_id: { $first: "$journal_details.ddl_ledger_id" }
        }
      },
      {
        $addFields: {
          balance: {
            $subtract: ["$credit_balance","$debit_balance",]
          }
        }
      },
      {
        $addFields: {
          status: {
            $cond: {
              if: { $gt: ["$balance", 0] },
              then: "Dr",
              else: "Cr"
            }

          }
        }
      }
    ]
  )
    .then((res) => {
      res.map(async (r, i) => {
        const autoStorage = await storage.findOneAndUpdate(

          // { customerId: r.customer_id },
          { ledgerId: r.ddl_ledger_id },
          //updated data
          {
            $inc: { "closingValue": r.balance },
            "updatedDate": curentDate,
            "ledgerId": r.ddl_ledger_id,
          },
          {
            upsert: true,
            new: true
          }

        );
        console.log(autoStorage, "check_closing")
      })
    })

  // reciept entry

  console.log(ledgerBalanceData)
  let receiptPaymentData = await receipt_payment.aggregate([
    {
      $match: {
        $and: [
          // {"ledger_account_id": {$eq:1857}},
          { "voucher_date": { $gte: startOfToday } },
          { "voucher_date": { $lte: endOfToday } },

        ]
      }
    },
    {
      $project: {
        ledger_account_id: 1,
        amount: 1,
        credit_balance: "$amount"
      }
    },
    {
      $addFields: {
        debit_balance: 0
      }
    },
    {
      $group: {
        _id: "$ledger_account_id",
        credit_balance: { $sum: "$credit_balance" },
        debit_balance: { $first: "$debit_balance" },
        ledger_account_id: { $first: "$ledger_account_id" },
      }
    }
  ])
  .then((res) => {
    res.map(async (r, i) => {
      const autoStorage = await storage.findOneAndUpdate(

        // { customerId: r.customer_id },
        { ledgerId: r.ledger_account_id },
        //updated data
        {
          $inc: { "closingValue": -r.credit_balance },
          "updatedDate": curentDate,
          "ledgerId": r.ledger_account_id,
        },
        {
          upsert: true,
          new: true
        }

      );
      console.log(autoStorage, "check_reg")
    })
  })
},
// {
//   scheduled: true,
//   timezone: "Asia/Kolkata",
// }

)

///////////////////////////////////////////////////////////////////////////////////////////////////////////

const  view_print = async (req, res) => {
  // console.log(req.rawHeader, "rawchecking")
  let condi = { deleted_by_id: 0 };
  const exclude_fields = req.body.exclude_fields
    ? req.body.exclude_fields
    : ["not_applicable_to_exclude"];

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
  const delivery_sales_order_from_date =
    req.body.delivery_sales_order_from_date;
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
  // if (sales_order_no) {
  //     condi = { ...condi, sales_order_no: sales_order_no };
  // }
  if (sales_order_no) {
    condi = { ...condi, sales_order_no: new RegExp(sales_order_no, "i") };
  }

  //Details by delivery order no
  if (delivery_order_no) {
    condi = { ...condi, delivery_order_no: delivery_order_no };
  }

  //Details by dispatch order no
  if (dispatch_order_no) {
    condi = { ...condi, dispatch_order_no: dispatch_order_no };
  }

  if (dispatch_customer) {
    condi = { ...condi, customer_id: dispatch_customer };
  }

  if (bill_no_sales) {
    condi = { ...condi, invoice_no: bill_no_sales };
  }

  // console.log(showroom_warehouse_id,"ssss");

  if (showroom_warehouse_id) {
    condi = {
      ...condi,
      "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id,
    };
  }

  // if (searchQuery) {
  //     condi = {
  //         ...condi,
  //         $or: [
  //             { "enquiry_details.cust_name": searchQuery },
  //             { "enquiry_details.sales_exe_name": searchQuery },
  //             { "enquiry_details.showroom_name": searchQuery },
  //             { enquiry_no: searchQuery },

  //         ],
  //     };
  // }

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
        { "enquiry_details.cust_name": { $regex: searchQuery, $options: "i" } },
        {
          "enquiry_details.sales_exe_name": {
            $regex: searchQuery,
            $options: "i",
          },
        },
        {
          "enquiry_details.showroom_name": {
            $regex: searchQuery,
            $options: "i",
          },
        },
        { "enquiry_details.inv_gross_amount": searchQuery },
        { enquiry_no: { $regex: searchQuery, $options: "i" } },
      ],
    }; // Matching string also compare incase-sensitive
  }

  //keyword search for quotation

  //For quotation
  if (quotation_keyword) {
    condi = {
      ...condi,
      $or: [
        { enquiry_no: { $regex: quotation_keyword, $options: "i" } },
        {
          "enquiry_details.sales_exe_name": {
            $regex: quotation_keyword,
            $options: "i",
          },
        },
        {
          "enquiry_details.cust_name": {
            $regex: quotation_keyword,
            $options: "i",
          },
        },
      ],
    }; // Matching string also compare incase-sensitive
  }

  //key phrase search by sales order

  // if (sales_key_phrase) {
  //     condi = {
  //         ...condi,
  //         $or: [
  //             { enquiry_no: sales_key_phrase },
  //             { quotation_no: sales_key_phrase },
  //             { sales_order_no: sales_key_phrase },
  //             { "enquiry_details.cust_name": sales_key_phrase },

  //         ],
  //     }; // Matching string also compare incase-sensitive
  // }

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

  //both date filter
  if (invoice_date_from && invoice_date_to) {
    condi = {
      ...condi,
      invoice_date: { $gte: invoice_date_from, $lte: invoice_date_to },
    };
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

  console.log("sen1306=>", condi);



  let salesData = await sales.aggregate([
    {
      $unwind: "$enquiry_details",
    },
    {
      $match: condi,
    },

    /////////customer lookup name by id
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
      $addFields: {
        mobile: { $first: "$customer_details.contact_person.txt_mobile" },
      },
    },
    {
      $addFields: {
        email: { $first: "$customer_details.contact_person.txt_email" },
      },
    },
    {
      $addFields: {
        company_name: { $first: "$customer_details.company_name" },
      },
    },

    ////////sales executive by id///////////////////////

    {
      $lookup: {
        from: "users",
        let: { sales_executive_id: "$enquiry_details.sales_executive_id" },
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
         sales_executive_name: { $first: "$salesExecutive.name" } ,
         sales_phone:{$first:"$salesExecutive.mobile"}
        },
    },
    { $addFields: { enquiry_date: "$enquiry_details.enquiry_date" } },

    //uom lookup

    {
      $unwind: {
        path: "$enquiry_item_details",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $lookup: {
        from: "t_100_uoms",
        let: { "uom_id": "$enquiry_item_details.uom_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$uom_id", "$$uom_id"] },
            },
          },
          {
            $project: { "lower_unit_value": 1,lower_caption:1, "higher_unit_value": 1, "_id": 0, "uom_id": 1 },
          },
          {
            $group: {
              _id: "$uom_id",
              lower_unit_value: { $first: "$lower_unit_value" },
              lower_caption:{$first:"$lower_caption"}
            },
          },
        ],
        as: "uom_details",
      },
    },
    {
      $addFields: {
        lower_unit_value: {
          $map: {
            input: "$uom_details.lower_unit_value", 
            as: "value",
            in: { $round: ["$$value"] } 
          }
            
          
        },
        lower_caption:{
          $first:"$uom_details.lower_caption"
        }
      },
    },

 
    
  

    ////showrooms lookup/////////////////
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
    },
    //exclude_fields///////////
    {
      $unset: ["showroom", "salesExecutive",],
    },
   
    {
      $unset: exclude_fields
    },
    {
      $sort: {
        enquiry_no: -1,
      },
    },
    //    {$limit:10},
  ]);
  // .allowDiskUse(true)

  if (salesData) {
    // console.log("sen1306=>", salesData)
    // console.error("No matching documents found in t_100_uoms.")
    return res.status(200).send(salesData);
  } else {
    return res.status(200).json([]);
  }
};

module.exports = {
  view_sales_invoice_agg,
  view_sales_agg,
  keyword_pharse_search,
  keyword_pharse_quotation_search,
  keyword_pharse_sales_search,
  view_print
  // storage2
};
