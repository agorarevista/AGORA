import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useAlert from '../../hooks/useAlert';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const alert = useAlert();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert.warning('Campos requeridos', 'Ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username, password);
      alert.success('Bienvenido', `Hola, ${user.full_name}`);
      navigate('/admin/dashboard');
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--color-cream)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Cabecera */}
        <div style={{
          background: 'var(--color-accent)',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48,
            color: 'white',
            lineHeight: 1
          }}>Λ</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'white',
            letterSpacing: 4,
            marginTop: 8
          }}>AGORÁ</div>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: 2,
            marginTop: 4,
            fontFamily: 'var(--font-sans)'
          }}>PANEL EDITORIAL</div>
        </div>

        {/* Meandro */}
        <div style={{
          height: 4,
          background: 'repeating-linear-gradient(90deg, var(--color-gold) 0px, var(--color-gold) 4px, transparent 4px, transparent 8px)',
          opacity: 0.5
        }} />

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'var(--color-gray-500)',
              marginBottom: 8
            }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
              autoComplete="username"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-base)',
                background: 'white',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'var(--color-gray-500)',
              marginBottom: 8
            }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-base)',
                background: 'white',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'var(--color-gray-400)' : 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Pie */}
        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid var(--color-gray-200)',
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--color-gray-400)'
        }}>
          Ἀγορά — El espacio donde las ideas encuentran voz
        </div>
      </div>
    </div>
  );
}