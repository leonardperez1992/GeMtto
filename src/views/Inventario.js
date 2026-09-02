import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiInventario } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { GoEye, GoSearch } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';
import { FaPlus, FaBoxes, FaQrcode, FaFileExcel } from 'react-icons/fa';
import QrModal from '../components/QrModal';
import CargaMasivaModal from '../components/CargaMasivaModal';

function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrEquipo, setQrEquipo] = useState(null);
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [modalCargaMasivaOpen, setModalCargaMasivaOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const getInventario = async () => {
    setLoading(true);
    try {
      const response = await request({
        link: apiInventario,
        method: 'GET',
      });
      if (response && response.success) {
        setInventario(response.inventario || []);
      } else {
        alert(`Sin conexión con el Servidor ${response?.message || ''}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error al obtener inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInventario();
  }, []);

  const handleSave = (e) => {
    setBuscar(e.target.value);
    setCurrentPage(1); // Reset page on new search
  };

  // Filtered inventory
  const filteredInventarios = useMemo(() => {
    if (!buscar.trim()) {
      return inventario;
    }
    const q = buscar.toLowerCase();
    return inventario.filter(
      (dato) =>
        (dato.serie && dato.serie.toLowerCase().includes(q)) ||
        (dato.institucion && dato.institucion.toLowerCase().includes(q)) ||
        (dato.servicio && dato.servicio.toLowerCase().includes(q)) ||
        (dato.equipo && dato.equipo.toLowerCase().includes(q)) ||
        (dato.marca && dato.marca.toLowerCase().includes(q)) ||
        (dato.modelo && dato.modelo.toLowerCase().includes(q)) ||
        (dato.ubicacion && dato.ubicacion.toLowerCase().includes(q)),
    );
  }, [inventario, buscar]);

  // Paginated slice
  const paginatedInventarios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInventarios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInventarios, currentPage, itemsPerPage]);

  return (
    <div className="contenedor">
      <main>
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaBoxes color="#38bdf8" /> Inventario General de Equipos
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Gestión centralizada de equipos médicos, hojas de vida y servicios técnicos.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setModalCargaMasivaOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0f766e',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                border: '1px solid #14b8a6',
                boxShadow: '0 2px 8px rgba(15, 118, 110, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <FaFileExcel size={14} color="#34d399" /> Carga Masiva (Excel)
            </button>
            <Link
              to="/createinventary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(2,132,199,0.4)',
                border: '1px solid #38bdf8',
                transition: 'all 0.2s',
              }}
            >
              <FaPlus size={13} /> Nuevo Equipo
            </Link>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="div-buscar">
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por serie, nombre de equipo, marca, modelo, IPS o servicio..."
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
                    <th>INSTITUCIÓN</th>
                    <th>SERVICIO</th>
                    <th>UBICACIÓN</th>
                    <th>REG. INVIMA</th>
                    <th>RIESGO</th>
                    <th>RESPONSABLE</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInventarios.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron equipos en el inventario.
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
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8', fontSize: '13px' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td style={{ color: '#e2e8f0' }}>{item?.institucion}</td>
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
                              {/* Botón Reporte */}
                              <Link
                                to={`/reporteService?id=${item?._id}&equipo=${encodeURIComponent(item?.equipo || '')}&serie=${encodeURIComponent(item?.serie || '')}&institucion=${encodeURIComponent(item?.institucion || '')}&servicio=${encodeURIComponent(item?.servicio || '')}&marca=${encodeURIComponent(item?.marca || '')}&modelo=${encodeURIComponent(item?.modelo || '')}`}
                                title="Crear Reporte de Servicio"
                                className="action-btn action-btn-primary"
                              >
                                <HiOutlineDocumentPlus size={16} color="#ffffff" />
                              </Link>

                              {/* Botón Ver Hoja de Vida */}
                              <Link
                                to={`/hojadevida?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                                title="Ver Hoja de Vida"
                                className="action-btn action-btn-view"
                              >
                                <GoEye size={16} color="#38bdf8" />
                              </Link>

                              {/* Botón Código QR */}
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
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <FaQrcode size={15} color="#ffffff" />
                              </button>

                              {/* Botón Editar */}
                              <Link
                                to={`/editarequipo?id=${item?._id}`}
                                title="Editar Equipo"
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

      {/* Modal de Carga Masiva Excel */}
      <CargaMasivaModal
        isOpen={modalCargaMasivaOpen}
        onClose={() => setModalCargaMasivaOpen(false)}
        onSuccess={() => getInventario()}
      />
    </div>
  );
}
export default Inventario;
