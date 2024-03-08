const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

const Sales_Report_master_Schema = new mongoose.Schema({
  Customer_invoice_report_id: { type: Number, required: false },
  group_id: { type: Number, required: false },
  group_name: { type: String, required: false },
  customer_id: { type: Number, required: false, },
  customer_name: { type: String, required: false },
  reference_id: { type: Number, required: false },
  reference_name:{tyoe:String,required:false},
  netValue: { type: Number, required: false },
  
  sales_id: { type: Number, required: false },
  sales_executive_id: { type: Number, require: false },
  salesman_name: { type: String, required: false },
  showroom_warehouse_id: { type: Number, required: false },
  showroom_name:{ type: String, required: false },
  invoice_no: { type: String, required: false },
  invoice_date: { type: Number, required: false },


  approved_by_date: { type: Number, required: false, trim: true },  
  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {
    type: Number,
    required: true,
    trim: true,
    default: Date.now,
  },

});
Sales_Report_master_Schema.plugin(autoIncrement.plugin, {
  model: "t_Sales_Report_master",
  field: "Sales_Report_master_id",
  startAt: 1,
  incrementBy: 1,
});

const Sales_Report_item_Schema = new mongoose.Schema({
  Sales_Report_item_id: { type: Number, required: false },
  sales_id: { type: Number, required: false },
  brand_id: { type: Number, required: false },
  brand_name: { type: String, required: false },
  item_id: { type: Number, required: false, },
  item_name: { type: String, required: false },
  uom_id: { type: Number, required: false },
  uom_name:{tyoe:String,required:false},
  quantity: { type: Number, required: false },
  rate: { type: Number, required: false },
  gst: { type: Number, require: false },
  discount: { type: Number, required: false },  
  invoice_no: { type: String, required: false },
  invoice_date: { type: Number, required: false },

   
  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {
    type: Number,
    required: true,
    trim: true,
    default: Date.now,
  },

});
Sales_Report_item_Schema.plugin(autoIncrement.plugin, {
  model: "t_Sales_Report_item",
  field: "Sales_Report_item_id",
  startAt: 1,
  incrementBy: 1,
});




const Sales_Report_master = mongoose.model(
  "t_Sales_Report_master",
  Sales_Report_master_Schema
);
const Sales_Report_item = mongoose.model(
  "t_Sales_Report_item",
  Sales_Report_item_Schema
);

module.exports = {Sales_Report_master ,Sales_Report_item};
