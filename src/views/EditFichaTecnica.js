import React, { useState, useEffect } from 'react';
import { apiUpdateFicha, apiGetFichaById, apiDeleteFicha } from '../utils/api';
import request from '../utils/request';
import ImageUploading from 'react-images-uploading';
import { TfiSave } from 'react-icons/tfi';
import { BsTrash } from 'react-icons/bs';

function EditFichaTecnica() {
  const [imagen, setImagen] = useState();
  const [ficha, setFicha] = useState({
    imagen: '',
    marca: '',
    modelo: '',
    clas_biomedica: '',
    tecnologia: '',
    voltaje: '',
    amperaje: '',
    potencia: '',
    temperatura: '',
    frecuencia: '',
    bateria: '',
    accesorio1: '',
    cantidad1: '',
    accesorio2: '',
    cantidad2: '',
    accesorio3: '',
    cantidad3: '',
    accesorio4: '',
    cantidad4: '',
    accesorio5: '',
    cantidad5: '',
    accesorio6: '',
    cantidad6: '',
    recomendaciones: '',
  });
  const maxNumber = 2;

  const ObtenerFicha = async (id) => {
    const response = await request({
      link: apiGetFichaById,
      method: 'GET',
      body: { id },
    });
    if (response.success) {
      setFicha(response.ficha);
      setImagen(response.ficha.imagen);
    } else {
      alert(`Sin conexión con el Servidor ${response.message}`);
    }
  };

  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    ObtenerFicha(idEquipo);
  }, []);

  const handleSave = (e) => {
    setFicha(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const onChange = (imageList, addUpdateIndex) => {
    // data for submit
    setImagen(imageList);
  };
  const Create = async () => {
    if (!ficha) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiUpdateFicha,
        body: {
          _id: ficha._id,
          imagen: imagen,
          marca: ficha.marca,
          modelo: ficha.modelo,
          clas_biomedica: ficha.clas_biomedica,
          tecnologia: ficha.tecnologia,
          voltaje: ficha.voltaje,
          amperaje: ficha.amperaje,
          potencia: ficha.potencia,
          temperatura: ficha.temperatura,
          frecuencia: ficha.frecuencia,
          bateria: ficha.bateria,
          accesorio1: ficha.accesorio1,
          cantidad1: ficha.cantidad1,
          accesorio2: ficha.accesorio2,
          cantidad2: ficha.cantidad2,
          accesorio3: ficha.accesorio3,
          cantidad3: ficha.cantidad3,
          accesorio4: ficha.accesorio4,
          cantidad4: ficha.cantidad4,
          accesorio5: ficha.accesorio5,
          cantidad5: ficha.cantidad5,
          accesorio6: ficha.accesorio6,
          cantidad6: ficha.cantidad6,
          recomendaciones: ficha.recomendaciones,
        },
        method: 'POST',
      });
      if (response.success) {
        alert('Archivo actualizado exitosamente');
        window.location.href = './fichastecnicas';
      } else {
        alert(`${response.message}`);
      }
    }
  };

  const deleteficha = async () => {
    let confirmar = window.confirm('Deseas eliminar este archivo?');
    if (confirmar) {
      const body = {
        _id: ficha._id,
      };
      if (!body) {
        alert('Por favor Seleccione un equipo');
        window.location.href = './reportes';
      } else {
        const response = await request({
          link: apiDeleteFicha,
          body,
          method: 'POST',
        });
        if (response.success) {
          alert(`${response.message}`);
          window.location.href = './fichastecnicas';
        } else {
          alert(`${response.message}`);
        }
      }
    }
  };

  return (
    <div>
      <main>
        <section>
          <div>
            <div>
              <div>
                <table className="tabla-act">
                  <tbody>
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                        }}
                      >
                        1,2 INFORMACIÓN TÉCNICA
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={4}
                        rowSpan={3}
                        style={{ backgroundColor: '#ecf4f6' }}
                      >
                        <ImageUploading
                          value={imagen}
                          onChange={onChange}
                          maxNumber={maxNumber}
                          dataURLKey="data_url"
                        >
                          {({
                            imageList,
                            onImageUpload,
                            onImageRemoveAll,
                            onImageUpdate,
                            onImageRemove,
                            isDragging,
                            dragProps,
                          }) => (
                            // write your building UI
                            <div className="upload__image-wrapper">
                              <button
                                style={
                                  isDragging ? { color: 'red' } : undefined
                                }
                                onClick={onImageUpload}
                                {...dragProps}
                              >
                                Subir imagen
                              </button>
                              &nbsp;
                              <button onClick={onImageRemoveAll}>
                                Eliminar imagen
                              </button>
                              {imageList.map((image, index) => (
                                <div key={index} className="image-item">
                                  <img
                                    src={image['data_url']}
                                    alt=""
                                    width="100"
                                  />
                                  <div className="image-item__btn-wrapper">
                                    <button
                                      onClick={() => onImageUpdate(index)}
                                    >
                                      Actualizar
                                    </button>
                                    <button
                                      onClick={() => onImageRemove(index)}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ImageUploading>
                      </td>
                    </tr>
                    <tr></tr>
                    <tr></tr>
                    <tr>
                      <th>MARCA</th>
                      <td>
                        <input
                          name="marca"
                          onChange={handleSave}
                          defaultValue={ficha?.marca}
                          className="input-tabla-act"
                        />
                      </td>
                      <th>MODELO</th>
                      <td>
                        <input
                          name="modelo"
                          onChange={handleSave}
                          defaultValue={ficha?.modelo}
                          className="input-tabla-act"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>TECNOLOGÍA PREDOMINANTE</th>
                      <td>
                        <input
                          name="tecnologia"
                          onChange={handleSave}
                          defaultValue={ficha?.tecnologia}
                          className="input-tabla-act"
                        />
                      </td>
                      <th>CLASIFICACIÓN BIOMÉDICA</th>
                      <td>
                        <input
                          name="clas_biomedica"
                          onChange={handleSave}
                          defaultValue={ficha?.clas_biomedica}
                          className="input-tabla-act"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>VOLTAJE</th>
                      <td>
                        <input
                          name="voltaje"
                          onChange={handleSave}
                          defaultValue={ficha?.voltaje}
                          className="input-tabla-act"
                        />
                      </td>
                      <th>AMPERAJE</th>
                      <td>
                        <input
                          name="amperaje"
                          onChange={handleSave}
                          defaultValue={ficha?.amperaje}
                          className="input-tabla-act"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>TEMPERATURA</th>
                      <td>
                        <input
                          name="temperatura"
                          onChange={handleSave}
                          defaultValue={ficha?.temperatura}
                          className="input-tabla-act"
                        />
                      </td>
                      <th>FRECUENCIA</th>
                      <td>
                        <input
                          name="frecuencia"
                          onChange={handleSave}
                          defaultValue={ficha?.frecuencia}
                          className="input-tabla-act"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>POTENCIA</th>
                      <td>
                        <input
                          name="potencia"
                          onChange={handleSave}
                          defaultValue={ficha?.potencia}
                          className="input-tabla-act"
                        />
                      </td>
                      <th>BATERÍA</th>
                      <td>
                        <input
                          name="bateria"
                          onChange={handleSave}
                          defaultValue={ficha?.bateria}
                          className="input-tabla-act"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                        }}
                      >
                        1,3 ACCESORIOS
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          backgroundColor: 'rgb(0, 74, 116)',
                          color: 'white',
                        }}
                      >
                        CANTIDAD
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="accesorio1"
                          onChange={handleSave}
                          defaultValue={ficha?.accesorio1}
                        />
                      </td>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="cantidad1"
                          onChange={handleSave}
                          defaultValue={ficha?.cantidad1}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="accesorio2"
                          onChange={handleSave}
                          defaultValue={ficha?.accesorio2}
                        />
                      </td>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="cantidad2"
                          onChange={handleSave}
                          defaultValue={ficha?.cantidad2}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="accesorio3"
                          onChange={handleSave}
                          defaultValue={ficha?.accesorio3}
                        />
                      </td>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="cantidad3"
                          onChange={handleSave}
                          defaultValue={ficha?.cantidad3}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="accesorio4"
                          onChange={handleSave}
                          defaultValue={ficha?.accesorio4}
                        />
                      </td>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="cantidad4"
                          onChange={handleSave}
                          defaultValue={ficha?.cantidad4}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="accesorio5"
                          onChange={handleSave}
                          defaultValue={ficha?.accesorio5}
                        />
                      </td>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="cantidad5"
                          onChange={handleSave}
                          defaultValue={ficha?.cantidad5}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="accesorio6"
                          onChange={handleSave}
                          defaultValue={ficha?.accesorio6}
                        />
                      </td>
                      <td colSpan={2}>
                        <input
                          className="input-tabla-act"
                          name="cantidad6"
                          onChange={handleSave}
                          defaultValue={ficha?.cantidad6}
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
                        1,3 RECOMENDACIONES DE FABRICANTE
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} style={{ height: '200px' }}>
                        <textarea
                          name="recomendaciones"
                          onChange={handleSave}
                          defaultValue={ficha?.recomendaciones}
                          className="input-tabla-act"
                        ></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: 'inline-block' }}>
                  <TfiSave
                    className="icon1"
                    title="Guardar"
                    size={25}
                    onClick={Create}
                  />

                  <BsTrash
                    className="icon1"
                    title="Eliminar"
                    size={25}
                    onClick={deleteficha}
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
export default EditFichaTecnica;
