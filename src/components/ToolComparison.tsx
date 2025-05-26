import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface SecurityTool {
  _id: string;
  target: string;
  scanResults: { name: string; result: string; risk: string }[];
  safetyPercentage: string;
  date: string;
  time: string;
  category: string;
}

const COLORS = ["#28a745", "#dc3545"]; // Green for Safe, Red for Unsafe

const ToolComparison: React.FC = () => {
  const [tools, setTools] = useState<SecurityTool[]>([]);
  const [filteredTools, setFilteredTools] = useState<SecurityTool[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await axios.get("http://localhost:5002/api/security-tools");
        setTools(response.data);
        setFilteredTools(response.data);
      } catch (error) {
        console.error("Error fetching tools:", error);
      }
    };
    fetchTools();
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredTools(tools);
    } else {
      setFilteredTools(tools.filter((tool) => tool.category === selectedCategory));
    }
  }, [selectedCategory, tools]);

  const generateChartData = (safetyPercentage: string) => {
    const safeValue = parseFloat(safetyPercentage.replace("% Safe", ""));
    return [
      { name: "Safe", value: safeValue },
      { name: "Unsafe", value: 100 - safeValue },
    ];
  };

  const groupedByTarget = filteredTools.reduce(
    (acc, tool) => {
      if (!acc[tool.target]) acc[tool.target] = [];
      acc[tool.target].push(tool);
      return acc;
    },
    {} as Record<string, SecurityTool[]>
  );

  const processScanResults = (scanResults: { name: string; risk: string }[]) => {
    if (!scanResults || scanResults.length === 0) return [];
  
    const groupedData: Record<string, { name: string; Low: number; Medium: number; High: number }> = {};
  
    scanResults.forEach((result) => {
      if (!groupedData[result.name]) {
        groupedData[result.name] = { name: result.name, Low: 0, Medium: 0, High: 0 };
      }
      groupedData[result.name][result.risk as "Low" | "Medium" | "High"]++;
    });
  
    return Object.values(groupedData);
  };


  const processScanResultsVirus = (scanResults: any[]) => {
    return scanResults.map((result: any) => ({
        name: result.name,
        riskLevel: getRiskLevel(result.result) // Convert result to a risk level
    }));
};

// Helper function to categorize risk levels
const getRiskLevel = (result: string) => {
    switch (result.toLowerCase()) {
        case "harmless":
            return "Low";
        case "undetected":
            return "Medium";
        case "malicious":
        case "suspicious":
            return "High";
        default:
            return "Unknown"; // Handle any unexpected cases
    }
};

  
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Security Tool Comparison</h2>

      <div className="mb-4 flex gap-4">
        {["all", "owasp", "virustotal", "urlscanio"].map((category) => (
          <button
            key={category}
            className={`px-4 py-2 border rounded ${
              selectedCategory === category ? "bg-blue-980 text-white" : "bg-gray-200 text-black"
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>

{/* OWASP Risk Bar Chart code */}
      {selectedCategory === "owasp" && (
        <div className="mt-6">
          <h3 className="text-center font-bold text-white-800 mb-4">OWASP Risk Bar Charts</h3>
          {filteredTools.map((tool) => (
            <div key={tool._id} className="mb-6">
              <h4 className="text-center font-bold mb-2 text-white-800">{tool.target}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processScanResults(tool.scanResults)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(_, __, { payload }) => [payload.name, payload["High"] || payload["Medium"] || payload["Low"]]} />
                  <Legend />
                  <Bar dataKey="Low" fill="#82ca9d" />
                  <Bar dataKey="Medium" fill="#ffcc00" />
                  <Bar dataKey="High" fill="#dc3545" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}


{/* VirusTotal Rish Bar Chart */}

{selectedCategory === "virustotal" && (
  <div className="mt-6">
    <h3 className="text-center font-bold mb-4">VirusTotal Risk Bar Charts</h3>
    {filteredTools
      .filter(tool => tool.category === "virustotal")
      .map((tool) => {
        const scanResults = processScanResultsVirus(tool.scanResults);

        // Aggregate risk levels
        const riskCounts = { "Very Low": 0, Low: 0, Medium: 0, "Critical": 0, High: 0 };

        scanResults.forEach(({ riskLevel }) => {
          if (["Very Low", "Low", "Medium", "Critical", "High"].includes(riskLevel)) {
            riskCounts[riskLevel as keyof typeof riskCounts] += 1;
          }
        });

        // Chart data format
        const chartData = [
          { name: "Very Low", count: riskCounts["Very Low"], color: "#a3e635" }, // Light green
          { name: "Low", count: riskCounts.Low, color: "#82ca9d" }, // Green
          { name: "Medium", count: riskCounts.Medium, color: "#ffcc00" }, // Yellow
          { name: "Critical", count: riskCounts.Critical, color: "#ff7300" }, // Orange
          { name: "High", count: riskCounts.High, color: "#dc3545" } // Red
        ];

        return (
          <div key={tool._id} className="mb-6">
            <h4 className="text-center font-bold mb-2">{tool.target}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const { name, count } = payload[0].payload;
                  return (
                    <div className="bg-white shadow-md p-2 rounded border text-black">
                      <p className="font-bold">{name} Risk</p>
                      <p>Detected: {count} times</p>
                    </div>
                  );
                }} />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" minPointSize={5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
  </div>
)}





{/* URLScan Risk Bar Chart */}

{selectedCategory === "urlscanio" && (
  <div className="mt-6">
    <h3 className="text-center font-bold mb-4">URLScan.io Risk Bar Charts</h3>
    {filteredTools
      .filter(tool => tool.category === "urlscanio")
      .map((tool) => {
        // Extract required numerical values
        const chartData = [
          { name: "IPv6%", value: tool.scanResults.find(r => r.name === "IPv6 Percentage")?.result || 0 },
          { name: "Secure Requests", value: tool.scanResults.find(r => r.name === "Secure Requests")?.result || 0 },
          { name: "Secure%", value: tool.scanResults.find(r => r.name === "Secure Percentage")?.result || 0 },
          { name: "Safety%", value: tool.safetyPercentage || 0 }
        ];

        return (
          <div key={tool._id} className="mb-6">
            <h4 className="text-center font-bold mb-2">{tool.target}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} /> {/* Ensure proper scaling */}
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#007bff" barSize={40} /> {/* Make bars wider for visibility */}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
  </div>
)}

{/* Pie chart code  */}
      <div className="flex flex-wrap justify-center gap-20 mb-6">
        {filteredTools.map((tool) => (
          <div key={tool._id} className="w-1/3 p-4 bg-transparent border border-gray-20 shadow-md rounded-lg">
            <h3 className="text-center font-bold mb-2 text-white-800">{tool.category.toUpperCase()}</h3>
            <div className="flex justify-between text-sm text-white-600 mt-2">
              <span>{new Date(tool.date).toLocaleDateString()}</span>
              <span>{tool.time}</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={generateChartData(tool.safetyPercentage)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center mt-2 text-blue-600">{tool.target}</p>
          </div>
        ))}
      </div>


      {/* Bar Charts for 'all' category (Grouped by Target URL) */}
      {selectedCategory === "all" && (
        <div className="flex flex-wrap justify-center gap-20">
          {Object.keys(groupedByTarget).map((target) => {
            const chartData = groupedByTarget[target].map((tool) => ({
              category: tool.category,
              safetyPercentage: parseFloat(tool.safetyPercentage),
            }));

            return (
              <div
                key={target}
                className="w-[48%] max-w-[600px] my-4 p-4 border rounded-lg shadow-md bg-transparent"
              >
                <h3 className="text-lg font-bold mb-2 text-center text-blue-980">{target}</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                      formatter={(value, name, item) => {
                        if (item && item.payload) {
                          return [`${item.payload.safetyPercentage}%`, item.payload.category];
                        }
                        return [value, name];
                      }}                      
                      />
                      <Legend />
                      <Bar
                        dataKey="safetyPercentage"
                        fill="#8884d8"
                        barSize={30}
                        onMouseOver={(e) => (e.target.style.fill = "#666")}
                        onMouseOut={(e) => (e.target.style.fill = "#8884d8")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500">No data available for this target.</p>
                )}
              </div>
            );
          })}
        </div>
      )}


      
    </div>
  );
};

export default ToolComparison;


// -------------------------  pie chart and Graph with safety %  ----------------------


// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
// } from "recharts";

// interface SecurityTool {
//   _id: string;
//   target: string;
//   scanResults: { name: string; result: string }[];
//   safetyPercentage: string;
//   date: string;
//   time: string;
//   category: string;
// }

// const COLORS = ["#28a745", "#dc3545"]; // Green for Safe, Red for Unsafe
// const TOOL_COLORS = {
//   owasp: "#8884d8",
//   virustotal: "#82ca9d",
//   urlscanio: "#ffcc00",
// };

// const ToolComparison: React.FC = () => {
//   const [tools, setTools] = useState<SecurityTool[]>([]);
//   const [filteredTools, setFilteredTools] = useState<SecurityTool[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState("all");

//   useEffect(() => {
//     const fetchTools = async () => {
//       try {
//         const response = await axios.get("http://localhost:5002/api/security-tools");
//         setTools(response.data);
//         setFilteredTools(response.data);
//       } catch (error) {
//         console.error("Error fetching tools:", error);
//       }
//     };
//     fetchTools();
//   }, []);

//   useEffect(() => {
//     if (selectedCategory === "all") {
//       setFilteredTools(tools);
//     } else {
//       setFilteredTools(tools.filter((tool) => tool.category === selectedCategory));
//     }
//   }, [selectedCategory, tools]);

//   // Generate pie chart data
//   const generateChartData = (safetyPercentage: string) => {
//     const safeValue = parseFloat(safetyPercentage.replace("% Safe", ""));
//     return [
//       { name: "Safe", value: safeValue },
//       { name: "Unsafe", value: 100 - safeValue },
//     ];
//   };

//   // Group data by target URL for separate bar charts
//   const groupedByTarget = tools.reduce((acc, tool) => {
//     if (!acc[tool.target]) acc[tool.target] = [];
//     acc[tool.target].push(tool);
//     return acc;
//   }, {} as Record<string, SecurityTool[]>);

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-4">Security Tool Comparison</h2>

//       {/* Filter Buttons */}
//       <div className="mb-4 flex gap-4">
//         {["all", "owasp", "virustotal", "urlscanio"].map((category) => (
//           <button
//             key={category}
//             className={`px-4 py-2 border rounded ${
//               selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
//             }`}
//             onClick={() => setSelectedCategory(category)}
//           >
//             {category.toUpperCase()}
//           </button>
//         ))}
//       </div>

//       {/* Pie Charts */}
//       <div className="flex flex-wrap justify-center gap-20 mb-6">
//         {filteredTools.map((tool) => (
//           <div key={tool._id} className="w-1/3 p-4 bg-transparent border border-gray-20 shadow-md rounded-lg">
//             <h3 className="text-center font-bold mb-2 text-white-800">{tool.category.toUpperCase()}</h3>
//             <div className="flex justify-between text-sm text-white-600 mt-2">
//               <span>{new Date(tool.date).toLocaleDateString()}</span>
//               <span>{tool.time}</span>
//             </div>
//             <ResponsiveContainer width="100%" height={250}>
              
//               <PieChart>
//                 <Pie
//                   data={generateChartData(tool.safetyPercentage)}
//                   dataKey="value"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={80}
//                   label
//                 >
//                   {COLORS.map((color, index) => (
//                     <Cell key={`cell-${index}`} fill={color} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//             <p className="text-center mt-2 text-blue-600">{tool.target}</p>
           
//           </div>
//         ))}
//       </div>

//       <h1 className="text-center text-white-500 text-3xl mt-12 mb-12">GRAPHICAL REPRESENTATION</h1>


//       {/* Bar Charts for 'all' category (Grouped by Target URL) */}
//           {selectedCategory === "all" && (
//       <div className="flex flex-wrap justify-center gap-20">

//         {Object.keys(groupedByTarget).map((target) => {
//           // Ensure there's valid data
//           const chartData = groupedByTarget[target].map((tool) => ({
//             category: tool.category,
//             safetyPercentage: parseFloat(tool.safetyPercentage), // Convert string to number
//           }));

//           return (
//             <div
//               key={target}
//               className="w-[48%] max-w-[600px] my-4 p-4 border rounded-lg shadow-md bg-transparent mt-100"
//             >
//               <h3 className="text-lg font-bold mb-2 text-center text-blue-980">{target}</h3>

//               {chartData.length > 0 ? (
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="category" />
//                     <YAxis domain={[0, 100]} />
//                     <Tooltip />
//                     <Legend />
//                     <Bar
//                       dataKey="safetyPercentage"
//                       fill="#8884d8"
//                       barSize={30}
//                       onMouseOver={(e) => (e.target.style.fill = "#666")}
//                       onMouseOut={(e) => (e.target.style.fill = "#8884d8")}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <p className="text-center text-gray-500">No data available for this target.</p>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     )}


//       {/* Table */}
//       <div className="w-full overflow-x-auto">
//         <table className="w-full border-collapse border border-gray-200 text-black">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border p-2">Target URL</th>
//               <th className="border p-2">Scan Results</th>
//               <th className="border p-2">Safety Percentage</th>
//               <th className="border p-2">Date</th>
//               <th className="border p-2">Time</th>
//               <th className="border p-2">Category</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredTools.map((tool) => (
//               <tr key={tool._id} className="text-center border-t text-white">
//                 <td className="border p-2">{tool.target}</td>
//                 <td className="border p-2">
//                   {tool.scanResults.map((result, index) => (
//                     <div key={index}>
//                       {result.name}: {result.result}
//                     </div>
//                   ))}
//                 </td>
//                 <td className="border p-2">{tool.safetyPercentage}</td>
//                 <td className="border p-2">{new Date(tool.date).toLocaleDateString()}</td>
//                 <td className="border p-2">{tool.time}</td>
//                 <td className="border p-2">{tool.category.toUpperCase()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default ToolComparison;



// -  - - - - - - - - - - - - - - - -- -    pie chart containercode with table start    -  -  - - - - - - - - - - - - - - - - - - 



// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// interface ScanResult {
//   name: string;
//   result: string;
// }

// interface SecurityTool {
//   _id: string;
//   target: string;
//   scanResults: ScanResult[]; // Change from string[] to ScanResult[]
//   safetyPercentage: string;
//   date: string;
//   time: string;
//   category: string; // owasp, virustotal, urlscanio
// }

// const COLORS = ["#28a745", "#dc3545"]; // Green for Safe, Red for Unsafe

// const ToolComparison: React.FC = () => {
//   const [tools, setTools] = useState<SecurityTool[]>([]);
//   const [filteredTools, setFilteredTools] = useState<SecurityTool[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState("all");

//   useEffect(() => {
//     const fetchTools = async () => {
//       try {
//         const response = await axios.get("http://localhost:5002/api/security-tools");
//         setTools(response.data);
//         setFilteredTools(response.data);
//       } catch (error) {
//         console.error("Error fetching tools:", error);
//       }
//     };
//     fetchTools();
//   }, []);

//   // Filter tools based on selected category
//   useEffect(() => {
//     if (selectedCategory === "all") {
//       setFilteredTools(tools);
//     } else {
//       setFilteredTools(tools.filter((tool) => tool.category === selectedCategory));
//     }
//   }, [selectedCategory, tools]);

//   // Generate pie chart data
//   const generateChartData = (safetyPercentage: string) => {
//     const safeValue = parseFloat(safetyPercentage.replace("% Safe", ""));
//     return [
//       { name: "Safe", value: safeValue },
//       { name: "Unsafe", value: 100 - safeValue },
//     ];
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-4">Security Tool Comparison</h2>

//       {/* Filter Buttons */}
//       <div className="mb-4 flex gap-4">
//         {["all", "owasp", "virustotal", "urlscanio"].map((category) => (
//           <button
//             key={category}
//             className={`px-4 py-2 border rounded ${selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
//             onClick={() => setSelectedCategory(category)}
//           >
//             {category.toUpperCase()}
//           </button>
//         ))}
//       </div>

//       {/* Pie Chart Section */}
      // <div className="flex flex-wrap justify-center gap-6 mb-6">
      //   {filteredTools.map((tool) => (
      //     <div key={tool._id} className="w-1/3 p-4 bg-transparent border border-gray-20 shadow-md rounded-lg">
      //       <h3 className="text-center font-bold mb-2 text-white-800">{tool.category.toUpperCase()}</h3>
      //       <div className="flex justify-between text-sm text-white-600 mt-2">
      //         <span>{new Date(tool.date).toLocaleDateString()}</span>
      //         <span>{tool.time}</span>
      //       </div>
      //       <ResponsiveContainer width="100%" height={250}>
              
      //         <PieChart>
      //           <Pie
      //             data={generateChartData(tool.safetyPercentage)}
      //             dataKey="value"
      //             nameKey="name"
      //             cx="50%"
      //             cy="50%"
      //             outerRadius={80}
      //             label
      //           >
      //             {COLORS.map((color, index) => (
      //               <Cell key={`cell-${index}`} fill={color} />
      //             ))}
      //           </Pie>
      //           <Tooltip />
      //           <Legend />
      //         </PieChart>
      //       </ResponsiveContainer>
      //       <p className="text-center mt-2 text-blue-600">{tool.target}</p>
           
      //     </div>
      //   ))}
      // </div>

//       {/* Table to display tools */}
//           <div className="w-full overflow-x-auto">
//             <table className="min-w-full border-collapse border border-gray-200 text-black">
//               <thead>
//                 <tr className="bg-gray-200">
//                   <th className="border p-2">Target URL</th>
//                   <th className="border p-2">Scan Results</th>
//                   <th className="border p-2">Safety Percentage</th>
//                   <th className="border p-2">Date</th>
//                   <th className="border p-2">Time</th>
//                   <th className="border p-2">Category</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredTools.map((tool) => (
//                   <tr key={tool._id} className="text-center border-t text-white">
//                     <td className="border p-2">{tool.target}</td>
//                     <td className="border p-2">
//                       {tool.scanResults.map((result, index) => (
//                         <div key={index}>
//                           {result.name}: {result.result}
//                         </div>
//                       ))}
//                     </td>
//                     <td className="border p-2">{tool.safetyPercentage}</td>
//                     <td className="border p-2">{new Date(tool.date).toLocaleDateString()}</td>
//                     <td className="border p-2">{tool.time}</td>
//                     <td className="border p-2">{tool.category.toUpperCase()}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//     </div>
//   );
// };

// export default ToolComparison;


// -  - - - - - - - - - - - - - - - - - - - - - - -   - -    pie chart code start    -  -  - - - - - - - - - - - - - - - - - - 

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// interface SecurityTool {
//   _id: string;
//   target: string;
//   scanResults: string[];
//   safetyPercentage: string;
//   date: string;
//   time: string;
//   category: string; // owasp, virustotal, urlscanio
// }

// const COLORS = ["#28a745", "#dc3545"]; // Green for Safe, Red for Unsafe

// const ToolComparison: React.FC = () => {
//   const [tools, setTools] = useState<SecurityTool[]>([]);
//   const [filteredTools, setFilteredTools] = useState<SecurityTool[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState("all");

//   useEffect(() => {
//     const fetchTools = async () => {
//       try {
//         const response = await axios.get("http://localhost:5002/api/security-tools");
//         setTools(response.data);
//         setFilteredTools(response.data);
//       } catch (error) {
//         console.error("Error fetching tools:", error);
//       }
//     };
//     fetchTools();
//   }, []);

//   // Filter tools based on selected category
//   useEffect(() => {
//     if (selectedCategory === "all") {
//       setFilteredTools(tools);
//     } else {
//       setFilteredTools(tools.filter((tool) => tool.category === selectedCategory));
//     }
//   }, [selectedCategory, tools]);

//   // Generate pie chart data
//   const generateChartData = (safetyPercentage: string) => {
//     const safeValue = parseFloat(safetyPercentage.replace("% Safe", ""));
//     return [
//       { name: "Safe", value: safeValue },
//       { name: "Unsafe", value: 100 - safeValue },
//     ];
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-4">Security Tool Comparison</h2>

//       {/* Filter Buttons */}
//       <div className="mb-4 flex gap-4">
//         {["all", "owasp", "virustotal", "urlscanio"].map((category) => (
//           <button
//             key={category}
//             className={`px-4 py-2 border rounded ${selectedCategory === category ? "bg-blue-980 text-white" : "bg-gray-200 text-black"}`}
//             onClick={() => setSelectedCategory(category)}
//           >
//             {category.toUpperCase()}
//           </button>
//         ))}
//       </div>

//       {/* Pie Chart Section */}
//       <div className="flex flex-wrap justify-center gap--1 mb-6">
//         {selectedCategory === "all"
//           ? ["owasp", "virustotal", "urlscanio"].map((category) => {
//               const tool = tools.find((t) => t.category === category);
//               return (
//                 tool && (
//                   <div key={category} className="w-1/3">
//                     <h3 className="text-center font-bold mb-2">{category.toUpperCase()}</h3>
//                     <ResponsiveContainer width="100%" height={250}>
//                       <PieChart>
//                         <Pie
//                           data={generateChartData(tool.safetyPercentage)}
//                           dataKey="value"
//                           nameKey="name"
//                           cx="50%"
//                           cy="50%"
//                           outerRadius={80}
//                           fill="#8884d8"
//                           label
//                         >
//                           {COLORS.map((color, index) => (
//                             <Cell key={`cell-${index}`} fill={color} />
//                           ))}
//                         </Pie>
//                         <Tooltip />
//                         <Legend />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 )
//               );
//             })
//           : filteredTools.map((tool) => (
//               <div key={tool._id} className="w-1/3">
//                 <h3 className="text-center font-bold mb-2">{tool.category.toUpperCase()}</h3>
//                 <ResponsiveContainer width="100%" height={250}>
//                   <PieChart>
//                     <Pie
//                       data={generateChartData(tool.safetyPercentage)}
//                       dataKey="value"
//                       nameKey="name"
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={80}
//                       fill="#8884d8"
//                       label
//                     >
//                       {COLORS.map((color, index) => (
//                         <Cell key={`cell-${index}`} fill={color} />
//                       ))}
//                     </Pie>
//                     <Tooltip />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             ))}
//       </div>

//       {/* Table to display tools */}
//       <table className="w-full border-collapse border border-gray-100 text-black">
//         <thead>
//           <tr className="bg-gray-200">
//             <th className="border p-2">Target URL</th>
//             <th className="border p-2">Scan Results</th>
//             <th className="border p-2">Safety Percentage</th>
//             <th className="border p-2">Date</th>
//             <th className="border p-2">Time</th>
//             <th className="border p-2">Category</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredTools.map((tool) => (
//             <tr key={tool._id} className="text-center border-t text-white">
//               <td className="border p-2">{tool.target}</td>
//               <td className="border p-2">
//                 {tool.scanResults.length > 0 ? tool.scanResults.join(", ") : "No findings"}
//               </td>
//               <td className="border p-2">{tool.safetyPercentage}</td>
//               <td className="border p-2">{new Date(tool.date).toLocaleDateString()}</td>
//               <td className="border p-2">{tool.time}</td>
//               <td className="border p-2">{tool.category.toUpperCase()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ToolComparison;
