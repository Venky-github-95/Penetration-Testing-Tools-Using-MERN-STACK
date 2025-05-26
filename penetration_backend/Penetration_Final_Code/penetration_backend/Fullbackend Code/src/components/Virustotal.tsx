import React, { useState } from "react";

interface ScanIssue {
  name: string;
  result: string;
  color: string;
}

const Virustotal: React.FC = () => {
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
      const response = await fetch("http://localhost:5002/api/virustotal/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      const data = await response.json();
      if (response.ok) {
        setScanResults(data.scanResults);
        setSafetyPercentage(data.overallSafety);
      } else {
        setError(data.error || "Failed to scan the URL. Please try again.");
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
        <h2 className="text-2xl font-bold text-white">VirusTotal Scanner</h2>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="https://example.com"
          className="w-full p-2 bg-gray-700 text-white border rounded-md mt-4"
        />
        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`mt-4 px-6 py-2 rounded-md text-white ${isScanning ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"}`}
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
              <li
                key={index}
                className={`p-3 rounded-md mt-2 ${
                  issue.color === "red" ? "bg-red-700" :
                  issue.color === "orange" ? "bg-orange-700" :
                  issue.color === "yellow" ? "bg-yellow-600" :
                  issue.color === "green" ? "bg-green-700" : "bg-gray-700"
                }`}
              >
                <strong>{issue.name}</strong>: {issue.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Virustotal;
