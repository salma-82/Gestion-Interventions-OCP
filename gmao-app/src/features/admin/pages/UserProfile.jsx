import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Mail, Phone, Shield, Lock, CheckCircle,
  AlertCircle, Key, ArrowRight, ArrowLeft, RefreshCw
} from 'lucide-react';
import './UserProfile.css';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function UserProfile() {
  const navigate = useNavigate();

  // User profile state
  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Form states
  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback states
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
      setProfileError('Impossible de charger les informations de profil. Veuillez vous reconnecter.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Etape 1 : Vérifier le MDP actuel et envoyer le code de vérification
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setFormError('Veuillez saisir votre mot de passe actuel.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      // 1. Vérifier le mot de passe
      await api.post('/auth/verify-password', { password: currentPassword });

      // 2. Si le MDP est correct, envoyer le code de vérification
      const sendRes = await api.post('/auth/send-verification');

      setFormSuccess(sendRes.data.message || 'Code envoyé avec succès à votre adresse email.');
      setStep(2);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('Erreur de vérification. Vérifiez votre mot de passe et réessayez.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Etape 2 : Valider le code et changer le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!verificationCode || !newPassword || !confirmPassword) {
      setFormError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        verificationCode
      });

      setFormSuccess('Mot de passe changé avec succès ! Déconnexion en cours...');

      // Attendre 2 secondes avant de déconnecter et rediriger
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('Code incorrect, expiré, ou erreur serveur. Veuillez réessayer.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      'ADMIN': 'Administrateur',
      'DEMANDEUR': 'Demandeur',
      'N1': 'Technicien N1',
      'N2': 'Technicien N2',
      'N3': 'Technicien N3'
    };
    return roles[role] || role;
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName || !lastName) return 'OCP';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (profileLoading) {
    return (
      <div className="profile-loading-container">
        <RefreshCw className="spinner-icon" size={40} />
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="profile-error-container">
        <AlertCircle size={48} className="error-icon" />
        <h3>Erreur de chargement</h3>
        <p>{profileError}</p>
        <button onClick={() => navigate('/login')} className="profile-btn-primary">Retour à la connexion</button>
      </div>
    );
  }

  return (
    <div className="profile-layout-container">
      {/* Colonne de gauche - Informations du profil */}
      <div className="profile-left-column">
        <div className="profile-summary-card">
          <div className="profile-banner"></div>
          <div className="profile-avatar-section">
            <div className="profile-avatar-circle">
              {getInitials(user?.prenom, user?.nom)}
            </div>
            <h2 className="profile-user-fullname">{user?.prenom} {user?.nom}</h2>
            <span className="profile-role-badge">{getRoleLabel(user?.role)}</span>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <Mail className="detail-icon" size={18} />
              <div className="detail-text">
                <span className="detail-label">Email Professionnel</span>
                <span className="detail-val">{user?.email}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <Phone className="detail-icon" size={18} />
              <div className="detail-text">
                <span className="detail-label">Téléphone</span>
                <span className="detail-val">{user?.telephone || 'Non renseigné'}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <Shield className="detail-icon" size={18} />
              <div className="detail-text">
                <span className="detail-label">Statut du compte</span>
                <span className={`detail-val status-badge ${user?.status ? 'active' : 'inactive'}`}>
                  {user?.status ? 'Compte Actif' : 'Compte Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne de droite - Sécurité */}
      <div className="profile-right-column">
        <div className="profile-security-card">
          <div className="security-card-header">
            <Lock className="header-lock-icon" size={24} />
            <div>
              <h3>Sécurité & Mot de passe</h3>
              <p>Modifiez votre mot de passe avec une double vérification e-mail</p>
            </div>
          </div>

          {formError && (
            <div className="profile-alert alert-error">
              <AlertCircle size={18} className="alert-icon" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="profile-alert alert-success">
              <CheckCircle size={18} className="alert-icon" />
              <span>{formSuccess}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="security-form">
              <p className="step-instructions">
                <strong>Étape 1 sur 2 :</strong> Pour commencer, veuillez entrer votre mot de passe actuel. Un code de vérification à 6 chiffres sera envoyé à votre adresse e-mail.
              </p>

              <div className="profile-form-group">
                <label>Mot de passe actuel</label>
                <div className="password-input-wrapper">
                  <Key className="input-lock-icon" size={18} />
                  <input
                    type="password"
                    placeholder="Saisissez votre mot de passe actuel"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="profile-btn-primary"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <RefreshCw className="spinner-icon-sm" size={18} />
                    Vérification en cours...
                  </>
                ) : (
                  <>
                    Envoyer le code par email
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="security-form">
              <p className="step-instructions">
                <strong>Étape 2 sur 2 :</strong> Entrez le code à 6 chiffres reçu par e-mail, puis définissez votre nouveau mot de passe.
              </p>

              <div className="profile-form-group">
                <label>Code de vérification (6 chiffres)</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="verification-code-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label>Nouveau mot de passe</label>
                  <div className="password-input-wrapper">
                    <Key className="input-lock-icon" size={18} />
                    <input
                      type="password"
                      placeholder="Min. 6 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Confirmer le mot de passe</label>
                  <div className="password-input-wrapper">
                    <Key className="input-lock-icon" size={18} />
                    <input
                      type="password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={formLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => {
                    setStep(1);
                    setFormError('');
                    setFormSuccess('');
                  }}
                  disabled={formLoading}
                >
                  <ArrowLeft size={18} />
                  Retour
                </button>

                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <RefreshCw className="spinner-icon-sm" size={18} />
                      Modification en cours...
                    </>
                  ) : (
                    <>
                      Changer le mot de passe
                      <CheckCircle size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}