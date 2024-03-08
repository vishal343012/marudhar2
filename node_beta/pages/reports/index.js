const express = require("express");
const router = express.Router();

//const {auth} = require("./auth");

const { stockRegisterList, dashboardStatsReport, 
    stockVoucher,stockRegisterOpening,stockRegisterClosingStock,stockRegisterOpeningValuation,avg_value,closingSto_Valuation,viewclosingstockValuation,
    itemStockStorage,view_avg_stock,stockRegisterTransaction,showroom_warehouse_stock,showroom_warehouse_stock2,itemOpeningStock,viewclosingstock,ItemAvg_value,Opening,view_closing_Stock_Valuation} = require('./stockRegister');
const {brandWiseCondensedReport,
    brandWiseDetailedReport,
    allBrandWiseCondensedReport,
     dataFromLedgerStorage,showroomWiseSalesList,customerLedgerList, view_salesman, vendorLedgerList,
     out_standing_report_sales_order, view_customerCondensed, view_referenceDetail, 
     view_referenceCondensed, referenceItemWiseSales, view_customerDetail, view_saleOrderByInvoice, 
     out_standing_report,
     brandReportInsert, 
     view_salesman_chart,brandReportStorageInsert,brandWisePurchaseReport,brandWiseDetailsPurchaseReport,brandWiseCondensedPurchaseReport,brandWiseDetailedpurchaseTestReport} = require('./salesReports');
const { PurchaseRegisterList,PurchaseListForReturn,PurchaseJournalReport,out_standing_purchase } = require('./PurchaseRegister');
const { getAllAccData, getAllAccDataForSalesOrder } = require('./ledgerReports');
const { viewRecentActivities,getSalesStats } = require('./Dashboard');
const { quotationNew, salesNew ,deliveryNew} = require('./quotationpdf');
const { enquiryNew } = require("./enquiryReport");  

router.get('/quotationReport', quotationNew);
router.get('/enquiryReport', enquiryNew);

router.get('/salesReport', salesNew);


router.get('/deliveryReport', deliveryNew);


router.post('/stockRegister/list', stockRegisterList);
router.post('/stockRegisterOpening/list', stockRegisterOpening);
router.post('/closing_stock/list', view_avg_stock);
router.post('/stockRegisterClosing/list', stockRegisterClosingStock);
router.post('/stockOpening/list', stockRegisterOpeningValuation);

router.post('/stockRegisterTransaction/list', stockRegisterTransaction);
router.post('/showroom_warehouse_stock/list', showroom_warehouse_stock);
router.post('/showroom_warehouse_stock2/list2', showroom_warehouse_stock2);


router.post('/stockVoucher/list', stockVoucher);
router.post('/showroomWiseSales/list', showroomWiseSalesList);
router.post("/dashboardStatsReport", dashboardStatsReport);
router.post('/PurchaseRegister/list', PurchaseRegisterList);
router.post('/PurchaseRegister/purchaselistforreturn', PurchaseListForReturn);
router.post('/PurchaseJournalReport/list', PurchaseJournalReport);
router.post('/AccountVouchers/list', getAllAccData);
router.post('/AccountVoucherForSalesOrder/list', getAllAccDataForSalesOrder);
router.post('/viewRecentActivities/list', viewRecentActivities);
router.post('/salesman/list', view_salesman);
router.post('/CustomerCondensed/list', view_customerCondensed);
router.post('/CustomerDetail/list', view_customerDetail);
router.post('/salesOrderByInvoice/list', view_saleOrderByInvoice);
router.post('/referenceItemWiseSales/list', referenceItemWiseSales);
router.post('/ReferenceCondensed/list', view_referenceCondensed);
router.post('/ReferenceDetail/list', view_referenceDetail);

router.post('/outStandingReport/list', out_standing_report);
router.post('/dataFromLedgerStorage/list', dataFromLedgerStorage);

router.post('/outStandingReportSalesOrder/list', out_standing_report_sales_order);

router.post('/customerLedgerList/list', customerLedgerList);

//brand wise reports
router.post('/brandWiseCondensedReport/list', brandWiseCondensedReport);
router.post('/brandWiseDetailedReport/list', brandWiseDetailedReport);
router.post('/allBrandWiseCondensedReport/list', allBrandWiseCondensedReport);
router.post('/brandReport/insert', brandReportInsert);
router.post('/brandWisePurchaseReport/list', brandWisePurchaseReport);


//salesman report
router.post('/viewSalesmanChart/list', view_salesman_chart);

// sales Stat
router.post('/salesStat/list', getSalesStats);

// purchase report
router.post('/purchase/list', out_standing_purchase);

//item Stock insert
router.post('/itemStock/insert', itemStockStorage);

// router.post('/avg_value/list', avg_value);

router.post('/avg_Cost/list', avg_value);
router.post('/stockClosingQty/list', closingSto_Valuation);

router.post('/stockClosingvalue/list', viewclosingstockValuation);





// /item opening and closing stock valuation

router.post('/itemOpeningStock/list', itemOpeningStock);
router.post('/itemClosingStock/list', viewclosingstock);
router.post('/ItemAvgValue/list', ItemAvg_value);
router.post('/openingItem/list', Opening);


//brand storage report insert 
router.post('/brandReportStorageInsert/insert', brandReportStorageInsert);

router.post('/closing_Value/list', view_closing_Stock_Valuation);
router.post('/brandWiseDetailsPurchaseReport/list', brandWiseDetailsPurchaseReport);

router.post('/brandWiseDetailsPurchaseTestReport/list', brandWiseDetailedpurchaseTestReport);
router.post('/brandWiseCondensedPurchaseReport/list', brandWiseCondensedPurchaseReport);

router.post('/vendorLedgerList/list', vendorLedgerList);



module.exports = router; 
