const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

    const purchase_Schema = new mongoose.Schema( 
    {        
        purchase_id:{type:Number, required:true},

        approve_id:{type:Number,required: false, trim: true},

        vendor_id:{type:Number, required:true, default:0},
      
        po_number:  { type: String, required: false, trim: true },
        po_date:  { type: Number, required: false, trim: true, default:Date.now },
        reference_no: { type:String, required: false, trim: true},
        reference_date:{ type: Number, required: false, trim: true, default:Date.now },
        // po_value:  { type: Number, required: false, trim: true, default:0 },
        po_status:  { type: String, required: false, trim: true, default:0 },
        po_note:  { type: String, required: false, trim: true, },

        direct_purchase_task: { type: Array, required: false, trim: true  },
        direct_purchase_status: { type: String, required: false, trim: true,  default:"New"  },
        direct_purchase_note: { type: String, required: false, trim: true,default:"New"},

        purchase_order_task: { type: Array, required: false, trim: true  },
        purchase_order_status: { type: String, required: false, trim: true,  default:"New"  },
        purchase_order_note: { type: String, required: false, trim: true},
        module:{ type: String, required:true,trim: true},

        // received_qty: { type: Number, required:false, trim: true,default:0},
        // balance_qty: { type: Number, required:false, trim: true,default:0},
      
        item_details : { type : Array, required: true },
        received_item_details : { type : Array, required: true },
        grn_no: { type:String, required:false, trim:true },
        showroom_warehouse_id:{ type: Number, required: true,trim:true},
        grn_details : { type : Array, required: true }, 

        // grn_no: { type:String, required:false, trim:true },
        /*  bill_no: { type:Number, required:true, default:0},
            bill_date:  { type: Number, required: true, trim: true, default:Date.now },
            bill_value:  { type: Number, required: true, trim: true, default:0 },

            challan_no: { type:Number, required:true, default:0},
            challan_date:  { type: Number, required: true, trim: true, default:Date.now },

            vehicle_no: { type:Number, required:true, default:0},
            waybill_no: { type:Number, required:true, default:0},

            grn_no: { type:Number, required:true, default:0},
            grn_date:  { type: Number, required: true, trim: true, default:Date.now },
            note: { type : Array, required: false },

            note: { type : String, required: false }, */
       
        approved_by_date : { type: Number, required: false,  trim: true},

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    } );
    purchase_Schema.plugin(autoIncrement.plugin,{model:'t_800_purchase', field:'purchase_id', startAt:1, incrementBy:1});
 

    const purchase_Return_Schema = new mongoose.Schema( 
        {        
            purchase_return_id:{type:Number, required:false},
            purchase_id:{type:Number, required:false},
            vendor_id:{type:Number, required:false},
            vendor:{type:String, required:false},
            grn_no:{type:String, required:false},
            showroom_warehouse_id: {type:Number,required:false},

            purchase_return_no:{type:String, required:true},
            purchase_return_date:{ type: Number, required: false, trim: true, default:Date.now },
            purchase_returned_bill_value:{type:Number, required:false},
            
            
            challan_no:{type:Number, required:false},
            challan_date:{ type: Number, required: false, trim: true, default:Date.now },
            vehicle_no: { type:String, required:false},
            waybill_no: { type:Number, required:false},
            note: { type : String, required: false },
            return_details: { type : Array, required: false },



            // po_number:  { type: String, required: false, trim: true },
            // po_date:  { type: Number, required: false, trim: true, default:Date.now },
            // reference_no: { type:String, required: false, trim: true},
            // reference_date:{ type: Number, required: false, trim: true, default:Date.now },
            // po_value:  { type: Number, required: false, trim: true, default:0 },
            // po_status:  { type: String, required: false, trim: true, default:0 },
            // po_note:  { type: String, required: false, trim: true, default:0 },
    
            // direct_purchase_task: { type: Array, required: false, trim: true  },
            // direct_purchase_status: { type: String, required: false, trim: true,  default:"New"  },
            // direct_purchase_note: { type: String, required: false, trim: true,default:"New"},
    
            // purchase_order_task: { type: Array, required: false, trim: true  },
            // purchase_order_status: { type: String, required: false, trim: true,  default:"New"  },
            // purchase_order_note: { type: String, required: false, trim: true},
            // module:{ type: String, required:true,trim: true},
    
            // received_qty: { type: Number, required:false, trim: true,default:0},
            // balance_qty: { type: Number, required:false, trim: true,default:0},
          
            // item_details : { type : Array, required: true },
            // received_item_details : { type : Array, required: true },
            // grn_no: { type:String, required:false, trim:true },
            // showroom_warehouse_id:{ type: Number, required: true,trim:true},
            // grn_details : { type : Array, required: true }, 
    
            // grn_no: { type:String, required:false, trim:true },
            /*  bill_no: { type:Number, required:true, default:0},
                bill_date:  { type: Number, required: true, trim: true, default:Date.now },
                bill_value:  { type: Number, required: true, trim: true, default:0 },
    
                challan_no: { type:Number, required:true, default:0},
                challan_date:  { type: Number, required: true, trim: true, default:Date.now },
    
                vehicle_no: { type:Number, required:true, default:0},
                waybill_no: { type:Number, required:true, default:0},
    
                grn_no: { type:Number, required:true, default:0},
                grn_date:  { type: Number, required: true, trim: true, default:Date.now },
                note: { type : Array, required: false },
    
                note: { type : String, required: false }, */               
    
            active_status : { type: String, required: true, trim: true, default:'Y' },
            inserted_by_id : { type: Number, required: true, trim: true, default:0 },
            inserted_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            edited_by_id : { type: Number, required: true,  trim: true, default:0 },
            edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            deleted_by_id : { type: Number, required: true, trim: true, default:0 },
            deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
            edit_log : { type : Array, required: false },
        } );
        purchase_Return_Schema.plugin(autoIncrement.plugin,{model:'t_900_purchase_return', field:'purchase_return_id', startAt:1, incrementBy:1});

    const direct_purchase_Schema = new mongoose.Schema( 
        {        
            direct_purchase_id:{type:Number, required:true},

            vendor_id:{type:Number, required:true, default:0},

            bill_no: { type:Number, required:true, default:0},
            bill_date:  { type: Number, required: true, trim: true, default:Date.now },
            bill_value:  { type: Number, required: true, trim: true, default:0 },

            challan_no: { type:Number, required:true, default:0},
            challan_date:  { type: Number, required: true, trim: true, default:Date.now },

            vehicle_no: { type:Number, required:true, default:0},
            waybill_no: { type:Number, required:true, default:0},

            grn_no: { type:Number, required:true, default:0},
            grn_date:  { type: Number, required: true, trim: true, default:Date.now },
            note: { type : Array, required: false },

            item_details : { type : Array, required: true },
    
            active_status : { type: String, required: true, trim: true, default:'Y' },
            inserted_by_id : { type: Number, required: true, trim: true, default:0 },
            inserted_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            edited_by_id : { type: Number, required: true,  trim: true, default:0 },
            edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            deleted_by_id : { type: Number, required: true, trim: true, default:0 },
            deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
            edit_log : { type : Array, required: false },
        } );
        direct_purchase_Schema.plugin(autoIncrement.plugin,{model:'t_700_direct_purchase', field:'direct_purchase_id', startAt:1, incrementBy:1});
     
    const grn_Schema = new mongoose.Schema( 
        {        
            grn_id:{type:Number, required:true},
            
            purchase_order_id:{type:Number, required:true},
            
            grn_number:  { type: String, required: true, trim: true },
            grn_date:  { type: Number, required: false, trim: true, default:Date.now },
            
            item_details : { type : Array, required: true },
           
            active_status : { type: String, required: true, trim: true, default:'Y' },
            inserted_by_id : { type: Number, required: true, trim: true, default:0 },
            inserted_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            edited_by_id : { type: Number, required: true,  trim: true, default:0 },
            edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            deleted_by_id : { type: Number, required: true, trim: true, default:0 },
            deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
            edit_log : { type : Array, required: false },
        } );
        grn_Schema.plugin(autoIncrement.plugin,{model:'t_400_grn', field:'grn_id', startAt:1, incrementBy:1});
     
    
   
const purchase = mongoose.model("t_800_purchase", purchase_Schema);
const purchase_return = mongoose.model("t_900_purchase_return", purchase_Return_Schema);
const direct_purchase = mongoose.model("t_700_direct_purchase", direct_purchase_Schema);
const grn = mongoose.model("t_400_grn", grn_Schema);
module.exports = { purchase,grn, purchase_return,direct_purchase};
