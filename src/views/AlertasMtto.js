import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiAlertas, apiIps, apiEliminarEquipos } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { GoSearch, GoEye } from 'react-icons/go';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaQuestionCircle,
  FaSync,
  FaShieldAlt,
  FaTrash,
} from 'react-icons/fa';

function AlertasMtto() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroIps, setFiltroIps] = useState('TODAS');
  const [listaIps, setListaIps] = useState([]);

  // Selection & Bulk Deletion
  const [selectedEquipos, setSelectedEquipos] = useState([]);
  const [deleting, setDeleting] = useState(false);

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
        link: apiIps,
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

  // Compute unique list of IPS from both registered IPS and loaded equipment alerts
  const uniqueIpsList = useMemo(() => {
    const fromAlertas = alertas.map((a) => (a.institucion ? a.institucion.trim() : '')).filter(Boolean);
    const fromApi = listaIps.map((i) => (i.ips ? i.ips.trim() : i.nombre ? i.nombre.trim() : '')).filter(Boolean);
    return Array.from(new Set([...fromAlertas, ...fromApi])).sort((a, b) => a.localeCompare(b));
  }, [alertas, listaIps]);

  // Compute counts based on selected IPS
  const countsByIps = useMemo(() => {
    const base =
      filtroIps === 'TODAS'
        ? alertas
        : alertas.filter((a) => (a.institucion || '').trim().toUpperCase() === filtroIps.trim().toUpperCase());

    return {
      total: base.length,
      vencidos: base.filter((a) => a.estado === 'VENCIDO').length,
      proximos: base.filter((a) => a.estado === 'PROXIMO').length,
      al_dia: base.filter((a) => a.estado === 'AL_DIA').length,
      sin_registro: base.filter((a) => a.estado === 'SIN_REGISTRO').length,
    };
  }, [alertas, filtroIps]);

  // Filter and search logic
  const filteredAlertas = useMemo(() => {
    return alertas.filter((item) => {
      // Filter by Estado
      if (filtroEstado !== 'TODOS' && item.estado !== filtroEstado) {
        return false;
      }
      // Filter by IPS (case insensitive matching)
      if (filtroIps !== 'TODAS') {
        const itemInst = (item.institucion || '').trim().toUpperCase();
        const filterInst = filtroIps.trim().toUpperCase();
        if (itemInst !== filterInst) {
          return false;
        }
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
    setSelectedEquipos([]);
  }, [buscar, filtroEstado, filtroIps, itemsPerPage]);

  // Paginated items
  const paginatedAlertas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAlertas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAlertas, currentPage, itemsPerPage]);

  // Checkbox handlers
  const handleCheckboxChange = (id) => {
    setSelectedEquipos((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredAlertas.map((a) => a._id);
      setSelectedEquipos(allIds);
    } else {
      setSelectedEquipos([]);
    }
  };

  // Bulk Delete Handler
  const handleDeleteSelected = async () => {
    if (selectedEquipos.length === 0) {
      alert('Por favor selecciona al menos un equipo de la tabla');
      return;
    }

    const confirmMsg = `¿Estás seguro de que deseas eliminar definitivamente los ${selectedEquipos.length} equipo(s) seleccionados del inventario?\n\nEsta acción eliminará estos equipos y no se puede deshacer.`;
    if (window.confirm(confirmMsg)) {
      setDeleting(true);
      try {
        const response = await request({
          link: apiEliminarEquipos,
          body: { ids: selectedEquipos },
          method: 'POST',
        });
        if (response && response.success) {
          alert(`¡${response.deletedCount || selectedEquipos.length} equipo(s) eliminados exitosamente!`);
          setSelectedEquipos([]);
          fetchAlertas();
        } else {
          alert(response?.message || 'Error al eliminar equipos seleccionados');
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión al eliminar equipos');
      } finally {
        setDeleting(false);
      }
    }
  };

  // Format date helper
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin Registro';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  };

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
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaExclamationTriangle size={12} color="#f87171" />
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
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaClock size={12} color="#fbbf24" />
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
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaCheckCircle size={12} color="#34d399" />
            AL DÍA ({item.dias_restantes} d)
          </span>
        );
      case 'SIN_REGISTRO':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.3)',
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
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaShieldAlt color="#38bdf8" /> Semáforo y Alertas de Mantenimiento
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Auditoría y control preventivo. Filtra por IPS o selecciona equipos dados de baja para eliminarlos fácilmente.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {selectedEquipos.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  backgroundColor: '#7f1d1d',
                  color: '#fca5a5',
                  border: '1.5px solid #ef4444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <FaTrash size={14} color="#fca5a5" />
                {deleting ? 'Eliminando...' : `Eliminar ${selectedEquipos.length} Seleccionado(s)`}
              </button>
            )}
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
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              <FaSync className={loading ? 'fa-spin' : ''} /> Actualizar Alertas
            </button>
          </div>
        </div>

        {/* Status Counter Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
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
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {filtroIps === 'TODAS' ? 'TOTAL EQUIPOS' : `TOTAL (${filtroIps})`}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>
              {countsByIps.total}
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
              {countsByIps.vencidos}
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
              {countsByIps.proximos}
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
              {countsByIps.al_dia}
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
              {countsByIps.sin_registro}
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
                maxWidth: '240px',
              }}
            >
              <option value="TODAS">-- Todas las IPS --</option>
              {uniqueIpsList.map((ipsName, idx) => (
                <option key={idx} value={ipsName}>
                  {ipsName}
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
              <option value="TODOS">Todos los Estados</option>
              <option value="VENCIDO">🔴 Vencidos</option>
              <option value="PROXIMO">🟡 Próximos a Vencer (30d)</option>
              <option value="AL_DIA">🟢 Al Día</option>
              <option value="SIN_REGISTRO">⚪ Sin Registro de Mtto</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '16px' }}>
            <FaSync className="fa-spin" style={{ marginRight: '8px' }} /> Analizando fechas y cronogramas de mantenimiento...
          </div>
        ) : filteredAlertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', marginTop: '20px' }}>
            <FaCheckCircle size={40} color="#34d399" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: 0, color: '#f8fafc' }}>No se encontraron alertas para este filtro</h3>
            <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Intenta cambiar los términos de búsqueda, la IPS o el estado seleccionado.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155', marginTop: '20px' }}>
              <table className="tabla-reportes" style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedAlertas.length > 0 &&
                          paginatedAlertas.every((a) => selectedEquipos.includes(a._id))
                        }
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </th>
                    <th>ESTADO</th>
                    <th>EQUIPO</th>
                    <th>SERIE</th>
                    <th>MARCA / MODELO</th>
                    <th>IPS / INSTITUCIÓN</th>
                    <th>SERVICIO / UBICACIÓN</th>
                    <th>ÚLTIMO MTTO</th>
                    <th>PRÓXIMO MTTO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlertas.map((item) => (
                    <tr
                      key={item._id}
                      style={{
                        backgroundColor: selectedEquipos.includes(item._id)
                          ? 'rgba(239, 68, 68, 0.15)'
                          : item.estado === 'VENCIDO'
                          ? 'rgba(239, 68, 68, 0.05)'
                          : item.estado === 'PROXIMO'
                          ? 'rgba(245, 158, 11, 0.05)'
                          : undefined,
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedEquipos.includes(item._id)}
                          onChange={() => handleCheckboxChange(item._id)}
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                        />
                      </td>
                      <td>{renderBadge(item)}</td>
                      <td>
                        <strong style={{ color: '#f8fafc' }}>{item.equipo}</strong>
                        {item.inventario && item.inventario !== 'NA' && (
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Inv: {item.inventario}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#38bdf8' }}>
                          {item.serie}
                        </span>
                      </td>
                      <td>
                        <div style={{ color: '#e2e8f0' }}>{item.marca || '-'}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.modelo || '-'}</div>
                      </td>
                      <td>
                        <span style={{ color: '#38bdf8', fontWeight: '600' }}>{item.institucion || '-'}</span>
                      </td>
                      <td>
                        <div style={{ color: '#e2e8f0' }}>{item.servicio || '-'}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.ubicacion || '-'}</div>
                      </td>
                      <td>
                        <div style={{ color: item.ultimo_mtto_fecha ? '#e2e8f0' : '#64748b' }}>
                          {formatearFecha(item.ultimo_mtto_fecha)}
                        </div>
                        {item.frecuencia && (
                          <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                            Frec: {item.frecuencia}
                          </div>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: '700',
                            color:
                              item.estado === 'VENCIDO'
                                ? '#ef4444'
                                : item.estado === 'PROXIMO'
                                ? '#f59e0b'
                                : item.estado === 'AL_DIA'
                                ? '#10b981'
                                : '#94a3b8',
                          }}
                        >
                          {formatearFecha(item.proximo_mtto_fecha)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            to={`/hojadevida?id=${item._id}`}
                            title="Ver Hoja de Vida"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#0284c7',
                              color: '#fff',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              textDecoration: 'none',
                              fontSize: '13px',
                            }}
                          >
                            <GoEye size={14} />
                          </Link>
                          <Link
                            to={`/reporteService?id=${item._id}`}
                            title="Crear Reporte de Servicio"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#10b981',
                              color: '#fff',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              textDecoration: 'none',
                              fontSize: '13px',
                            }}
                          >
                            <HiOutlineDocumentPlus size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: '20px' }}>
              <Pagination
                totalItems={filteredAlertas.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={(num) => {
                  setItemsPerPage(num);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AlertasMtto;
