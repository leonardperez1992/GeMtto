import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiReportes } from '../utils/api';
import request from '../utils/request';
import Pagination from '../components/Pagination';
import { FaFileSignature, FaFileInvoice } from 'react-icons/fa';
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
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f2b48', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaFileInvoice color="#0d6efd" /> Reportes de Servicio Técnico
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Historial de intervenciones, mantenimientos preventivos y correctivos.
            </p>
          </div>
          <Link
            to="/firmareportes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0f3b60',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(15,59,96,0.25)',
              transition: 'all 0.2s',
            }}
          >
            <FaFileSignature size={14} /> Firmar Reportes Masivos
          </Link>
        </div>

        {/* Toolbar & Search */}
        <div className="div-buscar">
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar por Nº reporte, serie, equipo, tipo de servicio, IPS o responsable..."
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
            Cargando reportes de servicio...
          </div>
        ) : (
          <div>
            <div className="table-responsive-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nº REPORTE</th>
                    <th>TIPO SERVICIO</th>
                    <th>FECHA</th>
                    <th>EQUIPO</th>
                    <th>MARCA / MODELO</th>
                    <th>SERIE</th>
                    <th>INSTITUCIÓN</th>
                    <th>SERVICIO</th>
                    <th>RESPONSABLE</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportes.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No se encontraron reportes.
                      </td>
                    </tr>
                  ) : (
                    paginatedReportes.map(function (item) {
                      return (
                        <tr key={item._id}>
                          <td>
                            <strong style={{ color: '#0d6efd' }}>#{item?.numero_reporte}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                backgroundColor: String(item?.tipo_servicio).includes('CORRECTIVO') ? '#fee2e2' : '#dcfce7',
                                color: String(item?.tipo_servicio).includes('CORRECTIVO') ? '#b91c1c' : '#15803d',
                              }}
                            >
                              {item?.tipo_servicio}
                            </span>
                          </td>
                          <td>{item?.fecha}</td>
                          <td><strong>{item?.equipo}</strong></td>
                          <td>
                            {item?.marca}
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{item?.modelo}</div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0f3b60' }}>
                              {item?.serie}
                            </span>
                          </td>
                          <td>{item?.institucion}</td>
                          <td>{item?.servicio}</td>
                          <td>{item?.nombre_ingeniero || 'No registrado'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                              <Link
                                to={`/reporte?id=${item._id}`}
                                title="Ver / Imprimir Reporte PDF"
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
                                <GoEye size={16} />
                              </Link>
                              <Link
                                to={`/editareporte?id=${item._id}`}
                                title="Editar Reporte"
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
