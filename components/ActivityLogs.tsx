
import React from 'react';
import { History, Clock, Shield, Info } from 'lucide-react';
import { ActivityLog } from '../types';
import { italicizeFirstWord } from '../App';

interface LogsProps {
  logs: ActivityLog[];
}

const ActivityLogs: React.FC<LogsProps> = ({ logs }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="glass-card p-8 lg:p-10 rounded-3xl border-slate-200 shadow-sm bg-white/50">
        <div className="flex items-center gap-6 mb-10">
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <History size={28} />
          </div>
          <div>
            <h3 className="font-title text-4xl text-slate-900 tracking-tight">
              {italicizeFirstWord('Audit Trail')}
            </h3>
            <p className="text-slate-400 text-xs font-medium mt-1">Immutable administrative manifest.</p>
          </div>
        </div>

        <div className="space-y-2">
          {logs.map((log, idx) => (
            <div 
              key={log.id} 
              className="flex items-center gap-4 p-4 hover:bg-white/80 rounded-2xl transition-all border border-transparent hover:border-slate-100 group animate-in slide-in-from-right-2"
              style={{animationDelay: `${idx * 50}ms`}}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-slate-200">
                {log.action.includes('Created') ? <Shield size={18} /> : <Info size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    <span className="text-blue-600 italic mr-1.5">{log.staffName}</span> 
                    <span className="text-slate-500 font-medium">{log.action}</span> 
                  </p>
                  <div className="flex flex-col items-end text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                {log.docId && (
                  <div className="mt-1.5 inline-flex bg-slate-50 border border-slate-200 text-slate-400 px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest">
                    ID: {log.docId}
                  </div>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-20">
              <Clock size={40} className="mx-auto text-slate-200 mb-4" />
              <h3 className="font-title text-2xl text-slate-300">
                {italicizeFirstWord('Manifest Clear')}
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
