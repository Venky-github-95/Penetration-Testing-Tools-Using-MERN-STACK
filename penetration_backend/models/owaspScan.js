// const mongoose = require("mongoose");

// const scanSchema = new mongoose.Schema({
//   target: { type: String, required: true },
//   urls: { type: Array, default: [] },
//   scanResults: { type: Array, default: [] },
//   paramsAlerts: { type: Array, default: [] },
//   safetyPercentage: { type: String, default: "Calculating..." },
//   date: { type: Date, default: Date.now },
//   time: { type: String, default: () => new Date().toLocaleTimeString() },
// });

// module.exports = mongoose.model("OwaspScan", scanSchema);

const mongoose = require("mongoose");

const owaspScanSchema = new mongoose.Schema({
  target: { type: String, required: true },
  urls: { type: Array, default: [] },
  scanResults: { type: Array, default: [] },
  paramsAlerts: { type: Array, default: [] },
  safetyPercentage: { type: String, default: "Calculating..." },
  date: { type: Date, default: Date.now },
  time: { type: String, default: () => new Date().toLocaleTimeString() },
});

module.exports = mongoose.models.OwaspScan || mongoose.model("OwaspScan", owaspScanSchema);
