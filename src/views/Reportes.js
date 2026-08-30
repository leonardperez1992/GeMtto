import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiReportes } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { FaFileSignature, FaFileInvoice, FaSync } from 'react-icons/fa';
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
      // 1. Carga ultra-rápida de los 100 más recientes (~100ms)
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
      // Fallback
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
    setCurrentPage(1); // Reset page on new search
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

  return (
    <div className="contenedor">
      <main>
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
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
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FaSync className="fa-spin" size={11} /> Cargando historial completo...
                </span>
              )}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Historial de intervenciones, mantenimientos preventivos y correctivos ordenados por fecha.
            </p>
          </div>
          <Link
            to="/firmareportes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0f3b60',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(15,59,96,0.5)',
              border: '1px solid #38bdf8',
              transition: 'all 0.2s',
            }}
          >
            <FaFileSignature size={14} color="#38bdf8" /> Firmar Reportes Masivos
          </Link>
        </div>

        {/* Toolbar & Search */}
        <div className="div-buscar">
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por Nº reporte, serie, equipo, tipo de servicio, IPS o responsable..."
              onChange={handleSave}
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

        {/* Table & Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '16px' }}>
            Cargando reportes más recientes...
          </div>
        ) : (
          <div>
            <div className="table-responsive-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nº REPORTE</th>
                    <th>TIPO SERVICIO</th>
                    <th>FECHA</th>
                    <th>EQUIPO</th>
                    <th>MARCA / MODELO</th>
                    <th>SERIE</th>
                    <th>INSTITUCIÓN</th>
                    <th>SERVICIO</th>
                    <th>RESPONSABLE</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
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
                            <strong style={{ color: '#38bdf8' }}>#{item?.numero_reporte}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '4px 9px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                backgroundColor: String(item?.tipo_servicio).includes('CORRECTIVO') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                color: String(item?.tipo_servicio).includes('CORRECTIVO') ? '#fca5a5' : '#86efac',
                                border: String(item?.tipo_servicio).includes('CORRECTIVO') ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                              }}
                            >
                              {item?.tipo_servicio}
                            </span>
                          </td>
                          <td style={{ color: '#cbd5e1' }}>{item?.fecha}</td>
                          <td><strong style={{ color: '#f8fafc' }}>{item?.equipo}</strong></td>
                          <td>
                            <div style={{ color: '#cbd5e1' }}>{item?.marca}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item?.modelo}</div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td style={{ color: '#e2e8f0' }}>{item?.institucion}</td>
                          <td style={{ color: '#cbd5e1' }}>{item?.servicio}</td>
                          <td style={{ color: '#cbd5e1' }}>{item?.nombre_ingeniero || 'No registrado'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                              {/* Botón Ver PDF */}
                              <Link
                                to={`/reporte?id=${item._id}`}
                                title="Ver / Imprimir Reporte PDF"
                                className="action-btn action-btn-view"
                              >
                                <GoEye size={16} color="#38bdf8" />
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
export default Reportes;
