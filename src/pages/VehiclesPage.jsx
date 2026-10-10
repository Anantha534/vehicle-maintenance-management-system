import React, { useState } from 'react';
import Modal from '../components/Modal';
import VehicleDetailsModal from './VehicleDetailsModal';
import { getServiceScheduleInfo } from '../utils/serviceScheduler';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  Fuel, 
  Gauge, 
  Calendar,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export default function VehiclesPage({ 
  vehicles, 
  onAddVehicle, 
  onUpdateVehicle, 
  onDeleteVehicle, 
  maintenanceLogs = [], 
  spareParts = [],
  isAdmin = true
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Form state for Add Vehicle
  const [formData, setFormData] = useState({
    regNo: '',
    type: 'Car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'Petrol',
    mileage: '',
    status: 'Active',
    nextServiceDate: '',
    purchaseDate: '',
    insuranceExpiry: ''
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Unauthorized: Administrator privileges required to add vehicles.');
      return;
    }
    if (!formData.regNo || !formData.make || !formData.model) return;

    const res = await onAddVehicle({
      ...formData,
      mileage: Number(formData.mileage) || 0,
      year: Number(formData.year) || new Date().getFullYear()
    });

    if (res?.success) {
      setIsAddModalOpen(false);
      setFormData({
        regNo: '',
        type: 'Car',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        fuelType: 'Petrol',
        mileage: '',
        status: 'Active',
        nextServiceDate: '',
        purchaseDate: '',
        insuranceExpiry: ''
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Unauthorized: Administrator privileges required to update vehicles.');
      return;
    }
    if (!editingVehicle) return;

    const res = await onUpdateVehicle(editingVehicle.id, {
      ...editingVehicle,
      mileage: Number(editingVehicle.mileage) || 0,
      year: Number(editingVehicle.year) || new Date().getFullYear()
    });

    if (res?.success) {
      setEditingVehicle(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isAdmin) {
      alert('Unauthorized: Administrator privileges required to delete vehicles.');
      return;
    }
    if (!deletingVehicle) return;
    const res = await onDeleteVehicle(deletingVehicle.id);
    if (res?.success) {
      setDeletingVehicle(null);
    }
  };

  // Filtered vehicles logic using consistent service scheduling
  const filteredVehicles = vehicles.filter((v) => {
    const schedule = getServiceScheduleInfo(v);
    const matchesSearch = 
      v.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || schedule.displayStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Search, Filters, Add Button */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by registration number, make, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            <option value="All">All Types</option>
            <option value="Car">Car</option>
            <option value="Scooter">Scooter</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Service Due">Service Due</option>
            <option value="Under Repair">Under Repair</option>
          </select>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs border border-forest-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-semibold flex items-center gap-1.5" title="Standard users have read-only permissions">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Read-Only Access</span>
          </div>
        )}
      </div>

      {/* Vehicle Directory Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Registered Vehicles ({filteredVehicles.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Make & Model</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Fuel</th>
                <th className="py-3 px-4">Mileage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Service</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-gray-500 italic text-xs">
                    No vehicles found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const schedule = getServiceScheduleInfo(v);
                  return (
                    <tr key={v.id} className="hover:bg-cream-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900 font-mono text-xs">{v.regNo}</td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{v.type}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {v.make} {v.model}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{v.year}</td>
                      <td className="py-3 px-4 text-gray-600">{v.fuelType}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{Number(v.mileage).toLocaleString('en-IN')} km</td>
                      <td className="py-3 px-4">
                        <span className={schedule.badgeClass}>
                          {schedule.displayStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700">
                        <div className="flex flex-col">
                          <span>{v.nextServiceDate || 'N/A'}</span>
                          {schedule.serviceState === 'Overdue' && (
                            <span className="text-[10px] text-red-600 font-bold">
                              Overdue by {Math.abs(schedule.daysDiff)} day(s)
                            </span>
                          )}
                          {schedule.serviceState === 'Due' && (
                            <span className="text-[10px] text-amber-700 font-semibold">
                              Due in {schedule.daysDiff} day(s)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedVehicle(v)}
                            title="View Details"
                            className="p-1.5 bg-gray-100 hover:bg-forest-900 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors border border-gray-300"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingVehicle({ ...v })}
                                title="Edit Vehicle"
                                className="p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors border border-gray-300"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingVehicle(v)}
                                title="Delete Vehicle"
                                className="p-1.5 bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors border border-gray-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Vehicle Form */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Vehicle">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Registration Number *</label>
              <input
                type="text"
                placeholder="e.g. TN01AB1234"
                value={formData.regNo}
                onChange={(e) => setFormData({ ...formData, regNo: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vehicle Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="Car">Car</option>
                <option value="Scooter">Scooter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Make (Brand) *</label>
              <input
                type="text"
                placeholder="e.g. Hyundai / Honda"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Model *</label>
              <input
                type="text"
                placeholder="e.g. i20 / Activa 6G"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturing Year</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 2}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Mileage (km)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 25000"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Service Due">Service Due</option>
                <option value="Under Repair">Under Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Next Service Date</label>
              <input
                type="date"
                value={formData.nextServiceDate || ''}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate || ''}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Insurance Expiry Date</label>
              <input
                type="date"
                value={formData.insuranceExpiry || ''}
                onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
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
              Save Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Vehicle Form */}
      {editingVehicle && (
        <Modal isOpen={!!editingVehicle} onClose={() => setEditingVehicle(null)} title={`Edit Vehicle: ${editingVehicle.regNo}`}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Registration Number *</label>
                <input
                  type="text"
                  value={editingVehicle.regNo}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, regNo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vehicle Type *</label>
                <select
                  value={editingVehicle.type}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  <option value="Car">Car</option>
                  <option value="Scooter">Scooter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Make (Brand) *</label>
                <input
                  type="text"
                  value={editingVehicle.make}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, make: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Model *</label>
                <input
                  type="text"
                  value={editingVehicle.model}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturing Year</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 2}
                  value={editingVehicle.year}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, year: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fuel Type</label>
                <select
                  value={editingVehicle.fuelType}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, fuelType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Mileage (km)</label>
                <input
                  type="number"
                  min="0"
                  value={editingVehicle.mileage}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, mileage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={editingVehicle.status}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Service Due">Service Due</option>
                  <option value="Under Repair">Under Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Next Service Date</label>
                <input
                  type="date"
                  value={editingVehicle.nextServiceDate || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, nextServiceDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={editingVehicle.purchaseDate || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Insurance Expiry Date</label>
                <input
                  type="date"
                  value={editingVehicle.insuranceExpiry || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, insuranceExpiry: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Update Vehicle
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingVehicle && (
        <Modal isOpen={!!deletingVehicle} onClose={() => setDeletingVehicle(null)} title="Confirm Vehicle Deletion">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-bold">Are you sure you want to delete vehicle {deletingVehicle.regNo}?</p>
                <p className="mt-1 text-red-700">
                  This will permanently delete this vehicle from PostgreSQL along with its associated maintenance logs and spare parts records (Cascading Delete).
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
              <div><strong className="text-gray-700">Vehicle:</strong> {deletingVehicle.make} {deletingVehicle.model} ({deletingVehicle.year})</div>
              <div><strong className="text-gray-700">Registration:</strong> <span className="font-mono font-bold">{deletingVehicle.regNo}</span></div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingVehicle(null)}
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
                <span>Delete Vehicle</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: View Vehicle Details */}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          maintenanceLogs={maintenanceLogs}
          spareParts={spareParts}
        />
      )}
    </div>
  );
}
