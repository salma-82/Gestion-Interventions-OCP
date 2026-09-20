import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Inbox,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Search,
  SlidersHorizontal,
  ChevronRight,
  BarChart3,
  ShieldAlert,
  FileText,
  X
} from 'lucide-react';

// API default export from services
import api from '../../../services/api';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

// Priority display config used in the intervention table
const priorityConfig = {
  HIGH: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2' },
  URGENT: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2' },
  MEDIUM: { label: 'Moyenne', color: '#d97706', bg: '#fffbeb' },
  MOYENNE: { label: 'Moyenne', color: '#d97706', bg: '#fffbeb' },
  LOW: { label: 'Normale', color: '#059669', bg: '#ecfdf5' },
  NORMALE: { label: 'Normale', color: '#059669', bg: '#ecfdf5' },
};

export default function ModernDashboardContent({
  availableTickets,
  activeInterventions,
  historyInterventions,
  stats,
  volumeChartData,
  priorityChartData,
  handleStartIntervention,
  handleOpenReportModal,
  handleSubmitClose,
  handleSubmitEscalate,
  loadDashboardData,
  userId,
  setActiveTab,
  handleOpenCustomReport
}) {
  const [recharts, setRecharts] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [localSearch, setLocalSearch] = useState('');
  const [localPriority, setLocalPriority] = useState('ALL');

  // Notification states
  const [prevTicketCount, setPrevTicketCount] = useState(availableTickets.length);
  const [hasAlert, setHasAlert] = useState(false);
  const [activeChannels] = useState({ ui: true, email: true, phone: true });


  // Dynamic import of Recharts — alias module exports to R-prefixed names used in JSX
  useEffect(() => {
    import('recharts').then(mod => {
      // Expose all Recharts exports with the R prefix so JSX below resolves them
      const aliased = {};
      aliased.RResponsiveContainer = mod.ResponsiveContainer;
      aliased.RBarChart = mod.BarChart;
      aliased.RBar = mod.Bar;
      aliased.RCell = mod.Cell;
      aliased.RPieChart = mod.PieChart;
      aliased.RPie = mod.Pie;
      aliased.RAreaChart = mod.AreaChart;
      aliased.RArea = mod.Area;
      aliased.RRadialBarChart = mod.RadialBarChart;
      aliased.RRadialBar = mod.RadialBar;
      aliased.RCartesianGrid = mod.CartesianGrid;
      aliased.RXAxis = mod.XAxis;
      aliased.RYAxis = mod.YAxis;
      aliased.RTooltip = mod.Tooltip;
      aliased.RLegend = mod.Legend;
      setRecharts(aliased);
    });
  }, []);

  // Web Audio API beep sound generator
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Sound playback blocked or not supported", e);
    }
  };

  // Listen to new tickets
  useEffect(() => {
    if (availableTickets.length > prevTicketCount) {
      playNotificationSound();
      toast.success("Nouveau incident GMAO reçu ! Notifications Email et SMS envoyées.", {
        icon: '🔔',
        duration: 5000,
        style: {
          background: '#047857',
          color: '#fff',
          borderRadius: '12px',
          fontWeight: '600'
        }
      });
      setHasAlert(true);
    }
    setPrevTicketCount(availableTickets.length);
  }, [availableTickets.length]);

  // Average resolution time calculated from history
  const avgResolutionTime = useMemo(() => {
    if (historyInterventions.length === 0) return '30 min';
    let totalMinutes = 0;
    let count = 0;
    historyInterventions.forEach(i => {
      if (i.dateDebut && i.dateFin) {
        const ms = new Date(i.dateFin) - new Date(i.dateDebut);
        const mins = Math.floor(ms / (1000 * 60));
        if (mins > 0) {
          totalMinutes += mins;
          count++;
        }
      } else if (i.tempsPasse) {
        const m = i.tempsPasse.match(/(\d+)\s*(min|h|heure)/i);
        if (m) {
          let val = parseInt(m[1]);
          if (m[2].toLowerCase().startsWith('h')) {
            val *= 60;
          }
          totalMinutes += val;
          count++;
        }
      }
    });
    if (count > 0) {
      const avg = totalMinutes / count;
      return avg >= 60 ? `${(avg / 60).toFixed(1)} h` : `${Math.round(avg)} min`;
    }
    return '25 min';
  }, [historyInterventions]);

  // Taux de resolution calculation
  const resolutionRate = useMemo(() => {
    const totalDone = stats.closed + stats.escalated;
    return totalDone > 0 ? Math.round((stats.closed / totalDone) * 100) : 100;
  }, [stats.closed, stats.escalated]);

  // Group historical interventions by week for AreaChart
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks = {};
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i * 7);

      const getWeekNo = (dateVal) => {
        const target = new Date(dateVal.valueOf());
        const dayNr = (dateVal.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - target) / 604800000);
      };

      const wNum = getWeekNo(d);
      weeks[wNum] = { name: `Semaine ${wNum}`, 'Résolus': 0, 'Escaladés N2': 0 };
    }

    historyInterventions.forEach(i => {
      if (i.dateFin) {
        const date = new Date(i.dateFin);
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        const wNum = 1 + Math.ceil((firstThursday - target) / 604800000);

        if (weeks[wNum]) {
          const status = String(i.ticket?.statut || '').toUpperCase();
          if (status === 'CLOTURE' || status === 'CLOSED') {
            weeks[wNum]['Résolus'] += 1;
          } else if (status === 'ESCALADE_N2' || status === 'ESCALATED_N2') {
            weeks[wNum]['Escaladés N2'] += 1;
          }
        }
      }
    });
    return Object.values(weeks);
  }, [historyInterventions]);

  // Radial Bar Data
  const radialData = useMemo(() => {
    return [
      { name: 'En cours', count: stats.active, fill: '#2563eb' },
      { name: 'Escaladés N2', count: stats.escalated, fill: '#d97706' },
      { name: 'Résolus', count: stats.closed, fill: '#047857' }
    ];
  }, [stats.active, stats.escalated, stats.closed]);

  // Combined available tickets & active interventions
  const combinedList = useMemo(() => {
    const list = [];
    activeInterventions.forEach(i => {
      if (i.ticket) {
        list.push({ ...i.ticket, intervention: i, isAssigned: true });
      }
    });
    availableTickets.forEach(t => {
      list.push({ ...t, isAssigned: false });
    });
    return list;
  }, [activeInterventions, availableTickets]);

  // Filtering combined table items
  const filteredList = useMemo(() => {
    return combinedList.filter(item => {
      const matchesSearch =
        String(item.id).includes(localSearch) ||
        String(item.titre || '').toLowerCase().includes(localSearch.toLowerCase()) ||
        String(item.description || '').toLowerCase().includes(localSearch.toLowerCase()) ||
        String(item.equipement?.nom || '').toLowerCase().includes(localSearch.toLowerCase()) ||
        String(item.demandeur?.nom || '').toLowerCase().includes(localSearch.toLowerCase());

      const matchesPriority =
        localPriority === 'ALL' ||
        String(item.priorite || '').toUpperCase() === localPriority ||
        (localPriority === 'HIGH' && String(item.priorite || '').toUpperCase() === 'URGENT') ||
        (localPriority === 'MEDIUM' && String(item.priorite || '').toUpperCase() === 'MOYENNE') ||
        (localPriority === 'LOW' && String(item.priorite || '').toUpperCase() === 'NORMALE');
      return matchesSearch && matchesPriority;
    });
  }, [combinedList, localSearch, localPriority]);

  // Sorting combined table items
  const sortedList = useMemo(() => {
    const sorted = [...filteredList];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'equipement') {
        valA = a.equipement?.nom || '';
        valB = b.equipement?.nom || '';
      } else if (sortField === 'demandeur') {
        valA = a.demandeur?.nom || '';
        valB = b.demandeur?.nom || '';
      } else if (sortField === 'date') {
        valA = new Date(a.dateCreation || 0);
        valB = new Date(b.dateCreation || 0);
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredList, sortField, sortDirection]);

  // Pagination slice
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedList.slice(startIndex, startIndex + pageSize);
  }, [sortedList, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedList.length / pageSize) || 1;

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setCurrentPage(1);
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

  return (
    <div className="t1d-fade-in">

      {/* 1. BANNIÈRE INTERVENTION ACTIVE */}
      {activeInterventions.length > 0 && (
        <div className="t1d-active-banner-v2" style={{ animation: 't1d-slideUp 0.35s ease both' }}>
          <div className="t1d-active-banner-info">
            <span className="t1d-banner-pulse" />
            <div className="t1d-active-banner-text">
              <p className="t1d-active-banner-label">
                <Zap size={10} style={{ fill: '#34d399', color: '#34d399' }} />
                Intervention Active à Distance
              </p>
              <p className="t1d-active-banner-title">
                {activeInterventions[0]?.ticket?.titre || `Ticket #${activeInterventions[0]?.ticket?.id}`}
              </p>
            </div>
          </div>
          <div className="t1d-active-banner-actions">
            <button
              className="t1d-banner-btn-v2 close"
              onClick={() => handleOpenCustomReport(activeInterventions[0])}
            >
              <CheckCircle size={15} />
              Terminer l'intervention
            </button>
          </div>
        </div>
      )}

      {/* 3. 6 STAT CARDS PREMIUM */}
      <div className="t1d-stats-grid-6">
        <div className="t1d-stat-card-v2 v2-blue" onClick={() => { setLocalPriority('ALL'); setLocalSearch(''); }}>
          <div className="t1d-stat-info">
            <p className="t1d-stat-label-v2">Tickets disponibles</p>
            <p className="t1d-stat-value-v2">{stats.available}</p>
            <p className="t1d-stat-trend-v2"> File d'attente</p>
          </div>

        </div>

        <div className="t1d-stat-card-v2 v2-green" onClick={() => { if (activeInterventions.length > 0) handleOpenCustomReport(activeInterventions[0]); }}>
          <div className="t1d-stat-info">
            <p className="t1d-stat-label-v2">En Cours N1</p>
            <p className="t1d-stat-value-v2">{stats.active}</p>
            <p className="t1d-stat-trend-v2">Prise en charge</p>
          </div>

        </div>

        <div className="t1d-stat-card-v2 v2-slate">
          <div className="t1d-stat-info">
            <p className="t1d-stat-label-v2">Tickets Clôturés</p>
            <p className="t1d-stat-value-v2">{stats.closed}</p>
            <p className="t1d-stat-trend-v2"> Validés terminés</p>
          </div>

        </div>

        <div className="t1d-stat-card-v2 v2-amber">
          <div className="t1d-stat-info">
            <p className="t1d-stat-label-v2">Escaladés N2</p>
            <p className="t1d-stat-value-v2">{stats.escalated}</p>
            <p className="t1d-stat-trend-v2"> Support N2 requis</p>
          </div>

        </div>

        <div className="t1d-stat-card-v2 v2-violet" style={{ '--card-accent-color': '#7c3aed' }}>
          <div className="t1d-stat-info">
            <p className="t1d-stat-label-v2">Temps Résolution</p>
            <p className="t1d-stat-value-v2">{avgResolutionTime}</p>
            <p className="t1d-stat-trend-v2">Durée moyenne</p>
          </div>

        </div>

        <div className="t1d-stat-card-v2 v2-emerald" style={{ '--card-accent-color': '#059669' }}>
          <div className="t1d-stat-info">
            <p className="t1d-stat-label-v2">Taux Résolution</p>
            <p className="t1d-stat-value-v2">{resolutionRate}%</p>
            <p className="t1d-stat-trend-v2"> Efficacité N1</p>
          </div>
          <div className="t1d-stat-icon-v2" style={{ background: '#ecfdf5', color: '#059669' }}></div>
        </div>
      </div>

      {/* 4. ACTIONS RAPIDES */}
      <div className="t1d-quick-actions">
        <button
          className="t1d-quick-action-btn-modern"
          disabled={availableTickets.length === 0}
          onClick={() => {
            if (availableTickets.length > 0) {
              handleStartIntervention(availableTickets[0].id);
            }
          }}
          title="Prendre en charge immédiatement le premier ticket en attente"
        >

          <span>Prendre intervention</span>
        </button>

        <button
          className="t1d-quick-action-btn-modern"
          disabled={activeInterventions.length === 0}
          onClick={() => {
            if (activeInterventions.length > 0) {
              handleOpenCustomReport(activeInterventions[0]);
            }
          }}
          title="Clôturer l'intervention active"
        >

          <span>Terminer</span>
        </button>

        <button
          className="t1d-quick-action-btn-modern"
          disabled={activeInterventions.length === 0}
          onClick={() => {
            if (activeInterventions.length > 0) {
              handleOpenCustomReport(activeInterventions[0], 'escalate');
            }
          }}
          title="Escalader immédiatement l'intervention en cours vers le support N2"
        >

          <span>Escalader N2</span>
        </button>

        <button
          className="t1d-quick-action-btn-modern"
          onClick={() => {
            setActiveTab('interventions');
          }}
          title="Afficher la liste détaillée de toutes les interventions"
        >

          <span>Voir détails</span>
        </button>
      </div>

      {/* 5. 4 GRAPHIQUES PROFESSIONNELS (GRILLE 2x2) */}
      {!recharts ? (
        <div className="t1d-charts-grid-2x2">
          <div className="t1d-skeleton t1d-skeleton-chart" />
          <div className="t1d-skeleton t1d-skeleton-chart" />
          <div className="t1d-skeleton t1d-skeleton-chart" />
          <div className="t1d-skeleton t1d-skeleton-chart" />
        </div>
      ) : (() => {
        // Destructure aliased Recharts components from state
        const {
          RResponsiveContainer, RBarChart, RBar, RCell,
          RPieChart, RPie, RAreaChart, RArea,
          RRadialBarChart, RRadialBar,
          RCartesianGrid, RXAxis, RYAxis, RTooltip, RLegend
        } = recharts;
        return (
          <div className="t1d-charts-grid-2x2">
            {/* G1 - Volume par statut */}
            <div className="t1d-glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={16} color="#047857" />
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Volume Global par Statut</h4>
                </div>

              </div>
              <div style={{ height: 220 }}>
                <RResponsiveContainer width="100%" height="100%">
                  <RBarChart data={volumeChartData} barSize={28}>
                    <RCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <RXAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <RYAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip
                      contentStyle={{ background: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                      cursor={{ fill: 'rgba(241,245,249,0.4)' }}
                    />
                    <RBar dataKey="tickets" radius={[4, 4, 0, 0]}>
                      {volumeChartData.map((entry, index) => (
                        <RCell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RBar>
                  </RBarChart>
                </RResponsiveContainer>
              </div>
            </div>

            {/* G2 - Répartition criticité */}
            <div className="t1d-glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} color="#047857" />
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Répartition par Criticité</h4>
                </div>

              </div>
              {stats.available + stats.active === 0 ? (
                <div className="t1d-empty" style={{ height: 220, padding: 0 }}>
                  <SlidersHorizontal size={30} className="t1d-empty-icon" />
                  <p className="t1d-empty-text" style={{ fontSize: '0.8rem' }}>Aucune intervention active.</p>
                </div>
              ) : (
                <div style={{ height: 220, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                  <RResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <RPie data={priorityChartData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="tickets">
                        {priorityChartData.map((entry, index) => (
                          <RCell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </RPie>
                      <RTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    </RPieChart>
                  </RResponsiveContainer>
                  <div className="t1d-chart-legend">
                    {priorityChartData.map((item, index) => (
                      <div key={item.name} className="t1d-chart-legend-item">
                        <span className="t1d-chart-legend-dot" style={{ backgroundColor: PIE_COLORS[index] }} />
                        {item.name} ({item.tickets})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* G3 - Évolution hebdomadaire */}
            <div className="t1d-glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} color="#047857" />
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Évolution Hebdomadaire</h4>
                </div>
                <span className="t1d-chip-v2">Productivité</span>
              </div>
              <div style={{ height: 220 }}>
                <RResponsiveContainer width="100%" height="100%">
                  <RAreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEscalated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <RCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <RXAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <RYAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                    <RLegend verticalAlign="top" height={36} iconType="circle" fontSize={11} wrapperStyle={{ fontSize: '11px' }} />
                    <RArea type="monotone" dataKey="Résolus" stroke="#047857" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
                    <RArea type="monotone" dataKey="Escaladés N2" stroke="#d97706" fillOpacity={1} fill="url(#colorEscalated)" strokeWidth={2} />
                  </RAreaChart>
                </RResponsiveContainer>
              </div>
            </div>

            {/* G4 - Activité technicien */}
            <div className="t1d-glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={16} color="#047857" />
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Activité du Technicien</h4>
                </div>
                <span className="t1d-chip-v2">Répartition N1</span>
              </div>
              <div style={{ height: 220 }}>
                <RResponsiveContainer width="100%" height="100%">
                  <RRadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%" barSize={10} data={radialData}>
                    <RRadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="count"
                      radius={[4, 4, 4, 4]}
                    />
                    <RTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <RLegend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </RRadialBarChart>
                </RResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. TABLEAU INTERVENTIONS MODERNE */}
      <div className="t1d-glass-card" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>Tableau de Support & Incidents</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Consulter, démarrer ou clôturer les tickets N1 affectés</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="t1d-search-box" style={{ margin: 0, padding: '0.45rem 0.85rem' }}>
              <Search size={14} />
              <input
                type="text"
                placeholder="Rechercher incident..."
                value={localSearch}
                onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1); }}
                style={{ fontSize: '0.825rem' }}
              />
            </div>
            <select
              className="t1d-filter-select"
              value={localPriority}
              onChange={e => { setLocalPriority(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
            >
              <option value="ALL">Priorité: Toutes</option>
              <option value="HIGH">Priorité: Urgent</option>
              <option value="MEDIUM">Priorité: Moyenne</option>
              <option value="LOW">Priorité: Normale</option>
            </select>
          </div>
        </div>

        <div className="t1d-table-responsive">
          <table className="t1d-interventions-table" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <thead>
              <tr>
                <th className="t1d-sort-header" onClick={() => handleRequestSort('id')}>
                  ID {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="t1d-sort-header" onClick={() => handleRequestSort('titre')}>
                  Incident {sortField === 'titre' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="t1d-sort-header" onClick={() => handleRequestSort('priorite')}>
                  Priorité {sortField === 'priorite' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="t1d-sort-header" onClick={() => handleRequestSort('statut')}>
                  Statut {sortField === 'statut' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="t1d-sort-header" onClick={() => handleRequestSort('demandeur')}>
                  Demandeur {sortField === 'demandeur' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="t1d-empty">

                      <p className="t1d-empty-title">Aucun ticket trouvé</p>
                      <p className="t1d-empty-text">Aucun incident ne correspond aux filtres ou à la recherche.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map(item => {
                  const priority = priorityConfig[String(item.priorite).toUpperCase()] || priorityConfig.LOW;
                  return (
                    <tr key={item.id} style={{ transition: 'background-color 0.2s' }}>
                      <td className="t1d-ref" style={{ fontWeight: 700 }}>#{item.id}</td>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{item.titre}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                          {item.description}
                        </p>
                        {item.equipement?.nom && (
                          <span className="t1d-eq-tag">EQ: {item.equipement.nom}</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="t1d-badge"
                          style={{ color: priority.color, background: priority.bg, fontWeight: 700 }}
                        >
                          {priority.label}
                        </span>
                      </td>
                      <td>{getStatusBadge(item.statut)}</td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 500, color: '#475569' }}>
                        {item.demandeur?.nom || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          {!item.isAssigned ? (
                            <button
                              className="t1d-btn t1d-btn-primary t1d-btn-sm"
                              onClick={() => handleStartIntervention(item.id)}
                            >
                              Démarrer
                            </button>
                          ) : (
                            <button
                              className="t1d-btn t1d-btn-primary t1d-btn-sm"
                              onClick={() => handleOpenCustomReport(item.intervention)}
                            >
                              Terminer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="t1d-pagination">
          <div className="t1d-pagination-info">
            Affichage de {sortedList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, sortedList.length)} sur {sortedList.length} incident(s)
          </div>
          <div className="t1d-pagination-controls">
            <select
              className="t1d-page-size-select"
              value={pageSize}
              onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
            >
              <option value={5}>5 lignes</option>
              <option value={10}>10 lignes</option>
              <option value={20}>20 lignes</option>
            </select>

            <button
              className="t1d-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Précédent
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`t1d-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="t1d-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
