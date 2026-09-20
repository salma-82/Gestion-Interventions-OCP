
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  Plus,
  User,
  LogOut,
  CheckCircle,
  Clock,
  ChevronRight,
  Send,
  Star,
  X
} from "lucide-react";

import "./DemandeurDashboard.css";
import logoOCP from '/src/assets/logo-ocp.png';
import { useAuth } from "../../../context/AuthContext";
import UserProfile from "./UserProfile";
import TicketDetailsModal from "../../../components/TicketDetailsModal";
import NotificationBell from "../../../components/NotificationBell";

const API = "http://localhost:8080/api/demandeur/tickets";

export default function DemandeurDashboard() {
  const { userName: authUserName, profileImage, logout: authLogout } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // États pour la gestion de l'évaluation
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  // Flag to indicate whether an evaluation already exists for the selected ticket
  const [evalExists, setEvalExists] = useState(false);
  const [selectedTicketInterventions, setSelectedTicketInterventions] = useState([]);

  // État pour les détails d'un ticket
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const rawName = (authUserName || localStorage.getItem("userName") || "Anas Alami").trim();
  const displayName = rawName === "Technicien" ? "Demandeur" : rawName;
  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DA";

  const token = localStorage.getItem("token");
  const demandeurId = Number(localStorage.getItem("userId"));

  const headers = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : ""
  };

  const handleLogout = () => {
    authLogout();
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
    if (demandeurId) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  // Ouvrir le modal d'évaluation si le ticket est résolu ou clôturé
  const handleRowAction = async (ticket) => {
    if (ticket.statut === "CLOSED" || ticket.statut === "CLOTURE") {
      setSelectedTicketInterventions([]);
      try {
        const res = await axios.get(`http://localhost:8080/api/evaluations/ticket/${ticket.id}`, { headers });
        if (res.data) {
          setNote(res.data.note);
          setCommentaire(res.data.commentaire || "");
          setEvalExists(true);
        } else {
          setNote(5);
          setCommentaire("");
          setEvalExists(false);
        }
      } catch (err) {
        setNote(5);
        setCommentaire("");
        setEvalExists(false);
      }

      try {
        const intRes = await axios.get(`http://localhost:8080/api/demandeur/tickets/${ticket.id}/interventions`, { headers });
        setSelectedTicketInterventions(intRes.data || []);
      } catch (err) {
        console.error("Erreur de récupération des rapports d'intervention:", err);
      }

      setSelectedTicket(ticket);
      setShowEvalModal(true);
    } else {
      setDetailTicket(ticket);
      setShowDetailModal(true);
    }
  };

  // Soumission de la note au Backend
  const handleSendEvaluation = async () => {
    try {
      await axios.post(
        `http://localhost:8080/api/evaluations`,
        { ticketId: selectedTicket.id, note, commentaire },
        { headers }
      );
      alert("Merci pour votre évaluation ! ⭐");
      setShowEvalModal(false);
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de l'évaluation.");
    }
  };

  const stats = {
    total: tickets.length,
    high: tickets.filter(t => t.priorite === "URGENT").length,
    medium: tickets.filter(t => t.priorite === "MOYENNE").length,
    low: tickets.filter(t => t.priorite === "NORMALE").length
  };

  return (
    <div className="ddm-wrapper">

      {/* SIDEBAR */}
      <aside className="ddm-sidebar">
        <div className="ddm-sidebar-header">
          <img src={logoOCP} alt="OCP" className="ddm-sidebar-logo-small" />
          <div className="ddm-sidebar-header-copy">

            <p className="ddm-sidebar-subtitle">Espace demandeur OCP</p>
          </div>
        </div>

        <nav className="ddm-sidebar-nav">
          <div className="ddm-nav-section">

            <button
              className={`ddm-nav-item ${tab === "dashboard" ? "active" : ""}`}
              onClick={() => setTab("dashboard")}
            >
              Tableau de bord
            </button>
            <button
              className={`ddm-nav-item ${tab === "new" ? "active" : ""}`}
              onClick={() => setTab("new")}
            >
              Nouvelle Demande
            </button>
          </div>

          <div className="ddm-nav-section">

            <button
              className={`ddm-nav-item ${tab === "profile" ? "active" : ""}`}
              onClick={() => setTab("profile")}
            >
              <User size={18} /> Mon Profil
            </button>
          </div>
        </nav>

        <div className="ddm-sidebar-spacer"></div>

        <div className="ddm-sidebar-footer">
          <div className="ddm-user-info-compact">
            <div
              className={`ddm-user-avatar-mini ${profileImage ? "has-image" : ""}`}
              style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
              aria-hidden="true"
            >
              {!profileImage && userInitials}
            </div>
            <div className="ddm-user-text-mini">
              <p className="ddm-user-name-mini">{displayName}</p>
              <p className="ddm-user-dept-mini">Demandeur</p>
            </div>
          </div>
          <button className="ddm-logout-btn-simple" onClick={handleLogout} title="Se déconnecter">
            <LogOut size={16} />
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
            <NotificationBell
              onRefresh={fetchTickets}
              refreshLoading={loading}
              refreshTitle="Actualiser les demandes"
            />
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

                  </div>

                  <div className="ddm-stat-card warning">
                    <div className="ddm-stat-info"><p>URGENT</p><p>{stats.high}</p></div>

                  </div>

                  <div className="ddm-stat-card primary">
                    <div className="ddm-stat-info"><p>MOYENNE</p><p>{stats.medium}</p></div>

                  </div>

                  <div className="ddm-stat-card success">
                    <div className="ddm-stat-info"><p>NORMALE</p><p>{stats.low}</p></div>

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
                            <th>Évaluation</th>
                            <th>Criticité</th>
                            <th>État d'avancement</th>
                            <th style={{ textAlign: 'center' }}>Ticket</th>
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
                                <td style={{ textAlign: 'center' }}>
                                  {(t.statut === 'CLOSED' || t.statut === 'CLOTURE') ? (
                                    <button
                                      onClick={() => handleRowAction(t)}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                                        border: '1px solid #fde68a', background: '#fffbeb',
                                        color: '#b45309', fontWeight: 600, fontSize: '13px',
                                        transition: 'all 0.15s'
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; }}
                                      title="Cliquer pour évaluer l'intervention"
                                    >
                                      ⭐ Évaluer
                                    </button>
                                  ) : (
                                    <span style={{
                                      fontSize: '12px', color: '#94a3b8', fontStyle: 'italic'
                                    }}>
                                      — En attente de clôture
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <span className={`ddm-badge ddm-badge-${t.priorite?.toLowerCase()}`}>
                                    {t.priorite}
                                  </span>
                                </td>
                                <td>
                                  <div className="ddm-stepper">
                                    {(() => {
                                      const mapStatus = (statut) => {
                                        if (statut === "PENDING") return "CREÉ";
                                        if (statut === "CLOSED" || statut === "CLOTURE") return "RÉSOLU";
                                        return "EN TRAITEMENT";
                                      };
                                      const display = mapStatus(t.statut);
                                      return (
                                        <>
                                          <div className={`ddm-step-wrapper ${display === "CREÉ" ? "active" : ""}`}>
                                            <div className="ddm-step-circle completed">
                                              <div className="ddm-step-inner" /></div>
                                            <span className="ddm-step-label">Créé</span>
                                          </div>
                                          <div className={`ddm-step-line ${display !== "CREÉ" ? "completed" : ""}`} />
                                          <div className={`ddm-step-wrapper ${display === "EN TRAITEMENT" ? "active" : ""}`}>
                                            <div className={`ddm-step-circle ${display !== "CREÉ" ? "completed" : ""}`}>
                                              {display !== "CREÉ" && <div className="ddm-step-inner" />}
                                            </div>
                                            <span className="ddm-step-label">En traitement</span>
                                          </div>
                                          <div className={`ddm-step-line ${display === "RÉSOLU" ? "completed" : ""}`} />
                                          <div className={`ddm-step-wrapper ${display === "RÉSOLU" ? "active" : ""}`}>
                                            <div className={`ddm-step-circle ${display === "RÉSOLU" ? "completed" : ""}`}>
                                              {display === "RÉSOLU" && <div className="ddm-step-inner" />}
                                            </div>
                                            <span className="ddm-step-label">Résolu</span>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button onClick={() => handleRowAction(t)} className="ddm-arrow-btn">
                                    <ChevronRight size={20} />
                                  </button>
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
          <div className="ddm-modal-content animate-fade-in">
            <div className="ddm-modal-header">
              <h3>{evalExists ? "Votre Évaluation" : `Évaluation de l'intervention #${selectedTicket?.id}`}</h3>
              <button className="ddm-close-modal" onClick={() => setShowEvalModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ddm-modal-body">
              <p style={{ fontSize: '0.95rem', marginBottom: '16px' }}>
                L'incident <strong>{selectedTicket?.titre}</strong> a été résolu. Voici le rapport technique :
               </p>

              {/* TECHNICAL REPORTS */}
              {selectedTicketInterventions && selectedTicketInterventions.length > 0 ? (
                <div className="ddm-report-section">
                  <div className="ddm-report-title">
                    <Activity size={14} style={{ marginRight: 6 }} /> Rapports d'intervention technique
                  </div>
                  {selectedTicketInterventions.map((int, idx) => {
                    const techRole = int.technicien?.role;
                    let levelLabel = "Niveau 1";
                    if (techRole === "ROLE_N2") levelLabel = "Niveau 2";
                    if (techRole === "ROLE_N3") levelLabel = "Niveau 3";
                    
                    return (
                      <div key={int.id} style={{ 
                        borderBottom: idx < selectedTicketInterventions.length - 1 ? '1px dashed #e2e8f0' : 'none', 
                        paddingBottom: idx < selectedTicketInterventions.length - 1 ? '16px' : '0', 
                        marginBottom: idx < selectedTicketInterventions.length - 1 ? '16px' : '0' 
                      }}>
                        <div className="ddm-report-badge-row">
                          <span className="ddm-badge ddm-badge-low" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            Intervenant: {int.technicien?.prenom} {int.technicien?.nom} ({levelLabel})
                          </span>
                          {int.tempsPasse && (
                            <span className="ddm-badge ddm-badge-medium" style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#e0f2fe', color: '#0369a1' }}>
                              Temps passé: {int.tempsPasse}
                            </span>
                          )}
                        </div>
                        
                        <div className="ddm-report-grid">
                          {int.diagnostic && (
                            <div className="ddm-report-field">
                              <span className="ddm-report-label">Diagnostic</span>
                              <div className="ddm-report-value">{int.diagnostic}</div>
                            </div>
                          )}
                          {int.actionsRealisees && (
                            <div className="ddm-report-field">
                              <span className="ddm-report-label">Actions réalisées</span>
                              <div className="ddm-report-value">{int.actionsRealisees}</div>
                            </div>
                          )}
                          {int.resultat && (
                            <div className="ddm-report-field">
                              <span className="ddm-report-label">Résultat</span>
                              <div className="ddm-report-value">{int.resultat}</div>
                            </div>
                          )}
                          {int.commentaire && (
                            <div className="ddm-report-field">
                              <span className="ddm-report-label">Observations / Commentaires</span>
                              <div className="ddm-report-value">{int.commentaire}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', marginBottom: '20px' }}>
                  Aucun rapport technique détaillé disponible pour le moment.
                </div>
              )}

              <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '10px' }}>
                  {evalExists ? "Votre Évaluation enregistrée :" : "Veuillez évaluer cette intervention :"}
                </p>

                <div className="ddm-stars-container" style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={28}
                      onClick={() => !evalExists && setNote(star)}
                      style={{ cursor: evalExists ? 'default' : 'pointer', transition: 'color 0.2s' }}
                      fill={star <= note ? "#ffc107" : "none"}
                      color={star <= note ? "#ffc107" : "#cbd5e1"}
                    />
                  ))}
                </div>

                <div className="ddm-form-group" style={{ marginTop: '16px' }}>
                  <label className="ddm-form-label">Commentaire / Feedback</label>
                  <textarea
                    className="ddm-form-control"
                    rows={3}
                    placeholder="Laissez un commentaire sur la rapidité, l'efficacité..."
                    value={commentaire}
                    readOnly={evalExists}
                    onChange={(e) => setCommentaire(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="ddm-modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="ddm-btn ddm-btn-secondary" onClick={() => setShowEvalModal(false)}>{evalExists ? "Fermer" : "Annuler"}</button>
              {!evalExists && (
                <button className="ddm-btn ddm-btn-primary" onClick={handleSendEvaluation}>
                  Enregistrer l'évaluation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailTicket(null);
        }}
        ticket={detailTicket}
      />

    </div>
  );
}

/* ================= FORM COMPONENT REDESIGNED ================= */
function NewTicketForm({ onSuccess, headers, demandeurId, onCancel }) {
  const [form, setForm] = useState({
    titre: "",
    description: "",
    priorite: "NORMALE", // 'NORMALE' par défaut à la place de 'LOW'
    statut: "PENDING",
    equipement: { id: "" }
  });

  const [equipements, setEquipements] = useState([]);
  const [loadingEquipements, setLoadingEquipements] = useState(true);
  const [equipError, setEquipError] = useState("");

  useEffect(() => {
    const fetchEquipements = async () => {
      try {
        setLoadingEquipements(true);
        setEquipError("");
        const res = await axios.get("http://localhost:8080/api/demandeur/equipements", { headers });
        setEquipements(res.data || []);
      } catch (err) {
        console.error("Erreur chargement équipements:", err);
        setEquipError("Impossible de charger la liste des équipements. Vérifiez votre connexion.");
      } finally {
        setLoadingEquipements(false);
      }
    };
    fetchEquipements();
  }, []);

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
      alert("Veuillez remplir tous les champs obligatoires, y compris l'équipement.");
      return;
    }
    try {
      await axios.post(`http://localhost:8080/api/demandeur/tickets?demandeurId=${demandeurId}`, form, { headers });
      alert("Demande d'intervention enregistrée avec succès ! ✅");
      onSuccess();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Erreur lors de la création du ticket.";
      alert("❌ " + msg);
    }
  };

  const selectedEquip = equipements.find(e => e.id === form.equipement.id);

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
            <label className="ddm-form-label">Équipement concerné <span>*</span></label>
            {loadingEquipements ? (
              <div style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                ⏳ Chargement des équipements...
              </div>
            ) : equipError ? (
              <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '0.9rem' }}>
                ⚠️ {equipError}
              </div>
            ) : (
              <>
                <div className="ddm-form-select-wrapper">
                  <select
                    name="equipementId"
                    value={form.equipement.id}
                    onChange={handleChange}
                    className="ddm-form-control"
                    required
                  >
                    <option value="">-- Sélectionnez un équipement --</option>
                    {equipements.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        [{eq.codeInventaire}] {eq.nom} — {eq.type} {eq.marque} ({eq.localisation || 'Localisation inconnue'})
                      </option>
                    ))}
                  </select>
                  <div className="ddm-form-select-icon"><ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} /></div>
                </div>
                {selectedEquip && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
                    borderRadius: '10px',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.85rem',
                    color: '#1e3a5f',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px'
                  }}>
                    <span> <strong>Modèle :</strong> {selectedEquip.marque} {selectedEquip.modele}</span>
                    <span> <strong>Localisation :</strong> {selectedEquip.localisation || '—'}</span>
                    <span><strong>N° Série :</strong> {selectedEquip.numeroSerie || '—'}</span>
                    <span> <strong>Statut :</strong> <span style={{ color: selectedEquip.statut === 'ACTIF' ? '#16a34a' : '#d97706' }}>{selectedEquip.statut}</span></span>
                  </div>
                )}
              </>
            )}
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
                <option value="NORMALE">NORMALE (Pas d'impact majeur)</option>
                <option value="MOYENNE">MOYENNE (Ralentissement)</option>
                <option value="URGENT">URGENT (Critique)</option>
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
          <button type="submit" className="ddm-btn ddm-btn-primary" disabled={loadingEquipements || !!equipError}>
            <Send size={18} /> Soumettre au Support
          </button>
        </div>
      </form>
    </div>
  );
}
