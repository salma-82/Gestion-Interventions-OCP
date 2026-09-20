import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import toast, { Toaster } from 'react-hot-toast';
import './TechnicienN2Dashboard.css';
import logoOCP from '/src/assets/logo-ocp.png';

// Lucide Icons
import {
  LayoutDashboard,
  Wrench,
  User,
  LogOut,
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
  Zap,
  Truck,
  FileText,
  MapPin,
  Check,
  ArrowUp,
  Settings,
  Cpu,
  Globe,
  Database
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

// Services / APIs
import {
  getEscalatedN2Tickets,
  getMyInterventions,
  getMyHistory,
  startInterventionN2,
  saveAction,
  escalateToN3,
  closeTicket,
  getTicketInterventions
} from '../../../services/api';

import UserProfile from './UserProfile';
import NotificationBell from '../../../components/NotificationBell';

export default function TechnicienN2Dashboard() {
  const navigate = useNavigate();
  const { token, role, userId, userName, logout, profileImage } = useAuth();
  const { fetchNotifications } = useNotifications();

  // ---------- STATES ----------
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubFilter, setActiveSubFilter] = useState('ALL');

  const [availableTickets, setAvailableTickets] = useState([]);
  const [activeInterventions, setActiveInterventions] = useState([]);
  const [historyInterventions, setHistoryInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Expanded ticket details (N1 reports)
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [n1Reports, setN1Reports] = useState({});

  // On-Site checklist details (saved in BDD)
  const [onSiteChecklist, setOnSiteChecklist] = useState({
    machineState: 'OK',
    networkState: 'OK',
    connectivity: 'OK',
    servicesState: 'OK',
    tests: [],
    customObservations: ''
  });

  // Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    diagnostic: '',
    probleme: '',
    actionCorrective: '',
    testReseau: false,
    testSysteme: false,
    posteUtilisateur: false,
    observations: '',
    gravite: 'MEDIUM'
  });

  // ---------- DATA SYNC ----------
  const loadDashboardData = async () => {
    if (!token || !userId) return;
    try {
      const [available, active, history] = await Promise.all([
        getEscalatedN2Tickets(),
        getMyInterventions(userId),
        getMyHistory(userId)
      ]);
      setAvailableTickets(Array.isArray(available) ? available : []);
      setActiveInterventions(Array.isArray(active) ? active : []);
      setHistoryInterventions(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Erreur de synchronisation des données  N2:', error);
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

  // Read checklist state from BDD when an active intervention is loaded
  useEffect(() => {
    if (activeInterventions.length > 0) {
      const intervention = activeInterventions[0];
      try {
        if (intervention.actionADistance) {
          const parsed = JSON.parse(intervention.actionADistance);
          if (parsed.subStatus === 'ON_SITE_N2') {
            setOnSiteChecklist({
              machineState: parsed.machineState || 'OK',
              networkState: parsed.networkState || 'OK',
              connectivity: parsed.connectivity || 'OK',
              servicesState: parsed.servicesState || 'OK',
              tests: parsed.tests || [],
              customObservations: parsed.customObservations || ''
            });
          }
        }
      } catch (e) {
        // Not a JSON, keep default
      }
    }
  }, [activeInterventions.length]);

  // ---------- N1 REPORTS RETRIEVAL ----------
  const toggleExpandTicket = async (ticketId) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      return;
    }
    setExpandedTicketId(ticketId);
    if (!n1Reports[ticketId]) {
      try {
        const interventions = await getTicketInterventions(ticketId);
        // Find previous N1 report (usually the closed or escalated N1 intervention)
        const n1Int = interventions.find(i => i.rapport && i.rapport.includes('[Ticket Escaladé]'));
        const report = n1Int ? n1Int.rapport.replace(' [Ticket Escaladé]', '') : 'Diagnostic N1 : Problème non résolu à distance, nécessite intervention physique sur site.';
        setN1Reports(prev => ({ ...prev, [ticketId]: report }));
      } catch (error) {
        console.error('Erreur de récupération du rapport N1:', error);
        setN1Reports(prev => ({ ...prev, [ticketId]: 'Impossible de charger le diagnostic N1.' }));
      }
    }
  };

  // ---------- WORKFLOW ACTION HANDLERS ----------
  const handleTakeCharge = async (ticketId) => {
    try {
      const result = await startInterventionN2(ticketId, userId);
      const departureTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      // Save initial IN_TRANSIT_N2 status in BDD
      const initialActionData = {
        subStatus: 'IN_TRANSIT_N2',
        departureTime: departureTime,
        location: result.ticket?.equipement?.localisation || 'Bureau Utilisateur'
      };

      await saveAction(result.id, {
        actionADistance: JSON.stringify(initialActionData),
        surSiteEffectue: false,
        manipulationLourdeEffectue: false
      });

      toast.success("Ticket pris en charge. En déplacement !", { icon: '🚗' });
      setActiveSubFilter('EN_COURS');
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la prise en charge du ticket");
    }
  };

  const handleArriveOnSite = async (intervention) => {
    try {
      const departureTime = activeInterventions[0] ? (() => {
        try {
          const parsed = JSON.parse(activeInterventions[0].actionADistance);
          return parsed.departureTime;
        } catch (e) {
          return '';
        }
      })() : '';

      const updatedActionData = {
        subStatus: 'ON_SITE_N2',
        departureTime: departureTime || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        arrivalTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        machineState: 'OK',
        networkState: 'OK',
        connectivity: 'OK',
        servicesState: 'OK',
        tests: [],
        customObservations: ''
      };

      await saveAction(intervention.id, {
        actionADistance: JSON.stringify(updatedActionData),
        surSiteEffectue: true,
        manipulationLourdeEffectue: false
      });

      toast.success("Arrivé sur site ! Diagnostic et tests activés.", { icon: '🧑💻' });
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la validation de l'arrivée");
    }
  };

  const handleSaveChecklist = async () => {
    if (activeInterventions.length === 0) return;
    const intervention = activeInterventions[0];
    try {
      const departureTime = (() => {
        try {
          return JSON.parse(intervention.actionADistance).departureTime;
        } catch (e) { return ''; }
      })();
      const arrivalTime = (() => {
        try {
          return JSON.parse(intervention.actionADistance).arrivalTime;
        } catch (e) { return ''; }
      })();

      const updatedActionData = {
        subStatus: 'ON_SITE_N2',
        departureTime,
        arrivalTime,
        ...onSiteChecklist
      };

      await saveAction(intervention.id, {
        actionADistance: JSON.stringify(updatedActionData),
        surSiteEffectue: true,
        manipulationLourdeEffectue: false
      });

      toast.success("Avancement des tests sauvegardé en base de données !", { icon: '💾' });
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleOpenReport = () => {
    // Pre-fill report modal with checklist values
    setReportForm({
      diagnostic: `Tests effectués : ${onSiteChecklist.tests.join(', ') || 'Aucun test spécifique coché'}.\nÉtat Machine: ${onSiteChecklist.machineState}, Réseau: ${onSiteChecklist.networkState}.`,
      probleme: onSiteChecklist.customObservations || '',
      actionCorrective: '',
      testReseau: onSiteChecklist.networkState === 'OK',
      testSysteme: onSiteChecklist.servicesState === 'OK',
      posteUtilisateur: true,
      observations: '',
      gravite: 'MEDIUM'
    });
    setIsReportModalOpen(true);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (activeInterventions.length === 0) return;
    const intervention = activeInterventions[0];

    try {
      // Format technical report string
      const formattedReport = `--- RAPPORT TECHNIQUE N2 ---
Diagnostic: ${reportForm.diagnostic}
Problème Détecté: ${reportForm.probleme}
Action Corrective: ${reportForm.actionCorrective}
Test Réseau Effectué: ${reportForm.testReseau ? 'OUI' : 'NON'}
Test Système Effectué: ${reportForm.testSysteme ? 'OUI' : 'NON'}
Intervention sur Poste: ${reportForm.posteUtilisateur ? 'OUI' : 'NON'}
Observations Technicien: ${reportForm.observations}
Niveau Gravité: ${reportForm.gravite}`;

      await closeTicket(intervention.id, formattedReport);
      toast.success("Intervention résolue et clôturée avec succès !", { icon: '🔒', duration: 4000 });
      setIsReportModalOpen(false);
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la clôture de l'intervention");
    }
  };

  const handleSubmitEscalation = async () => {
    if (activeInterventions.length === 0) return;
    const intervention = activeInterventions[0];

    try {
      const formattedReport = `--- RAPPORT ESCALADE N3 ---
Diagnostic: ${reportForm.diagnostic}
Problème Détecté: ${reportForm.probleme}
Action Proposée: ${reportForm.actionCorrective} (Remplacement / Intervention physique N3 requise)
Test Réseau Effectué: ${reportForm.testReseau ? 'OUI' : 'NON'}
Test Système Effectué: ${reportForm.testSysteme ? 'OUI' : 'NON'}
Intervention sur Poste: ${reportForm.posteUtilisateur ? 'OUI' : 'NON'}
Observations Escalade: ${reportForm.observations}
Niveau Gravité: ${reportForm.gravite}`;

      await escalateToN3(intervention.id, formattedReport);
      toast.success("Intervention escaladée vers le Support N3 (Expert) !", { icon: '⬆', duration: 4000 });
      setIsReportModalOpen(false);
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'escalade");
    }
  };

  // ---------- STATS CALCULATIONS ----------
  const stats = {
    available: availableTickets.length,
    active: activeInterventions.length,
    closed: historyInterventions.filter(i => String(i.ticket?.statut).toUpperCase() === 'CLOTURE').length,
    escalated: historyInterventions.filter(i => String(i.ticket?.statut).toUpperCase() === 'ESCALADE_N3').length,
  };

  const getTempsMoyenResolution = () => {
    const closedInts = historyInterventions.filter(i => i.dateFin && String(i.ticket?.statut).toUpperCase() === 'CLOTURE');
    if (closedInts.length === 0) return "1h 45m"; // fallback réaliste

    let totalMinutes = 0;
    closedInts.forEach(i => {
      const start = new Date(i.dateDebut);
      const end = new Date(i.dateFin);
      const diffMs = end - start;
      totalMinutes += Math.floor(diffMs / 60000);
    });

    const avgMinutes = Math.floor(totalMinutes / closedInts.length);
    if (avgMinutes < 60) return `${avgMinutes}m`;
    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  // ---------- SEARCH & FILTER ----------
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

  // ---------- CHARTS DATA ----------
  const volumeChartData = [
    { name: 'Escaladés N2', tickets: stats.available, color: '#f59e0b' },
    { name: 'En cours N2', tickets: stats.active, color: '#10b981' },
    { name: 'Résolus', tickets: stats.closed, color: '#047857' },
    { name: 'Transmis N3', tickets: stats.escalated, color: '#ef4444' }
  ];

  const priorityChartData = [
    {
      name: 'Critique (Urgent)',
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

  const PIE_COLORS = ['#dc2626', '#f59e0b', '#047857'];

  // ---------- HELPERS UI ----------
  const getPriorityBadge = (priorite) => {
    const p = String(priorite).toUpperCase();
    if (p === 'HIGH' || p === 'URGENT') return <span className="n2-badge n2-badge-high">Critique</span>;
    if (p === 'MEDIUM' || p === 'MOYENNE') return <span className="n2-badge n2-badge-medium">Moyenne</span>;
    return <span className="n2-badge n2-badge-low">Normale</span>;
  };

  const getStatusBadge = (statut) => {
    const s = String(statut).toUpperCase();
    if (s === 'ESCALADE_N2' || s === 'ESCALATED_N2')
      return <span className="n2-status n2-status-escalated"><span className="n2-dot" />Escaladé N2</span>;
    if (s === 'EN_COURS_N2' || s === 'IN_PROGRESS_N2' || s === 'EN_COURS')
      return <span className="n2-status n2-status-active"><span className="n2-dot" />En cours N2</span>;
    if (s === 'CLOTURE' || s === 'CLOSED')
      return <span className="n2-status n2-status-closed"><span className="n2-dot" />Clôturé</span>;
    if (s === 'ESCALADE_N3' || s === 'ESCALATED_N3')
      return <span className="n2-status n2-status-escalated3"><span className="n2-dot" />Escaladé N3</span>;
    return <span className="n2-status n2-status-escalated"><span className="n2-dot" />{statut}</span>;
  };

  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'T2';

  // Read current active sub-status (IN_TRANSIT_N2 or ON_SITE_N2)
  const getActiveWorkflowSubStatus = () => {
    if (activeInterventions.length === 0) return null;
    const intervention = activeInterventions[0];
    try {
      if (intervention.actionADistance) {
        const parsed = JSON.parse(intervention.actionADistance);
        if (parsed.subStatus) return parsed.subStatus;
      }
    } catch (e) { }
    return 'IN_TRANSIT_N2'; // default fallback
  };

  const activeWorkflowStatus = getActiveWorkflowSubStatus();

  return (
    <div className="n2-wrapper">
      <Toaster position="top-right" reverseOrder={false} />

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <aside className="n2-sidebar">
        <div className="n2-sidebar-header">
          <div className="n2-logo-row">
            <img src={logoOCP} alt="Logo OCP" className="n2-logo-img" />
            <div>
              <h2 className="n2-logo-title">Support Technique – Niveau 2</h2>
            </div>
          </div>
        </div>

        <nav className="n2-nav">
          <span className="n2-nav-section-label">Supervision</span>
          <button
            className={`n2-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard N2
          </button>

          <button
            className={`n2-nav-btn ${activeTab === 'interventions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('interventions'); setActiveSubFilter('ALL'); }}
          >
            <Wrench size={18} />
            Interventions Terrain
            {(stats.available + stats.active) > 0 && (
              <span className="n2-nav-badge">{stats.available + stats.active}</span>
            )}
          </button>

          <span className="n2-nav-section-label">Profil</span>
          <button
            className={`n2-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Mon Profil
          </button>
        </nav>

        <div className="n2-sidebar-footer">
          <div className="n2-user-card">
            <div
              className={`n2-user-avatar ${profileImage ? 'has-image' : ''}`}
              style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
            >
              {!profileImage && userInitials}
            </div>
            <div>
              <p className="n2-user-name" title={userName}>{userName || 'Technicien N2'}</p>
              <p className="n2-user-role">Support Terrain N2</p>
            </div>
          </div>
          <button
            className="n2-logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ══════════════════════ MAIN ══════════════════════ */}
      <main className="n2-main">
        {/* ─── TOPBAR ─── */}
        <header className="n2-header">
          <div className="n2-header-left">
            <div className="n2-header-breadcrumb">
              <span></span> Service Informatique
            </div>
            <h2 className="n2-header-title">
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'interventions' && 'Gestion des Interventions '}
              {activeTab === 'profile' && 'Profil '}
            </h2>
          </div>

          <div className="n2-header-actions">
            <NotificationBell
              onRefresh={loadDashboardData}
              refreshLoading={loading}
              refreshTitle="Actualiser les données"
            />
          </div>
        </header>

        {/* ─── CONTENT ─── */}
        <div className="n2-content">
          <div className="n2-container">

            {/* Loading Indicator */}
            {loading && availableTickets.length === 0 && activeInterventions.length === 0 && (
              <div className="n2-loader">
                <div className="n2-spinner" />
                <p className="n2-loader-text">Synchronisation sécurisée avec la base MySQL...</p>
              </div>
            )}

            {/* ══════════════════ TAB 1 : DASHBOARD ══════════════════ */}
            {activeTab === 'dashboard' && !loading && (
              <div className="n2-fade-in">

                {/* WORKFLOW ACTIVE INTERVENTION BANNER */}
                {activeInterventions.length > 0 && (
                  <>
                    {activeWorkflowStatus === 'IN_TRANSIT_N2' ? (
                      <div className="n2-workflow-banner transit">
                        <div className="n2-workflow-banner-info">
                          <p className="n2-workflow-banner-label">
                            <Truck size={14} style={{ display: 'inline', marginRight: 6 }} />
                            Déplacement en cours
                          </p>
                          <h4 className="n2-workflow-banner-title">
                            Incident : {activeInterventions[0].ticket?.titre}
                          </h4>
                          <p className="n2-workflow-banner-meta">
                            Destinataire : {activeInterventions[0].ticket?.demandeur?.prenom} {activeInterventions[0].ticket?.demandeur?.nom}
                            &nbsp;• Localisation : <strong>{activeInterventions[0].ticket?.equipement?.localisation || 'Bureau'}</strong>
                            &nbsp;• Parti à : {(() => {
                              try {
                                return JSON.parse(activeInterventions[0].actionADistance).departureTime;
                              } catch (e) { return 'En cours'; }
                            })()}
                          </p>

                          {/* CSS Travel Animation */}
                          <div style={{ marginTop: '1rem', width: '100%', maxWidth: '400px' }}>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                background: '#ffffff',
                                width: '20%',
                                borderRadius: '3px',
                                position: 'absolute',
                                animation: 'n2-transit-slide 2s infinite ease-in-out'
                              }} />
                            </div>
                            <style>{`
                              @keyframes n2-transit-slide {
                                0% { left: -20%; }
                                100% { left: 100%; }
                              }
                            `}</style>
                          </div>
                        </div>

                        <div className="n2-workflow-banner-actions">
                          <button
                            className="n2-banner-btn n2-banner-btn-white"
                            onClick={() => handleArriveOnSite(activeInterventions[0])}
                          >

                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="n2-workflow-banner onsite">
                        <div className="n2-workflow-banner-info">
                          <p className="n2-workflow-banner-label">

                            Intervention en cours sur site
                          </p>
                          <h4 className="n2-workflow-banner-title">
                            Incident : {activeInterventions[0].ticket?.titre}
                          </h4>
                          <p className="n2-workflow-banner-meta">
                            Équipement : {activeInterventions[0].ticket?.equipement?.nom} ({activeInterventions[0].ticket?.equipement?.codeInventaire})
                            &nbsp;• Bureau : {activeInterventions[0].ticket?.equipement?.localisation || 'Sur Site'}
                          </p>
                        </div>

                        <div className="n2-workflow-banner-actions">
                          <button
                            className="n2-banner-btn n2-banner-btn-white"
                            onClick={() => { setActiveTab('interventions'); setActiveSubFilter('EN_COURS'); }}
                          >
                            Checklist & Diagnostic
                          </button>
                          <button
                            className="n2-banner-btn n2-banner-btn-outline"
                            onClick={handleOpenReport}
                          >
                            Clôturer / Escalader N3
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* STAT CARDS */}
                <div className="n2-stats-grid">
                  <div
                    className="n2-stat-card amber"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('PENDING'); }}
                  >
                    <div>
                      <p className="n2-nav-section-label" style={{ padding: 0, margin: 0 }}>En attente N2</p>
                      <p className="n2-stat-value">{stats.available}</p>
                      <p className="n2-stat-sub">Tickets à traiter</p>
                    </div>
                    <div className="n2-stat-icon"></div>
                  </div>

                  <div
                    className="n2-stat-card green"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('EN_COURS'); }}
                  >
                    <div>
                      <p className="n2-nav-section-label" style={{ padding: 0, margin: 0, color: 'rgba(255,255,255,0.7)' }}>Actives</p>
                      <p className="n2-stat-value">{stats.active}</p>
                      <p className="n2-stat-sub">En cours terrain</p>
                    </div>
                    <div className="n2-stat-icon"></div>
                  </div>

                  <div
                    className="n2-stat-card slate"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('HISTORIQUE'); }}
                  >
                    <div>
                      <p className="n2-nav-section-label" style={{ padding: 0, margin: 0 }}>Résolues</p>
                      <p className="n2-stat-value">{stats.closed}</p>
                      <p className="n2-stat-sub">Tickets clôturés</p>
                    </div>
                    <div className="n2-stat-icon"></div>
                  </div>

                  <div className="n2-stat-card red">
                    <div>
                      <p className="n2-nav-section-label" style={{ padding: 0, margin: 0 }}>Résolution</p>
                      <p className="n2-stat-value" style={{ fontSize: '1.7rem' }}>{getTempsMoyenResolution()}</p>
                      <p className="n2-stat-sub">Temps moyen</p>
                    </div>
                    <div className="n2-stat-icon"></div>
                  </div>
                </div>

                {/* CHARTS GRID */}
                <div className="n2-charts-grid">
                  {/* Bar chart - Volume */}
                  <div className="n2-chart-card">
                    <div className="n2-chart-title-row">
                      <BarChart3 size={18} color="#047857" />
                      <h4 className="n2-chart-title">Volume d'Activité Technicien N2</h4>
                      <span className="n2-chip">Base MySQL</span>
                    </div>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeChartData} barSize={34}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                            cursor={{ fill: 'rgba(241,245,249,0.5)' }}
                          />
                          <Bar dataKey="tickets" radius={[5, 5, 0, 0]}>
                            {volumeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie chart - Criticité */}
                  <div className="n2-chart-card">
                    <div className="n2-chart-title-row">
                      <TrendingUp size={18} color="#047857" />
                      <h4 className="n2-chart-title">Priorité des Tickets N2 Gérés</h4>
                      <span className="n2-chip">Criticité</span>
                    </div>
                    {stats.available + stats.active === 0 ? (
                      <div className="n2-empty" style={{ height: 220, padding: 0 }}>
                        <SlidersHorizontal size={32} className="n2-empty-icon" />
                        <p className="n2-empty-text">Aucun ticket dans la file d'attente active.</p>
                      </div>
                    ) : (
                      <div style={{ height: 220, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={priorityChartData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="tickets">
                              {priorityChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '1rem' }}>
                          {priorityChartData.map((item, index) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PIE_COLORS[index] }} />
                              {item.name} : {item.tickets}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RECENT TICKETS PREVIEW */}
                <div className="n2-card">
                  <div className="n2-card-header">
                    <div>
                      <h3 className="n2-card-title">Derniers tickets escaladés sur site (N2)</h3>
                      <p className="n2-card-sub">Tickets disponibles en file d'attente</p>
                    </div>
                    <button
                      className="n2-view-all"
                      onClick={() => { setActiveTab('interventions'); setActiveSubFilter('PENDING'); }}
                    >
                      Voir la file d'attente
                    </button>
                  </div>

                  {availableTickets.length === 0 ? (
                    <div className="n2-empty">

                      <p className="n2-empty-title">File d'attente vide</p>
                      <p className="n2-empty-text">Aucun ticket n'a été escaladé vers le niveau support N2 pour l'instant.</p>
                    </div>
                  ) : (
                    <div>
                      {availableTickets.slice(0, 3).map(ticket => (
                        <div key={ticket.id} className="n2-activity-item">
                          <div className="n2-activity-icon" style={{ background: '#fffbeb', color: '#d97706' }}>

                          </div>
                          <div className="n2-activity-info">
                            <p className="n2-activity-title">{ticket.titre}</p>
                            <p className="n2-activity-meta">
                              Demandeur: {ticket.demandeur?.prenom} {ticket.demandeur?.nom}
                              &nbsp;• Bureau: <strong>{ticket.equipement?.localisation || 'Non précisé'}</strong>
                            </p>
                          </div>
                          {getPriorityBadge(ticket.priorite)}
                          <button
                            className="n2-btn n2-btn-primary n2-btn-sm"
                            onClick={() => handleTakeCharge(ticket.id)}
                            style={{ marginLeft: '1rem' }}
                          >
                            🚀 Prendre en charge
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
              <div className="n2-fade-in">

                {/* Sub-Filters Tabs */}
                <div className="n2-filters-row">
                  <div className="n2-tab-group">
                    {[
                      { key: 'ALL', label: 'Tous les flux' },
                      { key: 'PENDING', label: 'Disponibles', dot: stats.available > 0 },
                      { key: 'EN_COURS', label: 'Mes interventions', count: stats.active > 0 ? stats.active : null },
                      { key: 'HISTORIQUE', label: 'Mon Historique' }
                    ].map(item => (
                      <button
                        key={item.key}
                        className={`n2-tab-btn ${activeSubFilter === item.key ? 'active' : ''}`}
                        onClick={() => setActiveSubFilter(item.key)}
                      >
                        {item.label}
                        {item.dot && <span className="n2-tab-dot" />}
                        {item.count != null && <span className="n2-tab-count">{item.count}</span>}
                      </button>
                    ))}
                  </div>

                  {/* Search and priority filters */}
                  <div className="n2-search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      className="n2-search-input"
                      placeholder="Rechercher par titre, équipement, demandeur..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="n2-filter-select"
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                  >
                    <option value="ALL">Toutes criticités</option>
                    <option value="HIGH">Critique</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="LOW">Normale</option>
                  </select>
                </div>

                {/* ── SUB-VIEW : ALL FLUX ── */}
                {activeSubFilter === 'ALL' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Active Intervention in Progress */}
                    {activeInterventions.length > 0 && (
                      <div className="n2-card" style={{ borderLeft: '4px solid #047857' }}>
                        <div className="n2-card-header">
                          <div>
                            <h3 className="n2-card-title" style={{ color: '#047857' }}>Intervention active en cours de traitement</h3>
                            <p className="n2-card-sub">Vous avez un déplacement ou une intervention en cours sur site.</p>
                          </div>
                        </div>

                        {activeWorkflowStatus === 'IN_TRANSIT_N2' ? (
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                              <div>
                                <h4 style={{ margin: 0, fontWeight: 700 }}>🚗 En déplacement vers le poste utilisateur</h4>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                  Départ enregistré à {(() => {
                                    try { return JSON.parse(activeInterventions[0].actionADistance).departureTime; } catch (e) { return 'Non défini'; }
                                  })()}
                                </p>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#1e293b' }}>
                                  Équipement localisé au bureau : <strong>{activeInterventions[0].ticket?.equipement?.localisation || 'Non spécifié'}</strong>
                                </p>
                              </div>
                              <button
                                className="n2-btn n2-btn-grey"
                                onClick={() => handleArriveOnSite(activeInterventions[0])}
                                style={{ marginLeft: 'auto' }}
                              >
                                <MapPin size={16} /> Confirmer mon arrivée sur site
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <ActiveOnSiteInterventionPanel
                              intervention={activeInterventions[0]}
                              checklist={onSiteChecklist}
                              setChecklist={setOnSiteChecklist}
                              onSave={handleSaveChecklist}
                              onResolve={handleOpenReport}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Available tickets queue */}
                    <div className="n2-card">
                      <div className="n2-card-header">
                        <div>
                          <h3 className="n2-card-title">Tickets de la file d'attente </h3>
                          <p className="n2-card-sub">{availableTickets.length} ticket(s) en attente d'intervention physique</p>
                        </div>
                      </div>

                      {availableTickets.length === 0 ? (
                        <div className="n2-empty">

                          <p className="n2-empty-title">Aucun ticket à traiter</p>
                          <p className="n2-empty-text">Aucun incident de niveau 2 n'est en attente.</p>
                        </div>
                      ) : (
                        <AvailableTicketsTable
                          tickets={filterList(availableTickets, false)}
                          expandedId={expandedTicketId}
                          reports={n1Reports}
                          onExpand={toggleExpandTicket}
                          onTake={handleTakeCharge}
                          getPriorityBadge={getPriorityBadge}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUB-VIEW : PENDING (AVAILABLE) ── */}
                {activeSubFilter === 'PENDING' && (
                  <div className="n2-card">
                    <div className="n2-card-header">
                      <div>
                        <h3 className="n2-card-title">Tickets disponibles à prendre en charge (N2)</h3>
                        <p className="n2-card-sub">Prenez en charge un ticket pour débuter le déplacement.</p>
                      </div>
                    </div>

                    {filterList(availableTickets, false).length === 0 ? (
                      <div className="n2-empty">
                        <Inbox size={36} className="n2-empty-icon" />
                        <p className="n2-empty-title">Aucun ticket disponible</p>
                        <p className="n2-empty-text">Aucun ticket ne correspond à vos filtres de recherche.</p>
                      </div>
                    ) : (
                      <AvailableTicketsTable
                        tickets={filterList(availableTickets, false)}
                        expandedId={expandedTicketId}
                        reports={n1Reports}
                        onExpand={toggleExpandTicket}
                        onTake={handleTakeCharge}
                        getPriorityBadge={getPriorityBadge}
                      />
                    )}
                  </div>
                )}

                {/* ── SUB-VIEW : ACTIVE INTERVENTIONS ── */}
                {activeSubFilter === 'EN_COURS' && (
                  <div className="n2-card">
                    <div className="n2-card-header">
                      <div>
                        <h3 className="n2-card-title">Votre intervention active en cours</h3>
                        <p className="n2-card-sub">Mettez à jour votre avancement de diagnostic ou complétez le rapport.</p>
                      </div>
                    </div>

                    {activeInterventions.length === 0 ? (
                      <div className="n2-empty">
                        <Wrench size={36} className="n2-empty-icon" />
                        <p className="n2-empty-title">Aucune intervention active</p>
                        <p className="n2-empty-text">Allez dans l'onglet "À prendre" pour lancer une intervention terrain.</p>
                        <button
                          className="n2-btn n2-btn-primary n2-btn-sm"
                          onClick={() => setActiveSubFilter('PENDING')}
                          style={{ marginTop: '0.5rem' }}
                        >
                          Voir les tickets disponibles
                        </button>
                      </div>
                    ) : (
                      <div>
                        {activeWorkflowStatus === 'IN_TRANSIT_N2' ? (
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                            <h4 style={{ margin: 0, fontWeight: 700 }}>🚗 En déplacement vers le poste utilisateur</h4>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                              Départ enregistré à {(() => {
                                try { return JSON.parse(activeInterventions[0].actionADistance).departureTime; } catch (e) { return 'Non défini'; }
                              })()}
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#1e293b' }}>
                              Équipement localisé au bureau : <strong>{activeInterventions[0].ticket?.equipement?.localisation || 'Non spécifié'}</strong>
                            </p>

                            <button
                              className="n2-btn n2-btn-grey"
                              onClick={() => handleArriveOnSite(activeInterventions[0])}
                              style={{ marginTop: '1rem' }}
                            >
                              <MapPin size={16} /> Confirmer mon arrivée sur site
                            </button>
                          </div>
                        ) : (
                          <ActiveOnSiteInterventionPanel
                            intervention={activeInterventions[0]}
                            checklist={onSiteChecklist}
                            setChecklist={setOnSiteChecklist}
                            onSave={handleSaveChecklist}
                            onResolve={handleOpenReport}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SUB-VIEW : HISTORY ── */}
                {activeSubFilter === 'HISTORIQUE' && (
                  <div className="n2-card">
                    <div className="n2-card-header">
                      <div>
                        <h3 className="n2-card-title">Votre historique d'interventions</h3>
                        <p className="n2-card-sub">Liste complète de vos actions terrain passées</p>
                      </div>
                    </div>

                    {filterList(historyInterventions, true).length === 0 ? (
                      <div className="n2-empty">
                        <History size={36} className="n2-empty-icon" />
                        <p className="n2-empty-title">Historique vide</p>
                        <p className="n2-empty-text">Vous n'avez pas encore finalisé d'intervention.</p>
                      </div>
                    ) : (
                      <div className="n2-table-wrap">
                        <table className="n2-table">
                          <thead>
                            <tr>
                              <th>Réf.</th>
                              <th>Incident</th>
                              <th>Localisation</th>
                              <th>Priorité</th>
                              <th>Date Clôture</th>
                              <th>Statut final</th>
                              <th>Rapport technique</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterList(historyInterventions, true).map(item => {
                              const ticket = item.ticket;
                              if (!ticket) return null;
                              return (
                                <tr key={item.id}>
                                  <td className="n2-ref">#{ticket.id}</td>
                                  <td>
                                    <p className="n2-ticket-title">{ticket.titre}</p>
                                    <p className="n2-ticket-desc">{ticket.description}</p>
                                    <span className="n2-eq-tag">EQ: {ticket.equipement?.nom}</span>
                                  </td>
                                  <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ticket.equipement?.localisation || '—'}</td>
                                  <td>{getPriorityBadge(ticket.priorite)}</td>
                                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {ticket.dateCloture ? new Date(ticket.dateCloture).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </td>
                                  <td>{getStatusBadge(ticket.statut)}</td>
                                  <td style={{ maxWidth: '300px' }}>
                                    <div style={{
                                      fontSize: '0.78rem',
                                      background: '#f8fafc',
                                      padding: '0.5rem',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      maxHeight: '120px',
                                      overflowY: 'auto',
                                      fontFamily: 'monospace',
                                      whiteSpace: 'pre-line'
                                    }}>
                                      {item.rapport || 'Aucun rapport enregistré.'}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ══════════════════ TAB 3 : PROFILE ══════════════════ */}
            {activeTab === 'profile' && (
              <div className="n2-fade-in">
                <div className="n2-card">
                  <UserProfile />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ══════════════════════ MANDATORY TECHNICAL REPORT MODAL ══════════════════════ */}
      {isReportModalOpen && (
        <div className="n2-modal-overlay">
          <div className="n2-modal">
            <div className="n2-modal-head">
              <div className="n2-modal-title-row">
                <div className="n2-modal-icon green">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="n2-modal-title">Rapport Technique Obligatoire N2</h3>
                  <p className="n2-modal-subtitle">Requis avant clôture définitive ou escalade Expert N3</p>
                </div>
              </div>
              <button
                className="n2-modal-close-btn"
                onClick={() => setIsReportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitResolution}>
              <div className="n2-modal-body">
                <div className="n2-form-row">
                  <label className="n2-form-label">Diagnostic technique *</label>
                  <textarea
                    className="n2-form-control"
                    placeholder="Décrivez les tests matériels/réseau effectués sur place..."
                    value={reportForm.diagnostic}
                    onChange={e => setReportForm({ ...reportForm, diagnostic: e.target.value })}
                    required
                  />
                </div>

                <div className="n2-form-grid-2">
                  <div className="n2-form-row">
                    <label className="n2-form-label">Problème matériel/logiciel détecté *</label>
                    <textarea
                      className="n2-form-control"
                      placeholder="Ex: Switch grillé, Cisco IP Phone déconfiguré..."
                      value={reportForm.probleme}
                      onChange={e => setReportForm({ ...reportForm, probleme: e.target.value })}
                      required
                    />
                  </div>
                  <div className="n2-form-row">
                    <label className="n2-form-label">Action corrective effectuée *</label>
                    <textarea
                      className="n2-form-control"
                      placeholder="Ex: Brassage câble, Reset configuration usine..."
                      value={reportForm.actionCorrective}
                      onChange={e => setReportForm({ ...reportForm, actionCorrective: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="n2-form-row">
                  <label className="n2-form-label">Tests validés sur place</label>
                  <div className="n2-checks-grid">
                    <label className="n2-checkbox-row">
                      <input
                        type="checkbox"
                        checked={reportForm.testReseau}
                        onChange={e => setReportForm({ ...reportForm, testReseau: e.target.checked })}
                      />
                      Test réseau fonctionnel
                    </label>
                    <label className="n2-checkbox-row">
                      <input
                        type="checkbox"
                        checked={reportForm.testSysteme}
                        onChange={e => setReportForm({ ...reportForm, testSysteme: e.target.checked })}
                      />
                      Test système validé
                    </label>
                    <label className="n2-checkbox-row">
                      <input
                        type="checkbox"
                        checked={reportForm.posteUtilisateur}
                        onChange={e => setReportForm({ ...reportForm, posteUtilisateur: e.target.checked })}
                      />
                      Action directe sur poste utilisateur
                    </label>
                  </div>
                </div>

                <div className="n2-form-grid-2">
                  <div className="n2-form-row">
                    <label className="n2-form-label">Observations additionnelles</label>
                    <textarea
                      className="n2-form-control"
                      placeholder="Notes de maintenance..."
                      value={reportForm.observations}
                      onChange={e => setReportForm({ ...reportForm, observations: e.target.value })}
                    />
                  </div>

                  <div className="n2-form-row">
                    <label className="n2-form-label">Niveau de gravité IT</label>
                    <div className="n2-severity-row" style={{ marginTop: '0.25rem' }}>
                      {[
                        { key: 'LOW', label: 'Faible' },
                        { key: 'MEDIUM', label: 'Moyen' },
                        { key: 'HIGH', label: 'Critique' }
                      ].map(sev => (
                        <button
                          key={sev.key}
                          type="button"
                          className={`n2-severity-btn ${reportForm.gravite === sev.key
                            ? sev.key === 'LOW'
                              ? 'active-low'
                              : sev.key === 'MEDIUM'
                                ? 'active-medium'
                                : 'active-high'
                            : ''
                            }`}
                          onClick={() => setReportForm({ ...reportForm, gravite: sev.key })}
                        >
                          {sev.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="n2-modal-foot">
                <button
                  type="button"
                  className="n2-btn n2-btn-secondary"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  className="n2-btn n2-btn-amber"
                  onClick={handleSubmitEscalation}
                >
                  <ArrowUp size={16} /> Escalader vers Expert N3
                </button>

                <button
                  type="submit"
                  className="n2-btn n2-btn-primary"
                >
                  <CheckCircle size={16} /> Résoudre l'intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENT: AVAILABLE TICKETS TABLE
══════════════════════════════════════════════════════════ */
function AvailableTicketsTable({ tickets, expandedId, reports, onExpand, onTake, getPriorityBadge }) {
  if (tickets.length === 0) {
    return (
      <div className="n2-empty" style={{ padding: '2rem' }}>
        <Inbox size={32} className="n2-empty-icon" />
        <p className="n2-empty-title">Aucun ticket</p>
        <p className="n2-empty-text">Aucun incident ne correspond aux filtres de recherche.</p>
      </div>
    );
  }

  return (
    <div className="n2-table-wrap">
      <table className="n2-table">
        <thead>
          <tr>
            <th>Réf.</th>
            <th>Bureau / Localisation</th>
            <th>Priorité</th>
            <th>Date Escalation</th>
            <th>Diagnostic N1</th>
            <th style={{ textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => {
            const isExpanded = expandedId === ticket.id;
            return (
              <React.Fragment key={ticket.id}>
                <tr>
                  <td className="n2-ref">#{ticket.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    {ticket.equipement?.localisation || 'Bureau Non Spécifié'}
                  </td>
                  <td>{getPriorityBadge(ticket.priorite)}</td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(ticket.dateCreation).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <button
                      className="n2-view-all"
                      onClick={() => onExpand(ticket.id)}
                      style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      {isExpanded ? 'Masquer' : 'Consulter rapport N1'}
                      <ChevronRight size={12} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="n2-btn n2-btn-primary n2-btn-sm"
                      onClick={() => onTake(ticket.id)}
                    >
                      🚀 Prendre en charge
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan="6" style={{ background: '#f8fafc', padding: '1rem' }}>
                      <div className="n2-detail-panel" style={{ margin: 0, background: '#fff', border: '1px solid #cbd5e1' }}>
                        {/* Description & Équipement de l'incident */}
                        <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#1e293b' }}>
                            Description de l'incident :
                          </h5>
                          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#475569', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontFamily: 'inherit' }}>
                            {ticket.description || 'Aucune description additionnelle.'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Nom de l'équipement :</span>
                            <span className="n2-eq-tag" style={{ marginTop: 0 }}>EQ: {ticket.equipement?.nom || 'Non renseigné'}</span>
                          </div>
                        </div>

                        <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FileText size={14} className="text-orange-500" />
                          Diagnostic / Rapport du Technicien Support N1 :
                        </h5>
                        {reports[ticket.id] ? (
                          <StructuredReport reportText={reports[ticket.id]} type="n1" />
                        ) : (
                          <p className="n2-n1-rapport">Chargement du diagnostic N1...</p>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.75rem', fontSize: '0.78rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                          <div>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>UTILISATEUR CONCERNÉ :</span>
                            <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569' }}>
                              {ticket.demandeur?.prenom} {ticket.demandeur?.nom} ({ticket.demandeur?.email})
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>TÉLÉPHONE INTERNE :</span>
                            <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569' }}>
                              {ticket.demandeur?.telephone || 'Non renseigné'}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>RÉFÉRENCE ÉQUIPEMENT :</span>
                            <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569' }}>
                              {ticket.equipement?.codeInventaire || 'Non répertorié'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENT: ACTIVE ON-SITE INTERVENTION PANEL
══════════════════════════════════════════════════════════ */
function ActiveOnSiteInterventionPanel({ intervention, checklist, setChecklist, onSave, onResolve }) {
  const ticket = intervention.ticket;
  if (!ticket) return null;

  const toggleTest = (testName) => {
    const currentTests = [...checklist.tests];
    const index = currentTests.indexOf(testName);
    if (index > -1) {
      currentTests.splice(index, 1);
    } else {
      currentTests.push(testName);
    }
    setChecklist({ ...checklist, tests: currentTests });
  };

  const listTests = [
    "Ping Passerelle locale",
    "Ping Serveur DNS OCP (10.x.x.x)",
    "Vérification LED Switch brassage",
    "Test Prise murale RJ45 (Bureau)",
    "Vérification Cisco IP Phone (Configuration SIP)",
    "Test de connectivité Active Directory",
    "Lancement diagnostic matériel OS",
    "Vérification Logiciel Métier OCP"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="n2-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>

        {/* Left Column: Checklist & Tests */}
        <div className="n2-card" style={{ margin: 0, padding: '1.25rem', border: '1px solid #cbd5e1' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
            <Cpu size={18} color="#047857" />
            Checklist Diagnostic IT Sur Site
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="n2-form-row">
              <label className="n2-form-label">État du matériel (PC, Imprimante, Switch...)</label>
              <select
                className="n2-form-control"
                value={checklist.machineState}
                onChange={e => setChecklist({ ...checklist, machineState: e.target.value })}
              >
                <option value="OK">Matériel Fonctionnel (OK)</option>
                <option value="PANNE_MINEURE">En Panne mineure (Indisponible)</option>
                <option value="REMPLACEMENT_REQUIS">Remplacement Requis (N3)</option>
              </select>
            </div>

            <div className="n2-form-row">
              <label className="n2-form-label">État Connexion Réseau</label>
              <select
                className="n2-form-control"
                value={checklist.networkState}
                onChange={e => setChecklist({ ...checklist, networkState: e.target.value })}
              >
                <option value="OK">Connexion LAN/WAN OK</option>
                <option value="DEGRADEE">Lenteur / Pertes de paquets (Dégradée)</option>
                <option value="INEXISTANTE">Pas de lien physique (Port KO)</option>
              </select>
            </div>
          </div>

          <div className="n2-form-row">
            <label className="n2-form-label">Tests de connectivité physiques et logiques effectués</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {listTests.map(test => {
                const isChecked = checklist.tests.includes(test);
                return (
                  <label key={test} className="n2-checkbox-row" style={{ fontSize: '0.78rem' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTest(test)}
                    />
                    {test}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="n2-form-row" style={{ marginTop: '0.75rem' }}>
            <label className="n2-form-label">Observations et mesures prises sur site</label>
            <textarea
              className="n2-form-control"
              rows={3}
              placeholder="Saisissez vos observations en temps réel..."
              value={checklist.customObservations}
              onChange={e => setChecklist({ ...checklist, customObservations: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button className="n2-btn n2-btn-secondary" onClick={onSave}>
              <Database size={15} /> Enregistrer l'avancement
            </button>
            <button className="n2-btn n2-btn-primary" onClick={onResolve}>
              <Check size={15} /> Rédiger Rapport & Clôturer
            </button>
          </div>
        </div>

        {/* Right Column: Ticket Card details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="n2-card" style={{ margin: 0, padding: '1.25rem', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
              Détails de la demande
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>RÉFÉRENCE INCIDENT :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#047857' }}>TICKET #{ticket.id}</p>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>TITRE DE L'INCIDENT :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#334155' }}>{ticket.titre}</p>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>UTILISATEUR SENSITIF :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#334155' }}>
                  {ticket.demandeur?.prenom} {ticket.demandeur?.nom}
                </p>
                <p style={{ margin: '1px 0 0 0', color: '#64748b' }}>Tel: {ticket.demandeur?.telephone || '—'}</p>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>ÉQUIPEMENT ET LOCALISATION :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#334155' }}>
                  {ticket.equipement?.nom} ({ticket.equipement?.codeInventaire})
                </p>
                <p style={{ margin: '2px 0 0 0', color: '#047857', fontWeight: 700 }}>
                  📍 {ticket.equipement?.localisation || 'Bureau'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.75rem' }}>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>HEURE ARRIVÉE ENREGISTRÉE :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#64748b' }}>
                  {(() => {
                    try {
                      return JSON.parse(intervention.actionADistance).arrivalTime || 'En attente';
                    } catch (e) { return 'En cours'; }
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PARSER & STRUCTURED DISPLAY FOR TECHNICAL REPORTS
══════════════════════════════════════════════════════════ */
function parseReportText(text) {
  if (!text) return null;

  // Keys used for splitting the report
  const keysRegex = /(Diagnostic|Diagnostic technique|Actions réalisées|Actions effectuées|Actions|Tests tentés|Tests|Action corrective|Action corrective effectuée|Action Proposée|Problème Détecté|Problème identifié|Problème racine|Problème|Résultat \(Problème résolu\)|Résultat obtenu|Résultat|Solution|Solution ou Action corrective appliquée|Commentaire|Commentaires|Motif de l'escalade|Observations|Observations Escalade|Observations Technicien|Observations de l'expert N3|Observations additionnelles|Observations complémentaires|Temps passé|Durée|Temps total d'intervention|Temps total|Temps|Test Réseau Effectué|Test Réseau|Test Système Effectué|Test Système|Intervention sur Poste|Poste Utilisateur|Niveau Gravité|Niveau de gravité IT|Gravité finale|Gravité):\s*/gi;

  const parts = text.split(keysRegex);

  if (parts.length <= 1) {
    return [{ label: 'Rapport', value: text }];
  }

  const parsed = [];

  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].trim();
    let value = parts[i + 1] ? parts[i + 1].trim() : '';

    value = value.replace(/^[\s,;:\n\-]+|[\s,;:\n\-]+$/g, '').trim();

    if (value) {
      const formattedKey = key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\s*/, '')
        .trim();

      parsed.push({
        label: formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1),
        value: value
      });
    }
  }

  return parsed;
}

function StructuredReport({ reportText, type = 'n1' }) {
  const parsed = parseReportText(reportText);

  if (!parsed || parsed.length === 0) {
    return (
      <div style={{
        padding: '0.75rem 1rem',
        background: '#f8fafc',
        border: '1px dashed #cbd5e1',
        borderRadius: '8px',
        color: '#64748b',
        fontSize: '0.82rem',
        fontStyle: 'italic'
      }}>
        Aucun diagnostic enregistré.
      </div>
    );
  }

  if (parsed.length === 1 && parsed[0].label.toLowerCase() === 'rapport') {
    return (
      <div style={{
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        background: '#f8fafc',
        padding: '0.85rem 1rem',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        lineHeight: 1.5,
        color: '#334155'
      }}>
        {parsed[0].value}
      </div>
    );
  }

  let themeColor = '#f59e0b'; // N1 Amber
  if (type === 'n2') {
    themeColor = '#3b82f6'; // N2 Blue
  } else if (type === 'n3') {
    themeColor = '#10b981'; // N3 Emerald
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '0.85rem',
      marginTop: '0.75rem'
    }}>
      {parsed.map((item, index) => {
        const valUpper = item.value.toUpperCase();
        const isOk = valUpper === 'OUI' || valUpper === 'OK' || valUpper.includes('RÉSOLU') || valUpper.includes('RESOLU');
        const isKo = valUpper === 'NON' || valUpper === 'KO' || valUpper.includes('NON RÉSOLU') || valUpper.includes('NON RESOLU');
        const valueColor = isOk ? '#15803d' : isKo ? '#b91c1c' : '#1e293b';
        const valueBg = isOk ? '#dcfce7' : isKo ? '#fee2e2' : 'transparent';
        const valuePadding = (isOk || isKo) ? '2px 8px' : '0';
        const valueBorderRadius = (isOk || isKo) ? '4px' : '0';

        return (
          <div
            key={index}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: `4px solid ${themeColor}`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            }}
          >
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#64748b',
              letterSpacing: '0.6px',
            }}>
              {item.label}
            </span>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: valueColor,
              backgroundColor: valueBg,
              padding: valuePadding,
              borderRadius: valueBorderRadius,
              display: (isOk || isKo) ? 'inline-block' : 'block',
              alignSelf: 'flex-start',
              width: (isOk || isKo) ? 'auto' : '100%',
              whiteSpace: 'pre-line',
              lineHeight: '1.45',
            }}>
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
