import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { ShieldAlert, CheckCircle, XCircle, ArrowLeftRight, Inbox } from 'lucide-react';

interface TransferRequest {
  id: string;
  assetTag: string;
  assetName: string;
  currentHolderId: string;
  currentHolderName: string;
  requestedById: string;
  requestedByName: string;
  expectedReturnDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const AllocationTransferView: React.FC = () => {
  const { assets, users, allocateAsset, transferAsset, returnAsset, activeRole, currentUser } = useAppState();

  const [requests, setRequests] = useState<TransferRequest[]>([
    { id: 'req-1', assetTag: 'AST-002', assetName: 'Steelcase Gesture Ergonomic Chair', currentHolderId: 'usr-4', currentHolderName: 'Vikram Seth', requestedById: 'usr-3', requestedByName: 'Rohan Das', expectedReturnDate: '2026-09-01', status: 'Pending' },
    { id: 'req-2', assetTag: 'AST-004', assetName: 'Dell UltraSharp 34" Curved Monitor', currentHolderId: 'usr-1', currentHolderName: 'Priya Sharma', requestedById: 'usr-5', requestedByName: 'Sarah Connor', expectedReturnDate: '2026-08-15', status: 'Pending' },
  ]);

  const [selectedAssetTag, setSelectedAssetTag] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  const selectedAsset = assets.find(a => a.tag === selectedAssetTag);
  const isAllocated = selectedAsset?.status === 'Allocated';
  const currentHolderName = selectedAsset?.currentHolderName;

  const handleAllocateOrRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetTag || !selectedUserId) { alert('Please fill out all required fields.'); return; }
    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return;

    if (isAllocated) {
      const newReq: TransferRequest = {
        id: `req-${Date.now()}`, assetTag: selectedAssetTag, assetName: selectedAsset?.name || '',
        currentHolderId: selectedAsset?.currentHolderId || '', currentHolderName: selectedAsset?.currentHolderName || 'Unknown',
        requestedById: selectedUserId, requestedByName: targetUser.name,
        expectedReturnDate: expectedReturnDate || 'N/A', status: 'Pending'
      };
      setRequests(prev => [newReq, ...prev]);
      alert(`Asset is already allocated. A transfer request has been created to move this asset to ${targetUser.name}.`);
    } else {
      const success = allocateAsset(selectedAssetTag, selectedUserId, notes);
      if (!success) alert('Allocation failed. Ensure asset is Available.');
    }
    setSelectedAssetTag(''); setSelectedUserId(''); setExpectedReturnDate(''); setNotes('');
  };

  const handleApproveRequest = (req: TransferRequest) => {
    const success = transferAsset(req.assetTag, req.requestedById, `Transfer approved from ${req.currentHolderName} by Manager`);
    if (success) setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Approved' } : r));
    else alert('Transfer failed. Please check asset availability.');
  };

  const handleRejectRequest = (reqId: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r));
  };

  const requestStatusBadge = (status: TransferRequest['status']) => {
    const map = { Pending: 'badge badge-warning-pill', Approved: 'badge badge-success-pill', Rejected: 'badge badge-danger-pill' };
    return <span className={map[status]}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Transfer flow diagram */}
      <div className="card-premium p-5 animate-slide-up">
        <div className="section-header">
          <h4 className="section-title flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-[#167C65]" /> Transfer Workflow</h4>
        </div>
        <div className="flex items-center gap-0 flex-wrap mt-3">
          {['Requested', 'Under Review', 'Approved', 'Re-allocated'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${i < 2 ? 'border-[#167C65] bg-[#167C65] text-white' : 'border-gray-200 bg-white text-gray-400'}`}>
                  {i < 2 ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-semibold ${i < 2 ? 'text-[#167C65]' : 'text-gray-400'}`}>{step}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 min-w-[20px] max-w-[60px] h-0.5 mx-2 rounded ${i < 1 ? 'bg-[#167C65]' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Allocate / Transfer Form */}
        <div className="card-premium p-6 animate-slide-up stagger-1">
          <h3 className="section-title mb-1">New Allocation or Transfer</h3>
          <p className="text-xs text-gray-500 mb-5">Allocate an available asset or request transfer for an in-use asset.</p>

          <form onSubmit={handleAllocateOrRequest} className="space-y-4">
            <div>
              <label className="input-label">Select Asset *</label>
              <select value={selectedAssetTag} onChange={e => setSelectedAssetTag(e.target.value)} className="input-field" required>
                <option value="">-- Select Asset --</option>
                {assets.map(a => <option key={a.tag} value={a.tag}>[{a.tag}] {a.name} ({a.status})</option>)}
              </select>
            </div>

            {/* Conflict warning */}
            {isAllocated && (
              <div className="p-3 rounded-xl flex items-start gap-3 animate-slide-up"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Asset Already Allocated</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                    Currently held by <span className="font-bold">{currentHolderName}</span>. Submitting will create a <span className="font-bold">Transfer Request</span> for approval.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="input-label">Allocate / Transfer To *</label>
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="input-field" required>
                <option value="">-- Choose Employee --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Expected Return Date</label>
              <input type="date" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="input-label">Notes / Reason</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Include key details or business justification..."
                className="input-field h-20 resize-none" />
            </div>
            <div className="pt-1">
              {isAllocated ? (
                <button type="submit" className="w-full btn-primary justify-center"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
                  Request Transfer
                </button>
              ) : (
                <button type="submit" className="btn-primary w-full justify-center">Allocate Asset</button>
              )}
            </div>
          </form>
        </div>

        {/* Transfer Approvals */}
        <div className="card-premium p-6 animate-slide-up stagger-2 flex flex-col">
          <h3 className="section-title mb-1">Pending Transfer Approvals</h3>
          <p className="text-xs text-gray-500 mb-5">Asset managers and admins can approve or decline transfers.</p>

          <div className="space-y-3 flex-1 max-h-[360px] overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No active transfer requests.
              </div>
            ) : (
              requests.map((req, i) => (
                <div key={req.id}
                  className={`p-4 rounded-xl space-y-3 border animate-slide-up stagger-${i + 1} ${req.status === 'Pending' ? 'bg-amber-50/40 border-amber-100' : req.status === 'Approved' ? 'bg-green-50/40 border-green-100' : 'bg-red-50/30 border-red-100 opacity-70'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">{req.assetTag}</span>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">{req.assetName}</p>
                    </div>
                    {requestStatusBadge(req.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">From</span>
                      <span className="font-bold text-gray-800">{req.currentHolderName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">To</span>
                      <span className="font-bold text-[#167C65]">{req.requestedByName}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400">Return by: <span className="font-semibold text-gray-600">{req.expectedReturnDate}</span></div>
                  {req.status === 'Pending' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleApproveRequest(req)} disabled={activeRole === 'Employee'}
                        className="flex-1 btn-primary justify-center text-[10px] py-1.5 disabled:opacity-40 disabled:cursor-not-allowed gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleRejectRequest(req.id)} disabled={activeRole === 'Employee'}
                        className="flex-1 btn-secondary justify-center text-[10px] py-1.5 disabled:opacity-40 gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {activeRole === 'Employee' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-600 font-semibold">Employee role — no approve/reject permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Allocated Assets Table */}
      <div className="card-premium overflow-hidden animate-slide-up stagger-3">
        <div className="p-5 border-b border-gray-100">
          <h3 className="section-title">Currently Allocated Assets</h3>
          <p className="text-xs text-gray-500 mt-0.5">Active corporate assets assigned to personnel.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Asset Tag</th><th>Asset Name</th><th>Current Holder</th><th>Acquired</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {assets.filter(a => a.status === 'Allocated').length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-xs text-gray-400">No assets currently allocated.</td></tr>
              ) : (
                assets.filter(a => a.status === 'Allocated').map(asset => (
                  <tr key={asset.tag}>
                    <td>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: '#ecfdf8', color: '#167C65', fontFamily: 'monospace' }}>
                        {asset.tag}
                      </span>
                    </td>
                    <td className="text-xs font-bold text-gray-900">{asset.name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #167C65, #0e5a4a)' }}>
                          {asset.currentHolderName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-xs text-gray-700 font-medium">{asset.currentHolderName}</span>
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">{asset.acquisitionDate}</td>
                    <td className="text-right">
                      <button onClick={() => returnAsset(asset.tag)} className="btn-secondary text-xs py-1.5">
                        Return Asset
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
