import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaClipboardList, 
  FaFileAlt, 
  FaFileMedical, 
  FaExclamationTriangle, 
  FaBoxes, 
  FaFileInvoice, 
  FaCogs, 
  FaHospital, 
  FaSignOutAlt,
  FaCalendarAlt 
} from 'react-icons/fa';

function Navbar() {
  const user = useSelector((state) => state.user);
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './login';
  };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path, isAlert = false) => {
    const active = isActive(path);
    if (isAlert) {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 12px',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: active ? '700' : '600',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        backgroundColor: active ? '#dc2626' : 'rgba(239, 68, 68, 0.2)',
        color: '#ffffff',
        border: '1px solid #ef4444',
        boxShadow: active ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none',
      };
    }

    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '7px 12px',
      borderRadius: '8px',
      fontSize: '13.5px',
      fontWeight: active ? '700' : '500',
      textDecoration: 'none',
      transition: 'all 0.15s ease',
      backgroundColor: active ? '#0284c7' : 'transparent',
      color: active ? '#ffffff' : '#cbd5e1',
      border: active ? '1px solid #38bdf8' : '1px solid transparent',
      boxShadow: active ? '0 0 10px rgba(56, 189, 248, 0.35)' : 'none',
    };
  };

  return (
    <header className="no-print" style={{ width: '100%' }}>
      <nav className="navbar">
        {/* Logo */}
        <Link to={user?.rol === 'admin' ? '/inventarioua' : '/inventariouser'} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
            alt="GEMTTO"
            className="imagen"
          />
        </Link>

        {/* Admin Navigation */}
        {user?.rol === 'admin' && (
          <ul className="nav-list">
            <li>
              <Link to="/alertas" style={linkStyle('/alertas', true)}>
                <FaExclamationTriangle size={13} /> Alertas Mtto
              </Link>
            </li>
            <li>
              <Link to="/inventarioua" style={linkStyle('/inventarioua')}>
                <FaBoxes size={13} /> Inventario
              </Link>
            </li>
            <li>
              <Link to="/cronograma" style={linkStyle('/cronograma')}>
                <FaCalendarAlt size={13} /> Cronograma
              </Link>
            </li>
            <li>
              <Link to="/reportes" style={linkStyle('/reportes')}>
                <FaFileInvoice size={13} /> Reportes
              </Link>
            </li>
            <li>
              <Link to="/fichastecnicas" style={linkStyle('/fichastecnicas')}>
                <FaFileMedical size={13} /> Ficha Téc.
              </Link>
            </li>
            <li>
              <Link to="/actmtto" style={linkStyle('/actmtto')}>
                <FaClipboardList size={13} /> Act. Mtto
              </Link>
            </li>
            <li>
              <Link to="/informes" style={linkStyle('/informes')}>
                <FaFileAlt size={13} /> Informes
              </Link>
            </li>
            <li>
              <Link to="/repuestos" style={linkStyle('/repuestos')}>
                <FaCogs size={13} /> Repuestos
              </Link>
            </li>
            <li>
              <Link to="/ips" style={linkStyle('/ips')}>
                <FaHospital size={13} /> IPS
              </Link>
            </li>
            <li className="nav-item-logout">
              <button
                onClick={logout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  backgroundColor: 'rgba(239, 68, 68, 0.18)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                <FaSignOutAlt size={13} /> Salir
              </button>
            </li>
          </ul>
        )}

        {/* Regular User Navigation */}
        {user && user?.rol !== 'admin' && (
          <ul className="nav-list">
            <li>
              <Link to="/inventariouser" style={linkStyle('/inventariouser')}>
                <FaBoxes size={13} /> Inventario
              </Link>
            </li>
            <li>
              <Link to="/cronogramauser" style={linkStyle('/cronogramauser')}>
                <FaCalendarAlt size={13} /> Cronograma
              </Link>
            </li>
            <li className="nav-item-logout">
              <button
                onClick={logout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  backgroundColor: 'rgba(239, 68, 68, 0.18)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                <FaSignOutAlt size={13} /> Salir
              </button>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
