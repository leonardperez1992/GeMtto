import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ImageUploading from 'react-images-uploading';
import {
  apiGetIps,
  apiEditIps,
  apiUploadDocIps,
  apiDeleteDocIps,
  apiVerDocIps,
} from '../utils/api';
import request from '../utils/request';
import {
  FaHospital,
  FaCity,
  FaIdCard,
  FaSave,
  FaArrowLeft,
  FaFilePdf,
  FaUpload,
  FaTrash,
  FaEye,
  FaPlus,
  FaFolderOpen,
  FaSpinner,
  FaCamera,
} from 'react-icons/fa';

function EditarIps() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ipsId = searchParams.get('id');
  const ipsNombre = searchParams.get('ips');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Datos básicos
  const [ipsData, setIpsData] = useState({
    _id: '',
    ips: '',
    nit: '',
    ciudad: '',
    logo: [],
    plan_mantenimiento: null,
    plan_capacitacion: null,
    protocolos: null,
    documentos_adicionales: [],
  });

  // Modal / Inputs para documento adicional
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Habilitación');
  const fileInputRefAdicional = useRef(null);

  const fileInputPlanMtto = useRef(null);
  const fileInputPlanCap = useRef(null);
  const fileInputProtocolos = useRef(null);

  const cargarIps = async () => {
    setLoading(true);
    try {
      const url = ipsId
        ? `${apiGetIps}?id=${ipsId}`
        : `${apiGetIps}?ips=${encodeURIComponent(ipsNombre || '')}`;
      const response = await request({ link: url, method: 'GET' });

      if (response && response.success && response.institucion) {
        const inst = response.institucion;
        setIpsData({
          _id: inst._id || '',
          ips: inst.ips || '',
          nit: inst.nit || '',
          ciudad: inst.ciudad || '',
          logo: inst.logo ? (Array.isArray(inst.logo) ? inst.logo : [inst.logo]) : [],
          plan_mantenimiento: inst.plan_mantenimiento || null,
          plan_capacitacion: inst.plan_capacitacion || null,
          protocolos: inst.protocolos || null,
          documentos_adicionales: Array.isArray(inst.documentos_adicionales) ? inst.documentos_adicionales : [],
        });
      } else {
        alert('No se pudo encontrar la institución.');
        navigate('/ips');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al cargar datos de la IPS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ipsId && !ipsNombre) {
      alert('Por favor selecciona una IPS para editar');
      navigate('/ips');
      return;
    }
    cargarIps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipsId, ipsNombre]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIpsData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (imageList) => {
    setIpsData((prev) => ({ ...prev, logo: imageList }));
  };

  // Guardar cambios básicos de la IPS
  const handleGuardarBasicos = async (e) => {
    if (e) e.preventDefault();
    if (!ipsData.ips.trim()) {
      alert('El nombre de la IPS es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const response = await request({
        link: apiEditIps,
        method: 'POST',
        body: {
          _id: ipsData._id,
          ips: ipsData.ips.trim().toUpperCase(),
          nit: ipsData.nit.trim(),
          ciudad: ipsData.ciudad.trim().toUpperCase(),
          logo: ipsData.logo,
        },
      });

      if (response && response.success) {
        alert('¡Datos de la IPS actualizados correctamente!');
      } else {
        alert(response?.message || 'Error al actualizar datos');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar cambios.');
    } finally {
      setSaving(false);
    }
  };

  // Subir un documento específico (Plan Mtto, Plan Capacitación, Protocolos)
  const handleUploadSingleDoc = async (file, tipo_documento) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Solo se permiten archivos en formato PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('id', ipsData._id);
    formData.append('ips', ipsData.ips);
    formData.append('tipo_documento', tipo_documento);
    formData.append('file', file);

    setUploadingDoc(true);
    try {
      const res = await fetch(apiUploadDocIps, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data && data.success) {
        alert('¡Documento PDF subido exitosamente!');
        cargarIps();
      } else {
        alert(data?.message || 'Error al subir el documento PDF');
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor para subir el documento.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Subir documento adicional
  const handleUploadDocAdicional = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Solo se permiten archivos en formato PDF.');
      return;
    }

    const titulo = nuevoTitulo.trim() || file.name.replace(/\.[^/.]+$/, '');
    const formData = new FormData();
    formData.append('id', ipsData._id);
    formData.append('ips', ipsData.ips);
    formData.append('tipo_documento', 'documentos_adicionales');
    formData.append('titulo', titulo);
    formData.append('categoria', nuevaCategoria);
    formData.append('file', file);

    setUploadingDoc(true);
    try {
      const res = await fetch(apiUploadDocIps, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data && data.success) {
        alert('¡Documento adicional PDF subido con éxito!');
        setNuevoTitulo('');
        if (fileInputRefAdicional.current) fileInputRefAdicional.current.value = '';
        cargarIps();
      } else {
        alert(data?.message || 'Error al subir documento');
      }
    } catch (err) {
      console.error(err);
      alert('Error al subir documento adicional.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Eliminar un documento PDF
  const handleEliminarDoc = async (tipo_documento, doc_id = null, nombre_archivo = null) => {
    const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar este documento PDF?');
    if (!confirmacion) return;

    try {
      const response = await request({
        link: apiDeleteDocIps,
        method: 'POST',
        body: {
          id: ipsData._id,
          tipo_documento,
          doc_id,
          nombre_archivo,
        },
      });

      if (response && response.success) {
        alert('Documento eliminado correctamente.');
        cargarIps();
      } else {
        alert(response?.message || 'Error al eliminar documento');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar documento.');
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="contenedor" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        <FaSpinner className="spin" size={26} style={{ marginBottom: '10px' }} />
        <div>Cargando datos de la institución...</div>
      </div>
    );
  }

  return (
    <div className="contenedor" style={{ maxWidth: '980px', margin: '0 auto', padding: '20px 15px' }}>
      <main>
        {/* Header Toolbar */}
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
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
              <FaHospital color="#38bdf8" /> Editar IPS y Gestión de Documentos
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              {ipsData.ips} {ipsData.nit ? `(NIT: ${ipsData.nit})` : ''} - {ipsData.ciudad}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to={`/documentosips?id=${ipsData._id}&ips=${encodeURIComponent(ipsData.ips)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0f766e',
                color: '#ffffff',
                border: '1px solid #14b8a6',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                textDecoration: 'none',
              }}
            >
              <FaFolderOpen size={14} color="#34d399" /> Ver Portal Documentos
            </Link>

            <Link
              to="/ips"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                textDecoration: 'none',
              }}
            >
              <FaArrowLeft size={13} /> Volver a IPS
            </Link>
          </div>
        </div>

        {/* Formulario 1: Datos Básicos */}
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '22px',
            border: '1.5px solid #334155',
            marginBottom: '26px',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaHospital /> 1. Información General de la Institución
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Nombre IPS */}
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                NOMBRE DE LA IPS / CLÍNICA *:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="ips"
                  value={ipsData.ips}
                  onChange={handleChange}
                  className="input-report"
                  style={{ width: '100%', paddingLeft: '32px' }}
                  required
                />
                <FaHospital style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8' }} />
              </div>
            </div>

            {/* NIT */}
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                NÚMERO DE NIT / IDENTIFICACIÓN:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="nit"
                  value={ipsData.nit}
                  onChange={handleChange}
                  className="input-report"
                  style={{ width: '100%', paddingLeft: '32px' }}
                />
                <FaIdCard style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                CIUDAD / MUNICIPIO:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="ciudad"
                  value={ipsData.ciudad}
                  onChange={handleChange}
                  className="input-report"
                  style={{ width: '100%', paddingLeft: '32px' }}
                />
                <FaCity style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8' }} />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
              LOGO INSTITUCIONAL:
            </label>
            <ImageUploading
              value={ipsData.logo}
              onChange={handleLogoChange}
              maxNumber={1}
              dataURLKey="data_url"
            >
              {({ imageList, onImageUpload, onImageRemove }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {imageList.map((image, index) => (
                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={image['data_url'] || image}
                        alt="Logo"
                        style={{
                          width: '110px',
                          height: '70px',
                          objectFit: 'contain',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          padding: '4px',
                          border: '1.5px solid #38bdf8',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => onImageRemove(index)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {imageList.length === 0 && (
                    <button
                      type="button"
                      onClick={onImageUpload}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0f172a',
                        border: '1.5px dashed #475569',
                        color: '#94a3b8',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <FaCamera color="#38bdf8" /> Subir Logo
                    </button>
                  )}
                </div>
              )}
            </ImageUploading>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={handleGuardarBasicos}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                padding: '9px 22px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '13.5px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
            >
              <FaSave size={14} /> {saving ? 'Guardando...' : 'Guardar Información Básica'}
            </button>
          </div>
        </div>

        {/* Sección 2: Gestión de Documentos PDF Institucionales */}
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '22px',
            border: '1.5px solid #334155',
            marginBottom: '26px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf color="#ef4444" /> 2. Documentos PDF Institucionales y Planes Anuales
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                Estos archivos estarán disponibles inmediatamente para el usuario cliente de esta IPS.
              </p>
            </div>
            {uploadingDoc && (
              <span style={{ color: '#38bdf8', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSpinner className="spin" size={14} /> Subiendo archivo PDF...
              </span>
            )}
          </div>

          {/* Grid de los 3 documentos principales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* 1. Plan de Mantenimiento */}
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                padding: '16px',
                border: ipsData.plan_mantenimiento ? '1.5px solid #10b981' : '1.5px dashed #475569',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <strong style={{ color: '#f8fafc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaFilePdf color="#ef4444" /> Plan de Mantenimiento
                </strong>
                {ipsData.plan_mantenimiento ? (
                  <span style={{ color: '#34d399', fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    CARGADO
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Pendiente</span>
                )}
              </div>

              {ipsData.plan_mantenimiento ? (
                <div>
                  <div style={{ color: '#cbd5e1', fontSize: '12.5px', marginBottom: '4px', wordBreak: 'break-all' }}>
                    {ipsData.plan_mantenimiento.nombre_original}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '12px' }}>
                    Subido: {formatearFecha(ipsData.plan_mantenimiento.fecha_subida)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(ipsData.plan_mantenimiento.nombre_archivo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                      }}
                    >
                      <FaEye size={11} /> Ver PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputPlanMtto.current && fileInputPlanMtto.current.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#334155',
                        color: '#f8fafc',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <FaUpload size={11} /> Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarDoc('plan_mantenimiento')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 10px 0' }}>
                    Adjunta el plan preventivo anual en formato PDF.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputPlanMtto.current && fileInputPlanMtto.current.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <FaUpload size={11} /> Subir Plan de Mtto
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputPlanMtto}
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleUploadSingleDoc(e.target.files[0], 'plan_mantenimiento')}
              />
            </div>

            {/* 2. Plan de Capacitación */}
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                padding: '16px',
                border: ipsData.plan_capacitacion ? '1.5px solid #10b981' : '1.5px dashed #475569',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <strong style={{ color: '#f8fafc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaFilePdf color="#ef4444" /> Plan de Capacitación
                </strong>
                {ipsData.plan_capacitacion ? (
                  <span style={{ color: '#34d399', fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    CARGADO
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Pendiente</span>
                )}
              </div>

              {ipsData.plan_capacitacion ? (
                <div>
                  <div style={{ color: '#cbd5e1', fontSize: '12.5px', marginBottom: '4px', wordBreak: 'break-all' }}>
                    {ipsData.plan_capacitacion.nombre_original}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '12px' }}>
                    Subido: {formatearFecha(ipsData.plan_capacitacion.fecha_subida)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(ipsData.plan_capacitacion.nombre_archivo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                      }}
                    >
                      <FaEye size={11} /> Ver PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputPlanCap.current && fileInputPlanCap.current.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#334155',
                        color: '#f8fafc',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <FaUpload size={11} /> Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarDoc('plan_capacitacion')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 10px 0' }}>
                    Cronograma y temarios de capacitaciones técnicas.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputPlanCap.current && fileInputPlanCap.current.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <FaUpload size={11} /> Subir Plan Capacitación
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputPlanCap}
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleUploadSingleDoc(e.target.files[0], 'plan_capacitacion')}
              />
            </div>

            {/* 3. Protocolos y Guías */}
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                padding: '16px',
                border: ipsData.protocolos ? '1.5px solid #10b981' : '1.5px dashed #475569',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <strong style={{ color: '#f8fafc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaFilePdf color="#ef4444" /> Protocolos y Guías
                </strong>
                {ipsData.protocolos ? (
                  <span style={{ color: '#34d399', fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                    CARGADO
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Pendiente</span>
                )}
              </div>

              {ipsData.protocolos ? (
                <div>
                  <div style={{ color: '#cbd5e1', fontSize: '12.5px', marginBottom: '4px', wordBreak: 'break-all' }}>
                    {ipsData.protocolos.nombre_original}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '12px' }}>
                    Subido: {formatearFecha(ipsData.protocolos.fecha_subida)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(ipsData.protocolos.nombre_archivo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                      }}
                    >
                      <FaEye size={11} /> Ver PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputProtocolos.current && fileInputProtocolos.current.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#334155',
                        color: '#f8fafc',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <FaUpload size={11} /> Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarDoc('protocolos')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 10px 0' }}>
                    Guías de manejo, protocolos de limpieza y bioseguridad.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputProtocolos.current && fileInputProtocolos.current.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <FaUpload size={11} /> Subir Protocolos
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputProtocolos}
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleUploadSingleDoc(e.target.files[0], 'protocolos')}
              />
            </div>
          </div>

          {/* Subsección: Documentos Adicionales (Habilitación, Certificaciones, etc.) */}
          <div style={{ borderTop: '1px solid #334155', paddingTop: '18px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#f8fafc', fontSize: '14.5px', fontWeight: '800' }}>
              Documentos Adicionales, Licencias y Actas de Habilitación
            </h4>

            {/* Formulario rápido para subir documento adicional */}
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '16px',
              }}
            >
              <input
                type="text"
                placeholder="Título del documento (ej. Acta Habilitación 2026)..."
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                className="input-report"
                style={{ flex: '1 1 220px', fontSize: '13px' }}
              />

              <select
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="input-report"
                style={{ flex: '0 1 180px', fontSize: '13px' }}
              >
                <option value="Habilitación">Habilitación</option>
                <option value="Calibraciones">Calibraciones</option>
                <option value="Licencias">Licencias</option>
                <option value="Informes">Informes Institucionales</option>
                <option value="Otros">Otros Documentos</option>
              </select>

              <input
                type="file"
                ref={fileInputRefAdicional}
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={handleUploadDocAdicional}
              />

              <button
                type="button"
                onClick={() => fileInputRefAdicional.current && fileInputRefAdicional.current.click()}
                disabled={uploadingDoc}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <FaPlus size={12} /> Adjuntar PDF
              </button>
            </div>

            {/* Lista de Documentos Adicionales */}
            {ipsData.documentos_adicionales.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '12.5px', fontStyle: 'italic' }}>
                No hay documentos adicionales adjuntos para esta IPS.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {ipsData.documentos_adicionales.map((doc, dIdx) => (
                  <div
                    key={doc._id || dIdx}
                    style={{
                      backgroundColor: '#0f172a',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaFilePdf color="#ef4444" size={13} /> {doc.titulo || doc.nombre_original}
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                        {doc.categoria} • {formatearFecha(doc.fecha_subida)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a
                        href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(doc.nombre_archivo)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          padding: '5px 8px',
                          borderRadius: '5px',
                          fontSize: '11.5px',
                          textDecoration: 'none',
                          display: 'flex',
                        }}
                        title="Ver PDF"
                      >
                        <FaEye size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleEliminarDoc('documentos_adicionales', doc._id, doc.nombre_archivo)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '5px 8px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                        title="Eliminar PDF"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default EditarIps;
