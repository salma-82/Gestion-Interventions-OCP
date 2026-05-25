import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

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
      // Appel d'API Connexion au backend Spring Boot
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: email,
        password: password
      });

      const userData = response.data; // Structure: { token, role, userId }
      
      // Stockage propre dans le LocalStorage
      localStorage.setItem('token', userData.token);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('userId', userData.userId);

      // ✅ Routage intelligent et complet pour tous les rôles du système
   // Copy had l-partie d les ifs f l-Login.jsx dyalk (f l-blassa d l-redirection)
if (userData.role === 'ROLE_ADMIN' || userData.role === 'ADMIN') {
  navigate('/admin-dashboard', { replace: true }); // ✅ Match m3a App.jsx
} else if (userData.role === 'ROLE_DEMANDEUR' || userData.role === 'DEMANDEUR') {
  navigate('/demandeur-dashboard', { replace: true }); // ✅ Match m3a App.jsx
} else if (userData.role === 'ROLE_N1' || userData.role === 'N1') {
  navigate('/tech-n1-dashboard', { replace: true }); // ✅ Match m3a App.jsx
} else if (userData.role === 'ROLE_N2' || userData.role === 'N2') {
  alert("Interface N2 non configurée");
} else if (userData.role === 'ROLE_N3' || userData.role === 'N3') {
  alert("Interface N3 non configurée");
} else {
  setError("Rôle inconnu.");
}

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
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
      <div className="login-card">
        <h2>Connexion GMAO OCP</h2>
        <p className="login-subtitle">Vérification et Authentification sécurisée</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse Email Pro</label>
            <input
              type="email"
              placeholder="votre.email@ocp.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Vérification en base de données...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;