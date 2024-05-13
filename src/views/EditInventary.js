import React, { useState, useEffect } from 'react';
import { apiEditInventario, apiObtenerEquipo } from '../utils/api';
import request from '../utils/request';
import { TfiSave } from 'react-icons/tfi';

function EditInventary() {
  const [equipo, setEquipo] = useState([]);
  const [inventary, setInventary] = useState({
    _id: '',
    equipo: '',
    marca: '',
    modelo: '',
    serie: '',
    inventario: '',
    institucion: '',
    servicio: '',
    ubicacion: '',
    registro_invima: '',
    riesgo: '',
    responsable: '',
    forma_adquisicion: '',
    fecha_instalacion: '',
    fecha_fabricacion: '',
    periodicidad: '',
  });

  const obtenerEquipos = async (id) => {
    const response = await request({
      link: apiObtenerEquipo,
      method: 'GET',
      body: { id },
    });
    if (response.success) {
      setEquipo(response.equipo);
      setInventary(response.equipo);
    } else {
      alert(`${response.message}`);
    }
  };
  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    obtenerEquipos(idEquipo);
  }, []);

  const handleSave = (e) => {
    setInventary(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const EditEquipo = async () => {
    if (!inventary.equipo || !inventary.serie) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiEditInventario,
        body: {
          _id: inventary._id,
          equipo: inventary.equipo,
          marca: inventary.marca,
          modelo: inventary.modelo,
          serie: inventary.serie,
          inventario: inventary.inventario,
          institucion: inventary.institucion,
          servicio: inventary.servicio,
          ubicacion: inventary.ubicacion,
          registro_invima: inventary.registro_invima,
          riesgo: inventary.riesgo,
          responsable: inventary.responsable,
          forma_adquisicion: inventary.forma_adquisicion,
          fecha_instalacion: inventary.fecha_instalacion,
          fecha_fabricacion: inventary.fecha_fabricacion,
          periodicidad: inventary.periodicidad,
        },
        method: 'POST',
      });
      if (response.success) {
        alert(`${response.message}`);
        window.location.href = './inventarioua';
      } else {
        alert(`${response.message}`);
      }
    }
  };

  console.log(equipo);
  return (
    <div className="contenedor">
      <main>
        <section>
          <div>
            <div>
              <table className="tabla-act">
                <thead>
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        backgroundColor: 'rgb(0, 74, 116)',
                        color: 'white',
                      }}
                    >
                      1,1 DATOS DEL CLIENTE
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th colSpan={1}>
                      <label>IPS/CLIENTE: </label>
                    </th>
                    <td colSpan={3}>
                      {' '}
                      <input
                        name="institucion"
                        onChange={handleSave}
                        className="input-tabla-act"
                        defaultValue={equipo?.institucion}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={1}>
                      <label>SERVICIO: </label>
                    </th>
                    <td colSpan={3}>
                      {' '}
                      <input
                        name="servicio"
                        onChange={handleSave}
                        defaultValue={equipo?.servicio}
                        className="input-tabla-act"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={1}>
                      <label>UBICACIÓN: </label>
                    </th>
                    <td colSpan={3}>
                      {' '}
                      <input
                        name="ubicacion"
                        onChange={handleSave}
                        defaultValue={equipo.ubicacion}
                        className="input-tabla-act"
                      />
                    </td>
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
                    <th>EQUIPO</th>
                    <td>
                      {' '}
                      <input
                        name="equipo"
                        onChange={handleSave}
                        defaultValue={equipo.equipo}
                        className="input-tabla-act"
                      />
                    </td>
                    <th>MARCA</th>
                    <td>
                      <input
                        name="marca"
                        onChange={handleSave}
                        defaultValue={equipo.marca}
                        className="input-tabla-act"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>MODELO</th>
                    <td>
                      <input
                        name="modelo"
                        onChange={handleSave}
                        defaultValue={equipo.modelo}
                        className="input-tabla-act"
                      />
                    </td>
                    <th>SERIE</th>
                    <td>
                      <input
                        name="serie"
                        onChange={handleSave}
                        defaultValue={equipo.serie}
                        className="input-tabla-act"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>INVENTARIO</th>
                    <td>
                      <input
                        name="inventario"
                        onChange={handleSave}
                        defaultValue={equipo.inventario}
                        className="input-tabla-act"
                      />
                    </td>
                    <th>REG. SANITARIO</th>
                    <td>
                      <input
                        name="registro_invima"
                        onChange={handleSave}
                        defaultValue={equipo.registro_invima}
                        className="input-tabla-act"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>TIPO DE RIESGO</th>
                    <td>
                      {' '}
                      <input
                        name="riesgo"
                        onChange={handleSave}
                        defaultValue={equipo.riesgo}
                        className="input-tabla-act"
                      />
                    </td>
                    <th>FORMA DE ADQUISICIÓN</th>
                    <td>
                      <input
                        name="forma_adquisicion"
                        onChange={handleSave}
                        defaultValue={equipo.forma_adquisicion}
                        className="input-tabla-act"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>FECHA DE INSTALACIÓN</th>
                    <td>
                      <input
                        name="fecha_instalacion"
                        type="date"
                        onChange={handleSave}
                        className="input-tabla-act"
                      />
                      {equipo.fecha_instalacion}
                    </td>
                    <th>FECHA DE FABRICACIÓN</th>
                    <td>
                      <input
                        name="fecha_fabricacion"
                        type="date"
                        className="input-tabla-act"
                      />
                      {equipo.fecha_instalacion}
                    </td>
                  </tr>
                  <tr>
                    <th>PERIODICIDAD DE MTTO</th>
                    <td>
                      <input
                        name="periodicidad"
                        onChange={handleSave}
                        defaultValue={equipo.periodicidad}
                        className="input-tabla-act"
                      />
                    </td>
                    <th>RESPONSABLE</th>
                    <td>
                      <input
                        name="responsable"
                        onChange={handleSave}
                        defaultValue={equipo.responsable}
                        className="input-tabla-act"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'inline-block' }}>
                <TfiSave
                  className="icon1"
                  title="Guardar"
                  size={25}
                  onClick={EditEquipo}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default EditInventary;
