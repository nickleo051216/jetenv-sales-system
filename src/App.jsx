import React, { useState } from 'react';
import { LayoutDashboard, Calendar, BookOpen, Users, LogOut, TrendingUp, AlertCircle, CheckCircle, Search, ArrowRight, Bell } from 'lucide-react';
import ClientPortal from './ClientPortal';

function App() {
  // 1. 控制全域模式：'admin' (內部管理) 或 'client' (客戶查詢)
  const [viewMode, setViewMode] = useState('admin');
  
  // 2. 控制內部管理系統的「分頁」
  const [activeTab, setActiveTab] = useState('dashboard');

  // 如果模式是 'client'，就直接顯示客戶查詢頁面
  if (viewMode === 'client') {
    return <ClientPortal onBack={() => setViewMode('admin')} />;
  }

  // --- 內部管理系統的內容渲染邏輯 ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'calendar':
        return <CalendarView />;
      case 'regulations':
        return <RegulationsView />;
      case 'clients':
        return <ClientsView onPreviewClient={() => setViewMode('client')} />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* 頂部導航列 */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">JET Sales Command</h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wider mt-0.5">傑太環境工程顧問 v2.1</p>
              </div>
            </div>
            
            {/* 右上角切換按鈕區 */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                系統連線正常
              </div>
              <button
                onClick={() => setViewMode('client')}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95 duration-200"
              >
                <Users size={16} />
                切換至客戶查詢入口
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容區 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 功能分頁卡片區 (導航) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <NavCard 
            icon={<LayoutDashboard />} 
            title="戰情首頁" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <NavCard 
            icon={<Calendar />} 
            title="申報行事曆" 
            isActive={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')}
          />
          <NavCard 
            icon={<BookOpen />} 
            title="法規資料庫" 
            isActive={activeTab === 'regulations'} 
            onClick={() => setActiveTab('regulations')}
          />
          <NavCard 
            icon={<Users />} 
            title="客戶管理" 
            isActive={activeTab === 'clients'} 
            onClick={() => setActiveTab('clients')}
          />
        </div>

        {/* 動態內容顯示區 */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>

      </main>
    </div>
  );
}

// --- 以下是各個分頁的子元件 (模擬原本的功能) ---

// 1. 戰情首頁
function DashboardView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="進行中案件" value="12" sub="較上月 +2" color="blue" />
        <StatCard title="30天內到期" value="5" sub="急件處理中" color="red" />
        <StatCard title="本季申報完成率" value="85%" sub="進度超前" color="green" />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Bell className="text-blue-500" size={20} />
          今日待辦事項
        </h3>
        <div className="space-y-3">
          <TodoItem text="聯繫台積電確認廢水檢測報告數據" time="10:00 AM" urgent />
          <TodoItem text="提交聯發科空污許可異動申請書" time="02:00 PM" />
          <TodoItem text="更新法規資料庫：水污費費率調整" time="04:30 PM" />
        </div>
      </div>
    </div>
  );
}

// 2. 申報行事曆
function CalendarView() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Calendar className="text-purple-500" size={20} />
        2024年 申報時程表
      </h3>
      <div className="space-y-4">
        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <div className="text-center min-w-[60px]">
            <span className="block text-sm text-gray-500">JAN</span>
            <span className="block text-2xl font-bold text-blue-600">31</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-800">空污費 (第四季) 申報截止</h4>
            <p className="text-sm text-gray-500">適用對象：所有列管固定污染源</p>
          </div>
        </div>
        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <div className="text-center min-w-[60px]">
            <span className="block text-sm text-gray-500">JAN</span>
            <span className="block text-2xl font-bold text-green-600">31</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-800">水污費 (下半年) 申報截止</h4>
            <p className="text-sm text-gray-500">請確認水量計讀數照片已上傳</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. 法規資料庫
function RegulationsView() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <BookOpen className="text-yellow-500" size={20} />
          最新環保法規異動
        </h3>
        <div className="relative">
          <input type="text" placeholder="搜尋法規..." className="pl-8 pr-4 py-2 border rounded-lg text-sm bg-gray-50" />
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
        </div>
      </div>
      <div className="space-y-0 divide-y">
        <RegItem date="2023/12/01" title="水污染防治措施及檢測申報管理辦法修正" tag="水污" />
        <RegItem date="2023/11/15" title="固定污染源設置與操作許可證管理辦法部分條文修正" tag="空污" />
        <RegItem date="2023/10/30" title="事業廢棄物貯存清除處理方法及設施標準" tag="廢棄物" />
      </div>
    </div>
  );
}

// 4. 客戶管理 (這裡加上了預覽按鈕)
function ClientsView({ onPreviewClient }) {
  const clients = [
    { id: 1, name: "台積電範例廠", taxId: "12345678", contact: "陳經理", status: "正常" },
    { id: 2, name: "聯發科範例二廠", taxId: "87654321", contact: "林主任", status: "注意" },
    { id: 3, name: "日月光範例三廠", taxId: "11223344", contact: "黃課長", status: "正常" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Users className="text-blue-600" size={20} />
          列管客戶名單
        </h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + 新增客戶
        </button>
      </div>
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-700 font-medium">
          <tr>
            <th className="p-4">公司名稱</th>
            <th className="p-4">統一編號</th>
            <th className="p-4">聯絡窗口</th>
            <th className="p-4">狀態</th>
            <th className="p-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clients.map(client => (
            <tr key={client.id} className="hover:bg-gray-50 transition">
              <td className="p-4 font-bold text-gray-900">{client.name}</td>
              <td className="p-4 font-mono">{client.taxId}</td>
              <td className="p-4">{client.contact}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${client.status === '正常' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {client.status}
                </span>
              </td>
              <td className="p-4 text-right">
                <button 
                  onClick={onPreviewClient}
                  className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition"
                >
                  預覽客戶視角
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- 通用小元件 ---

function NavCard({ icon, title, isActive, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center h-32
        ${isActive 
          ? 'bg-blue-50 border-blue-500 shadow-md transform scale-105' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
    >
      <div className={`p-3 rounded-full ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <span className={`font-bold ${isActive ? 'text-blue-800' : 'text-gray-600'}`}>{title}</span>
    </div>
  );
}

function StatCard({ title, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <p className="text-gray-500 text-sm font-medium mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-black text-gray-900">{value}</h4>
        <span className={`text-xs px-2 py-1 rounded-full border ${colors[color]}`}>{sub}</span>
      </div>
    </div>
  );
}

function TodoItem({ text, time, urgent }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition group cursor-pointer border border-transparent hover:border-gray-100">
      <div className={`mt-1 w-2 h-2 rounded-full ${urgent ? 'bg-red-500 animate-pulse' : 'bg-blue-300'}`}></div>
      <div className="flex-1">
        <p className={`text-sm ${urgent ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{text}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
      <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
}

function RegItem({ date, title, tag }) {
  return (
    <div className="py-4 hover:bg-gray-50 px-4 -mx-4 transition cursor-pointer flex justify-between items-center group">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-400">{date}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
        </div>
        <h4 className="text-gray-800 font-medium group-hover:text-blue-600 transition">{title}</h4>
      </div>
      <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500" />
    </div>
  );
}

export default App;
