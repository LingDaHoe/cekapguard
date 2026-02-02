import React, { useRef, useState, useEffect } from 'react';
import { X, Download, ShieldCheck, Mail, Phone, MapPin, Loader2, CheckCircle, Fingerprint, Building2 } from 'lucide-react';
import { SystemConfig, DocType, VehicleType, InsuranceType } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import cekapurusLogo from '../assets/cekapurus.png';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  isViewOnly?: boolean;
  data: {
    customerName: string;
    phone: string;
    ic: string;
    email: string;
    vehicleType: VehicleType;
    vehicleRegNo: string;
    insuranceType: InsuranceType;
    issuedCompany: string;
    amount: string | number;
    date: string;
    insuranceDetails: string;
    remarks?: string;
    docType: DocType;
    docNumber?: string;
  };
  config: SystemConfig;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose, onConfirm, isViewOnly = false, data, config }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Embed logo as data URL so saved PDF always uses our PNG, not a link
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setLogoDataUrl(c.toDataURL('image/png'));
        }
      } catch {
        setLogoDataUrl(cekapurusLogo);
      }
    };
    img.onerror = () => setLogoDataUrl(cekapurusLogo);
    img.src = cekapurusLogo;
  }, []);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    
    try {
      const scrollContainer = pdfRef.current.parentElement;
      if (scrollContainer) scrollContainer.scrollTop = 0;

      const element = pdfRef.current;
      const logoToEmbed = logoDataUrl || cekapurusLogo;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 800,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('pdf-capture-area');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.borderRadius = '0';
            const logoImg = el.querySelector('img[alt="Logo"]') as HTMLImageElement | null;
            if (logoImg && logoToEmbed) logoImg.src = logoToEmbed;
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${data.docType}_${data.docNumber || 'DRAFT'}_${data.customerName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const amountValue = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
  const safeAmount = isNaN(amountValue) ? 0 : amountValue;
  const formattedAmount = safeAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300 font-poppins">
      <div className="bg-slate-50 w-full max-w-5xl h-[96vh] flex flex-col overflow-hidden rounded-[32px] shadow-2xl border border-white/20">
        
        {/* Modal Header (Non-PDF UI) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 relative z-[110]">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-title text-lg text-slate-900 leading-none uppercase">
                {isViewOnly ? 'View' : 'Review'} {data.docType}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {data.docNumber || 'Draft Manifest'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 uppercase tracking-widest shadow-md"
            >
              {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
              {isExporting ? 'Processing' : 'Export PDF'}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/50 custom-scrollbar">
          <div 
            id="pdf-capture-area"
            ref={pdfRef}
            className="bg-white mx-auto w-full max-w-[800px] min-h-[1130px] p-[15mm] font-poppins text-slate-800 flex flex-col relative"
            style={{ boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact' }}
          >
            {/* LARGE CENTRAL WATERMARK */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none z-0">
               <span className="text-[140px] font-bold uppercase tracking-[3rem] rotate-[-45deg] whitespace-nowrap">
                 {data.docType}
               </span>
            </div>

            {/* Document Header */}
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 shadow-sm overflow-hidden">
                   <img src={logoDataUrl || cekapurusLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-blue-700 leading-tight">{config.companyName}</h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Certified Insurance Protocol</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-bold uppercase text-slate-100 leading-none mb-4">{data.docType}</h2>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
                  <p>DATE: <span className="text-slate-900">{new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span></p>
                  <p>ID: <span className="text-blue-600">{data.docNumber || 'DRAFT-638758'}</span></p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-10 mb-8 border-t border-slate-100 pt-8 relative z-10">
              <div className="border-l-4 border-blue-600 pl-5">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Issuing Provider</h3>
                <div className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                  <p className="flex items-start gap-3">
                    <div className="w-4 shrink-0 flex justify-center"><MapPin size={10} className="text-blue-500 mt-0.5" /></div>
                    <span>{config.address}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <div className="w-4 shrink-0 flex justify-center"><Phone size={10} className="text-blue-500" /></div>
                    <span>{config.contact}</span>
                  </p>
                </div>
              </div>
              <div className="border-l-4 border-slate-900 pl-5">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Insured Entity</h3>
                <div className="space-y-2 text-xs">
                  <p className="text-lg font-bold text-slate-900 leading-none mb-2">{data.customerName}</p>
                  <p className="flex items-center gap-3 text-slate-500 font-bold uppercase text-[9px] leading-none">
                    <div className="w-4 shrink-0 flex justify-center"><Fingerprint size={10} className="text-blue-500" /></div>
                    <span>IC NO: {data.ic}</span>
                  </p>
                  <p className="flex items-center gap-3 text-slate-500 font-medium leading-none">
                    <div className="w-4 shrink-0 flex justify-center"><Phone size={10} className="text-blue-500" /></div>
                    <span>{data.phone}</span>
                  </p>
                  {data.vehicleRegNo && (
                    <p className="flex items-center gap-3 text-slate-500 font-medium leading-none">
                      <span className="text-[9px] font-bold uppercase text-slate-400">{data.vehicleType === 'Contractor' ? 'Project:' : 'Plate:'}</span>
                      <span className="font-bold tracking-wide">{data.vehicleRegNo}</span>
                    </p>
                  )}
                  {data.email && (
                    <p className="flex items-center gap-3 text-slate-500 font-medium leading-none">
                      <div className="w-4 shrink-0 flex justify-center"><Mail size={10} className="text-blue-500" /></div>
                      <span className="truncate">{data.email}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Coverage Box - light blue */}
            <div className="bg-blue-100 border border-blue-200 text-slate-900 rounded-2xl p-6 mb-8 shadow-lg relative z-10">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-200/80 rounded-xl flex items-center justify-center border border-blue-200">
                    <ShieldCheck size={24} className="text-blue-700" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mb-1">Coverage Classification</p>
                    <p className="text-sm font-bold">
                      {data.vehicleType === 'Motor' ? 'Motor Insurance Policy' : 'Project Insurance Policy'}
                      {data.vehicleType === 'Motor' && data.insuranceType && ` • ${data.insuranceType}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                    {data.vehicleType === 'Contractor' ? 'Project Name' : 'Registration Mark'}
                  </p>
                  <p className="text-2xl font-bold tracking-[0.2em] text-slate-900">{data.vehicleRegNo}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200 flex items-center gap-2">
                 <Building2 size={12} className="text-blue-600" />
                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Issued by: <span className="text-slate-900 ml-1 font-bold">{data.issuedCompany}</span></p>
              </div>
            </div>

            {/* Table Area */}
            <div className="mb-6 relative z-10">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Policy Particulars</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Net Premium (RM)</span>
              </div>
              
              <div className="flex justify-between gap-10 py-1">
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm mb-3">{data.vehicleType === 'Contractor' ? 'Project Insurance' : `${data.insuranceType} Protection Scheme`}</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-600 leading-relaxed italic">
                    {data.insuranceDetails || 'Standardized insurance protocol application in accordance with registered manifest requirements.'}
                  </div>
                  {data.remarks && (
                    <div className="mt-3">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
                      <p className="text-[9px] text-slate-500 italic">{data.remarks}</p>
                    </div>
                  )}
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-2xl font-bold text-blue-700">{formattedAmount}</p>
                </div>
              </div>
            </div>

            {/* Footer and Totals */}
            <div className="mt-auto pt-6 border-t border-slate-200 relative z-10">
              <div className="flex justify-between items-start gap-10">
                <div className="flex-1 max-w-md">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2">Protocol Disclosures</p>
                  <p className="text-[9px] text-slate-500 italic leading-relaxed mb-6">{config.footerNotes}</p>
                  
                  <div className="flex gap-10 mt-2">
                    <div className="flex-1">
                      <div className="border-b border-slate-300 h-10"></div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase text-center mt-2">Authorized Officer</p>
                    </div>
                    <div className="flex-1">
                      <div className="border-b border-slate-300 h-10"></div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase text-center mt-2">Client Signature</p>
                    </div>
                  </div>
                </div>

                {/* Amount Box */}
                <div className="bg-blue-600 p-6 rounded-2xl min-w-[220px] shadow-xl text-white">
                  <p className="text-[8px] font-bold uppercase tracking-widest mb-3 opacity-90">Total Consideration</p>
                  <div className="flex items-baseline justify-end gap-2">
                    <span className="text-sm font-bold opacity-80">RM</span>
                    <span className="text-4xl font-bold tracking-tight text-white block leading-none">
                      {formattedAmount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center opacity-20">
                <p className="text-[7px] font-bold uppercase tracking-[0.5em]">DIGITAL_PROTOCOL_VERIFICATION_TAG_ARCHIVE</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 relative z-[110]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
            Verify all manifest parameters before final issuance.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 uppercase tracking-widest transition-all"
            >
              {isViewOnly ? 'Close' : 'Return to Draft'}
            </button>
            {!isViewOnly && onConfirm && (
              <button 
                onClick={onConfirm}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md"
              >
                Issue Document
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;