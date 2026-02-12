import React, { useState } from 'react';
import { Save, Image as ImageIcon, Building, MapPin, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { SystemConfig } from '../types';
import { italicizeFirstWord } from '../App';
import cekapurusLogo from '../assets/cekapurus.png';

interface SettingsProps {
  config: SystemConfig;
  setConfig: (config: SystemConfig) => void;
  onRepairReceipts?: () => Promise<void>;
}

const AdminSettings: React.FC<SettingsProps> = ({ config, setConfig, onRepairReceipts }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [showSaved, setShowSaved] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const handleSave = () => {
    setConfig(localConfig);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 4000);
  };

  const handleRepair = async () => {
    if (!onRepairReceipts || isRepairing) return;
    if (!confirm("This will re-sequence all receipts in chronological order and reset the counter. Proceed?")) return;

    setIsRepairing(true);
    try {
      await onRepairReceipts();
    } catch (e) {
      console.error(e);
      alert("Failed to repair receipts.");
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card p-8 lg:p-10 rounded-3xl shadow-sm bg-white/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h3 className="font-title text-4xl text-slate-900 tracking-tight">
              {italicizeFirstWord('Configuration')}
            </h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Calibrate system manifestation protocols.</p>
          </div>
          {showSaved && (
            <div className="bg-emerald-500 text-white text-[10px] font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/20 uppercase tracking-widest">
              <CheckCircle2 size={16} /> Synchronized
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Building size={14} /> Entity Descriptor
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:bg-white outline-none transition-all shadow-inner"
                value={localConfig.companyName}
                onChange={e => setLocalConfig({ ...localConfig, companyName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <MapPin size={14} /> Headquarters Manifest
              </label>
              <textarea
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-50 focus:bg-white outline-none transition-all min-h-[120px] resize-none shadow-inner"
                value={localConfig.address}
                onChange={e => setLocalConfig({ ...localConfig, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Phone size={14} /> Contact Hub
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:bg-white outline-none transition-all shadow-inner"
                value={localConfig.contact}
                onChange={e => setLocalConfig({ ...localConfig, contact: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <ImageIcon size={14} /> Brand Identity
              </label>
              <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-sm">
                  <img src={cekapurusLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-blue-400 ml-1 uppercase tracking-widest">Invoice Ref</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xl font-title text-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-center"
                  value={localConfig.invoicePrefix}
                  onChange={e => setLocalConfig({ ...localConfig, invoicePrefix: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-blue-400 ml-1 uppercase tracking-widest">Receipt Ref</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xl font-title text-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-center"
                  value={localConfig.receiptPrefix}
                  onChange={e => setLocalConfig({ ...localConfig, receiptPrefix: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <FileText size={14} /> Manifest Footer
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-50 focus:bg-white outline-none shadow-inner"
                value={localConfig.footerNotes}
                onChange={e => setLocalConfig({ ...localConfig, footerNotes: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Maintenance Tools</h4>
            {onRepairReceipts && (
              <button
                onClick={handleRepair}
                disabled={isRepairing}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isRepairing ? "Synchronizing..." : "Repair Receipt Sequence"}
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            className="btn-premium flex items-center gap-3 px-12 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg w-full md:w-auto"
          >
            <Save size={20} /> Commit Changes
          </button>
        </div>
      </div>

      <div className="bg-blue-600/5 p-6 rounded-2xl border border-blue-100 text-center">
        <p className="text-[10px] text-blue-900/50 font-semibold uppercase tracking-widest">
          Protocol Authority: Historical records are immutable.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
