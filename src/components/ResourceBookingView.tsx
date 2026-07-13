import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Booking } from '../types';
import { Calendar as CalendarIcon, List, Search, Plus, Trash2 } from 'lucide-react';

export const ResourceBookingView: React.FC = () => {
  const { bookings, assets, createBooking, cancelBooking, currentUser } = useAppState();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Meeting Room' | 'Vehicle' | 'Equipment'>('All');
  const [showFormModal, setShowFormModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    resourceId: '',
    resourceType: 'Meeting Room' as 'Meeting Room' | 'Vehicle' | 'Equipment',
    title: '',
    startTime: '',
    endTime: ''
  });

  const getStatusBadge = (status: Booking['status']) => {
    const cls: Record<string, string> = {
      Upcoming: 'badge badge-info-pill',
      Ongoing: 'badge badge-success-pill',
      Completed: 'badge badge-neutral-pill',
      Cancelled: 'badge badge-danger-pill',
    };
    return <span className={cls[status] || 'badge badge-neutral-pill'}>{status}</span>;
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.resourceName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || b.resourceType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.resourceId || !bookingForm.title || !bookingForm.startTime || !bookingForm.endTime) {
      alert('Please fill out all fields.');
      return;
    }
    let rName = bookingForm.resourceId;
    if (bookingForm.resourceId === 'RM-Alpha') rName = 'Meeting Room Alpha (HQ 4th Fl)';
    else { const match = assets.find(a => a.tag === bookingForm.resourceId); if (match) rName = match.name; }

    const result = createBooking({
      resourceId: bookingForm.resourceId, resourceName: rName, resourceType: bookingForm.resourceType,
      userId: currentUser?.id || 'usr-1', title: bookingForm.title,
      startTime: bookingForm.startTime, endTime: bookingForm.endTime
    });
    if (result.success) {
      setBookingForm({ resourceId: '', resourceType: 'Meeting Room', title: '', startTime: '', endTime: '' });
      setShowFormModal(false);
    } else { alert(result.error); }
  };

  const getResourceOptions = (type: string) => {
    if (type === 'Meeting Room') return [{ id: 'RM-Alpha', name: 'Meeting Room Alpha (HQ 4th Fl)' }];
    if (type === 'Vehicle') return assets.filter(a => a.category === 'Vehicles').map(a => ({ id: a.tag, name: a.name }));
    return assets.filter(a => a.category === 'Office Equipment' || a.category === 'Electronics').map(a => ({ id: a.tag, name: a.name }));
  };

  const getNext7Days = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return { dateStr: d.toISOString().split('T')[0], label: `${weekdays[d.getDay()]} ${d.getDate()}`, dayVal: d.getDay() };
    });
  };
  const next7Days = getNext7Days();

  // Booking stats
  const stats = {
    upcoming: bookings.filter(b => b.status === 'Upcoming').length,
    ongoing: bookings.filter(b => b.status === 'Ongoing').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
  };

  const typeColor: Record<string, string> = {
    'Meeting Room': 'badge badge-info-pill',
    'Vehicle': 'badge badge-danger-pill',
    'Equipment': 'badge badge-brand-pill',
  };

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
        {[
          { label: 'Upcoming', count: stats.upcoming, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Ongoing', count: stats.ongoing, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Completed', count: stats.completed, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
          { label: 'Cancelled', count: stats.cancelled, color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
        ].map((s, i) => (
          <div key={s.label} className={`p-4 rounded-2xl border animate-slide-up stagger-${i + 1}`}
            style={{ background: s.bg, borderColor: s.border }}>
            <div className="text-2xl font-bold leading-none" style={{ fontFamily: 'Space Grotesk', color: s.color }}>{s.count}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + CTA bar */}
      <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up stagger-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search bookings..." value={search}
              onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-44" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="input-field w-auto">
            <option value="All">All Types</option>
            <option value="Meeting Room">Meeting Rooms</option>
            <option value="Vehicle">Vehicles</option>
            <option value="Equipment">Equipment</option>
          </select>
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode('list')} title="List"
              className={`px-3 py-1.5 transition-colors ${viewMode === 'list' ? 'bg-[#167C65] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('calendar')} title="Calendar"
              className={`px-3 py-1.5 transition-colors ${viewMode === 'calendar' ? 'bg-[#167C65] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button onClick={() => setShowFormModal(true)} className="btn-primary gap-1.5">
          <Plus className="w-4 h-4" /> Book Resource
        </button>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card-premium overflow-hidden animate-slide-up stagger-3">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Purpose</th><th>Resource & Type</th><th>Reserved By</th>
                  <th>Time Window</th><th>Status</th><th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-xs text-gray-400">No bookings match criteria.</td></tr>
                ) : (
                  filteredBookings.map((b, i) => (
                    <tr key={b.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                      <td className="font-bold text-gray-900 text-xs">{b.title}</td>
                      <td>
                        <div className="font-bold text-gray-800 text-xs">{b.resourceName}</div>
                        <span className={`${typeColor[b.resourceType] || 'badge badge-neutral-pill'} mt-1`}>{b.resourceType}</span>
                      </td>
                      <td className="text-xs text-gray-700">{b.userName}</td>
                      <td>
                        <div className="font-semibold text-xs text-gray-800">
                          {new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>{getStatusBadge(b.status)}</td>
                      <td className="text-right">
                        {b.status === 'Upcoming' && (
                          <button onClick={() => cancelBooking(b.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="card-premium p-5 animate-slide-up stagger-3">
          <div className="pb-3 mb-4 border-b border-gray-100">
            <h4 className="section-title">7-Day Operations Scheduler</h4>
            <p className="text-xs text-gray-400 mt-0.5">Booking slots for all primary resources over the next 7 days.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {next7Days.map(day => {
              const dayBookings = bookings.filter(b => b.status !== 'Cancelled' && b.startTime.split('T')[0] === day.dateStr);
              const isToday = day.dateStr === new Date().toISOString().split('T')[0];
              return (
                <div key={day.dateStr}
                  className={`rounded-xl p-2.5 flex flex-col h-64 border ${isToday ? 'border-[#167C65] bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
                  <div className={`text-center pb-2 mb-2 border-b ${isToday ? 'border-green-200' : 'border-gray-100'}`}>
                    <span className={`text-xs font-bold block ${isToday ? 'text-[#167C65]' : 'text-gray-800'}`}>{day.label}</span>
                    {isToday && <span className="text-[9px] text-[#167C65] font-bold">Today</span>}
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-y-auto">
                    {dayBookings.length === 0 ? (
                      <span className="text-[10px] text-gray-300 italic text-center block mt-8">Free</span>
                    ) : (
                      dayBookings.map(b => (
                        <div key={b.id} className="p-1.5 bg-white rounded-lg border border-gray-200 text-[9px] space-y-0.5">
                          <span className={typeColor[b.resourceType] || 'badge badge-neutral-pill'} style={{ fontSize: '8px', padding: '1px 5px' }}>
                            {b.resourceType}
                          </span>
                          <p className="font-bold text-gray-900 truncate leading-tight">{b.title}</p>
                          <p className="text-[#167C65] font-semibold">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}–
                            {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showFormModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-panel w-full max-w-md">
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Space Grotesk' }}>New Resource Booking</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">✕</button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="input-label">Resource Type *</label>
                <select value={bookingForm.resourceType}
                  onChange={e => setBookingForm(p => ({ ...p, resourceType: e.target.value as any, resourceId: '' }))}
                  className="input-field">
                  <option value="Meeting Room">Meeting Room</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
              <div>
                <label className="input-label">Select Resource *</label>
                <select value={bookingForm.resourceId}
                  onChange={e => setBookingForm(p => ({ ...p, resourceId: e.target.value }))}
                  className="input-field" required>
                  <option value="">-- Choose Resource --</option>
                  {getResourceOptions(bookingForm.resourceType).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Booking Title / Purpose *</label>
                <input type="text" placeholder="e.g. Sprint Planning"
                  value={bookingForm.title} onChange={e => setBookingForm(p => ({ ...p, title: e.target.value }))}
                  className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Start *</label>
                  <input type="datetime-local" value={bookingForm.startTime}
                    onChange={e => setBookingForm(p => ({ ...p, startTime: e.target.value }))}
                    className="input-field" required />
                </div>
                <div>
                  <label className="input-label">End *</label>
                  <input type="datetime-local" value={bookingForm.endTime}
                    onChange={e => setBookingForm(p => ({ ...p, endTime: e.target.value }))}
                    className="input-field" required />
                </div>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Confirm Reservation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
