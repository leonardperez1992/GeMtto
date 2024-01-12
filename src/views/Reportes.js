import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiReportes } from '../utils/api';
import request from '../utils/request';

function Reportes() {
  const [reportes, setReportes] = useState([]);

  const getReportes = async () => {
    const response = await request({
      link: apiReportes,
      method: 'GET',
    });
    if (response.success) {
      setReportes(response.reporte);
    } else {
      alert(`${response.message}`);
    }
  };

  useEffect(function () {
    getReportes();
  }, []);

  const [buscar, setBuscar] = useState('');
  const handleSave = (e) => {
    setBuscar(e.target.value);
  };

  var inventarios = {};
  if (!buscar) {
    inventarios = reportes;
  } else {
    inventarios = reportes.filter((dato) =>
      dato.serie.toLowerCase().includes(buscar.toLowerCase())
    );
  }
  return (
    <div>
      <main className="flex-shrink-0">
        <section>
          <div className="panel-body" style={{ margin: '1%' }}>
            <div className="d-flex justify-content-center fw-bolder">
              <h3>Listado de Reportes</h3>
            </div>
            <div>
              <div
                style={{
                  width: '20%',
                  margin: 10,
                }}
              >
                <h4>Buscar:</h4>
                <input
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    margin: 5,
                    borderRadius: 10,
                    borderStyle: 'solid',
                    height: 43,
                  }}
                  value={buscar}
                  type="text"
                  placeholder="Digite la serie"
                  onChange={handleSave}
                />
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nº REPORTE</th>
                    <th>FECHA</th>
                    <th>EQUIPO</th>
                    <th>MARCA</th>
                    <th>MODELO</th>
                    <th>SERIE</th>
                    <th>INSTITUCION</th>
                    <th>SERVICIO</th>
                    <th>RESPONSABLE</th>
                    <th>ACCION</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarios.map(function (item) {
                    return (
                      <tr>
                        <td>{item?.numero_reporte}</td>
                        <td>{item?.fecha}</td>
                        <td>{item?.equipo}</td>
                        <td>{item?.marca}</td>
                        <td>{item?.modelo}</td>
                        <td>{item?.serie}</td>
                        <td>{item?.institucion}</td>
                        <td>{item?.servicio}</td>
                        <td>{item?.nombre_ingeniero}</td>
                        <td>
                          <Link
                            to={`/reporte?id=${item._id}`}
                            className="nav-link"
                          >
                            Ver
                          </Link>
                        </td>
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
export default Reportes;
