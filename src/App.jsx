import React, { useState } from 'react';
import { LayoutDashboard, Calendar, BookOpen, Users, LogOut } from 'lucide-react';
import ClientPortal from './ClientPortal'; // 引入剛剛做好的客戶查詢頁面

function App() {
  // 這裡控制現在要顯示「內部管理」還是「客戶查詢」
  // 'admin' = 內部管理系統, 'client' = 客戶查詢系統
  const [viewMode, setViewMode] = useState('admin');

  // 如果現在模式是 'client'，就直接顯示客戶查詢頁面
  if (viewMode === 'client') {
    return <ClientPortal onBack={() => setViewMode('admin')} />;
  }

  // --- 以下是原本的內部管理系統 (Admin Dashboard) ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {/* 頂部導航列 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">JET Sales Command</h1>
                <p className="text-xs text-gray-500">傑太環境工程顧問 - 業務管理系統 v2.0</p>
              </div>
            </div>

            {/* 右上角切換按鈕區 */}
            <div className="flex items-center">
              <button
                onClick={() => setViewMode('client')}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
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
        {/* 功能卡片區 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard icon={<LayoutDashboard />} title="戰情首頁" />
          <DashboardCard icon={<Calendar />} title="申報行事曆" />
          <DashboardCard icon={<BookOpen />} title="法規資料庫" />
          <DashboardCard icon={<Users />} title="客戶管理" active />
        </div>

        {/* 這裡是內容顯示區 (這裡先放一些示範文字) */}
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <h2 className="text-xl font-bold text-gray-700 mb-4">內部管理戰情室</h2>
          <p>這裡是業務和工程師操作的介面。</p>
          <p className="mt-2">點擊右上角的按鈕，可以預覽「給客戶看的畫面」。</p>
        </div>
      </main>
    </div>
  );
}

// 小元件：功能卡片
function DashboardCard({ icon, title, active }) {
  return (
    <div className={`p-6 rounded-xl shadow-sm border transition-all cursor-pointer flex items-center gap-4 ${active ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' : 'bg-white border-gray-100 hover:shadow-md'}`}>
      <div className={`p-3 rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
  );
}

export default App;