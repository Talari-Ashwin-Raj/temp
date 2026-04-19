import { createContext, useContext, useState, useEffect } from 'react';
import ApiClient from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(ApiClient.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = ApiClient.getToken();
    if (token) {
      ApiClient.getMe()
        .then(res => {
          setUser(res.data);
          ApiClient.setUser(res.data);
        })
        .catch(() => {
          ApiClient.clearToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await ApiClient.login(email, password);
    ApiClient.setToken(res.data.token);
    ApiClient.setUser(res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (username, email, password, role) => {
    const res = await ApiClient.register(username, email, password, role);
    ApiClient.setToken(res.data.token);
    ApiClient.setUser(res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    ApiClient.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
