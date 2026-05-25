import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  LayoutDashboard,
  Wrench,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Bell,
  LogOut,
  RefreshCw,
  Clock
} from "lucide-react";

import "./DemandeurDashboard.css";

// ================= AXIOS =================
const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default function TechnicienN1Dashboard() {
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("userId");

  const [activeMenu, setActiveMenu] = useState("dashboard");

  const [loading, setLoading] = useState(false);

  const [allTickets, setAllTickets] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [activeIntervention, setActiveIntervention] =
    useState(null);

  const [rapportText, setRapportText] =
    useState("");

  // ================= AUTH =================
  useEffect(() => {
    const token = localStorage.getItem("token");

    const role = localStorage.getItem("role");

    if (
      !token ||
      (role !== "ROLE_N1" && role !== "N1")
    ) {
      localStorage.clear();

      navigate("/login");

      return;
    }

    loadTicketsData();
  }, []);

  // ================= LOAD DATA =================
  const loadTicketsData = async () => {
    try {
      setLoading(true);

      // ===== TICKETS =====
      const ticketsRes = await api.get(
        "/technicien/tickets"
      );

      console.log(
        "Tickets reçus :",
        ticketsRes.data
      );

      const tickets = ticketsRes.data || [];

      setAllTickets(tickets);

      // ===== NOTIFICATIONS =====
      try {
        const notifRes = await api.get(
          `/notifications/${currentUserId}`
        );

        setNotifications(
          notifRes.data || []
        );
      } catch (err) {
        console.log(
          "Pas de notifications"
        );
      }

      // ===== INTERVENTION ACTIVE =====
      const currentIntervention =
        tickets.find(
          (t) =>
            t.statut ===
              "EN_COURS_N1" ||
            t.statut === "EN_COURS"
        );

      if (currentIntervention) {
        setActiveIntervention(
          currentIntervention
        );
      } else {
        setActiveIntervention(null);
      }
    } catch (error) {
      console.error(
        "Erreur chargement tickets :",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= START INTERVENTION =================
  const handleStartIntervention =
    async (ticket) => {
      try {
        if (activeIntervention) {
          alert(
            "⚠️ Vous avez déjà une intervention en cours."
          );

          return;
        }

        setLoading(true);

        const payload = {
          ticketId: ticket.id,

          technicienId:
            parseInt(currentUserId),

          statut: "EN_COURS_N1",
        };

        await api.post(
          "/technicien/interventions/start",
          payload
        );

        alert(
          `🚀 Intervention démarrée pour Ticket #${ticket.id}`
        );

        await loadTicketsData();

        setActiveMenu("active-job");
      } catch (error) {
        console.error(error);

        alert(
          "Erreur démarrage intervention"
        );
      } finally {
        setLoading(false);
      }
    };

  // ================= CLOTURE =================
  const handleCloturerTicket =
    async (e) => {
      e.preventDefault();

      if (!rapportText.trim()) {
        alert(
          "Veuillez saisir un rapport"
        );

        return;
      }

      try {
        setLoading(true);

        await api.post(
          `/technicien/interventions/${activeIntervention.id}/cloturer`,
          {
            rapport: rapportText,
          }
        );

        alert("✅ Ticket clôturé");

        setRapportText("");

        setActiveIntervention(null);

        await loadTicketsData();

        setActiveMenu("dashboard");
      } catch (error) {
        console.error(error);

        alert("Erreur clôture");
      } finally {
        setLoading(false);
      }
    };

  // ================= ESCALADE =================
  const handleEscaladerTicket =
    async () => {
      if (!rapportText.trim()) {
        alert(
          "Veuillez saisir un rapport"
        );

        return;
      }

      try {
        setLoading(true);

        await api.post(
          `/technicien/interventions/${activeIntervention.id}/escalader`,
          {
            rapport: rapportText,

            prochainStatut:
              "ESCALADE_N2",

            groupeCible:
              "ROLE_N2",
          }
        );

        alert(
          "⚠️ Ticket escaladé vers N2"
        );

        setRapportText("");

        setActiveIntervention(null);

        await loadTicketsData();

        setActiveMenu("dashboard");
      } catch (error) {
        console.error(error);

        alert("Erreur escalade");
      } finally {
        setLoading(false);
      }
    };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.clear();

    navigate("/login");
  };

  // ================= FILTERS =================
  const pendingTickets =
    allTickets.filter(
      (t) =>
        t.statut === "EN_ATTENTE"
    );

  const inProgressTickets =
    allTickets.filter(
      (t) =>
        t.statut ===
        "EN_COURS_N1"
    );

  const closedCount =
    allTickets.filter(
      (t) =>
        t.statut ===
          "CLOTURE" ||
        t.statut === "TERMINEE"
    ).length;

  return (
    <div className="admin-dashboard-container">
      {/* ================= SIDEBAR ================= */}

      <aside className="admin-sidebar-new">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <h2>OCP GMAO</h2>

            <p>TECHNICIEN N1</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${
              activeMenu ===
              "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveMenu(
                "dashboard"
              )
            }
          >
            <LayoutDashboard size={20} />

            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-link ${
              activeMenu ===
              "available-tickets"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveMenu(
                "available-tickets"
              )
            }
          >
            <AlertTriangle size={20} />

            <span>
              Tickets (
              {
                pendingTickets.length
              }
              )
            </span>
          </button>

          <button
            className={`sidebar-link ${
              activeMenu ===
              "active-job"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveMenu(
                "active-job"
              )
            }
          >
            <Wrench size={20} />

            <span>
              Intervention
            </span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />

            Déconnexion
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="admin-main-new">
        {/* ================= HEADER ================= */}

        <header className="admin-header-new">
          <div className="header-left">
            <h1>
              Dashboard Technicien
              N1
            </h1>

            <p>
              Gestion des tickets
              support OCP
            </p>
          </div>

          <div className="header-right">
            {/* NOTIFICATION */}
            <div className="notification-box">
              <Bell size={22} />

              {notifications.length >
                0 && (
                <span className="notif-count">
                  {
                    notifications.length
                  }
                </span>
              )}
            </div>

            {/* REFRESH */}
            <button
              className="header-icon"
              onClick={
                loadTicketsData
              }
            >
              <RefreshCw
                size={20}
                className={
                  loading
                    ? "spin-animation"
                    : ""
                }
              />
            </button>
          </div>
        </header>

        {/* ================= CONTENT ================= */}

        <div className="admin-content-new">
          {/* DASHBOARD */}

          {activeMenu ===
            "dashboard" && (
            <div className="dashboard-new">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-value">
                      {
                        pendingTickets.length
                      }
                    </span>

                    <span className="stat-title">
                      Tickets En
                      Attente
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-value">
                      {
                        inProgressTickets.length
                      }
                    </span>

                    <span className="stat-title">
                      En Cours
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-value">
                      {closedCount}
                    </span>

                    <span className="stat-title">
                      Clôturés
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "30px",
                }}
              >
                {activeIntervention ? (
                  <div
                    style={{
                      background:
                        "#dbeafe",
                      padding:
                        "20px",
                      borderRadius:
                        "12px",
                    }}
                  >
                    <h3>
                      ⚠️ Intervention
                      Active
                    </h3>

                    <p>
                      Ticket #
                      {
                        activeIntervention.id
                      }
                    </p>

                    <button
                      className="btn-primary"
                      onClick={() =>
                        setActiveMenu(
                          "active-job"
                        )
                      }
                    >
                      Ouvrir
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding:
                        "20px",
                    }}
                  >
                    Aucun ticket
                    actif
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TABLE TICKETS ================= */}

          {activeMenu ===
            "available-tickets" && (
            <div className="section-new">
              <h2>
                ⚠️ Tickets Reçus
              </h2>

              <div className="table-container">
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>ID</th>

                      <th>Titre</th>

                      <th>
                        Description
                      </th>

                      <th>
                        Priorité
                      </th>

                      <th>
                        Statut
                      </th>

                      <th>Date</th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pendingTickets.map(
                      (ticket) => (
                        <tr
                          key={
                            ticket.id
                          }
                        >
                          <td>
                            #
                            {
                              ticket.id
                            }
                          </td>

                          <td>
                            {
                              ticket.titre
                            }
                          </td>

                          <td>
                            {
                              ticket.description
                            }
                          </td>

                          <td>
                            {
                              ticket.priorite
                            }
                          </td>

                          <td>
                            {
                              ticket.statut
                            }
                          </td>

                          <td>
                            {
                              ticket.dateCreation
                            }
                          </td>

                          <td>
                            <button
                              className="btn-primary"
                              onClick={() =>
                                handleStartIntervention(
                                  ticket
                                )
                              }
                            >
                              🚀
                              Démarrer
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                {pendingTickets.length ===
                  0 && (
                  <div
                    style={{
                      padding:
                        "30px",
                      textAlign:
                        "center",
                      color:
                        "#777",
                    }}
                  >
                    Aucun ticket
                    disponible
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= INTERVENTION ACTIVE ================= */}

          {activeMenu ===
            "active-job" && (
            <div className="section-new">
              {activeIntervention ? (
                <div
                  className="preventive-card"
                  style={{
                    maxWidth:
                      "800px",
                    margin:
                      "0 auto",
                  }}
                >
                  <div
                    style={{
                      background:
                        "#2563eb",
                      padding:
                        "20px",
                      color:
                        "white",
                    }}
                  >
                    <h2>
                      🛠️
                      Intervention
                      Active
                    </h2>
                  </div>

                  <div
                    style={{
                      padding:
                        "20px",
                    }}
                  >
                    <h3>
                      {
                        activeIntervention.titre
                      }
                    </h3>

                    <p>
                      {
                        activeIntervention.description
                      }
                    </p>

                    <textarea
                      rows={5}
                      className="form-control"
                      placeholder="Rapport technique..."
                      value={
                        rapportText
                      }
                      onChange={(
                        e
                      ) =>
                        setRapportText(
                          e.target
                            .value
                        )
                      }
                    />

                    <div
                      style={{
                        display:
                          "flex",
                        gap: "15px",
                        marginTop:
                          "20px",
                      }}
                    >
                      <button
                        className="btn-primary"
                        style={{
                          flex: 1,
                          background:
                            "#10b981",
                        }}
                        onClick={
                          handleCloturerTicket
                        }
                      >
                        <CheckCircle
                          size={
                            18
                          }
                        />

                        Clôturer
                      </button>

                      <button
                        className="btn-primary"
                        style={{
                          flex: 1,
                          background:
                            "#ef4444",
                        }}
                        onClick={
                          handleEscaladerTicket
                        }
                      >
                        <ArrowUpRight
                          size={
                            18
                          }
                        />

                        Escalader
                        N2
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "60px",
                  }}
                >
                  <Clock
                    size={48}
                  />

                  <h3>
                    Aucune
                    intervention
                    active
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}