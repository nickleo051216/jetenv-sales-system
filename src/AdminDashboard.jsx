import React, { useState, useEffect } from 'react';
import { initialClients, regulationsData } from './data/clients';
import { useNavigate } from 'react-router-dom';
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

const FlowchartView = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Summary from HTML Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-5 rounded-xl shadow-sm">
          <div className="text-3xl font-bold">4</div>
          <div className="text-sm opacity-90">進行中案件</div>
        </div>
        <div className="bg-gradient-to-br from-red-400 to-red-500 text-white p-5 rounded-xl shadow-sm">
          <div className="text-3xl font-bold">2</div>
          <div className="text-sm opacity-90">30天內到期</div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white p-5 rounded-xl shadow-sm">
          <div className="text-3xl font-bold">1月</div>
          <div className="text-sm opacity-90">目前申報熱季</div>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-5 rounded-xl shadow-sm">
          <div className="text-3xl font-bold">1</div>
          <div className="text-sm opacity-90">許可證即將到期</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-teal-600" />
          案件流程全貌 (傑太標準作業)
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          業務保命口訣：先拿「設置/水措」才能蓋，蓋完「試車」免罰款，最後拿「許可」才能營運。
        </p>

        {/* Flowchart Diagram */}
        <div className="relative overflow-x-auto p-4 min-w-[800px]">
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800 text-white px-8 py-3 rounded-lg shadow-lg font-bold border-l-4 border-teal-400">
              ✍️ 簽約啟動
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 text-center relative">
            {/* Soil */}
            <div className="flex flex-col items-center space-y-4">
              <span className="bg-amber-100 text-amber-800 px-4 py-1 rounded-full text-xs font-bold">🌍 土壤 (Soil)</span>
              <div className="w-full bg-amber-50 border border-amber-200 p-3 rounded text-sm">土壤前置作業</div>
              <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
              <div className="w-full bg-white border border-gray-300 p-3 rounded text-sm shadow-sm">現場篩測/檢測</div>
              <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
              <div className="w-full bg-amber-100 border border-amber-400 p-3 rounded text-sm font-bold text-amber-900 shadow-md">
                📄 土壤評估報告
              </div>
            </div>
            {/* Water */}
            <div className="flex flex-col items-center space-y-4">
              <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-xs font-bold">💧 廢水 (Water)</span>
              <div className="w-full bg-blue-50 border border-blue-200 p-3 rounded text-sm">廢水前置作業</div>
              <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
              <div className="w-full bg-white border border-gray-300 p-3 rounded text-sm shadow-sm">廢水工程規劃</div>
              <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
              {/* Added sticky note behavior */}
              <div className="w-full bg-red-50 border border-red-400 p-3 rounded text-sm font-bold text-red-800 shadow-md relative group cursor-pointer">
                📄 水措計畫書提送
                {/* Tooltip */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded mb-2 z-20 shadow-lg transition-opacity duration-200">
                  關鍵點：拿到這張核准函才能動工！
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
                {/* Ping Animation */}
                <div className="absolute top-0 right-0 -mt-2 -mr-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
              </div>
            </div>
            {/* Air */}
            <div className="flex flex-col items-center space-y-4">
              <span className="bg-purple-100 text-purple-800 px-4 py-1 rounded-full text-xs font-bold">💨 空氣 (Air)</span>
              <div className="w-full bg-purple-50 border border-purple-200 p-3 rounded text-sm">空氣前置作業</div>
              <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
              <div className="w-full bg-white border border-gray-300 p-3 rounded text-sm shadow-sm">空氣工程規劃</div>
              <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
              {/* Added sticky note behavior */}
              <div className="w-full bg-red-50 border border-red-400 p-3 rounded text-sm font-bold text-red-800 shadow-md relative group cursor-pointer">
                📄 設置許可提送
                {/* Tooltip */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded mb-2 z-20 shadow-lg transition-opacity duration-200">
                  關鍵點：拿到這張證才能開始安裝設備！
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
                {/* Ping Animation */}
                <div className="absolute top-0 right-0 -mt-2 -mr-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="my-8 flex items-center justify-center">
            <div className="bg-slate-100 text-slate-600 px-12 py-2 rounded-full text-sm font-bold border border-slate-200">
              🏛️ 環保局審件 & 工廠登記
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center mt-4">
            <div className="flex flex-col items-center space-y-4 border-r border-gray-100 pr-4">
              <div className="w-3/4 bg-blue-100 border border-blue-300 p-3 rounded text-sm font-medium">🚧 廢水工程完工</div>
              <div className="text-gray-400 text-xs">⬇</div>
              <div className="w-3/4 bg-white border border-gray-300 p-3 rounded text-sm">試車計畫書</div>
              <div className="text-gray-400 text-xs">⬇</div>
              <div className="w-3/4 bg-yellow-50 border border-yellow-300 p-3 rounded text-sm font-bold text-yellow-800">
                ⚙️ 試車 (數據可波動)
              </div>
              <div className="text-gray-400 text-xs">⬇</div>
              <div className="w-3/4 bg-green-100 border border-green-500 p-3 rounded text-sm font-bold text-green-900 shadow-md">
                🏆 排放許可證 (5年)
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 pl-4 relative">
              <div className="absolute right-0 top-10 w-32 bg-purple-50 border border-purple-200 text-xs p-2 rounded text-purple-800">
                ☠️ 毒化物申請
              </div>
              <div className="w-3/4 bg-purple-100 border border-purple-300 p-3 rounded text-sm font-medium">🚧 空氣工程完工</div>
              <div className="text-gray-400 text-xs">⬇</div>
              <div className="w-3/4 bg-white border border-gray-300 p-3 rounded text-sm">操作許可第一階段</div>
              <div className="text-gray-400 text-xs">⬇</div>
              <div className="w-3/4 bg-yellow-50 border border-yellow-300 p-3 rounded text-sm font-bold text-yellow-800">
                ⚙️ 試車 (數據可波動)
              </div>
              <div className="text-gray-400 text-xs">⬇</div>
              <div className="w-3/4 bg-green-100 border border-green-500 p-3 rounded text-sm font-bold text-green-900 shadow-md">
                🏆 操作許可證 (5年)
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="bg-slate-700 text-white px-8 py-3 rounded-lg font-bold text-sm">
              🔚 廢清書提送 (結案)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Updated Compliance View (Month Grid Style) ---
const ComplianceView = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const getMonthDeadlines = (month) => {
    return regulationsData.filter(r => r.months.includes(month));
  };

  const deadlines = getMonthDeadlines(selectedMonth);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-teal-600" />
          全年申報概覽 (點選月份查看)
        </h3>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
            const count = getMonthDeadlines(month).length;
            const hasItems = count > 0;
            const isSelected = selectedMonth === month;

            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`
                  p-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center h-20
                  ${isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105'
                    : hasItems
                      ? 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100'
                      : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}
                `}
              >
                <span className="text-lg font-bold">{month}月</span>
                <span className="text-xs opacity-80">{count > 0 ? `${count}項` : '-'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-teal-600 text-white p-4">
          <h2 className="text-xl font-bold flex items-center">
            📅 {selectedMonth}月 申報項目
            <span className="ml-3 text-sm bg-teal-700 px-2 py-1 rounded-full font-normal">
              共 {deadlines.length} 項待辦
            </span>
          </h2>
        </div>

        {deadlines.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {deadlines.map(item => (
              <div key={item.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${item.category === 'air' ? 'bg-purple-100 text-purple-700' :
                          item.category === 'water' ? 'bg-blue-100 text-blue-700' :
                            item.category === 'toxic' ? 'bg-red-100 text-red-700' :
                              item.category === 'soil' ? 'bg-amber-100 text-amber-700' :
                                'bg-orange-100 text-orange-700'
                        }`}>
                        {item.categoryName}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{item.item}</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.period}</p>
                    <div className="flex flex-col gap-1 text-sm text-gray-500">
                      <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center hover:text-teal-600">
                        <FileText className="w-3 h-3 mr-1" /> {item.law} <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    </div>
                    {item.warning && (
                      <div className="mt-3 bg-red-50 text-red-800 text-xs p-2 rounded border border-red-100 flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {item.warning}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[140px] items-end">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-bold border border-red-100">
                      <Clock className="w-4 h-4 mr-1" /> {item.deadline}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-200" />
            <p className="text-lg font-medium text-gray-600">太棒了！本月沒有法定申報項目</p>
            <p className="text-sm mt-2">您可以利用這段時間拜訪客戶或整理文件。</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Updated Regulation Library View (Search & Filter Logic) ---
const RegulationLibraryView = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredRegulations = regulationsData.filter(reg => {
    const matchesCategory = filter === 'all' || reg.category === filter;
    const matchesSearch = reg.item.includes(search) || reg.law.includes(search) || reg.categoryName.includes(search);
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: '📚 全部', class: 'bg-slate-800 text-white' },
    { id: 'air', label: '💨 空氣', class: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { id: 'water', label: '💧 水污', class: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { id: 'toxic', label: '☢️ 毒化物', class: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { id: 'soil', label: '🌍 土壤', class: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { id: 'factory', label: '🏭 工廠', class: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-teal-600" />
          法規資料庫 (Regulation Library)
        </h2>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="🔍 搜尋法規名稱、條號..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all 
                  ${filter === cat.id
                    ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-600 ring-offset-2'
                    : `${cat.class} border border-transparent`}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredRegulations.length > 0 ? (
          filteredRegulations.map(reg => (
            <div key={reg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className={`px-5 py-3 flex justify-between items-center border-b border-gray-50
                ${reg.category === 'air' ? 'bg-purple-50' :
                  reg.category === 'water' ? 'bg-blue-50' :
                    reg.category === 'toxic' ? 'bg-red-50' :
                      reg.category === 'soil' ? 'bg-amber-50' :
                        'bg-orange-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded 
                    ${reg.category === 'air' ? 'bg-purple-100 text-purple-700' :
                      reg.category === 'water' ? 'bg-blue-100 text-blue-700' :
                        reg.category === 'toxic' ? 'bg-red-100 text-red-700' :
                          reg.category === 'soil' ? 'bg-amber-100 text-amber-700' :
                            'bg-orange-100 text-orange-700'}`}>
                    {reg.categoryName}
                  </span>
                  <span className="font-bold text-gray-800">{reg.item}</span>
                </div>
                <a
                  href={reg.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-colors flex items-center"
                >
                  法規 <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-1">法規依據</div>
                  <div className="font-medium text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    {reg.law}
                  </div>
                </div>

                <details className="group/details">
                  <summary className="flex items-center text-sm font-medium text-teal-600 cursor-pointer hover:text-teal-800 select-none">
                    <ChevronDown className="w-4 h-4 mr-1 transition-transform group-open/details:rotate-180" />
                    查看詳細內容
                  </summary>
                  <div className="mt-3 bg-gray-50 rounded-lg p-4 text-sm space-y-3">
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {reg.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                    {reg.warning && (
                      <div className="bg-red-100 text-red-800 px-3 py-2 rounded text-xs border border-red-200">
                        {reg.warning}
                      </div>
                    )}
                    {reg.tip && (
                      <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-xs border border-green-200 flex items-center">
                        <span className="mr-2">💡</span> {reg.tip}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>找不到符合條件的法規資料</p>
            <button onClick={() => { setFilter('all'); setSearch('') }} className="mt-4 text-teal-600 hover:underline">
              清除篩選
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
