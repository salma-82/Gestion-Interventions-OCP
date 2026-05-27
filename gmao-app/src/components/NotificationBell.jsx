import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCircle, Mail, AlertTriangle, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
      toast.success('Notification marquée comme lue', {
        icon: '✓',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Erreur de mise à jour');
    }
  };

  const getIcon = (msg) => {
    const text = String(msg).toLowerCase();
    if (text.includes('clôtur') || text.includes('fermé')) {
      return <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
    }
    if (text.includes('escalad')) {
      return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
    }
    return <Mail className="h-5 w-5 text-sky-500 flex-shrink-0" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-all duration-200 focus:outline-none"
        title="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-150 overflow-hidden z-50 animate-fade-in origin-top-right">
          <div className="bg-slate-50 px-4 py-3 border-bottom border-slate-100 flex justify-between items-center">
            <span className="font-semibold text-slate-800 text-sm">Centre de notifications</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
              {unreadCount} non lues
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Bell className="h-8 w-8 text-slate-300" />
                <p className="text-xs">Aucune notification pour le moment.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !(notif.lu || notif.read);
                const msg = notif.message || notif.contenu || "Nouvelle alerte support GMAO";
                const dateStr = notif.date || notif.createdAt || new Date().toISOString();

                return (
                  <div
                    key={notif.id}
                    className={`p-4 flex gap-3 transition-colors duration-150 ${
                      isUnread ? 'bg-emerald-50/20' : 'hover:bg-slate-50'
                    }`}
                  >
                    {getIcon(msg)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs text-slate-700 leading-normal ${isUnread ? 'font-medium' : ''}`}>
                        {msg}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(dateStr).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isUnread && (
                          <button
                            onClick={(e) => handleMarkRead(notif.id, e)}
                            className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 focus:outline-none transition-colors"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}