const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

  const moduleSchema = new mongoose.Schema(
  {
      module_id:{type:Number, required:true},

      module :  { type: String, required: true, trim: true },
      details : { type: String, required: false, trim: true },
      terms:  { type: String, required: false, trim: true },
      condition : { type: String, required: false, trim: true },

      active_status : { type: String, required: true, trim: true, default:'Y' },
      
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
    }
  );
  moduleSchema.plugin(autoIncrement.plugin,{model:'t_000_module', field:'module_id', startAt:1, incrementBy:1});

  const termsSchema = new mongoose.Schema(
    {
        terms_id:{type:Number, required:true},

        module_id:{type:Number, required:true},
        terms:  { type: String, required: true, trim: true },
        condition : { type: String, required: false, trim: true },

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    }
  );
 termsSchema.plugin(autoIncrement.plugin,{model:'t_000_terms', field:'terms_id', startAt:1, incrementBy:1});

 const vehicleSchema = new mongoose.Schema(
  {
      vehicle_id:{type:Number, required:true},

      vehicle_type:{type:String, required:true},
      vehicle_no:  { type: String, required: true, trim: true },
      contact_no:  { type: String, required: true, trim: true },
      contact_person:  { type: String, required: true, trim: true },
      details:  { type: String, required: false, trim: true },


      // condition : { type: String, required: false, trim: true },

      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
vehicleSchema.plugin(autoIncrement.plugin,{model:'t_000_vehicle', field:'vehicle_id', startAt:1, incrementBy:1});


const areaSchema = new mongoose.Schema(
  {
      area_id:{type:Number, required:true},
      area:{type:String, required:true},

      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
areaSchema.plugin(autoIncrement.plugin,{model:'t_000_area', field:'area_id', startAt:1, incrementBy:1});





 
 const categorySchemaDef=
 {
  category_id:{type:Number, required:true},
  parent_category_id:{type:Number, required:true,default:0},
  category:  { type: String, required: true, trim: true },
  details : { type: String, required: false, trim: true },
  picture_path : { type: String, required: false, trim: true, default:'' },
  hsn : { type:String, required: false, trim: true},
  gst: { type:Number, required: false, trim: true},

  active_status : { type: String, required: true, trim: true, default:'Y' },
  inserted_by_id : { type: Number, required: true, trim: true, default:0 },
  inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
  edited_by_id : { type: Number, required: true,  trim: true, default:0 },
  edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
  deleted_by_id : { type: Number, required: true, trim: true, default:0 },
  deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
  edit_log : { type : Array, required: false },
 }

 const categorySchema = new mongoose.Schema(categorySchemaDef);
 categorySchema.plugin(autoIncrement.plugin,{model:'t_100_categories', field:'category_id', startAt:10, incrementBy:1});
 
  
  const brandSchema = new mongoose.Schema(
    {
        brand_id:{type:Number, required:true},

        parent_brand_id:{type:Number, required:true,default:0},
        brand:  { type: String, required: true, trim: true },
        details : { type: String, required: false, trim: true },
        picture_path : { type: String, required: false, trim: true },

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    }
  );
  brandSchema.plugin(autoIncrement.plugin,{model:'t_100_brand', field:'brand_id', startAt:1, incrementBy:1});
 
  const statutory_type_Schema = new mongoose.Schema(
    {
        statutory_type_id:{type:Number, required:true},      

        statutory_type:  { type: String, required: true, trim: true },
        details : { type: String, required: false, trim: true },    

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    }
  );
  statutory_type_Schema.plugin(autoIncrement.plugin,{model:'t_100_statutory_type', field:'statutory_type_id', startAt:1, incrementBy:1});
  
  const bank_Schema = new mongoose.Schema(
    {
        bank_id:{type:Number, required:true},      

        bank_name:  { type: String, required: true, trim: true },
        details : { type: String, required: false, trim: true },    

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    }
  );
  bank_Schema.plugin(autoIncrement.plugin,{model:'t_100_bank_name', field:'bank_id', startAt:1, incrementBy:1});

  const uomSchema = new mongoose.Schema(
    {
        uom_id:{type:Number, required:true},    

        higher_unit:  { type: String, required: true, trim: true },
        higher_unit_value:  { type: Number, required: true, trim: true },
        lower_unit:  { type: String, required: true, trim: true },
        lower_unit_value:  { type: Number, required: true, trim: true },      
        caption : { type: String, required: false, trim: true }, 
        lower_caption : { type: String, required: false, trim: true },    

        
        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    }
  );
  uomSchema.plugin(autoIncrement.plugin,{model:'t_100_uom', field:'uom_id', startAt:1, incrementBy:1});
  
  const itemSchema = new mongoose.Schema(
    {
        item_id:{type:Number, required:true},      
        
        brand_id:{type:Number, required:true,default:0},      
        category_id:{type:Number, required:true,default:0},      
        
        item_own_code:  { type: String, required: true, trim: true,index:true},
        item_company_code:  { type: String, required: true, trim: true },      
        
        item:  { type: String, required: true, trim: true,index:true },      
        size: { type: String, required: false, trim: true},
        details : { type: String, required: false, trim: true },    
        
        uom_id:{type:Number, required:true,default:0},  
        alt_uom_id:{type:Number, required:true,default:0},
        alt_uom_id: { type: Number, required: true, default: 0 },
        alt_uom: { type: String, required: false },

    lower_unit_value: { type: Number, required: true, default: 0 },
    higher_unit_value: { type: Number, required: true, default: 0 } , 
        qty:{type:Number, required:true,default:0},  

        hsn_code : { type: String, required: false, trim: true },   

        igst_percentage:  { type: Number, required: false, trim: true },    
        cgst_percentage:  { type: Number, required: false, trim: true },    
        sgst_percentage:  { type: Number, required: false, trim: true },    
        reorder_level: { type: Number, required: false, trim: true},
        reorder_level_uom_id:{ type: Number, required: false, trim: true},
        reorder_quantity:{ type: Number, required: false, trim: true},
        picture_path : { type: String, required: false, trim: true },
        original_file_name: { type: String, required:false,trim: true},
        reorder_quantity_uom_id:{ type: Number, required: false, trim: true},
        reorder_level_uom_name:{ type: String, required:false,trim: true},
        reorder_quantity_uom_name:{ type: String, required:false,trim: true},
        opening_stock:{ type: Number, required: false, trim: true},
        opening_stock_uom_id:{ type: Number, required: false, trim: true},
        selling_price:{ type: Number, required: false, trim: true},
        mrp:{ type: Number, required:false, trim: true},
        opening_rate:{ type: Number, required:false, trim: true},
        opening_stock_date : { type: Number, required: false, trim: true },
        mrp_date : { type: Number, required: false, trim: true },
        selling_date : { type: Number, required: false, trim: true },
        ledger_account_id:{type:Number, required:false,default:0},
        
        current_over_stock: { type: Number, required: false, trim: true, default:0},
        stock_by_location: { type:Array,required: false, trim: true, default:[]},     
        
        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    }
  );
  itemSchema.plugin(autoIncrement.plugin,{model:'t_100_item', field:'item_id', startAt:1, incrementBy:1});
  itemSchema.index({item:1,item_own_code:1});

  const showrooms_warehouse_Schema = new mongoose.Schema( 
  {        
        showrooms_warehouse_id:{type:Number, required:true},
      
        showrooms_warehouse_type:  { type: String, required: true, trim: true },
        
        showrooms_warehouse : { type: String, required: false, trim: true },
        gst : { type: String, required: false, trim: true },
        address : { type: String, required: false, trim: true },

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
    } );
    showrooms_warehouse_Schema.plugin(autoIncrement.plugin,{model:'t_000_showrooms_warehouse', field:'showrooms_warehouse_id', startAt:1, incrementBy:1});

// source
const sourceSchema = new mongoose.Schema(
  {
      source_id:{type:Number, required:true},      

      source:  { type: String, required: true, trim: true },
      details : { type: String, required: false, trim: true },    

      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
sourceSchema.plugin(autoIncrement.plugin,{model:'t_100_source', field:'source_id', startAt:1, incrementBy:1});

// source
const roleSchema = new mongoose.Schema(
  {
      role_id:{type:Number, required:true},      

      role:  { type: String, required: false, trim: true },
      details : { type: String, required: false, trim: true },    

      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
roleSchema.plugin(autoIncrement.plugin,{model:'t_100_role', field:'role_id', startAt:1, incrementBy:1});

//SALES
const opening_stock_Schema = new mongoose.Schema(
  {
      opening_stock_id:{type:Number, required:true}, 

      showroom_warehouse_id:{type:Number, required:true}, 
      item_id:{type:Number, required:true},       
      rate: { type: Number, required: true, trim: true},
      stock:{type:Number, required:true}, 
      as_on_date : { type: Number, required:true, trim: true},
      
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
opening_stock_Schema.plugin(autoIncrement.plugin,{model:'t_100_opening_stock', field:'opening_stock_id', startAt:1, incrementBy:1});


const enquirySchema = new mongoose.Schema(
  {
      enquiry_id:{type:Number, required:true,trim :true},      
      enquiry_no:  { type: String, required: true, trim: true },
      enquiry_date: { type: String, required: true,  trim: true, default:Date.now},
      source_id: { type: Number, required: true,  trim: true},
      customer_id: { type: String, required: true,  trim: true,},
      sales_executive_id: { type: String, required: true, trim: true},
      showroom_warehouse_id: { type: String, required: true, trim: true},
      delivery_from_date: { type: String, required: true,  trim: true, default:Date.now},
      delivery_to_date: { type: String, required: true,  trim: true, default:Date.now},
      note : { type: String, required: false, trim: true },   
      item_details : { type : Array, required: false }, 
      active_status : { type: String, required: false, trim: true, default:'Y' },

      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
enquirySchema.plugin(autoIncrement.plugin,{model:'t_600_enquiry', field:'enquiry_id', startAt:1, incrementBy:1});

const quotationSchema = new mongoose.Schema(
  {
      quotation_id:{type:Number, required:true},   
      enquiry_id:{type:Number, required:true},      
      quotation_no:  { type: String, required: true, trim: true },
      quotation_date: { type: String, required: true,  trim: true, default:Date.now},
           
      note : { type: String, required: false, trim: true },   
      item_details : { type : Array, required: false }, 
      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
quotationSchema.plugin(autoIncrement.plugin,{model:'t_600_quotation', field:'quotation_id', startAt:1, incrementBy:1});

const sales_order_Schema = new mongoose.Schema(
  {
      sales_order_id:{type:Number, required:true},
      quotation_id:{type:Number, required:true},   

      sales_order_no:  { type: String, required: true, trim: true },
      sales_order_date: { type: String, required: true,  trim: true, default:Date.now},
           
      note : { type: String, required: false, trim: true },   
      item_details : { type : Array, required: false }, 

      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
sales_order_Schema.plugin(autoIncrement.plugin,{model:'t_600_sales_order', field:'sales_order_id', startAt:1, incrementBy:1});




const type_Schema = new mongoose.Schema(
  {
      type_id:{type:Number, required:true},        
      type_name : { type: String, required: false, trim: true },   
      details : { type : String, required: false }, 
      active_status : { type: String, required: true, trim: true, default:'Y' },

      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
type_Schema.plugin(autoIncrement.plugin,{model:'t_100_type', field:'type_id', startAt:1, incrementBy:1});




const specification_Schema = new mongoose.Schema(
  {
      type_id:{type:Number, required:true},  
      specification_id:{type:Number, required:true},       
      group : { type: Array, required: false, trim: true },   
      specification : { type : String, required: false }, 
      details : { type : String, required: false }, 
      active_status : { type: String, required: true, trim: true, default:'Y' },

      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
specification_Schema.plugin(autoIncrement.plugin,{model:'t_100_specification', field:'specification_id', startAt:1, incrementBy:1});




const product_Schema = new mongoose.Schema(
  {
      product_id:{type:Number, required:true},  
      type_id:{type:Number, required:true},  
      product_code:{type:Number, required:true},  
      product:{type:Number, required:true},  
      details : { type : String, required: false , trim: true}, 
      uom_id:{type:Number, required:true,default:0},  
      hsn_code : { type: String, required: false, trim: true },  
      igst_percentage:  { type: Number, required: true, trim: true },    
      cgst_percentage:  { type: Number, required: true, trim: true },    
      sgst_percentage:  { type: Number, required: true, trim: true },    
      reorder_level: { type: String, required: false, trim: true},
      reorder_level_uom_id:{ type: Number, required: false, trim: true},
      reorder_quantity:{ type: Number, required: true, trim: true},
      picture_path : { type: String, required: false, trim: true },
      original_file_name: { type: String, required:false,trim: true},      
      opening_stock:{ type: Number, required: false, trim: true},
      opening_stock_uom_id:{ type: Number, required: false, trim: true},
      opening_stock_date: { type: Number, required: true,  trim: true, default:Date.now},
      ledger_account_id:{type:Number, required:true,default:0},        
      current_over_stock: { type: Number, required: false, trim: true, default:0},
      stock_by_location: { type:Array,required: false, trim: true, default:[]},     
      active_status : { type: String, required: true, trim: true, default:'Y' },

      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
  }
);
product_Schema.plugin(autoIncrement.plugin,{model:'t_100_product', field:'product_id', startAt:1, incrementBy:1});
// renameOriginalFile
//Menu


const menuSchema = new mongoose.Schema(

  
  {
      menu_id:{type:Number, required:true,default:0},
      // menu_for:{type:String,require:true},
      parent_id:{type:Number, required:true,default:0},  

      subMenu_name :  { type: String, required: false, trim: true },
      link : { type: String, required: false, trim: true },
      active_status : { type: String, required: true, trim: true, default:'Y' },
      inserted_by_id : { type: Number, required: true, trim: true, default:0 },
      inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
      edited_by_id : { type: Number, required: true,  trim: true, default:0 },
      edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
      deleted_by_id : { type: Number, required: true, trim: true, default:0 },
      deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
      edit_log : { type : Array, required: false },
    }
  );
  menuSchema.plugin(autoIncrement.plugin,{model:'t_000_menu', field:'menu_id', startAt:1, incrementBy:1});



  const wasteSchema = new mongoose.Schema(

  
    {
        waste_id:{type:Number, required:false},     
        waste_item_id:{ type: Number, required: false, trim: true},
        waste_item_name:{type:String,required:false,trim: true},
        waste_date:{type:Number,required:false},
        convertedQty:{ type: Number, required: false, trim: true},
        convertedTo:{ type: String, required: false, trim: true},
        convertedToId:{ type: Number, required: false, trim: true},
        quantity:{ type: Number, required: false, trim: true},
        uom_id:{ type: Number, required: false, trim: true},
        uom_name:{ type: String, required: false, trim: true},
        wasteType:{ type: String, required: false, trim: true},
        showroom_warehouse_id : { type: Number, required: false, trim: true },

        active_status : { type: String, required: true, trim: true, default:'Y' },
        inserted_by_id : { type: Number, required: true, trim: true, default:0 },
        inserted_by_date : { type: String, required: true,  trim: true, default:Date.now},
        edited_by_id : { type: Number, required: true,  trim: true, default:0 },
        edit_by_date : { type: Number, required: true,  trim: true, default:Date.now},
        deleted_by_id : { type: Number, required: true, trim: true, default:0 },
        deleted_by_date : { type: Number, required: true, trim: true, default:Date.now},
        edit_log : { type : Array, required: false },
      }
    );
    wasteSchema.plugin(autoIncrement.plugin,{model:'t_000_waste', field:'waste_id', startAt:1, incrementBy:1});
  




  const modules = mongoose.model("t_000_module", moduleSchema);
  const terms = mongoose.model("t_000_terms", termsSchema);
  const vehicle = mongoose.model("t_000_vehicle", vehicleSchema);
  const area = mongoose.model("t_000_area", areaSchema);
  const category = mongoose.model("t_100_categories", categorySchema);
  const brand = mongoose.model("t_100_brand", brandSchema);
  const statutory_type = mongoose.model("t_100_statutory_type", statutory_type_Schema);
  const uom = mongoose.model("t_100_uom", uomSchema);
  const item = mongoose.model("t_100_item", itemSchema);
  const showrooms_warehouse = mongoose.model("t_000_showrooms_warehouse", showrooms_warehouse_Schema);
  const source = mongoose.model("t_100_source", sourceSchema);
  const role = mongoose.model("t_100_role", roleSchema);
  const bank = mongoose.model("t_100_bank_name", bank_Schema);
  const opening_stock = mongoose.model("t_100_ opening_stock",  opening_stock_Schema);
  const enquiry = mongoose.model("t_600_ enquiry",  enquirySchema);
  const quotation = mongoose.model("t_600_quotation",  quotationSchema);
  const sales_order = mongoose.model("t_600_sales_order",  sales_order_Schema);
  const type = mongoose.model("t_100_type",  type_Schema);
  const specification = mongoose.model("t_100_specification",  specification_Schema);
  const product = mongoose.model("t_100_product",  product_Schema);
  const menu = mongoose.model("t_000_menu", menuSchema);
  const waste = mongoose.model("t_000_waste",wasteSchema);




  


module.exports = {vehicleSchema,
  showrooms_warehouse_Schema,
  itemSchema,
  brandSchema,
  categorySchema,
  uomSchema,
  bank_Schema,
  areaSchema,
  roleSchema,
  product,
  menu,
  specification,
  type, modules,
  terms, vehicle, area,
  category,
  brand,
  statutory_type,
  uom, item,
  showrooms_warehouse, 
  source, 
  role, 
  bank, 
  enquiry, 
  opening_stock, 
  sales_order, 
  quotation, 
  categorySchemaDef, 
  waste};
