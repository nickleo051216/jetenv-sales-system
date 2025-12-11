import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        // 模擬驗證延遲 (增加儀式感)
        setTimeout(() => {
            // 這裡設定你的模擬密碼
            if (password === 'jet888') {
                navigate('/admin');
            } else {
                setError(true);
                setLoading(false);
                setPassword('');
            }
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="w-full max-w-md">

                {/* Logo Area */}
                <div className="text-center mb-10 animate-fade-in-down">
                    <h1 className="text-3xl font-black text-white tracking-widest mb-2">JET SALES COMMAND</h1>
                    <p className="text-emerald-500 text-xs font-mono tracking-[0.3em]">INTERNAL ACCESS ONLY</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 transform transition-all hover:border-slate-600">
                    <div className="flex justify-center mb-6">
                        <div className={`p-4 rounded-full bg-slate-900 border-2 ${error ? 'border-red-500 text-red-500' : 'border-emerald-500/30 text-emerald-400'}`}>
                            <Lock className="w-8 h-8" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-white mb-8">
                        系統權限驗證
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Access Code
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setError(false); setPassword(e.target.value); }}
                                className={`w-full bg-slate-900 border ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-emerald-500'} rounded-lg px-4 py-3 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-center text-lg tracking-widest`}
                                placeholder="••••••"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="flex items-center justify-center text-red-400 text-sm animate-shake">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                密碼錯誤，請重新輸入
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    驗證中...
                                </>
                            ) : (
                                <>
                                    進入系統
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8 space-y-2">
                    <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                        ← 返回首頁
                    </button>
                </div>

                <p className="text-center mt-12 text-slate-600 text-xs">
                    Authorized Personnel Only. <br />
                    Unlawful access is prohibited.
                </p>

            </div>
        </div>
    );
};

export default AdminLogin;
