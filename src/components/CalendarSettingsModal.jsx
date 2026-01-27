import React, { useState, useEffect } from 'react';
import { regulationsData } from '../data/clients';
import { supabase } from '../supabaseClient';
import { X, Save, Calendar, AlertCircle, ChevronDown } from 'lucide-react';

/**
 * CalendarSettingsModal - 客戶申報行事曆設定
 * 
 * 混合模式 (Option C):
 * 1. 根據客戶的許可證類型自動篩選相關的申報項目
 * 2. 管理員可手動開關任何項目
 * 3. 只儲存與「自動預設」不同的覆寫設定
 */

// 許可證類型對應申報項目類別的映射
const LICENSE_TO_CATEGORY = {
    'air': ['air'],
    'water': ['water'],
    'waste': ['waste'],
    'toxic': ['toxic'],
    'soil': ['soil'],
    'factory': ['factory']
};

const CalendarSettingsModal = ({ client, onClose, onSave }) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({}); // 摺疊狀態

    // 取得客戶的許可證類型 (小寫陣列)
    const clientLicenseTypes = (client.type || []).map(t => t.toLowerCase());

    // 計算該客戶「自動啟用」的申報項目類別
    const autoEnabledCategories = clientLicenseTypes.flatMap(
        type => LICENSE_TO_CATEGORY[type] || []
    );

    // 判斷某個申報項目是否為「自動啟用」
    const isAutoEnabled = (regulation) => {
        return autoEnabledCategories.includes(regulation.category);
    };

    // 載入客戶的覆寫設定
    useEffect(() => {
        loadSettings();
    }, [client.id]);

    const loadSettings = async () => {
        try {
            setLoading(true);

            // 從 Supabase 讀取該客戶的覆寫設定
            const { data, error } = await supabase
                .from('client_calendar_overrides')
                .select('regulation_id, action')
                .eq('client_id', client.id);

            if (error) throw error;

            // 初始化所有項目的狀態
            const initialSettings = {};
            regulationsData.forEach(reg => {
                // 預設值：根據許可證類型自動判斷
                const autoValue = isAutoEnabled(reg);

                // 檢查是否有覆寫設定
                const override = data?.find(d => d.regulation_id === reg.id);
                if (override) {
                    // 有覆寫：add=啟用, remove=停用
                    initialSettings[reg.id] = override.action === 'add';
                } else {
                    // 無覆寫：使用自動值
                    initialSettings[reg.id] = autoValue;
                }
            });

            setSettings(initialSettings);
        } catch (error) {
            console.error('載入行事曆設定失敗:', error);
            // 使用預設值
            const fallback = {};
            regulationsData.forEach(reg => {
                fallback[reg.id] = isAutoEnabled(reg);
            });
            setSettings(fallback);
        } finally {
            setLoading(false);
        }
    };

    // 切換某個項目的開關
    const toggleSetting = (regulationId) => {
        setSettings(prev => ({
            ...prev,
            [regulationId]: !prev[regulationId]
        }));
    };

    // 切換類別摺疊狀態
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // 儲存設定
    const handleSave = async () => {
        try {
            setSaving(true);

            // 計算需要儲存的覆寫項目 (與自動預設不同的)
            const overrides = [];

            regulationsData.forEach(reg => {
                const autoValue = isAutoEnabled(reg);
                const currentValue = settings[reg.id];

                if (currentValue !== autoValue) {
                    // 與自動預設不同，需要覆寫
                    overrides.push({
                        client_id: client.id,
                        regulation_id: reg.id,
                        action: currentValue ? 'add' : 'remove'
                    });
                }
            });

            // 先刪除該客戶的所有覆寫設定
            await supabase
                .from('client_calendar_overrides')
                .delete()
                .eq('client_id', client.id);

            // 如果有覆寫項目，新增
            if (overrides.length > 0) {
                const { error } = await supabase
                    .from('client_calendar_overrides')
                    .insert(overrides);

                if (error) throw error;
            }

            alert('✅ 行事曆設定已儲存！');
            onSave & onSave();
            onClose();
        } catch (error) {
            console.error('儲存行事曆設定失敗:', error);
            alert(`❌ 儲存失敗：${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // 按類別分組申報項目
    const groupedRegulations = regulationsData.reduce((acc, reg) => {
        if (!acc[reg.categoryName]) {
            acc[reg.categoryName] = [];
        }
        acc[reg.categoryName].push(reg);
        return acc;
    }, {});

    // 計算每個類別的啟用數量
    const getCategoryStats = (regs) => {
        const enabled = regs.filter(r => settings[r.id]).length;
        return { enabled, total: regs.length };
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8">
                    <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-500">載入設定中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                申報行事曆設定
                            </h3>
                            <p className="text-sm opacity-90 mt-1">
                                設定「{client.name}」的申報項目顯示
                            </p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 客戶許可證標籤 */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {clientLicenseTypes.map(type => {
                            const labels = {
                                air: { label: '💨 空氣', class: 'bg-purple-500/30' },
                                water: { label: '💧 廢水', class: 'bg-blue-500/30' },
                                waste: { label: '🗑️ 廢棄物', class: 'bg-orange-500/30' },
                                toxic: { label: '☢️ 毒化', class: 'bg-red-500/30' },
                                soil: { label: '🌍 土壤', class: 'bg-amber-500/30' }
                            };
                            const info = labels[type] || { label: type, class: 'bg-gray-500/30' };
                            return (
                                <span key={type} className={`px-3 py-1 rounded-full text-sm font-medium ${info.class}`}>
                                    {info.label}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[60vh] p-5 space-y-6">
                    {/* 說明 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>自動模式：</strong>根據客戶的許可證類型，相關申報項目會自動啟用（標示「自動」）。
                            您可以手動切換任何項目的開關狀態。
                        </div>
                    </div>

                    {/* 申報項目列表 (按類別分組，可摺疊) */}
                    {Object.entries(groupedRegulations).map(([category, regs]) => {
                        const isExpanded = expandedCategories[category];
                        const stats = getCategoryStats(regs);

                        return (
                            <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* 類別標題 (可點擊展開/摺疊) */}
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-gray-800">{category}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stats.enabled > 0
                                                ? 'bg-teal-100 text-teal-700'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {stats.enabled}/{stats.total} 項啟用
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>

                                {/* 展開的項目列表 */}
                                {isExpanded && (
                                    <div className="p-3 space-y-2 bg-white">
                                        {regs.map(reg => {
                                            const isOn = settings[reg.id];
                                            const isAuto = isAutoEnabled(reg);

                                            return (
                                                <div
                                                    key={reg.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isOn
                                                        ? 'bg-teal-50 border-teal-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-800 truncate">
                                                            {reg.item}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {reg.deadline} · {reg.period}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 ml-4">
                                                        {isAuto && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
                                                                自動
                                                            </span>
                                                        )}

                                                        {/* Toggle Switch */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSetting(reg.id)}
                                                            className={`relative w-12 h-6 rounded-full transition-colors ${isOn ? 'bg-teal-500' : 'bg-gray-300'}`}
                                                        >
                                                            <span
                                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-7' : 'translate-x-1'}`}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                儲存中...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                儲存設定
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarSettingsModal;
