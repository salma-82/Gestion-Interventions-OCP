import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Plus, User, LogOut, Filter, 
  CheckCircle, Clock, PlayCircle, Star, Send, ChevronRight, Bell, HelpCircle, Camera
} from 'lucide-react';
import './DemandeurDashboard.css';

// Configuration des URLs de votre API Spring Boot
const API_TICKETS_URL = 'http://localhost:8080/api/demandeur/tickets';
const API_EQUIPEMENTS_URL = 'http://localhost:8080/api/admin/equipments';
const DEMANDEUR_ID = 2; // ID de démonstration pour le demandeur connecté

export default function DemandeurDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [equipements, setEquipements] = useState([]); // État pour stocker les équipements de la base de données
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Chargement initial des données au montage du composant
  useEffect(() => {
    fetchInitialData();
  }, []);

  const normalizeTicket = (ticket) => ({
    id: ticket.id,
    title: ticket.titre || ticket.title,
    description: ticket.description,
    priority: ticket.priorite || ticket.priority,
    status: ticket.statut || ticket.status,
    date: ticket.dateCreation || ticket.date_creation || ticket.date,
    evaluated: ticket.evaluated || false,
    equipement: ticket.equipement || null,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  // Récupération simultanée des tickets et des équipements disponibles
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [ticketsResponse, equipementsResponse] = await Promise.all([
        fetch(`${API_TICKETS_URL}?demandeurId=${DEMANDEUR_ID}`, { headers: getAuthHeaders() }),
        fetch(API_EQUIPEMENTS_URL, { headers: getAuthHeaders() })
      ]);

      if (!ticketsResponse.ok || !equipementsResponse.ok) {
        throw new Error('Erreur lors du chargement des données depuis le serveur');
      }

      const ticketsData = await ticketsResponse.json();
      const equipementsData = await equipementsResponse.json();

      setTickets(Array.isArray(ticketsData) ? ticketsData.map(normalizeTicket) : []);
      setEquipements(Array.isArray(equipementsData) ? equipementsData : []);
      setError(null);
    } catch (err) {
      console.error("Erreur d'API:", err);
      setError("Impossible de charger les données depuis la base de données.");
    } finally {
      setLoading(false);
    }
  };

  // Enregistrement d'un nouveau ticket (POST)
  const handleAddTicket = async (newTicket) => {
    try {
      // Configuration du DTO d'envoi mappé rigoureusement sur votre table MySQL
      const ticketDto = {
        titre: newTicket.title,
        description: newTicket.description,
        priorite: newTicket.priority, // Envoie 'HIGH', 'MEDIUM' ou 'LOW'
        statut: 'EN_ATTENTE',          // Valeur Enum requise par votre backend Java
        equipement: { 
          id: parseInt(newTicket.equipementId, 10) // Conversion indispensable en entier pour JPA
        }
      };

      const response = await fetch(`${API_TICKETS_URL}?demandeurId=${DEMANDEUR_ID}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketDto),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement du ticket");
      }

      const savedTicket = await response.json();
      const normalized = normalizeTicket(savedTicket);
      
      setTickets([normalized, ...tickets]);
      setActiveTab('dashboard');
      alert("Demande d'intervention enregistrée avec succès dans la base de données ! ✅");
    } catch (err) {
      console.error("Erreur d'enregistrement:", err);
      alert("Erreur: Impossible d'enregistrer l'incident. Vérifiez que l'équipement est valide.");
    }
  };

  return (
    <div className="ddm-wrapper">
      {/* Barre latérale de navigation */}
      <aside className="ddm-sidebar">
        <div className="ddm-sidebar-header">
          <div>
            <h1 className="ddm-sidebar-title">GESTION DES INTERVENTIONS</h1>
            <p className="ddm-sidebar-subtitle">Espace Demandeur</p>
          </div>
        </div>
        
        <nav className="ddm-sidebar-nav">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<Activity size={20} />} 
            label="Tableau de bord" 
          />
          <NavItem 
            active={activeTab === 'new-ticket'} 
            onClick={() => setActiveTab('new-ticket')} 
            icon={<Plus size={20} />} 
            label="Nouvelle Demande" 
          />
          <NavItem 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<User size={20} />} 
            label="Mon Profil" 
          />
        </nav>
        
        <div className="ddm-sidebar-footer">
          <div className="ddm-user-badge">
            <div className="ddm-user-avatar">AA</div>
            <div className="ddm-user-info">
              <p className="ddm-user-name">Anas Alami</p>
              <p className="ddm-user-dept">Demandeur</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="ddm-logout-btn"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Zone principale de contenu */}
      <main className="ddm-main">
        <header className="ddm-header">
          <div>
            <h2>
              {activeTab === 'dashboard' && 'Suivi des Interventions'}
              {activeTab === 'new-ticket' && 'Création d\'un Ticket'}
              {activeTab === 'profile' && 'Paramètres du Profil'}
            </h2>
            <p>Site de Khouribga - Service Informatique</p>
          </div>
          <div className="ddm-header-actions">
            <button className="ddm-icon-btn">
              <Bell size={20} />
              <span className="ddm-notification-dot"></span>
            </button>
            <button className="ddm-icon-btn">
              <HelpCircle size={20} />
            </button>
          </div>
        </header>

        <div className="ddm-content">
          <div className="ddm-container">
            {error && <div className="ddm-error-banner">{error}</div>}
            
            {activeTab === 'dashboard' && (
              <DashboardView 
                tickets={tickets} 
                loading={loading} 
                onNewTicket={() => setActiveTab('new-ticket')} 
              />
            )}
            {activeTab === 'new-ticket' && (
              <NewTicketForm 
                equipements={equipements}
                onCancel={() => setActiveTab('dashboard')} 
                onSubmit={handleAddTicket} 
              />
            )}
            {activeTab === 'profile' && <UserProfile />}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function NavItem({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`ddm-nav-item ${active ? 'active' : ''}`}>
      {icon}
      {label}
    </button>
  );
}

function DashboardView({ tickets, loading, onNewTicket }) {
  const [selectedTicketToEval, setSelectedTicketToEval] = useState(null);

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'EN_ATTENTE' || t.status === 'PENDING').length,
    inProgress: tickets.filter(t => t.status?.startsWith('EN_COURS') || t.status?.startsWith('IN_PROGRESS') || t.status?.startsWith('ESCALADE')).length,
    resolved: tickets.filter(t => t.status === 'CLOTURE' || t.status === 'CLOSED').length
  };

  return (
    <div>
      <div className="ddm-stats-grid">
        <StatCard title="Total Demandes" value={stats.total} icon={<Activity />} type="default" />
        <StatCard title="En attente" value={stats.pending} icon={<Clock />} type="warning" />
        <StatCard title="En cours" value={stats.inProgress} icon={<PlayCircle />} type="primary" />
        <StatCard title="Clôturés" value={stats.resolved} icon={<CheckCircle />} type="success" />
      </div>

      <div className="ddm-card">
        <div className="ddm-card-header">
          <div>
            <h3 className="ddm-card-title">Mes Demandes Récentes</h3>
            <p className="ddm-card-subtitle">Consultez l'état d'avancement de vos interventions</p>
          </div>
          <div className="ddm-card-actions">
            <button className="ddm-btn ddm-btn-secondary"><Filter size={16} /> Filtrer</button>
            <button onClick={onNewTicket} className="ddm-btn ddm-btn-primary"><Plus size={18} /> Nouvelle Demande</button>
          </div>
        </div>
        
        <div className="ddm-table-responsive">
          {loading ? (
            <div className="ddm-loading-spinner">Chargement des données...</div>
          ) : tickets.length === 0 ? (
            <div className="ddm-empty-state">Aucun ticket trouvé dans la base de données.</div>
          ) : (
            <table className="ddm-table">
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Détails de l'incident</th>
                  <th>Criticité</th>
                  <th>État d'avancement</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td className="ddm-text-primary">#{ticket.id}</td>
                    <td>
                      <p className="ddm-text-dark">{ticket.title}</p>
                      <p className="ddm-text-muted">
                        Soumis le {ticket.date ? new Date(ticket.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </p>
                    </td>
                    <td><PriorityBadge priority={ticket.priority} /></td>
                    <td><StatusStepper status={ticket.status} /></td>
                    <td style={{ textAlign: 'center' }}>
                      {(ticket.status === 'CLOSED' || ticket.status === 'CLOTURE') && !ticket.evaluated ? (
                        <button onClick={() => setSelectedTicketToEval(ticket)} className="ddm-eval-btn">
                          <Star size={14} className="ddm-star-active" /> Évaluer
                        </button>
                      ) : (
                        <button className="ddm-arrow-btn"><ChevronRight size={20} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedTicketToEval && (
        <EvaluationModal 
          ticket={selectedTicketToEval} 
          onClose={() => setSelectedTicketToEval(null)} 
          onSubmit={(data) => {
            console.log("Evaluation soumise:", data);
            setSelectedTicketToEval(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, type }) {
  return (
    <div className={`ddm-stat-card ${type}`}>
      <div className="ddm-stat-info"><p>{title}</p><p>{value}</p></div>
      <div className="ddm-stat-icon">{icon}</div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const labels = { HIGH: 'Urgent', MEDIUM: 'Moyenne', LOW: 'Normale' };
  return <span className={`ddm-badge ddm-badge-${priority?.toLowerCase()}`}>{labels[priority] || priority}</span>;
}

function StatusStepper({ status }) {
  const steps = [
    { id: 'PENDING', label: 'Créé' },
    { id: 'IN_PROGRESS', label: 'En traitement' },
    { id: 'CLOSED', label: 'Résolu' }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'CLOSED' || status === 'CLOTURE') return 2;
    if (status && (status.startsWith('IN_PROGRESS') || status.startsWith('EN_COURS') || status.startsWith('ESCALADE'))) return 1;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="ddm-stepper">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <React.Fragment key={step.id}>
            <div className={`ddm-step-wrapper ${isActive ? 'active' : ''}`}>
              <div className={`ddm-step-circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                {isCompleted ? <CheckCircle size={14} /> : (isActive ? <div className="ddm-step-inner"></div> : null)}
              </div>
              <span className="ddm-step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className={`ddm-step-line ${isCompleted ? 'completed' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ==================== COMPOSANT FORMULAIRE (CORRIGÉ & DYNAMIQUE) ====================
function NewTicketForm({ equipements, onCancel, onSubmit }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [equipementId, setEquipementId] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !equipementId) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    onSubmit({ title, priority, equipementId, description });
  };

  return (
    <div className="ddm-card">
      <div className="ddm-card-header" style={{ backgroundColor: '#f8f9fa' }}>
        <div>
          <h2 className="ddm-card-title">Déclarer un Incident</h2>
          <p className="ddm-card-subtitle">Remplissez ce formulaire de manière précise pour faciliter l'intervention de nos techniciens.</p>
        </div>
      </div>

      <form className="ddm-form-container" onSubmit={handleSubmit}>
        <div className="ddm-form-grid no-bg">
          
          <div className="ddm-form-group ddm-grid-full">
            <label className="ddm-form-label">Titre de l'incident <span>*</span></label>
            <input 
              type="text" 
              placeholder="Ex: Panne du moteur convoyeur principal C3" 
              className="ddm-form-control" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>

          <div className="ddm-form-group ddm-grid-full">
            <label className="ddm-form-label">Équipement concerné <span>*</span></label>
            <div className="ddm-form-select-wrapper">
              <select 
                className="ddm-form-control" 
                value={equipementId} 
                onChange={(e) => setEquipementId(e.target.value)}
                required
              >
                <option value="">-- Sélectionnez l'équipement en panne --</option>
                {equipements.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nom} (Réf: {eq.reference}) - {eq.localisation || 'Zone OCP'}
                  </option>
                ))}
              </select>
              <div className="ddm-form-select-icon"><ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} /></div>
            </div>
          </div>

          <div className="ddm-form-group ddm-grid-full">
            <label className="ddm-form-label">Niveau de criticité <span>*</span></label>
            <div className="ddm-form-select-wrapper">
              <select className="ddm-form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Normale (Pas d'impact majeur)</option>
                <option value="MEDIUM">Moyenne (Ralentissement)</option>
                <option value="HIGH">Critique (Urgent)</option>
              </select>
              <div className="ddm-form-select-icon"><ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} /></div>
            </div>
          </div>

          <div className="ddm-form-group ddm-grid-full">
            <label className="ddm-form-label">Description détaillée <span>*</span></label>
            <textarea 
              rows={6} 
              placeholder="Décrivez les symptômes, bruits anormaux, codes d'erreur affichés sur l'écran de contrôle..." 
              className="ddm-form-control" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
            />
          </div>

        </div>

        <div className="ddm-form-actions-bottom">
          <button type="button" onClick={onCancel} className="ddm-btn ddm-btn-secondary">Annuler</button>
          <button type="submit" className="ddm-btn ddm-btn-primary"><Send size={18} /> Soumettre au Support</button>
        </div>
      </form>
    </div>
  );
}

function EvaluationModal({ ticket, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div className="ddm-modal-overlay">
      <div className="ddm-modal">
        <div className="ddm-modal-header">
          <button onClick={onClose} className="ddm-modal-close"><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
          <div className="ddm-modal-icon-bg"><Star size={40} className="ddm-star-active" fill="currentColor" /></div>
          <h3 className="ddm-modal-title">Qualité de Service</h3>
          <p className="ddm-modal-subtitle">Intervention {ticket.id}</p>
        </div>
        <div className="ddm-modal-body">
          <p className="ddm-modal-text">Votre demande concernant <strong>"{ticket.title}"</strong> a été résolue. Aidez-nous à améliorer nos services en évaluant l'intervention.</p>
          <div className="ddm-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" className="ddm-star-btn" onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(rating)}>
                <Star size={42} className={star <= (hover || rating) ? "ddm-star-active" : "ddm-star-inactive"} fill={star <= (hover || rating) ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <div className="ddm-form-group">
            <label className="ddm-form-label">Vos remarques (Optionnel)</label>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ponctualité, professionnalisme, propreté du chantier..." className="ddm-form-control" />
          </div>
          <div className="ddm-modal-actions">
            <button onClick={onClose} className="ddm-btn ddm-btn-secondary">Passer</button>
            <button onClick={() => onSubmit({ rating, comment })} disabled={rating === 0} className="ddm-btn ddm-btn-primary" style={{ opacity: rating === 0 ? 0.5 : 1 }}>Envoyer l'évaluation</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserProfile() {
  const [profileImage, setProfileImage] = useState(null);
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setProfileImage(URL.createObjectURL(file)); }
  };

  return (
    <div className="ddm-profile-layout">
      <div className="ddm-profile-summary-card">
        <div className="ddm-profile-summary-header"><div className="ddm-profile-pattern"></div></div>
        <div className="ddm-profile-summary-body">
          <div className="ddm-profile-avatar-wrapper">
            <div className="ddm-profile-avatar-large">{profileImage ? <img src={profileImage} alt="Profile" /> : "AA"}</div>
            <label className="ddm-avatar-edit-btn" htmlFor="avatar-upload"><Camera size={16} /></label>
            <input id="avatar-upload" type="file" accept="image/*" className="ddm-avatar-input" onChange={handleImageChange} />
          </div>
          <h3 className="ddm-profile-summary-name">Anas Alami</h3>
          <p className="ddm-profile-summary-role">Demandeur</p>
          <span className="ddm-profile-summary-badge">Compte Validé</span>
          <div className="ddm-profile-summary-info">
            <div className="ddm-profile-summary-info-item"><span className="ddm-profile-summary-info-label">Rôle</span><span className="ddm-profile-summary-info-value">ROLE_DEMANDEUR</span></div>
            <div className="ddm-profile-summary-info-item"><span className="ddm-profile-summary-info-label">Statut</span><span className="ddm-profile-summary-info-value">Actif</span></div>
          </div>
        </div>
      </div>
      <div className="ddm-profile-settings-card">
        <form>
          <h4 className="ddm-section-title"><span className="ddm-section-line"></span> Contact & Coordonnées</h4>
          <div className="ddm-form-grid no-bg" style={{ marginBottom: '32px' }}>
            <div className="ddm-form-group" style={{ marginBottom: 0 }}><label className="ddm-form-label">Email Professionnel</label><input type="email" defaultValue="demandeur@ocp.ma" className="ddm-form-control" style={{ backgroundColor: '#eef2f7', color: '#6c757d' }} readOnly /></div>
            <div className="ddm-form-group" style={{ marginBottom: 0 }}><label className="ddm-form-label">Téléphone / Extension</label><input type="tel" defaultValue="0622222222" className="ddm-form-control" /></div>
          </div>
          <h4 className="ddm-section-title"><span className="ddm-section-line"></span> Sécurité de l'accès</h4>
          <div className="ddm-form-grid no-bg">
            <div className="ddm-form-group" style={{ marginBottom: 0 }}><label className="ddm-form-label">Nouveau mot de passe</label><input type="password" placeholder="••••••••" className="ddm-form-control" /></div>
            <div className="ddm-form-group" style={{ marginBottom: 0 }}><label className="ddm-form-label">Confirmer le mot de passe</label><input type="password" placeholder="••••••••" className="ddm-form-control" /></div>
          </div>
          <div className="ddm-form-actions-bottom" style={{ marginTop: '32px' }}><button type="button" className="ddm-btn ddm-btn-primary">Enregistrer les modifications</button></div>
        </form>
      </div>
    </div>
  );
}