// ZAp Frontend code Working code

import React, { useState, useEffect, ReactNode } from "react";
import { io } from "socket.io-client";

interface ScanIssue {
  alert: ReactNode;
  risk: ReactNode;
  url: ReactNode;
  reference: string | undefined;
  name: string;
  description: string;
  severity: "High" | "Medium" | "Low" | "Informational";
}

interface ProgressData {
  spider: number;
  activeScan: number;
  paramsScan: number;
  isScanning: boolean;
}

interface ScanResultsData {
  alerts: ScanIssue[];
  paramsAlerts: ScanIssue[];
  safetyPercentage?: string;
}




const Owasp: React.FC = () => {
  const [target, setTarget] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [spiderProgress, setSpiderProgress] = useState<number>(0);
  const [activeScanProgress, setActiveScanProgress] = useState<number>(0);
  const [paramsScanProgress, setParamsScanProgress] = useState<number>(0);
  const [scanResults, setScanResults] = useState<ScanIssue[]>([]);
  const [paramsScanResults, setParamsScanResults] = useState<ScanIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [safetyPercentage, setSafetyPercentage] = useState<string>("Calculating...");

  useEffect(() => {
    if (paramsScanResults.length > 0) {
      console.log("Parameter scan results updated:", paramsScanResults);
    }
  }, [paramsScanResults]);

  const validateUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?([\w.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return regex.test(url);
  };

  const handleScan = async (): Promise<void> => {
    if (!target) {
      setError("Please enter a target URL.");
      return;
    }

    if (!validateUrl(target)) {
      setError("Invalid URL. Use format: https://example.com");
      return;
    }

    setError(null);
    setIsScanning(true);
    setSpiderProgress(0);
    setActiveScanProgress(0);
    setParamsScanProgress(0);
    setScanResults([]);
    setParamsScanResults([]);
    setSafetyPercentage("Calculating...");

    try {
      const response = await fetch("http://localhost:5002/api/owasp/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      if (!response.ok) {
        throw new Error("Failed to start security scan.");
      }

      console.log("Scan started successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const socket = io("http://localhost:5002", {
      transports: ["websocket"],
      autoConnect: false,
    });

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("progress", (data: ProgressData) => {
      setSpiderProgress(data.spider);
      setActiveScanProgress(data.activeScan);
      setParamsScanProgress(data.paramsScan);
      setIsScanning(data.isScanning);
      if (!data.isScanning) {
        fetchScanResults();
      }
    });

    return () => {
      socket.disconnect();
      socket.off("progress");
    };
  }, []);



const fetchScanResults = async (): Promise<void> => {
  try {
    const response = await fetch("http://localhost:5002/api/owasp/scan-results");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: ScanResultsData = await response.json();
    console.log("Fetched scan results:", data);

    if (!data || !Array.isArray(data.alerts) || !Array.isArray(data.paramsAlerts)) {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response format");
    }

    const uniqueScanResults = Array.from(new Map(data.alerts.map(item => [`${item.name}-${item.severity}`, item])).values());
    const uniqueParamsScanResults = Array.from(new Map(data.paramsAlerts.map(item => [`${item.alert}-${item.url}`, item])).values());

    setScanResults(uniqueScanResults);
    setParamsScanResults(uniqueParamsScanResults);
    setSafetyPercentage(data.safetyPercentage || "N/A");
  } catch (error) {
    setError(error instanceof Error ? error.message : "An unknown error occurred");
    setScanResults([]);
    setParamsScanResults([]);
    setSafetyPercentage("Error Calculating");
  }
};



return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white">OWASP ZAP Vulnerability Scanner</h2>
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
          className={`mt-4 px-6 py-2 rounded-md text-white ${
            isScanning ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isScanning ? "Scanning..." : "Start Scan"}
        </button>
      </div>

      <div className="mt-6">
        <p className="text-white mb-1">Spider Scan: {spiderProgress}%</p>
        <div className="w-full bg-gray-800 h-7 rounded-md overflow-hidden relative">
          <div className="h-7 rounded-md bg-blue-600 transition-all duration-500 ease-linear" style={{ width: `${spiderProgress}%` }}>
            {spiderProgress === 100 && <span className="text-xs text-white font-semibold pl-2">Completed!</span>}
          </div>
        </div>

        <p className="text-white mt-4 mb-1">Active Scan: {activeScanProgress}%</p>
        <div className="w-full bg-gray-800 h-7 rounded-md overflow-hidden relative">
          <div className="h-7 rounded-md bg-green-600 transition-all duration-500 ease-linear" style={{ width: `${activeScanProgress}%` }}>
            {activeScanProgress === 100 && <span className="text-xs text-white font-semibold pl-2">Completed!</span>}
          </div>
        </div>

        <p className="text-white mt-4 mb-1">Params Scan : {paramsScanProgress}%</p>
        <div className="w-full bg-gray-800 h-7 rounded-md overflow-hidden relative">
          <div className="h-7 rounded-md bg-yellow-600 transition-all duration-500 ease-linear" style={{ width: `${paramsScanProgress}%` }}>
            {paramsScanProgress === 100 && <span className="text-xs text-white font-semibold pl-2">Completed!</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-white">Overall Safety</h3>
        <p className="text-lg text-red-400 font-semibold">{safetyPercentage}</p>
      </div>

      {scanResults.length > 0 && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-white">Scan Results</h3>
          <ul className="text-white mt-4">
            {scanResults.map((issue, index) => (
              <li key={index} className={`p-3 rounded-md ${issue.severity === "High" ? "bg-red-600" : issue.severity === "Medium" ? "bg-yellow-600" : "bg-green-600"} mt-2`}>
                <strong>{issue.name}</strong> - {issue.severity}
                <p className="text-sm">{issue.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {paramsScanResults.length > 0 && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-white">Parameter-Based Alerts</h3>
          <ul className="text-white mt-4">
            {paramsScanResults.map((alert, index) => (
              <li key={index} className="p-3 rounded-md bg-yellow-600 mt-2">
                <strong>{alert.alert}</strong> ({alert.risk}) - {alert.url}
                <p className="text-sm">{alert.description}</p>
                <a href={alert.reference} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  More Info
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="mt-4 bg-red-800 text-white p-3 rounded-md">{error}</div>}
    </div>
  );
};

export default Owasp;