const router = require("express").Router();
const axios = require('axios');
const { apiURL } = require('../../config/config');
const { apiList } = require('../../config/api');
const { receipt_payment, journal } = require("../../modals/Account");
const { sales } = require('../../modals/Sales');
const { customer } = require("../../modals/MasterReference");

const getAllAccData = async (req, res) => {


  let condition = { deleted_by_id: 0 };
  const journal_id = req.body.journal_id;
  const voucher_no = req.body.voucher_no;
  const voucher_date = req.body.voucher_date;
  const short_data = (req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  //this varial being use for ledger in misreports
  const voucher_from_date = req.body.voucher_from_date;
  const voucher_to_date = req.body.voucher_to_date;
  const ledger_name = req.body.ledger_name;
  const ledger_account_id = req.body.ledger_account_id;
  console.log("anna", req.body);


  // let all_ledger_account=await ledger_account.find( {} , (err,ledger_accountData) => {return ledger_accountData}).select( ({"ledger_account_id": 1, "ledger_account":1, "_id": 0} ));
  // const ledger_accountById=(all_ledger_account, ledger_account_id)=>{
  //     if(ledger_account_id===0) return "--"
  //     for(let iCtr=0; iCtr<all_ledger_account.length; iCtr++){

  //       if(all_ledger_account[iCtr]['ledger_account_id']==ledger_account_id)
  //         return all_ledger_account[iCtr]['ledger_account']
  //     }
  // }

  //console.log(req.body)

  // Details by ID
  if (journal_id) { condition = { ...condition, journal_id: journal_id } }

  // search by Ledger_name
  if (ledger_account_id) {
    console.log("cde", ledger_name);
    condition = { ...condition, 'journal_details.ddl_ledger_id': ledger_account_id };
  }

  // Details by Name
  if (voucher_no) { condition = { ...condition, primary_group: { '$regex': '^' + voucher_no + '$', $options: 'i' } } } // Matching exact text but incase-sensitive

  // Date wise
  if (voucher_from_date && voucher_to_date) {
    condition = {
      ...condition,
      voucher_date: { $gte: voucher_from_date, $lte: voucher_to_date + 86400 }
    }
  }

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { voucher_no: { '$regex': searchQuery, $options: 'i' } },
        { details: { '$regex': searchQuery, $options: 'i' } },
      ]
    } // Matching string also compare incase-sensitive 

  }
  console.log("conditioner", condition)

  // $or:[{ledger_account_id: {$eq:ledger_account_id}},{ bank_id: { $eq:ledger_account_id} }],


  await journal.aggregate(
    [
      { $match: condition },
      { "$unwind": "$journal_details" },
      {
        $project: {
          voucher_no: 1,
          'journal_details.ddl_ledger_id': 1,
          'journal_details.ddl_ledger': 1,
          'journal_details.amount': 1,
          'journal_details.dr_cr': 1,
          voucher_date: 1,
          transaction_id: 1,
          transaction_type: 1,
          narration: 1,
        }
      },

      { $addFields: { voucher_type: 'Journal' } },
      ////////////////////union with rp
      {
        $unionWith: {
          coll: "t_200_receipt_payments",
          pipeline: [
            {
              $match: {
                deleted_by_id: 0,
                $or: [{ ledger_account_id: ledger_account_id }, { bank_id: ledger_account_id }],
                voucher_date: { $gte: voucher_from_date, $lte: voucher_to_date }
              }
            },
            {
              $project:
              {
                voucher_no: 1, mode: 1, amount: 1,
                receipt_payment_type: 1, voucher_date: 1,
                ledger_account_id: 1,
                narration: 1,
                bank_id: 1,
                dr_cr: {
                  //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
                  $cond: {
                    if: {
                      $or: [{
                        $and: [{ $eq: ["$bank_id", ledger_account_id] },
                        { $in: ["$receipt_payment_type", ["R", "BP"]] },]
                      }, {
                        $and: [{ $eq: ["$ledger_account_id", ledger_account_id] },
                        { $in: ["$receipt_payment_type", ["P", "BR"]] },]
                      }]
                    },
                    then: 1, else: 2
                  }
                },
              }
            },
            //{ $addFields: { flag: 2 } }
          ]
        }
      },

      {
        $lookup: {
          from: "t_200_ledger_accounts",
          let: { "ledger_account_id": "$ledger_account_id" },
          pipeline: [
            {
              $match: { 
                $expr: {
                    $and: [
                      { $eq: ["$ledger_account_id", "$$ledger_account_id"] },
                      { $eq: ["$deleted_by_id", 0] }
                    ]
                  }, 
              },
            },
            {
              $project: { "_id": 0, "ledger_account": 1, }
            }
          ], as: "ledger_account_details"
        },
      },

      {
        $unwind:
        {
          path: "$ledger_account_details",
          preserveNullAndEmptyArrays: true
        }
      },
      { $addFields: { ledger_account_for_party: "$ledger_account_details.ledger_account" } },





      {

        $sort: { voucher_date: 1 }

      }
      //   {
      //     $group: {
      //         _id: "$voucher_no",
      //         voucher_date: { $first: "$voucher_date"},
      //         ddl_ledgers: {$addToSet: "$journal_details.ddl_ledger"},
      //         dr_cr: {$addToSet: "$journal_details.dr_cr"},
      //         amount: {$addToSet: "$journal_details.amount"},
      //         receipt_payment: { $first: "$amount" },
      //         ledger_account_id: { $first: "$ledger_account_id" },
      //         receipt_payment_type: { $first: "$receipt_payment_type" },
      //     //   //{"harness":"$harness","testDay":"$end_date"}
      //     //    item_id:{$first:"$invoice_item_details.item_id"},
      //     //    dispatched_qty:{$sum:"$dispatched_qty"},
      //     //    showroom_warehouse_id :{$first:"$invoice_item_details.showroom_warehouse_id"},
      //         // voucher_no: {$first: "$journal_details.voucher_no"}
      //       },
      //   },
    ],
    (err, journalData) => {

      if (err) {
        return res.status(500).json({ "Error": err });
      }
      if (journalData) {
        console.log("jD", journalData);
        return res.status(200).json(journalData);
      }
      else {
        return res.status(200).json([]);
      }
    });   //.select( (short_data ===true && {"journal_id": 1, "journal":1, "_id": 0} ));
}


const getAllAccDataForSalesOrder = async (req, res) => {


  let condition = { deleted_by_id: 0 };
  const journal_id = req.body.journal_id;
  const voucher_no = req.body.voucher_no;
  const voucher_date = req.body.voucher_date;
  const short_data = (req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  //this varial being use for ledger in misreports
  const voucher_from_date = req.body.voucher_from_date;
  const voucher_to_date = req.body.voucher_to_date;
  const ledger_name = req.body.ledger_name;
  const ledger_account_id = req.body.ledger_account_id;
  const customer_id = req.body.customer_id;
  const sales_status = req.body.sales_status;
  // const customer_id = 2566;
  // const ledger_account_id = 2542;
  // const voucher_from_date = 1610215400;
  // const voucher_to_date = 1617215400;


  // console.log("sen=>1", voucher_from_date);
  // console.log("sen=>2", voucher_to_date);


  let sales_order_data = await customer.aggregate([
    {
      $match: {
        customer_id: customer_id
      }
    },
    { $project: { "company_name": 1, "_id": 0 } },
    ////customer LookUp Sales Table
    {
      $lookup: {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$customer_id", customer_id] },
                  { $gte: ["$sales_order_date", voucher_from_date] },
                  { $lte: ["$sales_order_date", voucher_to_date ] }
                ]
              }
              // "customer_id": customer_id,
              // "sales_order_date": { $gte: voucher_from_date, $lte: voucher_to_date },
              // "deleted_by_id": 0,
              // "sales_status":{$ne:"37"} ,

            }
          },
          {
            $project:
            {
              customer_id: 1,
              "sales_order_no": 1,
              "sales_order_item_details.net_value": 1,
              "invoice_item_details.net_value": 1,
              "invoice_other_charges": 1,
              "sales_order_other_charges": 1,
              "sales_order_date": 1,
              "sales_status": 1,
              voucher_type: "Sales Order",
              // total:{$sum: { "$toDouble": "$sales_order_item_details.net_value" }}
            }
          },
          {
            $sort: { sales_order_date: -1 }
          },

        ],
        as: "sales"
      }
    },

    ///storing lookedup data
    { $unwind: "$sales" },
    { $addFields: { customer_id: "$sales.customer_id" } },
    { $addFields: { sales_order_no: "$sales.sales_order_no" } },
    { $addFields: { sales_order_item_details: "$sales.sales_order_item_details" } },
    { $addFields: { sales_order_other_charges: "$sales.sales_order_other_charges" } },
    { $addFields: { sales_order_date: "$sales.sales_order_date" } },
    { $addFields: { voucher_type: "Sales Order" } },
    { $addFields: { sales_status: "$sales.sales_status" } },
    { $addFields: { invoice_item_details: "$sales.invoice_item_details" } },
    { $addFields: { invoice_other_charges: "$sales.invoice_other_charges" } },
    { $unset: ['sales'] },
    {
      $unionWith:
      {
        coll: 't_200_receipt_payments',
        pipeline: [
          {
            $match: {
              voucher_date: { $gte: voucher_from_date, $lte: voucher_to_date },
              $or:
                [{
                  $and:
                    [
                      { ledger_account_id: ledger_account_id }, { deleted_by_id: 0 },
                    ]
                },
                {
                  $and:
                    [
                      { bank_id: ledger_account_id }, { deleted_by_id: 0 },
                    ]
                }
                ]


            },
          },
          {
            $project:
            {
              _id: 0,
              voucher_no: 1,
              mode: 1,
              amount: 1,
              receipt_payment_type: 1,
              voucher_date: 1,
              ledger_account_id: 1,
              narration: 1,
              bank_id: 1,
              sales_status: 1,
              dr_cr: {
                //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
                $cond: {
                  if: {
                    $or:
                      [{
                        $and: [
                          {
                            $eq:
                              ["$bank_id", ledger_account_id]
                          },
                          { $in: ["$receipt_payment_type", ["R", "BP"]] },]
                      },
                      {
                        $and: [{ $eq: ["$ledger_account_id", ledger_account_id] },
                        { $in: ["$receipt_payment_type", ["P", "BR"]] },]
                      }]
                  },
                  then: 1, else: 2
                }
              },
            }
          },

          {
            $sort: { voucher_date: -1 }
          },
        ],

      }
    },
    {
      $unionWith:
      {
        coll: 't_200_journals',
        // let: { "ledger_account_id": "$ledger_acc_id" },
        pipeline: [
          { $unwind: "$journal_details" },
          {
            $match:
            {
              $expr: {
                $and: [
                  { $eq: [ledger_account_id, "$journal_details.ddl_ledger_id"] },
                  { $eq: ["$deleted_by_id", 0] },
                  { $gte: ["$voucher_date", voucher_from_date] },
                  { $lte: ["$voucher_date", voucher_to_date] }
                ]
              }

            }

          },
          { $match: { transaction_type: { $ne: "Sales" } } },
          {
            $project: {
              voucher_no: 1,
              mode: 1,
              // 'journal_details.ddl_ledger_id': 1,
              // 'journal_details.ddl_ledger': 1,
              // amount: '$journal_details.amount',
              amount: '$voucher_amount',
              dr_cr: '$journal_details.dr_cr',
              particular: '$journal_details.ddl_ledger',
              voucher_date: 1,
              transaction_id: 1,
              transaction_type: 1,
              voucher_type: { $ifNull: ["$transaction_type", "Journal"] },
            }
          },
          {
            $sort: { voucher_date: -1 }
          },
          // { $addFields: { voucher_type: 'Journal' } }
          // {
          //   $project: {
          //     _id: 0,
          //     ledger_account_id: 1,
          //     journal_id: 1,
          //     journal_details: 1,
          //     voucher_date: 1,
          //     voucher_no: 1,
          //     debit_balance: {
          //       $cond: {
          //         if: {
          //           $and: [{ $in: ["$journal_details.dr_cr", [1]] },
          //           { $lte: ["$voucher_date", txt_to_date] }]
          //         },
          //         then: "$journal_details.amount", else: 0
          //       }
          //     },
          //     credit_balance: {
          //       $cond: {
          //         if: {
          //           $and: [{ $in: ["$journal_details.dr_cr", [2]] },
          //           { $lte: ["$voucher_date", txt_to_date] }]
          //         },
          //         then: "$journal_details.amount", else: 0
          //       }
          //     },
          //   }
          // },
          // {
          //   $group: {
          //     _id: "$journal_details.ddl_ledger_id",
          //     debit_balance: { $sum: "$debit_balance" },
          //     credit_balance: { $sum: "$credit_balance" },
          //   }
          // },
        ],
      }
    },

  ])

  // console.log("sen=>", sales_status)
  if (sales_order_data) {
    return res.status(200).json(sales_order_data);
  } else {
    return res.status(200).json([]);
  }


}
module.exports = { getAllAccData, getAllAccDataForSalesOrder };