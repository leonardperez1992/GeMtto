import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiInventario } from '../utils/api';
import request from '../utils/request';

function Inventario() {
  const [inventario, setInventario] = useState([]);

  const getInventario = async () => {
    const response = await request({
      link: apiInventario,
      method: 'GET',
    });
    if (response.success) {
      setInventario(response.inventario);
    } else {
      alert(`Sin conexión con el Servidor ${response.message}`);
    }
  };

  useEffect(function () {
    getInventario();
  }, []);

  const [buscar, setBuscar] = useState('');

  const handleSave = (e) => {
    setBuscar(e.target.value);
  };

  var inventarios = {};
  if (!buscar) {
    inventarios = inventario;
  } else {
    inventarios = inventario.filter((dato) =>
      dato.serie.toLowerCase().includes(buscar.toLowerCase())
    );
  }
  return (
    <div>
      <main className="flex-shrink-0">
        <section>
          <div className="panel-body" style={{ margin: '1%' }}>
            <div className="d-flex justify-content-center fw-bolder">
              <h3>Inventario General</h3>
            </div>
            <p>
              ¿Agregar Equipo?
              <Link to="/createinventary" className="link">
                Agregalo aquí
              </Link>
            </p>
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
                    <th>EQUIPO</th>
                    <th>MARCA</th>
                    <th>MODELO</th>
                    <th>SERIE</th>
                    <th>INSTITUCION</th>
                    <th>SERVICIO</th>
                    <th>UBICACIÓN</th>
                    <th>REG. INVIMA</th>
                    <th>RIESGO</th>
                    <th>RESPONSABLE</th>
                    <th>ACCION</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarios.map(function (item) {
                    return (
                      <tr>
                        <td>{item?.equipo}</td>
                        <td>{item?.marca}</td>
                        <td>{item?.modelo}</td>
                        <td>{item?.serie}</td>
                        <td>{item?.institucion}</td>
                        <td>{item?.servicio}</td>
                        <td>{item?.ubicacion}</td>
                        <td>{item?.registro_invima}</td>
                        <td>{item?.riesgo}</td>
                        <td>{item?.responsable}</td>
                        <td>
                          <Link
                            to={`/reporteService?id=${item._id}`}
                            className="nav-link"
                          >
                            Reporte
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
export default Inventario;
