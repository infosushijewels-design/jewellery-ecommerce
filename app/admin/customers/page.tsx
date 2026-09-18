"use client";

import React, { useEffect, useState } from 'react';
import { getAdminCustomers } from '@/lib/supabase/orderService';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await getAdminCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Client Relations</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">Customer Directory</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Patron accounts, concierge contact directory, and acquisition history.</p>
        </div>
        <button
          onClick={loadCustomers}
          className="self-start sm:self-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#17171A] p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Search patron by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121214] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline">
          {filteredCustomers.length} registered patrons
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-[#17171A] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <span className="material-symbols-outlined text-3xl animate-spin text-amber-400 mb-2">progress_activity</span>
            <p className="text-xs">Accessing client ledger...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">group_off</span>
            <p className="text-sm">No patrons found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider text-[11px] bg-white/[0.02]">
                  <th className="py-3.5 px-4">Patron Name</th>
                  <th className="py-3.5 px-4">Contact Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Member Since</th>
                  <th className="py-3.5 px-4 text-right">Orders Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-semibold text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                        {customer.fullName.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <span>{customer.fullName}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-mono text-xs">
                      {customer.email}
                    </td>
                    <td className="py-4 px-4">
                      {customer.role === 'admin' ? (
                        <span className="bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                          Atelier Admin
                        </span>
                      ) : (
                        <span className="bg-white/10 text-gray-300 text-[10px] px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
                          Patron
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-amber-300">
                      {customer.orderCount} {customer.orderCount === 1 ? 'Acquisition' : 'Acquisitions'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
