import React, { useState, useEffect } from 'react';
import {
  apiSetActMtto,
  apiGetByIDActMtto,
  apiDeleteActMtto,
} from '../utils/api';
import request from '../utils/request';

function EditActMtto() {
  const [actmtto, setActmtto] = useState({
    _id: '',
    equipo: '',
    actividades: '',
    parametro1: '',
    parametro2: '',
    parametro3: '',
    parametro4: '',
    parametro5: '',
  });

  const getActmtto = async (id) => {
    const response = await request({
      link: apiGetByIDActMtto,
      method: 'GET',
      body: { id },
    });
    if (response.success) {
      setActmtto(response.actmtto);
    } else {
      alert(`Sin conexión con el Servidor ${response.message}`);
    }
  };

  const handleSave = (e) => {
    setActmtto(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    getActmtto(idEquipo);
  }, []);

  const CreateAct = async () => {
    if (!actmtto.equipo) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiSetActMtto,
        body: {
          id: actmtto._id,
          equipo: actmtto.equipo,
          actividades: actmtto.actividades,
          parametro1: actmtto.parametro1,
          parametro2: actmtto.parametro2,
          parametro3: actmtto.parametro3,
          parametro4: actmtto.parametro4,
          parametro5: actmtto.parametro5,
        },
        method: 'POST',
      });
      if (response.success) {
        alert('Actividad de mantenimiento editada exitosamente');
        window.location.href = './actmtto';
      } else {
        alert(`${response.message}`);
      }
    }
  };

  const deleteact = async () => {
    let confirmar = window.confirm('Deseas eliminar este archivo?');
    if (confirmar) {
      const body = {
        _id: actmtto._id,
      };
      if (!body) {
        alert('Por favor Seleccione un equipo');
        window.location.href = './reportes';
      } else {
        const response = await request({
          link: apiDeleteActMtto,
          body,
          method: 'POST',
        });
        if (response.success) {
          alert(`${response.message}`);
          window.location.href = './actmtto';
        } else {
          alert(`${response.message}`);
        }
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
                        Editar Actividades de Mantenimiento
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
                          defaultValue={actmtto?.equipo}
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
                          defaultValue={actmtto?.actividades}
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
                          defaultValue={actmtto?.parametro1}
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
                          defaultValue={actmtto?.parametro2}
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
                          defaultValue={actmtto?.parametro3}
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
                          defaultValue={actmtto?.parametro4}
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
                          defaultValue={actmtto?.parametro5}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: 'inline-block' }}>
                  <input
                    className="button-tabla-act"
                    type="button"
                    value="Guardar"
                    onClick={CreateAct}
                  />
                  <input
                    className="button-tabla-act"
                    type="button"
                    value="Eliminar"
                    onClick={deleteact}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default EditActMtto;
