import React, { useState } from 'react';
import { apiCreateActMtto } from '../utils/api';
import request from '../utils/request';

function CreateActMtto() {
  const [actMtto, setActmtto] = useState({
    equipo: '',
    actividades: '',
    parametro1: 'NA',
    parametro2: 'NA',
    parametro3: 'NA',
    parametro4: 'NA',
    parametro5: 'NA',
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
        window.location.href = './actmtto';
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
              <div>
                <table className="tabla-act">
                  <thead></thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        Agregar Actividades de Mantenimiento
                      </td>
                    </tr>
                    <tr></tr>
                    <tr></tr>
                    <tr>
                      <th>EQUIPO</th>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="equipo"
                          onChange={handleSave}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        Actividades de Mantenimiento
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ height: '200px' }}>
                        <textarea
                          className="input-tabla-act"
                          name="actividades"
                          onChange={handleSave}
                        ></textarea>
                      </td>
                    </tr>

                    <tr>
                      <th>PARÁMETRO 1</th>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="parametro1"
                          onChange={handleSave}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>PARÁMETRO 2</th>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="parametro2"
                          onChange={handleSave}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>PARÁMETRO 3</th>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="parametro3"
                          onChange={handleSave}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>PARÁMETRO 4</th>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="parametro4"
                          onChange={handleSave}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>PARÁMETRO 5</th>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="parametro5"
                          onChange={handleSave}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <input
                  className="button-tabla-act"
                  type="button"
                  value="Guardar"
                  onClick={CreateAct}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CreateActMtto;
