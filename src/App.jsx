import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import MaintenancePage from './pages/MaintenancePage';
import SparePartsPage from './pages/SparePartsPage';
import CostsPage from './pages/CostsPage';
import HistoryPage from './pages/HistoryPage';

import { 
  initialVehicles, 
  initialMaintenanceLogs, 
  initialSpareParts 
} from './dummyData';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // React State for Local In-Memory Storage
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [maintenance, setMaintenance] = useState(initialMaintenanceLogs);
  const [spareParts, setSpareParts] = useState(initialSpareParts);

  // Add Vehicle handler
  const handleAddVehicle = (newVehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
  };

  // Add Maintenance handler (also updates vehicle mileage & next service date if provided)
  const handleAddMaintenance = (newLog) => {
    setMaintenance(prev => [newLog, ...prev]);

    if (newLog.vehicleReg) {
      setVehicles(prev => prev.map(v => {
        if (v.regNo === newLog.vehicleReg) {
          return {
            ...v,
            mileage: newLog.mileage ? Math.max(Number(v.mileage) || 0, Number(newLog.mileage)) : v.mileage,
            nextServiceDate: newLog.nextServiceDate || v.nextServiceDate,
            status: newLog.status === 'In Progress' ? 'Under Repair' : 'Active'
          };
        }
        return v;
      }));
    }
  };

  // Add Spare Part handler
  const handleAddPart = (newPart) => {
    setSpareParts(prev => [newPart, ...prev]);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const serviceDueCount = vehicles.filter(v => v.status === 'Service Due').length;

  return (
    <div className="min-h-screen bg-cream-100 flex font-sans">
      {/* Persistent Left Desktop Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={() => setIsLoggedIn(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <Header 
          activeTab={activeTab} 
          vehiclesCount={vehicles.length}
          serviceDueCount={serviceDueCount}
        />

        <main className="px-8 py-6 w-full flex-1 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardPage
              vehicles={vehicles}
              maintenance={maintenance}
              spareParts={spareParts}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesPage
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              maintenanceLogs={maintenance}
              spareParts={spareParts}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenancePage
              maintenance={maintenance}
              vehicles={vehicles}
              onAddMaintenance={handleAddMaintenance}
            />
          )}

          {activeTab === 'spare-parts' && (
            <SparePartsPage
              spareParts={spareParts}
              vehicles={vehicles}
              onAddPart={handleAddPart}
            />
          )}

          {activeTab === 'costs' && (
            <CostsPage
              vehicles={vehicles}
              maintenance={maintenance}
              spareParts={spareParts}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              maintenance={maintenance}
              vehicles={vehicles}
            />
          )}
        </main>

        <footer className="bg-white border-t border-gray-200 py-3 px-8 text-center text-xs text-gray-500 flex justify-between items-center shrink-0">
          <span>Vehicle Maintenance Management System &bull; Enterprise Fleet Portal</span>
          <span className="font-mono text-[11px] text-gray-600 font-semibold">Desktop Prototype</span>
        </footer>
      </div>
    </div>
  );
}
