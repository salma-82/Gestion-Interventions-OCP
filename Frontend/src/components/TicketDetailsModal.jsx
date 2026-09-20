import React from 'react';

export default function TicketModal({ ticket, onClose }) {
  if (!ticket) return null;

  // ── Status config ──────────────────────────────────────────
  const statusConfig = (() => {
    const s = String(ticket.statut || '').toUpperCase();
    if (s === 'PENDING' || s === 'EN_ATTENTE' || s === 'OUVERT')
      return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', dot: '#f97316', pulse: true };
    if (s.includes('COURS') || s.includes('PROGRESS'))
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6', pulse: true };
    if (s === 'RESOLU' || s === 'CLOTURE' || s === 'CLOSED' || s === 'TERMINEE')
      return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#22c55e', pulse: false };
    if (s.includes('ESCALA'))
      return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', dot: '#f43f5e', pulse: false };
    return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8', pulse: false };
  })();

  // ── Priority config ────────────────────────────────────────
  const priorityConfig = (() => {
    const p = String(ticket.priorite || '').toUpperCase();
    if (p === 'URGENT' || p === 'HIGH')
      return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' };
    if (p === 'MOYENNE' || p === 'MEDIUM')
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  })();

  const telephone = ticket.demandeur?.telephone || ticket.demandeur?.tel || 'Non spécifié';

  // ── Inline styles ──────────────────────────────────────────
  const styles = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(15,23,42,0.5)',
      backdropFilter: 'blur(6px)',
    },
    modal: {
      background: '#fff',
      borderRadius: '18px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 30px 60px -10px rgba(15,23,42,0.3)',
      width: '700px',
      maxWidth: '95%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    // HEADER
    header: {
      position: 'sticky', top: 0, zIndex: 10,
      background: '#fff',
      borderBottom: '1px solid #f1f5f9',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    },
    headerLeft: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    ticketId: {
      fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px', margin: 0,
    },
    badgesRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    statusBadge: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
      border: `1px solid ${statusConfig.border}`,
      backgroundColor: statusConfig.bg, color: statusConfig.color,
      letterSpacing: '0.3px', textTransform: 'uppercase',
    },
    statusDot: {
      width: '7px', height: '7px', borderRadius: '50%',
      backgroundColor: statusConfig.dot, flexShrink: 0,
    },
    priorityBadge: {
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
      border: `1px solid ${priorityConfig.border}`,
      backgroundColor: priorityConfig.bg, color: priorityConfig.color,
      letterSpacing: '0.3px', textTransform: 'uppercase',
    },
    closeBtn: {
      width: '34px', height: '34px', borderRadius: '10px',
      border: '1px solid #e2e8f0', background: '#f8fafc',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#64748b', flexShrink: 0,
      transition: 'background 0.15s, color 0.15s',
    },
    // BODY
    body: {
      overflowY: 'auto', padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: '16px',
      background: '#f8fafc',
    },
    // CARDS
    card: {
      background: '#fff', borderRadius: '14px',
      border: '1px solid #e8edf5',
      boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
      padding: '20px',
    },
    cardTitle: {
      fontSize: '10px', fontWeight: 800, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '1px',
      display: 'flex', alignItems: 'center', gap: '6px',
      marginBottom: '14px', paddingBottom: '10px',
      borderBottom: '1px solid #f1f5f9',
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px',
    },
    // FIELD ROWS
    fieldLabel: {
      fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginBottom: '2px',
    },
    fieldValue: {
      fontSize: '14px', color: '#1e293b', fontWeight: 600,
    },
    fieldRow: {
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      paddingBottom: '12px', marginBottom: '12px',
      borderBottom: '1px solid #f8fafc',
    },
    iconBox: {
      width: '32px', height: '32px', borderRadius: '8px',
      background: '#f1f5f9', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    descriptionBox: {
      background: '#f8fafc', borderRadius: '10px',
      border: '1px solid #e8edf5', padding: '14px',
      fontSize: '13px', color: '#475569', lineHeight: '1.6',
      whiteSpace: 'pre-wrap', marginTop: '8px',
    },
    dateRow: {
      display: 'flex', alignItems: 'center', gap: '6px',
      fontSize: '12px', color: '#94a3b8',
      marginTop: '14px', paddingTop: '12px',
      borderTop: '1px solid #f1f5f9',
    },
    codeBadge: {
      fontFamily: 'monospace', fontSize: '12px', fontWeight: 700,
      background: '#f1f5f9', color: '#475569',
      border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px',
    },
    // FOOTER
    footer: {
      position: 'sticky', bottom: 0, zIndex: 10,
      background: '#fff', borderTop: '1px solid #f1f5f9',
      padding: '14px 24px',
      display: 'flex', justifyContent: 'flex-end',
    },
    closeFooterBtn: {
      padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
      background: '#f1f5f9', color: '#475569',
      border: '1px solid #e2e8f0', cursor: 'pointer',
      transition: 'background 0.15s',
    },
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>

        {/* ── HEADER ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.ticketId}>Ticket #{ticket.id}</h2>
            <div style={styles.badgesRow}>
              <span style={styles.statusBadge}>
                <span style={styles.statusDot} />
                {ticket.statut}
              </span>
              {ticket.priorite && (
                <span style={styles.priorityBadge}>
                  ⚑ {ticket.priorite}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            aria-label="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── BODY ── */}
        <div style={styles.body}>

          {/* CARD: INFORMATIONS TICKET */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Informations Ticket
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={styles.fieldLabel}>Objet / Titre</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: '1.4' }}>
                {ticket.titre}
              </div>
            </div>

            <div>
              <div style={styles.fieldLabel}>Description</div>
              <div style={styles.descriptionBox}>
                <div style={styles.card}>
  <div style={styles.cardTitle}>Diagnostic</div>
  <div style={styles.descriptionBox}>{ticket.diagnostic || 'Non fourni'}</div>
</div>
<div style={styles.card}>
  <div style={styles.cardTitle}>Actions réalisées</div>
  <div style={styles.descriptionBox}>{ticket.actionsRealisees || 'Aucune action renseignée'}</div>
</div>
<div style={styles.card}>
  <div style={styles.cardTitle}>Résultat</div>
  <div style={styles.descriptionBox}>{ticket.resultat || 'Non spécifié'}</div>
</div>
<div style={styles.card}>
  <div style={styles.cardTitle}>Commentaire escalade N2</div>
  <div style={styles.descriptionBox}>{ticket.commentaireEscalade || 'Aucun commentaire'}</div>
</div>
<div style={styles.card}>
  <div style={styles.cardTitle}>Temps passé</div>
  <div style={styles.descriptionBox}>{ticket.tempsPasse ? `${ticket.tempsPasse} min` : 'Non spécifié'}</div>
</div>
              </div>
            </div>

            <div style={styles.dateRow}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Créé le :&nbsp;
              <span style={{ fontWeight: 600, color: '#475569' }}>
                {new Date(ticket.dateCreation).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          {/* GRID 2 COLONNES */}
          <div style={styles.grid2}>

            {/* CARD: DEMANDEUR */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Demandeur
              </div>

              {/* Nom */}
              <div style={{ ...styles.fieldRow }}>
                <div style={styles.iconBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <div style={styles.fieldLabel}>Nom & Prénom</div>
                  <div style={styles.fieldValue}>
                    {ticket.demandeur?.nom} {ticket.demandeur?.prenom}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ ...styles.fieldRow }}>
                <div style={styles.iconBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>
                </div>
                <div>
                  <div style={styles.fieldLabel}>Email</div>
                  <a
                    href={`mailto:${ticket.demandeur?.email}`}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    {ticket.demandeur?.email || 'Non renseigné'}
                  </a>
                </div>
              </div>

              {/* Téléphone */}
              <div style={{ ...styles.fieldRow, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                <div style={styles.iconBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.62 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <div style={styles.fieldLabel}>Téléphone</div>
                  <a
                    href={`tel:${telephone}`}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', textDecoration: 'none', fontFamily: 'monospace' }}
                  >
                    {telephone}
                  </a>
                </div>
              </div>
            </div>

            {/* CARD: ÉQUIPEMENT */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                Équipement
              </div>

              {/* Nom équipement */}
              <div style={{ ...styles.fieldRow }}>
                <div style={styles.iconBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div>
                  <div style={styles.fieldLabel}>Nom Équipement</div>
                  <div style={styles.fieldValue}>
                    {ticket.equipement?.nom || 'Non spécifié'}
                  </div>
                </div>
              </div>

              {/* Code inventaire */}
              <div style={{ ...styles.fieldRow }}>
                <div style={styles.iconBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div>
                  <div style={styles.fieldLabel}>Code inventaire</div>
                  <span style={styles.codeBadge}>
                    {ticket.equipement?.codeInventaire || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Localisation */}
              {ticket.equipement?.localisation && (
                <div style={{ ...styles.fieldRow, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                  <div style={styles.iconBox}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Localisation</div>
                    <div style={styles.fieldValue}>{ticket.equipement.localisation}</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={styles.footer}>
          <button
            onClick={onClose}
            style={styles.closeFooterBtn}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}