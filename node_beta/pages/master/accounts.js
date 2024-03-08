const router = require("express").Router();
const moment = require("moment");
const {
  primary_group,
  account_nature,
  ledger_group,
  ledger_account,
  tax_master,
  charges,
  bank_master,
} = require("../../modals/MasterAccounts");

const { storage } = require("../../modals/ledgerStorage");
// const moduleInsert = async (req, res) => {
//   const data = req.body;
//   const errors = {};
//   let newModule = new modules(data);
//   const insertedModule = await newModule.save();
//   return res.status(200).json({ _id: insertedModule._id });
// };

const AccountMasterInsert = async (req, res) => {
  const data = req.body;
  const URL = req.url;
  const errors = {};
  let newMaster = "";

  switch (URL) {
    case "/primary_group/insert":
      newMaster = new primary_group(data);
      break;
    case "/account_nature/insert":
      newMaster = new account_nature(data);
      break;
    case "/ledger_group/insert":
      newMaster = new ledger_group(data);
      break;

    case "/ledger_account/insert":
      newMaster = new ledger_account(data);
      break;

    case "/tax_master/insert":
      newMaster = new tax_master(data);
      break;

    case "/charges/insert":
      newMaster = new charges(data);
      break;

    case "/bank_master/insert":
      newMaster = new bank_master(data);
      break;
  }

  const insertedMaster = await newMaster.save();
  return res
    .status(200)
    .json({
      _id: insertedMaster._id,
      ledger_account_id: insertedMaster?.ledger_account_id
        ? insertedMaster?.ledger_account_id
        : 0,
    });
};

const viewPrimaryGroup = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const primary_group_id = req.body.primary_group_id;
  const primary_group = req.body.primary_group;
  const short_data = req.body.short_data ? req.body.short_data : false; // Will use this for sending limited fields only
  const searchQuery = req.body.query;

  //console.log(req.body)

  // Details by ID
  if (primary_group_id) {
    condition = { ...condition, primary_group_id: primary_group_id };
  }

  // Details by Name
  if (primary_group) {
    condition = {
      ...condition,
      primary_group: { $regex: "^" + primary_group + "$", $options: "i" },
    };
  } // Matching exact text but incase-sensitive

  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { primary_group: { $regex: searchQuery, $options: "i" } },
        { details: { $regex: searchQuery, $options: "i" } },
      ],
    }; // Matching string also compare incase-sensitive
  }
  //console.log(condition)
  await primary_group
    .find(condition, (err, primaryGroupData) => {
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (primaryGroupData) {
        // (v => ({...v, isActive: true}))

        //  categoriesData.forEach(data){
        //     console.log(data)
        //  }

        let returnDataArr = primaryGroupData.map((data) => ({
          // let can_edit=true;
          // let can_delete=true;
          // let can_activate=( data.active_status==="N" ? true : false);
          // let can_deactivate=( data.active_status==="Y" ? true : false);

          // data={
          //     can_edit:can_edit,
          //     can_delete:can_delete,
          //     can_activate:can_activate,
          //     can_deactivate:can_deactivate
          //     }
          ...data["_doc"],
          can_edit: false,
          can_delete: true,
          can_activate: true,
          can_deactivate: false,
        }));

        // returnDataArr=categoriesData;

        //console.log(categoriesData)

        //categoriesData={...categoriesData, parent_category_name:"test"}

        return res.status(200).json(returnDataArr);
      } else {
        return res.status(200).json([]);
      }
    })
    .select(
      short_data === true && {
        primary_group_id: 1,
        primary_group_id: 1,
        _id: 0,
      }
    );
};

// //// data insert
// const view_ledger_balance = async (req, res) => {
//   let condition = { deleted_by_id: 0 };
//   const from_date = moment(moment("2022-04-01").format("x"), "x").unix();
//   const to_date = moment(moment("2022-04-30").format("x"), "x").unix() + 86399;
//   const ledger_account_id = req.body.ledger_account_id;
//   const ledger_account_name = req.body.ledger_account;
//   // const ledgerAccountOpt = req.body.ledgerAccountOpt;

//   console.log("start")

//   if (ledger_account_id) {
//     condition = { ...condition, ledger_account_id: 3328 };
//   }

//   if (ledger_account_name) {
//     condition = { ...condition, ledger_account: ledger_account_name };
//   }

//   let ledger_balance_data = await ledger_account.aggregate(
//     [
//       { $match: { ledger_account_id: 2530 } },
//       {
//         $project:
//         {
//           ledger_account_id: 1,
//           ledger_group_id: 1,
//           ledger_account: 1,
//           opening_balance: 1,
//           dr_cr_status: 1,
//           type_id: 1,
//           type: 1,
//           _id: 0
//         }
//       },
//       {
//         $lookup:
//         {
//           from: 't_200_journals',
//           let: { "ledger_account_id": "$ledger_account_id" },
//           pipeline: [
//             { $unwind: "$journal_details" },
//             {
//               $match:
//               {
//                 $expr: {
//                   $eq: ["$$ledger_account_id", "$journal_details.ddl_ledger_id"]
//                 }
//               }
//             },
//             {
//               $project: {
//                 _id: 0,
//                 ledger_account_id: 1,
//                 journal_id: 1,
//                 journal_details: 1,
//                 voucher_date: 1,
//                 debit_balance: {
//                   $cond: {
//                     if: {
//                       $and: [{ $in: ["$journal_details.dr_cr", [1]] },
//                       { $gte: ["$voucher_date", from_date] }, { $lt: ["$voucher_date", to_date] }]
//                     },
//                     then: "$journal_details.amount", else: 0
//                   }
//                 },
//                 credit_balance: {
//                   $cond: {
//                     if: {
//                       $and: [{ $in: ["$journal_details.dr_cr", [2]] },
//                       { $gte: ["$voucher_date", from_date] }, { $lt: ["$voucher_date", to_date] }]
//                     },
//                     then: "$journal_details.amount", else: 0
//                   }
//                 },
//               }
//             },
//             {
//               $group: {
//                 _id: "$journal_details.ddl_ledger_id",
//                 debit_balance: { $sum: "$debit_balance" },
//                 credit_balance: { $sum: "$credit_balance" },
//               }
//             },
//           ],
//           as: 'journals'
//         }
//       },
//       {
//         $lookup: {
//           from: 't_200_receipt_payments',
//           let: { "ledger_account_id": "$ledger_account_id" },
//           pipeline: [
//             // { $match:
//             //   { $expr: {
//             //       $eq: ["$$ledger_account_id", "$ledger_account_id"]
//             //     }
//             //   }
//             // },

//             {
//               $match: {
//                 $expr: {
//                   $and: [

//                     {
//                       $or: [
//                         { $eq: ["$$ledger_account_id", "$ledger_account_id"] },

//                         { $eq: ["$$ledger_account_id", "$bank_id"] }
//                       ]
//                     },
//                     { $eq: ["$deleted_by_id", 0] },
//                     {$gte:["$voucher_date",from_date]},
//                     {$lte:["$voucher_date",to_date]}

//                   ]
//                   ,
//                 }

//               }
//             },

//             {
//               $project: {
//                 _id: 0,
//                 //ledger_account_id: 1,
//                 // $bank_id:1
//                 ledger_account_id: {
//                   $cond: {
//                     if: { $eq: ["$ledger_account_id", "$$ledger_account_id"] },

//                     then: "$ledger_account_id", else: "$bank_id"
//                   }
//                 },
//                 receipt_payment_id: 1,
//                 receipt_payment_type: 1,
//                 voucher_date: 1,
//                 amount: 1,
//                 debit_balance: {
//                   $cond: {
//                     if: {
//                       $or: [{
//                         $and: [{ $in: ["$receipt_payment_type", ["R", "BP"]] },
//                         // { $lte: ["$voucher_date", to_date] },
//                         { $eq: ["$bank_id", "$$ledger_account_id"] }]
//                       },
//                       {
//                         $and: [{ $in: ["$receipt_payment_type", ["P", "BR"]] },
//                         // { $lte: ["$voucher_date", to_date] },
//                         { $eq: ["$ledger_account_id", "$$ledger_account_id"] }]
//                       }]
//                     },
//                     then: "$amount", else: 0
//                   }
//                 },
//                 credit_balance: {
//                   $cond: {
//                     if: {
//                       $or: [{
//                         $and: [{ $in: ["$receipt_payment_type", ["P", "BR"]] },
//                         { $lte: ["$voucher_date", to_date] }, { $eq: ["$bank_id", "$$ledger_account_id"] }]
//                       },
//                       {
//                         $and: [{ $in: ["$receipt_payment_type", ["R", "BP"]] },
//                         { $lte: ["$voucher_date", to_date] }, { $eq: ["$ledger_account_id", "$$ledger_account_id"] }]
//                       }]
//                     },
//                     then: "$amount", else: 0
//                   }
//                 },
//                 dr_cr_status: {
//                   //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
//                   $cond: {
//                     if: { $or: [{ $and: [{ $eq: ["$bank_id", "$$ledger_account_id"] }, { $eq: ["$receipt_payment_type", "R"] },] }, { $and: [{ $eq: ["$ledger_account_id", "$$ledger_account_id"] }, { $eq: ["$receipt_payment_type", "P"] },] }] },
//                     then: "Dr", else: "Cr"
//                   }
//                 },
//               }
//             },
//             {
//               $group: {
//                 _id: "$ledger_account_id",
//                 debit_balance: { $sum: "$debit_balance" },
//                 credit_balance: { $sum: "$credit_balance" },
//               }
//             },
//           ],
//           as: 'receipt_payments'
//         }
//       },
//       {
//         $unwind:
//         {
//           path: "$journals",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $unwind:
//         {
//           path: "$receipt_payments",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $addFields: {
//           closing_balance: {
//             $cond: {
//               if: {
//                 $and:
//                   [
//                     { $eq: ["$dr_cr_status", "Dr"] }
//                   ]
//               },
//               then: {
//                 $subtract: [
//                   {
//                     $sum: ["$opening_balance",
//                       { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }]
//                   },
//                   { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] },

//                 ]
//               },

//               else: {
//                 $subtract: [
//                   {
//                     $sum: ["$opening_balance",
//                       { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance",] }]
//                   },
//                   { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }]
//               }
//             }
//           }
//         }
//       },
//       ////DR CR status/////////////////////////////////////
//       {
//         $addFields: {

//           current_dr_cr: {
//             $switch: {
//               branches: [
//                 {
//                   //// Case 1 op!=0 && o.drcr = dr
//                   case: {
//                     $and: [
//                       { $ne: ["$opening_balance", 0] },
//                       { $eq: ["$dr_cr_status", "Dr"] },
//                       {
//                         $gte: [
//                           {
//                             $subtract: [
//                               { $sum: ["$opening_balance", "$receipt_payments.debit_balance", "$journals.debit_balance"] },
//                               { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
//                             ]
//                           }, 0]
//                       }
//                     ]
//                   },
//                   then: "Dr"
//                 },
//                 {
//                   //// Case 1.1 op!=0 && o.drcr = dr && cr>dr
//                   case: {
//                     $and: [
//                       { $ne: ["$opening_balance", 0] },
//                       { $eq: ["$dr_cr_status", "Dr"] },
//                       {
//                         $gte: [
//                           {
//                             $subtract: [
//                               { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] },
//                               { $sum: ["$opening_balance", "$receipt_payments.debit_balance", "$journals.debit_balance"] }

//                             ]
//                           }, 0]
//                       }
//                     ]
//                   },
//                   then: "Cr"
//                 },
//                 //////case 2op!=0 && o.drcr =cr
//                 {
//                   case: {
//                     $and: [
//                       { $ne: ["$opening_balance", 0] },
//                       { $eq: ["$dr_cr_status", "Cr"] },
//                       {
//                         $gte: [
//                           {
//                             $subtract: [
//                               { $sum: ["$opening_balance", "$receipt_payments.credit_balance", "$journals.credit_balance"] },
//                               { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }
//                             ]
//                           }, 0]
//                       }
//                     ]
//                   },
//                   then: "Cr"
//                 },
//                 {
//                   case: {
//                     $and: [
//                       { $ne: ["$opening_balance", 0] },
//                       { $eq: ["$dr_cr_status", "Cr"] },
//                       {
//                         $gte: [
//                           {
//                             $subtract: [
//                               { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] },
//                               { $sum: ["$opening_balance", "$receipt_payments.credit_balance", "$journals.credit_balance"] },

//                             ]
//                           }, 0]
//                       }
//                     ]
//                   },
//                   then: "Dr"
//                 },
//                 //////Case 3: op=0 && Dr-Cr>0
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ["$opening_balance", 0] },
//                       {
//                         $gte: [
//                           {
//                             $subtract: [
//                               { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] },
//                               { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
//                             ]
//                           }, 0]
//                       }
//                     ]
//                   },
//                   then: "Dr"
//                 },

//                 //////Case 4: op=0 && Dr-Cr<0
//                 {
//                   case: {
//                     $and: [
//                       { $eq: ["$opening_balance", 0] },
//                       {
//                         $gte: [
//                           {
//                             $subtract: [
//                               { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] },
//                               { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }
//                             ]
//                           }, 0]
//                       }
//                     ]
//                   },
//                   then: "Cr"
//                 }
//               ],
//               default: "-"
//             }
//           }
//         }
//       },
//       // { $unset: ["journals", "receipt_payments"] },
//     ]
//   );

//   if (ledger_balance_data) {
//     console.log("ledger_balance_data", ledger_balance_data.length);

//     // ledger_balance_data.length && ledger_balance_data.map(async (r, i) => {
//     //   const autoStorage = await new storage({
//     //     ledgerId: r.ledger_account_id,
//     //     ledgerGroupId:r.ledger_group_id,
//     //     typeId: r.type_id?r.type_id:0,
//     //     type: r.type?r.type:"Not Present",
//     //     ledgerName: r.ledger_account,
//     //     openCrDrStatus: r.dr_cr_status,
//     //     openingBalance: r.opening_balance,
//     //     closingBalance: r.closing_balance,
//     //     closeCrDrStatus: r.current_dr_cr,
//     //     updatedDate: Number(moment().format('X')),
//     //     financialYear: "22-23",
//     //   }).save()
//     // })

//     return res.status(200).send(ledger_balance_data);
//   }
//   else {
//     return res.status(200).json([]);
//   }

// }

const view_ledger_balance = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const from_date = req.body.from_date;
  const to_date = req.body.to_date;
  const ledger_account_id = req.body.ledger_account_id;
  const ledger_account_name = req.body.ledger_account;

  if (ledger_account_id) {
    condition = { ...condition, ledger_account_id: ledger_account_id };
  }

  if (ledger_account_name) {
    condition = { ...condition, ledger_account: ledger_account_name };
  }

  let ledger_balance_data = await ledger_account.aggregate([
    { $match: condition },
    {
      $project: {
        ledger_account_id: 1,
        ledger_account: 1,
        opening_balance: 1,
        dr_cr_status: 1,
        _id: 0,
      },
    },
    {
      $lookup: {
        from: "t_200_journals",
        let: { ledger_account_id: "$ledger_account_id" },
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
                ],
              },
            },
          },
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
                      { $in: ["$journal_details.dr_cr", [1]] },
                      { $gte: ["$voucher_date", from_date] },
                      { $lt: ["$voucher_date", to_date] },
                    ],
                  },
                  then: { $toDouble: "$journal_details.amount" },
                  else: 0,
                },
              },
              credit_balance: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ["$journal_details.dr_cr", [2]] },
                      { $gte: ["$voucher_date", from_date] },
                      { $lt: ["$voucher_date", to_date] },
                    ],
                  },
                  then: { $toDouble: "$journal_details.amount" },
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
        let: { ledger_account_id: "$ledger_account_id" },
        pipeline: [
          // { $match:
          //   { $expr: {
          //       $eq: ["$$ledger_account_id", "$ledger_account_id"]
          //     }
          //   }
          // },

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

          {
            $project: {
              _id: 0,
              //ledger_account_id: 1,
              // $bank_id:1
              ledger_account_id: {
                $cond: {
                  if: { $eq: ["$ledger_account_id", ledger_account_id] },

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
                          { $lt: ["$voucher_date", to_date] },
                          { $eq: ["$bank_id", ledger_account_id] },
                        ],
                      },
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["P", "BR"]] },
                          { $lt: ["$voucher_date", to_date] },
                          { $eq: ["$ledger_account_id", ledger_account_id] },
                        ],
                      },
                    ],
                  },
                  then: { $toDouble: "$amount" },
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
                          { $lt: ["$voucher_date", to_date] },
                          { $eq: ["$bank_id", ledger_account_id] },
                        ],
                      },
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["R", "BP"]] },
                          { $lt: ["$voucher_date", to_date] },
                          { $eq: ["$ledger_account_id", ledger_account_id] },
                        ],
                      },
                    ],
                  },
                  then: { $toDouble: "$amount" },
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
                          { $eq: ["$bank_id", ledger_account_id] },
                          { $eq: ["$receipt_payment_type", "R"] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ["$ledger_account_id", ledger_account_id] },
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
    // { $let: { vars: {all_debit_balance: { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"]},
    //  all_credit_balance:  {$sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }}}},
    {
      // $addFields:{b:{$sum: [ "$receipt_payments.credit_balance"] }},
      $addFields: {
        closing_balance: {
          $cond: {
            if: { $eq: ["$dr_cr_status", "Dr"] },
            then: {
              $subtract: [
                {
                  $sum: [
                    "$journals.credit_balance",
                    "$receipt_payments.credit_balance",
                  ],
                },
                {
                  $sum: [
                    "$opening_balance",
                    {
                      $sum: [
                        "$journals.debit_balance",
                        "$receipt_payments.debit_balance",
                      ],
                    },
                  ],
                },
              ],
            },

            else: {
              $subtract: [
                {
                  $sum: [
                    "$opening_balance",
                    {
                      $sum: [
                        "$journals.credit_balance",
                        "$receipt_payments.credit_balance",
                      ],
                    },
                  ],
                },
                {
                  $sum: [
                    "$journals.debit_balance",
                    "$receipt_payments.debit_balance",
                  ],
                },
              ],
            },
          },
        },
      },
    },
    ////DR CR status/////////////////////////////////////
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
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.debit_balance",
                                "$journals.debit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Dr",
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
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.debit_balance",
                                "$journals.debit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Cr",
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
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.credit_balance",
                                "$journals.credit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Cr",
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
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.credit_balance",
                                "$journals.credit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Dr",
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
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Dr",
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
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Cr",
              },
            ],
            default: "-",
          },
        },
        // currrent_dr_cr: {
        //   $switch: {
        //     branches: [
        //       {
        //         //// Case 1 op!=0 && o.drcr = dr
        //         case: {
        //           $and: [
        //             { $ne: ["$opening_balance", 0] },
        //             { $eq: ["$dr_cr_status", "Dr"] },
        //             {
        //               $gte: [
        //                 {
        //                   $subtract: [
        //                     { $sum: ["$opening_balance", "$journals.debit_balance", "$receipt_payments.debit_balance"] },
        //                     { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
        //                   ]
        //                 }, 0]
        //             }
        //           ]
        //         },
        //         then: "Dr"
        //       },
        //       //////case 2op!=0 && o.drcr =cr
        //       {
        //         case: {
        //           $and: [
        //             { $ne: ["$opening_balance", 0] },
        //             { $eq: ["$dr_cr_status", "Cr"] },
        //             {
        //               $gte: [
        //                 {
        //                   $subtract: [
        //                     { $sum: ["$opening_balance", "$journals.credit_balance", "$receipt_payments.credit_balance"] },
        //                     { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }
        //                   ]
        //                 }, 0]
        //             }
        //           ]
        //         },
        //         then: "Cr"
        //       },
        //       //////Case 3 op=0
        //       {
        //         case: {
        //           $and: [
        //             { $eq: ["$opening_balance", 0] },
        //             {
        //               $gte: [
        //                 {
        //                   $subtract: [
        //                     { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] },
        //                     { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
        //                   ]
        //                 }, 0]
        //             }
        //           ]
        //         },
        //         then: "Dr"
        //       }
        //     ],
        //     default: "Cr"
        //   }
        // }
      },
    },
    { $unset: ["journals", "receipt_payments"] },
  ]);

  console.log("ledger_balance_data", ledger_balance_data);

  // const promises = ledger_balance_data.map(async (ledgerData) => {      
  //   return ledgerData;
  // });

  // const finalResults = await Promise.all(promises);


  // if (finalResults.length > 0) {
  //   return res.status(200).send(finalResults);
  // } else {
  //   return res.status(200).json([]);
  // }

  if (ledger_balance_data) {
    return res.status(200).send(ledger_balance_data);
  } else {
    return res.status(200).json([]);
  }
};

// // // // //// ledger storage data insert
const insertLedgerStorage = async (req, res) => {
  let condition = {};
  const from_date = moment(moment("2022-04-01").format("x"), "x").unix();
  const to_date = moment(
    moment("2023-03-31").endOf("day").format("x"),
    "x"
  ).unix();
  const {
    ledger_account_id,
    ledger_account_name,
    lowestLedgerId,
    biggestLedgerId,
  } = req.body;

  if (ledger_account_id) {
    condition = { ...condition, ledger_account_id: { $in: ledger_account_id } };
  }

  if (ledger_account_name) {
    condition = { ...condition, ledger_account: ledger_account_name };
  }

  console.log("start");

  let ledger_balance_data = await ledger_account.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $gt: ["$ledger_account_id", lowestLedgerId] },
            { $lt: ["$ledger_account_id", biggestLedgerId] },
          ],
        },
      },
    },
    {
      $project: {
        ledger_account_id: 1,
        ledger_group_id: 1,
        ledger_account: 1,
        opening_balance: 1,
        dr_cr_status: 1,
        type_id: 1,
        type: 1,
        _id: 0,
      },
    },
    {
      $lookup: {
        from: "t_200_journals",
        let: { ledger_account_id: "$ledger_account_id" },
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
                ],
              },
            },
          },
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
                      { $in: ["$journal_details.dr_cr", [1]] },
                      { $gte: ["$voucher_date", from_date] },
                      { $lte: ["$voucher_date", to_date] },
                    ],
                  },
                  then: { $toDouble: "$journal_details.amount" },
                  else: 0,
                },
              },
              credit_balance: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ["$journal_details.dr_cr", [2]] },
                      { $gte: ["$voucher_date", from_date] },
                      { $lte: ["$voucher_date", to_date] },
                    ],
                  },
                  then: { $toDouble: "$journal_details.amount" },
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
    // {
    //   $lookup:
    //   {
    //     from: 't_200_journals',
    //     let: { "ledger_account_id": "$ledger_account_id" },
    //     pipeline: [
    //       // {
    //       //   $sort:{
    //       //     transaction_id:1
    //       //   }
    //       // },
    //       { $unwind: "$journal_details" },
    //       {
    //         $match:
    //         {
    //           $expr: {
    //             $eq: ["$$ledger_account_id", "$journal_details.ddl_ledger_id"]
    //           }
    //         }
    //       },

    //       {
    //         $project: {
    //           _id: 0,
    //           ledger_account_id: 1,
    //           journal_id: 1,
    //           journal_details: 1,
    //           voucher_date: 1,
    //           debit_balance: {
    //             $cond: {
    //               if: {
    //                 $and: [{ $in: ["$journal_details.dr_cr", [1]] },
    //                 { $gte: ["$voucher_date", from_date] }, { $lte: ["$voucher_date", to_date] }]
    //               },
    //               then:  "$journal_details.amount", else: 0
    //             }
    //           },
    //           credit_balance: {
    //             $cond: {
    //               if: {
    //                 $and: [{ $in: ["$journal_details.dr_cr", [2]] },
    //                 { $gte: ["$voucher_date", from_date] }, { $lte: ["$voucher_date", to_date] }]
    //               },
    //               then:  "$journal_details.amount", else: 0
    //             }
    //           },
    //         }
    //       },
    //       {
    //         $group: {
    //           _id: "$journal_details.ddl_ledger_id",
    //           debit_balance: { $addToSet: "$debit_balance" },
    //           credit_balance: { $addToSet: "$credit_balance" },
    //         }
    //       },

    //     ],
    //     as: 'journals_chk'
    //   }
    // },
    {
      $lookup: {
        from: "t_200_receipt_payments",
        let: { ledger_account_id: "$ledger_account_id" },
        pipeline: [
          // { $match:
          //   { $expr: {
          //       $eq: ["$$ledger_account_id", "$ledger_account_id"]
          //     }
          //   }
          // },

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
                  { $gte: ["$voucher_date", from_date] },
                  { $lte: ["$voucher_date", to_date] },
                ],
              },
            },
          },

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
                          { $lte: ["$voucher_date", to_date] },
                          { $eq: ["$bank_id", "$$ledger_account_id"] },
                        ],
                      },
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["P", "BR"]] },
                          { $lte: ["$voucher_date", to_date] },
                          {
                            $eq: ["$ledger_account_id", "$$ledger_account_id"],
                          },
                        ],
                      },
                    ],
                  },
                  then: { $toDouble: "$amount" },
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
                          { $lte: ["$voucher_date", to_date] },
                          { $eq: ["$bank_id", "$$ledger_account_id"] },
                        ],
                      },
                      {
                        $and: [
                          { $in: ["$receipt_payment_type", ["R", "BP"]] },
                          { $lte: ["$voucher_date", to_date] },
                          {
                            $eq: ["$ledger_account_id", "$$ledger_account_id"],
                          },
                        ],
                      },
                    ],
                  },
                  then: { $toDouble: "$amount" },
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
    {
      $addFields: {
        closing_balance: {
          $cond: {
            if: {
              $and: [{ $eq: ["$dr_cr_status", "Dr"] }],
            },
            then: {
              $subtract: [
                {
                  $sum: [
                    "$opening_balance",
                    {
                      $sum: [
                        "$journals.debit_balance",
                        "$receipt_payments.debit_balance",
                      ],
                    },
                  ],
                },
                {
                  $sum: [
                    "$journals.credit_balance",
                    "$receipt_payments.credit_balance",
                  ],
                },
              ],
            },

            else: {
              $subtract: [
                {
                  $sum: [
                    "$opening_balance",
                    {
                      $sum: [
                        "$journals.credit_balance",
                        "$receipt_payments.credit_balance",
                      ],
                    },
                  ],
                },
                {
                  $sum: [
                    "$journals.debit_balance",
                    "$receipt_payments.debit_balance",
                  ],
                },
              ],
            },
          },
        },
      },
    },
    ////DR CR status/////////////////////////////////////
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
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.debit_balance",
                                "$journals.debit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Dr",
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
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.debit_balance",
                                "$journals.debit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Cr",
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
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.credit_balance",
                                "$journals.credit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Cr",
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
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$opening_balance",
                                "$receipt_payments.credit_balance",
                                "$journals.credit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Dr",
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
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Dr",
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
                            {
                              $sum: [
                                "$journals.credit_balance",
                                "$receipt_payments.credit_balance",
                              ],
                            },
                            {
                              $sum: [
                                "$journals.debit_balance",
                                "$receipt_payments.debit_balance",
                              ],
                            },
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                then: "Cr",
              },
            ],
            default: "-",
          },
        },
      },
    },
    // { $unset: ["journals", "receipt_payments"] },
  ]);

  if (ledger_balance_data) {
    console.log("ledger_balance_data", ledger_balance_data.length);

    console.log("end");

    ledger_balance_data.length &&
      ledger_balance_data.map(async (r, i) => {
        const autoStorage = await new storage({
          ledgerId: r.ledger_account_id,
          ledgerGroupId: r.ledger_group_id,
          typeId: r.type_id ? r.type_id : 0,
          type: r.type ? r.type : "Not Present",
          ledgerName: r.ledger_account,
          openCrDrStatus: r.dr_cr_status,
          openingBalance: r.opening_balance,
          closingBalance: r.closing_balance,
          closeCrDrStatus: r.current_dr_cr,
          updatedDate: Number(moment().format("X")),
          financialYear: "22-23",
        }).save();
      });

    return res.status(200).send(ledger_balance_data);
  } else {
    return res.status(200).json([]);
  }
};

const editLedgerStorage = async (req, res) => {
  const ledger_account_id = req.body.ledger_account_id;
  const amount = req.body.amount;

  const data = await storage.findOneAndUpdate(
    {
      ledgerId: ledger_account_id,
    },
    [
      {
        $set: {
          closingBalance: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$closingBalance", 0],
                  },
                  then: { $subtract: ["$closingBalance", Math.abs(amount)] },
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Cr"] },
                      { $ne: ["$closingBalance", 0] },
                    ],
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: [dr_cr, 2] },
                          then: {
                            $subtract: [
                              { $abs: "$closingBalance" },
                              Math.abs(amount),
                            ],
                          },
                        },
                        {
                          case: { $eq: [dr_cr, 1] },
                          then: {
                            $subtract: [
                              { $abs: "$closingBalance" },
                              -Math.abs(amount),
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Dr"] },
                      { $ne: ["$closingBalance", 0] },
                    ],
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: [dr_cr, 2] },
                          then: {
                            $subtract: [
                              { $abs: "$closingBalance" },
                              -Math.abs(amount),
                            ],
                          },
                        },
                        {
                          case: { $eq: [dr_cr, 1] },
                          then: {
                            $subtract: [
                              { $abs: "$closingBalance" },
                              Math.abs(amount),
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
          closeCrDrStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$closingBalance", 0],
                  },
                  then: {
                    $cond: {
                      if: { $eq: [dr_cr, 1] },
                      then: "Dr",
                      else: "Cr",
                    },
                  },
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Cr"] },
                      { $ne: ["$closingBalance", 0] },
                    ],
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: [dr_cr, 2] },
                          then: "Cr",
                        },
                        {
                          case: { $eq: [dr_cr, 1] },
                          then: {
                            $cond: {
                              if: {
                                $gt: [
                                  {
                                    $subtract: [
                                      { $abs: "$closingBalance" },
                                      -Math.abs(amount),
                                    ],
                                  },
                                  0,
                                ],
                              },
                              then: "Cr",
                              else: "Dr",
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$closeCrDrStatus", "Dr"] },
                      { $ne: ["$closingBalance", 0] },
                    ],
                  },
                  then: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: [dr_cr, 2] },
                          then: {
                            $cond: {
                              if: {
                                $gt: [
                                  {
                                    $subtract: [
                                      { $abs: "$closingBalance" },
                                      -Math.abs(amount),
                                    ],
                                  },
                                  0,
                                ],
                              },
                              then: "Dr",
                              else: "Cr",
                            },
                          },
                        },
                        {
                          case: { $eq: [dr_cr, 1] },
                          then: "Dr",
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ]
  );
};

module.exports = {
  insertLedgerStorage,
  AccountMasterInsert,
  viewPrimaryGroup,
  view_ledger_balance,
  editLedgerStorage,
};
