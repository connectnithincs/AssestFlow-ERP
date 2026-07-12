import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Asset, AssetStatus } from '../types';
import { Search, Eye, X, ClipboardCheck, Wrench, ShieldAlert } from 'lucide-react';

export const AssetRegistryView: React.FC = () => {
  const { 
    assets, 
    categories, 
    activeRole, 
    currentUser, 
    allocateAsset, 
    addToast,
    users
  } = useAppState();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');

  // Detail Modal State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Extract unique locations for the filter
  const locations = Array.from(new Set(assets.map(a => a.location)));

  // Filter logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.tag.toLowerCase().includes(search.toLowerCase()) ||
                          asset.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
    const matchesLocation = locationFilter === 'All' || asset.location === locationFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  });

  const getStatusBadge = (status: AssetStatus) => {
    const styles = {
      'Available': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      'Allocated': 'bg-blue-50 text-blue-600 border border-blue-100',
      'Reserved': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      'Under Maintenance': 'bg-amber-50 text-amber-600 border border-amber-100',
      'Lost': 'bg-rose-50 text-rose-600 border border-rose-100',
      'Retired': 'bg-gray-100 text-gray-600 border border-gray-200',
      'Disposed': 'bg-red-50 text-red-600 border border-red-150'
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Filtering and Search Bar Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <input
              type="text"
              placeholder="Search Tag, Name, Serial..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#167C65] transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65] transition-colors cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Reserved">Reserved</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65] transition-colors cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Location filter */}
          <div>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65] transition-colors cursor-pointer"
            >
              <option value="All">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Asset Tag</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                    No assets matched your search or filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.tag} className="hover:bg-gray-50/50">
                    <td className="p-4 text-xs font-bold text-[#167C65]">{asset.tag}</td>
                    <td className="p-4">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">{asset.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">S/N: {asset.serialNumber}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-700">{asset.category}</td>
                    <td className="p-4 text-xs text-gray-500">{asset.location}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        asset.condition === 'Excellent' || asset.condition === 'Good'
                          ? 'bg-emerald-50 text-emerald-700'
                          : asset.condition === 'Fair'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(asset.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {activeRole === 'Employee' && asset.status === 'Available' && (
                          <button
                            onClick={() => {
                              allocateAsset(asset.tag, currentUser?.id || '', 'Requested allocation via registry');
                            }}
                            className="bg-[#167C65] hover:bg-[#126351] text-white text-[10px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            Request Allocation
                          </button>
                        )}
                        {activeRole === 'Employee' && asset.status === 'Allocated' && asset.currentHolderId !== currentUser?.id && (
                          <button
                            onClick={() => {
                              const partner = prompt("Enter Colleague email to transfer to:");
                              if (!partner) return;
                              const target = users.find(u => u.email.toLowerCase() === partner.toLowerCase());
                              if (target) {
                                addToast('Transfer Requested', `Request to transfer ${asset.name} to ${target.name} was forwarded to HOD.`, 'success');
                              } else {
                                alert("Colleague email not found.");
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            Request Transfer
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-colors inline-flex cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSET DETAIL MODAL */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedAsset.tag}</span>
                <h3 className="font-bold text-gray-900 text-sm">{selectedAsset.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto grow">
              {/* Asset Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/40 p-4 rounded-xl border border-gray-150">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                  <span className="mt-1 block">{getStatusBadge(selectedAsset.status)}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Category</span>
                  <span className="text-xs font-bold text-gray-900 mt-1 block">{selectedAsset.category}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Condition</span>
                  <span className="text-xs font-semibold text-gray-800 mt-1 block">{selectedAsset.condition}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Acquisition Date</span>
                  <span className="text-xs font-bold text-gray-900 mt-1 block">{selectedAsset.acquisitionDate}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Serial Number</span>
                  <span className="text-xs font-mono text-gray-800 mt-1 block">{selectedAsset.serialNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Location</span>
                  <span className="text-xs font-bold text-gray-900 mt-1 block">{selectedAsset.location}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Current Holder</span>
                  <span className="text-xs font-bold text-[#167C65] mt-1 block">
                    {selectedAsset.currentHolderName ? `${selectedAsset.currentHolderName}` : 'In Storage / Available'}
                  </span>
                </div>
              </div>

              {/* Tabs for Histories */}
              <div className="space-y-4">
                {/* Allocation History */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-100">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    Allocation History
                  </h4>
                  {selectedAsset.allocationHistory.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic pl-1">No allocation history recorded.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {selectedAsset.allocationHistory.map(rec => (
                        <div key={rec.id} className="p-2.5 bg-white border border-gray-150 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mr-2 ${
                              rec.action === 'Allocated' ? 'bg-blue-50 text-blue-600' : rec.action === 'Transferred' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {rec.action}
                            </span>
                            <span className="text-gray-700">Holder: <span className="font-bold">{rec.userName}</span></span>
                            {rec.notes && <p className="text-[10px] text-gray-400 font-medium mt-1 leading-normal">Note: {rec.notes}</p>}
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold">{rec.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Maintenance History */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-100">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Maintenance Tickets
                  </h4>
                  {selectedAsset.maintenanceHistory.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic pl-1">No maintenance tickets created.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {selectedAsset.maintenanceHistory.map(ticket => (
                        <div key={ticket.id} className="p-2.5 bg-white border border-gray-150 rounded-xl flex justify-between items-start text-xs gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {ticket.status}
                              </span>
                              <span className="text-[10px] font-bold text-rose-500 uppercase">{ticket.priority} PRIORITY</span>
                            </div>
                            <p className="text-gray-700 font-medium leading-normal">{ticket.issueDescription}</p>
                            {ticket.assignedTechnician && (
                              <p className="text-[10px] text-gray-500 leading-none">Technician: <span className="font-bold">{ticket.assignedTechnician}</span></p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-gray-400 font-semibold block">{ticket.dateRaised}</span>
                            {ticket.dateResolved && (
                              <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">Resolved: {ticket.dateResolved}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-150 bg-gray-50/50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedAsset(null)}
                className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
