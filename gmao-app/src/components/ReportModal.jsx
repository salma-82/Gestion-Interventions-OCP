import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Settings, ShieldAlert, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportModal({ isOpen, onClose, onSubmitClose, onSubmitEscalate, intervention }) {
  const [actionADistance, setActionADistance] = useState('');
  const [surSiteEffectue, setSurSiteEffectue] = useState(false);
  const [manipulationLourdeEffectue, setManipulationLourdeEffectue] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && intervention) {
      setActionADistance(intervention.actionADistance || '');
      setSurSiteEffectue(intervention.surSiteEffectue || false);
      setManipulationLourdeEffectue(intervention.manipulationLourdeEffectue || false);
      setCommentaire('');
    }
  }, [isOpen, intervention]);

  if (!isOpen || !intervention) return null;

  const ticket = intervention.ticket || {};

  const handleAction = async (type) => {
    if (!commentaire.trim()) {
      toast.error('Veuillez remplir le commentaire technique obligatoire.');
      return;
    }

    setLoading(true);
    try {
      if (type === 'close') {
        await onSubmitClose(intervention.id, {
          actionADistance,
          surSiteEffectue,
          manipulationLourdeEffectue,
          commentaire
        });
      } else if (type === 'escalate') {
        await onSubmitEscalate(intervention.id, {
          actionADistance,
          surSiteEffectue,
          manipulationLourdeEffectue,
          commentaire
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'exécution du rapport.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-base">Rapport Technique Obligatoire</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-full p-1 transition-all hover:bg-slate-800 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto flex flex-col gap-5">
          
          {/* Info Card */}
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex flex-col gap-1 text-xs">
            <span className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider">Ticket en cours</span>
            <h4 className="font-bold text-slate-850 text-sm mt-1">{ticket.titre}</h4>
            <div className="flex items-center gap-1.5 text-slate-500 mt-2">
              <Cpu className="h-3.5 w-3.5" />
              <span>Équipement : {ticket.equipement?.nom || 'Inconnu'}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            
            {/* Action à distance */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Action à distance effectuée <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Analyse de logs à distance, réinitialisation de port..."
                value={actionADistance}
                onChange={(e) => setActionADistance(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Checkbox options (styled toggles) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {/* Sur site */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 hover:bg-slate-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={surSiteEffectue}
                  onChange={(e) => setSurSiteEffectue(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 h-4.5 w-4.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Intervention sur site</span>
                  <span className="text-[10px] text-slate-400">Présence sur le terrain</span>
                </div>
              </label>

              {/* Manipulation lourde */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 hover:bg-slate-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={manipulationLourdeEffectue}
                  onChange={(e) => setManipulationLourdeEffectue(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 h-4.5 w-4.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Matériel lourd</span>
                  <span className="text-[10px] text-slate-400">Levage, outillage lourd</span>
                </div>
              </label>
            </div>

            {/* Commentaire technique obligatoire */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Commentaire technique final / Motif <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Décrivez en détail la résolution finale ou le motif d'escalade..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                required
              ></textarea>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all focus:outline-none"
            disabled={loading}
          >
            Annuler
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            {/* Escalade button */}
            <button
              onClick={() => handleAction('escalate')}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold shadow-sm transition-all focus:outline-none"
              disabled={loading || !commentaire.trim()}
            >
              <AlertTriangle className="h-4 w-4" />
              Escalader N2
            </button>

            {/* Clôturer button */}
            <button
              onClick={() => handleAction('close')}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all focus:outline-none"
              disabled={loading || !commentaire.trim()}
            >
              <CheckCircle className="h-4 w-4" />
              Clôturer (CLOSED)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
