import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { UserRole } from '../types';
import { Plus, Check, Edit2, ShieldAlert, UserMinus, ShieldCheck } from 'lucide-react';

export const OrgSetupView: React.FC = () => {
  const { 
    activeRole, 
    departments, 
    categories, 
    users, 
    createDepartment, 
    updateDepartment,
    createCategory,
    updateEmployeeRole,
    deactivateEmployee
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'directory'>('departments');

  // Modals/Forms States
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: '', headId: '', parentDepartment: '', status: 'Active' as 'Active' | 'Inactive' });

  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Security Check (in case someone manages to access view via other means)
  if (activeRole !== 'Admin') {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">Access Denied</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Organization Setup is restricted to System Administrators. Please switch your role at the bottom of the sidebar to Admin to view this page.
        </p>
      </div>
    );
  }

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) return;

    if (editingDept) {
      updateDepartment(editingDept.id, deptForm.name, deptForm.headId || undefined, deptForm.parentDepartment || undefined, deptForm.status);
    } else {
      createDepartment(deptForm.name, deptForm.headId || undefined, deptForm.parentDepartment || undefined);
    }

    setDeptForm({ name: '', headId: '', parentDepartment: '', status: 'Active' });
    setEditingDept(null);
    setShowDeptModal(false);
  };

  const handleEditDeptClick = (dept: any) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      headId: dept.headId || '',
      parentDepartment: dept.parentDepartment || '',
      status: dept.status
    });
    setShowDeptModal(true);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;

    createCategory(catForm.name, catForm.description);
    setCatForm({ name: '', description: '' });
    setShowCatModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('departments')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'departments' 
              ? 'border-[#167C65] text-[#167C65]' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Departments
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'categories' 
              ? 'border-[#167C65] text-[#167C65]' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Asset Categories
        </button>
        <button 
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'directory' 
              ? 'border-[#167C65] text-[#167C65]' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Employee Directory
        </button>
      </div>

      {/* 1. DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-3xs">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Manage Departments</h4>
              <p className="text-xs text-gray-500">Configure heads, status, and sub-divisions.</p>
            </div>
            <button 
              onClick={() => {
                setEditingDept(null);
                setDeptForm({ name: '', headId: '', parentDepartment: '', status: 'Active' });
                setShowDeptModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Department
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dept Name</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department Head</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Parent Division</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-gray-50/50">
                      <td className="p-4 text-xs font-bold text-gray-900">{dept.name}</td>
                      <td className="p-4 text-xs text-gray-700">{dept.headName}</td>
                      <td className="p-4 text-xs text-gray-500">{dept.parentDepartment || '—'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          dept.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {dept.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleEditDeptClick(dept)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-950 transition-colors inline-flex"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-3xs">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Asset Categories</h4>
              <p className="text-xs text-gray-500">Categorize inventory items for better allocation and workflows.</p>
            </div>
            <button 
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1.5 bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between h-32">
                <div>
                  <h5 className="text-xs font-bold text-gray-900 mb-1">{cat.name}</h5>
                  <p className="text-[11px] text-gray-500 leading-normal">{cat.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold border-t border-gray-100 pt-2 mt-2">
                  <span>SYSTEM REGISTERED</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-3xs">
            <h4 className="text-sm font-bold text-gray-900">Employee Directory & Role Assignment</h4>
            <p className="text-xs text-gray-500">Configure corporate users, promotion permissions, and account access levels.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">System Role</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Promotions & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {users.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#167C65] font-bold text-xs flex items-center justify-center border border-emerald-100">
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{emp.name}</span>
                            <span className="text-[10px] text-gray-500 block leading-none mt-0.5">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-700">{emp.department}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          emp.role === 'Admin' 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : emp.role === 'Asset Manager' 
                              ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                              : emp.role === 'Department Head' 
                                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                : 'bg-gray-100 text-gray-700'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Promotion Select Trigger */}
                          <div className="relative inline-block">
                            <select
                              value={emp.role}
                              onChange={(e) => updateEmployeeRole(emp.id, e.target.value as UserRole)}
                              className="bg-white border border-gray-200 text-gray-700 text-[10px] font-bold py-1.5 px-2.5 rounded-lg appearance-none cursor-pointer pr-6 focus:outline-none focus:border-[#167C65]"
                            >
                              <option value="Admin">Promote Admin</option>
                              <option value="Asset Manager">Manager</option>
                              <option value="Department Head">Dept Head</option>
                              <option value="Employee">Employee</option>
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                          </div>
                          
                          {/* Deactivate employee */}
                          {emp.status === 'Active' ? (
                            <button
                              onClick={() => deactivateEmployee(emp.id)}
                              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 inline-flex"
                              title="Deactivate Employee"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold px-2.5">Inactive</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENTS MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingDept ? 'Edit Department' : 'Create Department'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleDeptSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Department Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sales Division" 
                  value={deptForm.name}
                  onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Assign Department Head</label>
                <select 
                  value={deptForm.headId}
                  onChange={e => setDeptForm(prev => ({ ...prev, headId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                >
                  <option value="">-- Choose Head --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Parent Department</label>
                <select 
                  value={deptForm.parentDepartment}
                  onChange={e => setDeptForm(prev => ({ ...prev, parentDepartment: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                >
                  <option value="">-- None --</option>
                  {departments.filter(d => !editingDept || d.id !== editingDept.id).map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {editingDept && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Status</label>
                  <select 
                    value={deptForm.status}
                    onChange={e => setDeptForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Add Asset Category</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Category Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Server Racks" 
                  value={catForm.name}
                  onChange={e => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description (Optional)</label>
                <textarea 
                  placeholder="Details about items under this category..." 
                  value={catForm.description}
                  onChange={e => setCatForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65] h-20 resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
