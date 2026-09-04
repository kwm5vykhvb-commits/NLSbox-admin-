import React, { useState, useEffect } from 'react';
import {
  Radio,
  Bell,
  MessageSquare,
  Users,
  ShieldAlert,
  Server,
  KeyRound,
  Plus,
  Trash2,
  CheckCircle,
  Ban,
  UserCheck,
  Search,
  Zap,
  Star,
  Layers,
  ShieldCheck,
  AlertCircle,
  LogOut,
  ExternalLink,
  History,
} from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { AdminService, SUPER_ADMIN_EMAILS } from './adminService';
import { ChannelInfo, HubCategory, AppNotification, UserFeedback, UserProfile, UserActivity, AdminSecurityAlert } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'channels' | 'notifications' | 'feedback' | 'users' | 'security'>('channels');

  // Firestore Data
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [alerts, setAlerts] = useState<AdminSecurityAlert[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // States: Canaux
  const [selectedCategory, setSelectedCategory] = useState<HubCategory>('anime');
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [backendUrl, setBackendUrl] = useState('https://nlsbox.onrender.com');
  const [pingResult, setPingResult] = useState<{ status: string; ok: boolean } | null>(null);

  // States: Notifications
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState<AppNotification['type']>('update');

  // States: Modération
  const [searchUser, setSearchUser] = useState('');
  const [selectedUserActivities, setSelectedUserActivities] = useState<{ uid: string; list: UserActivity[] } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [targetBanUser, setTargetBanUser] = useState<UserProfile | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
  }, []);

  // 2. Data Subscriptions
  useEffect(() => {
    if (!currentUser) return;
    const unsubChannels = AdminService.subscribeToChannels((ch, conf) => {
      setChannels(ch);
      setSystemConfig(conf);
    });
    const unsubNotifs = AdminService.subscribeToNotifications(setNotifications);
    const unsubFeedback = AdminService.subscribeToFeedback(setFeedback);
    const unsubAlerts = AdminService.subscribeToSecurityAlerts(setAlerts);

    return () => {
      unsubChannels();
      unsubNotifs();
      unsubFeedback();
      unsubAlerts();
    };
  }, [currentUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      if (!SUPER_ADMIN_EMAILS.includes(res.user.email?.toLowerCase() || '')) {
        await signOut(auth);
        setLoginError("Accès refusé : Cet email n'a pas les droits d'administration.");
      }
    } catch (err: any) {
      setLoginError(err.message || 'Identifiants invalides');
    }
  };

  // Test Ping Backend
  const handleTestBackend = async () => {
    setPingResult({ status: 'Test en cours...', ok: false });
    try {
      const start = Date.now();
      const res = await fetch(`${backendUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
      const ms = Date.now() - start;
      if (res.ok) setPingResult({ status: `En ligne (${ms}ms)`, ok: true });
      else setPingResult({ status: `Erreur HTTP ${res.status}`, ok: false });
    } catch {
      setPingResult({ status: 'Hors ligne ou indisponible', ok: false });
    }
  };

  // Ajout de Canal
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelId.trim()) return;
    const cleanId = newChannelId.trim().replace(/^@/, '');
    const newChan: ChannelInfo = {
      id: cleanId,
      name: newChannelName.trim() || cleanId.toUpperCase(),
      category: selectedCategory,
      description: newDescription.trim() || `Flux certifié ${selectedCategory}`,
    };
    const updated = [...channels.filter((c) => c.id !== cleanId), newChan];
    await AdminService.saveChannelsConfig(
      updated,
      systemConfig.primaryChannelsByCategory || {},
      systemConfig.multiChannelsByCategory || {},
      systemConfig.backupChannelsByCategory || {}
    );
    setNewChannelId('');
    setNewChannelName('');
    setNewDescription('');
  };

  // Diffusion Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMsg.trim()) return;
    await AdminService.createNotification(notifTitle.trim(), notifMsg.trim(), notifType);
    setNotifTitle('');
    setNotifMsg('');
  };

  if (authChecking) {
    return <div className="min-h-screen bg-[#0E0E12] flex items-center justify-center text-white font-mono">Chargement du portail admin...</div>;
  }

  // ÉCRAN DE CONNEXION SÉCURISÉ
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0E0E12] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#16161E] border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-red-600/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-white">NLSbox Web Admin</h1>
            <p className="text-xs text-gray-400">Accès restreint aux super-administrateurs</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Email Administrateur</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="leamsinls@gmail.com"
                className="w-full bg-[#101016] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#101016] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            {loginError && <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 hover:brightness-110 font-bold text-white text-sm rounded-xl transition-all shadow-lg"
            >
              Déverrouiller le Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PANNEAU PRINCIPAL DASHBOARD
  return (
    <div className="min-h-screen bg-[#0C0C10] text-gray-200 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#14141C] border-r border-white/5 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-white font-black">
              N
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">NLSbox Admin</h2>
              <span className="text-[10px] text-emerald-400 font-mono">Cloud Connecté</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'channels', label: 'Canaux & Flux', icon: Radio },
              { id: 'notifications', label: 'Diffusion Push', icon: Bell, badge: notifications.length },
              { id: 'feedback', label: 'Boîte à Idées', icon: MessageSquare, badge: feedback.filter((f) => f.status === 'pending').length },
              { id: 'users', label: 'Utilisateurs & Ban', icon: Users },
              { id: 'security', label: 'Sécurité & Alertes', icon: ShieldAlert, badge: alerts.filter((a) => a.status === 'active').length },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'users') {
                      setLoadingUsers(true);
                      AdminService.fetchAllUsers().then((res) => {
                        setUsers(res);
                        setLoadingUsers(false);
                      });
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id ? 'bg-gradient-to-r from-red-600/30 to-purple-600/30 text-white border border-red-500/40' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-3">
          <div className="text-[11px] text-gray-400 truncate font-mono">
            {currentUser.email}
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        {/* ONGLET 1: CANAUX & SOURCES */}
        {activeTab === 'channels' && (
          <div className="space-y-6 max-w-5xl">
            <h2 className="text-lg font-bold text-white">Gestionnaire des Canaux & Sources</h2>

            {/* Test Serveur Backend */}
            <div className="p-4 rounded-2xl bg-[#14141C] border border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  Serveur Backend FastAPI (Render)
                </div>
                <div className="text-xs font-mono text-gray-400 mt-1">{backendUrl}</div>
              </div>
              <div className="flex items-center gap-3">
                {pingResult && (
                  <span className={`text-xs px-2 py-1 rounded-lg font-bold ${pingResult.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {pingResult.status}
                  </span>
                )}
                <button
                  onClick={handleTestBackend}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                >
                  Tester la liaison
                </button>
              </div>
            </div>

            {/* Formulaire Ajout de Canal */}
            <form onSubmit={handleAddChannel} className="p-5 rounded-2xl bg-[#14141C] border border-white/5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-purple-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Ajouter un flux certifié
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="ID technique (ex: one_piece_vostfr)"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="bg-[#101016] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Nom d'affichage"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="bg-[#101016] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="bg-[#101016] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="anime">🎌 Animés</option>
                  <option value="movie_series">🎬 Films & Séries</option>
                  <option value="games">🎮 Jeux & Fun</option>
                  <option value="wallpapers">🖼️ Wallpapers 4K</option>
                  <option value="music">🎵 Musique</option>
                  <option value="document">📄 Fichiers</option>
                  <option value="mature">🔞 Espace +18</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold rounded-xl"
              >
                Enregistrer la source dans Firestore
              </button>
            </form>

            {/* Liste des canaux */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase">Catalogue Actuel ({channels.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {channels.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-[#14141C] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">#{c.id}</div>
                      <div className="text-[11px] text-gray-400">{c.name} • {c.category}</div>
                    </div>
                    <button
                      onClick={async () => {
                        const next = channels.filter((x) => x.id !== c.id);
                        await AdminService.saveChannelsConfig(
                          next,
                          systemConfig.primaryChannelsByCategory || {},
                          systemConfig.multiChannelsByCategory || {},
                          systemConfig.backupChannelsByCategory || {}
                        );
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 2: DIFFUSION PUSH */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-lg font-bold text-white">Diffusion d'Annonces Push en Temps Réel</h2>
            <form onSubmit={handleSendNotification} className="p-5 rounded-2xl bg-[#14141C] border border-white/5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Titre de la notification"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="bg-[#101016] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="bg-[#101016] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="update">🚀 Mise à jour</option>
                  <option value="announcement">📢 Annonce officielle</option>
                  <option value="content">🎬 Nouveau contenu</option>
                  <option value="maintenance">⚠️ Maintenance</option>
                </select>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Message à diffuser à tous les utilisateurs de l'APK..."
                value={notifMsg}
                onChange={(e) => setNotifMsg(e.target.value)}
                className="w-full bg-[#101016] border border-white/10 rounded-xl p-3 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                Diffuser immédiatement
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase">Historique des annonces ({notifications.length})</h3>
              {notifications.map((n) => (
                <div key={n.id} className="p-4 rounded-xl bg-[#14141C] border border-white/5 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-purple-300 uppercase">{n.type}</span>
                    <h4 className="text-sm font-bold text-white mt-1">{n.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => AdminService.deleteNotification(n.id)}
                    className="p-2 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET 3: FEEDBACK & WISHLIST */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-lg font-bold text-white">Tickets & Demandes de Contenu ({feedback.length})</h2>
            <div className="space-y-3">
              {feedback.map((f) => (
                <div key={f.id} className="p-4 rounded-xl bg-[#14141C] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{f.title}</span>
                    <select
                      value={f.status}
                      onChange={(e) => AdminService.updateFeedbackStatus(f.id, e.target.value as any)}
                      className="bg-[#101016] text-[11px] border border-white/10 rounded-lg px-2 py-1 text-purple-300"
                    >
                      <option value="pending">En attente</option>
                      <option value="fulfilled">Ajouté ✓</option>
                      <option value="resolved">Résolu ✓</option>
                      <option value="rejected">Refusé ✕</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-400">{f.details}</p>
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>Par : {f.userEmail || f.userId}</span>
                    <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET 4: UTILISATEURS & BAN */}
        {activeTab === 'users' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Utilisateurs Enregistrés ({users.length})</h2>
              <input
                type="text"
                placeholder="Rechercher un compte..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="bg-[#14141C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            {loadingUsers ? (
              <div className="text-xs text-gray-500">Chargement des utilisateurs...</div>
            ) : (
              <div className="space-y-2">
                {users
                  .filter((u) => (u.email || '').toLowerCase().includes(searchUser.toLowerCase()))
                  .map((u) => (
                    <div key={u.uid} className="p-4 rounded-xl bg-[#14141C] border border-white/5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{u.displayName || u.email}</span>
                          {u.isBanned && <span className="text-[9px] font-black px-2 py-0.5 rounded bg-red-600 text-white">BANNI</span>}
                        </div>
                        <div className="text-[11px] font-mono text-gray-500">{u.uid}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const acts = await AdminService.fetchUserActivities(u.uid);
                            setSelectedUserActivities({ uid: u.uid, list: acts });
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-lg text-gray-300 flex items-center gap-1.5"
                        >
                          <History className="w-3.5 h-3.5" />
                          Activités
                        </button>
                        {u.isBanned ? (
                          <button
                            onClick={async () => {
                              await AdminService.unbanUser(u.uid);
                              setUsers(await AdminService.fetchAllUsers());
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                          >
                            Débannir
                          </button>
                        ) : (
                          <button
                            onClick={() => setTargetBanUser(u)}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Bannir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 5: SECURITE & ALERTES */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-lg font-bold text-white">Sécurité & Alertes d'Intrusion ({alerts.length})</h2>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {a.reason}
                    </div>
                    <div className="text-xs text-white font-mono mt-1">Cible : {a.targetEmail} ({a.attemptsCount} tentatives)</div>
                    <div className="text-[10px] text-gray-500">{new Date(a.timestamp).toLocaleString()}</div>
                  </div>
                  {a.status === 'active' && (
                    <button
                      onClick={() => AdminService.resolveSecurityAlert(a.id)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg text-white"
                    >
                      Marquer résolu
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALE HISTORIQUE ACTIVITES */}
      {selectedUserActivities && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-[#14141C] border border-white/10 p-6 rounded-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Journal d'activités ({selectedUserActivities.list.length})</h3>
              <button onClick={() => setSelectedUserActivities(null)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-3">
              {selectedUserActivities.list.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">Aucune activité enregistrée.</p>
              ) : (
                selectedUserActivities.list.map((act) => (
                  <div key={act.id} className="p-2.5 bg-black/20 rounded-xl text-xs">
                    <div className="font-bold text-purple-300">{act.type} {act.targetTitle ? `• ${act.targetTitle}` : ''}</div>
                    <div className="text-gray-400 text-[11px]">{act.details}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{new Date(act.timestamp).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE MOTIF DE BAN */}
      {targetBanUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#14141C] border border-red-500/30 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-red-400">Bannir {targetBanUser.email || targetBanUser.displayName}</h3>
            <textarea
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Motif du bannissement..."
              className="w-full bg-[#101016] border border-white/10 rounded-xl p-3 text-xs text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setTargetBanUser(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-semibold text-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  await AdminService.banUser(targetBanUser.uid, banReason || 'Non respect des conditions');
                  setTargetBanUser(null);
                  setUsers(await AdminService.fetchAllUsers());
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-500"
              >
                Confirmer le ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
