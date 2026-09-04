import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiObtenerEquiposIps, apiInventario } from '../utils/api';
import request from '../utils/request';
import { useSelector } from 'react-redux';
import Pagination from '../components/Pagination';
import { GoSearch, GoEye } from 'react-icons/go';
import { FaBoxes, FaQrcode, FaDownload, FaFilter } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import QrModal from '../components/QrModal';

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

function InventarioUser() {
  const user = useSelector((state) => state.user);
  const institucion = user?.institucion;
  const [inventario, setInventario] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState('');
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrEquipo, setQrEquipo] = useState(null);
  const [modalQrOpen, setModalQrOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const getInventario = async (inst) => {
    if (!inst) {
      setInventario([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await request({
        link: `${apiObtenerEquiposIps}?institucion=${encodeURIComponent(inst)}`,
        method: 'GET',
      });
      if (response && response.success && Array.isArray(response.equipos) && response.equipos.length > 0) {
        setInventario(response.equipos);
      } else {
        const fallbackRes = await request({ link: apiInventario, method: 'GET' });
        if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.inventario)) {
          const soloUser = fallbackRes.inventario.filter((eq) =>
            matchesInstitucion(eq.institucion, inst)
          );
          setInventario(soloUser);
        } else {
          setInventario([]);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error al obtener inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInventario(institucion);
  }, [institucion]);

  // Lista única de Servicios disponibles en la institución asignada
  const serviciosDisponibles = useMemo(() => {
    const set = new Set();
    inventario.forEach((eq) => {
      if (eq.servicio && typeof eq.servicio === 'string' && eq.servicio.trim()) {
        set.add(eq.servicio.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [inventario]);

  const handleSave = (e) => {
    setBuscar(e.target.value);
    setCurrentPage(1);
  };

  const filteredInventarios = useMemo(() => {
    return inventario.filter((dato) => {
      if (
        selectedServicio &&
        String(dato.servicio || '').trim().toLowerCase() !== selectedServicio.trim().toLowerCase()
      ) {
        return false;
      }
      if (buscar.trim()) {
        const q = buscar.toLowerCase();
        const match =
          (dato.servicio && dato.servicio.toLowerCase().includes(q)) ||
          (dato.equipo && dato.equipo.toLowerCase().includes(q)) ||
          (dato.serie && dato.serie.toLowerCase().includes(q)) ||
          (dato.marca && dato.marca.toLowerCase().includes(q)) ||
          (dato.modelo && dato.modelo.toLowerCase().includes(q)) ||
          (dato.ubicacion && dato.ubicacion.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [inventario, selectedServicio, buscar]);

  const paginatedInventarios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInventarios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInventarios, currentPage, itemsPerPage]);

  // Exportar Inventario del Usuario a Excel (.xlsx)
  const exportarExcel = () => {
    const listado = filteredInventarios.length > 0 ? filteredInventarios : inventario;
    if (listado.length === 0) {
      alert('No hay equipos en el inventario para exportar.');
      return;
    }

    const data = listado.map((eq, index) => ({
      '#': index + 1,
      'EQUIPO': eq.equipo || '',
      'MARCA': eq.marca || '',
      'MODELO': eq.modelo || '',
      'SERIE': eq.serie || '',
      'Nº INVENTARIO': eq.inventario || 'NA',
      'INSTITUCIÓN / IPS': eq.institucion || institucion || '',
      'SERVICIO': eq.servicio || '',
      'UBICACIÓN': eq.ubicacion || '',
      'PERIODICIDAD': eq.periodicidad || 'NO APLICA',
      'MESES MANTENIMIENTO': Array.isArray(eq.meses_mantenimiento) && eq.meses_mantenimiento.length > 0 ? eq.meses_mantenimiento.join(', ') : '',
      'REGISTRO INVIMA': eq.registro_invima || '',
      'CLASIFICACIÓN RIESGO': eq.riesgo || '',
      'RESPONSABLE': eq.responsable || '',
      'FORMA ADQUISICIÓN': eq.forma_adquisicion || '',
      'FECHA INSTALACIÓN': eq.fecha_instalacion || '',
      'FECHA FABRICACIÓN': eq.fecha_fabricacion || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    ws['!cols'] = [
      { wch: 5 },  // #
      { wch: 28 }, // EQUIPO
      { wch: 18 }, // MARCA
      { wch: 18 }, // MODELO
      { wch: 18 }, // SERIE
      { wch: 16 }, // INVENTARIO
      { wch: 28 }, // INSTITUCION
      { wch: 20 }, // SERVICIO
      { wch: 20 }, // UBICACION
      { wch: 18 }, // PERIODICIDAD
      { wch: 30 }, // MESES MANTENIMIENTO
      { wch: 22 }, // INVIMA
      { wch: 16 }, // RIESGO
      { wch: 22 }, // RESPONSABLE
      { wch: 18 }, // FORMA ADQUISICION
      { wch: 18 }, // FECHA INSTALACION
      { wch: 18 }, // FECHA FABRICACION
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const nomIps = institucion ? institucion.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Sede';
    XLSX.writeFile(wb, `Inventario_${nomIps}_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="contenedor">
      <main>
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaBoxes color="#38bdf8" /> Inventario de Equipos - {institucion || 'Mi Institución'}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Consulta y seguimiento del parque biomédico asignado a tu institución.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={exportarExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#059669',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                border: '1px solid #10b981',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Descargar inventario en formato Excel (.xlsx)"
            >
              <FaDownload size={13} /> Descargar Inventario Excel
            </button>
          </div>
        </div>

        {/* ==========================================================
            BARRA DE FILTROS POR SERVICIO (COMO EN CRONOGRAMA)
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
              <FaFilter /> Filtrar Inventario por Servicio:
            </div>
            {(selectedServicio || buscar) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedServicio('');
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            {/* 1. Institución fija para usuario */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                Institución / IPS:
              </label>
              <div
                className="input-report"
                style={{
                  padding: '9px 12px',
                  fontSize: '13px',
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
                {institucion || 'Mi Institución'}
              </div>
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
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="div-buscar">
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por equipo, serie, marca, servicio o ubicación..."
              onChange={handleSave}
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
        </div>

        {/* Table & Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '16px' }}>
            Cargando inventario de equipos...
          </div>
        ) : (
          <div>
            <div className="table-responsive-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>EQUIPO</th>
                    <th>MARCA</th>
                    <th>MODELO</th>
                    <th>SERIE</th>
                    <th>SERVICIO</th>
                    <th>UBICACIÓN</th>
                    <th>REG. INVIMA</th>
                    <th>RIESGO</th>
                    <th>RESPONSABLE</th>
                    <th style={{ textAlign: 'center' }}>HOJA DE VIDA</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInventarios.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron equipos en esta institución.
                      </td>
                    </tr>
                  ) : (
                    paginatedInventarios.map(function (item) {
                      return (
                        <tr key={item._id}>
                          <td><strong style={{ color: '#f8fafc' }}>{item?.equipo}</strong></td>
                          <td style={{ color: '#cbd5e1' }}>{item?.marca}</td>
                          <td style={{ color: '#94a3b8' }}>{item?.modelo}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td style={{ color: '#cbd5e1' }}>{item?.servicio}</td>
                          <td style={{ color: '#94a3b8' }}>{item?.ubicacion}</td>
                          <td style={{ color: '#cbd5e1', fontSize: '12px' }}>{item?.registro_invima}</td>
                          <td>
                            {item?.riesgo && (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: '#0369a1',
                                  color: '#e0f2fe',
                                  border: '1px solid #38bdf8',
                                }}
                              >
                                {item.riesgo}
                              </span>
                            )}
                          </td>
                          <td style={{ color: '#cbd5e1' }}>{item?.responsable}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                              <Link
                                to={`/hojadevidausuario?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                                className="action-btn action-btn-view"
                                title="Ver Hoja de Vida"
                              >
                                <GoEye size={16} color="#38bdf8" /> Ver Hoja
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setQrEquipo(item);
                                  setModalQrOpen(true);
                                }}
                                title="Generar / Imprimir Código QR"
                                className="action-btn"
                                style={{
                                  backgroundColor: '#7c3aed',
                                  border: '1px solid #a855f7',
                                  color: '#ffffff',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                }}
                              >
                                <FaQrcode size={14} color="#ffffff" /> QR
                              </button>
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
            <Pagination
              totalItems={filteredInventarios.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(size) => setItemsPerPage(size)}
              pageSizeOptions={[15, 25, 50, 100]}
            />
          </div>
        )}
      </main>

      {/* Modal de Código QR */}
      <QrModal
        isOpen={modalQrOpen}
        onClose={() => {
          setModalQrOpen(false);
          setQrEquipo(null);
        }}
        equipo={qrEquipo}
      />
    </div>
  );
}
export default InventarioUser;
