import React from 'react';
import { 
  Car, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  ArrowRight
} from 'lucide-react';

export default function DashboardPage({ vehicles, maintenance, spareParts, onNavigate }) {
  // Calculated stats
  const totalVehicles = vehicles.length;
  const serviceDueCount = vehicles.filter(v => v.status === 'Service Due').length;
  const openRepairsCount = vehicles.filter(v => v.status === 'Under Repair').length;

  const totalServiceCost = maintenance.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalPartsCost = spareParts.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalMaintenanceCost = totalServiceCost + totalPartsCost;

  // Upcoming service watchlist
  const upcomingServices = vehicles
    .filter(v => v.nextServiceDate)
    .sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate))
    .slice(0, 5);

  // Recent maintenance activities
  const recentActivities = [...maintenance]
    .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Compact Warning Banner if services due */}
      {serviceDueCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs font-semibold text-amber-900">
              Notice: {serviceDueCount} vehicle(s) require scheduled periodic servicing.
            </span>
          </div>
          <button
            onClick={() => onNavigate('vehicles')}
            className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
          >
            <span>View Vehicles</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div 
          onClick={() => onNavigate('vehicles')}
          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-forest-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Vehicles</span>
            <Car className="w-4 h-4 text-forest-800" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {totalVehicles}
          </div>
        </div>

        {/* Service Due */}
        <div 
          onClick={() => onNavigate('vehicles')}
          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-amber-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Due</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-800">
            {serviceDueCount}
          </div>
        </div>

        {/* Open Repairs */}
        <div 
          onClick={() => onNavigate('maintenance')}
          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-red-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Repairs</span>
            <Wrench className="w-4 h-4 text-red-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-800">
            {openRepairsCount}
          </div>
        </div>

        {/* Total Maintenance Cost */}
        <div 
          onClick={() => onNavigate('costs')}
          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-forest-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Maintenance Cost</span>
            <TrendingUp className="w-4 h-4 text-forest-800" />
          </div>
          <div className="mt-2 text-2xl font-bold text-forest-900">
            ₹{totalMaintenanceCost.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Services & Recent Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Services Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-800" />
              <span>Upcoming Services</span>
            </h3>
            <button 
              onClick={() => onNavigate('vehicles')}
              className="text-xs text-forest-800 font-semibold hover:underline"
            >
              View All &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-semibold uppercase">
                  <th className="py-2.5 px-4">Vehicle</th>
                  <th className="py-2.5 px-4">Registration Number</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Next Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingServices.map((v) => (
                  <tr key={v.id} className="hover:bg-cream-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-800">{v.make} {v.model}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{v.regNo}</td>
                    <td className="py-3 px-4">
                      {v.status === 'Active' && <span className="badge-active">Active</span>}
                      {v.status === 'Service Due' && <span className="badge-warning">Service Due</span>}
                      {v.status === 'Under Repair' && <span className="badge-danger">Under Repair</span>}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">{v.nextServiceDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Maintenance Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-forest-800" />
              <span>Recent Maintenance</span>
            </h3>
            <button 
              onClick={() => onNavigate('maintenance')}
              className="text-xs text-forest-800 font-semibold hover:underline"
            >
              Logs &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-semibold uppercase">
                  <th className="py-2.5 px-4">Registration</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Cost</th>
                  <th className="py-2.5 px-4 max-w-xs">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivities.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{log.vehicleReg}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${log.type === 'Service' ? 'bg-forest-100 text-forest-800' : 'bg-orange-100 text-orange-800'}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{log.serviceDate}</td>
                    <td className="py-3 px-4 font-bold text-forest-900">₹{Number(log.cost).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
