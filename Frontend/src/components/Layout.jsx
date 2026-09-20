import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Shield, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <motion.aside
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col"
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-500" />
            <span className="text-white font-bold text-xl">OCP Support</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Niveau {role}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/n1"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800"
          >
            <Home size={20} />
            <span>Dashboard N1</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-red-400 hover:bg-gray-800"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;