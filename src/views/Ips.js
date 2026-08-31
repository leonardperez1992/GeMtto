import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiIps } from '../utils/api';
import request from '../utils/request';
import {
  FaHospital,
  FaPlus,
  FaSync,
  FaCity,
  FaIdCard,
} from 'react-icons/fa';
import { GoSearch } from 'react-icons/go';

function Ips() {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');

  const getReportes = async () => {
    setLoading(true);
    try {
      const response = await request({
        link: apiIps,
        method: 'GET',
      });
      if (response && response.success && response.ips) {
        setIps(response.ips);
      } else {
        alert(`Sin conexión con el Servidor ${response?.message || ''}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReportes();
  }, []);

  const filteredIps = useMemo(() => {
    let list = ips;
    if (buscar.trim() !== '') {
      const q = buscar.toLowerCase();
      list = ips.filter(
        (dato) =>
          (dato.ips && dato.ips.toLowerCase().includes(q)) ||
          (dato.nit && String(dato.nit).toLowerCase().includes(q)) ||
          (dato.ciudad && dato.ciudad.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => (a.ips || '').localeCompare(b.ips || ''));
  }, [ips, buscar]);

  return (
    <div className="contenedor">
      <main>
        {/* Header Title & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaHospital color="#38bdf8" /> Instituciones Prestadoras de Salud (IPS)
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Sedes hospitalarias, clínicas y centros asistenciales administrados en GEMTTO.
            </p>
          </div>

          {/* Botón Prominente: Registrar Nueva IPS */}
          <Link
            to="/crearips"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
              border: '1px solid #38bdf8',
              transition: 'all 0.2s',
            }}
          >
            <FaPlus size={13} /> Registrar Nueva IPS
          </Link>
        </div>

        {/* Toolbar & Search */}
        <div className="div-buscar" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative', width: '100%' }}>
            <input
              className="input-buscar"
              style={{ width: '100%', paddingRight: '40px' }}
              value={buscar}
              placeholder="Buscar IPS por nombre, NIT o ciudad..."
              onChange={(e) => setBuscar(e.target.value)}
            />
            <GoSearch
              size={18}
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

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '16px' }}>
            <FaSync className="fa-spin" style={{ marginRight: '8px' }} /> Cargando listado de IPS...
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #334155' }}>
              <table className="tabla-reportes" style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>LOGO</th>
                    <th>INSTITUCIÓN / IPS</th>
                    <th>NIT</th>
                    <th>CIUDAD / MUNICIPIO</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIps.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No se encontraron instituciones registradas con el criterio de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredIps.map((item, idx) => {
                      const hasLogo = item.logo && ((Array.isArray(item.logo) && item.logo.length > 0) || typeof item.logo === 'string');
                      const logoSrc = hasLogo ? (Array.isArray(item.logo) ? item.logo[0]?.data_url || item.logo[0] : item.logo) : null;

                      return (
                        <tr key={item._id || idx}>
                          <td style={{ textAlign: 'center' }}>
                            {logoSrc ? (
                              <img
                                src={logoSrc}
                                alt={item.ips}
                                style={{
                                  maxHeight: '32px',
                                  maxWidth: '45px',
                                  objectFit: 'contain',
                                  borderRadius: '4px',
                                  verticalAlign: 'middle',
                                }}
                              />
                            ) : (
                              <FaHospital size={20} color="#38bdf8" />
                            )}
                          </td>
                          <td>
                            <strong style={{ color: '#f8fafc', fontSize: '13px' }}>{item?.ips}</strong>
                          </td>
                          <td style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                            {item?.nit ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <FaIdCard color="#94a3b8" size={13} /> {item.nit}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>Sin NIT</span>
                            )}
                          </td>
                          <td style={{ color: '#38bdf8', fontWeight: '600' }}>
                            {item?.ciudad ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <FaCity color="#38bdf8" size={13} /> {item.ciudad}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>No especificada</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                              }}
                            >
                              ACTIVA
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '12px', color: '#94a3b8', fontSize: '12.5px', textAlign: 'right' }}>
              Total instituciones registradas: <strong style={{ color: '#38bdf8' }}>{filteredIps.length}</strong>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Ips;
