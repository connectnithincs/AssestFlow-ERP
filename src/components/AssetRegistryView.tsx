import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Asset } from '../types';
import { Search, Eye, X, ClipboardCheck, Wrench, Package, Filter } from 'lucide-react';
import { AssetStatus } from '../types';

export const AssetRegistryView: React.FC = () => {
  const { assets, categories } = useAppState();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const locations = Array.from(new Set(assets.map(a => a.location)));

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.tag.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
    const matchesLocation = locationFilter === 'All' || asset.location === locationFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  });

  const getStatusBadge = (status: AssetStatus) => {
    const cls: Record<AssetStatus, string> = {
      'Available':        'badge badge-available',
      'Allocated':        'badge badge-allocated',
      'Reserved':         'badge badge-reserved',
      'Under Maintenance':'badge badge-maintenance',
      'Lost':             'badge badge-lost',
      'Retired':          'badge badge-retired',
      'Disposed':         'badge badge-disposed',
    };
    return <span className={cls[status]}>{status}</span>;
  };

  const getConditionBadge = (condition: string) => {
    const cls: Record<string, string> = {
      Excellent: 'badge badge-success-pill',
      Good:      'badge badge-brand-pill',
      Fair:      'badge badge-warning-pill',
      Poor:      'badge badge-danger-pill',
      Broken:    'badge badge-danger-pill',
    };
    return <span className={cls[condition] || 'badge badge-neutral-pill'}>{condition}</span>;
  };

  // Status summary counts
  const statusCounts = {
    Available:         assets.filter(a => a.status === 'Available').length,
    Allocated:         assets.filter(a => a.status === 'Allocated').length,
    'Under Maintenance': assets.filter(a => a.status === 'Under Maintenance').length,
    Lost:              assets.filter(a => a.status === 'Lost').length,
  };

  return (
    <div className="space-y-5">
      {/* Status summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
        {[
          { label: 'Available', count: statusCounts.Available, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Allocated', count: statusCounts.Allocated, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Maintenance', count: statusCounts['Under Maintenance'], color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Lost', count: statusCounts.Lost, color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
        ].map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.label ? 'All' : s.label as any)}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer border animate-slide-up stagger-${i + 1} ${statusFilter === s.label ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'}`}
            style={{ background: s.bg, borderColor: statusFilter === s.label ? s.color : s.border }}
          >
            <div className="text-2xl font-bold leading-none mb-1"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: s.color }}>
              {s.count}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="card-premium p-4 animate-slide-up stagger-2">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tag, name, serial..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
              <option value="All">All Statuses</option>
              <option>Available</option><option>Allocated</option><option>Reserved</option>
              <option>Under Maintenance</option><option>Lost</option><option>Retired</option><option>Disposed</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field w-auto">
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
            <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="input-field w-auto">
              <option value="All">All Locations</option>
              {locations.map(l => <option key={l}>{l}</option>)}
            </select>
            {(statusFilter !== 'All' || categoryFilter !== 'All' || locationFilter !== 'All' || search) && (
              <button onClick={() => { setSearch(''); setStatusFilter('All'); setCategoryFilter('All'); setLocationFilter('All'); }}
                className="btn-secondary text-xs">
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 text-[11px] text-gray-400 font-medium">
          Showing <span className="font-bold text-gray-700">{filteredAssets.length}</span> of {assets.length} assets
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden animate-slide-up stagger-3">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name & Serial</th>
                <th>Category</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-xs text-gray-400 font-medium">No assets matched your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset, i) => (
                  <tr key={asset.tag} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                    <td>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: '#ecfdf8', color: '#167C65', fontFamily: 'monospace' }}>
                        {asset.tag}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-gray-900 text-xs">{asset.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{asset.serialNumber}</div>
                    </td>
                    <td className="text-xs text-gray-600">{asset.category}</td>
                    <td className="text-xs text-gray-500">{asset.location}</td>
                    <td>{getConditionBadge(asset.condition)}</td>
                    <td>{getStatusBadge(asset.status)}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="btn-secondary text-xs gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-panel w-full max-w-2xl">
            {/* Header */}
            <div className="px-6 py-4 flex items-start justify-between"
              style={{ borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf8)' }}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ background: '#ecfdf8', color: '#167C65', fontFamily: 'monospace' }}>
                  {selectedAsset.tag}
                </span>
                <h3 className="font-bold text-gray-900 text-base mt-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {selectedAsset.name}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedAsset.status)}
                <button onClick={() => setSelectedAsset(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                {[
                  { label: 'Category', value: selectedAsset.category },
                  { label: 'Condition', value: selectedAsset.condition },
                  { label: 'Acquired', value: selectedAsset.acquisitionDate },
                  { label: 'Location', value: selectedAsset.location },
                  { label: 'Serial No.', value: selectedAsset.serialNumber },
                  { label: 'Current Holder', value: selectedAsset.currentHolderName || 'Available / In Storage' },
                ].map(item => (
                  <div key={item.label}>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{item.label}</span>
                    <span className="text-xs font-bold text-gray-800 mt-0.5 block"
                      style={item.label === 'Serial No.' ? { fontFamily: 'monospace' } : {}}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Allocation History */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3 pb-2"
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <ClipboardCheck className="w-4 h-4 text-green-500" /> Allocation History
                </h4>
                {selectedAsset.allocationHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No allocation history recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedAsset.allocationHistory.map(rec => (
                      <div key={rec.id} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${rec.action === 'Allocated' ? 'badge-allocated' : rec.action === 'Transferred' ? 'badge-reserved' : 'badge-neutral-pill'}`}>
                            {rec.action}
                          </span>
                          <span className="text-gray-700">→ <span className="font-bold">{rec.userName}</span></span>
                        </div>
                        <span className="text-[10px] text-gray-400">{rec.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maintenance History */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3 pb-2"
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Wrench className="w-4 h-4 text-amber-500" /> Maintenance Tickets
                </h4>
                {selectedAsset.maintenanceHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No maintenance tickets created.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedAsset.maintenanceHistory.map(ticket => (
                      <div key={ticket.id} className="p-2.5 rounded-xl flex justify-between items-start gap-3 text-xs"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`badge priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                            <span className={`badge ${ticket.status === 'Resolved' ? 'badge-success-pill' : 'badge-warning-pill'}`}>{ticket.status}</span>
                          </div>
                          <p className="text-gray-700 font-medium">{ticket.issueDescription}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-gray-400 block">{ticket.dateRaised}</span>
                          {ticket.dateResolved && <span className="text-[9px] text-green-600 font-semibold block">✓ {ticket.dateResolved}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end"
              style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <button onClick={() => setSelectedAsset(null)} className="btn-primary">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
