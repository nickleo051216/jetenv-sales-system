import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockClientDatabase } from './data/clients';
import { ComplianceView, RegulationLibraryView } from './SharedViews';
import { supabase } from './supabaseClient';
import { Search, Phone, FileText, CheckCircle, AlertTriangle, XCircle, Wind, Droplets, Trash2, Skull, ArrowRight, Calendar, BarChart3, Activity, LayoutDashboard, BookOpen, Menu, X, Mail, MessageCircle, Globe, ChevronDown, ChevronUp } from 'lucide-react';

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

// Mobile-friendly Accordion Flowchart
const MobileFlowchart = () => {
    const [openStage, setOpenStage] = useState(null);

    const stages = [
        {
            id: 'soil',
            title: '🌍 土壤 (Soil)',
            color: 'amber',
            steps: ['土壤前置作業', '現場篩測/檢測', '📄 土壤評估報告']
        },
        {
            id: 'water',
            title: '💧 廢水 (Water)',
            color: 'blue',
            steps: ['廢水前置作業', '廢水工程規劃', '📄 水措計畫書提送 (關鍵！)', '🚧 廢水工程完工', '試車計畫書', '⚙️ 試車', '🏆 排放許可證 (5年)']
        },
        {
            id: 'air',
            title: '💨 空氣 (Air)',
            color: 'purple',
            steps: ['空氣前置作業', '空氣工程規劃', '📄 設置許可提送 (關鍵！)', '🚧 空氣工程完工', '操作許可第一階段', '⚙️ 試車', '🏆 操作許可證 (5年)']
        }
    ];

    return (
        <div className="space-y-3">
            <div className="bg-slate-800 text-white px-6 py-3 rounded-lg text-center font-bold mb-4">
                ✍️ 簽約啟動
            </div>

            {stages.map((stage) => (
                <div key={stage.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setOpenStage(openStage === stage.id ? null : stage.id)}
                        className={`w-full p-4 flex items-center justify-between font-bold text-left transition ${stage.color === 'amber' ? 'bg-amber-50 hover:bg-amber-100' :
                            stage.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100' :
                                'bg-purple-50 hover:bg-purple-100'
                            }`}
                    >
                        <span className="text-lg">{stage.title}</span>
                        {openStage === stage.id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {openStage === stage.id && (
                        <div className="p-4 bg-white space-y-2">
                            {stage.steps.map((step, idx) => (
                                <div key={idx} className={`p-3 rounded border ${step.includes('關鍵') ? 'bg-red-50 border-red-300 font-bold text-red-800' :
                                    step.includes('🏆') ? 'bg-green-100 border-green-400 font-bold text-green-900' :
                                        step.includes('⚙️') ? 'bg-yellow-50 border-yellow-300' :
                                            'bg-gray-50 border-gray-200'
                                    }`}>
                                    {step}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <div className="bg-slate-100 text-slate-600 px-6 py-3 rounded-lg text-center font-bold mt-4">
                🏛️ 環保局審件 & 工廠登記
            </div>

            <div className="bg-slate-700 text-white px-6 py-3 rounded-lg text-center font-bold mt-4">
                🔚 廢清書提送 (結案)
            </div>
        </div>
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
    const [officerCardOpen, setOfficerCardOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 輔助函式:計算進度
    const calculateProgress = useCallback((licenses) => {
        if (!licenses || licenses.length === 0) return 0;
        const validLicenses = licenses.filter(l => l.status === 'valid').length;
        return Math.round((validLicenses / licenses.length) * 100);
    }, []);

    // 輔助函式:判斷專案階段
    const determineProjectStatus = useCallback((status) => {
        if (status === '營運中') return 'permission';
        if (status === '試車階段') return 'trial';
        return 'setup';
    }, []);

    // 輔助函式:映射許可證狀態
    const mapLicenseStatus = useCallback((status, validUntil) => {
        if (status === 'pending') return 'warning';
        if (status === 'expired') return 'expired';
        if (status === 'valid') {
            // 檢查是否即將到期 (30天內)
            if (validUntil) {
                const daysUntilExpiry = Math.floor(
                    (new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24)
                );
                if (daysUntilExpiry < 30 && daysUntilExpiry > 0) return 'warning';
                if (daysUntilExpiry <= 0) return 'expired';
            }
            return 'normal';
        }
        return 'none';
    }, []);

    // 輔助函式:格式化許可證資料
    const formatLicenses = useCallback((licenses) => {
        const formatted = {
            air: { status: 'none', date: '-', name: '固定污染源許可' },
            water: { status: 'none', date: '-', name: '水污染防治許可' },
            waste: { status: 'none', date: '-', name: '廢棄物清理計畫書' },
            toxic: { status: 'none', date: '-', name: '毒化物運作核可' }
        };

        if (!licenses) return formatted;

        licenses.forEach(license => {
            const type = license.type;
            if (formatted[type]) {
                formatted[type] = {
                    status: mapLicenseStatus(license.status, license.valid_until),
                    date: license.valid_until || '長期有效',
                    name: license.name,
                    workflowStage: license.workflow_stage,
                    nextAction: license.next_action,
                    expectedDate: license.expected_date
                };
            }
        });

        return formatted;
    }, [mapLicenseStatus]);

    const handleSearch = useCallback(async (taxIdToSearch) => {
        const searchTaxId = taxIdToSearch || inputTaxId;
        if (!searchTaxId) return;

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            // 從 Supabase 查詢客戶資料
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select(`
                    *,
                    officer:officers(name, phone, title, avatar_color),
                    licenses(*)
                `)
                .eq('tax_id', searchTaxId)
                .single();

            if (clientError) {
                if (clientError.code === 'PGRST116') {
                    // 找不到資料
                    setSearchResult(null);
                } else {
                    throw clientError;
                }
                return;
            }

            if (!client) {
                setSearchResult(null);
                return;
            }

            // 轉換資料格式為前端需要的格式
            const formattedResult = {
                taxId: client.tax_id,
                name: client.name,
                officer: client.officer ? {
                    name: client.officer.name,
                    title: client.officer.title || '專案經理',
                    phone: client.officer.phone,
                    avatarColor: client.officer.avatar_color || 'bg-blue-600'
                } : {
                    name: '傑太團隊',
                    title: '專案經理',
                    phone: '(02)6609-5888',
                    avatarColor: 'bg-blue-600'
                },
                projectInfo: {
                    deadline: client.deadline || '待確認',
                    progress: calculateProgress(client.licenses),
                    status: determineProjectStatus(client.status)
                },
                licenses: formatLicenses(client.licenses),
                tasks: [] // 如果有 tasks 表可以在這裡查詢
            };

            setSearchResult(formattedResult);
        } catch (err) {
            console.error('查詢失敗:', err);
            setError('查詢時發生錯誤,請稍後再試');
            setSearchResult(null);
        } finally {
            setIsLoading(false);
        }
    }, [calculateProgress, determineProjectStatus, formatLicenses, inputTaxId]);

    // Deep Linking: Auto-login if ?id=... exists
    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
            setInputTaxId(idFromUrl);
            handleSearch(idFromUrl);
        }
    }, [searchParams, handleSearch]);

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
                    {/* Company Info */}
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">{searchResult.name}</h1>
                                <p className="text-sm text-gray-500">統編：{searchResult.taxId}</p>
                            </div>
                            <button onClick={() => { setSearchResult(null); setHasSearched(false); setInputTaxId(''); }} className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 transition font-bold">
                                查詢其他統編
                            </button>
                        </div>

                        {/* Collapsible Officer Card */}
                        <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setOfficerCardOpen(!officerCardOpen)}
                                className="w-full bg-gradient-to-r from-blue-50 to-teal-50 p-4 flex items-center justify-between transition hover:from-blue-100 hover:to-teal-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full ${searchResult.officer.avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                                        {searchResult.officer.name[0]}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-gray-600 font-bold">📞 專屬承辦人</p>
                                        <p className="text-lg font-black text-gray-900">{searchResult.officer.name}</p>
                                    </div>
                                </div>
                                {officerCardOpen ? <ChevronUp className="text-gray-600" /> : <ChevronDown className="text-gray-600" />}
                            </button>

                            {officerCardOpen && (
                                <div className="bg-white p-4 border-t border-blue-200">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <a href={`tel:${searchResult.officer.phone}`} className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg transition font-bold">
                                            <Phone size={20} />
                                            <div className="text-left">
                                                <div className="text-xs opacity-90">直接撥打</div>
                                                <div className="font-mono text-sm">{searchResult.officer.phone}</div>
                                            </div>
                                        </a>
                                        <a href="https://lin.ee/mTFxpvM" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg transition font-bold">
                                            <MessageCircle size={20} />
                                            <span>Line 諮詢</span>
                                        </a>
                                        <a href="https://www.jetenv.com.tw" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition font-bold">
                                            <Globe size={20} />
                                            <span>公司官網</span>
                                        </a>
                                    </div>
                                </div>
                            )}
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

                {activeTab === 'flowchart' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-teal-600" />
                                案件流程全貌 (傑太標準作業)
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                業務保命口訣：先拿「設置/水措」才能蓋，蓋完「試車」免罰款，最後拿「許可」才能營運。
                            </p>

                            {/* Mobile: Accordion, Desktop: Full Diagram */}
                            <div className="md:hidden">
                                <MobileFlowchart />
                            </div>

                            <div className="hidden md:block overflow-x-auto">
                                <div className="relative p-4 min-w-[800px]">
                                    {/* Full desktop flowchart - same as before */}
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
                                                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded mb-2 z-20 shadow-lg">
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
                                            <div className="w-full bg-red-50 border-red-400 p-3 rounded text-sm font-bold text-red-800 shadow-md relative group cursor-pointer">
                                                📄 設置許可提送
                                                <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-slate-800 text-white text-xs p-2 rounded mb-2 z-20 shadow-lg">
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
                    </div>
                )}

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