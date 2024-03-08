const router = require("express").Router();
const axios = require('axios');
const { apiURL } = require('../../config/config');
const { apiList } = require('../../config/api')
const { trackChange } = require("../../config/global");

const moment = require("moment");
const { receipt_payment, journal } = require("../../modals/Account");
const { tax_master, ledger_account, ledger_group, charges, primary_group, master_group } = require("../../modals/MasterAccounts");

// const moduleInsert = async (req, res) => { 
//   const data = req.body;
//   const errors = {};
//   let newModule = new modules(data);
//   const insertedModule = await newModule.save();
//   return res.status(200).json({ _id: insertedModule._id });
// };

const AccountMasterInsert = async (req, res) => {
  const data = req.body;
  const URL = req.url;
  const errors = {};
  let newMaster = "";

  switch (URL) {
    case "/receipt_payment/insert":
      newMaster = new receipt_payment(data);
      break;

    case "/journal/insert":
      newMaster = new journal(data);
      break;
  }

  const insertedMaster = await newMaster.save();
  return res.status(200).json({
    _id: insertedMaster._id,
    enquiry_no: insertedMaster?.enquiry_no,
    quotation_no: insertedMaster?.quotation_no,
    sales_order_no: insertedMaster?.sales_order_no,
    sales_id: insertedMaster?.sales_id
  });
};


// const viewreceipt_payment= async(req,res)=> {
//   let condition={deleted_by_id:0};
//   const receipt_payment_id=req.body.receipt_payment_id;  
//   const voucher_no=req.body.voucher_no;
//   const voucher_date=req.body.voucher_date;
//   const short_data=(req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
//   const searchQuery=req.body.query;
//   const ledger_id=req.body.ledger_id;
//   const from_date=req.body.from_date;
//   const to_date=req.body.to_date;

//   let all_ledger_account=await ledger_account.find( {} , (err,ledger_accountData) => {return ledger_accountData}).select( ({"ledger_account_id": 1, "ledger_account":1, "_id": 0} ));
//   const ledger_accountById=(all_ledger_account, ledger_account_id)=>{
//       if(ledger_account_id===0) return "--"
//       for(let iCtr=0; iCtr<all_ledger_account.length; iCtr++){

//         if(all_ledger_account[iCtr]['ledger_account_id']==ledger_account_id)
//           return all_ledger_account[iCtr]['ledger_account']
//       }
//   }



//    // Function to prepare action items for each category
//    const actionValues=(active_status)=>{
//     return {
//           can_edit:true, 
//           can_delete:false, 
//           can_activate:(active_status ==="Y"? false : true), 
//           can_deactivate:(active_status ==="Y"? true : false),
//         }
//   }
//   console.log("BD", req.body);


//   if (voucher_date) {
//     condition = { ...condition, voucher_date: voucher_date };
//   }

//   // Details by ID
//   if(receipt_payment_id) { condition={...condition, receipt_payment_id:receipt_payment_id} }

//   // Details by Name


//   if(voucher_no){
//     condition = {...condition,voucher_no: new RegExp(voucher_no,"i")};
//   }



//   if(ledger_id) { condition={...condition, ledger_account_id: ledger_id.toString()} } 
//   if (from_date) {
//     condition = { ...condition, voucher_date: from_date };
//   }

//   if (to_date) {
//     condition = { ...condition, voucher_date: to_date };
//   }

//   if (from_date && to_date) {
//     condition = {
//       ...condition,
//       voucher_date: { $gte: from_date, $lte: to_date },
//     };
//   }




//   // Search
//   if(searchQuery) { 
//     condition={
//       ...condition,
//         $or:[
//             {voucher_no:{'$regex':searchQuery, $options:'i'}},
//             {details:{'$regex':searchQuery, $options:'i'}},
//           ]
//         } // Matching string also compare incase-sensitive 

//   }
//   console.log("con con", condition);
//   await receipt_payment.find( condition , (err, receipt_paymentData) => {
//     if(err){
//       return res.status(500).json( {"Error": err } );
//     }
//     if (receipt_paymentData) {


//       console.log(receipt_paymentData,"rb")
//       let returnDataArr=receipt_paymentData.map(data=>({
//         ledger_account_name:ledger_accountById(all_ledger_account, data.ledger_account_id),
//         action_items: actionValues(data.active_status),
//          ...data["_doc"]
//        }))

//       return res.status(200).json( returnDataArr);
//     }
//     else{
//       return res.status(200).json( [] );
//     }
//   }).select( (short_data ===true && {"receipt_payment_id": 1, "receipt_payment":1, "_id": 0} ));
// };



//aggration


const viewreceipt_payment = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const receipt_payment_id = req.body.receipt_payment_id;
  const voucher_no = req.body.voucher_no;
  const voucher_date = req.body.voucher_date;
  const short_data = (req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  const ledger_id = req.body.ledger_id;
  const from_date = req.body.from_date;
  const to_date = req.body.to_date;


  if (voucher_date) {
    condition = { ...condition, voucher_date: voucher_date };
  }

  // Details by ID
  if (receipt_payment_id) { condition = { ...condition, receipt_payment_id: receipt_payment_id } }

  // Details by Name


  // if(voucher_no){
  //   condition = {...condition,voucher_no: new RegExp(voucher_no,"i")};
  // }

  if (voucher_no) {
    condition = { ...condition, voucher_no: { $regex: voucher_no, $options: "i" } }
  }

  if (ledger_id) { condition = { ...condition, ledger_account_id: ledger_id } }
  // if (from_date) {
  //   condition = { ...condition, voucher_date: from_date };
  // }
  // if (to_date) {
  //   condition = { ...condition, voucher_date: to_date };
  // }
  if (from_date && to_date) {
    condition = {
      ...condition,
      voucher_date: { $gte: from_date, $lte: to_date + 86400 },
    };
  }




  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { voucher_no: { '$regex': searchQuery, $options: 'i' } },
        { details: { '$regex': searchQuery, $options: 'i' } },
      ]
    } // Matching string also compare incase-sensitive 

  }

  const all_ledger_account = await receipt_payment.aggregate
    ([
      {
        $match: condition
        // {
        //   $and:[
        //     {voucher_date:{$gte:from_date}},
        //     {voucher_date:{$lte:to_date}},
        //     {ledger_account_id: ledger_id}

        //   ]
        // },
      },
      {
        $lookup: {
          from: "t_200_ledger_accounts",
          let: { "ledger_account_id": "$ledger_account_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$ledger_account_id", "$$ledger_account_id"] } } },
            {
              $project:
              {
                "ledger_account": 1,
                "ledger_account_id": 1
              }
            }
          ],
          as: 'ledger_data',
        },
      },
      { $addFields: { ledger_account_name: { $first: "$ledger_data.ledger_account" } } },
      { $unset: ["ledger_data"] },
      {
        $addFields: {
          action_items: {

            can_edit: true,
            can_delete: true,
            can_view: false,
            can_activate: "$active_status" === "Y" ? false : true,
            can_deactivate: "$active_status" === "Y" ? true : false,

          }
        }
      },

      {
        $project:
        {
          "ledger_account": 1,
          "ledger_account_id": 1,
          "ledger_account_name": 1,
          "voucher_date": 1,
          "receipt_payment_id": 1,
          receipt_payment_type: 1,
          "voucher_no": 1,
          "bank_id": 1,
          "mode": 1,
          "reference_number": 1,
          "narration": 1,
          "amount": 1,
          "adjustment_amount": 1,
          "action_items": 1,
          "inserted_by_id": 1,
          "edited_by_id": 1,
          "deleted_by_id": 1,
          "inserted_by_date": 1,
          "edit_by_date": 1,
          "deleted_by_date": 1,
          "charges_id": 1,
          "edit_log": 1,
        }
      }





    ])
  if (all_ledger_account) {

    return res.status(200).json(all_ledger_account);
  } else {
    return res.status(200).json([]);
  }



  // console.log("con con", condition);
  // await receipt_payment.find( condition , (err, receipt_paymentData) => {
  //   if(err){
  //     return res.status(500).json( {"Error": err } );
  //   }
  //   if (receipt_paymentData) {


  //     console.log(receipt_paymentData,"rb")
  //     let returnDataArr=receipt_paymentData.map(data=>({
  //       ledger_account_name:ledger_accountById(all_ledger_account, data.ledger_account_id),
  //       action_items: actionValues(data.active_status),
  //        ...data["_doc"]
  //      }))

  //     return res.status(200).json( returnDataArr);
  //   }
  //   else{
  //     return res.status(200).json( [] );
  //   }
  // }).select( (short_data ===true && {"receipt_payment_id": 1, "receipt_payment":1, "_id": 0} ));
};


const updatereceipt_payment = async (req, res) => {
  const condition = { receipt_payment_id: req.body.receipt_payment_id };
  const data = req.body;
  // data.edited_by_id=10;
  data.edit_by_date = moment().format('X');

  const myData = await axios({
    method: 'post',
    url: apiURL + apiList.receipt_payment_list,
    data: condition
  });


  // const changed=trackChange( myData.data[0],req.body)
  // data.edit_log = ([JSON.stringify(changed), ... myData.data[0].edit_log]);



  // const receipt_paymentDetails=myData.data
  // data.edit_log=receipt_paymentDetails;

  await receipt_payment.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ "Error": err });
    }
    return res.status(200).json(obj);
  });
};
const deletereceipt_payment = async (req, res) => {
  const receipt_payment_id = req.body.receipt_payment_id;
  const user_id = req.body.user_id;

  const condition = { receipt_payment_id: receipt_payment_id }


  // await receipt_payment.deleteOne(condition, (err,obj)=>{
  // return res.status(200).json( obj );
  // });
  const data = await receipt_payment.findOneAndUpdate(
    { receipt_payment_id: receipt_payment_id },
    {
      $set: {
        deleted_by_id: user_id,
        deleted_by_date: moment().unix()
      }
    }
  )

  if (data) {
    return res.status(200).json(data);
  }
  else {
    return res.status(200).json([]);
  }
};


const view_journal = async (req, res) => {
  let condition = { deleted_by_id: 0 };
  const journal_id = req.body.journal_id;
  const voucher_no = req.body.voucher_no;
  const voucher_date = req.body.voucher_date;
  const short_data = (req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only
  const searchQuery = req.body.query;
  //this varial being use for ledger in misreports
  const from_date = req.body.from_date;
  const to_date = req.body.to_date;
  const ledger_name = req.body.ledger_name;
  const journal_ledger_name = req.body.journal_ledger_name;
  const transaction_id = req.body.transaction_id;

  console.log(ledger_name, "ssss");

  let all_ledger_account = await ledger_account.find({}, (err, ledger_accountData) => { return ledger_accountData }).select(({ "ledger_account_id": 1, "ledger_account": 1, "_id": 0 }));
  const ledger_accountById = (all_ledger_account, ledger_account_id) => {
    if (ledger_account_id === 0) return "--"
    for (let iCtr = 0; iCtr < all_ledger_account.length; iCtr++) {

      if (all_ledger_account[iCtr]['ledger_account_id'] == ledger_account_id)
        return all_ledger_account[iCtr]['ledger_account']
    }
  }



  // Function to prepare action items for each category
  const actionValues = (active_status) => {
    return {
      can_edit: true,
      can_delete: true,
      can_activate: (active_status === "Y" ? false : true),
      can_deactivate: (active_status === "Y" ? true : false),
    }
  }

//   const actionValues = (active_status, transaction_type) => {
//   const nonEditableTypes = ["Sales", "Purchase", "Direct Purchase", "Sales Return", "Purchase Return"];
  
//   return {
//     can_edit: !nonEditableTypes.includes(transaction_type),
//     can_delete: true,
//     can_activate: (active_status === "Y" ? false : true),
//     can_deactivate: (active_status === "Y" ? true : false),
//   };
// };
  //console.log(req.body)

  // Details by ID
  if (journal_id) { condition = { ...condition, journal_id: journal_id } }

  //SEARCH BY journal_ledger_name
  // if(journal_ledger_name) { condition={...condition, 'journal_details.ddl_ledger_name': journal_ledger_name} }
  // console.log(journal_ledger_name,"zzzz")


  // search by Ledger_name
  if (ledger_name) { condition = { ...condition, 'journal_details.ddl_ledger': ledger_name } }
  // Details by Name
  if (voucher_no) {
    condition = { ...condition, voucher_no: new RegExp(voucher_no, "i") };
  }

  if (transaction_id) {
    condition = { ...condition, 'transaction_id': new RegExp(transaction_id, 'i') };
  }
  //datefilter
  if (from_date) {
    condition = { ...condition, voucher_date: from_date };
  }

  if (to_date) {
    condition = { ...condition, voucher_date: to_date };
  }

  if (from_date && to_date) {
    condition = {
      ...condition,
      voucher_date: { $gte: from_date, $lte: to_date },
      // transaction_type:{$nin: [ "Sales","Purchase","Direct Purchase","Sales Return","Purchase Return"]}
    };
  }


  // Search
  if (searchQuery) {
    condition = {
      ...condition,
      $or: [
        { voucher_no: { '$regex': searchQuery, $options: 'i' } },
        { details: { '$regex': searchQuery, $options: 'i' } },
      ]
    } // Matching string also compare incase-sensitive 

  }
  //console.log(condition)
  await journal.find(condition, (err, journalData) => {
    if (err) {
      return res.status(500).json({ "Error": err });
    }
    if (journalData) {



      let returnDataArr = journalData.map(data => ({
        ledger_account_name: ledger_accountById(all_ledger_account, data.ledger_account_id),
        action_items: actionValues(data.active_status),
        ...data["_doc"]
      }))

      return res.status(200).json(returnDataArr);
    }
    else {
      return res.status(200).json([]);
    }
  }).select((short_data === true && { "journal_id": 1, "journal": 1, "_id": 0 }));
};


const update_journal = async (req, res) => {
  let condition = { journal_id: req.body.journal_id };
  const data = req.body;
  const Data = await axios({
    method: "post",
    url: apiURL + apiList.journal_list,
    data: condition,
  });

  // const journalDetails=Data.data;
  // data.edit_log=journalDetails;

  await journal.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ "Error": err });
    }
    return res.status(200).json(obj);
  });
};

const journalDelete = async (req, res) => {
  const journal_id = req.body.journal_id
  const user_id = req.body.user_id
  console.log(journal_id, user_id, "5555")
  const data = await journal.findOneAndUpdate(
    {
      journal_id: journal_id
    },
    {
      $set: {
        "deleted_by_id": user_id,
        "deleted_by_date": moment().unix()
      }
    }
  )

  if (data) {
    return res.status(200).send(data)
  }
  else {
    return res.status(200).json([])
  }
}

const edit_journal = async (req, res) => {
  let condition = { journal_id: req.body.journal_id };
  const data = req.body;
  data.edited_by_id = req.body.edited_by_id;
  data.edit_by_date = moment().format("X");

  const Data = await axios({
    method: 'post',
    url: apiURL + apiList.journal_list,
    data: condition
  });

  // const journalDetails=Data.data
  // data.edit_log=journalDetails;

  await journal.findOneAndUpdate(condition, data, (err, obj) => {
    if (err) {
      return res.status(500).json({ "Error": err });
    }
    return res.status(200).json(obj);
  });
};
const journal_id = async (req, res) => {

  const invoice_no = req.body.invoice_no;

  let journal_id = await journal.aggregate([
    {
      $match: { $expr: { $eq: ["$transaction_id", invoice_no] } }
    },
    {
      $project: {
        _id: 0,
        journal_id: 1
      }
    }
  ])

  if (journal_id) {

    // console.log("sen1306=>", salesData)
    return res.status(200).send(journal_id)
  }
  else {
    return res.status(200).json([])
  }
};
module.exports = {
  viewreceipt_payment,
  updatereceipt_payment,
  deletereceipt_payment,
  view_journal,
  update_journal,
  // edit_journal,
  journal_id,
  journalDelete
};
