import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import MaintenancePage from './pages/MaintenancePage';
import SparePartsPage from './pages/SparePartsPage';
import CostsPage from './pages/CostsPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('fleet_token') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Authenticated fetch wrapper
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const activeToken = token || localStorage.getItem('fleet_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(activeToken ? { 'x-auth-token': activeToken } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('fleet_token');
      setToken(null);
      setIsLoggedIn(false);
      setUser(null);
    }
    return res;
  }, [token]);

  // Check stored token validity on initial mount
  useEffect(() => {
    const savedToken = localStorage.getItem('fleet_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { 'x-auth-token': savedToken }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then(data => {
          setUser(data.user);
          setToken(savedToken);
          setIsLoggedIn(true);
        })
        .catch(() => {
          localStorage.removeItem('fleet_token');
          setToken(null);
          setIsLoggedIn(false);
          setUser(null);
        });
    }
  }, []);

  const fetchFleetData = useCallback(async () => {
    if (!token && !localStorage.getItem('fleet_token')) return;
    setLoading(true);
    try {
      const [vRes, mRes, pRes] = await Promise.all([
        fetchWithAuth('/api/vehicles'),
        fetchWithAuth('/api/maintenance'),
        fetchWithAuth('/api/spare-parts')
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(vData);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMaintenance(mData);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setSpareParts(pData);
      }
    } catch (err) {
      console.error('Failed to fetch fleet data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, token]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchFleetData();
    }
  }, [isLoggedIn, fetchFleetData]);

  const handleLogin = (userData, authToken) => {
    if (authToken) {
      localStorage.setItem('fleet_token', authToken);
      setToken(authToken);
    }
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('fleet_token');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  // ---------- Vehicle CRUD Handlers ----------
  const handleAddVehicle = async (newVehicle) => {
    try {
      const res = await fetchWithAuth('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(newVehicle)
      });
      if (res.ok) {
        const created = await res.json();
        setVehicles(prev => [created, ...prev]);
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add vehicle');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
      alert('Network error while adding vehicle');
      return { success: false, error: 'Network error' };
    }
  };

  const handleUpdateVehicle = async (id, updatedVehicle) => {
    try {
      const res = await fetchWithAuth(`/api/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedVehicle)
      });
      if (res.ok) {
        const updated = await res.json();
        setVehicles(prev => prev.map(v => v.id === id ? updated : v));
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update vehicle');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      alert('Network error while updating vehicle');
      return { success: false, error: 'Network error' };
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/vehicles/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        const deletedReg = data.deleted?.regNo;
        setVehicles(prev => prev.filter(v => v.id !== id));
        // Cascade delete in PostgreSQL removes related logs and spare parts
        if (deletedReg) {
          setMaintenance(prev => prev.filter(m => m.vehicleReg !== deletedReg));
          setSpareParts(prev => prev.filter(p => p.vehicleReg !== deletedReg));
        }
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete vehicle');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert('Network error while deleting vehicle');
      return { success: false, error: 'Network error' };
    }
  };

  // ---------- Maintenance CRUD Handlers ----------
  const handleAddMaintenance = async (newLog) => {
    try {
      const res = await fetchWithAuth('/api/maintenance', {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
      if (res.ok) {
        const created = await res.json();
        setMaintenance(prev => [created, ...prev]);
        // Refresh vehicles to sync status and updated mileage
        const vRes = await fetchWithAuth('/api/vehicles');
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehicles(vData);
        }
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to log maintenance');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error adding maintenance:', err);
      alert('Network error while logging maintenance');
      return { success: false, error: 'Network error' };
    }
  };

  const handleUpdateMaintenance = async (id, updatedLog) => {
    try {
      const res = await fetchWithAuth(`/api/maintenance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedLog)
      });
      if (res.ok) {
        const updated = await res.json();
        setMaintenance(prev => prev.map(m => m.id === id ? updated : m));
        // Refresh vehicles to sync status
        const vRes = await fetchWithAuth('/api/vehicles');
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehicles(vData);
        }
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update maintenance log');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error updating maintenance:', err);
      alert('Network error while updating maintenance');
      return { success: false, error: 'Network error' };
    }
  };

  const handleDeleteMaintenance = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/maintenance/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMaintenance(prev => prev.filter(m => m.id !== id));
        // Refresh vehicles to sync status
        const vRes = await fetchWithAuth('/api/vehicles');
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehicles(vData);
        }
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete maintenance log');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error deleting maintenance:', err);
      alert('Network error while deleting maintenance');
      return { success: false, error: 'Network error' };
    }
  };

  // ---------- Spare Parts CRUD Handlers ----------
  const handleAddPart = async (newPart) => {
    try {
      const res = await fetchWithAuth('/api/spare-parts', {
        method: 'POST',
        body: JSON.stringify(newPart)
      });
      if (res.ok) {
        const created = await res.json();
        setSpareParts(prev => [created, ...prev]);
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add spare part');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error adding spare part:', err);
      alert('Network error while adding spare part');
      return { success: false, error: 'Network error' };
    }
  };

  const handleUpdatePart = async (id, updatedPart) => {
    try {
      const res = await fetchWithAuth(`/api/spare-parts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPart)
      });
      if (res.ok) {
        const updated = await res.json();
        setSpareParts(prev => prev.map(p => p.id === id ? updated : p));
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update spare part');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error updating spare part:', err);
      alert('Network error while updating spare part');
      return { success: false, error: 'Network error' };
    }
  };

  const handleDeletePart = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/spare-parts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSpareParts(prev => prev.filter(p => p.id !== id));
        return { success: true };
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete spare part');
        return { success: false, error: err.error };
      }
    } catch (err) {
      console.error('Error deleting spare part:', err);
      alert('Network error while deleting spare part');
      return { success: false, error: 'Network error' };
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const serviceDueCount = vehicles.filter(v => v.status === 'Service Due').length;

  return (
    <div className="min-h-screen bg-cream-100 flex font-sans">
      {/* Persistent Left Desktop Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <Header 
          activeTab={activeTab} 
          vehiclesCount={vehicles.length}
          serviceDueCount={serviceDueCount}
        />

        <main className="px-8 py-6 w-full flex-1 space-y-6">
          {loading && (
            <div className="bg-forest-50 border border-forest-200 text-forest-800 px-4 py-2 rounded-lg text-xs font-semibold animate-pulse">
              Syncing with PostgreSQL Database...
            </div>
          )}

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
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              maintenanceLogs={maintenance}
              spareParts={spareParts}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenancePage
              maintenance={maintenance}
              vehicles={vehicles}
              onAddMaintenance={handleAddMaintenance}
              onUpdateMaintenance={handleUpdateMaintenance}
              onDeleteMaintenance={handleDeleteMaintenance}
            />
          )}

          {activeTab === 'spare-parts' && (
            <SparePartsPage
              spareParts={spareParts}
              vehicles={vehicles}
              onAddPart={handleAddPart}
              onUpdatePart={handleUpdatePart}
              onDeletePart={handleDeletePart}
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
          <span className="font-mono text-[11px] text-forest-800 font-semibold">PostgreSQL Connected</span>
        </footer>
      </div>
    </div>
  );
}
