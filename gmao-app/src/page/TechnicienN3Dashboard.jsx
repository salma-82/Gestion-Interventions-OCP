import React, { useState, useEffect } from 'react';
import { Play, FileText, Settings, CheckCircle, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import TicketCard from '../components/TicketCard';
import InterventionModal from '../components/InterventionModal';
import NotificationBell from '../components/NotificationBell';
import {
  getEscalatedN3Tickets,
  startInterventionN2,
  saveAction,
  closeTicket,
  updateEquipmentStatus,
} from '../services/api';

const N3Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', title: '', fields: [] });

  const loadData = async () => {
    try {
      const data = await getEscalatedN3Tickets();
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
      title: 'Démarrer intervention lourde',
      fields: [
        { name: 'comment', label: 'Préparation technique', type: 'textarea', required: false, placeholder: 'Outillage spécifique...' },
      ],
      onSubmit: async () => {
        await startInterventionN2(ticket.id);
        toast.success('Intervention démarrée');
        loadData();
      },
    });
  };

  const handleSaveAction = (intervention) => {
    setModalConfig({
      isOpen: true,
      type: 'action',
      title: 'Ajouter une manipulation lourde',
      fields: [
        { name: 'action', label: 'Action effectuée', type: 'textarea', required: true, rows: 4, placeholder: 'Détail technique...' },
      ],
      onSubmit: async (data) => {
        await saveAction(intervention.id, data);
        toast.success('Action enregistrée');
        loadData();
      },
    });
  };

  const handleUpdateEquipment = (ticket) => {
    setModalConfig({
      isOpen: true,
      type: 'equipment',
      title: 'Modifier l\'état de l\'équipement',
      fields: [
        {
          name: 'status',
          label: 'Nouvel état',
          type: 'select',
          required: true,
          options: [
            { value: 'OPERATIONNEL', label: 'Opérationnel' },
            { value: 'EN_PANNE', label: 'En panne' },
            { value: 'EN_MAINTENANCE', label: 'En maintenance' },
            { value: 'HORS_SERVICE', label: 'Hors service' },
          ],
        },
      ],
      onSubmit: async (data) => {
        await updateEquipmentStatus(ticket.equipmentId, data.status);
        toast.success(`État équipement mis à jour: ${data.status}`);
        loadData();
      },
    });
  };

  const handleCloseTicket = (intervention) => {
    setModalConfig({
      isOpen: true,
      type: 'close',
      title: 'Clôturer le ticket',
      fields: [
        { name: 'report', label: 'Rapport technique final', type: 'textarea', required: true, rows: 5, placeholder: 'Solution apportée...' },
      ],
      onSubmit: async (data) => {
        await closeTicket(intervention.id, data.report);
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
          <h1 className="text-3xl font-bold text-white">Dashboard N3</h1>
          <p className="text-gray-400 mt-1">Expertise technique et gestion équipements</p>
        </div>
        <NotificationBell />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tickets escaladés N3</p>
              <p className="text-2xl font-bold text-white">{tickets.length}</p>
            </div>
            <Wrench className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Tickets critiques</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            actions={[
              { label: 'Démarrer', icon: <Play className="w-3 h-3" />, handler: () => handleStartIntervention(ticket) },
              { label: 'Action', icon: <FileText className="w-3 h-3" />, handler: () => handleSaveAction({ id: ticket.interventionId }) },
              { label: 'État équipement', icon: <Settings className="w-3 h-3" />, handler: () => handleUpdateEquipment(ticket) },
              { label: 'Clôturer', icon: <CheckCircle className="w-3 h-3" />, handler: () => handleCloseTicket({ id: ticket.interventionId }) },
            ]}
          />
        ))}
        {tickets.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-8">Aucun ticket escaladé N3</div>
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

export default N3Dashboard;