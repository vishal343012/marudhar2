const router = require("express").Router();
const moment=require("moment");
const axios = require('axios');
const {apiURL} = require('../../config/config');
const {apiList} = require('../../config/api') 
const { reference } = require("../../modals/MasterReference");
const { trackChange } = require("../../config/global");

// const moduleInsert = async (req, res) => { 
//   const data = req.body;
//   const errors = {};
//   let newModule = new modules(data);
//   const insertedModule = await newModule.save();
//   return res.status(200).json({ _id: insertedModule._id });
// };

const ReferenceMasterInsert = async (req, res) => { 
  const data = req.body;
  const URL=req.url;
  const errors = {};
  let newMaster="";

  switch(URL)
  {

    case "/reference/insert":
        newMaster = new reference(data);
        break;    
  }

  const insertedMaster = await newMaster.save();
  return res.status(200).json({ _id: insertedMaster._id });
};


const view_reference = async(req,res)=> { 
  let condition={deleted_by_id:0};
     const reference_name=req.body.reference;
  const reference_id=req.body.reference_id;
  const short_data=(req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
  const searchQuery=req.body.query;

  //console.log(req.body)
 
  // Details by ID
  if(reference_id) { condition={...condition,reference_id:reference_id} }



  // Details by Name
  if(reference_name) { condition={...condition, reference_name:{'$regex':'^'+reference_name+'$', $options:'i'}} } // Matching exact text but incase-sensitive
  
  // Search
  if(searchQuery) { 
    condition={
      ...condition,
        $or:[
            {reference_name:{'$regex':searchQuery, $options:'i'}},
           ]} // Matching string also compare incase-sensitive 
    
  }
  //console.log(condition)
  let referenceData = await reference.aggregate([
    {
    $match: condition
},
{$addFields:{action_items:{

  can_edit: true,
  can_delete: false,
  can_activate: "$active_status" === "Y" ? true : false,
  can_deactivate: "$active_status" === "Y" ? false : true,
 
}}},

{
 $project: { 
 
    reference_id:1,
    "action_items":1,
    "active_status":1,
    "inserted_by_id":1,
    "edited_by_id":1,
    "deleted_by_id":1,
    "edit_log":1,
    "name":1,
    "mobile":1,
    "email":1,
    "whatsapp":1,
    "inserted_by_date":1,
    "edit_by_date":1,
    "deleted_by_date":1,
    "__v":1,



  

 },
},

{
 $sort : {
   name:1
 }
}
]);
 
    if (referenceData) {
     
     return res.status(200).json( referenceData);
    }
    else{
      return res.status(200).json( [] );
    }
 
};





  const updateReference = async (req,res)=> {
    const condition={reference_id:req.body.reference_id};
    const data=req.body;
    data.edited_by_id=10;
    data.edit_by_date=moment().format('X');
    
    const myData= await axios({
      method: 'post',
      url: apiURL+ apiList.reference_list,
      data: condition
    });


    const changed=trackChange( myData.data[0],req.body)
  data.edit_log = ([JSON.stringify(changed), ... myData.data[0].edit_log]);



    // const referenceDetails=myData.data
    // data.edit_log=referenceDetails;

    await reference.findOneAndUpdate(condition, data, (err,obj)=>{
      if(err){ 
        return res.status(500).json( {"Error":err} );
      }
      return res.status(200).json( obj );
    });
  };


  const deleteReference=async(req,res)=>{
    const reference_id=req.body.reference_id;
    const condition={reference_id:reference_id}
    await reference.deleteOne(condition, (err,obj)=>{
      return res.status(200).json( obj );
    });
  };
  

//module.exports = {masterInsert, viewCatgeory, deleteCategory, updateCategory};
module.exports = {ReferenceMasterInsert,view_reference,updateReference,deleteReference};
