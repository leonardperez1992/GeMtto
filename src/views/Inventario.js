import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiInventario } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { GoEye, GoSearch } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';
import { FaPlus, FaBoxes } from 'react-icons/fa';

function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);

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
            <h2 style={{ margin: 0, color: '#0f2b48', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaBoxes color="#0d6efd" /> Inventario General de Equipos
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Gestión centralizada de equipos médicos, hojas de vida y servicios técnicos.
            </p>
          </div>
          <Link
            to="/createinventary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0d6efd',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(13,110,253,0.25)',
              transition: 'all 0.2s',
            }}
          >
            <FaPlus size={13} /> Nuevo Equipo
          </Link>
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
        </div>

        {/* Table & Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '16px' }}>
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
                      <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No se encontraron equipos en el inventario.
                      </td>
                    </tr>
                  ) : (
                    paginatedInventarios.map(function (item) {
                      return (
                        <tr key={item._id}>
                          <td><strong>{item?.equipo}</strong></td>
                          <td>{item?.marca}</td>
                          <td>{item?.modelo}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0f3b60' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td>{item?.institucion}</td>
                          <td>{item?.servicio}</td>
                          <td>{item?.ubicacion}</td>
                          <td>{item?.registro_invima}</td>
                          <td>
                            {item?.riesgo && (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: '#e0f2fe',
                                  color: '#0369a1',
                                }}
                              >
                                {item.riesgo}
                              </span>
                            )}
                          </td>
                          <td>{item?.responsable}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                              <Link
                                to={`/reporteService?id=${item?._id}&equipo=${encodeURIComponent(item?.equipo || '')}&serie=${encodeURIComponent(item?.serie || '')}&institucion=${encodeURIComponent(item?.institucion || '')}&servicio=${encodeURIComponent(item?.servicio || '')}&marca=${encodeURIComponent(item?.marca || '')}&modelo=${encodeURIComponent(item?.modelo || '')}`}
                                title="Crear Reporte de Servicio"
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0d6efd',
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  fontSize: '12px',
                                  textDecoration: 'none',
                                }}
                              >
                                <HiOutlineDocumentPlus size={16} />
                              </Link>

                              <Link
                                to={`/hojadevida?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                                title="Ver Hoja de Vida"
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  fontSize: '12px',
                                  textDecoration: 'none',
                                }}
                              >
                                <GoEye size={16} />
                              </Link>

                              <Link
                                to={`/editarequipo?id=${item?._id}`}
                                title="Editar Equipo"
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#fffbeb',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  fontSize: '12px',
                                  textDecoration: 'none',
                                }}
                              >
                                <CiEdit size={16} />
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
    </div>
  );
}
export default Inventario;
