const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const urlscanrouter = express.Router();
const urlscanController = require("../controllers/urlscanController");
const UrlScan = require("../models/urlscanScan");

const API_KEY = process.env.URLSCAN_API_KEY;

urlscanrouter.post("/scan", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ message: "URL is required" });
  }

  try {
    const scanResponse = await axios.post(
      "https://urlscan.io/api/v1/scan/",
      { url, visibility: "public" },
      {
        headers: {
          "Content-Type": "application/json",
          "API-Key": API_KEY,
        },
      }
    );

    const resultUrl = scanResponse.data.api;

    setTimeout(async () => {
      try {
        const resultResponse = await axios.get(resultUrl, {
          headers: {
            "API-Key": API_KEY,
          },
        });

        const data = resultResponse.data;
        if (!data.stats) {
          throw new Error("Invalid scan results");
        }

        const scanResults = [
          { name: "URL", result: data.task.url },
          { name: "Status", result: data.task.status },
          { name: "IPv6 Percentage", result: data.stats.IPv6Percentage || "N/A" },
          { name: "Secure Requests", result: data.stats.secureRequests || "N/A" },
          { name: "Total Links", result: data.stats.totalLinks || "N/A" },
          { name: "Unique Countries", result: data.stats.uniqCountries || "N/A" },
          { name: "Malicious Detected", result: data.stats.malicious || "0" },
          { name: "Secure Percentage", result: data.stats.securePercentage || "N/A" },
          { name: "Server Stats", result: JSON.stringify(data.stats.serverStats || []) },
          { name: "Resource Stats", result: JSON.stringify(data.stats.resourceStats || []) },
          { name: "TLS Stats", result: JSON.stringify(data.stats.tlsStats || []) },
          { name: "Protocol Stats", result: JSON.stringify(data.stats.protocolStats || []) },
        ];

        let safetyScore = 100;
        if (parseInt(data.stats.malicious) > 0) safetyScore -= 30;
        if (parseInt(data.stats.IPv6Percentage) < 50) safetyScore -= 10;
        if (parseInt(data.stats.secureRequests) < 5) safetyScore -= 20;
        if (parseInt(data.stats.uniqCountries) > 3) safetyScore -= 10;
        if (parseInt(data.stats.securePercentage) < 50) safetyScore -= 20;

        safetyScore = Math.max(safetyScore, 0);

        const scanData = new UrlScan({
          target: data.task.url, // ✅ Use target instead of url
          scanResults: scanResults,
          safetyPercentage: `${safetyScore}`,
          timestamp: new Date(),
        });

        await scanData.save();

        res.json({
          scanResults,
          safetyPercentage: `${safetyScore}`,
        });
      } catch (error) {
        console.error("Fetch Scan Results Error:", error.message);
        res.status(500).json({ message: "Failed to fetch scan results" });
      }
    }, 40000);
  } catch (error) {
    console.error("Initiate Scan Error:", error.message);
    res.status(500).json({ message: "Failed to initiate scan" });
  }
});

module.exports = urlscanrouter;
