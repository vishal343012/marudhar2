const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

const receipt_payment_Schema = new mongoose.Schema( 
    {        
        receipt_payment_id:{type:Number, required:true,trim:true},
        receipt_payment_type:{type:String, required:false},
        voucher_no:{type:String, required:false, trim: true},
        voucher_date: { type: Number, required: true,  trim: true, default:Date.now},
        ledger_account_id:{type:Number, required:false, trim: true},
        mode: { type: String, required:false,trim:true},
        bank_id: { type: Number, required:false,trim:true,default:0},
        reference_number: { type: String, required:false, trim: true},
        amount: { type: Number, required:false, trim: true },
        adjustment_amount: { type: Number, required:false, trim: true},
        narration: { type: String, required:false,trim:true},

        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    } );
    receipt_payment_Schema.plugin(autoIncrement.plugin,{model:'t_200_receipt_payment', field:'receipt_payment_id', startAt:1, incrementBy:1});


    const journal_Schema = new mongoose.Schema( 
        {  
            journal_id:{type:Number, required:true,trim:true},            
            voucher_no:{type:String, required:false, trim: true},
            voucher_date: { type: Number, required: true,  trim: true, default:Date.now},
            ledger_account_id:{type:Number, required:false, trim: true},
            ledger_account:{type:String, required:false, trim: true},
            // dr_cr: { type :String, required: true, trim: true},
            // amount: { type: Number, required:false, trim: true },
            journal_details: { type:Array, required: true},
            voucher_amount:{type:Number, required:false, trim: true},
            transaction_id:{type:String, required:false, trim: true},
            transaction_type:{type:String, required:false, trim: true},
            narration: { type: String, required:false,trim:true},
    
            inserted_by_id : { type: Number, required: true, trim: true, default:0 },
            inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
            edited_by_id : { type: Number, required: true,  trim: true, default:0 },
            edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            deleted_by_id : { type: Number, required: true, trim: true, default:0 },
            deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
            edit_log : { type : Array, required: false },
        } );
        journal_Schema.plugin(autoIncrement.plugin,{model:'t_200_journals', field:'journal_id', startAt:1, incrementBy:1});

    const receipt_payment = mongoose.model("t_200_receipt_payment", receipt_payment_Schema);
    const journal = mongoose.model("t_200_journals", journal_Schema);



module.exports = { receipt_payment,journal};