import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiReportes, apiReportesRepuestos, apiIps } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import ExportJsonExcel from 'js-export-excel';
import {
  FaCogs,
  FaFileExcel,
  FaHospital,
  FaBoxes,
  FaTools,
  FaFileInvoice,
  FaSync,
} from 'react-icons/fa';
import { GoSearch, GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

function Repuestos() {
  const [reportes, setReportes] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [filtroIps, setFiltroIps] = useState('TODAS');
  const [loading, setLoading] = useState(true);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Función para determinar si un reporte tiene repuestos instalados
  const tieneRepuestos = (item) => {
    if (!item) return false;
    for (let i = 1; i <= 4; i++) {
      const desc = item[`descripcion${i}`];
      const cant = item[`cantidad${i}`];
      const val = item[`valor${i}`];
      if (
        desc &&
        String(desc).trim() !== '' &&
        String(desc).trim().toUpperCase() !== 'NA' &&
        String(desc).trim().toUpperCase() !== 'N/A' &&
        String(desc).trim().toUpperCase() !== 'NINGUNO' &&
        String(desc).trim().toUpperCase() !== 'NO APLICA'
      ) {
        return true;
      }
      if (cant && String(cant).trim() !== '' && String(cant).trim() !== '0') {
        return true;
      }
      if (val && String(val).trim() !== '' && String(val).trim() !== '0') {
        return true;
      }
    }
    if (Array.isArray(item.repuestos) && item.repuestos.length > 0) return true;
    return false;
  };

  // Función para extraer la lista de repuestos válidos de un reporte
  const extraerRepuestos = (item) => {
    const lista = [];
    for (let i = 1; i <= 4; i++) {
      const desc = item[`descripcion${i}`]?.trim();
      const cant = item[`cantidad${i}`]?.trim();
      const val = item[`valor${i}`]?.trim();
      if (desc || cant || val) {
        lista.push({
          index: i,
          descripcion: desc || 'Repuesto sin descripción',
          cantidad: cant || '1',
          valor: val || '',
        });
      }
    }
    if (lista.length === 0 && Array.isArray(item.repuestos)) {
      item.repuestos.forEach((r, idx) => {
        lista.push({
          index: idx + 1,
          descripcion: r.descripcion || r.nombre || 'Repuesto',
          cantidad: r.cantidad || '1',
          valor: r.valor || '',
        });
      });
    }
    return lista;
  };

  const getReportes = async () => {
    setLoading(true);
    try {
      // 1. Intentar llamar al endpoint optimizado de repuestos
      let response = await request({
        link: apiReportesRepuestos,
        method: 'GET',
      });

      // 2. Si no responde o el backend aún no se ha reiniciado con el nuevo endpoint, consultar apiReportes completo
      if (!response || !response.success || !response.reporte) {
        response = await request({
          link: `${apiReportes}?full=true`,
          method: 'GET',
        });
      }

      if (response && response.success && response.reporte) {
        // Filtrar para almacenar únicamente los reportes que tienen repuestos
        const conRepuestos = response.reporte.filter(tieneRepuestos);
        setReportes(conRepuestos);
      } else {
        alert(`Sin conexión con el Servidor ${response?.message || ''}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error al obtener los reportes del servidor');
    } finally {
      setLoading(false);
    }
  };

  const getIpsList = async () => {
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
    getIpsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lista consolidada de IPS para el filtro
  const uniqueIpsList = useMemo(() => {
    const fromReportes = reportes
      .map((r) => (r.institucion ? r.institucion.trim() : ''))
      .filter(Boolean);
    const fromApi = listaIps
      .map((i) => (i.ips ? i.ips.trim() : i.nombre ? i.nombre.trim() : ''))
      .filter(Boolean);
    return Array.from(new Set([...fromReportes, ...fromApi])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [reportes, listaIps]);

  // Filtrado de reportes con repuestos según búsqueda e IPS
  const filteredReportes = useMemo(() => {
    let result = reportes;

    // Filtro por IPS
    if (filtroIps !== 'TODAS') {
      result = result.filter(
        (r) =>
          (r.institucion || '').trim().toUpperCase() ===
          filtroIps.trim().toUpperCase()
      );
    }

    // Filtro por búsqueda de texto
    if (buscar.trim() !== '') {
      const q = buscar.toLowerCase();
      result = result.filter((item) => {
        const matchSerie = item.serie && item.serie.toLowerCase().includes(q);
        const matchInst =
          item.institucion && item.institucion.toLowerCase().includes(q);
        const matchServ =
          item.servicio && item.servicio.toLowerCase().includes(q);
        const matchEq = item.equipo && item.equipo.toLowerCase().includes(q);
        const matchMarca =
          item.marca && item.marca.toLowerCase().includes(q);
        const matchModelo =
          item.modelo && item.modelo.toLowerCase().includes(q);
        const matchNum =
          item.numero_reporte &&
          String(item.numero_reporte).toLowerCase().includes(q);

        // Búsqueda en descripciones de repuestos
        const matchDesc1 =
          item.descripcion1 && item.descripcion1.toLowerCase().includes(q);
        const matchDesc2 =
          item.descripcion2 && item.descripcion2.toLowerCase().includes(q);
        const matchDesc3 =
          item.descripcion3 && item.descripcion3.toLowerCase().includes(q);
        const matchDesc4 =
          item.descripcion4 && item.descripcion4.toLowerCase().includes(q);

        return (
          matchSerie ||
          matchInst ||
          matchServ ||
          matchEq ||
          matchMarca ||
          matchModelo ||
          matchNum ||
          matchDesc1 ||
          matchDesc2 ||
          matchDesc3 ||
          matchDesc4
        );
      });
    }

    // Ordenar por fecha descendente
    return [...result].sort((a, b) => {
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return b.fecha.localeCompare(a.fecha);
    });
  }, [reportes, filtroIps, buscar]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [buscar, filtroIps, itemsPerPage]);

  // Paginación
  const paginatedReportes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReportes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReportes, currentPage, itemsPerPage]);

  // Métricas para los KPI cards
  const metricas = useMemo(() => {
    const seriesUnicas = new Set(
      filteredReportes.map((r) => (r.serie || '').trim().toUpperCase()).filter(Boolean)
    );
    const ipsUnicas = new Set(
      filteredReportes.map((r) => (r.institucion || '').trim().toUpperCase()).filter(Boolean)
    );

    let totalRepuestosCount = 0;
    filteredReportes.forEach((item) => {
      for (let i = 1; i <= 4; i++) {
        const desc = item[`descripcion${i}`]?.trim();
        const cant = Number(item[`cantidad${i}`]) || (desc ? 1 : 0);
        totalRepuestosCount += cant;
      }
    });

    return {
      totalEquipos: seriesUnicas.size,
      totalReportes: filteredReportes.length,
      totalRepuestos: totalRepuestosCount,
      totalIps: ipsUnicas.size,
    };
  }, [filteredReportes]);

  // Exportar datos de repuestos a Excel
  const exportToExcel = () => {
    if (filteredReportes.length === 0) {
      alert('No hay registros de repuestos para exportar con los filtros seleccionados.');
      return;
    }

    const dataTable = [];
    filteredReportes.forEach((r) => {
      const repuestos = extraerRepuestos(r);
      if (repuestos.length === 0) {
        dataTable.push({
          Numero_Reporte: r.numero_reporte || '',
          Fecha: r.fecha || '',
          Equipo: r.equipo || '',
          Marca: r.marca || '',
          Modelo: r.modelo || '',
          Serie: r.serie || '',
          Institucion: r.institucion || '',
          Servicio: r.servicio || '',
          Item_Repuesto: 1,
          Cantidad: r.cantidad1 || '',
          Descripcion_Repuesto: r.descripcion1 || '',
          Valor: r.valor1 || '',
        });
      } else {
        repuestos.forEach((rep) => {
          dataTable.push({
            Numero_Reporte: r.numero_reporte || '',
            Fecha: r.fecha || '',
            Equipo: r.equipo || '',
            Marca: r.marca || '',
            Modelo: r.modelo || '',
            Serie: r.serie || '',
            Institucion: r.institucion || '',
            Servicio: r.servicio || '',
            Item_Repuesto: rep.index,
            Cantidad: rep.cantidad,
            Descripcion_Repuesto: rep.descripcion,
            Valor: rep.valor,
          });
        });
      }
    });

    const ipsLabel = filtroIps !== 'TODAS' ? `_${filtroIps.replace(/\s+/g, '_')}` : '';
    const fileName = `GEMTTO_Repuestos_Instalados${ipsLabel}_${new Date().toISOString().split('T')[0]}`;

    const option = {
      fileName: fileName,
      datas: [
        {
          sheetData: dataTable,
          sheetName: 'Repuestos_Instalados',
          sheetHeader: [
            'Nº Reporte',
            'Fecha',
            'Equipo',
            'Marca',
            'Modelo',
            'Serie',
            'Institución / IPS',
            'Servicio',
            'Ítem',
            'Cantidad',
            'Descripción del Repuesto',
            'Valor / Costo',
          ],
          sheetFilter: [
            'Numero_Reporte',
            'Fecha',
            'Equipo',
            'Marca',
            'Modelo',
            'Serie',
            'Institucion',
            'Servicio',
            'Item_Repuesto',
            'Cantidad',
            'Descripcion_Repuesto',
            'Valor',
          ],
        },
      ],
    };

    const toExcel = new ExportJsonExcel(option);
    toExcel.saveExcel();
  };

  return (
    <div className="contenedor" style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 15px' }}>
      {/* Encabezado Principal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#1e293b',
          padding: '18px 24px',
          borderRadius: '12px',
          border: '1px solid #334155',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '800',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <FaCogs /> CONTROL DE REPUESTOS INSTALADOS
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Listado exclusivo de equipos biomédicos que tienen repuestos instalados en sus reportes de servicio.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportToExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: '1px solid #22c55e',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
            }}
            title="Exportar listado a Excel"
          >
            <FaFileExcel size={15} /> Exportar a Excel
          </button>
          <button
            onClick={getReportes}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
            }}
            title="Recargar datos"
          >
            <FaSync size={13} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards de Resumen */}
      <div
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
            padding: '16px 18px',
            borderRadius: '10px',
            border: '1px solid #334155',
            borderLeft: '4px solid #38bdf8',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
            Equipos con Repuestos
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBoxes size={20} color="#38bdf8" /> {metricas.totalEquipos}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '16px 18px',
            borderRadius: '10px',
            border: '1px solid #334155',
            borderLeft: '4px solid #10b981',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Repuestos Instalados
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaTools size={18} color="#10b981" /> {metricas.totalRepuestos}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '16px 18px',
            borderRadius: '10px',
            border: '1px solid #334155',
            borderLeft: '4px solid #f59e0b',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
            Servicios / Reportes
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFileInvoice size={18} color="#f59e0b" /> {metricas.totalReportes}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '16px 18px',
            borderRadius: '10px',
            border: '1px solid #334155',
            borderLeft: '4px solid #a855f7',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
            Sedes / IPS Involucradas
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaHospital size={18} color="#a855f7" /> {metricas.totalIps}
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '14px 18px',
          borderRadius: '10px',
          border: '1px solid #334155',
          marginBottom: '18px',
        }}
      >
        {/* Buscador de texto */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <input
            type="text"
            className="input-buscar"
            value={buscar}
            placeholder="Buscar por Serie, Equipo, Repuesto, Modelo, Institución..."
            onChange={(e) => setBuscar(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 38px 9px 12px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13.5px',
              outline: 'none',
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
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Filtro por Institución / IPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>
            IPS / Sede:
          </label>
          <select
            value={filtroIps}
            onChange={(e) => setFiltroIps(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '220px',
            }}
          >
            <option value="TODAS">-- Todas las IPS --</option>
            {uniqueIpsList.map((ips) => (
              <option key={ips} value={ips}>
                {ips}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Equipos con Repuestos Instalados */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '10px',
          border: '1px solid #334155',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-actividades" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f3b60', color: '#ffffff', textAlign: 'left', fontSize: '12.5px' }}>
                <th style={{ padding: '12px', width: '9%' }}>Nº REPORTE</th>
                <th style={{ padding: '12px', width: '9%' }}>FECHA</th>
                <th style={{ padding: '12px', width: '18%' }}>EQUIPO / MARCA / MODELO</th>
                <th style={{ padding: '12px', width: '11%' }}>SERIE</th>
                <th style={{ padding: '12px', width: '17%' }}>INSTITUCIÓN / SERVICIO</th>
                <th style={{ padding: '12px', width: '26%' }}>REPUESTOS INSTALADOS</th>
                <th style={{ padding: '12px', width: '10%', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    <FaSync className="spin" style={{ marginRight: '8px' }} /> Cargando equipos con repuestos...
                  </td>
                </tr>
              ) : paginatedReportes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>
                      No se encontraron equipos con repuestos instalados
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      {buscar || filtroIps !== 'TODAS'
                        ? 'Prueba modificando los filtros o el texto de búsqueda.'
                        : 'No hay reportes de mantenimiento que contengan repuestos registrados en el sistema.'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReportes.map((item) => {
                  const repuestosList = extraerRepuestos(item);
                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: '1px solid #334155',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Nº Reporte */}
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontWeight: '800',
                            color: '#38bdf8',
                            fontSize: '13px',
                            backgroundColor: 'rgba(2, 132, 199, 0.15)',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                          }}
                        >
                          #{item.numero_reporte}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: '12px', fontSize: '12.5px', color: '#cbd5e1', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {item.fecha || '-'}
                      </td>

                      {/* Equipo / Marca / Modelo */}
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '13.5px' }}>
                          {item.equipo || '-'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                          {item.marca} {item.modelo ? `| ${item.modelo}` : ''}
                        </div>
                      </td>

                      {/* Serie */}
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: '700',
                            color: '#38bdf8',
                            fontSize: '13px',
                            backgroundColor: '#0f172a',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid #334155',
                          }}
                        >
                          {item.serie || '-'}
                        </span>
                      </td>

                      {/* Institución y Servicio */}
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '13px' }}>
                          {item.institucion || '-'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                          {item.servicio || '-'}
                        </div>
                      </td>

                      {/* Lista de Repuestos Instalados */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {repuestosList.map((rep, idx) => (
                            <div
                              key={idx}
                              style={{
                                backgroundColor: '#0f172a',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #334155',
                                fontSize: '12px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ fontWeight: '600', color: '#f1f5f9' }}>
                                  <span
                                    style={{
                                      backgroundColor: '#0284c7',
                                      color: '#ffffff',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      marginRight: '6px',
                                      display: 'inline-block',
                                    }}
                                  >
                                    x{rep.cantidad}
                                  </span>
                                  {rep.descripcion}
                                </div>
                                {rep.valor && (
                                  <span style={{ color: '#4ade80', fontWeight: '700', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                                    ${Number(rep.valor).toLocaleString('es-CO')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            to={`/reporte?id=${item._id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#0284c7',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: '700',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                            title="Ver Reporte de Servicio"
                          >
                            <GoEye size={13} /> Ver
                          </Link>
                          <Link
                            to={`/editareporte?id=${item._id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#334155',
                              color: '#f8fafc',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: '600',
                              border: '1px solid #475569',
                            }}
                            title="Editar Reporte"
                          >
                            <CiEdit size={15} />
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
      </div>

      {/* Paginación */}
      <Pagination
        totalItems={filteredReportes.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(newSize) => setItemsPerPage(newSize)}
        pageSizeOptions={[15, 25, 50, 100]}
      />
    </div>
  );
}

export default Repuestos;
