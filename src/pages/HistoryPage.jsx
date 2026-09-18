import React, { useState } from 'react';
import { History, Filter, Car, Calendar, Wrench } from 'lucide-react';

export default function HistoryPage({ maintenance, vehicles }) {
  const [selectedVehicleReg, setSelectedVehicleReg] = useState('All');

  // Combine and sort chronologically (latest first)
  const sortedLogs = [...maintenance].sort(
    (a, b) => new Date(b.serviceDate) - new Date(a.serviceDate)
  );

  const filteredLogs = selectedVehicleReg === 'All'
    ? sortedLogs
    : sortedLogs.filter(m => m.vehicleReg === selectedVehicleReg);

  return (
    <div className="space-y-6">
      {/* Vehicle Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-forest-800" />
          <span className="text-xs font-semibold text-gray-700">Filter History by Vehicle:</span>
          <select
            value={selectedVehicleReg}
            onChange={(e) => setSelectedVehicleReg(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
          >
            <option value="All">All Fleet Vehicles ({vehicles.length})</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.regNo}>
                {v.regNo} - {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-gray-500">
          Showing {filteredLogs.length} audit entries
        </span>
      </div>

      {/* Chronological Timeline Feed */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-forest-800" />
            <span>Chronological Audit History</span>
          </h3>
        </div>

        <div className="p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs italic">
              No history entries found for the selected vehicle filter.
            </div>
          ) : (
            <div className="relative border-l-2 border-forest-200 ml-4 space-y-6 pl-6 py-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${log.type === 'Service' ? 'bg-forest-700' : 'bg-orange-600'} shadow-xs`}></div>

                  <div className="bg-cream-50/60 p-4 rounded-xl border border-gray-200 hover:border-forest-300 transition-colors shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono bg-forest-900 text-white px-2 py-0.5 rounded">
                          {log.vehicleReg}
                        </span>
                        <span className="text-xs font-semibold text-gray-800">
                          {log.vehicleName || log.vehicleReg}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${log.type === 'Service' ? 'bg-forest-100 text-forest-800' : 'bg-orange-100 text-orange-800'}`}>
                          {log.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {log.serviceDate}
                        </span>
                        <span className="font-bold text-forest-900 bg-white px-2.5 py-1 rounded border border-gray-200 shadow-2xs">
                          ₹{Number(log.cost).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-800 leading-relaxed font-medium">
                      {log.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <span>Odometer Reading: <strong className="text-gray-700 font-mono">{log.mileage ? `${log.mileage} km` : 'N/A'}</strong></span>
                      <span>Next Scheduled Due: <strong className="text-gray-700 font-mono">{log.nextServiceDate || 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
