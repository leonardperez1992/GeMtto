import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiReportes } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import {
  FaFileSignature,
  FaFileInvoice,
  FaSync,
  FaPlus,
  FaChartPie,
  FaCheckCircle,
  FaTools,
  FaWrench,
} from 'react-icons/fa';
import { GoSearch, GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

function Reportes() {
  const [reportes, setReportes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncingFull, setIsSyncingFull] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const getReportes = async () => {
    setLoading(true);
    try {
      // 1. Carga rápida de los 100 más recientes
      const responseInit = await request({
        link: `${apiReportes}?limit=100`,
        method: 'GET',
      });

      if (responseInit && responseInit.success && responseInit.reporte) {
        setReportes(responseInit.reporte);
        setLoading(false);
      }

      // 2. Carga en segundo plano del historial completo sin bloquear la UI
      setIsSyncingFull(true);
      const responseFull = await request({
        link: apiReportes,
        method: 'GET',
      });

      if (responseFull && responseFull.success && responseFull.reporte) {
        setReportes(responseFull.reporte);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    } finally {
      setLoading(false);
      setIsSyncingFull(false);
    }
  };

  useEffect(() => {
    getReportes();
  }, []);

  const handleSave = (e) => {
    setBuscar(e.target.value);
    setCurrentPage(1);
  };

  // Filtered and sorted reportes
  const filteredReportes = useMemo(() => {
    let result = reportes;
    if (buscar.trim() !== '') {
      const q = buscar.toLowerCase();
      result = reportes.filter(
        (dato) =>
          (dato.numero_reporte && String(dato.numero_reporte).toLowerCase().includes(q)) ||
          (dato.serie && dato.serie.toLowerCase().includes(q)) ||
          (dato.institucion && dato.institucion.toLowerCase().includes(q)) ||
          (dato.servicio && dato.servicio.toLowerCase().includes(q)) ||
          (dato.equipo && dato.equipo.toLowerCase().includes(q)) ||
          (dato.tipo_servicio && dato.tipo_servicio.toLowerCase().includes(q)) ||
          (dato.nombre_ingeniero && dato.nombre_ingeniero.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [reportes, buscar]);

  // Paginated slice
  const paginatedReportes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReportes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReportes, currentPage, itemsPerPage]);

  const renderBadgeTipo = (tipo) => {
    const t = String(tipo || '').toUpperCase();
    if (t.includes('PREVENTIVO')) {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <FaCheckCircle size={11} /> PREVENTIVO
        </span>
      );
    }
    if (t.includes('CORRECTIVO')) {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <FaTools size={11} /> CORRECTIVO
        </span>
      );
    }
    if (t.includes('INSTALAC')) {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <FaWrench size={11} /> INSTALACIÓN
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700',
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        {tipo || 'OTRO'}
      </span>
    );
  };

  return (
    <div className="contenedor">
      <main>
        {/* Header Title & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaFileInvoice color="#38bdf8" /> Reportes de Servicio Técnico
              {isSyncingFull && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'normal',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FaSync className="fa-spin" size={11} /> Sincronizando historial...
                </span>
              )}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Historial de intervenciones, generación de nuevos reportes y firmas de servicios técnicos.
            </p>
          </div>

          {/* Action Buttons: Generar Reporte / Dashboard Informes / Firmar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* BOTÓN PROMINENTE: GENERAR NUEVO REPORTE */}
            <Link
              to="/inventarioua"
              title="Selecciona un equipo del inventario para generar su reporte"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
                border: '1px solid #38bdf8',
                transition: 'all 0.2s',
              }}
            >
              <FaPlus size={13} /> Generar Reporte de Servicio
            </Link>

            <Link
              to="/informes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#064e3b',
                color: '#6ee7b7',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                textDecoration: 'none',
                border: '1px solid #10b981',
                transition: 'all 0.2s',
              }}
            >
              <FaChartPie size={14} /> Dashboard de Informes
            </Link>

            <Link
              to="/firmareportes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13.5px',
                textDecoration: 'none',
                border: '1px solid #334155',
                transition: 'all 0.2s',
              }}
            >
              <FaFileSignature size={14} color="#38bdf8" /> Firmar Masivos
            </Link>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="div-buscar" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por Nº reporte, serie, equipo, tipo de servicio, IPS o responsable..."
              onChange={handleSave}
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
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '16px' }}>
            <FaSync className="fa-spin" style={{ marginRight: '8px' }} /> Cargando reportes de servicio...
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #334155' }}>
              <table className="tabla-reportes" style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>Nº REPORTE</th>
                    <th>TIPO SERVICIO</th>
                    <th style={{ width: '90px' }}>FECHA</th>
                    <th>EQUIPO</th>
                    <th>MARCA / MODELO</th>
                    <th>SERIE</th>
                    <th>INSTITUCIÓN</th>
                    <th>SERVICIO</th>
                    <th>RESPONSABLE</th>
                    <th style={{ textAlign: 'center', width: '85px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportes.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron reportes.
                      </td>
                    </tr>
                  ) : (
                    paginatedReportes.map(function (item) {
                      return (
                        <tr key={item._id}>
                          <td>
                            <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>#{item?.numero_reporte}</strong>
                          </td>
                          <td>{renderBadgeTipo(item?.tipo_servicio)}</td>
                          <td style={{ color: '#cbd5e1', whiteSpace: 'nowrap' }}>{item?.fecha}</td>
                          <td><strong style={{ color: '#f8fafc' }}>{item?.equipo}</strong></td>
                          <td>
                            <div style={{ color: '#cbd5e1' }}>{item?.marca || '-'}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item?.modelo || '-'}</div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: '#38bdf8', fontWeight: '600' }}>{item?.institucion || '-'}</span>
                          </td>
                          <td style={{ color: '#cbd5e1' }}>{item?.servicio || '-'}</td>
                          <td style={{ color: '#cbd5e1' }}>{item?.nombre_ingeniero || 'No registrado'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                              {/* Botón Ver PDF */}
                              <Link
                                to={`/reporte?id=${item._id}`}
                                title="Ver / Imprimir Reporte PDF"
                                className="action-btn action-btn-view"
                              >
                                <GoEye size={15} color="#38bdf8" />
                              </Link>
                              {/* Botón Editar */}
                              <Link
                                to={`/editareporte?id=${item._id}`}
                                title="Editar Reporte"
                                className="action-btn action-btn-edit"
                              >
                                <CiEdit size={16} color="#ffffff" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: '16px' }}>
              <Pagination
                totalItems={filteredReportes.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={(num) => setItemsPerPage(num)}
                pageSizeOptions={[15, 25, 50, 100]}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Reportes;
