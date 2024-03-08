const express = require("express");
const router = express.Router();

const { auth } = require("./auth");

const userRegister = require('./userRegister');
// const userLogin = require('./userLogin')
const{userLogin , versionCheck} = require('./userLogin')

const userList = require('./userList')
const userSelect = require('./userSelect');
const { masterInsert,
        viewCatgeory,
        deleteCategory,
        updateCategory,
        viewBrand,
        deleteBrand,
        view_showrooms_warehouse,
        updateshowrooms_warehouse,
        deleteshowrooms_warehouse,
        view_module,
        updateModules,
        deleteModule,
        view_terms,
        deleteTerms,
        updateTerms,
        view_statutory,
        deleteStatutory,
        updateStatutory,
        view_tax_master,
        deleteTaxMaster,
        updateTaxMaster,
        view_uom,
        updateUom,
        deleteUom,
        updateBrand,
        view_ledger_account,
        view_ledger_account_search,
        view_ledger_account_byName,
        view_ledger_account_name,
        deleteLedgerAccount,
        updateLedgerAccount,
        view_ledger_group,
        deleteLedgerGroup,
        updateLedgerGroup,
        view_charges,
        deleteCharges,
        updateCharges,
        view_primary_group,
        deletePrimaryGroup,
        updatePrimaryGroup,
        view_sources,
        updatesource,
        deletesource,
        view_role,
        updaterole,
        deleterole,
        viewuser,
        updateuser,
        deleteuser,
        view_master_group,
        deletemaster_group,
        updatemaster_group,
        viewitem,
        updateitem,
        deleteitem,
        updateitemstock,
        viewcustomer,
        viewOnlyCustomer,
        deletecustomer,
        updatecustomer,
        viewvendor,
        updatevendor,
        deletevendor,
        view_bank,
        deletebank,
        updatebank,
        view_enquiry,
        deleteenquiry,
        updateenquiry,
        view_direct_purchase,
        delete_direct_purchase,
        update_direct_purchase,
        view_purchase,
        delete_purchase,
        update_purchase,
        view_sales,
        view_invoice,
        updatesales,
        deletesales,
        view_status,
        updatestatus,
        deletestatus,
        view_task_todo,
        updatetask_todo,
        view_stock_transfer,
        updatestock_transfer,
        view_stock_movement,
        data_migration,
        view_delivery,
        view_return_delivery_view,
        view_dispatch,
        view_vehicle,
        deleteVehicle,
        updateVehicle,
        view_area,
        deleteArea,
        updateArea,
        view_purchase_return,
        view_sales_return,
        updateSalesReturn,
        deletemenu,
        view_menu,
        updatemenu,
        view_item_withAgg,
        item_dropDown,
        view_delivery_return,
        itemPriceUpdate,
        view_waste,
        view_trialBalance,
        view_trialBalanceSundayCredit,
        view_ledger_by_salesorder,
        view_create_delivery_order,
        view_delivery_order,
        create_dispatch_order,
        ledger_check_by_customer_name
} = require('./master');

const { view_sales_invoice_agg,
        view_sales_agg, keyword_pharse_search,
        keyword_pharse_quotation_search,
        keyword_pharse_sales_search,
        view_print
        // storage2
 } = require('./masterAggregate');
const { AccountMasterInsert, view_ledger_balance, insertLedgerStorage, editLedgerStorage  } = require('./accounts');
const { viewreceipt_payment, updatereceipt_payment, deletereceipt_payment, view_journal, edit_journal, update_journal, journal_id, journalDelete } = require('./receiptAccount');


const { ReferenceMasterInsert, view_reference, updateReference, deleteReference } = require('./references');
const {reportInsert,storage2,salesPayUpdateStorage,pendingOrderReport,ledgerUpdateStorage} = require('./report')
const { itemReportInsert,storage3} = require('./itemReport')


//Routes
router.post('/register', userRegister);
router.post('/login', userLogin);
router.post("/loginwithversion" ,versionCheck);
router.post('/list', userList);
router.post('/search', userSelect);


// storage
router.post('/storage/insert', masterInsert);
router.post('/storage2/insert', storage2);
router.post('/storage3/insert', storage3);


// Category Routes
router.post('/category/insert', masterInsert);
router.post('/category/list', viewCatgeory);
router.post('/category/delete', deleteCategory);
router.post('/category/update', updateCategory);

// Brand Routes
router.post('/brand/insert', masterInsert);
router.post('/brand/list', viewBrand);
router.post('/brand/delete', deleteBrand);
router.post('/brand/update', updateBrand);


// UOM Routes
router.post('/uom/insert', masterInsert);
router.post('/uom/list', view_uom);
router.post('/uom/update', updateUom);
router.post('/uom/delete', deleteUom);


// Item Routes
router.post('/item/insert', masterInsert);
// router.post('/item/list',viewitem);
router.post('/item/list', view_item_withAgg);
router.post('/item/dropDown/list', item_dropDown);


router.post('/item/delete', deleteitem);
router.post('/item/update', updateitem);
router.post('/item/stockupdate', updateitemstock);

//MODULE
router.post('/module/insert', masterInsert);
router.post('/module/list', view_module);
router.post('/module/delete', deleteModule);
router.post('/module/update', updateModules);

//STATUTORY 
router.post('/statutory/list', view_statutory);
router.post('/statutory_type/insert', masterInsert);
router.post('/statutory_type/delete', deleteStatutory);
router.post('/statutory_type/update', updateStatutory);


//Terms
router.post('/terms/list', view_terms);
router.post('/terms/insert', masterInsert);
router.post('/terms/delete', deleteTerms);
router.post('/terms/update', updateTerms);



//Vehicle
router.post('/vehicle/insert', masterInsert);
router.post('/vehicle/list', view_vehicle);
router.post('/vehicle/delete', deleteVehicle);
router.post('/vehicle/update', updateVehicle);



//Area
router.post('/area/insert', masterInsert);
router.post('/area/list', view_area);
router.post('/area/delete', deleteArea);
router.post('/area/update', updateArea);




//Group Master 
router.post('/primary_group/list', view_primary_group);
router.post('/primary_group/insert', masterInsert);
router.post('/primary_group/update', updatePrimaryGroup);
router.post('/primary_group/delete', deletePrimaryGroup);

//showrooms-warehouse
router.post('/showrooms-warehouse/insert', masterInsert);
router.post('/showrooms-warehouse/list', view_showrooms_warehouse);
router.post('/showrooms-warehouse/update', updateshowrooms_warehouse);
router.post('/showrooms-warehouse/delete', deleteshowrooms_warehouse);


//Master Accounts


//Tax Master
router.post('/tax_master/list', view_tax_master);
router.post('/tax_master/insert', masterInsert);
router.post('/tax_master/update', updateTaxMaster);
router.post('/tax_master/delete', deleteTaxMaster);

// router.post('/category/detailsByID/:category_id/', viewCatgeory);
// router.post('/category/detailsByName/:category', viewCatgeory);
// router.post('/category/search/:query', viewCatgeory);

//Ledger Account
router.post('/ledger_account/insert', AccountMasterInsert);
router.post('/ledger_account/list', view_ledger_account);
router.post('/ledger_account_search/list', view_ledger_account_search);


router.post('/view_ledger_account_byName/list', view_ledger_account_byName);

router.post('/ledger_account/delete', deleteLedgerAccount);
router.post('/ledger_account/update', updateLedgerAccount);


//ledgerAccount for customer and vendor with group
router.post('/ledger_account_name/list', view_ledger_account_name);

//Ledger Group
router.post('/ledger_group/list', view_ledger_group);
router.post('/ledger_group/insert', AccountMasterInsert);
router.post('/ledger_group/delete', deleteLedgerGroup);
router.post('/ledger_group/update', updateLedgerGroup);

//Charges
router.post('/charges/list', view_charges);
router.post('/charges/insert', AccountMasterInsert);
router.post('/charges/delete', deleteCharges);
router.post('/charges/update', updateCharges);


// Account Master 
router.post('/primary_group/insert', AccountMasterInsert);
router.post('/account_nature/insert', AccountMasterInsert);


router.post('/tax_master/insert', AccountMasterInsert);
router.post('/charges/insert', AccountMasterInsert);
router.post('/bank_master/insert', AccountMasterInsert);


// Reference Master 

router.post('/reference/insert', ReferenceMasterInsert);
router.post('/reference/update', updateReference);
router.post('/reference/list', view_reference);
router.post('/reference/delete', deleteReference);


//Source

router.post('/source/list', view_sources);
router.post('/source/insert', masterInsert);
router.post('/source/update', updatesource);
router.post('/source/delete', deletesource);

//Role
router.post('/role/insert', masterInsert);
router.post('/role/list', view_role);
router.post('/role/delete', deleterole);
router.post('/role/update', updaterole);


//User
router.post('/users/insert', masterInsert);
router.post('/users/list', viewuser),
        router.post('/users/update', updateuser),
        router.post('/users/delete', deleteuser);

//User
router.post('/master_group/insert', masterInsert);
router.post('/master_group/list', view_master_group),
        router.post('/master_group/update', updatemaster_group),
        router.post('/master_group/delete', deletemaster_group);

//CUSTOMER
router.post('/customer/insert', masterInsert);
router.post('/customer/list', viewcustomer),
router.post('/customerNameOnly/list', viewOnlyCustomer),

router.post('/customer/delete', deletecustomer),
router.post('/customer/update', updatecustomer)


//VENDOR
router.post('/vendor/insert', masterInsert);
router.post('/vendor/list', viewvendor);
router.post('/vendor/update', updatevendor);
router.post('/vendor/delete', deletevendor);


//BANK
router.post('/bank/list', view_bank);
router.post('/bank/insert', masterInsert);
router.post('/bank/delete', deletebank);
router.post('/bank/update', updatebank);

//ENQUIRY
router.post('/enquiry/insert', masterInsert);
router.post('/enquiry/list', view_enquiry);
router.post('/enquiry/delete', deleteenquiry);
router.post('/enquiry/update', updateenquiry);

//OPENING_STOCK
router.post('/opening_stock/insert', masterInsert);


//DIRECT_PURCHASE
// router.post('/direct_purchase/insert',auth,masterInsert);
router.post('/direct_purchase/insert', masterInsert);
router.post('/direct_purchase/list', view_direct_purchase);
router.post('/direct_purchase/delete', delete_direct_purchase);
router.post('/direct_purchase/update', update_direct_purchase);

//PURCHASE_ORDER
router.post('/purchase/insert', masterInsert);
router.post('/purchase/list', view_purchase);
router.post('/purchase/delete', delete_purchase);
router.post('/purchase/update', update_purchase);

//PURCHASE_RETURN
router.post('/purchase_return/insert', masterInsert);
router.post('/purchase_return/list', view_purchase_return);

//delivery_return

router.post('/delivery_return/list', view_delivery_return);

//SALES_RETURN
router.post('/sales_return/insert', masterInsert);
router.post('/sales_return/list', view_sales_return);
router.post('/sales_return/update', updateSalesReturn)


//SALES ORDERS
router.post('/sales/insert', masterInsert);
router.post('/sales/list', view_sales);
router.post('/sales/update', updatesales);
router.post('/sales/delete', deletesales);

//Sales Aggrigated
router.post('/sales_agg/list', view_sales_invoice_agg);
router.post('/view_sales_agg/list', view_sales_agg);
router.post('/keyword_pharse/list', keyword_pharse_search);
router.post('/keyword_pharse_quotation_search/list', keyword_pharse_quotation_search);
router.post('/keyword_pharse_sales_search/list', keyword_pharse_sales_search);


router.post('/view_print/list', view_print);



//STATUS_SCHEMA
router.post('/status/insert', masterInsert);
router.post('/status/list', view_status);
router.post('/status/update', updatestatus);
router.post('/status/delete', deletestatus);



//TASK_TODO
router.post('/task_todo/insert', masterInsert);
router.post('/task_todo/list', view_task_todo);
router.post('/task_todo/update', updatetask_todo);



//Account RECEIPT
router.post('/receipt_payment/insert', masterInsert);
router.post('/receipt_payment/list', viewreceipt_payment);
router.post('/receipt_payment/update', updatereceipt_payment);
router.post('/receipt_payment/delete', deletereceipt_payment);



//Journal
router.post('/journal/insert', masterInsert);
router.post('/journal/list', view_journal);
router.post('/journal/update', update_journal);
// router.post('/journal/list', edit_journal);
router.post('/journal_id/list', journal_id);
router.post('/journal/delete', journalDelete);

// router.post('/receipt_payment/update',updatereceipt_payment);
// router.post('/receipt_payment/delete',deletereceipt_payment);


//STOCK TRANSFER
router.post('/stock_transfer/insert', masterInsert);
router.post('/stock_transfer/list', view_stock_transfer);
router.post('/stock_transfer/update', updatestock_transfer);


//STOCK MOVEMENT
router.post('/stock_movement/insert', masterInsert);
router.post('/stock_movement/list', view_stock_movement);

//DATA MIGRATE
router.post('/data-migration/insert', data_migration)
router.post('/itemPriceUpdate/update',itemPriceUpdate)

//Invoices

router.post('/invoice/list', view_invoice);

//DELIVERY ORDERS
router.post('/delivery/list', view_delivery);

//DISPATCH ORDERS
router.post('/dispatch/list', view_dispatch);
//Return delivery order view
router.post('/return_delivery_view/list', view_return_delivery_view);

//VIEW BALANCE
router.post('/ledger_account/balance', view_ledger_balance);

//ledger storage 
router.post('/ledger_storage/insert', insertLedgerStorage);
router.post('/ledger_storage/edit', editLedgerStorage);

// menu_schema
router.post('/menu/insert', masterInsert);
router.post('/menu/list', view_menu);
router.post('/menu/update', updatemenu);
router.post('/menu/delete', deletemenu);

//waste

router.post('/waste/insert',masterInsert);
router.post('/waste/list',view_waste);

//API for Report
router.post('/customer_invoice_report/insert',reportInsert);
router.post('/sales_report_item/insert',itemReportInsert)
router.post('/ledger_storage/update',salesPayUpdateStorage)
router.post('/ledger_storage1/update',ledgerUpdateStorage)


//TrialBalance Api//

router.post('/trialbalance/list',view_trialBalance)
router.post('/pendingOrder/list', pendingOrderReport)


router.post('/trialbalanceSundayCredit/list',view_trialBalanceSundayCredit)


router.post('/ledger_by_salesorder/list', view_ledger_by_salesorder);

router.post('/Create_delivery_order/list', view_create_delivery_order);


router.post('/delivery_order_view/list', view_delivery_order);

router.post('/create_dispatch_order/list', create_dispatch_order);

router.post('/ledgerAccount/ledger_check_by_customer_name', ledger_check_by_customer_name);


module.exports = router
