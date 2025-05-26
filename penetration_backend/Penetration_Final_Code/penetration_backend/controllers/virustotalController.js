const Virustotal = require("../models/virustotalScan");

const createScan = async ({ body }) => {
  const { target, scanResults, overallSafety } = body;

  if (!target || !scanResults) {
    console.error("Target and scan results are required");
    throw new Error("Target and scan results are required");
  }

  try {
    const newScan = new Virustotal({
      target,
      scanResults,
      safetyPercentage: overallSafety,
    });

    await newScan.save();
    console.log("Scan result saved successfully");
    return newScan;
  } catch (error) {
    console.error("Error saving scan result:", error.message);
    throw new Error("Failed to save scan result");
  }
};

const getAllScans = async (req, res) => {
  try {
    const scans = await Virustotal.find();
    res.status(200).json(scans);
  } catch (error) {
    console.error("Error fetching scan data:", error.message);
    res.status(500).json({ error: "Failed to fetch scan data" });
  }
};

const getScanById = async (req, res) => {
  const { id } = req.params;

  try {
    const scan = await Virustotal.findById(id);
    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }
    res.status(200).json(scan);
  } catch (error) {
    console.error("Error fetching scan by ID:", error.message);
    res.status(500).json({ error: "Failed to fetch scan by ID" });
  }
};

module.exports = { createScan, getAllScans, getScanById };
