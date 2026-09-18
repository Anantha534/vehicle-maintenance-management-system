import React from 'react';
import { TrendingUp, DollarSign, PieChart, Wrench, Package, Car } from 'lucide-react';

export default function CostsPage({ vehicles, maintenance, spareParts }) {
  // Aggregate expenses
  const serviceCosts = maintenance
    .filter(m => m.type === 'Service')
    .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const repairCosts = maintenance
    .filter(m => m.type === 'Repair')
    .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const sparePartCosts = spareParts
    .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const totalCost = serviceCosts + repairCosts + sparePartCosts;

  // Vehicle-wise summary breakdown
  const vehicleCostsMap = vehicles.map(v => {
    const vServices = maintenance
      .filter(m => m.vehicleReg === v.regNo && m.type === 'Service')
      .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

    const vRepairs = maintenance
      .filter(m => m.vehicleReg === v.regNo && m.type === 'Repair')
      .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

    const vParts = spareParts
      .filter(p => p.vehicleReg === v.regNo)
      .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

    const vTotal = vServices + vRepairs + vParts;

    return {
      regNo: v.regNo,
      name: `${v.make} ${v.model}`,
      type: v.type,
      services: vServices,
      repairs: vRepairs,
      parts: vParts,
      total: vTotal
    };
  }).sort((a, b) => b.total - a.total);

  // Simple percentages for SVG chart bars
  const servicePct = totalCost > 0 ? Math.round((serviceCosts / totalCost) * 100) : 0;
  const repairPct = totalCost > 0 ? Math.round((repairCosts / totalCost) * 100) : 0;
  const partsPct = totalCost > 0 ? Math.round((sparePartCosts / totalCost) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Fleet Spend</span>
            <div className="p-2 rounded-lg bg-forest-900 text-cream-50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-forest-900">₹{totalCost.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Grand Total Expenses</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Routine Service Costs</span>
            <div className="p-2 rounded-lg bg-forest-50 text-forest-800 border border-forest-200">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">₹{serviceCosts.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-forest-700 mt-1 font-medium">{servicePct}% of overall budget</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Repair Costs</span>
            <div className="p-2 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-orange-900">₹{repairCosts.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-orange-700 mt-1 font-medium">{repairPct}% of overall budget</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Spare Parts Costs</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-900">₹{sparePartCosts.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1 font-medium">{partsPct}% of overall budget</p>
        </div>
      </div>

      {/* Clean Category Distribution Bar Chart Section */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-forest-800" />
            <span>Expense Distribution Breakdown</span>
          </h3>
          <span className="text-xs text-gray-500 font-medium">Categorized by Expenditure</span>
        </div>

        {/* Custom Clean Bar */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-gray-100 rounded-lg overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${servicePct}%` }} 
              className="bg-forest-700 text-[10px] text-white font-bold flex items-center justify-center transition-all duration-300"
              title={`Routine Service: ${servicePct}%`}
            >
              {servicePct > 8 && `${servicePct}%`}
            </div>
            <div 
              style={{ width: `${repairPct}%` }} 
              className="bg-amber-600 text-[10px] text-white font-bold flex items-center justify-center transition-all duration-300"
              title={`Repairs: ${repairPct}%`}
            >
              {repairPct > 8 && `${repairPct}%`}
            </div>
            <div 
              style={{ width: `${partsPct}%` }} 
              className="bg-blue-600 text-[10px] text-white font-bold flex items-center justify-center transition-all duration-300"
              title={`Spare Parts: ${partsPct}%`}
            >
              {partsPct > 8 && `${partsPct}%`}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-6 text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-forest-700 inline-block"></span>
              <span className="text-gray-700 font-medium">Routine Services (₹{serviceCosts.toLocaleString('en-IN')})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-600 inline-block"></span>
              <span className="text-gray-700 font-medium">Unscheduled Repairs (₹{repairCosts.toLocaleString('en-IN')})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
              <span className="text-gray-700 font-medium">Spare Parts (₹{sparePartCosts.toLocaleString('en-IN')})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle-Wise Expense Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Vehicle-Wise Expense Summary
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Vehicle Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Services (₹)</th>
                <th className="py-3 px-4">Repairs (₹)</th>
                <th className="py-3 px-4">Parts (₹)</th>
                <th className="py-3 px-4 text-right">Total Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicleCostsMap.map((item) => (
                <tr key={item.regNo} className="hover:bg-cream-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900 font-mono text-xs">{item.regNo}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{item.name}</td>
                  <td className="py-3 px-4 text-gray-600">{item.type}</td>
                  <td className="py-3 px-4 font-mono text-gray-700">₹{item.services.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-mono text-gray-700">₹{item.repairs.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-mono text-gray-700">₹{item.parts.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-bold text-forest-900 text-right">₹{item.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
