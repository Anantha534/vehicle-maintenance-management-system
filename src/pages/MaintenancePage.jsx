import React, { useState } from 'react';
import Modal from '../components/Modal';
import { Wrench, Plus, Search, Filter, Calendar, CheckCircle2, Clock, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function MaintenancePage({ 
  maintenance = [], 
  vehicles = [], 
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance,
  isAdmin = true
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [deletingLog, setDeletingLog] = useState(null);

  // Form state for Add
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Unauthorized: Administrator privileges required to log maintenance.');
      return;
    }
    if (!formData.vehicleReg || !formData.description) return;

    const matchedVehicle = vehicles.find(v => v.regNo === formData.vehicleReg);
    const vehicleName = matchedVehicle ? `${matchedVehicle.make} ${matchedVehicle.model}` : formData.vehicleReg;

    const res = await onAddMaintenance({
      ...formData,
      vehicleName,
      cost: Number(formData.cost) || 0,
      mileage: Number(formData.mileage) || 0
    });

    if (res?.success) {
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
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Unauthorized: Administrator privileges required to update maintenance logs.');
      return;
    }
    if (!editingLog) return;

    const res = await onUpdateMaintenance(editingLog.id, {
      ...editingLog,
      cost: Number(editingLog.cost) || 0,
      mileage: Number(editingLog.mileage) || 0
    });

    if (res?.success) {
      setEditingLog(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isAdmin) {
      alert('Unauthorized: Administrator privileges required to delete maintenance logs.');
      return;
    }
    if (!deletingLog) return;
    const res = await onDeleteMaintenance(deletingLog.id);
    if (res?.success) {
      setDeletingLog(null);
    }
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

        {isAdmin ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs border border-forest-950"
          >
            <Plus className="w-4 h-4" />
            <span>Log Maintenance Event</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-semibold flex items-center gap-1.5" title="Standard users have read-only permissions">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Read-Only Access</span>
          </div>
        )}
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
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Reg No</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Odometer</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 max-w-sm">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-gray-500 italic text-xs">
                    No maintenance logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-800">{log.vehicleName || 'Fleet Vehicle'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{log.vehicleReg}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${log.type === 'Service' ? 'bg-forest-100 text-forest-800' : 'bg-orange-100 text-orange-800'}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{log.serviceDate}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{log.mileage ? `${Number(log.mileage).toLocaleString('en-IN')} km` : 'N/A'}</td>
                    <td className="py-3 px-4 font-bold text-forest-900">₹{Number(log.cost).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      {log.status === 'Completed' ? (
                        <span className="badge-active">Completed</span>
                      ) : (
                        <span className="badge-danger">In Progress</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-sm truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingLog({ ...log })}
                            title="Edit Maintenance Log"
                            className="p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors border border-gray-300"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingLog(log)}
                            title="Delete Maintenance Log"
                            className="p-1.5 bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors border border-gray-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Maintenance Event */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log Maintenance Event">
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
                <option value="">-- Choose Vehicle --</option>
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
                <option value="Repair">Unscheduled Repair</option>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Odometer Reading (km)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 26500"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Cost (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 3500"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress (Sets vehicle status to Under Repair)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                placeholder="Describe actions taken, replaced parts, inspections..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>
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

      {/* Modal: Edit Maintenance Log */}
      {editingLog && (
        <Modal isOpen={!!editingLog} onClose={() => setEditingLog(null)} title={`Edit Maintenance: ${editingLog.vehicleReg}`}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vehicle Registration</label>
                <input
                  type="text"
                  value={editingLog.vehicleReg}
                  disabled
                  className="w-full px-3 py-2 text-xs border border-gray-200 bg-gray-100 rounded-lg font-mono text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Maintenance Type *</label>
                <select
                  value={editingLog.type}
                  onChange={(e) => setEditingLog({ ...editingLog, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  <option value="Service">Routine Service</option>
                  <option value="Repair">Unscheduled Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Service Date *</label>
                <input
                  type="date"
                  value={editingLog.serviceDate || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, serviceDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Next Service Due Date</label>
                <input
                  type="date"
                  value={editingLog.nextServiceDate || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, nextServiceDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Odometer Reading (km)</label>
                <input
                  type="number"
                  min="0"
                  value={editingLog.mileage || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, mileage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Total Cost (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingLog.cost || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, cost: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status *</label>
                <select
                  value={editingLog.status}
                  onChange={(e) => setEditingLog({ ...editingLog, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress (Sets vehicle status to Under Repair)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  value={editingLog.description || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Update Log
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingLog && (
        <Modal isOpen={!!deletingLog} onClose={() => setDeletingLog(null)} title="Confirm Maintenance Log Deletion">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-bold">Are you sure you want to delete this maintenance entry?</p>
                <p className="mt-1 text-red-700">
                  This record for vehicle {deletingLog.vehicleReg} will be permanently removed from PostgreSQL.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
              <div><strong className="text-gray-700">Vehicle:</strong> {deletingLog.vehicleReg} ({deletingLog.type})</div>
              <div><strong className="text-gray-700">Description:</strong> {deletingLog.description}</div>
              <div><strong className="text-gray-700">Cost:</strong> ₹{Number(deletingLog.cost).toLocaleString('en-IN')}</div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingLog(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Log</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
