import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { apiInventario, apiIps, apiObtenerEquiposIps } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import {
  MESES_DEL_ANIO,
  MESES_ABREV,
  obtenerMesesEquipo,
  tienePeriodicidadDefinida,
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
import { HiOutlineDocumentPlus } from 'react-icons/hi2';

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

function Cronograma() {
  const reduxUser = useSelector((state) => state.user);
  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);
  const user = reduxUser || storedUser || {};
  const isPathUser = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('user');
  const isAdmin = !isPathUser && String(user?.rol || '').trim().toLowerCase() === 'admin';
  const isNonAdmin = !isAdmin;
  const userInstitucion = String(user?.institucion || user?.ips || user?.empresa || '').trim();

  const [inventario, setInventario] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedIps, setSelectedIps] = useState(isNonAdmin ? userInstitucion : '');
  const [selectedServicio, setSelectedServicio] = useState('');
  const [selectedMes, setSelectedMes] = useState('');
  const [buscar, setBuscar] = useState('');
  const selectedAnio = new Date().getFullYear().toString();

  // Paginación
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

  const fetchInventario = async () => {
    setLoading(true);
    try {
      if (isNonAdmin) {
        if (!userInstitucion) {
          setInventario([]);
          setLoading(false);
          return;
        }
        const response = await request({
          link: `${apiObtenerEquiposIps}?institucion=${encodeURIComponent(userInstitucion)}`,
          method: 'GET',
        });
        if (response && response.success && Array.isArray(response.equipos) && response.equipos.length > 0) {
          setInventario(response.equipos);
        } else {
          // Fallback: si el backend no coincide con el regex, consultar inventario y filtrar estrictamente en frontend
          const fallbackRes = await request({ link: apiInventario, method: 'GET' });
          if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.inventario)) {
            const soloUser = fallbackRes.inventario.filter((eq) =>
              matchesInstitucion(eq.institucion, userInstitucion)
            );
            setInventario(soloUser);
          } else {
            setInventario([]);
          }
        }
      } else {
        const response = await request({
          link: apiInventario,
          method: 'GET',
        });
        if (response && response.success && response.inventario) {
          setInventario(response.inventario);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, userInstitucion]);

  // Si el usuario no es admin y tiene institución asignada, inicializar el filtro
  useEffect(() => {
    if (isNonAdmin && userInstitucion) {
      setSelectedIps(userInstitucion);
    }
  }, [isNonAdmin, userInstitucion]);

  // Lista única y combinada de IPS disponibles (desde la colección IPS + valores de institucion en inventario)
  const ipsDisponibles = useMemo(() => {
    if (isNonAdmin && userInstitucion) {
      return [userInstitucion];
    }
    if (isNonAdmin) {
      return [];
    }
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
  }, [listaIps, inventario, isNonAdmin, userInstitucion]);

  // Procesamiento de datos: SOLO equipos con periodicidad definida (excluye 'No Aplica', 'NA', vacíos, etc.)
  const equiposConCronograma = useMemo(() => {
    return inventario
      .filter((eq) => tienePeriodicidadDefinida(eq.periodicidad))
      .map((eq) => {
        const crono = obtenerMesesEquipo(eq);
        return {
          ...eq,
          _cronoMeses: crono.array,
          _cronoNombres: crono.nombres,
          _cronoIndices: crono.indices,
        };
      })
      .filter((eq) => eq._cronoMeses && eq._cronoMeses.length > 0);
  }, [inventario]);

  // Lista única de Servicios disponibles según los equipos del cronograma
  const serviciosDisponibles = useMemo(() => {
    const set = new Set();
    const targetIps = isNonAdmin ? userInstitucion : selectedIps;
    equiposConCronograma.forEach((eq) => {
      if (targetIps && !matchesInstitucion(eq.institucion, targetIps)) {
        return;
      }
      if (eq.servicio && eq.servicio.trim()) {
        set.add(eq.servicio.trim());
      }
    });
    return Array.from(set).sort();
  }, [equiposConCronograma, selectedIps, isNonAdmin, userInstitucion]);

  // Filtrado reactivo de equipos
  const filteredEquipos = useMemo(() => {
    return equiposConCronograma.filter((eq) => {
      // Filtro obligatorio por institución si el usuario no es administrador
      if (isNonAdmin) {
        if (!userInstitucion || !matchesInstitucion(eq.institucion, userInstitucion)) {
          return false;
        }
      } else if (selectedIps) {
        if (!matchesInstitucion(eq.institucion, selectedIps)) {
          return false;
        }
      }
      // Filtro por Servicio
      if (selectedServicio && eq.servicio !== selectedServicio) {
        return false;
      }
      // Filtro por Mes
      if (selectedMes && !eq._cronoMeses.includes(selectedMes)) {
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
    buscar,
    isNonAdmin,
    userInstitucion,
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

  // Exportar a formato Excel (.xlsx) nativo
  const exportarExcel = () => {
    const listado = filteredEquipos.length > 0 ? filteredEquipos : equiposConCronograma;
    if (listado.length === 0) {
      alert('No hay equipos en el cronograma para exportar con los filtros actuales.');
      return;
    }

    const data = listado.map((eq, index) => {
      const matrizMeses = {};
      MESES_DEL_ANIO.forEach((m) => {
        matrizMeses[m] = (eq._cronoMeses || []).includes(m) ? 'P' : '';
      });

      return {
        '#': index + 1,
        'EQUIPO': eq.equipo || '',
        'MARCA': eq.marca || '',
        'MODELO': eq.modelo || '',
        'SERIE': eq.serie || '',
        'Nº INVENTARIO': eq.inventario || 'NA',
        'INSTITUCIÓN': eq.institucion || '',
        'SERVICIO': eq.servicio || '',
        'UBICACIÓN': eq.ubicacion || '',
        'PERIODICIDAD': eq.periodicidad || 'SEMESTRAL',
        ...matrizMeses,
        'RESPONSABLE': eq.responsable || '',
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 5 },  // #
      { wch: 28 }, // EQUIPO
      { wch: 18 }, // MARCA
      { wch: 18 }, // MODELO
      { wch: 18 }, // SERIE
      { wch: 15 }, // INVENTARIO
      { wch: 28 }, // INSTITUCION
      { wch: 20 }, // SERVICIO
      { wch: 20 }, // UBICACION
      { wch: 16 }, // PERIODICIDAD
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, // ENE-ABR
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, // MAY-AGO
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, // SEP-DIC
      { wch: 22 }, // RESPONSABLE
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
    const ipsNombre = selectedIps ? selectedIps.replace(/[^a-zA-Z0-9_-]/g, '_') : 'General';
    XLSX.writeFile(wb, `Cronograma_Mantenimiento_${ipsNombre}_${selectedAnio}.xlsx`);
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
    <div className="contenedor vista-cronograma" style={{ maxWidth: '100%', width: '100%', margin: '0 auto', padding: '10px 18px', boxSizing: 'border-box' }}>
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
          padding: '10px 16px',
          borderRadius: '8px',
          border: '1px solid #334155',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '800' }}>
            <FaCalendarAlt color="#38bdf8" /> Cronograma de Mantenimiento Preventivo {selectedAnio} {isNonAdmin && userInstitucion ? `- ${userInstitucion}` : ''}
          </h2>
          <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
            Planificación y programación periódica de mantenimientos de equipos biomédicos por meses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={exportarExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: '1px solid #10b981',
              padding: '6px 13px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
            title="Exportar cronograma filtrado a archivo Excel (.xlsx)"
          >
            <FaFileExcel size={14} /> Exportar Excel (.xlsx)
          </button>

          {isAdmin && (
            <button
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                padding: '6px 13px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
              title="Imprimir formato oficial de cronograma institucional"
            >
              <FaPrint size={14} /> Imprimir Cronograma
            </button>
          )}
        </div>
      </div>

      {/* ==========================================================
          TARJETAS DE RESUMEN Y ESTADÍSTICAS (NO-PRINT)
          ========================================================== */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '6px', color: '#38bdf8' }}>
            <FaLayerGroup size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Equipos Programados
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', lineHeight: 1.1 }}>
              {estadisticas.total}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '6px', color: '#10b981' }}>
            <FaCalendarAlt size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Mttos. en {estadisticas.mesFocoNombre}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', lineHeight: 1.1 }}>
              {estadisticas.esteMesCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '6px', color: '#c084fc' }}>
            <FaTools size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Semestrales / Trimestrales
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', lineHeight: 1.1 }}>
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
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaFilter /> Filtros del Cronograma:
          </div>
          {(selectedIps || selectedServicio || selectedMes || buscar) && (
            <button
              onClick={() => {
                if (user?.rol !== 'user') setSelectedIps('');
                setSelectedServicio('');
                setSelectedMes('');
                setBuscar('');
                setCurrentPage(1);
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#94a3b8',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '11.5px',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px',
          }}
        >
          {/* 1. Filtro IPS */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '2px' }}>
              Institución / IPS:
            </label>
            {isNonAdmin ? (
              <div
                className="input-report"
                style={{
                  padding: '5px 8px',
                  fontSize: '12px',
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  fontWeight: '700',
                  border: '1.5px solid #0284c7',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userInstitucion || 'Mi Institución'}
              </div>
            ) : (
              <select
                value={selectedIps}
                onChange={(e) => {
                  setSelectedIps(e.target.value);
                  setSelectedServicio('');
                  setCurrentPage(1);
                }}
                className="input-report"
                style={{ padding: '5px 8px', fontSize: '12px' }}
              >
                <option value="">-- Todas las Instituciones / IPS --</option>
                {ipsDisponibles.map((nombreIps) => (
                  <option key={nombreIps} value={nombreIps}>
                    {nombreIps}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Filtro Servicio */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '2px' }}>
              Servicio / Área:
            </label>
            <select
              value={selectedServicio}
              onChange={(e) => {
                setSelectedServicio(e.target.value);
                setCurrentPage(1);
              }}
              className="input-report"
              style={{ padding: '5px 8px', fontSize: '12px' }}
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
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '2px' }}>
              Mes de Mantenimiento:
            </label>
            <select
              value={selectedMes}
              onChange={(e) => {
                setSelectedMes(e.target.value);
                setCurrentPage(1);
              }}
              className="input-report"
              style={{ padding: '5px 8px', fontSize: '12px' }}
            >
              <option value="">-- Todos los Meses --</option>
              {MESES_DEL_ANIO.map((mes) => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Buscador de Texto */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '2px' }}>
              Búsqueda Rápida:
            </label>
            <div style={{ position: 'relative' }}>
              <GoSearch
                style={{
                  position: 'absolute',
                  left: '8px',
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
                style={{ paddingLeft: '28px', paddingRight: '8px', paddingTop: '5px', paddingBottom: '5px', fontSize: '12px' }}
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
                {(() => {
                  const logoUrl = Array.isArray(ipsActualData?.logo)
                    ? ipsActualData.logo[0]?.data_url
                    : ipsActualData?.logo?.data_url || (typeof ipsActualData?.logo === 'string' ? ipsActualData.logo : null);
                  if (logoUrl) {
                    return (
                      <img src={logoUrl} alt="Logo IPS" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                    );
                  }
                  return (
                    <div style={{ fontWeight: '800', color: '#0f3b60', fontSize: '13px' }}>
                      {selectedIps || user?.institucion || 'GEMTTO BIOMÉDICA'}
                    </div>
                  );
                })()}
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
      <div className="table-responsive-card">
        <table className="table tabla-cronograma-completa">
          <thead>
            <tr>
              <th style={{ width: '32px', minWidth: '30px', textAlign: 'center', padding: '6px 2px' }}>#</th>
              <th style={{ width: 'auto' }}>EQUIPO</th>
              <th style={{ width: '7.5%' }}>MARCA</th>
              <th style={{ width: '7.5%' }}>MODELO</th>
              <th style={{ width: '8%' }}>SERIE</th>
              <th style={{ width: '12%' }}>INSTITUCIÓN</th>
              <th style={{ width: '8.5%' }}>SERVICIO</th>
              <th style={{ width: '82px', minWidth: '78px', textAlign: 'center', padding: '6px 2px' }}>PERIODICIDAD</th>
              {/* 12 Meses Matriz con texto en orientación vertical hacia arriba */}
              {MESES_ABREV.map((abrev) => (
                <th
                  key={abrev}
                  className="th-mes-vertical"
                  style={{
                    width: '22px',
                    minWidth: '20px',
                    maxWidth: '24px',
                    padding: '4px 0',
                    textAlign: 'center',
                    verticalAlign: 'bottom',
                    height: '42px',
                    borderLeft: '1px solid #334155',
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
                      fontSize: '9.5px',
                      letterSpacing: '0.5px',
                      lineHeight: '1',
                    }}
                  >
                    {abrev}
                  </span>
                </th>
              ))}
              <th style={{ width: '9.5%' }}>RESPONSABLE</th>
              <th className="no-print" style={{ width: isNonAdmin ? '45px' : '60px', minWidth: isNonAdmin ? '42px' : '58px', textAlign: 'center', padding: '6px 2px' }}>ACCIONES</th>
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
                  <tr key={eq._id}>
                    {/* 1. Consecutivo */}
                    <td style={{ textAlign: 'center', fontWeight: '700', color: '#94a3b8', padding: '6px 2px', whiteSpace: 'nowrap' }}>
                      {globalIndex}
                    </td>

                    {/* 2. Equipo (permite multilínea con letra clara y legible) */}
                    <td style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '12.5px' }}>{eq.equipo}</strong>
                    </td>

                    {/* 3. Marca */}
                    <td style={{ color: '#cbd5e1', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', fontSize: '12px' }}>
                      {eq.marca}
                    </td>

                    {/* 4. Modelo */}
                    <td style={{ color: '#94a3b8', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', fontSize: '12px' }}>
                      {eq.modelo}
                    </td>

                    {/* 5. Serie */}
                    <td style={{ wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8', fontSize: '12px' }}>
                        {eq.serie}
                      </span>
                    </td>

                    {/* 6. Institución (IPS) */}
                    <td style={{ color: '#e2e8f0', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', fontSize: '12px' }}>
                      {eq.institucion || '-'}
                    </td>

                    {/* 7. Servicio */}
                    <td style={{ color: '#cbd5e1', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', fontSize: '12px' }}>
                      {eq.servicio}
                    </td>

                    {/* 8. Periodicidad */}
                    <td style={{ textAlign: 'center', padding: '6px 2px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
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
                            padding: '4px 0',
                            backgroundColor: isScheduled ? 'rgba(2, 132, 199, 0.25)' : 'transparent',
                            borderLeft: '1px solid #334155',
                            width: '22px',
                            minWidth: '20px',
                            maxWidth: '24px',
                            whiteSpace: 'nowrap',
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
                                width: '17px',
                                height: '17px',
                                lineHeight: '17px',
                                borderRadius: '50%',
                                boxShadow: '0 0 4px rgba(56, 189, 248, 0.6)',
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
                    <td style={{ color: '#cbd5e1', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', fontSize: '12px' }}>
                      {eq.responsable || 'GEMTTO BIOMÉDICA SAS'}
                    </td>

                    {/* 11. Acciones (Ver Hoja de Vida y Generar Reporte solo para admin) */}
                    <td className="no-print" style={{ textAlign: 'center', padding: '6px 2px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '5px', justifyContent: 'center' }}>
                        {/* Botón Ver Hoja de Vida */}
                        <Link
                          to={isNonAdmin ? `/hojadevidausuario?id=${eq._id}&modelo=${encodeURIComponent(eq.modelo || '')}&serie=${encodeURIComponent(eq.serie || '')}&institucion=${encodeURIComponent(eq.institucion || '')}&from=cronograma` : `/hojadevida?id=${eq._id}&modelo=${encodeURIComponent(eq.modelo || '')}&serie=${encodeURIComponent(eq.serie || '')}&institucion=${encodeURIComponent(eq.institucion || '')}&from=cronograma`}
                          title="Ver Hoja de Vida"
                          className="action-btn action-btn-view"
                          style={{ padding: '4px 6px' }}
                        >
                          <GoEye size={14} color="#38bdf8" />
                        </Link>

                        {/* Botón Realizar Reporte de Servicio (Solo visible para Administradores) */}
                        {isAdmin && (
                          <Link
                            to={`/reporteService?id=${eq?._id}&equipo=${encodeURIComponent(eq?.equipo || '')}&serie=${encodeURIComponent(eq?.serie || '')}&institucion=${encodeURIComponent(eq?.institucion || '')}&servicio=${encodeURIComponent(eq?.servicio || '')}&marca=${encodeURIComponent(eq?.marca || '')}&modelo=${encodeURIComponent(eq?.modelo || '')}&from=cronograma`}
                            title="Realizar Reporte de Servicio"
                            className="action-btn action-btn-primary"
                            style={{ padding: '4px 6px' }}
                          >
                            <HiOutlineDocumentPlus size={14} color="#ffffff" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación (Oculta en Impresión) */}
      <div className="no-print" style={{ marginTop: '10px', marginBottom: '10px' }}>
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
