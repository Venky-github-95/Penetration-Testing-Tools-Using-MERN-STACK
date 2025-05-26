import { useState, useEffect, useRef, forwardRef } from "react";
import { FileText, Download, ChevronDown, ChevronUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Chart } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Report {
  _id: string;
  target: string;
  category: string;
  date?: string;
  scanResults?: { name: string; result: any; severity: string }[];
  owaspResults?: { name: string; risk: string; solution: string }[];
  virusTotalResults?: { name: string; virusTotalResult: string }[];
  urlScanResults?: { name: string; urlScanResult: string }[];
  safetyPercentage?: string;
}

const PieChart = forwardRef<
  Chart<"pie", number[], unknown> | null,
  { data: any; options: any }
>(({ data, options }, ref) => <Pie ref={ref as any} data={data} options={options} />);

PieChart.displayName = "PieChart";

const SecurityReports = () => {
  const [scanReports, setScanReports] = useState<Report[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const chartRefs = useRef<{ [key: string]: Chart<"pie", number[], unknown> | null }>({});

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("http://localhost:5002/api/security-tools/pdf");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setScanReports(data); // Store the array of reports
        } else {
          console.error("Unexpected response format:", data);
        }
      } catch (error) {
        console.error("Error fetching security reports:", error);
      }
    };
    
    fetchReports();
  }, []);

  const captureChartImage = async (chartInstance: Chart<"pie", number[], unknown> | null) => {
    if (!chartInstance || !chartInstance.canvas) return null;

    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      return chartInstance.canvas.toDataURL("image/png", 1.0);
    } catch (error) {
      console.error("Error capturing pie chart image:", error);
      return null;
    }
  };

  const generatePDF = async (report: Report) => {
    console.log("Report Data:", report); // Debugging line

    const doc = new jsPDF();

    // Add title and category
    doc.text(`Security Report: ${report.target}`, 14, 15);
    doc.setFontSize(12);
    doc.text(`Category: ${report.category?.toUpperCase()}`, 14, 25);

    let finalY = 35;

    // Add Pie Chart
    // const safePercentage = parseFloat(report.safetyPercentage || "0");
    // const unsafePercentage = 100 - safePercentage;

    // const chartData = {
    //   labels: ["Safe", "Unsafe"],
    //   datasets: [
    //     {
    //       data: [safePercentage, unsafePercentage],
    //       backgroundColor: ["#4CAF50", "#FF0000"],
    //     },
    //   ],
    // };

    // const chartOptions = {
    //   responsive: true,
    //   maintainAspectRatio: false,
    // };

    const chartImage = await captureChartImage(chartRefs.current[report._id || report.target]);
    if (chartImage) {
      doc.addImage(chartImage, "PNG", 14, finalY, 100, 100);
      finalY += 110;
    }

    // Add VirusTotal Table
    if (report.virusTotalResults?.length) {
      autoTable(doc, {
        startY: finalY,
        head: [["Finding", "Result", "Danger"]],
        body: report.virusTotalResults.map((result) => [
          result.name || "Unknown Finding",
          result.virusTotalResult || "N/A",
          result.virusTotalResult === "malicious" ? "Yes" : "No",
        ]),
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 4, valign: "middle", overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 60, halign: "left" },
          1: { cellWidth: 80, halign: "left" },
          2: { cellWidth: 40, halign: "center" },
        },
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      console.log("No VirusTotal Results Found"); // Debugging line
    }

    // Add OWASP Table
    if (report.owaspResults?.length) {
      autoTable(doc, {
        startY: finalY,
        head: [["Finding", "Risk", "Solution"]],
        body: report.owaspResults.map((result) => [
          result.name || "Unknown Finding",
          result.risk || "No Risk Data",
          result.solution || "No Solution Available",
        ]),
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 4, valign: "middle", overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 70, halign: "left" },
          1: { cellWidth: 50, halign: "left" },
          2: { cellWidth: 70, halign: "left" },
        },
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add URLScan Table
    if (report.urlScanResults?.length) {
      autoTable(doc, {
        startY: finalY,
        head: [["Finding", "Result"]],
        body: report.urlScanResults.map((result) => [
          result.name || "Unknown Finding",
          result.urlScanResult || "N/A",
        ]),
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 4, valign: "middle", overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 70, halign: "left" },
          1: { cellWidth: 80, halign: "left" },
        },
      });
    }

    // Save the PDF
    doc.save(`Report_${report.target}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Security Reports</h2>
        </div>
  
        {["virustotal", "owasp", "urlscan"].map((category) => {
          const categoryReports = scanReports.filter((report) => report.category === category);
  
          return (
            <div key={category} className="mb-8">
              <h3 className="text-xl font-bold capitalize">{category} Reports</h3>
              <div className="space-y-4">
                {categoryReports.length > 0 ? (
                  categoryReports.map((report) => {
                    const safePercentage = parseFloat(report.safetyPercentage || "0");
                    const unsafePercentage = 100 - safePercentage;
  
                    const chartData = {
                      labels: ["Safe", "Unsafe"],
                      datasets: [
                        {
                          data: [safePercentage, unsafePercentage],
                          backgroundColor: ["#4CAF50", "#FF0000"],
                        },
                      ],
                    };
  
                    const chartOptions = {
                      responsive: true,
                      maintainAspectRatio: false,
                    };
  
                    return (
                      <div key={report._id || report.target} className="bg-gray-900 rounded-lg p-4">
                        <div
                          className="cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            if (expandedReport === report._id) {
                              setExpandedReport(null);
                            } else {
                              setExpandedReport(report._id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="h-6 w-6 text-blue-500" />
                            <div>
                              <h3 className="font-medium">{report.target}</h3>
                              {/* <p className="text-sm text-gray-400">{report.date || "N/A"}</p> */}
                            </div>
                          </div>
                          {expandedReport === report._id ? <ChevronUp /> : <ChevronDown />}
                        </div>
  
                        {expandedReport === report._id && (
                          <div className="mt-4">
                            {/* <div className="h-40 w-40 mx-auto">
                              <PieChart
                                ref={(el) => (chartRefs.current[report._id] = el)}
                                data={chartData}
                                options={chartOptions}
                              />
                            </div> */}
  
                            <div className="mt-4">
                              <h4 className="font-semibold">Findings:</h4>
                              <ul className="list-disc list-inside text-gray-300">
                                {report.scanResults?.map((result, index) => (
                                  <li key={`${report._id || report.target}-${result.name}-${index}`}>
                                    {result.name} - {result.result} (
                                    <span className="text-red-400">{result.severity}</span>)
                                  </li>
                                )) || <li key="no-findings">No findings available</li>}
                              </ul>
                            </div>
  
                            <button
                              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                              onClick={() => generatePDF(report)}
                            >
                              <Download className="h-4 w-4" />
                              Download Report
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p key={`no-reports-${category}`} className="text-gray-400">
                    No reports found for {category}.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityReports;


// import { useState, useEffect, useRef, forwardRef } from "react";
// import { FileText, Download, ChevronDown, ChevronUp } from "lucide-react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { Pie } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend, Chart } from "chart.js";

// ChartJS.register(ArcElement, Tooltip, Legend);

// interface Report {
//   _id: string;
//   target: string;
//   category: string;
//   date?: string;
//   scanResults?: { name: string; result: any; severity: string }[];
//   owaspResults?: { name: string; risk: string; solution: string }[];
//   virusTotalResults?: { name: string; result: string }[];
//   urlScanResults?: { name: string; result: string }[];
//   safetyPercentage?: string;
// }

// const PieChart = forwardRef<
//   Chart<"pie", number[], unknown> | null,
//   { data: any; options: any }
// >(({ data, options }, ref) => <Pie ref={ref as any} data={data} options={options} />);

// PieChart.displayName = "PieChart";

// const SecurityReports = () => {
//   const [scanReports, setScanReports] = useState<Report[]>([]);
//   const [expandedReport, setExpandedReport] = useState<string | null>(null);
//   const chartRefs = useRef<{ [key: string]: Chart<"pie", number[], unknown> | null }>({});

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const response = await fetch("http://localhost:5002/api/security-tools");
//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//         const data = await response.json();
//         if (Array.isArray(data)) {
//           setScanReports(data);
//         } else {
//           console.error("Invalid response format:", data);
//         }
//       } catch (error) {
//         console.error("Error fetching security reports:", error);
//       }
//     };
//     fetchReports();
//   }, []);

//   const captureChartImage = async (chartInstance: Chart<"pie", number[], unknown> | null) => {
//     if (!chartInstance || !chartInstance.canvas) return null;

//     await new Promise((resolve) => requestAnimationFrame(resolve));
//     await new Promise((resolve) => setTimeout(resolve, 500));

//     try {
//       return chartInstance.canvas.toDataURL("image/png", 1.0);
//     } catch (error) {
//       console.error("Error capturing pie chart image:", error);
//       return null;
//     }
//   };

  
//   const generatePDF = async (report: Report) => {
//     const doc = new jsPDF();
  
//     doc.text(`Security Report: ${report.target}`, 14, 15);
//     doc.setFontSize(12);
//     doc.text(`Category: ${report.category?.toUpperCase()}`, 14, 25);
  
//     let finalY = 35;
  
//     // Capture Pie Chart
//     const chartInstance = chartRefs.current[report._id];
//     const chartImage = await captureChartImage(chartInstance);
  
//     if (chartImage) {
//       doc.addImage(chartImage, "PNG", 60, finalY, 90, 90);
//       finalY += 100;
//     }
  
//     // Add Scan Results Table
//     if (report.scanResults?.length) {
//       autoTable(doc, {
//         startY: finalY,
//         head: [["Finding", "Result", "Severity"]],
//         body: report.scanResults.map((result) => [
//           result.name || "Unknown Finding",
//           result.result || "N/A",
//           result.severity || "N/A", // Use result.severity directly
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10, cellPadding: 4, valign: "middle", overflow: "linebreak" },
//         columnStyles: {
//           0: { cellWidth: 70, halign: "left" },
//           1: { cellWidth: 80, halign: "left" },
//           2: { cellWidth: 40, halign: "center" },
//         },
//       });
//       finalY = (doc as any).lastAutoTable.finalY + 10;
//     }
  
//     // Add OWASP Table
//     if (report.owaspResults?.length) {
//       autoTable(doc, {
//         startY: finalY,
//         head: [["OWASP Finding", "Risk", "Solution"]],
//         body: report.owaspResults.map((result) => [
//           result.name || "Unknown Finding",
//           result.risk || "No Risk Data",
//           result.solution || "No Solution Available",
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10, cellPadding: 4, valign: "middle", overflow: "linebreak" },
//         columnStyles: {
//           0: { cellWidth: 70, halign: "left" },
//           1: { cellWidth: 50, halign: "left" },
//           2: { cellWidth: 70, halign: "left" },
//         },
//       });
//       finalY = (doc as any).lastAutoTable.finalY + 10;
//     }
  
//     // Add VirusTotal Table (With Severity Column)
//     const severityMapping: { [key: string]: number } = {
//       harmless: 0,    // 0% severity
//       undetected: 10, // 10% severity
//       suspicious: 50, // 50% severity
//       malicious: 100, // 100% severity
//     };
  
//     // Function to normalize the result value (trim and convert to lowercase)
//     const normalizeResult = (result: string): string => {
//       return result.trim().toLowerCase();
//     };
  
//     // Function to calculate severity based on the result
//     const calculateSeverity = (result: string): number | string => {
//       const normalizedResult = normalizeResult(result);
//       return severityMapping[normalizedResult] !== undefined ? severityMapping[normalizedResult] : "N/A";
//     };
  
//     if (report.virusTotalResults?.length) {
//       autoTable(doc, {
//         startY: finalY,
//         head: [["VirusTotal Finding", "Result", "Severity (%)"]], // Add Severity column
//         body: report.virusTotalResults.map((result) => [
//           result.name || "Unknown Finding",
//           result.result || "N/A",
//           calculateSeverity(result.result), // Calculate and add severity
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10, cellPadding: 4, valign: "middle", overflow: "linebreak" },
//         columnStyles: {
//           0: { cellWidth: 90, halign: "left" },
//           1: { cellWidth: 90, halign: "left" },
//           2: { cellWidth: 50, halign: "center" }, // Adjust column width for severity
//         },
//       });
//       finalY = (doc as any).lastAutoTable.finalY + 10;
//     }
  
//     // Add URLScan Table (Dynamically Calculate Severity)
//     if (report.urlScanResults?.length) {
//       const calculateSeverity = (result: string | null | undefined): string => {
//         if (!result || result.trim() === "") return "Low";
//         const lowerCaseResult = result.toLowerCase();
//         if (lowerCaseResult.includes("malicious")) return "High";
//         if (lowerCaseResult.includes("suspicious")) return "Medium";
//         return "Low";
//       };
  
//       const filteredResults = report.urlScanResults.slice(0, report.urlScanResults.length - 4);
  
//       autoTable(doc, {
//         startY: finalY,
//         head: [["URLScan Finding", "Result", "Severity"]],
//         body: filteredResults.map((result) => [
//           result.name || "Unknown Finding",
//           result.result || "N/A",
//           calculateSeverity(result.result),
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10, cellPadding: 4, valign: "middle", overflow: "linebreak" },
//         columnStyles: {
//           0: { cellWidth: 70, halign: "left" },
//           1: { cellWidth: 80, halign: "left" },
//           2: { cellWidth: 40, halign: "center" },
//         },
//       });
//     }
  
//     // Save the PDF
//     doc.save(`Report_${report.target}.pdf`);
//   };




//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold">Security Reports</h2>
//         </div>

//         {["virustotal", "owasp", "urlscanio"].map((category) => {
//           const categoryReports = scanReports.filter((report) => report.category === category);

//           return (
//             <div key={category} className="mb-8">
//               <h3 className="text-xl font-bold capitalize">{category} Reports</h3>
//               <div className="space-y-4">
//                 {categoryReports.length > 0 ? (
//                   categoryReports.map((report) => {
//                     const safePercentage = parseFloat(report.safetyPercentage || "0");
//                     const unsafePercentage = 100 - safePercentage;

//                     const chartData = {
//                       labels: ["Safe", "Unsafe"],
//                       datasets: [
//                         {
//                           data: [safePercentage, unsafePercentage],
//                           backgroundColor: ["#4CAF50", "#FF0000"],
//                         },
//                       ],
//                     };

//                     const chartOptions = {
//                       responsive: true,
//                       maintainAspectRatio: false,
//                     };

//                     return (
//                       <div key={report._id} className="bg-gray-900 rounded-lg p-4">
//                         <div
//                           className="cursor-pointer flex justify-between items-center"
//                           onClick={() =>
//                             setExpandedReport(expandedReport === report._id ? null : report._id)
//                           }
//                         >
//                           <div className="flex items-center gap-4">
//                             <FileText className="h-6 w-6 text-blue-500" />
//                             <div>
//                               <h3 className="font-medium">{report.target}</h3>
//                               <p className="text-sm text-gray-400">{report.date || "N/A"}</p>
//                             </div>
//                           </div>
//                           {expandedReport === report._id ? <ChevronUp /> : <ChevronDown />}
//                         </div>

//                         {expandedReport === report._id && (
//                           <div className="mt-4">
//                             <div className="h-40 w-40 mx-auto">
//                               <PieChart
//                                 ref={(el) => (chartRefs.current[report._id] = el)}
//                                 data={chartData}
//                                 options={chartOptions}
//                               />
//                             </div>

//                             <div className="mt-4">
//                               <h4 className="font-semibold">Findings:</h4>
//                               <ul className="list-disc list-inside text-gray-300">
//                                 {report.scanResults?.map((result, index) => (
//                                   <li key={index}>
//                                     {result.name} - {result.result} (
//                                     <span className="text-red-400">{result.severity}</span>)
//                                   </li>
//                                 )) || <li>No findings available</li>}
//                               </ul>
//                             </div>

//                             <button
//                               className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//                               onClick={() => generatePDF(report)}
//                             >
//                               <Download className="h-4 w-4" />
//                               Download Report
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })
//                 ) : (
//                   <p className="text-gray-400">No reports found for {category}.</p>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default SecurityReports;



//  - - - - - - - - - - - - Successfully have pie chart for all and separate download- - - - - - - -  - - - - --  

// import { useState, useEffect, useRef, forwardRef } from "react";
// import { FileText, Download, ChevronDown, ChevronUp } from "lucide-react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { Pie } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend, Chart } from "chart.js";

// ChartJS.register(ArcElement, Tooltip, Legend);

// interface Report {
//   _id: string;
//   target: string;
//   category: string;
//   date?: string;
//   scanResults?: { name: string; result: any; severity?: string }[];
//   safetyPercentage?: string;
// }

// // ForwardRef for PieChart
// const PieChart = forwardRef<
//   Chart<"pie", number[], unknown> | null,
//   { data: any; options: any }
// >(({ data, options }, ref) => <Pie ref={ref as any} data={data} options={options} />);

// PieChart.displayName = "PieChart";

// const SecurityReports = () => {
//   const [scanReports, setScanReports] = useState<Report[]>([]);
//   const [expandedReport, setExpandedReport] = useState<string | null>(null);
//   const chartRefs = useRef<{ [key: string]: Chart<"pie", number[], unknown> | null }>({});

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const response = await fetch("http://localhost:5002/api/security-tools");
//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//         const data = await response.json();
//         console.log("Fetched data:", data);
//         if (Array.isArray(data)) {
//           setScanReports(data);
//         } else {
//           console.error("Invalid response format:", data);
//         }
//       } catch (error) {
//         console.error("Error fetching security reports:", error);
//       }
//     };
//     fetchReports();
//   }, []);

//   const generatePDF = async (report: Report) => {
//     const doc = new jsPDF();
//     doc.text(`Security Report: ${report.target}`, 14, 15);
//     doc.setFontSize(12);
//     doc.text(`Category: ${report.category?.toUpperCase()}`, 14, 25);

//     const chartInstance = chartRefs.current[report._id];
//     if (!chartInstance || !chartInstance.canvas) {
//       console.error("❌ Chart instance or canvas is missing.");
//       return;
//     }

//     await new Promise((resolve) => requestAnimationFrame(resolve));
//     await new Promise((resolve) => setTimeout(resolve, 500));

//     const imageBase64 = chartInstance.canvas.toDataURL("image/png", 1.0);
//     doc.addImage(imageBase64, "PNG", 40, 30, 120, 120);

//     autoTable(doc, {
//       startY: 160,
//       head: [["Finding", "Severity"]],
//       body:
//         report.scanResults?.map((result) => [
//           result.name || "Unknown Finding",
//           result.severity?.toUpperCase() || "N/A",
//         ]) || [["No findings available", "N/A"]],
//     });

//     doc.save(`Report_${report.target}.pdf`);
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold">Security Reports</h2>
//         </div>

//         {["virustotal", "owasp", "urlscanio"].map((category) => {
//           const categoryReports = scanReports.filter((report) => report.category === category);

//           return (
//             <div key={category} className="mb-8">
//               <h3 className="text-xl font-bold capitalize">{category} Reports</h3>
//               <div className="space-y-4">
//                 {categoryReports.length > 0 ? (
//                   categoryReports.map((report) => {
//                     const safePercentage = parseFloat(report.safetyPercentage || "0");
//                     const unsafePercentage = 100 - safePercentage;

//                     const chartData = {
//                       labels: ["Safe", "Unsafe"],
//                       datasets: [
//                         {
//                           data: [safePercentage, unsafePercentage],
//                           backgroundColor: ["#4CAF50", "#FF0000"],
//                         },
//                       ],
//                     };

//                     const chartOptions = {
//                       responsive: true,
//                       maintainAspectRatio: false,
//                     };

//                     return (
//                       <div key={report._id} className="bg-gray-900 rounded-lg p-4">
//                         <div
//                           className="cursor-pointer flex justify-between items-center"
//                           onClick={() =>
//                             setExpandedReport(expandedReport === report._id ? null : report._id)
//                           }
//                         >
//                           <div className="flex items-center gap-4">
//                             <FileText className="h-6 w-6 text-blue-500" />
//                             <div>
//                               <h3 className="font-medium">{report.target}</h3>
//                               <p className="text-sm text-gray-400">{report.date || "N/A"}</p>
//                             </div>
//                           </div>
//                           {expandedReport === report._id ? <ChevronUp /> : <ChevronDown />}
//                         </div>

//                         {expandedReport === report._id && (
//                           <div className="mt-4">
//                             <div className="h-40 w-40 mx-auto">
//                               <PieChart
//                                 ref={(el) => (chartRefs.current[report._id] = el)}
//                                 data={chartData}
//                                 options={chartOptions}
//                               />
//                             </div>
//                             <button
//                               className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//                               onClick={() => generatePDF(report)}
//                             >
//                               <Download className="h-4 w-4" />
//                               Download Report
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })
//                 ) : (
//                   <p className="tex t-gray-400">No reports found for {category}.</p>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default SecurityReports;



// import { useState, useEffect, useRef, forwardRef } from 'react';
// import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { Pie } from 'react-chartjs-2';
// import { Chart as ChartJS, ArcElement, Tooltip, Legend, Chart } from 'chart.js';


// ChartJS.register(ArcElement, Tooltip, Legend);


// // Fix the ForwardRef typing issue
// const PieChart = forwardRef<
//   Chart<"pie", number[], unknown> | null,
//   { data: any; options: any }
// >(({ data, options }, ref) => (
//   <Pie ref={ref as any} data={data} options={options} />
// ));

// const SecurityReports = () => {
//   const [scanReports, setScanReports] = useState<any[]>([]);
//   const [expandedReport, setExpandedReport] = useState<string | null>(null);
//   // Create a ref with the correct type
//   const chartRef = useRef<Chart<"pie", number[], unknown> | null>(null);
//   const [chartReady, setChartReady] = useState(false);

//   useEffect(() => {
//     if (chartRef.current) {
//       setTimeout(() => {
//         setChartReady(true);
//       }, 2000); // Increased delay for safe rendering
//     }
//   }, [scanReports]); // Depend on scanReports to wait for data before rendering
  

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const response = await fetch('http://localhost:5002/api/security-tools');
//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

//         const data = await response.json();
//         console.log('Fetched Reports:', data);
        

//         if (Array.isArray(data)) {
//           setScanReports(data);
//         } else {
//           console.error('Invalid response format:', data);
//         }
//       } catch (error) {
//         console.error('Error fetching security reports:', error);
//       }
//     };

//     fetchReports();
    
//   }, []);

  

//   const getSeverityColor = (severity: string) => {
//     switch (severity?.toLowerCase()) {
//       case 'critical':
//         return 'text-red-500 bg-red-500/20 border-red-500/50';
//       case 'high':
//         return 'text-orange-500 bg-orange-500/20 border-orange-500/50';
//       case 'medium':
//         return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/50';
//       default:
//         return 'text-blue-500 bg-blue-500/20 border-blue-500/50';
//     }
//   };

//   const determineSeverityFromBackend = (result: any) => {
//     console.log("Processing Finding:", result); // Debugging
  
//     if (result.severity && result.severity.trim() !== "") {
//       return result.severity.toUpperCase(); // Use backend severity if available
//     }
  
//     // Handle numeric result (Secure Percentage)
//     if (typeof result.result === "number") {
//       const score = result.result;
//       if (score < 20) return "Critical";
//       if (score < 50) return "High";
//       if (score < 80) return "Medium";
//       return "Low";
//     }
  
//     // Handle JSON-string result (Server Stats)
//     if (typeof result.result === "string") {
//       try {
//         const parsedResult = JSON.parse(result.result);
//         console.log("Parsed JSON Result:", parsedResult);
  
//         // Example: Check if there's a high-risk server type
//         if (Array.isArray(parsedResult)) {
//           if (parsedResult.some((server) => server.server === "openresty")) {
//             return "High";
//           }
//         }
//       } catch (error) {
//         console.warn("Error parsing result JSON:", error);
//       }
//     }
  
//     console.warn("No valid severity data found for:", result);
//     return "N/A"; // Default if no valid data is available
//   };
  
  
//   const generatePDF = async (report: any) => {
//     const doc = new jsPDF();
//     doc.text(`Security Report: ${report.target}`, 14, 15);
//     doc.setFontSize(12);
//     doc.text(`Category: ${report.category?.toUpperCase()}`, 14, 25);

//     const chartInstance = chartRef.current;

//     if (!chartInstance || !chartInstance.canvas) {
//         console.error("❌ Chart instance or canvas is missing. Retrying...");
//         setTimeout(() => generatePDF(report), 1000); // Retry after delay
//         return;
//     }

//     try {
//         await new Promise((resolve) => requestAnimationFrame(resolve));
//         await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased delay for safe rendering

//         const canvas = chartInstance.canvas;
//         const imageBase64 = canvas.toDataURL("image/png", 1.0);

//         if (!imageBase64.includes("base64,")) {
//             console.error("⚠️ Invalid Base64 format. Chart may not have rendered fully.");
//             return;
//         }

//         doc.addImage(imageBase64, "PNG", 40, 30, 120, 120);

//         autoTable(doc, {
//             startY: 160,
//             head: [["Finding", "Severity"]],
//             body:
//                 report.scanResults?.map((result: any) => {
//                     const finding = result.name || "Unknown Finding";
//                     const severity = determineSeverityFromBackend(result);
//                     return [finding, severity];
//                 }) || [["No findings available", "N/A"]],
//         });

//         doc.save(`Report_${report.target}.pdf`);
//     } catch (error) {
//         console.error("❌ Error generating chart image:", error);
//     }
// };



//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold">Security Reports</h2>
//           <button
//             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//             onClick={() => {
//               const doc = new jsPDF();
//               doc.text('Consolidated Security Report', 14, 15);
//               let yPosition = 25;

//               scanReports.forEach((report) => {
//                 doc.text(`Target: ${report.target}`, 14, yPosition);
//                 yPosition += 10;
//                 doc.text(`Category: ${report.category?.toUpperCase()}`, 14, yPosition);
//                 yPosition += 5;

//                 autoTable(doc, {
//                   startY: yPosition + 5,
//                   head: [['Finding', 'Severity']],
//                   body: report.scanResults?.map((result: any) => [
//                     result.name || 'Unknown Finding', // Use 'name' instead of 'title'
//                     result.result ? result.result.toString() : 'N/A', // Display the result if available
//                   ]) || [['No findings available', 'N/A']],                  
//                 });

//                 yPosition = (doc as any).lastAutoTable.finalY + 10;
//               });

//               doc.save('All_Security_Reports.pdf');
//             }}
//           >
//             <Download className="h-4 w-4" />
//             Export All
//           </button>
//         </div>

//         {['virustotal', 'owasp', 'urlscanio'].map((category) => {
//           const categoryReports = scanReports.filter((report) => report.category === category);

//           return (
//             <div key={category} className="mb-8">
//               <h3 className="text-xl font-bold capitalize">{category} Reports</h3>
//               <div className="space-y-4">
//                 {categoryReports.length > 0 ? (
//                   categoryReports.map((report) => (
//                     <div key={report._id} className="bg-gray-900 rounded-lg">
//                       <div
//                         className="p-4 cursor-pointer"
//                         onClick={() =>
//                           setExpandedReport(expandedReport === report._id ? null : report._id)
//                         }
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-4">
//                             <FileText className="h-6 w-6 text-blue-500" />
//                             <div>
//                               <h3 className="font-medium">{report.target}</h3>
//                               <p className="text-sm text-gray-400">{report.date || 'N/A'}</p>
//                             </div>
//                           </div>
//                           <div className="flex items-center gap-4">
//                             {expandedReport === report._id ? (
//                               <ChevronUp className="h-5 w-5" />
//                             ) : (
//                               <ChevronDown className="h-5 w-5" />
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {expandedReport === report._id && (
//                         <div className="p-4 border-t border-gray-700">
                          
//                           <div className="mb-4">
//                             <h4 className="font-medium mb-2">Findings</h4>
//                             <div className="space-y-2">
//                               {(report.scanResults?.length > 0
//                               ? report.scanResults.map((finding: any) => ({
//                                   title: finding.name || 'Unknown Finding',
//                                   severity: finding.result ? 'Info' : 'N/A', // Set 'Info' for findings without severity
//                                 }))
//                               : [{ title: 'No findings available', severity: 'N/A' }]
//                             ).map((finding: any, index: number) => (

//                                 <div
//                                   key={index}
//                                   className={`p-3 rounded-lg border ${getSeverityColor(
//                                     finding.severity
//                                   )}`}
//                                 >
//                                   <div className="flex items-center gap-2">
//                                     <span>{finding.title}</span>
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           </div>

                           
//             {/* Hidden Pie chart (for PDF generation only) */}
//             <div style={{ display: chartReady ? "block" : "none" }}>
//             <PieChart
//                 ref={chartRef}
//                 data={{
//                   labels: ["Safe", "Unsafe"],
//                   datasets: [
//                     {
//                       data: [report.safetyPercentage, 100 - report.safetyPercentage],
//                       backgroundColor: ["green", "red"],
//                     },
//                   ],
//                 }}
//                 options={{
//                   animation: {
//                     onComplete: () => setChartReady(true),
//                   },
//                 }}
//               />
//             </div>
//                           <div className="mt-4 flex justify-end">
//                             <button
//                               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//                               onClick={() => generatePDF(report)}
//                             >
//                               <Download className="h-4 w-4" />
//                               Download Report
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-400">No reports found for {category}.</p>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>
    
//     </div>
//   );
// };

// export default SecurityReports;


//  - - - - - - - - - - - - - Successfully generated the TEXT based Report PDF - - - - - - - - - - - - - -   

// import { useState, useEffect } from 'react';
// import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// const SecurityReports = () => {
//   const [scanReports, setScanReports] = useState<any[]>([]);
//   const [expandedReport, setExpandedReport] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const response = await fetch('http://localhost:5002/api/security-tools');
//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

//         const data = await response.json();
//         console.log('Fetched Reports:', data);
        

//         if (Array.isArray(data)) {
//           setScanReports(data);
//         } else {
//           console.error('Invalid response format:', data);
//         }
//       } catch (error) {
//         console.error('Error fetching security reports:', error);
//       }
//     };

//     fetchReports();
    
//   }, []);

  

//   const getSeverityColor = (severity: string) => {
//     switch (severity?.toLowerCase()) {
//       case 'critical':
//         return 'text-red-500 bg-red-500/20 border-red-500/50';
//       case 'high':
//         return 'text-orange-500 bg-orange-500/20 border-orange-500/50';
//       case 'medium':
//         return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/50';
//       default:
//         return 'text-blue-500 bg-blue-500/20 border-blue-500/50';
//     }
//   };

//   const determineSeverityFromBackend = (result: any) => {
//     console.log("Processing Finding:", result); // Debugging
  
//     if (result.severity && result.severity.trim() !== "") {
//       return result.severity.toUpperCase(); // Use backend severity if available
//     }
  
//     // Handle numeric result (Secure Percentage)
//     if (typeof result.result === "number") {
//       const score = result.result;
//       if (score < 20) return "Critical";
//       if (score < 50) return "High";
//       if (score < 80) return "Medium";
//       return "Low";
//     }
  
//     // Handle JSON-string result (Server Stats)
//     if (typeof result.result === "string") {
//       try {
//         const parsedResult = JSON.parse(result.result);
//         console.log("Parsed JSON Result:", parsedResult);
  
//         // Example: Check if there's a high-risk server type
//         if (Array.isArray(parsedResult)) {
//           if (parsedResult.some((server) => server.server === "openresty")) {
//             return "High";
//           }
//         }
//       } catch (error) {
//         console.warn("Error parsing result JSON:", error);
//       }
//     }
  
//     console.warn("No valid severity data found for:", result);
//     return "N/A"; // Default if no valid data is available
//   };
  
  
  
//   const generatePDF = (report: any) => {
//     const doc = new jsPDF();
//     doc.text(`Security Report: ${report.target}`, 14, 15);
//     doc.setFontSize(12);
//     doc.text(`Category: ${report.category?.toUpperCase()}`, 14, 25);
  
//     autoTable(doc, {
//       startY: 35,
//       head: [['Finding', 'Severity']],
//       body: report.scanResults?.map((result: any) => {
//         const finding = result.name || 'Unknown Finding';
//         const severity = determineSeverityFromBackend(result);
//         return [finding, severity];
//       }) || [['No findings available', 'N/A']],
//     });
  
//     doc.save(`Report_${report.target}.pdf`);
//   };
  

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold">Security Reports</h2>
//           <button
//             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//             onClick={() => {
//               const doc = new jsPDF();
//               doc.text('Consolidated Security Report', 14, 15);
//               let yPosition = 25;

//               scanReports.forEach((report) => {
//                 doc.text(`Target: ${report.target}`, 14, yPosition);
//                 yPosition += 10;
//                 doc.text(`Category: ${report.category?.toUpperCase()}`, 14, yPosition);
//                 yPosition += 5;

//                 autoTable(doc, {
//                   startY: yPosition + 5,
//                   head: [['Finding', 'Severity']],
//                   body: report.scanResults?.map((result: any) => [
//                     result.name || 'Unknown Finding', // Use 'name' instead of 'title'
//                     result.result ? result.result.toString() : 'N/A', // Display the result if available
//                   ]) || [['No findings available', 'N/A']],                  
//                 });

//                 yPosition = (doc as any).lastAutoTable.finalY + 10;
//               });

//               doc.save('All_Security_Reports.pdf');
//             }}
//           >
//             <Download className="h-4 w-4" />
//             Export All
//           </button>
//         </div>

//         {['virustotal', 'owasp', 'urlscanio'].map((category) => {
//           const categoryReports = scanReports.filter((report) => report.category === category);

//           return (
//             <div key={category} className="mb-8">
//               <h3 className="text-xl font-bold capitalize">{category} Reports</h3>
//               <div className="space-y-4">
//                 {categoryReports.length > 0 ? (
//                   categoryReports.map((report) => (
//                     <div key={report._id} className="bg-gray-900 rounded-lg">
//                       <div
//                         className="p-4 cursor-pointer"
//                         onClick={() =>
//                           setExpandedReport(expandedReport === report._id ? null : report._id)
//                         }
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-4">
//                             <FileText className="h-6 w-6 text-blue-500" />
//                             <div>
//                               <h3 className="font-medium">{report.target}</h3>
//                               <p className="text-sm text-gray-400">{report.date || 'N/A'}</p>
//                             </div>
//                           </div>
//                           <div className="flex items-center gap-4">
//                             {expandedReport === report._id ? (
//                               <ChevronUp className="h-5 w-5" />
//                             ) : (
//                               <ChevronDown className="h-5 w-5" />
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {expandedReport === report._id && (
//                         <div className="p-4 border-t border-gray-700">
//                           <div className="mb-4">
//                             <h4 className="font-medium mb-2">Findings</h4>
//                             <div className="space-y-2">
//                               {(report.scanResults?.length > 0
//                               ? report.scanResults.map((finding: any) => ({
//                                   title: finding.name || 'Unknown Finding',
//                                   severity: finding.result ? 'Info' : 'N/A', // Set 'Info' for findings without severity
//                                 }))
//                               : [{ title: 'No findings available', severity: 'N/A' }]
//                             ).map((finding: any, index: number) => (

//                                 <div
//                                   key={index}
//                                   className={`p-3 rounded-lg border ${getSeverityColor(
//                                     finding.severity
//                                   )}`}
//                                 >
//                                   <div className="flex items-center gap-2">
//                                     <span>{finding.title}</span>
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           </div>

//                           <div className="mt-4 flex justify-end">
//                             <button
//                               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//                               onClick={() => generatePDF(report)}
//                             >
//                               <Download className="h-4 w-4" />
//                               Download Report
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-400">No reports found for {category}.</p>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default SecurityReports;



//    - - - - - - - - - - - - - Template - - - - - - - - - - - - - - - - -

// import { useState } from "react";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import { FileText, Download, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

// const SecurityReports = () => {
//   const [expandedReport, setExpandedReport] = useState<string | null>(null);

//   const reports = [
//     {
//       id: "1",
//       title: "Web Application Security Audit",
//       date: "2024-03-15",
//       severity: "critical",
//       findings: [
//         { title: "SQL Injection Vulnerability", severity: "critical" },
//         { title: "Cross-Site Scripting (XSS)", severity: "high" },
//         { title: "Insecure Direct Object References", severity: "medium" },
//       ],
//       summary: "Critical vulnerabilities found in the authentication system.",
//     },
//     {
//       id: "2",
//       title: "Network Infrastructure Scan",
//       date: "2024-03-14",
//       severity: "medium",
//       findings: [
//         { title: "Outdated SSL Certificates", severity: "medium" },
//         { title: "Open Ports", severity: "low" },
//       ],
//       summary: "Several security misconfigurations detected in network services.",
//     },
//   ];

//   const getSeverityColor = (severity: string) => {
//     switch (severity) {
//       case "critical":
//         return "text-red-500 bg-red-500/20 border-red-500/50";
//       case "high":
//         return "text-orange-500 bg-orange-500/20 border-orange-500/50";
//       case "medium":
//         return "text-yellow-500 bg-yellow-500/20 border-yellow-500/50";
//       default:
//         return "text-blue-500 bg-blue-500/20 border-blue-500/50";
//     }
//   };

//   // Function to generate individual report PDFs
//   const generatePDF = (report: typeof reports[0]) => {
//     const doc = new jsPDF();
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(18);
//     doc.text(report.title, 10, 20);

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(12);
//     doc.text(`Date: ${report.date}`, 10, 30);
//     doc.text(`Severity: ${report.severity.toUpperCase()}`, 10, 40);
//     doc.text("Summary:", 10, 50);
//     doc.text(report.summary, 10, 60, { maxWidth: 180 });

//     // Table for Findings
//     autoTable(doc, {
//       startY: 80,
//       head: [["Findings", "Severity"]],
//       body: report.findings.map((finding) => [finding.title, finding.severity.toUpperCase()]),
//       theme: "striped",
//     });

//     doc.save(`${report.title}.pdf`);
//   };

//   // Function to export all reports in a single PDF
//   const exportAllReports = () => {
//     const doc = new jsPDF();

//     reports.forEach((report, index) => {
//       if (index !== 0) doc.addPage(); // Add a new page for each report

//       doc.setFont("helvetica", "bold");
//       doc.setFontSize(18);
//       doc.text(report.title, 10, 20);

//       doc.setFont("helvetica", "normal");
//       doc.setFontSize(12);
//       doc.text(`Date: ${report.date}`, 10, 30);
//       doc.text(`Severity: ${report.severity.toUpperCase()}`, 10, 40);
//       doc.text("Summary:", 10, 50);
//       doc.text(report.summary, 10, 60, { maxWidth: 180 });

//       // Table for Findings
//       autoTable(doc, {
//         startY: 80,
//         head: [["Findings", "Severity"]],
//         body: report.findings.map((finding) => [finding.title, finding.severity.toUpperCase()]),
//         theme: "striped",
//       });
//     });

//     doc.save("Security_Reports.pdf");
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       {/* Reports List */}
//       <div className="bg-gray-800 rounded-lg p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold">Security Reports</h2>
//           <button
//             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//             onClick={exportAllReports}
//           >
//             <Download className="h-4 w-4" />
//             Export All
//           </button>
//         </div>

//         <div className="space-y-4">
//           {reports.map((report) => (
//             <div key={report.id} className="bg-gray-900 rounded-lg">
//               <div
//                 className="p-4 cursor-pointer"
//                 onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-4">
//                     <FileText className="h-6 w-6 text-blue-500" />
//                     <div>
//                       <h3 className="font-medium">{report.title}</h3>
//                       <p className="text-sm text-gray-400">{report.date}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-4">
//                     <span className={`px-3 py-1 rounded-full text-sm border ${getSeverityColor(report.severity)}`}>
//                       {report.severity.toUpperCase()}
//                     </span>
//                     {expandedReport === report.id ? (
//                       <ChevronUp className="h-5 w-5" />
//                     ) : (
//                       <ChevronDown className="h-5 w-5" />
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {expandedReport === report.id && (
//                 <div className="p-4 border-t border-gray-700">
//                   <div className="mb-4">
//                     <h4 className="font-medium mb-2">Summary</h4>
//                     <p className="text-gray-400">{report.summary}</p>
//                   </div>

//                   <div>
//                     <h4 className="font-medium mb-2">Findings</h4>
//                     <div className="space-y-2">
//                       {report.findings.map((finding, index) => (
//                         <div
//                           key={index}
//                           className={`p-3 rounded-lg border ${getSeverityColor(finding.severity)}`}
//                         >
//                           <div className="flex items-center gap-2">
//                             <AlertTriangle className="h-4 w-4" />
//                             <span>{finding.title}</span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   <div className="mt-4 flex justify-end">
//                     <button
//                       className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
//                       onClick={() => generatePDF(report)}
//                     >
//                       <Download className="h-4 w-4" />
//                       Download Report
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SecurityReports;
