import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiAlertas, apiIps } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { GoSearch, GoEye } from 'react-icons/go';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaQuestionCircle, FaSync } from 'react-icons/fa';

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
              gap: '5px',
              backgroundColor: '#ffe5e5',
              color: '#dc3545',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '12px',
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
              gap: '5px',
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '12px',
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
              gap: '5px',
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '12px',
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
              gap: '5px',
              backgroundColor: '#e2e3e5',
              color: '#6c757d',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
          >
            <FaQuestionCircle size={12} />
            SIN REGISTRO
          </span>
        );
    }
  };

  return (
    <div className="contenedor" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <main>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1a365d', fontWeight: 'bold' }}>
              🚦 Semáforo y Alertas de Mantenimiento
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
              Control preventivo según periodicidad y último mantenimiento realizado.
            </p>
          </div>
          <button
            onClick={fetchAlertas}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#0d6efd',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '25px',
          }}
        >
          {/* Card: Total */}
          <div
            onClick={() => setFiltroEstado('TODOS')}
            style={{
              padding: '15px',
              borderRadius: '10px',
              backgroundColor: filtroEstado === 'TODOS' ? '#e7f1ff' : '#ffffff',
              border: filtroEstado === 'TODOS' ? '2px solid #0d6efd' : '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: 'bold' }}>TOTAL EQUIPOS</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0d6efd', marginTop: '5px' }}>
              {resumen.total}
            </div>
          </div>

          {/* Card: Vencidos */}
          <div
            onClick={() => setFiltroEstado('VENCIDO')}
            style={{
              padding: '15px',
              borderRadius: '10px',
              backgroundColor: filtroEstado === 'VENCIDO' ? '#ffebee' : '#ffffff',
              border: filtroEstado === 'VENCIDO' ? '2px solid #dc3545' : '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#dc3545', fontWeight: 'bold' }}>
              <FaExclamationTriangle /> VENCIDOS
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545', marginTop: '5px' }}>
              {resumen.vencidos}
            </div>
          </div>

          {/* Card: Proximos */}
          <div
            onClick={() => setFiltroEstado('PROXIMO')}
            style={{
              padding: '15px',
              borderRadius: '10px',
              backgroundColor: filtroEstado === 'PROXIMO' ? '#fffde7' : '#ffffff',
              border: filtroEstado === 'PROXIMO' ? '2px solid #f59e0b' : '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>
              <FaClock /> PRÓXIMOS (30 DÍAS)
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309', marginTop: '5px' }}>
              {resumen.proximos}
            </div>
          </div>

          {/* Card: Al Dia */}
          <div
            onClick={() => setFiltroEstado('AL_DIA')}
            style={{
              padding: '15px',
              borderRadius: '10px',
              backgroundColor: filtroEstado === 'AL_DIA' ? '#e8f5e9' : '#ffffff',
              border: filtroEstado === 'AL_DIA' ? '2px solid #198754' : '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#198754', fontWeight: 'bold' }}>
              <FaCheckCircle /> AL DÍA
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#198754', marginTop: '5px' }}>
              {resumen.al_dia}
            </div>
          </div>

          {/* Card: Sin Registro */}
          <div
            onClick={() => setFiltroEstado('SIN_REGISTRO')}
            style={{
              padding: '15px',
              borderRadius: '10px',
              backgroundColor: filtroEstado === 'SIN_REGISTRO' ? '#f5f5f5' : '#ffffff',
              border: filtroEstado === 'SIN_REGISTRO' ? '2px solid #6c757d' : '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6c757d', fontWeight: 'bold' }}>
              <FaQuestionCircle /> SIN REGISTRO
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6c757d', marginTop: '5px' }}>
              {resumen.sin_registro}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid #dee2e6',
            marginBottom: '20px',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por serie, equipo, marca, servicio..."
              style={{
                width: '100%',
                padding: '10px 35px 10px 12px',
                borderRadius: '8px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <GoSearch
              size={18}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c757d',
              }}
            />
          </div>

          {/* Filter by IPS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', margin: 0 }}>
              IPS:
            </label>
            <select
              value={filtroIps}
              onChange={(e) => setFiltroIps(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ced4da',
                fontSize: '14px',
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
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', margin: 0 }}>
              Estado:
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ced4da',
                fontSize: '14px',
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

        {/* Table Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6c757d' }}>
            Cargando alertas de mantenimiento...
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #dee2e6' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th>ESTADO</th>
                    <th>EQUIPO</th>
                    <th>MARCA / MODELO</th>
                    <th>SERIE</th>
                    <th>INSTITUCIÓN</th>
                    <th>SERVICIO / UBICACIÓN</th>
                    <th>PERIODICIDAD</th>
                    <th>ÚLTIMO MTTO</th>
                    <th>PRÓXIMO MTTO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlertas.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                        No se encontraron equipos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedAlertas.map((item) => (
                      <tr key={item._id} style={{ verticalAlign: 'middle' }}>
                        <td>{renderBadge(item)}</td>
                        <td>
                          <strong>{item.equipo}</strong>
                          {item.riesgo && (
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Riesgo: {item.riesgo}</div>
                          )}
                        </td>
                        <td>
                          {item.marca}
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>{item.modelo}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.serie}</span>
                        </td>
                        <td>{item.institucion}</td>
                        <td>
                          {item.servicio}
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>{item.ubicacion}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>
                            {item.periodicidad}
                          </span>
                        </td>
                        <td>
                          {item.ultimo_mantenimiento ? (
                            <div>
                              <div>{item.ultimo_mantenimiento}</div>
                              {item.ultimo_reporte_num && (
                                <div style={{ fontSize: '11px', color: '#0d6efd' }}>
                                  Rep. #{item.ultimo_reporte_num}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#adb5bd', fontSize: '12px' }}>Sin fecha</span>
                          )}
                        </td>
                        <td>
                          {item.proximo_mantenimiento ? (
                            <strong style={{ color: item.estado === 'VENCIDO' ? '#dc3545' : item.estado === 'PROXIMO' ? '#b45309' : '#198754' }}>
                              {item.proximo_mantenimiento}
                            </strong>
                          ) : (
                            <span style={{ color: '#adb5bd', fontSize: '12px' }}>No programado</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Link
                              to={`/reporteService?id=${item._id}&equipo=${encodeURIComponent(item.equipo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}&servicio=${encodeURIComponent(item.servicio || '')}&marca=${encodeURIComponent(item.marca || '')}&modelo=${encodeURIComponent(item.modelo || '')}`}
                              className="btn btn-sm btn-primary"
                              title="Hacer Mantenimiento"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                textDecoration: 'none',
                                backgroundColor: '#0d6efd',
                                color: '#fff',
                              }}
                            >
                              <HiOutlineDocumentPlus size={16} /> Mtto
                            </Link>
                            <Link
                              to={`/hojadevida?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                              className="btn btn-sm btn-outline-secondary"
                              title="Ver Hoja de Vida"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: '12px',
                                textDecoration: 'none',
                                border: '1px solid #ced4da',
                                color: '#495057',
                                backgroundColor: '#fff',
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
