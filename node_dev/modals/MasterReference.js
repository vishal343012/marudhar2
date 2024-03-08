const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

const reference_Schema = new mongoose.Schema( 
        {        
            reference_id:{type:Number, required:true},
          
            name:  { type: String, required: true, trim: true },
            mobile:  { type: String, required: true, trim: true },
            email:  { type: String, required: false, trim: true },
            whatsapp:  { type: String, required: false, trim: true },
            note : { type: String, required: false, trim: true },
          
            active_status : { type: String, required: true, trim: true, default:'Y' },
            inserted_by_id : { type: Number, required: true, trim: true, default:0 },
            inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
            edited_by_id : { type: Number, required: true,  trim: true, default:0 },
            edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            deleted_by_id : { type: Number, required: true, trim: true, default:0 },
            deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
            edit_log : { type : Array, required: false },
        } );
        reference_Schema.plugin(autoIncrement.plugin,{model:'t_300_reference', field:'reference_id', startAt:1, incrementBy:1});
    
 
    const customer_Schema = new mongoose.Schema( 
    {        
            customer_id:{type:Number, required:true},

            group_id:{type:Number, required:true},
            
            reference_id:{type:Number, required:false},     
            opening_balance:{type:Number, required:true},
            dr_cr:{ type: String, required: true, trim: true },
            company_name : { type: String, required: true, trim: true },
            gst_no : { type: String, required: false, trim: true },
            website : { type: String, required: false, trim: true },

            address : { type : Array, required: false },
            contact_person : { type : Array, required: false },
           
            active_status : { type: String, required: true, trim: true, default:'Y' },
            inserted_by_id : { type: Number, required: true, trim: true, default:0 },
            inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
            edited_by_id : { type: Number, required: true,  trim: true, default:0 },
            edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            deleted_by_id : { type: Number, required: true, trim: true, default:0 },
            deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
            edit_log : { type : Array, required: false },
    } );
    customer_Schema.plugin(autoIncrement.plugin,{model:'t_400_customer', field:'customer_id', startAt:1, incrementBy:1});
     
    
    const vendor_Schema = new mongoose.Schema( 
    {        
                vendor_id:{type:Number, required:true},
    
                group_id:{type:Number, required:false},
                reference_id:{type:Number, required:false},     
                opening_balance:{type:Number, required:false},
                 dr_cr:{ type: String, required: false, trim: true },

                company_name : { type: String, required: false, trim: true },
                gst_no : { type: String, required: false, trim: true },
                website : { type: String, required: false, trim: true },
    
                address : { type : Array, required: false },
                contact_person : { type : Array, required: false },
                bank_details : { type : Array, required: false },
               
                active_status : { type: String, required: true, trim: true, default:'Y' },
                inserted_by_id : { type: Number, required: true, trim: true, default:0 },
                inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
                edited_by_id : { type: Number, required: true,  trim: true, default:0 },
                edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
                deleted_by_id : { type: Number, required: true, trim: true, default:0 },
                deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
                edit_log : { type : Array, required: false },
        } );
        vendor_Schema.plugin(autoIncrement.plugin,{model:'t_500_vendor', field:'vendor_id', startAt:1, incrementBy:1});
         
    
   
const reference = mongoose.model("t_300_reference", reference_Schema);
const customer = mongoose.model("t_400_customer", customer_Schema);
const vendor = mongoose.model("t_500_vendor", vendor_Schema);


module.exports = { reference,customer,vendor,customer_Schema,vendor_Schema,reference_Schema };
