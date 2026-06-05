import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Cpu,
  User,
  Calendar,
  Hash,
  MapPin,
  Wrench,
  Radio,
  Package,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Clock,
  Stethoscope,
  ClipboardList,
  BadgeCheck,
  Timer
} from 'lucide-react';
import toast from 'react-hot-toast';
import './ReportModal.css';

// API for saving the rapport
import api from '../services/api';

export default function ReportModal({
  isOpen,
  onClose,
  onSubmitClose,
  onSubmitEscalate,
  intervention
}) {
  // Action fields (saved via /actions endpoint)
  const [actionADistance, setActionADistance] = useState('');
  const [surSiteEffectue, setSurSiteEffectue] = useState(false);
  const [manipulationLourdeEffectue, setManipulationLourdeEffectue] = useState(false);

  // Rapport fields (saved via /rapport endpoint — required for escalade!)
  const [diagnostic, setDiagnostic] = useState('');
  const [actionsRealisees, setActionsRealisees] = useState('');
  const [resultat, setResultat] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [tempsPasse, setTempsPasse] = useState('');

  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'close' | 'escalate' | null

  useEffect(() => {
    if (isOpen && intervention) {
      setActionADistance(intervention.actionADistance || '');
      setSurSiteEffectue(intervention.surSiteEffectue || false);
      setManipulationLourdeEffectue(intervention.manipulationLourdeEffectue || false);
      setDiagnostic(intervention.diagnostic || '');
      setActionsRealisees(intervention.actionsRealisees || '');
      setResultat(intervention.resultat || '');
      setCommentaire(intervention.commentaire || '');
      setTempsPasse(intervention.tempsPasse || '');
    }
  }, [isOpen, intervention]);

  if (!isOpen || !intervention) return null;

  const ticket = intervention.ticket || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const priorityConfig = {
    HIGH: { label: 'Critique', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    MEDIUM: { label: 'Moyenne', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    LOW: { label: 'Normale', color: '#047857', bg: '#f0fdf4', border: '#bbf7d0' },
  };
  const pKey = String(ticket.priorite || 'LOW').toUpperCase();
  const pConfig = priorityConfig[pKey] || priorityConfig.LOW;

  // All 5 rapport fields are required for escalade
  const isRapportComplete =
    diagnostic.trim().length > 0 &&
    actionsRealisees.trim().length > 0 &&
    resultat.trim().length > 0 &&
    commentaire.trim().length > 0 &&
    tempsPasse.trim().length > 0;

  // For close, commentaire alone is sufficient
  const isCloseValid = commentaire.trim().length > 0;

  const handleAction = async (type) => {
    if (type === 'escalate' && !isRapportComplete) {
      toast.error('Tous les champs du rapport doivent être remplis pour escalader vers N2.', {
        icon: '⚠️',
        style: { fontWeight: 600 },
        duration: 4000
      });
      return;
    }

    if (type === 'close' && !isCloseValid) {
      toast.error('Le commentaire technique est obligatoire avant de clôturer.', {
        icon: '⚠️',
        style: { fontWeight: 600 }
      });
      return;
    }

    setLoading(true);
    setPendingAction(type);
    try {
      // Step 1: Save the full rapport (diagnostic, actionsRealisees, resultat, commentaire, tempsPasse)
      // This is required by the backend before escalade
      await api.put(`/technicien/interventions/${intervention.id}/rapport`, {
        diagnostic,
        actionsRealisees,
        resultat,
        commentaire,
        tempsPasse
      });

      // Step 2: Save action details (actionADistance, surSiteEffectue, manipulationLourdeEffectue)
      await api.put(`/technicien/interventions/${intervention.id}/actions`, {
        actionADistance,
        surSiteEffectue,
        manipulationLourdeEffectue
      });

      // Step 3: Execute the action (close or escalate)
      if (type === 'close') {
        await onSubmitClose(intervention.id, {
          actionADistance,
          surSiteEffectue,
          manipulationLourdeEffectue,
          commentaire,
          diagnostic,
          actionsRealisees,
          resultat,
          tempsPasse
        });
      } else if (type === 'escalate') {
        await onSubmitEscalate(intervention.id, {
          actionADistance,
          surSiteEffectue,
          manipulationLourdeEffectue,
          commentaire,
          diagnostic,
          actionsRealisees,
          resultat,
          tempsPasse
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || "Erreur inconnue";
      toast.error("Erreur: " + errMsg, { icon: '❌', duration: 5000 });
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="rm2-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rm2-modal">

        {/* ── HEADER ── */}
        <div className="rm2-header">
          <div className="rm2-header-left">
            <div className="rm2-header-icon">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="rm2-header-title">Rapport d'Intervention N1</h2>
              <p className="rm2-header-sub">Support Technicien N1 — OCP Khouribga</p>
            </div>
          </div>
          <button className="rm2-close-btn" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {/* ── META STRIP ── */}
        <div className="rm2-meta-strip">
          <span className="rm2-meta-item">
            <Hash size={12} /> Réf. #{intervention.id}
          </span>
          <span className="rm2-meta-sep">·</span>
          <span className="rm2-meta-item">
            <Calendar size={12} /> {dateStr}
          </span>
          <span className="rm2-meta-sep">·</span>
          <span className="rm2-meta-item">
            <Clock size={12} /> {timeStr}
          </span>
        </div>

        {/* ── BODY ── */}
        <div className="rm2-body">

          {/* ── SECTION 1 : Informations du ticket ── */}
          <section className="rm2-section">
            <div className="rm2-section-label">
              <ChevronRight size={14} />
              Informations du ticket
            </div>

            <div className="rm2-ticket-card">
              <div className="rm2-ticket-card-header">
                <div className="rm2-ticket-priority-dot" style={{ backgroundColor: pConfig.color }} />
                <span className="rm2-ticket-ref">TICKET #{ticket.id}</span>
                <span
                  className="rm2-priority-badge"
                  style={{ color: pConfig.color, background: pConfig.bg, border: `1px solid ${pConfig.border}` }}
                >
                  {pConfig.label}
                </span>
              </div>
              <h3 className="rm2-ticket-title">{ticket.titre || '—'}</h3>
              {ticket.description && (
                <p className="rm2-ticket-desc">{ticket.description}</p>
              )}
              <div className="rm2-ticket-info-grid">
                {ticket.equipement?.nom && (
                  <div className="rm2-info-item">
                    <Cpu size={13} className="rm2-info-icon" />
                    <span>{ticket.equipement.nom}</span>
                  </div>
                )}
                {ticket.demandeur?.nom && (
                  <div className="rm2-info-item">
                    <User size={13} className="rm2-info-icon" />
                    <span>{ticket.demandeur.nom}</span>
                  </div>
                )}
                {ticket.localisation && (
                  <div className="rm2-info-item">
                    <MapPin size={13} className="rm2-info-icon" />
                    <span>{ticket.localisation}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── SECTION 2 : Actions réalisées ── */}
          <section className="rm2-section">
            <div className="rm2-section-label">
              <ChevronRight size={14} />
              Actions de support à distance
            </div>

            <div className="rm2-field">
              <label className="rm2-label">
                <Radio size={13} /> Action à distance effectuée
              </label>
              <input
                type="text"
                className="rm2-input"
                placeholder="Ex : Analyse des logs, réinitialisation du port, test de connectivité..."
                value={actionADistance}
                onChange={(e) => setActionADistance(e.target.value)}
              />
            </div>

            <div className="rm2-checkboxes-grid">
              <label className={`rm2-checkbox-card ${surSiteEffectue ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={surSiteEffectue}
                  onChange={(e) => setSurSiteEffectue(e.target.checked)}
                  className="rm2-checkbox-input"
                />
                <div className="rm2-checkbox-icon-wrap" style={{ background: surSiteEffectue ? '#f0fdf4' : '#f8fafc', color: surSiteEffectue ? '#047857' : '#94a3b8' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="rm2-checkbox-title">Intervention sur site</p>
                  <p className="rm2-checkbox-sub">Déplacement physique sur le terrain</p>
                </div>
                {surSiteEffectue && <CheckCircle size={16} className="rm2-checkbox-check" />}
              </label>

              <label className={`rm2-checkbox-card ${manipulationLourdeEffectue ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={manipulationLourdeEffectue}
                  onChange={(e) => setManipulationLourdeEffectue(e.target.checked)}
                  className="rm2-checkbox-input"
                />
                <div className="rm2-checkbox-icon-wrap" style={{ background: manipulationLourdeEffectue ? '#fffbeb' : '#f8fafc', color: manipulationLourdeEffectue ? '#d97706' : '#94a3b8' }}>
                  <Package size={18} />
                </div>
                <div>
                  <p className="rm2-checkbox-title">Matériel lourd</p>
                  <p className="rm2-checkbox-sub">Outillage lourd / levage utilisé</p>
                </div>
                {manipulationLourdeEffectue && <CheckCircle size={16} className="rm2-checkbox-check" />}
              </label>
            </div>
          </section>

          {/* ── SECTION 3 : Rapport technique complet (obligatoire pour escalade) ── */}
          <section className="rm2-section">
            <div className="rm2-section-label">
              <ChevronRight size={14} />
              Rapport technique
              <span className="rm2-section-hint">— Obligatoire pour escalader</span>
            </div>

            <div className="rm2-field">
              <label className="rm2-label">
                <Stethoscope size={13} /> Diagnostic
                <span className="rm2-required">*</span>
              </label>
              <textarea
                className="rm2-textarea rm2-textarea-sm"
                placeholder="Décrivez le diagnostic posé sur l'incident (ex: Panne réseau au switch principal)..."
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                rows={2}
              />
            </div>

            <div className="rm2-field">
              <label className="rm2-label">
                <ClipboardList size={13} /> Actions réalisées
                <span className="rm2-required">*</span>
              </label>
              <textarea
                className="rm2-textarea rm2-textarea-sm"
                placeholder="Listez les actions effectuées (ex: Redémarrage du service, vérification câblage)..."
                value={actionsRealisees}
                onChange={(e) => setActionsRealisees(e.target.value)}
                rows={2}
              />
            </div>

            <div className="rm2-field">
              <label className="rm2-label">
                <BadgeCheck size={13} /> Résultat (Problème résolu ?)
                <span className="rm2-required">*</span>
              </label>
              <input
                type="text"
                className="rm2-input"
                placeholder="Ex: Problème non résolu — nécessite intervention sur site N2"
                value={resultat}
                onChange={(e) => setResultat(e.target.value)}
              />
            </div>

            <div className="rm2-fields-row">
              <div className="rm2-field rm2-field-grow">
                <label className="rm2-label">
                  <MessageSquare size={13} /> Commentaire technique
                  <span className="rm2-required">*</span>
                </label>
                <textarea
                  className="rm2-textarea rm2-textarea-sm"
                  placeholder="Observations finales, motif d'escalade ou résolution..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="rm2-field rm2-field-time">
                <label className="rm2-label">
                  <Timer size={13} /> Temps passé
                  <span className="rm2-required">*</span>
                </label>
                <input
                  type="text"
                  className="rm2-input"
                  placeholder="Ex: 30 min"
                  value={tempsPasse}
                  onChange={(e) => setTempsPasse(e.target.value)}
                />
              </div>
            </div>

            {/* Validation indicator */}
            {!isRapportComplete && (
              <div className="rm2-validation-hint">
                <AlertTriangle size={13} />
                <span>Tous les champs du rapport sont obligatoires pour l'escalade vers N2</span>
              </div>
            )}
            {isRapportComplete && (
              <div className="rm2-validation-ok">
                <CheckCircle size={13} />
                <span>Rapport complet — prêt pour escalade ou clôture</span>
              </div>
            )}
          </section>

        </div>

        {/* ── FOOTER ── */}
        <div className="rm2-footer">
          <button
            className="rm2-btn rm2-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>

          <div className="rm2-footer-actions">
            {/* Escalader N2 */}
            <button
              className="rm2-btn rm2-btn-escalate"
              onClick={() => handleAction('escalate')}
              disabled={loading || !isRapportComplete}
              title="Transmettre l'intervention au support N2"
            >
              {loading && pendingAction === 'escalate' ? (
                <Loader2 size={16} className="rm2-spin" />
              ) : (
                <ShieldAlert size={16} />
              )}
              Escalader vers N2
            </button>

            {/* Clôturer */}
            <button
              className="rm2-btn rm2-btn-close"
              onClick={() => handleAction('close')}
              disabled={loading || !isCloseValid}
              title="Clôturer l'intervention comme résolue"
            >
              {loading && pendingAction === 'close' ? (
                <Loader2 size={16} className="rm2-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Clôturer l'intervention
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
