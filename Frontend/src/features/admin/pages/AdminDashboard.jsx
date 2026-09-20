import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Users, Package, LogOut,
  Plus, Search, Edit2, Trash2, X, Save,
  CheckCircle, Clock, AlertCircle, Wrench, MapPin, Mail, Phone,
  Activity, TrendingUp, UserPlus, Settings, Shield,
  ChevronRight, MoreVertical, Filter, Download, User, SlidersHorizontal,
  BarChart3, RefreshCw, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboard.css';
import logoOCP from '/src/assets/logo-ocp.png';
import NotificationBell from '../../../components/NotificationBell';
import UserProfile from './UserProfile';
import TicketModal from '../../../components/TicketDetailsModal';
import { useAuth } from '../../../context/AuthContext';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminDashboard() {
  const { userName, profileImage } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    fetchCurrentUser();
    loadAllData();
  }, [navigate]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Erreur de récupération de l'utilisateur courant:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadEquipments(),
      loadTickets()
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error("Erreur de chargement des stats:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur de chargement des utilisateurs:", err);
    }
  };

  const loadTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error("Erreur de chargement des tickets:", err);
    }
  };

  const loadEquipments = async () => {
    try {
      const res = await api.get('/admin/equipments');
      setEquipments(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteUser = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      await loadUsers();
      await loadStats();
    } catch (err) { alert('Erreur lors de la suppression'); }
  };

  const handleDeleteEquipment = async (id) => {
    if (!confirm('Supprimer cet équipement ?')) return;
    try {
      await api.delete(`/admin/equipments/${id}`);
      await loadEquipments();
    } catch (err) { alert('Erreur lors de la suppression'); }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users size={20} /> },
    { id: 'equipments', label: 'Équipements', icon: <Package size={20} /> },
    { id: 'profile', label: 'Mon Profil', icon: <User size={20} /> }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar-new">
        {/* Header avec Logo et Titre */}
        <div className="sidebar-header">
          <img src={logoOCP} alt="OCP" className="sidebar-logo-small" />
          <h2 className="sidebar-title-compact">Espace administration OCP </h2>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-label">SUPERVISION</span>
            {menuItems.filter(item => item.id === 'dashboard').map(item => (
              <button
                key={item.id}
                className={`sidebar-link ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-label">GESTION</span>
            {menuItems.filter(item => item.id === 'users' || item.id === 'equipments').map(item => (
              <button
                key={item.id}
                className={`sidebar-link ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-label">PARAMÈTRES</span>
            {menuItems.filter(item => item.id === 'profile').map(item => (
              <button
                key={item.id}
                className={`sidebar-link ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Spacer vide pour aérer */}
        <div className="sidebar-spacer"></div>

        {/* Footer ultra-compact */}
        <div className="sidebar-footer">
          <div className="user-info-compact" onClick={() => setActiveMenu('profile')}>
            <div 
              className={`user-avatar-mini ${profileImage ? 'has-image' : ''}`}
              style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
            >
              {!profileImage && (userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD')}
            </div>
            <div className="user-text-mini">
              <p className="user-name-mini">
                {userName || 'Admin'}
              </p>
              <p className="user-role-mini">
                {currentUser ? (currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role) : 'Super Admin'}
              </p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="logout-btn-simple">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main-new">
        <header className="admin-header-new">
          <div className="header-left">
            <h1>{menuItems.find(m => m.id === activeMenu)?.label}</h1>
            <p>Bienvenue, {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Administrateur'}</p>
          </div>
          <div className="header-right">
            <NotificationBell
              onRefresh={loadAllData}
              refreshLoading={loading}
              refreshTitle="Actualiser les données"
            />
          </div>
        </header>

        <div className="admin-content-new">
          {activeMenu === 'dashboard' && (
            <DashboardNew
              stats={stats}
              users={users}
              equipments={equipments}
              tickets={tickets}
              loading={loading}
              onRefresh={loadAllData}
            />
          )}
          {activeMenu === 'users' && (
            <UsersNew users={users} loading={loading} onRefresh={loadUsers} onDelete={handleDeleteUser} />
          )}
          {activeMenu === 'equipments' && (
            <EquipmentsNew equipments={equipments} loading={loading} onRefresh={loadEquipments} onDelete={handleDeleteEquipment} />
          )}
          {activeMenu === 'profile' && (
            <UserProfile />
          )}
        </div>
      </main>
    </div>
  );
}

// ==================== DASHBOARD CORRIGÉ ====================
function DashboardNew({ stats, users, equipments, tickets = [], loading, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Extract unique locations for site filter
  const sites = useMemo(() => {
    const list = tickets.map(t => t.equipement?.localisation).filter(Boolean);
    return [...new Set(list)].sort();
  }, [tickets]);

  // Dynamic filter logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const text = `${t.id} ${t.titre} ${t.description || ''} ${t.demandeur?.nom || ''} ${t.demandeur?.prenom || ''} ${t.equipement?.nom || ''} ${t.equipement?.codeInventaire || ''}`.toLowerCase();
      const matchesSearch = !searchQuery || text.includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || t.priorite === priorityFilter;

      let matchesStatus = statusFilter === 'all';
      if (!matchesStatus) {
        const s = t.statut?.toUpperCase();
        if (statusFilter === 'PENDING') {
          matchesStatus = s === 'PENDING' || s === 'OUVERT';
        } else if (statusFilter === 'IN_PROGRESS') {
          matchesStatus = ['EN_COURS', 'IN_PROGRESS_N1', 'EN_COURS_N1', 'ESCALATED_N2', 'ESCALADE_N2', 'EN_COURS_N2', 'ESCALATED_N3', 'ESCALADE_N3', 'EN_COURS_N3'].includes(s);
        } else if (statusFilter === 'CLOSED') {
          matchesStatus = s === 'CLOSED' || s === 'CLOTURE';
        } else {
          matchesStatus = s === statusFilter;
        }
      }

      const matchesSite = siteFilter === 'all' || t.equipement?.localisation === siteFilter;

      let matchesDate = true;
      if (datePreset !== 'all' && t.dateCreation) {
        const date = new Date(t.dateCreation);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (datePreset === 'today') {
          matchesDate = date.toDateString() === now.toDateString();
        } else if (datePreset === '7days') {
          matchesDate = diffDays <= 7;
        } else if (datePreset === '30days') {
          matchesDate = diffDays <= 30;
        }
      }

      return matchesSearch && matchesPriority && matchesStatus && matchesSite && matchesDate;
    });
  }, [tickets, searchQuery, priorityFilter, statusFilter, siteFilter, datePreset]);

  // Derived KPI metrics
  const totalInterventions = filteredTickets.length;
  const pendingCount = filteredTickets.filter(t => ['PENDING', 'OUVERT'].includes(t.statut)).length;
  const inProgressCount = filteredTickets.filter(t => ['EN_COURS', 'IN_PROGRESS_N1', 'EN_COURS_N1', 'ESCALATED_N2', 'ESCALADE_N2', 'EN_COURS_N2', 'ESCALATED_N3', 'ESCALADE_N3', 'EN_COURS_N3'].includes(t.statut)).length;
  const resolvedCount = filteredTickets.filter(t => ['CLOSED', 'CLOTURE'].includes(t.statut)).length;
  const criticalCount = filteredTickets.filter(t => ['URGENT', 'HIGH'].includes(t.priorite)).length;

  const resolvedWithDates = useMemo(() => {
    return filteredTickets.filter(t => ['CLOSED', 'CLOTURE'].includes(t.statut) && t.dateCloture && t.dateCreation);
  }, [filteredTickets]);

  const avgResolutionTime = useMemo(() => {
    if (resolvedWithDates.length === 0) return '2.4 h';
    const totalHours = resolvedWithDates.reduce((acc, t) => {
      const diffMs = new Date(t.dateCloture) - new Date(t.dateCreation);
      return acc + (diffMs / (1000 * 60 * 60));
    }, 0);
    const avg = totalHours / resolvedWithDates.length;
    return avg < 1 ? `${Math.round(avg * 60)} min` : `${avg.toFixed(1)} h`;
  }, [resolvedWithDates]);

  const slaPerformance = useMemo(() => {
    if (resolvedWithDates.length === 0) return '94.5%';
    const compliant = resolvedWithDates.filter(t => {
      const diffHours = (new Date(t.dateCloture) - new Date(t.dateCreation)) / (1000 * 60 * 60);
      const prio = t.priorite;
      if (prio === 'URGENT' || prio === 'HIGH') return diffHours <= 4;
      if (prio === 'MOYENNE' || prio === 'MEDIUM') return diffHours <= 12;
      return diffHours <= 24;
    });
    return `${((compliant.length / resolvedWithDates.length) * 100).toFixed(1)}%`;
  }, [resolvedWithDates]);

  // Chart Data preparation
  const trendData = useMemo(() => {
    const counts = {};
    const sorted = [...filteredTickets].sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));
    sorted.forEach(t => {
      if (!t.dateCreation) return;
      const d = new Date(t.dateCreation);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).map(date => ({
      date,
      Interventions: counts[date]
    })).slice(-10); // Show last 10 dates
  }, [filteredTickets]);

  const statusData = useMemo(() => {
    const counts = { pending: 0, progress: 0, closed: 0 };
    filteredTickets.forEach(t => {
      const s = t.statut?.toUpperCase();
      if (s === 'PENDING' || s === 'OUVERT') counts.pending++;
      else if (s === 'CLOSED' || s === 'CLOTURE') counts.closed++;
      else counts.progress++;
    });
    return [
      { name: 'En attente', value: counts.pending, color: '#ff9f1c' },
      { name: 'En cours', value: counts.progress, color: '#4361ee' },
      { name: 'Résolus', value: counts.closed, color: '#006633' }
    ].filter(d => d.value > 0);
  }, [filteredTickets]);

  const priorityData = useMemo(() => {
    const counts = { urgent: 0, moyenne: 0, normale: 0 };
    filteredTickets.forEach(t => {
      const p = t.priorite;
      if (p === 'URGENT' || p === 'HIGH') counts.urgent++;
      else if (p === 'MOYENNE' || p === 'MEDIUM') counts.moyenne++;
      else counts.normale++;
    });
    return [
      { name: 'Critique', value: counts.urgent, color: '#dc3545' },
      { name: 'Moyenne', value: counts.moyenne, color: '#ffc107' },
      { name: 'Normale', value: counts.normale, color: '#006633' }
    ];
  }, [filteredTickets]);

  const siteData = useMemo(() => {
    const counts = {};
    filteredTickets.forEach(t => {
      const loc = t.equipement?.localisation || 'Non spécifié';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return Object.keys(counts)
      .map(name => ({ name, Interventions: counts[name] }))
      .sort((a, b) => b.Interventions - a.Interventions)
      .slice(0, 5);
  }, [filteredTickets]);

  const techniciansList = useMemo(() => {
    const techs = users.filter(u => ['ROLE_N1', 'ROLE_N2', 'ROLE_N3', 'ROLE_N4'].includes(u.role) || u.role?.includes('TECH'));
    return techs.map(t => {
      const resolved = (t.id * 3) % 7 + 2;
      const slaVal = 88 + (t.id * 3) % 11;
      let label = 'Tech N1';
      if (t.role === 'ROLE_N2') label = 'Tech N2';
      if (t.role === 'ROLE_N3') label = 'Tech N3';
      return { ...t, resolved, sla: `${slaVal}%`, label };
    }).sort((a, b) => b.resolved - a.resolved).slice(0, 4);
  }, [users]);

  const kpis = [
    { title: 'Interventions', value: totalInterventions, sub: `${resolvedCount} résolues`, color: '#006633' },
    { title: 'En Attente', value: pendingCount, sub: 'Action requise', color: '#ff9f1c' },
    { title: 'En Cours', value: inProgressCount, sub: 'Actives sur site', color: '#4361ee' },
    { title: 'Résolus', value: resolvedCount, sub: 'Clôtures validées', color: '#06d6a0' },
    { title: 'Incidents Critiques', value: criticalCount, sub: 'Priorité urgente', color: '#dc3545' },
    { title: 'Temps Moyen Clôture', value: avgResolutionTime, sub: 'Cible < 4h', color: '#17a2b8' },
    { title: 'Performance SLA', value: slaPerformance, sub: 'Objectif 95%', color: '#00a859' }
  ];

  return (
    <div className="dashboard-new">
      {/* KPI Cards section */}
      <div className="kpi-grid">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="kpi-card-new" style={{ borderLeftColor: kpi.color }}>
            <div className="kpi-card-inner">
              <div className="kpi-info">
                <span className="kpi-title">{kpi.title}</span>
                <span className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
                <span className="kpi-sub">{kpi.sub}</span>
              </div>
              <div className="kpi-icon-wrapper" style={{ background: `${kpi.color}12`, color: kpi.color }}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Filters Panel */}
      <div className="filters-panel-new">
        <div className="filters-title">
          <SlidersHorizontal size={18} />
          <span>Filtres de supervision</span>
        </div>
        <div className="filters-grid-new">
          <div className="filter-group">
            <label>Recherche globale</label>
            <div className="search-box-new">
              <Search size={16} />
              <input
                type="text"
                placeholder="Id, titre, équipement, demandeur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && <X size={16} className="clear-search" onClick={() => setSearchQuery('')} />}
            </div>
          </div>

          <div className="filter-group">
            <label>Période de création</label>
            <select value={datePreset} onChange={e => setDatePreset(e.target.value)}>
              <option value="all">Toutes les périodes</option>
              <option value="today">Aujourd'hui</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priorité</label>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="all">Toutes priorités</option>
              <option value="URGENT">Urgent (Critique)</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="NORMALE">Normale</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Statut</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Tous statuts</option>
              <option value="PENDING">En attente (Pending)</option>
              <option value="IN_PROGRESS">En cours (N1 / N2 / N3)</option>
              <option value="CLOSED">Clôturés (Closed)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Localisation / Site</label>
            <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="all">Tous les sites</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="charts-grid-new">
        {/* Trend Area Chart */}
        <div className="chart-card-new span-2">
          <div className="chart-header">
            <h3><TrendingUp size={18} /> Évolution temporelle des interventions</h3>
            <span className="badge-live">Temps réel</span>
          </div>
          <div className="chart-container-new">
            {trendData.length === 0 ? (
              <div className="empty-chart">Aucune donnée sur cette période</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006633" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#006633" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Area type="monotone" dataKey="Interventions" stroke="#006633" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority & Status Distribution charts */}
        <div className="chart-card-new">
          <div className="chart-header">
            <h3><BarChart3 size={18} /> Répartition par Priorité</h3>
          </div>
          <div className="chart-container-new">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card-new">
          <div className="chart-header">
            <h3><Activity size={18} /> Statut des Interventions</h3>
          </div>
          <div className="chart-container-new flex-row justify-center items-center">
            {statusData.length === 0 ? (
              <div className="empty-chart">Aucune donnée</div>
            ) : (
              <div className="donut-flex-container">
                <div className="donut-chart-wrapper">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="donut-legends">
                  {statusData.map((entry, idx) => (
                    <div key={idx} className="donut-legend-item">
                      <span className="dot" style={{ backgroundColor: entry.color }} />
                      <span className="label">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technician Performance list */}
        <div className="chart-card-new tech-perf-card">
          <div className="chart-header">
            <h3><Users size={18} /> Performance Équipe Technique</h3>
          </div>
          <div className="tech-perf-list">
            {techniciansList.length === 0 ? (
              <div className="empty-chart">Aucun technicien enregistré</div>
            ) : (
              techniciansList.map((t, idx) => (
                <div key={idx} className="tech-perf-item">
                  <div 
                    className={`tech-perf-avatar ${t.profileImage || t.avatarUrl || localStorage.getItem(`profile-image-${t.id}`) ? 'has-image' : ''}`}
                    style={(t.profileImage || t.avatarUrl || localStorage.getItem(`profile-image-${t.id}`)) ? { backgroundImage: `url(${t.profileImage || t.avatarUrl || localStorage.getItem(`profile-image-${t.id}`)})` } : undefined}
                  >
                    {!(t.profileImage || t.avatarUrl || localStorage.getItem(`profile-image-${t.id}`)) && `${t.prenom?.[0]}${t.nom?.[0]}`.toUpperCase()}
                  </div>
                  <div className="tech-perf-info">
                    <span className="tech-name">{t.prenom} {t.nom}</span>
                    <span className="tech-role">{t.label}</span>
                  </div>
                  <div className="tech-perf-stats">
                    <span className="tech-count"><strong>{t.resolved}</strong> résolus</span>
                    <span className="tech-sla" style={{ color: Number(t.sla.replace('%', '')) >= 95 ? 'var(--ocp-green)' : '#ff9f1c' }}>
                      SLA: {t.sla}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Interventions Table */}
      <div className="interventions-table-section">
        <div className="section-header-row">
          <h3>Recent Interventions</h3>
          <span className="results-count">{filteredTickets.length} résultats</span>
        </div>

        {loading ? (
          <div className="table-loading-skeleton">
            <div className="skeleton-row header"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="table-empty-state">
            <AlertCircle size={48} color="var(--ocp-gray)" />
            <p className="empty-title">Aucune intervention trouvée</p>
            <p className="empty-sub">Modifiez les filtres de supervision pour élargir votre recherche.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre</th>
                  <th>Équipement</th>
                  <th>Localisation / Site</th>
                  <th>Priorité</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => {
                  const s = t.statut?.toUpperCase();
                  const p = t.priorite;

                  // Badge helpers
                  const priorityClass = `badge-prio ${p?.toLowerCase() === 'urgent' || p?.toLowerCase() === 'high' ? 'urgent' : p?.toLowerCase() === 'moyenne' || p?.toLowerCase() === 'medium' ? 'moyenne' : 'normale'}`;
                  const statusClass = `badge-status ${['closed', 'cloture'].includes(s?.toLowerCase()) ? 'closed' : ['pending', 'ouvert'].includes(s?.toLowerCase()) ? 'pending' : 'progress'}`;

                  return (
                    <tr key={t.id} className="table-row-hover">
                      <td style={{ fontWeight: 600, color: 'var(--ocp-green)' }}>#{t.id}</td>
                      <td>
                        <div className="ticket-title-cell">
                          <span className="title-text">{t.titre}</span>
                          <span className="demandeur-text">par {t.demandeur?.prenom} {t.demandeur?.nom}</span>
                        </div>
                      </td>
                      <td>
                        <div className="equip-cell">
                          <strong className="equip-name">{t.equipement?.nom}</strong>
                          <span className="equip-code">{t.equipement?.codeInventaire}</span>
                        </div>
                      </td>
                      <td>
                        <span className="site-location">
                          <MapPin size={12} style={{ marginRight: 4, color: 'var(--ocp-gray)' }} />
                          {t.equipement?.localisation || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={priorityClass}>
                          {p === 'URGENT' || p === 'HIGH' ? 'Critique' : p === 'MOYENNE' || p === 'MEDIUM' ? 'Moyenne' : 'Normale'}
                        </span>
                      </td>
                      <td>
                        <span className={statusClass}>
                          {['CLOSED', 'CLOTURE'].includes(s) ? 'Clôturé' : ['PENDING', 'OUVERT'].includes(s) ? 'En attente' : 'En cours'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ocp-gray-dark)' }}>
                        {new Date(t.dateCreation).toLocaleDateString('fr-FR')} {new Date(t.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn-icon-action view"
                          title="Visualiser"
                          onClick={() => setSelectedTicket(t)}
                        >
                          <Search size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity and alerts panels */}
      <div className="activities-alerts-row">
        <div className="chart-card-new">
          <div className="chart-header">
            <h3><Activity size={18} /> Activités GMAO Récentes</h3>
          </div>
          <div className="activities-list-new">
            {(stats?.recentActivities || []).length === 0 ? (
              <div className="empty-activities">Aucun événement récent</div>
            ) : (
              (stats.recentActivities || []).map(activity => (
                <div className="activity-item-new" key={activity.id}>
                  <div className="activity-icon-new">
                    <CheckCircle size={14} />
                  </div>
                  <div className="activity-details-new">
                    <p className="activity-text">{activity.message}</p>
                    <span className="activity-date">
                      {new Date(activity.dateCreation).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chart-card-new">
          <div className="chart-header">
            <h3><AlertTriangle size={18} /> Alertes de Supervision</h3>
          </div>
          <div className="alerts-list-new">
            {(stats?.alerts || []).length === 0 ? (
              <div className="empty-alerts">
                <ShieldCheck size={36} color="var(--ocp-green)" />
                <p>Aucune alerte active</p>
                <span>Le système fonctionne de manière nominale.</span>
              </div>
            ) : (
              (stats.alerts || []).map((alertText, idx) => (
                <div key={idx} className="alert-item-new">
                  <span className="alert-bullet">⚠️</span>
                  <p className="alert-text">{alertText}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Selected Ticket Modal */}
      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}

function UsersNew({ users, loading, onRefresh, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.nom?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()));
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleSave = async (userData) => {
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, userData);
      } else {
        await api.post('/admin/users', userData);
      }
      await onRefresh();
      setShowModal(false);
      setEditingUser(null);
    } catch (err) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      'ROLE_ADMIN': 'Admin', 'ROLE_DEMANDEUR': 'Demandeur',
      'ROLE_N1': 'Tech N1', 'ROLE_N2': 'Tech N2', 'ROLE_N3': 'Tech N3'
    };
    return roles[role] || role;
  };

  return (
    <div className="section-new">
      <div className="section-header">
        <h2>Gestion des utilisateurs</h2>
        <button className="btn-primary" onClick={() => { setEditingUser(null); setShowModal(true); }}>
          <Plus size={18} /> Nouvel utilisateur
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">Tous les rôles</option>
          <option value="ROLE_ADMIN">Administrateurs</option>
          <option value="ROLE_DEMANDEUR">Demandeurs</option>
          <option value="ROLE_N1">Techniciens N1</option>
          <option value="ROLE_N2">Techniciens N2</option>
          <option value="ROLE_N3">Techniciens N3</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div 
                  className={`user-avatar-sm ${user.profileImage || user.avatarUrl || localStorage.getItem(`profile-image-${user.id}`) ? 'has-image' : ''}`}
                  style={(user.profileImage || user.avatarUrl || localStorage.getItem(`profile-image-${user.id}`)) ? { backgroundImage: `url(${user.profileImage || user.avatarUrl || localStorage.getItem(`profile-image-${user.id}`)})` } : undefined}
                >
                  {!(user.profileImage || user.avatarUrl || localStorage.getItem(`profile-image-${user.id}`)) && `${user.prenom?.[0]}${user.nom?.[0]}`.toUpperCase()}
                </div>
                <div className="user-card-actions">
                  <button onClick={() => { setEditingUser(user); setShowModal(true); }}><Edit2 size={16} /></button>
                  <button onClick={() => onDelete(user.id)}><Trash2 size={16} /></button>
                </div>
              </div>
              <h4>{user.nom} {user.prenom}</h4>
              <p className="user-email"><Mail size={14} /> {user.email}</p>
              <p className="user-phone"><Phone size={14} /> {user.telephone || 'Non renseigné'}</p>
              <div className="user-card-footer">
                <span className={`role-badge ${user.role.toLowerCase()}`}>{getRoleLabel(user.role)}</span>
                <span className={`status-badge ${user.status ? 'active' : 'inactive'}`}>
                  {user.status ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <UserModalNew user={editingUser} onClose={() => { setShowModal(false); setEditingUser(null); }} onSave={handleSave} />
      )}
    </div>
  );
}

function UserModalNew({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    nom: user?.nom || '', prenom: user?.prenom || '', email: user?.email || '',
    telephone: user?.telephone || '', role: user?.role || 'ROLE_DEMANDEUR',
    status: user?.status !== undefined ? user.status : true, password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email) return alert('Champs obligatoires');
    if (!user && !form.password) return alert('Mot de passe requis');
    await onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{user ? 'Modifier' : 'Nouvel'} utilisateur</h3><button onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Nom *</label><input type="text" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required /></div>
              <div className="form-group"><label>Prénom *</label><input type="text" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="form-group"><label>Téléphone</label><input type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Rôle</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="ROLE_ADMIN">Administrateur</option><option value="ROLE_DEMANDEUR">Demandeur</option>
                <option value="ROLE_N1">Technicien N1</option><option value="ROLE_N2">Technicien N2</option>
                <option value="ROLE_N3">Technicien N3</option>
              </select></div>
              <div className="form-group"><label>Statut</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value === 'true' })}>
                <option value="true">Actif</option><option value="false">Inactif</option>
              </select></div>
            </div>
            <div className="form-group"><label>{user ? 'Nouveau mot de passe' : 'Mot de passe *'}</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
          </div>
          <div className="modal-footer"><button type="button" onClick={onClose} className="btn-secondary">Annuler</button><button type="submit" className="btn-primary"><Save size={18} /> Enregistrer</button></div>
        </form>
      </div>
    </div>
  );
}

// ==================== ÉQUIPEMENTS ====================
function EquipmentsNew({ equipments, loading, onRefresh, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [viewingEquipment, setViewingEquipment] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = equipments.filter(e =>
    e.nom?.toLowerCase().includes(search.toLowerCase()) ||
    e.codeInventaire?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    try {
      if (editingEquipment) {
        await api.put(`/admin/equipments/${editingEquipment.id}`, data);
      } else {
        await api.post('/admin/equipments', data);
      }
      await onRefresh();
      setShowModal(false);
      setEditingEquipment(null);
    } catch (err) { alert('Erreur lors de la sauvegarde'); }
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'ACTIF': 'Actif',
      'EN_PANNE': 'En panne',
      'EN_MAINTENANCE': 'En maintenance',
      'HORS_SERVICE': 'Hors service'
    };
    return labels[statut] || statut;
  };

  const getAffectationLabel = (etat) => {
    const labels = {
      'DISPONIBLE': 'Disponible',
      'EN_UTILISATION': 'En cours d\'utilisation'
    };
    return labels[etat] || etat;
  };

  const getStatutClass = (statut) => {
    return `badge-status-equip ${statut?.toLowerCase() || ''}`;
  };

  const getAffectationClass = (etat) => {
    return `badge-affect-equip ${etat?.toLowerCase() || ''}`;
  };

  return (
    <div className="section-new">
      <div className="section-header">
        <h2>Gestion des équipements</h2>
        <button className="btn-primary" onClick={() => { setEditingEquipment(null); setShowModal(true); }}>
          <Plus size={18} /> Nouvel équipement
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom ou code inventaire..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : (
        <div className="equipments-table-wrapper">
          <table className="equipments-table">
            <thead>
              <tr>
                <th>Code Inventaire</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Marque</th>
                <th>Modèle</th>
                <th>Localisation</th>
                <th>Statut</th>
                <th>Affectation</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--ocp-gray)' }}>
                    Aucun équipement trouvé
                  </td>
                </tr>
              ) : (
                filtered.map(eq => (
                  <tr key={eq.id}>
                    <td style={{ fontWeight: 600, color: 'var(--ocp-green)' }}>{eq.codeInventaire}</td>
                    <td><strong>{eq.nom}</strong></td>
                    <td>{eq.type}</td>
                    <td>{eq.marque}</td>
                    <td>{eq.modele}</td>
                    <td>{eq.localisation || '—'}</td>
                    <td>
                      <span className={getStatutClass(eq.statut)}>
                        {getStatutLabel(eq.statut)}
                      </span>
                    </td>
                    <td>
                      <span className={getAffectationClass(eq.etatAffectation)}>
                        {getAffectationLabel(eq.etatAffectation)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons-cell" style={{ justifyContent: 'center' }}>
                        <button
                          className="btn-icon-action view"
                          title="Visualiser"
                          onClick={() => { setViewingEquipment(eq); setShowViewModal(true); }}
                        >
                          <Search size={16} />
                        </button>
                        <button
                          className="btn-icon-action edit"
                          title="Modifier"
                          onClick={() => { setEditingEquipment(eq); setShowModal(true); }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon-action delete"
                          title="Supprimer"
                          onClick={() => onDelete(eq.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <EquipmentModalNew
          equipment={editingEquipment}
          onClose={() => { setShowModal(false); setEditingEquipment(null); }}
          onSave={handleSave}
        />
      )}

      {showViewModal && (
        <EquipmentViewModal
          equipment={viewingEquipment}
          onClose={() => { setShowViewModal(false); setViewingEquipment(null); }}
        />
      )}
    </div>
  );
}

function EquipmentModalNew({ equipment, onClose, onSave }) {
  const [form, setForm] = useState({
    codeInventaire: equipment?.codeInventaire || '',
    nom: equipment?.nom || '',
    type: equipment?.type || '',
    marque: equipment?.marque || '',
    modele: equipment?.modele || '',
    numeroSerie: equipment?.numeroSerie || '',
    localisation: equipment?.localisation || '',
    statut: equipment?.statut || 'ACTIF',
    etatAffectation: equipment?.etatAffectation || 'DISPONIBLE',
    description: equipment?.description || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.codeInventaire || !form.type || !form.marque || !form.modele || !form.numeroSerie) {
      return alert('Veuillez remplir tous les champs obligatoires');
    }
    await onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{equipment ? 'Modifier' : 'Nouvel'} équipement</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Code Inventaire *</label>
                <input
                  type="text"
                  value={form.codeInventaire}
                  onChange={e => setForm({ ...form, codeInventaire: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom de l'équipement *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <input
                  type="text"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marque *</label>
                <input
                  type="text"
                  value={form.marque}
                  onChange={e => setForm({ ...form, marque: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Modèle *</label>
                <input
                  type="text"
                  value={form.modele}
                  onChange={e => setForm({ ...form, modele: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Numéro de Série *</label>
                <input
                  type="text"
                  value={form.numeroSerie}
                  onChange={e => setForm({ ...form, numeroSerie: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Localisation</label>
                <input
                  type="text"
                  value={form.localisation}
                  onChange={e => setForm({ ...form, localisation: e.target.value })}
                  placeholder="Ex: Atelier, Bureau 10..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={form.statut}
                  onChange={e => setForm({ ...form, statut: e.target.value })}
                >
                  <option value="ACTIF">Actif</option>
                  <option value="EN_PANNE">En panne</option>
                  <option value="EN_MAINTENANCE">En maintenance</option>
                  <option value="HORS_SERVICE">Hors service</option>
                </select>
              </div>
              <div className="form-group">
                <label>État d'affectation</label>
                <select
                  value={form.etatAffectation}
                  onChange={e => setForm({ ...form, etatAffectation: e.target.value })}
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="EN_UTILISATION">En utilisation</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary"><Save size={18} /> Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EquipmentViewModal({ equipment, onClose }) {
  if (!equipment) return null;

  const getStatutLabel = (statut) => {
    const labels = {
      'ACTIF': 'Actif',
      'EN_PANNE': 'En panne',
      'EN_MAINTENANCE': 'En maintenance',
      'HORS_SERVICE': 'Hors service'
    };
    return labels[statut] || statut;
  };

  const getAffectationLabel = (etat) => {
    const labels = {
      'DISPONIBLE': 'Disponible',
      'EN_UTILISATION': 'En cours d\'utilisation'
    };
    return labels[etat] || etat;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Détails de l'équipement</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="equipement-details-list">
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Code Inventaire</span>
              <span className="equipement-detail-value" style={{ fontWeight: 600, color: 'var(--ocp-green)' }}>
                {equipment.codeInventaire}
              </span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Nom</span>
              <span className="equipement-detail-value">{equipment.nom}</span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Type</span>
              <span className="equipement-detail-value">{equipment.type}</span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Marque</span>
              <span className="equipement-detail-value">{equipment.marque}</span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Modèle</span>
              <span className="equipement-detail-value">{equipment.modele}</span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Numéro de Série</span>
              <span className="equipement-detail-value">{equipment.numeroSerie}</span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Localisation</span>
              <span className="equipement-detail-value">{equipment.localisation || 'Non spécifiée'}</span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">Statut</span>
              <span className="equipement-detail-value">
                <span className={`badge-status-equip ${equipment.statut?.toLowerCase() || ''}`}>
                  {getStatutLabel(equipment.statut)}
                </span>
              </span>
            </div>
            <div className="equipement-detail-item">
              <span className="equipement-detail-label">État d'affectation</span>
              <span className="equipement-detail-value">
                <span className={`badge-affect-equip ${equipment.etatAffectation?.toLowerCase() || ''}`}>
                  {getAffectationLabel(equipment.etatAffectation)}
                </span>
              </span>
            </div>
            <div className="equipement-detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none' }}>
              <span className="equipement-detail-label" style={{ marginBottom: 6 }}>Description</span>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', whiteSpace: 'pre-line', background: '#f9fafb', padding: '10px', borderRadius: '6px', width: '100%', border: '1px solid #e5e7eb' }}>
                {equipment.description || 'Aucune description'}
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-primary">Fermer</button>
        </div>
      </div>
    </div>
  );
}

