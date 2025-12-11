import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, ArrowRight, Activity } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">

            {/* Header with Logo */}
            <header className="py-8 px-4">
                <div className="max-w-6xl mx-auto flex flex-col items-center">
                    <img
                        src="/assets/jetenv-logo.jpg"
                        alt="JET Environmental Engineering"
                        className="w-48 h-48 object-contain mb-4 drop-shadow-lg"
                    />
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight text-center">傑太環境工程顧問</h1>
                    <p className="text-teal-600 text-lg font-medium mt-2">JET Environmental Engineering Ltd.</p>
                    <div className="mt-4 h-1 w-24 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
                </div>
            </header>

            {/* Main Content - Split Cards */}
            <main className="flex-1 flex items-center justify-center px-4 pb-12">
                <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8">

                    {/* Client Portal Card */}
                    <div className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-blue-500"></div>
                        <div className="p-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Search className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">客戶專區</h2>
                            <p className="text-slate-600 mb-8 text-center leading-relaxed">
                                想查詢工廠目前的環保許可進度？<br />
                                輸入統編，立即掌握即時狀態。
                            </p>
                            <button
                                onClick={() => navigate('/portal')}
                                className="w-full group/btn relative px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:from-teal-600 hover:to-teal-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center"
                            >
                                <Search className="mr-2 w-5 h-5" />
                                查詢案件進度
                                <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Admin Portal Card */}
                    <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                        <div className="p-12">
                            <div className="w-20 h-20 bg-slate-700 rounded-2xl shadow-lg border-2 border-slate-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:border-emerald-500 transition-all duration-300">
                                <ShieldCheck className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-black mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">內部業務登入</h2>
                            <p className="text-slate-400 mb-8 text-center leading-relaxed">
                                傑太環保工程顧問專用系統<br />
                                請使用員工權限登入戰情室。
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full group/btn px-8 py-4 bg-transparent border-2 border-slate-600 text-slate-300 font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-400 hover:bg-slate-800/50 transition-all flex items-center justify-center"
                            >
                                <ShieldCheck className="mr-2 w-5 h-5" />
                                員工登入
                                <Activity className="ml-2 w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 px-4 bg-white/50 backdrop-blur border-t border-slate-200">
                <div className="max-w-6xl mx-auto text-center">
                    <p className="text-sm text-slate-600">© 2024 傑太環境工程顧問有限公司 | <a href="https://www.jetenv.com.tw" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">jetenv.com.tw</a></p>
                    <p className="text-xs text-slate-400 mt-1">All access monitored and secured</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
