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
    <div>
      <nav className="navbar">
        <div className="contenedor">
          <img
            src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
            alt=""
            className="imagen"
          />
          <div className="contenedor">
            <ul className="nav-list">
              {user?.rol === 'admin' && (
                <div>
                  <ul className="nav-list">
                    <li>
                      <Link to="/createactmtto" className="nav-link">
                        Actividades de Mantenimiento
                      </Link>
                    </li>
                    <li>
                      <Link to="/inventarioua" className="nav-link">
                        Inventario
                      </Link>
                    </li>
                    <li>
                      <Link to="/reportes" className="nav-link">
                        Reportes
                      </Link>
                    </li>
                    <li>
                      <Link to="/firmareportes" className="nav-link">
                        Firmar Reportes
                      </Link>
                    </li>
                    <li>
                      <Link to="/correctivo" className="nav-link">
                        Correctivo
                      </Link>
                    </li>
                    <li>
                      <Link to="/crearips" className="nav-link">
                        Crear Ips
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/" className="nav-link" onClick={logout}>
                        Cerrar Sesión
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
              {user?.rol === 'user' && (
                <div>
                  <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                      <Link to="/servicios" className="nav-link">
                        Servicios
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/" className="nav-link" onClick={logout}>
                        Cerrar Sesión
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}
export default Navbar;
