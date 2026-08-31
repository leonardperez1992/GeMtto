import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiReportes, apiIps } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import ExportJsonExcel from 'js-export-excel';
import {
  FaFileSignature,
  FaFileInvoice,
  FaSync,
  FaPlus,
  FaFileExcel,
  FaWrench,
  FaTools,
  FaCogs,
  FaCheckCircle,
  FaChartPie,
} from 'react-icons/fa';
import { GoSearch, GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

function Reportes() {
  const [reportes, setReportes] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroIps, setFiltroIps] = useState('TODAS');
  const [filtroAnio, setFiltroAnio] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [isSyncingFull, setIsSyncingFull] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const getReportes = async () => {
    setLoading(true);
    try {
      // 1. Carga inicial rápida de los 100 más recientes
      const responseInit = await request({
        link: `${apiReportes}?limit=100`,
        method: 'GET',
      });

      if (responseInit && responseInit.success && responseInit.reporte) {
        setReportes(responseInit.reporte);
        setLoading(false);
      }

      // 2. Carga en segundo plano del historial completo
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
    getReportes();
    fetchIps();
  }, []);

  // Lista única de IPS consolidada
  const uniqueIpsList = useMemo(() => {
    const fromReportes = reportes.map((r) => (r.institucion ? r.institucion.trim() : '')).filter(Boolean);
    const fromApi = listaIps.map((i) => (i.ips ? i.ips.trim() : i.nombre ? i.nombre.trim() : '')).filter(Boolean);
    return Array.from(new Set([...fromReportes, ...fromApi])).sort((a, b) => a.localeCompare(b));
  }, [reportes, listaIps]);

  // Lista de años disponibles en los reportes
  const uniqueAniosList = useMemo(() => {
    const years = reportes
      .map((r) => {
        if (!r.fecha) return '';
        const match = r.fecha.match(/^(\d{4})/);
        return match ? match[1] : '';
      })
      .filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
  }, [reportes]);

  // Base filtrada por IPS y Año para calcular estadísticas del Dashboard
  const baseDashboard = useMemo(() => {
    return reportes.filter((r) => {
      if (filtroIps !== 'TODAS') {
        const itemInst = (r.institucion || '').trim().toUpperCase();
        if (itemInst !== filtroIps.trim().toUpperCase()) return false;
      }
      if (filtroAnio !== 'TODOS') {
        if (!r.fecha || !r.fecha.startsWith(filtroAnio)) return false;
      }
      return true;
    });
  }, [reportes, filtroIps, filtroAnio]);

  // Estadísticas del Dashboard
  const stats = useMemo(() => {
    const total = baseDashboard.length;
    const preventivos = baseDashboard.filter((r) => String(r.tipo_servicio).toUpperCase().includes('PREVENTIVO')).length;
    const correctivos = baseDashboard.filter((r) => String(r.tipo_servicio).toUpperCase().includes('CORRECTIVO')).length;
    const instalaciones = baseDashboard.filter((r) => String(r.tipo_servicio).toUpperCase().includes('INSTALAC')).length;
    const otros = total - (preventivos + correctivos + instalaciones);

    const pctPreventivo = total > 0 ? Math.round((preventivos / total) * 100) : 0;
    const pctCorrectivo = total > 0 ? Math.round((correctivos / total) * 100) : 0;
    const pctInstalacion = total > 0 ? Math.round((instalaciones / total) * 100) : 0;
    const pctOtros = total > 0 ? Math.round((otros / total) * 100) : 0;

    return {
      total,
      preventivos,
      correctivos,
      instalaciones,
      otros,
      pctPreventivo,
      pctCorrectivo,
      pctInstalacion,
      pctOtros,
    };
  }, [baseDashboard]);

  // Filtrado final para la tabla
  const filteredReportes = useMemo(() => {
    return baseDashboard.filter((dato) => {
      // Filtro por tipo de servicio
      if (filtroTipo !== 'TODOS') {
        const tipoServ = String(dato.tipo_servicio || '').toUpperCase();
        if (filtroTipo === 'MTTO PREVENTIVO' && !tipoServ.includes('PREVENTIVO')) return false;
        if (filtroTipo === 'MTTO CORRECTIVO' && !tipoServ.includes('CORRECTIVO')) return false;
        if (filtroTipo === 'INSTALACION' && !tipoServ.includes('INSTALAC')) return false;
        if (filtroTipo === 'OTRO' && (tipoServ.includes('PREVENTIVO') || tipoServ.includes('CORRECTIVO') || tipoServ.includes('INSTALAC'))) return false;
      }

      // Filtro de búsqueda
      if (buscar.trim() !== '') {
        const q = buscar.toLowerCase();
        const matchNum = dato.numero_reporte && String(dato.numero_reporte).toLowerCase().includes(q);
        const matchSerie = dato.serie && dato.serie.toLowerCase().includes(q);
        const matchInst = dato.institucion && dato.institucion.toLowerCase().includes(q);
        const matchServ = dato.servicio && dato.servicio.toLowerCase().includes(q);
        const matchEq = dato.equipo && dato.equipo.toLowerCase().includes(q);
        const matchMarca = dato.marca && dato.marca.toLowerCase().includes(q);
        const matchModelo = dato.modelo && dato.modelo.toLowerCase().includes(q);
        const matchTipo = dato.tipo_servicio && dato.tipo_servicio.toLowerCase().includes(q);
        const matchIng = dato.nombre_ingeniero && dato.nombre_ingeniero.toLowerCase().includes(q);
        return matchNum || matchSerie || matchInst || matchServ || matchEq || matchMarca || matchModelo || matchTipo || matchIng;
      }

      return true;
    });
  }, [baseDashboard, filtroTipo, buscar]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [buscar, filtroTipo, filtroIps, filtroAnio, itemsPerPage]);

  // Paginated slice
  const paginatedReportes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReportes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReportes, currentPage, itemsPerPage]);

  // Exportar a Excel los datos filtrados
  const exportarExcel = () => {
    if (filteredReportes.length === 0) {
      alert('No hay reportes para exportar con los filtros actuales');
      return;
    }

    const dataTable = filteredReportes.map((r) => ({
      Numero_Reporte: r.numero_reporte || '',
      Fecha: r.fecha || '',
      Tipo_Servicio: r.tipo_servicio || '',
      Institucion: r.institucion || '',
      Servicio: r.servicio || '',
      Equipo: r.equipo || '',
      Marca: r.marca || '',
      Modelo: r.modelo || '',
      Serie: r.serie || '',
      Estado_Final: r.estado_final || '',
      Ingeniero_Responsable: r.nombre_ingeniero || '',
      Problema_Reportado: r.problema_reportado || '',
      Descripcion_Servicio: r.desc_servicio || '',
      Observaciones: r.observaciones || '',
    }));

    const option = {
      fileName: `GEMTTO_Historico_Reportes_${new Date().toISOString().split('T')[0]}`,
      datas: [
        {
          sheetData: dataTable,
          sheetName: 'Reportes',
          sheetHeader: [
            'Nº Reporte',
            'Fecha',
            'Tipo de Servicio',
            'Institución / IPS',
            'Servicio / Área',
            'Equipo Biomédico',
            'Marca',
            'Modelo',
            'Serie',
            'Estado Final',
            'Ingeniero Responsable',
            'Problema Reportado',
            'Descripción del Servicio',
            'Observaciones',
          ],
        },
      ],
    };

    const toExcel = new ExportJsonExcel(option);
    toExcel.saveExcel();
  };

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
          <FaCogs size={11} /> INSTALACIÓN
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
              <FaFileInvoice color="#38bdf8" /> Historial y Reportes de Servicio Técnico
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
              Dashboard interactivo, auditoría de intervenciones técnicas y generación de reportes de mantenimiento.
            </p>
          </div>

          {/* Action Buttons: Generar Reporte / Firmar / Exportar */}
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

            <button
              onClick={exportarExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#064e3b',
                color: '#6ee7b7',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                border: '1px solid #10b981',
                transition: 'all 0.2s',
              }}
            >
              <FaFileExcel size={14} /> Excel
            </button>
          </div>
        </div>

        {/* DASHBOARD: HISTÓRICOS Y KPIs DE MANTENIMIENTO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          {/* Card: Total */}
          <div
            onClick={() => setFiltroTipo('TODOS')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: filtroTipo === 'TODOS' ? '#1e3a8a' : '#1e293b',
              border: filtroTipo === 'TODOS' ? '2px solid #38bdf8' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                TOTAL HISTÓRICO
              </span>
              <FaChartPie color="#38bdf8" size={14} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {filtroIps === 'TODAS' ? 'Todas las IPS' : filtroIps}
            </div>
          </div>

          {/* Card: Preventivo */}
          <div
            onClick={() => setFiltroTipo('MTTO PREVENTIVO')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: filtroTipo === 'MTTO PREVENTIVO' ? '#052e16' : '#1e293b',
              border: filtroTipo === 'MTTO PREVENTIVO' ? '2px solid #10b981' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#86efac', fontWeight: '700' }}>
                PREVENTIVOS
              </span>
              <FaCheckCircle color="#86efac" size={14} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              {stats.preventivos}
            </div>
            <div style={{ fontSize: '11.5px', color: '#86efac', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctPreventivo}% del total
            </div>
          </div>

          {/* Card: Correctivo */}
          <div
            onClick={() => setFiltroTipo('MTTO CORRECTIVO')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: filtroTipo === 'MTTO CORRECTIVO' ? '#450a0a' : '#1e293b',
              border: filtroTipo === 'MTTO CORRECTIVO' ? '2px solid #ef4444' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#fca5a5', fontWeight: '700' }}>
                CORRECTIVOS
              </span>
              <FaTools color="#fca5a5" size={14} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
              {stats.correctivos}
            </div>
            <div style={{ fontSize: '11.5px', color: '#fca5a5', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctCorrectivo}% del total
            </div>
          </div>

          {/* Card: Instalaciones */}
          <div
            onClick={() => setFiltroTipo('INSTALACION')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: filtroTipo === 'INSTALACION' ? '#0c4a6e' : '#1e293b',
              border: filtroTipo === 'INSTALACION' ? '2px solid #38bdf8' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#7dd3fc', fontWeight: '700' }}>
                INSTALACIONES
              </span>
              <FaWrench color="#7dd3fc" size={14} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
              {stats.instalaciones}
            </div>
            <div style={{ fontSize: '11.5px', color: '#7dd3fc', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctInstalacion}% del total
            </div>
          </div>

          {/* Card: Otros */}
          <div
            onClick={() => setFiltroTipo('OTRO')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: filtroTipo === 'OTRO' ? '#3b0764' : '#1e293b',
              border: filtroTipo === 'OTRO' ? '2px solid #c084fc' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#d8b4fe', fontWeight: '700' }}>
                OTROS SERVICIOS
              </span>
              <FaCogs color="#d8b4fe" size={14} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#c084fc', marginTop: '4px' }}>
              {stats.otros}
            </div>
            <div style={{ fontSize: '11.5px', color: '#d8b4fe', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctOtros}% del total
            </div>
          </div>
        </div>

        {/* Visual Distribution Bar */}
        {stats.total > 0 && (
          <div style={{ marginBottom: '20px', backgroundColor: '#0f172a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8', marginBottom: '6px' }}>
              <span>Distribución de Intervenciones:</span>
              <span>
                🟢 Preventivos ({stats.pctPreventivo}%) | 🔴 Correctivos ({stats.pctCorrectivo}%) | 🔵 Instalaciones ({stats.pctInstalacion}%) | 🟣 Otros ({stats.pctOtros}%)
              </span>
            </div>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#334155' }}>
              <div style={{ width: `${stats.pctPreventivo}%`, backgroundColor: '#10b981' }} title={`Preventivos: ${stats.preventivos}`} />
              <div style={{ width: `${stats.pctCorrectivo}%`, backgroundColor: '#ef4444' }} title={`Correctivos: ${stats.correctivos}`} />
              <div style={{ width: `${stats.pctInstalacion}%`, backgroundColor: '#38bdf8' }} title={`Instalaciones: ${stats.instalaciones}`} />
              <div style={{ width: `${stats.pctOtros}%`, backgroundColor: '#c084fc' }} title={`Otros: ${stats.otros}`} />
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="div-buscar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
          {/* Universal Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por Nº reporte, serie, equipo, tipo, IPS o responsable..."
              onChange={(e) => setBuscar(e.target.value)}
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

          {/* Filter by IPS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', margin: 0 }}>IPS:</label>
            <select
              value={filtroIps}
              onChange={(e) => setFiltroIps(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #334155',
                fontSize: '13px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
                maxWidth: '200px',
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

          {/* Filter by Año */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', margin: 0 }}>Año:</label>
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #334155',
                fontSize: '13px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <option value="TODOS">Todos los Años</option>
              {uniqueAniosList.map((yr, idx) => (
                <option key={idx} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Tipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#cbd5e1', margin: 0 }}>Tipo:</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #334155',
                fontSize: '13px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="MTTO PREVENTIVO">🟢 Preventivo</option>
              <option value="MTTO CORRECTIVO">🔴 Correctivo</option>
              <option value="INSTALACION">🔵 Instalación</option>
              <option value="OTRO">🟣 Otros</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '16px' }}>
            <FaSync className="fa-spin" style={{ marginRight: '8px' }} /> Cargando histórico de reportes...
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
                        No se encontraron reportes con los filtros seleccionados.
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
