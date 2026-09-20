import React from 'react';
import {
  CheckCircle,
  Mail,
  Clock,
  ArrowUpRight,
  XCircle,
  Bell,
  Wrench,
  PackageCheck,
  MessageSquare,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TYPE_MAP = {
  NEW_TICKET:            { icon: Bell,            color: '#10b981', bg: '#ecfdf5' },
  TICKET_CREATED:        { icon: Bell,            color: '#10b981', bg: '#ecfdf5' },
  TICKET_UPDATED:        { icon: ClipboardList,   color: '#0ea5e9', bg: '#ecfeff' },
  TICKET_ASSIGNED:       { icon: Mail,            color: '#10b981', bg: '#ecfdf5' },
  ASSIGNED_TICKET:       { icon: Mail,            color: '#10b981', bg: '#ecfdf5' },
  STATUS_UPDATED:        { icon: ClipboardList,   color: '#0ea5e9', bg: '#ecfeff' },
  COMMENT_ADDED:         { icon: MessageSquare,   color: '#6366f1', bg: '#eef2ff' },
  RESPONSE_ADDED:        { icon: MessageSquare,   color: '#6366f1', bg: '#eef2ff' },
  ESCALATED_N1_N2:       { icon: ArrowUpRight,    color: '#f59e0b', bg: '#fffbeb' },
  ESCALATED_N2_N3:       { icon: ArrowUpRight,    color: '#ef4444', bg: '#fef2f2' },
  ESCALATION:            { icon: ShieldAlert,     color: '#f59e0b', bg: '#fffbeb' },
  INTERVENTION_STARTED:   { icon: Wrench,          color: '#3b82f6', bg: '#eff6ff' },
  INTERVENTION_CLOSED:    { icon: CheckCircle,     color: '#10b981', bg: '#ecfdf5' },
  INTERVENTION_REJECTED:  { icon: XCircle,         color: '#ef4444', bg: '#fef2f2' },
  EQUIPMENT_REPLACED:     { icon: PackageCheck,    color: '#8b5cf6', bg: '#f5f3ff' },
  EVALUATION_RECEIVED:    { icon: CheckCircle,     color: '#10b981', bg: '#ecfdf5' },
  DEFAULT:                { icon: Bell,            color: '#64748b', bg: '#f8fafc' },
};

function normalizeType(value) {
  return String(value || '').trim().toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function getNotificationTitle(notification) {
  return notification?.title || notification?.message || notification?.contenu || notification?.libelle || 'Notification';
}

function getNotificationDescription(notification) {
  return notification?.description || notification?.details || notification?.body || '';
}

function getNotificationTimestamp(notification) {
  return notification?.date || notification?.createdAt || notification?.dateCreation || notification?.created_at || notification?.timestamp;
}

export default function NotificationItem({ notification }) {
  const { markAsRead } = useNotifications();
  const isUnread = !(notification.lu || notification.read || notification.isRead);
  const meta = TYPE_MAP[normalizeType(notification.type)] || TYPE_MAP.DEFAULT;
  const Icon = meta.icon;

  const handleMarkRead = async (e) => {
    e.stopPropagation();
    await markAsRead(notification.id);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: isUnread ? '#f0fdf4' : '#ffffff',
        borderLeft: `4px solid ${meta.color}`,
        transition: 'background 0.15s, transform 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = isUnread ? '#dcfce7' : '#f8fafc';
        e.currentTarget.style.transform = 'translateX(1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = isUnread ? '#f0fdf4' : '#ffffff';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: meta.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={meta.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '13px',
            fontWeight: isUnread ? '700' : '500',
            color: '#1e293b',
            margin: '0 0 2px 0',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getNotificationTitle(notification)}
        </p>

        {getNotificationDescription(notification) && (
          <p
            style={{
              fontSize: '12px',
              color: '#64748b',
              margin: '0 0 6px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getNotificationDescription(notification)}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
            <Clock size={11} />
            {timeAgo(getNotificationTimestamp(notification))}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.level && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '99px',
                  backgroundColor: '#dcfce7',
                  color: '#065f46',
                }}
              >
                {notification.level}
              </span>
            )}

            {isUnread && (
              <button
                onClick={handleMarkRead}
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#059669',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#047857'}
                onMouseLeave={e => e.currentTarget.style.color = '#059669'}
              >
                ✓ Lu
              </button>
            )}
          </div>
        </div>
      </div>

      {isUnread && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            flexShrink: 0,
            marginTop: '4px',
          }}
        />
      )}
    </div>
  );
}
