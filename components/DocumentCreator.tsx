import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Car, 
  Briefcase, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft, 
  UserPlus, 
  ShieldCheck, 
  CreditCard, 
  Target, 
  Eye,
  Loader2,
  Fingerprint,
  AlertCircle,
  Building2,
  FileText,
  Upload,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  Customer, 
  Document, 
  DocType, 
  VehicleType, 
  InsuranceType,
  OthersCategory,
  OthersEntry,
  SystemConfig 
} from '../types';
import { INSURANCE_TYPES, INSURANCE_COMPANIES, OTHERS_CATEGORIES } from '../constants';
import { suggestInsuranceNotes } from '../services/geminiService';
import { italicizeFirstWord } from '../App';
import PdfPreviewModal from './PdfPreviewModal';

interface CreatorProps {
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'lastUpdated'>) => Promise<Customer>;
  updateCustomer: (c: Customer) => void;
  addDocument: (d: Omit<Document, 'id' | 'docNumber' | 'staffId' | 'staffName' | 'attachmentUrl'>, file?: File) => void | Promise<void>;
  config: SystemConfig;
}

const DocumentCreator: React.FC<CreatorProps> = ({ 
  customers, 
  addCustomer, 
  updateCustomer, 
  addDocument,
  config 
}) => {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState<DocType>('Invoice');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<Customer | null>(null);
  
  type OthersEntryForm = { category: OthersCategory; amount: string };
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    ic: '',
    email: '',
    isCompany: false,
    vehicleType: 'Motor' as VehicleType,
    vehicleRegNo: '',
    insuranceType: 'Comprehensive' as InsuranceType,
    othersCategory: undefined as OthersCategory | undefined,
    othersEntries: [] as OthersEntryForm[],
    issuedCompany: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    insuranceDetails: '',
    serviceChargeAmount: ''
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [contractPreviewUrl, setContractPreviewUrl] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  // Revoke object URL when attachment is removed
  useEffect(() => {
    if (!attachmentFile && contractPreviewUrl) {
      URL.revokeObjectURL(contractPreviewUrl);
      setContractPreviewUrl(null);
    }
  }, [attachmentFile, contractPreviewUrl]);

  // Check for potential duplicates whenever name or IC changes
  useEffect(() => {
    if (formData.customerId) {
      setDuplicateWarning(null);
      return;
    }

    if (!formData.isCompany && formData.ic && formData.ic.length >= 12) {
      const match = customers.find(c => c.ic === formData.ic);
      if (match) {
        setDuplicateWarning(match);
        return;
      }
    }

    if (formData.customerName.length > 3) {
      const match = customers.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());
      if (match) {
        setDuplicateWarning(match);
        return;
      }
    }

    setDuplicateWarning(null);
  }, [formData.customerName, formData.ic, formData.customerId, customers]);

  // Formatting Helpers
  const formatPhoneNumber = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('60')) {
      digits = digits.substring(2);
    } else if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    if (!digits) return '';
    let formatted = '+60' + digits;
    if (formatted.length > 5) {
      formatted = formatted.slice(0, 5) + '-' + formatted.slice(5);
    }
    return formatted.slice(0, 15);
  };

  const formatICNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 6) {
      formatted = digits.slice(0, 6) + '-' + digits.slice(6);
    }
    if (formatted.length > 9) {
      formatted = formatted.slice(0, 9) + '-' + formData.ic.slice(9); // Corrected to use digits logic
      // Actually standardizing simpler logic for reactive input
      formatted = digits.slice(0, 6);
      if (digits.length > 6) formatted += '-' + digits.slice(6, 8);
      if (digits.length > 8) formatted += '-' + digits.slice(8, 12);
    }
    return formatICNumberBasic(value);
  };

  const formatICNumberBasic = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 6) {
      formatted = digits.slice(0, 6) + '-' + digits.slice(6);
    }
    if (formatted.length > 9) {
      formatted = formatted.slice(0, 9) + '-' + formatted.slice(9);
    }
    return formatted.slice(0, 14);
  };

  const filteredCustomers = searchQuery.length > 1 
    ? customers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone.includes(searchQuery) ||
        (c.ic && c.ic.includes(searchQuery)) ||
        c.vehicleRegNo.toLowerCase().includes(searchQuery.toLowerCase())
      ) 
    : [];

  const selectCustomer = (c: Customer) => {
    setFormData({
      ...formData,
      customerId: c.id,
      customerName: c.name,
      phone: c.phone,
      ic: c.ic || '',
      email: c.email || '',
      isCompany: c.isCompany ?? false,
      vehicleType: c.vehicleType,
      vehicleRegNo: c.vehicleRegNo,
      insuranceType: c.insuranceType,
      othersCategory: c.othersCategory,
      othersEntries: c.othersCategory ? [{ category: c.othersCategory, amount: '' }] : []
    });
    setSearchQuery('');
    setStep(2);
  };

  const useExistingCustomer = () => {
    if (duplicateWarning) {
      selectCustomer(duplicateWarning);
    }
  };

  const generateAINotes = async () => {
    setAiLoading(true);
    const suggestion = await suggestInsuranceNotes(formData.vehicleType, formData.insuranceType);
    setFormData(prev => ({ ...prev, insuranceDetails: suggestion }));
    setAiLoading(false);
  };

  const finalizeDocument = async () => {
    if (isFinalizing) return;
    setIsFinalizing(true);
    
    try {
      let targetCustomerId = formData.customerId;
      
      if (!targetCustomerId) {
        const existing = customers.find(c => 
          (c.ic === formData.ic && formData.ic !== '') || 
          (c.name.toLowerCase() === formData.customerName.toLowerCase() && c.phone === formData.phone)
        );

        if (existing) {
          targetCustomerId = existing.id;
          updateCustomer({
            ...existing,
            name: formData.customerName,
            phone: formData.phone,
            ic: formData.ic,
            isCompany: formData.isCompany,
            vehicleRegNo: formData.vehicleRegNo,
            insuranceType: formData.insuranceType,
            othersCategory: formData.othersEntries?.[0]?.category ?? formData.othersCategory
          });
        } else {
          const newCust = await addCustomer({
            name: formData.customerName,
            phone: formData.phone,
            ic: formData.ic,
            email: formData.email,
            isCompany: formData.isCompany,
            vehicleType: formData.vehicleType,
            vehicleRegNo: formData.vehicleRegNo,
            insuranceType: formData.insuranceType,
            othersCategory: formData.othersEntries?.[0]?.category ?? formData.othersCategory
          });
          targetCustomerId = newCust.id;
        }
      } else {
        const existing = customers.find(c => c.id === targetCustomerId);
        if (existing) {
          updateCustomer({
            ...existing,
            phone: formData.phone,
            ic: formData.ic,
            isCompany: formData.isCompany,
            vehicleRegNo: formData.vehicleRegNo,
            insuranceType: formData.insuranceType,
            othersCategory: formData.othersEntries?.[0]?.category ?? formData.othersCategory
          });
        }
      }

      if (!targetCustomerId) throw new Error("Entity link failed.");

      const amount = formData.vehicleType === 'Motor'
        ? (parseFloat(formData.amount) || 0) + serviceChargeNum
        : formData.othersEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) + serviceChargeNum;
      const othersEntriesPayload = formData.vehicleType === 'Others' && formData.othersEntries.length > 0
        ? formData.othersEntries.map(e => ({ category: e.category, amount: parseFloat(e.amount) || 0 }))
        : undefined;
      const serviceChargePayload = serviceChargeNum > 0 ? serviceChargeNum : undefined;
      addDocument({
        type: docType,
        customerId: targetCustomerId,
        customerName: formData.customerName,
        customerIc: formData.ic,
        issuedCompany: formData.issuedCompany,
        date: formData.date,
        amount,
        insuranceDetails: '',
        remarks: formData.remarks,
        ...(othersEntriesPayload && { othersEntries: othersEntriesPayload }),
        ...(serviceChargePayload !== undefined && serviceChargePayload > 0 && { serviceCharge: serviceChargePayload })
      }, attachmentFile || undefined);
      setIsPreviewOpen(false);
    } catch (error) {
      console.error("Finalization Error:", error);
      alert("Failed to finalize document. Duplicate protection triggered or connection error.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all backdrop-blur-sm";

  // Step validation
  const isStep1Valid = formData.customerName && formData.phone && (formData.isCompany || formData.ic);
  const isStep2Valid = formData.vehicleType && formData.issuedCompany && (
    formData.vehicleType === 'Others'
      ? (formData.othersEntries.length > 0 && formData.othersEntries.every(e => e.category && e.amount) && formData.vehicleRegNo)
      : (formData.insuranceType && formData.vehicleRegNo)
  );
  const isStep3Valid = formData.vehicleType === 'Motor' ? !!formData.amount : true;
  const serviceChargeNum = parseFloat(formData.serviceChargeAmount) || 0;
  const totalAmount = formData.vehicleType === 'Motor'
    ? (parseFloat(formData.amount) || 0) + serviceChargeNum
    : formData.othersEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) + serviceChargeNum;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PdfPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={finalizeDocument}
        config={config}
        data={{
          ...formData,
          amount: totalAmount,
          othersEntries: formData.vehicleType === 'Others' ? formData.othersEntries.map(e => ({ category: e.category, amount: parseFloat(e.amount) || 0 })) : undefined,
          serviceCharge: serviceChargeNum > 0 ? serviceChargeNum : undefined,
          docType
        }}
      />

      <div className="glass-card p-2 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex bg-slate-100/50 p-1 rounded-lg">
          <button 
            onClick={() => setDocType('Invoice')}
            className={`px-6 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${docType === 'Invoice' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400'}`}
          >
            Invoice
          </button>
          <button 
            onClick={() => setDocType('Receipt')}
            className={`px-6 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${docType === 'Receipt' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400'}`}
          >
            Receipt
          </button>
        </div>
        
        <div className="flex items-center gap-2 px-4">
          {[1, 2, 3].map(num => (
            <div key={num} className="flex items-center">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${step === num ? 'bg-blue-600 text-white shadow-md' : step > num ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > num ? <CheckCircle2 size={14} /> : num}
              </div>
              {num < 3 && <div className={`w-6 h-[2px] mx-1 ${step > num ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="liquid-glass p-6 lg:p-8 border-slate-200 shadow-xl">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-title text-xl text-slate-900 tracking-wide">
                  {italicizeFirstWord('Entity Linkage')}
                </h3>
                <p className="text-slate-500 text-xs mt-1">Bind this manifest to a verified client registry.</p>
              </div>
              <UserPlus className="text-slate-200" size={28} />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Lookup in client database..." 
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none backdrop-blur-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-xl overflow-hidden z-20">
                  {filteredCustomers.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left transition-colors border-b border-slate-100 last:border-none"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.name}</p>
                        <div className="flex items-center gap-3">
                           <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{c.phone}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.ic}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {duplicateWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="text-amber-500 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900 mb-1">Existing Identity Detected</p>
                  <p className="text-[10px] text-amber-700 leading-relaxed mb-3">
                    A profile with IC <span className="font-bold">{duplicateWarning.ic}</span> already exists. Link to this record to avoid duplicates?
                  </p>
                  <button 
                    onClick={useExistingCustomer}
                    className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors"
                  >
                    Link to Profile
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Client type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isCompany: false})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-xs font-bold transition-all ${!formData.isCompany ? 'border-blue-600 bg-blue-500/10 text-blue-600' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}
                  >
                    <UserPlus size={16} />
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isCompany: true})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-xs font-bold transition-all ${formData.isCompany ? 'border-blue-600 bg-blue-500/10 text-blue-600' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}
                  >
                    <Building2 size={16} />
                    Company
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Entity Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" placeholder={formData.isCompany ? 'Company name' : 'John Doe'} className={inputClass}
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value, customerId: ''})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Protocol (+60) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="+6012-3456789" className={inputClass}
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: formatPhoneNumber(e.target.value), customerId: ''})}
                  />
                </div>
                {!formData.isCompany && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Card (IC) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Fingerprint className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-200" size={16} />
                      <input 
                        type="text" placeholder="000000-00-0000" className={inputClass}
                        value={formData.ic}
                        onChange={e => setFormData({...formData, ic: formatICNumberBasic(e.target.value), customerId: ''})}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="btn-premium flex items-center gap-2 px-6 py-2 rounded-lg text-xs uppercase disabled:opacity-30"
              >
                Proceed <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
            <div className="flex items-center gap-3">
               <button onClick={() => setStep(1)} className="p-2 rounded-lg bg-slate-100/50 text-slate-500 hover:text-blue-600 transition-colors">
                  <ArrowLeft size={16} />
               </button>
               <h3 className="font-title text-xl text-slate-900 tracking-wide">
                 {italicizeFirstWord('Asset Classification')}
               </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Class <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => { setFormData({...formData, vehicleType: 'Motor', othersEntries: []}); setAttachmentFile(null); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${formData.vehicleType === 'Motor' ? 'border-blue-600 bg-blue-500/10 text-blue-600' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}
                    >
                      <Car size={24} />
                      <span className="text-[9px] font-bold uppercase">Motor</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        vehicleType: 'Others',
                        othersEntries: formData.othersEntries.length ? formData.othersEntries : [{ category: 'Public Liability', amount: '' }]
                      })}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${formData.vehicleType === 'Others' ? 'border-blue-600 bg-blue-500/10 text-blue-600' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}
                    >
                      <Briefcase size={24} />
                      <span className="text-[9px] font-bold uppercase">Others</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Issued Company <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select 
                      className={`${inputClass} pl-9 appearance-none`}
                      value={formData.issuedCompany}
                      onChange={e => setFormData({...formData, issuedCompany: e.target.value})}
                    >
                      <option value="">Select Provider...</option>
                      {INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {formData.vehicleType === 'Motor' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Policy Type <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                          className={`${inputClass} pl-9 appearance-none`}
                          value={formData.insuranceType}
                          onChange={e => setFormData({...formData, insuranceType: e.target.value as InsuranceType})}
                        >
                          {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plate Reference <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="text" placeholder="XYZ-1234" className={`${inputClass} pl-9 uppercase tracking-widest`}
                          value={formData.vehicleRegNo}
                          onChange={e => setFormData({...formData, vehicleRegNo: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>
                  </>
                )}
                {formData.vehicleType === 'Others' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="text" placeholder="Project name" className={`${inputClass} pl-9 uppercase`}
                          value={formData.vehicleRegNo}
                          onChange={e => setFormData({...formData, vehicleRegNo: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categories & amount (RM) <span className="text-red-500">*</span></label>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, othersEntries: [...formData.othersEntries, { category: 'Public Liability', amount: '' }]})}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-200"
                        >
                          <Plus size={12} /> Add category
                        </button>
                      </div>
                      {formData.othersEntries.map((entry, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                            className={`${inputClass} flex-1 pl-3 appearance-none`}
                            value={entry.category}
                            onChange={e => {
                              const next = [...formData.othersEntries];
                              next[idx] = { ...next[idx], category: e.target.value as OthersCategory };
                              setFormData({...formData, othersEntries: next});
                            }}
                          >
                            {OTHERS_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <div className="relative w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">RM</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              className={`${inputClass} pl-8 text-xs`}
                              value={entry.amount}
                              onChange={e => {
                                const next = [...formData.othersEntries];
                                next[idx] = { ...next[idx], amount: e.target.value };
                                setFormData({...formData, othersEntries: next});
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, othersEntries: formData.othersEntries.filter((_, i) => i !== idx)})}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 pt-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText size={12} /> Attach contract PDF <span className="text-slate-300 font-normal">(optional)</span>
                      </label>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div
                          className={`flex items-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed text-xs font-medium transition-colors cursor-pointer min-w-[200px] ${
                            isDraggingPdf
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : attachmentFile
                                ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                          onDragOver={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingPdf(true);
                          }}
                          onDragLeave={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingPdf(false);
                          }}
                          onDrop={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingPdf(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type === 'application/pdf') setAttachmentFile(file);
                          }}
                        >
                          <label className="flex items-center gap-2 cursor-pointer w-full">
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0];
                                setAttachmentFile(f || null);
                                e.target.value = '';
                              }}
                            />
                            {attachmentFile ? 'Change file' : (isDraggingPdf ? 'Drop PDF here' : 'Choose or drag PDF here')}
                          </label>
                        </div>
                        {attachmentFile && (
                          <>
                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[200px]" title={attachmentFile.name}>
                              {attachmentFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const url = URL.createObjectURL(attachmentFile);
                                setContractPreviewUrl(url);
                              }}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                              title="Preview PDF"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttachmentFile(null)}
                              className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-blue-600 font-bold text-[10px] uppercase">Retreat</button>
              <button 
                onClick={() => setStep(3)}
                disabled={!isStep2Valid}
                className="btn-premium px-6 py-2 rounded-lg text-xs uppercase flex items-center gap-2 disabled:opacity-30"
              >
                Assemble <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-100 pb-4 gap-4">
              <div>
                <h3 className="font-title text-xl text-slate-900 tracking-wide">
                  {italicizeFirstWord('Fiscal Assembly')}
                </h3>
                <p className="text-slate-500 text-xs mt-1">Bind final value for <span className="text-blue-600 font-bold">{formData.customerName}</span>.</p>
              </div>
              <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase">{formData.vehicleRegNo || 'PENDING'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {formData.vehicleType === 'Motor' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount (RM) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-title text-2xl opacity-40">RM</span>
                    <input 
                      type="number" step="0.01" required placeholder="0.00"
                      className="w-full pl-16 pr-4 py-6 bg-blue-500/5 border-2 border-blue-100 rounded-xl text-4xl md:text-5xl font-title text-blue-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-inner leading-none"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
              )}
              {formData.vehicleType === 'Others' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category amounts (from step 2)</label>
                  <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {formData.othersEntries.map((e, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{e.category}</span>
                        <span>RM {(parseFloat(e.amount) || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Service charge <span className="text-slate-300 font-normal">(optional)</span></label>
                <div className="relative max-w-[140px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">RM</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                    value={formData.serviceChargeAmount}
                    onChange={e => setFormData({...formData, serviceChargeAmount: e.target.value})}
                  />
                </div>
                <p className="text-sm font-bold text-blue-600 pt-1 border-t border-slate-200/80 mt-2">Total: RM {totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button type="button" onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase">Re-Asset</button>
              <button 
                onClick={() => setIsPreviewOpen(true)}
                disabled={isFinalizing || !isStep3Valid}
                className="btn-premium flex items-center gap-2 px-10 py-3 rounded-xl font-bold shadow-md text-xs uppercase disabled:opacity-50"
              >
                {isFinalizing ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />}
                Preview & Finalize
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contract PDF preview popup (draft) */}
      {contractPreviewUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contract PDF reference</p>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(contractPreviewUrl);
                  setContractPreviewUrl(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <iframe
              src={contractPreviewUrl}
              title="Contract PDF preview"
              className="flex-1 w-full min-h-0 border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCreator;