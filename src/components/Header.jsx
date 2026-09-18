import React from 'react';
import { User, Bell, Wrench, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Header({ activeTab, vehiclesCount, serviceDueCount }) {
  const titles = {
    dashboard: { title: 'Fleet Overview & Analytics', subtitle: 'Real-time vehicle status and upcoming service schedules' },
    vehicles: { title: 'Vehicle Fleet Directory', subtitle: 'Manage active cars, scooters, mileage, and service intervals' },
    maintenance: { title: 'Maintenance & Service Logs', subtitle: 'Track periodic servicing, repair logs, and costs' },
    'spare-parts': { title: 'Spare Parts Inventory', subtitle: 'Log component replacements, stock levels, and part expenses' },
    costs: { title: 'Financial & Maintenance Costs', subtitle: 'Cost breakdowns, service vs repair expense analysis' },
    history: { title: 'Chronological Audit Log', subtitle: 'Complete maintenance event history by vehicle' },
  };

  const currentInfo = titles[activeTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {currentInfo.title}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {serviceDueCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{serviceDueCount} Service Due</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-50 border border-forest-200 rounded-md text-forest-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
          <span>{vehiclesCount} Registered Vehicles</span>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-xs shadow-xs border border-forest-800">
            PA
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-900 leading-tight">Project Administrator</p>
            <p className="text-[10px] text-gray-500">Fleet Operations</p>
          </div>
        </div>
      </div>
    </header>
  );
}
