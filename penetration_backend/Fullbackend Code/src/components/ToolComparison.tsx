import React, { useState } from 'react';
import { Search, Shield, Network, Check, X } from 'lucide-react';

const ToolComparison = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Tools' },
    { id: 'scanner', name: 'Vulnerability Scanners' },
    { id: 'pentest', name: 'Penetration Testing' },
    { id: 'network', name: 'Network Security' },
  ];

  const tools = [
    {
      name: 'Nessus',
      category: 'scanner',
      features: {
        automation: true,
        reporting: true,
        integration: true,
        customization: true,
        realtime: false,
      },
      price: '$$$',
      rating: 4.5,
    },
    {
      name: 'Burp Suite',
      category: 'pentest',
      features: {
        automation: true,
        reporting: true,
        integration: false,
        customization: true,
        realtime: true,
      },
      price: '$$$',
      rating: 4.8,
    },
    {
      name: 'Wireshark',
      category: 'network',
      features: {
        automation: false,
        reporting: true,
        integration: false,
        customization: true,
        realtime: true,
      },
      price: 'Free',
      rating: 4.7,
    },
  ];

  const filteredTools = selectedCategory === 'all' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Filter */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Security Tools Comparison</h2>
        <div className="flex flex-wrap gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-md ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-3 text-left">Tool</th>
              <th className="py-3 text-center">Automation</th>
              <th className="py-3 text-center">Reporting</th>
              <th className="py-3 text-center">Integration</th>
              <th className="py-3 text-center">Customization</th>
              <th className="py-3 text-center">Real-time</th>
              <th className="py-3 text-center">Price</th>
              <th className="py-3 text-center">Rating</th>
            </tr>
          </thead>
          <tbody>
            {filteredTools.map((tool) => (
              <tr key={tool.name} className="border-b border-gray-700">
                <td className="py-4">
                  <div className="font-medium">{tool.name}</div>
                </td>
                {Object.entries(tool.features).map(([feature, value]) => (
                  <td key={feature} className="py-4 text-center">
                    {value ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
                <td className="py-4 text-center">{tool.price}</td>
                <td className="py-4 text-center">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">
                    {tool.rating}/5
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ToolComparison;