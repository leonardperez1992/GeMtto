import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiInventario } from '../utils/api';
import request from '../utils/request';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';
import { GoSearch } from 'react-icons/go';

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
  } else if (buscar) {
    inventarios = inventario.filter((dato) =>
      dato.serie.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  return (
    <div className="contenedor">
      <main>
        <section>
          <div>
            <div
              className="div-buscar"
              style={{ display: 'inline-block', width: '50%' }}
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
                to="/createinventary"
                className="link"
              >
                <HiOutlineDocumentPlus title="Crear" size={25} />
              </Link>
              <input
                style={{
                  width: '50%',
                  backgroundColor: '#ecf4f6',
                  borderStyle: 'solid',
                  borderColor: 'gray',
                  borderWidth: '1px',
                  borderRadius: '5px',
                }}
                value={buscar}
                type="text"
                placeholder="Digite la serie"
                onChange={handleSave}
              />
              <GoSearch size={30} />
            </div>
            <div>
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
                          <div
                            style={{
                              width: '90%',
                              display: 'inline-block',
                              flexWrap: 'wrap',
                            }}
                          >
                            <Link
                              to={`/reporteService?id=${item?._id}&equipo=${item?.equipo}`}
                              className="nav-link"
                            >
                              <HiOutlineDocumentPlus
                                style={{ padding: '5px' }}
                                title="Reporte"
                                size={20}
                              />
                            </Link>

                            <Link
                              to={`/hojadevida?id=${item._id}&modelo=${item.modelo}&serie=${item.serie}&institucion=${item.institucion}`}
                              className="nav-link"
                            >
                              <GoEye
                                style={{ padding: '5px' }}
                                title="Ver"
                                size={20}
                              />
                            </Link>

                            <Link
                              to={`/editarequipo?id=${item?._id}`}
                              className="nav-link"
                            >
                              <CiEdit
                                style={{ padding: '5px' }}
                                title="Editar"
                                size={20}
                              />
                            </Link>
                          </div>
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
