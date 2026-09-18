import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Wrench, 
  Package, 
  TrendingUp, 
  History,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'spare-parts', label: 'Spare Parts', icon: Package },
    { id: 'costs', label: 'Costs', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <aside className="w-64 bg-forest-900 text-cream-50 flex flex-col h-screen sticky top-0 shrink-0 border-r border-forest-800 shadow-xs">
      {/* Sidebar Branding Header */}
      <div className="p-4 border-b border-forest-800 flex items-center gap-3">
        <div className="bg-forest-700 p-2 rounded-md text-white border border-forest-600">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-xs tracking-wider text-white leading-tight">
            VEHICLE MAINTENANCE
          </h1>
          <p className="text-[10px] text-forest-300 font-medium">
            MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-forest-300 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-forest-700 text-white font-semibold border border-forest-600'
                  : 'text-forest-200 hover:bg-forest-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-forest-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-forest-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-red-300 hover:bg-red-950/40 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
