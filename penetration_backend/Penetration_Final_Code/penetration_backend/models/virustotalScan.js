// const mongoose = require("mongoose");

// const scanSchema = new mongoose.Schema({
//   target: { type: String, required: true },
//   urls: { type: Array, default: [] },
//   scanResults: { type: Array, default: [] },
//   safetyPercentage: { type: String, default: "Calculating..." },
//   date: { type: Date, default: Date.now },
//   time: { type: String, default: () => new Date().toLocaleTimeString() },
// });

// module.exports = mongoose.model("Virustotal", scanSchema);


const mongoose = require("mongoose");

const virustotalScanSchema = new mongoose.Schema({
  target: { type: String, required: true },
  urls: { type: Array, default: [] },
  scanResults: { type: Array, default: [] },
  safetyPercentage: { type: String, default: "Calculating..." },
  date: { type: Date, default: Date.now },
  time: { type: String, default: () => new Date().toLocaleTimeString() },
});

module.exports = mongoose.models.VirustotalScan || mongoose.model("VirustotalScan", virustotalScanSchema);
