import { useState, useEffect } from 'react';
import { apiObtenerReporte, apiUpdateReporte } from '../utils/api';
import request from '../utils/request';

function UpdateReporte() {
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
    cantidad1: '',
    descripcion1: '',
    valor1: '',
    cantidad2: '',
    descripcion2: '',
    valor2: '',
    cantidad3: '',
    descripcion3: '',
    valor3: '',
    cantidad4: '',
    descripcion4: '',
    valor4: '',
    parametro1: '',
    valor_programado1: '',
    valor_medido1: '',
    parametro2: '',
    valor_programado2: '',
    valor_medido2: '',
    parametro3: '',
    valor_programado3: '',
    valor_medido3: '',
    parametro4: '',
    valor_programado4: '',
    valor_medido4: '',
    observaciones: '',
    estado_final: '',
    firma_ingeniero: '',
    nombre_ingeniero: '',
    cargo_ingeniero: '',
    firma_recibe: '',
    nombre_recibe: '',
    cargo_recibe: '',
  });

  const obtenerReporte = async (id) => {
    const response = await request({
      link: apiObtenerReporte,
      method: 'GET',
      body: { id },
    });
    if (response.success) {
      setReporte(response.reporte);
    } else {
      alert(`${response.message}`);
    }
  };

  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    obtenerReporte(idEquipo);
  }, []);

  const handleSave = (e) => {
    setReporte(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const UpdateReport = async () => {
    const body = {
      _id: reporte._id,
      numero_reporte: reporte.numero_reporte,
      institucion: reporte.institucion,
      fecha: reporte.fecha,
      servicio: reporte.servicio,
      ciudad: reporte.ciudad,
      tipo_servicio: reporte.tipo_servicio,
      equipo: reporte.equipo,
      marca: reporte.marca,
      modelo: reporte.modelo,
      serie: reporte.serie,
      inventario: reporte.inventario,
      problema_reportado: reporte.problema_reportado,
      desc_servicio: reporte.desc_servicio,
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
      nombre_ingeniero: reporte.nombre_ingeniero,
      cargo_ingeniero: reporte.cargo_ingeniero,
      nombre_recibe: reporte.nombre_recibe,
      cargo_recibe: reporte.cargo_recibe,
    };
    if (!body.equipo) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiUpdateReporte,
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
      <main>
        <section>
          <div>
            <div>
              <table className="tabla-reporte">
                <thead>
                  <tr>
                    <td
                      colSpan={1}
                      style={{ backgroundColor: 'white', textAlign: 'center' }}
                    >
                      <img
                        src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                        alt=""
                        width="70%"
                      />
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        backgroundColor: 'white',
                        color: 'black',
                        textAlign: 'center',
                        fontSize: '90%',
                      }}
                    >
                      REPORTE DE SERVICIO
                    </td>
                    <td
                      style={{
                        backgroundColor: 'white',
                        color: 'black',
                        textAlign: 'center',
                        fontSize: '70%',
                      }}
                    >
                      Nº DE REPORTE:{' '}
                      <label style={{ color: 'red', fontSize: '120%' }}>
                        {reporte?.numero_reporte}
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
                      <label>IPS/CLIENTE: </label>
                      {reporte?.institucion}
                    </td>
                    <td colSpan={2}>
                      <label>FECHA: </label>
                      <input
                        style={{ fontSize: '14px' }}
                        name="fecha"
                        type="date"
                        onChange={handleSave}
                        defaultValue={reporte?.fecha}
                      />
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
                    <td colSpan={4}>
                      <input
                        className="input-reportparam"
                        name="tipo_servicio"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.tipo_servicio}
                      />
                    </td>
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
                    <td>
                      <label>MODELO: </label>
                      {reporte?.modelo}
                    </td>
                    <td colSpan={2} style={{ backgroundColor: 'white' }}>
                      <label>SERIE: </label>
                      {reporte?.serie}
                    </td>
                    <td>
                      <label>INVENTARIO: </label>
                      {reporte?.inventario}
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
                        defaultValue={reporte?.problema_reportado}
                      ></textarea>
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>DESCRIPCION DEL SERVICIO</th>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ height: '150px' }}>
                      <textarea
                        name="desc_servicio"
                        onChange={handleSave}
                        defaultValue={reporte?.desc_servicio}
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
                        defaultValue={reporte?.cantidad1}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion1"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.descripcion1}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor1"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor1}
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
                        defaultValue={reporte?.cantidad2}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion2"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.descripcion2}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor2"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor2}
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
                        defaultValue={reporte?.cantidad3}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion3"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.descripcion3}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor3"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor3}
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
                        defaultValue={reporte?.cantidad4}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="descripcion4"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.descripcion4}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor4"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor4}
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
                        defaultValue={reporte?.parametro1}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado1"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_programado1}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido1"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_medido1}
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
                        defaultValue={reporte?.parametro2}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado2"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_programado2}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido2"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_medido2}
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
                        defaultValue={reporte?.parametro3}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado3"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_programado3}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido3"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_medido3}
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
                        defaultValue={reporte?.parametro4}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-reportparam"
                        name="valor_programado4"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_programado4}
                      />
                    </td>
                    <td>
                      <input
                        className="input-reportparam"
                        name="valor_medido4"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.valor_medido4}
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
                        defaultValue={reporte?.observaciones}
                      ></textarea>
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={4}>ESTADO FINAL DEL EQUIPO</th>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      <input
                        name="estado_final"
                        type="text"
                        value="EQUIPO FUNCIONANDO CORRECTAMENTE"
                        onChange={handleSave}
                        defaultValue={reporte?.estado_final}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={2}>INGENIERO/TECNICO</th>
                    <th colSpan={2}>RECIBÍ A SATISFACCION</th>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <label>NOMBRE: </label>
                      <input
                        className="input-reportparam"
                        name="nombre_ingeniero"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.nombre_ingeniero}
                      />
                    </td>
                    <td colSpan={2}>
                      <label>NOMBRE: </label>
                      <input
                        className="input-reportparam"
                        name="nombre_recibe"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.nombre_recibe}
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
                        defaultValue={reporte?.cargo_ingeniero}
                      />
                    </td>
                    <td colSpan={2}>
                      <label>CARGO: </label>
                      <input
                        className="input-reportparam"
                        name="cargo_recibe"
                        type="text"
                        onChange={handleSave}
                        defaultValue={reporte?.cargo_recibe}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div
                className="button-contenedor"
                style={{ display: 'inline-block' }}
              >
                <input
                  type="button"
                  value="Guardar"
                  className="button"
                  onClick={UpdateReport}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default UpdateReporte;
