import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiReportes, apiFirmarReportes } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import Pagination from '../components/Pagination';
import { FaFileSignature, FaEraser, FaCheckCircle } from 'react-icons/fa';
import { GoSearch } from 'react-icons/go';

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
  const [reportes, setReportes] = useState([]);
  const [reporteFirma, setReporteFirma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const firmaIngRef = useRef(null);
  const firmaRecref = useRef(null);

  // Pagination & Search
  const [buscar, setBuscar] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [reporte, setReporte] = useState({
    nombre_ingeniero: '',
    cargo_ingeniero: 'INGENIERO BIOMÉDICO',
    nombre_recibe: '',
    cargo_recibe: '',
  });

  const getReportes = async () => {
    setLoading(true);
    try {
      const response = await request({
        link: `${apiReportes}?limit=200`,
        method: 'GET',
      });
      if (response && response.success) {
        setReportes(response.reporte || []);
      }
    } catch (e) {
      console.error(e);
      alert('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReportes();
  }, []);

  const handleCheckboxChange = (id) => {
    setReporteFirma((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredReportes.map((r) => r._id);
      setReporteFirma(allIds);
    } else {
      setReporteFirma([]);
    }
  };

  const handleSave = (e) => {
    setReporte((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const Firmar = async () => {
    if (reporteFirma.length === 0) {
      alert('Por favor seleccione al menos un reporte de la tabla');
      return;
    }
    if (!reporte.nombre_ingeniero.trim()) {
      alert('Por favor ingrese el nombre del ingeniero');
      return;
    }

    const firmaIngData = firmaIngRef.current && !firmaIngRef.current.isEmpty()
      ? firmaIngRef.current.toData()
      : null;

    const firmaRecData = firmaRecref.current && !firmaRecref.current.isEmpty()
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
        window.location.href = './reportes';
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

  // Filtered reports
  const filteredReportes = useMemo(() => {
    if (!buscar.trim()) return reportes;
    const q = buscar.toLowerCase();
    return reportes.filter(
      (dato) =>
        (dato.numero_reporte && String(dato.numero_reporte).toLowerCase().includes(q)) ||
        (dato.serie && dato.serie.toLowerCase().includes(q)) ||
        (dato.institucion && dato.institucion.toLowerCase().includes(q)) ||
        (dato.servicio && dato.servicio.toLowerCase().includes(q)) ||
        (dato.equipo && dato.equipo.toLowerCase().includes(q)),
    );
  }, [reportes, buscar]);

  // Paginated reports
  const paginatedReportes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReportes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReportes, currentPage, itemsPerPage]);

  return (
    <div className="contenedor" style={{ maxWidth: '1300px' }}>
      <main>
        {/* Header Title */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaFileSignature color="#38bdf8" /> Panel de Firma Digital de Reportes
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Firma fluida y de respuesta inmediata tanto en pantallas táctiles como con mouse.
          </p>
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
            marginBottom: '28px',
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
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#38bdf8', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              👤 INGENIERO / TÉCNICO RESPONSABLE
            </div>

            {/* Signature Pad: Responsive and Lag-Free */}
            <div>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                DIBUJE SU FIRMA AQUÍ (RESPUESTA INSTANTÁNEA):
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
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#86efac', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              ✍️ RECIBÍ A CONFORMIDAD (CLIENTE / IPS)
            </div>

            {/* Signature Pad: Responsive and Lag-Free */}
            <div>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                DIBUJE SU FIRMA AQUÍ (RESPUESTA INSTANTÁNEA):
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '600' }}>
            Reportes seleccionados para firmar:{' '}
            <strong style={{ color: '#38bdf8', fontSize: '18px' }}>{reporteFirma.length}</strong>
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

        {/* Search & Filter Toolbar */}
        <div className="div-buscar">
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar reporte por serie, número, equipo o IPS..."
              onChange={(e) => {
                setBuscar(e.target.value);
                setCurrentPage(1);
              }}
            />
            <GoSearch
              size={20}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#38bdf8',
              }}
            />
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
                    <th style={{ textAlign: 'center', width: '80px' }}>
                      <input
                        type="checkbox"
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                        onChange={handleSelectAll}
                        checked={filteredReportes.length > 0 && reporteFirma.length === filteredReportes.length}
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
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportes.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron reportes.
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
                          <td><strong style={{ color: '#f8fafc' }}>{item?.equipo}</strong></td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td style={{ color: '#e2e8f0' }}>{item?.institucion}</td>
                          <td style={{ color: '#cbd5e1' }}>{item?.servicio}</td>
                          <td style={{ color: '#cbd5e1' }}>{item?.nombre_ingeniero || <span style={{ color: '#fca5a5' }}>Sin firma</span>}</td>
                          <td style={{ color: '#cbd5e1' }}>{item?.nombre_recibe || <span style={{ color: '#fca5a5' }}>Sin firma</span>}</td>
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
