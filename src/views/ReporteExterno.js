import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  apiCreateReporte,
  apiActMtto,
  apiObtenerEquipo,
  apiIps,
} from '../utils/api';
import request from '../utils/request';

function ReporteExterno() {
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
      alert(`Sn conexión con el Servidor${response.message}`);
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
      alert(`Sn conexión con el Servidor${response.message}`);
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
    inventario: 'NA',
    problema_reportado: '',
    desc_servicio: '',
    cantidad1: 'NA',
    descripcion1: 'NA',
    valor1: 'NA',
    cantidad2: 'NA',
    descripcion2: 'NA',
    valor2: 'NA',
    cantidad3: 'NA',
    descripcion3: 'NA',
    valor3: 'NA',
    cantidad4: 'NA',
    descripcion4: 'NA',
    valor4: 'NA',
    parametro1: 'NA',
    valor_programado1: 'NA',
    valor_medido1: 'NA',
    parametro2: 'NA',
    valor_programado2: 'NA',
    valor_medido2: 'NA',
    parametro3: 'NA',
    valor_programado3: 'NA',
    valor_medido3: 'NA',
    parametro4: 'NA',
    valor_programado4: 'NA',
    valor_medido4: 'NA',
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
      desc_servicio: actMto || reporte.desc_servicio,
      cantidad1: reporte.cantidad1,
      descripcion1: reporte.descripcion1,
      valor1: reporte.valor1,
      cantidad2: reporte.cantidad2,
      descripcion2: reporte.descripcion2,
      valor2: reporte.valor2,
      cantidad3: reporte.cantidad3,
      descripcion3: reporte.descripcion3,
      valor3: reporte.valor3,
      cantidad4: reporte.cantidad4,
      descripcion4: reporte.descripcion4,
      valor4: reporte.valor4,
      parametro1: reporte.parametro1,
      valor_programado1: reporte.valor_programado1,
      valor_medido1: reporte.valor_medido1,
      parametro2: reporte.parametro2,
      valor_programado2: reporte.valor_programado2,
      valor_medido2: reporte.valor_medido2,
      parametro3: reporte.parametro3,
      valor_programado3: reporte.valor_programado3,
      valor_medido3: reporte.valor_medido3,
      parametro4: reporte.parametro4,
      valor_programado4: reporte.valor_programado4,
      valor_medido4: reporte.valor_medido4,
      observaciones: reporte.observaciones,
      estado_final: reporte.estado_final,
      firma_ingeniero: firmaIng,
      nombre_ingeniero: reporte.nombre_ingeniero,
      cargo_ingeniero: reporte.cargo_ingeniero,
      firma_recibe: firmaRecibe,
      nombre_recibe: reporte.nombre_recibe,
      cargo_recibe: reporte.cargo_recibe,
    };
    console.log(body);
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

  console.log(reporte.fecha);

  return (
    <div className="contenedor">
      <main>
        <section>
          <div>
            <div>
              <table className="tabla-reporte">
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
                <tbody>
                  <tr>
                    <th colSpan={4}>INFORMACION DE LA INSTITUCIÓN</th>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <label>IPS/CLIENTE: {equipo?.institucion} </label>
                    </td>
                    <td colSpan={2}>
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
                    <td colSpan={2}>
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
                    <th colSpan={4}>TIPO DE SERVICIO</th>
                  </tr>
                  <tr>
                    <td>
                      <input
                        name="tipo_servicio"
                        type="radio"
                        value="MTTO PREVENTIVO"
                        onChange={handleSave}
                      ></input>
                      <label> MTTO PREVENTIVO</label>
                    </td>
                    <td>
                      <input
                        name="tipo_servicio"
                        type="radio"
                        value="MTTO CORRECTIVO"
                        onChange={handleSave}
                      ></input>
                      <label> MTTO CORRECTIVO</label>
                    </td>
                    <td>
                      <input
                        name="tipo_servicio"
                        type="radio"
                        value="INSTALACION"
                        onChange={handleSave}
                      ></input>
                      <label> INSTALACIÓN</label>
                    </td>
                    <td>
                      <input
                        name="tipo_servicio"
                        type="radio"
                        value="OTRO"
                        onChange={handleSave}
                      ></input>
                      <label> OTRO </label>
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>INFORMACION DEL EQUIPO</th>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <label>EQUIPO: {equipo?.equipo} </label>
                    </td>
                    <td colSpan={2}>
                      <label>MARCA: {equipo?.marca} </label>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <label>MODELO: {equipo?.modelo} </label>
                    </td>
                    <td colSpan={2} style={{ backgroundColor: 'white' }}>
                      <label>SERIE: {equipo?.serie} </label>
                    </td>
                    <td>
                      <label>INVENTARIO: {equipo?.inventario} </label>
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>PROBLEMA REPORTADO POR EL CLIENTE</th>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      <textarea
                        name="problema_reportado"
                        onChange={handleSave}
                      ></textarea>
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>DESCRIPCION DEL SERVICIO</th>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      <select
                        className="select"
                        aria-label="select example"
                        onChange={function (e) {
                          setActmto(e.target.value);
                        }}
                      >
                        <option value={''}>
                          Seleccione si es un Mantenimiento Preventivo
                        </option>
                        {actMtos.map(function (value, index) {
                          return (
                            <option key={index} value={value.actividades}>
                              {value.equipo}
                            </option>
                          );
                        })}
                      </select>
                      <textarea
                        name="desc_servicio"
                        onChange={handleSave}
                      ></textarea>
                    </td>
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
                    <td>
                      <input
                        className="input-reportparam"
                        name="cantidad1"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion1"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor1"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        className="input-reportparam"
                        name="cantidad2"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion2"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor2"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        className="input-reportparam"
                        name="cantidad3"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion3"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor3"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        className="input-reportparam"
                        name="cantidad4"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion4"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor4"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>VERIFICACION DE PARAMETROS</th>
                  </tr>
                  <tr>
                    <td>PARÁMETRO</td>
                    <td colSpan={2}>VALOR PROGRAMADO</td>
                    <td>VALOR MEDIDO</td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        className="input-reportparam"
                        name="parametro1"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado1"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido1"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        className="input-reportparam"
                        name="parametro2"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado2"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido2"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        className="input-reportparam"
                        name="parametro3"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado3"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido3"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <input
                        className="input-reportparam"
                        name="parametro4"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado4"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido4"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>OBSERVACIONES</th>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      <textarea
                        name="observaciones"
                        onChange={handleSave}
                      ></textarea>
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>ESTADO FINAL DEL EQUIPO</th>
                  </tr>
                  <tr>
                    <td>
                      <input
                        name="estado_final"
                        type="radio"
                        value="EQUIPO FUNCIONANDO CORRECTAMENTE"
                        onChange={handleSave}
                      />
                      FUNCIONANDO CORRECTAMENTE
                    </td>
                    <td>
                      <input
                        name="estado_final"
                        type="radio"
                        value="EQUIPO EN ESPERA DE REPUESTOS "
                        onChange={handleSave}
                      />
                      EN ESPERA DE REPUESTO
                    </td>
                    <td>
                      <input
                        name="estado_final"
                        type="radio"
                        value="EQUIPO FUERA DE SERVICIO"
                        onChange={handleSave}
                      />
                      FUERA DE SERVICIO
                    </td>
                    <td>
                      <input
                        name="estado_final"
                        type="radio"
                        value="EQUIPO PARA BAJA"
                        onChange={handleSave}
                      />
                      EQUIPO PARA BAJA
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={2}>INGENIERO/TECNICO</th>
                    <th colSpan={2}>RECIBÍ A SATISFACCION</th>
                  </tr>
                  <tr>
                    <td colSpan={2}>
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
                        Limpiar{' '}
                      </button>
                    </td>
                    <td colSpan={2}>
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
                        Limpiar{' '}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <label>NOMBRE: </label>
                      <input
                        className="input-reportparam"
                        name="nombre_ingeniero"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <label>NOMBRE: </label>
                      <input
                        className="input-reportparam"
                        name="nombre_recibe"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <label>CARGO: </label>
                      <input
                        className="input-reportparam"
                        name="cargo_ingeniero"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <label>CARGO: </label>
                      <input
                        className="input-reportparam"
                        name="cargo_recibe"
                        type="text"
                        onChange={handleSave}
                      />
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
export default ReporteExterno;
