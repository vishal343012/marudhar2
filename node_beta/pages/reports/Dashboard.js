const router = require("express").Router();
const moment = require("moment");
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { apiList } = require("../../config/api");
var express = require("express");
const { customer } = require("../../modals/MasterReference");
const { BrandReport } = require("../../modals/BrandReport");

/* 
const viewRecentActivities = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const customer_id = req.body.customer_id;
  const customer_name = req.body.customer;
  const company_name = req.body.company_name;
  const inserted_by_date = req.body.inserted_by_date;
  const searchQuery = inserted_by_date;
  
  console.log(req.body.inserted_by_date,"recive date");


  // Details by ID
  if (inserted_by_date ) {
    condition = { ...condition, "$expr": { 
        "$regexMatch": {
          "input": {"$toString": "$inserted_by_date"},
          "regex": "^" + (inserted_by_date.toString().substring(0,5)) 
        }  
      }
    };
  }


  console.log(condition,"chk0")
  await customer
    .find(condition, (err, customerData) => {
  //   console.log(customerData,"data")
      if (err) {
        return res.status(500).json({ Error: err });
      }
      if (customerData) {
          console.log(customerData,"cust data")
        let returnDataArr = customerData.map((data) => ({
          //customer_id: groupById(all_customer, data.customer_id),
          ...data["_doc"],
        }));
        console.log(returnDataArr,"return data")
        return res.status(200).json(returnDataArr);
      } else {
          console.log("")
        return res.status(200).json([]);
      }
    })
    .select({ customer_id: 1, company_name: 1, _id: 0 });
  
}; */

const viewRecentActivities = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const inserted_by_date = req.body.inserted_by_date;
  console.log(req.body.inserted_by_date,"recive date");

  // Details by ID
  if (inserted_by_date ) {
    condition = { ...condition, 
        // "$expr": {
        //   "input": {"$toString": "$inserted_by_date"},
        //   "regex": new RegExp("/^"+inserted_by_date.toString().substring(0,5)+"/")
        // }  

        //inserted_by_date:  "/^" + (inserted_by_date.toString().substring(0,5)) + "/" 
        //inserted_by_date: {$regex: "/" + inserted_by_date.toString().substring(0,5) + "/" } 
        //inserted_by_date: /^16426/
        //inserted_by_date: new RegExp("^"+inserted_by_date.toString().substring(0,5))
        insert_date: req.body.inserted_by_date,
      };
  };
  
  

  console.log(condition,"ppppp");

  let queryData=await customer.aggregate( [
    { $addFields: { "insert_date": { "$dateToString": { 
        "format": "%Y-%m-%d", 
        "date": {"$toDate" : {
            "$toLong": "$inserted_by_date"
          }} }}} },
    { $match: condition },
    // { $match: { $expr: {
    //   $gt: [{ $toDouble: "$inserted_by_date" }, inserted_by_date],
    // }} },
    { $project: { company_name: 1, contact_person: 1, insert_date: 1,
      inserted_by_id:1
       } },
    { $addFields: { flag: 1 } },
    {
      $lookup:
      {
        from:"users",
        let: {"user_id" : "$inserted_by_id"},
        pipeline:[
          {
            $match:{ $expr: { $eq: ["$$user_id", "$user_id"]}}
          },
          {
            $project:{
              _id:0,
              name:1,
            }
          }
        ],as:"user"
      }
    },
    { $addFields: { inserted_by: {$first:"$user.name"} } },
    {$unset:"user"},
    { $unionWith: { 
      coll: "t_500_vendors",
      pipeline: [
        { $addFields: { "insert_date": { "$dateToString": { 
          "format": "%Y-%m-%d", 
          "date": {"$toDate" : {
              "$toLong": "$inserted_by_date"
            }} }}} },
        { $match: condition },
        { $project: { company_name: 1, contact_person: 1, insert_date: 1,inserted_by_id:1 } },
        {
          $lookup:
          {
            from:"users",
            let: {"user_id" : "$inserted_by_id"},
            pipeline:[
              {
                $match:{ $expr: { $eq: ["$$user_id", "$user_id"]}}
              },
              {
                $project:{
                  _id:0,
                  name:1,
                }
              }
            ],as:"user"
          }
        },
        { $addFields: { inserted_by: {$first:"$user.name"} } },
        {$unset:"user"},
        { $addFields: { flag: 2 } }
      ]
    } },
    {
              $sort : { insert_date: -1 } 
         
        }
  
  ]);

  if(queryData){
    console.log(queryData.length);
    return res.status(200).send(queryData);
  }

  else {
    return res.status(200).json([]);
  }
};


const getSalesStats = async (req, res) => {

  const weekFromDate = req.body.weekFromDate
  const weekToDate = req.body.weekToDate
  const monthFromDate = req.body.monthFromDate
  const monthToDate = req.body.monthToDate

  const quarterFromDate = req.body.quarterFromDate
  const quarterToDate = req.body.quarterToDate

  const dayFromDate = req.body.dayFromDate
  const dayToDate = req.body.dayToDate

  const yearFromDate = req.body.yearFromDate
  const yearToDate = req.body.yearToDate

  let salesData = await BrandReport.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $gte: ['$invoice_date', yearFromDate] },
            { $lte: ['$invoice_date', yearToDate] }
          ]
        }
      }
    },
    {
      $project: {
        invoice_date: 1,
        netAmount: 1,
        grossAmount:1,
        mode: "Year"
      }
    },
    {
      $group: {
        _id: '$mode',
        totalYear: { $sum: "$netAmount" },
        totalGrossYear:{ $sum: "$grossAmount" },
      }
    },
    {
      $unionWith: {
        coll: "t_800_brandreports",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$invoice_date', quarterFromDate] },
                  { $lte: ['$invoice_date', quarterToDate] }
                ]
              }
            }
          },
          {
            $project: {
              invoice_date: 1,
              netAmount: 1,
              grossAmount:1,
              mode: "Quarter"
            }
          },
          {
            $group: {
              _id: '$mode',
              totalQuarter: { $sum: "$netAmount" },
              totalGrossQuarter:{ $sum: "$grossAmount" },
            }
          }
        ]
      }
    },
    {
      $unionWith: {
        coll: "t_800_brandreports",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$invoice_date', monthFromDate] },
                  { $lte: ['$invoice_date', monthToDate] }
                ]
              }
            }
          },
          {
            $project: {
              invoice_date: 1,
              netAmount: 1,
              grossAmount:1,
              mode: "Monthly"
            }
          },
          {
            $group: {
              _id: '$mode',
              totalMonthly: { $sum: "$netAmount" },
              totalGrossMonthly:{ $sum: "$grossAmount" },
            }
          }
        ]
      }
    },
    {
      $unionWith: {
        coll: "t_800_brandreports",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$invoice_date', weekFromDate] },
                  { $lte: ['$invoice_date', weekToDate] }
                ]
              }
            }
          },
          {
            $project: {
              invoice_date: 1,
              netAmount: 1,
              grossAmount:1,
              mode: "Weekly"
            }
          },
          {
            $group: {
              _id: '$mode',
              totalWeekly: { $sum: "$netAmount" },
              totalGrossWeekly:{ $sum: "$grossAmount" },
            }
          }
        ]
      }
    },
    {
      $unionWith: {
        coll: "t_800_brandreports",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$invoice_date', dayFromDate] },
                  { $lte: ['$invoice_date', dayToDate] }
                ]
              }
            }
          },
          {
            $project: {
              invoice_date: 1,
              netAmount: 1,
              grossAmount:1,
              mode: "Day"
            }
          },
          {
            $group: {
              _id: '$mode',
              totalDay: { $sum: "$netAmount"},
              totalGrossDay:{ $sum: "$grossAmount" },
            }
          }
        ]
      }
    },
  ])

  if (salesData) {
    return res.status(200).send(salesData);
  }

  else {
    return res.status(200).json([]);
  }
}
module.exports = {
    viewRecentActivities,
    getSalesStats,
    };


    // let all_customer = await customer
    // .find({}, (err, customerData) => {
    //   return customerData;
    // })
    // .select({customer_id: 1, group: 1, _id: 0 });

    // const groupById = (all_customer, customer_id) => {
    //     if (customer_id === 0) return "--";
    //     for (let iCtr = 0; iCtr < all_customer.length; iCtr++) {
    //       if (all_customer[iCtr]["customer_id"] === customer_id)
    //         return all_customer[iCtr]["customer"];
    //     }
    //   };
    
    // //search
    // console.log(searchQuery,"serch");
    // if (searchQuery) {
    //     condition = {
    //       ...condition,
    //       $or: [
    //         { inserted_by_date: new RegExp(searchQuery, "i") },
            
    //       ],
    //     }; // Matching string also compare incase-sensitive
    //     console.log(condition,"uuu");
    //   }
