import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  apiIps,
  apiGetIps,
  apiVerDocIps,
  apiAddEnlaceDriveIps,
  apiDeleteEnlaceDriveIps,
} from '../utils/api';
import request from '../utils/request';
import {
  FaHospital,
  FaFilePdf,
  FaDownload,
  FaEye,
  FaFolderOpen,
  FaGraduationCap,
  FaClipboardList,
  FaBookMedical,
  FaCertificate,
  FaSpinner,
  FaEdit,
  FaGoogleDrive,
  FaExternalLinkAlt,
  FaCopy,
  FaPlus,
  FaTrash,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';

function DocumentosIps() {
  const [searchParams] = useSearchParams();
  const reduxUser = useSelector((state) => state.user);
  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);
  const user = reduxUser || storedUser || {};
  const isPathUser = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('user');
  const isAdmin = !isPathUser && String(user?.rol || '').trim().toLowerCase() === 'admin';
  const userInstitucion = String(user?.institucion || user?.ips || '').trim();

  const [listaIps, setListaIps] = useState([]);
  const [selectedIpsName, setSelectedIpsName] = useState(
    searchParams.get('ips') || (!isAdmin ? userInstitucion : '')
  );
  const [institucionData, setInstitucionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para Enlaces de Google Drive
  const [showModalDrive, setShowModalDrive] = useState(false);
  const [driveTitulo, setDriveTitulo] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [driveDescripcion, setDriveDescripcion] = useState('');
  const [guardandoDrive, setGuardandoDrive] = useState(false);
  const [copiadoId, setCopiadoId] = useState(null);

  // 1. Cargar lista de todas las IPS (para selector admin)
  const fetchListaIps = async () => {
    try {
      const response = await request({ link: apiIps, method: 'GET' });
      if (response && response.success && Array.isArray(response.ips)) {
        setListaIps(response.ips);
        // Si no hay IPS seleccionada y es admin, seleccionar la primera
        if (!selectedIpsName && isAdmin && response.ips.length > 0) {
          setSelectedIpsName(response.ips[0].ips);
        }
      }
    } catch (e) {
      console.error('Error al obtener lista de IPS:', e);
    }
  };

  // 2. Cargar datos y documentos de la IPS seleccionada
  const fetchInstitucionData = async (nombreOId) => {
    if (!nombreOId) {
      setInstitucionData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const queryId = searchParams.get('id');
      const url = queryId
        ? `${apiGetIps}?id=${queryId}`
        : `${apiGetIps}?ips=${encodeURIComponent(nombreOId)}`;

      const response = await request({ link: url, method: 'GET' });
      if (response && response.success && response.institucion) {
        setInstitucionData(response.institucion);
        if (response.institucion.ips && response.institucion.ips !== selectedIpsName) {
          setSelectedIpsName(response.institucion.ips);
        }
      } else {
        setInstitucionData(null);
      }
    } catch (e) {
      console.error('Error al cargar datos de la IPS:', e);
      setInstitucionData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListaIps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const target = !isAdmin ? userInstitucion : selectedIpsName;
    if (target) {
      fetchInstitucionData(target);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIpsName, isAdmin, userInstitucion]);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const formatearTamano = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const handleGuardarEnlaceDrive = async (e) => {
    if (e) e.preventDefault();
    if (!isAdmin) {
      alert('Solo los administradores pueden agregar enlaces de Google Drive.');
      return;
    }
    const currentId = institucionData?._id;
    const currentIps = institucionData?.ips || selectedIpsName;
    if (!currentId && !currentIps) {
      alert('Debes tener seleccionada una IPS.');
      return;
    }
    if (!driveTitulo.trim()) {
      alert('Por favor ingresa un título o nombre para la carpeta o enlace de Google Drive.');
      return;
    }
    if (!driveUrl.trim()) {
      alert('Por favor ingresa el enlace o URL de Google Drive.');
      return;
    }

    setGuardandoDrive(true);
    try {
      const response = await request({
        link: apiAddEnlaceDriveIps,
        method: 'POST',
        body: {
          id: currentId,
          ips: currentIps,
          titulo: driveTitulo.trim(),
          url: driveUrl.trim(),
          descripcion: driveDescripcion.trim(),
        },
      });

      if (response && response.success) {
        alert('¡Enlace de Google Drive agregado correctamente!');
        setDriveTitulo('');
        setDriveUrl('');
        setDriveDescripcion('');
        setShowModalDrive(false);
        fetchInstitucionData(currentIps);
      } else {
        alert(response?.message || 'Error al guardar el enlace de Google Drive');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar el enlace de Google Drive.');
    } finally {
      setGuardandoDrive(false);
    }
  };

  const handleEliminarEnlaceDrive = async (enlaceId, titulo) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar enlaces de Google Drive.');
      return;
    }
    const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar el enlace "${titulo || 'de Google Drive'}"?`);
    if (!confirmacion) return;

    try {
      const response = await request({
        link: apiDeleteEnlaceDriveIps,
        method: 'POST',
        body: {
          id: institucionData?._id,
          ips: institucionData?.ips || selectedIpsName,
          enlace_id: enlaceId,
        },
      });

      if (response && response.success) {
        alert('Enlace de Google Drive eliminado correctamente.');
        fetchInstitucionData(institucionData?.ips || selectedIpsName);
      } else {
        alert(response?.message || 'Error al eliminar enlace de Drive');
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor.');
    }
  };

  const handleCopiarEnlace = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2500);
    }).catch(() => {
      alert('No se pudo copiar el enlace al portapapeles.');
    });
  };

  const planMtto = institucionData?.plan_mantenimiento;
  const planCap = institucionData?.plan_capacitacion;
  const protocolos = institucionData?.protocolos;
  const adicionales = Array.isArray(institucionData?.documentos_adicionales)
    ? institucionData.documentos_adicionales
    : [];
  const enlacesDrive = Array.isArray(institucionData?.enlaces_drive)
    ? institucionData.enlaces_drive
    : [];

  const totalDocs =
    (planMtto ? 1 : 0) +
    (planCap ? 1 : 0) +
    (protocolos ? 1 : 0) +
    adicionales.length +
    enlacesDrive.length;

  return (
    <div className="contenedor" style={{ maxWidth: '1050px', margin: '0 auto', padding: '20px 15px' }}>
      <main>
        {/* Cabecera Principal */}
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '14px',
            padding: '22px 26px',
            border: '1.5px solid #334155',
            marginBottom: '24px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1.5px solid #38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FaHospital size={26} color="#38bdf8" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '21px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaFolderOpen color="#38bdf8" /> Documentación Institucional y Planes
                </h2>
                <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', marginTop: '4px' }}>
                  {institucionData?.ips || selectedIpsName || 'Institución Prestadora de Salud'}
                </div>
                {institucionData && (
                  <div style={{ color: '#94a3b8', fontSize: '12.5px', marginTop: '2px' }}>
                    {institucionData.nit ? `NIT: ${institucionData.nit} • ` : ''}
                    {institucionData.ciudad ? `Ciudad: ${institucionData.ciudad}` : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones y selector (para Admin) */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {isAdmin && listaIps.length > 0 && (
                <div style={{ minWidth: '220px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>
                    Seleccionar Sede / IPS:
                  </label>
                  <select
                    value={selectedIpsName}
                    onChange={(e) => setSelectedIpsName(e.target.value)}
                    className="input-report"
                    style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
                  >
                    {listaIps.map((i) => (
                      <option key={i._id || i.ips} value={i.ips}>
                        {i.ips}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isAdmin && institucionData && (
                <button
                  type="button"
                  onClick={() => setShowModalDrive(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: '1px solid #10b981',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    alignSelf: 'flex-end',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  }}
                  title="Vincular nueva carpeta o enlace de Google Drive"
                >
                  <FaGoogleDrive size={15} /> + Agregar Enlace Drive
                </button>
              )}

              {isAdmin && institucionData && (
                <Link
                  to={`/editarips?id=${institucionData._id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: '1px solid #38bdf8',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    textDecoration: 'none',
                    alignSelf: 'flex-end',
                  }}
                >
                  <FaEdit size={13} /> Administrar Documentos
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Contenido de Documentos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#38bdf8' }}>
            <FaSpinner className="spin" size={28} style={{ marginBottom: '10px' }} />
            <div>Cargando documentación institucional...</div>
          </div>
        ) : !institucionData ? (
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              border: '1px solid #334155',
            }}
          >
            <FaHospital size={44} color="#64748b" style={{ marginBottom: '14px' }} />
            <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>
              Institución No Seleccionada o Sin Registro
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13.5px', maxWidth: '480px', margin: '0 auto' }}>
              No se ha encontrado información documental para la institución indicada. Contacta al administrador técnico.
            </p>
          </div>
        ) : (
          <div>
            {/* Resumen de Documentación */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                color: '#94a3b8',
                fontSize: '13px',
              }}
            >
              <div>
                Documentos disponibles en el repositorio:{' '}
                <strong style={{ color: '#38bdf8' }}>{totalDocs}</strong>
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '12px' }}>
                * Todos los documentos se encuentran digitalizados en formato PDF oficial.
              </div>
            </div>

            {/* Grid Principal: 3 Documentos Clave */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '18px',
                marginBottom: '26px',
              }}
            >
              {/* 1. Plan de Mantenimiento Preventivo */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  padding: '20px',
                  border: planMtto ? '1.5px solid #10b981' : '1.5px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FaClipboardList size={20} color="#38bdf8" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '15px', fontWeight: '800' }}>
                        Plan de Mantenimiento
                      </h4>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        Programa Preventivo Anual
                      </span>
                    </div>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '12.5px', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                    Planificación anual de inspección técnica, calibración y mantenimientos preventivos para los equipos biomédicos.
                  </p>

                  {planMtto ? (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #334155',
                      }}
                    >
                      <div style={{ color: '#38bdf8', fontSize: '12.5px', fontWeight: '700', wordBreak: 'break-all' }}>
                        📄 {planMtto.nombre_original}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
                        Actualizado: {formatearFecha(planMtto.fecha_subida)} {formatearTamano(planMtto.size)}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px dashed #475569',
                        color: '#94a3b8',
                        fontSize: '12px',
                        textAlign: 'center',
                      }}
                    >
                      Documento no adjuntado por el administrador aún.
                    </div>
                  )}
                </div>

                {planMtto && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(planMtto.nombre_archivo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                      }}
                    >
                      <FaEye size={13} /> Ver PDF
                    </a>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(planMtto.nombre_archivo)}`}
                      download={planMtto.nombre_original}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#334155',
                        color: '#f8fafc',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        border: '1px solid #475569',
                      }}
                      title="Descargar PDF"
                    >
                      <FaDownload size={13} />
                    </a>
                  </div>
                )}
              </div>

              {/* 2. Plan de Capacitación Técnica */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  padding: '20px',
                  border: planCap ? '1.5px solid #10b981' : '1.5px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FaGraduationCap size={20} color="#10b981" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '15px', fontWeight: '800' }}>
                        Plan de Capacitación
                      </h4>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        Formación Técnica & Asistencial
                      </span>
                    </div>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '12.5px', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                    Temario, cronograma y lineamientos de inducción y capacitación continua para el manejo seguro de equipos.
                  </p>

                  {planCap ? (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #334155',
                      }}
                    >
                      <div style={{ color: '#34d399', fontSize: '12.5px', fontWeight: '700', wordBreak: 'break-all' }}>
                        📄 {planCap.nombre_original}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
                        Actualizado: {formatearFecha(planCap.fecha_subida)} {formatearTamano(planCap.size)}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px dashed #475569',
                        color: '#94a3b8',
                        fontSize: '12px',
                        textAlign: 'center',
                      }}
                    >
                      Documento no adjuntado por el administrador aún.
                    </div>
                  )}
                </div>

                {planCap && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(planCap.nombre_archivo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                      }}
                    >
                      <FaEye size={13} /> Ver PDF
                    </a>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(planCap.nombre_archivo)}`}
                      download={planCap.nombre_original}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#334155',
                        color: '#f8fafc',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        border: '1px solid #475569',
                      }}
                      title="Descargar PDF"
                    >
                      <FaDownload size={13} />
                    </a>
                  </div>
                )}
              </div>

              {/* 3. Protocolos y Procedimientos */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  padding: '20px',
                  border: protocolos ? '1.5px solid #10b981' : '1.5px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FaBookMedical size={20} color="#f59e0b" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '15px', fontWeight: '800' }}>
                        Protocolos y Guías
                      </h4>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        Bioseguridad y Manejo
                      </span>
                    </div>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '12.5px', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                    Guías operativas, instructivos de desinfección, limpieza y protocolos de bioseguridad para el área médica.
                  </p>

                  {protocolos ? (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #334155',
                      }}
                    >
                      <div style={{ color: '#fbbf24', fontSize: '12.5px', fontWeight: '700', wordBreak: 'break-all' }}>
                        📄 {protocolos.nombre_original}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
                        Actualizado: {formatearFecha(protocolos.fecha_subida)} {formatearTamano(protocolos.size)}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px dashed #475569',
                        color: '#94a3b8',
                        fontSize: '12px',
                        textAlign: 'center',
                      }}
                    >
                      Documento no adjuntado por el administrador aún.
                    </div>
                  )}
                </div>

                {protocolos && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(protocolos.nombre_archivo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                      }}
                    >
                      <FaEye size={13} /> Ver PDF
                    </a>
                    <a
                      href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(protocolos.nombre_archivo)}`}
                      download={protocolos.nombre_original}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: '#334155',
                        color: '#f8fafc',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        textDecoration: 'none',
                        border: '1px solid #475569',
                      }}
                      title="Descargar PDF"
                    >
                      <FaDownload size={13} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Sección 4: Documentación Adicional y Habilitación */}
            <div
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                padding: '22px',
                border: '1.5px solid #334155',
              }}
            >
              <h3 style={{ margin: '0 0 14px 0', color: '#38bdf8', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCertificate color="#f59e0b" /> Documentos Adicionales, Habilitación y Certificados
              </h3>

              {adicionales.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                  No se han registrado documentos complementarios para esta institución.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                  {adicionales.map((doc, idx) => (
                    <div
                      key={doc._id || idx}
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        border: '1px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ paddingRight: '10px' }}>
                        <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaFilePdf color="#ef4444" size={14} /> {doc.titulo || doc.nombre_original}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '3px' }}>
                          {doc.categoria || 'General'} • {formatearFecha(doc.fecha_subida)} {formatearTamano(doc.size)}
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
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FaEye size={12} /> Ver
                        </a>
                        <a
                          href={`${apiVerDocIps}?nombre_archivo=${encodeURIComponent(doc.nombre_archivo)}`}
                          download={doc.nombre_original}
                          style={{
                            backgroundColor: '#334155',
                            color: '#f8fafc',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Descargar"
                        >
                          <FaDownload size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sección 5: Carpetas y Enlaces de Google Drive */}
            <div
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                padding: '22px',
                border: '1.5px solid #334155',
                marginTop: '24px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: '#38bdf8',
                      fontSize: '16px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FaGoogleDrive color="#10b981" size={20} /> Carpetas y Enlaces de Google Drive
                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.18)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {enlacesDrive.length}
                    </span>
                  </h3>
                  <div style={{ color: '#94a3b8', fontSize: '12.5px', marginTop: '4px' }}>
                    Acceso directo a carpetas en la nube con manuales de servicio, carpetas compartidas y documentación en Google Drive.
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowModalDrive(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: '1px solid #10b981',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
                    }}
                  >
                    <FaPlus size={11} /> Agregar Enlace de Drive
                  </button>
                )}
              </div>

              {enlacesDrive.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    border: '1.5px dashed #475569',
                    padding: '28px 20px',
                    textAlign: 'center',
                    color: '#94a3b8',
                  }}
                >
                  <FaGoogleDrive size={36} color="#64748b" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1' }}>
                    No se han registrado carpetas ni enlaces de Google Drive
                  </div>
                  <p style={{ fontSize: '12.5px', margin: '4px auto 14px auto', maxWidth: '420px', color: '#94a3b8' }}>
                    Puedes vincular carpetas compartidas con manuales, fotos o certificados almacenados en la nube.
                  </p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowModalDrive(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      <FaPlus size={11} /> Vincular Primera Carpeta
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {enlacesDrive.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        padding: '16px',
                        border: '1.5px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div>
                        {/* Header de la tarjeta */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FaGoogleDrive size={18} color="#34d399" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                color: '#f8fafc',
                                fontWeight: '800',
                                fontSize: '14px',
                                lineHeight: '1.3',
                                wordBreak: 'break-word',
                              }}
                            >
                              {item.titulo}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Agregado: {formatearFecha(item.fecha_agregado)}
                            </div>
                          </div>
                        </div>

                        {/* Descripción opcional */}
                        {item.descripcion && (
                          <p
                            style={{
                              color: '#cbd5e1',
                              fontSize: '12px',
                              margin: '0 0 10px 0',
                              lineHeight: '1.4',
                            }}
                          >
                            {item.descripcion}
                          </p>
                        )}

                        {/* URL recortada */}
                        <div
                          style={{
                            backgroundColor: '#1e293b',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            color: '#38bdf8',
                            fontSize: '11px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '14px',
                            border: '1px solid #334155',
                          }}
                          title={item.url}
                        >
                          🔗 {item.url}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontWeight: '800',
                            fontSize: '12px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                          }}
                        >
                          <FaExternalLinkAlt size={11} /> Abrir en Drive
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopiarEnlace(item.url, item._id || idx)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#334155',
                            color: copiadoId === (item._id || idx) ? '#34d399' : '#f8fafc',
                            border: '1px solid #475569',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          title="Copiar enlace al portapapeles"
                        >
                          {copiadoId === (item._id || idx) ? (
                            <>
                              <FaCheck size={11} color="#34d399" /> Copiado
                            </>
                          ) : (
                            <>
                              <FaCopy size={11} /> Copiar
                            </>
                          )}
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleEliminarEnlaceDrive(item._id, item.titulo)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Eliminar este enlace de Drive"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Agregar Enlace de Google Drive */}
        {isAdmin && showModalDrive && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !guardandoDrive) {
                setShowModalDrive(false);
              }
            }}
          >
            <div
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '14px',
                border: '1.5px solid #38bdf8',
                padding: '24px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  borderBottom: '1px solid #334155',
                  paddingBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #10b981',
                    }}
                  >
                    <FaGoogleDrive size={20} color="#34d399" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: '800' }}>
                      Agregar Enlace de Google Drive
                    </h3>
                    <div style={{ fontSize: '11.5px', color: '#38bdf8' }}>
                      {institucionData?.ips || selectedIpsName}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !guardandoDrive && setShowModalDrive(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <form onSubmit={handleGuardarEnlaceDrive}>
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#38bdf8',
                      marginBottom: '6px',
                    }}
                  >
                    NOMBRE O TÍTULO DEL ENLACE / CARPETA *:
                  </label>
                  <input
                    type="text"
                    value={driveTitulo}
                    onChange={(e) => setDriveTitulo(e.target.value)}
                    placeholder="Ej. Carpeta General de Manuales y Guías Técnicas"
                    className="input-report"
                    style={{ width: '100%', fontSize: '13px' }}
                    required
                    disabled={guardandoDrive}
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#38bdf8',
                      marginBottom: '6px',
                    }}
                  >
                    ENLACE O URL DE GOOGLE DRIVE *:
                  </label>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="input-report"
                    style={{ width: '100%', fontSize: '13px' }}
                    required
                    disabled={guardandoDrive}
                  />
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    Pega el enlace de la carpeta compartida o archivo de Google Drive. Asegúrate de que tenga permisos de lectura.
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#94a3b8',
                      marginBottom: '6px',
                    }}
                  >
                    DESCRIPCIÓN O NOTAS ADICIONALES (OPCIONAL):
                  </label>
                  <textarea
                    value={driveDescripcion}
                    onChange={(e) => setDriveDescripcion(e.target.value)}
                    placeholder="Breve descripción del contenido de la carpeta en la nube..."
                    className="input-report"
                    rows={3}
                    style={{ width: '100%', fontSize: '13px', resize: 'vertical' }}
                    disabled={guardandoDrive}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModalDrive(false)}
                    disabled={guardandoDrive}
                    style={{
                      backgroundColor: '#334155',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: guardandoDrive ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={guardandoDrive}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: '1px solid #10b981',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: guardandoDrive ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {guardandoDrive ? (
                      <>
                        <FaSpinner className="spin" size={13} /> Guardando...
                      </>
                    ) : (
                      <>
                        <FaGoogleDrive size={14} /> Guardar Enlace Drive
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DocumentosIps;
