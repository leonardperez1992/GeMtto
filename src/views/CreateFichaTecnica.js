import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCrearFicha } from '../utils/api';
import request from '../utils/request';
import ImageUploading from 'react-images-uploading';
import {
  FaFileMedical,
  FaBolt,
  FaPlug,
  FaSave,
  FaArrowLeft,
  FaCamera,
  FaTrash,
  FaInfoCircle,
} from 'react-icons/fa';

function CreateFichaTecnica() {
  const [imagen, setImagen] = useState([]);
  const [loading, setLoading] = useState(false);
  const maxNumber = 1;

  const [ficha, setFicha] = useState({
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
    const { name, value } = e.target;
    setFicha((prev) => ({ ...prev, [name]: value }));
  };

  const onImageChange = (imageList) => {
    setImagen(imageList);
  };

  const Create = async (e) => {
    if (e) e.preventDefault();
    if (!ficha.marca.trim() || !ficha.modelo.trim()) {
      alert('Por favor ingresa al menos la marca y el modelo del equipo para la ficha técnica.');
      return;
    }

    setLoading(true);
    try {
      const response = await request({
        link: apiCrearFicha,
        body: {
          imagen: imagen,
          marca: ficha.marca.trim().toUpperCase(),
          modelo: ficha.modelo.trim().toUpperCase(),
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

      if (response && response.success) {
        alert('¡Ficha técnica creada exitosamente!');
        window.location.href = './fichastecnicas';
      } else {
        alert(`${response?.message || 'Error al crear la ficha técnica'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contenedor" style={{ maxWidth: '950px', margin: '0 auto', padding: '20px 15px' }}>
      <main>
        {/* Navigation / Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            padding: '16px 22px',
            borderRadius: '12px',
            border: '1.5px solid #334155',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
              <FaFileMedical color="#38bdf8" /> Crear Ficha Técnica de Equipo
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Registra las especificaciones técnicas del fabricante, foto y accesorios del modelo.
            </p>
          </div>
          <Link
            to="/fichastecnicas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13.5px',
              textDecoration: 'none',
            }}
          >
            <FaArrowLeft size={13} /> Volver a Fichas Técnicas
          </Link>
        </div>

        {/* Form Sections */}
        <form onSubmit={Create}>
          {/* Bloque 1: Foto e Información General */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaCamera /> 1. FOTOGRAFÍA Y DATOS GENERALES DEL MODELO
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'start' }}>
              {/* Uploader */}
              <div
                style={{
                  backgroundColor: '#0f172a',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px dashed #38bdf8',
                  textAlign: 'center',
                }}
              >
                <ImageUploading
                  value={imagen}
                  onChange={onImageChange}
                  maxNumber={maxNumber}
                  dataURLKey="data_url"
                >
                  {({ imageList, onImageUpload, onImageRemoveAll, isDragging, dragProps }) => (
                    <div>
                      {imageList.length === 0 ? (
                        <div
                          onClick={onImageUpload}
                          {...dragProps}
                          style={{
                            cursor: 'pointer',
                            padding: '20px 10px',
                            color: isDragging ? '#38bdf8' : '#94a3b8',
                          }}
                        >
                          <FaCamera size={36} color="#38bdf8" style={{ marginBottom: '8px' }} />
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#f8fafc' }}>
                            Haz clic para subir foto del equipo
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>PNG, JPG o JPEG</div>
                        </div>
                      ) : (
                        <div>
                          {imageList.map((img, idx) => (
                            <div key={idx}>
                              <img
                                src={img['data_url']}
                                alt="Foto equipo"
                                style={{
                                  maxHeight: '140px',
                                  maxWidth: '100%',
                                  objectFit: 'contain',
                                  borderRadius: '8px',
                                  border: '1px solid #334155',
                                  marginBottom: '8px',
                                }}
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={onImageRemoveAll}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    backgroundColor: '#7f1d1d',
                                    color: '#fca5a5',
                                    border: '1px solid #ef4444',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FaTrash size={12} /> Eliminar Foto
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </ImageUploading>
              </div>

              {/* General Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    MARCA DEL EQUIPO:
                  </label>
                  <input
                    className="input-report"
                    name="marca"
                    type="text"
                    placeholder="Ej. MINDRAY, EDAN, PHILIPS..."
                    value={ficha.marca}
                    onChange={handleSave}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    MODELO:
                  </label>
                  <input
                    className="input-report"
                    name="modelo"
                    type="text"
                    placeholder="Ej. IMEC 8, BeneView T5, iM70..."
                    value={ficha.modelo}
                    onChange={handleSave}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    CLASIFICACIÓN BIOMÉDICA:
                  </label>
                  <input
                    className="input-report"
                    name="clas_biomedica"
                    type="text"
                    placeholder="Ej. DIAGNÓSTICO, TRATAMIENTO, REHABILITACIÓN..."
                    value={ficha.clas_biomedica}
                    onChange={handleSave}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    TECNOLOGÍA PREDOMINANTE:
                  </label>
                  <input
                    className="input-report"
                    name="tecnologia"
                    type="text"
                    placeholder="Ej. ELECTRÓNICA, ELECTROMECÁNICA, ÓPTICA..."
                    value={ficha.tecnologia}
                    onChange={handleSave}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Especificaciones Eléctricas */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaBolt /> 2. ESPECIFICACIONES ELÉCTRICAS Y OPERATIVAS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>VOLTAJE:</label>
                <input className="input-report" name="voltaje" type="text" placeholder="Ej. 100-240 VAC" value={ficha.voltaje} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>AMPERAJE:</label>
                <input className="input-report" name="amperaje" type="text" placeholder="Ej. 1.5 A" value={ficha.amperaje} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>POTENCIA:</label>
                <input className="input-report" name="potencia" type="text" placeholder="Ej. 110 W" value={ficha.potencia} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>TEMPERATURA:</label>
                <input className="input-report" name="temperatura" type="text" placeholder="Ej. 10°C - 40°C" value={ficha.temperatura} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>FRECUENCIA:</label>
                <input className="input-report" name="frecuencia" type="text" placeholder="Ej. 50/60 Hz" value={ficha.frecuencia} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>BATERÍA:</label>
                <input className="input-report" name="bateria" type="text" placeholder="Ej. Li-ion 11.1V / 4400 mAh" value={ficha.bateria} onChange={handleSave} />
              </div>
            </div>
          </div>

          {/* Bloque 3: Accesorios */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaPlug /> 3. ACCESORIOS Y CANTIDADES
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px' }}>
                  <input
                    className="input-report"
                    name={`accesorio${idx}`}
                    type="text"
                    placeholder={`Accesorio ${idx} (ej. Sensor SpO2, Brazalete PNI, Cable ECG...)`}
                    value={ficha[`accesorio${idx}`]}
                    onChange={handleSave}
                  />
                  <input
                    className="input-report"
                    name={`cantidad${idx}`}
                    type="text"
                    placeholder="Cantidad"
                    value={ficha[`cantidad${idx}`]}
                    onChange={handleSave}
                    style={{ textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bloque 4: Recomendaciones */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', color: '#38bdf8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaInfoCircle /> 4. RECOMENDACIONES DEL FABRICANTE
            </h3>
            <textarea
              className="textarea-report"
              name="recomendaciones"
              rows={4}
              placeholder="Escribe las recomendaciones de operación, limpieza, precauciones de seguridad o mantenimiento del fabricante..."
              value={ficha.recomendaciones}
              onChange={handleSave}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '30px' }}>
            <Link
              to="/fichastecnicas"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                backgroundColor: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 28px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
            >
              <FaSave size={15} /> {loading ? 'Guardando...' : 'Guardar Ficha Técnica'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateFichaTecnica;
