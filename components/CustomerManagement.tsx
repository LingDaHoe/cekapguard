import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Car, 
  Briefcase, 
  Phone, 
  Mail, 
  Edit2,
  Trash2,
  User,
  CalendarDays,
  Fingerprint
} from 'lucide-react';
import { Customer } from '../types';
import { italicizeFirstWord } from '../App';

interface CustomerProps {
  customers: Customer[];
  updateCustomer: (c: Customer) => void;
}

const CustomerManagement: React.FC<CustomerProps> = ({ customers, updateCustomer }) => {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) || 
    (c.ic && c.ic.includes(search)) ||
    c.vehicleRegNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search clients..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all shadow-sm outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 glass-card px-6 py-3 rounded-2xl border-slate-200 shadow-sm bg-white/50">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
             <Users size={20} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block leading-none mb-1">Total Profiles</span>
            <span className="text-lg font-title text-slate-800 leading-none">{customers.length} Verified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((customer, idx) => (
          <div key={customer.id} className="glass-card p-6 rounded-3xl hover:translate-y-[-4px] transition-all group animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 font-title text-xl border border-slate-200">
                {customer.name.charAt(0)}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-lg transition-all shadow-sm">
                  <Edit2 size={14} />
                </button>
                <button className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-sm">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-title text-2xl text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {italicizeFirstWord(customer.name)}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                   <div className="bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 flex items-center gap-2">
                      {customer.vehicleType === 'Motor' ? <Car className="text-blue-600" size={14} /> : <Briefcase className="text-blue-600" size={14} />}
                      <span className="text-[10px] font-bold text-blue-800 font-title uppercase tracking-widest">{customer.vehicleRegNo || 'N/A'}</span>
                   </div>
                   {customer.vehicleType === 'Motor' && (
                     <div className="px-3 py-1 bg-slate-100 rounded-xl text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                        {customer.insuranceType}
                     </div>
                   )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 py-4 border-y border-slate-100">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-300"><Fingerprint size={14} /></div>
                  <span className="text-blue-600">{customer.ic || 'NOT_REGISTERED'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-300"><Phone size={14} /></div>
                  {customer.phone}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-300"><Mail size={14} /></div>
                  <span className="truncate">{customer.email || 'No email registered'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                   <CalendarDays size={12} className="text-slate-300" />
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Last Issue</span>
                </div>
                <span className="text-[10px] font-bold text-slate-800">
                   {new Date(customer.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-20 bg-white/50 border-dashed border-2 border-slate-200 rounded-3xl text-center">
            <User size={40} className="mx-auto mb-4 text-slate-100" />
            <h3 className="font-title text-2xl text-slate-300 uppercase">
              {italicizeFirstWord('Identity Empty')}
            </h3>
            <button className="mt-6 px-8 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest">
               New Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;