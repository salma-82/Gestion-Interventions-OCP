import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Clock, 
  ArrowUpRight, 
  Check, 
  Trash2, 
  Cpu, 
  User, 
  Calendar, 
  AlertTriangle,
  MessageSquare,
  FileCheck
} from 'lucide-react';

// Elapsed timer component for active interventions
const LiveTimer = ({ startDate }) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startDate) return;

    const updateTimer = () => {
      const start = new Date(startDate);
      const now = new Date();
      const diffMs = now - start;

      if (diffMs <= 0) {
        setElapsed('00:00:00');
        return;
      }

      const diffSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
      const mins = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
      const secs = (diffSecs % 60).toString().padStart(2, '0');

      setElapsed(`${hrs}:${mins}:${secs}`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [startDate]);

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-yellow-400 font-mono text-xs font-semibold shadow-sm border border-slate-800">
      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
      <Clock className="h-3.5 w-3.5" />
      {elapsed}
    </span>
  );
};

export default function TicketCard({ data, onStart, activeActions }) {
  if (!data) return null;

  // Unpack envelope if it is an intervention object containing a nested ticket
  const isIntervention = data.hasOwnProperty('ticket') && data.ticket !== null;
  const ticket = isIntervention ? data.ticket : data;
  const ticketId = ticket.id;
  const interventionId = isIntervention ? data.id : null;

  const { titre, description, priorite, statut, demandeur, equipement, dateCreation } = ticket;
  const dateDebut = isIntervention ? data.dateDebut : null;
  const actionADistance = isIntervention ? data.actionADistance : null;
  const surSiteEffectue = isIntervention ? data.surSiteEffectue : false;
  const manipulationLourdeEffectue = isIntervention ? data.manipulationLourdeEffectue : false;
  const rapport = isIntervention ? data.rapport : null;

  // Resolve status tags
  const getStatusConfig = (st) => {
    const s = String(st).toUpperCase();
    if (s === 'EN_ATTENTE' || s === 'PENDING') {
      return { label: 'En attente N1', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
    }
    if (s === 'EN_COURS_N1' || s === 'IN_PROGRESS_N1') {
      return { label: 'En cours N1', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    }
    if (s === 'ESCALADE_N2' || s === 'ESCALATED_N2') {
      return { label: 'Escaladé N2', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    }
    if (s === 'CLOTURE' || s === 'CLOSED') {
      return { label: 'Clôturé', bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500' };
    }
    return { label: st, bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  };

  // Resolve priority tags
  const getPriorityConfig = (pri) => {
    const p = String(pri).toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL' || p === 'CRITIQUE') {
      return { label: 'Critique', badge: 'bg-rose-50 text-rose-700 border border-rose-200', side: 'border-l-rose-500' };
    }
    if (p === 'MEDIUM' || p === 'MOYENNE' || p === 'MOYEN') {
      return { label: 'Moyenne', badge: 'bg-amber-50 text-amber-700 border border-amber-200', side: 'border-l-amber-500' };
    }
    return { label: 'Normale', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', side: 'border-l-emerald-500' };
  };

  const statusConfig = getStatusConfig(statut);
  const priorityConfig = getPriorityConfig(priorite);
  const isEnCours = String(statut).toUpperCase() === 'EN_COURS_N1' || String(statut).toUpperCase() === 'IN_PROGRESS_N1';
  const isEnAttente = String(statut).toUpperCase() === 'EN_ATTENTE' || String(statut).toUpperCase() === 'PENDING';

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-150 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full border-l-4 ${priorityConfig.side} animate-fade-in`}
    >
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Ticket #{ticketId} {isIntervention && <span className="text-slate-300">/ Interv #{interventionId}</span>}
            </span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${priorityConfig.badge}`}>
                {priorityConfig.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border inline-flex items-center gap-1 ${statusConfig.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Chrono Overlay */}
          {isEnCours && dateDebut && (
            <div className="mb-4">
              <LiveTimer startDate={dateDebut} />
            </div>
          )}

          {/* Title & Description */}
          <h4 className="text-slate-800 font-bold text-base leading-snug mb-2 hover:text-emerald-700 transition-colors line-clamp-2">
            {titre}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
            {description}
          </p>

          {/* Details segment */}
          <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2 text-xs">
              <Cpu className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-slate-400">Équipement:</span>
              <span className="font-semibold text-slate-700 truncate">
                {equipement?.nom || 'Inconnu'} {equipement?.reference ? `[${equipement.reference}]` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-400">Demandeur:</span>
              <span className="font-semibold text-slate-700">
                {demandeur ? `${demandeur.prenom} ${demandeur.nom}` : 'Non spécifié'}
              </span>
            </div>
            {dateCreation && (
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400">Créé le:</span>
                <span className="text-slate-600 font-medium">
                  {new Date(dateCreation).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>

          {/* Log Details for active or historically finalized interventions */}
          {(actionADistance || rapport || dateDebut || surSiteEffectue || manipulationLourdeEffectue) && (
            <div className="border-t border-slate-100 pt-3 mt-3 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compte Rendu Technique</span>
              
              {surSiteEffectue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold w-fit">
                  ✓ Intervention sur site effectuée
                </span>
              )}
              {manipulationLourdeEffectue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-bold w-fit">
                  ⚠️ Manipulation de matériel lourd
                </span>
              )}

              {actionADistance && (
                <div className="bg-slate-50 border-l-2 border-emerald-500 p-2 rounded text-xs text-slate-600 flex items-start gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[10px] text-emerald-700 block">Action à distance</span>
                    {actionADistance}
                  </div>
                </div>
              )}
              {rapport && (
                <div className="bg-slate-50 border-l-2 border-slate-600 p-2 rounded text-xs text-slate-600 flex items-start gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[10px] text-slate-700 block">Rapport final</span>
                    {rapport}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          {isEnAttente && onStart && (
            <button
              onClick={() => onStart(ticketId)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus:outline-none"
            >
              <Play className="h-4 w-4 fill-white" />
              🚀 Prendre en charge
            </button>
          )}

          {isEnCours && activeActions && isIntervention && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => activeActions.onAddAction(interventionId)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold transition-all focus:outline-none"
              >
                📝 Actions N1
              </button>
              
              <button
                onClick={() => activeActions.onTerminate(data)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm focus:outline-none"
              >
                <Check className="h-3.5 w-3.5" /> Terminer
              </button>

              <button
                onClick={() => activeActions.onEscalate(data)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-[11px] font-bold transition-all shadow-sm col-span-2 focus:outline-none"
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> Escalader au Niveau N2
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}