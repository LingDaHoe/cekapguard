import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  UserPlus, 
  Mail, 
  User, 
  Trash2, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { db, firebaseConfig } from '../services/firebase';
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot,
  deleteDoc,
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { italicizeFirstWord } from '../App';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  addedAt: string;
}

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const q = query(collection(db, "staff"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as StaffMember));
      setStaff(data);
      setLoading(false);
    }, (err) => {
      console.error("Staff fetch error:", err);
      setError("Database connection interrupted.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');

    let secondaryApp;
    try {
      const emailLower = formData.email.toLowerCase().trim();
      
      // Check local list first for faster feedback
      if (staff.some(s => s.email.toLowerCase() === emailLower)) {
        throw new Error("This account already exists.");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      // Step 1: Create the actual Auth Account using a secondary app instance
      secondaryApp = initializeApp(firebaseConfig, "StaffProvisioner");
      const secondaryAuth = getAuth(secondaryApp);
      
      try {
        await createUserWithEmailAndPassword(secondaryAuth, emailLower, formData.password);
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error("This account already exists.");
        }
        throw authErr;
      }

      // Step 2: Add to Firestore Registry
      await addDoc(collection(db, "staff"), {
        name: formData.name,
        email: emailLower,
        role: 'Staff',
        addedAt: new Date().toISOString()
      });

      setSuccess(`Identity for ${formData.name} successfully registered.`);
      setFormData({ name: '', email: '', password: '' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error("Provisioning Error:", err);
      setError(err.message || "Failed to create staff account.");
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setAdding(false);
    }
  };

  const initiateDelete = (id: string) => {
    setConfirmDeleteId(id);
    setError('');
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    setError('');
    
    try {
      // Correctly target the specific document in the 'staff' collection by its ID
      const staffDocRef = doc(db, "staff", id);
      await deleteDoc(staffDocRef);
      
      setSuccess("Access revoked. Records successfully purged from database.");
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error("Database Deletion Error:", err);
      setError("Failed to remove from database. Please check your internet or permissions.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 font-poppins">
      <div className="glass-card p-8 lg:p-10 rounded-3xl shadow-sm bg-white/50 border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-105">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="font-title text-4xl text-slate-900 tracking-tight">
                {italicizeFirstWord('Staff Registry')}
              </h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Authorized Personnel Directory</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Registration Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-inner">
               <div className="flex items-center gap-2 mb-6">
                 <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                   <UserPlus size={16} />
                 </div>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Register Identity</h4>
               </div>

               <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                      <input 
                        type="text" required placeholder="Full Name"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                      <input 
                        type="email" required placeholder="staff@cekapguard.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Secret</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                      <input 
                        type={showPass ? "text" : "password"} required placeholder="Min 6 characters"
                        className="w-full pl-9 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 animate-in slide-in-from-top-1">
                       <AlertCircle size={14} className="shrink-0" /> {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 animate-in slide-in-from-top-1">
                       <CheckCircle size={14} className="shrink-0" /> {success}
                    </div>
                  )}

                  <button 
                    type="submit" disabled={adding}
                    className="w-full btn-premium py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-50"
                  >
                    {adding ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                    Provision Identity
                  </button>
               </form>
               
               <div className="mt-6 p-4 bg-slate-100 rounded-xl border border-slate-200">
                 <p className="text-[9px] text-slate-500 leading-relaxed text-center font-bold uppercase tracking-widest opacity-60">
                   System Protocol
                 </p>
                 <p className="mt-2 text-[9px] text-slate-400 leading-relaxed text-center font-medium">
                   Account creation is instantaneous. Staff may log in immediately using the credentials specified above.
                 </p>
               </div>
            </div>
          </div>

          {/* Staff List */}
          <div className="lg:col-span-3">
             <div className="space-y-3">
               {loading ? (
                 <div className="py-20 flex flex-col items-center gap-4">
                   <Loader2 className="animate-spin text-blue-600" size={32} />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Registry...</p>
                 </div>
               ) : staff.map((member) => (
                 <div 
                   key={member.id} 
                   className={`flex items-center justify-between p-4 bg-white border rounded-2xl transition-all group relative overflow-hidden ${
                     confirmDeleteId === member.id ? 'border-red-200 bg-red-50/30' : 'border-slate-100 shadow-sm hover:border-blue-200'
                   }`}
                 >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                        confirmDeleteId === member.id ? 'bg-red-100 text-red-600' : 'bg-slate-50 border border-slate-200 text-blue-600'
                      }`}>
                        {deletingId === member.id ? <Loader2 className="animate-spin" size={16} /> : member.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`text-sm font-bold leading-none mb-1 transition-colors ${confirmDeleteId === member.id ? 'text-red-700' : 'text-slate-900'}`}>
                          {member.name}
                        </p>
                        <div className="flex items-center gap-3">
                           <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                             <Mail size={10} className="text-blue-400" /> {member.email}
                           </p>
                           <span className={`text-[8px] px-2 py-0.5 font-bold rounded uppercase tracking-wider ${
                             confirmDeleteId === member.id ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                           }`}>
                             {member.role}
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
                      {confirmDeleteId === member.id ? (
                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                           <button 
                            onClick={() => executeDelete(member.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 shadow-sm"
                          >
                            Revoke?
                          </button>
                          <button 
                            onClick={cancelDelete}
                            className="p-1.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => initiateDelete(member.id)}
                          disabled={deletingId !== null}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Revoke Access"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    {/* Background Progress bar for deletion */}
                    {deletingId === member.id && (
                      <div className="absolute bottom-0 left-0 h-1 bg-red-600 animate-progress w-full"></div>
                    )}
                 </div>
               ))}

               {staff.length === 0 && !loading && (
                 <div className="py-20 text-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                    <User size={32} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Personnel Authenticated</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 p-8 rounded-[32px] text-white shadow-xl shadow-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
        <div className="flex items-center gap-4 relative z-10 text-center sm:text-left">
           <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
             <ShieldCheck size={28} />
           </div>
           <div>
              <h4 className="font-title text-xl leading-none mb-1">Database Sync</h4>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Security Registry Oversight</p>
           </div>
        </div>
        <p className="text-[10px] font-semibold text-blue-100 max-w-sm text-center sm:text-right relative z-10 leading-relaxed italic opacity-80">
          "Removing a staff entry terminates their database connectivity immediately. All records are purged from the live registry."
        </p>
      </div>
    </div>
  );
};

export default StaffManagement;