import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Inlined Rich Logo Component (Safe, no dependencies)
const RichLogo = ({ className = "" }) => (
    <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Icon Mark */}
        <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl rotate-3 opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-blue-500 to-teal-400 rounded-xl -rotate-3 opacity-90 mix-blend-multiply"></div>

            <div className="relative z-10 flex text-white">
                {/* SVG Leaf */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 -ml-1 drop-shadow-sm">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.5 2 9a7 7 0 0 1-10 9z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
                {/* SVG Droplet */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 -ml-1 mt-3 text-blue-100">
                    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                </svg>
            </div>
        </div>

        {/* Text Logo */}
        <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-tight leading-none text-slate-800 flex items-center gap-1">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600">JET</span>
                <span className="text-slate-700">ENV</span>
            </h1>
            <span className="text-[0.65rem] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Environmental Engineering</span>
        </div>
    </div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen flex flex-col font-sans bg-[#F0F4F8] text-slate-800 relative overflow-hidden selection:bg-teal-500 selection:text-white">

            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-slate-50 opacity-90"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.4]"></div>

                {/* Orbital Blurs (CSS-only) */}
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-teal-300/30 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] animate-float"></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-full px-6 py-3 flex justify-between items-center">
                        <RichLogo className="scale-90" />
                        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5">🌏 智慧環保</span>
                            <span className="flex items-center gap-1.5">📊 數據監控</span>
                            <span className="flex items-center gap-1.5">🛡️ 專業顧問</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-4">

                {/* Hero Section */}
                <div className={`text-center max-w-4xl mx-auto mb-16 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                    {/* Floating Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide shadow-xl shadow-slate-900/20 mb-8 animate-float">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        SYSTEM ONLINE v2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
                        The Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-600">Environmental Intelligence</span>
                    </h1>

                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
                        為現代工廠打造的智慧環保管理系統。
                        <br />即時監控、自動合規、數據視覺化。
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 border-t border-slate-200/60 pt-8 w-fit mx-auto px-10">
                        <div className="text-center">
                            <div className="text-3xl font-black text-slate-800 mb-1">500+</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Sites</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-slate-800 mb-1">100%</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-slate-800 mb-1">24/7</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monitoring</div>
                        </div>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 md:gap-10 w-full max-w-5xl px-2">

                    {/* Client Card */}
                    <div className={`group relative bg-white rounded-[2.5rem] p-2 transition-all duration-700 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-blue-50 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                        <div className="relative h-full bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 md:p-12 flex flex-col items-start overflow-hidden hover:scale-[1.01] transition-transform duration-300">

                            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300 text-3xl">
                                🔍
                            </div>

                            <h2 className="text-3xl font-bold text-slate-800 mb-3">Client Portal</h2>
                            <p className="text-slate-500 mb-8 font-medium">快速查詢工廠許可證進度與環保狀態。</p>

                            <div className="mt-auto w-full">
                                <button onClick={() => navigate('/portal')} className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-teal-600 transition-colors">
                                    Access Now ➡️
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Admin Card */}
                    <div className={`group relative bg-slate-900 rounded-[2.5rem] p-2 transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-500"></div>
                        <div className="relative h-full bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl p-8 md:p-12 flex flex-col items-start overflow-hidden hover:scale-[1.01] transition-transform duration-300">

                            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 group-hover:-rotate-6 transition-transform duration-300 text-3xl">
                                🛡️
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-3">Internal Center</h2>
                            <p className="text-slate-400 mb-8 font-medium">傑太員工專用戰情室與管理後台。</p>

                            <div className="mt-auto w-full">
                                <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-emerald-900/20">
                                    Secure Login 🔐
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 text-center border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">
                    © {new Date().getFullYear()} JET Environmental Engineering Ltd.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
