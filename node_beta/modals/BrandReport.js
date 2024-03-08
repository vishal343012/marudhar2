const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

const brandReport_Schema = new mongoose.Schema( 
    {        
       
        brandReport_id: { type: Number, required: false },
        item_id: { type: Number, required: false },
        brand_id: { type: Number, required: false },
        item: { type: String, required: false },
        uom: { type: String, required: false },
        uom_id: { type: Number, required: false },
        qty: { type: Number, required: false },
        netAmount: { type: Number, required: false, default: 0 },
        grossAmount: { type: Number, required: false, default: 0 },
        invoice_no: { type: String, required: false },
        sales_id: { type: Number, required: false, default: 0 },
        rate: { type: Number, required: false, default: 0 },
        disc_percentage: { type: Number, required: false, default: 0 },
        disc_value: { type: Number, required: false, default: 0 },
        gst_value:{ type: Number, required: false, default: 0 },
        gst_type:{ type: Number, required: false, default: 0 },
        gst_percentage: { type: Number, required: false, default: 0 },
        invoice_date:{ type: Number, required: false, default: 0 },

        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    } );
    brandReport_Schema.plugin(autoIncrement.plugin,{model:'t_800_brandReport', field:'brandReport_id', startAt:1, incrementBy:1});
 
    const BrandReport = mongoose.model("t_800_brandReport", brandReport_Schema);

    module.exports = { BrandReport}