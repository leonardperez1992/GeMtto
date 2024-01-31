import React, { useState } from 'react';
import { apiCreateIps } from '../utils/api';
import request from '../utils/request';
import ImageUploading from 'react-images-uploading';

function CrearIps() {
  const [imagen, setImagen] = useState();
  const maxNumber = 2;
  const [ips, setIps] = useState({
    logo: '',
    ips: '',
    nit: '',
    ciudad: '',
  });

  const handleSave = (e) => {
    setIps(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };
  const onChange = (imageList, addUpdateIndex) => {
    // data for submit
    setImagen(imageList);
  };
  const CreateIps = async () => {
    if (!ips.ips) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiCreateIps,
        body: {
          logo: imagen,
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
                        style={isDragging ? { color: 'red' } : undefined}
                        onClick={onImageUpload}
                        {...dragProps}
                      >
                        Subir Logo
                      </button>
                      &nbsp;
                      <button onClick={onImageRemoveAll}>
                        Eliminar imagen seleccionada
                      </button>
                      {imageList.map((image, index) => (
                        <div key={index} className="image-item">
                          <img src={image['data_url']} alt="" width="100" />
                          <div className="image-item__btn-wrapper">
                            <button onClick={() => onImageUpdate(index)}>
                              Actualizar
                            </button>
                            <button onClick={() => onImageRemove(index)}>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ImageUploading>
              </div>
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
