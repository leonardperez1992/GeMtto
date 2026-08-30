import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiObtenerEquiposIps } from '../utils/api';
import request from '../utils/request';
import { useSelector } from 'react-redux';
import Pagination from '../components/Pagination';

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
        <section>
          <div>
            <div>
              <h3>Inventario General - {institucion || 'Mi Institución'}</h3>
            </div>
            <div>
              <div
                style={{
                  width: '300px',
                  margin: 10,
                }}
              >
                <h4>Buscar:</h4>
                <input
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    margin: 5,
                    borderRadius: 10,
                    borderStyle: 'solid',
                    height: 43,
                    padding: '0 10px',
                  }}
                  value={buscar}
                  type="text"
                  placeholder="Buscar por equipo, serie, servicio..."
                  onChange={handleSave}
                />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                  Cargando inventario...
                </div>
              ) : (
                <div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>EQUIPO</th>
                        <th>MARCA</th>
                        <th>MODELO</th>
                        <th>SERIE</th>
                        <th>INSTITUCION</th>
                        <th>SERVICIO</th>
                        <th>UBICACIÓN</th>
                        <th>REG. INVIMA</th>
                        <th>RIESGO</th>
                        <th>RESPONSABLE</th>
                        <th>ACCION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInventarios.length === 0 ? (
                        <tr>
                          <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                            No se encontraron equipos.
                          </td>
                        </tr>
                      ) : (
                        paginatedInventarios.map(function (item) {
                          return (
                            <tr key={item._id}>
                              <td>{item?.equipo}</td>
                              <td>{item?.marca}</td>
                              <td>{item?.modelo}</td>
                              <td>{item?.serie}</td>
                              <td>{item?.institucion}</td>
                              <td>{item?.servicio}</td>
                              <td>{item?.ubicacion}</td>
                              <td>{item?.registro_invima}</td>
                              <td>{item?.riesgo}</td>
                              <td>{item?.responsable}</td>
                              <td>
                                <Link
                                  to={`/hojadevidausuario?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                                  className="nav-link"
                                >
                                  Hoja de Vida
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default InventarioUser;
