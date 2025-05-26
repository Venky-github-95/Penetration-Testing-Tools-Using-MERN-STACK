const OwaspScan = require("../models/owaspScan");

const createScan = async ({ body }) => {
  const { target, scanResults, paramsAlerts, safetyPercentage } = body;

  if (!target) {
    console.error("Target URL is required");
    throw new Error("Target URL is required");
  }

  try {
    const newScan = new OwaspScan({
      target,
      urls: [target],
      scanResults,
      paramsAlerts,
      safetyPercentage,
    });

    await newScan.save();
    console.log("Scan data saved successfully");
    return newScan;
  } catch (error) {
    console.error("Error saving scan data:", error.message);
    throw new Error("Failed to save scan data");
  }
};

const getAllScans = async (req, res) => {
  try {
    const scans = await OwaspScan.find();
    res.status(200).json(scans);
  } catch (error) {
    console.error("Error fetching scan data:", error.message);
    res.status(500).json({ error: "Failed to fetch scan data" });
  }
};

const getScanById = async (req, res) => {
  const { id } = req.params;

  try {
    const scan = await OwaspScan.findById(id);
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
