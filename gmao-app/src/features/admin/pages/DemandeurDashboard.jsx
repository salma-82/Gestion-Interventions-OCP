import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  Plus,
  User,
  LogOut,
  Bell,
  HelpCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Send,
  Star,
  X
} from "lucide-react";

import "./DemandeurDashboard.css";
import UserProfile from "./UserProfile";

const API = "http://localhost:8080/api/demandeur/tickets";

export default function DemandeurDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États pour la gestion de l'évaluation
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");

  const token = localStorage.getItem("token");
  const demandeurId = Number(localStorage.getItem("userId"));

  const headers = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : ""
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}?demandeurId=${demandeurId}`, { headers });
      setTickets(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (demandeurId) fetchTickets();
  }, []);

  // Ouvrir le modal d'évaluation si le ticket est résolu ou clôturé
  const handleRowAction = (ticket) => {
    if (ticket.statut === "RESOLU" || ticket.statut === "CLOTURE") {
      setSelectedTicket(ticket);
      setNote(5); // Valeur par défaut
      setCommentaire("");
      setShowEvalModal(true);
    } else {
      alert("Ce ticket est encore en cours de traitement.");
    }
  };

  // Soumission de la note au Backend
  const handleSendEvaluation = async () => {
    try {
      // Ajuste l'URL selon l'endpoint exact de ton API Spring Boot
      await axios.post(
        `http://localhost:8080/api/demandeur/tickets/${selectedTicket.id}/evaluer`,
        { note, commentaire },
        { headers }
      );
      alert("Merci pour votre évaluation ! ⭐");
      setShowEvalModal(false);
      fetchTickets(); // Recharger pour mettre à jour l'affichage si nécessaire
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de l'évaluation.");
    }
  };

  const stats = {
    total: tickets.length,
    high: tickets.filter(t => t.priorite === "HIGH").length,
    medium: tickets.filter(t => t.priorite === "MEDIUM").length,
    low: tickets.filter(t => t.priorite === "LOW").length
  };

  return (
    <div className="ddm-wrapper">
      
      {/* SIDEBAR STYLE ADMIN */}
      <aside className="ddm-sidebar">
        <div className="ddm-sidebar-header">
          <h1 className="ddm-sidebar-title">GESTION DES INTERVENTIONS</h1>
          <p className="ddm-sidebar-subtitle">Espace Demandeur</p>
        </div>

        <nav className="ddm-sidebar-nav">
          <button 
            className={`ddm-nav-item ${tab === "dashboard" ? "active" : ""}`} 
            onClick={() => setTab("dashboard")}
          >
            <Activity size={20} /> Tableau de bord
          </button>

          <button 
            className={`ddm-nav-item ${tab === "new" ? "active" : ""}`} 
            onClick={() => setTab("new")}
          >
            <Plus size={20} /> Nouvelle Demande
          </button>

          <button 
            className={`ddm-nav-item ${tab === "profile" ? "active" : ""}`} 
            onClick={() => setTab("profile")}
          >
            <User size={20} /> Mon Profil
          </button>
        </nav>

        <div className="ddm-sidebar-footer">
          <div className="ddm-user-badge">
            <div className="ddm-user-avatar">AA</div>
            <div className="ddm-user-info">
              <p className="ddm-user-name">Anas Alami</p>
              <p className="ddm-user-dept">Demandeur</p>
            </div>
          </div>
          <button className="ddm-logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="ddm-main">
        
        {/* HEADER */}
        <header className="ddm-header">
          <div>
            <h2>
              {tab === "dashboard" && "Suivi des Interventions"}
              {tab === "new" && "Création d'un Ticket"}
              {tab === "profile" && "Paramètres du Profil"}
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
            
            {/* VIEW: DASHBOARD */}
            {tab === "dashboard" && (
              <>
                {/* CARDS STATS */}
                <div className="ddm-stats-grid">
                  <div className="ddm-stat-card default">
                    <div className="ddm-stat-info"><p>Total Demandes</p><p>{stats.total}</p></div>
                    <div className="ddm-stat-icon"><Activity size={24} /></div>
                  </div>

                  <div className="ddm-stat-card warning">
                    <div className="ddm-stat-info"><p>En attente (High)</p><p>{stats.high}</p></div>
                    <div className="ddm-stat-icon"><Clock size={24} /></div>
                  </div>

                  <div className="ddm-stat-card primary">
                    <div className="ddm-stat-info"><p>Moyenne (Medium)</p><p>{stats.medium}</p></div>
                    <div className="ddm-stat-icon"><Clock size={24} /></div>
                  </div>

                  <div className="ddm-stat-card success">
                    <div className="ddm-stat-info"><p>Normale (Low)</p><p>{stats.low}</p></div>
                    <div className="ddm-stat-icon"><CheckCircle size={24} /></div>
                  </div>
                </div>

                {/* RECENT DEMANDS CARD */}
                <div className="ddm-card">
                  <div className="ddm-card-header">
                    <div>
                      <h3 className="ddm-card-title">Mes Demandes Récentes</h3>
                      <p className="ddm-card-subtitle">Consultez l'état d'avancement de vos interventions</p>
                    </div>
                    <button onClick={() => setTab("new")} className="ddm-btn ddm-btn-primary">
                      <Plus size={18} /> Nouvelle Demande
                    </button>
                  </div>

                  <div className="ddm-table-responsive">
                    {loading ? (
                      <div className="ddm-loading-spinner">Chargement des données...</div>
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
                          {tickets.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="ddm-empty-state">Aucun ticket trouvé.</td>
                            </tr>
                          ) : (
                            tickets.map((t) => (
                              <tr key={t.id}>
                                <td className="ddm-text-primary">#{t.id}</td>
                                <td>
                                  <p className="ddm-text-dark">{t.titre}</p>
                                  <p className="ddm-text-muted">{t.description}</p>
                                  {t.equipement?.nom && (
                                    <span className="ddm-eq-badge">EQ: {t.equipement.nom}</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`ddm-badge ddm-badge-${t.priorite?.toLowerCase()}`}>
                                    {t.priorite === "HIGH" ? "Urgent" : t.priorite === "MEDIUM" ? "Moyenne" : "Normale"}
                                  </span>
                                </td>
                                <td>
                                  {/* STEPPER SYNCHRONISÉ AVEC LE STATUT */}
                                  <div className="ddm-stepper">
                                    <div className={`ddm-step-wrapper ${t.statut === "EN_ATTENTE" ? "active" : ""}`}>
                                      <div className="ddm-step-circle completed"><div className="ddm-step-inner"></div></div>
                                      <span className="ddm-step-label">Créé</span>
                                    </div>
                                    <div className={`ddm-step-line ${t.statut !== "EN_ATTENTE" ? "completed" : ""}`} />
                                    <div className={`ddm-step-wrapper ${t.statut === "EN_COURS" ? "active" : ""}`}>
                                      <div className={`ddm-step-circle ${t.statut !== "EN_ATTENTE" ? "completed" : ""}`}>{t.statut !== "EN_ATTENTE" && <div className="ddm-step-inner"></div>}</div>
                                      <span className="ddm-step-label">En traitement</span>
                                    </div>
                                    <div className={`ddm-step-line ${t.statut === "CLOTURE" || t.statut === "RESOLU" ? "completed" : ""}`} />
                                    <div className={`ddm-step-wrapper ${t.statut === "CLOTURE" || t.statut === "RESOLU" ? "active" : ""}`}>
                                      <div className={`ddm-step-circle ${t.statut === "CLOTURE" || t.statut === "RESOLU" ? "completed" : ""}`}>{ (t.statut === "CLOTURE" || t.statut === "RESOLU") && <div className="ddm-step-inner"></div>}</div>
                                      <span className="ddm-step-label">Résolu</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {(t.statut === "RESOLU" || t.statut === "CLOTURE") ? (
                                    <button 
                                      onClick={() => handleRowAction(t)} 
                                      className="ddm-btn ddm-btn-eval"
                                      style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#e4e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      Évaluer ⭐
                                    </button>
                                  ) : (
                                    <button onClick={() => handleRowAction(t)} className="ddm-arrow-btn"><ChevronRight size={20} /></button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* VIEW: NEW TICKET */}
            {tab === "new" && (
              <NewTicketForm
                onSuccess={() => {
                  fetchTickets();
                  setTab("dashboard");
                }}
                headers={headers}
                demandeurId={demandeurId}
                onCancel={() => setTab("dashboard")}
              />
            )}

            {/* VIEW: PROFILE */}
            {tab === "profile" && <UserProfile />}

          </div>
        </div>
      </main>

      {/* ================= MODAL D'ÉVALUATION DE L'INTERVENTION ================= */}
      {showEvalModal && (
        <div className="ddm-modal-overlay">
          <div className="ddm-modal-content">
            <div className="ddm-modal-header">
              <h3>Évaluation de l'intervention #{selectedTicket?.id}</h3>
              <button className="ddm-close-modal" onClick={() => setShowEvalModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ddm-modal-body">
              <p>Le technicien a clôturé votre incident : <strong>{selectedTicket?.titre}</strong>.</p>
              <p>Veuillez noter la qualité du service rendu :</p>
              
              {/* Système d'étoiles interactives (1 à 5) */}
              <div className="ddm-stars-container" style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    onClick={() => setNote(star)}
                    style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                    fill={star <= note ? "#ffc107" : "none"}
                    color={star <= note ? "#ffc107" : "#ccc"}
                  />
                ))}
              </div>

              <div className="ddm-form-group">
                <label className="ddm-form-label">Commentaire (facultatif)</label>
                <textarea
                  className="ddm-form-control"
                  rows={3}
                  placeholder="Laissez un commentaire sur la rapidité, l'efficacité..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                />
              </div>
            </div>
            <div className="ddm-modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="ddm-btn ddm-btn-secondary" onClick={() => setShowEvalModal(false)}>Annuler</button>
              <button className="ddm-btn ddm-btn-primary" onClick={handleSendEvaluation}>
                Enregistrer l'évaluation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= FORM COMPONENT REDESIGNED ================= */
function NewTicketForm({ onSuccess, headers, demandeurId, onCancel }) {
  const [form, setForm] = useState({
    titre: "",
    description: "",
    priorite: "LOW",
    statut: "EN_ATTENTE",
    equipement: { id: "" }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "equipementId") {
      setForm(prev => ({ ...prev, equipement: { id: Number(value) } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.description.trim() || !form.equipement.id) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    try {
      await axios.post(`http://localhost:8080/api/demandeur/tickets?demandeurId=${demandeurId}`, form, { headers });
      alert("Demande d'intervention enregistrée avec succès ! ✅");
      onSuccess();
    } catch (err) {
      alert("Erreur lors de la création du ticket. Vérifiez l'ID d'équipement.");
    }
  };

  return (
    <div className="ddm-card">
      <div className="ddm-card-header" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eef2f6', margin: '-24px -24px 24px -24px', padding: '24px' }}>
        <div>
          <h2 className="ddm-card-title">Déclarer un Incident</h2>
          <p className="ddm-card-subtitle">Remplissez ce formulaire pour planifier l'intervention de l'équipe technique.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ddm-form-container">
        <div className="ddm-form-grid no-bg">
          
          <div className="ddm-form-group ddm-grid-full">
            <label className="ddm-form-label">Titre de l'incident <span>*</span></label>
            <input
              name="titre"
              type="text"
              placeholder="Ex: Panne écran ou dysfonctionnement réseau"
              value={form.titre}
              onChange={handleChange}
              className="ddm-form-control"
              required
            />
          </div>

          <div className="ddm-form-group ddm-grid-full">
            <label className="ddm-form-label">ID de l'équipement concerné <span>*</span></label>
            <input
              name="equipementId"
              type="number"
              placeholder="Saisissez l'identifiant numérique de l'équipement (Ex: 1, 4...)"
              value={form.equipement.id}
              onChange={handleChange}
              className="ddm-form-control"
              required
            />
          </div>

          <div className="ddm-form-group ddm-grid-full">
            <label className="ddm-form-label">Niveau de criticité <span>*</span></label>
            <div className="ddm-form-select-wrapper">
              <select
                name="priorite"
                value={form.priorite}
                onChange={handleChange}
                className="ddm-form-control"
              >
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
              name="description"
              rows={5}
              placeholder="Décrivez précisément les symptômes du problème technique..."
              value={form.description}
              onChange={handleChange}
              className="ddm-form-control"
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