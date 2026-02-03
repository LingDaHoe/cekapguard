import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  FileText, 
  Receipt, 
  ExternalLink,
  Filter,
  User as UserIcon,
  Fingerprint
} from 'lucide-react';
import { Document, SystemConfig, User, Customer } from '../types';
import { italicizeFirstWord } from '../App';
import PdfPreviewModal from './PdfPreviewModal';

interface ListProps {
  documents: Document[];
  customers: Customer[];
  config: SystemConfig;
  currentUser: User;
}

const DocumentList: React.FC<ListProps> = ({ documents, customers, config, currentUser }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getCustomerByDoc = (doc: Document) => customers.find(c => c.id === doc.customerId);
  
  const filtered = documents.filter(doc => {
    const matchesSearch = 
      doc.customerName.toLowerCase().includes(search.toLowerCase()) || 
      doc.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      (doc.customerIc && doc.customerIc.includes(search));
    const matchesType = filterType === 'All' || doc.type === filterType;
    const matchesStaff = currentUser.role === 'Owner' || doc.staffId === currentUser.id;
    return matchesSearch && matchesType && matchesStaff;
  });

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const exportCSV = () => {
    const headers = ['Doc Number', 'Type', 'Customer', 'IC Number', 'Date', 'Amount', 'Staff'];
    const rows = filtered.map(d => [d.docNumber, d.type, d.customerName, d.customerIc, d.date, d.amount, d.staffName]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Re-usable Modal for Viewing existing records */}
      {previewDoc && (() => {
        const customer = getCustomerByDoc(previewDoc);
        return (
          <PdfPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            isViewOnly={true}
            config={config}
            data={{
              customerName: previewDoc.customerName,
              phone: customer?.phone ?? '',
              ic: previewDoc.customerIc || 'UNSPECIFIED',
              email: customer?.email ?? '',
              vehicleType: customer?.vehicleType ?? 'Motor',
              vehicleRegNo: customer?.vehicleRegNo ?? '',
              insuranceType: customer?.insuranceType ?? 'Comprehensive',
              othersCategory: previewDoc.othersCategory ?? customer?.othersCategory,
              issuedCompany: previewDoc.issuedCompany,
              amount: previewDoc.amount,
              date: previewDoc.date,
              insuranceDetails: previewDoc.insuranceDetails,
              remarks: previewDoc.remarks,
              docType: previewDoc.type,
              docNumber: previewDoc.docNumber,
              attachmentUrl: previewDoc.attachmentUrl
            }}
          />
        );
      })()}

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" placeholder="Search manifest vault (ID, Name, IC)..."
            className="w-full pl-9 pr-4 py-2 bg-white/40 backdrop-blur-md border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center bg-white/40 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-lg gap-2 shadow-sm">
             <Filter size={14} className="text-slate-400" />
             <select 
              className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer border-none p-0"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="All">All Entities</option>
              <option value="Invoice">Invoices</option>
              <option value="Receipt">Receipts</option>
            </select>
          </div>
          <button 
            onClick={exportCSV}
            className="btn-premium flex items-center gap-2 px-4 py-2 rounded-lg text-xs"
          >
            <Download size={14} /> EXPORT
          </button>
        </div>
      </div>

      <div className="glass-card border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-200">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manifest</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issuance Entity / Identification</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Date</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Value (RM)</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${doc.type === 'Invoice' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {doc.type === 'Invoice' ? <FileText size={14} /> : <Receipt size={14} />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-none mb-1">{doc.docNumber}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${doc.type === 'Invoice' ? 'text-blue-500' : 'text-slate-400'}`}>{doc.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-slate-800 leading-none mb-1">{doc.customerName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                       <Fingerprint size={10} className="text-blue-500" /> {doc.customerIc || 'PENDING_REGISTRY'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-semibold text-slate-500">{new Date(doc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">ISSUER: {doc.staffName}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <p className="text-sm font-bold text-blue-600">RM {doc.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handlePreview(doc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded transition-colors"
                        title="View Document"
                      >
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded transition-colors">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-slate-300 font-title text-2xl uppercase opacity-50">
                {italicizeFirstWord('Registry Empty')}
              </p>
              <p className="text-slate-400 text-xs mt-1">Parameters yielded no results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentList;