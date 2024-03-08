const express = require("express");
const router = express.Router();

const { dropLedgerStorage, exportUsers, exportShowroom, exportItem, exportCategory, exportBrand, exportUom,
    exportBank, exportArea, exportRole, exportStatus, exportPrimaryGroup, exportLedgerGroup, exportLedgerAccount,
    exportCharges, exportCustomer, exportVendor, exportRefrence, exportVehicle, exportItemStock, exportLedgerStorage,
    exportLedgerAccountOpeningUpdate, exportMasterGroup, exportSerialNo, customerRemigration, vendorRemigration, itemRemigration,
    catRemigration, brandRemigration,ledgerAccountRemigrate } = require('./mongoConnect.js')

//main exports
router.post('/financialYearDataMigration/users', exportUsers);
router.post('/financialYearDataMigration/showrooms', exportShowroom);
router.post('/financialYearDataMigration/item', exportItem);
router.post('/financialYearDataMigration/catagory', exportCategory);
router.post('/financialYearDataMigration/brand', exportBrand);
router.post('/financialYearDataMigration/uom', exportUom);
router.post('/financialYearDataMigration/bank', exportBank);
router.post('/financialYearDataMigration/area', exportArea);
router.post('/financialYearDataMigration/role', exportRole);
router.post('/financialYearDataMigration/status', exportStatus);
router.post('/financialYearDataMigration/masterGroup', exportMasterGroup);
router.post('/financialYearDataMigration/serialNo', exportSerialNo);


//account exports
router.post('/financialYearDataMigration/primaryGroup', exportPrimaryGroup);
router.post('/financialYearDataMigration/ledgerGroup', exportLedgerGroup);
router.post('/financialYearDataMigration/ledgerAccount', exportLedgerAccount);
router.post('/financialYearDataMigration/ledgerStorage', exportLedgerStorage);
router.post('/financialYearDataMigration/ledgerAccountUpdate', exportLedgerAccountOpeningUpdate);



router.post('/financialYearDataMigration/charges', exportCharges);

//community export
router.post('/financialYearDataMigration/customer', exportCustomer);
router.post('/financialYearDataMigration/vendor', exportVendor);
router.post('/financialYearDataMigration/refrence', exportRefrence);
router.post('/financialYearDataMigration/Vehicle', exportVehicle);

router.post('/financialYearDataMigration/itemStock', exportItemStock);

router.post('/financialYearDataMigration/ledgerStorage/drop', dropLedgerStorage);

///////remigrations//////
router.post('/financialYearDataMigration/customerRemigration', customerRemigration);
router.post('/financialYearDataMigration/vendorRemigration', vendorRemigration);
router.post('/financialYearDataMigration/itemRemigration', itemRemigration);
router.post('/financialYearDataMigration/catRemigration', catRemigration);
router.post('/financialYearDataMigration/brandRemigration', brandRemigration);
router.post('/financialYearDataMigration/ledgerAccountRemigrate',ledgerAccountRemigrate);
module.exports = router