import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { MaintenanceRecord } from '../types';
import { Plus, Wrench, ShieldAlert, User, CheckCircle, ArrowRight } from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const { maintenanceRequests, assets, raiseMaintenanceRequest, updateMaintenanceStatus, activeRole } = useAppState();

  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ assetTag: '', issueDescription: '', priority: 'Medium' as any });
  const [activeRequestId, setActiveRequestId] = useState<string | null>(
    maintenanceRequests.length > 0 ? maintenanceRequests[0].id : null
  );

  const handleRaiseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.assetTag || !newRequest.issueDescription) { alert('Please fill out all required fields.'); return; }
    raiseMaintenanceRequest(newRequest.assetTag, newRequest.issueDescription, newRequest.priority);
    setNewRequest({ assetTag: '', issueDescription: '', priority: 'Medium' });
    setShowRaiseModal(false);
    if (maintenanceRequests.length > 0) setActiveRequestId(maintenanceRequests[0].id);
  };

  const selectedRequest = maintenanceRequests.find(r => r.id === activeRequestId);

  const getPriorityClass = (priority: MaintenanceRecord['priority']) => {
    const cls: Record<string, string> = {
      Low: 'badge priority-low',
      Medium: 'badge priority-medium',
      High: 'badge priority-high',
      Critical: 'badge priority-critical',
    };
    return cls[priority] || 'badge badge-neutral-pill';
  };

  const getPriorityBorderStyle = (priority: MaintenanceRecord['priority'], isActive: boolean) => {
    if (!isActive) {
      const borders: Record<string, string> = { Critical: '#fecdd3', High: '#fed7aa', Medium: '#fde68a', Low: '#bbf7d0' };
      return { borderLeft: `3px solid ${borders[priority] || '#e2e8f0'}` };
    }
    const borders: Record<string, string> = { Critical: '#e11d48', High: '#c2410c', Medium: '#d97706', Low: '#16a34a' };
    return { borderLeft: `3px solid ${borders[priority] || '#167C65'}` };
  };

  const getStatusBadge = (status: MaintenanceRecord['status']) => {
    const cls: Record<string, string> = {
      Pending: 'badge badge-neutral-pill',
      Approved: 'badge badge-info-pill',
      'Technician Assigned': 'badge badge-reserved',
      'In Progress': 'badge badge-warning-pill',
      Resolved: 'badge badge-success-pill',
    };
    return <span className={cls[status] || 'badge badge-neutral-pill'}>{status}</span>;
  };

  const steps: MaintenanceRecord['status'][] = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];
  const getStepIndex = (status: MaintenanceRecord['status']) => steps.indexOf(status);

  const renderWorkflowActions = (req: MaintenanceRecord) => {
    if (activeRole === 'Employee') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <ShieldAlert className="w-3.5 h-3.5" /> Only Admins or Managers can update tickets.
        </div>
      );
    }
    switch (req.status) {
      case 'Pending':
        return (
          <button onClick={() => updateMaintenanceStatus(req.id, 'Approved')}
            className="btn-primary gap-1.5">
            Approve Request <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'Approved':
        return (
          <div className="flex gap-2">
            <input id={`tech-input-${req.id}`} type="text" placeholder="Technician name..."
              className="input-field flex-1" style={{ maxWidth: '200px' }} />
            <button
              onClick={() => {
                const val = (document.getElementById(`tech-input-${req.id}`) as HTMLInputElement)?.value;
                if (!val) { alert('Please enter a technician name.'); return; }
                updateMaintenanceStatus(req.id, 'Technician Assigned', val);
              }}
              className="btn-primary whitespace-nowrap">
              Assign Technician
            </button>
          </div>
        );
      case 'Technician Assigned':
        return (
          <button onClick={() => updateMaintenanceStatus(req.id, 'In Progress')}
            className="btn-primary gap-1.5" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            Start Work <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'In Progress':
        return (
          <button onClick={() => updateMaintenanceStatus(req.id, 'Resolved')}
            className="btn-primary gap-1.5" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <CheckCircle className="w-4 h-4" /> Mark Resolved
          </button>
        );
      case 'Resolved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 font-bold">
            <CheckCircle className="w-4 h-4" /> Ticket Resolved
          </div>
        );
      default: return null;
    }
  };

  const statCounts = {
    open: maintenanceRequests.filter(r => r.status !== 'Resolved').length,
    critical: maintenanceRequests.filter(r => r.priority === 'Critical').length,
    resolved: maintenanceRequests.filter(r => r.status === 'Resolved').length,
  };

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up">
        {[
          { label: 'Open Tickets', count: statCounts.open, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Critical Issues', count: statCounts.critical, color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
          { label: 'Resolved', count: statCounts.resolved, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        ].map((s, i) => (
          <div key={s.label} className={`p-4 rounded-2xl border animate-slide-up stagger-${i + 1}`}
            style={{ background: s.bg, borderColor: s.border }}>
            <div className="text-2xl font-bold leading-none" style={{ fontFamily: 'Space Grotesk', color: s.color }}>{s.count}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="card-premium p-4 flex items-center justify-between animate-slide-up stagger-2">
        <div>
          <h4 className="section-title">Maintenance Tickets Queue</h4>
          <p className="text-xs text-gray-500 mt-0.5">Submit requests and step through workflow stages to repair items.</p>
        </div>
        <button onClick={() => setShowRaiseModal(true)} className="btn-primary gap-1.5">
          <Plus className="w-4 h-4" /> Raise Request
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tickets List */}
        <div className="card-premium p-4 animate-slide-up stagger-3">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-2 mb-3 border-b border-gray-100">
            Active Tickets ({maintenanceRequests.length})
          </h4>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {maintenanceRequests.length === 0 ? (
              <div className="py-10 text-center">
                <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400">No maintenance requests raised.</p>
              </div>
            ) : (
              maintenanceRequests.map((req, i) => {
                const isActive = activeRequestId === req.id;
                return (
                  <div key={req.id} onClick={() => setActiveRequestId(req.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all space-y-1.5 animate-slide-up stagger-${Math.min(i + 1, 6)}`}
                    style={{
                      ...getPriorityBorderStyle(req.priority, isActive),
                      background: isActive ? '#f0fdf4' : '#f8fafc',
                      border: isActive ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      borderLeftWidth: '3px',
                    }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono block">{req.assetTag}</span>
                        <p className="text-xs font-bold text-gray-900 leading-tight truncate w-36">{req.assetName}</p>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{req.issueDescription}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className={getPriorityClass(req.priority)}>{req.priority}</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{req.dateRaised}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ticket Detail & Workflow */}
        <div className="lg:col-span-2 card-premium p-6 animate-slide-up stagger-4 min-h-[420px] flex flex-col">
          {selectedRequest ? (
            <div className="space-y-5 flex flex-col flex-1">
              {/* Header */}
              <div className="pb-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">{selectedRequest.assetTag}</span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5" style={{ fontFamily: 'Space Grotesk' }}>
                    {selectedRequest.assetName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Reported on <span className="font-semibold">{selectedRequest.dateRaised}</span></p>
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Details card */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Issue Description</span>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium mt-1">{selectedRequest.issueDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Technician</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {selectedRequest.assignedTechnician || 'Unassigned'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Priority</span>
                    <span className={getPriorityClass(selectedRequest.priority)}>{selectedRequest.priority}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Stepper */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workflow Progress</span>
                <div className="flex items-center w-full mt-2">
                  {steps.map((step, idx) => {
                    const currentIdx = getStepIndex(selectedRequest.status);
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center relative z-10 shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${isCompleted ? 'bg-[#167C65] border-[#167C65] text-white' : isActive ? 'bg-white border-[#167C65] text-[#167C65] shadow-md' : 'bg-white border-gray-200 text-gray-400'}`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className="absolute top-9 text-[8px] font-bold text-center w-14 text-gray-400 uppercase leading-tight">
                            {step.replace('Technician Assigned', 'Assigned')}
                          </span>
                        </div>
                        {idx !== steps.length - 1 && (
                          <div className={`h-0.5 flex-1 transition-colors ${idx < currentIdx ? 'bg-[#167C65]' : 'bg-gray-200'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto pt-12 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket Actions</span>
                {renderWorkflowActions(selectedRequest)}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Wrench className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-300">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Raise Modal */}
      {showRaiseModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-panel w-full max-w-md">
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Space Grotesk' }}>Raise Maintenance Ticket</h3>
              <button onClick={() => setShowRaiseModal(false)} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">✕</button>
            </div>
            <form onSubmit={handleRaiseRequest} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="input-label">Select Affected Asset *</label>
                <select value={newRequest.assetTag} onChange={e => setNewRequest(p => ({ ...p, assetTag: e.target.value }))}
                  className="input-field" required>
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => <option key={a.tag} value={a.tag}>{a.tag} — {a.name} ({a.status})</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Issue Description *</label>
                <textarea placeholder="Describe the problem in detail..."
                  value={newRequest.issueDescription} onChange={e => setNewRequest(p => ({ ...p, issueDescription: e.target.value }))}
                  className="input-field h-24 resize-none" required />
              </div>
              <div>
                <label className="input-label">Priority Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => (
                    <button key={level} type="button"
                      onClick={() => setNewRequest(p => ({ ...p, priority: level }))}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${newRequest.priority === level ? `badge priority-${level.toLowerCase()} shadow-sm scale-105` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowRaiseModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><Wrench className="w-4 h-4" /> Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
