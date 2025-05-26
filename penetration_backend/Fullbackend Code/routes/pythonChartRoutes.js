const express = require("express");
const axios = require("axios");
const router = express.Router();

// Route to communicate with Python API
router.get("/generate-chart", async (req, res) => {
  try {
    // Call the Python Flask API
    const response = await axios.get("http://localhost:5001/generate_chart");
    
    // Send back the chart data to frontend
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching chart data:", error.message);
    res.status(500).json({ message: "Failed to fetch chart data" });
  }
});

module.exports = router;
