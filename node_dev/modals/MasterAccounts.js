const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

    const primary_group_Schema = new mongoose.Schema( 
    {        
        primary_group_id:{type:Number, required:true},
        primary_group:  { type: String, required: true, trim: true },
        nature : { type: String, required: false, trim: true },
        details : { type: String, required: false, trim: true },
        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    } );
    primary_group_Schema.plugin(autoIncrement.plugin,{model:'t_200_primary_group', field:'primary_group_id', startAt:1, incrementBy:1});
    
    const master_group_Schema = new mongoose.Schema( 
        {        
            master_group_id:{type:Number, required:true, default:0},
            group: { type: String, required: true, trim: true },
            details: { type: String, required: false, trim: true },
            active_status : { type: String, required: true, trim: true, default:'Y' },
            vendor_status : { type: String, required: true, trim: true, default:'N' },
            customer_status : { type: String, required: true, trim: true, default:'N' },
            reference_status : { type: String, required: true, trim: true, default:'N' },
            inserted_by_id : { type: Number, required: true, trim: true, default:0 },
            inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
            edited_by_id : { type: Number, required: true,  trim: true, default:0 },
            edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
            deleted_by_id : { type: Number, required: true, trim: true, default:0 },
            deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
            edit_log : { type : Array, required: false },
        });
        master_group_Schema.plugin(autoIncrement.plugin,{model:'t_200_master_group', field:'master_group_id', startAt:10, incrementBy:1});
 
    const account_nature_Schema = new mongoose.Schema(
    {
        account_nature_id:{type:Number, required:true},
      
        account_nature:  { type: String, required: true, trim: true },
        details : { type: String, required: false, trim: true },
        
        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
   } );
   account_nature_Schema.plugin(autoIncrement.plugin,{model:'t_200_account_nature', field:'account_nature_id', startAt:1, incrementBy:1});
 
   const ledger_group_Schema = new mongoose.Schema(
    {
        ledger_group_id:{type:Number, required:true},
        primary_group_id:{type:Number, required:true, default:0},
        account_nature_id:{type:Number, required:true, default:0},
        account_nature_name:{type:String, required:true, default:""},
        ledger_group:  { type: String, required: true, trim: true },
        alias : { type: String, required: false, trim: true },
        sub_group_status : { type: String, required: false, trim: true },
        
        sequence : { type: Number, required: true, trim: true, default:0 },
        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
   } );
   ledger_group_Schema.plugin(autoIncrement.plugin,{model:'t_200_ledger_group', field:'ledger_group_id', startAt:1, incrementBy:1});
 
   const ledger_account_Schema = new mongoose.Schema(
    {
        ledger_account_id:{type:Number, required:true},
        ledger_group_id:{type:Number, required:false, default:0},
        
        type_id:{type:Number, required:false, default:0},
        type:{type:String, required:false, default:""},
      
        ledger_account:  { type: String, required: true, trim: true },
        alias : { type: String, required: false, trim: true },
        opening_balance : { type: Number, required: false, trim: true, default:0 },
        dr_cr_status : { type: String, required: false, trim: true, default: "Dr" },
        as_on_date : { type: Number, required: true,  trim: true, default:Date.now},
        credit_limit : { type: Number, required: false, trim: true, default:0 },
        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
   } );
   ledger_account_Schema.plugin(autoIncrement.plugin,{model:'t_200_ledger_account', field:'ledger_account_id', startAt:1, incrementBy:1});
 
   const tax_master_Schema = new mongoose.Schema(
    {
        tax_master_id:{type:Number, required:true},
        ledger_account_id:{type:Number, required:true, default:0},
      
        tax_master:  { type: String, required: true, trim: true },        
        tax_percentage : { type: Number, required: true, trim: true, default:0 },
        details:  { type: String, required: false, trim: true },        
        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
   } );
   tax_master_Schema.plugin(autoIncrement.plugin,{model:'t_200_tax_master', field:'tax_master_id', startAt:1, incrementBy:1});
 
   const charges_Schema = new mongoose.Schema(
    {
        charges_id:{type:Number, required:true},
        ledger_account_id:{type:Number, required:true, default:0},
      
        charges:  { type: String, required: true, trim: true },        
        sac_code : { type: String, required: true, trim: true },        
        details:  { type: String, required: false, trim: true },        

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
   } );
   charges_Schema.plugin(autoIncrement.plugin,{model:'t_200_charges', field:'charges_id', startAt:1, incrementBy:1});
 
   const bank_master_Schema = new mongoose.Schema(
    {
        bank_master_id:{type:Number, required:true},
        ledger_account_id:{type:Number, required:true, default:0},
      
        bank_master:  { type: String, required: true, trim: true },        

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
   } );
   bank_master_Schema.plugin(autoIncrement.plugin,{model:'t_200_bank_master', field:'bank_master_id', startAt:1, incrementBy:1});


const primary_group = mongoose.model("t_200_primary_group", primary_group_Schema);
const master_group = mongoose.model("t_200_master_group", master_group_Schema);


const account_nature = mongoose.model("t_200_account_nature", account_nature_Schema);
const ledger_group = mongoose.model("t_200_ledger_group", ledger_group_Schema);
const ledger_account = mongoose.model("t_200_ledger_account", ledger_account_Schema);
const tax_master = mongoose.model("t_200_tax_master", tax_master_Schema);
const charges = mongoose.model("t_200_charges", charges_Schema);
const bank_master = mongoose.model("t_200_bank_master", bank_master_Schema);

module.exports = { ledger_account_Schema,
    primary_group_Schema, 
    primary_group,
    account_nature,
    ledger_group,
    ledger_group_Schema,
    ledger_account, 
    tax_master,
    charges_Schema,
    charges,
    bank_master,
    master_group};
