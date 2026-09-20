import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Clock, Check, ArrowUpRight, Cpu, User, Calendar, 
  AlertTriangle, FileText, CheckCircle, ShieldAlert, ChevronLeft 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Live timer helper
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
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-sm font-bold shadow-md border border-slate-800 animate-pulse">
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
      <Clock className="h-4 w-4" />
      <span>{elapsed}</span>
    </div>
  );
};

export default function FicheInterventionN1({ intervention, onSubmitClose, onSubmitEscalate, onBack }) {
  const [diagnostic, setDiagnostic] = useState('');
  const [testsRealises, setTestsRealises] = useState('');
  const [solutionAppliquee, setSolutionAppliquee] = useState('');
  const [commentaires, setCommentaires] = useState('');

  // Action Mode: 'close' (Clôturer) or 'escalate' (Escalader)
  const [actionMode, setActionMode] = useState('close'); 

  // Close specific fields
  const [cause, setCause] = useState('');
  const [duree, setDuree] = useState('15 min');

  // Escalation specific fields
  const [resultatObtenu, setResultatObtenu] = useState('');
  const [motifEscalade, setMotifEscalade] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (intervention) {
      setDiagnostic(intervention.diagnostic || '');
      setTestsRealises(intervention.testsRealises || '');
      setSolutionAppliquee(intervention.solutionAppliquee || '');
      setCommentaires(intervention.commentaire || '');
    }
  }, [intervention]);

  if (!intervention) return null;

  const ticket = intervention.ticket || {};
  const { titre, description, priorite, dateCreation, demandeur, equipement } = ticket;

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

  const priorityConfig = getPriorityConfig(priorite);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!diagnostic.trim()) {
      toast.error("Le diagnostic effectué est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      if (actionMode === 'close') {
        if (!solutionAppliquee.trim()) {
          toast.error("La solution appliquée est obligatoire pour clôturer.");
          setLoading(false);
          return;
        }
        
        const finalActionADistance = `Solution: ${solutionAppliquee}. Diagnostic: ${diagnostic}.`;
        const finalReportText = `Diagnostic: ${diagnostic}\nTests: ${testsRealises}\nCause: ${cause}\nSolution: ${solutionAppliquee}\nDurée: ${duree}\nCommentaires: ${commentaires}`;
        
        await onSubmitClose(intervention.id, {
          actionADistance: finalActionADistance,
          surSiteEffectue: false,
          manipulationLourdeEffectue: false,
          commentaire: finalReportText
        });
      } else {
        if (!motifEscalade.trim()) {
          toast.error("Le motif de l'escalade est obligatoire.");
          setLoading(false);
          return;
        }

        const finalActionADistance = `Diagnostic: ${diagnostic}. Tests tentés: ${testsRealises}.`;
        const finalReportText = `Diagnostic: ${diagnostic}\nActions effectuées: ${testsRealises}\nRésultat obtenu: ${resultatObtenu}\nMotif de l'escalade: ${motifEscalade}\nCommentaires: ${commentaires}`;
        
        await onSubmitEscalate(intervention.id, {
          actionADistance: finalActionADistance,
          surSiteEffectue: false,
          manipulationLourdeEffectue: false,
          commentaire: finalReportText
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none"
        >
          <ChevronLeft className="h-4 w-4" /> Retour à la liste
        </button>
        {intervention.dateDebut && <LiveTimer startDate={intervention.dateDebut} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ticket details */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="n1-card bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
              Intervention N1 en cours — Réf #{ticket.id}
            </span>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-snug mb-3">
              {titre}
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${priorityConfig.badge}`}>
                {priorityConfig.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-150 dark:border-blue-900">
                Statut: EN_COURS_N1
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col gap-3 text-xs mb-4">
              <span className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                Informations Demandeur & Matériel
              </span>
              
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] leading-none">Demandeur</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    {demandeur ? `${demandeur.prenom} ${demandeur.nom}` : 'Non spécifié'}
                  </span>
                  {demandeur?.email && (
                    <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">{demandeur.email}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] leading-none">Équipement</span>
                  <span className="font-bold text-slate-705 dark:text-slate-200 mt-0.5">
                    {equipement?.nom || 'Inconnu'}
                  </span>
                  {equipement?.codeInventaire && (
                    <span className="text-[10px] font-mono text-slate-450 dark:text-slate-400 mt-0.5">
                      Inv: {equipement.codeInventaire}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] leading-none">Date d'ouverture</span>
                  <span className="font-semibold text-slate-650 dark:text-slate-300 mt-0.5">
                    {dateCreation ? new Date(dateCreation).toLocaleString('fr-FR') : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Description du problème
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[180px] overflow-y-auto">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Work Area Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleFormSubmit} className="n1-card bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-5 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                Fiche d'Intervention N1 & Diagnostic
              </h4>
            </div>

            {/* Diagnostic Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Diagnostic effectué <span className="text-rose-500">*</span>
                </label>
                <textarea
                  placeholder="Décrivez les observations, symptômes constatés, état initial..."
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  required
                  disabled={loading}
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tests réalisés / Actions tentées
                </label>
                <textarea
                  placeholder="Ping réseau, redémarrage service, vérification connectique..."
                  value={testsRealises}
                  onChange={(e) => setTestsRealises(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  disabled={loading}
                ></textarea>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Solution appliquée
                </label>
                <textarea
                  placeholder="Solution technique mise en place (requis pour la clôture)..."
                  value={solutionAppliquee}
                  onChange={(e) => setSolutionAppliquee(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  disabled={loading}
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Commentaires techniques additionnels
                </label>
                <textarea
                  placeholder="Remarques éventuelles pour le demandeur ou le support..."
                  value={commentaires}
                  onChange={(e) => setCommentaires(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  disabled={loading}
                ></textarea>
              </div>
            </div>

            {/* Select Action Mode */}
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                Choisir l'issue de l'intervention
              </span>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setActionMode('close')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none border ${
                    actionMode === 'close'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" /> Résolu par N1 (Clôture)
                </button>

                <button
                  type="button"
                  onClick={() => setActionMode('escalate')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none border ${
                    actionMode === 'escalate'
                      ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" /> Escalader vers N2
                </button>
              </div>

              {/* Dynamic Sub-Form depending on close vs escalate */}
              <AnimatePresence mode="wait">
                {actionMode === 'close' ? (
                  <motion.div
                    key="close-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3 overflow-hidden border-t border-slate-100 dark:border-slate-800 pt-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Cause du problème <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Câble débranché, serveur planté..."
                          value={cause}
                          onChange={(e) => setCause(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required={actionMode === 'close'}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Durée d'intervention <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={duree}
                          onChange={(e) => setDuree(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          disabled={loading}
                        >
                          <option value="5 min">5 minutes</option>
                          <option value="15 min">15 minutes</option>
                          <option value="30 min">30 minutes</option>
                          <option value="1h">1 heure</option>
                          <option value="2h">2 heures</option>
                          <option value="plus de 2h">Plus de 2 heures</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="escalate-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3 overflow-hidden border-t border-slate-100 dark:border-slate-800 pt-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Résultat obtenu des tests <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Pas d'accès réseau local, écran noir..."
                          value={resultatObtenu}
                          onChange={(e) => setResultatObtenu(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required={actionMode === 'escalate'}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Motif de l'escalade <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Nécessite un déplacement sur site / changement matériel..."
                          value={motifEscalade}
                          onChange={(e) => setMotifEscalade(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required={actionMode === 'escalate'}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="submit"
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all focus:outline-none text-white ${
                  actionMode === 'close'
                    ? 'bg-emerald-650 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700 text-slate-900'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>Transmission en cours...</>
                ) : actionMode === 'close' ? (
                  <>
                    <Check className="h-4 w-4" /> Valider et Clôturer
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" /> Valider et Escalader N2
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
