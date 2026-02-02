import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  History, 
  PlusCircle, 
  Menu,
  X, 
  ShieldCheck,
  Bell,
  LogOut,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { 
  Customer, 
  Document, 
  ActivityLog, 
  SystemConfig, 
  User
} from './types';
import { INITIAL_CONFIG } from './constants';
import Dashboard from './components/Dashboard';
import DocumentCreator from './components/DocumentCreator';
import DocumentList from './components/DocumentList';
import CustomerManagement from './components/CustomerManagement';
import AdminSettings from './components/AdminSettings';
import ActivityLogs from './components/ActivityLogs';
import StaffManagement from './components/StaffManagement';
import AuthPage from './components/AuthPage';
import { BackgroundGradientAnimation } from './components/ui/background-gradient-animation';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  setDoc, 
  doc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const italicizeFirstWord = (text: string) => {
  if (!text) return '';
  const words = text.split(' ');
  return (
    <>
      <span className="italic font-medium mr-1.5 opacity-80">{words[0]}</span>
      {words.slice(1).join(' ')}
    </>
  );
};

const App: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email?.toLowerCase() || '';
        const isOwner = email.includes('owner');
        
        // Security Check: If not owner, must exist in staff collection
        if (!isOwner) {
          const staffRef = collection(db, "staff");
          const q = query(staffRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            console.error("Access Revoked: Not found in staff registry.");
            await signOut(auth);
            setFirebaseUser(null);
            setCurrentUser(null);
            setAuthChecking(false);
            return;
          }
        }

        setFirebaseUser(user);
        const userData: User = {
          id: user.uid,
          name: user.email?.split('@')[0] || 'Unknown User',
          role: isOwner ? 'Owner' : 'Staff'
        };
        setCurrentUser(userData);
      } else {
        setFirebaseUser(null);
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const handleError = (err: any) => {
      console.error("Firestore Sync Error:", err);
      if (err.code === 'permission-denied') {
        setConnectionError("Access Denied or Session Expired.");
      } else {
        setConnectionError(err.message);
      }
    };

    const configRef = doc(db, "settings", "config");
    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as SystemConfig);
      } else {
        setDoc(configRef, INITIAL_CONFIG).catch(handleError);
      }
    }, handleError);

    const customersRef = collection(db, "customers");
    const unsubCustomers = onSnapshot(customersRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
      setCustomers(data);
      setConnectionError(null);
    }, handleError);

    const docsRef = query(collection(db, "documents"), orderBy("date", "desc"));
    const unsubDocs = onSnapshot(docsRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Document));
      setDocuments(data);
    }, handleError);

    const logsRef = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog));
      setLogs(data);
    }, handleError);

    return () => {
      unsubConfig();
      unsubCustomers();
      unsubDocs();
      unsubLogs();
    };
  }, [firebaseUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const addDocument = async (docData: Omit<Document, 'id' | 'docNumber' | 'staffId' | 'staffName'>) => {
    if (!currentUser) return;
    
    if (!docData.customerId) return;

    const prefix = docData.type === 'Invoice' ? config.invoicePrefix : config.receiptPrefix;
    const docNumber = `${prefix}${Date.now().toString().slice(-6)}`;
    
    const newDoc = {
      ...docData,
      docNumber,
      staffId: currentUser.id,
      staffName: currentUser.name
    };

    try {
      await addDoc(collection(db, "documents"), newDoc);
      await addDoc(collection(db, "logs"), {
        timestamp: new Date().toISOString(),
        staffName: currentUser.name,
        action: `Created ${docData.type}`,
        docId: docNumber
      });
      setActiveTab('documents');
    } catch (e) {
      console.error("Error adding document", e);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'lastUpdated'>): Promise<Customer> => {
    const newCustomer = {
      ...customerData,
      lastUpdated: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, "customers"), newCustomer);
      return { ...newCustomer, id: docRef.id } as Customer;
    } catch (e) {
      console.error("Error adding customer", e);
      throw e;
    }
  };

  const updateCustomer = async (updated: Customer) => {
    const { id, ...data } = updated;
    try {
      await setDoc(doc(db, "customers", id), {
        ...data,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Error updating customer", e);
    }
  };

  const handleUpdateConfig = async (newConfig: SystemConfig) => {
    try {
      await setDoc(doc(db, "settings", "config"), newConfig);
    } catch (e) {
      console.error("Error updating config", e);
    }
  };

  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'create', label: 'Draft Document', icon: PlusCircle },
        { id: 'documents', label: 'Vault Records', icon: FileText },
      ]
    },
    {
      title: 'Registry',
      items: [
        { id: 'customers', label: 'Client Registry', icon: Users },
      ]
    },
    ...(currentUser?.role === 'Owner' ? [{
      title: 'Administration',
      items: [
        { id: 'staff', label: 'Staff Registry', icon: ShieldAlert },
        { id: 'logs', label: 'System Audit', icon: History },
        { id: 'settings', label: 'Core Prefs', icon: Settings },
      ]
    }] : []),
  ];

  const getActiveLabel = () => {
    for (const group of menuGroups) {
      const item = group.items.find(i => i.id === activeTab);
      if (item) return item.label;
    }
    return '';
  };

  if (authChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-blue-600 animate-spin" size={40} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-poppins">Synchronizing Protocols...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <BackgroundGradientAnimation 
        containerClassName="opacity-100"
        gradientBackgroundStart="rgb(248, 250, 252)" 
        gradientBackgroundEnd="rgb(226, 232, 240)"
        firstColor="186, 230, 253"
        secondColor="191, 219, 254"
        thirdColor="219, 234, 254"
        fourthColor="224, 242, 254"
        fifthColor="241, 245, 249"
        pointerColor="37, 99, 235"
      />

      <aside 
        className={`bg-white/80 backdrop-blur-xl border-r border-slate-200 transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'w-60' : 'w-20'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <ShieldCheck size={20} />
            </div>
            {isSidebarOpen && (
              <span className="font-title text-xl text-slate-900 tracking-tight whitespace-nowrap">
                <span className="text-blue-600 font-bold italic mr-1">Cekap</span>Guard
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              {isSidebarOpen && (
                <p className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] font-poppins">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                      activeTab === item.id 
                        ? 'sidebar-active text-white shadow-md shadow-blue-500/10' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {isSidebarOpen && (
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {italicizeFirstWord(item.label)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4 shrink-0">
          <div className={`flex items-center gap-3 ${isSidebarOpen ? 'px-2' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-blue-600 font-bold border border-slate-200 text-xs">
              {currentUser.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentUser.role}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleSignOut}
              className={`h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-md ${isSidebarOpen ? 'flex-1' : 'w-full'}`}
              title="Terminate Session"
            >
              <LogOut size={16} />
              {isSidebarOpen && <span className="text-[10px] font-bold uppercase ml-2">Sign Out</span>}
            </button>
            {isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all rounded-md"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all rounded-md"
            >
              <Menu size={16} />
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {connectionError && (
          <div className="bg-amber-600 text-white px-6 py-2 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 z-[60]">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{connectionError}</p>
            </div>
            <a 
              href="https://console.firebase.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-[9px] font-bold uppercase flex items-center gap-2 transition-colors"
            >
              Open Console <ExternalLink size={12} />
            </a>
          </div>
        )}

        <header className="h-16 bg-white/40 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0 z-40">
          <div>
            <h1 className="font-title text-2xl text-slate-900 tracking-tight">
              {italicizeFirstWord(getActiveLabel())}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
               <Bell size={18} />
            </button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none mb-0.5">{currentUser.name}</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <Dashboard 
                documents={documents} 
                customers={customers} 
                onActionClick={(tab) => setActiveTab(tab)} 
              />
            )}
            {activeTab === 'create' && (
              <DocumentCreator 
                customers={customers}
                addCustomer={addCustomer}
                updateCustomer={updateCustomer}
                addDocument={addDocument}
                config={config}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentList 
                documents={documents} 
                customers={customers}
                config={config} 
                currentUser={currentUser}
              />
            )}
            {activeTab === 'customers' && (
              <CustomerManagement 
                customers={customers} 
                updateCustomer={updateCustomer} 
              />
            )}
            {activeTab === 'staff' && currentUser.role === 'Owner' && (
              <StaffManagement />
            )}
            {activeTab === 'logs' && currentUser.role === 'Owner' && (
              <ActivityLogs logs={logs} />
            )}
            {activeTab === 'settings' && currentUser.role === 'Owner' && (
              <AdminSettings config={config} setConfig={handleUpdateConfig} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;