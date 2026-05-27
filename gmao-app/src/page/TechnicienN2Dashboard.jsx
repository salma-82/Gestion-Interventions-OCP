import React, { useState, useEffect } from 'react';
import { Play, FileText, ArrowUp, CheckCircle, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import TicketCard from '../components/TicketCard';
import InterventionModal from '../components/InterventionModal';
import NotificationBell from '../components/NotificationBell';
import {
  getEscalatedN2Tickets,
  startInterventionN2,
  saveAction,
  escalateToN3,
  closeTicket,
} from '../services/api';

const N2Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', title: '', fields: [] });

  const loadData = async () => {
    try {
      const data = await getEscalatedN2Tickets();
      setTickets(data);
    } catch (error) {
      toast.error('Erreur chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartIntervention = (ticket) => {
    setModalConfig({
      isOpen: true,
      type: 'start',
      title: 'Démarrer intervention sur site',
      fields: [
        { name: 'comment', label: 'Préparation', type: 'textarea', required: false, placeholder: 'Matériel nécessaire...' },
      ],
      onSubmit: async () => {
        await startInterventionN2(ticket.id);
        toast.success('Intervention démarrée');
        loadData();
      },
    });
  };

  const handleSaveAction = (interventionId) => {
    setModalConfig({
      isOpen: true,
      type: 'action',
      title: 'Ajouter une action',
      fields: [
        { name: 'action', label: 'Action effectuée', type: 'textarea', required: true, rows: 4, placeholder: 'Décrivez...' },
      ],
      onSubmit: async (data) => {
        await saveAction(interventionId, data);
        toast.success('Action enregistrée');
        loadData();
      },
    });
  };

  const handleEscalateToN3 = (interventionId) => {
    setModalConfig({
      isOpen: true,
      type: 'escalate',
      title: 'Escalader vers N3',
      fields: [
        { name: 'reason', label: 'Motif de l\'escalade', type: 'textarea', required: true, rows: 3, placeholder: 'Problème complexe nécessitant expertise...' },
      ],
      onSubmit: async (data) => {
        await escalateToN3(interventionId, data.reason);
        toast.success('Ticket escaladé vers N3');
        loadData();
      },
    });
  };

  const handleCloseTicket = (interventionId) => {
    setModalConfig({
      isOpen: true,
      type: 'close',
      title: 'Clôturer le ticket',
      fields: [
        { name: 'report', label: 'Rapport final', type: 'textarea', required: true, rows: 5, placeholder: 'Résolution...' },
      ],
      onSubmit: async (data) => {
        await closeTicket(interventionId, data.report);
        toast.success('Ticket clôturé');
        loadData();
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard N2</h1>
          <p className="text-gray-400 mt-1">Interventions sur site et escalades</p>
        </div>
        <NotificationBell />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tickets escaladés N2</p>
              <p className="text-2xl font-bold text-white">{tickets.length}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Tickets à traiter</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            actions={[
              { label: 'Démarrer', icon: <Play className="w-3 h-3" />, handler: () => handleStartIntervention(ticket) },
              { label: 'Action', icon: <FileText className="w-3 h-3" />, handler: () => handleSaveAction(ticket.interventionId) },
              { label: 'Escalader N3', icon: <ArrowUp className="w-3 h-3" />, handler: () => handleEscalateToN3(ticket.interventionId) },
              { label: 'Clôturer', icon: <CheckCircle className="w-3 h-3" />, handler: () => handleCloseTicket(ticket.interventionId) },
            ]}
          />
        ))}
        {tickets.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-8">Aucun ticket escaladé N2</div>
        )}
      </div>

      <InterventionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        fields={modalConfig.fields}
        onSubmit={modalConfig.onSubmit}
      />
    </div>
  );
};

export default N2Dashboard;