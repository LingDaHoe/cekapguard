import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  FileText, 
  Receipt, 
  ExternalLink,
  Fingerprint,
  Banknote,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Document, SystemConfig, User, Customer } from '../types';
import { italicizeFirstWord } from '../App';
import PdfPreviewModal from './PdfPreviewModal';

interface ListProps {
  documents: Document[];
  customers: Customer[];
  config: SystemConfig;
  currentUser: User;
  onMarkInvoicePaid?: (invoice: Document) => Promise<void>;
}

const DocumentList: React.FC<ListProps> = ({ documents, customers, config, currentUser, onMarkInvoicePaid }) => {
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [invoicesMinimized, setInvoicesMinimized] = useState(false);

  const hasAnyInvoices = documents.some(d => d.type === 'Invoice');

  const getCustomerByDoc = (doc: Document) => customers.find(c => c.id === doc.customerId);

  const baseFilter = (doc: Document) => {
    const matchesSearch =
      doc.customerName.toLowerCase().includes(search.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      (doc.customerIc && doc.customerIc.includes(search));
    const matchesStaff = currentUser.role === 'Owner' || doc.staffId === currentUser.id;
    return matchesSearch && matchesStaff;
  };

  const filteredInvoices = documents.filter(doc => doc.type === 'Invoice' && baseFilter(doc));
  const filteredReceipts = documents.filter(doc => doc.type === 'Receipt' && baseFilter(doc));

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleMarkPaid = async (invoice: Document) => {
    if (!onMarkInvoicePaid || invoice.paidAt) return;
    setPayingId(invoice.id);
    try {
      await onMarkInvoicePaid(invoice);
    } catch (e) {
      console.error('Mark paid failed', e);
      alert('Failed to mark invoice as paid. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  const exportCSV = (type: 'Invoice' | 'Receipt', rows: Document[]) => {
    const headers = ['Doc Number', 'Type', 'Customer', 'IC Number', 'Date', 'Amount', 'Staff'];
    const data = rows.map(d => [d.docNumber, d.type, d.customerName, d.customerIc, d.date, d.amount, d.staffName]);
    const csvContent = [headers, ...data].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${type.toLowerCase()}_records_${new Date().toISOString().split('T')[0]}.csv`;
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
              isCompany: customer?.isCompany,
              vehicleType: customer?.vehicleType ?? 'Motor',
              vehicleRegNo: customer?.vehicleRegNo ?? '',
              insuranceType: customer?.insuranceType ?? 'Comprehensive',
              othersCategory: previewDoc.othersCategory ?? customer?.othersCategory,
              othersEntries: previewDoc.othersEntries,
              issuedCompany: previewDoc.issuedCompany,
              amount: previewDoc.amount,
              serviceCharge: previewDoc.serviceCharge,
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
            type="text"
            placeholder="Search vault (ID, Name, IC)..."
            className="w-full pl-9 pr-4 py-2 bg-white/40 backdrop-blur-md border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices section – only show when there is invoice data */}
      {hasAnyInvoices && (
      <div className="glass-card border border-blue-200 rounded-xl overflow-hidden shadow-sm bg-white/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-blue-50/50">
          <h3 className="font-title text-lg text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            <span className="text-blue-600 italic font-medium">Invoices</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInvoicesMinimized(v => !v)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
              title={invoicesMinimized ? 'Expand section' : 'Minimize section'}
              aria-label={invoicesMinimized ? 'Expand' : 'Minimize'}
            >
              {invoicesMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
            <button
              onClick={() => exportCSV('Invoice', filteredInvoices)}
              disabled={filteredInvoices.length === 0}
              className="btn-premium flex items-center gap-2 px-4 py-2 rounded-lg text-xs disabled:opacity-50"
            >
              <Download size={14} /> Export Invoices
            </button>
          </div>
        </div>
        {!invoicesMinimized && (
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
              {filteredInvoices.map((doc) => (
                <tr key={doc.id} className={`transition-colors group ${doc.paidAt ? 'bg-emerald-50/50' : 'hover:bg-white/40'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                        <FileText size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-none mb-1">{doc.docNumber}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">Invoice</span>
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
                    <div className="flex justify-center items-center gap-2 flex-wrap">
                      <button onClick={() => handlePreview(doc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded transition-colors" title="View Document">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded transition-colors">
                        <ExternalLink size={14} />
                      </button>
                      {doc.paidAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle size={12} /> Paid{doc.receiptDocNumber ? ` (${doc.receiptDocNumber})` : ''}
                        </span>
                      ) : onMarkInvoicePaid ? (
                        <button
                          onClick={() => handleMarkPaid(doc)}
                          disabled={payingId === doc.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                          title="Customer paid – create receipt and mark as paid"
                        >
                          {payingId === doc.id ? <Loader2 size={12} className="animate-spin" /> : <Banknote size={12} />}
                          Pay
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-300 font-title text-lg uppercase opacity-50">No invoices</p>
              <p className="text-slate-400 text-xs mt-1">No invoice records match the search.</p>
            </div>
          )}
        </div>
        )}
      </div>
      )}

      {/* Receipts section – audit: receipts only */}
      <div className="glass-card border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-title text-lg text-slate-900 flex items-center gap-2">
            <Receipt size={20} className="text-slate-600" />
            <span className="text-slate-700 italic font-medium">Receipts</span>
          </h3>
          <button
            onClick={() => exportCSV('Receipt', filteredReceipts)}
            disabled={filteredReceipts.length === 0}
            className="btn-premium flex items-center gap-2 px-4 py-2 rounded-lg text-xs disabled:opacity-50"
          >
            <Download size={14} /> Export Receipts
          </button>
        </div>
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
              {filteredReceipts.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                        <Receipt size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-none mb-1">{doc.docNumber}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Receipt</span>
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
                      <button onClick={() => handlePreview(doc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded transition-colors" title="View Document">
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
          {filteredReceipts.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-300 font-title text-lg uppercase opacity-50">No receipts</p>
              <p className="text-slate-400 text-xs mt-1">No receipt records match the search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentList;