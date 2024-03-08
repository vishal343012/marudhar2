const router = require("express").Router();
// const moment = require("moment");
const moment = require("moment-timezone");
const axios = require("axios");
const { apiURL } = require("../../config/config");
const { apiList } = require("../../config/api");
var express = require("express");
const { MongoClient } = require('mongodb');
const mongoose = require("mongoose");

// scheemas
const { User, userSchema } = require("../../modals/User");
const { showrooms_warehouse, showrooms_warehouse_Schema, itemSchema, brandSchema, categorySchema, uomSchema, bank_Schema, areaSchema, roleSchema, vehicleSchema } = require("../../modals/Master");
const { statusSchema, serial_noSchema } = require("../../modals/Sales");
const { master_group_Schema, primary_group_Schema, ledger_group_Schema, ledger_account, ledger_account_Schema, charges_Schema } = require("../../modals/MasterAccounts");
const { storageSchema } = require("../../modals/ledgerStorage");
const { customer_Schema, vendor_Schema, reference_Schema } = require("../../modals/MasterReference");

let DBMain = ''
let DBFy = ''
let DBLink = {}

let dirName = __dirname.split("/");

const serverDIR = dirName[dirName.length - 2];

let betaFlag = false

if (serverDIR === "node_beta") {
  return betaFlag = true;
}



const fetchDBLink = (currentFy, nextFy) => {


  let PrimaryDB = ''
  let SecondaryDB = ''

  if (currentFy === "2022-2023") {
    // //live database

    return ({
      PrimaryDB: `mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/db_marudhar_live?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority`,
      SecondaryDB: `mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/fy_${nextFy}?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority`
    })

    // // local db
    // return ({
    //   PrimaryDB: `mongodb://127.0.0.1:27017/db_marudhar_live_backup?readPreference=primary&directConnection=true&ssl=false`,
    //   SecondaryDB: `mongodb://127.0.0.1:27017/fy_${nextFy}?readPreference=primary&directConnection=true&ssl=false`
    // })
  }
  else {
    // //live database
    return (
      {
        PrimaryDB: `mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/fy_${currentFy}?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority`,
        SecondaryDB: `mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/fy_${nextFy}?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority`
      })

    //  // local db
    // return ({
    //   PrimaryDB: `mongodb://127.0.0.1:27017/db_marudhar_live_backup?readPreference=primary&directConnection=true&ssl=false`,
    //   SecondaryDB: `mongodb://127.0.0.1:27017/fy_${nextFy}?readPreference=primary&directConnection=true&ssl=false`
    // })

  }

}


//////////////////////// db ////////////////////////////////////////////////

const disconnectDb = async (req, res) => {
  try {
    console.log("reched==>>")
    let mongoOldConn = mongoose.connection.close(() => {
      return "mongo disconnected"
      // console.log("mongo disconnected")
    })
    if (mongoOldConn) {
      res.status(200).send("disconnected")
    }
  } catch (error) {
    console.log(error)
  }

}
//////////////////////// Main Export start ////////////////////////////////////////////////

//users
const exportUsers = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy



  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB


  // if (currentFy === "2022-2023") {
  //   PrimaryDB = `mongodb://127.0.0.1:27017/db_test?readPreference=primary&directConnection=true&ssl=false`
  // }
  // else {
  //   PrimaryDB = `mongodb://127.0.0.1:27017/fy_${currentFy}?readPreference=primary&directConnection=true&ssl=false`
  // }

  // const SecondaryDB = `mongodb://127.0.0.1:27017/fy_${nextFy}?readPreference=primary&directConnection=true&ssl=false`


  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)
  try {

    //user Collection
    const userdata = await PrimaryDBClient.model("users", userSchema).find({}, { _id: 0, })
    if (userdata) {
      await SecondaryDBClient.collection("users", userSchema).insertMany(userdata).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    console.log("www", err);
  }


}

// showroom
const exportShowroom = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)
  try {
    //showrooom
    const showrooomdata = await PrimaryDBClient.model("t_000_showrooms_warehouses", showrooms_warehouse_Schema).find({}, { _id: 0, })
    if (showrooomdata) {
      await SecondaryDBClient.collection("t_000_showrooms_warehouses", showrooms_warehouse_Schema).insertMany(showrooomdata).then(() => {
        return res.status(200).send({ Status: "Completed" })
      })
    }


  } catch (err) {
    console.log("www", err);
  }


}

// item
const exportItem = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {
    const data = await PrimaryDBClient.model("t_100_item", itemSchema).find({}, {
      _id: 0,
      stock_by_location: 0,
      edit_log: 0,
    })

    if (data) {
      await SecondaryDBClient.collection("t_100_items", itemSchema).insertMany(data).then(
        () => {
          return res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (error) {
    res.status(200).send(error)
  }
}

//catagory
const exportCategory = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //user catagory
    const catagorydata = await PrimaryDBClient.model("t_100_categories", categorySchema).find({}, { _id: 0, })
    if (catagorydata) {
      await SecondaryDBClient.collection("t_100_categories", categorySchema).insertMany(catagorydata).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    console.log("www", err);
  }

}

// //brand
const exportBrand = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //brand
    const branddata = await PrimaryDBClient.model("t_100_brand", brandSchema).find({}, { _id: 0, })
    if (branddata) {
      await SecondaryDBClient.collection("t_100_brands", brandSchema).insertMany(branddata).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    console.log("www", err);
  }

}

//UOM
const exportUom = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //UOM
    const uomdata = await PrimaryDBClient.model("t_100_uom", uomSchema).find({}, { _id: 0, })
    if (uomdata) {
      await SecondaryDBClient.collection("t_100_uoms", uomSchema).insertMany(uomdata).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    console.log("www", err);
  }

}

//Bank
const exportBank = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //bank
    const data = await PrimaryDBClient.model("t_100_bank_name", bank_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_100_bank_names", bank_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }

}

//area
const exportArea = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_000_area", areaSchema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_000_areas", areaSchema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }

}

//role
const exportRole = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_100_role", roleSchema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_100_roles", roleSchema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }

}

//status
const exportStatus = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_900_status", statusSchema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_900_statuses", statusSchema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }

}

//master group
const exportMasterGroup = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_200_master_group", master_group_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_200_master_groups", master_group_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }
}

//serial no
const exportSerialNo = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    await SecondaryDBClient.collection("t_000_serial_nos", serial_noSchema).insert({
      enquiry_no: 0,
      quotation_no: 0,
      sales_order_no: 0,
      purchase_order_no: 0,
      delivery_order_no: 0,
      dispatch_order_no: 0,
      grn_no: 0,
      stock_transfer_no: 0,
      voucher_no: 0,
      invoice_no: 0,
      purchase_return_no: 0,
      sales_return_no: 0,
    }).then(
      () => {
        res.status(200).send({ Status: "Completed" })
      }
    )
  } catch (err) {
    res.status(200).send(err)
  }
}

//////////////////////// Main Export ends////////////////////////////////////////////////

//////////////////////// Account Export Start////////////////////////////////////////////////

//Primary Group
const exportPrimaryGroup = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_200_primary_group", primary_group_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_200_primary_groups", primary_group_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }

}

//ledger group
const exportLedgerGroup = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_200_ledger_group", ledger_group_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_200_ledger_groups", ledger_group_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }

}

//ledger account
const exportLedgerAccount = async (req, res) => {
  // const from_date = moment(moment("2022-04-01").format("x"), "x").unix();
  // const to_date = moment(moment("2023-02-26").format("x"), "x").unix() + 86399;
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data1 = await PrimaryDBClient.model("t_200_ledger_account", ledger_account_Schema).find({}, { _id: 0, })
    // const data2 = await PrimaryDBClient.model("t_900_ledgerStorage", storageSchema).find({}, { _id: 0, })

    if (data1) {
      console.log("REcehd 1")

      data1.map(async (r, i) => {
        // let balance = data2.filter((d2) => d2.ledgerId === r.ledger_account_id)

        await SecondaryDBClient.collection("t_200_ledger_accounts", ledger_account_Schema).insertOne({
          ledger_account_id: r.ledger_account_id,
          ledger_group_id: r.ledger_group_id,
          type_id: r.type_id,
          type: r.type,
          ledger_account: r.ledger_account,
          alias: r.alias,
          // opening_balance: balance && balance[0]?.closingBalance ? balance[0]?.closingBalance : 0,
          // dr_cr_status: balance && balance[0]?.closeCrDrStatus ? balance[0]?.closeCrDrStatus : "Dr",
          as_on_date: r.as_on_date,
          credit_limit: r.credit_limit,
          active_status: r.active_status,
          inserted_by_id: r.inserted_by_id,
          inserted_by_date: r.inserted_by_date,
          edited_by_id: r.edited_by_id,
          edit_by_date: r.edit_by_date,
          deleted_by_id: r.deleted_by_id,
          deleted_by_date: r.deleted_by_date,
          edit_log: r.edit_log,
        })

        if (i === (data1.length - 1)) {
          return res.status(200).send({ Status: "Completed" })
        }
        // res.status(200).send({Status: "Completed"})
        // console.log("REcehd 2")

        // data2.map(async (r2, i2) => {
        //   await SecondaryDBClient.collection("t_900_ledgerStorage", storageSchema).insertOne({
        //     ls_id: r2.ls_id,
        //     ledgerId: r2.ledgerId,
        //     ledgerGroupId: r2.ledgerGroupId,
        //     typeId: r2.typeId,
        //     type: r2.type,
        //     ledgerName: r2.ledgerName,
        //     openCrDrStatus: r2.closeCrDrStatus,
        //     closeCrDrStatus: "Dr",
        //     openingBalance: r2.closingBalance,
        //     closingBalance: 0,
        //     updatedDate: r2.updatedDate,
        //     financialYear: nextFy,
        //   })
        //   if (i2 === (data2.length - 1)) {
        //     console.log("REcehd 3")
        //     return res.status(200).send({ Status: "Completed" })
        //   }
        // })
        // }
      })

    }

  } catch (err) {
    res.status(200).send(err)
  }

}

const exportLedgerStorage = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {
    const data = await PrimaryDBClient.model("t_900_ledgerstorage", storageSchema).find({}, { _id: 0, })

    if (data) {
      data.map(async (r2, i2) => {
        await SecondaryDBClient.collection("t_900_ledgerstorages", storageSchema).insertOne({
          ls_id: r2.ls_id,
          ledgerId: r2.ledgerId,
          ledgerGroupId: r2.ledgerGroupId,
          typeId: r2.typeId,
          type: r2.type,
          ledgerName: r2.ledgerName,
          openCrDrStatus: r2.closeCrDrStatus,
          closeCrDrStatus: "Dr",
          openingBalance: r2.closingBalance,
          closingBalance: 0,
          updatedDate: r2.updatedDate,
          financialYear: nextFy,
        })
        if (i2 === (data.length - 1)) {
          console.log("REcehd 3")
          return res.status(200).send({ Status: "Completed" })
        }
      })
    }

  } catch (error) {

  }
}

const exportLedgerAccountOpeningUpdate = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {
    const data = await PrimaryDBClient.model("t_900_ledgerstorage", storageSchema).find({}, { _id: 0, })

    if (data) {
      data.map(async (r2, i2) => {
        await SecondaryDBClient.collection("t_200_ledger_accounts", ledger_account_Schema).findOneAndUpdate(
          {
            ledger_account_id: r2.ledgerId,
          },
          {
            $set: {
              opening_balance: r2?.closingBalance ? r2?.closingBalance : 0,
              dr_cr_status: r2?.closeCrDrStatus ? r2?.closeCrDrStatus : "Dr",
            }

          }
        )
        if (i2 === (data.length - 1)) {
          console.log("REcehd 3")
          return res.status(200).send({ Status: "Completed" })
        }
      })
    }

  } catch (error) {

  }
}
//Other Charges
const exportCharges = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_200_charges", charges_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_200_charges", charges_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }
}

//////////////////////Account Export End /////////////////////////////////////////

//////////////////////community Export End /////////////////////////////////////////

const exportCustomer = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_400_customer", customer_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_400_customers", customer_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }
}

const exportVendor = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_500_vendor", vendor_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_500_vendors", vendor_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }
}

const exportRefrence = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_300_reference", reference_Schema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_300_references", reference_Schema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }
}

const exportVehicle = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {

    //area
    const data = await PrimaryDBClient.model("t_000_vehicle", vehicleSchema).find({}, { _id: 0, })
    if (data) {
      await SecondaryDBClient.collection("t_000_vehicles", vehicleSchema).insertMany(data).then(
        () => {
          res.status(200).send({ Status: "Completed" })
        }
      )
    }

  } catch (err) {
    res.status(200).send(err)
  }
}

const exportItemStock = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy
  const itemsStock = req.body.itemsStock

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  try {


    if (itemsStock) {

      itemsStock.map(async (r, i) => {
        console.log(r.item_id)
        await SecondaryDBClient.collection("t_100_items", itemSchema).findOneAndUpdate({
          item_id: r.item_id
        },
          {
            $push: {
              stock_by_location: {
                showroom_warehouse_id: r.ShowroomId,
                quantity: r.stoClosing,
                date: moment().format("YYYY-MM-DD")
              }
            }
          },

        ).then(
          () => {
            if (i === itemsStock.length - 1)
              res.status(200).send({ Status: "Completed" })
          }
        )

      })

    }

  } catch (err) {
    res.status(200).send(err)
  }
}

/////////DROPING OF LEDGER STORAGE TABLE///////////////////////////////////////////////////////////////////////////////////////////////////////AS///
const dropLedgerStorage = async (req, res) => {
  // const currentFy = "2022-2023"
  // const nextFy = "2023-2024"
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  let DBLink = fetchDBLink(currentFy, nextFy)

  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)


  try {
    const data = await PrimaryDBClient.model("t_900_ledgerstorage", storageSchema).remove()
    if (data) {
      return res.status(200).send(`${data.deletedCount} Records Removed From Ledger Storage Table`)
    }
  } catch (error) {
    return res.status(200).send(error)
  }
}


////////////////////////////////Remigration//////////////////////////////////////////////////////

const customerRemigration = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  const toDate = moment(moment().endOf('day').format("LLLL"), "LLLL").valueOf();
  const fromDate = moment(moment("2023-04-01").startOf('day').format("LLLL"), "LLLL").valueOf();
  console.log("fromDate:", fromDate.toString(), "toDate:", toDate.toString());

  let DBLink = fetchDBLink(currentFy, nextFy)
  // let DBLink = fetchDBLink()
  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  // autoIncrement.initialize(SecondaryDBClient);

  try {

    const identitycounters = SecondaryDBClient.model('identitycounters', new mongoose.Schema({
      count: Number,
      model: String,
      field: String,
    }));

    //area
    const data = await PrimaryDBClient.model("t_400_customer", customer_Schema).find(
      {
        inserted_by_date: { $gte: fromDate.toString() }
      }, { _id: 0, customer_id: 0 })

    // console.log(data)

    if (data) {


      data.map(async (r, i) => {

        let count = await identitycounters.find({ model: "t_400_customer" })
        let countLedger = await identitycounters.find({ model: "t_200_ledger_account" })
        let countLedgerStorage = await identitycounters.find({ model: "t_900_ledgerstorage" })

        let checking = await SecondaryDBClient.model("t_400_customers", customer_Schema).find({ company_name: r.company_name })


        if (checking.length === 0) {        //finding ledger account
          const data1 = await PrimaryDBClient.model("t_200_ledger_account", ledger_account_Schema).find(
            {
              ledger_account: r.company_name
            },
            { _id: 0, })

          // inserting ledger account
          await SecondaryDBClient.collection("t_200_ledger_accounts", ledger_account_Schema).insertOne({
            ledger_account_id: countLedger[0].count + 1,
            ledger_group_id: data1[0].ledger_group_id,
            type_id: count[0].count + 1,
            type: data1[0].type,
            ledger_account: data1[0].ledger_account,
            alias: data1[0].alias,
            as_on_date: data1[0].as_on_date,
            credit_limit: data1[0].credit_limit,
            active_status: data1[0].active_status,
            inserted_by_id: data1[0].inserted_by_id,
            inserted_by_date: data1[0].inserted_by_date,
            edited_by_id: data1[0].edited_by_id,
            edit_by_date: data1[0].edit_by_date,
            deleted_by_id: data1[0].deleted_by_id,
            deleted_by_date: data1[0].deleted_by_date,
            edit_log: data1[0].edit_log,
          }).then(async () => {

            await SecondaryDBClient.collection("t_900_ledgerStorages", storageSchema).insertOne({
              ls_id: countLedgerStorage[0].count + 1,
              ledgerId: countLedger[0].count + 1,
              ledgerGroupId: data1[0].ledger_group_id,
              typeId: count[0].count + 1,
              type: data1[0].type,
              ledgerName: data1[0].ledger_account,
              openCrDrStatus: data1[0].dr_cr_status,
              closeCrDrStatus: "Dr",
              openingBalance: data1[0].opening_balance,
              closingBalance: 0,
              updatedDate: moment().unix(),
              financialYear: nextFy,
            })
            await identitycounters.findOneAndUpdate({ model: "t_200_ledger_account" }, { $inc: { "count": 1 } })
            await identitycounters.findOneAndUpdate({ model: "t_900_ledgerstorage" }, { $inc: { "count": 1 } })
          })


          //inserting customer
          await SecondaryDBClient.collection("t_400_customers", customer_Schema).insertOne(r).then(
            async () => {
              // identitycounters.findOneAndUpdate({ model: "t_400_customer" },{$inc:{count:1}})
              await SecondaryDBClient.collection("t_400_customers", customer_Schema).findOneAndUpdate(
                {
                  company_name: r.company_name
                },
                {
                  $set: {
                    customer_id: count[0].count + 1
                  }
                }
              )
              await identitycounters.findOneAndUpdate({ model: "t_400_customer" }, { $inc: { "count": 1 } })
              // res.status(200).send({ Status: "Completed" })
            }
          )
        }
        if (i === (data.length - 1)) {
          res.status(200).send({ Status: "Completed" })
        }


      })
      // res.status(200).send(a)

    }

  } catch (err) {
    res.status(200).send(err)
  }
}

const vendorRemigration = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  const toDate = moment(moment().endOf('day').format("LLLL"), "LLLL").valueOf();
  const fromDate = moment(moment("2023-04-01").startOf('day').format("LLLL"), "LLLL").valueOf();
  // console.log("fromDate:", fromDate.toString(), "toDate:", toDate.toString());

  let DBLink = fetchDBLink(currentFy, nextFy)
  // let DBLink = fetchDBLink()
  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)
  // autoIncrement.initialize(SecondaryDBClient);

  try {

    const identitycounters = SecondaryDBClient.model('identitycounters', new mongoose.Schema({
      count: Number,
      model: String,
      field: String,
    }));


    const data = await PrimaryDBClient.model("t_500_vendor", vendor_Schema).find(
      {
        inserted_by_date: { $gte: fromDate.toString() }
      }, { _id: 0, vendor_id: 0 })

    if (data) {

      data.map(async (r, i) => {

        let count = await identitycounters.find({ model: "t_500_vendor" })
        let countLedger = await identitycounters.find({ model: "t_200_ledger_account" })
        let countLedgerStorage = await identitycounters.find({ model: "t_900_ledgerstorage" })

        let checking = await SecondaryDBClient.model("t_500_vendor", vendor_Schema).find({ company_name: r.company_name })

        if (checking.length === 0) {
          //finding ledger account
          const data1 = await PrimaryDBClient.model("t_200_ledger_account", ledger_account_Schema).find(
            {
              ledger_account: r.company_name
            },
            { _id: 0, })

          // inserting ledger account
          await SecondaryDBClient.collection("t_200_ledger_accounts", ledger_account_Schema).insertOne({
            ledger_account_id: countLedger[0].count + 1,
            ledger_group_id: data1[0].ledger_group_id,
            type_id: count[0].count + 1,
            type: data1[0].type,
            ledger_account: data1[0].ledger_account,
            alias: data1[0].alias,
            as_on_date: data1[0].as_on_date,
            credit_limit: data1[0].credit_limit,
            active_status: data1[0].active_status,
            inserted_by_id: data1[0].inserted_by_id,
            inserted_by_date: data1[0].inserted_by_date,
            edited_by_id: data1[0].edited_by_id,
            edit_by_date: data1[0].edit_by_date,
            deleted_by_id: data1[0].deleted_by_id,
            deleted_by_date: data1[0].deleted_by_date,
            edit_log: data1[0].edit_log,
          }).then(async () => {

            await SecondaryDBClient.collection("t_900_ledgerStorages", storageSchema).insertOne({
              ls_id: countLedgerStorage[0].count + 1,
              ledgerId: countLedger[0].count + 1,
              ledgerGroupId: data1[0].ledger_group_id,
              typeId: count[0].count + 1,
              type: data1[0].type,
              ledgerName: data1[0].ledger_account,
              openCrDrStatus: data1[0].dr_cr_status,
              closeCrDrStatus: "Dr",
              openingBalance: data1[0].opening_balance,
              closingBalance: 0,
              updatedDate: moment().unix(),
              financialYear: nextFy,
            })
            await identitycounters.findOneAndUpdate({ model: "t_200_ledger_account" }, { $inc: { "count": 1 } })
            await identitycounters.findOneAndUpdate({ model: "t_900_ledgerstorage" }, { $inc: { "count": 1 } })
          })


          await SecondaryDBClient.collection("t_500_vendor", vendor_Schema).insertOne(r).then(
            async () => {
              // identitycounters.findOneAndUpdate({ model: "t_400_customer" },{$inc:{count:1}})
              await SecondaryDBClient.collection("t_500_vendor", vendor_Schema).findOneAndUpdate(
                {
                  company_name: r.company_name
                },
                {
                  $set: {
                    vendor_id: count[0].count + 1
                  }
                }
              )
              await identitycounters.findOneAndUpdate({ model: "t_500_vendor" }, { $inc: { "count": 1 } })

            }
          )

        }
        if (i === (data.length - 1)) {
          res.status(200).send({ Status: "Completed" })
        }
      })

      // res.status(200).send(data)

    }
  } catch (error) {
    res.status(200).send(error)
  }
}

const itemRemigration = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  const toDate = moment(moment().endOf('day').format("LLLL"), "LLLL").valueOf();
  const fromDate = moment(moment("2023-04-01").startOf('day').format("LLLL"), "LLLL").valueOf();
  // console.log("fromDate:", fromDate.toString(), "toDate:", toDate.toString());

  let DBLink = fetchDBLink(currentFy, nextFy)
  // let DBLink = fetchDBLink()
  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)
  autoIncrement.initialize(SecondaryDBClient);

  try {

    const identitycounters = SecondaryDBClient.model('identitycounters', new mongoose.Schema({
      count: Number,
      model: String,
      field: String,
    }));

    // const count = await identitycounters.find({ model: "t_100_item" })

    const data = await PrimaryDBClient.model("t_100_item", itemSchema).find(
      {
        inserted_by_date: { $gte: fromDate.toString() }
      }, { _id: 0, vendor_id: 0 })

    if (data) {
      data.map(async (r, i) => {

        let count = await identitycounters.find({ model: "t_100_item" })

        await SecondaryDBClient.collection("t_100_item", itemSchema).insertOne(r).then(
          async () => {
            // identitycounters.findOneAndUpdate({ model: "t_400_customer" },{$inc:{count:1}})
            await SecondaryDBClient.collection("t_100_item", itemSchema).findOneAndUpdate(
              {
                item: r.item
              },
              {
                $set: {
                  item_id: count[0].count + 1
                }
              }
            )
            await identitycounters.findOneAndUpdate({ model: "t_100_item" }, { $inc: { "count": 1 } })

          }
        )
        if (i === (data.length - 1)) {
          res.status(200).send({ Status: "Completed" })
        }
      })

      // res.status(200).send(data)

    }
  } catch (error) {
    res.status(200).send(error)
  }
}

const catRemigration = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  const toDate = moment(moment().endOf('day').format("LLLL"), "LLLL").valueOf();
  const fromDate = moment(moment("2023-04-01").startOf('day').format("LLLL"), "LLLL").valueOf();
  // console.log("fromDate:", fromDate.toString(), "toDate:", toDate.toString());

  let DBLink = fetchDBLink(currentFy, nextFy)
  // let DBLink = fetchDBLink()
  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)
  autoIncrement.initialize(SecondaryDBClient);

  try {

    const identitycounters = SecondaryDBClient.model('identitycounters', new mongoose.Schema({
      count: Number,
      model: String,
      field: String,
    }));


    const data = await PrimaryDBClient.model("t_100_categorie", categorySchema).find(
      {
        inserted_by_date: { $gte: fromDate.toString() }
      }, { _id: 0, vendor_id: 0 })

    if (data) {
      data.map(async (r, i) => {
        let count = await identitycounters.find({ model: "t_100_categorie" })

        await SecondaryDBClient.collection("t_100_categorie", categorySchema).insertOne(r).then(
          async () => {
            // identitycounters.findOneAndUpdate({ model: "t_400_customer" },{$inc:{count:1}})
            await SecondaryDBClient.collection("t_100_categorie", categorySchema).findOneAndUpdate(
              {
                category: r.category
              },
              {
                $set: {
                  category_id: count[0].count + 1
                }
              }
            )
            await identitycounters.findOneAndUpdate({ model: "t_100_categorie" }, { $inc: { "count": 1 } })

          }
        )
        if (i === (data.length - 1)) {
          res.status(200).send({ Status: "Completed" })
        }
      })

      // res.status(200).send(data)

    }
  } catch (error) {
    res.status(200).send(error)
  }
}

const brandRemigration = async (req, res) => {
  const currentFy = req.body.fy.currentFy
  const nextFy = req.body.fy.nextFy

  const toDate = moment(moment().endOf('day').format("LLLL"), "LLLL").valueOf();
  const fromDate = moment(moment("2023-04-01").startOf('day').format("LLLL"), "LLLL").valueOf();
  // console.log("fromDate:", fromDate.toString(), "toDate:", toDate.toString());

  let DBLink = fetchDBLink(currentFy, nextFy)
  // let DBLink = fetchDBLink()
  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)
  autoIncrement.initialize(SecondaryDBClient);

  try {

    const identitycounters = SecondaryDBClient.model('identitycounters', new mongoose.Schema({
      count: Number,
      model: String,
      field: String,
    }));


    const data = await PrimaryDBClient.model("t_100_brands", brandSchema).find(
      {
        inserted_by_date: { $gte: fromDate.toString() }
      }, { _id: 0, vendor_id: 0 })

    if (data) {
      data.map(async (r, i) => {
        let count = await identitycounters.find({ model: "t_100_brands" })

        await SecondaryDBClient.collection("t_100_brands", brandSchema).insertOne(r).then(
          async () => {
            // identitycounters.findOneAndUpdate({ model: "t_400_customer" },{$inc:{count:1}})
            await SecondaryDBClient.collection("t_100_brands", brandSchema).findOneAndUpdate(
              {
                brand: r.brand
              },
              {
                $set: {
                  brand_id: count[0].count + 1
                }
              }
            )
            await identitycounters.findOneAndUpdate({ model: "t_100_brands" }, { $inc: { "count": 1 } })

          }
        )
        if (i === (data.length - 1)) {
          res.status(200).send({ Status: "Completed" })
        }
      })

      // res.status(200).send(data)

    }
  } catch (error) {
    res.status(200).send(error)
  }
}

const ledgerAccountRemigrate = async(req,res)=>{
  // const currentFy = req.body.fy.currentFy
  // const nextFy = req.body.fy.nextFy

  const toDate = moment(moment().endOf('day').format("LLLL"), "LLLL").valueOf();
  const fromDate = moment(moment("2023-04-01").startOf('day').format("LLLL"), "LLLL").valueOf();
  console.log("fromDate:", fromDate.toString(), "toDate:", toDate.toString());

  // let DBLink = fetchDBLink(currentFy, nextFy)
  let DBLink = fetchDBLink()
  const PrimaryDB = DBLink.PrimaryDB
  const SecondaryDB = DBLink.SecondaryDB

  const PrimaryDBClient = mongoose.createConnection(PrimaryDB)
  const SecondaryDBClient = mongoose.createConnection(SecondaryDB)

  // autoIncrement.initialize(SecondaryDBClient);

  try {

    const identitycounters = SecondaryDBClient.model('identitycounters', new mongoose.Schema({
      count: Number,
      model: String,
      field: String,
    }));

    //area
    const data = await PrimaryDBClient.model("t_200_ledger_accounts", ledger_account_Schema).find(
      {
        inserted_by_date: { $gte: fromDate.toString() },
        ledger_account_id:{$nin:[54,56]}
      }, { _id: 0, customer_id: 0 })

    // console.log(data)

    if (data) {


      data.map(async (r, i) => {

  
        let countLedger = await identitycounters.find({ model: "t_200_ledger_account" })
        let countLedgerStorage = await identitycounters.find({ model: "t_900_ledgerstorage" })

        let checking = await SecondaryDBClient.model("t_200_ledger_account", ledger_account_Schema).find({ company_name: r.company_name })


        if (checking.length === 0) {

          // inserting ledger account
          await SecondaryDBClient.collection("t_200_ledger_accounts", ledger_account_Schema).insertOne({
            ledger_account_id: countLedger[0].count + 1,
            ledger_group_id: r.ledger_group_id,
            // type_id: count[0].count + 1,
            // type: data1[0].type,
            ledger_account: r.ledger_account,
            alias: r.alias,
            as_on_date: r.as_on_date,
            credit_limit:r.credit_limit,
            active_status: r.active_status,
            inserted_by_id: r.inserted_by_id,
            inserted_by_date: r.inserted_by_date,
            edited_by_id: r.edited_by_id,
            edit_by_date: r.edit_by_date,
            deleted_by_id: r.deleted_by_id,
            deleted_by_date: r.deleted_by_date,
            edit_log: r.edit_log,
          }).then(async () => {

            await SecondaryDBClient.collection("t_900_ledgerStorages", storageSchema).insertOne({
              ls_id: countLedgerStorage[0].count + 1,
              ledgerId: countLedger[0].count + 1,
              ledgerGroupId: r.ledger_group_id,
              // typeId: count[0].count + 1,
              // type: data1[0].type,
              ledgerName: r.ledger_account,
              openCrDrStatus: r.dr_cr_status,
              closeCrDrStatus: "Dr",
              openingBalance: r.opening_balance,
              closingBalance: 0,
              updatedDate: moment().unix(),
              financialYear: nextFy,
            })
            await identitycounters.findOneAndUpdate({ model: "t_200_ledger_account" }, { $inc: { "count": 1 } })
            await identitycounters.findOneAndUpdate({ model: "t_900_ledgerstorage" }, { $inc: { "count": 1 } })
          })
        }
        if (i === (data.length - 1)) {
          res.status(200).send({ Status: "Completed" })
        }


      })
      // res.status(200).send(a)

    }

  } catch (err) {
    res.status(200).send(err)
  }

}
module.exports = {
  //db
  disconnectDb,
  dropLedgerStorage,
  //end export
  exportItemStock,
  //community export
  exportMasterGroup,
  exportCustomer,
  exportVendor,
  exportRefrence,
  exportVehicle,
  exportSerialNo,
  //account exports
  exportPrimaryGroup,
  exportLedgerGroup,
  exportLedgerAccount,
  exportLedgerStorage,
  exportLedgerAccountOpeningUpdate,
  exportCharges,
  //main exports
  exportUsers,
  exportShowroom,
  exportItem,
  exportCategory,
  exportBrand,
  exportUom,
  exportBank,
  exportArea,
  exportRole,
  exportStatus,

  //Remigration
  customerRemigration,
  vendorRemigration,
  itemRemigration,
  catRemigration,
  brandRemigration,
  ledgerAccountRemigrate
}