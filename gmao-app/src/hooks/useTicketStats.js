import { useMemo } from 'react';

export const useTicketStats = (availableTickets, activeInterventions, historyInterventions) => {
  return useMemo(() => {
    const stats = {
      available: availableTickets.length,
      active: activeInterventions.length,
      closed: historyInterventions.filter(
        i => String(i.ticket?.statut).toUpperCase() === 'CLOTURE'
      ).length,
      escalated: historyInterventions.filter(
        i => String(i.ticket?.statut).toUpperCase().includes('ESCALADE')
      ).length,
    };

    const volumeChartData = [
      { name: 'Disponibles', tickets: stats.available, color: '#047857' },
      { name: 'En cours', tickets: stats.active, color: '#2563eb' },
      { name: 'Clôturés', tickets: stats.closed, color: '#64748b' },
      { name: 'Escaladés', tickets: stats.escalated, color: '#f59e0b' }
    ];

    const priorityChartData = [
      {
        name: 'Critique',
        tickets:
          availableTickets.filter(t => String(t.priorite).toUpperCase() === 'HIGH').length +
          activeInterventions.filter(i => String(i.ticket?.priorite).toUpperCase() === 'HIGH').length
      },
      {
        name: 'Moyenne',
        tickets:
          availableTickets.filter(t => String(t.priorite).toUpperCase() === 'MEDIUM').length +
          activeInterventions.filter(i => String(i.ticket?.priorite).toUpperCase() === 'MEDIUM').length
      },
      {
        name: 'Normale',
        tickets:
          availableTickets.filter(t => String(t.priorite).toUpperCase() === 'LOW').length +
          activeInterventions.filter(i => String(i.ticket?.priorite).toUpperCase() === 'LOW').length
      }
    ];

    return { stats, volumeChartData, priorityChartData };
  }, [availableTickets, activeInterventions, historyInterventions]);
};
