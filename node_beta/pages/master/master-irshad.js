const router = require("express").Router();
const moment=require("moment");
const axios = require('axios');
const {apiURL} = require('../../config/config');
const {apiList} = require('../../config/api') 
const { modules,terms,category,brand,statutory_type,uom,item, categorySchemaDef } = require("../../modals/Master");

// const moduleInsert = async (req, res) => { 
//   const data = req.body;
//   const errors = {};
//   let newModule = new modules(data);
//   const insertedModule = await newModule.save();
//   return res.status(200).json({ _id: insertedModule._id });
// };



const masterInsert = async (req, res) => { 
  const data = req.body;
  const URL=req.url;
  const errors = {};
  let newMaster="";

  switch(URL)
  {
    case "/module/insert":
      newMaster = new modules(data);
      break;

    case "/terms/insert":
        newMaster = new terms(data);
        break;

    case "/category/insert":
        newMaster = new category(data);
        break;

    case "/brand/insert":

        newMaster = new brand(data);
        break;

    case "/statutory_type/insert":
        newMaster = new statutory_type(data);
        break;

    case "/uom/insert":
        newMaster = new uom(data);
        break;

    case "/item/insert":
          newMaster = new uom(data);
          break;
  }

  

  const validatePayload=(data, schemaDef)=>{
    let error=[];
    let obj={}
    const schemaFields=Object.keys(schemaDef)
    for(let iCtr=0; iCtr<schemaFields.length; iCtr++){
      if(schemaDef[schemaFields[iCtr]]['required']===true)
      {
        if(typeof schemaDef[schemaFields[iCtr]]['default']==="undefined"){
          if(typeof data[schemaFields[iCtr]]==="undefined" || data[schemaFields[iCtr]]===""){
            //console.log(schemaFields[iCtr], schemaDef[schemaFields[iCtr]]['default'], data[schemaFields[iCtr]])
            error.push(schemaFields[iCtr])
          }
        }
      }
    }
    
    if(error.length>0){
      obj={"Required": error}
    }
    return obj;
  }


  let returnValid=validatePayload(data, categorySchemaDef)

  return res.status(200).json(returnValid)



  const insertedMaster = await newMaster.save();
  return res.status(200).json({ _id: insertedMaster._id });
};

  const viewCatgeory= async(req,res)=> {
    let condition={deleted_by_id:0};
    const category_id=req.body.category_id;
    const parent_category_id=req.body.parent_category_id;
    const category_name=req.body.category;
    const short_data=(req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
    const serachQuery=req.body.query;
    //console.log(req.body)

    // Fetching all categories for showing Parent Category
    let all_categories=await category.find( {} , (err, categoriesData) => {return categoriesData}).select( ({"category_id": 1, "category":1, "_id": 0} ));
    const categoryById=(all_categories, category_id)=>{
        if(category_id===0) return "--"
        for(let iCtr=0; iCtr<all_categories.length; iCtr++){
          if(all_categories[iCtr]['category_id']===category_id)
            return all_categories[iCtr]['category']
        }
    }
    // Function to prepare action items for each category
    const actionValues=(active_status)=>{
      return {
            can_edit:false, 
            can_delete:true, 
            can_activate:(active_status ==="Y"? false : true), 
            can_deactivate:(active_status ==="Y"? true : false),
          }
    }

    // Details by ID
    if(category_id) { condition={...condition, category_id:category_id} }

     // Details by Parent Category ID
    if(parent_category_id>=0) { condition={...condition, parent_category_id:parent_category_id} }

    // Details by Name
    if(category_name) { condition={...condition, category:{'$regex':'^'+category_name+'$', $options:'i'}} } // Matching exact text but incase-sensitive
    
    // Search
    if(serachQuery) { 
      condition={
        ...condition,
          $or:[
              {category:{'$regex':serachQuery, $options:'i'}},
              {details:{'$regex':serachQuery, $options:'i'}},
            ]} // Matching string also compare incase-sensitive 
    }
    await category.find( condition , (err, categoriesData) => {
      if(err){
        return res.status(500).json( {"Error": err } );
      }
      if (categoriesData) {

        let returnDataArr=categoriesData.map(data=>({
           parent_category_name: categoryById(all_categories, data.parent_category_id),
           action_items: actionValues(data.active_status),
          ...data["_doc"]
        }))
        return res.status(200).json( returnDataArr);
      }
      else{
        return res.status(200).json( [] );
      }
    }).select( (short_data ===true && {"category_id": 1, "category":1, "_id": 0} ));
  };


  const deleteCategory=async(req,res)=>{
    const category_id=req.body.category_id;
    const condition={category_id:category_id}
    await category.deleteOne(condition, (err,obj)=>{
      return res.status(200).json( obj );
    });
  }


  const updateCategory= async(req,res)=> {
    const condition={category_id:req.body.category_id};
    const data=req.body;
    data.edited_by_id=10;
    data.edit_by_date=moment().format('X');
    
    const myData= await axios({
      method: 'post',
      url: apiURL+ apiList.Category_List,
      data: condition
    });

    const categoryDetails=myData.data
    data.edit_log=categoryDetails;

    await category.findOneAndUpdate(condition, data, (err,obj)=>{
      if(err){ 
        return res.status(500).json( {"Error":err} );
      }
      return res.status(200).json( obj );
    });
  }






  const viewBrand= async(req,res)=> {
    let condition={deleted_by_id:0};
    const brand_id=req.body.brand_id;
    const parent_brand_id=req.body.parent_brand_id;
    const brand_name=req.body.brand;
    const short_data=(req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
    const serachQuery=req.body.query;

    // Details by ID
    if(brand_id) { condition={...condition, brand_id:brand_id} }

     // Details by Parent Brand ID
    if(parent_brand_id>=0) { condition={...condition, parent_brand_id:parent_brand_id} }

    // Details by Name
    if(brand_name) { condition={...condition, brand:{'$regex':'^'+brand_name+'$', $options:'i'}} } // Matching exact text but incase-sensitive
    
    // Search
    if(serachQuery) { 
      condition={
        ...condition,
          $or:[
              {brand:{'$regex':serachQuery, $options:'i'}},
              {details:{'$regex':serachQuery, $options:'i'}},
            ]} // Matching string also compare incase-sensitive 
      
    }
    //console.log(condition)
    await brand.find( condition , (err, brandData) => {
      if(err){
        return res.status(500).json( {"Error": err } );
      }
      if (brandData) {
        let returnDataArr=brandData.map((data)=>{
          let can_edit=true;
          let can_delete=true;
          let can_activate=( data.active_status==="N" ? true : false);
          let can_deactivate=( data.active_status==="Y" ? true : false);

          data={...data, 
              can_edit:can_edit, 
              can_delete:can_delete, 
              can_activate:can_activate,
              can_deactivate:can_deactivate 
              }
          return data;
        })

        return res.status(200).json( returnDataArr );
      }
      else{
        return res.status(200).json( [] );
      }
    }).select( (short_data ===true && {"brand_id": 1, "brand":1, "_id": 0} ));
  };

  const deleteBrand=async(req,res)=>{
    const brand_id=req.body.brand_id;
    const condition={brand_id:brand_id}
    await brand.deleteOne(condition, (err,obj)=>{
      return res.status(200).json( obj );
    });
  }

  const updateBrand= async(req,res)=> {
    const condition={brand_id:req.body.brand_id};
    const data=req.body;
    data.edited_by_id=10;
    data.edit_by_date=moment().format('X');
    
    const myData= await axios({
      method: 'post',
      url: apiURL+ apiList.Brand_List,
      data: condition
    });

    const brandDetails=myData.data
    data.edit_log=brandDetails;

    await brand.findOneAndUpdate(condition, data, (err,obj)=>{
      if(err){ 
        return res.status(500).json( {"Error":err} );
      }
      return res.status(200).json( obj );
    });
  }




  

module.exports = {
          masterInsert, 
          viewCatgeory, 
          deleteCategory, 
          updateCategory, 
          viewBrand, 
          deleteBrand,
          updateBrand
        };
