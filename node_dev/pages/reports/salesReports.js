const router = require("express").Router();
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { apiList } = require("../../config/api");

const moment = require("moment");

const { sales } = require("../../modals/Sales");
const { customer,vendor } = require("../../modals/MasterReference");

const { CostExplorer } = require("aws-sdk");
const { brand, item } = require("../../modals/Master");
const { BrandReport } = require("../../modals/BrandReport");
const { Sales_Report_master } = require("../../modals/Report");


const showroomWiseSalesList = async (req, res) => {
  const data = req.body;
  const URL = req.url;
  const errors = {};

  let condition = {};
  let brand_id = 0;
  let item_id = 0;
  let showroom_warehouse_id = 0;

  if (data && data.item_id > 0) {
    item_id = data.item_id;
  }

  if (data && data.item_id > 0) {
    {
      condition = {
        ...condition,
        "invoice_item_details.item_id": data.item_id,
      };
    }
  }


  if (data && data.showroom_warehouse_id > 0) {
    {
      condition = {
        ...condition,
        //sales_id :322,
        'invoice_item_details.showroom_warehouse_id': data.showroom_warehouse_id,
      };
    }
  }

  let queryData = await sales.aggregate
    ([
      { $match: condition },

      {
        "$unwind": "$invoice_item_details"
      },
      {
        $project: {

          'invoice_item_details.item_id': 1,
          dispatched_qty: '$invoice_item_details.now_dispatch_qty',
          'invoice_item_details.showroom_warehouse_id': 1,

        }
      },

      {
        $group: {
          _id: { itemId: "$invoice_item_details.item_id", showroom_id: "$invoice_item_details.showroom_warehouse_id" },
          dispatched_qty: { $sum: "$dispatched_qty" },
          showroom_warehouse_id: { $first: "$invoice_item_details.showroom_warehouse_id" },
        },
      },

      {
        $lookup: {
          from: "t_100_items",
          // localField: '_id.itemId',
          //  foreignField: 'item_id',
          let: { "item_id": "$_id.itemId" },
          pipeline: [

            {
              $match: {
                $expr: { $eq: ["$item_id", "$$item_id"] },
              },
            },
            { $project: { "item": 1, "_id": 0 } }
          ],
          as: "item_details"
        }
      },

      {
        $addFields: {
          item_name: { $first: "$item_details.item" },
        },
      },

      { $unset: ["item_details"] },

    ]);
  [
    { $sort: { item_name: 1 } }
  ]


  function groupObjectsBy(collection, property) {
    var i = 0, val, index,
      values = [], result = [];
    for (; i < collection.length; i++) {
      val = collection[i][property];
      index = values.indexOf(val);
      if (index > -1)
        result[index].push(collection[i]);
      else {
        values.push(val);
        result.push([collection[i]]);
      }
    }
    return result;
  }

  var aggData = groupObjectsBy(queryData, "item_name");



  if (queryData) {
    return res.status(200).send(queryData);
  }
  else {
    return res.status(200).json([]);
  }

};


const view_salesman = async (req, res) => {


  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  let condition = {};
  // const sales_executive_id = req.body.sales_executive_id;
  // const item_id = 17;



  const user_id = req.body.user_id ? req.body.user_id : 0;

  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;

  const txt_discount_from = req.body.txt_discount_from ? req.body.txt_discount_from : 0;
  const txt_discount_to = req.body.txt_discount_to ? req.body.txt_discount_to : 100;



  if (user_id) {
    condition = { ...condition, "$enquiry_details.sales_executive_id": user_id };
  }
  //both date filter
  //  if(txt_from_date && txt_to_date)
  //  {
  //   condition={...condition,'invoice_details.invoice_date':{'$gte' :(txt_from_date) ,'$lte' :(txt_to_date)  }};
  //  }
  if (txt_from_date && txt_to_date) {
    condition = {
      ...condition,
      $gte: ["$invoice_details.invoice_date", txt_from_date],
      $lte: ["$invoice_details.invoice_date", txt_to_date]
    };
  }

  //both discount filter
  // if(txt_discount_from && txt_discount_to)
  // {
  //  //condition={...condition,'invoice_item_details.disc_percentage':{'$gte' :(txt_discount_from) ,'$lte' :(txt_discount_to)  }};

  //  condition={...condition, 'invoice_item_details.disc_percentage': {'$gte' : Number(txt_discount_from) ,'$lte' : Number(txt_discount_to) } } ;
  // }





  let salesData = await sales.aggregate([

    { "$unwind": "$invoice_details" },
    { "$unwind": "$enquiry_details" },
    { "$unwind": "$invoice_item_details" },
    {
      $match:
      {
        $expr:
        {
          $cond: {

            if: { $ne: [user_id, 0] },
            then: {
              $and:
                [
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  { $eq: ["$enquiry_details.sales_executive_id", user_id] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
            },
            else: {
              $and:
                [
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
            }

          },

        }
      }
    },

    {
      $lookup: {
        from: "t_100_items",
        let: { "item_id": "$invoice_item_details.item_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$item_id", "$item_id"] }, },
          },
          { $project: { "category_id": 1, "_id": 0 } }
        ],
        as: "category_details"
      },
    },

    { $addFields: { category_id: { $first: "$category_details.category_id" } } },
    { $unset: ["category_details"] },


    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, "parent_category_id": 1, } }
        ],
        as: "child_category_name"
      },
    },

    { $addFields: { parent_category_id: { $first: "$child_category_name.parent_category_id" } } },
    { $addFields: { child_category: { $first: "$child_category_name.category" } } },

    { $unset: ["child_category_name"] },




    {
      $lookup: {
        from: "t_100_categories",
        let: { "parent_category_id": "$parent_category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$parent_category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, } }
        ],
        as: "parent_category_name"
      },
    },

    { $addFields: { category: { $first: "$parent_category_name.category" } } },
    { $unset: ["parent_category_name"] },


    {

      $project:
      {

        // Opening_Plus:{
        //   $cond: { if: { $and:[{ $in: [ "$transaction_type", ["PR", "DR"] ] }, {$lt:["$transaction_date",from_date]}] }, then: "$plus_qty", else: 0 }
        // },

        category:
        {
          // $cond: { if: {"parent_category_id": {$ne: 0 } }, then: "$parent_category_id", else: "$child_category"  }
          $cond: { if: { $ne: ["$parent_category_id", 0] }, then: "$category", else: "$child_category" }
        },
        "invoice_item_details.net_value": 1,
        "invoice_item_details.invoice_no": 1,
        "invoice_item_details.now_dispatch_qty": 1,
        "invoice_other_charges": 1,
        "invoice_item_details.uom_name": 1,
        child_category: 1,
        parent_category_id: 1,



      }
    },
    {
      $group: {
        _id: "$category",
        child_category: { $addToSet: "$child_category" },
        sumDispatchQty: { $sum: "$invoice_item_details.now_dispatch_qty" },
        sumNetValue: { $sum: { "$toDouble": "$invoice_item_details.net_value" } },
        OtherCharges: { $addToSet: "$invoice_other_charges" },
        uom_name: { $addToSet: "$invoice_item_details.uom_name" },



      },
    },
    {

      $sort: { _id: 1 }

    }

  ]);


  if (salesData) {
    return res.status(200).json(salesData);
  } else {
    return res.status(200).json([]);
  }
};

const view_salesman_chart = async (req, res) => {


  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  let condition = {};
  // const sales_executive_id = req.body.sales_executive_id;
  // const item_id = 17;



  const user_id = req.body.user_id ? req.body.user_id : 0;

  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;

  const txt_discount_from = req.body.txt_discount_from ? req.body.txt_discount_from : 0;
  const txt_discount_to = req.body.txt_discount_to ? req.body.txt_discount_to : 100;



  if (user_id) {
    condition = { ...condition, "$enquiry_details.sales_executive_id": user_id };
  }
  //both date filter
  //  if(txt_from_date && txt_to_date)
  //  {
  //   condition={...condition,'invoice_details.invoice_date':{'$gte' :(txt_from_date) ,'$lte' :(txt_to_date)  }};
  //  }
  if (txt_from_date && txt_to_date) {
    condition = {
      ...condition,
      $gte: ["$invoice_details.invoice_date", txt_from_date],
      $lte: ["$invoice_details.invoice_date", txt_to_date]
    };
  }

  //both discount filter
  // if(txt_discount_from && txt_discount_to)
  // {
  //  //condition={...condition,'invoice_item_details.disc_percentage':{'$gte' :(txt_discount_from) ,'$lte' :(txt_discount_to)  }};

  //  condition={...condition, 'invoice_item_details.disc_percentage': {'$gte' : Number(txt_discount_from) ,'$lte' : Number(txt_discount_to) } } ;
  // }





  let salesData = await sales.aggregate([

    { "$unwind": "$invoice_details" },
    { "$unwind": "$enquiry_details" },
    { "$unwind": "$invoice_item_details" },
    {
      $match:
      {
        $expr:
        {
          $and:
                [
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  // { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  // { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
          // $cond: {

          //   if: { $ne: [user_id, 0] },
          //   then: {
          //     $and:
          //       [
          //         { $gte: ["$invoice_details.invoice_date", txt_from_date] },
          //         { $lte: ["$invoice_details.invoice_date", txt_to_date] },
          //         { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
          //         { $eq: ["$enquiry_details.sales_executive_id", user_id] },
          //         { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
          //         { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
          //       ]
          //   },
          //   else: {
          //     $and:
          //       [
          //         { $gte: ["$invoice_details.invoice_date", txt_from_date] },
          //         { $lte: ["$invoice_details.invoice_date", txt_to_date] },
          //         { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
          //         { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
          //         { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
          //       ]
          //   }

          // },

        }
      }
    },

    // {
    //   $lookup: {
    //     from: "t_100_items",
    //     let: { "item_id": "$invoice_item_details.item_id" },
    //     pipeline: [
    //       {
    //         $match:
    //           { $expr: { $eq: ["$$item_id", "$item_id"] }, },
    //       },
    //       { $project: { "category_id": 1, "_id": 0 } }
    //     ],
    //     as: "category_details"
    //   },
    // },

    // { $addFields: { category_id: { $first: "$category_details.category_id" } } },
    // { $unset: ["category_details"] },


    // {
    //   $lookup: {
    //     from: "t_100_categories",
    //     let: { "category_id": "$category_id" },
    //     pipeline: [
    //       {
    //         $match:
    //           { $expr: { $eq: ["$$category_id", "$category_id"] }, },
    //       },
    //       { $project: { "category": 1, "_id": 0, "parent_category_id": 1, } }
    //     ],
    //     as: "child_category_name"
    //   },
    // },

    // { $addFields: { parent_category_id: { $first: "$child_category_name.parent_category_id" } } },
    // { $addFields: { child_category: { $first: "$child_category_name.category" } } },

    // { $unset: ["child_category_name"] },




    // {
    //   $lookup: {
    //     from: "t_100_categories",
    //     let: { "parent_category_id": "$parent_category_id" },
    //     pipeline: [
    //       {
    //         $match:
    //           { $expr: { $eq: ["$$parent_category_id", "$category_id"] }, },
    //       },
    //       { $project: { "category": 1, "_id": 0, } }
    //     ],
    //     as: "parent_category_name"
    //   },
    // },

    // { $addFields: { category: { $first: "$parent_category_name.category" } } },
    // { $unset: ["parent_category_name"] },


    {

      $project:
      {

        // Opening_Plus:{
        //   $cond: { if: { $and:[{ $in: [ "$transaction_type", ["PR", "DR"] ] }, {$lt:["$transaction_date",from_date]}] }, then: "$plus_qty", else: 0 }
        // },

        category:
        {
          // $cond: { if: {"parent_category_id": {$ne: 0 } }, then: "$parent_category_id", else: "$child_category"  }
          $cond: { if: { $ne: ["$parent_category_id", 0] }, then: "$category", else: "$child_category" }
        },
        "invoice_item_details.net_value": 1,
        "invoice_item_details.invoice_no": 1,
        "invoice_item_details.now_dispatch_qty": 1,
        "invoice_other_charges": 1,
        "invoice_item_details.uom_name": 1,
        child_category: 1,
        parent_category_id: 1,
        "enquiry_details.sales_executive_id": 1,


      }
    },
    {
      $group: {
        _id: "$enquiry_details.sales_executive_id",
        // child_category: { $addToSet: "$child_category" },
        // sumDispatchQty: { $sum: "$invoice_item_details.now_dispatch_qty" },
        sumNetValue: { $sum: { "$toDouble": "$invoice_item_details.net_value" } },
        // OtherCharges: { $addToSet: "$invoice_other_charges" },
        // uom_name: { $addToSet: "$invoice_item_details.uom_name" },
      },
    },
    {
      $lookup: {
        from: "users",
        let: { "user_id": "$_id" },
        pipeline: [
          {
            $match:{
             $expr:{
              $eq:["$user_id","$$user_id"]
             } 
            }
          },
          {
            $project:{
              name:1,
            }
          },

        ],as:"users"
      }
    },
   
    {
      $addFields:{
        name:{$first:"$users.name"}
      }
    },
    {
      $unset:['users',]
    },
    {

      $sort: { _id: 1 }

    }

  ]);


  if (salesData) {
    return res.status(200).json(salesData);
  } else {
    return res.status(200).json([]);
  }
};

const view_customerCondensed = async (req, res) => {


  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  let condition = {};


  // const sales_executive_id = req.body.sales_executive_id;
  // const item_id = 17;

  const user_id = req.body.user_id ? req.body.user_id : 0;

  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;

  const txt_discount_from = req.body.txt_discount_from ? req.body.txt_discount_from : 0;
  const txt_discount_to = req.body.txt_discount_to ? req.body.txt_discount_to : 100;

  if (user_id) {
    condition = { ...condition, "enquiry_details.sales_executive_id": user_id };
  }

  //both date filter
  if (txt_from_date && txt_to_date) {
    condition = { ...condition, 'invoice_details.invoice_date': { '$gte': (txt_from_date), '$lte': (txt_to_date) } };
  }

  //both discount filter
  if (txt_discount_from && txt_discount_to) {
    condition = { ...condition, 'invoice_item_details.disc_percentage': { '$gte': (txt_discount_from), '$lte': (txt_discount_to) } };
  }


  let salesData = await sales.aggregate([
    { "$unwind": "$invoice_details" },
    { "$unwind": "$invoice_item_details" },
    { "$unwind": "$enquiry_details" },
    // {  $match: condition },

    {
      $match:
      {
        $expr:
        {
          $cond: {

            if: { $ne: [user_id, 0] },
            then: {
              $and:
                [
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  { $eq: ["$enquiry_details.sales_executive_id", user_id] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
            },
            else: {
              $and:
                [
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
            }

          },

        }
      }
    },


    //by item_id
    {
      $lookup: {
        from: "t_100_items",
        let: { "item_id": "$invoice_item_details.item_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$item_id", "$item_id"] }, },
          },
          { $project: { "category_id": 1, "_id": 0 } }
        ],
        as: "category_details"
      },
    },

    { $addFields: { category_id: { $first: "$category_details.category_id" } } },
    { $unset: ["category_details"] },

    //by category_id
    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, "parent_category_id": 1, } }
        ],
        as: "child_category_name"
      },
    },

    { $addFields: { parent_category_id: { $first: "$child_category_name.parent_category_id" } } },
    { $addFields: { child_category: { $first: "$child_category_name.category" } } },

    { $unset: ["child_category_name"] },


    {
      $lookup: {
        from: "t_100_categories",
        let: { "parent_category_id": "$parent_category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$parent_category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, } }
        ],
        as: "parent_category_name"
      },
    },

    { $addFields: { category: { $first: "$parent_category_name.category" } } },
    { $unset: ["parent_category_name"] },


    //For Customer name 
    {
      $lookup: {
        from: "t_400_customers",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$customer_id", "$$customer_id"] }, },
          },
          { $project: { "contact_person.txt_name": 1, "_id": 0 } }
        ],
        as: "customer_details"
      },
    },

    { $addFields: { customer_name: { $first: "$customer_details.contact_person.txt_name" } } },
    { $unset: ["customer_details"] },




    {
      $group: {
        _id: {
          "customer": "$customer_name",
          // "category_name":"$category"
        },
        child_category: { $addToSet: "$child_category" },

        sumDispatchQty: { $sum: "$invoice_item_details.now_dispatch_qty" },
        uom_name: { $addToSet: "$invoice_item_details.uom_name" },
        sumNetValue: { $sum: { "$toDouble": "$invoice_item_details.net_value" } },
        // OtherCharges:{$first:"$invoice_other_charges"},


      },
    },
    {

      $sort: { _id: 1 }

    }


  ]);

  if (salesData) {
    return res.status(200).json(salesData);
  } else {
    return res.status(200).json([]);
  }
};

const view_customerDetail = async (req, res) => {


  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  let condition = {};
  // const sales_executive_id = req.body.sales_executive_id;
  // const item_id = 17;
  const user_id = req.body.user_id ? req.body.user_id : 0;

  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;

  const txt_discount_from = req.body.txt_discount_from ? req.body.txt_discount_from : 0;
  const txt_discount_to = req.body.txt_discount_to ? req.body.txt_discount_to : 100;

  if (user_id) {
    condition = { ...condition, "enquiry_details.sales_executive_id": user_id };
  }

  //both date filter
  if (txt_from_date && txt_to_date) {
    condition = { ...condition, 'invoice_details.invoice_date': { '$gte': (txt_from_date), '$lte': (txt_to_date) } };
  }

  //both discount filter
  if (txt_discount_from && txt_discount_to) {
    condition = { ...condition, 'invoice_item_details.disc_percentage': { '$gte': (txt_discount_from), '$lte': (txt_discount_to) } };
  }


  let salesData = await sales.aggregate([
    { "$unwind": "$invoice_details" },
    { "$unwind": "$invoice_item_details" },
    { "$unwind": "$enquiry_details" },
    // {  $match: condition },

    {
      $match:
      {
        $expr:
        {
          $cond: {

            if: { $ne: [user_id, 0] },
            then: {
              $and:
                [
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  { $eq: ["$enquiry_details.sales_executive_id", user_id] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
            },
            else: {
              $and:
                [
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
            }

          },

        }
      }
    },

    //by item_id
    {
      $lookup: {
        from: "t_100_items",
        let: { "item_id": "$invoice_item_details.item_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$item_id", "$item_id"] }, },
          },
          { $project: { "category_id": 1, "_id": 0 } }
        ],
        as: "category_details"
      },
    },

    { $addFields: { category_id: { $first: "$category_details.category_id" } } },
    { $unset: ["category_details"] },

    //by category_id
    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, "parent_category_id": 1, } }
        ],
        as: "child_category_name"
      },
    },

    { $addFields: { parent_category_id: { $first: "$child_category_name.parent_category_id" } } },
    { $addFields: { child_category: { $first: "$child_category_name.category" } } },

    { $unset: ["child_category_name"] },


    {
      $lookup: {
        from: "t_100_categories",
        let: { "parent_category_id": "$parent_category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$parent_category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, } }
        ],
        as: "parent_category_name"
      },
    },

    { $addFields: { category: { $first: "$parent_category_name.category" } } },
    { $unset: ["parent_category_name"] },


    //For Customer name 
    {
      $lookup: {
        from: "t_400_customers",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$customer_id", "$$customer_id"] }, },
          },
          { $project: { "contact_person.txt_name": 1, "_id": 0 } }
        ],
        as: "customer_details"
      },
    },

    { $addFields: { customer_name: { $first: "$customer_details.contact_person.txt_name" } } },
    { $unset: ["customer_details"] },




    {
      $group: {
        _id: {
          "customer": "$customer_name",
          "category_name": "$category"
        },
        child_category: { $addToSet: "$child_category" },

        sumDispatchQty: { $sum: "$invoice_item_details.now_dispatch_qty" },
        uom_name: { $addToSet: "$invoice_item_details.uom_name" },
        sumNetValue: { $sum: { "$toDouble": "$invoice_item_details.net_value" } },
        OtherCharges: { $first: "$invoice_other_charges" },


      },
    },
    {

      $sort: { _id: 1 }

    }


  ]);

  if (salesData) {
    return res.status(200).json(salesData);
  } else {
    return res.status(200).json([]);
  }
};

//SalesOrderByInvoice Report
const view_saleOrderByInvoice = async (req, res) => {



  let condi = { deleted_by_id: 0 };
  let condition = {};

  const customer_id = req.body.customer_id;
  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;
  const sales_order_no = req.body.txt_sales_no;

  if (customer_id) {
    condition = { ...condition, "customer_id": customer_id };
  }

  //both date filter
  if (txt_from_date && txt_to_date) {
    condition = { ...condition, 'sales_order_date': { '$gte': (txt_from_date), '$lte': (txt_to_date) } };
  }

  if (sales_order_no) {
    condition = { ...condition, sales_order_no: new RegExp(sales_order_no, "i") };
  }


  condition = { ...condition, 'sales_status': { '$ne': "46" } };



  let salesData = await sales.aggregate([
    {
      $match: condition
    },

    { "$unwind": "$sales_order_item_details" },

    {
      $project: {
        customer_id: 1,
        sales_order_no: 1,
        "sales_order_other_charges": 1,
        "sales_order_item_details.net_value": 1,
        invoice_count: { $size: "$invoice_no" },
        "invoice_other_charges": 1,
        "invoice_item_details.net_value": 1,
        sales_status: { $toDouble: "$sales_status" }
      },
    },
    //For Customer name 
    {
      $lookup: {
        from: "t_400_customers",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$customer_id", "$$customer_id"] }, },
          },
          { $project: { "contact_person.txt_name": 1, "_id": 0 } }
        ],
        as: "customer_details"
      },
    },

    { $addFields: { customer_name: { $first: "$customer_details.contact_person.txt_name" } } },
    { $unset: "customer_details" },

    //For Status name 
    {
      $lookup: {
        from: "t_900_statuses",
        let: { "sales_status": "$sales_status" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$status_id", "$$sales_status"] }, },
          },
          { $project: { "status_name": 1, "_id": 0 } }
        ],
        as: "status"
      },
    },

    { $addFields: { status_name: { $first: "$status.status_name" } } },
    { $unset: ["status"] },
    {
      $group: {
        _id: "$sales_order_no",
        sumSalesOrderNetValue: { $sum: { "$toDouble": "$sales_order_item_details.net_value" } },
        invoice_count: { $addToSet: "$invoice_count" },
        sumInvoiceNetValue: { $first: "$invoice_item_details.net_value" },
        salesOrderOtherCharges: { $addToSet: "$sales_order_other_charges" },
        invoiceOtherCharges: { $addToSet: "$invoice_other_charges" },
        customer_name: { $first: { $first: "$customer_name" } },
        sales_status: { $first: "$status_name" }

      },
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);

  if (salesData) {
    return res.status(200).json(salesData);
  } else {
    return res.status(200).json([]);
  }
};


//REFERENCE PART REPORT

const referenceItemWiseSales = async (req, res) => {



  let condition = {};
  let condi = {};
  // let txt_discount_to=0;
  // let txt_discount_from=0;
  const ddl_reference_id = req.body.ddl_reference_id;
  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;



  if (ddl_reference_id) {
    condition = { ...condition, "reference_id": ddl_reference_id };
  }



  // if(req.body.txt_discount_to!='')
  // {
  // txt_discount_to=req.body.txt_discount_to
  // // condi={...condi,'$invoice_item_details.disc_percentage':{'$gte' :(txt_discount_from) ,'$lte' :(txt_discount_to)  }};
  // }else {txt_discount_to=0}


  // if(req.body.txt_discount_from!='')
  // {
  // txt_discount_from=req.body.txt_discount_from
  // // condi={...condi,'$invoice_item_details.disc_percentage':{'$gte' :(txt_discount_from) ,'$lte' :(txt_discount_to)  }};
  // }else {txt_discount_from=0}

  const txt_discount_from = req.body.txt_discount_from ? req.body.txt_discount_from : 0;
  const txt_discount_to = req.body.txt_discount_to ? req.body.txt_discount_to : 100;


  let salesData = await customer.aggregate([

    {
      $match: condition
    },
    {
      $project: {
        "customer_id": 1,
        "_id": 0,
      }
    },

    {
      $lookup:
      {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },

        pipeline: [

          { $unwind: "$invoice_details" },
          { $unwind: "$invoice_item_details" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$customer_id", "$customer_id"] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] }

                ]
              },
            }
          },




          {
            $project: {
              "_id": 0,
              "invoice_item_details.net_value": 1,
              "invoice_item_details.now_dispatch_qty": 1,
              // "invoice_other_charges":1,
              "invoice_item_details.uom_name": 1,
              "invoice_item_details.item_id": 1,
              // "invoice_item_details.invoice_no":1,

            }
          }
        ],
        as: "sales_details"
      },
    },

    { $unwind: "$sales_details" },

    { $addFields: { net_value: { $sum: { $toDouble: "$sales_details.invoice_item_details.net_value" } } } },

    { $addFields: { sumDispatchQty: { $sum: "$sales_details.invoice_item_details.now_dispatch_qty" } } },
    // {$addFields:{invoice_no:"$sales_details.invoice_item_details.invoice_no"}},


    // {$addFields:{OtherCharges:{$first:"$sales_details.invoice_other_charges"}}},

    { $addFields: { uom_name: "$sales_details.invoice_item_details.uom_name" } },

    { $addFields: { item_id: "$sales_details.invoice_item_details.item_id" } },


    { $unset: ["sales_details"] },

    {
      $group: {
        "_id": "$item_id",
        net_value: { $sum: "$net_value" },
        sumDispatchQty: { $sum: "$sumDispatchQty" },
        uom_name: { $first: "$uom_name" },
        item_id: { $first: "$item_id" },
        // invoice_no:{$first:"$invoice_no"},
      }
    },
    {
      $lookup: {
        from: "t_100_items",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$item_id", "$item_id"] }, },
          },
          { $project: { "category_id": 1, "_id": 0, } }
        ],
        as: "item_name"
      },
    },

    { $addFields: { category_id: { $first: "$item_name.category_id" } } },

    { $unset: ["item_name"] },

    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, "parent_category_id": 1, } }
        ],
        as: "child_category_name"
      },
    },

    { $addFields: { parent_category_id: { $first: "$child_category_name.parent_category_id" } } },
    { $addFields: { child_category: { $first: "$child_category_name.category" } } },

    { $unset: ["child_category_name"] },


    {
      $lookup: {
        from: "t_100_categories",
        let: { "parent_category_id": "$parent_category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$parent_category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, } }
        ],
        as: "parent_category_name"
      },
    },

    { $addFields: { category: { $first: "$parent_category_name.category" } } },
    { $unset: ["parent_category_name"] },

    // // { "$unwind": "$invoice_item_details"},

    {

      $project:
      {
        net_value: 1,
        category:
        {
          $cond: {
            if: { $eq: ["$parent_category_id", 0] },
            then: "$child_category",
            else: "$category",
          }
        },
        sumDispatchQty: 1,
        uom_name: 1,
        child_category: 1,
        parent_category_id: 1,
        item_id: 1,
        // invoice_no:1,
      }
    },

    {
      $group:
      {
        _id: "$category",
        category: { $addToSet: "$category" },
        net_value: { $sum: "$net_value" },
        sumDispatchQty: { $sum: "$sumDispatchQty" },
        //  sumNetValue:{$sum:{"$toDouble" :"$net_value"}},
        // OtherCharges:{$push:"$OtherCharges"},
        uom_name: { $addToSet: "$uom_name" },
      },
    },
    {
      $sort: { _id: 1 }
    }

  ]);


  if (salesData) {
    return res.status(200).json(salesData);
  }
  else {
    return res.status(200).json([]);
  }
};


const view_referenceCondensed = async (req, res) => {


  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  let condition = {};

  const ddl_reference_id = req.body.ddl_reference_id;

  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;


  if (ddl_reference_id) {
    condition = { ...condition, "reference_id": ddl_reference_id };
  }
  const txt_discount_from = req.body.txt_discount_from ? req.body.txt_discount_from : 0;
  const txt_discount_to = req.body.txt_discount_to ? req.body.txt_discount_to : 100;
  //   if (ddl_reference_id) {
  //     condition = { ...condition, "customer_id": 21184 };
  // }
  //   customer_id: 21184

  // if(req.body.txt_discount_to!='')
  //   {
  //   txt_discount_to=req.body.txt_discount_to
  //   }else {txt_discount_to=100}


  // if(req.body.txt_discount_from!='')
  //   {
  //   txt_discount_from=req.body.txt_discount_from
  //   }else {txt_discount_from=0}

  let salesData = await customer.aggregate([

    { $match: condition },
    {
      $project: {
        customer_id: 1,
        company_name: 1
      }
    },

    {
      $lookup: {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },
        pipeline: [

          { $unwind: "$invoice_details" },
          { $unwind: "$invoice_item_details" },

          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$customer_id", "$customer_id"] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },

                ]
              },
            }
          },

          {
            $project: {
              "sales_id": 1,
              // "enquiry_details.cust_name": 1, 
              "invoice_item_details.net_value": 1,

            }
          },
          {
            $group: {
              _id: "$sales_id",
              //  customer_name: { $first: "$enquiry_details.cust_name" },
              "net_value": { "$sum": { $toDouble: "$invoice_item_details.net_value" } },
            }
          },
        ],
        as: "sales_details"
      },
    },

    { $unwind: "$sales_details" },

    // //{$addFields:{customer_name:"$sales_details.customer_name"}},
    { $addFields: { sales_id: "$sales_details._id" } },
    { $addFields: { net_value: "$sales_details.net_value" } },
    // {$addFields:{net_value:{$sum:{$toDouble:"$sales_details.net_value"}}}},




    /////////////lookup2 to fetch other charges//////////////////////
    ////////////////////////////////////////////////////////////////

    // {
    //   $lookup: {
    //     from: "t_900_sales",
    //     let: { "sales_id": "$sales_id" },
    //     pipeline: [

    //       { $unwind: "$invoice_other_charges"},
    //       {
    //         $match: {
    //           $expr: {
    //             $and: [
    //               { $eq: ["$sales_id", "$$sales_id"] },

    //               ]
    //           },
    //         }
    //       },
    //       {
    //         $project: {
    //            other_charges_add: {
    //             $cond: { 
    //               if: { $eq: [ "$invoice_other_charges.charge_type", "+" ] },
    //               then: {$sum:{$toDouble:"$invoice_other_charges.charge_amount"}}, 
    //               else: 0 
    //             }},
    //            other_charges_minus: {
    //               $cond: { 
    //                 if: { $eq: [ "$invoice_other_charges.charge_type", "-" ] },
    //                 then: {$sum:{$toDouble:"$invoice_other_charges.charge_amount"}}, 
    //                 else: 0 
    //               }
    //           },
    //         }
    //       },
    //     ],
    //     as: "other_charges"
    //   }
    // },

    // { $addFields: { netValue:{
    //   $subtract: [ {$sum: [{$toDouble:"$net_value"},
    //    {$sum: "$other_charges.other_charges_add"}]},{$sum: "$other_charges.other_charges_minus"}]

    //   } }},

    {
      $group: {
        _id: "$company_name",
        net_value: { $sum: "$net_value" },
        // otherCharges:{$push:"$otherCharges"},


      },
    },
    { $unset: ["sales_details"] },
    { $sort: { _id: 1 } }



  ]);

  if (salesData) {
    return res.status(200).json(salesData);
  } else {
    return res.status(200).json([]);
  }
};


const view_referenceDetail = async (req, res) => {


  // let condition={deleted_by_id:0};
  let condi = { deleted_by_id: 0 };
  let condition = {};

  // let txt_discount_to=0;
  // let txt_discount_from=0;

  const ddl_reference_id = req.body.ddl_reference_id;

  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;
  const txt_discount_from = req.body.txt_discount_from ? req.body.txt_discount_from : 0;
  const txt_discount_to = req.body.txt_discount_to ? req.body.txt_discount_to : 100;


  if (ddl_reference_id) {
    condition = { ...condition, "reference_id": ddl_reference_id };
  }

  //  if(req.body.txt_discount_to!='')
  //   {
  //   txt_discount_to=req.body.txt_discount_to
  //   // condi={...condi,'$invoice_item_details.disc_percentage':{'$gte' :(txt_discount_from) ,'$lte' :(txt_discount_to)  }};
  //   }else {txt_discount_to=0}


  //   if(req.body.txt_discount_from!='')
  //   {
  //   txt_discount_from=req.body.txt_discount_from
  //   // condi={...condi,'$invoice_item_details.disc_percentage':{'$gte' :(txt_discount_from) ,'$lte' :(txt_discount_to)  }};
  //   }else {txt_discount_from=0}

  let salesData = await customer.aggregate([
    // { "$unwind": "$invoice_item_details"},
    {
      $match: condition
    },



    // { "$unwind": "$invoice_item_details"},
    // { "$unwind": "$invoice_other_charges"},



    //by sales
    {
      $lookup: {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },
        pipeline: [

          { $unwind: "$invoice_details" },
          { "$unwind": "$invoice_item_details" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$customer_id", "$customer_id"] },
                  { $lte: ["$invoice_details.invoice_date", txt_to_date] },
                  { $gte: ["$invoice_details.invoice_date", txt_from_date] },
                  // {$lte:[{"$toInt" : "$dispatch_order_item_details.disc_percentage"},txt_discount_to]},
                  // {$gte:[{"$toInt" : "$dispatch_order_item_details.disc_percentage"},txt_discount_from]}

                  { $eq: ["$invoice_details.invoice_no", "$invoice_item_details.invoice_no"] },

                  { $lte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_to)] },
                  { $gte: [{ "$toDouble": "$invoice_item_details.disc_percentage" }, Number(txt_discount_from)] },
                ]
              },
            }
          },


          {
            $project: {
              "invoice_item_details.uom_name": 1, "_id": 0,
              // "invoice_other_charges.charge_amount":1,
              "invoice_item_details.net_value": 1,
              "invoice_item_details.now_dispatch_qty": 1,
              "invoice_item_details.item_id": 1
            }
          }
        ],

        as: "sales_details"

      },
    },

    { $unwind: "$sales_details" },

    { $addFields: { net_value: { $sum: { $toDouble: "$sales_details.invoice_item_details.net_value" } } } },

    { $addFields: { sumDispatchQty: { $sum: "$sales_details.invoice_item_details.now_dispatch_qty" } } },

    //{$addFields:{OtherCharges:{$first:"$sales_details.invoice_other_charges"}}},

    { $addFields: { uom_name: "$sales_details.invoice_item_details.uom_name" } },

    { $addFields: { item_id: "$sales_details.invoice_item_details.item_id" } },

    { $unset: ["sales_details"] },
    // {
    //   $group:{
    //     "_id": "$item_id",
    //     net_value:{$sum:"$net_value"},
    //     sumDispatchQty:{$sum:"$sumDispatchQty"},
    //     uom_name:{$first:"$uom_name"},
    //     item_id:{$first:"$item_id"},
    //     // invoice_no:{$first:"$invoice_no"},
    //   }
    // },


    //by item_id
    {
      $lookup: {
        from: "t_100_items",
        let: { "item_id": "$item_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$item_id", "$item_id"] }, },
          },
          { $project: { "category_id": 1, "_id": 0 } }
        ],
        as: "category_details"
      },
    },

    { $addFields: { category_id: { $first: "$category_details.category_id" } } },
    { $unset: ["category_details"] },

    //by category_id
    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, "parent_category_id": 1, } }
        ],
        as: "child_category_name"
      },
    },

    { $addFields: { parent_category_id: { $first: "$child_category_name.parent_category_id" } } },
    { $addFields: { child_category: { $first: "$child_category_name.category" } } },

    { $unset: ["child_category_name"] },


    //by parent_category_id
    {
      $lookup: {
        from: "t_100_categories",
        let: { "parent_category_id": "$parent_category_id" },
        pipeline: [
          {
            $match:
              { $expr: { $eq: ["$$parent_category_id", "$category_id"] }, },
          },
          { $project: { "category": 1, "_id": 0, } }
        ],
        as: "parent_category_name"
      },
    },

    { $addFields: { category: { $first: "$parent_category_name.category" } } },
    { $unset: ["parent_category_name"] },



    {
      $project:
      {
        uom_name: 1,
        net_value: 1,
        "contact_person.txt_name": 1,
        category:
        {
          $cond: { if: { $ne: ["$parent_category_id", 0] }, then: "$category", else: "$child_category" }
        },
        sumDispatchQty: 1,
        //    OtherCharges:1,
        child_category: 1,
        parent_category_id: 1,

      }
    },


    {
      $group: {
        _id: {
          "customer": "$contact_person.txt_name",
          "category_name": "$category"
        },
        // child_category:{$addToSet:"$child_category"},

        sumDispatchQty: { $sum: "$sumDispatchQty" },
        uom_name: { $addToSet: "$uom_name" },
        sumNetValue: { $sum: { "$toDouble": "$net_value" } },
        //   OtherCharges:{$push:"$OtherCharges"},


      },
    },
    {

      $sort: { _id: 1 }

    }


  ]);

  if (salesData) {
    return res.status(200).json(salesData);
  } else {
    return res.status(200).json([]);
  }
};

//OutStanding reports
const out_standing_report = async (req, res) => {

  let condi = { deleted_by_id: 0 };
  let condition = {};

  const group_id = req.body.group_id;
  const reference_id = req.body.reference_id;
  const customer_id = req.body.customer_id;


  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;

  // let txt_min_amount = req.body.txt_min_amount;
  // let txt_max_amount = req.body.txt_max_amount;


  if (req.body.txt_min_amount != '') {
    txt_min_amount = req.body.txt_min_amount
  } else { txt_min_amount = 0 }


  if (req.body.txt_max_amount != '') {
    txt_max_amount = req.body.txt_max_amount
  } else { txt_max_amount = 100000000 }

  console.log(txt_min_amount);
  console.log(txt_max_amount);

  if (group_id) {
    condition = { ...condition, "group_id": group_id };
  }
  if (reference_id) {
    condition = { ...condition, "reference_id": reference_id };
  }
  if (customer_id) {
    condition = { ...condition, "customer_id": customer_id };
  }

  let outStandingData = await customer.aggregate([
    {
      $match: condition
    },
    {
      $project: {
        customer_id: 1,
        company_name: 1,
      }
    },
    {
      $lookup: {
        from: 't_200_ledger_accounts',
        let: { "cusId": "$customer_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$cusId", "$type_id"] },
                  { $eq: [56, "$ledger_group_id"] }
                ]
              }
            }
          },
          {
            $project: {
              type_id: 1
            }
          }
        ], as: "check"
      }
    },
    {
      $addFields: {
        check_id: { $first: "$check.type_id" }
      }
    },
    {
      $lookup: {
        from: 't_sales_report_masters',
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match:
            {
              $expr: {
                $eq: ["$$customer_id", "$customer_id"]
              }
            }
          },
          {
            $project: {
              group_id: 1,
              group_name: 1,
              reference_id: 1,
              invoice_no: 1,
              sales_id: 1,
              customer_id: 1,
              customer_name: 1,
              netValue: 1,
            }
          },
          {
            $group: {
              _id: "$customer_id",
              customer_id: { $first: "$customer_id" },
              company_name: { $first: "$customer_name" },
              sumInvoiceNetValue: { $sum: "$netValue" },
            }
          },
        ], as: "sales_report"
      }
    },
    {
      $addFields: {
        sumInvoiceNetValue: {
          $cond: {
            if: { $gt: [{ $size: "$sales_report" }, 0] },
            then: { $round: [{ $first: "$sales_report.sumInvoiceNetValue" }, 2] },
            else: 0
          }
        }
      },
    },
    {
      $lookup: {
        from: 't_900_ledgerstorages',
        let: { "customer_id": "$check_id" },
        pipeline: [
          {
            $match:
            {
              $expr: {
                $eq: ["$$customer_id", "$typeId"],
              }
            }
          },
          {
            $project: {
              closingBalance: 1,
              openingBalance: 1,
              closeCrDrStatus: 1,
              openCrDrStatus:1,
              ledgerId: 1,
            }
          }
        ], as: "store"
      }
    },
    {
      $addFields: {
        closingBalance: {$ifNull: [ {$round: [ { $toDouble: {$ifNull: [{ $arrayElemAt: ["$store.closingBalance", 0] }, 0] } }, 2  ]},0]},     
        openingBalance:{$ifNull: [ {$round: [{$toDouble: { $ifNull: [{ $arrayElemAt: ["$store.openingBalance", 0] }, 0]}},2]},0]},
        current_dr_cr: { $first: "$store.closeCrDrStatus" },
        openCrDrStatus: { $first: "$store.openCrDrStatus" },
        ledger_account_id: { $first: "$store.ledgerId" },
      },
    },
    {
      $addFields: {
        closing_balanceAfterMinMax: {
          $cond: {
            if: {
              $and: [
                { $gte: ["$closingBalance", Number(txt_min_amount)] },
                { $lte: ["$closingBalance", Number(txt_max_amount)] }]
            },

            then: {
              $round: ["$closingBalance", 2]
            }, else: 0
          }
        }
      }
    },
    {
      $addFields: {
        action_items: {
          can_view: true,
        }
      }
    },
    // {
    //   $merge: {
    //     into: "temp_outstanding_data",
    //     whenMatched: "merge",
    //     whenNotMatched: "insert"
    //   }
    // }
  ])

  if (outStandingData) {
    console.log(outStandingData.length)
    return res.status(200).json(outStandingData);
  } else {
    return res.status(200).json([]);
  }
};


// //OutStanding reports
// const out_standing_report = async (req, res) => {

//   let condi = { deleted_by_id: 0 };
//   let condition = {};

//   const group_id = req.body.group_id;
//   const reference_id = req.body.reference_id;
//   const customer_id = req.body.customer_id;

//   const page = req.body.page ? req.body.page : 0;
//   const rows = req.body.row ? req.body.row : 10;
//   const skip = Math.abs((page - 1) * rows);

//   const txt_to_date = req.body.txt_to_date;
//   const txt_from_date = req.body.txt_from_date;

//   let txt_min_amount = req.body.txt_min_amount;
//   let txt_max_amount = req.body.txt_max_amount;


//   if(req.body.txt_min_amount!='')
//     {
//       txt_min_amount=req.body.txt_min_amount

//     }else {txt_min_amount=0}


//     if(req.body.txt_max_amount!='')
//     {
//       txt_max_amount=req.body.txt_max_amount

//     }else {txt_max_amount=100000000}


//   if (group_id) {
//     condition = { ...condition, "group_id": group_id };
//   }
//   if (reference_id) {
//     condition = { ...condition, "reference_id": reference_id };
//   }
//   if (customer_id) {
//     condition = { ...condition, "customer_id": customer_id };
//   }

//   let outStandingData = await customer.aggregate([
//     {
//       $match: condition
//     },
//     {
//       $project: {
//         "customer_id": 1,
//         "company_name": 1,
//       }
//     },
//     //LOOKUP 1 IN SALES COLLECTION ////////////////////////////////////////////////////////////////////////////////
//     {
//       $lookup: {
//         from: "t_900_sales",
//         let: { "customer_id": "$customer_id" },
//         pipeline: [
//           { $unwind: "$invoice_details" },

//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ["$$customer_id", "$customer_id"] },
//                   { $lte: ["$invoice_details.invoice_date", txt_to_date] },
//                   { $gte: ["$invoice_details.invoice_date", txt_from_date] },

//                 ]
//               },
//             }
//           },

//           {
//             $project: { "invoice_details.invoice_no": 1, }
//           }
//         ],
//         as: "invoice"
//       }
//     },
//     {
//       $unwind:
//       {
//         path: "$invoice",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     { $addFields: { invoiceNo: "$invoice.invoice_details.invoice_no" } },
//     { $unset: ["invoice"] },
//     //LOOKUP 2////////////////////////////////////////////////////////////////////////////////
//     {
//       $lookup: {
//         from: "t_900_sales",
//         let: { "invoiceNo": { $ifNull: ["$invoiceNo", 0] } },
//         pipeline: [
//           { $unwind: "$invoice_item_details" },

//           {
//             $match: {
//               $expr: {
//                 $eq: ["$$invoiceNo", "$invoice_item_details.invoice_no"],
//               },
//             }
//           },
//           { $project: { "invoice_item_details.net_value": 1, } }
//         ],
//         as: "invoice1"
//       }
//     },
//     {
//       $unwind:
//       {
//         path: "$invoice1",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     { $addFields: { sumInvoiceNetValue: {$toDouble:"$invoice1.invoice_item_details.net_value"} } },
//     { $unset: ["invoice1"] },
//     // // //LOOKUP 3////////////////////////////////////////////////////////////////////////////////

//     {
//       $lookup: {
//         from: "t_900_sales",
//         let: { "invoiceNo": { $ifNull: ["$invoiceNo", 0] } },
//         pipeline: [

//           {
//             $unwind:
//             {
//               path: "$invoice_other_charges",
//               preserveNullAndEmptyArrays: true
//             }
//           },

//           {
//             $match: {
//               $expr: {
//                 $eq: ["$$invoiceNo", "$invoice_other_charges.invoice_no"],
//               },
//             }
//           },

//           {
//             $project:
//             {
//               // "invoice_other_charges": 1,

//               other_charges_add: {
//                 $cond: { 
//                   if: { $eq: [ "$invoice_other_charges.charge_type", "+" ] },
//                   then: {$sum:{$toDouble:"$invoice_other_charges.charge_amount"}}, 
//                   else: 0 
//                 }},
//                 other_charges_minus: {
//                   $cond: { 
//                     if: { $eq: [ "$invoice_other_charges.charge_type", "-" ] },
//                     then: {$sum:{$toDouble:"$invoice_other_charges.charge_amount"}}, 
//                     else: 0 
//                   }
//                 // $cond: { if: { $and:[{ $in: [ "$transaction_type", ["RD"] ] }, {$gte:["$transaction_date",from_date]}, {$lte:["$transaction_date",to_date]}] }, then: "$plus_qty", else: 0 }
//               },
//             }
//           }
//         ],
//         as: "invoice2"
//       }
//     },

//     /////////////////////////////////////////
//     //ACCOUNTS PART BEGINS HERE
//     /////////////////////////////////////////
//     {
//       $lookup: {
//         from: "t_200_ledger_accounts",
//         let: { "customer_id": "$customer_id" },
//         pipeline: [
//           {
//             $match:

//             {
//               $expr: {
//                 $and: [
//                   { $eq: ["$type_id", "$$customer_id"] },{ $eq: ["$type","C"] },
//                   { $eq: ["$deleted_by_id", 0] }
//                 ]
//               },

//             },
//           },
//           {
//             $project:
//             {
//               "_id": 0,
//               "ledger_account_id": 1,
//               "ledger_account": 1,
//               "opening_balance": 1,
//               "dr_cr_status": 1,
//             }
//           }
//         ],
//         as: "ledger_account_details"
//       },
//     },
//     {
//       $unwind:
//       {
//         path: "$ledger_account_details",
//         // preserveNullAndEmptyArrays: true
//       }
//     },
//     /////////////////////////////////////////////////////////////////
//     { $addFields: { ledger_acc_id: "$ledger_account_details.ledger_account_id" } },
//     { $addFields: { opening_balance: "$ledger_account_details.opening_balance" } },
//     { $addFields: { dr_cr_status: "$ledger_account_details.dr_cr_status" } },
//     {
//       $lookup:
//       {
//         from: 't_200_journals',
//         let: { "ledger_account_id": "$ledger_acc_id" },
//         pipeline: [
//           { $unwind: "$journal_details" },
//           {
//             $match:
//             {
//               $expr: {
//                 $and: [
//                   { $eq: ["$$ledger_account_id", "$journal_details.ddl_ledger_id"] },
//                   { $eq: ["$deleted_by_id", 0] }
//                 ]
//               }
//             }
//           },
//           {
//             $project: {
//               _id: 0,
//               ledger_account_id: 1,
//               journal_id: 1,
//               journal_details: 1,
//               voucher_date: 1,

//               debit_balance: {
//                 $cond: {
//                   if: {
//                     $and: [{ $in: ["$journal_details.dr_cr", [1]] },
//                     { $lte: ["$voucher_date", txt_to_date] }]
//                   },
//                   then: "$journal_details.amount", else: 0
//                 }
//               },
//               credit_balance: {
//                 $cond: {
//                   if: {
//                     $and: [{ $in: ["$journal_details.dr_cr", [2]] },
//                     { $lte: ["$voucher_date", txt_to_date] }]
//                   },
//                   then: "$journal_details.amount", else: 0
//                 }
//               },
//             }
//           },
//           {
//             $group: {
//               _id: "$journal_details.ddl_ledger_id",
//               debit_balance: { $sum: "$debit_balance" },
//               credit_balance: { $sum: "$credit_balance" },
//             }
//           },
//         ],
//         as: 'journals'
//       }
//     },
//     {
//       $lookup: {
//         from: 't_200_receipt_payments',
//         let: { "ledger_account_id": "$ledger_acc_id" },
//         pipeline: [
//           // { $match: 
//           //   { $expr: { 
//           //       $eq: ["$$ledger_account_id", "$ledger_account_id"]
//           //     }  
//           //   }
//           // },

//           {
//             $match: {
//               deleted_by_id: 0,
//               $expr: {
//                 $and: [
//                   {
//                     $or: [
//                       { $eq: ["$$ledger_account_id", "$ledger_account_id"] },
//                       { $eq: ["$$ledger_account_id", "$bank_id"] }
//                     ]
//                   },
//                   { $eq: ["$deleted_by_id", 0] }
//                 ],
//               }
//             }
//           },


//           {
//             $project: {
//               _id: 0,
//               //ledger_account_id: 1,
//               // $bank_id:1
//               ledger_account_id: {
//                 $cond: {
//                   if: { $eq: ["$ledger_account_id", "$$ledger_account_id"] },

//                   then: "$ledger_account_id", else: "$bank_id"
//                 }
//               },
//               receipt_payment_id: 1,
//               receipt_payment_type: 1,
//               voucher_date: 1,
//               amount: 1,
//               debit_balance:{
//                 $cond: { if:{ $or:[{ $and: [{$in: ["$receipt_payment_type", ["R","BP"]]}, 
//                 { $lt:["$voucher_date", txt_to_date]},{$eq:["$bank_id","$$ledger_account_id"]}] },
//                 { $and: [{$in: ["$receipt_payment_type", ["P","BR"]]}, 
//                 { $lt:["$voucher_date", txt_to_date]},{$eq:["$ledger_account_id","$$ledger_account_id"]}] }]}, 
//                 then: "$amount", else: 0 }
//               },
//               credit_balance:{
//                 $cond: { if: { $or:[{ $and: [{$in: ["$receipt_payment_type", ["P","BR"]]}, 
//                  { $lt:["$voucher_date", txt_to_date]},{$eq:["$bank_id","$$ledger_account_id"]}] },
//                  { $and: [{$in: ["$receipt_payment_type", ["R","BP"]]}, 
//                 { $lt:["$voucher_date", txt_to_date]},{$eq:["$ledger_account_id","$$ledger_account_id"]}] }]},  
//                 then: "$amount", else: 0 }
//               },
//               dr_cr_status: {
//                 //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
//                 $cond: { if: {$or : [{ $and:[{ $eq: ["$bank_id","$$ledger_account_id"] }, { $eq: ["$receipt_payment_type","R"]},] },{$and:[{ $eq: ["$ledger_account_id","$$ledger_account_id"] }, { $eq: ["$receipt_payment_type","P"]},]} ] },
//                 then: "Dr", else: "Cr" }
//               },
//             }
//           },
//           {
//             $group: {
//               _id: "$ledger_account_id",
//               debit_balance: { $sum: "$debit_balance" },
//               credit_balance: { $sum: "$credit_balance" },
//             }
//           },
//         ],
//         as: 'receipt_payments'
//       }
//     },
//     {
//       $unwind:
//       {
//         path: "$journals",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $unwind:
//       {
//         path: "$receipt_payments",
//         preserveNullAndEmptyArrays: true
//       }
//     },

//     /////////////////////////////////////////
//     // INVOICE VALUE BEING CALCULATED WITH OTHER CHARGES
//     /////////////////////////////////////////
//     { $addFields: { netValue:{
//       $subtract: [ {$sum: [{$toDouble:"$sumInvoiceNetValue"}, {$sum: "$invoice2.other_charges_add"}]},{$sum: "$invoice2.other_charges_minus"}]

//       } }},

//     ////DR CR status/////////////////////////////////////
//   {
//     $addFields: {
//       current_dr_cr: {
//         $switch: {
//           branches: [
//             {
//               //// Case 1 op!=0 && o.drcr = dr
//               case: {
//                 $and: [
//                   { $ne: ["$opening_balance", 0] },
//                   { $eq: ["$dr_cr_status", "Dr"] },
//                   {
//                     $gte: [
//                       {
//                         $subtract: [
//                           { $sum: ["$opening_balance", "$journals.debit_balance", "$receipt_payments.debit_balance"] },
//                           { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
//                         ]
//                       }, 0]
//                   }
//                 ]
//               },
//               then: "Dr"
//             },
//             //////case 2op!=0 && o.drcr =cr 
//             {
//               case: {
//                 $and: [
//                   { $ne: ["$opening_balance", 0] },
//                   { $eq: ["$dr_cr_status", "Cr"] },
//                   {
//                     $gte: [
//                       {
//                         $subtract: [
//                           { $sum: ["$opening_balance", "$journals.credit_balance", "$receipt_payments.credit_balance"] },
//                           { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }
//                         ]
//                       }, 0]
//                   }
//                 ]
//               },
//               then: "Cr"
//             },
//             //////Case 3 op=0
//             {
//               case: {
//                 $and: [
//                   { $eq: ["$opening_balance", 0] },
//                   {
//                     $gte: [
//                       {
//                         $subtract: [
//                           { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] },
//                           { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
//                         ]
//                       }, 0]
//                   }
//                 ]
//               },
//               then: "Dr"
//             }
//           ],
//           default: "Cr"
//         }
//       }
//     }
//   },
// /////////////////////////////////////////////////////
//   // {
//   //   $addFields: { J_Debit:"$journals.debit_balance" }
//   // },
//   // {
//   //   $addFields: {J_Credit: "$journals.credit_balance"}
//   // },
//   // {
//   //   $addFields: {R_Debit: "$receipt_payments.debit_balance" }
//   // },
//   // {
//   //   $addFields: {R_Credit: "$receipt_payments.credit_balance"}
//   // },

//   /////////////////////////////////////////////////////
//     {
//       $addFields: {
//         closing_balance: {
//           $cond: {
//             if: { $eq: ["$current_dr_cr", "Dr"] },
//             then: {
//               $subtract: [
//                 {
//                   $sum: ["$opening_balance",
//                     { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }]
//                 },
//                 { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }
//               ]
//             },
//             else: {
//               $subtract: [
//                 {
//                   $sum: ["$opening_balance",
//                     { $sum: ["$journals.credit_balance", "$receipt_payments.credit_balance"] }]
//                 },
//                 { $sum: ["$journals.debit_balance", "$receipt_payments.debit_balance"] }]
//             }
//           }
//         }
//       }
//     },
//     { $addFields: {closing_balanceAfterMinMax:{
//       $cond: { 
//         if: { $and: [ 
//        { $gte:["$closing_balance", Number(txt_min_amount)]},{ $lte:["$closing_balance", Number(txt_max_amount)]}] },

//       then: "$closing_balance", else: 0 }
//     }}},
//     {
//       $addFields: {
//         action_items: {
//           can_view: true,

//         }
//       }
//     },

//     {
//       $group: {
//         _id: "$customer_id",
//         company_name: { $addToSet: "$company_name" },
//         sumInvoiceNetValue: { $first:"$netValue"  },  
//         closing_balance: {$first: "$closing_balanceAfterMinMax" },
//         dr_cr_status: { $addToSet: "$current_dr_cr" },
//         action_items: { $first: "$action_items" },
//         ledger_account_id: { $first: "$ledger_acc_id" },
//       },
//     },
//     {
//       $sort: { company_name: 1, closing_balance: 1 }
//     },
//     // { $skip: skip },
//     // { $limit: rows },
//   ]);

//  // console.log("HKHK", outStandingData);
//   if (outStandingData) {
//     return res.status(200).json(outStandingData);
//   } else {
//     return res.status(200).json([]);
//   }
// };

///////////////////////////////////////////////////////////////////////////////////////////
const out_standing_report_sales_order = async (req, res) => {

  let condi = { deleted_by_id: 0 };
  let condition = {};

  const group_id = req.body.group_id;
  const reference_id = req.body.reference_id;
  const customer_id = req.body.customer_id;

  // const group_id = 39;
  // const reference_id = 2;
  // const customer_id = 1473;
  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;

  // let txt_min_amount = req.body.txt_min_amount;
  // let txt_max_amount = req.body.txt_max_amount;


  if (req.body.txt_min_amount != '') {
    txt_min_amount = req.body.txt_min_amount
  } else { txt_min_amount = 0 }


  if (req.body.txt_max_amount != '') {
    txt_max_amount = req.body.txt_max_amount
  } else { txt_max_amount = 10000000000 }

  if (group_id) { condition = { ...condition, "group_id": group_id }; }
  if (reference_id) { condition = { ...condition, "reference_id": reference_id }; }
  if (customer_id) { condition = { ...condition, "customer_id": customer_id }; }
  condition = { ...condition, 'sales_status': { '$ne': "46" } };

  let outStandingData = await customer.aggregate([
    { $match: condition },
    {
      $project: {
        "customer_id": 1,
        "company_name": 1,
      }
    },

    //without close sum
    {
      $lookup: {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },
        pipeline: [

          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$customer_id", "$$customer_id"] },
                  { $ne: ["$sales_status", "37"] },
                  { $lte: ["$sales_order_date", txt_to_date] },
                  { $gte: ["$sales_order_date", txt_from_date] },

                ]
              },
            }
          },
          { $unwind: "$sales_order_item_details" },
          {
            $project: {
              customer_id: 1,
              "sales_status": 1,
              sales_net_value: { $toDouble: "$sales_order_item_details.net_value" },
              // sales_net_value:"$sales_order_item_details.net_value",
              "sales_order_no": 1,
            }
          },
          {
            $group: {
              _id: "$customer_id",
              "sumSalesOrderNetValue": { "$sum": "$sales_net_value" },
            }
          },
        ],
        as: "sales_order"
      }
    },
    //with close sum
    {
      $lookup: {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$customer_id", "$$customer_id"] },
                  { $eq: ["$sales_status", "37"] },
                  { $lte: ["$sales_order_date", txt_to_date] },
                  { $gte: ["$sales_order_date", txt_from_date] },
                ]
              },
            }
          },
          { $unwind: "$invoice_item_details" },
          {
            $project: {
              customer_id: 1,
              "sales_status": 1,
              "invoice_item_details.net_value": 1,
              // "invoice_net_value":{$ifNull:["$invoice_item_details.net_value",0]},
              "sales_order_no": 1,
            }
          },
          {
            $group: {
              _id: "$customer_id",
              "sumSalesOrderNetValue": { "$sum": { $toDouble: "$invoice_item_details.net_value" } },
            }
          },
        ],
        as: "sales_order_close_value"
      }
    },
    {
      $unwind:
      {
        path: "$sales_order",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$sales_order_close_value",
        preserveNullAndEmptyArrays: true
      }
    },
    { $addFields: { sumSalesOrderNetValue: { $sum: ["$sales_order.sumSalesOrderNetValue", "$sales_order_close_value.sumSalesOrderNetValue"] } } },
    // /////////////lookup3 without 37//////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },
        pipeline: [

          { $unwind: "$sales_order_other_charges" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$customer_id", "$$customer_id"] },
                  { $ne: ["$sales_status", "37"] },
                  { $lte: ["$sales_order_date", txt_to_date] },
                  { $gte: ["$sales_order_date", txt_from_date] },
                ]
              },
            }
          },
          {
            $project: {
              customer_id: 1,
              sales_other_charges_add: {
                $cond: {
                  if: { $eq: ["$sales_order_other_charges.charge_type", "+"] },
                  then: { $sum: { $toDouble: "$sales_order_other_charges.charge_amount" } },
                  else: 0
                }
              },
              sales_other_charges_minus: {
                $cond: {
                  if: { $eq: ["$sales_order_other_charges.charge_type", "-"] },
                  then: { $sum: { $toDouble: "$sales_order_other_charges.charge_amount" } },
                  else: 0
                }
              },
            }
          },
        ],
        as: "sales_order_other_charges"
      }
    },
    // /////////////lookup3 with 37//////////////////////
    {
      $lookup: {
        from: "t_900_sales",
        let: { "customer_id": "$customer_id" },
        pipeline: [

          { $unwind: "$sales_order_other_charges" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$customer_id", "$$customer_id"] },
                  { $eq: ["$sales_status", "37"] },
                  { $lte: ["$sales_order_date", txt_to_date] },
                  { $gte: ["$sales_order_date", txt_from_date] },
                ]
              },
            }
          },
          {
            $project: {
              customer_id: 1,
              sales_other_charges_add: {
                $cond: {
                  if: { $gt: [{ $size: "$invoice_item_details" }, 0] },
                  then: {
                    $cond: {
                      if: { $eq: ["$sales_order_other_charges.charge_type", "+"] },
                      then: { $sum: { $toDouble: "$sales_order_other_charges.charge_amount" } },
                      else: 0
                    }
                  },
                  else: 0

                }
              },
              sales_other_charges_minus: {
                $cond: {
                  if: { $gt: [{ $size: "$invoice_item_details" }, 0] },
                  then: {
                    $cond: {
                      if: { $eq: ["$sales_order_other_charges.charge_type", "-"] },
                      then: { $sum: { $toDouble: "$sales_order_other_charges.charge_amount" } },
                      else: 0
                    }
                  },
                  else: 0
                }
              },
            }
          },
        ],
        as: "sales_order_other_charges1"
      }
    },


    /////////////////////////////////////////
    // INVOICE VALUE BEING CALCULATED WITH OTHER CHARGES
    /////////////////////////////////////////
    {
      $addFields: {
        netValue: {
          $subtract: [
            {
              $sum: [
                { $toDouble: "$sales_order.sumSalesOrderNetValue" },
                { $toDouble: "$sales_order_close_value.sumSalesOrderNetValue" },
                { $sum: "$sales_order_other_charges.sales_other_charges_add" },
                { $sum: "$sales_order_other_charges1.sales_other_charges_add" }

              ]
            },
            {
              $sum:
                [
                  { $sum: "$sales_order_other_charges.sales_other_charges_minus" },
                  { $sum: "$sales_order_other_charges1.sales_other_charges_minus" },

                ]
            }
          ]

        }
      }
    },
    {
      $unset: ["sales_order_other_charges", "sales_order_other_charges1", "sales_order_close_value", "sales_order"]
    },
    {
      $lookup: {
        from: "t_200_ledger_accounts",
        let: { "ledger_account": "$company_name" },
        pipeline: [
          {
            $match:

            {
              $expr: {
                $and: [
                  { $eq: ["$ledger_account", "$$ledger_account"] },
                  { $eq: ["$deleted_by_id", 0] }
                ]
              },

            },
          },
          {
            $project:
            {
              "_id": 0,
              "ledger_account_id": 1,
              "ledger_account": 1,
              "opening_balance": 1,
              "dr_cr_status": 1,
            }
          }
        ],
        as: "ledger_account_details"
      },
    },
    {
      $unwind:
      {
        path: "$ledger_account_details",
        preserveNullAndEmptyArrays: true
      }
    },
    // /////////////////////////////////////////////////////////////////
    { $addFields: { ledger_acc_id: "$ledger_account_details.ledger_account_id" } },
    {
      $lookup:
      {
        from: 't_200_journals',
        let: { "ledger_account_id": "$ledger_acc_id" },
        pipeline: [
          { $unwind: "$journal_details" },
          {
            $match:
            {
              $expr: {
                $and: [
                  { $eq: ["$$ledger_account_id", "$journal_details.ddl_ledger_id"] },
                  { $eq: ["$deleted_by_id", 0] },
                ]
              }

            }

          },
          { $match: { transaction_type: {$ne:"Sales" } } },
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
                    $and: [{ $in: ["$journal_details.dr_cr", [1]] },
                    { $lte: ["$voucher_date", txt_to_date] }]
                  },
                  then: "$journal_details.amount", else: 0
                }
              },
              credit_balance: {
                $cond: {
                  if: {
                    $and: [{ $in: ["$journal_details.dr_cr", [2]] },
                    { $lte: ["$voucher_date", txt_to_date] }]
                  },
                  then: "$journal_details.amount", else: 0
                }
              },
            }
          },
          {
            $group: {
              _id: "$journal_details.ddl_ledger_id",
              debit_balance: { $sum: "$debit_balance" },
              credit_balance: { $sum: "$credit_balance" },
            }
          },
        ],
        as: 'journals'
      }
    },
    {
      $lookup: {
        from: 't_200_receipt_payments',
        let: { "ledger_account_id": "$ledger_acc_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$$ledger_account_id", "$ledger_account_id"] },
                      { $eq: ["$$ledger_account_id", "$bank_id"] }
                    ]
                  },
                  { $eq: ["$deleted_by_id", 0] }
                ],
              }
            }
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

                  then: "$ledger_account_id", else: "$bank_id"
                }
              },
              receipt_payment_id: 1,
              receipt_payment_type: 1,
              voucher_date: 1,
              amount: 1,
              debit_balance: {
                $cond: {
                  if: {
                    $or: [{
                      $and: [{ $in: ["$receipt_payment_type", ["R", "BP"]] },
                      { $lt: ["$voucher_date", txt_to_date] }, { $eq: ["$bank_id", "$$ledger_account_id"] }]
                    },
                    {
                      $and: [{ $in: ["$receipt_payment_type", ["P", "BR"]] },
                      { $lt: ["$voucher_date", txt_to_date] }, { $eq: ["$ledger_account_id", "$$ledger_account_id"] }]
                    }]
                  },
                  then: "$amount", else: 0
                }
              },
              credit_balance: {
                $cond: {
                  if: {
                    $or: [{
                      $and: [{ $in: ["$receipt_payment_type", ["P", "BR"]] },
                      { $lt: ["$voucher_date", txt_to_date] }, { $eq: ["$bank_id", "$$ledger_account_id"] }]
                    },
                    {
                      $and: [{ $in: ["$receipt_payment_type", ["R", "BP"]] },
                      { $lt: ["$voucher_date", txt_to_date] }, { $eq: ["$ledger_account_id", "$$ledger_account_id"] }]
                    }]
                  },
                  then: "$amount", else: 0
                }
              },
              dr_cr_status: {
                //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
                $cond: {
                  if: { $or: [{ $and: [{ $eq: ["$bank_id", "$$ledger_account_id"] }, { $eq: ["$receipt_payment_type", "R"] },] }, { $and: [{ $eq: ["$ledger_account_id", "$$ledger_account_id"] }, { $eq: ["$receipt_payment_type", "P"] },] }] },
                  then: "Dr", else: "Cr"
                }
              },
            }
          },
          {
            $group: {
              _id: "$ledger_account_id",
              debit_balance: { $sum: "$debit_balance" },
              credit_balance: { $sum: "$credit_balance" },
            }
          },
        ],
        as: 'receipt_payments'
      }
    },
    {
      $unwind:
      {
        path: "$journals",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind:
      {
        path: "$receipt_payments",
        preserveNullAndEmptyArrays: true
      }
    },


    // //   { $addFields: { r_p_dr: "$receipt_payments.debit_balance" } },
    // //   { $addFields: { r_p_cr: "$receipt_payments.credit_balance" } },

    { $addFields: { dr_cr_status: "$ledger_account_details.dr_cr_status" } },


    {
      $addFields: {
        action_items: {
          can_view: true,


        }
      }
    },
    {
      $group: {
        _id: "$customer_id",
        //sales_no: { $addToSet: "$salesNo" },
        company_name: { $addToSet: "$company_name" },
        sumSalesOrderNetValue: { $first: "$netValue" },
        // receipt_payments:{$addToSet:"$receipt_payments"},
        // journals:{$addToSet:"$journals"},

        //  closing_balance: { $first: "$closing_balance" },

        dr_cr_status: { $first: "$dr_cr_status" },
        action_items: { $first: "$action_items" },
        ledger_account_id: { $first: "$ledger_acc_id" },
        receipt_payments_dr: { $first: "$receipt_payments.debit_balance" },
        receipt_payments_cr: { $first: "$receipt_payments.credit_balance" },

        // journals_dr: { $first: "$journals.debit_balance" },
        journals_dr: { $first: { $ifNull: ["$journals.debit_balance", 0] } },
        // journals_cr: { $first: "$journals.credit_balance" },

        journals_cr: { $first: { $ifNull: ["$journals.credit_balance", 0] } },
        opening_balance: { $first: "$ledger_account_details.opening_balance" },
      },
    },

    {
      $addFields: {
        closing_balance:
        {
          $cond: {
            if: { $gt: ["$opening_balance", 0] },
            then: {
              $cond: {
                if: { $eq: ["$dr_cr_status", "Dr"] },
                then: {
                  $subtract: [
                    {
                      $sum: ["$opening_balance", "$journals_dr", "$receipt_payments_dr", "$sumSalesOrderNetValue"]
                    },
                    { $sum: ["$journals_cr", "$receipt_payments_cr"] }

                  ]
                },
                else: {
                  $subtract: [
                    {
                      $sum: ["$opening_balance", "$journals_cr", "$receipt_payments_cr"]
                    },
                    { $sum: ["$journals_dr", "$receipt_payments_dr", "$sumSalesOrderNetValue"] }

                  ]
                }
              }


            },
            else:
            {
              $subtract: [
                { $sum: ["$journals_dr", "$receipt_payments_dr", "$sumSalesOrderNetValue"] },
                { $sum: ["$journals_cr", "$receipt_payments_cr"] }]
              // {
              //   $sum: ["$ledger_account_details.opening_balance",
              //     { $sum: [0, "$receipt_payments.credit_balance",] }]
              // },
              // { $sum: [0, "$receipt_payments.debit_balance","$netValue"] }]
            }
          }
        }
      }
    },

    // {$addFields: { MinMax: Number(txt_min_amount) }},

    {
      $addFields: {
        closing_balanceAfterMinMax: {
          $cond: {
            if: {
              $and: [
                { $gte: [{$abs: "$closing_balance"}, Number(txt_min_amount)] },
              
                { $lte: [{ $abs: "$closing_balance"}, Number(txt_max_amount)] }]
            },

            then: {  $abs: "$closing_balance"}, else: 0
          }
        }
      }
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
                            { $sum: ["$opening_balance", "$receipt_payments_dr", "$journals_dr", "$sumSalesOrderNetValue"] },
                            { $sum: ["$journals_cr", "$receipt_payments_cr"] }
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
                            { $sum: ["$journals_cr", "$receipt_payments_cr"] },
                            { $sum: ["$opening_balance", "$receipt_payments_dr", "$journals_dr", "$sumSalesOrderNetValue"] }

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
                            { $sum: ["$opening_balance", "$receipt_payments_cr", "$journals_cr"] },
                            { $sum: ["$journals_dr", "$receipt_payments_dr", "$sumSalesOrderNetValue"] }
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
                            { $sum: ["$journals_dr", "$receipt_payments_dr", "$sumSalesOrderNetValue"] },
                            { $sum: ["$opening_balance", "$receipt_payments_cr", "$journals_cr"] },

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
                            { $sum: ["$journals_dr", "$receipt_payments_dr", "$sumSalesOrderNetValue"] },
                            { $sum: ["$journals_cr", "$receipt_payments_cr"] }
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
                            { $sum: ["$journals_cr", "$receipt_payments_cr"] },
                            { $sum: ["$journals_dr", "$receipt_payments_dr", "$sumSalesOrderNetValue"] }
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
    // {
    //   $sort: { company_name: 1, }
    // }


  ]);
  console.log("outStanding", outStandingData)
  if (outStandingData) {
    return res.status(200).json(outStandingData);
  } else {
    return res.status(200).json([]);
  }
};









// ///////////////////////////////////////////////////////////////////////////////////////////
// const out_standing_report_sales_order = async (req, res) => {

//   let condi = { deleted_by_id: 0 };
//   let condition = {};

//   const group_id = req.body.group_id;
//   const reference_id = req.body.reference_id;
//   const customer_id = req.body.customer_id;

//   // const group_id = 39;
//   // const reference_id = 2;
//   // const customer_id = 1473;
//   const txt_to_date = req.body.txt_to_date;
//   const txt_from_date = req.body.txt_from_date;

//   let txt_min_amount = req.body.txt_min_amount;
//   let txt_max_amount = req.body.txt_max_amount;


//   if(req.body.txt_min_amount!='')
//     {txt_min_amount=req.body.txt_min_amount  
//     }else {txt_min_amount=0}


//  if(req.body.txt_max_amount!='')
//     {txt_max_amount=req.body.txt_max_amount
//     }else {txt_max_amount=100000000}

//   if (group_id) {condition = { ...condition, "group_id": group_id };}
//   if (reference_id) {condition = { ...condition, "reference_id": reference_id };}
//   if (customer_id) {condition = { ...condition, "customer_id": customer_id };}
//   condition = { ...condition, 'sales_status': { '$ne': "46" } };

//   let outStandingData = await customer.aggregate([
//     {$match: condition },
//     {
//       $project: {
//         "customer_id": 1,
//         "company_name": 1,
//       }
//     },
//     {
//       $lookup: {
//         from: "t_900_sales",
//         let: { "customer_id": "$customer_id" },
//         pipeline: [

//          { $unwind: "$sales_order_item_details" },

//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ["$customer_id", "$$customer_id"] },
//                 //  { $ne: ["$sales_status", "37"] },
//                   { $lte: ["$sales_order_date", txt_to_date] },
//                   { $gte: ["$sales_order_date", txt_from_date] },

//                 ]
//               },
//             }
//           },

//           {
//             $project: {
//               customer_id: 1,

//               "sales_order_item_details.net_value": 1,
//               "sales_order_no": 1,
//               "sales_status":1,
//              // "sales_order_date": 1,
//            //   sales_order_other_charges: 1,


//             }
//           },
//           {
//             $group: {
//               _id: "$sales_order_no",
//              "sumSalesOrderNetValue":{ "$sum": {$toDouble:"$sales_order_item_details.net_value"} },
//              "sales_status":{$first: "$sales_status"}
//             }
//           },

//         ],
//         as: "sales_order"
//       }
//     },
//     {
//       $unwind:
//       { path: "$sales_order",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     // { $addFields: { sumSalesOrderNetValue: "$sales_order.sales_order_item_details.net_value" } },
//      { $addFields: { salesNo: "$sales_order._id" } },
//     // { $addFields: { salesDate: "$sales_order.sales_order_date" } },


//     /////////////lookup2//////////////////////

//     {
//       $lookup: {
//         from: "t_900_sales",
//         let: { "salesNo": "$salesNo" },
//         pipeline: [

//           { $unwind: "$sales_order_other_charges" },
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ["$sales_order_no", "$$salesNo"] },
//                   { $lte: ["$sales_order_date", txt_to_date] },
//                   { $gte: ["$sales_order_date", txt_from_date] },
//                   ]
//               },
//             }
//           },
//           {
//             $project: {
//               customer_id: 1,
//               sales_other_charges_add: {
//                 $cond: { 
//                   if: { $eq: [ "$sales_order_other_charges.charge_type", "+" ] },
//                   then: {$sum:{$toDouble:"$sales_order_other_charges.charge_amount"}}, 
//                   else: 0 
//                 }},
//                 sales_other_charges_minus: {
//                   $cond: { 
//                     if: { $eq: [ "$sales_order_other_charges.charge_type", "-" ] },
//                     then: {$sum:{$toDouble:"$sales_order_other_charges.charge_amount"}}, 
//                     else: 0 
//                   }
//               },
//             }
//           },
//         ],
//         as: "sales_order_other_charges"
//       }
//     },
//     // { "$unwind": "$invoice2" },
//     // {
//     //   $unwind:
//     //   {
//     //     path: "$sales_order_other_ch",
//     //     preserveNullAndEmptyArrays: true
//     //   }
//     // },

//     // {
//     //   $addFields: {
//     //     sumSalesOrderCharges: "$sales_order_other_ch.sales_other_charges_add"
//     //  },
//     // },

//     {
//       $lookup: {
//         from: "t_200_ledger_accounts",
//         let: { "ledger_account": "$company_name" },
//         pipeline: [
//           {
//             $match:

//             {
//               $expr: {
//                 $and: [
//                   { $eq: ["$ledger_account", "$$ledger_account"] },
//                   { $eq: ["$deleted_by_id", 0] }
//                 ]
//               },

//             },
//           },
//           {
//             $project:
//             {
//               "_id": 0,
//               "ledger_account_id": 1,
//               "ledger_account": 1,
//               "opening_balance": 1,
//               "dr_cr_status": 1,
//             }
//           }
//         ],
//         as: "ledger_account_details"
//       },
//     },
//     {
//       $unwind:
//       {
//         path: "$ledger_account_details",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     /////////////////////////////////////////////////////////////////
//     { $addFields: { ledger_acc_id: "$ledger_account_details.ledger_account_id" } },
//     {
//       $lookup:
//       {
//         from: 't_200_journals',
//         let: { "ledger_account_id": "$ledger_acc_id" },
//         pipeline: [
//           { $unwind: "$journal_details" },
//           {
//             $match:
//             {
//               $expr: {
//                 $and: [
//                   { $eq: ["$$ledger_account_id", "$journal_details.ddl_ledger_id"] },
//                   { $eq: ["$deleted_by_id", 0] },

//                 ]
//               }

//             }

//           },
//           { $match: {transaction_type:{$exists:false}} },
//           {
//             $project: {
//               _id: 0,
//               ledger_account_id: 1,
//               journal_id: 1,
//               journal_details: 1,
//               voucher_date: 1,

//               debit_balance: {
//                 $cond: {
//                   if: {
//                     $and: [{ $in: ["$journal_details.dr_cr", [1]] },
//                     { $lte: ["$voucher_date", txt_to_date] }]
//                   },
//                   then: "$journal_details.amount", else: 0
//                 }
//               },
//               credit_balance: {
//                 $cond: {
//                   if: {
//                     $and: [{ $in: ["$journal_details.dr_cr", [2]] },
//                     { $lte: ["$voucher_date", txt_to_date] }]
//                   },
//                   then: "$journal_details.amount", else: 0
//                 }
//               },
//             }
//           },
//           {
//             $group: {
//               _id: "$journal_details.ddl_ledger_id",
//               debit_balance: { $sum: "$debit_balance" },
//               credit_balance: { $sum: "$credit_balance" },
//             }
//           },
//         ],
//         as: 'journals'
//       }
//     },
//     {
//       $lookup: {
//         from: 't_200_receipt_payments',
//         let: { "ledger_account_id": "$ledger_acc_id" },
//         pipeline: [
//                {
//             $match: {
//               $expr: {
//                  $and: [
//                   {
//                     $or: [
//                       { $eq: ["$$ledger_account_id", "$ledger_account_id"] },
//                       { $eq: ["$$ledger_account_id", "$bank_id"] }
//                     ]
//                   },
//                   { $eq: ["$deleted_by_id", 0] }
//                 ],
//               }
//             }
//           },

//           //push
//           {
//             $project: {
//               _id: 0,
//               //ledger_account_id: 1,
//               // $bank_id:1
//               ledger_account_id: {
//                 $cond: {
//                   if: { $eq: ["$ledger_account_id", "$$ledger_account_id"] },

//                   then: "$ledger_account_id", else: "$bank_id"
//                 }
//               },
//               receipt_payment_id: 1,
//               receipt_payment_type: 1,
//               voucher_date: 1,
//               amount: 1,
//               debit_balance:{
//                 $cond: { if:{ $or:[{ $and: [{$in: ["$receipt_payment_type", ["R","BP"]]}, 
//                 { $lt:["$voucher_date", txt_to_date]},{$eq:["$bank_id","$$ledger_account_id"]}] },
//                 { $and: [{$in: ["$receipt_payment_type", ["P","BR"]]}, 
//                 { $lt:["$voucher_date", txt_to_date]},{$eq:["$ledger_account_id","$$ledger_account_id"]}] }]}, 
//                 then: "$amount", else: 0 }
//               },
//               credit_balance:{
//                 $cond: { if: { $or:[{ $and: [{$in: ["$receipt_payment_type", ["P","BR"]]}, 
//                  { $lt:["$voucher_date", txt_to_date]},{$eq:["$bank_id","$$ledger_account_id"]}] },
//                  { $and: [{$in: ["$receipt_payment_type", ["R","BP"]]}, 
//                 { $lt:["$voucher_date", txt_to_date]},{$eq:["$ledger_account_id","$$ledger_account_id"]}] }]},  
//                 then: "$amount", else: 0 }
//               },
//               dr_cr_status: {
//                 //$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
//                 $cond: { if: {$or : [{ $and:[{ $eq: ["$bank_id","$$ledger_account_id"] }, { $eq: ["$receipt_payment_type","R"]},] },{$and:[{ $eq: ["$ledger_account_id","$$ledger_account_id"] }, { $eq: ["$receipt_payment_type","P"]},]} ] },
//                 then: "Dr", else: "Cr" }
//               },
//             }
//           },
//           {
//             $group: {
//               _id: "$ledger_account_id",
//               debit_balance: { $sum: "$debit_balance" },
//               credit_balance: { $sum: "$credit_balance" },
//             }
//           },
//         ],
//         as: 'receipt_payments'
//       }
//     },
//     {
//       $unwind:
//       {
//         path: "$journals",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $unwind:
//       {
//         path: "$receipt_payments",
//         preserveNullAndEmptyArrays: true
//       }
//     },

//       /////////////////////////////////////////
//     // INVOICE VALUE BEING CALCULATED WITH OTHER CHARGES
//     /////////////////////////////////////////
//     { $addFields: { netValue:{
//       $subtract: [ {$sum: [{$toDouble:"$sales_order.sumSalesOrderNetValue"}, {$sum: "$sales_order_other_charges.sales_other_charges_add"}]},{$sum: "$sales_order_other_charges.sales_other_charges_minus"}]

//       } }},
//       { $addFields: { r_p_dr: "$receipt_payments.debit_balance" } },
//       { $addFields: { r_p_cr: "$receipt_payments.credit_balance" } },

//     { $addFields: { dr_cr_status: "$ledger_account_details.dr_cr_status" } },


//     {
//       $addFields: {
//         action_items: {
//           can_view: true,


//         }
//       }
//     },
//       {
//       $group: {
//         _id: "$customer_id",
//         //sales_no: { $addToSet: "$salesNo" },
//         company_name: { $addToSet: "$company_name" },
//         sumSalesOrderNetValue: { $sum: { "$toDouble": "$netValue" } },
//        // closing_balance: { $first: "$closing_balance" },

//         dr_cr_status: { $first: "$dr_cr_status" },
//         action_items: { $first: "$action_items" },
//         ledger_account_id: { $first: "$ledger_acc_id" },
//         receipt_payments_dr: { $first: "$receipt_payments.debit_balance" },
//         receipt_payments_cr: { $first: "$receipt_payments.credit_balance" },
//         journals_dr: { $first: "$journals.debit_balance" },
//         journals_cr: { $first: "$journals.credit_balance" },
//         opening_balance:{$first:"$ledger_account_details.opening_balance"},
//         sales_status:{$first:"$sales_order.sales_status"}
//       },
//     },

//     {
//       $addFields: {
//         closing_balance:
//         {
//           $cond: {
//             if: { $gt: ["$opening_balance", 0] },
//             then: {

//               $subtract: [
//                 {
//                   $sum: ["$opening_balance","$journals_dr","$receipt_payments_dr"] },
//                 { $sum: ["$journals_cr", "$receipt_payments_cr"] }           

//               ]
//             },
//             else:
//             {
//               $subtract: [ 
//                 {$sum: ["$journals_dr","$receipt_payments_dr"] },
//                 {$sum: ["$journals_cr", "$receipt_payments_cr"] }    ]
//                 // {
//                 //   $sum: ["$ledger_account_details.opening_balance",
//                 //     { $sum: [0, "$receipt_payments.credit_balance",] }]
//                 // },
//                 // { $sum: [0, "$receipt_payments.debit_balance","$netValue"] }]
//             }
//           }
//         }
//       }
//     },

//     { $addFields: {closing_balanceAfterMinMax:{
//       $cond: { 
//         if: { $and: [ 
//        { $gte:[{$sum:["$sumSalesOrderNetValue","$closing_balance"]}, Number(txt_min_amount)]},{ $lte:[{$sum:["$sumSalesOrderNetValue","$closing_balance"]}, Number(txt_max_amount)]}] },

//       then: {$sum:["$sumSalesOrderNetValue","$closing_balance"]}, else: 0 }
//     }}},



//     ////DR CR status/////////////////////////////////////
//     {
//       $addFields: {
//         current_dr_cr: {
//           $switch: {
//             branches: [
//               {
//                 //// Case 1 op!=0 && o.drcr = dr
//                 case: {
//                   $and: [
//                     { $ne: ["$opening_balance", 0] },
//                     { $eq: ["$dr_cr_status", "Dr"] },
//                     {
//                       $gte: [
//                         {
//                           $subtract: [
//                             { $sum: ["$opening_balance", "$receipt_payments.dr","$journals_dr"] },
//                             { $sum: ["$journals_cr", "$receipt_payments.cr"] }
//                           ]
//                         }, 0]
//                     }
//                   ]
//                 },
//                 then: "Dr"
//               },
//               //////case 2op!=0 && o.drcr =cr 
//               {
//                 case: {
//                   $and: [
//                     { $ne: ["$opening_balance", 0] },
//                     { $eq: ["$dr_cr_status", "Cr"] },
//                     {
//                       $gte: [
//                         {
//                           $subtract: [
//                             { $sum: ["$opening_balance", "$receipt_payments.cr","$journals_cr"] },
//                             { $sum: ["$journals_dr", "$receipt_payments.dr"] }
//                           ]
//                         }, 0]
//                     }
//                   ]
//                 },
//                 then: "Cr"
//               },
//               //////Case 3 op=0
//               {
//                 case: {
//                   $and: [
//                     { $eq: ["$opening_balance", 0] },
//                     {
//                       $gte: [
//                         {
//                           $subtract: [
//                             { $sum: ["$journals_dr", "$receipt_payments.dr"] },
//                             { $sum: ["$journals_cr", "$receipt_payments.cr"] }
//                           ]
//                         }, 0]
//                     }
//                   ]
//                 },
//                 then: "Dr"
//               }
//             ],
//             default: "-"
//           }
//         }
//       }
//     },
//     {
//       $sort: { company_name: 1, }
//     }


//   ]);
//   //console.log("2405=>", outStandingData)
//   if (outStandingData) {
//     return res.status(200).json(outStandingData);
//   } else {
//     return res.status(200).json([]);
//   }
// };


//promiss.all

const customerLedgerList = async (req, res) => {
  try {
    const data = req.body;
    const URL = req.url;
    const errors = {};

    let condition = {};
    const searchQuery = req.body.keyword_pharse;
    const group_id = req.body.group_id;

    if (group_id) {
      condition.group_id = group_id;
    }

    if (searchQuery) {
      condition.$or = [
        { company_name: new RegExp(searchQuery, "i") },
        { "contact_person.txt_name": new RegExp(searchQuery, "i") },
        { gst_no: new RegExp(searchQuery, "i") },
        { "contact_person.txt_whatsapp": new RegExp(searchQuery, "i") },
        { "contact_person.txt_mobile": new RegExp(searchQuery, "i") },
        { "contact_person.txt_email": new RegExp(searchQuery, "i") },
      ];
    }

    const queryData = await customer.aggregate([
      { $match: condition },
      {
        $lookup: {
          from: "t_200_ledger_accounts",
          let: { "customer_id": "$customer_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$type_id", "$$customer_id"] },
                    { $eq: ["$type", "C"] },
                  ],
                },
              },
            },
            { $project: { "ledger_account_id": 1, "ledger_account": 1 } },
          ],
          as: "ledger_details",
        },
      },
      {
        $addFields: {
          ledger_account_id: { $first: "$ledger_details.ledger_account_id" },
          ledger_account_name: { $first: "$ledger_details.ledger_account" },
        },
      },
      { $unset: ["ledger_details"] },
      {
        $lookup: {
          from: "t_200_master_groups",
          let: { "group_id": "$group_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$master_group_id", "$$group_id"] } } },
            { $project: { "group": 1, "_id": 0 } },
          ],
          as: "group_data",
        },
      },
      { $addFields: { group_name: { $first: "$group_data.group" } } },
      { $unset: ["group_data"] },
      {
        $project: {
          "customer_id": 1,
          "company_name": 1,
          "group_name": 1,
          "ledger_account_name": 1,
        },
      },
    ]);

   
    const promises = queryData.map(async (item) => {      
      return item;
    });

    const finalResults = await Promise.all(promises);

    if (finalResults.length > 0) {
      return res.status(200).send(finalResults);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



// const customerLedgerList = async (req, res) => {
//   const data = req.body;
//   const URL = req.url;
//   const errors = {};

//   let condition = {};
//   const searchQuery = req.body.keyword_pharse;
//   const group_id = req.body.group_id;


//   if (group_id) {
//     condition = { ...condition, group_id: group_id };
//   }

//   if (searchQuery) {
//     condition = {
//       ...condition,
//       $or: [
//         { company_name: new RegExp(searchQuery, "i") },
//         { "contact_person.txt_name": new RegExp(searchQuery, "i") },
//         { gst_no: new RegExp(searchQuery, "i") },
//         { "contact_person.txt_whatsapp": new RegExp(searchQuery, "i") },
//         { "contact_person.txt_mobile": new RegExp(searchQuery, "i") },
//         { "contact_person.txt_email": new RegExp(searchQuery, "i") },
//       ],
//     };
//     ; // Matching string also compare incase-sensitive
//   }

//   let queryData = await customer.aggregate
//     ([
//       { $match: condition },

//       //  {
//       //       "$unwind": "$contact_person"
//       //  },




//       {
//         $lookup: {
//           from: "t_200_ledger_accounts",
//           let: { "customer_id": "$customer_id" },
//           pipeline: [

//             {
//               $match: {
                
//                 $expr: {
//                   $and:[
//                     {$eq: ["$type_id", "$$customer_id"]},
//                     {$eq: ["$type", "C"]}
//                   ]
//                 },
//               },
//             },
//             { $project: { "ledger_account_id": 1, "ledger_account": 1 } }
//           ],
//           as: "ledger_details"
//         }
//       },

//       {
//         $addFields: {
//           ledger_account_id: { $first: "$ledger_details.ledger_account_id" },
//           ledger_account_name: { $first: "$ledger_details.ledger_account" },

//         },
//       },

//       { $unset: ["ledger_details"] },


//       //For Ledger Group 

//       {
//         $lookup: {
//           from: "t_200_master_groups",
//           let: { "group_id": "$group_id" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$master_group_id", "$$group_id"] } } },
//             { $project: { "group": 1, "_id": 0 } }
//           ],
//           as: 'group_data',
//         },
//       },
//       { $addFields: { group_name: { $first: "$group_data.group" } } },
//       { $unset: ["group_data"] },



//       {
//         $project: {
//           "customer_id": 1,
//           "company_name": 1,
//           "group_name": 1,
//           "ledger_account_name": 1

//         }
//       },
//     ]);
//   [
//     { $sort: { ledger_account: 1 } }
//   ]


//   if (queryData) {
//     return res.status(200).send(queryData);
//   }
//   else {
//     return res.status(200).json([]);
//   }

// };

const dataFromLedgerStorage = async (req, res) => {

  let condi = { deleted_by_id: 0 };
  let condition = {};

  const group_id = req.body.group_id;
  const reference_id = req.body.reference_id;
  const customer_id = req.body.customer_id;


  const txt_to_date = req.body.txt_to_date;
  const txt_from_date = req.body.txt_from_date;

  // let txt_min_amount = req.body.txt_min_amount;
  // let txt_max_amount = req.body.txt_max_amount;


  if (req.body.txt_min_amount != '') {
    txt_min_amount = req.body.txt_min_amount
  } else { txt_min_amount = 0 }


  if (req.body.txt_max_amount != '') {
    txt_max_amount = req.body.txt_max_amount
  } else { txt_max_amount = 100000000 }

  // console.log(txt_min_amount);
  //console.log(txt_max_amount);

  if (group_id) {
    condition = { ...condition, "group_id": group_id };
  }
  if (reference_id) {
    condition = { ...condition, "reference_id": reference_id };
  }
  if (customer_id) {
    condition = { ...condition, "customer_id": customer_id };
  }

  let outStandingData = await customer.aggregate([
    {
      $match: condition
    },
    {
      $project: {
        "customer_id": 1,
        "company_name": 1,
        group_id: 1,
      }
    },
    {
      $lookup: {
        from: "t_900_ledgerstorages",
        let: { "customer_id": "$customer_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$customerId", "$$customer_id"]
              }
            }
          },
          {
            $project: {
              ledgerId: 1,
              netValue: 1,
              closingValue: 1,
              crDrStatus: 1,
            }
          }
        ], as: "storage"
      }
    },
    {
      $unwind: {
        path: "$storage",
      }
    },
    {
      $addFields: {
        ledger_account_id: "$storage.ledgerId",
        netValue: "$storage.netValue",
        closingValue: "$storage.closingValue",
        crDrStatus: "$storage.crDrStatus",
      }
    },
    {
      $unset: "storage"
    },
    {
      $sort: { company_name: 1, }
    },
  ])

  if (outStandingData) {
    return res.status(200).json(outStandingData);
  } else {
    return res.status(200).json([]);
  }
}

//Brand wise Report
const brandWiseCondensedReport = async (req, res) => {
  const brand_id = req.body.brand_id

  const fromDate = req.body.fromDate
  const toDate = req.body.toDate + 86399

  let brandData = await BrandReport.aggregate([
    {
      $match: {
        // "brand_id": brand_id
        $expr: {
          $cond: {
            if: brand_id,
            then: {
              $and:
                [
                  { $eq: ["$brand_id", brand_id] },
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            },
            else: {
              $and:
                [
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            }
          }

        }

      }
    },
    {
      $project: {
        brand_id: 1,
        item: 1,
        uom: 1,
        qty: 1,
        netAmount: 1,
        grossAmount:1
      }
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
      $group: {
        _id: "$brand_id",
        qty: { $sum: "$qty" },
        netAmount: { $sum: "$netAmount" },
        grossAmount: { $sum: "$grossAmount" },
        brand: { $first: "$brand" },
        uom: { $first: "$uom" },
      }
    },
    {
      $sort: {
        brand: 1
      }
    }
  ])
  //old/////////////////////
  // console.log(fromDate, toDate)
  // let brandData = await item.aggregate(
  //   [
  //     {
  //       $match: {
  //         $expr: {
  //           $cond: {
  //             if: brand_id,
  //             then: { $eq: ["$brand_id", brand_id] },
  //             else: ''
  //           }

  //         }

  //       }
  //     },
  //     {
  //       $sort: {
  //         item: 1,
  //       }
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         item_id: 1,
  //         uom_id: 1,
  //         item: 1,
  //         brand_id: 1
  //       }
  //     },
  //     {
  //       $lookup:
  //       {
  //         from: "t_100_uoms",
  //         let: {
  //           "uom_id": "$uom_id"
  //         },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $eq: ["$$uom_id", "$uom_id"]
  //               }
  //             }
  //           }, {
  //             $project: {
  //               caption: 1,
  //             }
  //           }
  //         ], as: 'uom'
  //       }
  //     },
  //     {
  //       $addFields: {
  //         caption: { $first: "$uom.caption" }
  //       }
  //     },
  //     {
  //       $lookup:
  //       {
  //         from: "t_100_brands",
  //         let: {
  //           "brand_id": "$brand_id"
  //         },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $eq: ["$$brand_id", "$brand_id"]
  //               }
  //             }
  //           }, {
  //             $project: {
  //               brand: 1,
  //             }
  //           }
  //         ], as: 'brand'
  //       }
  //     },
  //     {
  //       $addFields: {
  //         brand: "$brand.brand"
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 't_900_sales',
  //         let: {
  //           "item_id": "$item_id"
  //         },
  //         pipeline: [
  //           { $unwind: "$invoice_details" },
  //           { $unwind: "$invoice_item_details" },
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
  //                   { $eq: ["$invoice_item_details.invoice_no", "$invoice_details.invoice_no"] },
  //                   { $gte: ["$invoice_details.invoice_date", fromDate] },
  //                   { $lte: ["$invoice_details.invoice_date", toDate] },
  //                 ]

  //               }
  //             }
  //           },
  //           {
  //             $project: {
  //               _id: 0,
  //               netValue: { $sum: { $toDouble: "$invoice_item_details.net_value" } },
  //               qty: { $sum: { $toDouble: "$invoice_item_details.now_dispatch_qty" } },
  //               itemId: "$invoice_item_details.item_id",
  //             }
  //           },
  //           {
  //             $group: {
  //               _id: "$itemId",
  //               totalNetValue: { $sum: "$netValue" },
  //               qty: { $sum: "$qty" },
  //             }
  //           }
  //         ], as: "sales"
  //       }
  //     },
  //     {
  //       $addFields: {
  //         totalNetValue: {
  //           $round: [{ $ifNull: [{ $first: "$sales.totalNetValue" }, 0] }, 2]
  //         },
  //         qty: {
  //           $ifNull: [{ $first: "$sales.qty" }, 0]
  //         },
  //         brand: { $first: "$brand" },
  //       }
  //     },
  //     {
  //       $unset: ["sales", "uom"]
  //     },
  //     {
  //       $group: {
  //         _id: "$brand_id",
  //         brand: { $first: "$brand" },
  //         // caption:{$first:"$caption"},
  //         totalNetValue: { $sum: "$totalNetValue" },
  //         qty: { $sum: "$qty" }

  //       }
  //     },

  //   ],
  // )
  ////////////////////////////////////////////

  if (brandData.length > 0) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }
}

const brandWiseDetailedReport = async (req, res) => {
  const brand_id = req.body.brand_id
  // const fromDate = moment(moment("2023-01-16").format("x"), "x").unix();
  // const toDate = moment(moment("2023-02-13").format("x"), "x").unix() + 86399;

  const fromDate = req.body.fromDate
  const toDate = req.body.toDate + 86399

  // /FOR FETCHING AND DISPLAY NEW
  let brandData = await BrandReport.aggregate([
    {
      $match: {
        $expr: {
          $cond: {
            if: brand_id,
            then: {
              $and:
                [
                  { $eq: ["$brand_id", brand_id] },
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            },
            else: {
              $and:
                [
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            }
          }

        }

      }
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
        brand: { $first: "$brand.brand" }
      }
    },
    {
      $project: {
        item: 1,
        item_id: 1,
        uom: 1,
        qty: 1,
        netAmount: 1,
        grossAmount:1,
        brand: 1,
        invoice_date: 1,
      }
    },
    {
      $group: {
        _id: "$item_id",
        item: { $first: "$item" },
        uom: { $first: "$uom" },
        qty: { $sum: "$qty" },
        netAmount: { $sum: "$netAmount" },
        grossAmount: { $sum: "$grossAmount" },
        brand: { $first: "$brand" },
        invoice_date: { $first: "$invoice_date" }
      }

    },
    {
      $sort: {
        brand: 1
      }
    }
  ])
  if (brandData) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }

  // ////////OLD/////////////////////////////
  // console.log(fromDate, toDate)
  // let brandData = await item.aggregate([
  //   {
  //     $match: {

  //       $expr: {
  //         $cond: {
  //           if: brand_id,
  //           then: { $eq: ["$brand_id", brand_id] },
  //           else: ''
  //         }
  //       }
  //     }
  //   },
  //   {
  //     $sort: {
  //       item: 1,
  //     }
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       item_id: 1,
  //       uom_id: 1,
  //       item: 1,
  //       brand_id: 1
  //     }
  //   },
  //   {
  //     $lookup:
  //     {
  //       from: "t_100_uoms",
  //       let: {
  //         "uom_id": "$uom_id"
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$$uom_id", "$uom_id"]
  //             }
  //           }
  //         }, {
  //           $project: {
  //             caption: 1,
  //             uom_id: 1,
  //           }
  //         }
  //       ], as: 'uom_details'
  //     }
  //   },
  //   {
  //     $addFields: {
  //       uom: { $first: "$uom_details.caption" },
  //       uom_id: { $first: "$uom_details.uom_id" },
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: 't_900_sales',
  //       let: {
  //         "item_id": "$item_id"
  //       },
  //       pipeline: [
  //         { $unwind: "$invoice_details" },
  //         { $unwind: "$invoice_item_details" },
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
  //                 { $eq: ["$invoice_item_details.invoice_no", "$invoice_details.invoice_no"] },
  //                 { $gte: ["$invoice_details.invoice_date", fromDate] },
  //                 { $lte: ["$invoice_details.invoice_date", toDate] },
  //               ]

  //             }
  //           }
  //         },
  //         {
  //           $project: {
  //             _id: 0,
  //             netValue: { $sum: { $toDouble: "$invoice_item_details.net_value" } },
  //             qty: { $sum: { $toDouble: "$invoice_item_details.now_dispatch_qty" } },
  //             rate:{ $sum: { $toDouble: "$invoice_item_details.rate" } },
  //             itemId: "$invoice_item_details.item_id",
  //             invoice_date: "$invoice_details.invoice_date",
  //             disc_percentage: "$invoice_item_details.disc_percentage",
  //             disc_value: { $toDouble:"$invoice_item_details.disc_value"},
  //             gst_value: "$invoice_item_details.gst_value",
  //             gst_type: "$invoice_item_details.gst_type",
  //             gst_percentage: "$invoice_item_details.gst_percentage",
  //             invoice_no: "$invoice_item_details.invoice_no",
  //           }
  //         },
  //       ], as: "sales"
  //     }
  //   },
  //   {
  //     $unset: ["uom_details"]
  //   },
  // ],)

  // console.log(brandData.length)
  // if (brandData) {
  //   brandData.map(async (r) => {

  //     if (r.sales) {
  //       r.sales.map(async (b) => {

  //         // insert data
  //         await new BrandReport({
  //           item_id: r.item_id,
  //           brand_id: r.brand_id,
  //           item: r.item,
  //           uom: r.uom,
  //           uom_id: r.uom_id,
  //           qty: b.qty,
  //           rate:b.rate,
  //           netAmount: b.netValue,
  //           grossAmount:(b.rate - b.disc_value)*b.qty,
  //           invoice_no: b.invoice_no,
  //           rate: b.rate,
  //           disc_percentage: b.disc_percentage,
  //           disc_value: b.disc_value,
  //           gst_value: b.gst_value,
  //           gst_type: b.gst_type,
  //           gst_percentage: b.gst_percentage,
  //           invoice_date: b.invoice_date,
  //         }).save()

  //       })
  //     } 
  //     // else {
  //     //   await new BrandReport(r).save()
  //     // }

  //   })
  //   return res.status(200).json(brandData);
  // } else {
  //   return res.status(200).json([]);
  // }
  ///////////////////////////////////////////
}


const allBrandWiseCondensedReport = async (req, res) => {
  const brand_id = req.body.brand_id

  const fromDate = req.body.fromDate
  const toDate = req.body.toDate + 86399

  console.log(fromDate, toDate)
  let brandData = await BrandReport.aggregate([
    {
      $match: {
        // "brand_id": brand_id
        $expr: {
          $cond: {
            if: brand_id,
            then: {
              $and:
                [
                  { $eq: ["$brand_id", brand_id] },
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            },
            else: {
              $and:
                [
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            }
          }

        }

      }
    },
    {
      $project: {
        brand_id: 1,
        item: 1,
        uom: 1,
        qty: 1,
        netAmount: 1,
        grossAmount:1,
      }
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
      $group: {
        _id: "$brand_id",
        qty: { $sum: "$qty" },
        netAmount: { $sum: "$netAmount" },
        grossAmount: { $sum: "$grossAmount" },
        brand: { $first: "$brand" },
        uom: { $first: "$uom" },
      }
    },
    {
      $sort: {
        brand: 1
      }
    }
  ])

  if (brandData) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }
}

const brandReportInsert = async (req, res) => {
  const data = req.body
  console.log(data)
  let brandData = await new BrandReport({
    item_id: data.item_id,
    item: data.item,
    "brand_id": data.brand_id,
    uom: data.uom,
    uom_id: data.uom_id,
    qty: data.now_dispatch_qty,
    netAmount: data.net_value,
    grossAmount: data.grossAmount,
    invoice_date:data.invoice_date,
    invoice_no: data.invoice_no,
    sales_id: Number(data.sales_id),
    rate: Number(data.rate),
    disc_percentage: Number(data.disc_percentage),
    disc_value: Number(data.disc_value),
    gst_value: Number(data.gst_value),
    gst_type: Number(data.gst_type),
    gst_percentage: Number(data.gst_percentage),
  }).save()

  if (brandData) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }

}

const brandReportStorageInsert = async (req, res) => {
  const brand_id = req.body.brand_id
  // const fromDate = moment(moment("2023-02-21").format("x"), "x").unix();
  // const toDate = moment(moment("2023-02-22").format("x"), "x").unix() + 86399;

  const fromDate = req.body.fromDate
  const toDate = req.body.toDate + 86399

  // // /FOR FETCHING AND delete brand wise
  // let brandData = await BrandReport.aggregate([
  //   {
  //     $match: {
  //       $expr: {
  //         $cond: {
  //           if: brand_id,
  //           then: {
  //             $and:
  //               [
  //                 { $eq: ["$brand_id", brand_id] },
  //                 { $gte: ["$invoice_date", fromDate] },
  //                 { $lte: ["$invoice_date", toDate] }

  //               ]
  //           },
  //           else: {
  //             $and:
  //               [
  //                 { $gte: ["$invoice_date", fromDate] },
  //                 { $lte: ["$invoice_date", toDate] }

  //               ]
  //           }
  //         }

  //       }

  //     }
  //   },
  //   {
  //     $lookup:
  //     {
  //       from: "t_100_brands",
  //       let: {
  //         "brand_id": "$brand_id"
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$$brand_id", "$brand_id"]
  //             }
  //           }
  //         }, {
  //           $project: {
  //             brand: 1,
  //           }
  //         }
  //       ], as: 'brand'
  //     }
  //   },
  //   {
  //     $addFields: {
  //       brand: { $first: "$brand.brand" }
  //     }
  //   },
  //   {
  //     $project: {
  //       item: 1,
  //       item_id: 1,
  //       uom: 1,
  //       qty: 1,
  //       netAmount: 1,
  //       grossAmount: 1,
  //       brand: 1,
  //       invoice_date: 1,
  //       brandReport_id: 1
  //     }
  //   },
  //   {
  //     $group: {
  //       _id: "$item_id",
  //       item: { $first: "$item" },
  //       uom: { $first: "$uom" },
  //       qty: { $sum: "$qty" },
  //       netAmount: { $sum: "$netAmount" },
  //       grossAmount: { $sum: "$grossAmount" },
  //       brand: { $first: "$brand" },
  //       invoice_date: { $first: "$invoice_date" }
  //     }

  //   },
  //   {
  //     $sort: {
  //       brand: 1
  //     }
  //   }
  // ])

  // if (brandData) {

  //   // delete brand
  //   brandData.map(async (r) => {
  //     await BrandReport.findOneAndDelete({
  //       brandReport_id: r.brandReport_id
  //     })
  //   })

  //   // ////save
  //   // brandData.map(async (r) => {
  //   //   if (r.sales) {
  //   //     r.sales.map(async (b) => {
  //   //       // insert data
  //   //       await new BrandReport({
  //   //         item_id: r.item_id,
  //   //         brand_id: r.brand_id,
  //   //         item: r.item,
  //   //         uom: r.uom,
  //   //         uom_id: r.uom_id,
  //   //         qty: b.qty,
  //   //         rate: b.rate,
  //   //         netAmount: b.netValue,
  //   //         grossAmount: (b.rate - b.disc_value) * b.qty,
  //   //         invoice_no: b.invoice_no,
  //   //         rate: b.rate,
  //   //         disc_percentage: b.disc_percentage,
  //   //         disc_value: b.disc_value,
  //   //         gst_value: b.gst_value,
  //   //         gst_type: b.gst_type,
  //   //         gst_percentage: b.gst_percentage,
  //   //         invoice_date: b.invoice_date,
  //   //       }).save()

  //   //     })
  //   //   }
  //   //   // else {
  //   //   //   await new BrandReport(r).save()
  //   //   // }

  //   // })
  //   return res.status(200).json(brandData);
  // } else {
  //   return res.status(200).json([]);
  // }

  ////////insert/////////////////////////////
  console.log(fromDate, toDate)
  let brandData = await item.aggregate([
    {
      $match: {

        $expr: {
          $cond: {
            if: brand_id,
            then: { $eq: ["$brand_id", brand_id] },
            else: ''
          }
        }
      }
    },
    {
      $sort: {
        item: 1,
      }
    },
    {
      $project: {
        _id: 0,
        item_id: 1,
        uom_id: 1,
        item: 1,
        brand_id: 1
      }
    },
    {
      $lookup:
      {
        from: "t_100_uoms",
        let: {
          "uom_id": "$uom_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$uom_id", "$uom_id"]
              }
            }
          }, {
            $project: {
              caption: 1,
              uom_id: 1,
            }
          }
        ], as: 'uom_details'
      }
    },
    {
      $addFields: {
        uom: { $first: "$uom_details.caption" },
        uom_id: { $first: "$uom_details.uom_id" },
      }
    },
    {
      $lookup: {
        from: 't_900_sales',
        let: {
          "item_id": "$item_id"
        },
        pipeline: [
          { $unwind: "$invoice_details" },
          { $unwind: "$invoice_item_details" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
                  { $eq: ["$invoice_item_details.invoice_no", "$invoice_details.invoice_no"] },
                  { $gte: ["$invoice_details.invoice_date", fromDate] },
                  { $lte: ["$invoice_details.invoice_date", toDate] },
                ]

              }
            }
          },
          {
            $project: {
              _id: 0,
              netValue: { $sum: { $toDouble: "$invoice_item_details.net_value" } },
              qty: { $sum: { $toDouble: "$invoice_item_details.now_dispatch_qty" } },
              rate: { $sum: { $toDouble: "$invoice_item_details.rate" } },
              itemId: "$invoice_item_details.item_id",
              invoice_date: "$invoice_details.invoice_date",
              disc_percentage: "$invoice_item_details.disc_percentage",
              disc_value: { $toDouble: "$invoice_item_details.disc_value" },
              gst_value: "$invoice_item_details.gst_value",
              gst_type: "$invoice_item_details.gst_type",
              gst_percentage: "$invoice_item_details.gst_percentage",
              invoice_no: "$invoice_item_details.invoice_no",
            }
          },
        ], as: "sales"
      }
    },
    {
      $unset: ["uom_details"]
    },
  ],)

  if (brandData) {
    console.log(brandData.length)

    brandData.map(async (r,i) => {

      if (r.sales) {
        r.sales.map(async (b) => {

          // insert data
          await new BrandReport({
            item_id: r.item_id,
            brand_id: r.brand_id,
            item: r.item,
            uom: r.uom,
            uom_id: r.uom_id,
            qty: b.qty,
            rate: b.rate,
            netAmount: b.netValue,
            grossAmount: (b.rate - b.disc_value) * b.qty,
            invoice_no: b.invoice_no,
            rate: b.rate,
            disc_percentage: b.disc_percentage,
            disc_value: b.disc_value,
            gst_value: b.gst_value,
            gst_type: b.gst_type,
            gst_percentage: b.gst_percentage,
            invoice_date: b.invoice_date,
          }).save()

        })
      }
      // else {
      //   await new BrandReport(r).save()
      // }
      if(i===(brandData-1))
      {
        return res.status(200).json(brandData);
      }
    })
    // return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }
  /////////////////////////////////////////
}


const brandWisePurchaseReport = async (req, res) => {
  let condition = {}
  const brand_id = req.body.brand_id
  const category_id = req.body.category_id


  // const fromDate = req.body.fromDate
  // const toDate = req.body.toDate + 86399

  if(category_id){ condition = { ...condition, "category_id": category_id }; }
 
  // console.log(fromDate, toDate)
  let brandData = await item.aggregate(
    [
      {
        $match: {
          $expr: {
            $cond: {
              if: brand_id,
              then: { $eq: ["$brand_id", brand_id] },
              else: ''
            }

          }

        }
      },
      {
        $sort: {
          item: 1,
        }
      },
      {
        $project: {
          _id: 0,
          item_id: 1,
          uom_id: 1,
          item: 1,
          brand_id: 1,          
         category_id:1
        }
      },
      {
        $lookup:
        {
          from: "t_100_uoms",
          let: {
            "uom_id": "$uom_id"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$uom_id", "$uom_id"]
                }
              }
            }, {
              $project: {
                caption: 1,
              }
            }
          ], as: 'uom'
        }
      },
      {
        $addFields: {
          caption: { $first: "$uom.caption" }
        }
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
          brand:{$first: "$brand.brand"}
        }
      },

      //category
      {
        $lookup: {
          from: "t_100_categories",
          let: { "category_id": "$category_id" },
          pipeline: [
            {
              $match:
                { $expr: { $eq: ["$$category_id", "$category_id"] }, },
            },
            { $project: { "category": 1, } }
          ],
          as: "parent_category_name"
        },
      },
  
      { $addFields: { category: { $first: "$parent_category_name.category" } } },
      
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
              $unwind: {
                path: "$grn_details",
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
                        { $eq: ["$item_details.item_id", "$$item_id"] },
                        // {
                        //   $eq: ["$showroom_warehouse_id", showroom_warehouse_id],
                        // },
                        { $ne: ["$approve_id", 0] },
                       
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
            {
              $unset: "grn_details",
            },
            {
              $project: {
                // moudle: 1,
                item_id: {
                  $cond: {
                    if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                    then: "$item_details.item_id",
                    else: 0,
                  },
                },
                qty: {
                  $cond: {
                    if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                    then: "$item_details.quantity",
                    else: 0,
                  },
                },

                rate:{
                  $cond:{
                    if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                    then: "$item_details.rate",
                    else: 0,
                  },
                },
                net_value:{
                  $cond:{
                    if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                    then: "$item_details.net_value",
                    else: 0,
                  },
                },
              },
            },
            {
              $group: {
                _id: "$item_id",
                purchase: { $sum: "$qty" },
                rate:{$sum:"$rate"},
                net_value:{$sum:"$net_value"},

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
            // {
            //   $unwind:
            //   {
            //     path: "$grn_details",
            //     preserveNullAndEmptyArrays: true
            //   }
            // },
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $in: ["$module", ["ITEMRECEIVED"]] },
                    then: {
                      $and: [
                        { $eq: ["$received_item_details.item_id", "$$item_id"] },
                        // {
                        //   $eq: ["$showroom_warehouse_id", showroom_warehouse_id],
                        // },
                        // {
                        //   $gte: [
                        //     { $divide: ["$inserted_by_date", 1000] },
                        //     txt_from_date,
                        //   ],
                        // },
                        // {
                        //   $lte: [
                        //     { $divide: ["$inserted_by_date", 1000] },
                        //     txt_to_date,
                        //   ],
                        // },
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
            {
              $project: {
                moudle: 1,
                item_id: {
                  $cond: {
                    if: { $in: ["$module", ["ITEMRECEIVED"]] },
                    then: "$received_item_details.item_id",
                    else: 0,
                  },
                },
                purchase: {
                  $cond: {
                    if: { $in: ["$module", ["ITEMRECEIVED"]] },
                    then: "$received_item_details.receivedQty",
                    else: 0,
                  },
                },
                rate:{
                  $cond:{
                    if: { $in: ["$module", ["ITEMRECEIVED"]] },
                    then: "$item_details.rate",
                    else: 0,
                  },
                },
                net_value:{
                  $cond:{
                    if: { $in: ["$module", ["ITEMRECEIVED"]] },
                    then: "$item_details.net_value",
                    else: 0,
                  },
                },
              },
            },
            {
              $group: {
                _id: "$item_id",
                purchase: { $sum: { $toDouble: "$purchase" } },
              },
            },
          ],
          as: "itemrReceved_purchase",
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
                $and: [
                  {
                    $eq: ["$return_details.item_details.item_id", "$$item_id"],
                  },
                  // { $eq: ["$showroom_warehouse_id", showroom_warehouse_id] },
                  // { $gte: ["$purchase_return_date", txt_from_date] },
                  // { $lte: ["$purchase_return_date", txt_to_date] },
                ],
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
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        sumPurchase: {
          $sum: [
            "$direct_purchase.purchase",
            "$itemrReceved_purchase.purchase",
          ],
        },
        sumrate: {
          $sum: [
            "$direct_purchase.rate",
            "$itemrReceved_purchase.rate",
          ],
        },
        sumNet_value: {
          $sum: [
            "$direct_purchase.net_value",
            "$itemrReceved_purchase.net_value",
          ],
        },
      },
    },
     
      // {
      //   $unset: ["sales", "uom"]
      // },
      {
        $group: {
          _id: "$brand_id",
          brand: { $first: "$brand" },
          sumPurchase:{$first:"$sumPurchase"},
          sumNet_value:{$first:"$sumNet_value"},
          caption:{$first:"$caption"},
          item:{$first:"$item"},
          category:{$first:"$parent_category_name.category"}
      

        }
      },

    ],
  )
  ////////////////////////////////////////////

  if (brandData.length > 0) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }
}

const brandWiseCondensedPurchaseReport = async (req, res) => {
  let condition = {};
  const brand_id = req.body.brand_id;
  const category_id = req.body.category_id;
  const from_date = req.body.fromDate;
  const to_date = req.body.toDate;

  if (category_id) {
    condition = { ...condition, category_id: category_id };
  }

  let brandData = await item.aggregate([
    {
      $match: {
        $expr: {
          $cond: {
            if: brand_id,
            then: { $eq: ["$brand_id", brand_id] },
            else: ""
          }
        }
      }
    },
    {
      $sort: {
        item: 1
      }
    },
    {
      $project: {
        _id: 0,
        item_id: 1,
        uom_id: 1,
        item: 1,
        brand_id: 1,
        category_id: 1
      }
    },
    {
      $lookup: {
        from: "t_100_uoms",
        let: {
          uom_id: "$uom_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$uom_id", "$uom_id"]
              }
            }
          },
          {
            $project: {
              caption: 1
            }
          }
        ],
        as: "uom"
      }
    },
    {
      $addFields: {
        caption: { $first: "$uom.caption" }
      }
    },
    {
      $lookup: {
        from: "t_100_brands",
        let: {
          brand_id: "$brand_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$brand_id", "$brand_id"]
              }
            }
          },
          {
            $project: {
              brand: 1
            }
          }
        ],
        as: "brand"
      }
    },
    {
      $addFields: {
        brand: { $first: "$brand.brand" }
      }
    },
    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$$category_id", "$category_id"] } }
          },
          { $project: { "category": 1 } }
        ],
        as: "parent_category_name"
      }
    },
    {
      $addFields: {
        category: { $first: "$parent_category_name.category" }
      }
    },
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$grn_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      { $eq: ["$item_details.item_id", "$$item_id"] },
                      { $ne: ["$approve_id", 0] },
                      { $eq: ["$grn_details.grn_date", from_date] }
                    ]
                  },
                  else: 0
                }
              }
            }
          },
          {
            $unset: "grn_details"
          },
          {
            $project: {
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.item_id",
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
              rate: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.rate",
                  else: 0
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.net_value",
                  else: 0
                }
              }
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: "$qty" },
              rate: { $sum: "$rate" },
              net_value: { $sum: "$net_value" }
            }
          }
        ],
        as: "direct_purchase"
      }
    },
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] }
                    ]
                  },
                  else: 0
                }
              }
            }
          },
          {
            $project: {
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.item_id",
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
              rate: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$item_details.rate",
                  else: 0
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$item_details.net_value",
                  else: 0
                }
              }
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: { $toDouble: "$purchase" } }
            }
          }
        ],
        as: "itemrReceved_purchase"
      }
    },
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$return_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$return_details.item_details.item_id", "$$item_id"]
                  }
                ]
              }
            }
          },
          {
            $project: {
              item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty"
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase_return: { $sum: "$purchase_return" }
            }
          }
        ],
        as: "purchase_return"
      }
    },
    {
      $unwind: {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$direct_purchase",
        // preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$brand_id",
        brand: { $first: "$brand" },
        sumPurchase: { $sum: "$direct_purchase.purchase" },
        sumNet_value: { $sum: "$direct_purchase.net_value" },
        caption: { $first: "$caption" },
        category: { $first: "$parent_category_name.category" }
      }
    }
  ]);

  if (brandData.length > 0) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }
};


const brandWiseDetailsPurchaseReport = async (req, res) => {
  let condition = {};
  const brand_id = req.body.brand_id;
  const category_id = req.body.category_id;
  const from_date = req.body.fromDate;
  const to_date = req.body.toDate;

  // console.log(from_date, "tanusree");

  if (category_id) {
    condition = { ...condition, category_id: category_id };
  }

  // if (from_date && to_date) {
  //   condition = {
  //     ...condition,
  //     po_date: {
  //       $gte: from_date,
  //       $lte: to_date,
  //     },
  //   };
  // }

  let brandData = await item.aggregate([
    {
      $match: {
        $expr: {
          $cond: {
            if: brand_id,
            then: { $eq: ["$brand_id", brand_id] },
            else: ""
          }
        }
      }
    },
    {
      $sort: {
        item: 1
      }
    },
    {
      $project: {
        _id: 0,
        item_id: 1,
        uom_id: 1,
        item: 1,
        brand_id: 1,
        category_id: 1
      }
    },
    {
      $lookup: {
        from: "t_100_uoms",
        let: {
          uom_id: "$uom_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$uom_id", "$uom_id"]
              }
            }
          },
          {
            $project: {
              caption: 1
            }
          }
        ],
        as: "uom"
      }
    },
    {
      $addFields: {
        caption: { $first: "$uom.caption" }
      }
    },
    {
      $lookup: {
        from: "t_100_brands",
        let: {
          brand_id: "$brand_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$brand_id", "$brand_id"]
              }
            }
          },
          {
            $project: {
              brand: 1
            }
          }
        ],
        as: "brand"
      }
    },
    {
      $addFields: {
        brand: { $first: "$brand.brand" }
      }
    },
    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$$category_id", "$category_id"] } }
          },
          { $project: { "category": 1 } }
        ],
        as: "parent_category_name"
      }
    },
    {
      $addFields: {
        category: { $first: "$parent_category_name.category" }
      }
    },
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$grn_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      { $eq: ["$item_details.item_id", "$$item_id"] },
                      { $ne: ["$approve_id", 0] },
                        { $eq: ["$grn_details.grn_date", from_date] },
                      // { $lte: ["$po_date", to_date] },
                    ]
                  },
                  else: 0
                }
              }
            }
          },
          {
            $unset: "grn_details"

          },
          {
            $project: {
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.item_id",
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
              rate: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.rate",
                  else: 0
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.net_value",
                  else: 0
                }
              },
              po_date:{ $month:{$toDate: { $multiply: ["$po_date", 1000] }}},
                          
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: "$qty" },
              rate: { $sum: "$rate" },
              net_value: { $sum: "$net_value" },
              date:{$first:"$po_date"}
            }
          }
        ],
        as: "direct_purchase"
      }
    },
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] }
                    ]
                  },
                  else: 0
                }
              }
            }
          },
          {
            $project: {
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.item_id",
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
              rate: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$item_details.rate",
                  else: 0
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$item_details.net_value",
                  else: 0
                }
              },
              po_date:1,
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: { $toDouble: "$purchase" } },
              date:{$first:"$po_date"}

            }
          }
        ],
        as: "itemrReceved_purchase"
      }
    },
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$return_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$return_details.item_details.item_id", "$$item_id"]
                  }
                ]
              }
            }
          },
          {
            $project: {
              item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty"
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase_return: { $sum: "$purchase_return" }
            }
          }
        ],
        as: "purchase_return"
      }
    },
    {
      $unwind: {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$direct_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$item_id",
        brand: { $first: "$brand" },
        item:{$first:"$item"},
        sumPurchase: { $sum: "$direct_purchase.purchase" },
        date:{$first:"$direct_purchase.date"},
        sumNet_value: { $sum: "$direct_purchase.net_value" },
        caption: { $first: "$caption" },
        category: { $first: "$parent_category_name.category" }
      }
    }
  ]);

  if (brandData.length > 0) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }

  // const { category_id, brand_id, fromDate, toDate } = req.body;
  // console.log("Collected Data:", req.body);
};



const brandWiseDetailedpurchaseTestReport = async (req, res) => {
  const brand_id = req.body.brand_id
  // const fromDate = moment(moment("2023-01-16").format("x"), "x").unix();
  // const toDate = moment(moment("2023-02-13").format("x"), "x").unix() + 86399;

  const fromDate = req.body.fromDate
  const toDate = req.body.toDate + 86399

  // console.log("Collected Data:", req.body);

  // /FOR FETCHING AND DISPLAY NEW
  let brandData = await BrandReport.aggregate([
    {
      $match: {
        $expr: {
          $cond: {
            if: brand_id,
            then: {
              $and:
                [
                  { $eq: ["$brand_id", brand_id] },
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            },
            else: {
              $and:
                [
                  { $gte: ["$invoice_date", fromDate] },
                  { $lte: ["$invoice_date", toDate] }

                ]
            }
          }

        }

      }
    },
    {
      $project: {
        _id: 0,
        item_id: 1,
        uom_id: 1,
        item: 1,
        brand_id: 1,
        category_id: 1
      }
    },
    {
      $lookup: {
        from: "t_100_uoms",
        let: {
          uom_id: "$uom_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$uom_id", "$uom_id"]
              }
            }
          },
          {
            $project: {
              caption: 1
            }
          }
        ],
        as: "uom"
      }
    },
    {
      $addFields: {
        caption: { $first: "$uom.caption" }
      }
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
        brand: { $first: "$brand.brand" }
      }
    },
    {
      $project: {
        item: 1,
        item_id: 1,
        uom: 1,
        qty: 1,
        netAmount: 1,
        grossAmount:1,
        brand: 1,
        invoice_date: 1,
      }
    },
    {
      $lookup: {
        from: "t_100_categories",
        let: { "category_id": "$category_id" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$$category_id", "$category_id"] } }
          },
          { $project: { "category": 1 } }
        ],
        as: "parent_category_name"
      }
    },
    {
      $addFields: {
        category: { $first: "$parent_category_name.category" }
      }
    },
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$grn_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: {
                    $and: [
                      { $eq: ["$item_details.item_id", "$$item_id"] },
                      { $ne: ["$approve_id", 0] }
                    ]
                  },
                  else: 0
                }
              }
            }
          },
          {
            $unset: "grn_details"

          },
          {
            $project: {
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.item_id",
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
              rate: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.rate",
                  else: 0
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["DIRECT PURCHASE"]] },
                  then: "$item_details.net_value",
                  else: 0
                }
              },
              po_date:1,
                          
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: "$qty" },
              rate: { $sum: "$rate" },
              net_value: { $sum: "$net_value" },
              date:{$first:"$po_date"}
            }
          }
        ],
        as: "direct_purchase"
      }
    },
    {
      $lookup: {
        from: "t_800_purchases",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$received_item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: {
                    $and: [
                      { $eq: ["$received_item_details.item_id", "$$item_id"] }
                    ]
                  },
                  else: 0
                }
              }
            }
          },
          {
            $project: {
              item_id: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$received_item_details.item_id",
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
              rate: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$item_details.rate",
                  else: 0
                }
              },
              net_value: {
                $cond: {
                  if: { $in: ["$module", ["ITEMRECEIVED"]] },
                  then: "$item_details.net_value",
                  else: 0
                }
              },
              po_date:1,
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase: { $sum: { $toDouble: "$purchase" } },
              date:{$first:"$po_date"}

            }
          }
        ],
        as: "itemrReceved_purchase"
      }
    },
    {
      $lookup: {
        from: "t_900_purchase_returns",
        let: { item_id: "$item_id" },
        pipeline: [
          {
            $unwind: {
              path: "$return_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$return_details.item_details",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$return_details.item_details.item_id", "$$item_id"]
                  }
                ]
              }
            }
          },
          {
            $project: {
              item_id: "$return_details.item_details.item_id",
              purchase_return: "$return_details.item_details.return_qty"
            }
          },
          {
            $group: {
              _id: "$item_id",
              purchase_return: { $sum: "$purchase_return" }
            }
          }
        ],
        as: "purchase_return"
      }
    },
    {
      $unwind: {
        path: "$itemrReceved_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$direct_purchase",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$purchase_return",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$item_id",
        brand: { $first: "$brand" },
        item:{$first:"$item"},
        sumPurchase: { $sum: "$direct_purchase.purchase" },
        // date:{$first:"$direct_purchase.date"},
        sumNet_value: { $sum: "$direct_purchase.net_value" },
        caption: { $first: "$caption" },
        invoice_date: { $first: "$invoice_date" },

        category: { $first: "$parent_category_name.category" }
      }
    },
  
    // {
    //   $sort: {
    //     brand: 1
    //   }
    // }
  ])
  if (brandData) {
    return res.status(200).json(brandData);
  } else {
    return res.status(200).json([]);
  }

  // ////////OLD/////////////////////////////
  // console.log(fromDate, toDate)
  // let brandData = await item.aggregate([
  //   {
  //     $match: {

  //       $expr: {
  //         $cond: {
  //           if: brand_id,
  //           then: { $eq: ["$brand_id", brand_id] },
  //           else: ''
  //         }
  //       }
  //     }
  //   },
  //   {
  //     $sort: {
  //       item: 1,
  //     }
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       item_id: 1,
  //       uom_id: 1,
  //       item: 1,
  //       brand_id: 1
  //     }
  //   },
  //   {
  //     $lookup:
  //     {
  //       from: "t_100_uoms",
  //       let: {
  //         "uom_id": "$uom_id"
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$$uom_id", "$uom_id"]
  //             }
  //           }
  //         }, {
  //           $project: {
  //             caption: 1,
  //             uom_id: 1,
  //           }
  //         }
  //       ], as: 'uom_details'
  //     }
  //   },
  //   {
  //     $addFields: {
  //       uom: { $first: "$uom_details.caption" },
  //       uom_id: { $first: "$uom_details.uom_id" },
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: 't_900_sales',
  //       let: {
  //         "item_id": "$item_id"
  //       },
  //       pipeline: [
  //         { $unwind: "$invoice_details" },
  //         { $unwind: "$invoice_item_details" },
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 { $eq: ["$invoice_item_details.item_id", "$$item_id"] },
  //                 { $eq: ["$invoice_item_details.invoice_no", "$invoice_details.invoice_no"] },
  //                 { $gte: ["$invoice_details.invoice_date", fromDate] },
  //                 { $lte: ["$invoice_details.invoice_date", toDate] },
  //               ]

  //             }
  //           }
  //         },
  //         {
  //           $project: {
  //             _id: 0,
  //             netValue: { $sum: { $toDouble: "$invoice_item_details.net_value" } },
  //             qty: { $sum: { $toDouble: "$invoice_item_details.now_dispatch_qty" } },
  //             rate:{ $sum: { $toDouble: "$invoice_item_details.rate" } },
  //             itemId: "$invoice_item_details.item_id",
  //             invoice_date: "$invoice_details.invoice_date",
  //             disc_percentage: "$invoice_item_details.disc_percentage",
  //             disc_value: { $toDouble:"$invoice_item_details.disc_value"},
  //             gst_value: "$invoice_item_details.gst_value",
  //             gst_type: "$invoice_item_details.gst_type",
  //             gst_percentage: "$invoice_item_details.gst_percentage",
  //             invoice_no: "$invoice_item_details.invoice_no",
  //           }
  //         },
  //       ], as: "sales"
  //     }
  //   },
  //   {
  //     $unset: ["uom_details"]
  //   },
  // ],)

  // console.log(brandData.length)
  // if (brandData) {
  //   brandData.map(async (r) => {

  //     if (r.sales) {
  //       r.sales.map(async (b) => {

  //         // insert data
  //         await new BrandReport({
  //           item_id: r.item_id,
  //           brand_id: r.brand_id,
  //           item: r.item,
  //           uom: r.uom,
  //           uom_id: r.uom_id,
  //           qty: b.qty,
  //           rate:b.rate,
  //           netAmount: b.netValue,
  //           grossAmount:(b.rate - b.disc_value)*b.qty,
  //           invoice_no: b.invoice_no,
  //           rate: b.rate,
  //           disc_percentage: b.disc_percentage,
  //           disc_value: b.disc_value,
  //           gst_value: b.gst_value,
  //           gst_type: b.gst_type,
  //           gst_percentage: b.gst_percentage,
  //           invoice_date: b.invoice_date,
  //         }).save()

  //       })
  //     } 
  //     // else {
  //     //   await new BrandReport(r).save()
  //     // }

  //   })
  //   return res.status(200).json(brandData);
  // } else {
  //   return res.status(200).json([]);
  // }
  ///////////////////////////////////////////
}

//vendor for ledger

const vendorLedgerList = async (req, res) => {
  const data = req.body;
  const URL = req.url;
  const errors = {};

  let condition = {};
  const searchQuery = req.body.keyword_pharse;
  const group_id = req.body.group_id;


  if (group_id) {
    condition = { ...condition, group_id: group_id };
  }

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

  let queryData = await vendor.aggregate
    ([
      { $match: condition },

      //  {
      //       "$unwind": "$contact_person"
      //  },




      {
        $lookup: {
          from: "t_200_ledger_accounts",
          let: { "vendor_id": "$vendor_id" },
          pipeline: [

            {
              $match: {
                
                $expr: {
                  $and:[
                    {$eq: ["$type_id", "$$vendor_id"]},
                    {$eq: ["$type", "V"]}
                  ]
                },
              },
            },
            { $project: { "ledger_account_id": 1, "ledger_account": 1 } }
          ],
          as: "ledger_details"
        }
      },

      {
        $addFields: {
          ledger_account_id: { $first: "$ledger_details.ledger_account_id" },
          ledger_account_name: { $first: "$ledger_details.ledger_account" },

        },
      },

      { $unset: ["ledger_details"] },


      //For Ledger Group 

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



      {
        $project: {
          "customer_id": 1,
          "company_name": 1,
          "group_name": 1,
          "ledger_account_name": 1

        }
      },
    ]);
  [
    { $sort: { ledger_account: 1 } }
  ]


  if (queryData) {
    return res.status(200).send(queryData);
  }
  else {
    return res.status(200).json([]);
  }

};


module.exports = {
  view_salesman_chart, 
  brandReportInsert, 
  allBrandWiseCondensedReport,
  brandWiseDetailedReport, 
  brandWiseCondensedReport, 
  dataFromLedgerStorage, 
  out_standing_report_sales_order, 
  view_referenceCondensed,
  view_referenceDetail, 
  showroomWiseSalesList, 
  view_salesman, 
  view_customerCondensed,
  view_customerDetail, 
  view_saleOrderByInvoice, 
  referenceItemWiseSales, 
  out_standing_report, 
  customerLedgerList,
  brandReportStorageInsert,
  brandWisePurchaseReport,
  brandWiseCondensedPurchaseReport,
  brandWiseDetailsPurchaseReport,
  brandWiseDetailedpurchaseTestReport,
  vendorLedgerList
};
