import React, { useState } from 'react';
import { Car, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('admin@fleet.edu');
  const [password, setPassword] = useState('demo123');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-forest-900 text-white p-6 border-b border-forest-800 flex items-center gap-4">
          <div className="p-3 bg-forest-700 rounded-lg text-white border border-forest-600 shrink-0">
            <Car className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide uppercase">
              VEHICLE MAINTENANCE MANAGEMENT SYSTEM
            </h1>
            <p className="text-xs text-forest-200 mt-0.5 font-medium">
              Enterprise Fleet Operations Portal
            </p>
          </div>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="bg-forest-50 border border-forest-200 rounded-lg p-3.5 text-xs text-forest-800 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
            <p>
              Demo Mode Active: Click <span className="font-bold text-forest-900">"Sign In to Fleet Portal"</span> to access the management portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username / Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-forest-900 hover:bg-forest-800 text-white py-2.5 px-6 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs border border-forest-950"
            >
              <span>Sign In to Fleet Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
