import React, { useEffect, useState, useMemo } from 'react';
import request from '../utils/request';
import { apiReportes, apiIps } from '../utils/api';
import ExportJsonExcel from 'js-export-excel';
import Pagination from '../components/Pagination';
import {
  FaChartPie,
  FaFileExcel,
  FaCheckCircle,
  FaTools,
  FaWrench,
  FaCogs,
  FaSync,
  FaCalendarAlt,
  FaHospital,
} from 'react-icons/fa';
import { GoSearch, GoEye } from 'react-icons/go';
import { Link } from 'react-router-dom';

function Informes() {
  const [reportes, setReportes] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroIps, setFiltroIps] = useState('TODAS');
  const [filtroAnio, setFiltroAnio] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const getReportes = async () => {
    setLoading(true);
    try {
      const response = await request({
        link: apiReportes,
        method: 'GET',
      });
      if (response && response.success && response.reporte) {
        setReportes(response.reporte);
      }
    } catch (e) {
      console.error(e);
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

  const descartadosRepuestos = [
    '',
    ' ',
    'NA',
    'N/A',
    'N.A',
    'N.A.',
    'NO APLICA',
    'NO',
    'NINGUNO',
    'NINGUNA',
    'NO TIENE',
    'NO REQUIERE',
    'NO SE REQUIERE',
    'NO SE REQUIEREN',
    'NO PRESENTA',
    'SIN REPUESTOS',
    'SIN REPUESTO',
    '0',
    '-',
    '--',
    '---',
    '.',
    '..',
    'NULL',
    'UNDEFINED',
  ];

  const esRepuestoValido = (desc) => {
    if (!desc) return false;
    const d = String(desc).trim().toUpperCase();
    if (d.length === 0) return false;
    return !descartadosRepuestos.includes(d);
  };

  const extraerRepuestosInfo = (r) => {
    const items = [];
    for (let i = 1; i <= 4; i++) {
      const desc = r[`descripcion${i}`];
      const cant = r[`cantidad${i}`];
      if (esRepuestoValido(desc)) {
        items.push({
          descripcion: String(desc).trim(),
          cantidad: cant !== undefined && cant !== null && String(cant).trim() !== '' ? String(cant).trim() : '1',
        });
      }
    }
    if (Array.isArray(r.repuestos)) {
      r.repuestos.forEach((rep) => {
        const desc = rep.descripcion || rep.nombre;
        const cant = rep.cantidad;
        if (esRepuestoValido(desc)) {
          items.push({
            descripcion: String(desc).trim(),
            cantidad: cant !== undefined && cant !== null && String(cant).trim() !== '' ? String(cant).trim() : '1',
          });
        }
      });
    }

    if (items.length === 0) {
      return {
        repuestos: 'SIN REPUESTOS',
        cantidades: 'N/A',
      };
    }

    return {
      repuestos: items.map((x) => x.descripcion).join(', '),
      cantidades: items.map((x) => x.cantidad).join(', '),
    };
  };

  // Descarga optimizada a Excel
  const downloadFileToExcel = () => {
    const dataToExport = filteredReportes.length > 0 ? filteredReportes : reportes;
    if (dataToExport.length === 0) {
      alert('No hay registros de reportes para exportar.');
      return;
    }

    const dataTable = dataToExport.map((r) => {
      const { repuestos, cantidades } = extraerRepuestosInfo(r);
      return {
        Fecha: r.fecha || '',
        Numero_Reporte: r.numero_reporte || '',
        Equipo: r.equipo || '',
        Marca: r.marca || '',
        Modelo: r.modelo || '',
        Serie: r.serie || '',
        Institucion: r.institucion || '',
        Servicio: r.servicio || '',
        Tipo_Mantenimiento: r.tipo_servicio || '',
        Repuestos_Instalados: repuestos,
        Cantidades: cantidades,
      };
    });

    const ipsLabel = filtroIps !== 'TODAS' ? `_${filtroIps.replace(/\s+/g, '_')}` : '';
    const anioLabel = filtroAnio !== 'TODOS' ? `_${filtroAnio}` : '';
    const fileName = `GEMTTO_Informe_Mantenimiento${ipsLabel}${anioLabel}_${new Date().toISOString().split('T')[0]}`;

    const option = {
      fileName: fileName,
      datas: [
        {
          sheetData: dataTable,
          sheetName: 'Informe_Mantenimientos',
          sheetHeader: [
            'Fecha',
            'Número de Reporte',
            'Equipo',
            'Marca',
            'Modelo',
            'Serie',
            'Institución',
            'Servicio',
            'Tipo de Mantenimiento',
            'Repuestos Instalados',
            'Cantidades',
          ],
          sheetFilter: [
            'Fecha',
            'Numero_Reporte',
            'Equipo',
            'Marca',
            'Modelo',
            'Serie',
            'Institucion',
            'Servicio',
            'Tipo_Mantenimiento',
            'Repuestos_Instalados',
            'Cantidades',
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
            padding: '2px 6px',
            borderRadius: '5px',
            fontSize: '10.5px',
            fontWeight: '700',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <FaCheckCircle size={10} /> PREVENTIVO
        </span>
      );
    }
    if (t.includes('CORRECTIVO')) {
      return (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '5px',
            fontSize: '10.5px',
            fontWeight: '700',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <FaTools size={10} /> CORRECTIVO
        </span>
      );
    }
    if (t.includes('INSTALAC')) {
      return (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '5px',
            fontSize: '10.5px',
            fontWeight: '700',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <FaWrench size={10} /> INSTALACIÓN
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '2px 6px',
          borderRadius: '5px',
          fontSize: '10.5px',
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
    <div className="contenedor" style={{ width: '100%', maxWidth: '100%', padding: '16px 12px', boxSizing: 'border-box' }}>
      <main style={{ width: '100%' }}>
        {/* Header Title & Prominent Download Action */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
              <FaChartPie color="#38bdf8" /> Informes y Dashboard de Gestión Biomédica
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Consolidado de intervenciones, auditoría técnica e indicadores de mantenimiento preventivo y correctivo.
            </p>
          </div>

          {/* BOTÓN PROMINENTE DE DESCARGA EXCEL */}
          <div>
            <button
              onClick={downloadFileToExcel}
              disabled={loading || reportes.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: '1.5px solid #34d399',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: loading || reportes.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              <FaFileExcel size={16} color="#ffffff" />
              <span>Descargar Informe Excel (.xlsx)</span>
              <span
                style={{
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                }}
              >
                {filteredReportes.length} regs
              </span>
            </button>
          </div>
        </div>

        {/* DASHBOARD: HISTÓRICOS Y KPIs DE MANTENIMIENTO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          {/* Card: Total */}
          <div
            onClick={() => setFiltroTipo('TODOS')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: filtroTipo === 'TODOS' ? '#1e3a8a' : '#1e293b',
              border: filtroTipo === 'TODOS' ? '2px solid #38bdf8' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                TOTAL SERVICIOS
              </span>
              <FaChartPie color="#38bdf8" size={13} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filtroIps === 'TODAS' ? 'Todas las IPS' : filtroIps}
            </div>
          </div>

          {/* Card: Preventivo */}
          <div
            onClick={() => setFiltroTipo('MTTO PREVENTIVO')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: filtroTipo === 'MTTO PREVENTIVO' ? '#052e16' : '#1e293b',
              border: filtroTipo === 'MTTO PREVENTIVO' ? '2px solid #10b981' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#86efac', fontWeight: '700' }}>
                PREVENTIVOS
              </span>
              <FaCheckCircle color="#86efac" size={13} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
              {stats.preventivos}
            </div>
            <div style={{ fontSize: '11px', color: '#86efac', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctPreventivo}% del total
            </div>
          </div>

          {/* Card: Correctivo */}
          <div
            onClick={() => setFiltroTipo('MTTO CORRECTIVO')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: filtroTipo === 'MTTO CORRECTIVO' ? '#450a0a' : '#1e293b',
              border: filtroTipo === 'MTTO CORRECTIVO' ? '2px solid #ef4444' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: '700' }}>
                CORRECTIVOS
              </span>
              <FaTools color="#fca5a5" size={13} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginTop: '2px' }}>
              {stats.correctivos}
            </div>
            <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctCorrectivo}% del total
            </div>
          </div>

          {/* Card: Instalaciones */}
          <div
            onClick={() => setFiltroTipo('INSTALACION')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: filtroTipo === 'INSTALACION' ? '#0c4a6e' : '#1e293b',
              border: filtroTipo === 'INSTALACION' ? '2px solid #38bdf8' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#7dd3fc', fontWeight: '700' }}>
                INSTALACIONES
              </span>
              <FaWrench color="#7dd3fc" size={13} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>
              {stats.instalaciones}
            </div>
            <div style={{ fontSize: '11px', color: '#7dd3fc', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctInstalacion}% del total
            </div>
          </div>

          {/* Card: Otros */}
          <div
            onClick={() => setFiltroTipo('OTRO')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: filtroTipo === 'OTRO' ? '#3b0764' : '#1e293b',
              border: filtroTipo === 'OTRO' ? '2px solid #c084fc' : '1px solid #334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#d8b4fe', fontWeight: '700' }}>
                OTROS
              </span>
              <FaCogs color="#d8b4fe" size={13} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#c084fc', marginTop: '2px' }}>
              {stats.otros}
            </div>
            <div style={{ fontSize: '11px', color: '#d8b4fe', fontWeight: '600', marginTop: '2px' }}>
              {stats.pctOtros}% del total
            </div>
          </div>
        </div>

        {/* Visual Distribution Bar */}
        {stats.total > 0 && (
          <div style={{ marginBottom: '16px', backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>
              <span>Distribución de Servicios:</span>
              <span>
                🟢 Preventivos ({stats.pctPreventivo}%) | 🔴 Correctivos ({stats.pctCorrectivo}%) | 🔵 Instalaciones ({stats.pctInstalacion}%) | 🟣 Otros ({stats.pctOtros}%)
              </span>
            </div>
            <div style={{ display: 'flex', height: '7px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#334155' }}>
              <div style={{ width: `${stats.pctPreventivo}%`, backgroundColor: '#10b981' }} title={`Preventivos: ${stats.preventivos}`} />
              <div style={{ width: `${stats.pctCorrectivo}%`, backgroundColor: '#ef4444' }} title={`Correctivos: ${stats.correctivos}`} />
              <div style={{ width: `${stats.pctInstalacion}%`, backgroundColor: '#38bdf8' }} title={`Instalaciones: ${stats.instalaciones}`} />
              <div style={{ width: `${stats.pctOtros}%`, backgroundColor: '#c084fc' }} title={`Otros: ${stats.otros}`} />
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="div-buscar" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
          {/* Universal Search Box */}
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '36px', height: '36px', fontSize: '12.5px' }}
              value={buscar}
              placeholder="Buscar por Nº reporte, serie, equipo, tipo, IPS o responsable..."
              onChange={(e) => setBuscar(e.target.value)}
            />
            <GoSearch
              size={16}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#38bdf8',
              }}
            />
          </div>

          {/* Filter by IPS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', margin: 0 }}>
              <FaHospital style={{ marginRight: '3px' }} /> IPS:
            </label>
            <select
              value={filtroIps}
              onChange={(e) => setFiltroIps(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '12px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
                maxWidth: '180px',
                height: '36px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', margin: 0 }}>
              <FaCalendarAlt style={{ marginRight: '3px' }} /> Año:
            </label>
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '12px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
                height: '36px',
              }}
            >
              <option value="TODOS">Todos</option>
              {uniqueAniosList.map((yr, idx) => (
                <option key={idx} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Tipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#cbd5e1', margin: 0 }}>Tipo:</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '12px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                cursor: 'pointer',
                height: '36px',
              }}
            >
              <option value="TODOS">Todos</option>
              <option value="MTTO PREVENTIVO">🟢 Preventivo</option>
              <option value="MTTO CORRECTIVO">🔴 Correctivo</option>
              <option value="INSTALACION">🔵 Instalación</option>
              <option value="OTRO">🟣 Otros</option>
            </select>
          </div>
        </div>

        {/* Table Content: Compact, 100% Screen Fitted */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '15px' }}>
            <FaSync className="fa-spin" style={{ marginRight: '8px' }} /> Cargando consolidado de informes...
          </div>
        ) : (
          <div>
            <div style={{ width: '100%', overflowX: 'hidden', borderRadius: '8px', border: '1px solid #334155', boxSizing: 'border-box' }}>
              <table className="tabla-reportes" style={{ margin: 0, width: '100%', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>REPORTE / FECHA</th>
                    <th style={{ width: '115px' }}>TIPO SERVICIO</th>
                    <th>EQUIPO & MARCA/MODELO</th>
                    <th style={{ width: '100px' }}>SERIE</th>
                    <th>INSTITUCIÓN (IPS) & SERVICIO</th>
                    <th style={{ width: '85px', textAlign: 'center' }}>ESTADO</th>
                    <th>RESPONSABLE</th>
                    <th style={{ textAlign: 'center', width: '50px' }}>VER</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportes.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron registros con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedReportes.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div>
                            <strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px' }}>
                              #{item?.numero_reporte}
                            </strong>
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {item?.fecha || '-'}
                          </div>
                        </td>
                        <td>{renderBadgeTipo(item?.tipo_servicio)}</td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#f8fafc' }}>{item?.equipo}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {item?.marca || ''} {item?.modelo ? `• ${item?.modelo}` : ''}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8', fontSize: '11.5px' }}>
                            {item?.serie}
                          </span>
                        </td>
                        <td>
                          <div style={{ color: '#38bdf8', fontWeight: '600' }}>{item?.institucion || '-'}</div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{item?.servicio || '-'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 5px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(34, 197, 94, 0.12)',
                              color: '#86efac',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              display: 'inline-block',
                            }}
                          >
                            {item?.estado_final || 'OPERATIVO'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#cbd5e1', fontSize: '11.5px' }}>
                            {item?.nombre_ingeniero || 'No registrado'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Link
                            to={`/reporte?id=${item._id}`}
                            title="Ver / Imprimir Reporte PDF"
                            className="action-btn action-btn-view"
                            style={{ padding: '4px 7px' }}
                          >
                            <GoEye size={14} color="#38bdf8" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: '14px' }}>
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

export default Informes;
