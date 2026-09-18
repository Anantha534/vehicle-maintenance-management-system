import React, { useState } from 'react';
import Modal from '../components/Modal';
import { Package, Plus, Search, DollarSign, Calendar } from 'lucide-react';

export default function SparePartsPage({ spareParts, vehicles, onAddPart }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    partName: '',
    vehicleReg: vehicles.length > 0 ? vehicles[0].regNo : '',
    quantity: 1,
    replacementDate: new Date().toISOString().split('T')[0],
    cost: ''
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.partName || !formData.vehicleReg) return;

    onAddPart({
      ...formData,
      id: 'p_' + Date.now(),
      quantity: Number(formData.quantity) || 1,
      cost: Number(formData.cost) || 0
    });

    setIsAddModalOpen(false);
    setFormData({
      partName: '',
      vehicleReg: vehicles.length > 0 ? vehicles[0].regNo : '',
      quantity: 1,
      replacementDate: new Date().toISOString().split('T')[0],
      cost: ''
    });
  };

  const filteredParts = spareParts.filter(p => 
    p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPartsCost = spareParts.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search part name or vehicle registration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="px-3 py-1.5 bg-forest-50 border border-forest-200 rounded-lg text-xs font-semibold text-forest-800 shrink-0">
            Total Inventory Spend: <span className="text-forest-950 font-bold">₹{totalPartsCost.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs border border-forest-950"
        >
          <Plus className="w-4 h-4" />
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* Spare Parts Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Spare Parts Log ({filteredParts.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Part Name</th>
                <th className="py-3 px-4">Vehicle Reg</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Replacement Date</th>
                <th className="py-3 px-4">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500 italic text-xs">
                    No spare parts recorded.
                  </td>
                </tr>
              ) : (
                filteredParts.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">{p.partName}</td>
                    <td className="py-3 px-4 font-mono text-gray-700 font-bold">{p.vehicleReg}</td>
                    <td className="py-3 px-4 text-gray-600">{p.quantity} unit(s)</td>
                    <td className="py-3 px-4 text-gray-700">{p.replacementDate}</td>
                    <td className="py-3 px-4 font-bold text-forest-900">₹{Number(p.cost).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Spare Part */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Spare Part Entry">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Part Name *</label>
              <input
                type="text"
                placeholder="e.g. Front Brake Pads Set"
                value={formData.partName}
                onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Vehicle *</label>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Replacement Date *</label>
              <input
                type="date"
                value={formData.replacementDate}
                onChange={(e) => setFormData({ ...formData, replacementDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Part Cost (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 2100"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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
              Save Spare Part
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
