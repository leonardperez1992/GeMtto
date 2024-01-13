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
        right: 16,
        bottom: 10,
        left: 0,
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

  const obtenerEquipos = async (id) => {
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
    obtenerEquipos(idEquipo);
  }, []);

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
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
      <div className="container" ref={targetRef}>
        <main className="flex-shrink-0">
          <section>
            <div
              className="panel-body"
              style={{ margin: '10%', paddingBlockEnd: '5%' }}
            >
              <div className="panel-body">
                <table
                  className="table"
                  style={{ margin: '10px', padding: '50PX' }}
                >
                  <thead style={{ backgroundColor: '#4169e1', color: 'white' }}>
                    <tr>
                      <td style={{ backgroundColor: 'white' }}>
                        <img
                          src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                          alt=""
                          width="250"
                        />
                      </td>
                      <td
                        style={{
                          backgroundColor: 'white',
                          color: 'black',
                          fontSize: '20px',
                        }}
                      ></td>
                      <td
                        style={{
                          backgroundColor: 'white',
                          color: 'black',
                          textAlign: 'center',
                          fontSize: '20px',
                        }}
                      >
                        Nº DE REPORTE: {reporte?.numero_reporte}{' '}
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        INFORMACION DE LA INSTITUCIÓN
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label>IPS/CLINICA: {reporte?.institucion} </label>
                      </td>
                      <td>
                        <label>FECHA: {reporte?.fecha} </label>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <label>SERVICIO: {reporte?.servicio} </label>
                      </td>
                      <td>
                        <label>CIUDAD: {reporte?.ciudad} </label>
                      </td>
                    </tr>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        TIPO DE SERVICIO
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={3}>{reporte?.tipo_servicio}</th>
                    </tr>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        INFORMACION DEL EQUIPO
                      </th>
                    </tr>
                    <tr>
                      <td style={{ backgroundColor: 'white' }}>
                        <label>EQUIPO: {reporte?.marca} </label>
                      </td>
                      <td>
                        <label>MARCA: {reporte?.marca} </label>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <label>MODELO: {reporte?.modelo} </label>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ backgroundColor: 'white' }}>
                        <label>SERIE: {reporte?.serie} </label>
                      </td>
                      <td>
                        <label>INVENTARIO: {reporte?.inventario} </label>
                      </td>
                    </tr>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        PROBLEMA REPORTADO POR EL CLIENTE
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={3}>{reporte?.problema_reportado}</td>
                    </tr>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        DESCRIPCION DEL SERVICIO
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={3}>{reporte?.desc_servicio}</td>
                    </tr>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        REPUESTOS, INSUMOS, MATERIALES EMPLEADOS
                      </th>
                    </tr>
                    <tr>
                      <th className="th-reporte">CANTIDAD</th>
                      <th className="th-reporte">DESCRIPCION</th>
                      <th className="th-reporte">VALOR</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.cantidad1}</th>
                      <th className="th-reporte">{reporte?.descripcion1}</th>
                      <th className="th-reporte">{reporte?.valor1}</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.cantidad2}</th>
                      <th className="th-reporte">{reporte?.descripcion2}</th>
                      <th className="th-reporte">{reporte?.valor2}</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.cantidad3}</th>
                      <th className="th-reporte">{reporte?.descripcion3}</th>
                      <th className="th-reporte">{reporte?.valor3}</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.cantidad4}</th>
                      <th className="th-reporte">{reporte?.descripcion4}</th>
                      <th className="th-reporte">{reporte?.valor4}</th>
                    </tr>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        VERIFICACION DE PARAMETROS
                      </th>
                    </tr>
                    <tr>
                      <th className="th-reporte">PARÁMETRO</th>
                      <th className="th-reporte">VALOR PROGRAMADO</th>
                      <th className="th-reporte">VALOR MEDIDO</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.parametro1}</th>
                      <th className="th-reporte">
                        {reporte?.valor_programado1}
                      </th>
                      <th className="th-reporte">{reporte?.valor_medido1}</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.parametro2}</th>
                      <th className="th-reporte">
                        {reporte?.valor_programado2}
                      </th>
                      <th className="th-reporte">{reporte?.valor_medido2}</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.parametro3}</th>
                      <th className="th-reporte">
                        {reporte?.valor_programado3}
                      </th>
                      <th className="th-reporte">{reporte?.valor_medido3}</th>
                    </tr>
                    <tr>
                      <th className="th-reporte">{reporte?.parametro4}</th>
                      <th className="th-reporte">
                        {reporte?.valor_programado4}
                      </th>
                      <th className="th-reporte">{reporte?.valor_medido4}</th>
                    </tr>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        ESTADO FINAL DEL EQUIPO
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={3}>{reporte?.estado_final}</th>
                    </tr>
                    <tr>
                      <th
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        INGENIERO/TECNICO
                      </th>
                      <th
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                        }}
                      ></th>
                      <th
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        RECIBÍ A SATISFACCION
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <td>
                          <label style={{ fontSize: '12px' }}>FIRMA: </label>
                          <SignatureCanvas
                            ref={imgIng}
                            canvasProps={{
                              width: 450,
                              height: 150,
                            }}
                          />
                        </td>
                      </td>
                      <td>
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
                      <td>
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
                      <td>
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
