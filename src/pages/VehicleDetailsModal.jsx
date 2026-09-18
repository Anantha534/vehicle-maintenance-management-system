import React from 'react';
import Modal from '../components/Modal';
import { Car, Calendar, Gauge, ShieldAlert, Wrench, Package, DollarSign } from 'lucide-react';

export default function VehicleDetailsModal({ vehicle, isOpen, onClose, maintenanceLogs = [], spareParts = [] }) {
  if (!vehicle) return null;

  // Filter maintenance history & spare parts for this specific vehicle
  const vehicleLogs = maintenanceLogs.filter(m => m.vehicleReg === vehicle.regNo);
  const vehicleParts = spareParts.filter(p => p.vehicleReg === vehicle.regNo);

  const totalServiceCost = vehicleLogs.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalPartsCost = vehicleParts.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const grandTotalCost = totalServiceCost + totalPartsCost;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vehicle Overview: ${vehicle.regNo}`} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Vehicle Header Specs Card */}
        <div className="bg-forest-900 text-cream-50 p-5 rounded-xl border border-forest-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-forest-700 text-white px-2.5 py-0.5 rounded border border-forest-600">
                {vehicle.regNo}
              </span>
              <span className="text-xs font-semibold text-forest-200">
                {vehicle.type}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </h2>
            <p className="text-xs text-forest-300 mt-0.5">
              Fuel Type: <span className="text-white font-medium">{vehicle.fuelType}</span> &bull; Mileage: <span className="text-white font-medium">{Number(vehicle.mileage).toLocaleString('en-IN')} km</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-forest-300 font-semibold uppercase tracking-wider">Current Status</p>
            <div className="mt-1">
              {vehicle.status === 'Active' && <span className="badge-active">Active</span>}
              {vehicle.status === 'Service Due' && <span className="badge-warning">Service Due</span>}
              {vehicle.status === 'Under Repair' && <span className="badge-danger">Under Repair</span>}
            </div>
            <p className="text-[11px] text-forest-300 mt-2 font-medium">
              Next Service: <span className="text-white font-semibold">{vehicle.nextServiceDate}</span>
            </p>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 text-[11px] block font-medium">Purchase Date</span>
            <span className="font-semibold text-gray-800">{vehicle.purchaseDate || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500 text-[11px] block font-medium">Insurance Expiry</span>
            <span className="font-semibold text-gray-800">{vehicle.insuranceExpiry || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500 text-[11px] block font-medium">Total Maintenance Spend</span>
            <span className="font-bold text-forest-900">₹{grandTotalCost.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-500 text-[11px] block font-medium">Recorded Events</span>
            <span className="font-semibold text-gray-800">{vehicleLogs.length} Log(s)</span>
          </div>
        </div>

        {/* Tabs / Sections: Maintenance History & Spare Parts */}
        <div className="space-y-4">
          {/* Maintenance History */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-forest-800" />
              <span>Service & Repair History</span>
            </h4>

            {vehicleLogs.length === 0 ? (
              <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                No recorded maintenance events for this vehicle yet.
              </p>
            ) : (
              <div className="space-y-2">
                {vehicleLogs.map(log => (
                  <div key={log.id} className="p-3 bg-white border border-gray-200 rounded-lg text-xs flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${log.type === 'Service' ? 'bg-forest-100 text-forest-800' : 'bg-orange-100 text-orange-800'}`}>
                          {log.type}
                        </span>
                        <span className="text-gray-500 font-medium">{log.serviceDate}</span>
                        <span className="text-gray-400">&bull;</span>
                        <span className="text-gray-600 font-mono">{log.mileage} km</span>
                      </div>
                      <p className="text-gray-800 mt-1 font-medium">{log.description}</p>
                    </div>
                    <span className="font-bold text-forest-900 text-xs shrink-0">₹{Number(log.cost).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spare Parts Installed */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Package className="w-4 h-4 text-forest-800" />
              <span>Spare Parts Installed</span>
            </h4>

            {vehicleParts.length === 0 ? (
              <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                No replacement parts registered for this vehicle.
              </p>
            ) : (
              <div className="space-y-2">
                {vehicleParts.map(part => (
                  <div key={part.id} className="p-3 bg-white border border-gray-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900">{part.partName}</span>
                      <p className="text-[11px] text-gray-500">Qty: {part.quantity} &bull; Date: {part.replacementDate}</p>
                    </div>
                    <span className="font-bold text-gray-800">₹{Number(part.cost).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </Modal>
  );
}
