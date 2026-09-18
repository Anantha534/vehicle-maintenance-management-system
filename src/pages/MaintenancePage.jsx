import React, { useState } from 'react';
import Modal from '../components/Modal';
import { Wrench, Plus, Search, Filter, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function MaintenancePage({ maintenance, vehicles, onAddMaintenance }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vehicleReg: vehicles.length > 0 ? vehicles[0].regNo : '',
    type: 'Service',
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceDate: '',
    mileage: '',
    description: '',
    cost: '',
    status: 'Completed'
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.vehicleReg || !formData.description) return;

    const matchedVehicle = vehicles.find(v => v.regNo === formData.vehicleReg);
    const vehicleName = matchedVehicle ? `${matchedVehicle.make} ${matchedVehicle.model}` : formData.vehicleReg;

    onAddMaintenance({
      ...formData,
      id: 'm_' + Date.now(),
      vehicleName,
      cost: Number(formData.cost) || 0,
      mileage: Number(formData.mileage) || 0
    });

    setIsAddModalOpen(false);
    setFormData({
      vehicleReg: vehicles.length > 0 ? vehicles[0].regNo : '',
      type: 'Service',
      serviceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: '',
      mileage: '',
      description: '',
      cost: '',
      status: 'Completed'
    });
  };

  const filteredLogs = maintenance.filter(m => {
    const matchesSearch = 
      m.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.vehicleName && m.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || m.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search log by vehicle, reg number, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            <option value="All">All Maintenance Types</option>
            <option value="Service">Service Only</option>
            <option value="Repair">Repair Only</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs border border-forest-950"
        >
          <Plus className="w-4 h-4" />
          <span>Log Maintenance Event</span>
        </button>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Service & Repair Logs ({filteredLogs.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Reg Number</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Mileage</th>
                <th className="py-3 px-4 max-w-xs">Description</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500 italic text-xs">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((m) => (
                  <tr key={m.id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono text-xs">{m.vehicleReg}</td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{m.vehicleName || m.vehicleReg}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.type === 'Service' ? 'bg-forest-100 text-forest-800' : 'bg-orange-100 text-orange-800'}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{m.serviceDate}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{m.mileage ? `${m.mileage} km` : 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-800 max-w-xs truncate">{m.description}</td>
                    <td className="py-3 px-4 font-bold text-forest-900">₹{Number(m.cost).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      {m.status === 'Completed' ? (
                        <span className="badge-active">Completed</span>
                      ) : (
                        <span className="badge-warning">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Maintenance Form */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log New Maintenance Event">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Vehicle *</label>
              <select
                value={formData.vehicleReg}
                onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white font-mono"
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.regNo}>
                    {v.regNo} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Maintenance Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="Service">Routine Service</option>
                <option value="Repair">Repair Work</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Service Date *</label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Next Service Due Date</label>
              <input
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Mileage (km)</label>
              <input
                type="number"
                placeholder="e.g. 42500"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cost (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 3500"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Job Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work Description / Remarks *</label>
            <textarea
              rows="3"
              placeholder="Describe work done, replacements, engine oil changed, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              required
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Save Maintenance Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
