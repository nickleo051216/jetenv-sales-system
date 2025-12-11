import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockClientDatabase } from './data/clients';
import { FlowchartView, ComplianceView, RegulationLibraryView } from './SharedViews';
import { Search, Phone, FileText, CheckCircle, AlertTriangle, XCircle, Wind, Droplets, Trash2, Skull, ArrowRight, Calendar, BarChart3, Activity, LayoutDashboard, BookOpen, Menu, X } from 'lucide-react';

// License Card Component
const LicenseCard = ({ type, data }) => {
    if (data.status === 'none') return null;

    let icon = null;
    let title = "";
    let colorClass = "";
    let statusText = "";

    switch (type) {
        case 'air': icon = <Wind size={32} />; title = "空污 (Air)"; break;
        case 'water': icon = <Droplets size={32} />; title = "水污 (Water)"; break;
        case 'waste': icon = <Trash2 size={32} />; title = "廢棄物 (Waste)"; break;
        case 'toxic': icon = <Skull size={32} />; title = "毒化物 (Toxic)"; break;
        default: break;
    }

    switch (data.status) {
        case 'normal':
            colorClass = "border-green-500 bg-green-50 text-green-700";
            statusText = "正常有效";
            break;
        case 'warning':
            colorClass = "border-yellow-500 bg-yellow-50 text-yellow-700 animate-pulse";
            statusText = "即將到期";
            break;
        case 'expired':
            colorClass = "border-red-500 bg-red-50 text-red-700";
            statusText = "已過期/異常";
            break;
        default: break;
    }

    return (
        <div className={`border-l-8 rounded-r-xl p-4 shadow-md bg-white flex items-center justify-between mb-4 transform hover:scale-[1.02] transition duration-200 ${colorClass.replace('text-', 'border-')}`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-white/60 ${colorClass.split(' ')[2]}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-xl text-gray-800">{title}</h3>
                    <p className="text-base font-medium opacity-80">{data.name}</p>
                </div>
            </div>
            <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-1 shadow-sm ${colorClass}`}>
                    {statusText}
                </span>
                <p className="text-gray-700 font-mono font-bold text-xl">{data.date}</p>
                <p className="text-xs text-gray-500">有效期限</p>
            </div>
        </div>
    );
};

// Navigation Component for Client Portal
const ClientNavigation = ({ activeTab, setActiveTab, isMobile, setMenuOpen }) => {
    const navItems = [
        { id: 'dashboard', label: '我的進度', icon: LayoutDashboard },
        { id: 'flowchart', label: '流程圖', icon: Activity },
        { id: 'compliance', label: '申報行事曆', icon: Calendar },
        { id: 'library', label: '法規資料庫', icon: BookOpen },
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
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span className="font-medium">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const ClientPortal = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [inputTaxId, setInputTaxId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobile, setIsMobile] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Deep Linking: Auto-login if ?id=... exists
    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
            setInputTaxId(idFromUrl);
            const result = mockClientDatabase.find(client => client.taxId === idFromUrl);
            if (result) {
                setSearchResult(result);
                setHasSearched(true);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSearch = () => {
        const result = mockClientDatabase.find(client => client.taxId === inputTaxId);
        setSearchResult(result);
        setHasSearched(true);
    };

    // Search View
    if (!searchResult) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 font-sans">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-wide">傑太環保案件查詢</h1>
                    <p className="text-gray-500 text-lg">輸入統編，即時掌握許可證進度</p>
                </div>

                <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl mb-8 border border-gray-200">
                    <label className="block text-xl font-bold text-gray-800 mb-4 text-center">
                        請輸入貴公司統一編號
                    </label>
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="例如：12345678"
                            className="w-full border-2 border-gray-300 rounded-xl px-6 py-4 text-2xl text-center focus:ring-4 focus:ring-blue-200 focus:border-blue-600 outline-none transition-all placeholder-gray-300"
                            value={inputTaxId}
                            onChange={(e) => setInputTaxId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            className="w-full bg-blue-600 text-white text-xl font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg flex justify-center items-center gap-2"
                        >
                            <Search size={24} />
                            開始查詢
                        </button>
                    </div>
                </div>

                {hasSearched && !searchResult && (
                    <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
                        <AlertTriangle className="mx-auto mb-4 text-orange-500" size={64} />
                        <p className="text-2xl font-bold text-gray-700">找不到此統編</p>
                        <button onClick={() => setHasSearched(false)} className="mt-6 text-blue-600 underline text-lg">重新輸入</button>
                    </div>
                )}

                <button
                    onClick={() => navigate('/')}
                    className="fixed bottom-6 left-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm bg-white/90 px-5 py-3 rounded-full shadow-lg backdrop-blur border border-gray-200 font-bold transition transform hover:scale-105"
                >
                    <ArrowRight size={16} className="rotate-180" />
                    返回首頁
                </button>
            </div>
        );
    }

    // Portal View (after login)
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-800 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">{searchResult.name}</h1>
                            <p className="text-sm text-gray-500">統編：{searchResult.taxId} | 承辦人：{searchResult.officer.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href={`tel:${searchResult.officer.phone}`} className="hidden sm:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition">
                                <Phone size={16} />
                                <span className="font-mono font-bold">{searchResult.officer.phone}</span>
                            </a>
                            <button onClick={() => { setSearchResult(null); setHasSearched(false); setInputTaxId(''); }} className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 transition font-bold">
                                查詢其他統編
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-4">
                        {!isMobile && (
                            <ClientNavigation
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                isMobile={false}
                            />
                        )}

                        {isMobile && (
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold">
                                    {activeTab === 'dashboard' && '我的進度'}
                                    {activeTab === 'flowchart' && '流程圖'}
                                    {activeTab === 'compliance' && '申報行事曆'}
                                    {activeTab === 'library' && '法規資料庫'}
                                </h2>
                                <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600">
                                    {menuOpen ? <X /> : <Menu />}
                                </button>
                            </div>
                        )}

                        {isMobile && menuOpen && (
                            <div className="mt-4">
                                <ClientNavigation
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    isMobile={true}
                                    setMenuOpen={setMenuOpen}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Project Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-red-400 flex flex-col items-center justify-center">
                                <div className="p-3 bg-red-50 text-red-500 rounded-full mb-2">
                                    <Calendar size={32} />
                                </div>
                                <p className="text-gray-500 text-sm font-bold mb-1">最近截止日期</p>
                                <p className="text-2xl font-black text-gray-800">{searchResult.projectInfo.deadline}</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-400 flex flex-col items-center justify-center">
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-full mb-2">
                                    <BarChart3 size={32} />
                                </div>
                                <p className="text-gray-500 text-sm font-bold mb-1">總體完成進度</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-24 bg-gray-200 rounded-full h-3">
                                        <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${searchResult.projectInfo.progress}%` }}></div>
                                    </div>
                                    <span className="text-2xl font-black text-blue-600">{searchResult.projectInfo.progress}%</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-purple-400 flex flex-col items-center justify-center">
                                <div className="p-3 bg-purple-50 text-purple-500 rounded-full mb-2">
                                    <Activity size={32} />
                                </div>
                                <p className="text-gray-500 text-sm font-bold mb-1">目前專案階段</p>
                                <span className="text-2xl font-black text-purple-700 mt-1">
                                    {searchResult.projectInfo.status === 'permission' ? '許可申請中' :
                                        searchResult.projectInfo.status === 'trial' ? '試車階段' : '設置階段'}
                                </span>
                            </div>
                        </div>

                        {/* License Status */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                                <CheckCircle className="text-blue-600" />
                                許可證有效期限監控
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <LicenseCard type="air" data={searchResult.licenses.air} />
                                <LicenseCard type="water" data={searchResult.licenses.water} />
                                <LicenseCard type="waste" data={searchResult.licenses.waste} />
                                <LicenseCard type="toxic" data={searchResult.licenses.toxic} />
                            </div>
                        </div>

                        {/* Recent Tasks */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText className="text-gray-500" />
                                近期辦理進度
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {searchResult.tasks.map((task) => (
                                    <div key={task.id} className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 transition">
                                        <div className="flex items-center gap-4">
                                            {task.status === 'done' ? (
                                                <div className="bg-green-100 p-2 rounded-full">
                                                    <CheckCircle className="text-green-600" size={24} />
                                                </div>
                                            ) : (
                                                <div className="bg-blue-50 p-2 rounded-full">
                                                    <div className="w-6 h-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-lg font-bold text-gray-800">{task.name}</p>
                                                <p className="text-sm text-gray-500 font-medium">{task.date}</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {task.status === 'done' ? '已完成' : '進行中'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'flowchart' && <FlowchartView />}
                {activeTab === 'compliance' && <ComplianceView />}
                {activeTab === 'library' && <RegulationLibraryView />}
            </main>

            <button
                onClick={() => navigate('/')}
                className="fixed bottom-6 left-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm bg-white/90 px-5 py-3 rounded-full shadow-lg backdrop-blur border border-gray-200 font-bold transition transform hover:scale-105"
            >
                <ArrowRight size={16} className="rotate-180" />
                返回首頁
            </button>
        </div>
    );
};

export default ClientPortal;