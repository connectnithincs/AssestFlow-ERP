import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { Download, BarChart3, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { assets, addToast } = useAppState();

  const handleExport = (format: 'CSV' | 'PDF') => {
    addToast('Export Complete', `Asset utilization metrics downloaded as ${format}.`, 'success');
  };

  const totalCount = assets.length;
  const allocatedCount = assets.filter(a => a.status === 'Allocated').length;
  const utilizationRate = Math.round((allocatedCount / totalCount) * 100);

  const retirementAssets = [
    { tag: 'AST-005', name: 'Dell XPS 15 9530', age: '2.8 years', lifeLeft: 15, urgent: false },
    { tag: 'AST-010', name: 'Server Rack HP ProLiant', age: '4.9 years', lifeLeft: 2, urgent: true },
  ];

  const deptData = [
    { name: 'IT Operations', count: 12, value: '$14,200', pct: 60 },
    { name: 'Facilities', count: 4, value: '$2,800', pct: 20 },
    { name: 'Human Resources', count: 2, value: '$850', pct: 10 },
    { name: 'Finance', count: 2, value: '$1,200', pct: 10 },
  ];

  const barData = [
    { label: 'Electronics', val: 85, color: '#167C65' },
    { label: 'Furniture', val: 55, color: '#10B981' },
    { label: 'Vehicles', val: 30, color: '#6EE7B7' },
    { label: 'IT Office', val: 65, color: '#047857' },
  ];

  return (
    <div className="space-y-5">
      {/* Export Header */}
      <div className="card-premium p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h4 className="section-title flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#167C65]" /> Analytics &amp; Reports Engine
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">Monitor utilization, deprecation curves, and operational performance.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('CSV')} className="btn-secondary gap-1.5">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => handleExport('PDF')} className="btn-primary gap-1.5">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-up stagger-1">
        {[
          {
            label: 'Global Asset Utilization', value: `${utilizationRate}%`, trend: '+4.2%',
            sub: 'Active allocations vs storage capacity', pct: utilizationRate,
            barColor: '#167C65',
          },
          {
            label: 'Avg Maintenance Cycle', value: '2.4 days', trend: '-1.1 days',
            sub: 'Average ticket creation to resolution', pct: 70,
            barColor: '#10B981',
          },
          {
            label: 'Total Bookings Completed', value: '142', trend: '+12% MoM',
            sub: 'Bookable corporate resource reservations', pct: 85,
            barColor: '#167C65',
          },
        ].map((kpi, i) => (
          <div key={kpi.label} className={`card-premium p-5 space-y-3 animate-slide-up stagger-${i + 1}`}>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{kpi.label}</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold text-gray-900 leading-none"
                style={{ fontFamily: 'Space Grotesk' }}>{kpi.value}</h3>
              <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {kpi.trend}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${kpi.pct}%`, background: kpi.barColor }} />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up stagger-2">
        {/* Bar Chart: Category Utilization */}
        <div className="card-premium p-5 space-y-4">
          <div className="pb-2 border-b border-gray-100">
            <h4 className="section-title flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#167C65]" /> Utilization by Asset Category
            </h4>
          </div>
          {/* CSS Bar chart */}
          <div className="flex items-end gap-4 h-40 pt-4">
            {barData.map(bar => (
              <div key={bar.label} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-gray-700">{bar.val}%</span>
                <div className="w-full rounded-t-lg transition-all"
                  style={{ height: `${(bar.val / 100) * 120}px`, background: `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}cc 100%)` }} />
                <span className="text-[9px] font-bold text-gray-500 text-center">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Heatmap */}
        <div className="card-premium p-5 space-y-4">
          <div className="pb-2 border-b border-gray-100">
            <h4 className="section-title flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#167C65]" /> Booking Density Heatmap
            </h4>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-1 text-center text-[9px] text-gray-400 font-bold">
              {['Hour', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
            </div>
            {[
              { hour: '09:00', vals: [0.9, 0.6, 0.8, 0.4, 0.7, 0.1, 0.0] },
              { hour: '11:00', vals: [0.7, 0.9, 0.5, 0.8, 0.6, 0.0, 0.0] },
              { hour: '13:00', vals: [0.4, 0.5, 0.9, 0.7, 0.5, 0.1, 0.0] },
              { hour: '15:00', vals: [0.8, 0.3, 0.6, 0.9, 0.4, 0.0, 0.0] },
              { hour: '17:00', vals: [0.3, 0.4, 0.3, 0.5, 0.8, 0.0, 0.0] },
            ].map(row => (
              <div key={row.hour} className="grid grid-cols-8 gap-1 items-center">
                <span className="text-[9px] font-bold text-gray-400 text-center">{row.hour}</span>
                {row.vals.map((v, i) => (
                  <div key={i} className="h-6 rounded transition-all"
                    style={{ background: v > 0 ? `rgba(22, 124, 101, ${v})` : '#f1f5f9' }} />
                ))}
              </div>
            ))}
            <div className="flex justify-end gap-3 text-[9px] text-gray-400 font-semibold pt-1">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100" /> Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#167C65]" /> High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up stagger-3">
        {/* Near Retirement */}
        <div className="card-premium p-5">
          <div className="pb-2 mb-4 border-b border-gray-100">
            <h4 className="section-title flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Assets Approaching Retirement
            </h4>
          </div>
          <div className="space-y-3">
            {retirementAssets.map(asset => (
              <div key={asset.tag} className="p-4 rounded-xl flex items-center justify-between"
                style={{ background: asset.urgent ? '#fff1f2' : '#fffbeb', border: `1px solid ${asset.urgent ? '#fecdd3' : '#fde68a'}` }}>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: asset.urgent ? '#e11d48' : '#b45309' }}>{asset.tag}</span>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">{asset.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: asset.urgent ? '#e11d48' : '#b45309' }}>
                    Age: {asset.age}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-gray-400 uppercase">Life Left</div>
                  <div className="text-xl font-extrabold mt-0.5"
                    style={{ fontFamily: 'Space Grotesk', color: asset.urgent ? '#e11d48' : '#b45309' }}>
                    {asset.lifeLeft}%
                  </div>
                  <div className="w-16 h-1.5 rounded-full mt-1 overflow-hidden bg-white/70">
                    <div className="h-full rounded-full" style={{ width: `${asset.lifeLeft}%`, background: asset.urgent ? '#e11d48' : '#d97706' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-4 pt-3 border-t border-gray-100 leading-relaxed">
            Lifetime criteria based on 3-year refresh for electronics and 5-year for server infrastructure.
          </p>
        </div>

        {/* Dept Allocations */}
        <div className="card-premium p-5">
          <div className="pb-2 mb-4 border-b border-gray-100">
            <h4 className="section-title">Allocation by Department</h4>
          </div>
          <div className="space-y-4">
            {deptData.map((dept, i) => (
              <div key={dept.name} className={`space-y-1.5 animate-slide-up stagger-${i + 1}`}>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-800">{dept.name}</span>
                  <span className="text-gray-500">{dept.count} assets · {dept.value}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                  <div className="h-full rounded-full" style={{ width: `${dept.pct}%`, background: 'linear-gradient(90deg, #167C65, #10b981)' }} />
                </div>
                <div className="text-[9px] text-gray-400 font-semibold text-right">{dept.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
