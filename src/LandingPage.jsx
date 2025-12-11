import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, ArrowRight, Activity } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col md:flex-row font-sans">

            {/* 左側：客戶專區 (明亮、友善) */}
            <div className="flex-1 bg-gradient-to-br from-teal-50 to-teal-100 flex flex-col justify-center items-center p-12 transition-all hover:flex-[1.1] duration-500 group relative overflow-hidden">
                {/* 背景裝飾 */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 text-center max-w-md">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                        <Search className="w-10 h-10 text-teal-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">我是客戶</h2>
                    <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                        想查詢工廠目前的環保許可進度？<br />
                        輸入統編，立即掌握即時狀態。
                    </p>
                    <button
                        onClick={() => navigate('/portal')}
                        className="group/btn relative px-8 py-4 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center mx-auto"
                    >
                        查詢案件進度
                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* 右側：員工專區 (深色、專業) */}
            <div className="flex-1 bg-slate-900 flex flex-col justify-center items-center p-12 transition-all hover:flex-[1.1] duration-500 group relative overflow-hidden text-white">
                {/* 背景裝飾 */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-slate-900"></div>

                <div className="relative z-10 text-center max-w-md">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-black mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">內部業務登入</h2>
                    <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                        傑太環保工程顧問專用系統<br />
                        請使用員工權限登入戰情室。
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="group/btn px-8 py-4 bg-transparent border-2 border-slate-600 text-slate-300 font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-400 hover:bg-slate-800/50 transition-all flex items-center mx-auto"
                    >
                        員工登入
                        <Activity className="ml-2 w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* 底部版權 */}
            <div className="absolute bottom-6 w-full text-center pointer-events-none">
                <p className="text-xs text-slate-400 opacity-60">© 2024 JET Environmental Engineering. All access monitored.</p>
            </div>
        </div>
    );
};

export default LandingPage;
