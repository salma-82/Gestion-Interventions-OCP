import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import DemandeurDashboard from './features/admin/pages/DemandeurDashboard';
import TechnicienN1Dashboard from './features/admin/pages/TechnicienN1Dashboard';

function App() {
  return (
    <Routes>
      {/* Root path we b login */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Les Interfaces m9adîne les paths 100% m3a l-Login */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/demandeur-dashboard" element={<DemandeurDashboard />} />
      <Route path="/tech-n1-dashboard" element={<TechnicienN1Dashboard />} />

      {/* Secours */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;