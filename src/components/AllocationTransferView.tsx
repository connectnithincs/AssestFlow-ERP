import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Asset, User } from '../types';
import { ShieldAlert, CheckCircle, XCircle, ArrowLeftRight, UserCheck, Inbox } from 'lucide-react';

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
  const { 
    assets, 
    users, 
    allocateAsset, 
    transferAsset, 
    returnAsset, 
    activeRole,
    currentUser
  } = useAppState();

  // Local state for mock transfer/allocation requests
  const [requests, setRequests] = useState<TransferRequest[]>([
    {
      id: 'req-1',
      assetTag: 'AST-002',
      assetName: 'Steelcase Gesture Ergonomic Chair',
      currentHolderId: 'usr-4',
      currentHolderName: 'Vikram Seth',
      requestedById: 'usr-3',
      requestedByName: 'Rohan Das',
      expectedReturnDate: '2026-09-01',
      status: 'Pending'
    },
    {
      id: 'req-2',
      assetTag: 'AST-004',
      assetName: 'Dell UltraSharp 34" Curved Monitor',
      currentHolderId: 'usr-1',
      currentHolderName: 'Priya Sharma',
      requestedById: 'usr-5',
      requestedByName: 'Sarah Connor',
      expectedReturnDate: '2026-08-15',
      status: 'Pending'
    }
  ]);

  // Form States
  const [selectedAssetTag, setSelectedAssetTag] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  // Find asset and current holder details for conflict rule
  const selectedAsset = assets.find(a => a.tag === selectedAssetTag);
  const isAllocated = selectedAsset?.status === 'Allocated';
  const currentHolderName = selectedAsset?.currentHolderName;

  const handleAllocateOrRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetTag || !selectedUserId) {
      alert('Please fill out all required fields.');
      return;
    }

    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return;

    if (isAllocated) {
      // Conflict Rule triggers: Raise a transfer request
      const newReq: TransferRequest = {
        id: `req-${Date.now()}`,
        assetTag: selectedAssetTag,
        assetName: selectedAsset?.name || '',
        currentHolderId: selectedAsset?.currentHolderId || '',
        currentHolderName: selectedAsset?.currentHolderName || 'Unknown',
        requestedById: selectedUserId,
        requestedByName: targetUser.name,
        expectedReturnDate: expectedReturnDate || 'N/A',
        status: 'Pending'
      };
      setRequests(prev => [newReq, ...prev]);
      alert(`Asset is already allocated. A transfer request has been created to move this asset to ${targetUser.name}.`);
    } else {
      // Normal Allocate
      const success = allocateAsset(selectedAssetTag, selectedUserId, notes);
      if (!success) {
        alert('Allocation failed. Ensure asset is Available.');
      }
    }

    // Reset Form
    setSelectedAssetTag('');
    setSelectedUserId('');
    setExpectedReturnDate('');
    setNotes('');
  };

  const handleApproveRequest = (req: TransferRequest) => {
    // Perform transfer
    const success = transferAsset(req.assetTag, req.requestedById, `Transfer approved from ${req.currentHolderName} by Manager`);
    if (success) {
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Approved' } : r));
    } else {
      alert('Transfer failed. Please check asset availability.');
    }
  };

  const handleRejectRequest = (reqId: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r));
  };

  return (
    <div className="space-y-6">
      
      {/* 2-Column Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Allocate & Transfer Form */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900">New Allocation or Transfer Request</h3>
            <p className="text-xs text-gray-500">Allocate an available asset or request a transfer for an in-use asset.</p>
          </div>

          <form onSubmit={handleAllocateOrRequest} className="space-y-4">
            {/* Select Asset */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Asset *</label>
              <select
                value={selectedAssetTag}
                onChange={e => setSelectedAssetTag(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65] transition-colors cursor-pointer bg-white"
                required
              >
                <option value="">-- Select Asset --</option>
                {assets.map(a => (
                  <option key={a.tag} value={a.tag}>
                    [{a.tag}] {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Conflict Rule Warning Display */}
            {isAllocated && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-amber-800">Asset Already Allocated</h5>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    This resource is currently allocated to <span className="font-bold">{currentHolderName}</span>. 
                    Submit form to create a <span className="font-bold">Transfer Request</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Select Target User */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Allocate / Transfer To *</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65] transition-colors cursor-pointer bg-white"
                required
              >
                <option value="">-- Choose Employee --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Return Date */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Expected Return Date</label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={e => setExpectedReturnDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
              />
            </div>

            {/* Allocation Notes */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Notes / Reason</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Include key details or business justification..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65] h-16 resize-none"
              />
            </div>

            {/* Allocate / Transfer button with dynamic text */}
            <div className="pt-2">
              {isAllocated ? (
                <button
                  type="submit"
                  className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Request Transfer
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Allocate Asset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Column 2: Pending Requests Approval Queue */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900">Pending Transfer Approvals</h3>
              <p className="text-xs text-gray-500">Asset managers and admins can approve or decline transfers.</p>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {requests.length === 0 ? (
                <div className="text-center p-8 text-xs text-gray-400">
                  No active transfer requests found.
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{req.assetTag}</span>
                        <h4 className="text-xs font-bold text-gray-900 leading-tight mb-1">{req.assetName}</h4>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'Pending' 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                          : req.status === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block leading-none mb-0.5">Current Holder</span>
                        <span className="font-bold text-gray-800">{req.currentHolderName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block leading-none mb-0.5">Transfer Requested To</span>
                        <span className="font-bold text-[#167C65]">{req.requestedByName}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-400 font-semibold uppercase leading-none">
                      EXPECTED RETURN: {req.expectedReturnDate}
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleApproveRequest(req)}
                          disabled={activeRole === 'Employee'}
                          className="flex-1 flex items-center justify-center gap-1 bg-[#167C65] hover:bg-[#126351] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-[10px] font-bold py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={activeRole === 'Employee'}
                          className="flex-1 flex items-center justify-center gap-1 bg-white hover:bg-gray-50 border border-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed text-gray-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {activeRole === 'Employee' && (
            <p className="text-[10px] text-amber-600 font-semibold border-t border-gray-100 pt-3 mt-4 flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-amber-500" />
              Employee account detected: You do not have permissions to Approve or Reject requests.
            </p>
          )}
        </div>

      </div>

      {/* Allocated Assets Registry Status Overview */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900">Allocated Assets</h3>
          <p className="text-xs text-gray-500">Track and manage active corporate assets assigned to personnel.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Asset Tag</th>
                <th className="p-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="p-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Holder</th>
                <th className="p-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Acquired Date</th>
                <th className="p-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {assets.filter(a => a.status === 'Allocated').length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-gray-400">
                    No assets are currently allocated.
                  </td>
                </tr>
              ) : (
                assets.filter(a => a.status === 'Allocated').map(asset => (
                  <tr key={asset.tag} className="hover:bg-gray-50/50">
                    <td className="p-3.5 text-xs font-bold text-[#167C65]">{asset.tag}</td>
                    <td className="p-3.5 text-xs font-bold text-gray-900">{asset.name}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center border border-blue-100">
                          {asset.currentHolderName?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs text-gray-800">{asset.currentHolderName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-gray-500">{asset.acquisitionDate}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => returnAsset(asset.tag)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
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
