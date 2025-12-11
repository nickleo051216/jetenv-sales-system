// 新增客戶 Modal 和編輯客戶 Modal 的完整程式碼
// 請將此程式碼加入到 ClientView 組件中

// ===== 第一步：在 ClientView 開頭加上這些 state =====
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [editingClient, setEditingClient] = useState(null);
const [newClientForm, setNewClientForm] = useState({
    name: '',
    taxId: '',
    status: '規劃階段',
    nextAction: '',
    deadline: ''
});

// ===== 第二步：加上這些處理函數 =====

// 新增客戶
const handleAddClient = async (e) => {
    e.preventDefault();
    try {
        const phaseMap = { '規劃階段': 1, '試車階段': 2, '營運中': 3 };

        const { data, error } = await supabase
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

        if (error) throw error;

        alert('✅ 客戶新增成功！');
        setIsAddModalOpen(false);
        setNewClientForm({ name: '', taxId: '', status: '規劃階段', nextAction: '', deadline: '' });
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

// ===== 第三步：把「新增案件」按鈕改成這樣 ===== 
<button 
  onClick={() => setIsAddModalOpen(true)}
  className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors min-h-[250px] group"
>
  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-teal-50 transition-colors">
    <Plus className="w-6 h-6 group-hover:text-teal-500" />
  </div>
  <span className="font-medium">新增案件</span>
</button>

// ===== 第四步：把「更新進度」按鈕改成這樣 =====
<button 
  onClick={() => setEditingClient(client)}
  className="w-full mt-4 py-2 text-sm text-teal-600 font-medium border border-teal-200 rounded hover:bg-teal-50 transition-colors"
>
  更新進度 →
</button>

// ===== 第五步：在 return 的最後、ClientView 結束前加上這兩個 Modal =====

{/* 新增客戶 Modal */ }
{
    isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label>
                        <input required type="text" className="w-full border rounded-lg p-2" value={newClientForm.taxId} onChange={e => setNewClientForm({ ...newClientForm, taxId: e.target.value })} placeholder="8碼統編" />
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
    )
}

{/* 編輯客戶 Modal */ }
{
    editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingClient(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">✏️ 更新進度</h3>
                        <p className="text-sm text-gray-500">{editingClient.name}</p>
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
    )
}
