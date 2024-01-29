import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  apiObtenerEquipo,
  apiObtenerFicha,
  apiObtenerReportes,
} from '../utils/api';
import request from '../utils/request';

function HojaDeVida() {
  const [equipo, setEquipo] = useState([]);
  const [ficha, setFicha] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [imagen, setImagen] = useState([]);

  const obtenerEquipos = async (id) => {
    const response = await request({
      link: apiObtenerEquipo,
      method: 'GET',
      body: { id },
    });
    if (response.success) {
      setEquipo(response.equipo);
    } else {
      alert(`${response.message}`);
    }
  };

  const obtenerFicha = async (modelo) => {
    const response = await request({
      link: apiObtenerFicha,
      method: 'GET',
      body: { modelo },
    });
    if (response.success) {
      setFicha(response.ficha);
      setImagen(response.ficha.imagen[0].data_url);
    } else {
      alert(`${response.message}`);
    }
  };

  const obtenerReportes = async (serie) => {
    const response = await request({
      link: apiObtenerReportes,
      method: 'GET',
      body: { serie },
    });
    if (response.success) {
      setReportes(response.reportes);
    } else {
      alert(`${response.message}`);
    }
  };

  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    let modelo = queryParameters.get('modelo');
    let serie = queryParameters.get('serie');
    if (!idEquipo || !modelo) {
      alert('Por favor Seleccione un equipo en la pestaña de Inventario');
    }
    obtenerEquipos(idEquipo);
    obtenerFicha(modelo);
    obtenerReportes(serie);
  }, []);

  return (
    <div className="contenedor">
      <main>
        <section>
          <div>
            <div>
              <table className="tabla-reporte-2">
                <thead>
                  <tr>
                    <td colSpan={2} style={{ backgroundColor: 'white' }}>
                      <img
                        src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                        alt=""
                        width="250"
                      />
                    </td>
                    <td
                      style={{
                        backgroundColor: 'white',
                        width: '30%',
                        color: 'black',
                        textAlign: 'center',
                        fontSize: '20px',
                      }}
                    >
                      HOJA DE VIDA DE EQUIPOS BIOMÉDICOS
                    </td>
                    <td
                      style={{
                        backgroundColor: 'white',
                        width: '30%',
                        color: 'black',
                        textAlign: 'left',
                        fontSize: '15px',
                      }}
                    >
                      <label>CÓDIGO:</label>
                      <br></br>
                      <label>VERSIÓN:</label>
                      <br></br>
                      <label>FECHA:</label>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th colSpan={1}>
                      <label>IPS/CLIENTE: </label>
                    </th>
                    <td colSpan={3}>{equipo?.institucion}</td>
                  </tr>
                  <tr>
                    <th colSpan={1}>
                      <label>SERVICIO: </label>
                    </th>
                    <td colSpan={3}>{equipo?.servicio}</td>
                  </tr>
                  <tr>
                    <th colSpan={1}>
                      <label>UBICACIÓN: </label>
                    </th>
                    <td colSpan={3}>{equipo?.ubicacion}</td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        backgroundColor: 'rgb(0, 74, 116)',
                        color: 'white',
                      }}
                    >
                      1,1 IDENTIFICACIÓN
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} rowSpan={7}>
                      <img src={imagen} alt="" width="250" />
                    </td>
                    <th>EQUIPO</th>
                    <td>{equipo?.equipo}</td>
                  </tr>
                  <tr>
                    <th>MARCA</th>
                    <td>{equipo?.marca}</td>
                  </tr>
                  <tr>
                    <th>MODELO</th>
                    <td> {equipo?.modelo}</td>
                  </tr>
                  <tr>
                    <th>SERIE</th>
                    <td>{equipo?.serie}</td>
                  </tr>
                  <tr>
                    <th>INVENTARIO</th>
                    <td>{equipo?.inventario}</td>
                  </tr>
                  <tr>
                    <th>REG. SANITARIO</th>
                    <td>{equipo?.registro_invima}</td>
                  </tr>
                  <tr>
                    <th>TIPO DE RIESGO</th>
                    <td>{equipo?.riesgo}</td>
                  </tr>
                  <tr>
                    <th>FORMA DE ADQUISICIÓN</th>
                    <td>{equipo?.forma_adquisicion}</td>
                    <th>FECHA DE INSTALACIÓN</th>
                    <td>{equipo?.fecha_instalacion}</td>
                  </tr>
                  <tr>
                    <th>FECHA DE FABRICACIÓN</th>
                    <td>{equipo?.fecha_fabricacion}</td>
                    <th>PERIODICIDAD DE MTTO</th>
                    <td>{equipo?.periodicidad}</td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        backgroundColor: 'rgb(0, 74, 116)',
                        color: 'white',
                      }}
                    >
                      1,2 INFORMACIÓN TÉCNICA
                    </td>
                  </tr>
                  <tr>
                    <th>CLASIFIACIÓN BIOMÉDICA</th>
                    <td>{ficha?.clas_biomedica}</td>
                    <th>TECNOLOGÍA PREDOMINANTE</th>
                    <td>{ficha?.tecnologia}</td>
                  </tr>
                  <tr>
                    <th>VOLTAJE</th>
                    <td>{ficha?.voltaje}</td>
                    <th>AMPERAJE</th>
                    <td>{ficha?.amperaje}</td>
                  </tr>
                  <tr>
                    <th>TEMPERATURA</th>
                    <td>{ficha?.temperatura}</td>
                    <th>FRECUENCIA</th>
                    <td>{ficha?.frecuencia}</td>
                  </tr>
                  <tr>
                    <th>POTENCIA</th>
                    <td>{ficha?.potencia}</td>
                    <th>BATERÍA</th>
                    <td>{ficha?.bateria}</td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        backgroundColor: 'rgb(0, 74, 116)',
                        color: 'white',
                      }}
                    >
                      1,3 ACCESORIOS
                    </td>
                    <td
                      colSpan={3}
                      style={{
                        backgroundColor: 'rgb(0, 74, 116)',
                        color: 'white',
                      }}
                    >
                      CANTIDAD
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio1}</td>
                    <td>{ficha?.cantidad1}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio2}</td>
                    <td>{ficha?.cantidad2}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio3}</td>
                    <td>{ficha?.cantidad3}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio4}</td>
                    <td>{ficha?.cantidad4}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio5}</td>
                    <td>{ficha?.cantidad5}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio6}</td>
                    <td>{ficha?.cantidad6}</td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        backgroundColor: 'rgb(0, 74, 116)',
                        color: 'white',
                      }}
                    >
                      1,3 RECOMENDACIONES DE FABRICANTE
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ height: '200px' }}>
                      {ficha?.recomendaciones}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="tabla-reporte-2">
                <thead>
                  <tr>
                    {' '}
                    <td
                      colSpan={6}
                      style={{
                        backgroundColor: 'rgb(0, 74, 116)',
                        color: 'white',
                      }}
                    >
                      1,3 REGISTRO DE ACTIVIDADES
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>FECHA</th>
                    <th>TIPO DE MTTO</th>
                    <th>OBSERVACIÓN</th>
                    <th>RESPONSABLE</th>
                    <th>No. REPORTE</th>
                    <th>ACCION</th>
                  </tr>
                  {reportes.map(function (item) {
                    return (
                      <tr>
                        <td>{item?.fecha}</td>
                        <td>{item?.tipo_servicio}</td>
                        <td>{item?.observaciones}</td>
                        <td>{item?.nombre_ingeniero}</td>
                        <td>{item?.numero_reporte}</td>
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
export default HojaDeVida;
