require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const owasprouter = express.Router();
const owaspController = require("../controllers/owaspController");



let io; // Declare io globally

const setSocket = (socket) => {
  io = socket; // Assign socket instance globally
};



const app = express();
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"] }));
app.use(express.json());

const ZAP_API_KEY = process.env.ZAP_API_KEY;
const ZAP_BASE_URL = process.env.ZAP_BASE_URL || "http://localhost:8080";

let isScanning = false;
let spiderProgress = 0;
let activeScanProgress = 0;
let paramsScanProgress = 0;
let scanResults = [];
let safetyPercentage = "Calculating...";
let targetUrl = "";

const severityWeight = { High: 100, Medium: 50, Low: 25, Informational: 0 };

const calculateSafetyPercentage = () => {
  if (scanResults.length === 0) return "100% Safe";

  let totalWeight = 0;
  let maxPossibleWeight = scanResults.length * 75;

  scanResults.forEach((issue) => {
    const weight = severityWeight[issue.risk] || 0;
    totalWeight += weight;
  });

  maxPossibleWeight = Math.max(200, maxPossibleWeight);

  let riskFactor = Math.min(1, totalWeight / maxPossibleWeight);
  let safetyScore = Math.max(0, (1 - riskFactor) * 100);

  if (totalWeight > 200) {
    safetyScore *= 0.85;
  } else if (totalWeight > 100) {
    safetyScore *= 0.90;
  }

  return `${safetyScore.toFixed(2)}% Safe`;
};

const performScan = async (target, scanType, trackStatus, extraParams = {}) => {
  try {
    const response = await axios.get(`${ZAP_BASE_URL}/JSON/${scanType}/action/scan/`, {
      params: { apikey: ZAP_API_KEY, url: target, ...extraParams },
    });

    if (response.data.scan) {
      await trackStatus(response.data.scan, scanType);
    } else {
      console.error(`${scanType} Scan Error: Invalid Response`, response.data);
    }
  } catch (error) {
    console.error(`${scanType} Scan Error:`, error.message);
  }
};

const performParamsScan = async (target) => {
  try {
    console.log("Starting Params Scan...");

    await axios.get(`${ZAP_BASE_URL}/JSON/pscan/action/enableAllScanners/`, {
      params: { apikey: ZAP_API_KEY },
    });

    console.log("All Passive Scanners Enabled.");

    paramsScanProgress = 100;
    io.emit("progress", { spider: spiderProgress, activeScan: activeScanProgress, paramsScan: paramsScanProgress, isScanning });
  } catch (error) {
    console.error("Params Scan Error:", error.message);
  }
};

const trackStatus = async (scanId, scanType, progressUpdater) => {
  let status = "0";
  do {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const response = await axios.get(`${ZAP_BASE_URL}/JSON/${scanType}/view/status/`, {
        params: { apikey: ZAP_API_KEY, scanId },
      });
      status = response.data.status;
      progressUpdater(parseInt(status));
      io.emit("progress", { spider: spiderProgress, activeScan: activeScanProgress, paramsScan: paramsScanProgress, isScanning });
    } catch (error) {
      console.error(`Tracking ${scanType} Status Error:`, error.message);
      break;
    }
  } while (status !== "100");
};

const getScanAlerts = async (target) => {
  try {
    const response = await axios.get(`${ZAP_BASE_URL}/JSON/alert/view/alerts/`, {
      params: { apikey: ZAP_API_KEY, baseurl: target },
    });
    return response.data.alerts || [];
  } catch (error) {
    console.error("Error fetching scan alerts:", error.message);
    return [];
  }
};


let lastScannedTarget = ""; // Store the last scanned target URL

const getParamsAlerts = async (target) => {
  try {
    if (!target) {
      console.error("No target provided for fetching parameter scan alerts.");
      return [];
    }

    const response = await axios.get(`${ZAP_BASE_URL}/JSON/alert/view/alerts/`, {
      params: { apikey: ZAP_API_KEY, baseurl: target },
    });

    const allAlerts = response.data.alerts || [];
    const paramsAlerts = allAlerts.filter(alert =>
      ["10020", "90022", "10044", "10015"].includes(alert.pluginId) // Filter relevant alerts
    );

    console.log("Fetched parameter scan alerts:", paramsAlerts);
    return paramsAlerts;
  } catch (error) {
    console.error("Error fetching parameter scan alerts:", error.message);
    return [];
  }
};

  owasprouter.post("/scan", async (req, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).json({ error: "Target URL is required" });

  isScanning = true;
  lastScannedTarget = target; // Store the scanned target
  console.log(lastScannedTarget);
  spiderProgress = activeScanProgress = paramsScanProgress = 0;
  scanResults = [];
  safetyPercentage = "Calculating...";

  try {
    await performScan(target, "spider", (id) => trackStatus(id, "spider", (val) => (spiderProgress = val)));
    await performScan(target, "ascan", (id) => trackStatus(id, "ascan", (val) => (activeScanProgress = val)));
    await performParamsScan(target);

   

    scanResults = await getScanAlerts(target);
    safetyPercentage = calculateSafetyPercentage();
    isScanning = false;

    // Save the scan result before sending the response
    await owaspController.createScan({ body: { target: lastScannedTarget, scanResults, paramsAlerts: [], safetyPercentage } });

    io.emit("progress", { spider: 100, activeScan: 100, paramsScan: 100, isScanning, scanResults, safetyPercentage });
    res.json({ success: true, message: "Scan completed!", safetyPercentage, scanResults });

  } catch (error) {
    console.error("Scan Error:", error.message);
    isScanning = false;
    res.status(500).json({ error: "Scan process failed." });
  }
});


owasprouter.get("/scan-results", async (req, res) => {
  try {
    if (!lastScannedTarget) {
      return res.status(400).json({ error: "No scan has been performed yet. Start a scan first." });
    }

    const paramsAlerts = await getParamsAlerts(lastScannedTarget); // Fetch parameter-based alerts
    res.json({ alerts: scanResults, paramsAlerts, safetyPercentage });
  } catch (error) {
    console.error("Error fetching scan results:", error.message);
    res.status(500).json({ error: "Failed to fetch scan results" });
  }
});


// const PORT = process.env.PORT || 5000;
// const server = http.createServer(router);
// const io = new Server(server, { cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] } });

// server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

// module.exports = router;

module.exports = { owasprouter, setSocket };
