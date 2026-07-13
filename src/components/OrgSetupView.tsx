import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { UserRole } from '../types';
import { Plus, Check, Edit2, ShieldAlert, UserMinus, ShieldCheck } from 'lucide-react';

export const OrgSetupView: React.FC = () => {
  const { activeRole, departments, categories, users, createDepartment, updateDepartment, createCategory, updateEmployeeRole, deactivateEmployee } = useAppState();

  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'directory'>('departments');

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: '', headId: '', parentDepartment: '', status: 'Active' as 'Active' | 'Inactive' });

  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Security
  if (activeRole !== 'Admin') {
    return (
      <div className="card-premium p-10 text-center animate-slide-up">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="section-title">Access Denied</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-2">
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
    setDeptForm({ name: dept.name, headId: dept.headId || '', parentDepartment: dept.parentDepartment || '', status: dept.status });
    setShowDeptModal(true);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;
    createCategory(catForm.name, catForm.description);
    setCatForm({ name: '', description: '' });
    setShowCatModal(false);
  };

  const roleColors: Record<string, string> = {
    'Admin': 'badge-danger-pill',
    'Asset Manager': 'badge-success-pill',
    'Department Head': 'badge-info-pill',
    'Employee': 'badge-neutral-pill'
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'departments', label: 'Departments' },
          { id: 'categories', label: 'Asset Categories' },
          { id: 'directory', label: 'Employee Directory' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-xs font-bold border-b-2 transition-all duration-300 ${activeTab === tab.id ? 'border-[#167C65] text-[#167C65] tracking-wide' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-premium p-4 flex justify-between items-center">
            <div>
              <h4 className="section-title">Manage Departments</h4>
              <p className="text-xs text-gray-500 mt-0.5">Configure heads, status, and sub-divisions.</p>
            </div>
            <button onClick={() => { setEditingDept(null); setDeptForm({ name: '', headId: '', parentDepartment: '', status: 'Active' }); setShowDeptModal(true); }}
              className="btn-primary gap-1.5">
              <Plus className="w-4 h-4" /> Create Department
            </button>
          </div>

          <div className="card-premium overflow-hidden animate-slide-up stagger-1">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department Name</th><th>Department Head</th><th>Parent Division</th><th>Status</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, i) => (
                    <tr key={dept.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                      <td className="font-bold text-gray-900 text-xs">
                        {dept.parentDepartment ? <span className="text-gray-300 mr-2">↳</span> : null}
                        {dept.name}
                      </td>
                      <td>
                        {dept.headName ? (
                          <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#167C65] font-bold text-[10px] flex items-center justify-center border border-emerald-100">
                              {dept.headName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            {dept.headName}
                          </div>
                        ) : <span className="text-gray-400 text-xs italic">Unassigned</span>}
                      </td>
                      <td className="text-xs text-gray-500">{dept.parentDepartment || '—'}</td>
                      <td>
                        <span className={`badge ${dept.status === 'Active' ? 'badge-success-pill' : 'badge-neutral-pill'}`}>
                          {dept.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button onClick={() => handleEditDeptClick(dept)} className="btn-secondary px-2.5 py-1.5 text-xs text-gray-500">
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

      {/* 2. CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-premium p-4 flex justify-between items-center">
            <div>
              <h4 className="section-title">Asset Categories</h4>
              <p className="text-xs text-gray-500 mt-0.5">Categorize inventory items for better workflows.</p>
            </div>
            <button onClick={() => setShowCatModal(true)} className="btn-primary gap-1.5">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <div key={cat.id} className={`card-premium p-5 flex flex-col justify-between h-36 gradient-card-hover animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                <div>
                  <h5 className="font-bold text-gray-900 text-sm mb-1.5" style={{ fontFamily: 'Space Grotesk' }}>{cat.name}</h5>
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{cat.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">System Registered</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-premium p-4">
            <h4 className="section-title">Employee Directory &amp; Role Assignment</h4>
            <p className="text-xs text-gray-500 mt-0.5">Configure corporate users, promotion permissions, and account access levels.</p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 animate-slide-up stagger-1">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 font-medium">Policy: Only System Administrators can promote users to 'Admin' or 'Department Head'.</p>
          </div>

          <div className="card-premium overflow-hidden animate-slide-up stagger-2">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Department</th><th>System Role</th><th>Status</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((emp, i) => (
                    <tr key={emp.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #167C65, #0f5a49)' }}>
                            {emp.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-gray-700">{emp.department}</td>
                      <td>
                        <span className={`badge ${roleColors[emp.role] || 'badge-neutral-pill'}`}>{emp.role}</span>
                      </td>
                      <td>
                        <span className={`badge ${emp.status === 'Active' ? 'badge-success-pill' : 'badge-neutral-pill'}`}>{emp.status}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="relative">
                            <select value={emp.role} onChange={(e) => updateEmployeeRole(emp.id, e.target.value as UserRole)}
                              className="input-field py-1.5 px-2.5 text-[10px] font-bold min-w-[110px] cursor-pointer">
                              <option value="Admin">Admin</option>
                              <option value="Asset Manager">Manager</option>
                              <option value="Department Head">Dept Head</option>
                              <option value="Employee">Employee</option>
                            </select>
                          </div>
                          {emp.status === 'Active' ? (
                            <button onClick={() => deactivateEmployee(emp.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100" title="Deactivate">
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold px-2">Inactive</span>
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

      {/* Dept Modal */}
      {showDeptModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-panel w-full max-w-md">
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Space Grotesk' }}>{editingDept ? 'Edit Department' : 'Create Department'}</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              <div>
                <label className="input-label">Department Name *</label>
                <input type="text" placeholder="e.g. Sales Division" value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Department Head</label>
                <select value={deptForm.headId} onChange={e => setDeptForm(p => ({ ...p, headId: e.target.value }))} className="input-field">
                  <option value="">-- Choose Head --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Parent Department</label>
                <select value={deptForm.parentDepartment} onChange={e => setDeptForm(p => ({ ...p, parentDepartment: e.target.value }))} className="input-field">
                  <option value="">-- None --</option>
                  {departments.filter(d => !editingDept || d.id !== editingDept.id).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              {editingDept && (
                <div>
                  <label className="input-label">Status</label>
                  <select value={deptForm.status} onChange={e => setDeptForm(p => ({ ...p, status: e.target.value as any }))} className="input-field">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingDept ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-panel w-full max-w-md">
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Space Grotesk' }}>Add Category</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
              <div>
                <label className="input-label">Category Name *</label>
                <input type="text" placeholder="e.g. Server Racks" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Description (Optional)</label>
                <textarea placeholder="Details..." value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} className="input-field h-20 resize-none" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
