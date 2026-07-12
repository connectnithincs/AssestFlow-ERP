import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { MaintenanceRecord } from '../types';
import { Plus, Wrench, ShieldAlert, User, CheckCircle, ArrowRight } from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const { 
    maintenanceRequests, 
    assets, 
    raiseMaintenanceRequest, 
    updateMaintenanceStatus, 
    activeRole,
    currentUser
  } = useAppState();

  // Filter requests so that employees can only view their own tickets
  const filteredRequests = maintenanceRequests.filter(req => {
    if (activeRole !== 'Employee') return true;
    return assets.some(a => a.tag === req.assetTag && a.currentHolderId === currentUser?.id);
  });

  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ assetTag: '', issueDescription: '', priority: 'Medium' as any });

  // Selected Request to show stepper detail
  const [activeRequestId, setActiveRequestId] = useState<string | null>(
    filteredRequests.length > 0 ? filteredRequests[0].id : null
  );

  // Form submit handler
  const handleRaiseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.assetTag || !newRequest.issueDescription) {
      alert('Please fill out all required fields.');
      return;
    }
    raiseMaintenanceRequest(newRequest.assetTag, newRequest.issueDescription, newRequest.priority);
    setNewRequest({ assetTag: '', issueDescription: '', priority: 'Medium' });
    setShowRaiseModal(false);

    // Auto select the newly created request
    if (filteredRequests.length > 0) {
      setActiveRequestId(filteredRequests[0].id);
    }
  };

  const selectedRequest = filteredRequests.find(r => r.id === activeRequestId);

  const getPriorityColor = (priority: MaintenanceRecord['priority']) => {
    const styles = {
      Low: 'bg-gray-100 text-gray-700',
      Medium: 'bg-blue-50 text-blue-700 border border-blue-100',
      High: 'bg-amber-50 text-amber-700 border border-amber-200',
      Critical: 'bg-rose-50 text-rose-700 border border-rose-200'
    };
    return styles[priority] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: MaintenanceRecord['status']) => {
    const styles = {
      'Pending': 'bg-gray-100 text-gray-600',
      'Approved': 'bg-blue-50 text-blue-600',
      'Technician Assigned': 'bg-purple-50 text-purple-600',
      'In Progress': 'bg-amber-50 text-amber-600',
      'Resolved': 'bg-emerald-50 text-emerald-600 border border-emerald-100'
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Stepper Stages list
  const steps: MaintenanceRecord['status'][] = [
    'Pending',
    'Approved',
    'Technician Assigned',
    'In Progress',
    'Resolved'
  ];

  const getStepIndex = (status: MaintenanceRecord['status']) => steps.indexOf(status);

  // Advance workflow actions
  const renderWorkflowActions = (req: MaintenanceRecord) => {
    if (activeRole === 'Employee') {
      return (
        <p className="text-[10px] text-gray-400 font-semibold italic flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Only Admins or Managers can update tickets.
        </p>
      );
    }

    switch (req.status) {
      case 'Pending':
        return (
          <button
            onClick={() => updateMaintenanceStatus(req.id, 'Approved')}
            className="flex items-center gap-1 bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            Approve Request
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'Approved':
        return (
          <div className="flex gap-2">
            <input 
              id={`tech-input-${req.id}`}
              type="text" 
              placeholder="Enter technician name..." 
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#167C65]"
            />
            <button
              onClick={() => {
                const val = (document.getElementById(`tech-input-${req.id}`) as HTMLInputElement)?.value;
                if (!val) {
                  alert('Please enter a technician name.');
                  return;
                }
                updateMaintenanceStatus(req.id, 'Technician Assigned', val);
              }}
              className="bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Assign Technician
            </button>
          </div>
        );
      case 'Technician Assigned':
        return (
          <button
            onClick={() => updateMaintenanceStatus(req.id, 'In Progress')}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            Start Work / In Progress
          </button>
        );
      case 'In Progress':
        return (
          <button
            onClick={() => updateMaintenanceStatus(req.id, 'Resolved')}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            Mark Resolved / Complete
          </button>
        );
      case 'Resolved':
        return (
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Maintenance Ticket is Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview stats and Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-3xs">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Maintenance Tickets Queue</h4>
          <p className="text-xs text-gray-500">Submit requests and step through workflow stages to repair items.</p>
        </div>
        <button 
          onClick={() => setShowRaiseModal(true)}
          className="flex items-center gap-1.5 bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Raise Request
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tickets list */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-2">Active Tickets ({filteredRequests.length})</h4>
          
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredRequests.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">No maintenance requests raised.</p>
            ) : (
              filteredRequests.map(req => {
                const isActive = activeRequestId === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setActiveRequestId(req.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                      isActive 
                        ? 'border-[#167C65] bg-emerald-50/10 shadow-sm' 
                        : 'border-gray-200 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{req.assetTag}</span>
                        <h4 className="text-xs font-bold text-gray-950 leading-tight truncate w-36">{req.assetName}</h4>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{req.issueDescription}</p>
                    <div className="flex justify-between items-center pt-1 text-[9px] text-gray-400 font-semibold">
                      <span className={`px-1.5 py-0.5 rounded-md ${getPriorityColor(req.priority)}`}>
                        {req.priority}
                      </span>
                      <span>RAISED: {req.dateRaised}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket details and Workflow Stepper */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between min-h-[420px]">
          {selectedRequest ? (
            <div className="space-y-6">
              
              {/* Heading */}
              <div className="border-b border-gray-150 pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedRequest.assetTag}</span>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{selectedRequest.assetName}</h3>
                  <p className="text-xs text-gray-500 mt-1">Reported: <span className="font-semibold">{selectedRequest.dateRaised}</span></p>
                </div>
                <div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* Description Card */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-3">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Description of Issue</span>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium mt-1">{selectedRequest.issueDescription}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-3">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Technician</span>
                    <span className="text-xs font-bold text-gray-800 mt-1 block flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {selectedRequest.assignedTechnician || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Priority</span>
                    <span className="mt-1 block">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* HORIZONTAL WORKFLOW STEPPER */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Workflow Progress</span>
                
                <div className="flex items-center w-full">
                  {steps.map((step, idx) => {
                    const currentIdx = getStepIndex(selectedRequest.status);
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    
                    return (
                      <React.Fragment key={step}>
                        {/* Step Circle */}
                        <div className="flex flex-col items-center relative z-10 shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                            isCompleted 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : isActive 
                                ? 'bg-white border-[#167C65] text-[#167C65] ring-4 ring-emerald-50' 
                                : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className="absolute top-10 text-[9px] font-bold text-center w-16 text-gray-500 uppercase leading-none">
                            {step.replace('Technician Assigned', 'Assigned')}
                          </span>
                        </div>

                        {/* Step Connector Line */}
                        {idx !== steps.length - 1 && (
                          <div className={`h-[2px] grow transition-colors ${
                            idx < currentIdx ? 'bg-emerald-600' : 'bg-gray-200'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Stepper action trigger */}
              <div className="border-t border-gray-100 pt-12 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">TICKET WORKFLOW STEPS</span>
                <div>
                  {renderWorkflowActions(selectedRequest)}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center grow text-center text-gray-400 space-y-2">
              <Wrench className="w-12 h-12 text-gray-300" />
              <p className="text-xs">No active maintenance ticket selected.</p>
            </div>
          )}
        </div>

      </div>

      {/* RAISE REQUEST FORM MODAL */}
      {showRaiseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Raise Maintenance Ticket</h3>
              <button onClick={() => setShowRaiseModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleRaiseRequest} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Affected Asset *</label>
                <select 
                  value={newRequest.assetTag}
                  onChange={e => setNewRequest(prev => ({ ...prev, assetTag: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.tag} value={a.tag}>{a.tag} - {a.name} ({a.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Issue Description *</label>
                <textarea 
                  placeholder="Specify problem in details..." 
                  value={newRequest.issueDescription}
                  onChange={e => setNewRequest(prev => ({ ...prev, issueDescription: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65] h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Priority Level *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewRequest(prev => ({ ...prev, priority: level as any }))}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        newRequest.priority === level 
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
