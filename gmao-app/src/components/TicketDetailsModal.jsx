import React from 'react';
import { X, Calendar, User, Cpu, AlertTriangle, MessageSquare, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TicketDetailsModal({ isOpen, onClose, ticket }) {
  if (!isOpen || !ticket) return null;

  const getPriorityConfig = (pri) => {
    const p = String(pri).toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL' || p === 'CRITIQUE') {
      return { label: 'Urgent / Critique', badge: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border border-rose-200 dark:border-rose-900' };
    }
    if (p === 'MEDIUM' || p === 'MOYENNE' || p === 'MOYEN') {
      return { label: 'Priorité Moyenne', badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200 dark:border-amber-900' };
    }
    return { label: 'Priorité Normale', badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-750 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900' };
  };

  const getStatusConfig = (st) => {
    const s = String(st).toUpperCase();
    if (s === 'EN_ATTENTE' || s === 'PENDING' || s === 'OUVERT') {
      return { label: 'En attente N1', bg: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-150 dark:border-blue-900' };
    }
    if (s === 'EN_COURS' || s === 'EN_COURS_N1' || s === 'IN_PROGRESS_N1') {
      return { label: 'En cours N1', bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900' };
    }
    if (s === 'ESCALADE_N2' || s === 'ESCALATED_N2') {
      return { label: 'Escaladé N2', bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-150 dark:border-amber-900' };
    }
    if (s === 'CLOTURE' || s === 'CLOSED') {
      return { label: 'CLOTURE', bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900' };
    }
    return { label: st, bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-700' };
  };

  const priorityConfig = getPriorityConfig(ticket.priorite);
  const statusConfig = getStatusConfig(ticket.statut);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 my-6"
      >
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-emerald-500" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">
              Consultation Ticket #{ticket.id}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-full p-1.5 transition-all hover:bg-slate-800 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Status and Priority badges */}
          <div className="flex gap-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${priorityConfig.badge}`}>
              {priorityConfig.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Titre du ticket</span>
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{ticket.titre}</h4>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description de l'incident</span>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[160px] overflow-y-auto">
              {ticket.description}
            </p>
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
            {/* Demandeur */}
            <div className="flex gap-2.5 items-start">
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase leading-none font-semibold">Demandeur</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 mt-1 text-xs truncate">
                  {ticket.demandeur ? `${ticket.demandeur.prenom} ${ticket.demandeur.nom}` : '—'}
                </span>
                {ticket.demandeur?.email && (
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 truncate mt-0.5">{ticket.demandeur.email}</span>
                )}
                {ticket.demandeur?.telephone && (
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 truncate mt-0.5">Tél: {ticket.demandeur.telephone}</span>
                )}
              </div>
            </div>

            {/* Equipement */}
            <div className="flex gap-2.5 items-start">
              <Cpu className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase leading-none font-semibold">Équipement</span>
                <span className="font-bold text-slate-705 dark:text-slate-200 mt-1 text-xs truncate">
                  {ticket.equipement?.nom || 'Inconnu'}
                </span>
                {ticket.equipement?.codeInventaire && (
                  <span className="text-[10px] font-mono text-slate-450 dark:text-slate-400 mt-0.5">Inv: {ticket.equipement.codeInventaire}</span>
                )}
              </div>
            </div>

            {/* Date creation */}
            <div className="flex gap-2.5 items-start sm:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
              <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase leading-none font-semibold">Date de création</span>
                <span className="font-semibold text-slate-650 dark:text-slate-300 mt-1 text-xs">
                  {ticket.dateCreation ? new Date(ticket.dateCreation).toLocaleString('fr-FR') : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950/40 px-6 py-4 border-t border-slate-150 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all focus:outline-none"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
