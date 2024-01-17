import React, { useState } from 'react';
import { apiCrearFicha } from '../utils/api';
import request from '../utils/request';
import ImageUploading from 'react-images-uploading';

function FichaTecnica() {
  const [imagen, setImagen] = useState();
  const maxNumber = 2;
  console.log(imagen);
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
      console.log(ficha);
      const response = await request({
        link: apiCrearFicha,
        body: {
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
        alert('Ficha técnica creado exitosamente');
        window.location.href = './inventarioua';
      } else {
        alert(`${response.message}`);
      }
    }
  };
  return (
    <div>
      <main>
        <section>
          <table>
            <thead></thead>
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
                <td>IMAGEN</td>
                <td colSpan={3} rowSpan={3}>
                  <ImageUploading
                    multiple
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
                          style={isDragging ? { color: 'red' } : undefined}
                          onClick={onImageUpload}
                          {...dragProps}
                        >
                          Click or Drop here
                        </button>
                        &nbsp;
                        <button onClick={onImageRemoveAll}>
                          Remove all images
                        </button>
                        {imageList.map((image, index) => (
                          <div key={index} className="image-item">
                            <img src={image['data_url']} alt="" width="100" />
                            <div className="image-item__btn-wrapper">
                              <button onClick={() => onImageUpdate(index)}>
                                Update
                              </button>
                              <button onClick={() => onImageRemove(index)}>
                                Remove
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
                  <input name="marca" onChange={handleSave} />
                </td>
                <th>MODELO</th>
                <td>
                  <input name="modelo" onChange={handleSave} />
                </td>
              </tr>
              <tr>
                <th>TECNOLOGÍA PREDOMINANTE</th>
                <td>
                  <input name="tecnologia" onChange={handleSave} />
                </td>
                <th>CLASIFICACIÓN BIOMÉDICA</th>
                <td>
                  <input name="clas_biomedica" onChange={handleSave} />
                </td>
              </tr>
              <tr>
                <th>VOLTAJE</th>
                <td>
                  <input name="voltaje" onChange={handleSave} />
                </td>
                <th>AMPERAJE</th>
                <td>
                  <input name="amperaje" onChange={handleSave} />
                </td>
              </tr>
              <tr>
                <th>TEMPERATURA</th>
                <td>
                  <input name="temperatura" onChange={handleSave} />
                </td>
                <th>FRECUENCIA</th>
                <td>
                  <input name="frecuencia" onChange={handleSave} />
                </td>
              </tr>
              <tr>
                <th>POTENCIA</th>
                <td>
                  <input name="potencia" onChange={handleSave} />
                </td>
                <th>BATERÍA</th>
                <td>
                  <input name="bateria" onChange={handleSave} />
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
                    className="input-ficha"
                    name="accesorio1"
                    onChange={handleSave}
                  />
                </td>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="cantidad1"
                    onChange={handleSave}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="accesorio2"
                    onChange={handleSave}
                  />
                </td>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="cantidad2"
                    onChange={handleSave}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="accesorio3"
                    onChange={handleSave}
                  />
                </td>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="cantidad3"
                    onChange={handleSave}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="accesorio4"
                    onChange={handleSave}
                  />
                </td>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="cantidad4"
                    onChange={handleSave}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="accesorio5"
                    onChange={handleSave}
                  />
                </td>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="cantidad5"
                    onChange={handleSave}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="accesorio6"
                    onChange={handleSave}
                  />
                </td>
                <td colSpan={2}>
                  <input
                    className="input-ficha"
                    name="cantidad6"
                    onChange={handleSave}
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
                  ></textarea>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="button-contenedor">
            <input
              type="button"
              value="Crear"
              className="button"
              onClick={Create}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
export default FichaTecnica;
