import { useState, useEffect, useRef } from 'react';
import { apiObtenerReporte, apiEliminarReportes } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import generatePDF, { Resolution } from 'react-to-pdf';

function ReportePdf() {
  const imgIng = useRef({});
  const imgRec = useRef({});
  const [reporte, setReporte] = useState([]);
  const targetRef = useRef();

  const options = {
    filename: `Reporte Nº${reporte.numero_reporte}`,
    method: 'save',
    resolution: Resolution.MEDIUM,
    page: {
      margin: {
        top: 20,
        right: 5,
        bottom: 10,
        left: 5,
      },
      format: 'government-letter',
      orientation: 'portrait',
    },
    canvas: {
      mimeType: 'image/jpeg',
      qualityRatio: 1,
    },
  };

  const deleteReport = async () => {
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
        <button
          className="button"
          style={{ width: '300px', margin: '10px' }}
          onClick={() => generatePDF(targetRef, options)}
        >
          Download PDF
        </button>
        <button
          className="button"
          style={{ width: '300px', margin: '10px' }}
          onClick={deleteReport}
        >
          Eliminar Reporte
        </button>
      </div>
      <div className="contenedor" ref={targetRef}>
        <main>
          <section>
            <div>
              <div>
                <table className="tabla-reporte">
                  <thead>
                    <tr>
                      <td colSpan={2}>
                        <img
                          src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                          alt=""
                          width="250"
                        />
                      </td>
                      <td
                        style={{
                          fontSize: '120%',
                          color: 'red',
                          textAlign: 'center',
                        }}
                        colSpan={2}
                      >
                        Nº DE REPORTE: {reporte?.numero_reporte}{' '}
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th colSpan={4}>INFORMACION DE LA INSTITUCIÓN</th>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label>IPS/CLINICA: {reporte?.institucion} </label>
                      </td>
                      <td colSpan={2}>
                        <label>FECHA: {reporte?.fecha} </label>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label>SERVICIO: {reporte?.servicio} </label>
                      </td>
                      <td colSpan={2}>
                        <label>CIUDAD: {reporte?.ciudad} </label>
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
                        <label>EQUIPO: {reporte?.marca} </label>
                      </td>
                      <td colSpan={2}>
                        <label>MARCA: {reporte?.marca} </label>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label>MODELO: {reporte?.modelo} </label>
                      </td>
                      <td colSpan={2}>
                        <label>SERIE: {reporte?.serie} </label>
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
                      <th colSpan={4}>
                        REPUESTOS, INSUMOS, MATERIALES EMPLEADOS
                      </th>
                    </tr>
                    <tr>
                      <td>CANTIDAD</td>
                      <td colSpan={2}>DESCRIPCION</td>
                      <td>VALOR</td>
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
                      <td>PARÁMETRO</td>
                      <td colSpan={2} style={{ width: '200%' }}>
                        VALOR PROGRAMADO
                      </td>
                      <td>VALOR MEDIDO</td>
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
                      <td>{reporte?.parametro3}</td>
                      <td colSpan={2}>{reporte?.valor_programado3}</td>
                      <td>{reporte?.valor_medido3}</td>
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
                        <label style={{ fontSize: '12px' }}>FIRMA: </label>
                        <SignatureCanvas
                          ref={imgIng}
                          canvasProps={{
                            width: 450,
                            height: 150,
                          }}
                        />
                      </td>
                      <td colSpan={2}>
                        <SignatureCanvas
                          ref={imgRec}
                          canvasProps={{ width: 450, height: 150 }}
                        />
                        <label style={{ fontSize: '12px' }}>FIRMA: </label>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label style={{ fontSize: '12px', width: '100%' }}>
                          NOMBRE: {reporte?.nombre_ingeniero}
                        </label>
                      </td>
                      <td colSpan={2}>
                        <label style={{ fontSize: '12px', width: '100%' }}>
                          NOMBRE: {reporte?.nombre_recibe}
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label style={{ fontSize: '12px', width: '100%' }}>
                          CARGO: {reporte?.cargo_ingeniero}
                        </label>
                      </td>
                      <td colSpan={2}>
                        <label style={{ fontSize: '12px', width: '100%' }}>
                          CARGO: {reporte?.cargo_recibe}
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
export default ReportePdf;
