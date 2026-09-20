import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import toast, { Toaster } from 'react-hot-toast';
import './TechnicienN3Dashboard.css';
import logoOCP from '/src/assets/logo-ocp.png';

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
  Zap,
  Truck,
  FileText,
  MapPin,
  Check,
  Settings,
  Bell,
  Cpu,
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
import api, {
  getEscalatedN3Tickets,
  getMyInterventions,
  getMyHistory,
  startInterventionN3,
  saveAction,
  updateEquipmentStatus,
  closeTicketN3,
  getTicketInterventions,
  getAvailableEquipments,
  replaceEquipment
} from '../../../services/api';

import UserProfile from './UserProfile';

export default function TechnicienN3Dashboard() {
  const navigate = useNavigate();
  const { token, role, userId, userName, logout, profileImage } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotifications();

  // ---------- STATES ----------
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubFilter, setActiveSubFilter] = useState('ALL');

  const [availableTickets, setAvailableTickets] = useState([]);
  const [activeInterventions, setActiveInterventions] = useState([]);
  const [historyInterventions, setHistoryInterventions] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [availableEquipments, setAvailableEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Expandable ticket details (N1 / N2 reports)
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [previousReports, setPreviousReports] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  // On-Site checklist details (saved in BDD)
  const [onSiteChecklist, setOnSiteChecklist] = useState({
    equipmentState: 'OK',
    safetyChecks: 'OK',
    calibrationState: 'OK',
    tests: [],
    customObservations: ''
  });

  // Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    diagnostic: '',
    probleme: '',
    actionCorrective: '',
    equipementRemplace: '',
    tempsIntervention: '1h 30m',
    observations: '',
    gravite: 'HIGH'
  });

  // Active intervention equipment status editing
  const [selectedEquipState, setSelectedEquipState] = useState('BON');

  const isEquipmentReplaced = () => {
    if (activeInterventions.length === 0) return false;
    try {
      const action = activeInterventions[0].actionADistance;
      if (action) {
        const parsed = JSON.parse(action);
        return parsed.equipmentReplaced === true;
      }
    } catch (e) { }
    return false;
  };

  // ---------- DATA SYNC ----------
  const loadDashboardData = async () => {
    if (!token || !userId) return;
    setLoading(true);

    // Fetch each independently so a single failure doesn't blank the whole dashboard
    let available = [], active = [], history = [], equipList = [], availEquip = [];

    try {
      available = await getEscalatedN3Tickets();
      if (!Array.isArray(available)) available = [];
    } catch (e) {
      console.warn('[N3] Tickets escaladés N3:', e.message);
    }

    try {
      const raw = await getMyInterventions(userId);
      // Only keep interventions where the ticket is in an N3 state
      active = Array.isArray(raw)
        ? raw.filter(i => {
          const s = String(i.ticket?.statut || '').toUpperCase();
          return s === 'IN_PROGRESS_N3' || s === 'EN_COURS_N3';
        })
        : [];
    } catch (e) {
      console.warn('[N3] Mes interventions actives:', e.message);
    }

    try {
      const rawHistory = await getMyHistory(userId);
      // Keep history entries where the ticket reached CLOTURE or was an N3 step
      history = Array.isArray(rawHistory)
        ? rawHistory.filter(i => {
          const s = String(i.ticket?.statut || '').toUpperCase();
          const r = String(i.rapport || '').toUpperCase();
          return s === 'CLOTURE' || r.includes('N3');
        })
        : [];
    } catch (e) {
      console.warn('[N3] Historique:', e.message);
    }

    try {
      const eq = await api.get('/admin/equipments');
      equipList = Array.isArray(eq.data) ? eq.data : [];
    } catch (e) {
      console.warn('[N3] Équipements:', e.message);
    }

    try {
      availEquip = await getAvailableEquipments();
    } catch (e) {
      console.warn('[N3] Équipements disponibles:', e.message);
    }

    setAvailableTickets(available);
    setActiveInterventions(active);
    setHistoryInterventions(history);
    setEquipments(equipList);
    setAvailableEquipments(availEquip);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    loadDashboardData();
  }, [token, userId]);
  // Read checklist state from BDD when an active intervention is loaded
  useEffect(() => {
    if (activeInterventions.length > 0) {
      const intervention = activeInterventions[0];
      try {
        if (intervention.actionADistance) {
          const parsed = JSON.parse(intervention.actionADistance);
          if (parsed.subStatus === 'IN_PROGRESS_N3') {
            setOnSiteChecklist({
              equipmentState: parsed.equipmentState || 'OK',
              safetyChecks: parsed.safetyChecks || 'OK',
              calibrationState: parsed.calibrationState || 'OK',
              tests: parsed.tests || [],
              customObservations: parsed.customObservations || ''
            });
            if (parsed.equipmentState) {
              setSelectedEquipState(parsed.equipmentState);
            }
          }
        }
      } catch (e) {
        // Not a JSON, keep default
      }
    }
  }, [activeInterventions.length]);

  // ---------- DIAGNOSTIC REPORT RETRIEVAL ----------
  const toggleExpandTicket = async (ticketId) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      return;
    }
    setExpandedTicketId(ticketId);
    if (!previousReports[ticketId]) {
      try {
        const interventions = await getTicketInterventions(ticketId);
        // Find N1 report
        const n1Int = interventions.find(i => i.rapport && (i.rapport.includes('RAPPORT TECHNIQUE N1') || i.rapport.includes('[Ticket Escaladé]')));
        // Find N2 report
        const n2Int = interventions.find(i => i.rapport && (i.rapport.includes('RAPPORT TECHNIQUE N2') || i.rapport.includes('RAPPORT ESCALADE N3')));

        setPreviousReports(prev => ({
          ...prev,
          [ticketId]: {
            n1: n1Int ? n1Int.rapport.replace(' [Ticket Escaladé]', '') : 'Diagnostic N1 : Problème non résolu à distance, escaladé au support supérieur.',
            n2: n2Int ? n2Int.rapport.replace(' [Ticket Escaladé]', '') : 'Diagnostic N2 : Problème sur site non résolu, nécessite expertise de niveau N3.'
          }
        }));
      } catch (error) {
        console.error('Erreur de récupération des rapports précédents:', error);
        setPreviousReports(prev => ({
          ...prev,
          [ticketId]: {
            n1: 'Impossible de charger le diagnostic N1.',
            n2: 'Impossible de charger le diagnostic N2.'
          }
        }));
      }
    }
  };

  // ---------- WORKFLOW ACTION HANDLERS ----------
  const handleTakeCharge = async (ticketId) => {
    try {
      const result = await startInterventionN3(ticketId, userId);

      // Save initial status in DB (IN_PROGRESS_N3)
      const initialActionData = {
        subStatus: 'IN_PROGRESS_N3',
        startTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        location: result.ticket?.equipement?.localisation || 'Zone Technique',
        equipmentState: 'OK',
        safetyChecks: 'OK',
        calibrationState: 'OK',
        tests: [],
        customObservations: '',
        equipmentReplaced: false
      };

      await saveAction(result.id, {
        actionADistance: JSON.stringify(initialActionData),
        surSiteEffectue: true,
        manipulationLourdeEffectue: true
      });

      toast.success("Intervention d'expertise N3 démarrée !", { icon: '⚡' });
      setActiveSubFilter('EN_COURS');
      setActiveTab('interventions');
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la prise en charge du ticket");
    }
  };

  const handleReplaceEquipment = async (ticketId, newEquipmentId) => {
    if (!newEquipmentId) {
      toast.error("Veuillez sélectionner un équipement de remplacement.");
      return;
    }
    try {
      await replaceEquipment(ticketId, newEquipmentId, userId);
      toast.success("Équipement remplacé dans la base de données !", { icon: '🔄' });
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Erreur lors du remplacement de l'équipement";
      toast.error(errMsg);
    }
  };

  const handleUpdateEquipmentState = async (equipmentId, nextState) => {
    if (!equipmentId) return;
    try {
      await updateEquipmentStatus(equipmentId, nextState);
      setSelectedEquipState(nextState);

      // Update checklist locally
      setOnSiteChecklist(prev => ({
        ...prev,
        equipmentState: nextState
      }));

      toast.success(`État équipement mis à jour : ${nextState} !`, { icon: '⚙️' });
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la modification de l'état de l'équipement");
    }
  };

  const handleSaveChecklist = async () => {
    if (activeInterventions.length === 0) return;
    const intervention = activeInterventions[0];
    try {
      const updatedActionData = {
        subStatus: 'IN_PROGRESS_N3',
        ...onSiteChecklist,
        equipmentState: selectedEquipState,
        equipmentReplaced: isEquipmentReplaced()
      };

      await saveAction(intervention.id, {
        actionADistance: JSON.stringify(updatedActionData),
        surSiteEffectue: true,
        manipulationLourdeEffectue: true
      });

      toast.success("Avancement du diagnostic N3 sauvegardé !", { icon: '💾' });
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde de l'avancement");
    }
  };

  // Helper to update report form fields
  const setFormDetails = (field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenReport = () => {
    if (activeInterventions.length === 0) return;
    const currentInt = activeInterventions[0];

    let replacedEquipName = 'Aucun';
    try {
      const action = currentInt.actionADistance;
      if (action) {
        const parsed = JSON.parse(action);
        if (parsed.equipmentReplaced && parsed.replacementEquipmentId) {
          const found = availableEquipments.find(e => String(e.id) === String(parsed.replacementEquipmentId)) ||
            equipments.find(e => String(e.id) === String(parsed.replacementEquipmentId));
          if (found) {
            replacedEquipName = `[${found.codeInventaire}] ${found.nom}`;
          }
        }
      }
    } catch (err) { }

    // Auto-fill report with current equipment state and diagnostic details
    setReportForm({
      diagnostic: `Expertise technique effectuée sur l'équipement ${currentInt.ticket?.equipement?.nom || 'concerné'}. État constaté : ${selectedEquipState}. Tests effectués : ${onSiteChecklist.tests.join(', ') || 'aucun'}.`,
      probleme: currentInt.ticket?.description || '',
      actionCorrective: '',
      equipementRemplace: replacedEquipName,
      replacementEquipmentId: '',
      tempsIntervention: '2h 00m',
      observations: onSiteChecklist.customObservations || '',
      gravite: 'HIGH'
    });
    setIsReportModalOpen(true);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (activeInterventions.length === 0) return;
    const intervention = activeInterventions[0];

    let replacementId = '';
    try {
      const action = intervention.actionADistance;
      if (action) {
        const parsed = JSON.parse(action);
        replacementId = parsed.replacementEquipmentId ? String(parsed.replacementEquipmentId) : '';
      }
    } catch (err) { }

    // Validate mandatory fields:
    if (!reportForm.diagnostic.trim() || !reportForm.probleme.trim() || !reportForm.actionCorrective.trim() || !reportForm.tempsIntervention.trim() || !reportForm.observations.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires du rapport.");
      return;
    }

    const reportDto = {
      diagnostic: reportForm.diagnostic,
      causeRacine: reportForm.probleme,
      actionsRealisees: reportForm.actionCorrective,
      equipementRemplace: replacementId,
      resultat: 'RÉSOLU',
      commentaire: reportForm.observations,
      tempsPasse: reportForm.tempsIntervention
    };

    try {
      await closeTicketN3(intervention.id, reportDto);
      toast.success("Intervention clôturée et résolue !", { icon: '🔒', duration: 4000 });
      setIsReportModalOpen(false);
      await loadDashboardData();
      await fetchNotifications();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Erreur lors de la clôture définitive du ticket";
      toast.error(errMsg);
    }
  };

  // ---------- STATS CALCULATIONS ----------
  const stats = {
    available: availableTickets.length,
    active: activeInterventions.length,
    closed: historyInterventions.filter(i => String(i.ticket?.statut).toUpperCase() === 'CLOTURE').length,
    critical: availableTickets.filter(t => ['HIGH', 'URGENT'].includes(String(t.priorite).toUpperCase())).length +
      activeInterventions.filter(i => ['HIGH', 'URGENT'].includes(String(i.ticket?.priorite).toUpperCase())).length,
    equipmentsTotal: equipments.length,
    equipmentsAvailable: equipments.filter(e => e.etatAffectation === 'DISPONIBLE').length
  };

  // ---------- SEARCH & FILTER (ROBUST CHECK) ----------
  const filterList = (list, isEnvelope = false) => {
    if (!Array.isArray(list)) return [];
    return list.filter(item => {
      const ticket = isEnvelope ? item.ticket : item;
      if (!ticket) return false;

      const id = ticket.id ? String(ticket.id) : '';
      const titre = ticket.titre ? String(ticket.titre).toLowerCase() : '';
      const description = ticket.description ? String(ticket.description).toLowerCase() : '';
      const equipName = ticket.equipement?.nom ? String(ticket.equipement.nom).toLowerCase() : '';
      const demandeurNom = ticket.demandeur?.nom ? String(ticket.demandeur.nom).toLowerCase() : '';
      const demandeurPrenom = ticket.demandeur?.prenom ? String(ticket.demandeur.prenom).toLowerCase() : '';

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        id.includes(q) ||
        titre.includes(q) ||
        description.includes(q) ||
        equipName.includes(q) ||
        demandeurNom.includes(q) ||
        demandeurPrenom.includes(q);

      const p = String(ticket.priorite || '').toUpperCase();
      const matchesPriority =
        priorityFilter === 'ALL' ||
        p === priorityFilter ||
        (priorityFilter === 'HIGH' && p === 'URGENT') ||
        (priorityFilter === 'MEDIUM' && p === 'MOYENNE') ||
        (priorityFilter === 'LOW' && p === 'NORMALE');

      return matchesSearch && matchesPriority;
    });
  };

  // ---------- CHARTS DATA ----------
  const volumeChartData = [
    { name: 'Escaladés N3', tickets: stats.available, color: '#f59e0b' },
    { name: 'En cours N3', tickets: stats.active, color: '#006633' },
    { name: 'Résolus', tickets: stats.closed, color: '#00a859' }
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

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#006633'];

  // ---------- HELPERS UI ----------
  const getPriorityBadge = (priorite) => {
    const p = String(priorite || '').toUpperCase();
    if (p === 'HIGH' || p === 'HAUTE' || p === 'URGENT') return <span className="n3-badge n3-badge-high">Critique</span>;
    if (p === 'MEDIUM' || p === 'MOYENNE') return <span className="n3-badge n3-badge-medium">Moyenne</span>;
    return <span className="n3-badge n3-badge-low">Normale</span>;
  };

  const getStatusBadge = (statut) => {
    const s = String(statut || '').toUpperCase();
    if (s === 'ESCALADE_N3' || s === 'ESCALATED_N3')
      return <span className="n3-status n3-status-pending"><span className="n3-dot" />Escaladé N3</span>;
    if (s === 'CLOTURE' || s === 'CLOSED')
      return <span className="n3-status n3-status-closed"><span className="n3-dot" />Clôturé</span>;
    if (s === 'IN_PROGRESS_N3' || s === 'EN_COURS_N3' || s === 'EN_COURS')
      return <span className="n3-status n3-status-active"><span className="n3-dot" />En cours N3</span>;
    return <span className="n3-status n3-status-pending"><span className="n3-dot" />{statut}</span>;
  };

  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'EX';

  return (
    <div className="n3-wrapper">
      <Toaster position="top-right" reverseOrder={false} />

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <aside className="n3-sidebar">
        <div className="n3-sidebar-header">
          <div className="n3-logo-row">
            <img src={logoOCP} alt="Logo OCP" className="n3-logo-img" />
            <div>

              <h2 className="n3-logo-title">Support Technique – Niveau 3</h2>
            </div>
          </div>
        </div>

        <nav className="n3-nav">

          <button
            className={`n3-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Tableau de bord
          </button>

          <button
            className={`n3-nav-btn ${activeTab === 'interventions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('interventions'); setActiveSubFilter('ALL'); }}
          >
            <Wrench size={18} />
            Mes interventions
            {(stats.available + stats.active) > 0 && (
              <span className="n3-nav-badge">{stats.available + stats.active}</span>
            )}
          </button>

          <span className="n3-nav-section-label">Profil</span>
          <button
            className={`n3-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Mon Profil IT
          </button>
        </nav>

        <div className="n3-sidebar-footer">
          <div className="n3-user-card">
            <div
              className={`n3-user-avatar ${profileImage ? 'has-image' : ''}`}
              style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
            >
              {!profileImage && userInitials}
            </div>
            <div>
              <p className="n3-user-name" title={userName}>{userName || 'Expert N3'}</p>
              <p className="n3-user-role">Support Expert N3</p>
            </div>
          </div>
          <button
            className="n3-logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ══════════════════════ MAIN ══════════════════════ */}
      <main className="n3-main">
        {/* ─── TOPBAR ─── */}
        <header className="n3-header">
          <div className="n3-header-left">
            <div className="n3-header-breadcrumb">

            </div>
            <h2 className="n3-header-title">
              {activeTab === 'dashboard' && ' Tableau de bord'}
              {activeTab === 'interventions' && 'Mes Intervention'}
              {activeTab === 'profile' && 'Profil '}
              {activeTab === 'notifications' && 'Historique des Alertes N3'}
            </h2>
          </div>

          {/* ══════════════════════ ACTIONS & NOTIFICATIONS N1 STYLE ══════════════════════ */}
          {/* ══════════════════════ ACTIONS & NOTIFICATIONS RETRAVAILLÉES ══════════════════════ */}


          <div className="n3-header-actions">

            {/* Système de Cloche de Notification OCP style Image */}
            <div className="n3-notification-wrapper">
              <button
                className="n3-icon-btn position-relative"
                title="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="n3-notification-badge-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu lié à l'état showNotifications */}
              {showNotifications && notifications.length > 0 && (
                <div className="n3-notifications-dropdown">

                  {/* Header bl-khdar OCP exact bhal l-image */}
                  <div className="dropdown-header">
                    <h5>
                      Notifications
                      {unreadCount > 0 && <span className="n3-header-notif-count">{unreadCount}</span>}
                    </h5>
                    <div className="n3-dropdown-actions">
                      <button
                        className="clear-all-text"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Hna tqder t-appeler l'action dyal markAllAsRead loukan 3ndek f l-backend
                          // t9der t-loopi 3la les notifs non lues:
                          for (let notif of notifications) {
                            if (!notif.lu) await markAsRead(notif.id);
                          }
                        }}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        Tout lire
                      </button>
                      <button
                        className="n3-refresh-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadDashboardData(); // Kat-syncki direct m3a l'infra OCP
                        }}
                        title="Actualiser"
                      >
                        <RefreshCw size={14} strokeWidth={2.5} className={loading ? 'n3-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* List Body */}
                  <div className="n3-notif-list">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`notif-item ${!notif.lu ? 'unread' : ''}`}
                        onClick={async () => {
                          await markAsRead(notif.id);
                          setShowNotifications(false); // Ferme après clic
                        }}
                        title={notif.lu ? "Notification lue" : "Cliquer pour marquer comme lu"}
                      >
                        <div className="notif-icon-zone">
                          <Bell size={16} />
                        </div>
                        <div className="notif-text-zone">
                          <p className="notif-message">
                            {notif.message || `Nouveau ticket disponible [${notif.priorite || 'HIGH'}] : ${notif.ref || 'HTGR...'}`}
                          </p>
                          <div className="notif-meta-row">
                            <span className="notif-time">
                              <Clock size={12} />
                              {notif.temps || "il y a 10min"}
                            </span>
                            {notif.lu && (
                              <span className="notif-status-text">
                                <Check size={12} strokeWidth={3} /> Lu
                              </span>
                            )}
                          </div>
                        </div>
                        {!notif.lu && <div className="unread-dot"></div>}
                      </div>
                    ))}
                  </div>

                  {/* Footer dynamic dial chhal bqi non lu */}
                  <div className="n3-dropdown-footer">
                    {unreadCount} non lue(s)
                  </div>

                </div>
              )}
            </div>

            {/* Bouton de rafraîchissement global f l-topbar oualaqini hta f dropdown kyn */}
            <button className="n3-icon-btn" onClick={loadDashboardData} title="Synchroniser la base MySQL">
              <RefreshCw size={18} className={loading ? 'n3-spin' : ''} />
            </button>
          </div>
        </header>

        {/* ─── CONTENT ─── */}
        <div className="n3-content">
          <div className="n3-container">

            {/* Loading Indicator */}
            {loading && availableTickets.length === 0 && activeInterventions.length === 0 && (
              <div className="n3-loader">
                <div className="n3-spinner" />
                <p className="n3-loader-text">Synchronisation sécurisée avec la base MySQL OCP...</p>
              </div>
            )}

            {/* ══════════════════ TAB 1 : DASHBOARD ══════════════════ */}
            {activeTab === 'dashboard' && !loading && (
              <div className="n3-fade-in">

                {/* ACTIVE INTERVENTION BANNER */}
                {activeInterventions.length > 0 && (
                  <div className="n3-workflow-banner active">
                    <div className="n3-workflow-banner-info">
                      <p className="n3-workflow-banner-label">

                      </p>
                      <h4 className="n3-workflow-banner-title">
                        Incident : {activeInterventions[0].ticket?.titre}
                      </h4>
                      <p className="n3-workflow-banner-meta">
                        Équipement : {activeInterventions[0].ticket?.equipement?.nom}
                        &nbsp;• Code Inv : <strong>{activeInterventions[0].ticket?.equipement?.codeInventaire}</strong>
                        &nbsp;• Localisation : <strong>{activeInterventions[0].ticket?.equipement?.localisation || 'Bureau'}</strong>
                      </p>
                    </div>

                    <div className="n3-workflow-banner-actions">
                      <button
                        className="n3-banner-btn n3-banner-btn-white"
                        onClick={() => { setActiveTab('interventions'); setActiveSubFilter('EN_COURS'); }}
                      >
                        <Settings size={16} /> Checklist & Diagnostic Expert
                      </button>
                      {isEquipmentReplaced() && (
                        <button
                          className="n3-banner-btn n3-banner-btn-outline"
                          onClick={handleOpenReport}
                        >
                          Clôturer l'Intervention
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* STAT CARDS */}
                <div className="n3-stats-grid">
                  <div
                    className="n3-stat-card blue"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('PENDING'); }}
                  >
                    <div>
                      <p className="n3-nav-section-label" style={{ padding: 0, margin: 0 }}>Escaladés N3</p>
                      <p className="n3-stat-value">{stats.available}</p>
                      <p className="n3-stat-sub">En attente d'action</p>
                    </div>
                    <div className="n3-stat-icon"></div>
                  </div>

                  <div className="n3-stat-card red">
                    <div>
                      <p className="n3-nav-section-label" style={{ padding: 0, margin: 0 }}>Critiques</p>
                      <p className="n3-stat-value">{stats.critical}</p>
                      <p className="n3-stat-sub">Tickets haute priorité</p>
                    </div>
                    <div className="n3-stat-icon"></div>
                  </div>

                  <div
                    className="n3-stat-card grey"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('EN_COURS'); }}
                  >
                    <div>
                      <p className="n3-nav-section-label" style={{ padding: 0, margin: 0 }}>En Cours</p>
                      <p className="n3-stat-value">{stats.active}</p>
                      <p className="n3-stat-sub">Interventions actives</p>
                    </div>
                    <div className="n3-stat-icon"></div>
                  </div>

                  <div
                    className="n3-stat-card green"
                    onClick={() => { setActiveTab('interventions'); setActiveSubFilter('HISTORIQUE'); }}
                  >
                    <div>
                      <p className="n3-nav-section-label" style={{ padding: 0, margin: 0 }}>Clôturés</p>
                      <p className="n3-stat-value">{stats.closed}</p>
                      <p className="n3-stat-sub">Tickets résolus N3</p>
                    </div>
                    <div className="n3-stat-icon"></div>
                  </div>

                  <div className="n3-stat-card amber">
                    <div>
                      <p className="n3-nav-section-label" style={{ padding: 0, margin: 0 }}>Équipements</p>
                      <p className="n3-stat-value" style={{ fontSize: '1.4rem' }}>
                        {stats.equipmentsAvailable} / {stats.equipmentsTotal}
                      </p>
                      <p className="n3-stat-sub">Disponibilité globale</p>
                    </div>
                    <div className="n3-stat-icon"></div>
                  </div>
                </div>

                {/* CHARTS GRID */}
                <div className="n3-charts-grid">
                  {/* Activity Bar Chart */}
                  <div className="n3-chart-card">
                    <div className="n3-chart-title-row">
                      <BarChart3 size={18} color="#006633" />
                      <h4 className="n3-chart-title">Activité globale de l'expert N3</h4>
                      <span className="n3-chip">GMAO Database</span>
                    </div>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeChartData} barSize={34}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
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

                  {/* Priority Pie Chart */}
                  <div className="n3-chart-card">
                    <div className="n3-chart-title-row">
                      <TrendingUp size={18} color="#006633" />
                      <h4 className="n3-chart-title">Criticité des incidents attribués</h4>
                      <span className="n3-chip">Priorité</span>
                    </div>
                    {stats.available + stats.active === 0 ? (
                      <div className="n3-empty" style={{ height: 180, padding: '2rem' }}>
                        <p className="n3-empty-text">Aucun ticket actif.</p>
                      </div>
                    ) : (
                      <div style={{ height: 220, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={priorityChartData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="tickets">
                              {priorityChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
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

                {/* ESCALATED TICKETS BOARD */}
                <div className="n3-card">
                  <div className="n3-card-header">
                    <div>
                      <h3 className="n3-card-title">Derniers tickets escaladés vers N3</h3>
                      <p className="n3-card-sub">Tickets disponibles en file d'attente d'expertise</p>
                    </div>
                    <button
                      className="n3-view-all"
                      onClick={() => { setActiveTab('interventions'); setActiveSubFilter('PENDING'); }}
                    >
                      Voir la file d'attente <ChevronRight size={14} />
                    </button>
                  </div>

                  {availableTickets.length === 0 ? (
                    <div className="n3-empty">

                      <p className="n3-empty-title">Aucun ticket en attente</p>
                      <p className="n3-empty-text">Tous les tickets escaladés ont été pris en charge.</p>
                    </div>
                  ) : (
                    <div className="n3-ticket-grid">
                      {availableTickets.slice(0, 3).map(ticket => (
                        <div key={ticket.id} className={`n3-ticket-card-new priority-${String(ticket.priorite || '').toLowerCase()}`}>
                          <div className="n3-ticket-header">
                            <span className="n3-ticket-id">#{ticket.id}</span>
                            {getPriorityBadge(ticket.priorite)}
                          </div>
                          <h4 className="n3-ticket-title">{ticket.titre}</h4>
                          <p className="n3-ticket-desc">{ticket.description}</p>
                          <div className="n3-ticket-details">
                            <div className="n3-detail-item"><strong>Matériel:</strong> {ticket.equipement?.nom || 'N/A'}</div>
                            <div className="n3-detail-item"><strong>Localisation:</strong> {ticket.equipement?.localisation || 'Bureau'}</div>
                            <div className="n3-detail-item"><strong>Date:</strong> {ticket.dateCreation ? new Date(ticket.dateCreation).toLocaleDateString() : 'N/A'}</div>
                            <div className="n3-detail-item"><strong>Statut:</strong> {getStatusBadge(ticket.statut)}</div>
                          </div>
                          <div className="n3-ticket-footer">
                            <button
                              onClick={() => handleTakeCharge(ticket.id)}
                              className="n3-btn n3-btn-primary"
                              style={{ width: '100%' }}
                            >
                              🚀 Démarrer l'expertise
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ══════════════════ TAB 2 : MES INTERVENTIONS ══════════════════ */}
            {activeTab === 'interventions' && !loading && (
              <div className="n3-fade-in">

                {/* SEARCH & FILTERS PANEL */}
                <div className="n3-filters-row">
                  <div className="n3-tab-group">
                    {[
                      { key: 'ALL', label: 'Tous les flux' },
                      { key: 'PENDING', label: 'Disponibles', dot: stats.available > 0 },
                      { key: 'EN_COURS', label: 'Mes interventions', count: stats.active > 0 ? stats.active : null },
                      { key: 'HISTORIQUE', label: 'Mon Historique' }
                    ].map(item => (
                      <button
                        key={item.key}
                        className={`n3-tab-btn ${activeSubFilter === item.key ? 'active' : ''}`}
                        onClick={() => setActiveSubFilter(item.key)}
                      >
                        {item.label}
                        {item.dot && <span className="n3-tab-dot" />}
                        {item.count != null && <span className="n3-tab-count">{item.count}</span>}
                      </button>
                    ))}
                  </div>

                  <div className="n3-search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      className="n3-search-input"
                      placeholder="Rechercher par titre, équipement, demandeur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="n3-filter-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
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
                    {activeInterventions.length > 0 ? (
                      <div className="n3-card" style={{ borderLeft: '4px solid #006633' }}>
                        <div className="n3-card-header">
                          <div>
                            <h3 className="n3-card-title" style={{ color: '#006633' }}> Intervention N3 active — Diagnostic en cours</h3>
                            <p className="n3-card-sub">Remplissez la checklist d'expertise et clôturez quand terminé.</p>
                          </div>
                          {isEquipmentReplaced() && (
                            <button
                              className="n3-btn n3-btn-primary"
                              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                              onClick={handleOpenReport}
                            >
                              <FileText size={14} /> Rédiger Rapport &amp; Clôturer
                            </button>
                          )}
                        </div>

                        <ActiveN3InterventionPanel
                          intervention={activeInterventions[0]}
                          checklist={onSiteChecklist}
                          setChecklist={setOnSiteChecklist}
                          selectedEquipState={selectedEquipState}
                          handleUpdateEquipmentState={handleUpdateEquipmentState}
                          onSave={handleSaveChecklist}
                          onResolve={handleOpenReport}
                          availableEquipments={availableEquipments}
                          handleReplaceEquipment={handleReplaceEquipment}
                        />
                      </div>
                    ) : (
                      <div className="n3-card" style={{ borderLeft: '4px solid #10b981' }}>
                        <div className="n3-card-header">
                          <div>
                            <h3 className="n3-card-title" style={{ color: '#10b981' }}>✅ Aucune intervention N3 en cours</h3>
                            <p className="n3-card-sub">Prenez en charge un ticket de la file d'attente ci-dessous pour démarrer.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Available N3 tickets queue */}
                    <div className="n3-card">
                      <div className="n3-card-header">
                        <div>
                          <h3 className="n3-card-title">🔴 File d'attente N3 — Tickets escaladés en attente</h3>
                          <p className="n3-card-sub">{availableTickets.length} incident(s) escaladé(s) N3 en attente d'expertise</p>
                        </div>
                      </div>

                      <AvailableTicketsTableN3
                        tickets={filterList(availableTickets, false)}
                        expandedId={expandedTicketId}
                        reports={previousReports}
                        onExpand={toggleExpandTicket}
                        onTake={handleTakeCharge}
                        getPriorityBadge={getPriorityBadge}
                      />
                    </div>
                  </div>
                )}

                {/* ── SUB-VIEW : PENDING (AVAILABLE) ── */}
                {activeSubFilter === 'PENDING' && (
                  <div className="n3-card">
                    <div className="n3-card-header">
                      <div>
                        <h3 className="n3-card-title">Tickets d'expertise disponibles à prendre en charge (N3)</h3>
                        <p className="n3-card-sub">Prenez en charge un ticket pour commencer l'intervention physique.</p>
                      </div>
                    </div>

                    <AvailableTicketsTableN3
                      tickets={filterList(availableTickets, false)}
                      expandedId={expandedTicketId}
                      reports={previousReports}
                      onExpand={toggleExpandTicket}
                      onTake={handleTakeCharge}
                      getPriorityBadge={getPriorityBadge}
                    />
                  </div>
                )}

                {/* ── SUB-VIEW : ACTIVE INTERVENTIONS ── */}
                {activeSubFilter === 'EN_COURS' && (
                  <div className="n3-card">
                    <div className="n3-card-header">
                      <div>
                        <h3 className="n3-card-title">Intervention expert N3 active en cours</h3>
                        <p className="n3-card-sub">Remplissez la checklist de connectivité et diagnostic avant de clôturer.</p>
                      </div>
                    </div>

                    {activeInterventions.length === 0 ? (
                      <div className="n3-empty">
                        <Wrench size={36} className="n3-empty-icon" />
                        <p className="n3-empty-title">Aucune intervention active</p>
                        <p className="n3-empty-text">Allez dans la "File d'attente" pour démarrer une intervention d'expertise N3.</p>
                        <button
                          className="n3-btn n3-btn-primary"
                          onClick={() => setActiveSubFilter('PENDING')}
                          style={{ marginTop: '0.75rem' }}
                        >
                          Voir les tickets disponibles
                        </button>
                      </div>
                    ) : (
                      <ActiveN3InterventionPanel
                        intervention={activeInterventions[0]}
                        checklist={onSiteChecklist}
                        setChecklist={setOnSiteChecklist}
                        selectedEquipState={selectedEquipState}
                        handleUpdateEquipmentState={handleUpdateEquipmentState}
                        onSave={handleSaveChecklist}
                        onResolve={handleOpenReport}
                        availableEquipments={availableEquipments}
                        handleReplaceEquipment={handleReplaceEquipment}
                      />
                    )}
                  </div>
                )}

                {/* ── SUB-VIEW : HISTORY ── */}
                {activeSubFilter === 'HISTORIQUE' && (
                  <div className="n3-card">
                    <div className="n3-card-header">
                      <div>
                        <h3 className="n3-card-title">Votre historique d'interventions N3 clôturées</h3>
                        <p className="n3-card-sub">{historyInterventions.length} expertise(s) N3 terminée(s) enregistrée(s)</p>
                      </div>
                    </div>

                    {historyInterventions.length === 0 ? (
                      <div className="n3-empty">
                        <History size={36} className="n3-empty-icon" />
                        <p className="n3-empty-title">Historique vide</p>
                        <p className="n3-empty-text">Vous n'avez pas encore résolu d'intervention de niveau N3.</p>
                      </div>
                    ) : (
                      <div className="n3-notif-table-wrapper">
                        <table className="n3-notif-table">
                          <thead>
                            <tr>
                              <th>Réf.</th>
                              <th>Détails de l'incident</th>
                              <th>Localisation</th>
                              <th>Priorité</th>
                              <th>Date Clôture</th>
                              <th>Statut</th>
                              <th>Rapport Technique N3</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyInterventions.map(item => {
                              const ticket = item.ticket;
                              if (!ticket) return null;
                              const q = searchQuery.toLowerCase();
                              const titre = String(ticket.titre || '').toLowerCase();
                              const desc = String(ticket.description || '').toLowerCase();
                              const nom = String(ticket.equipement?.nom || '').toLowerCase();
                              if (q && !titre.includes(q) && !desc.includes(q) && !nom.includes(q) && !String(ticket.id).includes(q)) return null;
                              if (priorityFilter !== 'ALL' && String(ticket.priorite || '').toUpperCase() !== priorityFilter) return null;
                              return (
                                <tr key={item.id} className="n3-notif-row">
                                  <td>#{ticket.id}</td>
                                  <td>
                                    <strong>{ticket.titre}</strong>
                                    <p className="text-xs text-slate-500">{ticket.description}</p>
                                    <span className="n3-ticket-id" style={{ display: 'inline-block', marginTop: 4 }}>EQ: {ticket.equipement?.nom}</span>
                                  </td>
                                  <td><strong>{ticket.equipement?.localisation || '—'}</strong></td>
                                  <td>{getPriorityBadge(ticket.priorite)}</td>
                                  <td>
                                    {item.dateFin ? new Date(item.dateFin).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : '—'}
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
                                      whiteSpace: 'pre-line',
                                      fontFamily: 'monospace'
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

            {/* ══════════════════ TAB 3 : NOTIFICATIONS ══════════════════ */}
            {activeTab === 'notifications' && (
              <div className="n3-fade-in">
                <div className="n3-card">
                  <div className="n3-card-header">
                    <div>
                      <h3 className="n3-card-title">Centre de notifications de l'Expert N3</h3>
                      <p className="n3-card-sub">Liste complète des alertes d'escalade et détections d'anomalies</p>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="n3-empty">
                      <Bell className="n3-empty-icon" size={36} />
                      <p className="n3-empty-title">Aucune notification reçue</p>
                      <p className="n3-empty-text">Votre boîte de réception d'alertes est vide.</p>
                    </div>
                  ) : (
                    <div className="n3-notif-table-wrapper">
                      <table className="n3-notif-table">
                        <thead>
                          <tr>
                            <th>Statut</th>
                            <th>Notification</th>
                            <th>Ticket Concerné</th>
                            <th>Priorité</th>
                            <th>Date / Heure</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notifications.map(notif => {
                            const isUnread = !(notif.lu || notif.read);
                            const msg = notif.message || notif.contenu || "Nouvelle alerte GMAO";
                            const dateStr = notif.dateCreation || notif.date || notif.createdAt;
                            const ticketTitle = notif.ticket?.titre || 'N/A';
                            const ticketPriority = notif.ticket?.priorite || 'N/A';

                            return (
                              <tr key={notif.id} className={`n3-notif-row ${isUnread ? 'unread' : ''}`}>
                                <td>
                                  {isUnread ? (
                                    <span className="n3-badge n3-badge-high">Non lue</span>
                                  ) : (
                                    <span className="n3-badge n3-badge-low">Lue</span>
                                  )}
                                </td>
                                <td className="n3-notif-message-col">
                                  <p className="n3-notif-msg">{msg}</p>
                                </td>
                                <td><strong>{ticketTitle}</strong></td>
                                <td>{getPriorityBadge(ticketPriority)}</td>
                                <td>
                                  {dateStr ? new Date(dateStr).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'N/A'}
                                </td>
                                <td>
                                  {isUnread && (
                                    <button
                                      onClick={() => markAsRead(notif.id)}
                                      className="n3-btn n3-btn-secondary"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                    >
                                      Marquer lue
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════ TAB 4 : PROFILE ══════════════════ */}
            {activeTab === 'profile' && (
              <div className="n3-fade-in">
                <UserProfile />
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ══════════════════════ EXPERT REPORT MODAL ══════════════════════ */}
      {isReportModalOpen && (
        <div className="n3-modal-overlay" onClick={() => setIsReportModalOpen(false)}>
          <div className="n3-modal" onClick={e => e.stopPropagation()}>
            <div className="n3-modal-header">
              <h3>Rapport technique obligatoire de l'Expert N3</h3>
              <button className="n3-modal-close" onClick={() => setIsReportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitResolution}>
              <div className="n3-modal-body">
                <div className="n3-form-group">
                  <label>Diagnostic technique de la panne *</label>
                  <textarea
                    className="n3-form-textarea"
                    placeholder="Description précise de la cause physique de la panne..."
                    value={reportForm.diagnostic}
                    onChange={e => setFormDetails('diagnostic', e.target.value)}
                    required
                  />
                </div>

                <div className="n3-form-group">
                  <label>Problème identifié (Description du problème de base) *</label>
                  <textarea
                    className="n3-form-textarea"
                    placeholder="Qu'est-ce qui a causé l'arrêt ?"
                    value={reportForm.probleme}
                    onChange={e => setFormDetails('probleme', e.target.value)}
                    required
                  />
                </div>

                <div className="n3-form-group">
                  <label>Solution ou Action corrective appliquée *</label>
                  <textarea
                    className="n3-form-textarea"
                    placeholder="Détaillez les actions entreprises (Changement de carte mère, réalignement mécanique, réparation automate...)"
                    value={reportForm.actionCorrective}
                    onChange={e => setFormDetails('actionCorrective', e.target.value)}
                    required
                  />
                </div>

                <div className="n3-form-row">
                  <div className="n3-form-group">
                    <label>Équipement de remplacement (Remplacé à l'étape 1)</label>
                    <input
                      type="text"
                      className="n3-form-input"
                      value={reportForm.equipementRemplace || 'Aucun'}
                      disabled
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="n3-form-group">
                    <label>Temps passé *</label>
                    <input
                      type="text"
                      className="n3-form-input"
                      placeholder="Ex: 2h 30m"
                      value={reportForm.tempsIntervention}
                      onChange={e => setFormDetails('tempsIntervention', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="n3-form-row">
                  <div className="n3-form-group">
                    <label>Observations complémentaires</label>
                    <input
                      type="text"
                      className="n3-form-input"
                      placeholder="Garantie, recommandations de graissage..."
                      value={reportForm.observations}
                      onChange={e => setFormDetails('observations', e.target.value)}
                    />
                  </div>
                  <div className="n3-form-group">
                    <label>Gravité finale</label>
                    <select
                      className="n3-form-select"
                      value={reportForm.gravite}
                      onChange={e => setFormDetails('gravite', e.target.value)}
                    >
                      <option value="LOW">Basse</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute (Critique)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="n3-modal-footer">
                <button type="button" className="n3-btn n3-btn-secondary" onClick={() => setIsReportModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="n3-btn n3-btn-primary">
                  <Check size={16} /> Transmettre le rapport & Clôturer
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
   SUB-COMPONENT: AVAILABLE N3 TICKETS TABLE
   ══════════════════════════════════════════════════════════ */
function AvailableTicketsTableN3({ tickets, expandedId, reports, onExpand, onTake, getPriorityBadge }) {
  if (tickets.length === 0) {
    return (
      <div className="n3-empty" style={{ padding: '2rem' }}>

        <p className="n3-empty-title">Aucun ticket en attente</p>
        <p className="n3-empty-text">Aucune intervention de niveau N3 n'est en attente.</p>
      </div>
    );
  }

  return (
    <div className="n3-notif-table-wrapper">
      <table className="n3-notif-table">
        <thead>
          <tr>
            <th>Réf.</th>
            <th>Localisation</th>
            <th>Priorité</th>
            <th>Date Escalation</th>
            <th>Historique Diagnostics</th>
            <th style={{ textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => {
            const isExpanded = expandedId === ticket.id;
            return (
              <React.Fragment key={ticket.id}>
                <tr className="n3-notif-row">
                  <td>#{ticket.id}</td>
                  <td><strong>{ticket.equipement?.localisation || 'Bureau'}</strong></td>
                  <td>{getPriorityBadge(ticket.priorite)}</td>
                  <td>
                    {ticket.dateCreation ? new Date(ticket.dateCreation).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '—'}
                  </td>
                  <td>
                    <button
                      className="n3-view-all"
                      onClick={() => onExpand(ticket.id)}
                      style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      {isExpanded ? 'Masquer' : 'Consulter rapports N1/N2'}
                      <ChevronRight size={12} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="n3-btn n3-btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                      onClick={() => onTake(ticket.id)}
                    >
                      🚀 Démarrer l'expertise
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan="6" style={{ background: '#f8fafc', padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem' }}>
                        <div>
                          <h5 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FileText size={14} color="#006633" />
                            Rapport N1 (Support Utilisateur) :
                          </h5>
                          {reports[ticket.id]?.n1 ? (
                            <StructuredReport reportText={reports[ticket.id].n1} type="n1" />
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.8rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '6px' }}>
                              Chargement du rapport N1...
                            </p>
                          )}
                        </div>

                        <div>
                          <h5 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FileText size={14} className="text-orange-500" />
                            Rapport N2 (Support Terrain) :
                          </h5>
                          {reports[ticket.id]?.n2 ? (
                            <StructuredReport reportText={reports[ticket.id].n2} type="n2" />
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.8rem', background: '#fef3c7', padding: '0.5rem', borderRadius: '6px' }}>
                              Chargement du rapport N2...
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.75rem' }}>
                          <div>
                            <span style={{ color: '#94a3b8', fontWeight: 700 }}>UTILISATEUR CONCERNÉ :</span>
                            <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569' }}>
                              {ticket.demandeur?.prenom} {ticket.demandeur?.nom} ({ticket.demandeur?.email})
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8', fontWeight: 700 }}>CONTACT INTERNE :</span>
                            <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569' }}>
                              {ticket.demandeur?.telephone || 'Non spécifié'}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#94a3b8', fontWeight: 700 }}>CODE INVENTAIRE :</span>
                            <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#475569' }}>
                              {ticket.equipement?.codeInventaire || 'N/A'}
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
   SUB-COMPONENT: ACTIVE N3 DIAGNOSTIC & INTERVENTION PANEL
   ══════════════════════════════════════════════════════════ */
function ActiveN3InterventionPanel({
  intervention,
  checklist,
  setChecklist,
  selectedEquipState,
  handleUpdateEquipmentState,
  onSave,
  onResolve,
  availableEquipments,
  handleReplaceEquipment
}) {
  const ticket = intervention.ticket;
  if (!ticket) return null;

  // Local state for replacement selection
  const [selectedReplacementId, setSelectedReplacementId] = React.useState('');

  const replaced = (() => {
    try {
      const action = intervention.actionADistance;
      if (action) {
        const parsed = JSON.parse(action);
        return parsed.equipmentReplaced === true;
      }
    } catch (e) { }
    return false;
  })();

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
    "Diagnostic d'isolement électrique (Mégohmmètre)",
    "Thermographie infrarouge (Caméra thermique)",
    "Analyse spectrale vibratoire (Accéléromètre)",
    "Vérification des tensions d'alimentation (Multimètre)",
    "Contrôle d'intégrité de la boucle de sécurité",
    "Test d'effort mécanique sous charge nominale",
    "Contrôle des signaux d'entrées/sorties API",
    "Restauration ou mise à jour firmware automate"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="n3-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>

        {/* Left Column */}
        <div className="n3-card" style={{ margin: 0, padding: '1.25rem', border: '1px solid #cbd5e1' }}>

          {!replaced ? (
            /* STEP 1: MANDATORY EQUIPMENT REPLACEMENT */
            <div className="n3-replacement-step n3-fade-in" style={{ padding: '1.25rem', background: 'var(--ocp-green-ultra-light)', borderRadius: '10px', border: '1px solid var(--ocp-green)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--ocp-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} />
                Étape 1 : Remplacement d'équipement obligatoire
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0' }}>
                L'équipement d'origine est considéré HS. Vous devez sélectionner un équipement fonctionnel disponible pour le remplacer dans la base de données avant de pouvoir rédiger le rapport final.
              </p>

              <div className="n3-form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Sélectionner un équipement de remplacement *</label>
                <select
                  className="n3-form-select"
                  value={selectedReplacementId}
                  onChange={e => setSelectedReplacementId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Choisir un équipement actif et disponible --</option>
                  {availableEquipments
                    .filter(eq => eq.etatAffectation === 'DISPONIBLE')
                    .map(eq => (
                      <option key={eq.id} value={eq.id}>
                        [{eq.codeInventaire}] {eq.nom} - {eq.marque} {eq.modele} ({eq.localisation || '—'})
                      </option>
                    ))}
                </select>
              </div>

              <button
                className="n3-btn n3-btn-primary"
                onClick={() => handleReplaceEquipment(ticket.id, selectedReplacementId)}
                disabled={!selectedReplacementId}
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                🔄 Valider le remplacement & Activer l'étape 2
              </button>
            </div>
          ) : (
            /* STEP 2: CHECKLIST & REPORT CLOSING */
            <div className="n3-checklist-step n3-fade-in">
              <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                <Cpu size={18} color="#006633" />
                Étape 2 : Checklist de Diagnostic Expert & Rapport N3
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="n3-form-group" style={{ margin: 0 }}>
                  <label>Tests de calibrage et conformité</label>
                  <select
                    className="n3-form-select"
                    value={checklist.calibrationState}
                    onChange={e => setChecklist({ ...checklist, calibrationState: e.target.value })}
                  >
                    <option value="OK">Calibration OK</option>
                    <option value="A_RECALIBRER">Calibration requise</option>
                    <option value="DEVIATION_CRITIQUE">Déviation critique mesurée</option>
                  </select>
                </div>

                <div className="n3-form-group" style={{ margin: 0 }}>
                  <label>Sécurité physique et verrouillage LOTO</label>
                  <select
                    className="n3-form-select"
                    value={checklist.safetyChecks}
                    onChange={e => setChecklist({ ...checklist, safetyChecks: e.target.value })}
                  >
                    <option value="OK">Sécurisation conforme (Lockout/Tagout)</option>
                    <option value="NON_CONFORME">Alerte sécurité non conforme</option>
                    <option value="NON_APPLICABLE">Non applicable sur cet équipement</option>
                  </select>
                </div>
              </div>

              <div className="n3-form-group">
                <label>Mesures d'expertise physique et logicielle effectuées :</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  {listTests.map(test => {
                    const isChecked = checklist.tests.includes(test);
                    return (
                      <label key={test} className="n3-check-row" style={{ fontSize: '0.78rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
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

              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1rem', marginTop: '1rem' }}>
                <label className="text-xs font-bold text-slate-700 block mb-2"> Déclaration d'état matériel de l'équipement :</label>
                <div className="n3-equip-state-grid" style={{ width: '100%', maxWidth: '500px', marginBottom: '1.25rem' }}>
                  <button
                    onClick={() => handleUpdateEquipmentState(ticket.equipement?.id, 'BON')}
                    className={`n3-equip-state-btn ${selectedEquipState === 'BON' ? 'active bon' : ''}`}
                  >
                    Opérationnel (BON)
                  </button>
                  <button
                    onClick={() => handleUpdateEquipmentState(ticket.equipement?.id, 'MOYEN')}
                    className={`n3-equip-state-btn ${selectedEquipState === 'MOYEN' ? 'active moyen' : ''}`}
                  >
                    Usé / Dégradé
                  </button>
                  <button
                    onClick={() => handleUpdateEquipmentState(ticket.equipement?.id, 'HS')}
                    className={`n3-equip-state-btn ${selectedEquipState === 'HS' ? 'active hs' : ''}`}
                  >
                    Hors Service / BRÛLÉ / HS
                  </button>
                </div>
              </div>

              <div className="n3-form-group">
                <label>Observations techniques et remarques expert</label>
                <textarea
                  className="n3-form-textarea"
                  rows={3}
                  placeholder="Saisissez vos observations pour le rapport..."
                  value={checklist.customObservations}
                  onChange={e => setChecklist({ ...checklist, customObservations: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="n3-btn n3-btn-secondary" onClick={onSave}>
                  <Database size={15} />  Enregistrer l'avancement
                </button>
                <button className="n3-btn n3-btn-primary" onClick={onResolve}>
                  <Check size={15} /> Rédiger Rapport & Clôturer
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Ticket Card details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="n3-card" style={{ margin: 0, padding: '1.25rem', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
              Détails du ticket expert
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>RÉFÉRENCE INCIDENT :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#006633' }}>TICKET #{ticket.id}</p>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>OBJET :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#334155' }}>{ticket.titre}</p>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>DEMANDEUR :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#334155' }}>
                  {ticket.demandeur?.prenom} {ticket.demandeur?.nom}
                </p>
                <p style={{ margin: '1px 0 0 0', color: '#64748b' }}>Tel: {ticket.demandeur?.telephone || '—'}</p>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>ÉQUIPEMENT ACTUEL :</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: '#334155' }}>
                  {ticket.equipement?.nom} ({ticket.equipement?.codeInventaire})
                </p>
                <p style={{ margin: '2px 0 0 0', color: '#006633', fontWeight: 700 }}>
                  📍 {ticket.equipement?.localisation || 'Bureau'}
                </p>
                <span className="n3-badge" style={{ marginTop: '4px', backgroundColor: ticket.equipement?.statut === 'HORS_SERVICE' || ticket.equipement?.statut === 'HS' ? '#ef4444' : '#e2e8f0', color: ticket.equipement?.statut === 'HORS_SERVICE' || ticket.equipement?.statut === 'HS' ? '#fff' : '#475569' }}>
                  Statut : {ticket.equipement?.statut}
                </span>
              </div>

              {replaced && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ color: 'var(--ocp-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={14} /> ÉQUIPEMENT REMPLACÉ
                  </span>
                  <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                    Un nouvel équipement a été affecté à ce ticket.
                  </p>
                </div>
              )}
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
    themeColor = '#006633'; // N2 Green (changed from Blue)
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
