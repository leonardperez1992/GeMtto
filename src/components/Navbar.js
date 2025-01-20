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
      <header>
        <nav className="navbar">
          <div className="contenedor">
            <img
              src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
              alt=""
              className="imagen"
            />
            <div className="contenedor">
              {user?.rol === 'admin' && (
                <div>
                  <ul className="nav-list">
                    <li>
                      <Link to="/actmtto" className="nav-link">
                        Act Mtto
                      </Link>
                    </li>
                    <li>
                      <Link to="/informes" className="nav-link">
                        Informes
                      </Link>
                    </li>
                    <li>
                      <Link to="/fichastecnicas" className="nav-link">
                        Ficha tec.
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
                      <Link to="/repuestos" className="nav-link">
                        Repuestos
                      </Link>
                    </li>
                    <li>
                      <Link to="/ips" className="nav-link">
                        Ips
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/" className="nav-link" onClick={logout}>
                        Logout
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
              {user?.rol === 'user' && (
                <div>
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
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}
export default Navbar;
