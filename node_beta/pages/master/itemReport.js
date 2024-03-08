const router = require("express").Router();
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { apiList } = require("../../config/api");
const { trackChange } = require("../../config/global");
var cron = require("node-cron");
const { sales } = require("../../modals/Sales");

const moment = require("moment");

const { Sales_Report_item } = require("../../modals/Report");

const itemReportInsert = async (req, res) => {
  const data = req.body;

  const newReport = await new Sales_Report_item(data).save();

  if (newReport) {
    return res.status(200).json(newReport);
  } else {
    return res.status(200).json([]);
  }
};

// cron.schedule("23 15 * * * ", async () =>
// schedule.scheduleJob(rule, async () =>
const storage3 = async (req, res) => 
{
  const startOfToday = moment(moment("2022-12-16").format("x"), "x").unix();
  const endOfToday =  moment(moment("2022-12-31").format("x"), "x").unix() + 86399;

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
    { $unwind: "$invoice_item_details" },
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
        invoice_date:"$invoice_details.invoice_date",          
        sales_id:1,        
        item_id:"$invoice_item_details.item_id",
        quantity:"$invoice_item_details.now_dispatch_qty",
        discount:"$invoice_item_details.disc_value",
        rate:"$invoice_item_details.rate",
        gst_value:"$invoice_item_details.gst_value"

      },
    },

//item//
{
    $lookup: {
      from: "t_100_items",
      let: { item_id: "$item_id" },
      pipeline: [
        {
          $match: { $expr: { $eq: ["$item_id", "$$item_id"] } },
        },
        { $project: { 
            item_id: 1, 
            item: 1, 
            brand_id:1,
            uom_id:1,
            _id: 0 
        } },
      ],
      as: "item_details",
    },
  },

    { $unset: ["item_details"] },

  
   

    
   
  
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

//   if(invoiceData){
//     invoiceData.map(async(r)=>{

//        await new Sales_Report_item(r).save();
//     }

//       )

//   }
  if (invoiceData) {
    return res.status(200).json(invoiceData);
  } else {
    return res.status(200).json([]);
  }
}


module.exports = {
    itemReportInsert,
  storage3,
};
