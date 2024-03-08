const router = require("express").Router();
const axios = require('axios');
const { apiURL } = require('../../config/config');
const { apiList } = require('../../config/api')

const moment = require("moment");


const { customer, reference, vendor } = require("../../modals/MasterReference");
const { direct_purchase, purchase } = require("../../modals/Purchase");

const PurchaseRegisterList = async (req, res) => {
	let condition = { deleted_by_id: 0 };
	const purchase_id = req.body.purchase_id;
	const grn_no = req.body.txt_grn_no;

	const bill_no = req.body.bill_no;

	const bill_from_date = (req.body.bill_from_date);
	const bill_to_date = (req.body.bill_to_date);

	const vendor_id = req.body.vendor_id;


	const showroom_warehouse_id = req.body.showroom_warehouse_id;
	const short_data = (req.body.short_data ? req.body.short_data : false); // Will use this for sending limited fields only

	if (grn_no) {
		condition = { ...condition, 'grn_details.grn_no': new RegExp(grn_no, 'i') };
	}

	// Details by ID
	if (purchase_id) { condition = { ...condition, 'purchase_id': purchase_id } }

	// Details by Name
	if (vendor_id) { condition = { ...condition, 'vendor_id': vendor_id } }

	if (showroom_warehouse_id) { condition = { ...condition, 'showroom_warehouse_id': showroom_warehouse_id } } // Matching exact text but incase-sensitive

	if (bill_no) {
		condition = { ...condition, 'grn_details.bill_no': new RegExp(bill_no, 'i') };
	}

	//For date search PURCHASE
	if (bill_from_date) {
		condition = { ...condition, 'grn_details.grn_date': bill_from_date };
	}
	if (bill_to_date) {
		condition = { ...condition, 'grn_details.grn_date': bill_to_date };
	}
	//both date filter
	if (bill_from_date && bill_to_date) {
		condition = { ...condition, 'grn_details.grn_date': { '$gte': (bill_from_date), '$lte': (bill_to_date) } };
	}


	let queryData = await purchase.aggregate([
		{ $match: { ...condition, approve_id: { $gt: 0 } } },
		// { $match: {...condition}},

		{
			$project: {
				transaction_id: 1,
				vendor_id: 1,
				module: 1,
				po_date: 1,
				grn_no: 1,
				"grn_details.grn_no": 1,
				"grn_details.grn_date": 1,
				"grn_details.bill_no": 1,
				"grn_details.bill_date": 1,
				"grn_details.bill_value": 1,
				"item_details.quantity": 1,
				"item_details.rate": 1,
				"item_details.gst_value": 1,
				"item_details.disc_value": 1,
				"received_item_details.receivedQty": 1,
				"received_item_details.uom_id": 1,
				"received_item_details.rate": 1,
				"received_item_details.gst_value": 1,

				grn_no: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$grn_no", else: "$grn_details.grn_no" }
				},

				quantity: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.quantity", else: "$received_item_details.receivedQty" }
				},
				rate: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.rate", else: "$received_item_details.rate" }
				},
				gst_value: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.gst_value", else: "$received_item_details.gst_value" }
				},
				purchase_id: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$purchase_id", else: "$purchase_id" }
				},

			}
		},

		{
			$group: {
				_id: "$grn_no",
				bill_no: { $addToSet: "$grn_details.bill_no" },
				bill_date: { $addToSet: "$grn_details.grn_date" },
				vendor_id: { $addToSet: "$vendor_id" },
				// vendor_id:{$first:"$vendor_id"},
				quantity: { $addToSet: "$quantity" },
				rate: { $addToSet: "$rate" },
				gst_value: { $addToSet: "$gst_value" },
				disc_value: { $addToSet: "$item_details.disc_value" },
				module: { $addToSet: "$module" },
				bill_value: { $first: "$grn_details.bill_value" },
				purchase_id: { $addToSet: "$purchase_id" },
				// gross_amount :{$addToSet:"$gross_amount"},
				// gross_amount : { $multiply: [ "$rate", "$quantity" ] }

			}
		},

		{
			$lookup: {
				from: "t_500_vendors",
				let: { "purchase_vendor_id": "$vendor_id" },
				pipeline: [
					{
						$match:
							{ $expr: { $in: ["$vendor_id", "$$purchase_vendor_id"] }, },
					},
					{ $project: { "company_name": 1, "_id": 0 } }
				],
				as: "vendor_details"
			}
		},

		{
			$addFields: {
				vendor_name: { $first: "$vendor_details.company_name" },
			},
		},
		{ $unset: ["vendor_details"] },

	])

	if (queryData) {
		//console.log(queryData)
		let returnArr = [];

		for (let iCtr = 0; iCtr < queryData.length; iCtr++) {
			// console.log(queryData[iCtr])


			queryData[iCtr]['bill_no'] = queryData[iCtr]['bill_no'][0]
			queryData[iCtr]['bill_date'] = queryData[iCtr]['bill_date'][0]
			queryData[iCtr]['rate'] = queryData[iCtr]['rate'][0]
			queryData[iCtr]['quantity'] = queryData[iCtr]['quantity'][0]
			queryData[iCtr]['gst_value'] = queryData[iCtr]['gst_value'][0]
			queryData[iCtr]['module'] = queryData[iCtr]['module'][0]
			queryData[iCtr]['bill_value'] = queryData[iCtr]['bill_value'][0]
			queryData[iCtr]['purchase_id'] = queryData[iCtr]['purchase_id'][0]
			//  queryData[iCtr]['disc_value']= queryData[iCtr]['disc_value'][0]

			if (Array.isArray(queryData[iCtr]['_id'])) {

				for (let iGRN = 0; iGRN < queryData[iCtr]['_id'].length; iGRN++) {
					let grn = queryData[iCtr]['_id'][iGRN];
					let bill_no = queryData[iCtr]['bill_no'][iGRN];
					let bill_date = queryData[iCtr]['bill_date'][iGRN];
					let vendor_name = queryData[iCtr]['vendor_name'];
					let rate = queryData[iCtr]['rate'][iGRN];
					let quantity = queryData[iCtr]['quantity'][iGRN];
					let gst_value = queryData[iCtr]['gst_value'][iGRN];
					let module = queryData[iCtr]['module'];
					let bill_value = queryData[iCtr]['bill_value'];
					let purchase_id = queryData[iCtr]['purchase_id'];
					//let disc_value =queryData[iCtr]['disc_value'][iGRN];





					let obj = { grn: grn, bill_no: bill_no, bill_date: bill_date, vendor_name: vendor_name, rate: rate, quantity: quantity, gst_value: gst_value, disc_value: 0, module: module, bill_value: bill_value, purchase_id: purchase_id };

					returnArr.push(obj);
				}
			}
			else {
				let grn = queryData[iCtr]['_id'];
				let bill_no = queryData[iCtr]['bill_no'][0];
				let bill_date = queryData[iCtr]['bill_date'][0];
				let vendor_name = queryData[iCtr]['vendor_name'];
				let rate = queryData[iCtr]['rate'][0];
				let quantity = queryData[iCtr]['quantity'][0];

				let gst_value = queryData[iCtr]['gst_value'][0];
				let disc_value = queryData[iCtr]['disc_value'][0];
				let module = queryData[iCtr]['module'];
				let bill_value = queryData[iCtr]['bill_value'];
				let purchase_id = queryData[iCtr]['purchase_id'];


				let obj = { grn: grn, bill_no: bill_no, bill_date: bill_date, vendor_name: vendor_name, rate: rate, quantity: quantity, gst_value: gst_value, disc_value: disc_value, module: module, bill_value: bill_value, purchase_id: purchase_id };

				returnArr.push(obj);
			}


		}

		return res.status(200).send(returnArr);
	}
	else {
		return res.status(200).json([]);
	}


};

const PurchaseJournalReport = async (req, res) => {
	let condition = { deleted_by_id: 0 };
	console.log(req.body, "yy")
	const grn = req.body.grn;
	const vendor_id = req.body.vendor_id;

	const voucher_no = req.body.voucher_no;

	const to_date = req.body.txt_to_date;
	const from_date = req.body.txt_from_date;

	// For date search PURCHASE
	if (from_date) {
		condition = { ...condition, 'grn_details.bill_date': from_date };
	}
	if (to_date) {
		condition = { ...condition, 'grn_details.bill_date': to_date };
	}
	//both date filter
	if (from_date && to_date) {
		condition = { ...condition, 'grn_details.bill_date': { '$gte': (from_date), '$lte': (to_date) } };
	}

	if (grn) {
		condition = { ...condition, 'grn_details.grn_no': new RegExp(grn, 'i') };
	}
	// if (grn) {
	//   condition = { ...condition, 'transaction_id': new RegExp(grn, 'i') };
	// }
	if (voucher_no) {
		condition = { ...condition, 'voucher_no': new RegExp(voucher_no, 'i') };
	}
	if (vendor_id) {
		condition = { ...condition, 'vendor_id': vendor_id };
	}


	let queryData = await purchase.aggregate([

		{ $match: { ...condition, approve_id: { $gt: 0 } } },
		{
			$project: {
				_id: 0,
				grn_no: "$grn_details.grn_no",
				vendor_id: 1,
				purchase_value: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.net_value", else: "$received_item_details.net_value" }
				},
			}
		},
		{
			$lookup: {
				from: "t_500_vendors",
				let: { "vendor_id": "$vendor_id" },
				pipeline: [
					{
						$match:
							{ $expr: { $eq: ["$vendor_id", "$$vendor_id"] }, },
					},
					{ $project: { "company_name": 1, "_id": 0 } }
				],
				as: "vendor_details"
			}
		},

		{
			$addFields: {
				vendor_name: { $first: "$vendor_details.company_name" },
			},
		},
		{ $unset: ["vendor_details"] },

		{
			$lookup: {
				from: "t_200_journals",
				let: { "grn_no": "$grn_no" },
				pipeline: [
					{
						$match:
						{
							$expr: {
								// if:voucher_no,
								// then:{$eq: ["$voucher_no", voucher_no]},
								// else:{
								$in: ["$transaction_id", "$$grn_no"]
								// }

							},
							"deleted_by_id": 0
						},
					},
					{ $project: { "transaction_id": 1, "_id": 0, "voucher_no": 1, "voucher_amount": 1 } },
					{
						$group: {
							"_id": "$voucher_no",
							transaction_id: { $first: "$transaction_id" },
							voucher_no: { $addToSet: "$voucher_no" },
							voucher_amount: { $first: "$voucher_amount" },
						}
					}

				],
				as: "J_details"
			}
		},
		// { $unwind: "$J_details" },
		{
			$addFields: {
				journal_count: { $size: "$J_details.voucher_no" },
				voucher_amount: { $sum: "$J_details.voucher_amount" },
				voucher_no: { $first: "$J_details.voucher_no" },
				transaction_id: { $first: "$J_details.transaction_id" },

			},
		},
		{ $unset: ["J_details"] },
		{
			$group: {
				_id: "$grn_no",
				journal_count: { $first: "$journal_count" },
				transaction_id: { $first: "$transaction_id" },
				voucher_no: { $first: "$voucher_no" },
				voucher_amount: { $sum: "$voucher_amount" },
				vendor_name: { $first: "$vendor_name" },
				vendor_id: { $first: "$vendor_id" },
				purchase_value: { $first: { $sum: "$purchase_value" } },
			}
		},
		{
			$sort: { id: 1 }
		}
	])

	// let queryData2 = await journal.aggregate([
	//   {
	//     $match: condition
	//   },
	//   { $project: { "transaction_id": 1, "_id": 0, "voucher_no": 1, "voucher_amount": 1 } },
	//   {
	//     $group: {
	//       "_id": "$voucher_no",
	//       transaction_id: { $first: "$transaction_id" },
	//       voucher_no: { $addToSet: "$voucher_no" },
	//       voucher_amount: { $first: "$voucher_amount" },
	//     }
	//   },
	//   {
	//     $lookup: {
	//       from: "t_800_purchases",
	//       let: { "grn_no": "$transaction_id" },
	//       pipeline: [
	//         {
	//           $unwind: "$grn_details"
	//         },
	//         {
	//           $match: {
	//             $expr: {
	//               $eq: ['$grn_details.grn_no', "$$grn_no"]

	//             }
	//           }
	//         },
	//         {
	//           $project: {
	//             _id: 0,
	//             grn_no: "$grn_details.grn_no",
	//             vendor_id: 1,
	//             purchase_value: {
	//               $cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.net_value", else: "$received_item_details.nate_value" }
	//             },
	//           }
	//         },
	//         {
	//           $lookup: {
	//             from: "t_500_vendors",
	//             let: { "vendor_id": "$vendor_id" },
	//             pipeline: [
	//               {
	//                 $match:
	//                   { $expr: { $eq: ["$vendor_id", "$$vendor_id"] }, },
	//               },
	//               { $project: { "company_name": 1, "_id": 0 } }
	//             ],
	//             as: "vendor_details"
	//           }
	//         },

	//         {
	//           $addFields: {
	//             vendor_name: { $first: "$vendor_details.company_name" },
	//           },
	//         },
	//         { $unset: ["vendor_details"] },
	//       ], as: "purchase"
	//     }
	//   }
	// ])


	if (queryData) {
		return res.status(200).json(queryData)
	}
	else {
		return res.status(200).json([])
	}
}

const out_standing_purchase = async (req, res) => {
	let condition = { deleted_by_id: 0 };
	const vendor_id = req.body.vendor_id;
	// const txt_to_date = req.body.txt_to_date;
	const txt_to_date = moment().unix();
	const txt_from_date = req.body.txt_from_date;
	// For date search PURCHASE
	// if (from_date) {
	//   condition = { ...condition, 'grn_details.bill_date': from_date };
	// }
	// if (to_date) {
	//   condition = { ...condition, 'grn_details.bill_date': to_date };
	// }
	// //both date filter
	// if (from_date && to_date) {
	//   condition = { ...condition, 'grn_details.bill_date': { '$gte': (from_date), '$lte': (to_date) } };
	// }
	if (vendor_id) {
		condition = { ...condition, vendor_id: vendor_id };
	}

	let PurchaseData = await vendor.aggregate([
		{ $match: condition },
		{
			$project: {
				vendor_id: 1,
				company_name: 1,
			},
		},
		{
			$lookup: {
				from: "t_800_purchases",
				let: { vendor_id: "$vendor_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $ne: ["$approve_id", 0] },
									{ $eq: ["$vendor_id", "$$vendor_id"] },
								],
							},
						},
					},
					{
						$project: {
							_id: 0,
							vendor_id: 1,
							grn_no: 1,
							purchase_value: {
								$cond: {
									if: { $in: ["$module", ["DIRECT PURCHASE"]] },
									then: { $toDouble: { $sum: "$item_details.net_value" } },
									else: { $toDouble: { $sum: "$received_item_details.net_value" } },
								},
							},
						},
					},
					{
						$group: {
							_id: "$vendor_id",
							sumPurchase_value: { $sum: "$purchase_value" },
						},
					},
				],
				as: "purchase_details",
			},
		},

		{ $addFields: { sumPurchase_value: "$purchase_details.sumPurchase_value" } },
		{
			$lookup: {
				from: "t_200_ledger_accounts",
				let: { "type_id": "$vendor_id", "ledger_account": "$company_name" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $eq: ["$deleted_by_id", 0] },
									{
										$or: [
											{ $eq: ["$type_id", "$$type_id"] },
											{ $eq: ["$ledger_account", "$$ledger_account"] },
										],
									}
								]
							},
						},
					},
					{
						$project: {
							_id: 0,
							ledger_account_id: 1,
							ledger_account: 1,
							opening_balance: 1,
							dr_cr_status: 1,
						},
					},
				],
				as: "ledger_account_details",
			},
		},
		{
			$unwind: {
				path: "$ledger_account_details",
				preserveNullAndEmptyArrays: true,
			},
		},
		// // /////////////////////////////////////////////////////////////////
		{
			$addFields: {
				ledger_acc_id: "$ledger_account_details.ledger_account_id",
			},
		},
		{
			$lookup: {
				from: "t_200_journals",
				let: { ledger_account_id: "$ledger_acc_id" },
				pipeline: [
					{ $unwind: "$journal_details" },
					{
						$match: {
							$expr: {
								$and: [
									{
										$eq: [
											"$$ledger_account_id",
											"$journal_details.ddl_ledger_id",
										],
									},
									{ $eq: ["$deleted_by_id", 0] },
									// { $eq: ["$transaction_type", "Direct Purchase"] },
								],
							},
						},
					},
					// { $match: { transaction_type: { $exists: false } } },
					{
						$project: {
							_id: 0,
							ledger_account_id: 1,
							journal_id: 1,
							journal_details: 1,
							voucher_date: 1,

							debit_balance: {
								$cond: {
									if: {
										$and: [
											{ $eq: ["$journal_details.dr_cr", 1] },
											{ $lte: ["$voucher_date", txt_to_date] },
										],
									},
									then: "$voucher_amount",
									else: 0,
								},
							},
							credit_balance: {
								$cond: {
									if: {
										$and: [
											{ $eq: ["$journal_details.dr_cr", 2] },
											{ $lte: ["$voucher_date", txt_to_date] },
										],
									},
									then: "$voucher_amount",
									else: 0,
								},
							},
						},
					},
					{
						$group: {
							_id: "$journal_details.ddl_ledger_id",
							debit_balance: { $sum: "$debit_balance" },
							credit_balance: { $sum: "$credit_balance" },
						},
					},
				],
				as: "journals",
			},
		},
		{
			$lookup: {
				from: "t_200_receipt_payments",
				let: { ledger_account_id: "$ledger_acc_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{
										$or: [
											{ $eq: ["$$ledger_account_id", "$ledger_account_id"] },
											{ $eq: ["$$ledger_account_id", "$bank_id"] },
										],
									},
									{ $eq: ["$deleted_by_id", 0] },
								],
							},
						},
					},

					//push
					{
						$project: {
							_id: 0,
							//ledger_account_id: 1,
							// $bank_id:1
							ledger_account_id: {
								$cond: {
									if: { $eq: ["$ledger_account_id", "$$ledger_account_id"] },

									then: "$ledger_account_id",
									else: "$bank_id",
								},
							},
							receipt_payment_id: 1,
							receipt_payment_type: 1,
							voucher_date: 1,
							amount: 1,
							debit_balance: {
								$cond: {
									if: {
										$or: [
											{
												$and: [
													{ $in: ["$receipt_payment_type", ["R", "BP"]] },
													{ $lt: ["$voucher_date", txt_to_date] },
													{ $eq: ["$bank_id", "$$ledger_account_id"] },
												],
											},
											{
												$and: [
													{ $in: ["$receipt_payment_type", ["P", "BR"]] },
													{ $lt: ["$voucher_date", txt_to_date] },
													{
														$eq: ["$ledger_account_id", "$$ledger_account_id"],
													},
												],
											},
										],
									},
									then: "$amount",
									else: 0,
								},
							},
							credit_balance: {
								$cond: {
									if: {
										$or: [
											{
												$and: [
													{ $in: ["$receipt_payment_type", ["P", "BR"]] },
													{ $lt: ["$voucher_date", txt_to_date] },
													{ $eq: ["$bank_id", "$$ledger_account_id"] },
												],
											},
											{
												$and: [
													{ $in: ["$receipt_payment_type", ["R", "BP"]] },
													{ $lt: ["$voucher_date", txt_to_date] },
													{
														$eq: ["$ledger_account_id", "$$ledger_account_id"],
													},
												],
											},
										],
									},
									then: "$amount",
									else: 0,
								},
							},
							dr_cr_status: {
								//$cond: { if: { $in: [ "$transaction_type", ["PR", "DR"] ] }, then: "$plus_qty", else: 0 }
								$cond: {
									if: {
										$or: [
											{
												$and: [
													{ $eq: ["$bank_id", "$$ledger_account_id"] },
													{ $eq: ["$receipt_payment_type", "R"] },
												],
											},
											{
												$and: [
													{
														$eq: ["$ledger_account_id", "$$ledger_account_id"],
													},
													{ $eq: ["$receipt_payment_type", "P"] },
												],
											},
										],
									},
									then: "Dr",
									else: "Cr",
								},
							},
						},
					},
					{
						$group: {
							_id: "$ledger_account_id",
							debit_balance: { $sum: "$debit_balance" },
							credit_balance: { $sum: "$credit_balance" },
						},
					},
				],
				as: "receipt_payments",
			},
		},
		{
			$unwind: {
				path: "$journals",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$unwind: {
				path: "$receipt_payments",
				preserveNullAndEmptyArrays: true,
			},
		},
		{ $addFields: { dr_cr_status: "$ledger_account_details.dr_cr_status" } },
		{
			$group: {
				_id: "$vendor_id",
				//sales_no: { $addToSet: "$salesNo" },
				company_name: { $addToSet: "$company_name" },
				sumPurchase_value: { $first: { $first: "$sumPurchase_value" } },
				// receipt_payments:{$addToSet:"$receipt_payments"},
				// journals:{$addToSet:"$journals"},

				//  closing_balance: { $first: "$closing_balance" },

				dr_cr_status: { $first: "$dr_cr_status" },
				// action_items: { $first: "$action_items" },
				ledger_account_id: { $first: "$ledger_acc_id" },
				receipt_payments_dr: {
					$first: { $ifNull: ["$receipt_payments.debit_balance", 0] },
				},
				receipt_payments_cr: {
					$first: { $ifNull: ["$receipt_payments.credit_balance", 0] },
				},
				journals_dr: { $first: { $ifNull: ["$journals.debit_balance", 0] } },
				journals_cr: { $first: { $ifNull: ["$journals.credit_balance", 0] } },
				opening_balance: { $first: "$ledger_account_details.opening_balance" },
			},
		},

		{
			$addFields: {
				closing_balance: {
					$cond: {
						if: { $gt: ["$opening_balance", 0] },
						then: {
							$cond: {
								if: { $eq: ["$dr_cr_status", "Dr"] },
								then: {
									$subtract: [
										{
											$sum: [
												"$opening_balance",
												"$journals_dr",
												"$receipt_payments_dr",
											],
										},
										{ $sum: ["$journals_cr", "$receipt_payments_cr"] },
									],
								},
								else: {
									$subtract: [
										{
											$sum: [
												"$opening_balance",
												"$journals_cr",
												"$receipt_payments_cr",
											],
										},
										{ $sum: ["$journals_dr", "$receipt_payments_dr"] },
									],
								},
							},
						},
						else: {
							$subtract: [
								{ $sum: ["$journals_dr", "$receipt_payments_dr"] },
								{ $sum: ["$journals_cr", "$receipt_payments_cr"] },
							],
							// {
							//   $sum: ["$ledger_account_details.opening_balance",
							//     { $sum: [0, "$receipt_payments.credit_balance",] }]
							// },
							// { $sum: [0, "$receipt_payments.debit_balance","$netValue"] }]
						},
					},
				},
			},
		},

		// // ////DR CR status/////////////////////////////////////
		// {
		//   $addFields: {
		//     current_dr_cr: {
		//       $switch: {
		//         branches: [
		//           {
		//             //// Case 1 op!=0 && o.drcr = dr
		//             case: {
		//               $and: [
		//                 { $ne: ["$opening_balance", 0] },
		//                 { $eq: ["$dr_cr_status", "Dr"] },
		//                 {
		//                   $gte: [
		//                     {
		//                       $subtract: [
		//                         {
		//                           $sum: [
		//                             "$opening_balance",
		//                             "$receipt_payments_dr",
		//                             "$journals_dr",

		//                           ],
		//                         },
		//                         { $sum: ["$journals_cr", "$receipt_payments_cr"] },
		//                       ],
		//                     },
		//                     0,
		//                   ],
		//                 },
		//               ],
		//             },
		//             then: "Dr",
		//           },

		//           {
		//             //// Case 1.2 op!=0 && o.drcr = dr && cr>dr
		//             case: {
		//               $and: [
		//                 { $ne: ["$opening_balance", 0] },
		//                 { $eq: ["$dr_cr_status", "Dr"] },
		//                 {
		//                   $gte: [
		//                     {
		//                       $subtract: [
		//                         { $sum: ["$journals_cr", "$receipt_payments_cr"] },
		//                         {
		//                           $sum: [
		//                             "$opening_balance",
		//                             "$receipt_payments_dr",
		//                             "$journals_dr",

		//                           ],
		//                         },
		//                       ],
		//                     },
		//                     0,
		//                   ],
		//                 },
		//               ],
		//             },
		//             then: "Cr",
		//           },

		//           //////case 2op!=0 && o.drcr =cr
		//           {
		//             case: {
		//               $and: [
		//                 { $ne: ["$opening_balance", 0] },
		//                 { $eq: ["$dr_cr_status", "Cr"] },
		//                 {
		//                   $gte: [
		//                     {
		//                       $subtract: [
		//                         {
		//                           $sum: [
		//                             "$opening_balance",
		//                             "$receipt_payments.cr",
		//                             "$journals_cr",
		//                           ],
		//                         },
		//                         {
		//                           $sum: [
		//                             "$journals_dr",
		//                             "$receipt_payments.dr",

		//                           ],
		//                         },
		//                       ],
		//                     },
		//                     0,
		//                   ],
		//                 },
		//               ],
		//             },
		//             then: "Cr",
		//           },
		//           //// Case 2.1 op!=0 && o.drcr = dr && dr>cr
		//           {
		//             case: {
		//               $and: [
		//                 { $ne: ["$opening_balance", 0] },
		//                 { $eq: ["$dr_cr_status", "Cr"] },
		//                 {
		//                   $gte: [
		//                     {
		//                       $subtract: [
		//                         {
		//                           $sum: [
		//                             "$journals_dr",
		//                             "$receipt_payments.dr",

		//                           ],
		//                         },
		//                         {
		//                           $sum: [
		//                             "$opening_balance",
		//                             "$receipt_payments.cr",
		//                             "$journals_cr",
		//                           ],
		//                         },
		//                       ],
		//                     },
		//                     0,
		//                   ],
		//                 },
		//               ],
		//             },
		//             then: "Cr",
		//           },
		//           //////Case 3 op=0
		//           {
		//             case: {
		//               $and: [
		//                 { $eq: ["$opening_balance", 0] },
		//                 {
		//                   $gte: [
		//                     {
		//                       $subtract: [
		//                         {
		//                           $sum: [
		//                             "$journals_dr",
		//                             "$receipt_payments.dr",
		//                             "$sumSalesOrderNetValue",
		//                           ],
		//                         },
		//                         { $sum: ["$journals_cr", "$receipt_payments.cr"] },
		//                       ],
		//                     },
		//                     0,
		//                   ],
		//                 },
		//               ],
		//             },
		//             then: "Dr",
		//           },
		//           {
		//             case: {
		//               $and: [
		//                 { $eq: ["$opening_balance", 0] },
		//                 {
		//                   $gte: [
		//                     {
		//                       $subtract: [
		//                         { $sum: ["$journals_cr", "$receipt_payments.cr"] },
		//                         {
		//                           $sum: [
		//                             "$journals_dr",
		//                             "$receipt_payments.dr",
		//                             "$sumSalesOrderNetValue",
		//                           ],
		//                         },
		//                       ],
		//                     },
		//                     0,
		//                   ],
		//                 },
		//               ],
		//             },
		//             then: "Cr",
		//           },
		//         ],
		//         default: "-",
		//       },
		//     },
		//   },
		// },
		{
			$addFields: {

				current_dr_cr: {
					$switch: {
						branches: [
							{
								//// Case 1 op!=0 && o.drcr = dr
								case: {
									$and: [
										{ $ne: ["$opening_balance", 0] },
										{ $eq: ["$dr_cr_status", "Dr"] },
										{
											$gte: [
												{
													$subtract: [
														{ $sum: ["$opening_balance", "$receipt_payments_dr", "$journals_dr"] },
														{ $sum: ["$journals_cr", "$receipt_payments_cr"] }
													]
												}, 0]
										}
									]
								},
								then: "Dr"
							},
							{
								//// Case 1.1 op!=0 && o.drcr = dr && cr>dr
								case: {
									$and: [
										{ $ne: ["$opening_balance", 0] },
										{ $eq: ["$dr_cr_status", "Dr"] },
										{
											$gte: [
												{
													$subtract: [
														{ $sum: ["$journals_cr", "$receipt_payments_cr"] },
														{ $sum: ["$opening_balance", "$receipt_payments_dr", "$journals_dr"] }

													]
												}, 0]
										}
									]
								},
								then: "Cr"
							},
							//////case 2op!=0 && o.drcr =cr 
							{
								case: {
									$and: [
										{ $ne: ["$opening_balance", 0] },
										{ $eq: ["$dr_cr_status", "Cr"] },
										{
											$gte: [
												{
													$subtract: [
														{ $sum: ["$opening_balance", "$receipt_payments_cr", "$journals_cr"] },
														{ $sum: ["$receipt_payments_dr", "$journals_dr"] }
													]
												}, 0]
										}
									]
								},
								then: "Cr"
							},
							{
								case: {
									$and: [
										{ $ne: ["$opening_balance", 0] },
										{ $eq: ["$dr_cr_status", "Cr"] },
										{
											$gte: [
												{
													$subtract: [
														{ $sum: ["$receipt_payments_dr", "$journals_dr"] },
														{ $sum: ["$opening_balance", "$receipt_payments_cr", "$journals_cr"] },

													]
												}, 0]
										}
									]
								},
								then: "Dr"
							},
							//////Case 3: op=0 && Dr-Cr>0
							{
								case: {
									$and: [
										{ $eq: ["$opening_balance", 0] },
										{
											$gte: [
												{
													$subtract: [
														{ $sum: ["$receipt_payments_dr", "$journals_dr"] },
														{ $sum: ["$receipt_payments_cr", "$journals_cr"] }
													]
												}, 0]
										}
									]
								},
								then: "Dr"
							},

							//////Case 4: op=0 && Dr-Cr<0
							{
								case: {
									$and: [
										{ $eq: ["$opening_balance", 0] },
										{
											$gte: [
												{
													$subtract: [
														{ $sum: ["$receipt_payments_cr", "$journals_cr"] },
														{ $sum: ["$receipt_payments_dr", "$journals_dr"] }
													]
												}, 0]
										}
									]
								},
								then: "Cr"
							}
						],
						default: "-"
					}
				},
				check: 2
			}
		},
	]);

	if (PurchaseData) {
		console.log("r", PurchaseData);
		return res.status(200).json(PurchaseData);
	} else {
		console.log("e");

		return res.status(200).json([]);
	}
};


const PurchaseListForReturn = async (req, res) => {
	let condition = { deleted_by_id: 0 };

	const { bill_no, bill_from_date, bill_to_date, vendor_id, showroom_warehouse_id, item } = req.body;

	// Details by Name
	if (vendor_id) { condition = { ...condition, 'vendor_id': vendor_id } }

	if (showroom_warehouse_id) { condition = { ...condition, 'showroom_warehouse_id': showroom_warehouse_id } } // Matching exact text but incase-sensitive

	if (bill_no) {
		condition = { ...condition, 'grn_details.bill_no': new RegExp(bill_no, 'i') };
	}

	// if(item) {
	// 	condition = { ...condition, 'item_name_details.item': {$regex : item, $options:'i'} };
	// }

	//For date search PURCHASE
	if (bill_from_date) {
		condition = { ...condition, 'grn_details.grn_date': bill_from_date };
	}
	if (bill_to_date) {
		condition = { ...condition, 'grn_details.grn_date': bill_to_date };
	}
	//both date filter
	if (bill_from_date && bill_to_date) {
		condition = { ...condition, 'grn_details.grn_date': { '$gte': (bill_from_date), '$lte': (bill_to_date) } };
	}


	let queryData = await purchase.aggregate([
		{ $match: { ...condition, approve_id: { $gt: 0 } } },
		{
			"$unwind": {
				path: "$item_details",
				preserveNullAndEmptyArrays: true
			}
		},

		{
			$project: {
				transaction_id: 1,
				vendor_id: 1,
				module: 1,
				po_date: 1,
				grn_no: 1,
				"grn_details.grn_no": 1,
				"grn_details.grn_date": 1,
				"grn_details.bill_no": 1,
				"grn_details.bill_date": 1,
				"grn_details.bill_value": 1,
				"item_details.quantity": 1,
				"item_details.item_id": 1,
				"item_details.rate": 1,
				"item_details.gst_value": 1,
				"item_details.disc_value": 1,
				"received_item_details.receivedQty": 1,
				"received_item_details.uom_id": 1,
				"received_item_details.rate": 1,
				"received_item_details.gst_value": 1,

				grn_no: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$grn_no", else: "$grn_details.grn_no" }
				},

				quantity: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.quantity", else: "$received_item_details.receivedQty" }
				},
				rate: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.rate", else: "$received_item_details.rate" }
				},
				gst_value: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$item_details.gst_value", else: "$received_item_details.gst_value" }
				},
				purchase_id: {
					$cond: { if: { $in: ["$module", ["DIRECT PURCHASE"]] }, then: "$purchase_id", else: "$purchase_id" }
				},

			}
		},

		{
			$group: {
				_id: "$grn_no",
				itemIdData: { $addToSet: "$item_details.item_id" },
				bill_no: { $addToSet: "$grn_details.bill_no" },
				bill_date: { $addToSet: "$grn_details.grn_date" },
				vendor_id: { $addToSet: "$vendor_id" },
				quantity: { $addToSet: "$quantity" },
				rate: { $addToSet: "$rate" },
				gst_value: { $addToSet: "$gst_value" },
				disc_value: { $addToSet: "$item_details.disc_value" },
				module: { $addToSet: "$module" },
				bill_value: { $first: "$grn_details.bill_value" },
				purchase_id: { $addToSet: "$purchase_id" },

			}
		},

		{
			$lookup: {
				from: "t_500_vendors",
				let: { "purchase_vendor_id": "$vendor_id" },
				pipeline: [
					{
						$match:
							{ $expr: { $in: ["$vendor_id", "$$purchase_vendor_id"] }, },
					},
					{ $project: { "company_name": 1, "_id": 0 } }
				],
				as: "vendor_details"
			}
		},

		{
			$addFields: {
				vendor_name: { $first: "$vendor_details.company_name" },
			},
		},
		{ $unset: ["vendor_details"] },

		{
			"$unwind": {
				path: "$itemIdData",
				preserveNullAndEmptyArrays: true
			}
		},

		{
			$lookup: {
				from: "t_100_items",
				let: { "item_id": "$itemIdData"},
				
				pipeline: [
					{
						$match:{ 
							
							$expr: {
								$and: [
									{ $eq: ["$item_id", "$$item_id"] },
								  ]
								}, 
						},
					},
					{ $project: { "item": 1, "_id": 0 } }
				],
				as: "item_name_details"
			}
		},
		{
			$addFields: {
				item_name: { $first: "$item_name_details.item" },
			},
		},
		{ $unset: ["item_name_details"] },
		{
			$match: {
				item_name: { $regex: item, $options: "i" }
			}
		}
	])

	if (queryData) {
		let returnArr = [];

		for (let iCtr = 0; iCtr < queryData.length; iCtr++) {
			// console.log(queryData[iCtr])

			queryData[iCtr]['bill_no'] = queryData[iCtr]['bill_no'][0]
			queryData[iCtr]['bill_date'] = queryData[iCtr]['bill_date'][0]
			queryData[iCtr]['rate'] = queryData[iCtr]['rate'][0]
			queryData[iCtr]['quantity'] = queryData[iCtr]['quantity'][0]
			queryData[iCtr]['gst_value'] = queryData[iCtr]['gst_value'][0]
			queryData[iCtr]['module'] = queryData[iCtr]['module'][0]
			queryData[iCtr]['bill_value'] = queryData[iCtr]['bill_value'][0]
			queryData[iCtr]['purchase_id'] = queryData[iCtr]['purchase_id'][0]
			queryData[iCtr]['item_name']= queryData[iCtr]['item_name']

			if (Array.isArray(queryData[iCtr]['_id'])) {

				for (let iGRN = 0; iGRN < queryData[iCtr]['_id'].length; iGRN++) {
					let grn = queryData[iCtr]['_id'][iGRN];
					let bill_no = queryData[iCtr]['bill_no'][iGRN];
					let bill_date = queryData[iCtr]['bill_date'][iGRN];
					let vendor_name = queryData[iCtr]['vendor_name'];
					let rate = queryData[iCtr]['rate'][iGRN];
					let quantity = queryData[iCtr]['quantity'][iGRN];
					let gst_value = queryData[iCtr]['gst_value'][iGRN];
					let module = queryData[iCtr]['module'];
					let bill_value = queryData[iCtr]['bill_value'];
					let purchase_id = queryData[iCtr]['purchase_id'];
					let item_name =queryData[iCtr]['item_name'];





					let obj = { item_name, grn: grn, bill_no: bill_no, bill_date: bill_date, vendor_name: vendor_name, rate: rate, quantity: quantity, gst_value: gst_value, disc_value: 0, module: module, bill_value: bill_value, purchase_id: purchase_id };

					returnArr.push(obj);
				}
			}
			else {
				let grn = queryData[iCtr]['_id'];
				let bill_no = queryData[iCtr]['bill_no'][0];
				let bill_date = queryData[iCtr]['bill_date'][0];
				let vendor_name = queryData[iCtr]['vendor_name'];
				let rate = queryData[iCtr]['rate'][0];
				let quantity = queryData[iCtr]['quantity'][0];

				let gst_value = queryData[iCtr]['gst_value'][0];
				let disc_value = queryData[iCtr]['disc_value'][0];
				let module = queryData[iCtr]['module'];
				let bill_value = queryData[iCtr]['bill_value'];
				let purchase_id = queryData[iCtr]['purchase_id'];
				let item_name =queryData[iCtr]['item_name'];
			
				let obj = { item_name,grn: grn, bill_no: bill_no, bill_date: bill_date, vendor_name: vendor_name, rate: rate, quantity: quantity, gst_value: gst_value, disc_value: disc_value, module: module, bill_value: bill_value, purchase_id: purchase_id };

				returnArr.push(obj);
			}


		}

		return res.status(200).send(returnArr);
	}
	else {
		return res.status(200).json([]);
	}


};




module.exports = { PurchaseRegisterList, PurchaseJournalReport, out_standing_purchase, PurchaseListForReturn };
