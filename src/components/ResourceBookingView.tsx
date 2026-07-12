import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Booking } from '../types';
import { Calendar as CalendarIcon, List, Search, Plus, Trash2, ShieldAlert } from 'lucide-react';

export const ResourceBookingView: React.FC = () => {
  const { bookings, assets, createBooking, cancelBooking, currentUser } = useAppState();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Meeting Room' | 'Vehicle' | 'Equipment'>('All');

  // Booking Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    resourceId: '',
    resourceType: 'Meeting Room' as 'Meeting Room' | 'Vehicle' | 'Equipment',
    title: '',
    startTime: '',
    endTime: ''
  });

  const getStatusBadge = (status: Booking['status']) => {
    const styles = {
      Upcoming: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      Ongoing: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      Completed: 'bg-gray-100 text-gray-500 border border-gray-200',
      Cancelled: 'bg-red-50 text-red-600 border border-red-150',
    };
    return (
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Filter Bookings
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

    // Find resource name
    let rName = bookingForm.resourceId;
    if (bookingForm.resourceId === 'RM-Alpha') {
      rName = 'Meeting Room Alpha (HQ 4th Fl)';
    } else {
      const match = assets.find(a => a.tag === bookingForm.resourceId);
      if (match) rName = match.name;
    }

    const result = createBooking({
      resourceId: bookingForm.resourceId,
      resourceName: rName,
      resourceType: bookingForm.resourceType,
      userId: currentUser?.id || 'usr-1',
      title: bookingForm.title,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime
    });

    if (result.success) {
      setBookingForm({ resourceId: '', resourceType: 'Meeting Room', title: '', startTime: '', endTime: '' });
      setShowFormModal(false);
    } else {
      alert(result.error);
    }
  };

  // Pre-configured resource options by type
  const getResourceOptions = (type: string) => {
    if (type === 'Meeting Room') {
      return [{ id: 'RM-Alpha', name: 'Meeting Room Alpha (HQ 4th Fl)' }];
    }
    if (type === 'Vehicle') {
      return assets.filter(a => a.category === 'Vehicles').map(a => ({ id: a.tag, name: a.name }));
    }
    // Equipment
    return assets.filter(a => a.category === 'Office Equipment' || a.category === 'Electronics').map(a => ({ id: a.tag, name: a.name }));
  };

  // Helper for generating custom calendar view grid (Mocking next 7 days scheduler)
  const getNext7Days = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        label: `${weekdays[d.getDay()]} ${d.getDate()}`,
        dayVal: d.getDay()
      });
    }
    return days;
  };

  const next7Days = getNext7Days();

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Filter and View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-48">
            <input
              type="text"
              placeholder="Search resource..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#167C65]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#167C65] cursor-pointer"
          >
            <option value="All">All Resource Types</option>
            <option value="Meeting Room">Meeting Rooms</option>
            <option value="Vehicle">Vehicles</option>
            <option value="Equipment">Equipment</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-[#167C65] text-white' : 'bg-white text-gray-600'} hover:bg-[#167C65]/10 hover:text-gray-900 transition-colors cursor-pointer`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 ${viewMode === 'calendar' ? 'bg-[#167C65] text-white' : 'bg-white text-gray-600'} hover:bg-[#167C65]/10 hover:text-gray-900 transition-colors cursor-pointer`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Quick Action Button */}
        <button
          onClick={() => setShowFormModal(true)}
          className="flex items-center gap-1.5 bg-[#167C65] hover:bg-[#126351] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Book Resource
        </button>
      </div>

      {/* VIEW MODES */}

      {/* 1. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Resource / Type</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reserved By</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reservation Window</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                      No active bookings match criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="p-4 text-xs font-bold text-gray-900">{b.title}</td>
                      <td className="p-4">
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">{b.resourceName}</span>
                          <span className="text-[9px] font-semibold text-gray-400 block uppercase mt-0.5">{b.resourceType}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-700">{b.userName}</td>
                      <td className="p-4 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold block">{new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(b.status)}</td>
                      <td className="p-4 text-right">
                        {b.status === 'Upcoming' && (
                          <button
                            onClick={() => cancelBooking(b.id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-[#DC2626] rounded-lg transition-colors border border-transparent hover:border-red-100 inline-flex cursor-pointer"
                            title="Cancel Booking"
                          >
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

      {/* 2. CALENDAR VIEW (Weekly scheduler matrix) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">7-Day Operations Scheduler Grid</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">Showing booking schedules for all primary resources next 7 days.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {next7Days.map(day => {
              // Find bookings that fall on this day
              const dayBookings = bookings.filter(b => {
                if (b.status === 'Cancelled') return false;
                const bDateStr = b.startTime.split('T')[0];
                return bDateStr === day.dateStr;
              });

              return (
                <div key={day.dateStr} className="border border-gray-200 rounded-xl p-3 flex flex-col h-[280px] bg-gray-50/20">
                  <div className="border-b border-gray-150 pb-1.5 mb-2 text-center">
                    <span className="text-xs font-bold text-gray-900 block">{day.label}</span>
                    <span className="text-[9px] text-gray-400 font-semibold block">{day.dateStr.split('-').slice(1).join('/')}</span>
                  </div>

                  <div className="grow space-y-2 overflow-y-auto pr-0.5">
                    {dayBookings.length === 0 ? (
                      <span className="text-[10px] text-gray-400 italic text-center block mt-12">No slots</span>
                    ) : (
                      dayBookings.map(b => (
                        <div key={b.id} className="p-2 bg-white rounded-lg border border-gray-150 shadow-3xs text-[10px] space-y-1">
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded-full uppercase tracking-wider block w-fit ${
                            b.resourceType === 'Meeting Room' ? 'bg-indigo-50 text-indigo-600' : b.resourceType === 'Vehicle' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {b.resourceType}
                          </span>
                          <h5 className="font-bold text-gray-900 leading-tight truncate" title={b.title}>{b.title}</h5>
                          <p className="text-gray-500 leading-none truncate">{b.resourceName}</p>
                          <p className="text-[8px] text-[#167C65] font-semibold">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
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

      {/* BOOKING MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">New Resource Booking</h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Resource Type *</label>
                <select 
                  value={bookingForm.resourceType}
                  onChange={e => setBookingForm(prev => ({ ...prev, resourceType: e.target.value as any, resourceId: '' }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                >
                  <option value="Meeting Room">Meeting Room</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Specific Resource *</label>
                <select 
                  value={bookingForm.resourceId}
                  onChange={e => setBookingForm(prev => ({ ...prev, resourceId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                >
                  <option value="">-- Select Specific Resource --</option>
                  {getResourceOptions(bookingForm.resourceType).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Booking Title / Purpose *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sales sync with US team" 
                  value={bookingForm.title}
                  onChange={e => setBookingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Start Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    value={bookingForm.startTime}
                    onChange={e => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#167C65]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">End Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    value={bookingForm.endTime}
                    onChange={e => setBookingForm(prev => ({ ...prev, endTime: e.target.value }))}
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
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
