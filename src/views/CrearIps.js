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
    <div>
      <main className="flex-shrink-0">
        {/*<!-- Features section-->*/}
        <section className="py-2" id="features">
          <div className="container px-5 my-10">
            <div className="py-2 text-center">
              <div className="container px-5 my-5">
                <div className="row gx-5 justify-content-center">
                  <div className="col-lg-10 col-xl-7">
                    <div className="text-center">
                      {/* < className="formulario" onSubmit={register}> */}
                      <h1>Crear Institución Prestadora de Salud</h1>
                      <div className="contenedor">
                        <div className="input-contenedor">
                          <input
                            name="ips"
                            type="text"
                            placeholder="IPS"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="nit"
                            type="text"
                            placeholder="Nit"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CrearIps;
