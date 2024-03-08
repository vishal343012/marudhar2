const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

const storageSchema = new mongoose.Schema({
  ls_id: { type: Number, required: false, trim: true, },
  ledgerId: { type: Number, required: false, trim: true, default: 0 },
  ledgerGroupId: { type: Number, required: false, trim: true, default: 0 },
  typeId: { type: Number, required: false, trim: true, default: 0 },
  type: { type: String, required: false, trim: true, default: 0 },
  ledgerName: { type: String, required: false, trim: true, default: 0 },
  openCrDrStatus: { type: String, required: false, trim: true, },
  closeCrDrStatus: { type: String, required: false, trim: true, },
  openingBalance: { type: Number, required: false, trim: true, default: 0 },
  closingBalance: { type: Number, required: false, trim: true, default: 0 },
  updatedDate: { type: Number, required: false, trim: true, default: Date.now },
  financialYear: { type: String, required: false, trim: true, },
});


storageSchema.plugin(autoIncrement.plugin, { model: "t_900_ledgerstorage", field: 'ls_id', startAt: 1, incrementBy: 1 });

const itemStockSchema = new mongoose.Schema({
  istock_id: { type: Number, required: false, trim: true, },
  item_id: { type: Number, required: false, trim: true, default: 0 },
  brand_id: { type: Number, required: false, trim: true, default: 0 },
  category_id: { type: Number, required: false, trim: true, default: 0 },
  showroom_warehouse_id: { type: Number, required: false, trim: true, default: 0 },
  item: { type: String, required: false, trim: true, default: 0 },
  closingStock: { type: Number, required: false, trim: true, default: 0 },
  sumPurchaseQty: { type: Number, required: false, trim: true, default: 0 },
  sumPurchase_Net_Value: { type: Number, required: false, trim: true, default: 0 },
  item_date: { type: Number, required: false, trim: true },
  inserted_date: { type: Number, required: true, trim: true, default: Date.now },
});
itemStockSchema.plugin(autoIncrement.plugin, { model: "t_900_itemStocks", field: 'istock_id', startAt: 1, incrementBy: 1 });

const storage = mongoose.model("t_900_ledgerstorage", storageSchema);
const itemStock = mongoose.model("t_900_itemStocks", itemStockSchema)

module.exports = { storage, storageSchema,itemStock,itemStockSchema }