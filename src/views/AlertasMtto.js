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
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaExclamationTriangle size={12} />
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
              backgroundColor: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fcd34d',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaClock size={12} />
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
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #86efac',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaCheckCircle size={12} />
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
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaQuestionCircle size={12} />
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
            <h2 style={{ margin: 0, color: '#0f2b48', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaShieldAlt color="#0d6efd" /> Semáforo y Alertas de Mantenimiento
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
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
              backgroundColor: '#0d6efd',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(13,110,253,0.25)',
              transition: 'all 0.2s',
            }}
          >
            <FaSync className={loading ? 'fa-spin' : ''} />
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
              backgroundColor: filtroEstado === 'TODOS' ? '#eff6ff' : '#ffffff',
              border: filtroEstado === 'TODOS' ? '2px solid #0d6efd' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL EQUIPOS</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0d6efd', marginTop: '4px' }}>
              {resumen.total}
            </div>
          </div>

          {/* Card: Vencidos */}
          <div
            onClick={() => setFiltroEstado('VENCIDO')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'VENCIDO' ? '#fef2f2' : '#ffffff',
              border: filtroEstado === 'VENCIDO' ? '2px solid #ef4444' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaExclamationTriangle /> VENCIDOS
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
              {resumen.vencidos}
            </div>
          </div>

          {/* Card: Proximos */}
          <div
            onClick={() => setFiltroEstado('PROXIMO')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'PROXIMO' ? '#fffbeb' : '#ffffff',
              border: filtroEstado === 'PROXIMO' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#d97706', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaClock /> PRÓXIMOS (30 DÍAS)
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
              {resumen.proximos}
            </div>
          </div>

          {/* Card: Al Dia */}
          <div
            onClick={() => setFiltroEstado('AL_DIA')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'AL_DIA' ? '#f0fdf4' : '#ffffff',
              border: filtroEstado === 'AL_DIA' ? '2px solid #10b981' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#16a34a', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaCheckCircle /> AL DÍA
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
              {resumen.al_dia}
            </div>
          </div>

          {/* Card: Sin Registro */}
          <div
            onClick={() => setFiltroEstado('SIN_REGISTRO')}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: filtroEstado === 'SIN_REGISTRO' ? '#f8fafc' : '#ffffff',
              border: filtroEstado === 'SIN_REGISTRO' ? '2px solid #64748b' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
              <FaQuestionCircle /> SIN REGISTRO
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#64748b', marginTop: '4px' }}>
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
              size={18}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            />
          </div>

          {/* Filter by IPS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13.5px', fontWeight: '600', color: '#475569', margin: 0 }}>
              IPS:
            </label>
            <select
              value={filtroIps}
              onChange={(e) => setFiltroIps(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                backgroundColor: '#fff',
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
            <label style={{ fontSize: '13.5px', fontWeight: '600', color: '#475569', margin: 0 }}>
              Estado:
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                backgroundColor: '#fff',
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
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#64748b' }}>
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
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No se encontraron equipos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedAlertas.map((item) => (
                      <tr key={item._id}>
                        <td>{renderBadge(item)}</td>
                        <td>
                          <strong>{item.equipo}</strong>
                          {item.riesgo && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Riesgo: {item.riesgo}</div>
                          )}
                        </td>
                        <td>
                          {item.marca}
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.modelo}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0f3b60' }}>
                            {item.serie}
                          </span>
                        </td>
                        <td>{item.institucion}</td>
                        <td>
                          {item.servicio}
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.ubicacion}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                            {item.periodicidad}
                          </span>
                        </td>
                        <td>
                          {item.ultimo_mantenimiento ? (
                            <div>
                              <div>{item.ultimo_mantenimiento}</div>
                              {item.ultimo_reporte_num && (
                                <div style={{ fontSize: '11px', color: '#0d6efd', fontWeight: '600' }}>
                                  Rep. #{item.ultimo_reporte_num}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sin registro</span>
                          )}
                        </td>
                        <td>
                          {item.proximo_mantenimiento ? (
                            <strong style={{ color: item.estado === 'VENCIDO' ? '#dc2626' : item.estado === 'PROXIMO' ? '#d97706' : '#16a34a' }}>
                              {item.proximo_mantenimiento}
                            </strong>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>No programado</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                            <Link
                              to={`/reporteService?id=${item._id}&equipo=${encodeURIComponent(item.equipo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}&servicio=${encodeURIComponent(item.servicio || '')}&marca=${encodeURIComponent(item.marca || '')}&modelo=${encodeURIComponent(item.modelo || '')}`}
                              title="Hacer Mantenimiento"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                textDecoration: 'none',
                                backgroundColor: '#0d6efd',
                                color: '#fff',
                                fontWeight: '600',
                              }}
                            >
                              <HiOutlineDocumentPlus size={15} /> Mtto
                            </Link>
                            <Link
                              to={`/hojadevida?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                              title="Ver Hoja de Vida"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: '12px',
                                textDecoration: 'none',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                backgroundColor: '#f8fafc',
                              }}
                            >
                              <GoEye size={16} />
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
