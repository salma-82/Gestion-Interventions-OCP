import React from 'react';
import logoOCP from '../assets/logo-ocp.png';
import NotificationBell from './NotificationBell';

const Navbar = ({ technicianName, onLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark n1-navbar sticky-top">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center gap-2" href="#dashboard">
          <img src={logoOCP} alt="OCP Logo" height="38" className="d-inline-block align-text-top" />
          <div className="d-flex flex-column text-white lh-1">
            <span className="fw-bold fs-5">GMAO OCP</span>
            <span style={{ fontSize: '10px', opacity: 0.8, color: '#006633' }}>DIGITAL WORKSPACE</span>
          </div>
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#n1NavbarContent" 
          aria-controls="n1NavbarContent" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="n1NavbarContent">
          <div className="navbar-nav align-items-center gap-3 mt-3 mt-lg-0">
            {/* Technician Info */}
            <div className="d-flex align-items-center text-white me-2">
              <div className="d-flex flex-column text-end me-2 lh-sm">
                <span className="fw-semibold text-light">{technicianName || 'Technicien OCP'}</span>
                <span className="badge bg-success text-white px-2 py-1 mt-1" style={{ fontSize: '10px' }}>
                  TECHNICIEN N1
                </span>
              </div>
              <div className="avatar-circle-sm bg-light text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                {technicianName ? technicianName.split(' ').map(n => n[0]).join('').toUpperCase() : 'TN'}
              </div>
            </div>

            {/* Notification Bell */}
            <div className="nav-item">
              <NotificationBell />
            </div>

            {/* Logout Action */}
            <div className="nav-item ps-lg-2">
              <button 
                onClick={onLogout} 
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 px-3 rounded-pill"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
