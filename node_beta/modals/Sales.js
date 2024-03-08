const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

const salesSchema = new mongoose.Schema({
  sales_id: { type: Number, required: true, default: 0 },

  customer_id: { type: Number, required: false, trim: true, default: 0 },

  enquiry_details: { type: Array, required: false, trim: true },
  enquiry_no: { type: Array, required: false, trim: true },
  enquiry_item_details: { type: Array, required: false, trim: true },
  enquiry_status: { type: String, required: false, trim: true, default: "New" },
  enquiry_status_note: { type: String,required: false,trim: true,default: " ",},
  enquiry_task: { type: Array, required: false, trim: true },

  //quotation_details : { type: Array, required: false, trim: true },

  quotation_no: { type: Array, required: false, trim: true },
  quotation_item_details: { type: Array, required: false, trim: true },
  quotation_other_charges: { type: Array, required: false, trim: true },
  quotation_note: { type: String, required: false, trim: true, default: "" },
  quotation_date: {type: Number, required: false,trim: true,
    default: Date.now,
  },
  quotation_status: {
    type: String,
    required: false,
    trim: true,
    default: "New",
  },
  quotation_status_note: {
    type: String,
    required: false,
    trim: true,
    default: " ",
  },
  quotation_task: { type: Array, required: false, trim: true },

  sales_order_details: { type: Array, required: false, trim: true },
  sales_order_no: { type: Array, required: false, trim: true },
  sales_order_date: {
    type: Number,
    required: false,
    trim: true,
    default: Date.now,
  },
  sales_order_item_details: { type: Array, required: false, trim: true },
  sales_order_other_charges: { type: Array, required: false, trim: true },
  sales_order_note: { type: String, required: false, trim: true, default: " " },
  sales_status: { type: String, required: false, trim: true, default: "New" },
  sales_status_note: {
    type: String,
    required: false,
    trim: true,
    default: " ",
  },
  sales_task: { type: Array, required: false, trim: true },
  purchase_order_no: { type: String, required: false, trim: true, default: "" },
  purchase_order_date: {
    type: Number,
    required: false,
    trim: true,
    default: Date.now,
  },
  purchase_task: { type: Array, required: false, trim: true },

  delivery_order_details: { type: Array, required: false, trim: true },
  delivery_order_no: { type: Array, required: false, trim: true },
  delivery_order_item_details: { type: Array, required: false, trim: true },

  // delivery_order_date: {type: Number,required: false,trim: true,default: Date.now,},
  // delivery_order_note: {type: String,required: false,trim: true,default: " ",},
  // delivery_order_from_date: {type: Number,required: false,trim: true,default: Date.now,},
  // delivery_order_to_date: {type: Number,required: false,trim: true,default: Date.now,},
  // delivery_status: {type: String,required: false,trim: true,default: "New"},
  // delivery_status_note: {type: String,required: false,trim: true,default: " ",},
  delivery_task: { type: Array, required: false, trim: true },




  dispatch_order_details: { type: Array, required: false, trim: true },
  dispatch_order_no: { type: Array, required: false, trim: true },
  dispatch_order_item_details: { type: Array, required: false, trim: true },
  dispatch_order_date: {type: Number,required: false,trim: true,default: Date.now},
  vehicle_no: { type: String, required: false, trim: true, default: "" },
  contractor_id: { type: Number, required: false, trim: true, default: "" },
  dispatch_order_note: {type: String,required: false,trim: true,default: ""},
  dispatch_task: { type: Array, required: false, trim: true },
  dispatch_status: { type: String, required: false, trim: true, default: "" },
  dispatch_status_note: {type: String,required: false,trim: true,default: ""},

  invoice_details: { type: Array, required: false, trim: true },
  invoice_no: { type: Array, required: false, trim: true },
  invoice_item_details: { type: Array, required: false, trim: true },
  invoice_other_charges: { type: Array, required: false, trim: true },
  invoice_details: { type: Array, required: false, trim: true },
  invoice_date: {type: Number,required: false,trim: true,default: Date.now},
  invoice_note: { type: String, required: false, trim: true, default: "" },
  invoice_task: { type: Array, required: false, trim: true },
  invoice_status: { type: String, required: false, trim: true, default: "" },
  invoice_status_note: {type: String,required: false,trim: true,default: ""},

  active_status: { type: String, required: true, trim: true, default: "Y" },
  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {type: Number,required: true,trim: true,default: Date.now,},
  edited_by_id: { type: Number, required: true, trim: true, default: 0 },
  edit_by_date: { type: Number, required: true, trim: true, default: Date.now },
  deleted_by_id: { type: Number, required: true, trim: true, default: 0 },
  deleted_by_date: {type: Number,required: true,trim: true,default: Date.now,},
  edit_log: { type: Array, required: false },
});
salesSchema.plugin(autoIncrement.plugin, {model: "t_900_sales",field: "sales_id",startAt: 1,incrementBy: 1});

const serial_noSchema = new mongoose.Schema({


  enquiry_no: { type: Number, required: false, trim: true, default: 0 },
  quotation_no: { type: Number, required: false, trim: true, default: 0 },
  sales_order_no: { type: Number, required: false, trim: true, default: 0 },
  purchase_order_no: { type: Number, required: false, trim: true, default: 0 },
  delivery_order_no: { type: Number, required: false, trim: true, default: 0 },
  dispatch_order_no: { type: Number, required: false, trim: true, default: 0 },
  grn_no: { type: Number, required: false, trim: true, default: 0 },
  stock_transfer_no: { type: Number, required: false, trim: true, default: 0 },
  voucher_no: { type: Number, required: false, trim: true, default: 0 },
  invoice_no: { type: Number, required: false, trim: true, default: 0 },
  purchase_return_no: { type: Number, required: false, trim: true, default: 0 },
  sales_return_no: { type: Number, required: false, trim: true, default: 0 },


});

const statusSchema = new mongoose.Schema({
  status_id: { type: Number, required: true },
  status_name: { type: String, required: true, trim: true },
  details: { type: String, required: false, trim: true },
  status_color: {type: String,required: false,trim: true,default: "#3699FF"},
  status_for: { type: String, required: true, trim: true },

  active_status: { type: String, required: true, trim: true, default: "Y" },
  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {type: String,required: true,trim: true,default: Date.now},
  edited_by_id: { type: Number, required: true, trim: true, default: 0 },
  edit_by_date: { type: Number, required: true, trim: true, default: Date.now },
  deleted_by_id: { type: Number, required: true, trim: true, default: 0 },
  deleted_by_date: {type: Number,required: true,trim: true,default: Date.now},
  edit_log: { type: Array, required: false },
});
statusSchema.plugin(autoIncrement.plugin, {
  model: "t_900_status",
  field: "status_id",
  startAt: 1,
  incrementBy: 1,
});

const task_todoSchema = new mongoose.Schema({
  delivery_order_no: { type: String, required: false, trim: true },
  sales_order_no: { type: String, required: false, trim: true },
  quotation_no: { type: String, required: false, trim: true },
  enquiry_no: { type: String, required: false, trim: true },
  // dispatch_order_no : { type: String, required: false,trim:true },
  for_users:{ type: Array, required: true ,trim: true },
  task_todo_id: { type: Number, required: true },
  sales_id: { type: Number, required: false, trim: true },
  module: { type: String, required: false, trim: true },
  subject: { type: String, required: true, trim: true },
  details: { type: String, required: false, trim: true },
  date: { type: Number, required: true, trim: true, default: Date.now },
  time: { type: String, required: false, trim: true ,default: 0 },
  module_no: { type: String, required: false, trim: true },
  parent_todo_id: { type: Number, required: false, trim: true,default: 0},

  active_status: { type: String, required: true, trim: true, default: "Y" },
  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {type: Number,required: true,trim: true,default: Date.now,},
  edited_by_id: { type: Number, required: true, trim: true, default: 0 },
  edit_by_date: { type: Number, required: true, trim: true, default: Date.now },
  deleted_by_id: { type: Number, required: true, trim: true, default: 0 },
  deleted_by_date: {type: Number,required: true,trim: true,default: Date.now,  },
  edit_log: { type: Array, required: false },
  // todo_list: { type: Array, required: false },
});
task_todoSchema.plugin(autoIncrement.plugin, {
  model: "t_900_task_todo",
  field: "task_todo_id",
  startAt: 1,
  incrementBy: 1,
});

const stock_transferSchema = new mongoose.Schema({
  stock_transfer_id: { type: Number, required: true },
  stock_transfer_no: { type: String, required: false, trim: true },
  stock_transfer_date: {
    type: Number,
    required: false,
    trim: true,
    default: Date.now,
  },
  from_showroom_warehouse_id: { type: Number, required: true, trim: true },
  to_showroom_warehouse_id: { type: Number, required: true, trim: true },
  stock_transfer_details: { type: Array, required: true, trim: true },
  note: { type: String, required: false, trim: true },
  // quotation_other_charges: { type: Array, required: false, trim: true },

  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {
    type: String,
    required: true,
    trim: true,
    default: Date.now,
  },
  edited_by_id: { type: Number, required: true, trim: true, default: 0 },
  edit_by_date: { type: Number, required: true, trim: true, default: Date.now },
  deleted_by_id: { type: Number, required: true, trim: true, default: 0 },
  deleted_by_date: {
    type: Number,
    required: true,
    trim: true,
    default: Date.now,
  },
  edit_log: { type: Array, required: false },
});
stock_transferSchema.plugin(autoIncrement.plugin, {
  model: "t_900_stock_transfer",
  field: "stock_transfer_id",
  startAt: 1,
  incrementBy: 1,
});

const stock_movementSchema = new mongoose.Schema({
  stock_movement_id: { type: Number, required: true },
  transaction_type: { type: String, required: false, trim: true },
  transaction_id: { type: Number, required: false, trim: true },
  transaction_no:{type:String,required: false, trim:true},
  transaction_date: {
    type: Number,
    required: false,
    trim: true,
    default: Date.now,
  },
  showroom_warehouse_id: { type: Number, required: true, trim: true },
  item_id: { type: Number, required: true, trim: true },
  plus_qty: { type: Number, required: false, trim: true },
  minus_qty: { type: Number, required: false, trim: true, default: 0 },
  unit_id: { type: Number, required: true, trim: true },

  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {
    type: String,
    required: true,
    trim: true,
    default: Date.now,
  },
  edited_by_id: { type: Number, required: true, trim: true, default: 0 },
  edit_by_date: { type: Number, required: true, trim: true, default: Date.now },
  deleted_by_id: { type: Number, required: true, trim: true, default: 0 },
  deleted_by_date: {
    type: Number,
    required: true,
    trim: true,
    default: Date.now,
  },
  edit_log: { type: Array, required: false },
});
stock_movementSchema.plugin(autoIncrement.plugin, {
  model: "t_900_stock_movement",
  field: "stock_movement_id",
  startAt: 1,
  incrementBy: 1,
});

const wishlistSchema = new mongoose.Schema({
  wishlist_id: { type: Number, required: true },
  client_id: { type: Number, required: false, trim: true },
  date: { type: Number, required: false, trim: true, default: Date.now },
  item_id: { type: Number, required: true, trim: true },
  qty: { type: Number, required: false, trim: true },
  unit_id: { type: Number, required: true, trim: true },

  inserted_by_id: { type: Number, required: true, trim: true, default: 0 },
  inserted_by_date: {
    type: String,
    required: true,
    trim: true,
    default: Date.now,
  },
  edited_by_id: { type: Number, required: true, trim: true, default: 0 },
  edit_by_date: { type: Number, required: true, trim: true, default: Date.now },
  deleted_by_id: { type: Number, required: true, trim: true, default: 0 },
  deleted_by_date: {
    type: Number,
    required: true,
    trim: true,
    default: Date.now,
  },
  edit_log: { type: Array, required: false },
});
wishlistSchema.plugin(autoIncrement.plugin, {
  model: "t_900_wishlist",
  field: "wishlist_id",
  startAt: 1,
  incrementBy: 1,
});

const sales_Return_Schema = new mongoose.Schema( 
  {        
      sales_return_id:{type:Number, required:false},
      invoice_no:{type:String, required:false},
      sales_id: {type:Number, required:true},
      customer_id: {type:Number, required:true},
      showroom_warehouse_id: {type:Number, required:true},
      module:{type:String, required:false},
      sales_return_no:{type:String, required:true},
      sales_return_date:{ type: Number, required: false, trim: true, default:Date.now },
      sales_return_bill_value:{type:Number, required:false},
      
      dispatch_return_bill_value:{type:Number, required:false},
      note: { type : String, required: false },
      sales_return_item_details: { type : Array, required: false },
      dispatch_return_item_details: { type : Array, required: false },

      sales_return_other_charges: { type: Array, required: false, trim: true },
      dispatch_order_return_other_charges: { type: Array, required: false, trim: true },

      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  } );
  sales_Return_Schema.plugin(autoIncrement.plugin,{model:'t_900_sales_return', field:'sales_return_id', startAt:1, incrementBy:1});



const sales = mongoose.model("t_900_sales", salesSchema);
const status = mongoose.model("t_900_status", statusSchema);
const task_todo = mongoose.model("t_900_task_todo", task_todoSchema);
const stock_transfer = mongoose.model(
  "t_900_stock_transfer",
  stock_transferSchema
);
const stock_movement = mongoose.model(
  "t_900_stock_movement",
  stock_movementSchema
);
const wishlist = mongoose.model("t_900_wishlist", wishlistSchema);
const serial_no = mongoose.model("t_000_serial_no", serial_noSchema);
const sales_return = mongoose.model("t_900_sales_return", sales_Return_Schema);

module.exports = {
  statusSchema,
  sales,
  status,
  task_todo,
  serial_no,
  stock_transfer,
  stock_movement,
  wishlist,
  sales_return
};
