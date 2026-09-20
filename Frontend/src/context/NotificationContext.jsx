import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getRoleNotifications, markNotificationRead } from '../services/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

const getRoleLabel = (role) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN' || normalizedRole === 'ROLE_ADMIN') return 'Alerte Administration';
  if (normalizedRole === 'DEMANDEUR' || normalizedRole === 'ROLE_DEMANDEUR') return 'Alerte Demandeur';
  if (normalizedRole === 'N1' || normalizedRole === 'ROLE_N1') return 'Alerte Support N1';
  if (normalizedRole === 'N2' || normalizedRole === 'ROLE_N2') return 'Alerte Support N2';
  if (normalizedRole === 'N3' || normalizedRole === 'ROLE_N3') return 'Alerte Support N3';
  return 'Nouvelle alerte GMAO OCP';
};

export const NotificationProvider = ({ children }) => {
  const { token, userId, role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevNotificationsRef = useRef([]);

  const fetchNotifications = async () => {
    if (!token || !userId) {
      setNotifications([]);
      setUnreadCount(0);
      prevNotificationsRef.current = [];
      return;
    }

    try {
      const data = await getRoleNotifications({ userId, role });
      const notifArray = Array.isArray(data) ? data : [];

      setNotifications(notifArray);

      const unreads = notifArray.filter(n => !(n.lu || n.read || n.isRead)).length;
      setUnreadCount(unreads);

      const prevIds = new Set(prevNotificationsRef.current.map(n => n.id));
      const newlyArrived = notifArray.filter(n => !prevIds.has(n.id));

      if (prevNotificationsRef.current.length > 0 && newlyArrived.length > 0) {
        newlyArrived.forEach(notif => {
          const msg = notif.message || notif.contenu || 'Nouvelle alerte GMAO OCP';
          const isUnread = !(notif.lu || notif.read || notif.isRead);

          if (isUnread) {
            toast.custom((t) => (
              <div
                className={`${
                  t.visible ? 'animate-bounce' : 'opacity-0'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                style={{ borderLeft: '5px solid #008751' }}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        🔔
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{getRoleLabel(role)}</p>
                      <p className="mt-1 text-xs text-gray-500">{msg}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ), { duration: 6000 });
          }
        });
      }

      prevNotificationsRef.current = notifArray;
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [token, userId, role]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !(n.lu || n.read || n.isRead));
      await Promise.all(unreadNotifs.map(n => markNotificationRead(n.id)));
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erreur lors du marquage de toutes les notifications comme lues');
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
