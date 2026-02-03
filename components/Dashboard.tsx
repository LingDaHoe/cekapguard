import React, { useState } from 'react';
import { 
  FileText, 
  Receipt, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  PlusCircle,
  Zap,
  ShieldCheck,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Document, Customer } from '../types';

interface DashboardProps {
  documents: Document[];
  customers: Customer[];
  onActionClick: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ documents, customers, onActionClick }) => {
  const [showReminder, setShowReminder] = useState(true);
  const totalRevenue = documents.reduce((acc, doc) => acc + doc.amount, 0);
  const totalInvoices = documents.filter(d => d.type === 'Invoice').length;
  const totalReceipts = documents.filter(d => d.type === 'Receipt').length;
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayDocs = documents.filter(doc => doc.date === date);
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayDocs.reduce((acc, d) => acc + d.amount, 0)
    };
  });

  const stats = [
    { label: 'Gross Revenue', value: `RM ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'blue' },
    { label: 'Active Invoices', value: totalInvoices, icon: FileText, color: 'indigo' },
    { label: 'Settled Receipts', value: totalReceipts, icon: Receipt, color: 'sky' },
    { label: 'Client Base', value: customers.length, icon: Users, color: 'violet' },
  ];

  return (
    <div className="space-y-6">
      {/* Security Reminder Banner - Blue Theme */}
      {showReminder && (
        <div className="glass-card p-5 rounded-2xl border-blue-200 bg-blue-50/70 backdrop-blur-md flex items-start gap-5 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
          <div className="bg-blue-600 p-3 rounded-2xl text-white shrink-0 shadow-lg shadow-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1 pr-10">
            <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest font-poppins mb-1">
              System Integrity Protocol
            </p>
            <p className="text-xs font-semibold text-blue-900 leading-relaxed max-w-2xl">
              All user records are securely stored, and our system is designed to ensure safety and transparency. Please note that the business owners continuously monitor the record logs to maintain oversight.
            </p>
          </div>
          <button 
            onClick={() => setShowReminder(false)}
            className="absolute top-5 right-5 text-blue-400 hover:text-blue-600 transition-colors p-1"
            aria-label="Dismiss reminder"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-xl border border-slate-200 hover:shadow-lg transition-all group overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className={`bg-${stat.color}-500/10 text-${stat.color}-600 p-2 rounded-lg border border-${stat.color}-500/20`}>
                  <stat.icon size={18} />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10">
                  +8% <ArrowUpRight size={10} />
                </div>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 font-poppins">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-blue-500 fill-blue-500" />
                  <span className="text-blue-500 text-[10px] font-bold uppercase tracking-widest font-poppins">Analytics Dashboard</span>
                </div>
                <h3 className="font-title text-xl text-slate-900 tracking-tight">
                  <span className="text-blue-600 italic font-medium mr-1.5">Revenue</span>Distribution
                </h3>
              </div>
              <div className="flex gap-1 p-1 bg-slate-100/50 rounded-lg">
                <button className="px-3 py-1 bg-white text-blue-600 text-[10px] font-bold rounded shadow-sm">WEEKLY</button>
                <button className="px-3 py-1 text-slate-500 text-[10px] font-bold rounded hover:bg-slate-200/50 transition-colors">MONTHLY</button>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(37, 99, 235, 0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#2563eb" 
                    radius={[4, 4, 0, 0]} 
                    barSize={32}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600/90 backdrop-blur-md p-6 rounded-2xl text-white relative overflow-hidden shadow-xl border border-blue-400/30">
            <div className="relative z-10">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <PlusCircle size={18} />
              </div>
              <h3 className="font-title text-xl mb-1 leading-tight tracking-tight">
                <span className="italic font-medium mr-1.5 opacity-80">Quick</span> Manifest
              </h3>
              <p className="text-blue-100 text-[11px] mb-6 opacity-80 leading-relaxed font-poppins">Draft validated insurance manifests with RM precision.</p>
              
              <button 
                onClick={() => onActionClick('create')}
                className="w-full flex items-center justify-between p-3 bg-white text-blue-600 rounded-xl transition-all hover:bg-slate-50 font-bold text-xs uppercase tracking-widest"
              >
                Launch Wizard
                <PlusCircle size={16} />
              </button>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-5">
               <h3 className="font-title text-xl text-slate-900 tracking-tight">
                 <span className="text-blue-600 italic font-medium mr-1.5">Recent</span>Vault
               </h3>
               <button onClick={() => onActionClick('documents')} className="text-blue-600 text-[9px] font-bold uppercase tracking-widest hover:underline font-poppins">View All</button>
            </div>
            
            <div className="space-y-3">
              {documents.slice(0, 3).map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${doc.type === 'Invoice' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {doc.type === 'Invoice' ? <FileText size={16} /> : <Receipt size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900 truncate max-w-[120px] font-poppins leading-tight">{doc.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{doc.docNumber}</p>
                    </div>
                  </div>
                  <p className="text-base font-bold text-blue-600 font-title tracking-tight">RM {doc.amount.toLocaleString()}</p>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-[10px] font-medium italic font-poppins">Vault is currently empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;