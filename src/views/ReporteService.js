import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  apiCreateReporte,
  apiActMtto,
  apiObtenerEquipo,
  apiIps,
} from '../utils/api';
import request from '../utils/request';

function ReporteService() {
  const [actMtos, setActMtos] = useState([]);
  const [actMto, setActmto] = useState('');
  const [equipo, setEquipo] = useState([]);
  const [ips, setIps] = useState([]);
  const [ciudad, setCiudad] = useState('');
  const [firmaIng, setFirmaIng] = useState('');
  const [firmaRecibe, setFirmaRecibe] = useState('');

  const firmaIngRef = useRef({});
  const firmaRecref = useRef({});

  const saveFirmaIng = (signature) => {
    setFirmaIng(signature);
  };

  const saveFirmaRecibe = (signature) => {
    setFirmaRecibe(signature);
  };

  const obtenerActMtos = async () => {
    const response = await request({ link: apiActMtto, method: 'GET' });
    if (response.success) {
      setActMtos(response.actmtto);
    } else {
      alert(`${response.message}`);
    }
  };

  const obtenerIps = async () => {
    const response = await request({
      link: apiIps,
      method: 'GET',
    });
    if (response.success) {
      setIps(response.ips);
    } else {
      alert(`${response.message}`);
    }
  };

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

  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    if (!idEquipo) {
      alert('Por favor Seleccione un equipo en la pestaña de Inventario');
    }
    obtenerActMtos();
    obtenerEquipos(idEquipo);
    obtenerIps();
  }, []);

  const numReporte = useState(new Date().valueOf());

  const [reporte, setReporte] = useState({
    numero_reporte: '',
    institucion: '',
    fecha: '',
    servicio: '',
    ciudad: '',
    tipo_servicio: '',
    equipo: '',
    marca: '',
    modelo: '',
    serie: '',
    inventario: '',
    problema_reportado: '',
    desc_servicio: '',
    repuestos: '',
    verificacion: '',
    observaciones: '',
    estado_final: '',
    firma_ingeniero: '',
    nombre_ingeniero: '',
    cargo_ingeniero: '',
    firma_recibe: '',
    nombre_recibe: '',
    cargo_recibe: '',
  });

  const handleSave = (e) => {
    setReporte(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const CreateReport = async () => {
    const body = {
      numero_reporte: numReporte[0],
      institucion: equipo.institucion,
      fecha: reporte.fecha,
      servicio: equipo.servicio,
      ciudad: ciudad,
      tipo_servicio: reporte.tipo_servicio,
      equipo: equipo.equipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      serie: equipo.serie,
      inventario: equipo.inventario,
      problema_reportado: reporte.problema_reportado,
      desc_servicio: actMto,
      repuestos: reporte.repuestos,
      verificacion: reporte.verificacion,
      observaciones: reporte.observaciones,
      estado_final: reporte.estado_final,
      firma_ingeniero: firmaIng,
      nombre_ingeniero: reporte.nombre_ingeniero,
      cargo_ingeniero: reporte.cargo_ingeniero,
      firma_recibe: firmaRecibe,
      nombre_recibe: reporte.nombre_recibe,
      cargo_recibe: reporte.cargo_recibe,
    };
    if (!body.equipo) {
      alert('Por favor diligencie todos los campos.');
    } else {
      console.log(body);
      const response = await request({
        link: apiCreateReporte,
        body,
        method: 'POST',
      });
      if (response.success) {
        alert('Reporte creado exitosamente');
        window.location.href = './reportes';
      } else {
        alert(`${response.message}`);
      }
    }
  };

  return (
    <div className="contenedor">
      <main className="flex-shrink-0">
        <section>
          <div
            className="panel-body"
            style={{ margin: '10%', paddingBlockEnd: '5%' }}
          >
            <div>
              <table className="table" id="tablaDestino">
                <thead style={{ backgroundColor: '#343a40', color: 'white' }}>
                  <tr>
                    <td style={{ backgroundColor: 'white', width: '30%' }}>
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
                      REPORTE DE SERVICIO
                    </td>
                    <td
                      style={{
                        backgroundColor: 'white',
                        width: '30%',
                        color: 'black',
                        textAlign: 'center',
                        fontSize: '15px',
                      }}
                    >
                      Nº DE REPORTE:{' '}
                      <label style={{ color: 'red', fontSize: 20 }}>
                        {numReporte}
                      </label>
                    </td>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: 'white' }}>
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
                      <label>IPS/CLIENTE: {equipo?.institucion} </label>
                    </td>
                    <td>
                      <label>FECHA: </label>
                      <input
                        style={{ fontSize: '14px' }}
                        name="fecha"
                        type="date"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <label>SERVICIO: {equipo?.servicio} </label>
                    </td>
                    <td>
                      <label>CIUDAD: </label>
                      <select
                        className="select"
                        aria-label="select example"
                        onChange={function (e) {
                          setCiudad(e.target.value);
                        }}
                      >
                        <option value={''}>Seleccione</option>
                        {ips.map(function (value, index) {
                          return (
                            <option key={index} value={value.ciudad}>
                              {value.ciudad}
                            </option>
                          );
                        })}
                      </select>
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
                    <th colSpan={3}>
                      <th>
                        <input
                          name="tipo_servicio"
                          type="radio"
                          value="MTTO PREVENTIVO"
                          onChange={handleSave}
                        ></input>
                        <label> MTTO PREVENTIVO</label>
                      </th>
                      <th>
                        <input
                          name="tipo_servicio"
                          type="radio"
                          value="MTTO CORRECTIVO"
                          onChange={handleSave}
                        ></input>
                        <label> MTTO CORRECTIVO</label>
                      </th>
                      <th>
                        <input
                          name="tipo_servicio"
                          type="radio"
                          value="INSTALACION"
                          onChange={handleSave}
                        ></input>
                        <label> INSTALACIÓN</label>
                      </th>
                      <th>
                        <input
                          name="tipo_servicio"
                          type="radio"
                          value="OTRO"
                          onChange={handleSave}
                        ></input>
                        <label> OTRO: </label>
                      </th>
                    </th>
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
                      <label>EQUIPO: {equipo?.equipo} </label>
                    </td>
                    <td>
                      <label>MARCA: {equipo?.marca} </label>
                    </td>
                    <td>
                      <label>MODELO: {equipo?.modelo} </label>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ backgroundColor: 'white' }}>
                      <label>SERIE: {equipo?.serie} </label>
                    </td>
                    <td>
                      <label>INVENTARIO: {equipo?.inventario} </label>
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
                    <td colSpan={3}>
                      <input
                        style={{ width: '100%' }}
                        name="problema_reportado"
                        type="text"
                        onChange={handleSave}
                      />
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
                      DESCRIPCION DEL SERVICIO
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <select
                        className="select"
                        aria-label="select example"
                        onChange={function (e) {
                          setActmto(e.target.value);
                        }}
                      >
                        <option value={''}>Seleccione</option>
                        {actMtos.map(function (value, index) {
                          return (
                            <option key={index} value={value.actividades}>
                              {value.equipo}
                            </option>
                          );
                        })}
                      </select>
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
                      REPUESTOS, INSUMOS, MATERIALES EMPLEADOS
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <input
                        style={{ width: '100%' }}
                        name="repuestos"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <input style={{ width: '100%' }}></input>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <input style={{ width: '100%' }}></input>
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
                      VERIFICACION DE PARAMETROS
                    </th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center' }}>PARÁMETRO</th>
                    <th style={{ textAlign: 'center' }}>VALOR PROGRAMADO</th>
                    <th style={{ textAlign: 'center' }}>VALOR MEDIDO</th>
                  </tr>
                  <tr>
                    <th>
                      <input
                        style={{
                          width: '100%',
                          height: '20px',
                          fontSize: '15px',
                          textAlign: 'center',
                        }}
                        name="verificacion"
                        type="text"
                        onChange={handleSave}
                      />
                    </th>
                    <th>
                      <input
                        style={{
                          width: '100%',
                          height: '20px',
                          fontSize: '15px',
                          textAlign: 'center',
                        }}
                        name="valor_programado"
                        type="text"
                      />
                    </th>
                    <th>
                      <input
                        className="input-report"
                        name="valor_medido"
                        type="text"
                      />
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <input
                        className="input-report"
                        name="parametro2"
                        type="text"
                      />
                    </th>
                    <th>
                      <input
                        className="input-report"
                        name="valor_programado2"
                        type="text"
                      />
                    </th>
                    <th>
                      <input
                        className="input-report"
                        name="valor_medido2"
                        type="text"
                      />
                    </th>
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
                      OBSERVACIONES
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <input
                        style={{ width: '100%' }}
                        name="observaciones"
                        type="text"
                        onChange={handleSave}
                      />
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
                      ESTADO FINAL DEL EQUIPO
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <input
                        name="estado_final"
                        type="radio"
                        value="EQUIPO FUNCIONANDO CORRECTAMENTE"
                        onChange={handleSave}
                      />
                      EQUIPO FUNCIONANDO CORRECTAMENTE
                    </th>
                    <th>
                      <input
                        name="estado_final"
                        type="radio"
                        value="EQUIPO EN ESPERA DE REPUESTOS "
                        onChange={handleSave}
                      />
                      EQUIPO EN ESPERA DE REPUESTOS
                    </th>
                    <th>
                      <input
                        name="estado_final"
                        type="radio"
                        value="EQUIPO FUERA DE SERVICIO"
                        onChange={handleSave}
                      />
                      EQUIPO FUERA DE SERVICIO
                    </th>
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
                    <td colSpan={3}>
                      <td>
                        <label style={{ fontSize: '12px' }}>FIRMA: </label>
                        <SignatureCanvas
                          canvasProps={{ width: 450, height: 150 }}
                          ref={firmaIngRef}
                          onEnd={() => {
                            saveFirmaIng(firmaIngRef.current.toData());
                          }}
                        />
                        <button
                          onClick={() => {
                            firmaIngRef.current.clear();
                            saveFirmaIng(null);
                          }}
                        >
                          {' '}
                          Clear{' '}
                        </button>
                      </td>
                      <td>
                        <label style={{ fontSize: '12px' }}>FIRMA: </label>
                        <SignatureCanvas
                          canvasProps={{ width: 450, height: 150 }}
                          ref={firmaRecref}
                          onEnd={() => {
                            saveFirmaRecibe(firmaRecref.current.toData());
                          }}
                        />
                        <button
                          onClick={() => {
                            firmaRecref.current.clear();
                            saveFirmaRecibe(null);
                          }}
                        >
                          {' '}
                          Clear{' '}
                        </button>
                      </td>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <td>
                        <label style={{ fontSize: '12px' }}>NOMBRE: </label>
                        <input
                          className="input-report"
                          name="nombre_ingeniero"
                          type="text"
                          onChange={handleSave}
                        />
                      </td>
                      <td>
                        <label style={{ fontSize: '12px' }}>NOMBRE: </label>
                        <input
                          className="input-report"
                          name="nombre_recibe"
                          type="text"
                          onChange={handleSave}
                        />
                      </td>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <td>
                        <label style={{ fontSize: '12px' }}>CARGO: </label>
                        <input
                          className="input-report"
                          name="cargo_ingeniero"
                          type="text"
                          onChange={handleSave}
                        />
                      </td>
                      <td>
                        <label style={{ fontSize: '12px' }}>CARGO: </label>
                        <input
                          className="input-report"
                          name="cargo_recibe"
                          type="text"
                          onChange={handleSave}
                        />
                      </td>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="button-contenedor">
                <input
                  type="button"
                  value="Crear"
                  className="button"
                  onClick={CreateReport}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default ReporteService;
