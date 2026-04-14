import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const useAuth = () => {
  const { token, user, login, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    login(res.data.token, res.data.user);
    return res.data.user;
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return {
    token,
    user,
    isAuthenticated: !!token,
    login: handleLogin,
    logout: handleLogout,
  };
};

export default useAuth;