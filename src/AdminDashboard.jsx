import React, { useState, useEffect } from 'react';
import { initialClients, regulationsData } from './data/clients';
import { useNavigate } from 'react-router-dom';
import { FlowchartView, ComplianceView, RegulationLibraryView } from './SharedViews';
import {
  Calendar,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Droplets,
  Wind,
  Sprout,
  Search,
  Users,
  LayoutDashboard,
  Menu,
  X,
  BookOpen,
  ExternalLink,
  Filter,
  Phone,
  Globe
} from 'lucide-react';

// --- Client List Data ---
// --- Client List Data ---
// Imported from ./data/clients.js

// --- MASTER REGULATION DATA (Source of Truth) ---
// This dataset drives both the Calendar and the Library views.
// --- MASTER REGULATION DATA (Source of Truth) ---
// Imported from ./data/clients.js

// --- Helper Components ---

const Navigation = ({ activeTab, setActiveTab, isMobile, setMenuOpen }) => {
  const navItems = [
    { id: 'dashboard', label: '戰情首頁', icon: LayoutDashboard },
    { id: 'compliance', label: '申報行事曆', icon: Calendar },
    { id: 'library', label: '法規資料庫', icon: BookOpen },
    { id: 'clients', label: '客戶管理', icon: Users },
  ];

  return (
    <nav className={`${isMobile ? 'flex flex-col space-y-2 p-4' : 'flex space-x-4'}`}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id);
            if (isMobile) setMenuOpen(false);
          }}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${activeTab === item.id
            ? 'bg-teal-600 text-white shadow-lg'
            : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'
            }`}
        >
          <item.icon className="w-4 h-4 mr-2" />
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- View Components ---
// FlowchartView, ComplianceView, RegulationLibraryView imported from SharedViews.jsx



// --- Client Management View ---
const ClientView = () => {
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c =>
    c.name.includes(searchTerm) || c.status.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">客戶案件管理 (Clients)</h2>
          <p className="text-sm text-gray-500">管理目前手上的案件進度與代辦事項。</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋客戶名稱..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Status Bar */}
            <div className={`h-1.5 w-full ${client.phase === 1 ? 'bg-red-500' :
              client.phase === 2 ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />

            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-800">{client.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${client.status === '營運中' ? 'bg-green-100 text-green-800' :
                  client.status === '試車階段' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {client.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {client.type.map(t => (
                  <span key={t} className={`text-xs px-2 py-0.5 rounded border 
                    ${t === 'Air' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      t === 'Water' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        t === 'Soil' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'}`}>
                    {t === 'Air' ? '💨 空氣' : t === 'Water' ? '💧 廢水' : t === 'Soil' ? '🌍 土壤' : '☢️ 毒化'}
                  </span>
                ))}
              </div>

              <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-gray-600">
                  <span>下一步:</span>
                  <span className="font-medium text-gray-900">{client.nextAction}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>期限:</span>
                  <span className="font-bold text-red-600">{client.deadline}</span>
                </div>
              </div>

              <button className="w-full mt-4 py-2 text-sm text-teal-600 font-medium border border-teal-200 rounded hover:bg-teal-50 transition-colors">
                更新進度 →
              </button>
            </div>
          </div>
        ))}

        <button className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors min-h-[250px] group">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-teal-50 transition-colors">
            <span className="text-3xl font-light pb-1 group-hover:text-teal-500">+</span>
          </div>
          <span className="font-medium">新增案件</span>
        </button>
      </div>
    </div>
  );
};

// --- Footer ---
const Footer = () => (
  <footer className="bg-gray-800 text-white py-12 border-t border-gray-700 mt-auto">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-3 gap-12 text-sm">
        {/* Column 1: Contact Info */}
        <div>
          <h3 className="font-bold text-lg mb-4 text-teal-400 flex items-center">
            <Users className="w-5 h-5 mr-2" /> 聯絡資訊
          </h3>
          <p className="font-bold text-white text-base mb-1">傑太環境工程顧問有限公司</p>
          <p className="text-gray-400 text-xs mb-3">JET Environmental Engineering Ltd</p>

          <p className="font-bold text-white mb-1">業務副理 張惟荏</p>
          <p className="text-gray-400 mb-1 flex items-center"><Phone className="w-3 h-3 mr-2" /> (02)6609-5888 #103</p>
          <p className="text-gray-400">🧾 統編: 60779653</p>
        </div>

        {/* Column 2: Related Links */}
        <div>
          <h3 className="font-bold text-lg mb-4 text-teal-400 flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" /> 相關連結
          </h3>
          <ul className="space-y-3 text-gray-400">
            <li>
              <a href="https://www.jetenv.com.tw/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors flex items-center">
                <Globe className="w-4 h-4 mr-2" /> 官方網站
              </a>
            </li>
            <li>
              <a href="https://lin.ee/mTFxpvM" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors flex items-center">
                <div className="w-4 h-4 mr-2 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">L</div> 官方 Line 帳號
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Regulation Resources (Unchanged) */}
        <div>
          <h3 className="font-bold text-lg mb-4 text-teal-400 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" /> 官方法規資源
          </h3>
          <ul className="space-y-2 text-gray-400">
            <li><a href="https://law.moj.gov.tw/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors">全國法規資料庫</a></li>
            <li><a href="https://oaout.moenv.gov.tw/law/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors">環境部法規查詢</a></li>
            <li><a href="https://law.moea.gov.tw/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors">經濟部法規查詢</a></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-xs">
        <p>傑太環境工程顧問有限公司 - 業務法規參考手冊</p>
        <p className="mt-1">Designed by Nick Chang (ZN Studio) | 法規資料已查證更新至 2024年12月</p>
      </div>
    </div>
  </footer>
);

// --- Main App Shell ---
export default function App() {
  const navigate = useNavigate(); // Add this line
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="bg-teal-600 text-white p-1.5 rounded mr-3">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">JET Sales Command</h1>
                <p className="text-xs text-gray-500 hidden sm:block">傑太環境工程顧問 - 業務管理系統 v2.0</p>
              </div>
              {/* Back to Home Button */}
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/'); }}
                className="ml-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded text-xs font-bold transition-colors"
              >
                退出 (Exit)
              </button>
            </div>

            {!isMobile && (
              <Navigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobile={false}
              />
            )}

            {isMobile && (
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600">
                {menuOpen ? <X /> : <Menu />}
              </button>
            )}
          </div>
        </div>

        {isMobile && menuOpen && (
          <div className="bg-white border-t border-gray-100 absolute w-full shadow-lg z-50">
            <Navigation
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); setMenuOpen(false); }}
              isMobile={true}
              setMenuOpen={setMenuOpen}
            />
          </div>
        )}
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'dashboard' && <FlowchartView />}
        {activeTab === 'compliance' && <ComplianceView />}
        {activeTab === 'library' && <RegulationLibraryView />}
        {activeTab === 'clients' && <ClientView />}
      </main>

      <Footer />
    </div>
  );
}
