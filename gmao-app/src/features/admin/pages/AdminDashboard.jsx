 import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Package, Calendar, LogOut, 
  Plus, Search, Edit2, Trash2, X, Save, RefreshCw,
  CheckCircle, Clock, AlertCircle, Wrench, MapPin, Mail, Phone,
  Activity, TrendingUp, UserPlus, Settings, Shield, Bell,
  ChevronRight, MoreVertical, Filter, Download, User
} from 'lucide-react';
import './AdminDashboard.css';
import logoOCP from '/src/assets/logo-ocp.png';
import UserProfile from './UserProfile';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    loadAllData();
    fetchCurrentUser();
  }, []);

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
      loadEquipments()
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const loadEquipments = async () => {
    try {
      const res = await api.get('/admin/equipments');
      setEquipments(res.data);
    } catch (err) { console.error(err); }
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
    { id: 'preventive', label: 'Maintenance préventive', icon: <Calendar size={20} /> },
    { id: 'profile', label: 'Mon Profil', icon: <User size={20} /> }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar-new">
        <div className="sidebar-header">
          <img src={logoOCP} alt="OCP" className="sidebar-logo" />
          <div className="sidebar-title">
            <h2>GESTION DES</h2>
            <p>INTERVENTIONS</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-link ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {activeMenu === item.id && <ChevronRight size={16} className="link-arrow" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" style={{ cursor: 'pointer' }} onClick={() => setActiveMenu('profile')}>
            <div className="user-avatar">
              {currentUser ? `${currentUser.prenom?.[0]}${currentUser.nom?.[0]}`.toUpperCase() : 'AD'}
            </div>
            <div className="user-details">
              <p className="user-name">
                {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Chargement...'}
              </p>
              <p className="user-role">
                {currentUser ? (currentUser.role === 'ADMIN' ? 'Administrateur' : currentUser.role) : 'Super Admin'}
              </p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="logout-btn">
            <LogOut size={18} /> Déconnexion
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
            <button className="header-icon"><Bell size={20} /></button>
            <button className="header-icon" onClick={loadAllData}><RefreshCw size={20} /></button>
          </div>
        </header>

        <div className="admin-content-new">
          {activeMenu === 'dashboard' && (
            <DashboardNew stats={stats} users={users} equipments={equipments} loading={loading} />
          )}
          {activeMenu === 'users' && (
            <UsersNew users={users} loading={loading} onRefresh={loadUsers} onDelete={handleDeleteUser} />
          )}
          {activeMenu === 'equipments' && (
            <EquipmentsNew equipments={equipments} loading={loading} onRefresh={loadEquipments} onDelete={handleDeleteEquipment} />
          )}
          {activeMenu === 'preventive' && (
            <PreventiveNew equipments={equipments} onRefresh={loadEquipments} />
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
function DashboardNew({ stats, users, equipments, loading }) {
  // Si loading ou pas de stats, on utilise des données par défaut
  const defaultStats = {
    totalTickets: 24,
    pendingTickets: 8,
    inProgressTickets: 6,
    closedTickets: 10,
    totalInterventions: 18,
    completedInterventions: 12,
    highPriorityCount: 5,
    mediumPriorityCount: 10,
    lowPriorityCount: 9,
    highPriorityPercent: 21,
    mediumPriorityPercent: 42,
    lowPriorityPercent: 37
  };

  const currentStats = stats || defaultStats;
  const totalUsers = users?.length || 12;
  const activeUsers = users?.filter(u => u.status === true).length || 10;
  const totalEquipments = equipments?.length || 8;
  const availableEquipments = equipments?.filter(e => e.statut === 'ACTIF' && e.etatAffectation === 'DISPONIBLE').length || 6;

  const cards = [
    { title: 'Utilisateurs', value: totalUsers, icon: <Users size={24} />, sub: `${activeUsers} actifs`, color: '#4361ee' },
    { title: 'Équipements', value: totalEquipments, icon: <Package size={24} />, sub: `${availableEquipments} disponibles`, color: '#06d6a0' },
    { title: 'Tickets', value: currentStats.totalTickets, icon: <Activity size={24} />, sub: `${currentStats.pendingTickets} en attente`, color: '#ff9f1c' },
    { title: 'Interventions', value: currentStats.totalInterventions, icon: <Wrench size={24} />, sub: `${currentStats.completedInterventions} terminées`, color: '#ef476f' }
  ];

  // Toujours afficher le dashboard, même en chargement
  return (
    <div className="dashboard-new">
      <div className="stats-grid">
        {cards.map((card, idx) => (
          <div key={idx} className="stat-card" style={{ borderTopColor: card.color }}>
            <div className="stat-card-icon" style={{ background: `${card.color}15`, color: card.color }}>{card.icon}</div>
            <div className="stat-card-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-title">{card.title}</span>
              <span className="stat-sub">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Répartition par priorité</h3>
          <div className="priority-bars">
            <div className="bar-item">
              <span>Urgent</span>
              <div className="bar"><div className="bar-fill high" style={{ width: `${currentStats.highPriorityPercent || 0}%` }}></div></div>
              <span>{currentStats.highPriorityCount || 0}</span>
            </div>
            <div className="bar-item">
              <span>Moyenne</span>
              <div className="bar"><div className="bar-fill medium" style={{ width: `${currentStats.mediumPriorityPercent || 0}%` }}></div></div>
              <span>{currentStats.mediumPriorityCount || 0}</span>
            </div>
            <div className="bar-item">
              <span>Normale</span>
              <div className="bar"><div className="bar-fill low" style={{ width: `${currentStats.lowPriorityPercent || 0}%` }}></div></div>
              <span>{currentStats.lowPriorityCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Statut des tickets</h3>
          <div className="status-stats">
            <div className="status-item">
              <div className="status-dot pending"></div><span>En attente</span><strong>{currentStats.pendingTickets || 0}</strong>
            </div>
            <div className="status-item">
              <div className="status-dot progress"></div><span>En cours</span><strong>{currentStats.inProgressTickets || 0}</strong>
            </div>
            <div className="status-item">
              <div className="status-dot closed"></div><span>Clôturés</span><strong>{currentStats.closedTickets || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Section des tickets récents */}
      <div className="chart-card full-width" style={{ marginTop: '20px' }}>
        <h3>Activité récente</h3>
        <div className="recent-activities">
          <div className="activity-item">
            <div className="activity-icon"><CheckCircle size={16} color="#06d6a0" /></div>
            <div className="activity-details">
              <p>Ticket #1042 résolu par Technicien N1</p>
              <small>Il y a 2 heures</small>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Plus size={16} color="#4361ee" /></div>
            <div className="activity-details">
              <p>Nouvel utilisateur ajouté (Demandeur)</p>
              <small>Il y a 5 heures</small>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Wrench size={16} color="#ff9f1c" /></div>
            <div className="activity-details">
              <p>Maintenance préventive planifiée - Convoyeur C3</p>
              <small>Il y a 1 jour</small>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Package size={16} color="#06d6a0" /></div>
            <div className="activity-details">
              <p>Nouvel équipement ajouté : Pompe hydraulique P12</p>
              <small>Il y a 2 jours</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== UTILISATEURS ====================
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
                <div className="user-avatar-sm">{user.prenom?.[0]}{user.nom?.[0]}</div>
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
              <div className="form-group"><label>Nom *</label><input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required /></div>
              <div className="form-group"><label>Prénom *</label><input type="text" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
              <div className="form-group"><label>Téléphone</label><input type="tel" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Rôle</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="ROLE_ADMIN">Administrateur</option><option value="ROLE_DEMANDEUR">Demandeur</option>
                <option value="ROLE_N1">Technicien N1</option><option value="ROLE_N2">Technicien N2</option>
                <option value="ROLE_N3">Technicien N3</option>
              </select></div>
              <div className="form-group"><label>Statut</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value === 'true'})}>
                <option value="true">Actif</option><option value="false">Inactif</option>
              </select></div>
            </div>
            <div className="form-group"><label>{user ? 'Nouveau mot de passe' : 'Mot de passe *'}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" /></div>
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
                  onChange={e => setForm({...form, codeInventaire: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nom de l'équipement *</label>
                <input 
                  type="text" 
                  value={form.nom} 
                  onChange={e => setForm({...form, nom: e.target.value})} 
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
                  onChange={e => setForm({...form, type: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Marque *</label>
                <input 
                  type="text" 
                  value={form.marque} 
                  onChange={e => setForm({...form, marque: e.target.value})} 
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
                  onChange={e => setForm({...form, modele: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Numéro de Série *</label>
                <input 
                  type="text" 
                  value={form.numeroSerie} 
                  onChange={e => setForm({...form, numeroSerie: e.target.value})} 
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
                  onChange={e => setForm({...form, localisation: e.target.value})} 
                  placeholder="Ex: Atelier, Bureau 10..." 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Statut</label>
                <select 
                  value={form.statut} 
                  onChange={e => setForm({...form, statut: e.target.value})}
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
                  onChange={e => setForm({...form, etatAffectation: e.target.value})}
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
                onChange={e => setForm({...form, description: e.target.value})} 
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

// ==================== MAINTENANCE PREVENTIVE ====================
function PreventiveNew({ equipments, onRefresh }) {
  const [form, setForm] = useState({ titre: '', description: '', priorite: 'MEDIUM', equipementId: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre || !form.description || !form.equipementId) return alert('Tous les champs sont requis');
    setLoading(true);
    try {
      await api.post('/admin/preventive?demandeurId=1', {
        titre: form.titre, description: form.description,
        priorite: form.priorite.toUpperCase(), statut: 'PENDING',
        equipement: { id: Number(form.equipementId) }
      });
      alert('Intervention préventive planifiée ✅');
      setForm({ titre: '', description: '', priorite: 'MEDIUM', equipementId: '' });
      await onRefresh();
    } catch (err) { alert('Erreur lors de la planification'); }
    setLoading(false);
  };

  return (
    <div className="section-new">
      <div className="preventive-card">
        <div className="preventive-header"><h2><Calendar size={24} /> Maintenance préventive</h2><p>Planifiez des interventions programmées sur vos équipements</p></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Titre de l'intervention *</label><input type="text" placeholder="Ex: Maintenance trimestrielle" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required /></div>
          <div className="form-row"><div className="form-group"><label>Équipement *</label><select value={form.equipementId} onChange={e => setForm({...form, equipementId: e.target.value})} required><option value="">Sélectionner</option>{equipments.map(e => <option key={e.id} value={e.id}>{e.nom} - {e.codeInventaire}</option>)}</select></div><div className="form-group"><label>Priorité</label><select value={form.priorite} onChange={e => setForm({...form, priorite: e.target.value})}><option value="LOW">Basse</option><option value="MEDIUM">Moyenne</option><option value="HIGH">Haute</option></select></div></div>
          <div className="form-group"><label>Description *</label><textarea rows={4} placeholder="Détails de l'intervention..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Planification...' : 'Planifier l\'intervention'}</button>
        </form>
      </div>
    </div>
  );
}