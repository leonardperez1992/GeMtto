import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiReportes } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { FaFileSignature } from 'react-icons/fa';
import { GoSearch, GoEye } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';

function Reportes() {
  const [reportes, setReportes] = useState([]);
  const [buscar, setBuscar] = useState('');
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
      if (response && response.success) {
        setReportes(response.reporte || []);
      } else {
        alert(`Sin conexión con el Servidor ${response?.message || ''}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error al obtener reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReportes();
  }, []);

  const handleSave = (e) => {
    setBuscar(e.target.value);
    setCurrentPage(1); // Reset page on new search
  };

  // Filtered and sorted reportes
  const filteredReportes = useMemo(() => {
    let result = reportes;
    if (buscar.trim() !== '') {
      const q = buscar.toLowerCase();
      result = reportes.filter(
        (dato) =>
          (dato.numero_reporte && String(dato.numero_reporte).toLowerCase().includes(q)) ||
          (dato.serie && dato.serie.toLowerCase().includes(q)) ||
          (dato.institucion && dato.institucion.toLowerCase().includes(q)) ||
          (dato.servicio && dato.servicio.toLowerCase().includes(q)) ||
          (dato.equipo && dato.equipo.toLowerCase().includes(q)) ||
          (dato.tipo_servicio && dato.tipo_servicio.toLowerCase().includes(q)) ||
          (dato.nombre_ingeniero && dato.nombre_ingeniero.toLowerCase().includes(q)),
      );
    }

    return [...result].sort((a, b) => {
      if (a.fecha < b.fecha) return 1;
      if (a.fecha > b.fecha) return -1;
      return 0;
    });
  }, [reportes, buscar]);

  // Paginated slice
  const paginatedReportes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReportes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReportes, currentPage, itemsPerPage]);

  return (
    <div className="contenedor">
      <main>
        <div
          className="div-buscar"
          style={{ display: 'inline-block', alignContent: 'center' }}
        >
          <Link
            style={{
              fontSize: '25px',
              width: '100px',
              padding: '5px',
              borderRadius: '10px',
              backgroundColor: '#dfeaf5',
              fontStyle: 'normal',
            }}
            to="/firmareportes"
            className="link"
          >
            <FaFileSignature title="Firmar" size={30} />
          </Link>
          <input
            className="input-buscar"
            value={buscar}
            placeholder="Buscar por serie, nº reporte, IPS..."
            onChange={handleSave}
          />
          <GoSearch size={25} className="lupa" />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
            Cargando reportes de servicio...
          </div>
        ) : (
          <div className="contenedor">
            <table className="tabla-actividades">
              <thead>
                <tr>
                  <th>Nº REPORTE</th>
                  <th>TIPO SERVICIO</th>
                  <th>FECHA</th>
                  <th>EQUIPO</th>
                  <th>MARCA</th>
                  <th>MODELO</th>
                  <th>SERIE</th>
                  <th>INSTITUCION</th>
                  <th>SERVICIO</th>
                  <th>RESPONSABLE</th>
                  <th>ACCION</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReportes.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                      No se encontraron reportes.
                    </td>
                  </tr>
                ) : (
                  paginatedReportes.map(function (item) {
                    return (
                      <tr key={item._id}>
                        <td><strong>{item?.numero_reporte}</strong></td>
                        <td>{item?.tipo_servicio}</td>
                        <td>{item?.fecha}</td>
                        <td>{item?.equipo}</td>
                        <td>{item?.marca}</td>
                        <td>{item?.modelo}</td>
                        <td><span style={{ fontFamily: 'monospace' }}>{item?.serie}</span></td>
                        <td>{item?.institucion}</td>
                        <td>{item?.servicio}</td>
                        <td>{item?.nombre_ingeniero}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link to={`/reporte?id=${item._id}`} className="nav-link">
                              <GoEye
                                style={{ padding: '5px' }}
                                title="Ver"
                                size={20}
                              />
                            </Link>
                            <Link
                              to={`/editareporte?id=${item._id}`}
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
              totalItems={filteredReportes.length}
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
export default Reportes;
