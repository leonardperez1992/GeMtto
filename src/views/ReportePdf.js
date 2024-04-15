import { useState, useEffect, useRef } from 'react';
import { apiObtenerReporte, apiEliminarReportes } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import generatePDF, { Resolution } from 'react-to-pdf';
import { Link } from 'react-router-dom';

function ReportePdf() {
  const imgIng = useRef({});
  const imgRec = useRef({});
  const [reporte, setReporte] = useState([]);
  const targetRef = useRef();

  const options = {
    filename: `Reporte Nº${reporte.numero_reporte}`,
    method: 'save',
    resolution: Resolution.LOW,
    page: {
      margin: {
        top: 10,
        right: 0,
        bottom: 0,
        left: 0,
      },
      format: 'letter',
      orientation: 'portrait',
    },
    canvas: {
      mimeType: 'image/jpeg',
      qualityRatio: 10,
    },
  };

  const deleteReport = async () => {
    let confirmar = window.confirm('Deseas eliminar el equipo?');
    if (confirmar) {
      const body = {
        _id: reporte._id,
      };
      if (!body) {
        alert('Por favor Seleccione un equipo');
        window.location.href = './reportes';
      } else {
        const response = await request({
          link: apiEliminarReportes,
          body,
          method: 'POST',
        });
        if (response.success) {
          alert('Reporte eliminado exitosamente');
          window.location.href = './reportes';
        } else {
          alert(`${response.message}`);
        }
      }
    }
  };

  const obtenerReporte = async (id) => {
    const response = await request({
      link: apiObtenerReporte,
      method: 'GET',
      body: { id },
    });
    if (response.success) {
      setReporte(response.reporte);
      if (response.reporte.firma_ingeniero && response.reporte.firma_recibe) {
        imgIng.current.fromData(response.reporte.firma_ingeniero);
        imgRec.current.fromData(response.reporte.firma_recibe);
      }
    } else {
      alert(`${response.message}`);
    }
  };

  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    if (!idEquipo) {
      alert('Por favor Seleccione un equipo en la pestaña de Reportes');
      window.location.href = './inventarioua';
    }
    obtenerReporte(idEquipo);
  }, []);

  return (
    <div>
      <div>
        <div className="contenedor" ref={targetRef}>
          <table className="tabla-reporte">
            <thead>
              <tr>
                <td colSpan={2}>
                  <img
                    src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                    alt=""
                    width="50%"
                  />
                </td>
                <td
                  colSpan={2}
                  style={{
                    fontSize: '90%',
                    color: 'red',
                    textAlign: 'right',
                  }}
                >
                  Nº DE REPORTE: {reporte?.numero_reporte}{' '}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '90%',
                  }}
                >
                  REPORTE DE SERVICIO
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th colSpan={4}>INFORMACION DE LA INSTITUCIÓN</th>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label>IPS/CLINICA: </label>
                  {reporte?.institucion}
                </td>
                <td colSpan={2}>
                  <label>FECHA: </label>
                  {reporte?.fecha}
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label>SERVICIO: </label>
                  {reporte?.servicio}
                </td>
                <td colSpan={2}>
                  <label>CIUDAD: </label>
                  {reporte?.ciudad}
                </td>
              </tr>
              <tr>
                <th colSpan={4}>TIPO DE SERVICIO</th>
              </tr>
              <tr>
                <td colSpan={4}>{reporte?.tipo_servicio}</td>
              </tr>
              <tr>
                <th colSpan={4}>INFORMACION DEL EQUIPO</th>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label>EQUIPO: </label>
                  {reporte?.equipo}
                </td>
                <td colSpan={2}>
                  <label>MARCA: </label>
                  {reporte?.marca}
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label>MODELO: </label>
                  {reporte?.modelo}
                </td>
                <td colSpan={2}>
                  <label>SERIE: </label>
                  {reporte?.serie}
                </td>
              </tr>
              <tr>
                <th colSpan={4}>PROBLEMA REPORTADO POR EL CLIENTE</th>
              </tr>
              <tr>
                <td colSpan={4}>{reporte?.problema_reportado}</td>
              </tr>
              <tr>
                <th colSpan={4}>DESCRIPCION DEL SERVICIO</th>
              </tr>
              <tr>
                <td colSpan={4}>{reporte?.desc_servicio}</td>
              </tr>
              <tr>
                <th colSpan={4}>REPUESTOS, INSUMOS, MATERIALES EMPLEADOS</th>
              </tr>
              <tr>
                <td>
                  <label>CANTIDAD</label>
                </td>
                <td colSpan={2}>
                  <label>DESCRIPCION</label>
                </td>
                <td>
                  <label>VALOR</label>
                </td>
              </tr>
              <tr>
                <td>{reporte?.cantidad1}</td>
                <td colSpan={2}>{reporte?.descripcion1}</td>
                <td>{reporte?.valor1}</td>
              </tr>
              <tr>
                <td>{reporte?.cantidad2}</td>
                <td colSpan={2}>{reporte?.descripcion2}</td>
                <td>{reporte?.valor2}</td>
              </tr>
              <tr>
                <td>{reporte?.cantidad3}</td>
                <td colSpan={2}>{reporte?.descripcion3}</td>
                <td>{reporte?.valor3}</td>
              </tr>
              <tr>
                <td>{reporte?.cantidad4}</td>
                <td colSpan={2}>{reporte?.descripcion4}</td>
                <td>{reporte?.valor4}</td>
              </tr>
              <tr>
                <th colSpan={4}>VERIFICACION DE PARAMETROS</th>
              </tr>
              <tr>
                <td>
                  <label>PARÁMETRO</label>
                </td>
                <td colSpan={2}>
                  <label>VALOR PROGRAMADO</label>
                </td>
                <td>
                  <label>VALOR MEDIDO</label>
                </td>
              </tr>
              <tr>
                <td>{reporte?.parametro1}</td>
                <td colSpan={2}>{reporte?.valor_programado1}</td>
                <td>{reporte?.valor_medido1}</td>
              </tr>
              <tr>
                <td>{reporte?.parametro2}</td>
                <td colSpan={2}>{reporte?.valor_programado2}</td>
                <td>{reporte?.valor_medido2}</td>
              </tr>
              <tr>
                <td>{reporte?.parametro3}</td>
                <td colSpan={2}>{reporte?.valor_programado3}</td>
                <td>{reporte?.valor_medido3}</td>
              </tr>
              <tr>
                <td>{reporte?.parametro4}</td>
                <td colSpan={2}>{reporte?.valor_programado4}</td>
                <td>{reporte?.valor_medido4}</td>
              </tr>
              <tr>
                <th colSpan={4}>OBSERVACIONES</th>
              </tr>
              <tr>
                <td colSpan={2}>{reporte?.observaciones}</td>
                <td colSpan={2}>
                  <Link
                    to={`/verpdf?id=${reporte?.numero_reporte}`}
                    className="nav-link"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
              <tr>
                <th colSpan={4}>ESTADO FINAL DEL EQUIPO</th>
              </tr>
              <tr>
                <td colSpan={4}>{reporte?.estado_final}</td>
              </tr>
              <tr>
                <th colSpan={2}>INGENIERO/TECNICO</th>

                <th colSpan={2}>RECIBÍ A SATISFACCION</th>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label>FIRMA: </label>
                  <SignatureCanvas
                    ref={imgIng}
                    canvasProps={{ width: '400px', height: 150 }}
                  />
                </td>
                <td colSpan={2}>
                  <label>FIRMA: </label>
                  <SignatureCanvas
                    ref={imgRec}
                    canvasProps={{ width: '400px', height: 150 }}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label>NOMBRE: </label>
                  {reporte?.nombre_ingeniero}
                </td>
                <td colSpan={2}>
                  <label>NOMBRE: </label>
                  {reporte?.nombre_recibe}
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <label>CARGO: </label>
                  {reporte?.cargo_ingeniero}
                </td>
                <td colSpan={2}>
                  <label>CARGO: </label>
                  {reporte?.cargo_recibe}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'inline-block' }}>
        <button
          className="button"
          style={{ width: '20%', margin: '10px' }}
          onClick={() => generatePDF(targetRef, options)}
        >
          Descargar
        </button>
        <button
          className="button"
          style={{ width: '20%', margin: '10px' }}
          onClick={deleteReport}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
export default ReportePdf;
