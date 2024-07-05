import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiReportes } from '../utils/api';
import request from '../utils/request';
import { FaFileSignature } from 'react-icons/fa';
import { GoSearch } from 'react-icons/go';
import { GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

function Repuestos() {
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
      dato.institucion.toLowerCase().includes(buscar.toLowerCase())
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
                <input
                  className="input-buscar"
                  value={buscar}
                  placeholder="Digite la Ips"
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
                    <th>CANTIDAD</th>
                    <th>DESCRIPCION</th>
                    <th>VALOR</th>
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
                        <td>
                          {item?.cantidad1}
                          <br></br>
                          {item?.cantidad2}
                          <br></br>
                          {item?.cantidad3}
                          <br></br>
                          {item?.cantidad4}
                        </td>
                        <td>
                          {item?.descripcion1}
                          <br></br>
                          {item?.descripcion2}
                          <br></br>
                          {item?.descripcion3}
                          <br></br>
                          {item?.descripcion4}
                        </td>
                        <td>
                          {item?.valor1}
                          <br></br>
                          {item?.valor2}
                          <br></br>
                          {item?.valor3}
                          <br></br>
                          {item?.valor4}
                        </td>

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
export default Repuestos;
