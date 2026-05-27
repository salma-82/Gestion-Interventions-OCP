import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role');
    const storedName = localStorage.getItem('userName');

    if (storedToken) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);
      setUserName(storedName);
    }
    setLoading(false);
  }, []);

  const login = (jwtToken, userRole, id, name) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    
    setToken(jwtToken);
    setRole(userRole);
    setUserId(id);
    setUserName(name);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUserId(null);
    setUserName(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, role, userName, user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
