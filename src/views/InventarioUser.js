import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiObtenerEquiposIps } from '../utils/api';
import request from '../utils/request';
import { useSelector } from 'react-redux';
import Pagination from '../components/Pagination';
import { GoSearch, GoEye } from 'react-icons/go';
import { FaBoxes } from 'react-icons/fa';

function InventarioUser() {
  const user = useSelector((state) => state.user);
  const institucion = user?.institucion;
  const [inventario, setInventario] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const getInventario = async (institucion) => {
    if (!institucion) return;
    setLoading(true);
    try {
      const response = await request({
        link: `${apiObtenerEquiposIps}?institucion=${encodeURIComponent(institucion)}`,
        method: 'GET',
      });
      if (response && response.success) {
        setInventario(response.equipos || []);
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
    getInventario(institucion);
  }, [institucion]);

  const handleSave = (e) => {
    setBuscar(e.target.value);
    setCurrentPage(1);
  };

  const filteredInventarios = useMemo(() => {
    if (!buscar.trim()) return inventario;
    const q = buscar.toLowerCase();
    return inventario.filter(
      (dato) =>
        (dato.servicio && dato.servicio.toLowerCase().includes(q)) ||
        (dato.equipo && dato.equipo.toLowerCase().includes(q)) ||
        (dato.serie && dato.serie.toLowerCase().includes(q)) ||
        (dato.marca && dato.marca.toLowerCase().includes(q)) ||
        (dato.modelo && dato.modelo.toLowerCase().includes(q)) ||
        (dato.ubicacion && dato.ubicacion.toLowerCase().includes(q)),
    );
  }, [inventario, buscar]);

  const paginatedInventarios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInventarios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInventarios, currentPage, itemsPerPage]);

  return (
    <div className="contenedor">
      <main>
        {/* Header Title */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBoxes color="#38bdf8" /> Inventario de Equipos - {institucion || 'Mi Institución'}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Consulta y seguimiento del parque biomédico asignado a tu institución.
          </p>
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
                            <Link
                              to={`/hojadevidausuario?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                              className="action-btn action-btn-view"
                              title="Ver Hoja de Vida"
                            >
                              <GoEye size={16} color="#38bdf8" /> Ver Hoja
                            </Link>
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
export default InventarioUser;
