const UrlScan = require("../models/urlscanScan");

const createScan = async ({ body }) => {
  const { url, scanResults, safetyPercentage } = body;

  if (!url || !scanResults) {
    console.error("URL and scan results are required");
    throw new Error("URL and scan results are required");
  }

  try {
    const newScan = new UrlScan({
      url,
      scanResults,
      safetyPercentage,
    });

    await newScan.save();
    console.log("URL scan result saved successfully");
    return newScan;
  } catch (error) {
    console.error("Error saving URL scan result:", error.message);
    throw new Error("Failed to save URL scan result");
  }
};

const getAllScans = async (req, res) => {
  try {
    const scans = await UrlScan.find();
    res.status(200).json(scans);
  } catch (error) {
    console.error("Error fetching URL scan data:", error.message);
    res.status(500).json({ error: "Failed to fetch URL scan data" });
  }
};

const getScanById = async (req, res) => {
  const { id } = req.params;

  try {
    const scan = await UrlScan.findById(id);
    if (!scan) {
      return res.status(404).json({ error: "URL Scan not found" });
    }
    res.status(200).json(scan);
  } catch (error) {
    console.error("Error fetching URL scan by ID:", error.message);
    res.status(500).json({ error: "Failed to fetch URL scan by ID" });
  }
};

module.exports = { createScan, getAllScans, getScanById };
