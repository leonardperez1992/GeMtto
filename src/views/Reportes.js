import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { apiReportes, apiIps } from '../utils/api';
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
  FaFilter,
} from 'react-icons/fa';
import { GoSearch, GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

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

function Reportes() {
  const reduxUser = useSelector((state) => state.user);
  const isNonAdmin = Boolean(reduxUser && reduxUser.rol !== 'admin');
  const userInstitucion = (reduxUser?.institucion || '').trim();

  const [reportes, setReportes] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [selectedIps, setSelectedIps] = useState('');
  const [selectedServicio, setSelectedServicio] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncingFull, setIsSyncingFull] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
    fetchIps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNonAdmin && userInstitucion) {
      setSelectedIps(userInstitucion);
    }
  }, [isNonAdmin, userInstitucion]);

  // Lista única y combinada de IPS disponibles (desde colección IPS + valores presentes en reportes)
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

  // Lista única de Servicios disponibles según la IPS seleccionada (o todos si no hay IPS elegida)
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

  // Tipos extras no convencionales presentes en los reportes
  const otrosTiposExtras = useMemo(() => {
    const extras = new Set();
    reportes.forEach((rep) => {
      const t = String(rep.tipo_servicio || '').trim();
      if (!t) return;
      const upper = t.toUpperCase();
      if (
        !upper.includes('PREVENTIVO') &&
        !upper.includes('CORRECTIVO') &&
        !upper.includes('INSTALAC') &&
        upper !== 'OTRO'
      ) {
        extras.add(t);
      }
    });
    return Array.from(extras).sort((a, b) => a.localeCompare(b));
  }, [reportes]);

  const handleSave = (e) => {
    setBuscar(e.target.value);
    setCurrentPage(1);
  };

  // Filtered and sorted reportes
  const filteredReportes = useMemo(() => {
    const targetIps = isNonAdmin ? userInstitucion : selectedIps;

    return reportes.filter((dato) => {
      // 1. Filtro por Institución / IPS
      if (targetIps && !matchesInstitucion(dato.institucion, targetIps)) {
        return false;
      }

      // 2. Filtro por Servicio / Área
      if (
        selectedServicio &&
        String(dato.servicio || '').trim().toLowerCase() !== selectedServicio.trim().toLowerCase()
      ) {
        return false;
      }

      // 3. Filtro por Tipo de Mantenimiento / Servicio
      if (selectedTipo) {
        const tipoServ = String(dato.tipo_servicio || '').toUpperCase();
        if (selectedTipo === 'MTTO PREVENTIVO') {
          if (!tipoServ.includes('PREVENTIVO')) return false;
        } else if (selectedTipo === 'MTTO CORRECTIVO') {
          if (!tipoServ.includes('CORRECTIVO')) return false;
        } else if (selectedTipo === 'INSTALACION') {
          if (!tipoServ.includes('INSTALAC')) return false;
        } else if (selectedTipo === 'OTRO') {
          if (
            tipoServ.includes('PREVENTIVO') ||
            tipoServ.includes('CORRECTIVO') ||
            tipoServ.includes('INSTALAC')
          ) {
            return false;
          }
        } else {
          if (tipoServ !== selectedTipo.toUpperCase()) return false;
        }
      }

      // 4. Búsqueda por texto libre
      if (buscar.trim() !== '') {
        const q = buscar.toLowerCase();
        const match =
          (dato.numero_reporte && String(dato.numero_reporte).toLowerCase().includes(q)) ||
          (dato.serie && String(dato.serie).toLowerCase().includes(q)) ||
          (dato.institucion && String(dato.institucion).toLowerCase().includes(q)) ||
          (dato.servicio && String(dato.servicio).toLowerCase().includes(q)) ||
          (dato.equipo && String(dato.equipo).toLowerCase().includes(q)) ||
          (dato.marca && String(dato.marca).toLowerCase().includes(q)) ||
          (dato.modelo && String(dato.modelo).toLowerCase().includes(q)) ||
          (dato.tipo_servicio && String(dato.tipo_servicio).toLowerCase().includes(q)) ||
          (dato.nombre_ingeniero && String(dato.nombre_ingeniero).toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [reportes, selectedIps, selectedServicio, selectedTipo, buscar, isNonAdmin, userInstitucion]);

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

        {/* ==========================================================
            BARRA DE FILTROS POR INSTITUCIÓN, SERVICIO Y TIPO DE MANTENIMIENTO
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFilter /> Filtrar Reportes por Institución, Servicio y Tipo de Mantenimiento:
            </div>
            {((!isNonAdmin && selectedIps) || selectedServicio || selectedTipo || buscar) && (
              <button
                type="button"
                onClick={() => {
                  if (!isNonAdmin) setSelectedIps('');
                  setSelectedServicio('');
                  setSelectedTipo('');
                  setBuscar('');
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Restablecer Filtros
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
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

            {/* 3. Desplegable Tipo de Mantenimiento */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                Tipo de Mantenimiento / Servicio:
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => {
                  setSelectedTipo(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ padding: '9px 12px', fontSize: '13px', width: '100%' }}
              >
                <option value="">-- Todos los Tipos --</option>
                <option value="MTTO PREVENTIVO">Mantenimiento Preventivo</option>
                <option value="MTTO CORRECTIVO">Mantenimiento Correctivo</option>
                <option value="INSTALACION">Instalación</option>
                <option value="OTRO">Otro / No clasificado</option>
                {otrosTiposExtras.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="div-buscar" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por Nº reporte, serie, equipo, modelo, responsable..."
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

        {/* Info contador de reportes filtrados */}
        {!loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              fontSize: '13px',
              color: '#94a3b8',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span>
              Mostrando <strong style={{ color: '#38bdf8' }}>{paginatedReportes.length}</strong> de{' '}
              <strong style={{ color: '#f8fafc' }}>{filteredReportes.length}</strong> reportes
              {filteredReportes.length !== reportes.length && (
                <span> (filtrados de un total de {reportes.length})</span>
              )}
            </span>
            {((!isNonAdmin && selectedIps) || selectedServicio || selectedTipo || buscar) && (
              <span
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                Filtros activos aplicados
              </span>
            )}
          </div>
        )}

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
