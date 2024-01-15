import React, { useState } from 'react';
import { apiCreateIps } from '../utils/api';
import request from '../utils/request';

function CrearIps() {
  const [ips, setIps] = useState({
    ips: '',
    nit: '',
    ciudad: '',
  });

  const handleSave = (e) => {
    setIps(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const CreateIps = async () => {
    if (!ips.ips) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiCreateIps,
        body: {
          ips: ips.ips,
          nit: ips.nit,
          ciudad: ips.ciudad,
        },
        method: 'POST',
      });
      if (response.success) {
        alert('IPS creada exitosamente');
        window.location.href = './inventarioua';
      } else {
        alert(`${response.message}`);
      }
    }
  };
  return (
    <div className="contenedor">
      <main>
        {/*<!-- Features section-->*/}
        <section>
          <div className="formulario">
            <h1>Crear Institución Prestadora de Salud</h1>
            <div className="div-form">
              <div className="input-contenedor">
                <input
                  className="input-form"
                  name="ips"
                  type="text"
                  placeholder="IPS"
                  onChange={handleSave}
                />
              </div>
              <div className="input-contenedor">
                <input
                  className="input-form"
                  name="nit"
                  type="text"
                  placeholder="Nit"
                  onChange={handleSave}
                />
              </div>
              <div className="input-contenedor">
                <input
                  className="input-form"
                  name="ciudad"
                  type="text"
                  placeholder="ciudad"
                  onChange={handleSave}
                />
              </div>
              <input
                type="button"
                value="Crear"
                className="button"
                onClick={CreateIps}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CrearIps;
