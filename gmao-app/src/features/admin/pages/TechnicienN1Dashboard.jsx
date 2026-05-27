import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import toast, { Toaster } from 'react-hot-toast';
import './TechnicienN1Dashboard.css';

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
  addRemoteActionN1,
  terminateInterventionN1,
  escalateToN2N1
} from '../../../services/api';
import axios from 'axios';

// Subcomponents — ⚠️ LOGIQUE MÉTIER INTACTE
import TicketCard from '../../../components/TicketCard';
import ReportModal from '../../../components/ReportModal';
import NotificationBell from '../../../components/NotificationBell';
import UserProfile from './UserProfile';

export default function TechnicienN1Dashboard() {
  const navigate = useNavigate();
  const { token, role, userId, userName, logout } = useAuth();
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
      await addRemoteActionN1(interventionId, data.actionADistance);
      await axios.put(
        `http://localhost:8080/api/technicien/interventions/${interventionId}/actions`,
        {
          actionADistance: data.actionADistance,
          surSiteEffectue: data.surSiteEffectue,
          manipulationLourdeEffectue: data.manipulationLourdeEffectue
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await terminateInterventionN1(interventionId, data.commentaire);
      toast.success(`Intervention #${interventionId} clôturée et validée !`, { duration: 4000, icon: '🎉' });
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la clôture de l'intervention");
      throw error;
    }
  };

  const handleSubmitEscalate = async (interventionId, data) => {
    try {
      await addRemoteActionN1(interventionId, data.actionADistance);
      await axios.put(
        `http://localhost:8080/api/technicien/interventions/${interventionId}/actions`,
        {
          actionADistance: data.actionADistance,
          surSiteEffectue: data.surSiteEffectue,
          manipulationLourdeEffectue: data.manipulationLourdeEffectue
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await escalateToN2N1(interventionId, data.commentaire);
      toast.success(`Intervention #${interventionId} escaladée au Support N2 !`, { duration: 4000, icon: '📤' });
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'escalade de l'intervention");
      throw error;
    }
  };

  const handleOpenReportModal = (interventionData) => {
    setSelectedIntervention(interventionData);
    setIsReportModalOpen(true);
  };

  // ---------- STATS — LOGIQUE INTACTE ----------
  const stats = {
    available: availableTickets.length,
    active: activeInterventions.length,
    closed: historyInterventions.filter(i => String(i.ticket?.statut).toUpperCase() === 'CLOTURE').length,
    escalated: historyInterventions.filter(i => String(i.ticket?.statut).toUpperCase() === 'ESCALADE_N2').length,
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
      const matchesPriority = priorityFilter === 'ALL' || String(ticket.priorite).toUpperCase() === priorityFilter;
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
        availableTickets.filter(t => String(t.priorite).toUpperCase() === 'HIGH').length +
        activeInterventions.filter(i => String(i.ticket?.priorite).toUpperCase() === 'HIGH').length
    },
    {
      name: 'Moyenne',
      tickets:
        availableTickets.filter(t => String(t.priorite).toUpperCase() === 'MEDIUM').length +
        activeInterventions.filter(i => String(i.ticket?.priorite).toUpperCase() === 'MEDIUM').length
    },
    {
      name: 'Normale',
      tickets:
        availableTickets.filter(t => String(t.priorite).toUpperCase() === 'LOW').length +
        activeInterventions.filter(i => String(i.ticket?.priorite).toUpperCase() === 'LOW').length
    }
  ];

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  // ---------- HELPERS UI ----------
  const getPriorityBadge = (priorite) => {
    const p = String(priorite).toUpperCase();
    if (p === 'HIGH') return <span className="t1d-badge t1d-badge-high">Urgent</span>;
    if (p === 'MEDIUM') return <span className="t1d-badge t1d-badge-medium">Moyenne</span>;
    return <span className="t1d-badge t1d-badge-low">Normale</span>;
  };

  const getStatusBadge = (statut) => {
    const s = String(statut).toUpperCase();
    if (s === 'EN_ATTENTE')
      return <span className="t1d-status t1d-status-pending"><span className="t1d-status-dot" />En attente</span>;
    if (s === 'EN_COURS')
      return <span className="t1d-status t1d-status-active"><span className="t1d-status-dot" />En cours</span>;
    if (s === 'CLOTURE')
      return <span className="t1d-status t1d-status-closed"><span className="t1d-status-dot" />Clôturé</span>;
    if (s === 'ESCALADE_N2')
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

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <aside className="t1d-sidebar">

        {/* Logo / App header */}
        <div className="t1d-sidebar-header">
          <div className="t1d-sidebar-logo">
            <div className="t1d-sidebar-logo-icon">OCP</div>
            <div>
              <h1 className="t1d-sidebar-title">GESTION DES INTERVENTIONS</h1>
              <p className="t1d-sidebar-subtitle">Support Technicien N1</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="t1d-sidebar-nav">
          <button
            className={`t1d-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={20} />
            Tableau de bord
          </button>

          <button
            className={`t1d-nav-item ${activeTab === 'interventions' ? 'active' : ''}`}
            onClick={() => setActiveTab('interventions')}
          >
            <Wrench size={20} />
            Interventions
            {(stats.available + stats.active) > 0 && (
              <span className="t1d-nav-badge">{stats.available + stats.active}</span>
            )}
          </button>

          <button
            className={`t1d-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            Mon Profil
          </button>
        </nav>

        {/* User info + logout */}
        <div className="t1d-sidebar-footer">
          <div className="t1d-user-badge">
            <div className="t1d-user-avatar">{userInitials}</div>
            <div className="t1d-user-info">
              <p className="t1d-user-name">{userName || 'Technicien N1'}</p>
              <p className="t1d-user-dept">Division Khouribga</p>
            </div>
          </div>
          <button
            className="t1d-logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={18} /> Déconnexion
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
            <p className="t1d-header-subtitle">Site OCP Khouribga — Service Support N1</p>
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
              <div className="t1d-fade-in">

                {/* Active intervention quick-banner */}
                {activeInterventions.length > 0 && (
                  <div className="t1d-active-banner">
                    <div className="t1d-active-banner-info">
                      <p className="t1d-active-banner-label">
                        <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Intervention en cours
                      </p>
                      <p className="t1d-active-banner-title">
                        {activeInterventions[0]?.ticket?.titre || `Ticket #${activeInterventions[0]?.ticket?.id}`}
                      </p>
                    </div>
                    <div className="t1d-active-banner-actions">
                      <button
                        className="t1d-banner-btn t1d-banner-btn-close"
                        onClick={() => handleOpenReportModal(activeInterventions[0])}
                      >
                        <CheckCircle size={16} /> Clôturer
                      </button>
                      <button
                        className="t1d-banner-btn t1d-banner-btn-escalate"
                        onClick={() => handleOpenReportModal(activeInterventions[0])}
                      >
                        <ShieldAlert size={16} /> Escalader N2
                      </button>
                    </div>
                  </div>
                )}

                {/* STAT CARDS */}
                <div className="t1d-stats-grid">
                  <div
                    className="t1d-stat-card blue"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('PENDING'); }}
                  >
                    <div>
                      <p className="t1d-stat-label">Tickets disponibles</p>
                      <p className="t1d-stat-value">{stats.available}</p>
                      <p className="t1d-stat-trend">Nouveaux incidents</p>
                    </div>
                    <div className="t1d-stat-icon"><Inbox size={26} /></div>
                  </div>

                  <div
                    className="t1d-stat-card green"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('EN_COURS'); }}
                  >
                    <div>
                      <p className="t1d-stat-label">En cours</p>
                      <p className="t1d-stat-value">{stats.active}</p>
                      <p className="t1d-stat-trend">Interventions actives</p>
                    </div>
                    <div className="t1d-stat-icon"><Wrench size={26} /></div>
                  </div>

                  <div
                    className="t1d-stat-card slate"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('HISTORIQUE'); }}
                  >
                    <div>
                      <p className="t1d-stat-label">Clôturés</p>
                      <p className="t1d-stat-value">{stats.closed}</p>
                      <p className="t1d-stat-trend">Incidents résolus</p>
                    </div>
                    <div className="t1d-stat-icon"><CheckCircle size={26} /></div>
                  </div>

                  <div
                    className="t1d-stat-card amber"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('HISTORIQUE'); }}
                  >
                    <div>
                      <p className="t1d-stat-label">Escaladés N2</p>
                      <p className="t1d-stat-value">{stats.escalated}</p>
                      <p className="t1d-stat-trend">Transmis sur-site</p>
                    </div>
                    <div className="t1d-stat-icon"><AlertTriangle size={26} /></div>
                  </div>
                </div>

                {/* CHARTS */}
                <div className="t1d-charts-grid">
                  {/* Bar chart — volume */}
                  <div className="t1d-chart-card">
                    <div className="t1d-chart-header">
                      <div className="t1d-chart-title-row">
                        <BarChart3 size={18} color="#047857" />
                        <h4 className="t1d-chart-title">Volume Global des Tickets N1</h4>
                      </div>
                      <span className="t1d-chip">Temps réel</span>
                    </div>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeChartData} barSize={36}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                            cursor={{ fill: 'rgba(241,245,249,0.6)' }}
                          />
                          <Bar dataKey="tickets" radius={[6, 6, 0, 0]}>
                            {volumeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie chart — priority */}
                  <div className="t1d-chart-card">
                    <div className="t1d-chart-header">
                      <div className="t1d-chart-title-row">
                        <TrendingUp size={18} color="#047857" />
                        <h4 className="t1d-chart-title">Répartition par Criticité</h4>
                      </div>
                      <span className="t1d-chip">Flux de Support</span>
                    </div>
                    {stats.available + stats.active === 0 ? (
                      <div className="t1d-empty" style={{ height: 220 }}>
                        <SlidersHorizontal size={36} className="t1d-empty-icon" />
                        <p className="t1d-empty-text">Aucune intervention active à cartographier.</p>
                      </div>
                    ) : (
                      <div style={{ height: 220, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={priorityChartData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="tickets">
                              {priorityChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1rem' }}>
                          {priorityChartData.map((item, index) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PIE_COLORS[index], flexShrink: 0 }} />
                              {item.name} : {item.tickets}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent tickets preview */}
                <div className="t1d-card">
                  <div className="t1d-section-header">
                    <div>
                      <h3 className="t1d-section-title">Derniers tickets en file d'attente</h3>
                      <p className="t1d-section-subtitle">Incidents disponibles à prendre en charge</p>
                    </div>
                    <button
                      className="t1d-view-all"
                      onClick={() => { setActiveTab('interventions'); setActiveSubFilter('PENDING'); }}
                    >
                      Voir tout <ChevronRight size={16} />
                    </button>
                  </div>

                  {availableTickets.length === 0 ? (
                    <div className="t1d-empty">
                      <Inbox size={36} className="t1d-empty-icon" />
                      <p className="t1d-empty-title">File d'attente vide</p>
                      <p className="t1d-empty-text">Aucun ticket disponible dans la file d'attente générale.</p>
                    </div>
                  ) : (
                    <div>
                      {availableTickets.slice(0, 4).map(ticket => (
                        <div key={ticket.id} className="t1d-recent-item">
                          <div className="t1d-recent-info">
                            <p className="t1d-recent-ref">TICKET #{ticket.id}</p>
                            <p className="t1d-recent-title">{ticket.titre}</p>
                          </div>
                          {getPriorityBadge(ticket.priorite)}
                          <button
                            className="t1d-btn t1d-btn-primary t1d-btn-sm"
                            onClick={() => handleStartIntervention(ticket.id)}
                          >
                            Prendre en charge
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
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
                          getPriorityBadge={getPriorityBadge}
                          getStatusBadge={getStatusBadge}
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
                        <Inbox size={40} className="t1d-empty-icon" />
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
                        <Wrench size={40} className="t1d-empty-icon" />
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
                        getPriorityBadge={getPriorityBadge}
                        getStatusBadge={getStatusBadge}
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
                        <History size={40} className="t1d-empty-icon" />
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
            <th style={{ textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map(ticket => (
            <tr key={ticket.id}>
              <td className="t1d-ref">#{ticket.id}</td>
              <td>
                <p className="t1d-ticket-title">{ticket.titre}</p>
                <p className="t1d-ticket-desc">{ticket.description}</p>
                {ticket.equipement?.nom && (
                  <span className="t1d-eq-tag">EQ: {ticket.equipement.nom}</span>
                )}
              </td>
              <td>{getPriorityBadge(ticket.priorite)}</td>
              <td style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                {ticket.demandeur?.nom || '—'}
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
function InterventionTable({ list, isEnvelope, isActive, onAction, getPriorityBadge, getStatusBadge }) {
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
                <td>
                  <p className="t1d-ticket-title">{ticket.titre}</p>
                  <p className="t1d-ticket-desc">{ticket.description}</p>
                  {ticket.equipement?.nom && (
                    <span className="t1d-eq-tag">EQ: {ticket.equipement.nom}</span>
                  )}
                </td>
                <td>{getPriorityBadge(ticket.priorite)}</td>
                <td>{getStatusBadge(statut)}</td>
                <td style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                  {ticket.demandeur?.nom || '—'}
                </td>
                {isActive && onAction && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        className="t1d-btn t1d-btn-danger t1d-btn-sm"
                        onClick={() => onAction(item)}
                      >
                        <CheckCircle size={14} /> Clôturer
                      </button>
                      <button
                        className="t1d-btn t1d-btn-warning t1d-btn-sm"
                        onClick={() => onAction(item)}
                      >
                        <ShieldAlert size={14} /> Escalader
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