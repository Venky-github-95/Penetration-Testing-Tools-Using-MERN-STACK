import React, { useState } from "react";

interface ScanIssue {
  name: string;
  result: string | null;
}

const Urlscan: React.FC = () => {
  const [target, setTarget] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<ScanIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [safetyPercentage, setSafetyPercentage] = useState<string>("Calculating...");

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getColor = (name: string, result: string | null) => {
    if (!result) return "bg-gray-700";
    if (name.toLowerCase().includes("malicious") && parseInt(result) > 0) return "bg-red-600";
    if (name.toLowerCase().includes("secure") && parseInt(result) >= 50) return "bg-green-600";
    if (name.toLowerCase().includes("secure") && parseInt(result) < 50) return "bg-yellow-600";
    if (name.toLowerCase().includes("status") && result.toLowerCase() === "finished") return "bg-blue-600";
    if (name.toLowerCase().includes("unique countries") && parseInt(result) > 3) return "bg-orange-600";
    if (name.toLowerCase().includes("ipv6") && parseInt(result) < 50) return "bg-purple-600";
    if (name.toLowerCase().includes("malicious") && result.toLowerCase() === "true") return "bg-red-600";
    return "bg-gray-700";
  };

  const handleScan = async () => {
    if (!target) {
      setError("Please enter a URL to scan.");
      return;
    }
    if (!validateUrl(target)) {
      setError("Please enter a valid URL (e.g., https://example.com).");
      return;
    }

    setError(null);
    setIsScanning(true);
    setScanResults([]);
    setSafetyPercentage("Calculating...");

    try {
      const response = await fetch("http://localhost:5002/api/urlscan/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: target }),
      });

      const data = await response.json();
      if (response.ok) {
        setScanResults(data.scanResults);
        setSafetyPercentage(`${data.safetyPercentage}%`);
      } else {
        setError(data.message || "Failed to scan the URL. Please try again.");
      }
    } catch (error) {
      setError("Failed to connect to the server. Please check your network connection.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white">URLScan.io Scanner</h2>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="https://example.com"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-md mt-4"
        />
        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`mt-4 px-6 py-2 rounded-md text-white ${isScanning ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {isScanning ? "Scanning..." : "Start Scan"}
        </button>
      </div>

      {error && <div className="mt-4 bg-red-800 text-white p-3 rounded-md">{error}</div>}

      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-white">Overall Safety</h3>
        <p className="text-lg text-red-400 font-semibold">{safetyPercentage}</p>
      </div>

      {scanResults.length > 0 && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-white">Scan Results</h3>
          <ul className="text-white mt-4">
            {scanResults.map((issue, index) => (
              <li key={index} className={`p-3 rounded-md mt-2 ${getColor(issue.name, issue.result)}`}>
                <strong>{issue.name}</strong>: {issue.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Urlscan;
