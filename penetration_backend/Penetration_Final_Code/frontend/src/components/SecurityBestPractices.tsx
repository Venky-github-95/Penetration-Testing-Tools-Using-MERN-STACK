import React, { useState } from 'react';
import { Shield, Check, ChevronDown, ChevronUp, BookOpen, AlertTriangle } from 'lucide-react';

const SecurityBestPractices = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('authentication');

  const sections = [
    {
      id: 'authentication',
      title: 'Authentication & Authorization',
      icon: Shield,
      practices: [
        'Implement multi-factor authentication (MFA)',
        'Use strong password policies',
        'Implement proper session management',
        'Regular access review and cleanup',
      ],
      guide: 'Authentication is crucial for system security. Follow these steps to implement secure authentication...',
    },
    {
      id: 'data',
      title: 'Data Protection',
      icon: Shield,
      practices: [
        'Encrypt sensitive data at rest',
        'Secure data in transit using TLS',
        'Implement proper backup strategies',
        'Regular data access auditing',
      ],
      guide: 'Protecting sensitive data requires multiple layers of security...',
    },
    {
      id: 'network',
      title: 'Network Security',
      icon: Shield,
      practices: [
        'Implement network segmentation',
        'Regular security patching',
        'Use intrusion detection systems',
        'Monitor network traffic',
      ],
      guide: 'Network security is fundamental to protecting your infrastructure...',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Best Practices Overview */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-8 w-8 text-blue-500" />
          <h2 className="text-2xl font-bold">Security Best Practices</h2>
        </div>

        <div className="text-gray-300 mb-6">
          <p>
            Following security best practices is crucial for maintaining a strong security posture.
            Explore our comprehensive guides and recommendations below.
          </p>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Quick Security Tips</h3>
          </div>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Regularly update all software and systems</li>
            <li>Use strong, unique passwords for all accounts</li>
            <li>Enable multi-factor authentication wherever possible</li>
            <li>Regularly backup important data</li>
          </ul>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-gray-800 rounded-lg">
            <button
              className="w-full p-6 flex items-center justify-between"
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            >
              <div className="flex items-center gap-4">
                <section.icon className="h-6 w-6 text-blue-500" />
                <h3 className="text-xl font-medium">{section.title}</h3>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="px-6 pb-6 border-t border-gray-700 pt-4">
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Recommended Practices</h4>
                  <div className="space-y-2">
                    {section.practices.map((practice, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Implementation Guide</h4>
                  <p className="text-gray-400">{section.guide}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBestPractices;