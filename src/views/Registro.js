import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiIps, apiCreateUsers } from '../utils/api';
import request from '../utils/request';
import { FaUser, FaLock, FaUserPlus, FaHospital, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

function Registro() {
  const [ipss, setIpss] = useState([]);
  const [ips, setIps] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState({
    username: '',
    usuario: '',
    password: '',
    institucion: '',
  });

  const obtenerIps = async () => {
    try {
      const response = await request({ link: apiIps, method: 'GET' });
      if (response && response.success && response.ips) {
        setIpss(response.ips);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    obtenerIps();
  }, []);

  const handleSave = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const register = async (e) => {
    if (e) e.preventDefault();
    if (!user.usuario.trim() || !user.password.trim() || !user.username.trim() || !ips) {
      alert('Por favor diligencie todos los campos, incluyendo la institución.');
      return;
    }

    setLoading(true);
    try {
      const response = await request({
        link: apiCreateUsers,
        body: {
          name: user.username,
          usuario: user.usuario,
          password: user.password,
          institucion: ips,
        },
        method: 'POST',
      });
      if (response && response.success) {
        alert('¡Usuario registrado exitosamente! Ya puedes iniciar sesión.');
        window.location.href = './login';
      } else {
        alert(`${response?.message || 'Error al registrar usuario'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 15px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
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
        <div style={{ marginBottom: '24px' }}>
          <img
            src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
            alt="Logo GEMTTO"
            style={{
              maxHeight: '60px',
              maxWidth: '220px',
              objectFit: 'contain',
              marginBottom: '12px',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
            }}
          />
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: '800' }}>
            Crear Cuenta de Usuario
          </h2>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
            Acceso al sistema de gestión biomédica
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={register}>
          {/* Nombre Completo */}
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              NOMBRE COMPLETO:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaUser
                size={14}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#94a3b8',
                }}
              />
              <input
                name="username"
                type="text"
                value={user.username}
                placeholder="Ej. Ing. Carlos Pérez"
                onChange={handleSave}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1.5px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Usuario */}
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              NOMBRE DE USUARIO:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaUser
                size={14}
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
                placeholder="Ej. cperez_biomedico"
                onChange={handleSave}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1.5px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              CONTRASEÑA:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaLock
                size={14}
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
                placeholder="Crea una contraseña segura"
                onChange={handleSave}
                required
                style={{
                  width: '100%',
                  padding: '11px 42px 11px 40px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1.5px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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

          {/* Institución / IPS */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              INSTITUCIÓN / IPS:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaHospital
                size={14}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#94a3b8',
                }}
              />
              <select
                value={ips}
                onChange={(e) => setIps(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1.5px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Seleccione la Institución --</option>
                {ipss.map((item, index) => (
                  <option key={index} value={item.ips || item.nombre}>
                    {item.ips || item.nombre} {item.ciudad ? `(${item.ciudad})` : ''}
                  </option>
                ))}
              </select>
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
              marginBottom: '18px',
            }}
          >
            <FaUserPlus size={16} /> {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Links & Security Badge */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13.5px' }}>
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              style={{
                color: '#38bdf8',
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              Inicia sesión aquí
            </Link>
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '14px',
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            <FaShieldAlt size={13} color="#10b981" /> Registro seguro
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registro;
