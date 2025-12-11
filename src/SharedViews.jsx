import React, { useState } from 'react';
import { regulationsData } from './data/clients';
import {
    Calendar,
    FileText,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronDown,
    Search,
    BookOpen,
    ExternalLink,
} from 'lucide-react';

// Flowchart View - 案件流程全貌
export const FlowchartView = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Summary */}
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
                            <div className="w-full bg-red-50 border border-red-400 p-3 rounded text-sm font-bold text-red-800 shadow-md relative group cursor-pointer">
                                📄 水措計畫書提送
                                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded mb-2 z-20 shadow-lg transition-opacity duration-200">
                                    關鍵點：拿到這張核准函才能動工！
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
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
                            <div className="w-full bg-red-50 border border-red-400 p-3 rounded text-sm font-bold text-red-800 shadow-md relative group cursor-pointer">
                                📄 設置許可提送
                                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded mb-2 z-20 shadow-lg transition-opacity duration-200">
                                    關鍵點：拿到這張證才能開始安裝設備！
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
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

// Compliance View - 申報行事曆
export const ComplianceView = () => {
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

// Regulation Library View - 法規資料庫
export const RegulationLibraryView = () => {
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
