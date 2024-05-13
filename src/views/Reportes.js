import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiReportes } from '../utils/api';
import request from '../utils/request';
import { FaFileSignature } from 'react-icons/fa';
import { GoSearch } from 'react-icons/go';
import { GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

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

  var inventarios = {};
  if (!buscar) {
    inventarios = reportes;
  } else {
    inventarios = reportes.filter((dato) =>
      dato.serie.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  inventarios.sort(function (a, b) {
    if (a.fecha < b.fecha) {
      return 1;
    }
    if (a.fecha > b.fecha) {
      return -1;
    }
    return 0;
  });
  return (
    <div className="contenedor">
      <main>
        <section>
          <div>
            <div>
              <div
                className="div-buscar"
                style={{ display: 'inline-block', alignContent: 'center' }}
              >
                <Link
                  style={{
                    fontSize: '25px',
                    width: '100px',
                    padding: '5px',
                    borderRadius: '10px',
                    backgroundColor: '#dfeaf5',
                    fontStyle: 'normal',
                  }}
                  to="/firmareportes"
                  className="link"
                >
                  <FaFileSignature title="Firmar" size={30} />
                </Link>
                <input
                  className="input-buscar"
                  value={buscar}
                  placeholder="Digite la serie"
                  onChange={handleSave}
                />
                <GoSearch size={25} />
              </div>
              <table className="tabla-actividades">
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
                            <GoEye
                              style={{ padding: '5px' }}
                              title="Ver"
                              size={20}
                            />
                          </Link>
                          <br></br>
                          <Link
                            to={`/editareporte?id=${item._id}`}
                            className="nav-link"
                          >
                            <CiEdit
                              style={{ padding: '5px' }}
                              title="Editar"
                              size={20}
                            />
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
