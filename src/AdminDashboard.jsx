import React, { useState, useEffect } from 'react';
import { initialClients, regulationsData } from './data/clients';
import { useNavigate } from 'react-router-dom';
import { FlowchartView, ComplianceView, RegulationLibraryView } from './SharedViews';
import { supabase } from './supabaseClient';
import {
  Calendar,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Droplets,
  Wind,
  Sprout,
  Search,
  Users,
  LayoutDashboard,
  Menu,
  X,
  BookOpen,
  ExternalLink,
  Filter,
  Phone,
  Globe,
  Save,
  Edit3,
  Plus,
  Zap,
  Trash2,
  Edit2
} from 'lucide-react';

// --- Client List Data ---
// --- Client List Data ---
// Imported from ./data/clients.js

// --- MASTER REGULATION DATA (Source of Truth) ---
// This dataset drives both the Calendar and the Library views.
// --- MASTER REGULATION DATA (Source of Truth) ---
// Imported from ./data/clients.js

// --- Helper Components ---

const Navigation = ({ activeTab, setActiveTab, isMobile, setMenuOpen }) => {
  const navItems = [
    { id: 'dashboard', label: '戰情首頁', icon: LayoutDashboard },
    { id: 'compliance', label: '申報行事曆', icon: Calendar },
    { id: 'library', label: '法規資料庫', icon: BookOpen },
    { id: 'clients', label: '客戶管理', icon: Users },
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
            ? 'bg-teal-600 text-white shadow-lg'
            : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'
            }`}
        >
          <item.icon className="w-4 h-4 mr-2" />
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- View Components ---
// FlowchartView, ComplianceView, RegulationLibraryView imported from SharedViews.jsx



// --- Client Management View ---
const ClientView = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // 進度更新
  const [editInfoClient, setEditInfoClient] = useState(null); // 基本資料編輯
  const [moeaData, setMoeaData] = useState(null); // 經濟部資料
  const [factoryData, setFactoryData] = useState(null); // 工廠資料（從 factories 表）
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    taxId: '',
    status: '規劃階段',
    nextAction: '',
    deadline: '',
    licenseTypes: [], // 空氣, 廢水, 廢棄物, 毒化, 土壤
    industry: '' // 行業別
  });

  // 從 Supabase 讀取客戶資料
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          officer:officers(name, phone, title, avatar_color),
          licenses(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 將 Supabase 資料格式轉換為前端需要的格式
      const formattedClients = data.map(client => ({
        id: client.id,
        name: client.name,
        taxId: client.tax_id,
        status: client.status,
        phase: client.phase,
        nextAction: client.next_action || '待確認',
        deadline: client.deadline || '未設定',
        type: client.licenses?.map(l => l.type.charAt(0).toUpperCase() + l.type.slice(1)) || ['Air'],
        licenses: client.licenses || [],
        officer: client.officer
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error('讀取客戶資料失敗:', error);
      // 如果失敗，使用備用資料
      setClients(initialClients);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Smart Add: 自動帶入經濟部資料 + 工廠資料
  const handleAutoFill = async () => {
    if (!newClientForm.taxId || newClientForm.taxId.length !== 8) {
      alert('請先輸入正確的 8 碼統編');
      return;
    }

    try {
      setLoading(true);

      // 同時查詢兩個 API：經濟部 + 工廠資料
      const [moeaRes, factoryRes] = await Promise.all([
        fetch(`/api/moea?taxId=${newClientForm.taxId}`),
        fetch(`/api/factories?taxId=${newClientForm.taxId}`)
      ]);

      const moeaResult = await moeaRes.json();
      const factoryResult = await factoryRes.json();

      console.log('🔍 MOEA 結果:', moeaResult);
      console.log('🏭 工廠結果:', factoryResult);

      // 如果兩個都查不到資料
      if (!moeaResult.found && !factoryResult.found) {
        alert('❌ 找不到此統編資料，請確認是否輸入正確。');
        return;
      }

      // 準備表單資料
      let formData = { ...newClientForm };
      let autoSelectedLicenses = [];

      // 1. 處理工廠資料（優先使用）
      if (factoryResult.found) {
        const factory = factoryResult.data;

        // 如果有多個工廠，使用第一個（之後可以讓用戶選擇）
        const factoryInfo = Array.isArray(factory) ? factory[0] : factory;

        formData.name = factoryInfo.facilityName || formData.name;
        formData.industry = factoryInfo.industryName || '';

        // 🎯 自動勾選委託項目（根據工廠資料的 licenses）
        const licenses = factoryInfo.licenses || {};
        if (licenses.air) autoSelectedLicenses.push('air');
        if (licenses.water) autoSelectedLicenses.push('water');
        if (licenses.waste) autoSelectedLicenses.push('waste');
        if (licenses.toxic) autoSelectedLicenses.push('toxic');
        if (licenses.soil) autoSelectedLicenses.push('soil');

        formData.licenseTypes = autoSelectedLicenses;

        // 📅 自動設定期限（根據換證年份）
        if (factoryInfo.renewalYear) {
          try {
            // 解析換證年份格式：117.02, 11702, 116.11, 11610 等
            const renewalYear = factoryInfo.renewalYear.toString();
            let rocYear, month;

            if (renewalYear.includes('.')) {
              // 格式：117.02 或 116.11
              const parts = renewalYear.split('.');
              rocYear = parseInt(parts[0]);
              month = parseInt(parts[1]);
            } else {
              // 格式：11702 或 11610
              if (renewalYear.length === 5) {
                rocYear = parseInt(renewalYear.substring(0, 3));
                month = parseInt(renewalYear.substring(3));
              } else if (renewalYear.length === 4) {
                rocYear = parseInt(renewalYear.substring(0, 2));
                month = parseInt(renewalYear.substring(2));
              }
            }

            // 驗證月份有效性
            if (rocYear && month && month >= 1 && month <= 12) {
              // 轉換為西元年
              const adYear = rocYear + 1911;

              // 計算該月最後一天
              const lastDay = new Date(adYear, month, 0).getDate();

              // 格式化為 YYYY-MM-DD
              const deadline = `${adYear}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
              formData.deadline = deadline;

              console.log(`📅 換證年份 ${renewalYear} → 期限 ${deadline}`);
            }
          } catch (err) {
            console.warn('⚠️ 換證年份解析失敗:', err);
          }
        }

        setFactoryData(factoryResult); // 儲存完整工廠資料
      }

      // 2. 處理經濟部資料（補充資訊）
      if (moeaResult.found) {
        const company = moeaResult.data;
        // 如果工廠資料沒有提供公司名稱，使用經濟部資料
        if (!formData.name) {
          formData.name = company.name;
        }
        setMoeaData(company); // 儲存完整經濟部資料
      }

      // 更新表單
      setNewClientForm(formData);

      // 成功提示
      const sources = [];
      if (moeaResult.found) sources.push('政府資料');
      if (factoryResult.found) sources.push('工廠登記');

      let message = `🎉 成功帶入${sources.join(' + ')}！`;
      if (autoSelectedLicenses.length > 0) {
        const licenseLabels = {
          air: '空氣',
          water: '廢水',
          waste: '廢棄物',
          toxic: '毒化',
          soil: '土壤'
        };
        const selectedLabels = autoSelectedLicenses.map(l => licenseLabels[l]).join('、');
        message += `\n已自動勾選委託項目：${selectedLabels}`;
      }
      if (formData.deadline) {
        message += `\n📅 已自動設定期限：${formData.deadline}`;
      }

      alert(message);

    } catch (err) {
      console.error('自動帶入錯誤:', err);
      alert('自動帶入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 新增客戶
  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const phaseMap = { '規劃階段': 1, '試車階段': 2, '營運中': 3 };

      // 1. 新增客戶資料
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          tax_id: newClientForm.taxId,
          name: newClientForm.name,
          status: newClientForm.status,
          phase: phaseMap[newClientForm.status] || 1,
          next_action: newClientForm.nextAction,
          deadline: newClientForm.deadline || null
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. 如果有選取委託項目，新增到 licenses 表
      if (newClientForm.licenseTypes && newClientForm.licenseTypes.length > 0) {
        const licensesToInsert = newClientForm.licenseTypes.map(type => ({
          client_id: clientData.id,
          type: type, // 'air', 'water', etc.
          status: 'pending', // 預設狀態 (改為 pending 符合 schema)
          name: `${type.toUpperCase()} 許可證`, // 給一個預設名稱
          workflow_stage: '規劃階段'
        }));

        const { error: licenseError } = await supabase
          .from('licenses')
          .insert(licensesToInsert);

        if (licenseError) throw licenseError;
      }

      alert('✅ 客戶及委託案件新增成功！');
      setIsAddModalOpen(false);
      setNewClientForm({
        name: '',
        taxId: '',
        status: '規劃階段',
        nextAction: '',
        deadline: '',
        licenseTypes: [],
        industry: ''
      });
      setMoeaData(null); // 清除暫存的經濟部資料
      setFactoryData(null); // 清除暫存的工廠資料
      fetchClients(); // 重新載入
    } catch (error) {
      console.error('新增客戶失敗:', error);
      alert(`❌ 新增失敗：${error.message}`);
    }
  };

  // 更新客戶
  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      const phaseMap = { '規劃階段': 1, '試車階段': 2, '營運中': 3 };

      const { error } = await supabase
        .from('clients')
        .update({
          status: editingClient.status,
          phase: phaseMap[editingClient.status] || editingClient.phase,
          next_action: editingClient.nextAction,
          deadline: editingClient.deadline || null
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      alert('✅ 客戶資料更新成功！');
      setEditingClient(null);
      fetchClients(); // 重新載入
    } catch (error) {
      console.error('更新客戶失敗:', error);
      alert(`❌ 更新失敗：${error.message}`);
    }
  };

  // 刪除客戶
  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`⚠️ 確定要刪除「${name}」嗎？\n此動作無法復原！`)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('🗑️ 客戶已刪除');
      fetchClients(); // 重新載入
    } catch (error) {
      console.error('刪除失敗:', error);
      alert(`❌ 刪除失敗：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新客戶基本資料 (名稱、統編、委託項目)
  const handleUpdateClientInfo = async (e) => {
    e.preventDefault();
    if (!editInfoClient) return;

    try {
      setLoading(true);

      // 1. 更新名稱與統編
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          name: editInfoClient.name,
          tax_id: editInfoClient.taxId
        })
        .eq('id', editInfoClient.id);

      if (clientError) throw clientError;

      // 2. 更新委託項目 (Diffing: 找出新增與刪除的項目)
      // 重要：Supabase 的 .in() 查詢是區分大小寫的！
      // 所以我們要保留原始的大小寫來進行資料庫操作

      // 建立小寫到原始值的映射
      const originalTypesMap = {};
      editInfoClient.licenses.forEach(l => {
        originalTypesMap[l.type.toLowerCase()] = l.type;
      });

      const newTypesMap = {};
      (editInfoClient.licenseTypes || []).forEach(t => {
        newTypesMap[t.toLowerCase()] = t;
      });

      const originalTypesLower = Object.keys(originalTypesMap);
      const newTypesLower = Object.keys(newTypesMap);

      console.log('🔍 Debug - 原始項目 (小寫):', originalTypesLower);
      console.log('🔍 Debug - 原始項目 (原值):', originalTypesMap);
      console.log('🔍 Debug - 新項目 (小寫):', newTypesLower);

      // 找出要新增的 (使用小寫比對，但操作時用原始值)
      const toAddLower = newTypesLower.filter(t => !originalTypesLower.includes(t));
      const toAdd = toAddLower.map(t => newTypesMap[t]);

      // 找出要刪除的 (使用小寫比對，但操作時用原始值)
      const toRemoveLower = originalTypesLower.filter(t => !newTypesLower.includes(t));
      const toRemove = toRemoveLower.map(t => originalTypesMap[t]);

      console.log('➕ Debug - 要新增:', toAdd);
      console.log('➖ Debug - 要刪除:', toRemove);

      // 執行新增
      if (toAdd.length > 0) {
        const licensesToInsert = toAdd.map(type => ({
          client_id: editInfoClient.id,
          type: type,
          status: 'pending',
          name: `${type.toUpperCase()} 許可證`,
          workflow_stage: '規劃階段'
        }));
        console.log('➕ 執行新增:', licensesToInsert);
        const { error: addError } = await supabase.from('licenses').insert(licensesToInsert);
        if (addError) {
          console.error('❌ 新增失敗:', addError);
          throw addError;
        }
      }

      // 執行刪除 (使用原始的大小寫!)
      if (toRemove.length > 0) {
        console.log('➖ 準備刪除 - Client ID:', editInfoClient.id, 'Types (原始大小寫):', toRemove);

        const { data: deletedData, error: removeError } = await supabase
          .from('licenses')
          .delete()
          .eq('client_id', editInfoClient.id)
          .in('type', toRemove)
          .select();

        console.log('➖ 刪除結果:', deletedData);

        if (removeError) {
          console.error('❌ 刪除失敗:', removeError);
          throw removeError;
        }

        if (!deletedData || deletedData.length === 0) {
          console.warn('⚠️ 警告：沒有刪除任何記錄，可能是因為找不到匹配的項目');
        } else {
          console.log('✅ 成功刪除', deletedData.length, '筆記錄');
        }
      }

      alert('✅ 客戶資料與委託項目更新成功！');
      setEditInfoClient(null);
      await fetchClients(); // 改為 await 確保重新載入完成
    } catch (error) {
      console.error('更新失敗:', error);
      alert(`❌ 更新失敗：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.includes(searchTerm) || c.status.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">載入客戶資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">客戶案件管理 (Clients)</h2>
          <p className="text-sm text-gray-500">管理目前手上的案件進度與代辦事項。{clients.length > 0 && `（共 ${clients.length} 筆）`}</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋客戶名稱..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredClients.map(client => (
        <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {/* Status Bar */}
          <div className={`h-1.5 w-full ${client.phase === 1 ? 'bg-red-500' :
            client.phase === 2 ? 'bg-yellow-500' :
              'bg-green-500'
            }`} />

          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-gray-800">{client.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${client.status === '營運中' ? 'bg-green-100 text-green-800' :
                client.status === '試車階段' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {client.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {client.type.map(t => {
                const typeInfo = {
                  'Air': { label: '💨 空氣', color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
                  'Water': { label: '💧 廢水', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
                  'Waste': { label: '🗑️ 廢棄物', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                  'Toxic': { label: '☢️ 毒化', color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
                  'Soil': { label: '🌍 土壤', color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' }
                }[t] || { label: t, color: 'gray', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };

                return (
                  <span key={t} className={`text-xs px-2 py-0.5 rounded border ${typeInfo.bg} ${typeInfo.text} ${typeInfo.border}`}>
                    {typeInfo.label}
                  </span>
                );
              })}
            </div>

            <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-gray-600">
                <span>下一步:</span>
                <span className="font-medium text-gray-900">{client.nextAction}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>期限:</span>
                <span className="font-bold text-red-600">{client.deadline}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingClient(client)}
                className="flex-1 py-2 text-sm text-teal-600 font-medium border border-teal-200 rounded hover:bg-teal-50 transition-colors"
              >
                更新進度 →
              </button>
              <button
                onClick={() => setEditInfoClient({ ...client, licenseTypes: client.licenses.map(l => l.type) })}
                className="px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                title="編輯客戶資料"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteClient(client.id, client.name)}
                className="px-3 py-2 text-sm text-gray-400 border border-gray-200 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                title="刪除案件"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors min-h-[250px] group"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-teal-50 transition-colors">
            <Plus className="w-6 h-6 group-hover:text-teal-500" />
          </div>
          <span className="font-medium">新增案件</span>
        </button>
      </div>

      {/* 新增客戶 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">📋 新增委託案件</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名稱</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })} placeholder="例如：台積電三廠" />
              </div>

              {/* 經濟部資料卡片 */}
              {moeaData && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
                    <span>📋 經濟部登記資料</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${moeaData.status === '核准設立' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {moeaData.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><span className="font-medium">代表人:</span> {moeaData.representative || '未知'}</div>
                    <div><span className="font-medium">資本額:</span> {moeaData.capital ? Number(moeaData.capital).toLocaleString() : '未知'}</div>
                  </div>
                  {moeaData.address && (
                    <div className="text-xs text-gray-500 truncate" title={moeaData.address}>
                      📍 {moeaData.address}
                    </div>
                  )}
                  {moeaData.industryStats && moeaData.industryStats.length > 0 ? (
                    <div className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded truncate" title={moeaData.industryStats.join(', ')}>
                      🏭 {moeaData.industryStats[0]} {moeaData.industryStats.length > 1 && `(+${moeaData.industryStats.length - 1})`}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      🏭 查無營業項目資料
                    </div>
                  )}
                </div>
              )}

              {/* 工廠資料卡片 */}
              {factoryData && factoryData.found && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                    <span>🏭 工廠登記資料</span>
                    {factoryData.multiple && (
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                        共 {factoryData.count} 間工廠
                      </span>
                    )}
                  </div>

                  {(() => {
                    const factory = Array.isArray(factoryData.data) ? factoryData.data[0] : factoryData.data;
                    return (
                      <>
                        {factory.industryName && (
                          <div className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                            🏢 {factory.industryName}
                          </div>
                        )}
                        {factory.address && (
                          <div className="text-xs text-gray-600 truncate" title={factory.address}>
                            📍 {factory.county}{factory.township} {factory.address}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {factory.consultantCompany && (
                            <div className="col-span-2">
                              <span className="font-medium">現有顧問:</span> {factory.consultantCompany}
                            </div>
                          )}
                          {factory.renewalYear && (
                            <div className="col-span-2">
                              <span className="font-medium">換證年:</span> {factory.renewalYear}
                            </div>
                          )}
                        </div>
                        {/* 顯示已自動勾選的委託項目 */}
                        {newClientForm.licenseTypes && newClientForm.licenseTypes.length > 0 && (
                          <div className="text-xs pt-2 border-t border-green-100">
                            <div className="font-medium text-green-700 mb-1">✅ 已自動勾選委託項目：</div>
                            <div className="flex flex-wrap gap-1">
                              {newClientForm.licenseTypes.map(type => {
                                const labels = {
                                  air: '💨 空氣',
                                  water: '💧 廢水',
                                  waste: '🗑️ 廢棄物',
                                  toxic: '☢️ 毒化',
                                  soil: '🌍 土壤'
                                };
                                return (
                                  <span key={type} className="px-2 py-0.5 bg-white rounded border border-green-200 text-green-700">
                                    {labels[type]}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label>
                <div className="flex gap-2">
                  <input required type="text" className="flex-1 border rounded-lg p-2" value={newClientForm.taxId} onChange={e => setNewClientForm({ ...newClientForm, taxId: e.target.value })} placeholder="8碼統編" maxLength={8} />
                  <button type="button" onClick={handleAutoFill} className="bg-teal-100 text-teal-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-teal-200 transition flex items-center gap-1">
                    <Zap className="w-4 h-4" /> 自動帶入
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目前階段</label>
                <select className="w-full border rounded-lg p-2" value={newClientForm.status} onChange={e => setNewClientForm({ ...newClientForm, status: e.target.value })}>
                  <option value="規劃階段">規劃階段</option>
                  <option value="試車階段">試車階段</option>
                  <option value="營運中">營運中</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">委託項目 (可多選)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'air', label: '💨 空氣', color: 'purple' },
                    { key: 'water', label: '💧 廢水', color: 'blue' },
                    { key: 'waste', label: '🗑️ 廢棄物', color: 'amber' },
                    { key: 'toxic', label: '☢️ 毒化', color: 'red' },
                    { key: 'soil', label: '🌍 土壤', color: 'green' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        const types = newClientForm.licenseTypes || [];
                        if (types.includes(item.key)) {
                          setNewClientForm({ ...newClientForm, licenseTypes: types.filter(t => t !== item.key) });
                        } else {
                          setNewClientForm({ ...newClientForm, licenseTypes: [...types, item.key] });
                        }
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition ${(newClientForm.licenseTypes || []).includes(item.key)
                        ? `bg-${item.color}-100 text-${item.color}-700 border-${item.color}-300 ring-2 ring-${item.color}-200`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">下一步動作</label>
                <input type="text" className="w-full border rounded-lg p-2" value={newClientForm.nextAction} onChange={e => setNewClientForm({ ...newClientForm, nextAction: e.target.value })} placeholder="例如：送審計畫書" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
                <input type="date" className="w-full border rounded-lg p-2" value={newClientForm.deadline} onChange={e => setNewClientForm({ ...newClientForm, deadline: e.target.value })} />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition mt-4">
                建立案件
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 編輯客戶 Modal */}
      {/* 編輯客戶 Modal (更新進度) */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingClient(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-800">{editingClient.name}</h3>
                  <button
                    onClick={() => setEditInfoClient({ ...editingClient, licenseTypes: editingClient.licenses.map(l => l.type) })}
                    className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                    title="編輯基本資料"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs mr-2">{editingClient.taxId}</span>
                </div>
              </div>
              <button onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">變更階段</label>
                <select className="w-full border rounded-lg p-2" value={editingClient.status} onChange={e => setEditingClient({ ...editingClient, status: e.target.value })}>
                  <option value="規劃階段">規劃階段</option>
                  <option value="試車階段">試車階段</option>
                  <option value="營運中">營運中</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">下一步動作</label>
                <input type="text" className="w-full border rounded-lg p-2" value={editingClient.nextAction} onChange={e => setEditingClient({ ...editingClient, nextAction: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止期限</label>
                <input type="date" className="w-full border rounded-lg p-2" value={editingClient.deadline} onChange={e => setEditingClient({ ...editingClient, deadline: e.target.value })} />
              </div>
              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button type="button" onClick={() => setEditingClient(null)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                  取消
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> 儲存變更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 編輯客戶基本資料 Modal */}
      {editInfoClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditInfoClient(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">✏️ 編輯基本資料</h3>
              <button onClick={() => setEditInfoClient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateClientInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名稱</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={editInfoClient.name} onChange={e => setEditInfoClient({ ...editInfoClient, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label>
                <input required type="text" className="w-full border rounded-lg p-2 font-mono" value={editInfoClient.taxId} onChange={e => setEditInfoClient({ ...editInfoClient, taxId: e.target.value })} maxLength={8} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">委託項目 (可多選)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'air', label: '💨 空氣', color: 'purple' },
                    { key: 'water', label: '💧 廢水', color: 'blue' },
                    { key: 'waste', label: '🗑️ 廢棄物', color: 'amber' },
                    { key: 'toxic', label: '☢️ 毒化', color: 'red' },
                    { key: 'soil', label: '🌍 土壤', color: 'green' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        const types = editInfoClient.licenseTypes || [];
                        if (types.includes(item.key)) {
                          setEditInfoClient({ ...editInfoClient, licenseTypes: types.filter(t => t !== item.key) });
                        } else {
                          setEditInfoClient({ ...editInfoClient, licenseTypes: [...types, item.key] });
                        }
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition ${(editInfoClient.licenseTypes || []).includes(item.key)
                        ? `bg-${item.color}-100 text-${item.color}-700 border-${item.color}-300 ring-2 ring-${item.color}-200`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button type="button" onClick={() => setEditInfoClient(null)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                  取消
                </button>
                <button type="submit" className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> 儲存變更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Footer ---
const Footer = () => (
  <footer className="bg-gray-800 text-white py-12 border-t border-gray-700 mt-auto">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-3 gap-12 text-sm">
        {/* Column 1: Contact Info */}
        <div>
          <h3 className="font-bold text-lg mb-4 text-teal-400 flex items-center">
            <Users className="w-5 h-5 mr-2" /> 聯絡資訊
          </h3>
          <p className="font-bold text-white text-base mb-1">傑太環境工程顧問有限公司</p>
          <p className="text-gray-400 text-xs mb-3">JET Environmental Engineering Ltd</p>

          <p className="font-bold text-white mb-1">業務副理 張惟荏</p>
          <p className="text-gray-400 mb-1 flex items-center"><Phone className="w-3 h-3 mr-2" /> (02)6609-5888 #103</p>
          <p className="text-gray-400">🧾 統編: 60779653</p>
        </div>

        {/* Column 2: Related Links */}
        <div>
          <h3 className="font-bold text-lg mb-4 text-teal-400 flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" /> 相關連結
          </h3>
          <ul className="space-y-3 text-gray-400">
            <li>
              <a href="https://www.jetenv.com.tw/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors flex items-center">
                <Globe className="w-4 h-4 mr-2" /> 官方網站
              </a>
            </li>
            <li>
              <a href="https://lin.ee/mTFxpvM" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors flex items-center">
                <div className="w-4 h-4 mr-2 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">L</div> 官方 Line 帳號
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Regulation Resources (Unchanged) */}
        <div>
          <h3 className="font-bold text-lg mb-4 text-teal-400 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" /> 官方法規資源
          </h3>
          <ul className="space-y-2 text-gray-400">
            <li><a href="https://law.moj.gov.tw/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors">全國法規資料庫</a></li>
            <li><a href="https://oaout.moenv.gov.tw/law/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors">環境部法規查詢</a></li>
            <li><a href="https://law.moea.gov.tw/" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-colors">經濟部法規查詢</a></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-xs">
        <p>傑太環境工程顧問有限公司 - 業務法規參考手冊</p>
        <p className="mt-1">Designed by Nick Chang (ZN Studio) | 法規資料已查證更新至 2024年12月</p>
      </div>
    </div>
  </footer>
);

// --- Main App Shell ---
export default function App() {
  const navigate = useNavigate(); // Add this line
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="bg-teal-600 text-white p-1.5 rounded mr-3">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">JET Sales Command</h1>
                <p className="text-xs text-gray-500 hidden sm:block">傑太環境工程顧問 - 業務管理系統 v2.0</p>
              </div>
              {/* Back to Home Button */}
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/'); }}
                className="ml-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded text-xs font-bold transition-colors"
              >
                退出 (Exit)
              </button>
            </div>

            {!isMobile && (
              <Navigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobile={false}
              />
            )}

            {isMobile && (
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600">
                {menuOpen ? <X /> : <Menu />}
              </button>
            )}
          </div>
        </div>

        {isMobile && menuOpen && (
          <div className="bg-white border-t border-gray-100 absolute w-full shadow-lg z-50">
            <Navigation
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); setMenuOpen(false); }}
              isMobile={true}
              setMenuOpen={setMenuOpen}
            />
          </div>
        )}
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'dashboard' && <FlowchartView />}
        {activeTab === 'compliance' && <ComplianceView />}
        {activeTab === 'library' && <RegulationLibraryView />}
        {activeTab === 'clients' && <ClientView />}
      </main>

      <Footer />
    </div>
  );
}
