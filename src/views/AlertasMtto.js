import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiAlertas, apiIps } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { GoSearch, GoEye } from 'react-icons/go';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaQuestionCircle, FaSync, FaShieldAlt } from 'react-icons/fa';

function AlertasMtto() {
  const [alertas, setAlertas] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, vencidos: 0, proximos: 0, al_dia: 0, sin_registro: 0 });
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroIps, setFiltroIps] = useState('TODAS');
  const [listaIps, setListaIps] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      const response = await request({
        link: apiAlertas,
        method: 'GET',
      });
      if (response && response.success) {
        setAlertas(response.alertas || []);
        setResumen(response.resumen || { total: 0, vencidos: 0, proximos: 0, al_dia: 0, sin_registro: 0 });
      } else {
        alert('Error al cargar alertas de mantenimiento');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const fetchIps = async () => {
    try {
      const response = await request({
        link: apiIps + '/getips',
        method: 'GET',
      });
      if (response && response.success && response.ips) {
        setListaIps(response.ips);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlertas();
    fetchIps();
  }, []);

  // Filter and search logic
  const filteredAlertas = useMemo(() => {
    return alertas.filter((item) => {
      // Filter by Estado
      if (filtroEstado !== 'TODOS' && item.estado !== filtroEstado) {
        return false;
      }
      // Filter by IPS
      if (filtroIps !== 'TODAS' && item.institucion !== filtroIps) {
        return false;
      }
      // Filter by Search Query
      if (buscar.trim() !== '') {
        const q = buscar.toLowerCase();
        const matchSerie = item.serie && item.serie.toLowerCase().includes(q);
        const matchEquipo = item.equipo && item.equipo.toLowerCase().includes(q);
        const matchMarca = item.marca && item.marca.toLowerCase().includes(q);
        const matchModelo = item.modelo && item.modelo.toLowerCase().includes(q);
        const matchInstitucion = item.institucion && item.institucion.toLowerCase().includes(q);
        const matchServicio = item.servicio && item.servicio.toLowerCase().includes(q);
        const matchUbicacion = item.ubicacion && item.ubicacion.toLowerCase().includes(q);
        return matchSerie || matchEquipo || matchMarca || matchModelo || matchInstitucion || matchServicio || matchUbicacion;
      }
      return true;
    });
  }, [alertas, filtroEstado, filtroIps, buscar]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [buscar, filtroEstado, filtroIps, itemsPerPage]);

  // Paginated items
  const paginatedAlertas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAlertas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAlertas, currentPage, itemsPerPage]);

  // Badge render helper
  const renderBadge = (item) => {
    switch (item.estado) {
      case 'VENCIDO':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaExclamationTriangle size={12} color="#fca5a5" />
            VENCIDO ({Math.abs(item.dias_restantes)} d)
          </span>
        );
      case 'PROXIMO':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#fde047',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaClock size={12} color="#fde047" />
            PRÓXIMO ({item.dias_restantes} d)
          </span>
        );
      case 'AL_DIA':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#86efac',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaCheckCircle size={12} color="#86efac" />
            AL DÍA ({item.dias_restantes} d)
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(100, 116, 139, 0.2)',
              color: '#cbd5e1',
              border: '1px solid rgba(100, 116, 139, 0.4)',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaQuestionCircle size={12} color="#94a3b8" />
            SIN REGISTRO
          </span>
        );
    }
  };

  return (
    <div className="contenedor">
      <main>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaShieldAlt color="#38bdf8" /> Semáforo y Alertas de Mantenimiento
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Auditoría y control preventivo según periodicidad y último servicio realizado.
            </p>
          </div>
          <button
            onClick={fetchAlertas}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(2,132,199,0.4)',
              transition: 'all 0.2s',
            }}
          >
            <FaSync className={loading ? 'fa-spin' : ''} color="#ffffff" />
            Actualizar
          </button>
        </div>

        {/* KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          {/* Card: Total */}
          <div
            onClick={() => setFiltroEstado('TODOS')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'TODOS' ? '#1e3a8a' : '#1e293b',
              border: filtroEstado === 'TODOS' ? '2px solid #38bdf8' : '1px solid #334155',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL EQUIPOS</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
              {resumen.total}
            </div>
          </div>

          {/* Card: Vencidos */}
          <div
            onClick={() => setFiltroEstado('VENCIDO')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'VENCIDO' ? '#450a0a' : '#1e293b',
              border: filtroEstado === 'VENCIDO' ? '2px solid #ef4444' : '1px solid #334155',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fca5a5', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaExclamationTriangle color="#fca5a5" /> VENCIDOS
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
              {resumen.vencidos}
            </div>
          </div>

          {/* Card: Proximos */}
          <div
            onClick={() => setFiltroEstado('PROXIMO')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'PROXIMO' ? '#451a03' : '#1e293b',
              border: filtroEstado === 'PROXIMO' ? '2px solid #f59e0b' : '1px solid #334155',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fde047', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaClock color="#fde047" /> PRÓXIMOS (30 DÍAS)
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
              {resumen.proximos}
            </div>
          </div>

          {/* Card: Al Dia */}
          <div
            onClick={() => setFiltroEstado('AL_DIA')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'AL_DIA' ? '#052e16' : '#1e293b',
              border: filtroEstado === 'AL_DIA' ? '2px solid #10b981' : '1px solid #334155',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#86efac', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaCheckCircle color="#86efac" /> AL DÍA
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              {resumen.al_dia}
            </div>
          </div>

          {/* Card: Sin Registro */}
          <div
            onClick={() => setFiltroEstado('SIN_REGISTRO')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'SIN_REGISTRO' ? '#0f172a' : '#1e293b',
              border: filtroEstado === 'SIN_REGISTRO' ? '2px solid #94a3b8' : '1px solid #334155',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaQuestionCircle color="#cbd5e1" /> SIN REGISTRO
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#94a3b8', marginTop: '4px' }}>
              {resumen.sin_registro}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="div-buscar">
          {/* Search Box */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por serie, equipo, marca, modelo, servicio o ubicación..."
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

          {/* Filter by IPS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13.5px', fontWeight: '600', color: '#cbd5e1', margin: 0 }}>
              IPS:
            </label>
            <select
              value={filtroIps}
              onChange={(e) => setFiltroIps(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                fontSize: '13.5px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
                maxWidth: '220px',
              }}
            >
              <option value="TODAS">-- Todas las IPS --</option>
              {listaIps.map((ipsItem, idx) => (
                <option key={idx} value={ipsItem.nombre || ipsItem.institucion}>
                  {ipsItem.nombre || ipsItem.institucion}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13.5px', fontWeight: '600', color: '#cbd5e1', margin: 0 }}>
              Estado:
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                fontSize: '13.5px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="VENCIDO">🔴 Vencidos</option>
              <option value="PROXIMO">🟡 Próximos a vencer</option>
              <option value="AL_DIA">🟢 Al día</option>
              <option value="SIN_REGISTRO">⚪ Sin registro</option>
            </select>
          </div>
        </div>

        {/* Table & Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#94a3b8' }}>
            Calculando alertas de mantenimiento preventivo...
          </div>
        ) : (
          <div>
            <div className="table-responsive-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>ESTADO</th>
                    <th>EQUIPO</th>
                    <th>MARCA / MODELO</th>
                    <th>SERIE</th>
                    <th>INSTITUCIÓN</th>
                    <th>SERVICIO / UBICACIÓN</th>
                    <th>PERIODICIDAD</th>
                    <th>ÚLTIMO MTTO</th>
                    <th>PRÓXIMO MTTO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlertas.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron equipos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedAlertas.map((item) => (
                      <tr key={item._id}>
                        <td>{renderBadge(item)}</td>
                        <td>
                          <strong style={{ color: '#f8fafc' }}>{item.equipo}</strong>
                          {item.riesgo && (
                            <div style={{ fontSize: '11px', color: '#38bdf8' }}>Riesgo: {item.riesgo}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ color: '#cbd5e1' }}>{item.marca}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.modelo}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                            {item.serie}
                          </span>
                        </td>
                        <td style={{ color: '#e2e8f0' }}>{item.institucion}</td>
                        <td>
                          <div style={{ color: '#cbd5e1' }}>{item.servicio}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.ubicacion}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                            {item.periodicidad}
                          </span>
                        </td>
                        <td>
                          {item.ultimo_mantenimiento ? (
                            <div>
                              <div style={{ color: '#cbd5e1' }}>{item.ultimo_mantenimiento}</div>
                              {item.ultimo_reporte_num && (
                                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
                                  Rep. #{item.ultimo_reporte_num}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>Sin registro</span>
                          )}
                        </td>
                        <td>
                          {item.proximo_mantenimiento ? (
                            <strong style={{ color: item.estado === 'VENCIDO' ? '#ef4444' : item.estado === 'PROXIMO' ? '#f59e0b' : '#10b981' }}>
                              {item.proximo_mantenimiento}
                            </strong>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>No programado</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                            {/* Boton Mtto */}
                            <Link
                              to={`/reporteService?id=${item._id}&equipo=${encodeURIComponent(item.equipo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}&servicio=${encodeURIComponent(item.servicio || '')}&marca=${encodeURIComponent(item.marca || '')}&modelo=${encodeURIComponent(item.modelo || '')}`}
                              title="Hacer Mantenimiento"
                              className="action-btn action-btn-primary"
                            >
                              <HiOutlineDocumentPlus size={16} color="#ffffff" />
                            </Link>
                            {/* Boton Ver Hoja */}
                            <Link
                              to={`/hojadevida?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                              title="Ver Hoja de Vida"
                              className="action-btn action-btn-view"
                            >
                              <GoEye size={16} color="#38bdf8" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination
              totalItems={filteredAlertas.length}
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

export default AlertasMtto;
