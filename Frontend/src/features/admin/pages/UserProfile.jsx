import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
  Mail, Phone, Shield, Lock, CheckCircle,
  AlertCircle, Key, ArrowRight, ArrowLeft, RefreshCw,
  Camera, Trash2, Building, BarChart2
} from 'lucide-react';
import './UserProfile.css';

const api = axios.create({ baseURL: 'http://localhost:8080/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  DEMANDEUR: 'Demandeur',
  N1: 'Technicien N1',
  N2: 'Technicien N2',
  N3: 'Technicien N3',
};

function getInitials(prenom, nom) {
  if (!prenom || !nom) return 'OCP';
  return `${prenom[0]}${nom[0]}`.toUpperCase();
}

function getProfileImageKey(userData) {
  const id = userData?.id || localStorage.getItem('userId') || 'default';
  return `profile-image-${id}`;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const { setUser: setAuthUser, setUserName: setAuthUserName, setProfileImage: persistProfileImage } = useAuth();

  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await api.get('/auth/me');
      const userData = res.data;
      setUser(userData);
      setAuthUser(userData);
      const name = [userData?.prenom, userData?.nom].filter(Boolean).join(' ').trim();
      if (name) setAuthUserName(name);
      const saved = localStorage.getItem(getProfileImageKey(userData));
      const img = userData?.profileImage || userData?.avatarUrl || saved || '';
      setProfileImage(img);
      persistProfileImage(img, userData?.id);
    } catch {
      setProfileError('Impossible de charger le profil. Veuillez vous reconnecter.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setFormError('Image invalide (JPG, PNG, WEBP…).'); return; }
    if (file.size > 2 * 1024 * 1024) { setFormError('Taille max : 2 Mo.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      localStorage.setItem(getProfileImageKey(user), url);
      setProfileImage(url);
      persistProfileImage(url, user?.id);
      setFormError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveProfileImage = () => {
    localStorage.removeItem(getProfileImageKey(user));
    setProfileImage('');
    persistProfileImage('', user?.id);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!currentPassword) { setFormError('Veuillez saisir votre mot de passe actuel.'); return; }
    setFormLoading(true); setFormError(''); setFormSuccess('');
    try {
      await api.post('/auth/verify-password', { password: currentPassword });
      const res = await api.post('/auth/send-verification');
      if (res.data.emailSent) {
        // Email réel envoyé — flow normal
        setFormSuccess(`Code envoyé à votre adresse e-mail. Vérifiez votre boîte de réception.`);
      } else if (res.data.devCode) {
        // SMTP non configuré — afficher et pré-remplir le code
        setVerificationCode(res.data.devCode);
        setFormSuccess(`⚠️ Email non configuré. Votre code OTP est : ${res.data.devCode} (pré-rempli automatiquement)`);
      } else {
        setFormSuccess('Code généré. Vérifiez votre email.');
      }
      setStep(2);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Mot de passe incorrect. Réessayez.');
    } finally { setFormLoading(false); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setFormError('Le code doit contenir exactement 6 chiffres.'); return;
    }
    setFormLoading(true); setFormError(''); setFormSuccess('');
    try {
      await api.post('/auth/check-otp', { code: verificationCode });
      setFormSuccess('Code valide ✓');
      setStep(3);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Code incorrect ou expiré. Vérifiez votre email.');
    } finally { setFormLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { setFormError('Veuillez remplir tous les champs.'); return; }
    if (newPassword !== confirmPassword) { setFormError('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 6) { setFormError('Minimum 6 caractères requis.'); return; }
    setFormLoading(true); setFormError(''); setFormSuccess('');
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword, verificationCode });
      setFormSuccess('Mot de passe changé avec succès ! Déconnexion en cours…');
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        navigate('/login');
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Code incorrect ou expiré. Réessayez.');
    } finally { setFormLoading(false); }
  };

  const resetForm = (targetStep) => {
    setFormError(''); setFormSuccess('');
    setStep(targetStep);
  };

  if (profileLoading) return (
    <div className="up-loading">
      <RefreshCw className="up-spinner" size={36} />
      <p>Chargement du profil…</p>
    </div>
  );

  if (profileError) return (
    <div className="up-loading">
      <AlertCircle size={44} style={{ color: '#dc2626' }} />
      <p>{profileError}</p>
      <button className="up-btn-primary" onClick={() => navigate('/login')}>Retour à la connexion</button>
    </div>
  );

  return (
    <div className="up-page">



      <div className="up-grid">

        {/* ── Colonne gauche ── */}
        <aside className="up-left">

          {/* Carte profil */}
          <div className="up-profile-card">
            <div className="up-banner" />
            <div className="up-avatar-section">
              <div
                className={`up-avatar${profileImage ? ' has-image' : ''}`}
                style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
                onClick={() => imageInputRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') imageInputRef.current?.click(); }}
                title="Changer la photo"
              >
                {!profileImage && <span className="up-initials">{getInitials(user?.prenom, user?.nom)}</span>}
                <div className="up-avatar-overlay">
                  <span className="up-edit-badge"><Camera size={13} /> Modifier</span>
                  {profileImage && (
                    <button className="up-delete-badge" onClick={(e) => { e.stopPropagation(); handleRemoveProfileImage(); }} title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImageChange} />
              <h2 className="up-fullname">{user?.prenom} {user?.nom}</h2>
              <span className="up-role-badge">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>

            <div className="up-info-list">
              {[
                { icon: <Mail size={15} />, label: 'Email professionnel', value: user?.email },
                { icon: <Phone size={15} />, label: 'Téléphone', value: user?.telephone || 'Non renseigné' },
                { icon: <Building size={15} />, label: 'Site', value: 'Khouribga ' },
              ].map(({ icon, label, value }) => (
                <div className="up-info-row" key={label}>
                  <div className="up-info-icon">{icon}</div>
                  <div className="up-info-text">
                    <span className="up-lbl">{label}</span>
                    <span className="up-val">{value}</span>
                  </div>
                </div>
              ))}
              <div className="up-info-row">
                <div className="up-info-icon"><Shield size={15} /></div>
                <div className="up-info-text">
                  <span className="up-lbl">Statut du compte</span>
                  <span className={`up-status-pill ${user?.status ? 'active' : 'inactive'}`}>
                    <span className="up-status-dot" />
                    {user?.status ? 'Compte actif' : 'Compte inactif'}
                  </span>
                </div>
              </div>
            </div>
          </div>


        </aside>

        {/* ── Colonne droite ── */}
        <main className="up-right">
          <div className="up-security-card">

            <div className="up-sec-header">
              <div className="up-sec-icon"><Lock size={20} /></div>
              <div>
                <h3>Sécurité & mot de passe</h3>
                <p>Modifiez votre mot de passe avec une double vérification e-mail</p>
              </div>
            </div>

            {/* Alertes */}
            {formError && (
              <div className="up-alert up-alert-error">
                <AlertCircle size={16} /> <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="up-alert up-alert-success">
                <CheckCircle size={16} /> <span>{formSuccess}</span>
              </div>
            )}

            {/* Indicateur d'étapes */}
            <div className="up-steps">
              {['Vérification', 'Code e-mail', 'Nouveau mot de passe'].map((lbl, i) => (
                <React.Fragment key={lbl}>
                  <div className="up-step-item">
                    <div className={`up-step-num ${step > i ? 'done' : step === i + 1 ? 'on' : 'off'}`}>
                      {step > i + 1 ? <CheckCircle size={13} /> : i + 1}
                    </div>
                    <span className={`up-step-lbl ${step === i + 1 ? 'on' : ''}`}>{lbl}</span>
                  </div>
                  {i < 2 && <div className="up-step-line" />}
                </React.Fragment>
              ))}
            </div>

            {/* Étape 1 */}
            {step === 1 && (
              <form onSubmit={handleRequestCode} className="up-form">
                <div className="up-notice">
                  <p><strong>Étape 1 sur 3 :</strong> Entrez votre mot de passe actuel. Un code à 6 chiffres sera envoyé à votre adresse e-mail.</p>
                </div>
                <div className="up-field">
                  <label>Mot de passe actuel</label>
                  <div className="up-input-wrap">
                    <Key className="up-input-icon" size={15} />
                    <input type="password" placeholder="Saisissez votre mot de passe actuel" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={formLoading} required />
                  </div>
                </div>
                <div className="up-btn-row">
                  <button type="submit" className="up-btn-primary" disabled={formLoading}>
                    {formLoading ? <><RefreshCw className="up-spin-sm" size={15} /> Vérification…</> : <>Envoyer le code par e-mail <ArrowRight size={15} /></>}
                  </button>
                </div>
              </form>
            )}

            {/* Étape 2 */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="up-form">
                <div className="up-notice">
                  <p><strong>Étape 2 sur 3 :</strong> Un code à 6 chiffres a été envoyé à <strong>{user?.email}</strong>. Saisissez-le ci-dessous.</p>
                </div>
                <div className="up-field">
                  <label>Code de vérification (6 chiffres)</label>
                  <input
                    className="up-code-input"
                    type="text" maxLength={6} placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    disabled={formLoading} required
                  />
                </div>
                <div className="up-btn-row">
                  <button type="button" className="up-btn-secondary" onClick={() => resetForm(1)} disabled={formLoading}><ArrowLeft size={15} /> Retour</button>
                  <button type="submit" className="up-btn-primary" disabled={formLoading}>
                    {formLoading ? <><RefreshCw className="up-spin-sm" size={15} /> Vérification…</> : <>Valider le code <ArrowRight size={15} /></>}
                  </button>
                </div>
              </form>
            )}

            {/* Étape 3 */}
            {step === 3 && (
              <form onSubmit={handleChangePassword} className="up-form">
                <div className="up-notice">
                  <p><strong>Étape 3 sur 3 :</strong> Définissez votre nouveau mot de passe. Minimum 6 caractères.</p>
                </div>
                <div className="up-fields-2">
                  <div className="up-field">
                    <label>Nouveau mot de passe</label>
                    <div className="up-input-wrap">
                      <Key className="up-input-icon" size={15} />
                      <input type="password" placeholder="Min. 6 caractères" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={formLoading} required />
                    </div>
                  </div>
                  <div className="up-field">
                    <label>Confirmer le mot de passe</label>
                    <div className="up-input-wrap">
                      <Key className="up-input-icon" size={15} />
                      <input type="password" placeholder="Répétez le mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={formLoading} required />
                    </div>
                  </div>
                </div>
                <div className="up-btn-row">
                  <button type="button" className="up-btn-secondary" onClick={() => resetForm(2)} disabled={formLoading}><ArrowLeft size={15} /> Retour</button>
                  <button type="submit" className="up-btn-primary" disabled={formLoading}>
                    {formLoading ? <><RefreshCw className="up-spin-sm" size={15} /> Modification…</> : <><CheckCircle size={15} /> Changer le mot de passe</>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}