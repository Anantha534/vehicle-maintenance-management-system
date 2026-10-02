import React, { useState } from 'react';
import Modal from '../components/Modal';
import { Package, Plus, Search, DollarSign, Calendar, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function SparePartsPage({ 
  spareParts = [], 
  vehicles = [], 
  onAddPart,
  onUpdatePart,
  onDeletePart
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);

  const [formData, setFormData] = useState({
    partName: '',
    vehicleReg: vehicles.length > 0 ? vehicles[0].regNo : '',
    quantity: 1,
    replacementDate: new Date().toISOString().split('T')[0],
    cost: ''
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partName || !formData.vehicleReg) return;

    const res = await onAddPart({
      ...formData,
      quantity: Number(formData.quantity) || 1,
      cost: Number(formData.cost) || 0
    });

    if (res?.success) {
      setIsAddModalOpen(false);
      setFormData({
        partName: '',
        vehicleReg: vehicles.length > 0 ? vehicles[0].regNo : '',
        quantity: 1,
        replacementDate: new Date().toISOString().split('T')[0],
        cost: ''
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPart) return;

    const res = await onUpdatePart(editingPart.id, {
      ...editingPart,
      quantity: Number(editingPart.quantity) || 1,
      cost: Number(editingPart.cost) || 0
    });

    if (res?.success) {
      setEditingPart(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPart) return;
    const res = await onDeletePart(deletingPart.id);
    if (res?.success) {
      setDeletingPart(null);
    }
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
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 italic text-xs">
                    No spare parts recorded.
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-800">{part.partName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{part.vehicleReg}</td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{part.quantity} unit(s)</td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{part.replacementDate}</td>
                    <td className="py-3 px-4 font-bold text-forest-900">₹{Number(part.cost).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingPart({ ...part })}
                          title="Edit Spare Part"
                          className="p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors border border-gray-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPart(part)}
                          title="Delete Spare Part"
                          className="p-1.5 bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 rounded text-[11px] font-semibold transition-colors border border-gray-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Spare Part */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Spare Part">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Part Name *</label>
              <input
                type="text"
                placeholder="e.g. Brake Pads Set / Clutch Cable / Battery"
                value={formData.partName}
                onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Associated Vehicle *</label>
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

            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Total Cost (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>
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

      {/* Modal: Edit Spare Part */}
      {editingPart && (
        <Modal isOpen={!!editingPart} onClose={() => setEditingPart(null)} title={`Edit Spare Part: ${editingPart.partName}`}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Part Name *</label>
                <input
                  type="text"
                  value={editingPart.partName}
                  onChange={(e) => setEditingPart({ ...editingPart, partName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Associated Vehicle *</label>
                <select
                  value={editingPart.vehicleReg}
                  onChange={(e) => setEditingPart({ ...editingPart, vehicleReg: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPart.quantity}
                    onChange={(e) => setEditingPart({ ...editingPart, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Cost (₹) *</label>
                  <input
                    type="number"
                    value={editingPart.cost}
                    onChange={(e) => setEditingPart({ ...editingPart, cost: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Replacement Date *</label>
                <input
                  type="date"
                  value={editingPart.replacementDate || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, replacementDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingPart(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Update Spare Part
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingPart && (
        <Modal isOpen={!!deletingPart} onClose={() => setDeletingPart(null)} title="Confirm Spare Part Deletion">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-bold">Are you sure you want to delete this spare part record?</p>
                <p className="mt-1 text-red-700">
                  This spare part entry for vehicle {deletingPart.vehicleReg} will be permanently removed from PostgreSQL.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
              <div><strong className="text-gray-700">Part:</strong> {deletingPart.partName}</div>
              <div><strong className="text-gray-700">Vehicle:</strong> {deletingPart.vehicleReg}</div>
              <div><strong className="text-gray-700">Cost:</strong> ₹{Number(deletingPart.cost).toLocaleString('en-IN')}</div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingPart(null)}
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
                <span>Delete Part</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
