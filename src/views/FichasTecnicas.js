import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiFicha } from '../utils/api';
import request from '../utils/request';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { GoSearch } from 'react-icons/go';
import { LuClipboardEdit } from 'react-icons/lu';

function FichasTecnicas() {
  const [fichas, setFichas] = useState([]);

  const getReportes = async () => {
    const response = await request({
      link: apiFicha,
      method: 'GET',
    });
    if (response.success) {
      setFichas(response.fichas);
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

  var fichasTecnicas = {};
  if (!buscar) {
    fichasTecnicas = fichas;
  } else {
    fichasTecnicas = fichas.filter((dato) =>
      dato.marca.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  fichasTecnicas.sort(function (a, b) {
    if (a.marca > b.marca) {
      return 1;
    }
    if (a.marca < b.marca) {
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
                to="/crearfichatecnica"
                className="link"
              >
                <HiOutlineDocumentPlus title="Crear" size={25} />
              </Link>

              <input
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
                  <th>MARCA</th>
                  <th>MODELO</th>
                  <th>RIESGO</th>
                  <th>TECNOLOGÍA</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {fichasTecnicas.map(function (item) {
                  return (
                    <tr>
                      <td>{item?.marca}</td>
                      <td>{item?.modelo}</td>
                      <td>{item?.clas_biomedica}</td>
                      <td>{item?.tecnologia}</td>
                      <td>
                        <Link
                          to={`/editarfichatecnica?id=${item?._id}`}
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
        </section>
      </main>
    </div>
  );
}
export default FichasTecnicas;
