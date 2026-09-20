import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const getProfileImageStorageKey = (userId) => `profile-image-${userId || 'default'}`;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [userName, setUserNameState] = useState(localStorage.getItem('userName'));
  const [profileImage, setProfileImageState] = useState(() => {
    const storedUserId = localStorage.getItem('userId');
    return localStorage.getItem(getProfileImageStorageKey(storedUserId)) || '';
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role');
    const storedName = localStorage.getItem('userName');
    const storedProfileImage = localStorage.getItem(getProfileImageStorageKey(storedUserId)) || '';

    if (storedToken) {
      setToken(storedToken);
      setUserId(storedUserId);
      setRole(storedRole);
      setUserNameState(storedName);
      setProfileImageState(storedProfileImage);
    }
    setLoading(false);
  }, []);

  const setUserName = (name) => {
    localStorage.setItem('userName', name);
    setUserNameState(name);
  };

  const setProfileImage = (image, id = userId) => {
    const storageKey = getProfileImageStorageKey(id);

    if (image) {
      localStorage.setItem(storageKey, image);
    } else {
      localStorage.removeItem(storageKey);
    }

    setProfileImageState(image || '');
  };

  const login = (jwtToken, userRole, id, name) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    
    setToken(jwtToken);
    setRole(userRole);
    setUserId(id);
    setUserNameState(name);
    setProfileImageState(localStorage.getItem(getProfileImageStorageKey(id)) || '');
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUserId(null);
    setUserNameState(null);
    setProfileImageState('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      userId,
      role,
      userName,
      profileImage,
      user,
      setUser,
      setUserName,
      setProfileImage,
      login,
      logout,
      loading
    }}>
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
