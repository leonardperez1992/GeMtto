import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiIps } from '../utils/api';
import request from '../utils/request';

function Ips() {
  const [ips, setIps] = useState([]);

  const getReportes = async () => {
    const response = await request({
      link: apiIps,
      method: 'GET',
    });
    if (response.success) {
      setIps(response.ips);
    } else {
      alert(`Sin conexión con el Servidor ${response.message}`);
    }
  };

  useEffect(function () {
    getReportes();
  }, []);

  const [buscar, setBuscar] = useState('');
  const handleSave = (e) => {
    setBuscar(e.target.value);
  };

  var Ipss = {};
  if (!buscar) {
    Ipss = ips;
  } else {
    Ipss = ips.filter((dato) =>
      dato.ips.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  Ipss.sort(function (a, b) {
    if (a.ips > b.ips) {
      return 1;
    }
    if (a.ips < b.ips) {
      return -1;
    }
    // a must be equal to b
    return 0;
  });

  return (
    <div className="contenedor">
      <main>
        <section>
          <div>
            <div>
              <p>
                <Link
                  style={{
                    fontSize: '25px',
                    border: '2px solid gray',
                    width: '100px',
                    padding: '10px',
                    borderRadius: '10px',
                  }}
                  to="/crearips"
                  className="link"
                >
                  ¡Agregar Ips!
                </Link>
              </p>
              <div className="div-buscar">
                <label>Buscar:</label>
                <input
                  className="input-buscar"
                  value={buscar}
                  placeholder="Equipo"
                  onChange={handleSave}
                />
              </div>
              <table className="tabla-actividades">
                <thead>
                  <tr>
                    <th>NOMBRE</th>
                    <th>NIT</th>
                    <th>CIUDAD</th>
                  </tr>
                </thead>
                <tbody>
                  {Ipss.map(function (item) {
                    return (
                      <tr>
                        <td>{item?.ips}</td>
                        <td>{item?.nit}</td>
                        <td>{item?.ciudad}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default Ips;
