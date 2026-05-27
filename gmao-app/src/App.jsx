import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import DemandeurDashboard from './features/admin/pages/DemandeurDashboard';
import TechnicienN1Dashboard from './features/admin/pages/TechnicienN1Dashboard';
import ProtectedRoutes from './components/ProtectedRoutes';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes for Admin */}
      <Route element={<ProtectedRoutes allowedRoles={['ADMIN']} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Protected routes for Demandeur */}
      <Route element={<ProtectedRoutes allowedRoles={['DEMANDEUR']} />}>
        <Route path="/demandeur-dashboard" element={<DemandeurDashboard />} />
      </Route>

      {/* Protected routes for Technicien N1 */}
      <Route element={<ProtectedRoutes allowedRoles={['N1', 'ROLE_N1']} />}>
        <Route path="/tech-n1-dashboard" element={<TechnicienN1Dashboard />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;