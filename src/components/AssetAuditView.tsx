import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { AuditCycle, AuditRecord } from '../types';
import { ClipboardList, PlusCircle, CheckCircle, AlertTriangle, XCircle, FileText, Check, ShieldAlert } from 'lucide-react';

export const AssetAuditView: React.FC = () => {
  const { auditCycles, assets, departments, users, createAuditCycle, verifyAuditAsset, closeAuditCycle, activeRole } = useAppState();

  const [activeCycleId, setActiveCycleId] = useState<string | null>(
    auditCycles.length > 0 ? auditCycles[0].id : null
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCycleForm, setNewCycleForm] = useState({
    departmentId: '', location: '', assignedAuditorId: '', startDate: '', endDate: ''
  });

  const selectedCycle = auditCycles.find(c => c.id === activeCycleId);
  const isAuditCycleActive = selectedCycle?.status === 'Active';

  const getAssetsForAudit = (deptId: string) => {
    return assets; // Mocking assets for demo
  };

  const auditAssetsList = selectedCycle ? getAssetsForAudit(selectedCycle.departmentId) : [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { departmentId, location, assignedAuditorId, startDate, endDate } = newCycleForm;
    if (!departmentId || !location || !assignedAuditorId || !startDate || !endDate) { alert('Please fill out all fields.'); return; }
    createAuditCycle(departmentId, location, assignedAuditorId, startDate, endDate);
    setShowCreateModal(false);
    setNewCycleForm({ departmentId: '', location: '', assignedAuditorId: '', startDate: '', endDate: '' });
  };

  const getVerificationStatus = (assetTag: string) => {
    return selectedCycle?.history.find(h => h.assetTag === assetTag)?.verificationStatus || 'Pending';
  };

  const getVerificationNotes = (assetTag: string) => {
    return selectedCycle?.history.find(h => h.assetTag === assetTag)?.notes || '';
  };

  const getDiscrepancies = (cycle: AuditCycle) => {
    const missing = cycle.history.filter(h => h.verificationStatus === 'Missing');
    const damaged = cycle.history.filter(h => h.verificationStatus === 'Damaged');
    return { missing, damaged };
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="card-premium p-4 flex justify-between items-center animate-slide-up">
        <div>
          <h4 className="section-title">Asset Verification &amp; Audit Cycles</h4>
          <p className="text-xs text-gray-500 mt-0.5">Perform periodic departmental audits to reconcile physical assets.</p>
        </div>
        <button onClick={() => {
          if (activeRole === 'Employee') { alert('Only administrators, department heads, and managers can initiate audit cycles.'); return; }
          setShowCreateModal(true);
        }} disabled={activeRole === 'Employee'} className="btn-primary gap-1.5 disabled:opacity-50">
          <PlusCircle className="w-4 h-4" /> Start Audit Cycle
        </button>
      </div>

      {/* Audit Cycles Table */}
      <div className="card-premium overflow-hidden animate-slide-up stagger-1">
        <div className="border-b border-gray-100 p-4 pb-3">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active &amp; Historical Audit Cycles</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th><th>Location</th><th>Assigned Auditor</th><th>Schedule</th><th>Status</th><th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {auditCycles.map(cycle => {
                const isActive = activeCycleId === cycle.id;
                return (
                  <tr key={cycle.id} onClick={() => setActiveCycleId(cycle.id)}
                    className={`cursor-pointer transition-colors ${isActive ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="font-bold text-gray-900 text-xs">{cycle.departmentName}</td>
                    <td className="text-xs text-gray-700">{cycle.location}</td>
                    <td className="text-xs text-gray-700">{cycle.assignedAuditorName}</td>
                    <td className="text-xs text-gray-500">{cycle.startDate} to {cycle.endDate}</td>
                    <td>
                      <span className={cycle.status === 'Active' ? 'badge badge-warning-pill' : 'badge badge-success-pill'}>
                        {cycle.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`text-[10px] font-bold ${isActive ? 'text-[#167C65]' : 'text-gray-400'} hover:underline`}>
                        {isActive ? 'Selected' : 'Select'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Detail */}
      {selectedCycle ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
          
          {/* Checklist */}
          <div className="lg:col-span-2 card-premium p-5 space-y-4">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="section-title">Reconciliation Asset Checklist</h4>
                <p className="text-xs text-gray-500 mt-0.5">Verify items for {selectedCycle.departmentName} ({selectedCycle.location}).</p>
              </div>
              <span className="badge badge-neutral-pill text-[10px]">
                {selectedCycle.history.length} / {auditAssetsList.length} Verified
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
                        <span className="text-[9px] font-bold text-gray-400 block mb-0.5 font-mono">{asset.tag}</span>
                        <span className="text-xs font-bold text-gray-900">{asset.name}</span>
                        <span className="text-[10px] text-gray-500 ml-2 font-mono">S/N: {asset.serialNumber}</span>
                      </div>
                      <span className={`badge ${status === 'Pending' ? 'badge-neutral-pill' : status === 'Verified' ? 'badge-success-pill' : status === 'Missing' ? 'badge-danger-pill' : 'badge-warning-pill'}`}>
                        {status}
                      </span>
                    </div>

                    {isAuditCycleActive && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/50">
                        <input id={`audit-note-${asset.tag}`} type="text" defaultValue={notes} placeholder="Verification notes..."
                          className="input-field flex-1 py-1 text-[11px]" />
                        <div className="flex gap-1.5 shrink-0 rounded-lg overflow-hidden border border-gray-200">
                          <button onClick={() => {
                            const val = (document.getElementById(`audit-note-${asset.tag}`) as HTMLInputElement)?.value;
                            verifyAuditAsset(selectedCycle.id, asset.tag, 'Verified', val);
                          }} className="px-3 py-1.5 text-[10px] font-bold bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                            Match
                          </button>
                          <button onClick={() => {
                            const val = (document.getElementById(`audit-note-${asset.tag}`) as HTMLInputElement)?.value;
                            verifyAuditAsset(selectedCycle.id, asset.tag, 'Missing', val);
                          }} className="px-3 py-1.5 text-[10px] font-bold bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors border-l border-gray-200">
                            Missing
                          </button>
                          <button onClick={() => {
                            const val = (document.getElementById(`audit-note-${asset.tag}`) as HTMLInputElement)?.value;
                            verifyAuditAsset(selectedCycle.id, asset.tag, 'Damaged', val);
                          }} className="px-3 py-1.5 text-[10px] font-bold bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors border-l border-gray-200">
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

          {/* Ops Panel */}
          <div className="card-premium h-full flex flex-col relative overflow-hidden">
            {/* Green top border accent */}
            <div className="h-1.5 w-full bg-[#167C65] absolute top-0 left-0" />
            <div className="p-5 space-y-4 flex flex-col h-full pt-6">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">Audit Summary</h4>
              
              <div className="space-y-2 text-xs">
                <p className="text-gray-500">Auditor: <span className="font-bold text-gray-800">{selectedCycle.assignedAuditorName}</span></p>
                <p className="text-gray-500">Period: <span className="font-bold text-gray-800">{selectedCycle.startDate} – {selectedCycle.endDate}</span></p>
              </div>

              <div className="p-4 rounded-xl space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h5 className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#167C65]" /> Discrepancy Metrics
                </h5>
                {selectedCycle.history.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">No verification logged.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-700"><span>Logged:</span><span className="font-bold">{selectedCycle.history.length}</span></div>
                    <div className="flex justify-between text-emerald-600"><span>Matches:</span><span className="font-bold">{selectedCycle.history.filter(h => h.verificationStatus === 'Verified').length}</span></div>
                    <div className="flex justify-between text-red-500"><span>Missing:</span><span className="font-bold">{getDiscrepancies(selectedCycle).missing.length}</span></div>
                    <div className="flex justify-between text-amber-500"><span>Damaged:</span><span className="font-bold">{getDiscrepancies(selectedCycle).damaged.length}</span></div>
                  </div>
                )}
              </div>

              {selectedCycle.discrepancyGenerated && (
                <div className="p-3 rounded-xl border border-red-200 bg-red-50">
                  <span className="text-[9px] font-bold text-red-700 uppercase block mb-1">Discrepancy Report</span>
                  <p className="text-[10px] text-red-600 font-medium leading-relaxed">
                    Differences found! {getDiscrepancies(selectedCycle).missing.length} missing and {getDiscrepancies(selectedCycle).damaged.length} damaged assets registered.
                  </p>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-gray-100">
                {isAuditCycleActive ? (
                  <button onClick={() => {
                    if (selectedCycle.history.length === 0) { alert('Verify at least one asset to close.'); return; }
                    closeAuditCycle(selectedCycle.id);
                  }} className="btn-primary w-full justify-center gap-1.5 text-xs py-2.5">
                    <Check className="w-4 h-4" /> Close Audit Cycle
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-center text-[10px] font-bold">
                    ✓ Audit Cycle Closed &amp; Logged
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-premium p-10 text-center animate-slide-up stagger-2">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-xs text-gray-400">No active audit cycle selected.</p>
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-panel w-full max-w-md">
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Space Grotesk' }}>Start Audit Cycle</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="input-label">Select Department *</label>
                <select value={newCycleForm.departmentId} onChange={e => setNewCycleForm(p => ({ ...p, departmentId: e.target.value }))} className="input-field" required>
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Location *</label>
                <input type="text" placeholder="e.g. HQ - 4th Floor" value={newCycleForm.location} onChange={e => setNewCycleForm(p => ({ ...p, location: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Assigned Auditor *</label>
                <select value={newCycleForm.assignedAuditorId} onChange={e => setNewCycleForm(p => ({ ...p, assignedAuditorId: e.target.value }))} className="input-field" required>
                  <option value="">-- Choose Auditor --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Start Date *</label>
                  <input type="date" value={newCycleForm.startDate} onChange={e => setNewCycleForm(p => ({ ...p, startDate: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="input-label">End Date *</label>
                  <input type="date" value={newCycleForm.endDate} onChange={e => setNewCycleForm(p => ({ ...p, endDate: e.target.value }))} className="input-field" required />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Initiate Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
