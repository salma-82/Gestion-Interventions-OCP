import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { RefreshCw, CheckCheck, BellOff } from 'lucide-react';

export default function NotificationCenter({ onClose }) {
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotifications();

  const handleMarkAll = async () => {
    await markAllAsRead();
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 10px)',
        width: 'min(360px, calc(100vw - 24px))',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        zIndex: 9999,
        animation: 'notif-slide-in 0.2s ease',
      }}
    >
      <style>{`
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
            Notifications
          </span>
          {notifications.length > 0 && (
            <span
              style={{
                backgroundColor: '#047857',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '99px',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {notifications.length}
            </span>
          )}
          {unreadCount > 0 && (
            <span
              title={`${unreadCount} non lue(s)`}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 0 2px #ffffff',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              title="Tout marquer comme lu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#a7f3d0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <CheckCheck size={14} />
              Tout lire
            </button>
          )}
          <button
            onClick={fetchNotifications}
            title="Actualiser"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#a7f3d0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              color: '#94a3b8',
              gap: '10px',
            }}
          >
            <BellOff size={36} color="#cbd5e1" />
            <p style={{ fontSize: '13px', margin: 0 }}>Aucune notification pour le moment</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} onClose={onClose} />
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {notifications.length} notification(s) au total
            {unreadCount > 0 ? `, ${unreadCount} non lue(s)` : ', toutes lues'}
          </span>
        </div>
      )}
    </div>
  );
}
