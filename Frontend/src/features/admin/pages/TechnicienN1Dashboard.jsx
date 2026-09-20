import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import toast, { Toaster } from 'react-hot-toast';
import './TechnicienN1Dashboard.css';
import api from '../../../services/api';
import { FileText } from 'lucide-react';

// Lucide Icons
import {
  LayoutDashboard,
  Wrench,
  User,
  LogOut,
  RefreshCw,
  Inbox,
  History,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  BarChart3,
  X,
  ShieldAlert,
  Zap
} from 'lucide-react';

// Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Services / APIs  — ⚠️ LOGIQUE MÉTIER INTACTE
import {
  getAvailableTickets,
  getMyInterventions,
  getMyHistory,
  startInterventionN1,
  terminateInterventionN1,
  escalateToN2N1,
  saveInterventionActions
} from '../../../services/api';

// Subcomponents — ⚠️ LOGIQUE MÉTIER INTACTE
import TicketCard from '../../../components/TicketCard';
import ReportModal from '../../../components/ReportModal';
import NotificationBell from '../../../components/NotificationBell';
import UserProfile from './UserProfile';
import TicketDetailsModal from '../../../components/TicketDetailsModal';

export default function TechnicienN1Dashboard() {
  const navigate = useNavigate();
  const { token, role, userId, userName, logout, profileImage } = useAuth();
  const { fetchNotifications } = useNotifications();

  // ---------- STATES — LOGIQUE INTACTE ----------
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubFilter, setActiveSubFilter] = useState('ALL');

  const [availableTickets, setAvailableTickets] = useState([]);
  const [activeInterventions, setActiveInterventions] = useState([]);
  const [historyInterventions, setHistoryInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Custom Report Form overlay states
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false);
  const [customReportIntervention, setCustomReportIntervention] = useState(null);
  const [customReportType, setCustomReportType] = useState('none'); // 'none' | 'close' | 'escalate'

  // Custom Report form fields
  const [outilUtilise, setOutilUtilise] = useState('TeamViewer');
  const [priseEnMain, setPriseEnMain] = useState(true);
  const [tempsConnexion, setTempsConnexion] = useState('15');
  const [diagnostic, setDiagnostic] = useState('');
  const [actionsRealisees, setActionsRealisees] = useState('');
  const [resoluADistance, setResoluADistance] = useState(true);
  const [commentaire, setCommentaire] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // Ticket detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const handleOpenTicketDetail = (ticket) => {
    setDetailTicket(ticket);
    setShowDetailModal(true);
  };

  // ---------- DATA SYNC — LOGIQUE INTACTE ----------
  const loadDashboardData = async () => {
    if (!token || !userId) return;
    try {
      const [available, active, history] = await Promise.all([
        getAvailableTickets(),
        getMyInterventions(userId),
        getMyHistory(userId)
      ]);
      setAvailableTickets(Array.isArray(available) ? available : []);
      setActiveInterventions(Array.isArray(active) ? active : []);
      setHistoryInterventions(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Erreur de synchronisation des données GMAO:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, [token, userId]);

  // ---------- ACTION HANDLERS — LOGIQUE INTACTE ----------

  const handleStartIntervention = async (ticketId) => {
    try {
      await startInterventionN1(ticketId, userId);
      toast.success(`Intervention #${ticketId} démarrée avec succès !`);
      setActiveSubFilter('EN_COURS');
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du démarrage de l'intervention");
    }
  };

  const handleSubmitClose = async (interventionId, data) => {
    try {
      // Step 1: Save action data with proper API interceptors
      await saveInterventionActions(interventionId, {
        actionADistance: data.actionADistance,
        surSiteEffectue: data.surSiteEffectue,
        manipulationLourdeEffectue: data.manipulationLourdeEffectue
      });

      // Step 2: Close ticket
      await terminateInterventionN1(interventionId, data.commentaire);

      toast.success(`Intervention #${interventionId} clôturée et validée !`, { duration: 4000, icon: '🎉' });
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error('Close error:', error);
      toast.error("Erreur lors de la clôture: " + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  const handleSubmitEscalate = async (interventionId, data) => {
    try {
      // Step 1: Save action data with proper API interceptors
      await saveInterventionActions(interventionId, {
        actionADistance: data.actionADistance,
        surSiteEffectue: data.surSiteEffectue,
        manipulationLourdeEffectue: data.manipulationLourdeEffectue
      });

      // Step 2: Escalate to N2
      await escalateToN2N1(interventionId, data.commentaire);

      toast.success(`Intervention #${interventionId} escaladée au Support N2 !`, { duration: 4000, icon: '📤' });
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error('Escalade error:', error);
      toast.error("Erreur lors de l'escalade: " + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  const handleOpenReportModal = (interventionData) => {
    setSelectedIntervention(interventionData);
    setIsReportModalOpen(true);
  };

  const handleOpenCustomReport = (intervention, defaultType = 'none') => {
    setCustomReportIntervention(intervention);
    setOutilUtilise('TeamViewer');
    setPriseEnMain(true);
    setTempsConnexion('15');
    setDiagnostic(intervention.ticket?.description || '');
    setActionsRealisees('');
    setResoluADistance(true);
    setCommentaire('');
    setCustomReportType(defaultType); // Reset choices view
    setIsCustomReportOpen(true);
  };

  const handleConfirmCustomClose = async () => {
    if (!commentaire.trim()) {
      toast.error("Le commentaire technique est obligatoire avant de clôturer.");
      return;
    }
    setSavingReport(true);
    try {
      // Step 1: Save full rapport
      await api.put(`/technicien/interventions/${customReportIntervention.id}/rapport`, {
        diagnostic: diagnostic || 'Diagnostic standard à distance',
        actionsRealisees: actionsRealisees || `Outil utilisé: ${outilUtilise}. Prise en main à distance.`,
        resultat: resoluADistance ? 'Résolu à distance' : 'Non résolu à distance',
        commentaire,
        tempsPasse: `${tempsConnexion} min`
      });

      // Step 2: Save actions details
      await api.put(`/technicien/interventions/${customReportIntervention.id}/actions`, {
        actionADistance: `Outil: ${outilUtilise}, Résolution: ${resoluADistance ? 'Oui' : 'Non'}`,
        surSiteEffectue: false,
        manipulationLourdeEffectue: false
      });

      // Step 3: Execute terminate using standard handler
      await handleSubmitClose(customReportIntervention.id, { commentaire });
      setIsCustomReportOpen(false);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Erreur technique lors de la clôture.");
    } finally {
      setSavingReport(false);
    }
  };

  const handleConfirmCustomEscalate = async () => {
    if (!diagnostic.trim() || !actionsRealisees.trim() || !commentaire.trim()) {
      toast.error("Tous les champs du rapport sont obligatoires pour escalader.");
      return;
    }
    setSavingReport(true);
    try {
      // Step 1: Save full rapport
      await api.put(`/technicien/interventions/${customReportIntervention.id}/rapport`, {
        diagnostic,
        actionsRealisees,
        resultat: 'Non résolu à distance — Escalade Support N2 requis',
        commentaire,
        tempsPasse: `${tempsConnexion} min`
      });

      // Step 2: Save actions details
      await api.put(`/technicien/interventions/${customReportIntervention.id}/actions`, {
        actionADistance: `Outil: ${outilUtilise}. Incident non résolu à distance.`,
        surSiteEffectue: false,
        manipulationLourdeEffectue: false
      });

      // Step 3: Execute escalate using standard handler
      await handleSubmitEscalate(customReportIntervention.id, { commentaire });
      setIsCustomReportOpen(false);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Erreur technique lors de l'escalade.");
    } finally {
      setSavingReport(false);
    }
  };

  // ---------- STATS — LOGIQUE INTACTE ----------
  const stats = {
    available: availableTickets.length,
    active: activeInterventions.length,
    closed: historyInterventions.filter(i => {
      const status = String(i.ticket?.statut).toUpperCase();
      return status === 'CLOTURE' || status === 'CLOSED';
    }).length,
    escalated: historyInterventions.filter(i => {
      const status = String(i.ticket?.statut).toUpperCase();
      return status === 'ESCALADE_N2' || status === 'ESCALATED_N2';
    }).length,
  };

  // ---------- SEARCH & FILTER — LOGIQUE INTACTE ----------
  const filterList = (list, isEnvelope = false) => {
    return list.filter(item => {
      const ticket = isEnvelope ? item.ticket : item;
      if (!ticket) return false;
      const matchesSearch =
        String(ticket.id).includes(searchQuery) ||
        String(ticket.titre).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(ticket.description).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(ticket.equipement?.nom).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(ticket.demandeur?.nom).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        priorityFilter === 'ALL' ||
        String(ticket.priorite).toUpperCase() === priorityFilter ||
        (priorityFilter === 'HIGH' && String(ticket.priorite).toUpperCase() === 'URGENT') ||
        (priorityFilter === 'MEDIUM' && String(ticket.priorite).toUpperCase() === 'MOYENNE') ||
        (priorityFilter === 'LOW' && String(ticket.priorite).toUpperCase() === 'NORMALE');
      return matchesSearch && matchesPriority;
    });
  };

  // ---------- CHARTS — LOGIQUE INTACTE ----------
  const volumeChartData = [
    { name: 'Disponibles', tickets: stats.available, color: '#047857' },
    { name: 'En cours N1', tickets: stats.active, color: '#2563eb' },
    { name: 'Clôturés', tickets: stats.closed, color: '#64748b' },
    { name: 'Escaladés N2', tickets: stats.escalated, color: '#f59e0b' }
  ];

  const priorityChartData = [
    {
      name: 'Critique',
      tickets:
        availableTickets.filter(t => ['HIGH', 'URGENT'].includes(String(t.priorite).toUpperCase())).length +
        activeInterventions.filter(i => ['HIGH', 'URGENT'].includes(String(i.ticket?.priorite).toUpperCase())).length
    },
    {
      name: 'Moyenne',
      tickets:
        availableTickets.filter(t => ['MEDIUM', 'MOYENNE'].includes(String(t.priorite).toUpperCase())).length +
        activeInterventions.filter(i => ['MEDIUM', 'MOYENNE'].includes(String(i.ticket?.priorite).toUpperCase())).length
    },
    {
      name: 'Normale',
      tickets:
        availableTickets.filter(t => ['LOW', 'NORMALE'].includes(String(t.priorite).toUpperCase())).length +
        activeInterventions.filter(i => ['LOW', 'NORMALE'].includes(String(i.ticket?.priorite).toUpperCase())).length
    }
  ];

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  // ---------- HELPERS UI ----------
  const getPriorityBadge = (priorite) => {
    const p = String(priorite).toUpperCase();
    if (p === 'HIGH' || p === 'URGENT') return <span className="t1d-badge t1d-badge-high">Urgent</span>;
    if (p === 'MEDIUM' || p === 'MOYENNE') return <span className="t1d-badge t1d-badge-medium">Moyenne</span>;
    return <span className="t1d-badge t1d-badge-low">Normale</span>;
  };

  const getStatusBadge = (statut) => {
    const s = String(statut).toUpperCase();
    if (s === 'EN_ATTENTE' || s === 'PENDING' || s === 'OUVERT')
      return <span className="t1d-status t1d-status-pending"><span className="t1d-status-dot" />En attente</span>;
    if (s === 'EN_COURS' || s === 'EN_COURS_N1' || s === 'IN_PROGRESS_N1')
      return <span className="t1d-status t1d-status-active"><span className="t1d-status-dot" />En cours N1</span>;
    if (s === 'CLOTURE' || s === 'CLOSED')
      return <span className="t1d-status t1d-status-closed"><span className="t1d-status-dot" />Clôturé</span>;
    if (s === 'ESCALADE_N2' || s === 'ESCALATED_N2')
      return <span className="t1d-status t1d-status-escalated"><span className="t1d-status-dot" />Escaladé N2</span>;
    return <span className="t1d-status t1d-status-pending"><span className="t1d-status-dot" />{statut}</span>;
  };

  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TN';

  // ==================== RENDER ====================
  return (
    <div className="t1d-wrapper">
      <Toaster position="top-right" reverseOrder={false} />

      {/* ══════════════════════ SIDEBAR (Style N2) ══════════════════════ */}
      <aside className="t1d-sidebar">
        {/* Header / Logo centré */}
        <div className="t1d-sidebar-header">
          <div className="t1d-logo-row">
            <img src="/src/assets/logo-ocp.png" alt="Logo OCP" className="t1d-logo-img" />
            <div>

              <p className="t1d-logo-sub">Site OCP Khouribga</p>
            </div>
          </div>
        </div>

        {/* Navigation avec section labels */}
        <nav className="t1d-nav">
          <span className="t1d-nav-section-label">Supervision</span>
          <button
            className={`t1d-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard N1
          </button>

          <button
            className={`t1d-nav-btn ${activeTab === 'interventions' ? 'active' : ''}`}
            onClick={() => setActiveTab('interventions')}
          >
            <Wrench size={18} />
            Interventions
            {(stats.available + stats.active) > 0 && (
              <span className="t1d-nav-badge">{stats.available + stats.active}</span>
            )}
          </button>

          <span className="t1d-nav-section-label">Profil</span>
          <button
            className={`t1d-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Mon Profil
          </button>
        </nav>

        {/* Footer utilisateur */}
        <div className="t1d-sidebar-footer">
          <div className="t1d-user-card">
            <div
              className={`t1d-user-avatar ${profileImage ? 'has-image' : ''}`}
              style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
            >
              {!profileImage && userInitials}
            </div>
            <div>
              <p className="t1d-user-name" title={userName}>{userName || 'Technicien N1'}</p>
              <p className="t1d-user-role">Support À Distance N1</p>
            </div>
          </div>
          <button
            className="t1d-logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>


      {/* ══════════════════════ MAIN ══════════════════════ */}
      <main className="t1d-main">

        {/* ─── TOPBAR ─── */}
        <header className="t1d-header">
          <div>
            <h2 className="t1d-header-title">
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'interventions' && 'Gestion des Interventions'}
              {activeTab === 'profile' && 'Mon Profil'}
            </h2>

          </div>

          <div className="t1d-header-actions">
            <NotificationBell />
            <button
              className="t1d-icon-btn"
              onClick={loadDashboardData}
              title="Synchroniser"
            >
              <RefreshCw size={18} className={loading ? 't1d-refresh-spin' : ''} />
            </button>
          </div>
        </header>

        {/* ─── CONTENT ─── */}
        <div className="t1d-content">
          <div className="t1d-container">

            {/* ══ LOADING STATE ══ */}
            {loading && availableTickets.length === 0 && activeInterventions.length === 0 && (
              <div className="t1d-loader">
                <div className="t1d-spinner" />
                <p className="t1d-loader-text">Chargement sécurisé GMAO OCP...</p>
              </div>
            )}

            {/* ══════════════════ TAB 1 : DASHBOARD ══════════════════ */}
            {activeTab === 'dashboard' && !loading && (
              (() => {
                if (!window.LazyModernDashboardContent) {
                  window.LazyModernDashboardContent = React.lazy(() => import('./ModernDashboardContent'));
                }
                const LazyContent = window.LazyModernDashboardContent;
                return (
                  <React.Suspense fallback={<div className="t1d-loader"><div className="t1d-spinner" /><p className="t1d-loader-text">Chargement du dashboard premium...</p></div>}>
                    <LazyContent
                      availableTickets={availableTickets}
                      activeInterventions={activeInterventions}
                      historyInterventions={historyInterventions}
                      stats={stats}
                      volumeChartData={volumeChartData}
                      priorityChartData={priorityChartData}
                      handleStartIntervention={handleStartIntervention}
                      handleOpenReportModal={handleOpenReportModal}
                      handleSubmitClose={handleSubmitClose}
                      handleSubmitEscalate={handleSubmitEscalate}
                      loadDashboardData={loadDashboardData}
                      userId={userId}
                      setActiveTab={setActiveTab}
                      handleOpenCustomReport={handleOpenCustomReport}
                    />
                  </React.Suspense>
                );
              })()
            )}

            {/* ══════════════════ TAB 2 : INTERVENTIONS ══════════════════ */}
            {activeTab === 'interventions' && (
              <div className="t1d-fade-in">

                {/* Sub-filter tab pills */}
                <div className="t1d-filters-row" style={{ marginBottom: '1.25rem' }}>
                  <div className="t1d-tab-group">
                    {[
                      { key: 'ALL', label: 'Tous les flux' },
                      { key: 'PENDING', label: 'Disponibles', dot: stats.available > 0 },
                      { key: 'EN_COURS', label: 'Mes Interventions', count: stats.active > 0 ? stats.active : null },
                      { key: 'HISTORIQUE', label: 'Mon Historique' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className={`t1d-tab-btn ${activeSubFilter === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveSubFilter(tab.key)}
                      >
                        {tab.label}
                        {tab.dot && <span className="t1d-tab-dot" />}
                        {tab.count != null && <span className="t1d-tab-count">{tab.count}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search & filter bar */}
                <div className="t1d-filters-row">
                  <div className="t1d-search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      className="t1d-search-input"
                      placeholder="Rechercher par titre, équipement, demandeur..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="t1d-filter-select"
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                  >
                    <option value="ALL">Toutes criticités</option>
                    <option value="HIGH">Critique (HIGH)</option>
                    <option value="MEDIUM">Moyenne (MEDIUM)</option>
                    <option value="LOW">Normale (LOW)</option>
                  </select>
                </div>

                {/* ── ALL VIEW ── */}
                {activeSubFilter === 'ALL' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {activeInterventions.length > 0 && (
                      <div className="t1d-card">
                        <div className="t1d-section-header">
                          <div>
                            <h3 className="t1d-section-title">En cours de traitement</h3>
                            <p className="t1d-section-subtitle">{activeInterventions.length} intervention(s) active(s)</p>
                          </div>
                        </div>
                        <InterventionTable
                          list={filterList(activeInterventions, true)}
                          isEnvelope
                          isActive
                          onAction={handleOpenReportModal}
                          onTerminate={handleOpenCustomReport}
                          getPriorityBadge={getPriorityBadge}
                          getStatusBadge={getStatusBadge}
                          onTicketClick={handleOpenTicketDetail}
                        />
                      </div>
                    )}

                    <div className="t1d-card">
                      <div className="t1d-section-header">
                        <div>
                          <h3 className="t1d-section-title">Tickets en attente</h3>
                          <p className="t1d-section-subtitle">{availableTickets.length} ticket(s) disponible(s)</p>
                        </div>
                      </div>
                      {availableTickets.length === 0 ? (
                        <div className="t1d-empty">
                          <Inbox size={40} className="t1d-empty-icon" />
                          <p className="t1d-empty-title">File d'attente vide</p>
                          <p className="t1d-empty-text">Aucun incident disponible pour le moment.</p>
                        </div>
                      ) : (
                        <AvailableTicketTable
                          list={filterList(availableTickets, false)}
                          onStart={handleStartIntervention}
                          getPriorityBadge={getPriorityBadge}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* ── PENDING ── */}
                {activeSubFilter === 'PENDING' && (
                  <div className="t1d-card">
                    <div className="t1d-section-header">
                      <div>
                        <h3 className="t1d-section-title">Tickets disponibles à prendre</h3>
                        <p className="t1d-section-subtitle">Nouveaux incidents en file d'attente</p>
                      </div>
                    </div>
                    {filterList(availableTickets, false).length === 0 ? (
                      <div className="t1d-empty">

                        <p className="t1d-empty-title">File d'attente vide</p>
                        <p className="t1d-empty-text">Aucun ticket n'est en attente de support pour le moment.</p>
                      </div>
                    ) : (
                      <AvailableTicketTable
                        list={filterList(availableTickets, false)}
                        onStart={handleStartIntervention}
                        getPriorityBadge={getPriorityBadge}
                      />
                    )}
                  </div>
                )}

                {/* ── EN COURS ── */}
                {activeSubFilter === 'EN_COURS' && (
                  <div className="t1d-card">
                    <div className="t1d-section-header">
                      <div>
                        <h3 className="t1d-section-title">Mes interventions actives</h3>
                        <p className="t1d-section-subtitle">Incidents en cours de traitement</p>
                      </div>
                    </div>
                    {filterList(activeInterventions, true).length === 0 ? (
                      <div className="t1d-empty">

                        <p className="t1d-empty-title">Aucune intervention active</p>
                        <p className="t1d-empty-text">Prenez en charge un ticket disponible pour démarrer le traitement.</p>
                        <button
                          className="t1d-btn t1d-btn-primary"
                          onClick={() => setActiveSubFilter('PENDING')}
                          style={{ marginTop: '0.75rem' }}
                        >
                          Voir les tickets disponibles
                        </button>
                      </div>
                    ) : (
                      <InterventionTable
                        list={filterList(activeInterventions, true)}
                        isEnvelope
                        isActive
                        onAction={handleOpenReportModal}
                        onTerminate={handleOpenCustomReport}
                        getPriorityBadge={getPriorityBadge}
                        getStatusBadge={getStatusBadge}
                        onTicketClick={handleOpenTicketDetail}
                      />
                    )}
                  </div>
                )}

                {/* ── HISTORIQUE ── */}
                {activeSubFilter === 'HISTORIQUE' && (
                  <div className="t1d-card">
                    <div className="t1d-section-header">
                      <div>
                        <h3 className="t1d-section-title">Mon Historique</h3>
                        <p className="t1d-section-subtitle">Toutes mes interventions passées</p>
                      </div>
                    </div>
                    {filterList(historyInterventions, true).length === 0 ? (
                      <div className="t1d-empty">

                        <p className="t1d-empty-title">Aucun historique</p>
                        <p className="t1d-empty-text">Votre historique d'interventions apparaîtra ici.</p>
                      </div>
                    ) : (
                      <InterventionTable
                        list={filterList(historyInterventions, true)}
                        isEnvelope
                        isActive={false}
                        onAction={null}
                        getPriorityBadge={getPriorityBadge}
                        getStatusBadge={getStatusBadge}
                        onTicketClick={handleOpenTicketDetail}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════ TAB 3 : PROFILE ══════════════════ */}
            {activeTab === 'profile' && (
              <div className="t1d-fade-in">
                <div className="t1d-card">
                  <UserProfile />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ── REPORT MODAL — LOGIQUE INTACTE ── */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => { setIsReportModalOpen(false); setSelectedIntervention(null); }}
        onSubmitClose={handleSubmitClose}
        onSubmitEscalate={handleSubmitEscalate}
        intervention={selectedIntervention}
      />

      {/* ── TICKET DETAIL MODAL ── */}
      <TicketDetailsModal
        ticket={detailTicket}
        onClose={() => { setShowDetailModal(false); setDetailTicket(null); }}
      />

      {/* ── CUSTOM REMOTE REPORT MODAL ── */}
      {isCustomReportOpen && customReportIntervention && (
        <div className="t1d-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
          <div className="t1d-modal" style={{ maxWidth: '640px', background: 'var(--glass-bg-solid)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow-hover)' }}>

            <div className="t1d-modal-header" style={{ borderBottom: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--ocp-green-light)', padding: '0.45rem', borderRadius: '8px', color: 'var(--ocp-green)' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>Rapport d'Intervention à Distance</h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Fiche de diagnostic N1 — site OCP Khouribga</p>
                </div>
              </div>
              <button
                className="t1d-modal-close"
                onClick={() => setIsCustomReportOpen(false)}
                disabled={savingReport}
              >
                <X size={16} />
              </button>
            </div>

            <div className="t1d-modal-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Réf: #{customReportIntervention.id}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Ticket Réf: #{customReportIntervention.ticket?.id}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>{customReportIntervention.ticket?.priorite}</span>
              </div>

              <div className="t1d-timeline">
                {/* Section 1: Connection Setup */}
                {customReportType === 'none' && (
                  <div className="t1d-timeline-item">
                    <div className="t1d-timeline-badge" />
                    <div className="t1d-timeline-content" style={{ background: '#fff' }}>
                      <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>1. Connexion & Prise en Main</h5>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Outil de support *</label>
                          <select
                            style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                            value={outilUtilise}
                            onChange={e => setOutilUtilise(e.target.value)}
                          >
                            <option value="TeamViewer">TeamViewer Enterprise</option>
                            <option value="AnyDesk">AnyDesk Professional</option>
                            <option value="SSH">Console SSH (Accès direct)</option>
                            <option value="RDP">Windows RDP (Remote Desktop)</option>
                            <option value="Autre">Autre outil de support</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Temps de connexion (min)</label>
                          <input
                            type="number"
                            style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                            value={tempsConnexion}
                            onChange={e => setTempsConnexion(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={priseEnMain}
                            onChange={e => setPriseEnMain(e.target.checked)}
                            style={{ accentColor: 'var(--ocp-green)' }}
                          />
                          Prise en main à distance réussie
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Diagnostique / Resolution */}
                {customReportType === 'none' && (
                  <div className="t1d-timeline-item">
                    <div className="t1d-timeline-badge" />
                    <div className="t1d-timeline-content" style={{ background: '#fff' }}>
                      <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>2. Diagnostic & Actions Réalisées</h5>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Diagnostic technique posé *</label>
                          <textarea
                            placeholder="Saisir le diagnostic constaté (ex: dysfonctionnement du pilote réseau)..."
                            style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', minHeight: '50px', resize: 'vertical' }}
                            value={diagnostic}
                            onChange={e => setDiagnostic(e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Actions correctives appliquées *</label>
                          <textarea
                            placeholder="Saisir les actions effectuées pour résoudre l'incident..."
                            style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', minHeight: '50px', resize: 'vertical' }}
                            value={actionsRealisees}
                            onChange={e => setActionsRealisees(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={resoluADistance}
                              onChange={e => setResoluADistance(e.target.checked)}
                              style={{ accentColor: 'var(--ocp-green)' }}
                            />
                            Le problème a été entièrement résolu à distance
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic workflow sections based on choice */}
                {customReportType === 'close' && (
                  <div className="t1d-timeline-item" style={{ animation: 't1d-fadeIn 0.3s forwards' }}>
                    <div className="t1d-timeline-badge" style={{ borderColor: '#047857' }} />
                    <div className="t1d-timeline-content" style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#065f46', fontSize: '0.875rem' }}>Validation de Clôture N1</h5>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#047857' }}>
                        L'incident va être définitivement résolu et archivé dans la base OCP.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857' }}>Commentaire technique de clôture *</label>
                        <textarea
                          placeholder="Saisir les remarques de clôture (obligatoire)..."
                          style={{ width: '100%', padding: '0.45rem', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', minHeight: '60px', background: '#fff' }}
                          value={commentaire}
                          onChange={e => setCommentaire(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          className="t1d-btn t1d-btn-secondary t1d-btn-sm"
                          onClick={() => setCustomReportType('none')}
                          disabled={savingReport}
                        >
                          Retour
                        </button>
                        <button
                          className="t1d-btn t1d-btn-primary t1d-btn-sm"
                          onClick={handleConfirmCustomClose}
                          disabled={savingReport || !commentaire.trim()}
                          style={{ background: '#047857' }}
                        >
                          {savingReport ? 'Traitement...' : 'Confirmer la clôture'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {customReportType === 'escalate' && (
                  <div className="t1d-timeline-item" style={{ animation: 't1d-fadeIn 0.3s forwards' }}>
                    <div className="t1d-timeline-badge" style={{ borderColor: '#d97706' }} />
                    <div className="t1d-timeline-content" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#92400e', fontSize: '0.875rem' }}>Workflow d'Escalade vers Support N2</h5>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#b45309' }}>
                        Le ticket sera transféré à la file d'attente du Support Niveau 2. Un rapport complet est obligatoire.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', display: 'block', marginBottom: '0.2rem' }}>Diagnostic obligatoire *</label>
                          <input
                            type="text"
                            style={{ width: '100%', padding: '0.45rem', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#fff' }}
                            value={diagnostic}
                            onChange={e => setDiagnostic(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', display: 'block', marginBottom: '0.2rem' }}>Actions déjà réalisées *</label>
                          <input
                            type="text"
                            style={{ width: '100%', padding: '0.45rem', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', background: '#fff' }}
                            value={actionsRealisees}
                            onChange={e => setActionsRealisees(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', display: 'block', marginBottom: '0.2rem' }}>Raison technique de l'escalade N2 *</label>
                          <textarea
                            placeholder="Saisir la raison pour laquelle le support à distance N1 ne peut pas résoudre..."
                            style={{ width: '100%', padding: '0.45rem', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', minHeight: '60px', background: '#fff' }}
                            value={commentaire}
                            onChange={e => setCommentaire(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          className="t1d-btn t1d-btn-secondary t1d-btn-sm"
                          onClick={() => setCustomReportType('none')}
                          disabled={savingReport}
                        >
                          Retour
                        </button>
                        <button
                          className="t1d-btn t1d-btn-primary t1d-btn-sm"
                          onClick={handleConfirmCustomEscalate}
                          disabled={savingReport || !diagnostic.trim() || !actionsRealisees.trim() || !commentaire.trim()}
                          style={{ background: '#d97706' }}
                        >
                          {savingReport ? 'Transfert...' : "Confirmer l'escalade N2"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2 Buttons at the bottom of the report initially */}
            {customReportType === 'none' && (
              <div className="t1d-modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', padding: '1rem 1.25rem' }}>
                <button
                  className="t1d-btn t1d-btn-secondary"
                  onClick={() => setIsCustomReportOpen(false)}
                  disabled={savingReport}
                >
                  Annuler
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="t1d-btn t1d-btn-warning"
                    onClick={() => {
                      setResoluADistance(false);
                      setCustomReportType('escalate');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <ShieldAlert size={14} /> Escalader N2
                  </button>

                  <button
                    className="t1d-btn t1d-btn-primary"
                    onClick={() => {
                      setResoluADistance(true);
                      setCustomReportType('close');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <CheckCircle size={14} /> Clôturer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-TABLE : Tickets disponibles (à prendre en charge)
══════════════════════════════════════════════════════════ */
function AvailableTicketTable({ list, onStart, getPriorityBadge }) {
  if (list.length === 0) {
    return (
      <div className="t1d-empty">
        <Inbox size={40} className="t1d-empty-icon" />
        <p className="t1d-empty-title">Aucun résultat</p>
        <p className="t1d-empty-text">Aucun ticket ne correspond aux filtres sélectionnés.</p>
      </div>
    );
  }

  return (
    <div className="t1d-table-responsive">
      <table className="t1d-table">
        <thead>
          <tr>
            <th>Réf.</th>
            <th>Détails de l'incident</th>
            <th>Criticité</th>
            <th>Demandeur</th>
            <th>Téléphone</th>
            <th>Email</th>
            <th style={{ textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map(ticket => (
            <tr key={ticket.id}>
              <td className="t1d-ref">#{ticket.id}</td>
              <td style={{ maxWidth: '320px' }}>
                <p style={{
                  margin: 0, fontWeight: 700, fontSize: '13.5px',
                  color: '#0f172a', lineHeight: '1.4',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {ticket.titre}
                </p>
                <p style={{
                  margin: '3px 0 6px', fontSize: '12px', color: '#64748b',
                  lineHeight: '1.5', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {ticket.description}
                </p>
                {ticket.equipement?.nom && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                    fontWeight: 600, background: '#f0fdf4',
                    color: '#15803d', border: '1px solid #bbf7d0'
                  }}>
                    🖥 EQ: {ticket.equipement.nom}
                  </span>
                )}
              </td>
              <td>{getPriorityBadge(ticket.priorite)}</td>
              <td style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                {ticket.demandeur?.nom || '—'}
              </td>
              <td style={{ fontSize: '0.85rem', color: '#334155' }}>
                {ticket.demandeur?.telephone
                  ? <a href={`tel:${ticket.demandeur.telephone}`} style={{ color: '#047857', fontWeight: 600, textDecoration: 'none' }}>📞 {ticket.demandeur.telephone}</a>
                  : <span style={{ color: '#94a3b8' }}>—</span>}
              </td>
              <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                {ticket.demandeur?.email
                  ? <a href={`mailto:${ticket.demandeur.email}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>✉️ {ticket.demandeur.email}</a>
                  : <span style={{ color: '#94a3b8' }}>—</span>}
              </td>
              <td style={{ textAlign: 'center' }}>
                <button
                  className="t1d-btn t1d-btn-primary t1d-btn-sm"
                  onClick={() => onStart(ticket.id)}
                >
                  🚀 Prendre en charge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-TABLE : Interventions (actives ou historique)
══════════════════════════════════════════════════════════ */
function InterventionTable({ list, isEnvelope, isActive, onAction, onTerminate, getPriorityBadge, getStatusBadge, onTicketClick }) {
  if (list.length === 0) {
    return (
      <div className="t1d-empty">
        <Activity size={40} className="t1d-empty-icon" />
        <p className="t1d-empty-title">Aucun résultat</p>
        <p className="t1d-empty-text">Aucune intervention ne correspond aux filtres sélectionnés.</p>
      </div>
    );
  }

  return (
    <div className="t1d-table-responsive">
      <table className="t1d-table">
        <thead>
          <tr>
            <th>Réf.</th>
            <th>Incident</th>
            <th>Priorité</th>
            <th>Statut</th>
            <th>Demandeur</th>
            <th>Téléphone</th>
            <th>Email</th>
            {isActive && <th style={{ textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {list.map(item => {
            const ticket = isEnvelope ? item.ticket : item;
            if (!ticket) return null;
            const statut = ticket.statut;
            return (
              <tr key={item.id || ticket.id}>
                <td className="t1d-ref">#{ticket.id}</td>
                <td
                  style={{ maxWidth: '320px', cursor: onTicketClick ? 'pointer' : 'default' }}
                  onClick={() => onTicketClick && onTicketClick(ticket)}
                  title={onTicketClick ? 'Voir les détails du ticket' : ''}
                >
                  <p style={{
                    margin: 0, fontWeight: 700, fontSize: '13.5px',
                    color: '#0f172a', lineHeight: '1.4',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {ticket.titre}
                  </p>
                  <p style={{
                    margin: '3px 0 6px', fontSize: '12px', color: '#64748b',
                    lineHeight: '1.5', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {ticket.description}
                  </p>
                  {ticket.equipement?.nom && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                      fontWeight: 600, background: '#f0fdf4',
                      color: '#15803d', border: '1px solid #bbf7d0'
                    }}>
                      🖥 EQ: {ticket.equipement.nom}
                    </span>
                  )}
                </td>
                <td>{getPriorityBadge(ticket.priorite)}</td>
                <td>{getStatusBadge(statut)}</td>
                <td style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                  {ticket.demandeur?.nom || '—'}
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {ticket.demandeur?.telephone
                    ? <a href={`tel:${ticket.demandeur.telephone}`} style={{ color: '#047857', fontWeight: 600, textDecoration: 'none' }}>📞 {ticket.demandeur.telephone}</a>
                    : <span style={{ color: '#94a3b8' }}>—</span>}
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  {ticket.demandeur?.email
                    ? <a href={`mailto:${ticket.demandeur.email}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>✉️ {ticket.demandeur.email}</a>
                    : <span style={{ color: '#94a3b8' }}>—</span>}
                </td>
                {isActive && onAction && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button
                        className="t1d-btn t1d-btn-primary t1d-btn-sm"
                        onClick={() => onTerminate(item)}
                      >
                        Terminer
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}