import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiInventario } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { GoEye, GoSearch } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

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
        <section>
          <div>
            <div className="div-buscar" style={{ display: 'inline-block' }}>
              <Link
                style={{
                  fontSize: '25px',
                  width: '100px',
                  padding: '5px',
                  borderRadius: '10px',
                  backgroundColor: '#dfeaf5',
                  fontStyle: 'normal',
                }}
                to="/createinventary"
                className="link"
              >
                <HiOutlineDocumentPlus title="Crear" size={25} />
              </Link>
              <input
                className="input-buscar"
                value={buscar}
                placeholder="Buscar por serie, equipo, IPS..."
                onChange={handleSave}
              />
              <GoSearch size={30} className="lupa" />
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
                              <div
                                style={{
                                  width: '90%',
                                  display: 'inline-block',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Link
                                  to={`/reporteService?id=${item?._id}&equipo=${encodeURIComponent(item?.equipo || '')}&serie=${encodeURIComponent(item?.serie || '')}&institucion=${encodeURIComponent(item?.institucion || '')}&servicio=${encodeURIComponent(item?.servicio || '')}&marca=${encodeURIComponent(item?.marca || '')}&modelo=${encodeURIComponent(item?.modelo || '')}`}
                                  className="nav-link"
                                >
                                  <HiOutlineDocumentPlus
                                    style={{ padding: '5px' }}
                                    title="Reporte"
                                    size={20}
                                  />
                                </Link>

                                <Link
                                  to={`/hojadevida?id=${item._id}&modelo=${encodeURIComponent(item.modelo || '')}&serie=${encodeURIComponent(item.serie || '')}&institucion=${encodeURIComponent(item.institucion || '')}`}
                                  className="nav-link"
                                >
                                  <GoEye
                                    style={{ padding: '5px' }}
                                    title="Ver"
                                    size={20}
                                  />
                                </Link>

                                <Link
                                  to={`/editarequipo?id=${item?._id}`}
                                  className="nav-link"
                                >
                                  <CiEdit
                                    style={{ padding: '5px' }}
                                    title="Editar"
                                    size={20}
                                  />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

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
          </div>
        </section>
      </main>
    </div>
  );
}
export default Inventario;
