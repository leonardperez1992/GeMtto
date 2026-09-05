import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ImageUploading from 'react-images-uploading';
import {
  apiGetIps,
  apiEditIps,
  apiUploadDocIps,
  apiDeleteDocIps,
  apiVerDocIps,
  apiAddEnlaceDriveIps,
  apiDeleteEnlaceDriveIps,
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
  FaImage,
  FaGoogleDrive,
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
} from 'react-icons/fa';

function EditarIps() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ipsId = searchParams.get('id');
  const ipsNombre = searchParams.get('ips');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Datos básicos y Logo
  const [logoList, setLogoList] = useState([]);
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
    enlaces_drive: [],
  });

  // Modal / Inputs para documento adicional
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Habilitación');
  const fileInputRefAdicional = useRef(null);

  // Estados para Enlaces de Google Drive
  const [nuevoDriveTitulo, setNuevoDriveTitulo] = useState('');
  const [nuevoDriveUrl, setNuevoDriveUrl] = useState('');
  const [nuevoDriveDescripcion, setNuevoDriveDescripcion] = useState('');
  const [guardandoDrive, setGuardandoDrive] = useState(false);
  const [copiadoId, setCopiadoId] = useState(null);

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

        let initialLogo = [];
        if (inst.logo) {
          if (Array.isArray(inst.logo)) {
            initialLogo = inst.logo
              .map((item) => (typeof item === 'string' ? { data_url: item } : item))
              .filter((item) => item && item.data_url);
          } else if (typeof inst.logo === 'string' && inst.logo.trim()) {
            initialLogo = [{ data_url: inst.logo.trim() }];
          } else if (inst.logo && inst.logo.data_url) {
            initialLogo = [inst.logo];
          }
        }
        setLogoList(initialLogo);

        setIpsData({
          _id: inst._id || '',
          ips: inst.ips || '',
          nit: inst.nit || '',
          ciudad: inst.ciudad || '',
          logo: initialLogo,
          plan_mantenimiento: inst.plan_mantenimiento || null,
          plan_capacitacion: inst.plan_capacitacion || null,
          protocolos: inst.protocolos || null,
          documentos_adicionales: Array.isArray(inst.documentos_adicionales) ? inst.documentos_adicionales : [],
          enlaces_drive: Array.isArray(inst.enlaces_drive) ? inst.enlaces_drive : [],
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

  // Guardar cambios básicos y logotipo de la IPS
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
          logo: logoList,
        },
      });

      if (response && response.success) {
        alert('¡Datos y logotipo de la IPS actualizados correctamente!');
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

  // Guardar nuevo enlace de Google Drive
  const handleGuardarDrive = async (e) => {
    if (e) e.preventDefault();
    if (!ipsData._id) {
      alert('Identificador de la IPS no disponible.');
      return;
    }
    if (!nuevoDriveTitulo.trim()) {
      alert('Por favor ingresa un título para el enlace de Drive.');
      return;
    }
    if (!nuevoDriveUrl.trim()) {
      alert('Por favor ingresa la URL o enlace de Google Drive.');
      return;
    }

    setGuardandoDrive(true);
    try {
      const response = await request({
        link: apiAddEnlaceDriveIps,
        method: 'POST',
        body: {
          id: ipsData._id,
          ips: ipsData.ips,
          titulo: nuevoDriveTitulo.trim(),
          url: nuevoDriveUrl.trim(),
          descripcion: nuevoDriveDescripcion.trim(),
        },
      });

      if (response && response.success) {
        alert('¡Enlace de Google Drive vinculado exitosamente a la IPS!');
        setNuevoDriveTitulo('');
        setNuevoDriveUrl('');
        setNuevoDriveDescripcion('');
        cargarIps();
      } else {
        alert(response?.message || 'Error al agregar enlace de Drive');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar el enlace de Drive.');
    } finally {
      setGuardandoDrive(false);
    }
  };

  // Eliminar un enlace de Google Drive
  const handleEliminarDrive = async (enlaceId, titulo) => {
    const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar el enlace de Drive "${titulo || ''}"?`);
    if (!confirmacion) return;

    try {
      const response = await request({
        link: apiDeleteEnlaceDriveIps,
        method: 'POST',
        body: {
          id: ipsData._id,
          ips: ipsData.ips,
          enlace_id: enlaceId,
        },
      });

      if (response && response.success) {
        alert('Enlace de Google Drive eliminado correctamente.');
        cargarIps();
      } else {
        alert(response?.message || 'Error al eliminar enlace de Drive');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar enlace de Drive.');
    }
  };

  // Copiar enlace al portapapeles
  const handleCopiarDrive = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2500);
    }).catch(() => {
      alert('No se pudo copiar el enlace al portapapeles.');
    });
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                <FaHospital /> NOMBRE DE LA IPS / CLÍNICA *:
              </label>
              <input
                type="text"
                name="ips"
                value={ipsData.ips}
                onChange={handleChange}
                className="input-report"
                placeholder="Ej. CLÍNICA MÉDICA DEL CARIBE..."
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>

            {/* NIT */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                <FaIdCard /> NÚMERO DE NIT / IDENTIFICACIÓN:
              </label>
              <input
                type="text"
                name="nit"
                value={ipsData.nit}
                onChange={handleChange}
                className="input-report"
                placeholder="Ej. 900.123.456-7"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                <FaCity /> CIUDAD / MUNICIPIO:
              </label>
              <input
                type="text"
                name="ciudad"
                value={ipsData.ciudad}
                onChange={handleChange}
                className="input-report"
                placeholder="Ej. VALLEDUPAR"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Logotipo de la Institución */}
          <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #334155', marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12.5px', fontWeight: '700', marginBottom: '8px' }}>
              <FaImage style={{ marginRight: '6px', verticalAlign: 'middle', color: '#38bdf8' }} />
              LOGOTIPO DE LA INSTITUCIÓN / IPS:
            </label>
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '16px',
                borderRadius: '10px',
                border: '1.5px dashed #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '120px',
              }}
            >
              <ImageUploading
                value={logoList}
                onChange={(imageList) => setLogoList(imageList)}
                maxNumber={1}
                dataURLKey="data_url"
                acceptType={['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif']}
              >
                {({ imageList, onImageUpload, onImageRemoveAll, isDragging, dragProps }) => (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    {imageList.length === 0 ? (
                      <div
                        onClick={onImageUpload}
                        {...dragProps}
                        style={{
                          cursor: 'pointer',
                          padding: '18px 12px',
                          color: isDragging ? '#38bdf8' : '#94a3b8',
                          transition: 'all 0.2s',
                        }}
                      >
                        <FaCamera size={32} color="#38bdf8" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#f8fafc' }}>
                          Haz clic o arrastra aquí para subir el logotipo de la IPS
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Formatos admitidos: PNG, JPG, JPEG, SVG, WebP (Se recomienda fondo transparente)
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            backgroundColor: '#ffffff',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                          }}
                        >
                          <img
                            src={imageList[0]?.data_url}
                            alt="Logo IPS"
                            style={{
                              maxHeight: '85px',
                              maxWidth: '260px',
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={onImageUpload}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              backgroundColor: '#0369a1',
                              color: '#ffffff',
                              border: '1px solid #38bdf8',
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(3, 105, 161, 0.3)',
                            }}
                          >
                            <FaCamera size={13} /> Cambiar Logotipo
                          </button>
                          <button
                            type="button"
                            onClick={onImageRemoveAll}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              backgroundColor: '#7f1d1d',
                              color: '#fca5a5',
                              border: '1px solid #ef4444',
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            <FaTrash size={12} /> Eliminar Logotipo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ImageUploading>
            </div>
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

        {/* Sección 3: Carpetas y Enlaces de Google Drive */}
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
                <FaGoogleDrive color="#10b981" size={18} /> 3. Carpetas y Enlaces de Google Drive
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                Vincula carpetas compartidas de Google Drive con manuales, fotos o certificados para los usuarios de esta IPS.
              </p>
            </div>
            {guardandoDrive && (
              <span style={{ color: '#38bdf8', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSpinner className="spin" size={14} /> Guardando enlace de Drive...
              </span>
            )}
          </div>

          {/* Formulario para agregar enlace Drive */}
          <form
            onSubmit={handleGuardarDrive}
            style={{
              backgroundColor: '#0f172a',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #334155',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#38bdf8', fontSize: '12px', fontWeight: '700', marginBottom: '5px' }}>
                  TÍTULO O NOMBRE DEL ENLACE *:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Carpeta General de Manuales y Guías Técnicas"
                  value={nuevoDriveTitulo}
                  onChange={(e) => setNuevoDriveTitulo(e.target.value)}
                  className="input-report"
                  style={{ width: '100%', fontSize: '13px' }}
                  required
                  disabled={guardandoDrive}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#38bdf8', fontSize: '12px', fontWeight: '700', marginBottom: '5px' }}>
                  ENLACE O URL DE GOOGLE DRIVE *:
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={nuevoDriveUrl}
                  onChange={(e) => setNuevoDriveUrl(e.target.value)}
                  className="input-report"
                  style={{ width: '100%', fontSize: '13px' }}
                  required
                  disabled={guardandoDrive}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '700', marginBottom: '5px' }}>
                DESCRIPCIÓN O NOTAS (OPCIONAL):
              </label>
              <input
                type="text"
                placeholder="Breve descripción del contenido de la carpeta en la nube..."
                value={nuevoDriveDescripcion}
                onChange={(e) => setNuevoDriveDescripcion(e.target.value)}
                className="input-report"
                style={{ width: '100%', fontSize: '13px' }}
                disabled={guardandoDrive}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="submit"
                disabled={guardandoDrive}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: guardandoDrive ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
                }}
              >
                {guardandoDrive ? (
                  <>
                    <FaSpinner className="spin" size={13} /> Guardando...
                  </>
                ) : (
                  <>
                    <FaPlus size={11} /> Vincular Enlace Drive
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Lista de enlaces existentes */}
          {ipsData.enlaces_drive.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '12.5px', fontStyle: 'italic', padding: '10px 0' }}>
              No hay carpetas ni enlaces de Google Drive vinculados para esta IPS.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {ipsData.enlaces_drive.map((item, idx) => (
                <div
                  key={item._id || idx}
                  style={{
                    backgroundColor: '#0f172a',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <FaGoogleDrive color="#10b981" size={15} /> {item.titulo}
                    </div>
                    {item.descripcion && (
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', lineHeight: '1.3' }}>
                        {item.descripcion}
                      </div>
                    )}
                    <div
                      style={{
                        backgroundColor: '#1e293b',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: '#38bdf8',
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '10px',
                        border: '1px solid #334155',
                      }}
                      title={item.url}
                    >
                      🔗 {item.url}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <FaExternalLinkAlt size={11} /> Abrir
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopiarDrive(item.url, item._id || idx)}
                      style={{
                        backgroundColor: '#334155',
                        color: copiadoId === (item._id || idx) ? '#34d399' : '#f8fafc',
                        border: '1px solid #475569',
                        padding: '5px 8px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Copiar enlace"
                    >
                      {copiadoId === (item._id || idx) ? (
                        <>
                          <FaCheck size={10} color="#34d399" /> Copiado
                        </>
                      ) : (
                        <>
                          <FaCopy size={10} /> Copiar
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarDrive(item._id, item.titulo)}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '5px 8px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginLeft: 'auto',
                      }}
                      title="Eliminar enlace"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default EditarIps;
