import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      setIsLoading(false);
      return;
    }

    try {
      // Use API login function (handles token storage + interceptors)
      const userData = await apiLogin(email, password);

      // Store in AuthContext
      login(userData.token, userData.role, userData.userId, userData.name || 'Technicien');

      // ✅ Smart routing for all roles
      if (userData.role === 'ROLE_ADMIN' || userData.role === 'ADMIN') {
        navigate('/admin-dashboard', { replace: true });
      } else if (userData.role === 'ROLE_DEMANDEUR' || userData.role === 'DEMANDEUR') {
        navigate('/demandeur-dashboard', { replace: true });
      } else if (userData.role === 'ROLE_N1' || userData.role === 'N1') {
        navigate('/tech-n1-dashboard', { replace: true });
      } else if (userData.role === 'ROLE_N2' || userData.role === 'N2') {
        navigate('/tech-n2-dashboard', { replace: true });
      } else if (userData.role === 'ROLE_N3' || userData.role === 'N3') {
        navigate('/tech-n3-dashboard', { replace: true });
      } else {
        setError("Rôle inconnu.");
      }

    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Email ou mot de passe incorrect, ou serveur backend indisponible.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Grid overlay */}
      <div className="login-grid-overlay"></div>

      {/* Back to Accueil */}
      <button className="back-to-home" onClick={() => navigate('/')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Retour à l'accueil
      </button>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
              <path d="M7 12h10M12 7v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h2>Connexion GMAO</h2>
        <p className="login-subtitle">Authentification sécurisée – OCP Khouribga</p>

        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse Email Pro</label>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="votre.email@ocp.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="btn-spinner"></span>
                Vérification en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Plateforme de Gestion des Interventions<br /><span>OCP Khouribga</span> – Service Informatique</p>
        </div>
      </div>
    </div>
  );
};

export default Login;