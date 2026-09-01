import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  apiUpdateFicha,
  apiGetFichaById,
  apiDeleteFicha,
  apiVerDocumentoFicha,
  apiDeleteDocumentoFicha,
} from '../utils/api';
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
  FaFilePdf,
  FaBook,
  FaFileAlt,
  FaShieldAlt,
  FaBoxOpen,
  FaWrench,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';
import { GoEye } from 'react-icons/go';

function EditFichaTecnica() {
  const [imagen, setImagen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const maxNumber = 1;

  // Estados para nuevos documentos a subir
  const [newDocManualUso, setNewDocManualUso] = useState(null);
  const [newDocGuiaRapida, setNewDocGuiaRapida] = useState(null);
  const [newDocRegistroInvima, setNewDocRegistroInvima] = useState(null);
  const [newDocDeclaracionImportacion, setNewDocDeclaracionImportacion] = useState(null);
  const [newDocManualServicio, setNewDocManualServicio] = useState(null);

  const [ficha, setFicha] = useState({
    _id: '',
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
    manual_uso: null,
    guia_rapida: null,
    registro_invima_doc: null,
    declaracion_importacion: null,
    manual_servicio: null,
  });

  const ObtenerFicha = async (id) => {
    try {
      const response = await request({
        link: apiGetFichaById,
        method: 'GET',
        body: { id },
      });
      if (response && response.success && response.ficha) {
        setFicha(response.ficha);
        if (response.ficha.imagen) {
          if (Array.isArray(response.ficha.imagen)) {
            setImagen(response.ficha.imagen);
          } else if (typeof response.ficha.imagen === 'string') {
            setImagen([{ data_url: response.ficha.imagen }]);
          }
        }
      } else {
        alert(`${response?.message || 'Error al obtener la ficha técnica'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión con el servidor');
    }
  };

  useEffect(() => {
    const queryParameters = new URLSearchParams(window.location.search);
    const idEquipo = queryParameters.get('id');
    if (idEquipo) {
      ObtenerFicha(idEquipo);
    } else {
      alert('Seleccione una ficha técnica válida');
      window.location.href = './fichastecnicas';
    }
  }, []);

  const handleSave = (e) => {
    const { name, value } = e.target;
    setFicha((prev) => ({ ...prev, [name]: value }));
  };

  const onImageChange = (imageList) => {
    setImagen(imageList);
  };

  const eliminarDocumento = async (tipo_documento) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar este documento de la ficha técnica?`);
    if (!confirmar) return;

    try {
      const response = await request({
        link: apiDeleteDocumentoFicha,
        body: { id: ficha._id, tipo_documento },
        method: 'POST',
      });
      if (response && response.success) {
        alert('Documento eliminado correctamente');
        setFicha((prev) => ({ ...prev, [tipo_documento]: null }));
      } else {
        alert(response?.message || 'Error al eliminar el documento');
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor');
    }
  };

  const Update = async (e) => {
    if (e) e.preventDefault();
    if (!ficha.marca?.trim() || !ficha.modelo?.trim()) {
      alert('Por favor ingresa la marca y el modelo de la ficha técnica.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('_id', ficha._id);
      if (imagen && imagen.length > 0) {
        formData.append('imagen', JSON.stringify(imagen));
      }
      formData.append('marca', ficha.marca.trim().toUpperCase());
      formData.append('modelo', ficha.modelo.trim().toUpperCase());
      formData.append('clas_biomedica', ficha.clas_biomedica || '');
      formData.append('tecnologia', ficha.tecnologia || '');
      formData.append('voltaje', ficha.voltaje || '');
      formData.append('amperaje', ficha.amperaje || '');
      formData.append('potencia', ficha.potencia || '');
      formData.append('temperatura', ficha.temperatura || '');
      formData.append('frecuencia', ficha.frecuencia || '');
      formData.append('bateria', ficha.bateria || '');
      for (let i = 1; i <= 6; i++) {
        formData.append(`accesorio${i}`, ficha[`accesorio${i}`] || '');
        formData.append(`cantidad${i}`, ficha[`cantidad${i}`] || '');
      }
      formData.append('recomendaciones', ficha.recomendaciones || '');

      // Adjuntar nuevos archivos PDF si fueron seleccionados
      if (newDocManualUso) formData.append('manual_uso', newDocManualUso);
      if (newDocGuiaRapida) formData.append('guia_rapida', newDocGuiaRapida);
      if (newDocRegistroInvima) formData.append('registro_invima_doc', newDocRegistroInvima);
      if (newDocDeclaracionImportacion) formData.append('declaracion_importacion', newDocDeclaracionImportacion);
      if (newDocManualServicio) formData.append('manual_servicio', newDocManualServicio);

      const res = await fetch(apiUpdateFicha, {
        method: 'POST',
        body: formData,
      });
      const response = await res.json();

      if (response && response.success) {
        alert('¡Ficha técnica actualizada exitosamente!');
        window.location.href = './fichastecnicas';
      } else {
        alert(`${response?.message || 'Error al actualizar la ficha técnica'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const deleteFicha = async () => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar la ficha técnica para "${ficha.marca} - ${ficha.modelo}"?`);
    if (confirmar) {
      setDeleting(true);
      try {
        const response = await request({
          link: apiDeleteFicha,
          body: { _id: ficha._id },
          method: 'POST',
        });
        if (response && response.success) {
          alert('Ficha técnica eliminada exitosamente');
          window.location.href = './fichastecnicas';
        } else {
          alert(`${response?.message || 'Error al eliminar la ficha técnica'}`);
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor');
      } finally {
        setDeleting(false);
      }
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
              <FaFileMedical color="#38bdf8" /> Editar Ficha Técnica: {ficha.marca} {ficha.modelo}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Modifica las especificaciones técnicas del fabricante, foto y accesorios.
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
        <form onSubmit={Update}>
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
                    value={ficha.marca || ''}
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
                    value={ficha.modelo || ''}
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
                    value={ficha.clas_biomedica || ''}
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
                    value={ficha.tecnologia || ''}
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
                <input className="input-report" name="voltaje" type="text" value={ficha.voltaje || ''} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>AMPERAJE:</label>
                <input className="input-report" name="amperaje" type="text" value={ficha.amperaje || ''} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>POTENCIA:</label>
                <input className="input-report" name="potencia" type="text" value={ficha.potencia || ''} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>TEMPERATURA:</label>
                <input className="input-report" name="temperatura" type="text" value={ficha.temperatura || ''} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>FRECUENCIA:</label>
                <input className="input-report" name="frecuencia" type="text" value={ficha.frecuencia || ''} onChange={handleSave} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>BATERÍA:</label>
                <input className="input-report" name="bateria" type="text" value={ficha.bateria || ''} onChange={handleSave} />
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
                    placeholder={`Accesorio ${idx}`}
                    value={ficha[`accesorio${idx}`] || ''}
                    onChange={handleSave}
                  />
                  <input
                    className="input-report"
                    name={`cantidad${idx}`}
                    type="text"
                    placeholder="Cantidad"
                    value={ficha[`cantidad${idx}`] || ''}
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
              value={ficha.recomendaciones || ''}
              onChange={handleSave}
            />
          </div>

          {/* Bloque 5: Documentos y Manuales Técnicos en PDF */}
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
            <h3 style={{ margin: '0 0 6px 0', color: '#38bdf8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFilePdf /> 5. DOCUMENTOS Y MANUALES DEL EQUIPO (PDF)
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '13px' }}>
              Gestiona los manuales y documentos reglamentarios del modelo. Los documentos adjuntos aplican a todas las hojas de vida de los equipos con este modelo.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* 1. Manual de Uso */}
              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FaBook /> Manual de Uso / Operación
                </label>
                {ficha.manual_uso?.nombre_archivo ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '12px', marginBottom: '6px' }}>
                      <FaCheckCircle /> <span>{ficha.manual_uso.nombre_original || 'Manual de uso adjunto'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`${apiVerDocumentoFicha}/${ficha.manual_uso.nombre_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <GoEye /> Ver
                      </a>
                      <button
                        type="button"
                        onClick={() => eliminarDocumento('manual_uso')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <FaTrash size={11} /> Eliminar
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>Reemplazar archivo:</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    <FaExclamationCircle /> <span>No adjuntado</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNewDocManualUso(e.target.files[0] || null)}
                  style={{ color: '#cbd5e1', fontSize: '12px', width: '100%' }}
                />
                {newDocManualUso && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#38bdf8' }}>
                    Nuevo archivo: {newDocManualUso.name}
                  </div>
                )}
              </div>

              {/* 2. Guía Rápida */}
              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FaFileAlt /> Guía Rápida de Manejo
                </label>
                {ficha.guia_rapida?.nombre_archivo ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '12px', marginBottom: '6px' }}>
                      <FaCheckCircle /> <span>{ficha.guia_rapida.nombre_original || 'Guía rápida adjunta'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`${apiVerDocumentoFicha}/${ficha.guia_rapida.nombre_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <GoEye /> Ver
                      </a>
                      <button
                        type="button"
                        onClick={() => eliminarDocumento('guia_rapida')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <FaTrash size={11} /> Eliminar
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>Reemplazar archivo:</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    <FaExclamationCircle /> <span>No adjuntado</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNewDocGuiaRapida(e.target.files[0] || null)}
                  style={{ color: '#cbd5e1', fontSize: '12px', width: '100%' }}
                />
                {newDocGuiaRapida && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#38bdf8' }}>
                    Nuevo archivo: {newDocGuiaRapida.name}
                  </div>
                )}
              </div>

              {/* 3. Registro INVIMA */}
              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FaShieldAlt /> Registro Sanitario INVIMA
                </label>
                {ficha.registro_invima_doc?.nombre_archivo ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '12px', marginBottom: '6px' }}>
                      <FaCheckCircle /> <span>{ficha.registro_invima_doc.nombre_original || 'Registro INVIMA adjunto'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`${apiVerDocumentoFicha}/${ficha.registro_invima_doc.nombre_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <GoEye /> Ver
                      </a>
                      <button
                        type="button"
                        onClick={() => eliminarDocumento('registro_invima_doc')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <FaTrash size={11} /> Eliminar
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>Reemplazar archivo:</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    <FaExclamationCircle /> <span>No adjuntado</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNewDocRegistroInvima(e.target.files[0] || null)}
                  style={{ color: '#cbd5e1', fontSize: '12px', width: '100%' }}
                />
                {newDocRegistroInvima && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#38bdf8' }}>
                    Nuevo archivo: {newDocRegistroInvima.name}
                  </div>
                )}
              </div>

              {/* 4. Declaración de Importación */}
              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FaBoxOpen /> Declaración de Importación
                </label>
                {ficha.declaracion_importacion?.nombre_archivo ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '12px', marginBottom: '6px' }}>
                      <FaCheckCircle /> <span>{ficha.declaracion_importacion.nombre_original || 'Declaración de importación adjunta'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`${apiVerDocumentoFicha}/${ficha.declaracion_importacion.nombre_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <GoEye /> Ver
                      </a>
                      <button
                        type="button"
                        onClick={() => eliminarDocumento('declaracion_importacion')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <FaTrash size={11} /> Eliminar
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>Reemplazar archivo:</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    <FaExclamationCircle /> <span>No adjuntado</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNewDocDeclaracionImportacion(e.target.files[0] || null)}
                  style={{ color: '#cbd5e1', fontSize: '12px', width: '100%' }}
                />
                {newDocDeclaracionImportacion && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#38bdf8' }}>
                    Nuevo archivo: {newDocDeclaracionImportacion.name}
                  </div>
                )}
              </div>

              {/* 5. Manual de Servicio */}
              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FaWrench /> Manual de Servicio y Mantenimiento
                </label>
                {ficha.manual_servicio?.nombre_archivo ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '12px', marginBottom: '6px' }}>
                      <FaCheckCircle /> <span>{ficha.manual_servicio.nombre_original || 'Manual de servicio adjunto'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`${apiVerDocumentoFicha}/${ficha.manual_servicio.nombre_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <GoEye /> Ver
                      </a>
                      <button
                        type="button"
                        onClick={() => eliminarDocumento('manual_servicio')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <FaTrash size={11} /> Eliminar
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>Reemplazar archivo:</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    <FaExclamationCircle /> <span>No adjuntado</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNewDocManualServicio(e.target.files[0] || null)}
                  style={{ color: '#cbd5e1', fontSize: '12px', width: '100%' }}
                />
                {newDocManualServicio && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#38bdf8' }}>
                    Nuevo archivo: {newDocManualServicio.name}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '30px' }}>
            <button
              type="button"
              onClick={deleteFicha}
              disabled={deleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                border: '1.5px solid #ef4444',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <FaTrash size={14} /> {deleting ? 'Eliminando...' : 'Eliminar Ficha'}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
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
                <FaSave size={15} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditFichaTecnica;
