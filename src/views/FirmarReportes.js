import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiReportes, apiFirmarReportes, apiIps } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import Pagination from '../components/Pagination';
import {
  FaFileSignature,
  FaEraser,
  FaCheckCircle,
  FaFilter,
  FaSync,
  FaTimes,
  FaArrowLeft,
  FaCheckDouble,
} from 'react-icons/fa';
import { GoSearch } from 'react-icons/go';

const normalizeText = (str) =>
  String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const matchesInstitucion = (eqInst, targetInst) => {
  if (!eqInst || !targetInst) return false;
  const n1 = normalizeText(eqInst);
  const n2 = normalizeText(targetInst);
  if (!n1 || !n2) return false;
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
};

function SignaturePadBox({ canvasRef, borderColor = '#0284c7' }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 350, height: 140 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth || 350;
        setDimensions({ width: w, height: 140 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: `2px dashed ${borderColor}`,
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      <SignatureCanvas
        ref={canvasRef}
        penColor="#000000"
        canvasProps={{
          width: dimensions.width,
          height: dimensions.height,
          style: {
            display: 'block',
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            touchAction: 'none',
            cursor: 'crosshair',
            backgroundColor: '#ffffff',
          },
        }}
        maxWidth={2.2}
        minWidth={0.8}
      />
    </div>
  );
}

function FirmarReportes() {
  const navigate = useNavigate();
  const reduxUser = useSelector((state) => state.user);
  const isNonAdmin = Boolean(reduxUser && reduxUser.rol !== 'admin');
  const userInstitucion = (reduxUser?.institucion || '').trim();

  const [reportes, setReportes] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [selectedIps, setSelectedIps] = useState('');
  const [selectedServicio, setSelectedServicio] = useState('');
  const [filtroEstadoFirma, setFiltroEstadoFirma] = useState('TODOS');
  const [reporteFirma, setReporteFirma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncingFull, setIsSyncingFull] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const firmaIngRef = useRef(null);
  const firmaRecref = useRef(null);

  // Pagination & Search
  const [buscar, setBuscar] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const [reporte, setReporte] = useState({
    nombre_ingeniero: storedUser?.name || '',
    cargo_ingeniero: 'INGENIERO BIOMÉDICO',
    nombre_recibe: '',
    cargo_recibe: '',
  });

  const fetchIps = async () => {
    if (isNonAdmin && userInstitucion) {
      setListaIps([{ ips: userInstitucion, nombre: userInstitucion, institucion: userInstitucion }]);
      return;
    }
    try {
      const response = await request({
        link: apiIps,
        method: 'GET',
      });
      if (response && response.success && response.ips) {
        setListaIps(response.ips);
      }
    } catch (e) {
      console.error('Error al obtener lista de IPS:', e);
    }
  };

  const getReportes = async () => {
    setLoading(true);
    try {
      // 1. Carga rápida inicial de los primeros 100 reportes para interacción inmediata
      const responseInit = await request({
        link: `${apiReportes}?limit=100`,
        method: 'GET',
      });
      if (responseInit && responseInit.success && responseInit.reporte) {
        setReportes(responseInit.reporte);
        setLoading(false);
      }

      // 2. Carga en segundo plano de TODOS los reportes sin límite
      setIsSyncingFull(true);
      const responseFull = await request({
        link: apiReportes,
        method: 'GET',
      });
      if (responseFull && responseFull.success && responseFull.reporte) {
        setReportes(responseFull.reporte);
      }
    } catch (e) {
      console.error('Error al cargar reportes:', e);
    } finally {
      setLoading(false);
      setIsSyncingFull(false);
    }
  };

  useEffect(() => {
    getReportes();
    fetchIps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNonAdmin && userInstitucion) {
      setSelectedIps(userInstitucion);
    }
  }, [isNonAdmin, userInstitucion]);

  // Lista única y ordenada de IPS disponibles (desde colección IPS + valores presentes en los reportes)
  const ipsDisponibles = useMemo(() => {
    if (isNonAdmin && userInstitucion) {
      return [userInstitucion];
    }
    const set = new Set();
    listaIps.forEach((item) => {
      const val = typeof item === 'string' ? item : item.ips || item.nombre || item.institucion;
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    });
    reportes.forEach((rep) => {
      if (rep.institucion && typeof rep.institucion === 'string' && rep.institucion.trim()) {
        set.add(rep.institucion.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [listaIps, reportes, isNonAdmin, userInstitucion]);

  // Lista única de Servicios disponibles según la IPS seleccionada
  const serviciosDisponibles = useMemo(() => {
    const set = new Set();
    const targetIps = isNonAdmin ? userInstitucion : selectedIps;
    reportes.forEach((rep) => {
      if (targetIps && !matchesInstitucion(rep.institucion, targetIps)) {
        return;
      }
      if (rep.servicio && typeof rep.servicio === 'string' && rep.servicio.trim()) {
        set.add(rep.servicio.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reportes, selectedIps, isNonAdmin, userInstitucion]);

  const handleCheckboxChange = (id) => {
    setReporteFirma((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSave = (e) => {
    setReporte((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const Firmar = async () => {
    if (reporteFirma.length === 0) {
      alert('Por favor seleccione al menos un reporte de la tabla');
      return;
    }
    if (!reporte.nombre_ingeniero.trim() && !reporte.nombre_recibe.trim()) {
      alert('Por favor ingrese al menos el nombre del ingeniero o de quien recibe');
      return;
    }

    const firmaIngData =
      firmaIngRef.current && !firmaIngRef.current.isEmpty()
        ? firmaIngRef.current.toData()
        : null;

    const firmaRecData =
      firmaRecref.current && !firmaRecref.current.isEmpty()
        ? firmaRecref.current.toData()
        : null;

    setSubmitting(true);
    const body = {
      _id: reporteFirma,
      firma_ingeniero: firmaIngData,
      nombre_ingeniero: reporte.nombre_ingeniero,
      cargo_ingeniero: reporte.cargo_ingeniero,
      firma_recibe: firmaRecData,
      nombre_recibe: reporte.nombre_recibe,
      cargo_recibe: reporte.cargo_recibe,
    };

    try {
      const response = await request({
        link: apiFirmarReportes,
        body,
        method: 'POST',
      });
      if (response && response.success) {
        alert(`¡${reporteFirma.length} reporte(s) firmados exitosamente!`);
        navigate('/reportes');
      } else {
        alert(`${response?.message || 'Error al firmar reportes'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al firmar reportes');
    } finally {
      setSubmitting(false);
    }
  };

  // Reportes filtrados según Institución, Servicio, Estado de Firma y Búsqueda de texto
  const filteredReportes = useMemo(() => {
    const targetIps = isNonAdmin ? userInstitucion : selectedIps;
    const q = buscar.trim().toLowerCase();

    return reportes.filter((dato) => {
      // 1. Filtro por Institución / IPS
      if (targetIps && !matchesInstitucion(dato.institucion, targetIps)) {
        return false;
      }

      // 2. Filtro por Servicio
      if (
        selectedServicio &&
        String(dato.servicio || '').trim().toLowerCase() !== selectedServicio.trim().toLowerCase()
      ) {
        return false;
      }

      // 3. Filtro por Estado de Firma
      const hasIng = Boolean(dato.nombre_ingeniero && String(dato.nombre_ingeniero).trim());
      const hasRec = Boolean(dato.nombre_recibe && String(dato.nombre_recibe).trim());
      if (filtroEstadoFirma === 'PENDIENTES') {
        if (hasIng && hasRec) return false;
      } else if (filtroEstadoFirma === 'SIN_INGENIERO') {
        if (hasIng) return false;
      } else if (filtroEstadoFirma === 'SIN_RECIBE') {
        if (hasRec) return false;
      } else if (filtroEstadoFirma === 'SIN_NINGUNA') {
        if (hasIng || hasRec) return false;
      } else if (filtroEstadoFirma === 'FIRMADOS') {
        if (!hasIng || !hasRec) return false;
      }

      // 4. Búsqueda por texto libre
      if (q) {
        const match =
          (dato.numero_reporte && String(dato.numero_reporte).toLowerCase().includes(q)) ||
          (dato.serie && String(dato.serie).toLowerCase().includes(q)) ||
          (dato.institucion && String(dato.institucion).toLowerCase().includes(q)) ||
          (dato.servicio && String(dato.servicio).toLowerCase().includes(q)) ||
          (dato.equipo && String(dato.equipo).toLowerCase().includes(q)) ||
          (dato.marca && String(dato.marca).toLowerCase().includes(q)) ||
          (dato.modelo && String(dato.modelo).toLowerCase().includes(q)) ||
          (dato.nombre_ingeniero && String(dato.nombre_ingeniero).toLowerCase().includes(q)) ||
          (dato.nombre_recibe && String(dato.nombre_recibe).toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [reportes, selectedIps, selectedServicio, filtroEstadoFirma, buscar, isNonAdmin, userInstitucion]);

  // Selección masiva de reportes filtrados
  const filteredIds = useMemo(() => filteredReportes.map((r) => r._id), [filteredReportes]);
  const isAllFilteredSelected = useMemo(
    () => filteredIds.length > 0 && filteredIds.every((id) => reporteFirma.includes(id)),
    [filteredIds, reporteFirma]
  );

  const handleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setReporteFirma((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setReporteFirma((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearSelection = () => {
    setReporteFirma([]);
  };

  const handleResetFilters = () => {
    if (!isNonAdmin) setSelectedIps('');
    setSelectedServicio('');
    setFiltroEstadoFirma('TODOS');
    setBuscar('');
    setCurrentPage(1);
  };

  // Paginated reports
  const paginatedReportes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReportes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReportes, currentPage, itemsPerPage]);

  const renderBadgeFirma = (rep) => {
    const hasIng = Boolean(rep.nombre_ingeniero && String(rep.nombre_ingeniero).trim());
    const hasRec = Boolean(rep.nombre_recibe && String(rep.nombre_recibe).trim());

    if (hasIng && hasRec) {
      return (
        <span
          style={{
            backgroundColor: '#065f46',
            color: '#a7f3d0',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <FaCheckCircle size={10} /> Firmado Completo
        </span>
      );
    }
    if (hasIng && !hasRec) {
      return (
        <span
          style={{
            backgroundColor: '#854d0e',
            color: '#fef08a',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
          }}
        >
          Falta Recibido
        </span>
      );
    }
    if (!hasIng && hasRec) {
      return (
        <span
          style={{
            backgroundColor: '#854d0e',
            color: '#fef08a',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
          }}
        >
          Falta Ingeniero
        </span>
      );
    }
    return (
      <span
        style={{
          backgroundColor: '#7f1d1d',
          color: '#fca5a5',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700',
        }}
      >
        Sin Firmas
      </span>
    );
  };

  return (
    <div className="contenedor" style={{ maxWidth: '1300px' }}>
      <main>
        {/* Header Title & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to="/reportes"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <FaArrowLeft size={12} /> Volver a Reportes
              </Link>
            </div>
            <h2
              style={{
                margin: '10px 0 0 0',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <FaFileSignature color="#38bdf8" /> Firma Masiva de Reportes
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Filtre por Institución y Servicio, seleccione múltiples reportes y aplique firmas digitales de manera ágil.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isSyncingFull && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #0284c7',
                  color: '#38bdf8',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                <FaSync className="spin" size={12} /> Cargando historial completo ({reportes.length})...
              </span>
            )}
            <button
              onClick={() => getReportes()}
              disabled={loading || isSyncingFull}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: loading || isSyncingFull ? 'not-allowed' : 'pointer',
              }}
              title="Recargar todos los reportes desde la base de datos"
            >
              <FaSync size={12} /> Actualizar
            </button>
          </div>
        </div>

        {/* 2-Column Signature Panels Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            backgroundColor: '#1e293b',
            padding: '24px',
            borderRadius: '12px',
            border: '1.5px solid #334155',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            marginBottom: '24px',
          }}
        >
          {/* Panel 1: Ingeniero / Técnico */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1.5px solid #38bdf8',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#38bdf8',
                borderBottom: '1px solid #334155',
                paddingBottom: '8px',
              }}
            >
              👤 INGENIERO / TÉCNICO RESPONSABLE
            </div>

            {/* Signature Pad */}
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                DIBUJE SU FIRMA AQUÍ:
              </label>
              <SignaturePadBox canvasRef={firmaIngRef} borderColor="#0284c7" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-limpiar-firma"
                  onClick={() => firmaIngRef.current?.clear()}
                >
                  <FaEraser /> Limpiar Firma
                </button>
              </div>
            </div>

            {/* Nombre Input */}
            <div className="campo-firma-box">
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                NOMBRE DEL INGENIERO:
              </label>
              <input
                className="campo-firma-input"
                name="nombre_ingeniero"
                type="text"
                placeholder="Ej. Ing. Carlos Pérez"
                value={reporte.nombre_ingeniero}
                onChange={handleSave}
              />
            </div>

            {/* Cargo Input */}
            <div className="campo-firma-box">
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                CARGO:
              </label>
              <input
                className="campo-firma-input"
                name="cargo_ingeniero"
                type="text"
                placeholder="Ej. Ingeniero Biomédico"
                value={reporte.cargo_ingeniero}
                onChange={handleSave}
              />
            </div>
          </div>

          {/* Panel 2: Recibí a Satisfacción */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1.5px solid #10b981',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#86efac',
                borderBottom: '1px solid #334155',
                paddingBottom: '8px',
              }}
            >
              ✍️ RECIBÍ A CONFORMIDAD (CLIENTE / IPS)
            </div>

            {/* Signature Pad */}
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                DIBUJE SU FIRMA AQUÍ:
              </label>
              <SignaturePadBox canvasRef={firmaRecref} borderColor="#10b981" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-limpiar-firma"
                  onClick={() => firmaRecref.current?.clear()}
                >
                  <FaEraser /> Limpiar Firma
                </button>
              </div>
            </div>

            {/* Nombre Input */}
            <div className="campo-firma-box">
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#86efac' }}>
                NOMBRE DE QUIEN RECIBE:
              </label>
              <input
                className="campo-firma-input"
                name="nombre_recibe"
                type="text"
                placeholder="Ej. Dra. María González"
                value={reporte.nombre_recibe}
                onChange={handleSave}
              />
            </div>

            {/* Cargo Input */}
            <div className="campo-firma-box">
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#86efac' }}>
                CARGO:
              </label>
              <input
                className="campo-firma-input"
                name="cargo_recibe"
                type="text"
                placeholder="Ej. Jefe de Área / Coordinador"
                value={reporte.cargo_recibe}
                onChange={handleSave}
              />
            </div>
          </div>
        </div>

        {/* Action Button: Firmar Seleccionados */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '600' }}>
            Reportes seleccionados para firmar:{' '}
            <strong style={{ color: '#38bdf8', fontSize: '20px' }}>{reporteFirma.length}</strong>
          </div>
          <button
            onClick={Firmar}
            disabled={submitting || reporteFirma.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: reporteFirma.length > 0 ? '#0284c7' : '#334155',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '15px',
              border: reporteFirma.length > 0 ? '1px solid #38bdf8' : '1px solid #475569',
              cursor: reporteFirma.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: reporteFirma.length > 0 ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <FaCheckCircle size={16} /> {submitting ? 'Firmando reportes...' : 'Firmar Reportes Seleccionados'}
          </button>
        </div>

        {/* ==========================================================
            BARRA DE FILTROS POR INSTITUCIÓN, SERVICIO Y ESTADO
            ========================================================== */}
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FaFilter /> Filtrar Reportes por Institución y Servicio:
            </div>
            {((!isNonAdmin && selectedIps) || selectedServicio || filtroEstadoFirma !== 'TODOS' || buscar) && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FaTimes size={10} /> Restablecer Filtros
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            {/* 1. Desplegable Institución / IPS */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  marginBottom: '6px',
                }}
              >
                Institución / IPS:
              </label>
              <select
                value={selectedIps}
                disabled={isNonAdmin && Boolean(userInstitucion)}
                onChange={(e) => {
                  setSelectedIps(e.target.value);
                  setSelectedServicio('');
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ padding: '9px 12px', fontSize: '13px', width: '100%' }}
              >
                {!isNonAdmin && <option value="">-- Todas las Instituciones / IPS --</option>}
                {ipsDisponibles.map((nombreIps) => (
                  <option key={nombreIps} value={nombreIps}>
                    {nombreIps}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Desplegable Servicio / Área */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  marginBottom: '6px',
                }}
              >
                Servicio / Área:
              </label>
              <select
                value={selectedServicio}
                onChange={(e) => {
                  setSelectedServicio(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ padding: '9px 12px', fontSize: '13px', width: '100%' }}
              >
                <option value="">-- Todos los Servicios --</option>
                {serviciosDisponibles.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Desplegable Estado de Firma */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  marginBottom: '6px',
                }}
              >
                Estado de Firma:
              </label>
              <select
                value={filtroEstadoFirma}
                onChange={(e) => {
                  setFiltroEstadoFirma(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ padding: '9px 12px', fontSize: '13px', width: '100%' }}
              >
                <option value="TODOS">-- Todos los Estados --</option>
                <option value="PENDIENTES">Solo Pendientes (Falta Ing. o Recibe)</option>
                <option value="SIN_NINGUNA">Sin Ninguna Firma</option>
                <option value="SIN_INGENIERO">Falta Firma de Ingeniero</option>
                <option value="SIN_RECIBE">Falta Firma de Recibido</option>
                <option value="FIRMADOS">Completamente Firmados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search & Selection Controls Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por Nº reporte, serie, equipo, modelo, responsable..."
              onChange={(e) => {
                setBuscar(e.target.value);
                setCurrentPage(1);
              }}
            />
            <GoSearch
              size={18}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#38bdf8',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              disabled={filteredReportes.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isAllFilteredSelected ? '#0369a1' : '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: filteredReportes.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <FaCheckDouble size={12} color="#38bdf8" />
              {isAllFilteredSelected
                ? 'Deseleccionar Filtrados'
                : `Seleccionar Filtrados (${filteredReportes.length})`}
            </button>

            {reporteFirma.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Limpiar Selección ({reporteFirma.length})
              </button>
            )}
          </div>
        </div>

        {/* Table of Reports to Sign */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '16px' }}>
            Cargando reportes para firmar...
          </div>
        ) : (
          <div>
            <div className="table-responsive-card">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '60px' }}>
                      <input
                        type="checkbox"
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                        onChange={handleSelectAllFiltered}
                        checked={isAllFilteredSelected}
                      />
                    </th>
                    <th>Nº REPORTE</th>
                    <th>FECHA</th>
                    <th>EQUIPO</th>
                    <th>SERIE</th>
                    <th>INSTITUCIÓN</th>
                    <th>SERVICIO</th>
                    <th>INGENIERO</th>
                    <th>RECIBE</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportes.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron reportes con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedReportes.map(function (item) {
                      const isSelected = reporteFirma.includes(item._id);
                      return (
                        <tr
                          key={item._id}
                          onClick={() => handleCheckboxChange(item._id)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'inherit',
                          }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(item._id)}
                              style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <strong style={{ color: '#38bdf8' }}>#{item?.numero_reporte}</strong>
                          </td>
                          <td style={{ color: '#cbd5e1' }}>{item?.fecha}</td>
                          <td>
                            <strong style={{ color: '#f8fafc' }}>{item?.equipo}</strong>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td style={{ color: '#e2e8f0' }}>{item?.institucion}</td>
                          <td style={{ color: '#cbd5e1' }}>{item?.servicio}</td>
                          <td style={{ color: '#cbd5e1' }}>
                            {item?.nombre_ingeniero || <span style={{ color: '#fca5a5' }}>Sin firma</span>}
                          </td>
                          <td style={{ color: '#cbd5e1' }}>
                            {item?.nombre_recibe || <span style={{ color: '#fca5a5' }}>Sin firma</span>}
                          </td>
                          <td>{renderBadgeFirma(item)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              totalItems={filteredReportes.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(size) => setItemsPerPage(size)}
              pageSizeOptions={[15, 25, 50, 100]}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default FirmarReportes;
