const express = require("express");
const router = express.Router();
const OwaspScan = require("../models/OwaspScan");
const VirustotalScan = require("../models/virustotalScan");
const UrlscanScan = require("../models/urlscanScan");

// GET all security tools
router.get("/security-tools", async (req, res) => {
  try {
    const owaspTools = await OwaspScan.find().lean();
    const virustotalTools = await VirustotalScan.find().lean();
    const urlscanTools = await UrlscanScan.find().lean();

    // Format data and add category field
    const formattedTools = [
      ...owaspTools.map(tool => ({ ...tool, category: "owasp" })),
      ...virustotalTools.map(tool => ({ ...tool, category: "virustotal" })),
      ...urlscanTools.map(tool => ({ ...tool, category: "urlscanio" })),
    ];

    res.json(formattedTools);
  } catch (error) {
    console.error("Error fetching security tools:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET essential fields for PDF generation
router.get("/security-tools/pdf", async (req, res) => {
  try {



    // Fetch VirusTotal data with only required fields
    const virustotalTools = await VirustotalScan.find(
      {},
      { target: 1, scanResults: 1, safetyPercentage: 1, _id: 0 }
    ).lean();

    // Format VirusTotal data for PDF
    const formattedVirusTotal = virustotalTools.map((tool) => ({
      ...tool,
      category: "virustotal", // Add category field
      virusTotalResults: tool.scanResults.map((result) => ({
        name: result.name,
        virusTotalResult: result.result,
      })),
    }));





  // Fetch OWASP data with only required fields
const owaspTools = await OwaspScan.find({}, { target: 1, scanResults: 1, _id: 0 }).lean();

// Format OWASP data for PDF with unique names
const formattedOwasp = owaspTools.map((tool) => {
  const uniqueFindings = {};

  tool.scanResults.forEach((result) => {
    if (!uniqueFindings[result.name]) {
      uniqueFindings[result.name] = {
        name: result.name, // Ensure uniqueness by name
        alert: result.alert,
        description: result.description,
        risk: result.risk,
        reference: result.reference,
        solution: result.solution,
        url: result.url,
      };
    }
  });

  return {
    ...tool,
    category: "owasp", // Add category field
    owaspResults: Object.values(uniqueFindings), // Convert object values to an array
  };
});


    // Fetch URLScan data with only required fields and limit scanResults to the first 7 entries
    const urlscanTools = await UrlscanScan.find(
      {},
      { target: 1, scanResults: { $slice: 7 }, safetyPercentage: 1, _id: 0 }
    ).lean();

    // Format URLScan data for PDF
    const formattedUrlscan = urlscanTools.map((tool) => ({
      ...tool,
      category: "urlscan", // Add category field
      urlScanResults: tool.scanResults.map((result) => ({
        name: result.name,
        urlScanResult: result.result,
      })),
    }));


    // Combine all data into a single array
    const formattedTools = [
      ...formattedVirusTotal,
      ...formattedOwasp,
      ...formattedUrlscan,
    ];

    res.json(formattedTools); // Send array of reports
  } catch (error) {
    console.error("Error fetching data for PDF:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
