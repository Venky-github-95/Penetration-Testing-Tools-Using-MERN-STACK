import React, { useState } from 'react';
import { FileText, Download, AlertTriangle, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const SecurityReports = () => {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const reports = [
    {
      id: '1',
      title: 'Web Application Security Audit',
      date: '2024-03-15',
      severity: 'critical',
      findings: [
        { title: 'SQL Injection Vulnerability', severity: 'critical' },
        { title: 'Cross-Site Scripting (XSS)', severity: 'high' },
        { title: 'Insecure Direct Object References', severity: 'medium' },
      ],
      summary: 'Critical vulnerabilities found in the authentication system.',
    },
    {
      id: '2',
      title: 'Network Infrastructure Scan',
      date: '2024-03-14',
      severity: 'medium',
      findings: [
        { title: 'Outdated SSL Certificates', severity: 'medium' },
        { title: 'Open Ports', severity: 'low' },
      ],
      summary: 'Several security misconfigurations detected in network services.',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/20 border-red-500/50';
      case 'high':
        return 'text-orange-500 bg-orange-500/20 border-orange-500/50';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/50';
      default:
        return 'text-blue-500 bg-blue-500/20 border-blue-500/50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Reports List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Security Reports</h2>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-900 rounded-lg">
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-6 w-6 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-400">{report.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm border ${getSeverityColor(report.severity)}`}>
                      {report.severity.toUpperCase()}
                    </span>
                    {expandedReport === report.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>

              {expandedReport === report.id && (
                <div className="p-4 border-t border-gray-700">
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-gray-400">{report.summary}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Findings</h4>
                    <div className="space-y-2">
                      {report.findings.map((finding, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${getSeverityColor(finding.severity)}`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{finding.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityReports;