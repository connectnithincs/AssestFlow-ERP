import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { AuditCycle, AuditRecord } from '../types';
import { ClipboardList, PlusCircle, CheckCircle, AlertTriangle, XCircle, FileText, Check, ShieldAlert } from 'lucide-react';

export const AssetAuditView: React.FC = () => {
  const { 
    auditCycles, 
    assets, 
    departments, 
    users, 
    createAuditCycle, 
    verifyAuditAsset, 
    closeAuditCycle,
    activeRole 
  } = useAppState();

  const [activeCycleId, setActiveCycleId] = useState<string | null>(
    auditCycles.length > 0 ? auditCycles[0].id : null
  );

  // New Cycle Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCycleForm, setNewCycleForm] = useState({
    departmentId: '',
    location: '',
    assignedAuditorId: '',
    startDate: '',
    endDate: ''
  });

  const selectedCycle = auditCycles.find(c => c.id === activeCycleId);
  const isAuditCycleActive = selectedCycle?.status === 'Active';

  // Get assets belonging to the department under audit
  // (In our seed data, we map departments to locations or just list all assets for verification simplicity)
  const getAssetsForAudit = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return [];
    // Return all assets in the category or location that match this department, or just mock assets.
    // Let's filter assets that are located in the department location or category
    return assets;
  };

  const auditAssetsList = selectedCycle ? getAssetsForAudit(selectedCycle.departmentId) : [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { departmentId, location, assignedAuditorId, startDate, endDate } = newCycleForm;
    if (!departmentId || !location || !assignedAuditorId || !startDate || !endDate) {
      alert('Please fill out all fields.');
      return;
    }
    createAuditCycle(departmentId, location, assignedAuditorId, startDate, endDate);
    setShowCreateModal(false);
    setNewCycleForm({ departmentId: '', location: '', assignedAuditorId: '', startDate: '', endDate: '' });
  };

  const getVerificationStatus = (assetTag: string) => {
    const record = selectedCycle?.history.find(h => h.assetTag === assetTag);
    return record ? record.verificationStatus : 'Pending';
  };

  const getVerificationNotes = (assetTag: string) => {
    const record = selectedCycle?.history.find(h => h.assetTag === assetTag);
    return record?.notes || '';
  };

  // Generate discrepancy statistics
  const getDiscrepancies = (cycle: AuditCycle) => {
    const missing = cycle.history.filter(h => h.verificationStatus === 'Missing');
    const damaged = cycle.history.filter(h => h.verificationStatus === 'Damaged');
    return { missing, damaged };
  };

  return (
    <div className="space-y-6">
      
      {/* Overview stats and Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-3xs">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Asset Verification & Audit Cycles</h4>
          <p className="text-xs text-gray-500">Perform periodic departmental audits to reconcile physical assets.</p>
        </div>
        <button 
          onClick={() => {
            if (activeRole === 'Employee') {
              alert('Only administrators, department heads, and managers can initiate audit cycles.');
              return;
            }
            setShowCreateModal(true);
          }}
          disabled={activeRole === 'Employee'}
          className="flex items-center gap-1.5 bg-[#167C65] hover:bg-[#126351] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Start New Audit Cycle
        </button>
      </div>

      {/* Audit Cycles Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="border-b border-gray-150 p-4 bg-gray-50/40">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active & Historical Audit Cycles</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assigned Auditor</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Schedule Date Range</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {auditCycles.map(cycle => {
                const isActive = activeCycleId === cycle.id;
                return (
                  <tr 
                    key={cycle.id} 
                    onClick={() => setActiveCycleId(cycle.id)}
                    className={`cursor-pointer transition-colors ${
                      isActive ? 'bg-[#167C65]/5 hover:bg-[#167C65]/5 font-semibold' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="p-4 text-xs text-gray-900 font-bold">{cycle.departmentName}</td>
                    <td className="p-4 text-xs text-gray-700">{cycle.location}</td>
                    <td className="p-4 text-xs text-gray-700">{cycle.assignedAuditorName}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {cycle.startDate} to {cycle.endDate}
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        cycle.status === 'Active' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {cycle.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-[10px] font-bold text-[#167C65] hover:underline">
                        Select
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Audit Cycle Verification Details Panel */}
      {selectedCycle ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Verification Checklists */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-gray-150 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Reconciliation Asset Checklist</h4>
                <p className="text-xs text-gray-500">Verify items for {selectedCycle.departmentName} ({selectedCycle.location}).</p>
              </div>
              <span className="text-xs text-gray-400 font-semibold">
                Progress: <span className="font-bold text-gray-800">{selectedCycle.history.length}</span> / {auditAssetsList.length} items
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {auditAssetsList.map(asset => {
                const status = getVerificationStatus(asset.tag);
                const notes = getVerificationNotes(asset.tag);
                
                return (
                  <div key={asset.tag} className="p-3 bg-gray-50/50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block">{asset.tag}</span>
                        <span className="text-xs font-bold text-gray-900">{asset.name}</span>
                        <span className="text-[10px] text-gray-500 ml-2">S/N: {asset.serialNumber}</span>
                      </div>
                      
                      {/* Verification Badge Status */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          status === 'Pending' 
                            ? 'bg-gray-100 text-gray-500' 
                            : status === 'Verified' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : status === 'Missing'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Audit verification triggers */}
                    {isAuditCycleActive && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/50">
                        {/* Note Input */}
                        <input
                          id={`audit-note-${asset.tag}`}
                          type="text"
                          defaultValue={notes}
                          placeholder="Verification notes..."
                          className="flex-1 min-w-[150px] border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-[#167C65] bg-white"
                        />

                        {/* Buttons */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              const noteVal = (document.getElementById(`audit-note-${asset.tag}`) as HTMLInputElement)?.value;
                              verifyAuditAsset(selectedCycle.id, asset.tag, 'Verified', noteVal);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Verify OK
                          </button>
                          <button
                            onClick={() => {
                              const noteVal = (document.getElementById(`audit-note-${asset.tag}`) as HTMLInputElement)?.value;
                              verifyAuditAsset(selectedCycle.id, asset.tag, 'Missing', noteVal);
                            }}
                            className="bg-red-600 hover:bg-red-750 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Missing
                          </button>
                          <button
                            onClick={() => {
                              const noteVal = (document.getElementById(`audit-note-${asset.tag}`) as HTMLInputElement)?.value;
                              verifyAuditAsset(selectedCycle.id, asset.tag, 'Damaged', noteVal);
                            }}
                            className="bg-amber-500 hover:bg-amber-650 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Damaged
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Discrepancy & Close Audit Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between h-[450px]">
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Audit Operations Panel</h4>
              </div>

              {/* Cycle Info summary */}
              <div className="space-y-2 text-xs">
                <p className="text-gray-500">Auditor: <span className="font-bold text-gray-800">{selectedCycle.assignedAuditorName}</span></p>
                <p className="text-gray-500">Period: <span className="font-bold text-gray-800">{selectedCycle.startDate} to {selectedCycle.endDate}</span></p>
                <p className="text-gray-500">Status: <span className="font-bold text-gray-800">{selectedCycle.status}</span></p>
              </div>

              {/* Dynamic Discrepancy Panel */}
              <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-3">
                <h5 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#167C65]" />
                  Discrepancy Metrics
                </h5>

                {selectedCycle.history.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No verification logged yet.</p>
                ) : (
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span>Total Logged Items:</span>
                      <span className="font-bold">{selectedCycle.history.length}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Verified Match:</span>
                      <span className="font-bold">{selectedCycle.history.filter(h => h.verificationStatus === 'Verified').length}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>Missing / Lost:</span>
                      <span className="font-bold">{getDiscrepancies(selectedCycle).missing.length}</span>
                    </div>
                    <div className="flex justify-between text-amber-500">
                      <span>Damaged / Broken:</span>
                      <span className="font-bold">{getDiscrepancies(selectedCycle).damaged.length}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Discrepancy Report Display */}
              {selectedCycle.discrepancyGenerated && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-bold text-red-700 uppercase tracking-wider block">Discrepancy Report Generated</span>
                  <p className="text-[10px] text-red-600 leading-normal font-medium">
                    Critical differences found! {getDiscrepancies(selectedCycle).missing.length} missing asset(s) and {getDiscrepancies(selectedCycle).damaged.length} damaged asset(s) registered.
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Generate report / Close cycle */}
            {isAuditCycleActive ? (
              <div className="space-y-2.5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    if (selectedCycle.history.length === 0) {
                      alert('You must verify at least one asset to generate report.');
                      return;
                    }
                    closeAuditCycle(selectedCycle.id); // Close cycle and trigger reports
                  }}
                  className="w-full bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Close Audit Cycle
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-center text-xs font-semibold">
                ✓ Audit Completed and Logged.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 space-y-2">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-xs">No active audit cycle selected.</p>
        </div>
      )}

      {/* START NEW CYCLE FORM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Start Department Audit Cycle</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Department *</label>
                <select 
                  value={newCycleForm.departmentId}
                  onChange={e => setNewCycleForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Verification Location *</label>
                <input 
                  type="text" 
                  placeholder="e.g. HQ - 4th Floor" 
                  value={newCycleForm.location}
                  onChange={e => setNewCycleForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Assigned Auditor *</label>
                <select 
                  value={newCycleForm.assignedAuditorId}
                  onChange={e => setNewCycleForm(prev => ({ ...prev, assignedAuditorId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                >
                  <option value="">-- Choose Auditor --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Start Date *</label>
                  <input 
                    type="date" 
                    value={newCycleForm.startDate}
                    onChange={e => setNewCycleForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">End Date *</label>
                  <input 
                    type="date" 
                    value={newCycleForm.endDate}
                    onChange={e => setNewCycleForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Initiate Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
