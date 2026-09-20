import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Inbox, Wrench, History, Bell, User, LogOut } from 'lucide-react';
import logoOCP from '/src/assets/logo-ocp.png';
import './SidebarN1.css';

export default function SidebarN1({ activeTab, setActiveTab, stats, unreadCount }) {
  const navigate = useNavigate();
  const { userName, logout, profileImage } = useAuth();
  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TN';

  return (
    <aside className="t1d-sidebar">
      {/* Logo / App header */}
      <div className="t1d-sidebar-header">
        <div className="t1d-sidebar-logo">
          <img src={logoOCP} alt="Logo OCP" className="t1d-sidebar-logo-icon" />
          <div>
            <h1 className="t1d-sidebar-title">GMAO INTERVENTIONS</h1>
            <p className="t1d-sidebar-subtitle">Support Technicien N1</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="t1d-sidebar-nav">
        {/* Tableau de bord */}
        <button
          className={`t1d-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} /> 
          <span className="nav-label">Tableau de bord</span>
        </button>

        {/* Tickets assignés */}
        <button
          className={`t1d-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <Inbox size={18} /> 
          <span className="nav-label">Tickets assignés</span>
          {stats?.available > 0 && (
            <span className="nav-badge bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
              {stats.available}
            </span>
          )}
        </button>

        {/* Interventions en cours */}
        <button
          className={`t1d-nav-item ${activeTab === 'active_interventions' ? 'active' : ''}`}
          onClick={() => setActiveTab('active_interventions')}
        >
          <Wrench size={18} /> 
          <span className="nav-label">Interventions en cours</span>
          {stats?.active > 0 && (
            <span className="nav-badge bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto animate-pulse">
              {stats.active}
            </span>
          )}
        </button>

        {/* Historique */}
        <button
          className={`t1d-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> 
          <span className="nav-label">Historique</span>
        </button>

        {/* Notifications */}
        <button
          className={`t1d-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={18} /> 
          <span className="nav-label">Notifications</span>
          {unreadCount > 0 && (
            <span className="nav-badge bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profil */}
        <button
          className={`t1d-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} /> 
          <span className="nav-label">Mon Profil</span>
        </button>
      </nav>

      {/* User info + logout */}
      <div className="t1d-sidebar-footer">
        <div className="t1d-user-badge">
          <div 
            className={`t1d-user-avatar ${profileImage ? 'has-image' : ''}`}
            style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
          >
            {!profileImage && userInitials}
          </div>
          <div className="t1d-user-info">
            <p className="t1d-user-name">{userName || 'Technicien N1'}</p>
            <p className="t1d-user-dept">Division Khouribga</p>
          </div>
        </div>
        <button
          className="t1d-logout-btn"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut size={16} /> 
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
