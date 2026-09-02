import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { loginUser } from '../redux/actions/user.action';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';

function Login() {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let currentUser = reduxUser;
    if (!currentUser) {
      try {
        const raw = localStorage.getItem('user');
        currentUser = raw ? JSON.parse(raw) : null;
      } catch (e) {}
    }
    const token = localStorage.getItem('token');
    if (token && currentUser) {
      if (String(currentUser.rol || '').trim().toLowerCase() === 'admin') {
        window.location.href = '/inventarioua';
      } else {
        window.location.href = '/inventariouser';
      }
    }
  }, [reduxUser]);

  const [user, setUser] = useState({
    usuario: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const iniciarSesion = async (e) => {
    if (e) e.preventDefault();
    if (!user.usuario.trim() || !user.password.trim()) {
      alert('Por favor ingrese su usuario y contraseña');
      return;
    }
    setLoading(true);
    try {
      await dispatch(loginUser(user));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 15px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1.5px solid #38bdf8',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
          padding: '36px 30px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {/* Logo & Header */}
        <div style={{ marginBottom: '28px' }}>
          <img
            src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
            alt="Logo GEMTTO"
            style={{
              maxHeight: '65px',
              maxWidth: '220px',
              objectFit: 'contain',
              marginBottom: '14px',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
            }}
          />
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: '800' }}>
            Iniciar Sesión
          </h2>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
            Gestión y Mantenimiento de Equipos Biomédicos
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={iniciarSesion}>
          {/* Campo Usuario */}
          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              USUARIO:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaUser
                size={15}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#94a3b8',
                }}
              />
              <input
                name="usuario"
                type="text"
                value={user.usuario}
                placeholder="Ingresa tu usuario"
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1.5px solid #334155',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              CONTRASEÑA:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaLock
                size={15}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#94a3b8',
                }}
              />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={user.password}
                placeholder="Ingresa tu contraseña"
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 40px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1.5px solid #334155',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
              transition: 'all 0.2s',
              marginBottom: '20px',
            }}
          >
            <FaSignInAlt size={16} /> {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Links & Security Badge */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '18px', marginTop: '10px' }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13.5px' }}>
            ¿No tienes una cuenta?{' '}
            <Link
              to="/registro"
              style={{
                color: '#38bdf8',
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              Regístrate aquí
            </Link>
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '16px',
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            <FaShieldAlt size={13} color="#10b981" /> Acceso seguro y encriptado
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
