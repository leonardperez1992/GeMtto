import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiFicha } from '../utils/api';
import request from '../utils/request';

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
                  to="/crearfichatecnica"
                  className="link"
                >
                  ¡Agregar Ficha Tecnica!
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
                    <th>MARCA</th>
                    <th>MODELO</th>
                    <th>CLAS. BIOMEDICA</th>
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
                            Editar
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
export default FichasTecnicas;
