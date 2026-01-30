
import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Training, 
  ModuleMaterial, 
  Page, 
  UserRole,
  QuestionType
} from './types';
import { 
  COLORS, 
  IMAGES, 
  INITIAL_TRAININGS 
} from './constants';
import { 
  FeatureItem, 
  InputField, 
  RoleCard, 
  StatCard, 
  TrackCard, 
  ActivityItem, 
  LeaderboardItem, 
  BottomNav,
  UserActionCard
} from './components/UI';
import { generateQuizQuestions } from './services/geminiService';

const MOCK_USERS: User[] = [
    { name: "Ahmad Fauzi", nip: "199001012015031001", unit: "Kanwil DKI Jakarta", phone: "08123456789", level: "Mahir", role: "Siswa", points: 1250, badges: 5, activeModuleName: "Literasi Digital ASN", activeModuleSub: "", progressPercent: 100, lastScore: 85, completedModules: 4 },
    { name: "Siti Aminah", nip: "199205122018012002", unit: "Kemenag Sleman", phone: "08198765432", level: "Menengah", role: "Siswa", points: 1100, badges: 4, activeModuleName: "Manajemen LMS Kemenag", activeModuleSub: "", progressPercent: 45, completedModules: 2 },
    { name: "Budi Santoso", nip: "198811222014021003", unit: "Kanwil Jabar", phone: "08112233445", level: "Pemula", role: "Siswa", points: 980, badges: 3, activeModuleName: "Literasi Digital ASN", activeModuleSub: "", progressPercent: 10, completedModules: 0 },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('register'); 
  const [isRegistered, setIsRegistered] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAddTrainingModal, setShowAddTrainingModal] = useState(false); 
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  // Quiz AI states
  const [selectedQuizTypes, setSelectedQuizTypes] = useState<QuestionType[]>(['Pilihan Ganda']);
  const [customQuizPrompt, setCustomQuizPrompt] = useState("");
  
  // State for all users (Mock Database)
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);

  // Registration data
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    unit: "",
    phone: "",
    level: "Pemula",
    role: "Siswa" as UserRole,
    lastTitle: ""
  });

  // Login data
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  // New content data
  const [newContent, setNewContent] = useState({
      title: "",
      type: "Video", 
      sourceMode: "link", 
      duration: "",
      fileUrl: ""
  });

  // Active user data
  const [user, setUser] = useState<User>({
    name: "",
    nip: "",
    unit: "",
    phone: "",
    level: "Pemula",
    role: "Siswa",
    points: 0,
    badges: 0,
    activeModuleName: "Belum Memilih Pelatihan",
    activeModuleSub: "Pilih pelatihan untuk memulai",
    progressPercent: 0,
    completedModules: 0,
    lastScore: 0
  });

  // Module materials state
  const [moduleMaterials, setModuleMaterials] = useState<ModuleMaterial[]>([
    { id: 1, title: "Mengapa Literasi Digital?", type: "Video (Tautan) • 8 Menit", completed: true },
    { id: 2, title: "Ujian Akhir Kompetensi", type: "Kuis (Pilihan Ganda) • 10 Soal", locked: false }
  ]);

  // Trainings list
  const [availableTrainings, setAvailableTrainings] = useState<Training[]>(
    INITIAL_TRAININGS.map(t => ({ ...t, hasCertificate: true }))
  );

  const navigateTo = (page: Page) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(page);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nip || !formData.phone) {
      alert("Mohon lengkapi Nama, NIP, dan Nomor WhatsApp Anda.");
      return;
    }
    
    const newUser: User = {
      ...user,
      name: formData.name,
      nip: formData.nip,
      unit: formData.unit || "Kementerian Agama",
      phone: formData.phone,
      level: formData.level,
      role: formData.role,
      points: 0,
      badges: 0,
      progressPercent: 0,
    };
    
    setUser(newUser);
    setAllUsers(prev => [...prev, newUser]);
    setIsRegistered(true);

    if (formData.role === 'Siswa') {
        navigateTo('choose-training');
    } else {
        navigateTo('dashboard');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      // Ensure allUsers is updated with the current state of 'user'
      setAllUsers(prev => prev.map(u => u.nip === user.nip ? { ...user } : u));
      alert("Profil berhasil diperbarui!");
  };

  const handleDeleteUser = (nip: string) => {
      if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
          setAllUsers(prev => prev.filter(u => u.nip !== nip));
      }
  };

  const handleUpdateUserRole = (nip: string, newRole: UserRole) => {
      setAllUsers(prev => prev.map(u => u.nip === nip ? { ...u, role: newRole } : u));
      if (user.nip === nip) {
          setUser(prev => ({ ...prev, role: newRole }));
      }
  };

  const handleResetPassword = (name: string) => {
      alert(`Password untuk user ${name} telah direset ke default (HISAN123)`);
  };

  const handleSelectTraining = (training: Training) => {
      const updatedUser = {
          ...user,
          activeModuleName: training.title,
          activeModuleSub: "Mulai perjalanan belajar Anda sekarang.",
          progressPercent: 0,
          lastScore: 0
      };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.nip === user.nip ? updatedUser : u));
      navigateTo('dashboard');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginData.username === 'admin' && loginData.password === 'Admin1234') {
        const adminUser: User = {
            ...user,
            name: "Administrator Utama",
            nip: "ADMIN-HISAN-001",
            unit: "Pusat Data & Informasi Kemenag",
            points: 9999,
            badges: 99,
            progressPercent: 100,
            role: "Admin",
            activeModuleName: "Manajemen Platform HISAN"
          };
          setUser(adminUser);
          setIsRegistered(true);
          navigateTo('dashboard');
          return;
    }

    if (!loginData.username) {
      alert("Mohon masukkan Nama Pengguna.");
      return;
    }

    const matchedUser = allUsers.find(u => u.name.toLowerCase().includes(loginData.username.toLowerCase()));
    if (matchedUser) {
        setUser({ ...matchedUser });
    } else {
        const defaultUser: User = {
          ...user,
          name: loginData.username,
          nip: "19880101XXXXXXXX",
          unit: "Satker Kementerian Agama",
          points: 2450,
          badges: 12,
          progressPercent: 65,
          role: "Siswa",
          activeModuleName: "Literasi Digital ASN"
        };
        setUser(defaultUser);
        setAllUsers(prev => [...prev, defaultUser]);
    }
    setIsRegistered(true);
    navigateTo('dashboard');
  };

  const handleAddTraining = () => {
    if (!formData.lastTitle) return;
    const newTraining: Training = {
      id: Date.now(),
      title: formData.lastTitle,
      desc: "Baru ditambahkan oleh Administrator.",
      students: 0,
      img: IMAGES.headerPaths,
      hasCertificate: true
    };
    setAvailableTrainings([newTraining, ...availableTrainings]);
    setShowAddTrainingModal(false);
    setFormData({...formData, lastTitle: ""});
  };

  const handleToggleQuizType = (type: QuestionType) => {
    setSelectedQuizTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; 
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleGenerateAIQuiz = async () => {
    if (!newContent.title) {
      alert("Masukkan judul materi dulu sebagai topik kuis.");
      return;
    }
    if (selectedQuizTypes.length === 0) {
      alert("Pilih minimal satu jenis soal.");
      return;
    }
    setIsGeneratingQuiz(true);
    const questions = await generateQuizQuestions(newContent.title, selectedQuizTypes, customQuizPrompt);
    setIsGeneratingQuiz(false);
    
    if (questions) {
      alert(`AI Berhasil meng-generate ${questions.length} soal kuis campuran untuk topik: ${newContent.title}`);
      handleAddContent();
      setCustomQuizPrompt("");
    } else {
      alert("Gagal meng-generate kuis. Periksa koneksi atau API Key Anda di console.");
    }
  };

  const handleAddContent = () => {
      if(!newContent.title) return;
      let displayType = "";
      if (newContent.type === 'Video') displayType = `Video (${newContent.sourceMode === 'link' ? 'Tautan' : 'Unggah'}) • ${newContent.duration || '5'}m`;
      else if (newContent.type === 'PDF') displayType = `Dokumen PDF (Unggah)`;
      else if (newContent.type === 'Kuis') {
        const typesStr = selectedQuizTypes.join("/");
        displayType = `Kuis (${typesStr}) • AI Generated`;
      }

      const contentItem: ModuleMaterial = { id: Date.now(), title: newContent.title, type: displayType, completed: false, locked: false };
      setModuleMaterials([...moduleMaterials, contentItem]);
      setShowAddContentModal(false);
      setNewContent({title: "", type: "Video", sourceMode: "link", duration: "", fileUrl: ""});
  };

  const isManagementMode = user.role === 'Admin' || user.role === 'Teacher';
  const isAdmin = user.role === 'Admin';
  const qualifiesForCertificate = user.progressPercent === 100 && (user.lastScore || 0) > 79;

  const renderPageContent = () => {
    switch(currentPage) {
      case 'register':
        return (
          <div className="flex flex-col bg-white min-h-screen pb-10">
            <div className="relative w-full h-80 flex flex-col justify-end p-6 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.headerRegister})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-[#006400] text-xl font-bold">school</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Platform HISAN v2.1</span>
                </div>
                <h1 className="text-3xl font-extrabold leading-tight">BELAJAR BERSAMA HISAN</h1>
                <p className="text-white/90 text-sm font-medium italic mt-1 bg-black/20 w-fit px-2 py-1 rounded">"Belajar Bersama, Cerdas dan Sukses Bersama"</p>
              </div>
            </div>
            {!showForm ? (
              <div className="px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-emerald-50 border border-emerald-100 p-7 rounded-[2.5rem] mb-8 shadow-sm text-left">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006400] fill-1">verified_user</span>BELAJAR BERSAMA HISAN
                  </h2>
                  <p className="text-slate-600 text-[13px] leading-relaxed mb-4 font-medium">
                    Hadir sebagai inisiatif mandiri untuk mendukung peningkatan kompetensi ASN, platform ini berkomitmen mewujudkan visi <span className="text-[#006400] font-bold">"Belajar Bersama, Cerdas dan Sukses Bersama"</span> bagi para abdi negara.
                  </p>
                  <p className="text-slate-500 text-[13px] leading-relaxed">
                    Tingkatkan kompetensi Anda melalui akses materi eksklusif, jalur pembelajaran terstruktur, dan komunitas profesional yang suportif.
                  </p>
                  <div className="mt-4 pt-3 border-t border-emerald-100/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">info</span>
                    <p className="text-[10px] text-slate-400 font-bold italic leading-tight">
                      *Platform ini merupakan media pembelajaran mandiri yang dikelola secara pribadi untuk pengembangan kompetensi ASN.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <button onClick={() => setShowForm(true)} className="w-full bg-[#006400] text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <span className="text-lg">Daftar Sekarang</span>
                    <span className="material-symbols-outlined">person_add</span>
                  </button>
                  <button onClick={() => navigateTo('login')} className="w-full bg-white text-[#006400] border-2 border-[#006400] font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <span>Sudah Punya Akun? Masuk</span>
                    <span className="material-symbols-outlined">login</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="px-6 -mt-6 relative z-20">
                  <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#006400] text-white flex items-center justify-center font-bold text-sm">1</div>
                      <div className="flex flex-col text-left"><span className="text-xs font-bold text-[#006400]">Pendaftaran</span><span className="text-[10px] text-slate-400 uppercase">Profil Akun</span></div>
                    </div>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined">close</span></button>
                  </div>
                </div>
                <form className="flex flex-col gap-4 px-6 py-8" onSubmit={handleRegister}>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <RoleCard title="Siswa/Peserta" icon="person" selected={formData.role === 'Siswa'} onClick={() => setFormData({...formData, role: 'Siswa'})} />
                    <RoleCard title="Teacher/Guru" icon="record_voice_over" selected={formData.role === 'Teacher'} onClick={() => setFormData({...formData, role: 'Teacher'})} />
                  </div>
                  <InputField icon="person" label="Nama Lengkap" placeholder="Ahmad Siddiq, M.Ag" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
                  <InputField icon="badge" label="NIP Kepegawaian" placeholder="18 Digit NIP" value={formData.nip} onChange={(v) => setFormData({...formData, nip: v})} />
                  <InputField icon="corporate_fare" label="Satuan Kerja" placeholder="Contoh: Kanwil Prov. Jatim" value={formData.unit} onChange={(v) => setFormData({...formData, unit: v})} />
                  <InputField icon="call" label="Nomor WhatsApp" placeholder="0812XXXXXXXX" value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} />
                  <button type="submit" className="w-full bg-[#006400] text-white font-bold py-5 rounded-2xl mt-6 shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <span className="text-lg">Konfirmasi Pendaftaran</span>
                    <span className="material-symbols-outlined">rocket_launch</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      case 'login':
        return (
          <div className="flex flex-col bg-white min-h-screen text-left">
            <div className="p-6 pt-12">
              <button onClick={() => navigateTo('register')} className="size-10 flex items-center justify-center rounded-full bg-slate-100 mb-8"><span className="material-symbols-outlined text-slate-600">arrow_back</span></button>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Masuk ke Akun</h2>
              <p className="text-slate-500 text-sm mb-10">Gunakan Nama Pengguna & Kata Sandi Anda.</p>
              <form className="space-y-6" onSubmit={handleLogin}>
                <InputField icon="person_outline" label="Nama Pengguna" placeholder="Contoh: admin" value={loginData.username} onChange={(v) => setLoginData({...loginData, username: v})} />
                <InputField icon="lock" label="Kata Sandi" placeholder="••••••••" type="password" value={loginData.password} onChange={(v) => setLoginData({...loginData, password: v})} />
                <button type="submit" className="w-full bg-[#006400] text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-8">
                  <span className="text-lg">Masuk Sekarang</span>
                  <span className="material-symbols-outlined">login</span>
                </button>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Info Login Admin:</p>
                    <p className="text-[11px] text-slate-500">User: <code className="bg-slate-200 px-1 rounded">admin</code> | Pass: <code className="bg-slate-200 px-1 rounded">Admin1234</code></p>
                </div>
              </form>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="bg-[#f8fafc] min-h-screen pb-24 text-left">
            <header className="pt-8 pb-32 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.headerDashboard})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="flex justify-between items-center mb-8 relative z-10 text-white">
                <div className="flex items-center gap-3">
                   <div className="size-12 rounded-2xl bg-[#D4AF37]/20 border border-white/30 flex items-center justify-center backdrop-blur-md">
                      <span className="material-symbols-outlined text-[#D4AF37]">{user.role === 'Admin' ? 'admin_panel_settings' : user.role === 'Teacher' ? 'local_library' : 'person'}</span>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest">
                        {user.role === 'Admin' ? 'Administrator' : user.role === 'Teacher' ? 'Teacher/Guru' : 'Siswa/Peserta'}
                      </p>
                      <h1 className="text-xl font-bold truncate max-w-[150px]">{user.name || "Peserta"}</h1>
                   </div>
                </div>
                <button className="size-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-xl"><span className="material-symbols-outlined">notifications</span></button>
              </div>
              <div className="relative z-10 text-white"><p className="text-white/60 text-[11px] font-medium flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span>{user.unit}</p></div>
            </header>
            
            <main className="-mt-24 px-4 space-y-6 relative z-20">
              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    icon={isManagementMode ? "groups" : "stars"} 
                    label={isManagementMode ? "Total Siswa" : "Poin Belajar"} 
                    val={isManagementMode ? allUsers.length : user.points} 
                    color="green" 
                />
                <StatCard 
                    icon={isManagementMode ? "menu_book" : "military_tech"} 
                    label={isManagementMode ? "Pelatihan Aktif" : "Lencana"} 
                    val={isManagementMode ? availableTrainings.length : user.badges} 
                    color="gold" 
                />
              </div>

              {isAdmin && (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigateTo('manage-users')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center gap-2 text-[#006400] shadow-sm active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-2xl">manage_accounts</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-center">Manajemen Anggota</span>
                    </button>
                    <button onClick={() => navigateTo('manage-certificates')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center gap-2 text-[#D4AF37] shadow-sm active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-2xl">card_membership</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-center">Kelola Sertifikat</span>
                    </button>
                  </div>
              )}

              {isManagementMode ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="font-bold text-slate-900 text-sm">Pelatihan Dikelola</h3>
                    {isAdmin && (
                      <button onClick={() => setShowAddTrainingModal(true)} className="bg-[#006400] text-white text-[10px] font-bold py-2 px-4 rounded-full shadow-md active:scale-95 transition-all">
                        + Pelatihan Baru
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4">
                    {availableTrainings.map((t) => (
                      <div key={t.id} className="bg-white p-5 rounded-3xl shadow-xl border border-white/40 flex gap-4 items-center">
                        <div className="size-16 rounded-2xl overflow-hidden shrink-0"><img src={t.img} className="size-full object-cover" alt="training" /></div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-slate-900 truncate text-sm">{t.title}</h4>
                           <p className="text-[10px] text-slate-500">{t.students} Siswa</p>
                           <button onClick={() => { setUser(prev => ({...prev, activeModuleName: t.title})); navigateTo('module'); }} className="bg-[#006400]/5 text-[#006400] text-[10px] font-bold mt-3 py-1.5 px-3 rounded-lg flex items-center gap-1 w-fit">Kelola Konten <span className="material-symbols-outlined text-sm">settings_suggest</span></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-md p-6 rounded-[32px] shadow-xl border border-white/40">
                  <div className="flex justify-between items-center mb-4"><span className="px-3 py-1 bg-[#006400] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Sesi Belajar Aktif</span><p className="text-[#D4AF37] text-xs font-bold">{user.progressPercent}% Selesai</p></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{user.activeModuleName}</h3>
                  <div className="flex items-center gap-3 mb-6">
                    <p className="text-slate-500 text-sm">{user.activeModuleSub}</p>
                    {user.lastScore && user.lastScore > 0 && (
                      <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">Skor: {user.lastScore}</div>
                    )}
                  </div>
                  <div className="relative w-full h-3 bg-slate-100 rounded-full mb-6 overflow-hidden shadow-inner"><div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#006400] to-[#D4AF37] rounded-full transition-all duration-1000" style={{ width: `${user.progressPercent}%` }}></div></div>
                  
                  {qualifiesForCertificate ? (
                    <button className="w-full bg-[#D4AF37] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mb-3 animate-bounce">
                      <span className="material-symbols-outlined">card_membership</span>
                      <span>Unduh Sertifikat Kelulusan</span>
                    </button>
                  ) : null}

                  <button onClick={() => navigateTo('module')} className="w-full bg-[#006400] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><span>Buka Modul</span><span className="material-symbols-outlined text-lg">arrow_forward</span></button>
                </div>
              )}
            </main>
            <BottomNav currentPage={currentPage} navigateTo={navigateTo} />
          </div>
        );
      case 'manage-certificates':
        return (
          <div className="bg-slate-50 min-h-screen pb-32 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
              <header className="pt-12 pb-12 px-6 bg-[#006400] text-white flex items-center gap-4">
                  <button onClick={() => navigateTo('dashboard')} className="size-10 rounded-full bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">arrow_back</span></button>
                  <div>
                      <h2 className="text-xl font-bold leading-tight">Manajemen Sertifikat</h2>
                      <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Admin Panel</p>
                  </div>
              </header>
              <main className="px-5 py-6 space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                    <span className="material-symbols-outlined text-4xl text-[#D4AF37] mb-3">workspace_premium</span>
                    <h3 className="font-bold text-slate-900 mb-1">Standardisasi Kelulusan</h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">Sertifikat hanya diberikan otomatis kepada peserta dengan progress 100% dan skor kuis > 79 (KKM Nasional).</p>
                    <button className="bg-[#006400] text-white py-3 px-6 rounded-xl font-bold text-xs shadow-md">Atur Template Sertifikat</button>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Pelatihan dengan Sertifikat</p>
                {availableTrainings.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-emerald-50 text-[#006400] flex items-center justify-center font-bold text-xs">📜</div>
                      <span className="text-sm font-bold text-slate-900">{t.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-500 uppercase">Aktif</span>
                  </div>
                ))}
              </main>
          </div>
        )
      case 'module':
        return (
          <div className="bg-white min-h-screen flex flex-col pb-32 text-left">
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between"><button onClick={() => navigateTo('dashboard')} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50"><span className="material-symbols-outlined">close</span></button><h1 className="text-sm font-bold text-gray-900">{isManagementMode ? 'Manajemen Materi' : 'Halaman Belajar'}</h1><div className="size-10"></div></header>
            <section className="p-6">
              <div className="flex justify-between items-start gap-4"><div><h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.activeModuleName}</h2></div>
              {isManagementMode && <button onClick={() => setShowAddContentModal(true)} className="bg-[#006400] text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center gap-2 shrink-0"><span className="material-symbols-outlined text-sm">add_circle</span><span className="text-[10px] font-bold uppercase">Tambah Konten</span></button>}</div>
              <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statistik</span>
                  <span className="text-sm font-bold text-[#006400]">{isManagementMode ? `${moduleMaterials.length} Konten` : `${user.progressPercent}% Selesai`}</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-[#006400] h-full transition-all duration-700" style={{ width: isManagementMode ? '100%' : `${user.progressPercent}%` }}></div>
                </div>
                {!isManagementMode && qualifiesForCertificate && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-600">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span className="text-[10px] font-bold uppercase tracking-tight">Anda Lulus! Skor: {user.lastScore}</span>
                  </div>
                )}
              </div>
            </section>
            <main className="px-6 space-y-4">
              {moduleMaterials.map((item) => (
                <ActivityItem key={item.id} title={item.title} type={item.type} completed={item.completed} locked={item.locked && !isManagementMode} isManagementMode={isManagementMode} onDelete={() => setModuleMaterials(moduleMaterials.filter(m => m.id !== item.id))} />
              ))}
            </main>
            <BottomNav currentPage={currentPage} navigateTo={navigateTo} />
          </div>
        );
      case 'profile':
        return (
          <div className="bg-slate-50 min-h-screen pb-32 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
              <header className="pt-12 pb-16 px-6 bg-[#006400] text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                  <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="size-24 rounded-[2rem] border-4 border-white/20 p-1 bg-white/10 backdrop-blur-md shadow-2xl relative">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="size-full rounded-[1.5rem] object-cover bg-white" alt="avatar" />
                          <button className="absolute -bottom-2 -right-2 size-8 rounded-xl bg-[#D4AF37] text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-sm">edit</span></button>
                      </div>
                      <div className="text-center">
                          <h2 className="text-xl font-bold">{user.name}</h2>
                          <p className="text-white/60 text-xs font-medium uppercase tracking-widest">{user.nip}</p>
                      </div>
                  </div>
              </header>
              <main className="px-6 -mt-8 space-y-6 relative z-20">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-[#006400]">account_circle</span>Data Pribadi</h3>
                      <form className="space-y-4" onSubmit={handleUpdateProfile}>
                          <InputField label="Nama Lengkap" icon="person" value={user.name} onChange={(v) => setUser({...user, name: v})} placeholder="Nama" />
                          <InputField label="Satuan Kerja" icon="corporate_fare" value={user.unit} onChange={(v) => setUser({...user, unit: v})} placeholder="Unit" />
                          <InputField label="WhatsApp" icon="call" value={user.phone} onChange={(v) => setUser({...user, phone: v})} placeholder="No. WA" />
                          <div className="flex flex-col gap-1.5">
                              <label className="text-slate-700 text-xs font-bold ml-1">Tingkatan Level</label>
                              <select 
                                value={user.level} 
                                onChange={(e) => setUser({...user, level: e.target.value})}
                                className="w-full pl-4 pr-10 py-3.5 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#006400] focus:border-[#006400] outline-none transition-all text-sm shadow-sm"
                              >
                                  <option>Pemula</option>
                                  <option>Menengah</option>
                                  <option>Mahir</option>
                              </select>
                          </div>
                          <button type="submit" className="w-full bg-[#006400] text-white py-4 rounded-2xl font-bold mt-4 shadow-xl active:scale-95 transition-all">Simpan Perubahan</button>
                      </form>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <button onClick={() => { setIsRegistered(false); navigateTo('register'); }} className="w-full flex items-center justify-center gap-2 text-red-600 font-bold text-sm">
                          <span className="material-symbols-outlined">logout</span>
                          <span>Keluar dari Akun</span>
                      </button>
                  </div>
              </main>
              <BottomNav currentPage={currentPage} navigateTo={navigateTo} />
          </div>
        );
      case 'manage-users':
          return (
              <div className="bg-slate-50 min-h-screen pb-32 animate-in fade-in slide-in-from-left-4 duration-500 text-left">
                  <header className="pt-12 pb-12 px-6 bg-[#006400] text-white flex items-center gap-4">
                      <button onClick={() => navigateTo('dashboard')} className="size-10 rounded-full bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">arrow_back</span></button>
                      <div>
                          <h2 className="text-xl font-bold leading-tight">Manajemen Anggota</h2>
                          <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Total: {allUsers.length} Pengguna</p>
                      </div>
                  </header>
                  <main className="px-5 py-6 space-y-4">
                      <div className="relative mb-6">
                          <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">search</span>
                          <input type="text" placeholder="Cari berdasarkan Nama atau NIP..." className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm outline-none focus:ring-2 focus:ring-[#006400]/20" />
                      </div>
                      
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Daftar Pengguna Platform</p>
                      <div className="grid gap-3">
                          {allUsers.map((u) => (
                              <UserActionCard 
                                key={u.nip}
                                name={u.name}
                                role={u.role}
                                nip={u.nip}
                                onDelete={() => handleDeleteUser(u.nip)}
                                onReset={() => handleResetPassword(u.name)}
                                onRoleChange={(newRole) => handleUpdateUserRole(u.nip, newRole)}
                              />
                          ))}
                      </div>
                  </main>
              </div>
          )
      case 'paths':
        return (
          <div className="bg-[#f8fafc] min-h-screen pb-24 text-center">
            <header className="pt-12 pb-12 px-6 text-white bg-cover bg-center relative" style={{ backgroundImage: `url(${IMAGES.headerPaths})` }}>
              <div className="absolute inset-0 bg-gradient-to-b from-[#006400]/90 to-transparent"></div>
              <div className="relative z-10"><h1 className="text-2xl font-bold tracking-tight mb-1">{isManagementMode ? 'Kelola Kurikulum' : 'Kurikulum Digital'}</h1><p className="text-white/80 text-xs">Pilih jalur kompetensi ASN.</p></div>
            </header>
            <main className="px-4 py-6 space-y-4 text-left">
              {availableTrainings.map(t => (
                  <TrackCard 
                    key={t.id}
                    isManagementMode={isManagementMode} 
                    title={t.title} desc={t.desc} 
                    progress={user.activeModuleName === t.title ? user.progressPercent : 0} 
                    status={user.activeModuleName === t.title ? "LANJUTKAN" : isManagementMode ? "EDIT" : "AMBIL"} 
                    onClick={() => { if(isManagementMode) { setUser(prev => ({...prev, activeModuleName: t.title})); navigateTo('module'); } else { handleSelectTraining(t); }}} 
                    img={t.img} 
                  />
              ))}
            </main>
            <BottomNav currentPage={currentPage} navigateTo={navigateTo} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-slate-50 relative font-sans shadow-2xl overflow-x-hidden border-x border-slate-100">
      {renderPageContent()}

      {/* Modal Add Training */}
      {showAddTrainingModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 backdrop-blur-sm bg-black/20">
              <div className="bg-white w-full max-w-[380px] rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in-95">
                  <h3 className="text-xl font-bold mb-6 text-left">Pelatihan Baru</h3>
                  <div className="space-y-4 text-left">
                      <InputField label="Judul Pelatihan" placeholder="Contoh: Digital Mindset" icon="title" value={formData.lastTitle} onChange={(v) => setFormData({...formData, lastTitle: v})} />
                      <button onClick={handleAddTraining} className="w-full bg-[#006400] text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Simpan Pelatihan</button>
                      <button onClick={() => setShowAddTrainingModal(false)} className="w-full text-slate-400 text-xs font-bold py-2">Batal</button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Add Content */}
      {showAddContentModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 backdrop-blur-sm bg-black/20">
              <div className="bg-white w-full max-w-[400px] rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
                  <h3 className="text-xl font-bold mb-6 text-left">Tambah Materi</h3>
                  <div className="space-y-5 text-left">
                      <div className="grid grid-cols-3 gap-2">
                          {['Video', 'PDF', 'Kuis'].map(t => (
                              <button key={t} onClick={() => setNewContent({...newContent, type: t, sourceMode: t === 'PDF' ? 'upload' : 'link'})} className={`py-3 border-2 rounded-2xl text-[10px] font-bold transition-all ${newContent.type === t ? 'border-[#006400] bg-[#006400]/5 text-[#006400]' : 'border-slate-100 text-slate-400'}`}>{t}</button>
                          ))}
                      </div>
                      <InputField label="Judul Materi" icon="topic" placeholder="Judul Materi" value={newContent.title} onChange={(v) => setNewContent({...newContent, title: v})} />
                      
                      {newContent.type === 'Video' && (
                          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                              <button onClick={() => setNewContent({...newContent, sourceMode: 'link'})} className={`flex-1 py-2 text-[10px] rounded-lg transition-all ${newContent.sourceMode === 'link' ? 'bg-white text-[#006400]' : 'text-slate-400'}`}>Tautan</button>
                              <button onClick={() => setNewContent({...newContent, sourceMode: 'upload'})} className={`flex-1 py-2 text-[10px] rounded-lg transition-all ${newContent.sourceMode === 'upload' ? 'bg-white text-[#006400]' : 'text-slate-400'}`}>Unggah</button>
                          </div>
                      )}

                      {newContent.type === 'Kuis' && (
                          <div className="flex flex-col gap-4">
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                <button onClick={() => setNewContent({...newContent, sourceMode: 'link'})} className={`flex-1 py-2 text-[10px] rounded-lg transition-all ${newContent.sourceMode === 'link' ? 'bg-white text-[#006400]' : 'text-slate-400'}`}>Link</button>
                                <button onClick={() => setNewContent({...newContent, sourceMode: 'ai'})} className={`flex-1 py-2 text-[10px] rounded-lg transition-all ${newContent.sourceMode === 'ai' ? 'bg-white text-[#006400]' : 'text-slate-400'}`}>AI ✨</button>
                            </div>
                            
                            {newContent.sourceMode === 'ai' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pilih Jenis Soal (Bisa Pilih > 1)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Pilihan Ganda', 'Benar/Salah', 'Isian Singkat'].map(qt => (
                                            <button 
                                              key={qt} 
                                              onClick={() => handleToggleQuizType(qt as QuestionType)}
                                              className={`py-2 px-1 border-2 rounded-xl text-[9px] font-bold transition-all ${selectedQuizTypes.includes(qt as QuestionType) ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-slate-100 text-slate-400 bg-white'}`}
                                            >
                                              {qt}
                                            </button>
                                        ))}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instruksi Khusus AI (Prompt)</label>
                                    <textarea 
                                      value={customQuizPrompt}
                                      onChange={(e) => setCustomQuizPrompt(e.target.value)}
                                      placeholder="Contoh: Fokus pada keamanan password, gunakan istilah teknis..."
                                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] outline-none focus:ring-2 focus:ring-[#D4AF37]/20 min-h-[80px] resize-none"
                                    />
                                  </div>
                                </div>
                            )}
                          </div>
                      )}
                      
                      {newContent.type === 'Kuis' && newContent.sourceMode === 'ai' ? (
                        <button 
                          disabled={isGeneratingQuiz}
                          onClick={handleGenerateAIQuiz} 
                          className={`w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white py-4 rounded-2xl font-bold mt-4 shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${isGeneratingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isGeneratingQuiz ? (
                            <>
                                <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                                <span>Sedang Merancang Soal...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                              <span>Generate Kuis AI</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button onClick={handleAddContent} className="w-full bg-[#006400] text-white py-4 rounded-2xl font-bold mt-4 shadow-xl transition-all active:scale-95">Konfirmasi</button>
                      )}
                      
                      <button onClick={() => setShowAddContentModal(false)} className="w-full text-slate-400 text-xs font-bold py-1">Tutup</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
