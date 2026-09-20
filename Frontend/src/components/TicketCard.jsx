import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Clock,
  ArrowUpRight,
  Check,
  Cpu,
  User,
  Calendar,
  MessageSquare,
  FileCheck,
} from "lucide-react";

/* =========================
   LIVE TIMER
========================= */
const LiveTimer = ({ startDate }) => {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!startDate) return;

    const update = () => {
      const diff = new Date() - new Date(startDate);
      if (diff <= 0) return setElapsed("00:00:00");

      const s = Math.floor(diff / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");

      setElapsed(`${h}:${m}:${sec}`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startDate]);

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 text-yellow-400 text-xs font-mono border border-slate-800">
      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
      <Clock className="h-3.5 w-3.5" />
      {elapsed}
    </span>
  );
};

/* =========================
   HELPERS
========================= */
const normalize = (v) => String(v || "").toUpperCase();

const STATUS = {
  WAITING: ["EN_ATTENTE", "PENDING", "OUVERT"],
  N1: ["EN_COURS_N1", "IN_PROGRESS_N1"],
  N2: ["EN_COURS_N2", "IN_PROGRESS_N2"],
  N3: ["EN_COURS_N3", "IN_PROGRESS_N3"],
  ESC_N2: ["ESCALADE_N2", "ESCALATED_N2"],
  ESC_N3: ["ESCALADE_N3", "ESCALATED_N3"],
  CLOSED: ["CLOTURE", "CLOSED"],
};

const isIn = (status, list) => list.includes(status);

/* =========================
   MAIN COMPONENT
========================= */
export default function TicketCard({ data, onStart, activeActions }) {
  if (!data) return null;

  const isIntervention = !!data.ticket;
  const ticket = isIntervention ? data.ticket : data;

  const {
    id: ticketId,
    titre,
    description,
    priorite,
    statut,
    demandeur,
    equipement,
    dateCreation,
  } = ticket;

  const intervention = isIntervention ? data : null;
  const interventionId = intervention?.id;

  const status = normalize(statut);

  /* =========================
     STATUS CONFIG
  ========================= */
  const statusConfig = useMemo(() => {
    if (isIn(status, STATUS.WAITING))
      return { label: "En attente N1", color: "blue" };

    if (isIn(status, STATUS.N1))
      return { label: "En cours N1", color: "emerald" };

    if (isIn(status, STATUS.N2))
      return { label: "En cours N2", color: "emerald" };

    if (isIn(status, STATUS.N3))
      return { label: "En cours N3", color: "emerald" };

    if (isIn(status, STATUS.ESC_N2))
      return { label: "Escaladé N2", color: "amber" };

    if (isIn(status, STATUS.ESC_N3))
      return { label: "Escaladé N3", color: "amber" };

    if (isIn(status, STATUS.CLOSED))
      return { label: "Clôturé", color: "slate" };

    return { label: statut, color: "slate" };
  }, [status, statut]);

  /* =========================
     PRIORITY
  ========================= */
  const priority = useMemo(() => {
    const p = normalize(priorite);

    if (["HIGH", "CRITICAL", "CRITIQUE"].includes(p))
      return { label: "Critique", color: "rose", border: "rose" };

    if (["MEDIUM", "MOYEN", "MOYENNE"].includes(p))
      return { label: "Moyenne", color: "amber", border: "amber" };

    return { label: "Normale", color: "emerald", border: "emerald" };
  }, [priorite]);

  /* =========================
     FLAGS
  ========================= */
  const isEnCours = [
    ...STATUS.N1,
    ...STATUS.N2,
    ...STATUS.N3,
  ].includes(status);

  const isEnAttente = isIn(status, STATUS.WAITING);

  const canTake =
    (isEnAttente ||
      status.startsWith("ESCALADE")) &&
    onStart;

  const interventionMatch =
    (status === "ESCALADE_N2" &&
      ticket.assignedTechnicianRole === "ROLE_N2") ||
    (status === "ESCALADE_N3" &&
      ticket.assignedTechnicianRole === "ROLE_N3") ||
    isEnAttente;

  /* =========================
     RENDER
  ========================= */
  return (
    <div
      className={`bg-white rounded-xl border-l-4 border-${priority.border}-500 shadow-sm hover:shadow-md transition-all flex flex-col`}
    >
      <div className="p-5 flex flex-col justify-between h-full">

        {/* HEADER */}
        <div className="flex justify-between mb-3">
          <span className="text-xs text-slate-400 font-semibold">
            Ticket #{ticketId}
            {isIntervention && ` / Interv #${interventionId}`}
          </span>

          <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
            {statusConfig.label}
          </span>
        </div>

        {/* TIMER */}
        {isEnCours && intervention?.dateDebut && (
          <LiveTimer startDate={intervention.dateDebut} />
        )}

        {/* CONTENT */}
        <h3 className="font-bold text-slate-800 mt-3">{titre}</h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>

        {/* DETAILS */}
        <div className="mt-4 text-xs space-y-2">
          <div className="flex gap-2 items-center">
            <Cpu size={14} /> {equipement?.nom}
          </div>

          <div className="flex gap-2 items-center">
            <User size={14} />
            {demandeur?.prenom} {demandeur?.nom}
          </div>

          <div className="flex gap-2 items-center">
            <Calendar size={14} />
            {dateCreation &&
              new Date(dateCreation).toLocaleDateString("fr-FR")}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-5">

          {canTake && interventionMatch && (
            <button
              onClick={() => onStart(ticketId)}
              className="w-full bg-emerald-600 text-white py-2 rounded-full text-xs font-bold"
            >
              🚀 Prendre en charge
            </button>
          )}

          {isEnCours && isIntervention && activeActions && (
            <div className="grid grid-cols-2 gap-2 mt-2">

              <button
                onClick={() =>
                  activeActions.onAddAction(interventionId)
                }
                className="border py-2 text-xs rounded-lg"
              >
                📝 Actions
              </button>

              <button
                onClick={() =>
                  activeActions.onTerminate(intervention)
                }
                className="bg-emerald-600 text-white py-2 text-xs rounded-lg"
              >
                <Check size={14} /> Terminer
              </button>

              <button
                onClick={() =>
                  activeActions.onEscalate(intervention)
                }
                className="col-span-2 bg-amber-500 py-2 text-xs rounded-lg"
              >
                <ArrowUpRight size={14} /> Escalader N2
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}