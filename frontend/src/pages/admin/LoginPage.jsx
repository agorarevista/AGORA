import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAlert from '../../hooks/useAlert';
import agoraLogoWhite from '../../assets/AGORALLWHITE.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(
    localStorage.getItem('agora_remember_session') === 'true'
  );

  const { login, isAuthenticated } = useAuth();
  const alert = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const rememberedUsername = localStorage.getItem('agora_remember_username');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
    }
  }, []);

  const handleRememberChange = (checked) => {
    setRememberSession(checked);

    if (checked) {
      localStorage.setItem('agora_remember_session', 'true');
      if (username) {
        localStorage.setItem('agora_remember_username', username);
      }
    } else {
      localStorage.removeItem('agora_remember_session');
      localStorage.removeItem('agora_remember_username');
      localStorage.removeItem('agora_token');
      localStorage.removeItem('agora_user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert.warning('Campos requeridos', 'Ingresa usuario y contraseña');
      return;
    }

    if (rememberSession) {
      localStorage.setItem('agora_remember_session', 'true');
      localStorage.setItem('agora_remember_username', username);
    } else {
      localStorage.removeItem('agora_remember_session');
      localStorage.removeItem('agora_remember_username');
      localStorage.removeItem('agora_token');
      localStorage.removeItem('agora_user');
    }

    setLoading(true);

    try {
      const user = await login(username, password);
      alert.success('Bienvenido', `Hola, ${user.full_name}`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      alert.error('Error', err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--color-cream)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            background: 'var(--color-accent)',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <img
            src={agoraLogoWhite}
            alt="Agorá"
            style={{
              width: '100%',
              maxWidth: 170,
              margin: '0 auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />

          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.72)',
              letterSpacing: 2,
              marginTop: 10,
              fontFamily: 'var(--font-sans)',
            }}
          >
            PANEL EDITORIAL
          </div>
        </div>

        {/* Meandro */}
        <div
          style={{
            height: 4,
            background:
              'repeating-linear-gradient(90deg, var(--color-gold) 0px, var(--color-gold) 4px, transparent 4px, transparent 8px)',
            opacity: 0.5,
          }}
        />

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--color-gray-500)',
                marginBottom: 8,
              }}
            >
              Usuario
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (rememberSession) {
                  localStorage.setItem('agora_remember_username', e.target.value);
                }
              }}
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
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'var(--color-gray-500)',
                marginBottom: 8,
              }}
            >
              Contraseña
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 16px',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-base)',
                  background: 'white',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.2s',
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 12,
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  color: 'var(--color-gray-500)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => handleRememberChange(e.target.checked)}
                style={{ display: 'none' }}
              />

              <span
                style={{
                  position: 'relative',
                  width: 42,
                  height: 24,
                  borderRadius: 999,
                  background: rememberSession ? 'var(--color-accent)' : 'var(--color-gray-300)',
                  transition: 'background 0.2s ease',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: rememberSession ? 21 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ffffff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                  }}
                />
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--color-gray-500)',
                  fontWeight: 600,
                }}
              >
                Mantener sesión iniciada
              </span>
            </label>
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
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Pie */}
        <div
          style={{
            padding: '16px 32px',
            borderTop: '1px solid var(--color-gray-200)',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--color-gray-400)',
          }}
        >
          Ἀγορά — El espacio donde las ideas encuentran voz
        </div>
      </div>
    </div>
  );
}