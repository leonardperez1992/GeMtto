import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiInventario, apiIps } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import {
  MESES_DEL_ANIO,
  MESES_ABREV,
  obtenerMesesEquipo,
} from '../utils/cronogramaHelper';
import {
  FaCalendarAlt,
  FaPrint,
  FaFileExcel,
  FaFilter,
  FaLayerGroup,
  FaTools,
} from 'react-icons/fa';
import { GoEye, GoSearch } from 'react-icons/go';

function Cronograma() {
  const user = useSelector((state) => state.auth?.user || null);

  const [inventario, setInventario] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedIps, setSelectedIps] = useState('');
  const [selectedServicio, setSelectedServicio] = useState('');
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedPeriodicidad, setSelectedPeriodicidad] = useState('');
  const [buscar, setBuscar] = useState('');
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear().toString());

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
      console.error('Error al obtener lista de IPS:', e);
    }
  };

  const fetchInventario = async () => {
    setLoading(true);
    try {
      const response = await request({
        link: apiInventario,
        method: 'GET',
      });
      if (response && response.success && response.inventario) {
        setInventario(response.inventario);
      }
    } catch (e) {
      console.error('Error al cargar inventario para cronograma:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
    fetchInventario();
  }, []);

  // Si el usuario es tipo 'user' y tiene institución asignada, inicializar el filtro
  useEffect(() => {
    if (user?.rol === 'user' && user?.institucion && !selectedIps) {
      setSelectedIps(user.institucion);
    }
  }, [user, selectedIps]);

  // Lista única y combinada de IPS disponibles (desde la colección IPS + valores de institucion en inventario)
  const ipsDisponibles = useMemo(() => {
    const set = new Set();
    listaIps.forEach((item) => {
      const val = typeof item === 'string' ? item : item.ips || item.nombre || item.institucion;
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    });
    inventario.forEach((eq) => {
      if (eq.institucion && typeof eq.institucion === 'string' && eq.institucion.trim()) {
        set.add(eq.institucion.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [listaIps, inventario]);

  // Lista única de Servicios disponibles según los equipos cargados
  const serviciosDisponibles = useMemo(() => {
    const set = new Set();
    inventario.forEach((eq) => {
      if (
        selectedIps &&
        (eq.institucion || '').trim().toLowerCase() !== selectedIps.trim().toLowerCase()
      ) {
        return;
      }
      if (eq.servicio && eq.servicio.trim()) {
        set.add(eq.servicio.trim());
      }
    });
    return Array.from(set).sort();
  }, [inventario, selectedIps]);

  // Procesamiento de datos de los equipos con sus meses
  const equiposConCronograma = useMemo(() => {
    return inventario.map((eq) => {
      const crono = obtenerMesesEquipo(eq);
      return {
        ...eq,
        _cronoMeses: crono.array,
        _cronoNombres: crono.nombres,
        _cronoIndices: crono.indices,
      };
    });
  }, [inventario]);

  // Filtrado reactivo de equipos
  const filteredEquipos = useMemo(() => {
    return equiposConCronograma.filter((eq) => {
      // Filtro por IPS
      if (
        selectedIps &&
        (eq.institucion || '').trim().toLowerCase() !== selectedIps.trim().toLowerCase()
      ) {
        return false;
      }
      // Filtro por Servicio
      if (selectedServicio && eq.servicio !== selectedServicio) {
        return false;
      }
      // Filtro por Mes
      if (selectedMes && !eq._cronoMeses.includes(selectedMes)) {
        return false;
      }
      // Filtro por Periodicidad
      if (selectedPeriodicidad && eq.periodicidad !== selectedPeriodicidad) {
        return false;
      }
      // Filtro por texto de búsqueda
      if (buscar.trim()) {
        const q = buscar.toLowerCase();
        const match =
          (eq.equipo && eq.equipo.toLowerCase().includes(q)) ||
          (eq.marca && eq.marca.toLowerCase().includes(q)) ||
          (eq.modelo && eq.modelo.toLowerCase().includes(q)) ||
          (eq.serie && eq.serie.toLowerCase().includes(q)) ||
          (eq.servicio && eq.servicio.toLowerCase().includes(q)) ||
          (eq.responsable && eq.responsable.toLowerCase().includes(q)) ||
          (eq.institucion && eq.institucion.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [
    equiposConCronograma,
    selectedIps,
    selectedServicio,
    selectedMes,
    selectedPeriodicidad,
    buscar,
  ]);

  // Paginación
  const paginatedEquipos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEquipos.slice(start, start + itemsPerPage);
  }, [filteredEquipos, currentPage, itemsPerPage]);

  // Estadísticas del cronograma
  const estadisticas = useMemo(() => {
    const total = filteredEquipos.length;
    const mesActualIndex = new Date().getMonth();
    const nombreMesActual = MESES_DEL_ANIO[mesActualIndex];

    const esteMesCount = filteredEquipos.filter((eq) =>
      eq._cronoMeses.includes(selectedMes || nombreMesActual)
    ).length;

    const semestrales = filteredEquipos.filter((eq) =>
      (eq.periodicidad || '').toUpperCase().includes('SEMESTRAL')
    ).length;

    const trimestrales = filteredEquipos.filter((eq) =>
      (eq.periodicidad || '').toUpperCase().includes('TRIMESTRAL')
    ).length;

    return {
      total,
      esteMesCount,
      mesFocoNombre: selectedMes || nombreMesActual,
      semestrales,
      trimestrales,
    };
  }, [filteredEquipos, selectedMes]);

  // Logo de la IPS seleccionada para la impresión oficial
  const ipsActualData = useMemo(() => {
    if (!selectedIps) return null;
    return (
      listaIps.find(
        (i) => (i.ips || i.nombre || i.institucion || '').toLowerCase() === selectedIps.toLowerCase()
      ) || null
    );
  }, [selectedIps, listaIps]);

  // Exportar a formato CSV / Excel
  const exportarCSV = () => {
    if (filteredEquipos.length === 0) {
      alert('No hay equipos en el cronograma para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      '#',
      'IPS / INSTITUCION',
      'EQUIPO',
      'MARCA',
      'MODELO',
      'SERIE',
      'SERVICIO',
      'UBICACION',
      'PERIODICIDAD',
      'ENE',
      'FEB',
      'MAR',
      'ABR',
      'MAY',
      'JUN',
      'JUL',
      'AGO',
      'SEP',
      'OCT',
      'NOV',
      'DIC',
      'RESPONSABLE',
    ];

    const rows = filteredEquipos.map((eq, index) => {
      const matrizMeses = MESES_DEL_ANIO.map((m) =>
        eq._cronoMeses.includes(m) ? 'P' : ''
      );

      return [
        index + 1,
        `"${(eq.institucion || '').replace(/"/g, '""')}"`,
        `"${(eq.equipo || '').replace(/"/g, '""')}"`,
        `"${(eq.marca || '').replace(/"/g, '""')}"`,
        `"${(eq.modelo || '').replace(/"/g, '""')}"`,
        `"${(eq.serie || '').replace(/"/g, '""')}"`,
        `"${(eq.servicio || '').replace(/"/g, '""')}"`,
        `"${(eq.ubicacion || '').replace(/"/g, '""')}"`,
        `"${(eq.periodicidad || 'SEMESTRAL').replace(/"/g, '""')}"`,
        ...matrizMeses.map((m) => `"${m}"`),
        `"${(eq.responsable || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const nombreArchivo = `Cronograma_Mantenimiento_${selectedIps || 'General'}_${selectedAnio}.csv`;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPeriodicidadBadgeStyle = (per) => {
    const p = String(per || '').toUpperCase();
    if (p.includes('MENSUAL')) return { bg: '#831843', text: '#fbcfe8', border: '#db2777' };
    if (p.includes('BIMESTRAL')) return { bg: '#701a75', text: '#f5d0fe', border: '#c026d3' };
    if (p.includes('TRIMESTRAL')) return { bg: '#581c87', text: '#e9d5ff', border: '#9333ea' };
    if (p.includes('CUATRIMESTRAL')) return { bg: '#1e3a8a', text: '#bfdbfe', border: '#3b82f6' };
    if (p.includes('SEMESTRAL')) return { bg: '#064e3b', text: '#a7f3d0', border: '#10b981' };
    if (p.includes('ANUAL')) return { bg: '#78350f', text: '#fde68a', border: '#f59e0b' };
    return { bg: '#1e293b', text: '#94a3b8', border: '#475569' };
  };

  return (
    <div className="contenedor vista-cronograma" style={{ maxWidth: '1350px', margin: '0 auto', padding: '20px 15px' }}>
      {/* ==========================================================
          HEADER INSTITUCIONAL Y ACCIONES SUPERIORES (NO-PRINT)
          ========================================================== */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '18px 24px',
          borderRadius: '12px',
          border: '1.5px solid #334155',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px', fontWeight: '800' }}>
            <FaCalendarAlt color="#38bdf8" /> Cronograma de Mantenimiento Preventivo {selectedAnio}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
            Planificación y programación periódica de mantenimientos de equipos biomédicos por meses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportarCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: '1px solid #10b981',
              padding: '9px 18px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
            title="Exportar cronograma filtrado a Excel / CSV"
          >
            <FaFileExcel size={15} /> Exportar Excel / CSV
          </button>

          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              padding: '9px 18px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
            title="Imprimir formato oficial de cronograma institucional"
          >
            <FaPrint size={15} /> Imprimir Cronograma
          </button>
        </div>
      </div>

      {/* ==========================================================
          TARJETAS DE RESUMEN Y ESTADÍSTICAS (NO-PRINT)
          ========================================================== */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '10px', color: '#38bdf8' }}>
            <FaLayerGroup size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Equipos Programados
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
              {estadisticas.total}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '10px', color: '#10b981' }}>
            <FaCalendarAlt size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Mttos. en {estadisticas.mesFocoNombre}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>
              {estadisticas.esteMesCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '10px', color: '#c084fc' }}>
            <FaTools size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Semestrales / Trimestrales
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>
              {estadisticas.semestrales} / {estadisticas.trimestrales}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          BARRA DE FILTROS AVANZADOS (NO-PRINT)
          ========================================================== */}
      <div
        className="no-print"
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter /> Filtros del Cronograma:
          </div>
          {(selectedIps || selectedServicio || selectedMes || selectedPeriodicidad || buscar) && (
            <button
              onClick={() => {
                if (user?.rol !== 'user') setSelectedIps('');
                setSelectedServicio('');
                setSelectedMes('');
                setSelectedPeriodicidad('');
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
              }}
            >
              Restablecer Filtros
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          {/* 1. Filtro IPS */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
              Institución / IPS:
            </label>
            <select
              value={selectedIps}
              onChange={(e) => {
                setSelectedIps(e.target.value);
                setSelectedServicio('');
                setCurrentPage(1);
              }}
              disabled={user?.rol === 'user' && !!user?.institucion}
              className="input-report"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">-- Todas las Instituciones / IPS --</option>
              {ipsDisponibles.map((nombreIps) => (
                <option key={nombreIps} value={nombreIps}>
                  {nombreIps}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filtro Servicio */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
              Servicio / Área:
            </label>
            <select
              value={selectedServicio}
              onChange={(e) => {
                setSelectedServicio(e.target.value);
                setCurrentPage(1);
              }}
              className="input-report"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">-- Todos los Servicios --</option>
              {serviciosDisponibles.map((srv) => (
                <option key={srv} value={srv}>
                  {srv}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filtro Mes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
              Mes de Mantenimiento:
            </label>
            <select
              value={selectedMes}
              onChange={(e) => {
                setSelectedMes(e.target.value);
                setCurrentPage(1);
              }}
              className="input-report"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">-- Todos los Meses --</option>
              {MESES_DEL_ANIO.map((mes) => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filtro Periodicidad */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
              Periodicidad:
            </label>
            <select
              value={selectedPeriodicidad}
              onChange={(e) => {
                setSelectedPeriodicidad(e.target.value);
                setCurrentPage(1);
              }}
              className="input-report"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">-- Todas las Periodicidades --</option>
              <option value="MENSUAL">MENSUAL</option>
              <option value="BIMESTRAL">BIMESTRAL</option>
              <option value="TRIMESTRAL">TRIMESTRAL</option>
              <option value="CUATRIMESTRAL">CUATRIMESTRAL</option>
              <option value="SEMESTRAL">SEMESTRAL</option>
              <option value="ANUAL">ANUAL</option>
            </select>
          </div>

          {/* 5. Filtro Año */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
              Año del Cronograma:
            </label>
            <select
              value={selectedAnio}
              onChange={(e) => setSelectedAnio(e.target.value)}
              className="input-report"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>

          {/* 6. Buscador de Texto */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
              Búsqueda Rápida:
            </label>
            <div style={{ position: 'relative' }}>
              <GoSearch
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="text"
                placeholder="Equipo, marca, serie, responsable..."
                value={buscar}
                onChange={(e) => {
                  setBuscar(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          ENCABEZADO EXCLUSIVO PARA IMPRESIÓN OFICIAL (PRINT ONLY)
          ========================================================== */}
      <div className="encabezado-impresion-cronograma">
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f3b60', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '22%', textAlign: 'center', padding: '8px', verticalAlign: 'middle', borderRight: '1px solid #0f3b60' }}>
                {ipsActualData?.logo ? (
                  <img src={ipsActualData.logo} alt="Logo IPS" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontWeight: '800', color: '#0f3b60', fontSize: '13px' }}>
                    {selectedIps || user?.institucion || 'GEMTTO BIOMÉDICA'}
                  </div>
                )}
              </td>
              <td style={{ width: '56%', textAlign: 'center', padding: '6px', borderRight: '1px solid #0f3b60' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f3b60', textTransform: 'uppercase' }}>
                  CRONOGRAMA ANUAL DE MANTENIMIENTO PREVENTIVO
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                  EQUIPOS BIOMÉDICOS Y TECNOLOGÍA EN SALUD - AÑO {selectedAnio}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                  <strong>INSTITUCIÓN:</strong> {selectedIps || 'Todas las Sedes / IPS'} &nbsp;|&nbsp; <strong>SERVICIO:</strong> {selectedServicio || 'Todos los Servicios'}
                </div>
              </td>
              <td style={{ width: '22%', fontSize: '9px', padding: '6px', lineHeight: '1.4', verticalAlign: 'middle' }}>
                <div><strong>CÓDIGO:</strong> CRON-BM-01</div>
                <div><strong>VERSIÓN:</strong> 03</div>
                <div><strong>FECHA:</strong> {new Date().toLocaleDateString('es-CO')}</div>
                <div><strong>PÁGINA:</strong> 1 de 1</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==========================================================
          TABLA PRINCIPAL DE CRONOGRAMA
          ========================================================== */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-documento tabla-cronograma-completa" style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f3b60', color: '#ffffff', textAlign: 'left', fontSize: '12px' }}>
                <th style={{ width: '3%', padding: '10px 6px', textAlign: 'center' }}>#</th>
                <th style={{ width: '13%', padding: '10px 6px' }}>IPS / INSTITUCIÓN</th>
                <th style={{ width: '16%', padding: '10px 6px' }}>EQUIPO</th>
                <th style={{ width: '9%', padding: '10px 6px' }}>MARCA</th>
                <th style={{ width: '9%', padding: '10px 6px' }}>MODELO</th>
                <th style={{ width: '10%', padding: '10px 6px' }}>SERIE</th>
                <th style={{ width: '11%', padding: '10px 6px' }}>SERVICIO</th>
                <th style={{ width: '9%', padding: '10px 6px', textAlign: 'center' }}>PERIODICIDAD</th>
                {/* 12 Meses Matriz con texto en orientación vertical hacia arriba */}
                {MESES_ABREV.map((abrev) => (
                  <th
                    key={abrev}
                    className="th-mes-vertical"
                    style={{
                      width: '28px',
                      minWidth: '26px',
                      maxWidth: '30px',
                      padding: '6px 1px',
                      textAlign: 'center',
                      verticalAlign: 'bottom',
                      height: '50px',
                      borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <span
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        margin: '0 auto',
                        fontWeight: '800',
                        fontSize: '10.5px',
                        letterSpacing: '1px',
                        lineHeight: '1',
                      }}
                    >
                      {abrev}
                    </span>
                  </th>
                ))}
                <th style={{ width: '12%', padding: '10px 6px' }}>RESPONSABLE</th>
                <th className="no-print" style={{ width: '4%', padding: '10px 6px', textAlign: 'center' }}>VER</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={22} style={{ textAlign: 'center', padding: '40px', color: '#38bdf8' }}>
                    <FaCalendarAlt size={28} style={{ animation: 'spin 2s linear infinite', marginBottom: '10px' }} />
                    <div>Cargando cronograma de mantenimiento...</div>
                  </td>
                </tr>
              ) : filteredEquipos.length === 0 ? (
                <tr>
                  <td colSpan={22} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No se encontraron equipos biomédicos para los criterios de búsqueda y filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedEquipos.map((eq, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const badge = getPeriodicidadBadgeStyle(eq.periodicidad);

                  return (
                    <tr
                      key={eq._id}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 41, 59, 0.6)',
                        borderBottom: '1px solid #334155',
                        fontSize: '12.5px',
                      }}
                    >
                      {/* 1. Consecutivo */}
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#94a3b8' }}>
                        {globalIndex}
                      </td>

                      {/* 2. IPS */}
                      <td style={{ color: '#38bdf8', fontWeight: '600', fontSize: '12px' }}>
                        {eq.institucion || '-'}
                      </td>

                      {/* 3. Equipo */}
                      <td style={{ fontWeight: '700', color: '#ffffff' }}>
                        {eq.equipo}
                      </td>

                      {/* 4. Marca */}
                      <td style={{ color: '#cbd5e1' }}>
                        {eq.marca}
                      </td>

                      {/* 5. Modelo */}
                      <td style={{ color: '#cbd5e1' }}>
                        {eq.modelo}
                      </td>

                      {/* 6. Serie */}
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                        {eq.serie}
                      </td>

                      {/* 7. Servicio */}
                      <td style={{ color: '#e2e8f0' }}>
                        {eq.servicio}
                      </td>

                      {/* 8. Periodicidad */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {eq.periodicidad || 'SEMESTRAL'}
                        </span>
                      </td>

                      {/* 9. Matriz de 12 Meses */}
                      {MESES_DEL_ANIO.map((nombreMes, mIdx) => {
                        const isScheduled = eq._cronoMeses.includes(nombreMes);
                        return (
                          <td
                            key={nombreMes}
                            className="td-mes-matriz"
                            style={{
                              textAlign: 'center',
                              padding: '5px 1px',
                              backgroundColor: isScheduled ? 'rgba(2, 132, 199, 0.25)' : 'transparent',
                              borderLeft: '1px solid #334155',
                              width: '28px',
                              minWidth: '26px',
                              maxWidth: '30px',
                            }}
                          >
                            {isScheduled ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  fontWeight: '900',
                                  fontSize: '10px',
                                  width: '18px',
                                  height: '18px',
                                  lineHeight: '18px',
                                  borderRadius: '50%',
                                  boxShadow: '0 0 6px rgba(56, 189, 248, 0.6)',
                                }}
                                title={`${nombreMes}: Mantenimiento Programado`}
                              >
                                P
                              </span>
                            ) : (
                              <span style={{ color: '#475569', fontSize: '10px' }}>-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* 10. Responsable */}
                      <td style={{ color: '#cbd5e1', fontSize: '12px' }}>
                        {eq.responsable || 'GEMTTO BIOMÉDICA SAS'}
                      </td>

                      {/* 11. Acciones (Ver Hoja de Vida) */}
                      <td className="no-print" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <Link
                          to={user?.rol === 'user' ? `/hojadevidausuario?id=${eq._id}` : `/hojadevida?id=${eq._id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                          title="Ver Hoja de Vida"
                        >
                          <GoEye size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación (Oculta en Impresión) */}
        <div className="no-print" style={{ padding: '12px 18px', borderTop: '1px solid #334155' }}>
          <Pagination
            totalItems={filteredEquipos.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[15, 25, 50, 100]}
          />
        </div>
      </div>

      {/* ==========================================================
          BLOQUE DE FIRMAS PARA FORMATO OFICIAL (PRINT ONLY)
          ========================================================== */}
      <div className="bloque-firmas-cronograma-print" style={{ marginTop: '28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', padding: '16px', verticalAlign: 'bottom' }}>
                <div style={{ borderTop: '1.5px solid #0f172a', width: '80%', margin: '0 auto 6px auto' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
                  ING. BIOMÉDICO / RESPONSABLE TÉCNICO
                </div>
                <div style={{ fontSize: '10px', color: '#475569' }}>
                  GEMTTO SAS • Mantenimiento & Metrología Biomédica
                </div>
              </td>
              <td style={{ width: '50%', textAlign: 'center', padding: '16px', verticalAlign: 'bottom' }}>
                <div style={{ borderTop: '1.5px solid #0f172a', width: '80%', margin: '0 auto 6px auto' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
                  DIRECCIÓN MÉDICA / COORDINACIÓN DE ÁREA
                </div>
                <div style={{ fontSize: '10px', color: '#475569' }}>
                  {selectedIps || user?.institucion || 'Institución Prestadora de Salud (IPS)'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Cronograma;
