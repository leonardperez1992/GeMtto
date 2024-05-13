import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiActMtto } from '../utils/api';
import request from '../utils/request';
import { LuClipboardEdit } from 'react-icons/lu';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { GoSearch } from 'react-icons/go';

function ActMtto() {
  const [actmtto, setActmtto] = useState([]);

  const getReportes = async () => {
    const response = await request({
      link: apiActMtto,
      method: 'GET',
    });
    if (response.success) {
      setActmtto(response.actmtto);
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

  var actividades = {};
  if (!buscar) {
    actividades = actmtto;
  } else {
    actividades = actmtto.filter((dato) =>
      dato.equipo.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  actividades.sort(function (a, b) {
    if (a.equipo > b.equipo) {
      return 1;
    }
    if (a.equipo < b.equipo) {
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
              <div className="div-buscar" style={{ display: 'inline-block' }}>
                <Link
                  style={{
                    fontSize: '25px',
                    width: '100px',
                    padding: '5px',
                    borderRadius: '10px',
                    backgroundColor: '#dfeaf5',
                    fontStyle: 'normal',
                  }}
                  to="/createactmtto"
                  className="link"
                >
                  <HiOutlineDocumentPlus title="Crear" size={25} />
                </Link>
                <input
                  style={{ backgroundColor: '#ecf4f6' }}
                  className="input-buscar"
                  value={buscar}
                  placeholder="Equipo"
                  onChange={handleSave}
                />
                <GoSearch size={25} />
              </div>
              <table className="tabla-actividades">
                <thead>
                  <tr>
                    <th>EQUIPO</th>
                    <th>PARAMETRO 1</th>
                    <th>PARAMETRO 2</th>
                    <th>PARAMETRO 3</th>
                    <th>PARAMETRO 4</th>
                    <th>PARAMETRO 5</th>
                    <th>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {actividades.map(function (item) {
                    return (
                      <tr>
                        <td>{item?.equipo}</td>
                        <td>{item?.parametro1}</td>
                        <td>{item?.parametro2}</td>
                        <td>{item?.parametro3}</td>
                        <td>{item?.parametro4}</td>
                        <td>{item?.parametro5}</td>
                        <td>
                          <Link
                            to={`/editaract?id=${item?._id}`}
                            className="nav-link"
                          >
                            <LuClipboardEdit size={20} title="Editar" />
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
export default ActMtto;
