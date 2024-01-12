import React, { useState } from 'react';
import { apiCreateActMtto } from '../utils/api';
import request from '../utils/request';

function CreateActMtto() {
  const [actMtto, setActmtto] = useState({
    equipo: '',
    actividades: '',
    parametro1: '',
    parametro2: '',
    parametro3: '',
    parametro4: '',
    parametro5: '',
  });

  const handleSave = (e) => {
    setActmtto(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const CreateAct = async () => {
    if (!actMtto.equipo) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiCreateActMtto,
        body: {
          equipo: actMtto.equipo,
          actividades: actMtto.actividades,
          parametro1: actMtto.parametro1,
          parametro2: actMtto.parametro2,
          parametro3: actMtto.parametro3,
          parametro4: actMtto.parametro4,
          parametro5: actMtto.parametro5,
        },
        method: 'POST',
      });
      if (response.success) {
        alert('Actividad de mantenimiento creado exitosamente');
        window.location.href = './inventarioua';
      } else {
        alert(`${response.message}`);
        console.log(actMtto);
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
                      <h1>Agregar Actividades de Mantenimiento</h1>
                      <div className="contenedor">
                        <div className="input-contenedor">
                          <input
                            name="equipo"
                            type="text"
                            placeholder="Equipo"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="actividades"
                            type="text"
                            placeholder="Actividades"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="parametro1"
                            type="text"
                            placeholder="Parametro 1"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="parametro2"
                            type="text"
                            placeholder="Parametro 3"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="parametro3"
                            type="text"
                            placeholder="Parametro 3"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="parametro4"
                            type="text"
                            placeholder="Parametro 4"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="parametro5"
                            type="text"
                            placeholder="Parametro 5"
                            onChange={handleSave}
                          />
                        </div>
                        <input
                          type="button"
                          value="Crear"
                          className="button"
                          onClick={CreateAct}
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
export default CreateActMtto;
