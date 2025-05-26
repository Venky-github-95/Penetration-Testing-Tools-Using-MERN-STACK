require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const http = require("http");
const virustotalrouter = express.Router();
const virustotalController = require("../controllers/virustotalController");


let io; // Declare io globally

const setSocketVir = (socket) => {
  io = socket; // Assign socket instance globally
};

const app = express();
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"] }));
app.use(express.json());

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_BASE_URL = "https://www.virustotal.com/api/v3/urls";

let isScanning = false;
let overallSafety = "Calculating...";

const severityWeight = { High: 100, Medium: 50, Low: 25, Informational: 0, harmless: 0, undetected: 0, suspicious: 50, timeout: 25 };

const submitUrlForScan = async (target) => {
  try {
    const params = new URLSearchParams();
    params.append("url", target);

    const response = await axios.post(
      VIRUSTOTAL_BASE_URL,
      params.toString(),
      { headers: { "x-apikey": VIRUSTOTAL_API_KEY, "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data.data.id;
  } catch (error) {
    console.error("VirusTotal Scan Submission Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to submit URL to VirusTotal.");
  }
};

const getScanResults = async (scanId) => {
  try {
    let response;
    let retries = 40; // Increased retry limit

    do {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      response = await axios.get(`https://www.virustotal.com/api/v3/analyses/${scanId}`, {
        headers: { "x-apikey": VIRUSTOTAL_API_KEY },
      });
      retries--;
    } while (response.data.data.attributes.status !== "completed" && retries > 0);

    if (retries <= 0) {
      throw new Error("Scan timed out.");
    }

    return response.data.data.attributes.results || {};
  } catch (error) {
    console.error("VirusTotal Scan Results Error:", error.response?.data || error.message);
    throw new Error("Failed to retrieve scan results from VirusTotal.");
  }
};

const calculateOverallSafety = (results) => {
  if (!results || Object.keys(results).length === 0) {
    return "100% Safe";
  }

  let totalWeight = 0;
  let totalScanners = Object.keys(results).length;
  let maxPossibleWeight = totalScanners * severityWeight.High;

  Object.values(results).forEach((r) => {
    const dynamicWeight = r.score !== undefined ? r.score : severityWeight[r.category] !== undefined ? severityWeight[r.category] : 0;
    totalWeight += dynamicWeight;
  });

  maxPossibleWeight = Math.max(300, maxPossibleWeight);

  let riskFactor = Math.min(1, totalWeight / maxPossibleWeight);
  let safetyScore = Math.max(0, (1 - riskFactor) * 100);

  return `${safetyScore.toFixed(2)}% Safe`;
};

virustotalrouter.post("/scan", async (req, res) => {
  try {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Target URL is required" });

    isScanning = true;
    overallSafety = "Calculating...";

    const scanId = await submitUrlForScan(target);
    const results = await getScanResults(scanId);

    overallSafety = calculateOverallSafety(results);
    isScanning = false;

    const formattedResults = Object.entries(results).map(([name, result]) => ({ name, result: result.category }));

    await virustotalController.createScan({ body: { target, scanResults: formattedResults, overallSafety } });

    io.emit("progress", { isScanning, overallSafety, scanResults: formattedResults });

    res.json({ success: true, message: "Scan completed!", overallSafety, scanResults: formattedResults });
  } catch (error) {
    console.error("Scan Error:", error.message);
    isScanning = false;
    res.status(500).json({ error: error.message });
  }
});

virustotalrouter.get("/scan-progress", (req, res) => {
  res.json({ isScanning });
});

virustotalrouter.get("/scan-results", (req, res) => {
  res.json({ overallSafety });
});

// const PORT = process.env.PORT || 5000;
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] } });

// server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

module.exports = {virustotalrouter,setSocketVir};

