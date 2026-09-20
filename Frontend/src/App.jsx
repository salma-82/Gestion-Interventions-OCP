import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import Accueil from './features/auth/Accueil';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import DemandeurDashboard from './features/admin/pages/DemandeurDashboard';
import TechnicienN1Dashboard from './features/admin/pages/TechnicienN1Dashboard';
import TechnicienN2Dashboard from './features/admin/pages/TechnicienN2Dashboard';
import TechnicienN3Dashboard from './features/admin/pages/TechnicienN3Dashboard';
import UserProfile from './features/admin/pages/UserProfile';

import ProtectedRoutes from './components/ProtectedRoutes';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Accueil />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Accueil" element={<Accueil />} />

      {/* Protected routes for Admin */}
      <Route element={<ProtectedRoutes allowedRoles={['ADMIN', 'ROLE_ADMIN']} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Protected routes for Demandeur */}
      <Route element={<ProtectedRoutes allowedRoles={['DEMANDEUR', 'ROLE_DEMANDEUR']} />}>
        <Route path="/demandeur-dashboard" element={<DemandeurDashboard />} />
      </Route>

      {/* Protected routes for Technicien N1 */}
      <Route element={<ProtectedRoutes allowedRoles={['N1', 'ROLE_N1']} />}>
        <Route path="/tech-n1-dashboard" element={<TechnicienN1Dashboard />} />
      </Route>

      {/* Protected routes for Technicien N2 */}
      <Route element={<ProtectedRoutes allowedRoles={['N2', 'ROLE_N2']} />}>
        <Route path="/tech-n2-dashboard" element={<TechnicienN2Dashboard />} />
      </Route>

      {/* Protected routes for Technicien N3 */}
      <Route element={<ProtectedRoutes allowedRoles={['N3', 'ROLE_N3']} />}>
        <Route path="/tech-n3-dashboard" element={<TechnicienN3Dashboard />} />
      </Route>

      {/* Profile route - accessible à tous les rôles authentifiés */}
      <Route element={<ProtectedRoutes allowedRoles={['ADMIN', 'ROLE_ADMIN', 'DEMANDEUR', 'ROLE_DEMANDEUR', 'N1', 'ROLE_N1', 'N2', 'ROLE_N2', 'N3', 'ROLE_N3']} />}>
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;