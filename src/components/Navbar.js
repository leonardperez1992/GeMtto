import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

function Navbar() {
  const user = useSelector((state) => state.user);
  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './login';
  };

  return (
    <div style={{ width: '100%' }}>
      <header>
        <nav className="navbar">
          <img
            src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
            alt=""
            className="imagen"
          />

          {user?.rol === 'admin' && (
            <ul className="nav-list">
              <li>
                <Link
                  to="/actmtto"
                  className="nav-link"
                  style={{ color: 'white' }}
                >
                  Act Mtto
                </Link>
              </li>
              <li>
                <Link
                  to="/informes"
                  className="nav-link"
                  style={{ color: 'white' }}
                >
                  Informes
                </Link>
              </li>
              <li>
                <Link
                  to="/fichastecnicas"
                  className="nav-link"
                  style={{ color: 'white' }}
                >
                  Ficha tec.
                </Link>
              </li>
              <li>
                <Link
                  to="/inventarioua"
                  className="nav-link"
                  style={{ color: 'white' }}
                >
                  Inventario
                </Link>
              </li>
              <li>
                <Link
                  to="/reportes"
                  className="nav-link"
                  style={{ color: 'white' }}
                >
                  Reportes
                </Link>
              </li>
              <li>
                <Link
                  to="/repuestos"
                  className="nav-link"
                  style={{ color: 'white' }}
                >
                  Repuestos
                </Link>
              </li>
              <li>
                <Link to="/ips" className="nav-link" style={{ color: 'white' }}>
                  Ips
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/"
                  className="nav-link"
                  onClick={logout}
                  style={{ color: 'white' }}
                >
                  Logout
                </Link>
              </li>
            </ul>
          )}
          {user?.rol === 'user' && (
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/inventariouser" className="nav-link">
                  Inventario
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/" className="nav-link" onClick={logout}>
                  Cerrar Sesión
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </header>
    </div>
  );
}
export default Navbar;
