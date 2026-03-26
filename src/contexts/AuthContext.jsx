import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token and load profile
    const token = localStorage.getItem('access_token');
    if (token) {
      api.getProfile()
        .then(profile => setUser(profile))
        .catch(() => {
          api.clearTokens();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    api.setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, business_name) => {
    const data = await api.register({ name, email, password, business_name: business_name || name });
    api.setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return true;
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
