import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, User, LogOut } from 'lucide-react';
import logoOCP from '/src/assets/logo-ocp.png';
import './TechnicianSidebar.css';

export default function TechnicianSidebar({
  title = 'GMAO HELP-DESK',
  subtitle = 'Support technique',
  roleLabel = 'Technicien',
  activeItem = 'dashboard',
  items = [],
}) {
  const navigate = useNavigate();
  const { userName, profileImage, logout } = useAuth();

  const displayName = (userName || roleLabel).trim();
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TN';

  const defaultItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} />, onClick: () => {} },
    { id: 'profile', label: 'Mon Profil', icon: <User size={18} />, onClick: () => navigate('/profile') },
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  return (
    <aside className="tech-sidebar">
      <div className="tech-sidebar-header">
        <img src={logoOCP} alt="OCP" className="tech-sidebar-logo" />
        <div className="tech-sidebar-copy">
          <h2 className="tech-sidebar-title">{title}</h2>
          <p className="tech-sidebar-subtitle">{subtitle}</p>
        </div>
      </div>

      <nav className="tech-sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tech-nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={item.onClick}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge ? <span className="tech-nav-badge">{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      <div className="tech-sidebar-footer">
        <div className="tech-user-info">
          <div
            className={`tech-user-avatar ${profileImage ? 'has-image' : ''}`}
            style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
            aria-hidden="true"
          >
            {!profileImage && userInitials}
          </div>
          <div className="tech-user-text">
            <p className="tech-user-name">{displayName}</p>
            <p className="tech-user-role">{roleLabel}</p>
          </div>
        </div>

        <button
          type="button"
          className="tech-logout-btn"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          title="Se déconnecter"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
