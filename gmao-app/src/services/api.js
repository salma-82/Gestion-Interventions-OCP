import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8080/api'; // À ajuster selon votre backend

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expirée, veuillez vous reconnecter');
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// ========== NOTIFICATIONS ==========
export const getNotifications = async (userId) => {
  const response = await api.get(`/notifications?userId=${userId}`);
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// ========== N1 ==========
// Backward compat helpers
export const getPendingTickets = async () => {
  const response = await api.get('/technicien/tickets?status=PENDING');
  return response.data;
};

export const startIntervention = async (ticketId) => {
  const response = await api.post('/technicien/interventions/start', { ticketId });
  return response.data;
};

export const saveAction = async (interventionId, actionData) => {
  const response = await api.put(`/technicien/interventions/${interventionId}/actions`, actionData);
  return response.data;
};

export const escalateToN2 = async (interventionId, reason) => {
  const response = await api.post(`/technicien/interventions/${interventionId}/escalader`, { reason, targetLevel: 'N2' });
  return response.data;
};

export const closeTicket = async (interventionId, report) => {
  const response = await api.post(`/technicien/interventions/${interventionId}/cloturer`, { report });
  return response.data;
};

// --- N1 API ENDPOINTS — mapped to Spring Boot TechnicienController ---
export const getAvailableTickets = async () => {
  const response = await api.get('/technicien/tickets/disponibles');
  return response.data;
};

export const getMyInterventions = async (technicienId) => {
  const response = await api.get(`/technicien/interventions/mes?technicienId=${technicienId}`);
  return response.data;
};

export const getMyHistory = async (technicienId) => {
  const response = await api.get(`/technicien/interventions/historique?technicienId=${technicienId}`);
  return response.data;
};

export const startInterventionN1 = async (ticketId, technicienId) => {
  const response = await api.post('/technicien/interventions/start', {
    ticketId,
    technicienId,
    statut: 'EN_COURS_N1'
  });
  return response.data;
};

export const saveInterventionActions = async (interventionId, actionData) => {
  const response = await api.put(`/technicien/interventions/${interventionId}/actions`, actionData);
  return response.data;
};

export const addRemoteActionN1 = async (interventionId, actionADistance) => {
  const response = await api.put(`/technicien/interventions/${interventionId}/actions`, {
    actionADistance,
    surSiteEffectue: false,
    manipulationLourdeEffectue: false
  });
  return response.data;
};

export const terminateInterventionN1 = async (interventionId, rapport) => {
  const response = await api.post(`/technicien/interventions/${interventionId}/cloturer`, { rapport });
  return response.data;
};

export const closeTicketN1 = async (interventionId) => {
  const response = await api.post(`/technicien/interventions/${interventionId}/cloturer`, {
    rapport: 'Clôture directe sans rapport détaillé.'
  });
  return response.data;
};

export const escalateToN2N1 = async (interventionId, rapport) => {
  const response = await api.post(`/technicien/interventions/${interventionId}/escalader`, {
    rapport,
    prochainStatut: 'ESCALADE_N2',
    groupeCible: 'ROLE_N2'
  });
  return response.data;
};

// ========== N2 ==========
export const getEscalatedN2Tickets = async () => {
  const response = await api.get('/technicien/tickets?status=ESCALATED_N2');
  return response.data;
};

export const startInterventionN2 = async (ticketId, technicienId) => {
  const response = await api.post('/technicien/interventions/start', {
    ticketId,
    technicienId,
    statut: 'ESCALADE_N2'
  });
  return response.data;
};

export const escalateToN3 = async (interventionId, rapport) => {
  const response = await api.post(`/technicien/interventions/${interventionId}/escalader`, {
    rapport,
    prochainStatut: 'ESCALADE_N3',
    groupeCible: 'ROLE_N3'
  });
  return response.data;
};

export const getTicketInterventions = async (ticketId) => {
  const response = await api.get(`/technicien/tickets/${ticketId}/interventions`);
  return response.data;
};

// ========== N3 ==========
export const getEscalatedN3Tickets = async () => {
  const response = await api.get('/technicien/tickets?status=ESCALATED_N3');
  return response.data;
};

export const startInterventionN3 = async (ticketId, technicienId) => {
  const response = await api.post('/n3/interventions/start', {
    ticketId,
    technicienId
  });
  return response.data;
};

export const getAvailableEquipments = async () => {
  const response = await api.get('/equipements/available');
  return response.data;
};

export const replaceEquipment = async (ticketId, newEquipmentId, technicienId) => {
  const response = await api.put(`/tickets/${ticketId}/replace-equipment`, {
    newEquipmentId,
    technicienId
  });
  return response.data;
};

export const closeTicketN3 = async (interventionId, reportDto) => {
  const response = await api.post(`/n3/interventions/${interventionId}/close`, reportDto);
  return response.data;
};

export const updateEquipmentStatus = async (equipmentId, status) => {
  const response = await api.put(`/technicien/equipements/${equipmentId}/status`, { status });
  return response.data;
};

export default api;