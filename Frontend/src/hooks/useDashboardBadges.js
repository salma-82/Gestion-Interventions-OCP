import React from 'react';

export const useDashboardBadges = () => {
  const getPriorityBadge = (priorite, variant = 'n1') => {
    const p = String(priorite).toUpperCase();
    const baseClass = variant === 'n1' ? 't1d-badge' : variant === 'n2' ? 'n2-badge' : 'n3-badge';

    if (p === 'HIGH' || p === 'CRITIQUE') {
      return <span className={`${baseClass} ${baseClass}-high`}>Urgent</span>;
    }
    if (p === 'MEDIUM' || p === 'MOYEN') {
      return <span className={`${baseClass} ${baseClass}-medium`}>Moyenne</span>;
    }
    return <span className={`${baseClass} ${baseClass}-low`}>Normale</span>;
  };

  const getStatusBadge = (statut, variant = 'n1') => {
    const s = String(statut).toUpperCase();
    const baseClass = variant === 'n1' ? 't1d-status' : variant === 'n2' ? 'n2-status' : 'n3-status';

    if (s === 'EN_ATTENTE' || s === 'PENDING' || s === 'OUVERT') {
      return (
        <span className={`${baseClass} ${baseClass}-pending`}>
          <span className={`${baseClass}-dot`} />
          En attente
        </span>
      );
    }
    if (s === 'EN_COURS' || s === 'EN_COURS_N1' || s === 'IN_PROGRESS_N1') {
      return (
        <span className={`${baseClass} ${baseClass}-active`}>
          <span className={`${baseClass}-dot`} />
          En cours
        </span>
      );
    }
    if (s === 'CLOTURE' || s === 'CLOSED') {
      return (
        <span className={`${baseClass} ${baseClass}-closed`}>
          <span className={`${baseClass}-dot`} />
          Clôturé
        </span>
      );
    }
    if (s === 'ESCALADE_N2' || s === 'ESCALATED_N2') {
      return (
        <span className={`${baseClass} ${baseClass}-escalated`}>
          <span className={`${baseClass}-dot`} />
          Escaladé N2
        </span>
      );
    }
    if (s === 'ESCALADE_N3' || s === 'ESCALATED_N3') {
      return (
        <span className={`${baseClass} ${baseClass}-escalated3`}>
          <span className={`${baseClass}-dot`} />
          Escaladé N3
        </span>
      );
    }
    return (
      <span className={`${baseClass} ${baseClass}-pending`}>
        <span className={`${baseClass}-dot`} />
        {statut}
      </span>
    );
  };

  return { getPriorityBadge, getStatusBadge };
};
