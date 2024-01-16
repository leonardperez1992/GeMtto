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
    institucion: '',
    servicio: '',
    ubicacion: '',
    registro_invima: '',
    riesgo: '',
    responsable: '',
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
          institucion: ips,
          servicio: inventary.servicio,
          ubicacion: inventary.ubicacion,
          registro_invima: inventary.registro_invima,
          riesgo: inventary.riesgo,
          responsable: inventary.responsable,
        },
        method: 'POST',
      });
      if (response.success) {
        alert('Equipo creado exitosamente');
        window.location.href = './inventarioua';
      } else {
        alert(`${response.message}`);
        console.log(inventary);
      }
    }
  };
  return (
    <div>
      <main>
        <section>
          <div>
            <div className="contenedor">
              <h1>Agregar Equipo</h1>
              <div className="div-form">
                <div className="input-contenedor-form">
                  <input
                    name="equipo"
                    type="text"
                    placeholder="Equipo"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="marca"
                    type="text"
                    placeholder="Marca"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="modelo"
                    type="text"
                    placeholder="Modelo"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="serie"
                    type="text"
                    placeholder="Serie"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
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
                        <option key={index} value={value._id}>
                          {value.ips}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="servicio"
                    type="text"
                    placeholder="Servicio"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="ubicacion"
                    type="text"
                    placeholder="Ubicación"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="registro_invima"
                    type="text"
                    placeholder="Registro Invima"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="riesgo"
                    type="text"
                    placeholder="Riesgo"
                    onChange={handleSave}
                  />
                </div>
                <div className="input-contenedor-form">
                  <input
                    name="responsable"
                    type="text"
                    placeholder="Responsable"
                    onChange={handleSave}
                  />
                </div>
                <input
                  type="button"
                  value="Crear"
                  className="button"
                  onClick={CreateServ}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CreateInventary;
