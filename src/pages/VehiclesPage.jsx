import React, { useState } from 'react';
import Modal from '../components/Modal';
import VehicleDetailsModal from './VehicleDetailsModal';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Fuel, 
  Gauge, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function VehiclesPage({ vehicles, onAddVehicle, maintenanceLogs, spareParts }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const reg = formData.regNo || formData.registrationNumber;
    if (!reg || !formData.make || !formData.model) return;

    const count = vehicles.length + 1;
    const vId = 'VEH-' + String(count).padStart(3, '0');
    const numYear = Number(formData.year || formData.manufacturingYear) || new Date().getFullYear();
    const numMileage = Number(formData.mileage || formData.currentMileage) || 0;

    onAddVehicle({
      ...formData,
      vehicleId: vId,
      registrationNumber: reg,
      make: formData.make,
      model: formData.model,
      manufacturingYear: numYear,
      fuelType: formData.fuelType || 'Petrol',
      currentMileage: numMileage,
      status: formData.status || 'Active',
      nextServiceDate: formData.nextServiceDate || '',
      purchaseDate: formData.purchaseDate || '',
      insuranceExpiry: formData.insuranceExpiry || '',
      type: formData.type || 'Car',
      id: vId,
      regNo: reg,
      year: numYear,
      mileage: numMileage
    });

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
  };

  // Filtered vehicles logic
  const filteredVehicles = vehicles.filter((v) => {
    const reg = v.registrationNumber || v.regNo || '';
    const matchesSearch = 
      reg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;

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

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs border border-forest-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
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
                filteredVehicles.map((v) => (
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
                      {v.status === 'Active' && <span className="badge-active">Active</span>}
                      {v.status === 'Service Due' && <span className="badge-warning">Service Due</span>}
                      {v.status === 'Under Repair' && <span className="badge-danger">Under Repair</span>}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">{v.nextServiceDate || 'N/A'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedVehicle(v)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-forest-900 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1 border border-gray-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
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
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Insurance Expiry Date</label>
              <input
                type="date"
                value={formData.insuranceExpiry}
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
