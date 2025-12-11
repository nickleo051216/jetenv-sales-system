import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mockClientDatabase } from './data/clients';
import { Search, Phone, FileText, CheckCircle, AlertTriangle, XCircle, Wind, Droplets, Trash2, Skull, ArrowRight, Calendar, BarChart3, Activity } from 'lucide-react';

// 小元件：許可證卡片
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

const ClientPortal = () => {
    const [searchParams] = useSearchParams();
    const [inputTaxId, setInputTaxId] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

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

    const handleSearch = () => {
        const result = mockClientDatabase.find(client => client.taxId === inputTaxId);
        setSearchResult(result);
        setHasSearched(true);
    };

    // 返回功能現在由瀏覽器路由控制，或者可以導回首頁 /
    const onBack = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 font-sans">

            {/* 頂部標題 */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-wide">傑太環保案件查詢</h1>
                <p className="text-gray-500 text-lg">輸入統編，即時掌握許可證進度</p>
            </div>

            {/* 搜尋框 */}
            {!searchResult && (
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
            )}

            {/* 搜尋結果呈現 */}
            {hasSearched && !searchResult && (
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
                    <AlertTriangle className="mx-auto mb-4 text-orange-500" size={64} />
                    <p className="text-2xl font-bold text-gray-700">找不到此統編</p>
                    <button onClick={() => setHasSearched(false)} className="mt-6 text-blue-600 underline text-lg">重新輸入</button>
                </div>
            )}

            {searchResult && (
                <div className="w-full max-w-4xl animate-fade-in pb-20">

                    {/* 1. 頂部：公司名 + 承辦人名片 */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100">
                        <div className="bg-gray-800 p-6 text-white text-center sm:text-left sm:flex sm:justify-between sm:items-center">
                            <div>
                                <h2 className="text-3xl font-black mb-2">{searchResult.name}</h2>
                                <p className="text-gray-300 text-lg">統編：{searchResult.taxId}</p>
                            </div>
                            <button onClick={() => { setSearchResult(null); setHasSearched(false); setInputTaxId(''); }} className="mt-4 sm:mt-0 px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 border border-gray-600">
                                查詢其他統編
                            </button>
                        </div>

                        <div className="p-6 bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-20 h-20 rounded-full ${searchResult.officer.avatarColor} flex items-center justify-center text-white text-3xl font-bold shadow-md ring-4 ring-white`}>
                                    {searchResult.officer.name[0]}
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">您的專屬承辦人</p>
                                    <p className="text-2xl font-black text-gray-900">{searchResult.officer.name} <span className="text-lg font-normal text-gray-600">{searchResult.officer.title}</span></p>
                                </div>
                            </div>

                            <a href={`tel:${searchResult.officer.phone}`} className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl shadow-lg transform transition active:scale-95 no-underline">
                                <Phone className="animate-bounce" size={24} />
                                <div className="text-left">
                                    <p className="text-xs opacity-90">緊急聯繫電話</p>
                                    <p className="text-xl font-bold font-mono">{searchResult.officer.phone}</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* 2. 新增：總體概況卡片 (結合上一版的設計，但優化字體大小) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* 期限卡片 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-red-400 flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-red-50 text-red-500 rounded-full mb-2">
                                <Calendar size={32} />
                            </div>
                            <p className="text-gray-500 text-sm font-bold mb-1">最近截止日期</p>
                            <p className="text-2xl font-black text-gray-800">{searchResult.projectInfo.deadline}</p>
                        </div>

                        {/* 進度卡片 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-400 flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-blue-50 text-blue-500 rounded-full mb-2">
                                <BarChart3 size={32} />
                            </div>
                            <p className="text-gray-500 text-sm font-bold mb-1">總體完成進度</p>
                            <div className="flex items-center gap-2 mt-1 w-full justify-center">
                                <div className="w-24 bg-gray-200 rounded-full h-3">
                                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${searchResult.projectInfo.progress}%` }}></div>
                                </div>
                                <span className="text-2xl font-black text-blue-600">{searchResult.projectInfo.progress}%</span>
                            </div>
                        </div>

                        {/* 階段卡片 */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-purple-400 flex flex-col items-center justify-center text-center">
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

                    {/* 3. 許可證狀態儀表板 */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                        <CheckCircle className="text-blue-600" />
                        許可證有效期限監控
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <LicenseCard type="air" data={searchResult.licenses.air} />
                        <LicenseCard type="water" data={searchResult.licenses.water} />
                        <LicenseCard type="waste" data={searchResult.licenses.waste} />
                        <LicenseCard type="toxic" data={searchResult.licenses.toxic} />
                    </div>

                    {/* 4. 近期辦理事項 */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-12">
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
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {task.status === 'done' ? '已完成' : '進行中'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* 回首頁按鈕 */}
            <button
                onClick={onBack}
                className="fixed bottom-6 left-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm bg-white/90 px-5 py-3 rounded-full shadow-lg backdrop-blur border border-gray-200 font-bold transition transform hover:scale-105"
            >
                <ArrowRight size={16} className="rotate-180" />
                返回首頁/管理端
            </button>
        </div>
    );
};

export default ClientPortal;