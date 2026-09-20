import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import NotificationCenter from './NotificationCenter';

const wrapperStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.85rem',
  position: 'relative',
};

const iconButtonStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#475569',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
};

const badgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '800',
  borderRadius: '50%',
  minWidth: '18px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #ffffff',
  padding: 0,
};

const hoverIn = (e) => {
  e.currentTarget.style.backgroundColor = '#f1f5f9';
  e.currentTarget.style.color = '#1e3a8a';
  e.currentTarget.style.borderColor = '#cbd5e1';
  e.currentTarget.style.transform = 'translateY(-1px)';
};

const hoverOut = (e) => {
  e.currentTarget.style.backgroundColor = '#f8fafc';
  e.currentTarget.style.color = '#475569';
  e.currentTarget.style.borderColor = '#e2e8f0';
  e.currentTarget.style.transform = 'translateY(0)';
};

export default function NotificationBell({
  onRefresh,
  refreshTitle = 'Actualiser',
  refreshLoading = false,
}) {
  const { notifications, unreadCount } = useNotifications();
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

  return (
    <div ref={dropdownRef} style={wrapperStyle}>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Notifications"
          style={iconButtonStyle}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={badgeStyle}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {isOpen && <NotificationCenter onClose={() => setIsOpen(false)} />}
      </div>

      {typeof onRefresh === 'function' && (
        <button
          onClick={onRefresh}
          title={refreshTitle}
          style={iconButtonStyle}
          disabled={refreshLoading}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          <RefreshCw
            size={18}
            style={{ animation: refreshLoading ? 'notif-spin 1s linear infinite' : 'none' }}
          />
        </button>
      )}

      <style>{`
        @keyframes notif-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
