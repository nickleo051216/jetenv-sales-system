import React from 'react';
import { Leaf, Droplet, Wind } from 'lucide-react';

const Logo = ({ className = "" }) => {
    return (
        <div className={`flex items-center gap-3 select-none ${className}`}>
            {/* Icon Mark */}
            <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl rotate-3 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-bl from-blue-500 to-teal-400 rounded-xl -rotate-3 opacity-90 mix-blend-multiply"></div>

                <div className="relative z-10 flex text-white">
                    <Leaf className="w-6 h-6 -ml-1 drop-shadow-sm" />
                    <Droplet className="w-4 h-4 -ml-1 mt-3 text-blue-100" />
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
};

export default Logo;
