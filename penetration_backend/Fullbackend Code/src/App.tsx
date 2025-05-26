import { Shield, Search, Terminal, FileBarChart, Menu, X, User, Bug, PieChart, Globe, FileMinus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import VulnerabilityScan from './components/VulnerabilityScan';
import Virustotal from './components/Virustotal';
import ToolComparison from './components/ToolComparison';
import SecurityReports from './components/SecurityReports';
import Urlscan from './components/Urlscan';
import Owasp from './components/Owasp';
import Auth from './components/Auth';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigation = [
    { name: 'Vulnerability Scan', href: 'scan', icon: ShieldAlert },
    { name: 'OWASP Scan', href: 'owasp', icon: Search },
    { name: 'Virus Total', href: 'virustotal', icon: Bug },
    { name: 'URLScan io', href: 'urlscan', icon: Globe },
    { name: 'Tool Comparison', href: 'tools', icon: PieChart },
    { name: 'Security Reports', href: 'reports', icon: FileMinus },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500" />
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setCurrentPage(item.href)}
                      className={`${
                        currentPage === item.href ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      } px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAuth(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <User className="h-4 w-4" />
                {isAuthenticated ? 'Account' : 'Sign In'}
              </button>
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setCurrentPage(item.href);
                    setIsMenuOpen(false);
                  }}
                  className={`${
                    currentPage === item.href ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowAuth(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {isAuthenticated ? 'Account' : 'Sign In'}
              </button>
            </div>
          </div>
        )}
      </nav>

      <main>
        <div style={{ display: currentPage === 'home' ? 'block' : 'none' }}>
          <div className="relative h-[600px] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80")' }}>
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Unleashing the Power of <span className="text-blue-500">Security Testing Tools</span>
              </h1>
              <button onClick={() => setCurrentPage('scan')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                Start Scanning
              </button>


              
            </div>
          </div>
          {/* Features section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <Search className="h-12 w-12 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Vulnerability Scanning</h3>
                  <p className="text-gray-400">Comprehensive scanning tools to identify security weaknesses in your systems.</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <Terminal className="h-12 w-12 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Penetration Testing</h3>
                  <p className="text-gray-400">Advanced penetration testing tools to simulate cyber attacks and assess security.</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <FileBarChart className="h-12 w-12 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Detailed Reports</h3>
                  <p className="text-gray-400">Comprehensive security reports with actionable insights and recommendations.</p>
                </div>
              </div>
            </div>
        </div>
        <div style={{ display: currentPage === 'scan' ? 'block' : 'none' }}>
          <VulnerabilityScan />
        </div>

        <div style={{ display: currentPage === 'owasp' ? 'block' : 'none' }}>
          <Owasp />
        </div>

        <div style={{ display: currentPage === 'virustotal' ? 'block' : 'none' }}>
          <Virustotal />
        </div>

        <div style={{ display: currentPage === 'tools' ? 'block' : 'none' }}>
          <ToolComparison />
        </div>

        <div style={{ display: currentPage === 'reports' ? 'block' : 'none' }}>
          <SecurityReports />
        </div>

        <div style={{ display: currentPage === 'urlscan' ? 'block' : 'none' }}>
          <Urlscan />
        </div>
      </main>

      {showAuth && <Auth onClose={() => setShowAuth(false)} onSuccess={() => setIsAuthenticated(true)} />}
    </div>
  );
}

export default App;
