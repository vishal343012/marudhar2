const router = require("express").Router();
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { apiList } = require("../../config/api");
const { trackChange } = require("../../config/global");
var cron = require("node-cron");
const { sales } = require("../../modals/Sales");

const moment = require("moment");

const { Sales_Report_master } = require("../../modals/Report");
const { storage } = require("../../modals/ledgerStorage");

const reportInsert = async (req, res) => {
  const data = req.body;

  const newReport = await new Sales_Report_master(data).save();

  if (newReport) {
    return res.status(200).json(newReport);
  } else {
    return res.status(200).json([]);
  }
};

// cron.schedule("23 15 * * * ", async () =>
// schedule.scheduleJob(rule, async () =>
const storage2 = async (req, res) => 
{
  const startOfToday = moment(moment("2022-11-30").format("x"), "x").unix();
  const endOfToday =
    moment(moment("2022-12-28").format("x"), "x").unix() + 86399;

  // const startOfToday2 = moment(moment("2022-04-01").format("x"), "x").unix();
  // const endOfToday2 = moment(moment("2022-11-18").format("x"), "x").unix() + 86399;

  // const startOfToday = moment(moment().startOf('day').format("x"), "x").unix();
  // const endOfToday = moment(moment().endOf('day').format("x"), "x").unix();

  //start of day with timezone
  //  const startOfToday = moment().tz('Asia/Calcutta').startOf('day').unix()
  //  const endOfToday = moment().tz('Asia/Calcutta').endOf('day').unix()
  const curentDate = moment(
    moment().format("MMMM Do YYYY, hh:mm"),
    "MMMM Do YYYY, hh:mm"
  ).unix();
  console.log("curentDate/", curentDate);

  const invoiceData = await sales.aggregate([
    { $unwind: "$invoice_details" },
    // { $unwind: "$invoice_item_details" },
    {
      $match: {
        $expr: {
          $and: [
            // {$eq:["$customer_id",23210]},
            { $gte: ["$invoice_details.invoice_date", startOfToday] },
            { $lte: ["$invoice_details.invoice_date", endOfToday] },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        invoice_no: "$invoice_details.invoice_no",
        company_name: 1,
        customer_id: 1,
        reference_id: "$invoice_details.reference_id",
        group_id:"$invoice_details.group_id",
        sales_id:1,

      },
    },
    ///customer///
    {
      $lookup: {
        from: "t_400_customers",
        let: { customer_id: "$customer_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$customer_id", "$$customer_id"] } },
          },
          { $project: { customer_id: 1, company_name: 1, _id: 0 } },
        ],
        as: "customer_details",
      },
    },
    {
      $addFields: {
        customer_name: { $first: "$customer_details.company_name" },
      },
    },
    // { $addFields: { customer_id: { $first: "$customer_details.customer_id" } } },

    { $unset: ["customer_details"] },

    ///referance///
    {
      $lookup: {
        from: "t_300_references",
        let: { reference_id: "$reference_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$reference_id", "$$reference_id"] } },
          },
          { $project: { reference_id: 1, name: 1, _id: 0 } },
        ],
        as: "reference_details",
      },
    },

    {
      $addFields: {
        reference_name: { $first: "$reference_details.name" },
        reference_id: { $first: "$reference_details.reference_id" },
      },
    },

    ///group//
    {
      $lookup: {
        from: "t_200_master_groups",
        let: { group_id: "$group_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$master_group_id", "$$group_id"] } } },
          { $project: { master_group_id: 1, group: 1, _id: 0 } },
        ],
        as: "group_data",
      },
    },
    {
      $addFields: {
        group_name: { $first: "$group_data.group" },
        group_id: { $first: "$group_data.master_group_id" },
      },
    },
    {
      $unset:["group_data","reference_details"]
    },
    ///lookup 1
    {
      $lookup: {
        from: "t_900_sales",
        let: { invoice_no: "$invoice_no" },
        pipeline: [
          { $unwind: "$invoice_item_details" },

          {
            $match: {
              $expr: {
                $eq: ["$$invoice_no", "$invoice_item_details.invoice_no"],
              },
            },
          },
          {
            $project: {
              "invoice_item_details.net_value": 1,
              "invoice_item_details.invoice_no": 1,
            },
          },
          {
            $group: {
              _id: "$invoice_item_details.invoice_no",
              netValue: {
                $sum: { $toDouble: "$invoice_item_details.net_value" },
              },
            },
          },
        ],
        as: "invoice1",
      },
    },
    {
      $unwind: {
        path: "$invoice1",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        sumInvoiceNetValue: { $sum: { $toDouble: "$invoice1.netValue" } },
        //  invoice_no:"$invoice1._id",
      },
    },
    { $unset: ["invoice1"] },
    // // //LOOKUP 2////////////////////////////////////////////////////////////////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { invoice_no: "$invoice_no" },
        pipeline: [
          {
            $unwind: {
              path: "$invoice_other_charges",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $eq: ["$$invoice_no", "$invoice_other_charges.invoice_no"],
              },
            },
          },
          {
            $project: {
              other_charges_add: {
                $cond: {
                  if: { $eq: ["$invoice_other_charges.charge_type", "+"] },
                  then: {
                    $sum: { $toDouble: "$invoice_other_charges.charge_amount" },
                  },
                  else: 0,
                },
              },
              other_charges_minus: {
                $cond: {
                  if: { $eq: ["$invoice_other_charges.charge_type", "-"] },
                  then: {
                    $sum: { $toDouble: "$invoice_other_charges.charge_amount" },
                  },
                  else: 0,
                },
              },
            },
          },
        ],
        as: "invoice2",
      },
    },
    ///////////////////////////////////////////////////////////
    // INVOICE VALUE BEING CALCULATED WITH OTHER CHARGES//
    ///////////////////////////////////////////////////////////
    {
      $addFields: {
        netValue: {
          $subtract: [
            {
              $sum: [
                { $toDouble: "$sumInvoiceNetValue" },
                { $sum: "$invoice2.other_charges_add" },
              ],
            },
            { $sum: "$invoice2.other_charges_minus" },
          ],
        },
      },
    },
    { $unset: ["invoice2"] },

    // {
    //   $project: {
    //     _id: 0,
    //     sales_id: 1,
    //     invoice_no: 1,
    //     customer_id: 1,
    //     customer_name: 1,
    //     group_id: 1,
    //     group_name: 1,
    //     reference_id: 1,
    //     reference_name: 1,
    //     invoice_date: "$invoice_details.invoice_date",
    //     net_value: "$invoice_item_details.net_value",
    //     sumInvoiceNetValue:1,
    //   },
    // },
  ]);

  // console.log(invoiceData, "customerReport");

  // if(invoiceData){
  //   invoiceData.map(async(r)=>{

  //     await new customer_Invoice_report(r).save();
  //   }

  //     )

  // }
  if (invoiceData) {
    return res.status(200).json(invoiceData);
  } else {
    return res.status(200).json([]);
  }
}

const salesPayUpdateStorage = async (req, res) => {
  const ledgerId = req.body.ledgerId;
  const amount = req.body.amount;
  const dr_cr = req.body.dr_cr;

  console.log(ledgerId, amount, dr_cr,"riched")
  const updatedData = await storage.findOneAndUpdate(
    {
      ledgerId: ledgerId,
    },
    [
      {

        $set: {
          //old 20022023
          // closingBalance:
          // {
          //   $switch: {
          //     branches: [
          //       {
          //         case: {
          //           $and: [
          //             { $eq: ["$closeCrDrStatus", "Dr"] },
          //             { $eq: [dr_cr, 1] }
          //           ]
          //         },
          //         then: { $sum: ["$closingBalance", Math.abs(amount)] }
          //       },
          //       {
          //         case: {
          //           $and: [
          //             { $eq: ["$closeCrDrStatus", "Cr"] },
          //             { $eq: [dr_cr, 1] }
          //           ]
          //         },
          //         then: { $sum: ["$closingBalance", -Math.abs(amount)] }
          //       },
          //       {
          //         case: {
          //           $and: [
          //             { $eq: ["$closeCrDrStatus", "Dr"] },
          //             { $eq: [dr_cr, 2] }
          //           ]
          //         },
          //         then: { $sum: ["$closingBalance", -Math.abs(amount)] }
          //       },
          //       {
          //         case: {
          //           $and: [
          //             { $eq: ["$closeCrDrStatus", "Cr"] },
          //             { $eq: [dr_cr, 2] }
          //           ]
          //         },
          //         then: { $sum: ["$closingBalance", Math.abs(amount)] }
          //       },
          //     ],
          //     default: '-' 
          //   }
          // },

          //new21022023
          closingBalance: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$closingBalance", 0]
                  },
                  then: { $sum: ["$closingBalance", Math.abs(amount)] }
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Cr"] },
                      { $ne: ["$closingBalance", 0] }
                    ]
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          //both credit
                          case: { $eq: [dr_cr, 2] },
                          then: { $sum: [{ $abs: "$closingBalance" }, Math.abs(amount)] }
                        },
                        {
                          //
                          case: { $eq: [dr_cr, 1] },
                          then: { $sum: [{ $abs: "$closingBalance" }, -Math.abs(amount)] }
                        }
                      ]
                    }
                  }
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Dr"] },
                      { $ne: ["$closingBalance", 0] }
                    ]
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: [dr_cr, 2] },
                          then: { $sum: [{ $abs: "$closingBalance" }, -Math.abs(amount)] }
                        },
                        {
                          case: { $eq: [dr_cr, 1] },
                          then: { $sum: [{ $abs: "$closingBalance" }, Math.abs(amount)] }
                        }
                      ]
                    }
                  }
                }
              ]
            }
          },
          closeCrDrStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$closingBalance", 0]
                  },
                  then: {
                    $cond: {
                      if: { $eq: [dr_cr, 1] },
                      then: "Dr",
                      else: "Cr"
                    }
                  }
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Cr"] },
                      { $ne: ["$closingBalance", 0] }
                    ]
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: [dr_cr, 2] },
                          then: "Cr"
                        },
                        {
                          case: { $eq: [dr_cr, 1] },
                          then: {
                            $cond: {
                              if: { $gt: [{ $sum: [{ $abs: "$closingBalance" }, -Math.abs(amount)] }, 0] },
                              then: "Cr",
                              else: "Dr"
                            }
                          }
                        }
                      ]
                    }
                  }
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Dr"] },
                      { $ne: ["$closingBalance", 0] }
                    ]
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: [dr_cr, 2] },
                          then: {
                            $cond: {
                              if: { $gt: [{ $sum: [{ $abs: "$closingBalance" }, -Math.abs(amount)] }, 0] },
                              then: "Dr",
                              else: "Cr"
                            }
                          }
                        },
                        {
                          case: { $eq: [dr_cr, 1] },
                          then: "Dr"
                        }
                      ]
                    }
                  }
                }
              ]
            }
          },
          updatedDate:moment(moment().format("x"), "x").unix()
        }
      }
    ]
    ,
    {
      new: true
    }
  )

  if (updatedData) {
    return res.status(200).json(updatedData);
  } else {
    return res.status(200).json([]);
  }
}



const ledgerUpdateStorage = async (req, res) => {
  try {
    const {ledgerId, openCrDrStatus, openingBalance} = req.body;

    console.log(ledgerId, openCrDrStatus, openingBalance, "testttt");

    var previousOpeningBalance = 0;
    var previousClosingBalance = 0;
    var previousOpenCrDrStatus = 0;
    var previousCloseCrDrStatus = 0;
    let closingBalance;
    let closeCrDrStatus;
    let diffBalance = 0;

    const previousData = await storage.aggregate([
      {
        $match: {
          ledgerId:ledgerId
        }
      },
      {
        $project: {
          _id:0,
          ledgerId:1,
          openingBalance:1,
          closingBalance:1,
          openCrDrStatus:1,
          closeCrDrStatus:1
        }
      }
    ]);

    if (previousData.length>0) {
      previousOpeningBalance = previousData[0].openingBalance;
      previousClosingBalance = Math.abs(previousData[0].closingBalance);
      previousOpenCrDrStatus = previousData[0].openCrDrStatus;
      previousCloseCrDrStatus = previousData[0].closeCrDrStatus;
    }
  

    if(previousOpeningBalance>openingBalance) // current opening balance lower then previous opening balance in database than execute
    {
      diffBalance = previousOpeningBalance - openingBalance;
      if((previousOpenCrDrStatus === openCrDrStatus ) && (openCrDrStatus === previousCloseCrDrStatus))
      {
        closingBalance = previousClosingBalance - diffBalance;
        closeCrDrStatus = previousCloseCrDrStatus;
      }
      else if((previousOpenCrDrStatus !== openCrDrStatus ) && (openCrDrStatus !== previousCloseCrDrStatus))
      {
        closingBalance = openingBalance + (previousOpeningBalance - previousClosingBalance);
        closeCrDrStatus = openCrDrStatus;
      }
      else if((previousOpenCrDrStatus !== openCrDrStatus ) && (openCrDrStatus === previousCloseCrDrStatus))
      {
        closingBalance = openingBalance + (previousOpeningBalance + previousClosingBalance);
        closeCrDrStatus = openCrDrStatus;
      }
    }
    else  // current opening balance greater then previous opening balance in database than execute
    {
      diffBalance = openingBalance - previousOpeningBalance;
      if((previousOpenCrDrStatus === openCrDrStatus ) && (openCrDrStatus=== previousCloseCrDrStatus))
      {
        closingBalance = previousClosingBalance + diffBalance;
        closeCrDrStatus = previousCloseCrDrStatus;
      }
      else if((previousOpenCrDrStatus !== openCrDrStatus ) && (openCrDrStatus !== previousCloseCrDrStatus))
      {
        closingBalance = openingBalance + (previousOpeningBalance - previousClosingBalance);
        closeCrDrStatus = openCrDrStatus;
      }
      else if((previousOpenCrDrStatus !== openCrDrStatus ) && (openCrDrStatus === previousCloseCrDrStatus))
      {
        closingBalance = openingBalance + (previousOpeningBalance + previousClosingBalance);
        closeCrDrStatus = openCrDrStatus;
      }
    }

      if(closingBalance<0)
      {
        closingBalance = Math.abs(closingBalance);
        closeCrDrStatus = closeCrDrStatus=='Dr'? 'Cr' : 'Dr';
      }

      const updatedData = await storage.findOneAndUpdate(
        {
          ledgerId: ledgerId
        },
        {
          openCrDrStatus: openCrDrStatus,
          openingBalance: openingBalance,
          closingBalance: closingBalance,
          closeCrDrStatus:closeCrDrStatus
        },
        {
          new: true
        }
      );
   
    if (updatedData) {
      return res.status(200).json(updatedData);
    } else {
      return res.status(200).json([]);
    }
  
    

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


// const salesPayUpdateStorage = async (req, res) => {
//   const ledgerId = req.body.ledgerId
//   const amount = req.body.amount
//   const dr_cr = req.body.dr_cr

//   // const ledgerId = 2540
//   // const amount = 1
//   // const dr_cr = 1

//   console.log(ledgerId, amount, dr_cr)
//   const updatedData = await storage.findOneAndUpdate(
//     {
//       ledgerId: ledgerId,
//     },
//     [
//       {

//         $set: {
//           closingBalance:
//           {
          
//             $switch: {
//               branches: [
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ["$closeCrDrStatus", "Dr"] },
//                       { $eq: [dr_cr, 1] }
//                     ]
//                   },
//                   then: { $sum: ["$closingBalance", amount] }
//                 },
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ["$closeCrDrStatus", "Cr"] },
//                       { $eq: [dr_cr, 1] }
//                     ]
//                   },
//                   then: { $sum: ["$closingBalance", -amount] }
//                 },
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ["$closeCrDrStatus", "Dr"] },
//                       { $eq: [dr_cr, 2] }
//                     ]
//                   },
//                   then: { $sum: ["$closingBalance", -amount] }
//                 },
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ["$closeCrDrStatus", "Cr"] },
//                       { $eq: [dr_cr, 2] }
//                     ]
//                   },
//                   then: { $sum: ["$closingBalance", amount] }
//                 },
//               ],
//               default: '-' 
//             }
//           }
//         }


//       }
//     ]
//     ,
//     {
//       new: true
//     }
//   )
//  if (updatedData) {
//     return res.status(200).json(updatedData);
//   } else {
//     return res.status(200).json([]);
//   }
// }


//old

// const pendingOrderReport = async (req, res) => {
//   let conditionPart = {}
//   let conditionNew = {}

//   const sales_order_no = req.body.sales_order_no
//   const to_date = req.body.txt_to_date
//   const from_date = req.body.txt_from_date
//   const item_id = req.body.item_id

//   if (from_date) {
//     conditionPart = { ...conditionPart, 'sales_order_date': from_date };
//     conditionNew = { ...conditionNew, 'sales_order_date': from_date };

//   }
//   if (to_date) {
//     conditionPart = { ...conditionPart, 'sales_order_date': to_date };
//     conditionNew = { ...conditionNew, 'sales_order_date': to_date };
//   }
//   //both date filter
//   if (from_date && to_date) {
//     conditionPart = {
//       ...conditionPart,
//       'sales_order_date': { '$gte': from_date, '$lte': to_date },
//       sales_status: "25"
//     };
//     conditionNew = {
//       ...conditionNew,
//       'sales_order_date': { '$gte': from_date, '$lte': to_date },
//       sales_status: { "$in": ["New", "24"] }
//     };
//   }

//   if (sales_order_no) {
//     conditionPart = { ...conditionPart, 'sales_order_no': new RegExp(sales_order_no, 'i') };
//     conditionNew = { ...conditionNew, 'sales_order_no': new RegExp(sales_order_no, 'i') };
//   }
//   if (item_id) {
//     conditionPart = { ...conditionPart, 'sales_order_item_details.item_id': item_id };
//     conditionNew = { ...conditionNew, 'sales_order_item_details.item_id': item_id };
//   }
//   const reportData = await sales.aggregate([
//     {
//       $match: conditionPart
//     },
//     { $unwind: "$invoice_item_details" },
//     {
//       $project: {
//         sales_order_date: 1,
//         sales_order_no: { $first: "$sales_order_no" },
//         sales_status: 1,
//         sales_order_item_details: {
//           $filter: {
//             input: "$sales_order_item_details",
//             as: "sales",
//             cond: { $ne: ["$$sales.item_id", "$invoice_item_details.item_id"] }
//           }
//         }
//       }
//     },
//     {
//       $unionWith: {
//         coll: "t_900_sales",
//         pipeline: [
//           { $unwind: "$sales_order_item_details" },

//           {
//             $match: conditionNew
//           },
//           {
//             $project: {
//               sales_order_date: 1,
//               sales_order_no: { $first: "$sales_order_no" },
//               sales_status: 1,
//               sales_order_item_details: 1,
//             }
//           }
//         ]
//       }
//     },
//     {
//       $addFields: {
//         item_id: "$sales_order_item_details.item_id",
//         quantity: "$sales_order_item_details.quantity",
//         rate: "$sales_order_item_details.rate",
//         sales_status: "$sales_status",
//       }
//     },
//     {
//       $unset: "sales_order_item_details"
//     },
//     {
//       $lookup: {
//         from: "t_100_items",
//         let: { "item_id": "$item_id" },
//         pipeline: [

//           {
//             $match: {
//               $expr: { $eq: ["$item_id", "$$item_id"] },
//             },
//           },
//           { $project: { "item": 1, "_id": 0 } }
//         ],
//         as: "item_details"
//       }
//     },
//     {
//       $addFields: {
//         item_name: { $first: "$item_details.item" },
//       },
//     },
//     { $unset: ["item_details"] },
//     {
//       $lookup: {
//         from: "t_900_statuses",
//         let: { "sales_status": "$sales_status" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {

//                 $eq: [{ $toDouble: "$$sales_status" }, "$status_id"]
//               }
//             }
//           },
//           {
//             $project: {
//               status_name: 1
//             }
//           }
//         ], as: "status"
//       }
//     },
//     {
//       $addFields: {
//         status_name: { $first: "$status.status_name" },
//       },
//     },
//     {
//       $unset: "status"
//     },
//     {
//       $sort: {
//         sales_order_no: 1
//       }
//     }
//   ])

//   if (reportData) {

//     console.log(reportData.length)
//     return res.status(200).send(reportData);
//   }
//   else {
//     return res.status(200).json([]);
//   }
// }


//new
const pendingOrderReport = async (req, res) => {
  try {
    let conditionPart = {};
    let conditionNew = {};

    const sales_order_no = req.body.sales_order_no;
    const to_date = req.body.txt_to_date;
    const from_date = req.body.txt_from_date;
    const item_id = req.body.item_id;

    if (from_date) {
      conditionPart = { ...conditionPart, 'sales_order_date': { '$gte': from_date } };
      conditionNew = { ...conditionNew, 'sales_order_date': { '$gte': from_date } };
    }
    if (to_date) {
      conditionPart = { ...conditionPart, 'sales_order_date': { '$lte': to_date } };
      conditionNew = { ...conditionNew, 'sales_order_date': { '$lte': to_date } };
    }
    // both date filter
    if (from_date && to_date) {
      conditionPart = {
        ...conditionPart,
        'sales_order_date': { '$gte': from_date, '$lte': to_date },
        sales_status: "25"
      };
      conditionNew = {
        ...conditionNew,
        'sales_order_date': { '$gte': from_date, '$lte': to_date },
        sales_status: { "$in": ["New", "24"] }
      };
    }

    if (sales_order_no) {
      const salesOrderRegex = new RegExp(sales_order_no, 'i');
      conditionPart = { ...conditionPart, 'sales_order_no': salesOrderRegex };
      conditionNew = { ...conditionNew, 'sales_order_no': salesOrderRegex };
    }
    if (item_id) {
      conditionPart = { ...conditionPart, 'sales_order_item_details.item_id': item_id };
      conditionNew = { ...conditionNew, 'sales_order_item_details.item_id': item_id };
    }

    const reportData = await sales.aggregate([
      { $match: conditionPart },
      { $unwind: "$invoice_item_details" },
      {
        $project: {
          sales_order_date: 1,
          sales_order_no: { $first: "$sales_order_no" },
          sales_status: 1,
          sales_order_item_details: {
            $filter: {
              input: "$sales_order_item_details",
              as: "sales",
              cond: { $ne: ["$$sales.item_id", "$invoice_item_details.item_id"] }
            }
          }
        }
      },
      {
        $unionWith: {
          coll: "t_900_sales",
          pipeline: [
            { $unwind: "$sales_order_item_details" },
            { $match: conditionNew },
            {
              $project: {
                sales_order_date: 1,
                sales_order_no: { $first: "$sales_order_no" },
                sales_status: 1,
                sales_order_item_details: 1,
              }
            }
          ]
        }
      },
      {
        $addFields: {
          item_id: "$sales_order_item_details.item_id",
          quantity: "$sales_order_item_details.quantity",
          rate: "$sales_order_item_details.rate",
          sales_status: "$sales_status",
        }
      },
      { $unset: "sales_order_item_details" },
      {
        $lookup: {
          from: "t_100_items",
          localField: "item_id",
          foreignField: "item_id",
          as: "item_details"
        }
      },
      {
        $addFields: {
          item_name: { $first: "$item_details.item" },
        },
      },
      { $unset: ["item_details"] },
      {
              $lookup: {
                from: "t_900_statuses",
                let: { "sales_status": "$sales_status" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
        
                        $eq: [{ $toDouble: "$$sales_status" }, "$status_id"]
                      }
                    }
                  },
                  {
                    $project: {
                      status_name: 1
                    }
                  }
                ], as: "status"
              }
            },
            {
              $addFields: {
                status_name: { $first: "$status.status_name" },
              },
            },
      { $unset: "status" },
      { $sort: { sales_order_no: 1 } }
    ]);

    if (reportData) {
      console.log(reportData.length);
      return res.status(200).send(reportData);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  reportInsert,
  storage2,
  salesPayUpdateStorage,
  pendingOrderReport,
  ledgerUpdateStorage
};
