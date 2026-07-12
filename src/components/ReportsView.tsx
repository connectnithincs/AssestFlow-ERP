import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { Download, BarChart3, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { assets, addToast } = useAppState();

  const handleExport = (format: 'CSV' | 'PDF') => {
    addToast(
      'Export Complete',
      `Asset utilization metrics successfully compiled and downloaded as ${format}.`,
      'success'
    );
  };

  // Derived metrics data
  const totalCount = assets.length;
  const allocatedCount = assets.filter(a => a.status === 'Allocated').length;
  const utilizationRate = Math.round((allocatedCount / totalCount) * 100);

  // Near retirement assets list
  const retirementAssets = [
    { tag: 'AST-005', name: 'Dell XPS 15 9530', age: '2.8 years', lifeLeft: '15%', color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { tag: 'AST-010', name: 'Server Rack HP ProLiant', age: '4.9 years', lifeLeft: '2%', color: 'text-rose-500 bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Export Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Analytics & Reports Engine</h4>
          <p className="text-xs text-gray-500">Monitor utilization, deprecation curves, and operational performance.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Global Asset Utilization</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-gray-900 leading-none">{utilizationRate}%</h3>
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +4.2%
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#167C65] h-full" style={{ width: `${utilizationRate}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold">Active allocations vs storage capacity</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Average Maintenance Cycles</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-gray-900 leading-none">2.4 days</h3>
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
              -1.1 days
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full w-[70%]" />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold">Average time from ticket creation to resolution</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Bookings Completed</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-gray-900 leading-none">142</h3>
            <span className="text-emerald-600 text-xs font-bold">
              +12% MoM
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#167C65] h-full w-[85%]" />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold">Bookable corporate resource reservations</p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Category Utilization (SVG chart) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#167C65]" />
              Utilization by Asset Category
            </h4>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative pt-4">
            <svg viewBox="0 0 400 200" className="w-full h-48">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Y Axis Labels */}
              <text x="15" y="25" className="text-[9px] fill-gray-400 font-semibold">100%</text>
              <text x="15" y="65" className="text-[9px] fill-gray-400 font-semibold">75%</text>
              <text x="15" y="105" className="text-[9px] fill-gray-400 font-semibold">50%</text>
              <text x="15" y="145" className="text-[9px] fill-gray-400 font-semibold">25%</text>
              <text x="20" y="175" className="text-[9px] fill-gray-400 font-semibold">0%</text>

              {/* Bar 1: Electronics (85%) */}
              <rect x="60" y="42" width="30" height="128" rx="4" fill="#167C65" />
              <text x="50" y="188" className="text-[9px] fill-gray-600 font-bold">Electronics</text>
              
              {/* Bar 2: Furniture (55%) */}
              <rect x="140" y="87" width="30" height="83" rx="4" fill="#10B981" />
              <text x="135" y="188" className="text-[9px] fill-gray-600 font-bold">Furniture</text>
              
              {/* Bar 3: Vehicles (30%) */}
              <rect x="220" y="125" width="30" height="45" rx="4" fill="#6EE7B7" />
              <text x="215" y="188" className="text-[9px] fill-gray-600 font-bold">Vehicles</text>

              {/* Bar 4: Office Eq (65%) */}
              <rect x="300" y="72" width="30" height="98" rx="4" fill="#047857" />
              <text x="295" y="188" className="text-[9px] fill-gray-600 font-bold">IT Office</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Booking Heatmap (Mock Grid) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#167C65]" />
              Resource Booking Density Heatmap
            </h4>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-8 gap-1.5 text-center text-[9px] text-gray-400 font-bold">
              <div>Hour</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {['09:00', '11:00', '13:00', '15:00', '17:00'].map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-1.5 items-center">
                <span className="text-[9px] font-bold text-gray-400 text-center">{hour}</span>
                {/* Mon - Sun cells with different opacity for density */}
                <div className="h-6 rounded bg-[#167C65] opacity-90" title="High Booking" />
                <div className="h-6 rounded bg-[#167C65] opacity-60" />
                <div className="h-6 rounded bg-[#167C65] opacity-80" />
                <div className="h-6 rounded bg-[#167C65] opacity-40" />
                <div className="h-6 rounded bg-[#167C65] opacity-70" />
                <div className="h-6 rounded bg-gray-100" title="No booking" />
                <div className="h-6 rounded bg-gray-100" />
              </div>
            ))}
            
            <div className="flex justify-end gap-3 text-[9px] text-gray-400 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-gray-100" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#167C65] opacity-90" /> High
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Deprecations and Warnings Table list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Near Retirement list */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-2 mb-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Assets Approaching Retirement / Deprecation
              </h4>
            </div>

            <div className="space-y-3">
              {retirementAssets.map(asset => (
                <div key={asset.tag} className={`p-3 rounded-xl border flex items-center justify-between ${asset.color}`}>
                  <div>
                    <span className="text-[9px] font-bold block">{asset.tag}</span>
                    <h5 className="text-xs font-bold leading-tight">{asset.name}</h5>
                    <p className="text-[10px] mt-0.5">Asset Age: <span className="font-semibold">{asset.age}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold block">Life Left</span>
                    <span className="text-xs font-extrabold block mt-0.5">{asset.lifeLeft}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 font-semibold mt-4 pt-3 border-t border-gray-100">
            Note: Lifetime criteria is based on 3-year refresh cycle for electronics and 5-year for server infrastructure.
          </p>
        </div>

        {/* Right: Department Summaries Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="border-b border-gray-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Allocation Count by Department
            </h4>
          </div>

          <div className="space-y-3">
            {[
              { name: 'IT Operations', count: 12, value: '$14,200', pct: 60 },
              { name: 'Facilities', count: 4, value: '$2,800', pct: 20 },
              { name: 'Human Resources', count: 2, value: '$850', pct: 10 },
              { name: 'Finance', count: 2, value: '$1,200', pct: 10 },
            ].map(dept => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-700">
                  <span className="font-bold">{dept.name}</span>
                  <span className="text-gray-500">{dept.count} assets ({dept.value})</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#167C65] h-full" style={{ width: `${dept.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
