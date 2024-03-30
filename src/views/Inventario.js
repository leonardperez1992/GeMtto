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
  } else if (buscar) {
    inventarios = inventario.filter((dato) =>
      dato.serie.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  return (
    <div className="contenedor">
      <div>
        <table className="table">
          <thead>
            <tr>
              <td colSpan={3}>
                <input
                  style={{
                    width: '80%',
                    borderWidth: 1,
                    margin: 5,
                    borderRadius: 10,
                    borderStyle: 'solid',
                  }}
                  value={buscar}
                  type="text"
                  placeholder="Buscar: Digite la serie"
                  onChange={handleSave}
                />
              </td>
            </tr>
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
                      to={`/reporteService?id=${item?._id}&equipo=${item?.equipo}`}
                      className="nav-link"
                    >
                      Reporte
                    </Link>
                    <br></br>
                    <Link
                      to={`/hojadevida?id=${item._id}&modelo=${item.modelo}&serie=${item.serie}&institucion=${item.institucion}`}
                      className="nav-link"
                    >
                      Hoja de Vida
                    </Link>
                    <br></br>
                    <Link
                      to={`/editarequipo?id=${item?._id}`}
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
  );
}
export default Inventario;
