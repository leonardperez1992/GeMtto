import React, { useState, useEffect } from 'react';
import { apiCreateInventario, apiIps } from '../utils/api';
import request from '../utils/request';

function CreateInventary() {
  const [ipss, setIpss] = useState([]);
  const [ips, setIps] = useState('');

  const obtenerIps = async () => {
    const response = await request({ link: apiIps, method: 'GET' });
    if (response.success) {
      setIpss(response.ips);
    } else {
      alert(`Sin conexión con el Servidor ${response.message}`);
    }
  };

  const [inventary, setInventary] = useState({
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

  useEffect(function () {
    obtenerIps();
  }, []);

  const handleSave = (e) => {
    setInventary(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const CreateServ = async () => {
    if (!inventary.equipo || !inventary.serie) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiCreateInventario,
        body: {
          equipo: inventary.equipo,
          marca: inventary.marca,
          modelo: inventary.modelo,
          serie: inventary.serie,
          inventario: inventary.inventario,
          institucion: ips,
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
      console.log(inventary);
      if (response.success) {
        alert('Equipo creado exitosamente');
        window.location.href = './inventarioua';
      } else {
        alert(`${response.message}`);
      }
    }
  };
  console.log(inventary.fecha_fabricacion);
  return (
    <div>
      <main>
        <section>
          <div>
            <div className="contenedor">
              <h1>Agregar Equipo</h1>
              <table className="tabla-reporte-2">
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
                      <select
                        className="form-select"
                        aria-label="select example"
                        onChange={function (e) {
                          setIps(e.target.value);
                        }}
                      >
                        <option value={''}>Seleccione la Institución</option>
                        {ipss.map(function (value, index) {
                          return (
                            <option key={index} value={value.ips}>
                              {value.ips}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={1}>
                      <label>SERVICIO: </label>
                    </th>
                    <td colSpan={3}>
                      {' '}
                      <input name="servicio" onChange={handleSave} />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={1}>
                      <label>UBICACIÓN: </label>
                    </th>
                    <td colSpan={3}>
                      {' '}
                      <input name="ubicacion" onChange={handleSave} />
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
                      <input name="equipo" onChange={handleSave} />
                    </td>
                    <th>MARCA</th>
                    <td>
                      <input name="marca" onChange={handleSave} />
                    </td>
                  </tr>
                  <tr>
                    <th>MODELO</th>
                    <td>
                      <input name="modelo" onChange={handleSave} />
                    </td>
                    <th>SERIE</th>
                    <td>
                      <input name="serie" onChange={handleSave} />
                    </td>
                  </tr>
                  <tr>
                    <th>INVENTARIO</th>
                    <td>
                      <input name="inventario" onChange={handleSave} />
                    </td>
                    <th>REG. SANITARIO</th>
                    <td>
                      <input name="registro_invima" onChange={handleSave} />
                    </td>
                  </tr>

                  <tr>
                    <th>TIPO DE RIESGO</th>
                    <td>
                      {' '}
                      <input name="riesgo" onChange={handleSave} />
                    </td>
                    <th>FORMA DE ADQUISICIÓN</th>
                    <td>
                      <input name="forma_adquisicion" onChange={handleSave} />
                    </td>
                  </tr>
                  <tr>
                    <th>FECHA DE INSTALACIÓN</th>
                    <td>
                      <input
                        name="fecha_instalacion"
                        type="date"
                        onChange={handleSave}
                      />
                    </td>
                    <th>FECHA DE FABRICACIÓN</th>
                    <td>
                      <input
                        name="fecha_fabricacion"
                        type="date"
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>PERIODICIDAD DE MTTO</th>
                    <td>
                      <input name="periodicidad" onChange={handleSave} />
                    </td>
                    <th>RESPONSABLE</th>
                    <td>
                      <input name="responsable" onChange={handleSave} />
                    </td>
                  </tr>
                </tbody>
              </table>
              <input
                type="button"
                value="Crear"
                className="button"
                onClick={CreateServ}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CreateInventary;
