import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiIps, apiGetIps, apiVerDocIps } from '../utils/api';
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

  const planMtto = institucionData?.plan_mantenimiento;
  const planCap = institucionData?.plan_capacitacion;
  const protocolos = institucionData?.protocolos;
  const adicionales = Array.isArray(institucionData?.documentos_adicionales)
    ? institucionData.documentos_adicionales
    : [];

  const totalDocs =
    (planMtto ? 1 : 0) + (planCap ? 1 : 0) + (protocolos ? 1 : 0) + adicionales.length;

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
              {institucionData?.logo && (
                <img
                  src={
                    Array.isArray(institucionData.logo)
                      ? institucionData.logo[0]?.data_url || institucionData.logo[0]
                      : institucionData.logo?.data_url || institucionData.logo
                  }
                  alt="Logo IPS"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '4px',
                    border: '1.5px solid #38bdf8',
                  }}
                />
              )}
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
          </div>
        )}
      </main>
    </div>
  );
}

export default DocumentosIps;
