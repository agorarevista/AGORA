import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar/Sidebar';
import useAuthStore from '../store/authStore';

export default function AdminLayout() {
  const { user } = useAuthStore();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-gray-100)' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: '260px',
        padding: '32px',
        minHeight: '100vh',
        overflow: 'auto'
      }}>
        <Outlet />
      </main>
    </div>
  );
}