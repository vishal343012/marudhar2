const router = require("express").Router();
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { apiList } = require("../../config/api");

const moment = require("moment");

const { stock_movement, status, sales } = require("../../modals/Sales");
const { item, showrooms_warehouse } = require("../../modals/Master");
const { receipt_payment, journal } = require("../../modals/Account");
const { purchase } = require("../../modals/Purchase");
const { itemStock } = require("../../modals/ledgerStorage");

const stockRegisterList = async (req, res) => {
  const data = req.body;
  const URL = req.url;
  const errors = {};

  const searchQuery = req.body.stock_item;
  const showroom_warehouse = req.body.showroom_warehouse;

  // console.log(req.body,"310405")
  //  console.log(data,"DATA")
  let newMaster = "";
  let condition = {};

  let from_date = 0;
  let to_date = 0;
  let showroom_warehouse_id = 0;
  let item_id = 0;
  let item_name = "";

  if (data && data.from_date > 0) {
    from_date = data.from_date
  }

  else {
    from_date = 1617215400;
  }


  if (data && data.to_date > 0) {
    to_date = data.to_date
  }

  else {
    to_date = moment().unix();
  }


  let cond = { deleted_by_id: 0 };
  let cond2 = {};
  let cond3 = {};

  if (data && data.item_id > 0) {
    { cond = { ...cond, 'item_id': data.item_id } }
  }

  if (data.txt_item) {
    cond = { ...cond, item: data.txt_item };
  }

  if (data.brand_id) {
    cond = { ...cond, brand_id: data.brand_id };
  }

  if (data.category_id) {
    cond = { ...cond, category_id: data.category_id };
  }

  if (data.showroom_warehouse_id) {
    cond2 = { $eq: ["$$stock_by_location.showroom_warehouse_id", Number(data.showroom_warehouse_id)] };
    cond3 = { $eq: ["$showroom_warehouse_id", Number(data.showroom_warehouse_id)] };
  }

  if (data && data.item) {
    item_name = new RegExp(data.item, "i");
    cond = { ...cond, "item": { $regex: item_name } };
  }


  // console.log("31032", cond);
  // console.log("31033",cond3);
  // console.log("from-date", from_date);

  // console.log("31031",cond2)
  // console.log("31032",cond)

  let item_data = await item.aggregate(
    [

      { $match: cond },
      {
        $project:
        { //stock_by_location: 1,
          item_id: 1, item: 1, uom_id: 1,
          stock_by_location: {
            $filter: {
              input: "$stock_by_location", as: "stock_by_location",
              cond: cond2
            }
          },

        }
      },
      //{ $unwind: { path: "$stock_by_location", preserveNullAndEmptyArrays: true} },
      {
        $lookup: {
          from: "t_900_stock_movements",
          localField: 'item_id',
          foreignField: 'item_id',
          //let: { "showroom_warehouse_id": "$stock_by_location.showroom_warehouse_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: cond3 }
                ],
              },
            },

            {
              $project: {
                transaction_id: 1,
                item_id: 1,
                //opening: '$stock_by_location[0].quantity',
                // item_name :'$item_details.item',
                // item_name:itemsById(all_items, 17),

                showroom_warehouse_id: 1,
                // { $filter: {
                //   input: "$showroom_warehouse_id", as: "showroom_warehouse_id",
                //     cond: { $eq: ["$$showroom_warehouse_id", Number(data.showroom_warehouse_id)] }
                //   } 
                // }, 

                unit_id: 1,
                transaction_date: 1,
                Opening_Plus: {
                  $cond: { if: { $and: [{ $in: ["$transaction_type", ["PR", "DR"]] }, { $lt: ["$transaction_date", from_date] }] }, then: "$plus_qty", else: 0 }
                },
                Opening_Minus: {
                  $cond: { if: { $and: [{ $in: ["$transaction_type", ["D"]] }, { $lt: ["$transaction_date", from_date] }] }, then: "$minus_qty", else: 0 }
                },
                purchase: {
                  //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
                  $cond: { if: { $and: [{ $in: ["$transaction_type", ["PR", "DR"]] }, { $gte: ["$transaction_date", from_date] }, { $lte: ["$transaction_date", to_date] }] }, then: "$plus_qty", else: 0 }
                },
                sales: {
                  // $cond: { if: { $in: [ "$transaction_type", ["D"] ] }, then: "$minus_qty", else: 0 }
                  $cond: { if: { $and: [{ $in: ["$transaction_type", ["D"]] }, { $gte: ["$transaction_date", from_date] }, { $lte: ["$transaction_date", to_date] }] }, then: "$minus_qty", else: 0 }
                },
                purchase_return: {
                  //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
                  $cond: { if: { $and: [{ $in: ["$transaction_type", ["RP"]] }, { $gte: ["$transaction_date", from_date] }, { $lte: ["$transaction_date", to_date] }] }, then: "$minus_qty", else: 0 }
                },
                sales_return: {
                  //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
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
                //uomById(all_uom, "$unit_id")
              },
            },
            //},

            //{ $project: { "higher_unit": 1, "_id":0 }}
          ],
          as: "stock_details"
        }
      },
      {
        $unwind: { path: "$stock_details", preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: "t_100_uoms",
          // localField: 'unit_id',
          // foreignField: 'uom_id',
          let: { "uom_id": "$uom_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$uom_id", "$$uom_id"] },
              },
            },

            { $project: { "caption": 1, "_id": 0 } }
          ],
          as: "uom_details"
        }
      },
      {
        $unwind: { path: "$uom_details", preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
          uom_name: "$uom_details.caption",
        },
      },
    ]
  );
  //console.log("starttt");

  if (item_data) {
    return res.status(200).send(item_data);
  }
  else {
    return res.status(200).json([]);
  }
}

const salesOrderBetweenDates = async (from, to) => {
  let results = {};

  results.data = await journal.aggregate(
    [
      {
        $match: {
          $and: [
            { transaction_type: "Sales" },
            { voucher_date: { $gte: from / 1000 } },
            { voucher_date: { $lte: to / 1000 } },

          ]

        }
      }
    ]
  );

  results.totalSales = results.data.reduce(
    (sum, salesRecord) =>
      sum + salesRecord.voucher_amount,
    0


  );
  //console.log("sen27062=>",results)

  return results;
};

// const salesOrderBetweenDates = async (from, to) => {
//   let results = {};

//   results.data = await journal.find({

// voucher_date: {
//       $lte: to / 1000,
//       $gte: from / 1000,
//     },

//   });


//   // results.totalSales = results.data.reduce(
//   //   (sum, salesRecord) =>
//   //     sum +
//   //     salesRecord.invoice_item_details.reduce(
//   //       (sum, itemSold) => sum + itemSold.net_value,
//   //       0
//   //     ),
//   //   0
//   // );
//   // return results;

//   results.totalSales = results.data.reduce(
//     (sum, salesRecord) =>
//       sum + salesRecord.voucher_amount,
//         0


//   );
//   return results;
// };

const receiptsOn = async (from, to, mode, type, bad_type) => {

  let condi = { deleted_by_id: 0 };
  if (mode) {
    if (mode === "Cash") {
      condi = { ...condi, "bank_id": 2867 };
    }
    else {
      condi = { ...condi, "bank_id": { $ne: 2867 } };
    }
  }
  if (from && to) {
    // { $lte: ["$invoice_date", txt_from_date] }
    condi = {
      ...condi,
      "voucher_date":
      {
        $gte: from / 1000,
        $lte: to / 1000,
      }
    };
  }



  let total_cash = await receipt_payment.aggregate([
    {
      $match: condi
    },
    {
      $project: {
        _id: 0,
        mode: 1,
        receipt_payment_type: 1,
        amount: {
          $cond: {
            if: { $eq: ["$receipt_payment_type", type] },
            then: "$amount",
            else: 0
          }
        },
        bad_amount: {
          $cond: {
            if: { $eq: ["$receipt_payment_type", bad_type] },
            then: "$amount",
            else: 0,
          }
        }
      }
    },

    {
      $group: {
        _id: "$mode",
        total_amount: { $sum: "$amount" },
        bad_amount: { $sum: "$bad_amount" },

      }
    }

  ])

  return total_cash;
};


const dashboardStatsReport = async (req, res) => {

  const data = req.body;
  let date = Number(data?.date) > 0 ? Number(data.date) : Date.now();

  let startOfDayTimeStamp = moment().startOf("day").toDate().getTime();
  let endOfDayTimeStamp = moment().endOf("day").toDate().getTime();
  let returnObj = { date, data: {} };

  let sales_order_results = await salesOrderBetweenDates(
    startOfDayTimeStamp,
    endOfDayTimeStamp
  );

  returnObj.data.saleToday = {
    startOfDayTimeStamp,
    endOfDayTimeStamp,
    data: sales_order_results.totalSales,
    //realData: sales_order_results,
    visible: true,
  };

  let startOfWeek =
    moment().startOf("week").toDate().getTime() - 7 * 24 * 3600 * 1000;
  let endOfWeek =
    moment().toDate().getTime();

  let sales_order_results_weekly = await salesOrderBetweenDates(
    startOfWeek,
    endOfWeek
  );

  returnObj.data.saleWeekly = {
    data: sales_order_results_weekly.totalSales,
    startOfWeek,
    endOfWeek,
    visible: true,
  };

  returnObj.data.weeklyDayByDayResults = [];

  for (
    let startOfWeekday = startOfWeek;
    startOfWeekday < endOfWeek;
    startOfWeekday += 24 * 3600000
  ) {
    let endOfWeekDay = startOfWeekday + 24 * 3600000 - 1;
    let weekDayResults = await salesOrderBetweenDates(
      startOfWeekday,
      endOfWeekDay
    );
    returnObj.data.weeklyDayByDayResults.push({
      startOfWeekday,
      endOfWeekDay,
      data: weekDayResults.totalSales,
    });
  }

  let startOfMonth = moment()
    .subtract("months")
    .startOf("month")
    .toDate()
    .getTime();
  let endOfMonth = moment()
  moment().toDate().getTime();


  //console.log(startOfMonth,"monthfrom")
  //console.log( endOfMonth,"monthTo")

  let sales_order_results_monthly = await salesOrderBetweenDates(
    startOfMonth,
    endOfMonth
  );

  returnObj.data.saleMonthly = {
    data: sales_order_results_monthly.totalSales,
    startOfMonth,
    endOfMonth,
    visible: true,
  };

  let quarterAdjustment = (moment().month() % 3) + 1;
  let endOfQuarterMoment = moment()
    .subtract({ months: quarterAdjustment })
    .endOf("month");
  // let endOfQuarter = endOfQuarterMoment.toDate().getTime();

  let endOfQuarter = moment().startOf("day").toDate().getTime();
  let startOfQuarter = endOfQuarterMoment
    .clone()
    .subtract({ months: 0 })
    .startOf("month")
    .toDate()
    .getTime();

  let sales_order_results_quarter = await salesOrderBetweenDates(
    startOfQuarter,
    endOfQuarter
  );


  returnObj.data.saleQuarterly = {
    data: sales_order_results_quarter.totalSales,
    startOfQuarter,
    endOfQuarter,
    visible: true,
  };

  let startOfYear = moment(startOfDayTimeStamp)
    .subtract(1, "years")
    .toDate()
    .getTime();
  let endOfYear = endOfDayTimeStamp;

  let sales_order_results_year = await salesOrderBetweenDates(
    startOfYear,
    endOfYear
  );

  returnObj.data.saleYearly = {
    data: sales_order_results_year.totalSales,
    startOfYear,
    endOfYear,
    visible: true,
  };

  //TODO: to use the sumation of sales value today instead of count. The same logic can be used for week, month, quarter and year

  let visitors_today_results = await sales.find({
    enquiry_details: {
      $elemMatch: {
        enquiry_date: {
          $lte: endOfDayTimeStamp / 1000,
          $gte: startOfDayTimeStamp / 1000,
        },

        // source_id: { $in: [0, 8] }, //TODO Hard coded, else some query needs to be made for the source id walk in
      },
    },
  });

  returnObj.data.visitorsToday = {
    data: visitors_today_results.length,
    //realData: visitors_today_results,
    visible: true,
  };

  //TODO let totalEarningResult = sales.aggregate();
  let cashCollectionInfo = await receiptsOn(
    startOfDayTimeStamp,
    endOfDayTimeStamp,
    "Cash",
    "R",
    "BR",
  );
  returnObj.data.totalCollectionCash = {
    data: cashCollectionInfo[0]?.total_amount,
    startOfDayTimeStamp,
    endOfDayTimeStamp,
  };

  // let pendingOrdersResult = await sales.find({
  //   $and: [
  //     {"delivery_order_no":{$exists:true, $gt:[]}},
  //     {"dispatch_order_no":{$exists:false, $eq:[]}},
  //     // {"$dispatch_order_no.length<1" },
  //   ],
  // });
  // console.log(pendingOrdersResult.length,"por")

  // returnObj.data.pendingOrders = {
  //   data: pendingOrdersResult.length,
  //   visible: true,
  // };

  const currentDateTimestamp = Math.floor(Date.now() / 1000);
  let pendingOrdersResult = await sales.aggregate(
    [
      {
        $match: {
          deleted_by_id: 0,
          sales_order_date: { '$gte': 1680287400, '$lte': currentDateTimestamp },
          sales_status: '24'
        }
      },
      {
        $count: "total_sales"
      }
    ]
  )


  returnObj.data.pendingOrders = {
    data: pendingOrdersResult[0]?.total_sales,
    visible: true,
  };

  //TODO: fix
  let bankCollectionInfo = await receiptsOn(
    startOfDayTimeStamp,
    endOfDayTimeStamp,
    "Bank",
    "R",
    "BR",
  );
  returnObj.data.totalCollectionBank = {
    data: bankCollectionInfo,
    startOfDayTimeStamp,
    endOfDayTimeStamp,
  };

  return res.status(200).json(returnObj);
};



const stockRegisterOpening = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const showroom_warehouse_id = req.body.showroom_warehouse_id
  const item_id = req.body.item_id;
  const items = req.body.item
  //for invoice search
  const txt_from_date = req.body.txt_from_date;
  const brand_id = req.body.brand_id;
  const category_id = req.body.category_id;

  if (item_id) {
    condi = { ...condi, "item_id": item_id };
  }
  if (items) {
    condi = { ...condi, item: { $regex: items, $options: "i" } }
  }
  if (brand_id) {
    condi = { ...condi, brand_id: brand_id }
  }
  if (category_id) {
    condi = { ...condi, category_id: category_id }
  }

  //console.log("sen09/show=>", txt_from_date)
  let stockRegisterOpening = await item.aggregate([

    {
      $match: condi,
    },
    {
      $project:
      {
        item_id: 1, item: 1, uom_id: 1,
        stock_by_location: {
          $cond: {
            if: req.body.showroom_warehouse_id,
            then: {
              $filter: {
                input: "$stock_by_location", as: "stock_by_location",
                cond: { $eq: ["$$stock_by_location.showroom_warehouse_id", req.body.showroom_warehouse_id] }
              }
            },
            else: "$stock_by_location"
          }
        }
      }
    },
    {
      $addFields: {
        showroom_warehouse_id: showroom_warehouse_id
      }
    },
    ////////////////////lookup with sales/////////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$invoice_item_details"
            }
          },
          {
            $unwind: {
              path: "$invoice_details"
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: showroom_warehouse_id,
                  then: {
                    $and:
                      [
                        { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                        { $eq: ["$invoice_item_details.showroom_warehouse_id", showroom_warehouse_id] },
                        { $lte: ["$invoice_details.invoice_date", txt_from_date] },
                        { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },

                      ]
                  },
                  else: {
                    $and:
                      [
                        { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                        // { $lte: ["$invoice_date", txt_from_date] } old
                        { $lte: ["$invoice_details.invoice_date", txt_from_date] },
                        { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] }

                      ]
                  }
                }

                // $or: [
                //   {
                //     $and:
                //       [
                //         { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                //         { $eq: ["$invoice_item_details.showroom_warehouse_id", req.body.showroom_warehouse_id] },
                //         { $lte: ["$invoice_date", txt_from_date] }
                //       ]
                //   },
                //   {
                //     $and:
                //       [
                //         { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                //         { $lte: ["$invoice_date", txt_from_date] }
                //       ]
                //   }
                // ]
              }
            },
          },
          {
            $project: {
              "_id": 0,
              item_id: "$invoice_item_details.item_id",
              qty: "$invoice_item_details.now_dispatch_qty",
            }
          },
          {
            $group: {
              _id: "$item_id",
              sales: { $sum: "$qty" }
            }
          }
        ], as: "sales"
      }
    },
    /////////////lookup purchase direct purchse////////////////////
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {

                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $cond: {
                      if: showroom_warehouse_id,
                      then: {
                        $and:
                          [
                            { $eq: ["$item_details.item_id", "$$item_id"] },
                            { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                            { $gt: ["$approve_id", 0] },
                            { $lt: ["$approved_by_date", txt_from_date] }
                          ]
                      },
                      else: {
                        $and: [
                          { $eq: ["$item_details.item_id", "$$item_id"] },
                          { $gt: ["$approve_id", 0] },
                          { $lt: ["$approved_by_date", txt_from_date] }
                        ]
                      }
                    }
                    // $or: [
                    //   {
                    //     $and: [
                    //       { $eq: ["$item_details.item_id", "$$item_id"] },
                    //       { $gt: ["$approve_id", 0] },
                    //       { $lte: ["$inserted_by_date", txt_from_date] }
                    //     ]
                    //   },
                    //   {
                    //     $and: [
                    //       { $eq: ["$item_details.item_id", "$$item_id"] },
                    //       { $eq: ["$showroom_warehouse_id", req.body.showroom_warehouse_id] },
                    //       // { $ne: ["$approve_id", 0] },
                    //       // { $lte: ["$inserted_by_date", txt_from_date] }
                    //     ]
                    //   }
                    // ]

                  },
                  else: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                      { $lte: ["$approved_by_date", txt_from_date] }
                    ]
                  }
                }
              }
            },
          },
          {
            $project: {
              // moudle: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then:
                    "$item_details.item_id",
                  else: "$received_item_details.item_id"
                }
              },
              qty: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.quantity",
                  else: "$received_item_details.receivedQty"
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.net_value",
                  else: "$received_item_details.net_value"
                }
              },
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: "$qty" },
              net_value: { $sum: "$net_value" },
            }
          }
        ], as: "direct_purchase"
      }
    },
    //////////////////lookup purchase for item receved
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {

                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: {
                    $cond: {
                      if: showroom_warehouse_id,
                      then: {
                        $and: [
                          { $eq: ["$received_item_details.item_id", "$$item_id"] },
                          { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                          { $lte: [{ $divide: ["$inserted_by_date", 1000] }, txt_from_date] }
                        ]
                      },
                      else: {
                        $and: [
                          { $eq: ["$received_item_details.item_id", "$$item_id"] },

                          { $lte: [{ $divide: ["$inserted_by_date", 1000] }, txt_from_date] }
                        ]
                      }
                    }
                  },
                  else: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                      { $lte: [{ $divide: ["$inserted_by_date", 1000] }, txt_from_date] }
                    ]
                  }
                }
              }
            },
          },
          {
            $project: {
              // moudle: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then:
                    "$received_item_details.item_id",
                  else: 0
                }
              },
              qty: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.receivedQty",
                  else: 0
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.net_value",
                  else: 0
                }
              },
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: { $toDouble: "$qty" } },
              net_value: { $sum: "$net_value" },

            }
          }
        ], as: "itemrReceved_purchase"
      }
    },

    ///////////sales return lookup////////////////////
    // {
    //   $lookup: {
    //     from: "t_900_sales_returns",
    //     let: { "item_id": "$item_id" },
    //     pipeline: [
    //       {
    //         $unwind:
    //         {
    //           path: "$dispatch_return_item_details",
    //           preserveNullAndEmptyArrays: true
    //         }
    //       },
    //       {
    //         $match: {
    //           $expr:
    //           {
    //             $cond: {
    //               if: showroom_warehouse_id,
    //               then: {
    //                 $and:
    //                   [
    //                     { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
    //                     { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
    //                     { $lt: ["$sales_return_date", txt_from_date] }
    //                   ]
    //               },
    //               else: {
    //                 $and:
    //                   [
    //                     { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
    //                     { $lt: ["$sales_return_date", txt_from_date] }
    //                   ]
    //               }
    //             }
    //             // $or: [
    //             //   {
    //             //     $and:
    //             //       [
    //             //         { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
    //             //         { $lte: ["$sales_return_date", txt_from_date] }
    //             //       ]
    //             //   },
    //             //   {
    //             //     $and:
    //             //       [
    //             //         { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
    //             //         { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
    //             //         { $lte: ["$sales_return_date", txt_from_date] }
    //             //       ]
    //             //   }
    //             // ]

    //           }
    //         },
    //       },
    //       {
    //         $project: {
    //           item_id: "$dispatch_return_item_details.item_id",
    //           sales_return: "$dispatch_return_item_details.actualRetrun"
    //         }
    //       },
    //       {
    //         $group:
    //         {
    //           _id: "$item_id",
    //           sales_return: { $sum: "$sales_return" }
    //         }
    //       }
    //     ], as: "sales_return"
    //   }
    // },

    {
      $lookup: {
        from: "t_900_sales_returns",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$dispatch_return_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $and:
                  [
                    { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
                    { $gte: ["$sales_return_date", txt_from_date] },
                    // { $lte: ["$sales_return_date", txt_from_date] },
                    { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                  ]
              }
            },
          },
          {
            $project: {
              item_id: "$dispatch_return_item_details.item_id",
              sales_return: "$dispatch_return_item_details.actualRetrun"
            }
          },
          {
            $group:
            {
              _id: "$item_id",
              sales_return: { $sum: "$sales_return" }
            }
          }
        ], as: "sales_return"
      }
    },
    // ///////////////////////purchase return//////////////////////////
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { "item_id": "$item_id" },
        pipeline: [

          {
            $unwind:
            {
              path: "$return_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind:
            {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: showroom_warehouse_id,
                  then: {
                    $and:
                      [
                        { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                        { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                        { $lt: ["$purchase_return_date", txt_from_date] }
                      ]
                  },
                  else: {
                    $and:
                      [
                        { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                        { $lt: ["$purchase_return_date", txt_from_date] }
                      ]
                  }
                }
                // $or: [
                //   {
                //     $and:
                //       [
                //         { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                //         { $lte: ["$purchase_return_date", txt_from_date] }
                //       ]
                //   },
                //   {
                //     $and:
                //       [
                //         { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                //         { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                //         { $lte: ["$purchase_return_date", txt_from_date] }
                //       ]
                //   }
                // ]

              }
            },
          },
          {
            $project: {
              item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty",
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase_return: { $sum: "$purchase_return" },
            }
          }
        ], as: "purchase_return"
      }
    },
    ///Stock transfer from lookup
    {
      $lookup: {
        from: 't_900_stock_transfers',
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                  { $eq: ["$from_showroom_warehouse_id", showroom_warehouse_id] },
                  { $lt: ["$stock_transfer_date", txt_from_date] },
                  // { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              from_showroom_warehouse_id: 1,
              to_showroom_warehouse_id: 1,
              stock_transfer_date: 1,
              stock_transfer_no: 1,
              stock_transfer_id: 1
            }
          }
        ], as: 'stock_transfer_from'
      }
    },
    {
      $addFields: {
        sumTransfer: { $sum: "$stock_transfer_from.quantity" }
      }
    },
    ///Stock transfer to lookup
    {
      $lookup: {
        from: 't_900_stock_transfers',
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                  { $eq: ["$to_showroom_warehouse_id", showroom_warehouse_id] },
                  { $lt: ["$stock_transfer_date", txt_from_date] },
                  // { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              from_showroom_warehouse_id: 1,
              to_showroom_warehouse_id: 1,
              stock_transfer_date: 1,
              stock_transfer_no: 1,
              stock_transfer_id: 1
            }
          }
        ], as: 'stock_transfer_to'
      }
    },
    {
      $addFields: {
        sumReceived: { $sum: "$stock_transfer_to.quantity" }
      }
    },

    ///waste Quantity lookup///

    {
      $lookup: {
        from: "t_000_wastes",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$waste_item_id", "$$item_id"] },
                  // { $eq: ["$convertedToId", "$$item_id"] },
                  // { $eq: ["$to_showroom_warehouse_id", showroom_warehouse_id] },
                ],
              },
            },
          },
          {
            $project: {
              quantity: 1,
              // convertedQty: 1,
              waste_item_id: 1,
              // convertedToId:1,
            },
          },
          {
            $group: {
              _id: "$waste_item_id",
              waste_qty: { $sum: "$quantity" },
              // convertedQty:{$sum:"$convertedQty"}
            },
          },
        ],
        as: "waste_qty",
      },
    },

    {
      $addFields: {
        sumWaste: { $sum: "$waste_qty.waste_qty" },
      },
    },

    /////waste Converted Quantity lookUp////


    {
      $lookup: {
        from: "t_000_wastes",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$convertedToId", "$$item_id"] }],
              },
            },
          },
          {
            $project: {
              convertedQty: 1,
              convertedToId: 1,
            },
          },
          {
            $group: {
              _id: "$convertedToId",
              convertedQty: { $sum: "$convertedQty" },
            },
          },
        ],
        as: "waste_convert_qty",
      },
    },

    {
      $addFields: {
        sumWasteConvertQty: { $sum: "$waste_convert_qty.convertedQty" },
      },
    },




    {
      $unwind:
      {
        path: "$sales",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$direct_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$sales_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$stock_by_location",
        preserveNullAndEmptyArrays: true
      }
    },
    //opening Calculation//////////
    {
      $addFields: {
        sumPurchase: { $sum: ["$direct_purchase.purchase", "$itemrReceved_purchase.purchase"] },
        sumNetValue: { $sum: ["$direct_purchase.net_value", "$itemrReceved_purchase.net_value"] },

      }
    },
    {
      $addFields: {
        sumOpeningPlus:
        {
          $subtract: [
            {
              $sum: [
                "$sumPurchase", "$sales_return.sales_return", "$sumWasteConvertQty"
              ]
            },
            {
              $sum: [
                "$sales.sales", "$purchase_return.purchase_return", "$sumWaste"
              ]
            }
          ]

        }
      }
    },
    // {
    //   $unset: [
    //     // "stock_by_location",
    //     "sales",
    //     //  "direct_purchase", "itemrReceved_purchase", "purchase_return", "sales_return"
    //   ]
    // },

    {
      $group: {
        _id: "$item_id",
        item_id: { $first: "$item_id" },
        showroom_warehouse_id: { $first: "$showroom_warehouse_id" },
        sumOpeningPlus: { $first: "$sumOpeningPlus" },
        stock_by_location: { $addToSet: "$stock_by_location" },
        sumTransfer: { $first: "$sumTransfer" },
        sumReceived: { $first: "$sumReceived" },
        sumPurchase: { $first: "$sumPurchase" },
        sumPurchaseNetValue: { $first: "$sumNetValue" },
        sumWaste: { $first: "$sumWaste" },
        sumWasteConvertQty: { $first: "$sumWasteConvertQty" }
        // stockTransferDetails: { $first: "$stock_transfer_from" },
        // stockRecivedDetails: { $first: "$stock_transfer_to" },
      }
    },
    {
      $sort: { "_id": 1 }
    }

  ])

  //console.log("ramram", stockRegisterOpening)
  if (stockRegisterOpening) {
    // console.log("sen27/check2", stockRegisterOpening)
    return res.status(200).send(stockRegisterOpening);
  }
  else {
    return res.status(200).json([]);
  }
};


/// avg. calculation ////
const view_avg_stock = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  // const from_date = req.body.from_date;
  // const to_date = req.body.to_date;
  // const item_id = req.body.item_id;
  const item_id = '';
  const from_date = 165595823;
  const to_date = 1654492823;



  if (item_id) {
    condition = { ...condition, "item_id": item_id };
  }
  let cond2 = {};
  let cond3 = {};

  ////item aggregation
  // let closing_stock_data = await item.aggregate
  //   (
  //     [
  //       { $match: condition },
  //       {
  //         $project:
  //         {
  //           inserted_by_date: 1,
  //           item_id: 1,
  //         }
  //       },

  //       // /////////////direct purchase lookup////////////////////
  //       {
  //         $lookup: {
  //           from: "t_800_purchases",
  //           let: { "item_id": "$item_id" },
  //           pipeline: [
  //             {
  //               $unwind:
  //               {
  //                 path: "$item_details",
  //                 preserveNullAndEmptyArrays: true
  //               }
  //             },
  //             {
  //               $match: {
  //                 $expr:
  //                 {
  //                   $cond: {
  //                     if: { $in: ["$module", ["DIRECT PURCHASE"]] },
  //                     then: {
  //                       $and: [
  //                         { $eq: ["$item_details.item_id", "$$item_id"] },
  //                         { $ne: ["$approve_id", 0] },

  //                       ]
  //                     },
  //                     else: {
  //                       $and: [
  //                         { $eq: ["$received_item_details.item_id", "$$item_id"] },

  //                       ]
  //                     }
  //                   }
  //                 }
  //               },

  //             },
  //             {
  //               $project: {

  //                 item_id: {
  //                   $cond: {
  //                     if: { $in: ["$module", ["DIRECT PURCHASE"]] },
  //                     then: "$item_details.item_id",
  //                     else: "$received_item_details.item_id"
  //                   }
  //                 },
  //                 quantity: {

  //                   $cond: {
  //                     if: { $in: ["$module", ["DIRECT PURCHASE"]] },
  //                     then: "$item_details.quantity",
  //                     else: "$received_item_details.receivedQty"
  //                   }
  //                 },
  //                 rate: {
  //                   $cond: {
  //                     if:
  //                     {
  //                       $in: ["$module", ["DIRECT PURCHASE"]]
  //                     },
  //                     then: "$item_details.rate",
  //                     else: "$received_item_details.rate"
  //                   }
  //                 },

  //               }
  //             },

  //             // {
  //             //   $group: {
  //             //     _id: "$inserted_by_date",
  //             //     quantity: { $sum: "$quantity" },
  //             //     rate: { $sum: "$rate" },


  //             //   }
  //             // },
  //           ],
  //           as: "purchase_details"
  //         }
  //       },


  //       //////////////////lookup purchase for item receved////\\\\\\\
  //       {
  //         $lookup: {
  //           from: "t_800_purchases",
  //           let: { "item_id": "$item_id" },
  //           pipeline: [
  //             {
  //               $unwind:
  //               {
  //                 path: "$received_item_details",
  //                 preserveNullAndEmptyArrays: true
  //               }
  //             },
  //             {
  //               $match: {
  //                 $expr:
  //                 {
  //                   $cond: {
  //                     if: { $in: ["$module", ["ITEMRECEIVED"]] },
  //                     then: {
  //                       $and: [
  //                         { $eq: ["$received_item_details.item_id", "$$item_id"] },

  //                         { $ne: ["$approve_id", 0] },


  //                       ]
  //                     },
  //                     else: {
  //                       $and: [
  //                         { $eq: ["$item_details.item_id", "$$item_id"] },

  //                       ]
  //                     }
  //                   }
  //                 }
  //               },
  //             },
  //             {
  //               $project: {
  //                 //moudle: 1,
  //                 item_id: {
  //                   $cond: {
  //                     if: { $in: ["$module", ["ITEMRECEIVED"]] },
  //                     then:
  //                       "$received_item_details.item_id",
  //                     else: "$item_details.item_id"
  //                   }
  //                 },
  //                 quantity: {

  //                   $cond: {
  //                     if: { $in: ["$module", ["ITEMRECEIVED"]] },
  //                     then: "$received_item_details.receivedQty",
  //                     else: "$item_details.quantity"
  //                   }
  //                 },
  //                 rate: {
  //                   $cond: {
  //                     if:
  //                     {
  //                       $in: ["$module", ["ITEMRECEIVED"]]
  //                     },
  //                     then: "$received_item_details.rate",
  //                     else: "$item_details.rate"
  //                   }
  //                 },
  //               }
  //             },
  //             // {
  //             //   $group: {
  //             //     _id: "$inserted_by_date",
  //             //     quantity: { $sum: { $toDouble: "$quantity" } },
  //             //     rate: { $sum: "$rate" },
  //             //   }
  //             // },
  //           ], as: "itemReceived_purchase"
  //         }
  //       },
  //       {
  //         $unwind:
  //         {
  //           path: "$purchase_details",
  //           preserveNullAndEmptyArrays: true
  //         }
  //       },
  //       {
  //         $unwind:
  //         {
  //           path: "$itemReceived_purchase",
  //           preserveNullAndEmptyArrays: true
  //         }
  //       },
  //       // {
  //       //   $addFields: {
  //       //     SumQuantity: {
  //       //       $sum: ["$purchase_details.quantity", "$itemReceived_purchase.quantity"]
  //       //     }
  //       //   },

  //       // },
  //       // {
  //       //   $addFields: {
  //       //     SumRate: {
  //       //       $sum: ["$purchase_details.rate", "$itemReceived_purchase.rate"]
  //       //     }
  //       //   },


  //       // },
  //       // {
  //       //   $group: {
  //       //     _id: null,
  //       //     SumQuantity: { $sum: "$SumQuantity" },
  //       //     SumRate: { $sum: "$SumRate" },
  //       //   }
  //       // },


  //     ]
  //   );
  let closing_stock_data = await purchase.aggregate([
    {
      $unwind:
      {
        path: "$item_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $match: {
        $expr:
        {
          $and: [
            { $in: ["$module", ["DIRECT PURCHASE"]] },
            { $ne: ["$approve_id", 0] },

          ]
        }
      },

    },
    {
      $project: {

        item_id: {
          $cond: {
            if: { $in: ["$module", ["DIRECT PURCHASE"]] },
            then: "$item_details.item_id",
            else: "$received_item_details.item_id"
          }
        },
        quantity: {

          $cond: {
            if: { $in: ["$module", ["DIRECT PURCHASE"]] },
            then: "$item_details.quantity",
            else: "$received_item_details.receivedQty"
          }
        },
        rate: {
          $cond: {
            if:
            {
              $in: ["$module", ["DIRECT PURCHASE"]]
            },
            then: "$item_details.rate",
            else: "$received_item_details.rate"
          }
        },
        module: 1,
        grn_no: { $first: "$grn_details.grn_no" },
        grn_date: { $first: "$grn_details.grn_date" },
        vendor_id: 1,
        approve_id: 1,
        check: "purchase",
      }
    },
    {
      $unionWith: {
        coll: "t_800_purchases",
        pipeline: [
          {
            $unwind:
            {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $and: [
                  { $in: ["$module", ["ITEMRECEIVED"]] },
                  { $ne: ["$approve_id", 0] },
                ]
              }
            },
          },
          {
            $project: {
              vendor_id: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then:
                    "$received_item_details.item_id",
                  else: "$item_details.item_id"
                }
              },
              quantity: {

                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.receivedQty",
                  else: "$item_details.quantity"
                }
              },
              rate: {
                $cond: {
                  if:
                  {
                    $in: ["$module", ["ITEMRECEIVED"]]
                  },
                  then: "$received_item_details.rate",
                  else: "$item_details.rate"
                }
              },
              module: 1,
              grn_no: { $first: "$grn_details.grn_no" },
              grn_date: { $first: "$grn_details.grn_date" },
              approve_id: 1,
              check: "purchase",
            }
          },
        ]
      }
    },
    {
      $group: {
        _id: "$check",
        SumQuantity: { $sum: "$quantity" },
        SumRate: { $sum: "$rate" },

      }
    }
  ])

  if (closing_stock_data) {
    return res.status(200).send(closing_stock_data);
  }
  else {
    return res.status(200).json([]);
  }
}



////closing Stock calculation\/////////////////////////
const stockRegisterClosingStock = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  // const showroom_warehouse_id = req.body.showroom_warehouse_id
  const item_id = req.body.item_id;
  // const item_id = 65;
  const showroom_warehouse_id = 15

  //for invoice search
  // const txt_from_date = req.body.date_from;
  // const txt_to_date = req.body.date_to;

  const txt_from_date = 1754667701898;


  if (item_id) {
    condi = { ...condi, "invoice_item_details.item_id": item_id };
  }

  let stockRegisterClosing = await item.aggregate([
    {
      $project:
      {
        // stock_by_location: 1,
        item_id: 1, item: 1, uom_id: 1,
        stock_by_location: {
          $filter: {
            input: "$stock_by_location", as: "stock_by_location",
            cond: { $eq: ["$$stock_by_location.showroom_warehouse_id", Number(showroom_warehouse_id)] }
          }
        },
      }
    },
    ////////////////////lookup with sales/////////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$invoice_item_details"
            }
          },
          {
            $match: {
              $expr:
              {
                $and:
                  [
                    // { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                    { $lte: ["$invoice_date", txt_from_date] }
                  ]
              }
            },
          },
          {
            $project: {
              // "_id": 0,
              // item_id: "$invoice_item_details.item_id",
              qty: "$invoice_item_details.now_dispatch_qty",
            }
          },
          {
            $group: {
              _id: 0,
              sales: { $sum: "$qty" }
            }
          }
        ], as: "sales"
      }
    },
    /////////////lookup purchase direct purchse////////////////////
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      // { $eq: ["$item_details.item_id", "$$item_id"] },
                      { $ne: ["$approve_id", 0] },
                      { $lte: ["$inserted_by_date", txt_from_date] }
                    ]
                  },
                  else: {
                    $and: [
                      // { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $lte: ["$inserted_by_date", txt_from_date] }
                    ]
                  }
                }
              }
            },
          },
          {
            $project: {
              "_id": 0,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then:
                    "$item_details.item_id",
                  else: "$received_item_details.item_id"
                }
              },
              qty: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.quantity",
                  else: "$received_item_details.receivedQty"
                }
              },
            }
          },
          {
            $group: {
              _id: 0,
              purchase: { $sum: "$qty" }
            }
          }
        ], as: "direct_purchase"
      }
    },
    //////////////////lookup purchase for item receved
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      // { $eq: ["$item_details.item_id", "$$item_id"] },

                      { $ne: ["$approve_id", 0] },

                      { $lte: ["$inserted_by_date", txt_from_date] }
                    ]
                  },
                  else: {
                    $and: [
                      // { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $lte: ["$inserted_by_date", txt_from_date] }
                    ]
                  }
                }
              }
            },
          },
          {
            $project: {

              purchase: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: 0,
                  else: "$received_item_details.receivedQty"
                }
              },
            }
          },
          {
            $group: {
              _id: 0,
              purchase: { $sum: { $toDouble: "$purchase" } }
            }
          }
        ], as: "itemrReceved_purchase"
      }
    },
    /////////////sales return lookup////////////////////
    {
      $lookup: {
        from: "t_900_sales_returns",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$dispatch_return_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $and:
                  [
                    // { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
                    { $lte: ["$sales_return_date", txt_from_date] }
                  ]
              }
            },
          },
          {
            $project: {
              item_id: "$dispatch_return_item_details.item_id",
              sales_return: "$dispatch_return_item_details.actualRetrun"
            }
          },
          {
            $group:
            {
              _id: 0,
              sales_return: { $sum: "$sales_return" }
            }
          }
        ], as: "sales_return"
      }
    },
    ///////////////////////purchase return//////////////////////////
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { "item_id": "$item_id" },
        pipeline: [

          {
            $unwind:
            {
              path: "$return_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind:
            {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $and:
                  [
                    // { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                    { $lte: ["$purchase_return_date", txt_from_date] }
                  ]
              }
            },
          },
          {
            $project: {
              // item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty",
            }
          },
          {
            $group: {
              _id: 0,
              purchase_return: { $sum: "$purchase_return" },
            }
          }
        ], as: "purchase_return"
      }
    },
    {
      $unwind:
      {
        path: "$sales",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$direct_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$sales_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$stock_by_location",
        preserveNullAndEmptyArrays: true
      }
    },
    ////opening Calculation//////////
    {
      $addFields: {
        sumPurchase: { $sum: ["$direct_purchase.purchase", "$itemrReceved_purchase.purchase"] }
      }
    },
    {
      $addFields: {
        sumOpeningPlus:
        {
          $subtract: [
            {
              $sum: [
                { $toDouble: "$stock_by_location.quantity" }, "$sumPurchase", "$sales_return.sales_return"
              ]
            },
            {
              $sum: [
                "$sales.sales", "$purchase_return.purchase_return"
              ]
            }
          ]

        }
      }
    },
    { $unset: ["stock_by_location", "sales", "direct_purchase", "itemrReceved_purchase", "purchase_return", "sales_return"] },

    {
      $group: {
        _id: 0,
        sumClosingStock: { $first: "$sumOpeningPlus" },
      }
    },

  ])

  if (stockRegisterClosing) {
    return res.status(200).send(stockRegisterClosing);
  }
  else {
    return res.status(200).json([]);
  }
};

////Stock Transaction calculation\/////////////////////////
const stockRegisterTransaction = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const showroom_warehouse_id = req.body.showroom_warehouse_id
  const item_id = req.body.item_id;
  const items = req.body.item;
  // /const items = req.body.item;
  const brand_id = req.body.brand_id;
  const category_id = req.body.category_id;
  //for invoice search
  const txt_from_date = req.body.date_from;
  const txt_to_date = req.body.date_to;
  // const txt_from_date = 1648751400;
  // const txt_to_date = 1655490599;


  // if (item_id) {
  //   condi = { ...condi, "item_id": item_id };
  // }
  if (items) {
    condi = { ...condi, item: { $regex: items, $options: "i" } }
  }

  if (brand_id) {
    condi = { ...condi, brand_id: brand_id }
  }
  if (category_id) {
    condi = { ...condi, category_id: category_id }
  }
  console.log("sen1706=>1", txt_from_date)
  console.log("sen1706=>2", txt_to_date)

  let stockRegisterTransaction = await item.aggregate([
    {
      $match: condi,
    },
    {
      $project:
      {
        item_id: 1,
        item: 1,
        uom_id: 1,
        stock_by_location: {
          $filter: {
            input: "$stock_by_location", as: "stock_by_location",
            cond: { $eq: ["$$stock_by_location.showroom_warehouse_id", Number(showroom_warehouse_id)] }
          }
        },
      }
    },

    ////////////////////lookup with sales/////////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: {
          "item_id": "$item_id",

        },

        pipeline: [
          {
            $unwind: {
              path: "$invoice_item_details"
            }
          },
          {
            $unwind: {
              path: "$invoice_details"
            }
          },
          {
            $match: {
              $expr:
              {
                $and:
                  [
                    { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                    { $eq: ["$invoice_item_details.showroom_warehouse_id", showroom_warehouse_id] },
                    { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                    { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                    { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] }
                    // { $gte: [{ $divide: ["$invoice_date", 1000] }, txt_from_date] },
                    // { $lte: [{ $divide: ["$invoice_date", 1000] }, txt_to_date] }
                  ]
              }
            },
          },
          {
            $project: {
              "_id": 0,
              item_id: "$invoice_item_details.item_id",
              qty: "$invoice_item_details.now_dispatch_qty",
              invoice_no: "$invoice_item_details.invoice_no",
              invoice_dt: "$invoice_details.invoice_date"
            }
          },
          {
            $group: {
              _id: "$item_id",
              sales: { $sum: "$qty" }
            }
          }
        ], as: "sales"
      }
    },

    /////////////lookup purchase direct purchse////////////////////
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind:
            {
              path: "$grn_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      { $eq: ["$item_details.item_id", "$$item_id"] },
                      { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                      { $ne: ["$approve_id", 0] },
                      { $gte: ["$grn_details.grn_date", txt_from_date] },
                      { $lte: ["$grn_details.grn_date", txt_to_date] }
                    ]
                  },
                  else: 0
                }
              }
            },
          },
          {
            $unset: "grn_details"
          },
          {
            $project: {
              // moudle: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then:
                    "$item_details.item_id",
                  else: 0
                }
              },
              qty: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.quantity",
                  else: 0
                }
              },
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: "$qty" }
            }
          }
        ], as: "direct_purchase"
      }
    },
    //////////////////lookup purchase for item receved
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          // {
          //   $unwind:
          //   {
          //     path: "$grn_details",
          //     preserveNullAndEmptyArrays: true
          //   }
          // },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                      { $gte: [{ $divide: ["$inserted_by_date", 1000] }, txt_from_date] },
                      { $lte: [{ $divide: ["$inserted_by_date", 1000] }, txt_to_date] }
                    ]
                  },
                  else: 0
                }
              }
            },
          },
          {
            $project: {
              moudle: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then:
                    "$received_item_details.item_id",
                  else: 0
                }
              },
              purchase: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.receivedQty",
                  else: 0
                }
              },
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: { $toDouble: "$purchase" } }
            }
          }
        ], as: "itemrReceved_purchase"
      }
    },
    /////////////sales return lookup////////////////////
    {
      $lookup: {
        from: "t_900_sales_returns",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$dispatch_return_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $and:
                  [
                    { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
                    { $gte: ["$sales_return_date", txt_from_date] },
                    { $lte: ["$sales_return_date", txt_to_date] },
                    { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                  ]
              }
            },
          },
          {
            $project: {
              item_id: "$dispatch_return_item_details.item_id",
              sales_return: "$dispatch_return_item_details.actualRetrun"
            }
          },
          {
            $group:
            {
              _id: "$item_id",
              sales_return: { $sum: "$sales_return" }
            }
          }
        ], as: "sales_return"
      }
    },
    // ///////////////////////purchase return//////////////////////////
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { "item_id": "$item_id" },
        pipeline: [

          {
            $unwind:
            {
              path: "$return_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind:
            {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $and:
                  [
                    { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                    { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                    { $gte: ["$purchase_return_date", txt_from_date] },
                    { $lte: ["$purchase_return_date", txt_to_date] },
                  ]
              }
            },
          },
          {
            $project: {
              item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty",
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase_return: { $sum: "$purchase_return" },
            }
          }
        ], as: "purchase_return"
      }
    },
    ///Stock transfer from lookup
    {
      $lookup: {
        from: 't_900_stock_transfers',
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                  { $eq: ["$from_showroom_warehouse_id", showroom_warehouse_id] },
                  { $gte: ["$stock_transfer_date", txt_from_date] },
                  { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              from_showroom_warehouse_id: 1,
              to_showroom_warehouse_id: 1,
              stock_transfer_date: 1,
              stock_transfer_no: 1,
              stock_transfer_id: 1
            }
          }
        ], as: 'stock_transfer_from'
      }
    },
    {
      $addFields: {
        sumTransfer: { $sum: "$stock_transfer_from.quantity" }
      }
    },
    ///Stock transfer to lookup
    {
      $lookup: {
        from: 't_900_stock_transfers',
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                  { $eq: ["$to_showroom_warehouse_id", showroom_warehouse_id] },
                  { $gte: ["$stock_transfer_date", txt_from_date] },
                  { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              from_showroom_warehouse_id: 1,
              to_showroom_warehouse_id: 1,
              stock_transfer_date: 1,
              stock_transfer_no: 1,
              stock_transfer_id: 1
            }
          }
        ], as: 'stock_transfer_to'
      }
    },
    {
      $addFields: {
        sumReceived: { $sum: "$stock_transfer_to.quantity" }
      }
    },
    // ///////////////////////UOM lookup//////////////////////////

    {
      $lookup: {
        from: "t_100_uoms",
        // localField: 'unit_id',
        // foreignField: 'uom_id',
        let: { "uom_id": "$uom_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$uom_id", "$$uom_id"] },
            },
          },

          { $project: { "caption": 1, "_id": 0 } }
        ],
        as: "uom_details"
      }
    },
    {
      $unwind: { path: "$uom_details", preserveNullAndEmptyArrays: true }
    },
    {
      $addFields: {
        uom_name: "$uom_details.caption",
      },
    },

    /////waste Quantity lookUp////

    {
      $lookup: {
        from: "t_000_wastes",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$waste_item_id", "$$item_id"] },
                  { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                  { $gte: ["$waste_date", txt_from_date] },
                  { $lte: ["$waste_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $project: {
              quantity: 1,
              waste_item_id: 1,

            },
          },
          {
            $group: {
              _id: "$waste_item_id",
              waste_qty: { $sum: "$quantity" },

            },
          },
        ],
        as: "waste_qty",
      },
    },
    {
      $addFields: {
        sumWaste: { $sum: "$waste_qty.waste_qty" },

      },
    },

    /////waste Converted Quantity lookUp////

    {
      $lookup: {
        from: "t_000_wastes",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$convertedToId", "$$item_id"] },
                  { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                  { $gte: ["$waste_date", txt_from_date] },
                  { $lte: ["$waste_date", txt_to_date] },

                ],

              },
            },
          },
          {
            $project: {
              convertedQty: 1,
              convertedToId: 1,
            },
          },
          {
            $group: {
              _id: "$convertedToId",
              convertedQty: { $sum: "$convertedQty" },
            },
          },
        ],
        as: "waste_convert_qty",
      },
    },

    {
      $addFields: {
        sumWasteConvertQty: { $sum: "$waste_convert_qty.convertedQty" },
      },
    },


    {
      $unwind:
      {
        path: "$sales",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$direct_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$sales_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$stock_by_location",
        preserveNullAndEmptyArrays: true
      }
    },
    ////opening Calculation//////////
    {
      $addFields: {
        sumPurchase: { $sum: ["$direct_purchase.purchase", "$itemrReceved_purchase.purchase"] }
      }
    },
    {
      $addFields: {
        sumCloseingPlus:
        {
          $subtract: [
            {
              $sum: [
                { $toDouble: "$stock_by_location.quantity" }, "$sumPurchase", "$sales_return.sales_return"
              ]
            },
            {
              $sum: [
                "$sales.sales", "$purchase_return.purchase_return"
              ]
            }
          ]

        }
      }
    },
    // { $unset: ["stock_by_location","sales", "direct_purchase", "itemrReceved_purchase", "purchase_return", "sales_return"] },

    {
      $group: {
        _id: "$item_id",
        item_id: { $first: "$item_id" },
        item: { $first: "$item" },
        uom_name: { $first: "$uom_name" },
        sumPurchase: { $first: "$sumPurchase" },
        sumSales: { $first: "$sales.sales" },
        sumPurchaseReturn: { $first: "$purchase_return.purchase_return" },
        sumSalesReturn: { $first: "$sales_return.sales_return" },
        sumCloseingPlus: { $first: "$sumCloseingPlus" },
        sumOpeningPlus: { $first: { $toDouble: "$stock_by_location.quantity" } },
        sumTransfer: { $first: "$sumTransfer" },
        sumReceived: { $first: "$sumReceived" },
        sumWaste: { $first: "$sumWaste" },
        sumWasteConvertQty: { $first: "$sumWasteConvertQty" },
        stockTransferDetails: { $first: "$stock_transfer_from" },
        stockRecivedDetails: { $first: "$stock_transfer_to" },



      }
    },
    {
      $sort: { "_id": 1 }
    }

  ])

  // console.log("sen2304", stockRegisterTransaction)
  if (stockRegisterTransaction) {
    // console.log("sen27/check2", stockRegisterTransaction)
    return res.status(200).send(stockRegisterTransaction);
  }
  else {
    return res.status(200).json([]);
  }
};



//////////////////////// Stock Voucher/////////////////////////
const stockVoucher = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };

  const showroom_warehouse_id = req.body.showroom_warehouse_id
  const item_id = req.body.item_id;
  // const item_id = 65;


  //for invoice search
  const txt_from_date = req.body.date_from;
  const txt_to_date = req.body.date_to;
  // const discount_from = req.body.discount_from;
  // const discount_to =req.body.discount_to; 

  if (item_id) {
    condi = { ...condi, "invoice_item_details.item_id": item_id };
  }
  if (showroom_warehouse_id) {
    condi = { ...condi, "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id };
  }

  //both date filter
  // if (txt_from_date && txt_to_date) {
  //   condi = { ...condi, 'invoice_details.invoice_date': { '$gte': (txt_from_date) * 1000, '$lte': (txt_to_date) * 1000 } };
  //   // condi = {
  //   //   ...condi, 
  //   //   $lte: [{ $divide: ["invoice_date", 1000] }, txt_to_date],
  //   //   $gte: [{ $divide: ["invoice_date", 1000] }, txt_from_date]
  //   // };

  // }
  // console.log("sen20=>", condi)
  let queryData = await sales.aggregate([
    {
      $unwind:
      {
        path: "$invoice_item_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$invoice_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      // $match: condi

      // $match: {
      //   $and:
      //     [
      //       { "invoice_item_details.item_id": item_id },
      //       { "invoice_item_details.showroom_warehouse_id": showroom_warehouse_id },
      //       { "invoice_details.invoice_date": { $gte: txt_from_date  } },
      //       { "invoice_details.invoice_date": { $lte: txt_to_date  } },
      //       // { "invoice_details.invoice_no" : { $eq: "$invoice_item_details.invoice_no"} }
      //     ]
      // },

      $match: {
        $expr:
        {
          $and:
            [
              { $eq: ["$invoice_item_details.item_id", item_id] },
              { $eq: ["$invoice_item_details.showroom_warehouse_id", showroom_warehouse_id] },
              { $gte: ["$invoice_details.invoice_date", txt_from_date] },
              { $lte: ["$invoice_details.invoice_date", txt_to_date] },
              { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] }
              // { $gte: [{ $divide: ["$invoice_date", 1000] }, txt_from_date] },
              // { $lte: [{ $divide: ["$invoice_date", 1000] }, txt_to_date] }
            ]
        }
      },

    },
    // { $unwind: "$invoice_item_details" },

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
    // { $unwind: "$invoice_no" },
    { $addFields: { invoiceNo: "$invoice_item_details.invoice_no" } },

    {
      $lookup: {
        from: "t_200_journals",
        let: {
          "invoice_no": "$invoiceNo",
          //  {
          //   $cond: {
          //     if: "$invoiceNo",
          //     then: "$invoiceNo",
          //     else: "$invoice_no",
          //   }
          // }
        },
        pipeline: [
          {
            $match:
            {
              $expr: {
                $and: [
                  { $eq: ["$$invoice_no", "$transaction_id"] },
                  { $gte: ["$voucher_date", txt_from_date] },
                  { $lte: ["$voucher_date", txt_to_date] },

                ]
              },
            }
          },
          {
            $project:
            {
              "voucher_no": 1,
              "_id": 0,
              "voucher_date": 1,
              "transaction_id": 1
            }
          }
        ],
        as: "j_details"
      }
    },
    {
      $addFields: {
        voucher_no: { $first: "$j_details.voucher_no" },
        voucher_date: { $first: "$j_details.voucher_date" },
        transaction_id: { $first: "$j_details.transaction_id" },

      },
    },
    {
      $project:
      {
        "module": "Sales",
        "company_name": 1,
        "sales_id": 1,
        invoice_date: 1,
        "invoice_item_details.item_id": 1,
        "invoice_item_details.invoice_no": 1,
        invoiceNo: 1,
        "voucher_no": 1,
        "voucher_date": 1,
        // "j_details":1,
        transaction_id: 1,
        sales_order_no: 1,
        quantity:
          //  {
          "$invoice_item_details.now_dispatch_qty",
        // $cond: { if: { $in: ["$invoice_item_details.item_id", [item_id]] }, then: "$invoice_item_details.now_dispatch_qty", else: '' }
        // },
        rate: {
          $cond: { if: { $in: ["$invoice_item_details.item_id", [item_id]] }, then: "$invoice_item_details.rate", else: '' }
        },
        discValue: "$invoice_item_details.disc_value",
      }
    },
    {
      $group: {
        _id: "$voucher_no",
        vendor_id: { $addToSet: "$vendor_id" },
        quantity: { $addToSet: "$quantity" },
        rate: { $addToSet: "$rate" },
        disc_value: { $first: "$discValue" },
        module: { $first: "$module" },
        purchase_id: { $addToSet: "$purchase_id" },
        voucher_no: { $addToSet: "$voucher_no" },
        company_name: { $addToSet: "$company_name" },
        sales_id: { $addToSet: "$sales_id" },
        invoice_date: { $addToSet: "$invoice_date" },
        // invoice_item_details: { $first: "$invoice_item_details" },
        // quantity: { $addToSet: "$invoice_item_details.now_dispatch_qty" },
        // rate: { $addToSet: "$invoice_item_details.rate" },
        quantity: { $first: "$quantity" },
        rate: { $first: "$rate" },
        voucher_date: { $addToSet: "$voucher_date" },
        sales_order_no: { $first: "$sales_order_no" },
        transaction_id: { $addToSet: "$transaction_id" },

      }
    },
    /////////////purchase union////////////////////
    {
      $unionWith: {
        coll: "t_800_purchases",

        pipeline: [
          {
            $unwind:
            {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match:
            {
              // $or: [
              // { $and: [{ module: "ITEMRECEIVED" },{ "received_item_details.item_id": item_id }, { "showroom_warehouse_id": showroom_warehouse_id }] },
              // {
              $and: [
                { module: "DIRECT PURCHASE" },
                { "item_details.item_id": item_id },
                { "approve_id": { $ne: 0 } },
                { "showroom_warehouse_id": showroom_warehouse_id }
              ]
              // }
              //   ]
            }

          },
          {
            $project: {
              "module": "Purchase",
              vendor_id: 1,
              purchase_id: 1,
              grn_no: 1,
              "received_item_details.item_id": 1,
              "received_item_details.grn_no": 1,
              "received_item_details.receivedQty": 1,
              "received_item_details.rate": 1,
              "item_details.item_id": 1,
              "item_details.quantity": 1,
              "item_details.rate": 1,
              approved_by_date: 1,
              inserted_by_date: 1,
              company_name: 1,
              // voucher_no: 1,
              grn_no: {
                $cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$grn_no", else: 0 }
              },
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },

                  then: "$item_details.item_id",

                  else: 0
                }
              },
              quantity: {

                $cond: {

                },
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },

                  then: "$item_details.quantity",

                  else: 0
                }


              },
              rate: {
                $cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.rate", else: 0 }
              },
              net_value: {
                $cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.net_value", else: 0 }
              },
            }
          },
          {
            $lookup: {
              from: "t_500_vendors",
              let: { "vendor_id": "$vendor_id" },
              pipeline: [
                {
                  $match:
                    { $expr: { $eq: ["$vendor_id", "$$vendor_id"] }, },
                },
                { $project: { "company_name": 1, "_id": 0 } }
              ],
              as: "vendor_details"
            }
          },
          {
            $addFields: {
              company_name: { $first: "$vendor_details.company_name" },
            },
          },
          { $unset: ["vendor_details"] },
          {
            $lookup: {
              from: "t_200_journals",
              let: {
                "grn_no": "$grn_no"
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$$grn_no", "$transaction_id"] },
                        { $lte: ["$voucher_date", txt_to_date] },
                        { $gte: ["$voucher_date", txt_from_date] },
                      ]
                    },
                  },
                },
                { $project: { "voucher_no": 1, "voucher_date": 1, "_id": 0, transaction_id: 1 } }
              ],
              as: "j_details"
            }
          },
          {
            $addFields: {
              voucher_no: { $first: "$j_details.voucher_no" },
              voucher_date: { $first: "$j_details.voucher_date" },
              transaction_id: { $first: "$j_details.transaction_id" },
            },
          },
          { $unset: ["j_details"] },
          {
            $group: {
              _id: "$voucher_no",
              vendor_id: { $addToSet: "$vendor_id" },
              quantity: { $first: "$quantity" },
              rate: { $first: "$rate" },
              module: { $first: "$module" },
              purchase_id: { $addToSet: "$purchase_id" },
              voucher_no: { $addToSet: "$voucher_no" },
              company_name: { $addToSet: "$company_name" },
              approved_by_date: { $addToSet: "$approved_by_date" },
              inserted_by_date: { $addToSet: "$inserted_by_date" },
              voucher_date: { $addToSet: "$voucher_date" },
              transaction_id: { $addToSet: "$transaction_id" },
            }
          },

        ]
      }
    },
    /////////////purchase union itemrece////////////////////
    {
      $unionWith: {
        coll: "t_800_purchases",

        pipeline: [
          {
            $unwind:
            {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match:
            {
              // $or: [
              // { $and: [{ module: "ITEMRECEIVED" },{ "received_item_details.item_id": item_id }, { "showroom_warehouse_id": showroom_warehouse_id }] },
              // {
              $and: [
                { module: "ITEMRECEIVED" },
                { "received_item_details.item_id": item_id },
                // { "approve_id": { $ne: 0 } },
                { "showroom_warehouse_id": showroom_warehouse_id }
              ]
              // }
              //   ]
            }

          },
          {
            $project: {
              "module": "Purchase",
              vendor_id: 1,
              purchase_id: 1,
              grn_no: 1,
              "received_item_details.item_id": 1,
              "received_item_details.grn_no": 1,
              "received_item_details.receivedQty": 1,
              "received_item_details.rate": 1,
              // "item_details.item_id": 1,
              // "item_details.quantity": 1,
              // "item_details.rate": 1,
              approved_by_date: 1,
              inserted_by_date: 1,
              company_name: 1,
              // voucher_no: 1,
              grn_no: {
                $cond: { if: { $in: ["$module", ["ITEMRECEIVED"]] }, then: "$received_item_details.grn_no", else: 0 }
              },
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },

                  then: "$received_item_details.item_id",

                  else: 0
                }
              },
              quantity: {

                $cond: {

                },
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },

                  then: "$received_item_details.receivedQty",

                  else: 0
                }


              },
              rate: {
                $cond: { if: { $in: ["$module", ["ITEMRECEIVED"]] }, then: "$received_item_details.rate", else: 0 }
              },
              net_value: {
                $cond: { if: { $in: ["$module", ["ITEMRECEIVED"]] }, then: "$received_item_details.net_value", else: 0 }
              },
            }
          },
          {
            $lookup: {
              from: "t_500_vendors",
              let: { "vendor_id": "$vendor_id" },
              pipeline: [
                {
                  $match:
                    { $expr: { $eq: ["$vendor_id", "$$vendor_id"] }, },
                },
                { $project: { "company_name": 1, "_id": 0 } }
              ],
              as: "vendor_details"
            }
          },
          {
            $addFields: {
              company_name: { $first: "$vendor_details.company_name" },
            },
          },
          { $unset: ["vendor_details"] },
          {
            $lookup: {
              from: "t_200_journals",
              let: {
                "grn_no": "$grn_no"
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$$grn_no", "$transaction_id"] },
                        { $lte: ["$voucher_date", txt_to_date + 86399] },
                        { $gte: ["$voucher_date", txt_from_date] },
                      ]
                    },
                  },
                },
                { $project: { "voucher_no": 1, "voucher_date": 1, "_id": 0, transaction_id: 1 } }
              ],
              as: "j_details"
            }
          },
          {
            $addFields: {
              voucher_no: { $first: "$j_details.voucher_no" },
              voucher_date: { $first: "$j_details.voucher_date" },
              transaction_id: { $first: "$j_details.transaction_id" },
            },
          },
          { $unset: ["j_details"] },
          {
            $group: {
              _id: "$voucher_no",
              vendor_id: { $addToSet: "$vendor_id" },
              quantity: { $first: "$quantity" },
              rate: { $first: "$rate" },
              module: { $first: "$module" },
              purchase_id: { $addToSet: "$purchase_id" },
              voucher_no: { $addToSet: "$voucher_no" },
              company_name: { $addToSet: "$company_name" },
              approved_by_date: { $addToSet: "$approved_by_date" },
              inserted_by_date: { $addToSet: "$inserted_by_date" },
              voucher_date: { $addToSet: "$voucher_date" },
              transaction_id: { $addToSet: "$transaction_id" },
            }
          },

        ]
      }
    },
    //waste qty//
    {
      $unionWith: {
        coll: "t_000_wastes",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$waste_item_id", item_id] }],
              },
            },
          },
          {
            $project: {
              quantity: 1,
              waste_item_id: 1,
              waste_date: 1,
            },
          },
          {
            $group: {
              _id: "$waste_item_id",
              quantity: { $sum: "$quantity" },
              waste_item_id: { $first: "$waste_item_id" },
              voucher_date: { $addToSet: "$waste_date" },
              module: { $first: "waste" }
            }
          },
        ],
      },
    },

    /////waste Converted Quantity union////
    {
      $unionWith: {
        coll: "t_000_wastes",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$convertedToId", item_id] }],
              },
            },
          },
          {
            $project: {
              convertedQty: 1,
              convertedToId: 1,
              waste_date: 1,
            },
          },
          {
            $group: {
              _id: "$convertedToId",
              quantity: { $sum: "$convertedQty" },
              convertedToId: { $first: "$convertedToId" },
              voucher_date: { $addToSet: "$waste_date" },
              module: { $first: "ConvertedWaste" }
            }
          },
        ],
      },
    },



    // ///////////////////sales return union////////////////////////////
    {
      $unionWith: {
        coll: "t_900_sales_returns",
        pipeline: [
          // { $unwind: "$dispatch_return_item_details" },
          {
            $unwind:
            {
              path: "$dispatch_return_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: { $and: [{ "dispatch_return_item_details.item_id": item_id }, { "showroom_warehouse_id": showroom_warehouse_id }] }

          },

          {
            $project: {
              "module": "Sales Return",
              customer_id: 1,
              sales_return_id: 1,
              sales_return_no: 1,
              // "dispatch_return_item_details.item_id": 1,
              // "dispatch_return_item_details.actualRetrun": 1,
              // "dispatch_return_item_details.rate": 1,
              inserted_by_date: 1,
              company_name: 1,
              quantity: {
                $cond: { if: { $in: ["$dispatch_return_item_details.item_id", [item_id]] }, then: "$dispatch_return_item_details.actualRetrun", else: '' }
              },
              rate: {
                $cond: { if: { $in: ["$dispatch_return_item_details.item_id", [item_id]] }, then: "$dispatch_return_item_details.rate", else: '' }
              },
              disc_value: {
                $cond: { if: { $in: ["$dispatch_return_item_details.item_id", [item_id]] }, then: "$dispatch_return_item_details.disc_value", else: '' }
              },
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
          // { $unwind: "$invoice_no" },
          {
            $lookup: {
              from: "t_200_journals",
              let: { "sales_return_no": "$sales_return_no" },
              pipeline: [
                {
                  $match:
                  {


                    //$expr: { $eq: ["$transaction_id", "$$sales_return_no"] }, 

                    $expr: {
                      $and: [
                        { $eq: ["$$sales_return_no", "$transaction_id"] },
                        { $lte: ["$voucher_date", txt_to_date + 100000] },
                        { $gte: ["$voucher_date", txt_from_date] },

                      ]
                    },

                  },


                },
                { $project: { "transaction_id": 1, "voucher_no": 1, "voucher_date": 1, "_id": 0 } }
              ],
              as: "j_details"
            }
          },
          {
            $addFields: {
              voucher_no: { $first: "$j_details.voucher_no" },
              voucher_date: { $first: "$j_details.voucher_date" },
              transaction_id: { $first: "$j_details.transaction_id" },

            },
          },
          { $unset: ["j_details"] },
          // {
          //   $project:
          //   {
          //     "module": "Sales Return",
          //     "company_name": 1,
          //     "sales_return_id": 1,
          //     invoice_date: 1,
          //     "invoice_item_details": 1,
          //     "voucher_no": 1
          //   }
          // },
          // {
          //   $group: {
          //     _id: "$voucher_no",
          //     customer_id: { $addToSet: "$customer_id" },
          //     // quantity: { $addToSet: "$dispatch_return_item_details.actualRetrun" },
          //     // rate: { $addToSet: "$dispatch_return_item_details.rate" },
          //     quantity: { $first: "$quantity" },
          //     rate: { $first: "$rate" },
          //     disc_value: { $first: "$disc_value" },
          //     module: { $first: "$module" },
          //     voucher_no: { $addToSet: "$voucher_no" },
          //     company_name: { $addToSet: "$company_name" },
          //     sales_return_id: { $addToSet: "$sales_return_id" },
          //     dispatch_return_item_details: { $first: "$dispatch_return_item_details" },
          //     voucher_date: { $addToSet: "$voucher_date" },
          //     transaction_id: { $addToSet: "$transaction_id" },

          //   }
          // },

        ]
      }
    },
    // ///////////////////////purchase return union//////////////////////////
    // {
    //   $unionWith: {
    //     coll: "t_900_purchase_returns",
    //     pipeline: [
    //       // { $unwind: "$return_details" },
    //       // { $unwind: "$return_details.item_details" },
    //       {
    //         $unwind:
    //         {
    //           path: "$return_details",
    //           preserveNullAndEmptyArrays: true
    //         }
    //       },
    //       {
    //         $unwind:
    //         {
    //           path: "$return_details.item_details",
    //           preserveNullAndEmptyArrays: true
    //         }
    //       },
    //       {
    //         $match: { $and: [{ "return_details.item_details.item_id": item_id }, { "showroom_warehouse_id": showroom_warehouse_id }] }

    //       },

    //       {
    //         $project: {
    //           "module": "Purchase Return",
    //           customer_id: 1,
    //           purchase_return_id: 1,
    //           purchase_return_no: 1,
    //           // "return_details.item_details.item_id": 1,
    //           // "return_details.item_details.return_qty": 1,
    //           // "return_details.item_details.rate": 1,
    //           inserted_by_date: 1,
    //           vendor: 1,
    //           quantity: {
    //             $cond: { if: { $in: ["$return_details.item_details.item_id", [item_id]] }, then: "$return_details.item_details.return_qty", else: '' }
    //           },
    //           rate: {
    //             $cond: { if: { $in: ["$return_details.item_details.item_id", [item_id]] }, then: "$return_details.item_details.rate", else: '' }
    //           },
    //         }
    //       },
    //       {
    //         $lookup: {
    //           from: "t_200_journals",
    //           let: { "purchase_return_no": "$purchase_return_no" },
    //           pipeline: [
    //             {
    //               $match:
    //               {


    //                 //$expr: { $eq: ["$transaction_id", "$$purchase_return_no"] },


    //                 $expr: {
    //                   $and: [
    //                     { $eq: ["$$purchase_return_no", "$transaction_id"] },
    //                     { $lte: ["$voucher_date", txt_to_date] },
    //                     { $gte: ["$voucher_date", txt_from_date] },

    //                   ]
    //                 },

    //               },
    //             },
    //             { $project: { transaction_id: 1, "voucher_no": 1, "voucher_date": 1, "_id": 0 } }
    //           ],
    //           as: "j_details"
    //         }
    //       },
    //       {
    //         $addFields: {
    //           voucher_no: { $first: "$j_details.voucher_no" },
    //           voucher_date: { $first: "$j_details.voucher_date" },
    //           transaction_id: { $first: "$j_details.transaction_id" },

    //         },
    //       },
    //       { $unset: ["j_details"] },
    //       // {
    //       //   $project:
    //       //   {
    //       //     "module": "Sales Return",
    //       //     "company_name": 1,
    //       //     "sales_return_id": 1,
    //       //     invoice_date: 1,
    //       //     "invoice_item_details": 1,
    //       //     "voucher_no": 1
    //       //   }
    //       // },
    //       {
    //         $group: {
    //           _id: "$voucher_no",
    //           // customer_id: { $addToSet: "$customer_id" },
    //           // quantity: { $addToSet: "$return_details.item_details.return_qty" },
    //           // rate: { $addToSet: "$return_details.item_details.rate" },
    //           quantity: { $first: "$quantity" },
    //           rate: { $first: "$rate" },
    //           module: { $first: "$module" },
    //           voucher_no: { $addToSet: "$voucher_no" },
    //           company_name: { $addToSet: "$vendor" },
    //           purchase_return_id: { $addToSet: "$purchase_return_id" },
    //           // dispatch_return_item_details: { $first: "$dispatch_return_item_details" },
    //           voucher_date: { $addToSet: "$voucher_date" },
    //           transaction_id: { $addToSet: "$transaction_id" },

    //         }
    //       },

    //     ]
    //   }
    // },

    // /////////////////////Stock Transfer from union///////////////////////////////////////
    {
      $unionWith: {
        coll: 't_900_stock_transfers',
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", item_id] },
                  { $eq: ["$from_showroom_warehouse_id", showroom_warehouse_id] },
                  { $gte: ["$stock_transfer_date", txt_from_date] },
                  { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          // showroom name lookup
          {
            $lookup: {
              from: 't_000_showrooms_warehouses',
              let: {
                "showroom_warehouse_id": "$to_showroom_warehouse_id"
              },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$showrooms_warehouse_id", "$$showroom_warehouse_id"] }
                  }
                },
                {
                  $project: {
                    showrooms_warehouse: 1,
                    _id: 0
                  }
                }
              ], as: 'showroom'
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              to_showroom_warehouse_id: 1,
              to_showroom_warehouse: "$showroom.showrooms_warehouse",
              voucher_date: "$stock_transfer_date",
              stock_transfer_no: 1,
              module: "Stock Transfer",
            }
          }
        ],
      }
    },
    //////////////////Stock Recieved union///////////////////
    {
      $unionWith: {
        coll: 't_900_stock_transfers',
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", item_id] },
                  { $eq: ["$to_showroom_warehouse_id", showroom_warehouse_id] },
                  { $gte: ["$stock_transfer_date", txt_from_date] },
                  { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $lookup: {
              from: 't_000_showrooms_warehouses',
              let: {
                "showroom_warehouse_id": "$from_showroom_warehouse_id"
              },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$showrooms_warehouse_id", "$$showroom_warehouse_id"] }
                  }
                },
                {
                  $project: {
                    showrooms_warehouse: 1,
                    _id: 0
                  }
                }
              ], as: 'showroom'
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              from_showroom_warehouse_id: 1,
              from_showroom_warehouse: "$showroom.showrooms_warehouse",
              voucher_date: "$stock_transfer_date",
              stock_transfer_no: 1,
              module: "Stock Recieved",
            }
          }
        ],
      }
    },

  ]);

  // console.log("sen2304", queryData)
  if (queryData) {
    // console.log("sen27/check", queryData)
    let returnArr = [];
    for (let iCtr = 0; iCtr < queryData.length; iCtr++) {
      // console.log(queryData[iCtr])
      queryData[iCtr]["waste_item_id"] = queryData[iCtr]["waste_item_id"];
      queryData[iCtr]["convertedToId"] = queryData[iCtr]["convertedToId"];
      queryData[iCtr]["convertedQty"] = queryData[iCtr]["convertedQty"];

      queryData[iCtr]["sumwasteQty"] = queryData[iCtr]["sumwasteQty"];
      queryData[iCtr]["waste_date"] = queryData[iCtr]["waste_date"];
      queryData[iCtr]['rate'] = queryData[iCtr]['rate']
      queryData[iCtr]['quantity'] = queryData[iCtr]['quantity']
      queryData[iCtr]['module'] = queryData[iCtr]['module']
      queryData[iCtr]['voucher_no'] = queryData[iCtr]['voucher_no']
      queryData[iCtr]['company_name'] = queryData[iCtr]['company_name']
      queryData[iCtr]['purchase_id'] = queryData[iCtr]['purchase_id']
      queryData[iCtr]['invoice_item_details'] = queryData[iCtr]['invoice_item_details']
      queryData[iCtr]['invoice_date'] = queryData[iCtr]['invoice_date']
      queryData[iCtr]['approved_by_date'] = queryData[iCtr]['approved_by_date']
      queryData[iCtr]['inserted_by_date'] = queryData[iCtr]['inserted_by_date']
      queryData[iCtr]['sales_return_id'] = queryData[iCtr]['sales_return_id']
      queryData[iCtr]['voucher_date'] = queryData[iCtr]['voucher_date']
      queryData[iCtr]['disc_value'] = queryData[iCtr]['disc_value']
      queryData[iCtr]['sales_order_no'] = queryData[iCtr]['sales_order_no']
      queryData[iCtr]['transaction_id'] = queryData[iCtr]['transaction_id']
      queryData[iCtr]['from_showroom_warehouse_id'] = queryData[iCtr]['from_showroom_warehouse_id']
      queryData[iCtr]['to_showroom_warehouse_id'] = queryData[iCtr]['to_showroom_warehouse_id']
      queryData[iCtr]['stock_transfer_no'] = queryData[iCtr]['stock_transfer_no']
      queryData[iCtr]['from_showroom_warehouse'] = queryData[iCtr]['from_showroom_warehouse']
      queryData[iCtr]['to_showroom_warehouse'] = queryData[iCtr]['to_showroom_warehouse']


      if (Array.isArray(queryData[iCtr]['_id'])) {

        for (let iGRN = 0; iGRN < queryData[iCtr]['_id'].length; iGRN++) {

          let id = queryData[iCtr]['_id'][iGRN];


          let waste_item_id = queryData[iCtr]["waste_item_id"];
          let sumwasteQty = queryData[iCtr]["sumwasteQty"];
          let convertedToId = queryData[iCtr]["convertedToId"];
          let convertedQty = queryData[iCtr]["convertedQty"];
          let waste_date = queryData[iCtr]["waste_date"];
          let company_name = queryData[iCtr]['company_name'];
          let voucher_no = queryData[iCtr]['voucher_no'];
          let rate = queryData[iCtr]['rate'][iGRN];
          let quantity = queryData[iCtr]['quantity'][iGRN];
          let module = queryData[iCtr]['module'];
          let purchase_id = queryData[iCtr]['purchase_id'];
          let invoice_item_details = queryData[iCtr]['invoice_item_details'];
          let invoice_date = queryData[iCtr]['invoice_date'];
          let approved_by_date = queryData[iCtr]['approved_by_date'];
          let inserted_by_date = queryData[iCtr]['inserted_by_date'];
          let sales_return_id = queryData[iCtr]['sales_return_id'];
          let voucher_date = queryData[iCtr]['voucher_date'];
          let disc_value = queryData[iCtr]['disc_value'];
          let sales_order_no = queryData[iCtr]['sales_order_no'];
          let transaction_id = queryData[iCtr]['transaction_id'];
          let from_showroom_warehouse_id = queryData[iCtr]['from_showroom_warehouse_id'];
          let to_showroom_warehouse_id = queryData[iCtr]['to_showroom_warehouse_id'];
          // let stock_transfer_date = queryData[iCtr]['stock_transfer_date'];
          let stock_transfer_no = queryData[iCtr]['stock_transfer_no'];
          let from_showroom_warehouse = queryData[iCtr]['from_showroom_warehouse'];
          let to_showroom_warehouse = queryData[iCtr]['to_showroom_warehouse'];

          let obj = {
            id: id,
            company_name: company_name,
            voucher_no: voucher_no,
            rate: rate,
            quantity: quantity,
            module: module,
            waste_item_id: waste_item_id,
            sumwasteQty: sumwasteQty,
            convertedToId: convertedToId,
            convertedQty: convertedQty,
            waste_date: waste_date,
            purchase_id: purchase_id,
            invoice_item_details: invoice_item_details,
            invoice_date: invoice_date,
            approved_by_date: approved_by_date,
            inserted_by_date: inserted_by_date,
            sales_return_id: sales_return_id,
            voucher_date: voucher_date,
            disc_value: disc_value,
            sales_order_no: sales_order_no,
            transaction_id: transaction_id,
            from_showroom_warehouse_id: from_showroom_warehouse_id,
            to_showroom_warehouse_id: to_showroom_warehouse_id,
            from_showroom_warehouse: from_showroom_warehouse,
            to_showroom_warehouse: to_showroom_warehouse,
            // stock_transfer_date:stock_transfer_date,
            stock_transfer_no: stock_transfer_no,
          };

          returnArr.push(obj);
        }
      }
      else {
        let id = queryData[iCtr]['_id'];
        let company_name = queryData[iCtr]['company_name'];
        let rate = queryData[iCtr]['rate'];
        let quantity = queryData[iCtr]['quantity'];


        let waste_item_id = queryData[iCtr]["waste_item_id"];
        let sumwasteQty = queryData[iCtr]["sumwasteQty"];
        let convertedToId = queryData[iCtr]["convertedToId"];
        let convertedQty = queryData[iCtr]["convertedQty"];
        let waste_date = queryData[iCtr]["waste_date"];
        let voucher_no = queryData[iCtr]['voucher_no'];
        let module = queryData[iCtr]['module'];
        let purchase_id = queryData[iCtr]['purchase_id'];
        let invoice_item_details = queryData[iCtr]['invoice_item_details'];
        let invoice_date = queryData[iCtr]['invoice_date'];
        let approved_by_date = queryData[iCtr]['approved_by_date'];
        let inserted_by_date = queryData[iCtr]['inserted_by_date'];
        let sales_return_id = queryData[iCtr]['sales_return_id'];
        let voucher_date = queryData[iCtr]['voucher_date'];
        let disc_value = queryData[iCtr]['disc_value'];
        let sales_order_no = queryData[iCtr]['sales_order_no'];
        let transaction_id = queryData[iCtr]['transaction_id'];
        let from_showroom_warehouse_id = queryData[iCtr]['from_showroom_warehouse_id'];
        let to_showroom_warehouse_id = queryData[iCtr]['to_showroom_warehouse_id'];
        // let stock_transfer_date = queryData[iCtr]['stock_transfer_date'];
        let stock_transfer_no = queryData[iCtr]['stock_transfer_no'];
        let from_showroom_warehouse = queryData[iCtr]['from_showroom_warehouse'];
        let to_showroom_warehouse = queryData[iCtr]['to_showroom_warehouse'];

        let obj = {
          id: id,
          company_name: company_name,
          voucher_no: voucher_no,
          rate: rate,
          quantity: quantity,

          waste_item_id: waste_item_id,
          sumwasteQty: sumwasteQty,
          convertedToId: convertedToId,
          convertedQty: convertedQty,
          waste_date: waste_date,
          module: module,
          purchase_id: purchase_id,
          invoice_item_details: invoice_item_details,
          invoice_date: invoice_date,
          approved_by_date: approved_by_date,
          inserted_by_date: inserted_by_date,
          sales_return_id: sales_return_id,
          voucher_date: voucher_date,
          disc_value: disc_value,
          sales_order_no: sales_order_no,
          transaction_id: transaction_id,
          from_showroom_warehouse_id: from_showroom_warehouse_id,
          to_showroom_warehouse_id: to_showroom_warehouse_id,
          stock_transfer_no: stock_transfer_no,
          from_showroom_warehouse: from_showroom_warehouse,
          to_showroom_warehouse: to_showroom_warehouse,
        };
        returnArr.push(obj);
      }
    }
    return res.status(200).send(returnArr);
    // return res.status(200).send(queryData);

  }
  else {
    return res.status(200).json([]);
  }
};


////////////////////Showroom wise stock////////////
const showroom_warehouse_stock = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const showroom_warehouse_id = req.body.showroom_warehouse_id
  const item_id = req.body.item_id;
  const items = req.body.item;
  const category_id = req.body.category_id;
  const brand_id = req.body.brand_id;
  const txt_from_date = req.body.txt_from_date;



  // const txt_from_date = moment(new Date()).unix();

  if (items) {
    condi = { ...condi, item: { $regex: items, $options: "i" } }
  }
  if (item_id) {
    condi = { ...condi, "item_id": item_id };
  }
  if (category_id) {
    condi = { ...condi, "category_id": category_id };
  }
  if (brand_id) {
    condi = { ...condi, "category_id": brand_id };
  }
  // if (showroom_warehouse_id) {
  //   condi = { ...condi, "stock_by_location.showroom_warehouse_id": showroom_warehouse_id };

  //   // condi = { ...condi, $eq: ["$stock_by_location.showroom_warehouse_id", Number(showroom_warehouse_id)] };
  // }
  //console.log("sen09/show=>", txt_from_date)
  let stockRegisterOpening = await item.aggregate([

    {
      $match: condi,
    },
    {
      $project:
      {
        // stock_by_location: 1,
        item_id: 1, item: 1, uom_id: 1,
        stock_by_location: {
          $cond: {
            if: req.body.showroom_warehouse_id,
            then: {
              $filter: {
                input: "$stock_by_location", as: "stock_by_location",
                cond: { $eq: ["$$stock_by_location.showroom_warehouse_id", req.body.showroom_warehouse_id] }
              }
            },
            else: "$stock_by_location"
          }
        }

      }
    },
    {
      $addFields: {
        showroom_warehouse_id: showroom_warehouse_id
      }
    },
    ////////////////////lookup with sales/////////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$invoice_item_details"
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: showroom_warehouse_id,
                  then: {
                    $and:
                      [
                        { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                        { $eq: ["$invoice_item_details.showroom_warehouse_id", showroom_warehouse_id] },
                        { $lte: ["$invoice_date", txt_from_date] }
                      ]
                  },
                  else: {
                    $and:
                      [
                        { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                        { $lte: ["$invoice_date", txt_from_date] }
                      ]
                  }
                }
              }
            },
          },
          {
            $project: {
              "_id": 0,
              item_id: "$invoice_item_details.item_id",
              qty: "$invoice_item_details.now_dispatch_qty",
            }
          },
          {
            $group: {
              _id: "$item_id",
              sales: { $sum: "$qty" }
            }
          }
        ], as: "sales"
      }
    },
    /////////////lookup purchase direct purchse////////////////////
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {

                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $cond: {
                      if: showroom_warehouse_id,
                      then: {
                        $and:
                          [
                            { $eq: ["$item_details.item_id", "$$item_id"] },
                            { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                            { $gt: ["$approve_id", 0] },
                            { $lte: ["$inserted_by_date", txt_from_date] }
                          ]
                      },
                      else: {
                        $and: [
                          { $eq: ["$item_details.item_id", "$$item_id"] },
                          { $gt: ["$approve_id", 0] },
                          { $lte: ["$inserted_by_date", txt_from_date] }
                        ]
                      }
                    }
                  },
                  else: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                      { $lte: ["$inserted_by_date", txt_from_date] }
                    ]
                  }
                }
              }
            },
          },
          {
            $project: {
              // moudle: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then:
                    "$item_details.item_id",
                  else: "$received_item_details.item_id"
                }
              },
              qty: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.quantity",
                  else: "$received_item_details.receivedQty"
                }
              },
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: "$qty" }
            }
          }
        ], as: "direct_purchase"
      }
    },
    //////////////////lookup purchase for item receved
    {
      $lookup: {
        from: "t_800_purchases",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {

                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: {
                    $cond: {
                      if: showroom_warehouse_id,
                      then: {
                        $and: [
                          { $eq: ["$received_item_details.item_id", "$$item_id"] },
                          { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                          { $lte: ["$inserted_by_date", txt_from_date] }
                        ]
                      },
                      else: {
                        $and: [
                          { $eq: ["$received_item_details.item_id", "$$item_id"] },

                          { $lte: ["$inserted_by_date", txt_from_date] }
                        ]
                      }
                    }
                  },
                  else: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                      { $lte: ["$inserted_by_date", txt_from_date] }
                    ]
                  }
                }
              }
            },
          },
          {
            $project: {
              // moudle: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then:
                    "$item_details.item_id",
                  else: "$received_item_details.item_id"
                }
              },
              qty: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.quantity",
                  else: "$received_item_details.receivedQty"
                }
              },
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: { $toDouble: "$qty" } }
            }
          }
        ], as: "itemrReceved_purchase"
      }
    },

    ///////////sales return lookup////////////////////
    {
      $lookup: {
        from: "t_900_sales_returns",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind:
            {
              path: "$dispatch_return_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: showroom_warehouse_id,
                  then: {
                    $and:
                      [
                        { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
                        { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                        { $lte: ["$sales_return_date", txt_from_date] }
                      ]
                  },
                  else: {
                    $and:
                      [
                        { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
                        { $lte: ["$sales_return_date", txt_from_date] }
                      ]
                  }
                }

              }
            },
          },
          {
            $project: {
              item_id: "$dispatch_return_item_details.item_id",
              sales_return: "$dispatch_return_item_details.actualRetrun"
            }
          },
          {
            $group:
            {
              _id: "$item_id",
              sales_return: { $sum: "$sales_return" }
            }
          }
        ], as: "sales_return"
      }
    },
    // ///////////////////////purchase return//////////////////////////
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { "item_id": "$item_id" },
        pipeline: [

          {
            $unwind:
            {
              path: "$return_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind:
            {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr:
              {
                $cond: {
                  if: showroom_warehouse_id,
                  then: {
                    $and:
                      [
                        { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                        { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                        { $lte: ["$purchase_return_date", txt_from_date] }
                      ]
                  },
                  else: {
                    $and:
                      [
                        { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                        { $lte: ["$purchase_return_date", txt_from_date] }
                      ]
                  }
                }

              }
            },
          },
          {
            $project: {
              item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty",
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase_return: { $sum: "$purchase_return" },
            }
          }
        ], as: "purchase_return"
      }
    },
    ///Stock transfer from lookup
    {
      $lookup: {
        from: 't_900_stock_transfers',
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                  { $eq: ["$from_showroom_warehouse_id", showroom_warehouse_id] },
                  { $lte: ["$stock_transfer_date", txt_from_date] },
                  // { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              from_showroom_warehouse_id: 1,
              to_showroom_warehouse_id: 1,
              stock_transfer_date: 1,
              stock_transfer_no: 1,
              stock_transfer_id: 1
            }
          }
        ], as: 'stock_transfer_from'
      }
    },
    {
      $addFields: {
        sumTransfer: { $sum: "$stock_transfer_from.quantity" }
      }
    },
    ///Stock transfer to lookup
    {
      $lookup: {
        from: 't_900_stock_transfers',
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$stock_transfer_details",
              preserveNullAndEmptyArrays: true

            }
          },
          {
            $match: {
              $expr:

              {
                $and: [
                  { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                  { $eq: ["$to_showroom_warehouse_id", showroom_warehouse_id] },
                  { $lte: ["$stock_transfer_date", txt_from_date] },
                  // { $lte: ["$stock_transfer_date", txt_to_date] },

                ]
              }
            }
          },
          {
            $project: {
              quantity: "$stock_transfer_details.quantity",
              from_showroom_warehouse_id: 1,
              to_showroom_warehouse_id: 1,
              stock_transfer_date: 1,
              stock_transfer_no: 1,
              stock_transfer_id: 1
            }
          }
        ], as: 'stock_transfer_to'
      }
    },
    {
      $addFields: {
        sumReceived: { $sum: "$stock_transfer_to.quantity" }
      }
    },
    {
      $unwind:
      {
        path: "$sales",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$direct_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$sales_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true
      }
    },

    ////opening Calculation//////////
    {
      $addFields: {
        sumPurchase: { $sum: ["$direct_purchase.purchase", "$itemrReceved_purchase.purchase"] }
      }
    },
    {
      $addFields: {
        sumOpeningPlus:
        {
          $subtract: [
            {
              $sum: [
                "$sumPurchase", "$sales_return.sales_return"
              ]
            },
            {
              $sum: [
                "$sales.sales", "$purchase_return.purchase_return"
              ]
            }
          ]

        }
      }
    },
    {
      $unset: [
        // "stock_by_location",
        "sales",
        //  "direct_purchase", "itemrReceved_purchase", "purchase_return", "sales_return"
      ]
    },

    {
      $group: {
        _id: "$item_id",
        item_id: { $first: "$item_id" },
        showroom_warehouse_id: { $first: "$showroom_warehouse_id" },
        sumOpeningPlus: { $first: "$sumOpeningPlus" },
        stock_by_location: { $first: "$stock_by_location" },
        sumTransfer: { $first: "$sumTransfer" },
        sumReceived: { $first: "$sumReceived" },
      }
    },
    {
      $sort: { "_id": 1 }
    }

  ])

  // console.log("sen23044=>", stockRegisterOpening)
  if (stockRegisterOpening) {
    // console.log("sen27/check2", stockRegisterOpening)
    return res.status(200).send(stockRegisterOpening);
  }
  else {
    return res.status(200).json([]);
  }
};

////////////////////Showroom wise stock////////////
// const showroom_warehouse_stock2 = async (req, res) => {
//   // let condition={deleted_by_id:0};
//   let condi = { deleted_by_id: 0 };
//   let condiForShowroom = { deleted_by_id: 0 };

//   const showrooms_warehouse_id = req.body.showrooms_warehouse_id
//   const item_id = req.body.item_id;
//   const items = req.body.item;
//   const category_id = req.body.category_id;
//   const brand_id = req.body.brand_id;
//   // const brand_id = 134;
//   // const txt_from_date = req.body.txt_from_date;
//   const txt_from_date = moment().endOf('day').unix('X') * 1000;

//   // const txt_from_date = moment(new Date()).unix();

//   if (items) {
//     condi = { ...condi, item: { $regex: items, $options: "i" } }
//   }
//   if (item_id) {
//     condi = { ...condi, "item_id": item_id };
//   }
//   if (category_id) {
//     condi = { ...condi, "category_id": category_id };
//   }
//   if (brand_id) {
//     condi = { ...condi, "brand_id": brand_id };
//   }
//   if (showrooms_warehouse_id) {
//     condiForShowroom = { ...condiForShowroom, "showrooms_warehouse_id": showrooms_warehouse_id };
//   }

//   // old
//   let showromData = await showrooms_warehouse.find(condiForShowroom, { _id: 0, showrooms_warehouse_id: 1, showrooms_warehouse: 1 })
//   let itemData = await item.find({ brand_id: brand_id }, { _id: 0, item_id: 1, item: 1, })




//   let arr = []

//   if (showromData) {
//     showromData.map(async (r, i) => {
//       let stockRegisterOpening = await item.aggregate([

//         {
//           $match: condi,
//         },
//         {
//           $project:
//           {
//             // stock_by_location: 1,
//             item_id: 1, item: 1, uom_id: 1, brand_id: 1, category_id: 1,
//             stock_by_location: {
//               $cond: {
//                 if: r.showrooms_warehouse_id,
//                 then: {
//                   $filter: {
//                     input: "$stock_by_location", as: "stock_by_location",
//                     cond: { $eq: ["$$stock_by_location.showroom_warehouse_id", r.showrooms_warehouse_id] }
//                   }
//                 },
//                 else: "$stock_by_location"
//               }
//             }

//           }
//         },
//         {
//           $addFields: {
//             showroom_warehouse_id: r.showrooms_warehouse_id
//           }
//         },
//         ////////////////////lookup with sales/////////////////////////
//         {
//           $lookup: {
//             from: "t_900_sales",
//             let: { "item_id": "$item_id" },
//             pipeline: [
//               {
//                 $unwind: {
//                   path: "$invoice_item_details"
//                 }
//               },
//               {
//                 $match: {
//                   $expr:
//                   {
//                     $cond: {
//                       if: r.showrooms_warehouse_id,
//                       then: {
//                         $and:
//                           [
//                             { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
//                             { $eq: ["$invoice_item_details.showroom_warehouse_id", r.showrooms_warehouse_id] },
//                             { $lte: ["$invoice_date", txt_from_date] }
//                           ]
//                       },
//                       else: {
//                         $and:
//                           [
//                             { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
//                             { $lte: ["$invoice_date", txt_from_date] }
//                           ]
//                       }
//                     }
//                   }
//                 },
//               },
//               {
//                 $project: {
//                   "_id": 0,
//                   item_id: "$invoice_item_details.item_id",
//                   qty: "$invoice_item_details.now_dispatch_qty",
//                 }
//               },
//               {
//                 $group: {
//                   _id: "$item_id",
//                   sales: { $sum: "$qty" }
//                 }
//               }
//             ], as: "sales"
//           }
//         },
//         /////////////lookup purchase direct purchse////////////////////
//         {
//           $lookup: {
//             from: "t_800_purchases",
//             let: { "item_id": "$item_id" },
//             pipeline: [
//               {
//                 $unwind:
//                 {
//                   path: "$item_details",
//                   preserveNullAndEmptyArrays: true
//                 }
//               },
//               {
//                 $match: {
//                   $expr:
//                   {

//                     $cond: {
//                       if: { $in: ["$module", ["DIRECT PURCHASE"]] },
//                       then: {
//                         $cond: {
//                           if: r.showrooms_warehouse_id,
//                           then: {
//                             $and:
//                               [
//                                 { $eq: ["$item_details.item_id", "$$item_id"] },
//                                 { $eq: ["$showroom_warehouse_id", r.showrooms_warehouse_id] },
//                                 { $gt: ["$approve_id", 0] },
//                                 { $lte: ["$inserted_by_date", txt_from_date] }
//                               ]
//                           },
//                           else: {
//                             $and: [
//                               { $eq: ["$item_details.item_id", "$$item_id"] },
//                               { $gt: ["$approve_id", 0] },
//                               { $lte: ["$inserted_by_date", txt_from_date] }
//                             ]
//                           }
//                         }
//                       },
//                       else: {
//                         $and: [
//                           { $eq: ["$received_item_details.item_id", "$$item_id"] },
//                           { $eq: ["$showroom_warehouse_id", r.showrooms_warehouse_id] },
//                           { $lte: ["$inserted_by_date", txt_from_date] }
//                         ]
//                       }
//                     }
//                   }
//                 },
//               },
//               {
//                 $project: {
//                   // moudle: 1,
//                   item_id: {
//                     $cond: {
//                       if: { $in: ["$module", ["DIRECT PURCHASE"]] },
//                       then:
//                         "$item_details.item_id",
//                       else: "$received_item_details.item_id"
//                     }
//                   },
//                   qty: {
//                     $cond: {
//                       if: { $in: ["$module", ["DIRECT PURCHASE"]] },
//                       then: "$item_details.quantity",
//                       else: "$received_item_details.receivedQty"
//                     }
//                   },
//                 }
//               },
//               {
//                 $group: {
//                   _id: "$item_id",
//                   purchase: { $sum: "$qty" }
//                 }
//               }
//             ], as: "direct_purchase"
//           }
//         },
//         //////////////////lookup purchase for item receved
//         {
//           $lookup: {
//             from: "t_800_purchases",
//             let: { "item_id": "$item_id" },
//             pipeline: [
//               {
//                 $unwind:
//                 {
//                   path: "$received_item_details",
//                   preserveNullAndEmptyArrays: true
//                 }
//               },
//               {
//                 $match: {
//                   $expr:
//                   {

//                     $cond: {
//                       if: { $in: ["$module", ["ITEMRECEIVED"]] },
//                       then: {
//                         $cond: {
//                           if: r.showrooms_warehouse_id,
//                           then: {
//                             $and: [
//                               { $eq: ["$received_item_details.item_id", "$$item_id"] },
//                               { $eq: ["$showroom_warehouse_id", r.showrooms_warehouse_id] },
//                               { $lte: ["$inserted_by_date", txt_from_date] }
//                             ]
//                           },
//                           else: {
//                             $and: [
//                               { $eq: ["$received_item_details.item_id", "$$item_id"] },

//                               { $lte: ["$inserted_by_date", txt_from_date] }
//                             ]
//                           }
//                         }
//                       },
//                       else: {
//                         $and: [
//                           { $eq: ["$received_item_details.item_id", "$$item_id"] },
//                           { $eq: ["$showroom_warehouse_id", r.showrooms_warehouse_id] },
//                           { $lte: ["$inserted_by_date", txt_from_date] }
//                         ]
//                       }
//                     }
//                   }
//                 },
//               },
//               {
//                 $project: {
//                   // moudle: 1,
//                   item_id: {
//                     $cond: {
//                       if: { $in: ["$module", ["DIRECT PURCHASE"]] },
//                       then:
//                         "$item_details.item_id",
//                       else: "$received_item_details.item_id"
//                     }
//                   },
//                   qty: {
//                     $cond: {
//                       if: { $in: ["$module", ["DIRECT PURCHASE"]] },
//                       then: "$item_details.quantity",
//                       else: "$received_item_details.receivedQty"
//                     }
//                   },
//                 }
//               },
//               {
//                 $group: {
//                   _id: "$item_id",
//                   purchase: { $sum: { $toDouble: "$qty" } }
//                 }
//               }
//             ], as: "itemrReceved_purchase"
//           }
//         },

//         ///////////sales return lookup////////////////////
//         {
//           $lookup: {
//             from: "t_900_sales_returns",
//             let: { "item_id": "$item_id" },
//             pipeline: [
//               {
//                 $unwind:
//                 {
//                   path: "$dispatch_return_item_details",
//                   preserveNullAndEmptyArrays: true
//                 }
//               },
//               {
//                 $match: {
//                   $expr:
//                   {
//                     $cond: {
//                       if: r.showrooms_warehouse_id,
//                       then: {
//                         $and:
//                           [
//                             { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
//                             { $eq: ["$showroom_warehouse_id", r.showrooms_warehouse_id] },
//                             { $lte: ["$sales_return_date", txt_from_date] }
//                           ]
//                       },
//                       else: {
//                         $and:
//                           [
//                             { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
//                             { $lte: ["$sales_return_date", txt_from_date] }
//                           ]
//                       }
//                     }

//                   }
//                 },
//               },
//               {
//                 $project: {
//                   item_id: "$dispatch_return_item_details.item_id",
//                   sales_return: "$dispatch_return_item_details.actualRetrun"
//                 }
//               },
//               {
//                 $group:
//                 {
//                   _id: "$item_id",
//                   sales_return: { $sum: "$sales_return" }
//                 }
//               }
//             ], as: "sales_return"
//           }
//         },
//         // ///////////////////////purchase return//////////////////////////
//         {
//           $lookup: {
//             from: "t_900_purchase_returns",
//             let: { "item_id": "$item_id" },
//             pipeline: [

//               {
//                 $unwind:
//                 {
//                   path: "$return_details",
//                   preserveNullAndEmptyArrays: true
//                 }
//               },
//               {
//                 $unwind:
//                 {
//                   path: "$return_details.item_details",
//                   preserveNullAndEmptyArrays: true
//                 }
//               },
//               {
//                 $match: {
//                   $expr:
//                   {
//                     $cond: {
//                       if: r.showrooms_warehouse_id,
//                       then: {
//                         $and:
//                           [
//                             { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
//                             { $eq: ["$showroom_warehouse_id", r.showrooms_warehouse_id] },
//                             { $lte: ["$purchase_return_date", txt_from_date] }
//                           ]
//                       },
//                       else: {
//                         $and:
//                           [
//                             { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
//                             { $lte: ["$purchase_return_date", txt_from_date] }
//                           ]
//                       }
//                     }

//                   }
//                 },
//               },
//               {
//                 $project: {
//                   item_id: "$return_details.item_details.item_id",
//                   purchase_return: "$return_details.item_details.return_qty",
//                 }
//               },
//               {
//                 $group: {
//                   _id: "$item_id",
//                   purchase_return: { $sum: "$purchase_return" },
//                 }
//               }
//             ], as: "purchase_return"
//           }
//         },
//         ///Stock transfer from lookup
//         {
//           $lookup: {
//             from: 't_900_stock_transfers',
//             let: { "item_id": "$item_id" },
//             pipeline: [
//               {
//                 $unwind: {
//                   path: "$stock_transfer_details",
//                   preserveNullAndEmptyArrays: true

//                 }
//               },
//               {
//                 $match: {
//                   $expr:

//                   {
//                     $and: [
//                       { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
//                       { $eq: ["$from_showroom_warehouse_id", r.showrooms_warehouse_id] },
//                       { $lte: ["$stock_transfer_date", txt_from_date] },
//                       // { $lte: ["$stock_transfer_date", txt_to_date] },

//                     ]
//                   }
//                 }
//               },
//               {
//                 $project: {
//                   quantity: "$stock_transfer_details.quantity",
//                   from_showroom_warehouse_id: 1,
//                   to_showroom_warehouse_id: 1,
//                   stock_transfer_date: 1,
//                   stock_transfer_no: 1,
//                   stock_transfer_id: 1
//                 }
//               }
//             ], as: 'stock_transfer_from'
//           }
//         },
//         {
//           $addFields: {
//             sumTransfer: { $sum: "$stock_transfer_from.quantity" }
//           }
//         },
//         ///Stock transfer to lookup
//         {
//           $lookup: {
//             from: 't_900_stock_transfers',
//             let: { "item_id": "$item_id" },
//             pipeline: [
//               {
//                 $unwind: {
//                   path: "$stock_transfer_details",
//                   preserveNullAndEmptyArrays: true

//                 }
//               },
//               {
//                 $match: {
//                   $expr:

//                   {
//                     $and: [
//                       { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
//                       { $eq: ["$to_showroom_warehouse_id", r.showrooms_warehouse_id] },
//                       { $lte: ["$stock_transfer_date", txt_from_date] },
//                       // { $lte: ["$stock_transfer_date", txt_to_date] },

//                     ]
//                   }
//                 }
//               },
//               {
//                 $project: {
//                   quantity: "$stock_transfer_details.quantity",
//                   from_showroom_warehouse_id: 1,
//                   to_showroom_warehouse_id: 1,
//                   stock_transfer_date: 1,
//                   stock_transfer_no: 1,
//                   stock_transfer_id: 1
//                 }
//               }
//             ], as: 'stock_transfer_to'
//           }
//         },
//         {
//           $addFields: {
//             sumReceived: { $sum: "$stock_transfer_to.quantity" }
//           }
//         },
//         {
//           $unwind:
//           {
//             path: "$sales",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $unwind:
//           {
//             path: "$itemrReceved_purchase",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $unwind:
//           {
//             path: "$direct_purchase",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $unwind:
//           {
//             path: "$sales_return",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $unwind:
//           {
//             path: "$purchase_return",
//             preserveNullAndEmptyArrays: true
//           }
//         },

//         ////opening Calculation//////////
//         {
//           $addFields: {
//             sumPurchase: { $sum: ["$direct_purchase.purchase", "$itemrReceved_purchase.purchase"] }
//           }
//         },
//         {
//           $addFields: {
//             sumOpeningPlus:
//             {
//               $subtract: [
//                 {
//                   $sum: [
//                     "$sumPurchase", "$sales_return.sales_return", "$sumReceived"
//                   ]
//                 },
//                 {
//                   $sum: [
//                     "$sales.sales", "$purchase_return.purchase_return", "$sumTransfer"
//                   ]
//                 }
//               ]

//             }
//           }
//         },
//         {
//           $unset: [
//             // "stock_by_location",
//             "sales",
//             //  "direct_purchase", "itemrReceved_purchase", "purchase_return", "sales_return"
//           ]
//         },

//         {
//           $group: {
//             _id: "$item_id",
//             item_id: { $first: "$item_id" },
//             brand_id: { $first: "$brand_id" },
//             category_id: { $first: "$category_id" },
//             item: { $first: "$item" },
//             showroom_warehouse_id: { $first: "$showroom_warehouse_id" },
//             sumOpeningPlus: { $first: "$sumOpeningPlus" },
//             stock_by_location: { $first: "$stock_by_location" },
//             // sumTransfer: { $first: "$sumTransfer" },
//             // sumReceived: { $first: "$sumReceived" },
//           }
//         },
//         {
//           $unwind: {
//             path: "$stock_by_location",
//             preserveNullAndEmptyArrays: true
//           }
//         },
//         {
//           $addFields: {
//             closingStock: {
//               $cond: {
//                 if: "$stock_by_location.quantity",
//                 then: { $sum: ["$stock_by_location.quantity", "$sumOpeningPlus"] },
//                 else: "$sumOpeningPlus"//"~"//"$sumOpeningPlus"
//                 // then: {
//                 //   $subtract: [
//                 //     { $sum: ["$stock_by_location.quantity", { $abs: "$sumReceived" }] },
//                 //     { $sum: [{ $abs: "$sumOpeningPlus" }, { $abs: "$sumTransfer" }] },
//                 //   ]
//                 // },
//                 // else:{
//                 //   $subtract: [
//                 //     { $sum: [{ $abs: "$sumOpeningPlus" }, { $abs: "$sumTransfer" }] },
//                 //     { $sum: [{ $abs: "$sumReceived" }] },
//                 //   ]
//                 // }
//               }
//             }
//           }
//         },
//         {
//           $sort: { "_id": 1 }
//         },
//         {
//           $project: {
//             item_id: 1,
//             brand_id: 1,
//             category_id: 1,
//             item: 1,
//             showroom_warehouse_id: 1,
//             closingStock: 1,
//             _id: 0,
//           }
//         }
//       ])

//       if (stockRegisterOpening) {
//         stockRegisterOpening.map((r) => {
//           arr.push(r)
//         })
//       }

//       // console.log(itemData.length)
//       // console.log(showromData.length)
//       // console.log(arr.length)

//       if (arr.length === (itemData.length * showromData.length)) {
//         let item = []
//         itemData.map((itm, k) => {
//           let reqData = arr.filter((o) => o.item_id === itm.item_id)

//           showromData.map((show, s) => {

//             let showData = reqData.filter((w) => w.showroom_warehouse_id === show.showrooms_warehouse_id)
//             item.push(showData[0])

//           })

//         })
//         return res.status(200).send(item)
//       }
//       else {

//       }
//     })

//   }

//   // //new lising
//   // let stockRegisterOpening = await itemStock.aggregate([
//   //   {
//   //     $match: { "brand_id": brand_id }
//   //   }
//   // ])
//   // console.log(stockRegisterOpening)
//   // if (stockRegisterOpening) {

//   //   return res.status(200).send(stockRegisterOpening);
//   // }
//   // else {
//   //   return res.status(200).json([]);
//   // }

// };

const showroom_warehouse_stock2 = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  let condiForShowroom = { deleted_by_id: 0 };

  const showrooms_warehouse_id = req.body.showrooms_warehouse_id;
  const item_id = req.body.item_id;
  const items = req.body.item;
  const category_id = req.body.category_id;
  const brand_id = req.body.brand_id;
  // const brand_id = 134;
  // const txt_from_date = req.body.txt_from_date;
  const txt_from_date = moment().endOf("day").unix("X") * 1000;

  // const txt_from_date = moment(new Date()).unix();

  if (items) {
    condi = { ...condi, item: { $regex: items, $options: "i" } };
  }
  if (item_id) {
    condi = { ...condi, item_id: item_id };
  }
  if (category_id) {
    condi = { ...condi, category_id: category_id };
  }
  if (brand_id) {
    condi = { ...condi, brand_id: brand_id };
  }
  if (showrooms_warehouse_id) {
    condiForShowroom = {
      ...condiForShowroom,
      showrooms_warehouse_id: showrooms_warehouse_id,
    };
  }

  // old
  let showromData = await showrooms_warehouse.find(condiForShowroom, {
    _id: 0,
    showrooms_warehouse_id: 1,
    showrooms_warehouse: 1,
  });
  let itemData = await item.find(
    { brand_id: brand_id },
    { _id: 0, item_id: 1, item: 1 }
  );

  let arr = [];

  if (showromData) {
    showromData.map(async (r, i) => {
      let stockRegisterOpening = await item.aggregate([
        {
          $match: condi,
        },
        {
          $project: {
            // stock_by_location: 1,
            item_id: 1,
            item: 1,
            uom_id: 1,
            brand_id: 1,
            category_id: 1,
            stock_by_location: {
              $cond: {
                if: r.showrooms_warehouse_id,
                then: {
                  $filter: {
                    input: "$stock_by_location",
                    as: "stock_by_location",
                    cond: {
                      $eq: [
                        "$$stock_by_location.showroom_warehouse_id",
                        r.showrooms_warehouse_id,
                      ],
                    },
                  },
                },
                else: "$stock_by_location",
              },
            },
          },
        },
        {
          $addFields: {
            showroom_warehouse_id: r.showrooms_warehouse_id,
          },
        },
        ////////////////////lookup with sales/////////////////////////
        {
          $lookup: {
            from: "t_900_sales",
            let: { item_id: "$item_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$invoice_item_details",
                },
              },
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: r.showrooms_warehouse_id,
                      then: {
                        $and: [
                          {
                            $eq: ["$invoice_item_details.item_id", "$$item_id"],
                          },
                          {
                            $eq: [
                              "$invoice_item_details.showroom_warehouse_id",
                              r.showrooms_warehouse_id,
                            ],
                          },
                          { $lte: ["$invoice_date", txt_from_date] },
                        ],
                      },
                      else: {
                        $and: [
                          {
                            $eq: ["$invoice_item_details.item_id", "$$item_id"],
                          },
                          { $lte: ["$invoice_date", txt_from_date] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  item_id: "$invoice_item_details.item_id",
                  qty: "$invoice_item_details.now_dispatch_qty",
                },
              },
              {
                $group: {
                  _id: "$item_id",
                  sales: { $sum: "$qty" },
                },
              },
            ],
            as: "sales",
          },
        },
        /////////////lookup purchase direct purchse////////////////////
        {
          $lookup: {
            from: "t_800_purchases",
            let: { item_id: "$item_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$item_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                      then: {
                        $cond: {
                          if: r.showrooms_warehouse_id,
                          then: {
                            $and: [
                              { $eq: ["$item_details.item_id", "$$item_id"] },
                              {
                                $eq: [
                                  "$showroom_warehouse_id",
                                  r.showrooms_warehouse_id,
                                ],
                              },
                              { $gt: ["$approve_id", 0] },
                              { $lte: ["$inserted_by_date", txt_from_date] },
                            ],
                          },
                          else: {
                            $and: [
                              { $eq: ["$item_details.item_id", "$$item_id"] },
                              { $gt: ["$approve_id", 0] },
                              { $lte: ["$inserted_by_date", txt_from_date] },
                            ],
                          },
                        },
                      },
                      else: {
                        $and: [
                          {
                            $eq: [
                              "$received_item_details.item_id",
                              "$$item_id",
                            ],
                          },
                          {
                            $eq: [
                              "$showroom_warehouse_id",
                              r.showrooms_warehouse_id,
                            ],
                          },
                          { $lte: ["$inserted_by_date", txt_from_date] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  // moudle: 1,
                  item_id: {
                    $cond: {
                      if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                      then: "$item_details.item_id",
                      else: "$received_item_details.item_id",
                    },
                  },
                  qty: {
                    $cond: {
                      if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                      then: "$item_details.quantity",
                      else: "$received_item_details.receivedQty",
                    },
                  },
                  net_value: {
                    $cond: {
                      if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                      then: "$item_details.net_value",
                      else: "$received_item_details.net_value",
                    },
                  },
                },
              },
              {
                $group: {
                  _id: "$item_id",
                  purchase: { $sum: "$qty" },
                  Purchase_net_value: { $sum: "$net_value" },
                },
              },
            ],
            as: "direct_purchase",
          },
        },
        //////////////////lookup purchase for item receved
        {
          $lookup: {
            from: "t_800_purchases",
            let: { item_id: "$item_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$received_item_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: { $in: ["$module", ["ITEMRECEIVED"]] },
                      then: {
                        $cond: {
                          if: r.showrooms_warehouse_id,
                          then: {
                            $and: [
                              {
                                $eq: [
                                  "$received_item_details.item_id",
                                  "$$item_id",
                                ],
                              },
                              {
                                $eq: [
                                  "$showroom_warehouse_id",
                                  r.showrooms_warehouse_id,
                                ],
                              },
                              { $lte: ["$inserted_by_date", txt_from_date] },
                            ],
                          },
                          else: {
                            $and: [
                              {
                                $eq: [
                                  "$received_item_details.item_id",
                                  "$$item_id",
                                ],
                              },

                              { $lte: ["$inserted_by_date", txt_from_date] },
                            ],
                          },
                        },
                      },
                      else: {
                        $and: [
                          {
                            $eq: [
                              "$received_item_details.item_id",
                              "$$item_id",
                            ],
                          },
                          {
                            $eq: [
                              "$showroom_warehouse_id",
                              r.showrooms_warehouse_id,
                            ],
                          },
                          { $lte: ["$inserted_by_date", txt_from_date] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  // moudle: 1,
                  item_id: {
                    $cond: {
                      if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                      then: "$item_details.item_id",
                      else: "$received_item_details.item_id",
                    },
                  },
                  qty: {
                    $cond: {
                      if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                      then: "$item_details.quantity",
                      else: "$received_item_details.receivedQty",
                    },
                  },
                  net_value: {
                    $cond: {
                      if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                      then: "$item_details.net_value",
                      else: "$received_item_details.net_value",
                    },
                  },
                },
              },
              {
                $group: {
                  _id: "$item_id",
                  purchase: { $sum: { $toDouble: "$qty" } },
                  Purchase_net_value: { $sum: { $toDouble: "$net_value" } },
                },
              },
            ],
            as: "itemrReceved_purchase",
          },
        },

        ///////////sales return lookup////////////////////
        {
          $lookup: {
            from: "t_900_sales_returns",
            let: { item_id: "$item_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$dispatch_return_item_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: r.showrooms_warehouse_id,
                      then: {
                        $and: [
                          {
                            $eq: [
                              "$dispatch_return_item_details.item_id",
                              "$$item_id",
                            ],
                          },
                          {
                            $eq: [
                              "$showroom_warehouse_id",
                              r.showrooms_warehouse_id,
                            ],
                          },
                          { $lte: ["$sales_return_date", txt_from_date] },
                        ],
                      },
                      else: {
                        $and: [
                          {
                            $eq: [
                              "$dispatch_return_item_details.item_id",
                              "$$item_id",
                            ],
                          },
                          { $lte: ["$sales_return_date", txt_from_date] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  item_id: "$dispatch_return_item_details.item_id",
                  sales_return: "$dispatch_return_item_details.actualRetrun",
                },
              },
              {
                $group: {
                  _id: "$item_id",
                  sales_return: { $sum: "$sales_return" },
                },
              },
            ],
            as: "sales_return",
          },
        },
        // ///////////////////////purchase return//////////////////////////
        {
          $lookup: {
            from: "t_900_purchase_returns",
            let: { item_id: "$item_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$return_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $unwind: {
                  path: "$return_details.item_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $cond: {
                      if: r.showrooms_warehouse_id,
                      then: {
                        $and: [
                          {
                            $eq: [
                              "$return_details.item_details.item_id",
                              "$$item_id",
                            ],
                          },
                          {
                            $eq: [
                              "$showroom_warehouse_id",
                              r.showrooms_warehouse_id,
                            ],
                          },
                          { $lte: ["$purchase_return_date", txt_from_date] },
                        ],
                      },
                      else: {
                        $and: [
                          {
                            $eq: [
                              "$return_details.item_details.item_id",
                              "$$item_id",
                            ],
                          },
                          { $lte: ["$purchase_return_date", txt_from_date] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  item_id: "$return_details.item_details.item_id",
                  purchase_return: "$return_details.item_details.return_qty",
                },
              },
              {
                $group: {
                  _id: "$item_id",
                  purchase_return: { $sum: "$purchase_return" },
                },
              },
            ],
            as: "purchase_return",
          },
        },
        ///Stock transfer from lookup
        {
          $lookup: {
            from: "t_900_stock_transfers",
            let: { item_id: "$item_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$stock_transfer_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                      {
                        $eq: [
                          "$from_showroom_warehouse_id",
                          r.showrooms_warehouse_id,
                        ],
                      },
                      { $lte: ["$stock_transfer_date", txt_from_date] },
                      // { $lte: ["$stock_transfer_date", txt_to_date] },
                    ],
                  },
                },
              },
              {
                $project: {
                  quantity: "$stock_transfer_details.quantity",
                  from_showroom_warehouse_id: 1,
                  to_showroom_warehouse_id: 1,
                  stock_transfer_date: 1,
                  stock_transfer_no: 1,
                  stock_transfer_id: 1,
                },
              },
            ],
            as: "stock_transfer_from",
          },
        },
        {
          $addFields: {
            sumTransfer: { $sum: "$stock_transfer_from.quantity" },
          },
        },
        ///Stock transfer to lookup
        {
          $lookup: {
            from: "t_900_stock_transfers",
            let: { item_id: "$item_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$stock_transfer_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$stock_transfer_details.item_id", "$$item_id"] },
                      {
                        $eq: [
                          "$to_showroom_warehouse_id",
                          r.showrooms_warehouse_id,
                        ],
                      },
                      { $lte: ["$stock_transfer_date", txt_from_date] },
                      // { $lte: ["$stock_transfer_date", txt_to_date] },
                    ],
                  },
                },
              },
              {
                $project: {
                  quantity: "$stock_transfer_details.quantity",
                  from_showroom_warehouse_id: 1,
                  to_showroom_warehouse_id: 1,
                  stock_transfer_date: 1,
                  stock_transfer_no: 1,
                  stock_transfer_id: 1,
                },
              },
            ],
            as: "stock_transfer_to",
          },
        },
        {
          $addFields: {
            sumReceived: { $sum: "$stock_transfer_to.quantity" },
          },
        },
        {
          $unwind: {
            path: "$sales",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$itemrReceved_purchase",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$direct_purchase",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$sales_return",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$purchase_return",
            preserveNullAndEmptyArrays: true,
          },
        },

        ////opening Calculation//////////
        {
          $addFields: {
            sumPurchase: {
              $sum: [
                "$direct_purchase.purchase",
                "$itemrReceved_purchase.purchase",
              ],
            },
            sumPurchase_Net_Value: {
              $sum: [
                "$direct_purchase.Purchase_net_value",
                "$itemrReceved_purchase.Purchase_net_value",
              ],
            },
          },
        },
        {
          $addFields: {
            sumOpeningPlus: {
              $subtract: [
                {
                  $sum: [
                    "$sumPurchase",
                    "$sales_return.sales_return",
                    "$sumReceived",
                  ],
                },
                {
                  $sum: [
                    "$sales.sales",
                    "$purchase_return.purchase_return",
                    "$sumTransfer",
                  ],
                },
              ],
            },
          },
        },
        {
          $unset: [
            // "stock_by_location",
            "sales",
            //  "direct_purchase", "itemrReceved_purchase", "purchase_return", "sales_return"
          ],
        },

        {
          $group: {
            _id: "$item_id",
            item_id: { $first: "$item_id" },
            brand_id: { $first: "$brand_id" },
            category_id: { $first: "$category_id" },
            item: { $first: "$item" },
            showroom_warehouse_id: { $first: "$showroom_warehouse_id" },
            sumOpeningPlus: { $first: "$sumOpeningPlus" },
            sumPurchaseQty: { $first: "$sumPurchase" },
            sumPurchase_Net_Value: { $first: "$sumPurchase_Net_Value" },
            stock_by_location: { $first: "$stock_by_location" },
            // sumTransfer: { $first: "$sumTransfer" },
            // sumReceived: { $first: "$sumReceived" },
          },
        },
        {
          $unwind: {
            path: "$stock_by_location",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            closingStock: {
              $cond: {
                if: "$stock_by_location.quantity",
                then: {
                  $sum: ["$stock_by_location.quantity", "$sumOpeningPlus"],
                },
                else: "$sumOpeningPlus", //"~"//"$sumOpeningPlus"
                // then: {
                //   $subtract: [
                //     { $sum: ["$stock_by_location.quantity", { $abs: "$sumReceived" }] },
                //     { $sum: [{ $abs: "$sumOpeningPlus" }, { $abs: "$sumTransfer" }] },
                //   ]
                // },
                // else:{
                //   $subtract: [
                //     { $sum: [{ $abs: "$sumOpeningPlus" }, { $abs: "$sumTransfer" }] },
                //     { $sum: [{ $abs: "$sumReceived" }] },
                //   ]
                // }
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            item_id: 1,
            brand_id: 1,
            category_id: 1,
            item: 1,
            showroom_warehouse_id: 1,
            closingStock: 1,
            sumNetValue: 1,
            sumPurchaseQty: 1,
            sumPurchase_Net_Value: 1,
            _id: 0,
          },
        },
      ]);

      if (stockRegisterOpening) {
        stockRegisterOpening.map((r) => {
          arr.push(r);
        });
      }

      // console.log(itemData.length)
      // console.log(showromData.length)
      // console.log(arr.length)

      if (arr.length === itemData.length * showromData.length) {
        let item = [];
        itemData.map((itm, k) => {
          let reqData = arr.filter((o) => o.item_id === itm.item_id);

          showromData.map((show, s) => {
            let showData = reqData.filter(
              (w) => w.showroom_warehouse_id === show.showrooms_warehouse_id
            );
            item.push(showData[0]);
          });
        });
        return res.status(200).send(item);
      } else {
      }
    });
  }

  // //new lising
  // let stockRegisterOpening = await itemStock.aggregate([
  //   {
  //     $match: { "brand_id": brand_id }
  //   }
  // ])
  // console.log(stockRegisterOpening)
  // if (stockRegisterOpening) {

  //   return res.status(200).send(stockRegisterOpening);
  // }
  // else {
  //   return res.status(200).json([]);
  // }
};

const itemStockStorage = async (req, res) => {
  const data = req.body.data;
  let counter = 0
  console.log(data, '55555')
  data.map(async (r, i) => {

    const newReport = await new itemStock(r).save()
    //     console.log(r.brand_id)
    // const deleteData = await itemStock.findOneAndDelete(
    //   {
    //     brand_id:r.brand_id
    //   }
    //   )
    if ((data.length - 1) === i) {
      return res.status(200).json(`Item Stock Storing Completed`);
    }
  })
  // if (newReport) {
  //   return res.status(200).json(newReport);
  // } else {
  //   return res.status(200).json([]);
  // }
}


const stockRegisterOpeningValuation = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const showroom_warehouse_id = req.body.showroom_warehouse_id
  const item_id = req.body.item_id;
  // const item_id = 65;
  // const showroom_warehouse_id = 15;

  //for invoice search
  // const txt_from_date = req.body.date_from;
  // const txt_to_date = req.body.date_to;

  const txt_from_date = 1754667701898;

  if (item_id) {
    condi = { ...condi, "invoice_item_details.item_id": item_id };
  }

  let stockRegisterClosing = await item.aggregate([
    {
      $project: {
        stock_by_location: 1,
        item_id: 1,
        item: 1,
        uom_id: 1,
        value: 1
        // "stock_by_location.quantity":1,
        // "stock_by_location.purchase_rate":1
        // stock_by_location: {
        //   $filter: {
        //     input: "$stock_by_location",
        //     as: "stock_by_location",
        //     cond: {
        //       $eq: [
        //         "$$stock_by_location.showroom_warehouse_id",
        //         Number(showroom_warehouse_id),
        //       ],
        //     },
        //   },
        // },
      },
    },

    {
      $addFields: {
        Quantity: { $first: "$stock_by_location.quantity" },
        Rate: { $first: "$stock_by_location.rate" },
        Value: { $first: "$stock_by_location.value" }
      },
    },

    {
      $group: {
        _id: "item_id",
        Quantity: { $sum: "$Quantity" },
        Rate: { $sum: "$Rate" },
        Value: { $sum: "$Value" }

      }
    }

  ]);

  if (stockRegisterClosing) {
    return res.status(200).send(stockRegisterClosing);
  } else {
    return res.status(200).json([]);
  }
};




const avg_value = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  // const from_date = req.body.from_date;
  // const to_date = req.body.to_date;
  // const item_id = req.body.item_id;
  const item_id = "";
  const from_date = 165595823;
  const to_date = 1654492823;

  if (item_id) {
    condition = { ...condition, item_id: item_id };
  }
  let cond2 = {};
  let cond3 = {};


  let closing_stock_data = await purchase.aggregate([
    {
      $unwind: {
        path: "$item_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            { $in: ["$module", ["DIRECT PURCHASE"]] },
            { $ne: ["$approve_id", 0] },
          ],
        },
      },
    },
    {
      $project: {
        item_id: {
          $cond: {
            if: { $in: ["$module", ["DIRECT PURCHASE"]] },
            then: "$item_details.item_id",
            else: "$received_item_details.item_id",
          },
        },
        quantity: {
          $cond: {
            if: { $in: ["$module", ["DIRECT PURCHASE"]] },
            then: "$item_details.quantity",
            else: "$received_item_details.receivedQty",
          },
        },
        rate: {
          $cond: {
            if: {
              $in: ["$module", ["DIRECT PURCHASE"]],
            },
            then: "$item_details.rate",
            else: "$received_item_details.rate",
          },
        },
        net_value: {
          $cond: {
            if: {
              $in: ["$module", ["DIRECT PURCHASE"]],
            },
            then: "$item_details.net_value",
            else: "$received_item_details.net_value",
          },
        },
        module: 1,
        grn_no: { $first: "$grn_details.grn_no" },
        grn_date: { $first: "$grn_details.grn_date" },
        vendor_id: 1,
        approve_id: 1,
        check: "purchase",
      },
    },
    {
      $unionWith: {
        coll: "t_800_purchases",
        pipeline: [
          {
            $unwind: {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$module", ["ITEMRECEIVED"]] },
                  { $ne: ["$approve_id", 0] },
                ],
              },
            },
          },
          {
            $project: {
              vendor_id: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.item_id",
                  else: "$item_details.item_id",
                },
              },
              quantity: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.receivedQty",
                  else: "$item_details.quantity",
                },
              },
              rate: {
                $cond: {
                  if: {
                    $in: ["$module", ["ITEMRECEIVED"]],
                  },
                  then: "$received_item_details.rate",
                  else: "$item_details.rate",
                },
              },
              net_value: {
                $cond: {
                  if: {
                    $in: ["$module", ["DIRECT PURCHASE"]],
                  },
                  then: "$item_details.net_value",
                  else: "$received_item_details.net_value",
                },
              },
              module: 1,
              grn_no: { $first: "$grn_details.grn_no" },
              grn_date: { $first: "$grn_details.grn_date" },
              approve_id: 1,
              check: "purchase",
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: "$check",
        SumQuantity: { $sum: "$quantity" },
        // SumRate: { $sum: "$rate" },
        SumNetValue: { $sum: "$net_value" },
        // rate:{$divide:["$SumNetValue","$SumQuantity"]}
      },
    },
  ]);

  if (closing_stock_data) {
    return res.status(200).send(closing_stock_data);
  } else {
    return res.status(200).json([]);
  }
};


const closingSto_Valuation = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  // const showroom_warehouse_id = req.body.showroom_warehouse_id
  const item_id = req.body.item_id;
  // const item_id = 65;
  const showroom_warehouse_id = 15;

  //for invoice search
  // const txt_from_date = req.body.date_from;
  // const txt_to_date = req.body.date_to;

  const txt_from_date = 1754667701898;

  if (item_id) {
    condi = { ...condi, "invoice_item_details.item_id": item_id };
  }

  let stockRegisterClosing = await item.aggregate([
    {
      $project: {
        // stock_by_location: 1,
        item_id: 1,
        item: 1,
        uom_id: 1,
        stock_by_location: {
          $filter: {
            input: "$stock_by_location",
            as: "stock_by_location",
            cond: {
              $eq: [
                "$$stock_by_location.showroom_warehouse_id",
                Number(showroom_warehouse_id),
              ],
            },
          },
        },
      },
    },
    ////////////////////lookup with sales/////////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$invoice_item_details",
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  // { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                  { $lte: ["$invoice_date", txt_from_date] },
                ],
              },
            },
          },
          {
            $project: {
              // "_id": 0,
              // item_id: "$invoice_item_details.item_id",
              qty: "$invoice_item_details.now_dispatch_qty",
            },
          },
          {
            $group: {
              _id: 0,
              sales: { $sum: "$qty" },
            },
          },
        ],
        as: "sales",
      },
    },
    /////////////lookup purchase direct purchse////////////////////
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$item_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      // { $eq: ["$item_details.item_id", "$$item_id"] },
                      { $ne: ["$approve_id", 0] },
                      { $lte: ["$inserted_by_date", txt_from_date] },
                    ],
                  },
                  else: {
                    $and: [
                      // { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $lte: ["$inserted_by_date", txt_from_date] },
                    ],
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.item_id",
                  else: "$received_item_details.item_id",
                },
              },
              qty: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.quantity",
                  else: "$received_item_details.receivedQty",
                },
              },
            },
          },
          {
            $group: {
              _id: 0,
              purchase: { $sum: "$qty" },
            },
          },
        ],
        as: "direct_purchase",
      },
    },
    //////////////////lookup purchase for item receved
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      // { $eq: ["$item_details.item_id", "$$item_id"] },

                      { $ne: ["$approve_id", 0] },

                      { $lte: ["$inserted_by_date", txt_from_date] },
                    ],
                  },
                  else: {
                    $and: [
                      // { $eq: ["$received_item_details.item_id", "$$item_id"] },
                      { $lte: ["$inserted_by_date", txt_from_date] },
                    ],
                  },
                },
              },
            },
          },
          {
            $project: {
              purchase: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: 0,
                  else: "$received_item_details.receivedQty",
                },
              },
            },
          },
          {
            $group: {
              _id: 0,
              purchase: { $sum: { $toDouble: "$purchase" } },
            },
          },
        ],
        as: "itemrReceved_purchase",
      },
    },
    /////////////sales return lookup////////////////////
    {
      $lookup: {
        from: "t_900_sales_returns",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$dispatch_return_item_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  // { $eq: ["$dispatch_return_item_details.item_id", "$$item_id"] },
                  { $lte: ["$sales_return_date", txt_from_date] },
                ],
              },
            },
          },
          {
            $project: {
              item_id: "$dispatch_return_item_details.item_id",
              sales_return: "$dispatch_return_item_details.actualRetrun",
            },
          },
          {
            $group: {
              _id: 0,
              sales_return: { $sum: "$sales_return" },
            },
          },
        ],
        as: "sales_return",
      },
    },
    ///////////////////////purchase return//////////////////////////
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$return_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  // { $eq: ["$return_details.item_details.item_id", "$$item_id"] },
                  { $lte: ["$purchase_return_date", txt_from_date] },
                ],
              },
            },
          },
          {
            $project: {
              // item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty",
            },
          },
          {
            $group: {
              _id: 0,
              purchase_return: { $sum: "$purchase_return" },
            },
          },
        ],
        as: "purchase_return",
      },
    },
    {
      $unwind: {
        path: "$sales",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$direct_purchase",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$sales_return",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$stock_by_location",
        preserveNullAndEmptyArrays: true,
      },
    },
    ////opening Calculation//////////
    {
      $addFields: {
        sumPurchase: {
          $sum: [
            "$direct_purchase.purchase",
            "$itemrReceved_purchase.purchase",
          ],
        },
      },
    },
    {
      $addFields: {
        sumOpeningPlus: {
          $subtract: [
            {
              $sum: [
                { $toDouble: "$stock_by_location.quantity" },
                "$sumPurchase",
                "$sales_return.sales_return",
              ],
            },
            {
              $sum: ["$sales.sales", "$purchase_return.purchase_return"],
            },
          ],
        },
      },
    },
    {
      $unset: [
        "stock_by_location",
        "sales",
        "direct_purchase",
        "itemrReceved_purchase",
        "purchase_return",
        "sales_return",
      ],
    },

    {
      $group: {
        _id: 0,
        sumClosingStockQty: { $first: "$sumOpeningPlus" },
      },
    },
  ]);

  if (stockRegisterClosing) {
    return res.status(200).send(stockRegisterClosing);
  } else {
    return res.status(200).json([]);
  }
};


const itemOpeningStock = async (req, res) => {
  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  const showroom_warehouse_id = req.body.showroom_warehouse_id;
  const item_id = req.body.item_id;
  const items = req.body.item;
  // /const items = req.body.item;
  const brand_id = req.body.brand_id;
  const category_id = req.body.category_id;
  //for invoice search
  const txt_from_date = req.body.date_from;
  const txt_to_date = req.body.date_to;
  // const txt_from_date = 1648751400;
  // const txt_to_date = 1655490599;

  // if (item_id) {
  //   condi = { ...condi, "item_id": item_id };
  // }
  if (showroom_warehouse_id) {
    condi = { ...condi, showroom_warehouse_id: showroom_warehouse_id };
  }
  console.log(showroom_warehouse_id, "sankha")

  if (items) {
    condi = { ...condi, item: { $regex: items, $options: "i" } };
  }

  if (brand_id) {
    condi = { ...condi, brand_id: brand_id };
  }
  if (category_id) {
    condi = { ...condi, category_id: category_id };
  }
  // console.log("sen1706=>1", txt_from_date);
  // console.log("sen1706=>2", txt_to_date);

  let openingStock = await item.aggregate([
    {
      $match: condi,
    },
    {
      $project: {
        item_id: 1,
        item: 1,
        uom_id: 1,
        stock_by_location: 1,
        // stock_by_location: {
        //   $filter: {
        //     input: "$stock_by_location",
        //     as: "stock_by_location",
        //     cond: {
        //       $eq: [
        //         "$$stock_by_location.showroom_warehouse_id",
        //         Number(showroom_warehouse_id),
        //       ],
        //     },
        //   },
        // },
      },
    },
    {
      $addFields: {
        Quantity: { $first: "$stock_by_location.quantity" },
        Rate: { $first: "$stock_by_location.rate" },
        Value: { $first: "$stock_by_location.value" },
        showroom_warehouse_id: {
          $first: "$stock_by_location.showroom_warehouse_id",
        },
      },
    },
    // {
    //   $group:{
    //     _id:"",
    //     Quantity: { $first: "$Quantity" },
    //     Rate: { $first: "$Rate" },
    //     Value: { $first: "$Value" },
    //     showroom_warehouse_id:{$first:"$showroom_warehouse_id"}

    //   }
    // }
  ]);

  if (openingStock) {
    return res.status(200).send(openingStock);
  } else {
    return res.status(200).json([]);
  }
};

const viewclosingstock = async (req, res) => {
  let condition = {};
  // const from_date = req.body.from_date;
  // const to_date = req.body.to_date;
  // const item_id = req.body.item_id;
  const brand_id = req.body.brand_id;

  const item_id = req.body.item_id;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;

  const txt_from_date = 165595823;
  const to_date = 1654492823;

  if (brand_id) {
    condition = { ...condition, brand_id: brand_id };
  }
  console.log(brand_id,"sankbrand_",condition)

  if (item_id) {
    condition = { ...condition, item_id: item_id };
  }

  if (showroom_warehouse_id) {
    condition = { ...condition, showroom_warehouse_id: showroom_warehouse_id };
  }



  let closing_stock_data = await itemStock.aggregate([
    { 
      $match: condition
    },
    {
      $project: {
        item_id: 1,
        brand_id: 1,
        item: 1,
        showroom_warehouse_id: 1,
        closingStock: 1,
        sumPurchaseQty:1,
        sumPurchase_Net_Value:1
      },
    },

    {
      $lookup:
      {
        from: "t_100_brands",
        let: {
          "brand_id": "$brand_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$brand_id", "$brand_id"]
              }
            }
          }, {
            $project: {
              brand: 1,
            }
          }
        ], as: 'brand'
      }
    },
    {
      $addFields: {
        brand: "$brand.brand"
      }
    },
    {
      $lookup:
      {
        from: "t_000_showrooms_warehouses",
        let: {
          "showrooms_warehouse_id": "$showroom_warehouse_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$showrooms_warehouse_id", "$$showrooms_warehouse_id"]
              }
            }
          }, {
            $project: {
              showrooms_warehouse: 1,
              _id: 0
            }
          }
        ], as: 'showroom'
      }
    },
    {
      $addFields: {
        showroom: { $first: "$showroom.showrooms_warehouse" }
      }
    },
    {
      $sort:{
        item:1
      }
    }
    // {
    //   $group: {
    //     _id: "$item_id", 
    //     item_id: {$first:"$item_id"},    
    //     brand: {$first:{ $first: "$brand" }},
    //     item: { $first: "$item"},
    //     closingStock: { $first: "$closingStock"},
    //     showroom_warehouse_id:{ $first: "$showroom_warehouse_id"}
    //   }
    // },


  ]);

  if (closing_stock_data) {
    return res.status(200).send(closing_stock_data);
  } else {
    return res.status(200).json([]);
  }
};

const ItemAvg_value = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  // const from_date = req.body.from_date;
  // const to_date = req.body.to_date;
  // const item_id = req.body.item_id;
  const item_id = "";
  const from_date = 165595823;
  const to_date = 1654492823;

  if (item_id) {
    condition = { ...condition, item_id: item_id };
  }
  let cond2 = {};
  let cond3 = {};

  let closing_stock_data = await purchase.aggregate([
    {
      $unwind: {
        path: "$item_details",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            { $in: ["$module", ["DIRECT PURCHASE"]] },
            { $ne: ["$approve_id", 0] },
          ],
        },
      },
    },
    {
      $project: {
        item_id: {
          $cond: {
            if: { $in: ["$module", ["DIRECT PURCHASE"]] },
            then: "$item_details.item_id",
            else: "$received_item_details.item_id",
          },
        },
        quantity: {
          $cond: {
            if: { $in: ["$module", ["DIRECT PURCHASE"]] },
            then: "$item_details.quantity",
            else: "$received_item_details.receivedQty",
          },
        },
        rate: {
          $cond: {
            if: {
              $in: ["$module", ["DIRECT PURCHASE"]],
            },
            then: "$item_details.rate",
            else: "$received_item_details.rate",
          },
        },
        net_value: {
          $cond: {
            if: {
              $in: ["$module", ["DIRECT PURCHASE"]],
            },
            then: "$item_details.net_value",
            else: "$received_item_details.net_value",
          },
        },
        module: 1,
        grn_no: { $first: "$grn_details.grn_no" },
        grn_date: { $first: "$grn_details.grn_date" },
        vendor_id: 1,
        approve_id: 1,
        check: "purchase",
      },
    },
    {
      $unionWith: {
        coll: "t_800_purchases",
        pipeline: [
          {
            $unwind: {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$module", ["ITEMRECEIVED"]] },
                  { $ne: ["$approve_id", 0] },
                ],
              },
            },
          },
          {
            $project: {
              vendor_id: 1,
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.item_id",
                  else: "$item_details.item_id",
                },
              },
              quantity: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.receivedQty",
                  else: "$item_details.quantity",
                },
              },
              rate: {
                $cond: {
                  if: {
                    $in: ["$module", ["ITEMRECEIVED"]],
                  },
                  then: "$received_item_details.rate",
                  else: "$item_details.rate",
                },
              },
              net_value: {
                $cond: {
                  if: {
                    $in: ["$module", ["DIRECT PURCHASE"]],
                  },
                  then: "$item_details.net_value",
                  else: "$received_item_details.net_value",
                },
              },
              module: 1,
              grn_no: { $first: "$grn_details.grn_no" },
              grn_date: { $first: "$grn_details.grn_date" },
              approve_id: 1,
              check: "purchase",
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: "$check",
        SumQuantity: { $sum: "$quantity" },
        // SumRate: { $sum: "$rate" },
        SumNetValue: { $sum: "$net_value" },
        // rate:{$divide:["$SumNetValue","$SumQuantity"]}
      },
    },
  ]);

  if (closing_stock_data) {
    return res.status(200).send(closing_stock_data);
  } else {
    return res.status(200).json([]);
  }
};


const Opening = async (req, res) => {
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
      $match: condition,
    },
    {
      $project: {
        item_id: 1,
        brand_id: 1,

        stock_by_location: 1,

        item: 1,
        mrp: 1,
      },
    },

    //////Brand Lookup
    {
      $lookup: {
        from: "t_100_brands",
        let: { brand_id: "$brand_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$brand_id", "$$brand_id"],
              },
            },
          },
          {
            $project: {
              brand: 1,
            },
          },
        ],
        as: "brand_details",
      },
    },
    {
      $addFields: {
        brand_name: { $first: "$brand_details.brand" },
      },
    },
    { $unset: ["brand_details"] },
    {
      $unwind: {
        path: "$stock_by_location",
        
      }
    },


    {
      $addFields: {
        showroom_warehouse_id:
          "$stock_by_location.showroom_warehouse_id",
      },
    },
    {
      $lookup: {
        from: "t_000_showrooms_warehouses",
        let: {
          showrooms_warehouse_id: "$showroom_warehouse_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$showrooms_warehouse_id", "$$showrooms_warehouse_id"],
              },
            },
          },
          {
            $project: {
              showrooms_warehouse: 1,
              _id: 0,
            },
          },
        ],
        as: "showroom",
      },
    },
    {
      $addFields: {
        showroom: { $first: "$showroom.showrooms_warehouse" },
      },
    },

    {
      $addFields: {
        Quantity: "$stock_by_location.quantity",
        Rate: "$stock_by_location.rate",
        Value: "$stock_by_location.value",
        showroom_warehouse_id: "$stock_by_location.showroom_warehouse_id",
      },
    },
    {
      $sort:{
        item:1
      }
    }

  ]);

  if (itemData) {
    return res.status(200).send(itemData);
  } else {
    return res.status(200).json([]);
  }
};


const viewclosingstockValuation = async (req, res) => {
  let condition = {};
  // const from_date = req.body.from_date;
  // const to_date = req.body.to_date;
  // const item_id = req.body.item_id;
  const brand_id = req.body.brand_id;

  const item_id = req.body.item_id;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;

  const txt_from_date = 165595823;
  const to_date = 1654492823;

  if (brand_id) {
    condition = { ...condition, brand_id: brand_id };
  }
  console.log(brand_id,"sankbrand_",condition)

  if (item_id) {
    condition = { ...condition, item_id: item_id };
  }

  if (showroom_warehouse_id) {
    condition = { ...condition, showroom_warehouse_id: showroom_warehouse_id };
  }



  let closing_stock_data = await itemStock.aggregate([
    { 
      $match: condition
    },
    {
      $project: {
        item_id: 1,        
        closingStock: 1,
        sumPurchaseQty:1,
        sumPurchase_Net_Value:1,
        check:"close"
      },
    },

   
    {
      $group: {
        _id: "$close", 
        closingStock:{$sum:"$closingStock"},
        sumPurchaseQty:{$sum:"$sumPurchaseQty"},
        sumPurchase_Net_Value:{$sum:"$sumPurchase_Net_Value"}

      }
    },


  ]);

  if (closing_stock_data) {
    return res.status(200).send(closing_stock_data);
  } else {
    return res.status(200).json([]);
  }
};


const view_closing_Stock_Valuation = async (req, res) => {
  let condition = {  };

  const from_date = 165595823;
  const to_date = 1654492823;
  const brand_id = req.body.brand_id;
  const item_id = req.body.item_id;
  const showroom_warehouse_id = req.body.showroom_warehouse_id;

  if (item_id) {
    condition = { ...condition, item_id: item_id };
  }
  if (brand_id ) {
    condition = { ...condition, brand_id: brand_id };
  }

  if (showroom_warehouse_id) {
    condition = { ...condition, showroom_warehouse_id: showroom_warehouse_id };
  }

  // let closing_stock_data1 = await itemStock.aggregate([
  //   {
  //     $project: {
  //       item_id: 1,
  //       brand_id: 1,
  //       item: 1,
  //       showroom_warehouse_id: 1,
  //       closingStock: 1,
  //     },
  //   },

  //   {
  //     $lookup: {
  //       from: "t_100_brands",
  //       let: {
  //         brand_id: "$brand_id",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$$brand_id", "$brand_id"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             brand: 1,
  //           },
  //         },
  //       ],
  //       as: "brand",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       brand: "$brand.brand",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "t_000_showrooms_warehouses",
  //       let: {
  //         showrooms_warehouse_id: "$showroom_warehouse_id",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$showrooms_warehouse_id", "$$showrooms_warehouse_id"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             showrooms_warehouse: 1,
  //             _id: 0,
  //           },
  //         },
  //       ],
  //       as: "showroom",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       showroom: { $first: "$showroom.showrooms_warehouse" },
  //     },
  //   },

  //   // {
  //   //   $group: {
  //   //     _id: "$item_id",
  //   //     item_id: {$first:"$item_id"},
  //   //     brand: {$first:{ $first: "$brand" }},
  //   //     item: { $first: "$item"},
  //   //     closingStock: { $first: "$closingStock"},
  //   //     showroom_warehouse_id:{ $first: "$showroom_warehouse_id"}
  //   //   }
  //   // },
  // ]);
  // let closing_stock_data2 = await itemStock.aggregate([
  //   {$match: {item_id:7160}},
  //   {
  //     $project: {
  //       item_id: 1,
  //       brand_id: 1,
  //       item: 1,
  //       showroom_warehouse_id: 1,
  //       closingStock: 1,
  //     },
  //   },

  //   {
  //     $lookup: {
  //       from: "t_100_brands",
  //       let: {
  //         brand_id: "$brand_id",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$$brand_id", "$brand_id"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             brand: 1,
  //           },
  //         },
  //       ],
  //       as: "brand",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       brand: "$brand.brand",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "t_000_showrooms_warehouses",
  //       let: {
  //         showrooms_warehouse_id: "$showroom_warehouse_id",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$showrooms_warehouse_id", "$$showrooms_warehouse_id"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             showrooms_warehouse: 1,
  //             _id: 0,
  //           },
  //         },
  //       ],
  //       as: "showroom",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       showroom: { $first: "$showroom.showrooms_warehouse" },
  //     },
  //   },
  //   {

  //   $lookup:  {
  //     from: "t_800_purchases",
  //     let: { item_id: "$item_id" },

     
      
  //     pipeline: [

  //           {
  //             $unwind: {
  //               path: "$item_details",
  //               preserveNullAndEmptyArrays: true,
  //             },
  //           },
  //             {
  //               $match: {
  //                 $expr:
  //                 {   $and: 
  //                   [
                    
  //                       // {$eq: ["$showroom_warehouse_id", "$$showroom_warehouse_id"],},
  //                       {$eq: ["$$item_id", "$item_details.item_id"],},
  //                     ]}
  //             },
  //             },
  //             {
  //               $project: {
  //                 "item_details.item_id": 1,
  //                 "item_details.quantity": 1,
  //                 "item_details.rate": 1,                   
  //                 showroom_warehouse_id:1,

  //               },
  //             },
  //            {
  //             $group:
  //             {
  //               _id:"$showroom_warehouse_id",
  //               sumQty:{$sum:"$item_details.quantity"}
  //             }
  //            },
  //           ],
  //           as:"helPurchase"
  //     }
  //   },

 
  //   // {
  //   //   $group: {
  //   //     _id: "$showroom_warehouse_id",
  //   //     item_id:{$first:"$item_id"},
  //   //     Quantity: { $first: "$helPurchase.sumQty" },
  //   //     showroom: { $first: "$showroom" },
  //   //     brand_id:{$first:"$brand_id"},
  //   //     brand: { $first: "$brand" },
  //   //     item: { $first: "$item" },
  //   //     closingStock:{$first:"$closingStock"}



  //   //     // SumNetValue: { $sum: "$net_value" },
  //   //     // rate:{$divide:["$SumNetValue","$SumQuantity"]}
  //   //   },
  //   // },
  // ]);

  // let closing_stock_data2 = await itemStock.aggregate([
  //   {$match: condition },
  //   {
  //     $project: {
  //       item_id: 1,
  //       brand_id: 1,
  //       item: 1,
  //       showroom_warehouse_id: 1,
  //       closingStock: 1,
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "t_100_brands",
  //       let: {
  //         brand_id: "$brand_id",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$$brand_id", "$brand_id"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             brand: 1,
  //           },
  //         },
  //       ],
  //       as: "brand",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       brand: "$brand.brand",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "t_000_showrooms_warehouses",
  //       let: {          
  //         showrooms_warehouse_id: "$showroom_warehouse_id",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$showrooms_warehouse_id", "$$showrooms_warehouse_id"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             showrooms_warehouse: 1,
  //             _id: 0,
  //           },
  //         },
  //       ],
  //       as: "showroom",
  //     },
  //   },
  //   {
  //     $addFields: {
  //       showroom: {$first: "$showroom.showrooms_warehouse"},
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "t_800_purchases",
  //       let: {item_id: "$item_id", showroom_warehouse_id: "$showroom_warehouse_id"},
  //       pipeline: [
  //         {
  //           $unwind: {
  //             path: "$item_details",
  //             preserveNullAndEmptyArrays: true,
  //           },
  //         },
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 {$eq: ["$$item_id", "$item_details.item_id"]},
  //                 {$eq: ["$$showroom_warehouse_id", "$showroom_warehouse_id"]},
  //               ],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             "item_details.item_id": 1,
  //             "item_details.quantity": 1,

  //             "item_details.net_value": 1,
  //             showroom_warehouse_id: 1,
  //           },
  //         },
  //         {
  //           $group: {
  //             _id: "$showroom_warehouse_id",
  //             sumQty: {
  //               $sum: {
  //                 $ifNull: ["$item_details.quantity", 0]
  //               }},
  //             sumValue:{$sum:
  //               { $ifNull:
  //                [ "$item_details.net_value",0]
  //               }
  //             }
  //           },
  //         },

  //       ],
  //       as: "helPurchase",
  //     },
  //   },

  //   {
  //     $sort: {
  //       brand: 1
  //     }
  //   }

    

  // ]);

  let closing_stock_data2 = await itemStock.aggregate([
    {$match: condition },
    {
      $project: {
        item_id: 1,
        brand_id: 1,
        item: 1,
        showroom_warehouse_id: 1,
        closingStock: 1,
        sumPurchaseQty:1,
        
sumPurchase_Net_Value:1
      },
    },
    {
      $lookup: {
        from: "t_100_brands",
        let: {
          brand_id: "$brand_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$brand_id", "$brand_id"],
              },
            },
          },
          {
            $project: {
              brand: 1,
            },
          },
        ],
        as: "brand",
      },
    },
    {
      $addFields: {
        brand: "$brand.brand",
      },
    },
    {
      $lookup: {
        from: "t_000_showrooms_warehouses",
        let: {          
          showrooms_warehouse_id: "$showroom_warehouse_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$showrooms_warehouse_id", "$$showrooms_warehouse_id"],
              },
            },
          },
          {
            $project: {
              showrooms_warehouse: 1,
              _id: 0,
            },
          },
        ],
        as: "showroom",
      },
    },
    {
      $addFields: {
        showroom: {$first: "$showroom.showrooms_warehouse"},
      },
    },
    

    

  ]);
  

  if (closing_stock_data2) {
    return res.status(200).send(closing_stock_data2);
  } else {
    return res.status(200).json([]);
  }
};



module.exports = {
  stockRegisterList,
  dashboardStatsReport,
  stockVoucher,
  stockRegisterOpening,
  view_avg_stock,
  stockRegisterClosingStock,
  stockRegisterTransaction,
  showroom_warehouse_stock,
  showroom_warehouse_stock2,
  itemStockStorage,
  stockRegisterOpeningValuation,
  avg_value,
  closingSto_Valuation,
  itemOpeningStock,
  viewclosingstock,
  ItemAvg_value,
  Opening,
  viewclosingstockValuation,
  view_closing_Stock_Valuation
};
