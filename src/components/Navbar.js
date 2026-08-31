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
  FaSignOutAlt 
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
        padding: '7px 13px',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: 'bold',
        textDecoration: 'none',
        backgroundColor: active ? '#f59e0b' : 'rgba(245, 158, 11, 0.25)',
        color: active ? '#000000' : '#fef3c7',
        border: '1px solid rgba(245, 158, 11, 0.5)',
        transition: 'all 0.2s',
      };
    }

    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '7px 12px',
      borderRadius: '8px',
      fontSize: '13.5px',
      fontWeight: active ? '600' : '500',
      textDecoration: 'none',
      backgroundColor: active ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
      color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
      border: active ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
      transition: 'all 0.2s',
    };
  };

  return (
    <header style={{ width: '100%' }}>
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
        {user?.rol === 'user' && (
          <ul className="nav-list">
            <li>
              <Link to="/inventariouser" style={linkStyle('/inventariouser')}>
                <FaBoxes size={13} /> Inventario
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
