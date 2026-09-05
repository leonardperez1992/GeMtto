import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { apiIps, apiDeleteIps } from '../utils/api';
import request from '../utils/request';
import {
  FaHospital,
  FaPlus,
  FaSync,
  FaCity,
  FaEdit,
  FaTrash,
  FaFolderOpen,
  FaFilePdf,
  FaGoogleDrive,
} from 'react-icons/fa';
import { GoSearch } from 'react-icons/go';

function Ips() {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [deletingId, setDeletingId] = useState(null);

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

  const handleEliminar = async (item) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar la institución "${item.ips}"?\nSe borrarán también todos sus documentos PDF asociados.`
    );
    if (!confirmacion) return;

    setDeletingId(item._id);
    try {
      const response = await request({
        link: apiDeleteIps,
        method: 'POST',
        body: { _id: item._id, ips: item.ips },
      });

      if (response && response.success) {
        alert(`Institución "${item.ips}" eliminada exitosamente.`);
        setIps((prev) => prev.filter((i) => i._id !== item._id));
      } else {
        alert(response?.message || 'Error al eliminar la institución');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar la institución.');
    } finally {
      setDeletingId(null);
    }
  };

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

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={getReportes}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <FaSync size={13} className={loading ? 'spin' : ''} /> Actualizar
            </button>

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
                    <th style={{ width: '30%' }}>INSTITUCIÓN / IPS</th>
                    <th style={{ width: '15%' }}>NIT</th>
                    <th style={{ width: '15%' }}>CIUDAD</th>
                    <th style={{ width: '22%' }}>DOCUMENTACIÓN PDF</th>
                    <th style={{ textAlign: 'center', width: '18%' }}>ACCIONES</th>
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
                      const docsCount =
                        (item.plan_mantenimiento ? 1 : 0) +
                        (item.plan_capacitacion ? 1 : 0) +
                        (item.protocolos ? 1 : 0) +
                        (Array.isArray(item.documentos_adicionales) ? item.documentos_adicionales.length : 0);
                      const driveCount = Array.isArray(item.enlaces_drive) ? item.enlaces_drive.length : 0;

                      return (
                        <tr key={item._id || idx}>
                          {/* 1. Nombre Institución */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {(() => {
                                const logoUrl = Array.isArray(item.logo)
                                  ? item.logo[0]?.data_url
                                  : item.logo?.data_url || (typeof item.logo === 'string' ? item.logo : null);
                                if (logoUrl) {
                                  return (
                                    <div
                                      style={{
                                        backgroundColor: '#ffffff',
                                        padding: '2px 5px',
                                        borderRadius: '5px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '34px',
                                        height: '28px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                      }}
                                    >
                                      <img
                                        src={logoUrl}
                                        alt={item.ips}
                                        style={{ maxHeight: '24px', maxWidth: '48px', objectFit: 'contain' }}
                                      />
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <FaHospital size={14} color="#38bdf8" />
                                  </div>
                                );
                              })()}
                              <span style={{ fontWeight: '700', color: '#f8fafc' }}>{item.ips}</span>
                            </div>
                          </td>

                          {/* 2. NIT */}
                          <td>{item.nit || <span style={{ color: '#64748b' }}>Sin registrar</span>}</td>

                          {/* 3. Ciudad */}
                          <td>
                            {item.ciudad ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FaCity size={12} color="#38bdf8" /> {item.ciudad}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>No especificada</span>
                            )}
                          </td>

                          {/* 4. Documentos PDF & Drive */}
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {docsCount > 0 || driveCount > 0 ? (
                                <>
                                  {docsCount > 0 && (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                        color: '#34d399',
                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                      }}
                                    >
                                      <FaFilePdf size={11} color="#ef4444" /> {docsCount} PDF{docsCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {driveCount > 0 && (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                        color: '#38bdf8',
                                        border: '1px solid rgba(56, 189, 248, 0.4)',
                                      }}
                                    >
                                      <FaGoogleDrive size={11} color="#38bdf8" /> {driveCount} Drive
                                    </span>
                                  )}
                                  {item.plan_mantenimiento && (
                                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>• Plan Mtto</span>
                                  )}
                                  {item.plan_capacitacion && (
                                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>• Capacitación</span>
                                  )}
                                </>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '11.5px', fontStyle: 'italic' }}>
                                  Sin documentos adjuntos
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Acciones */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                              {/* Ver Documentos */}
                              <Link
                                to={`/documentosips?id=${item._id}&ips=${encodeURIComponent(item.ips)}`}
                                title="Ver Repositorio Documental"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0f766e',
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  border: '1px solid #14b8a6',
                                }}
                              >
                                <FaFolderOpen size={12} color="#34d399" /> Docs
                              </Link>

                              {/* Editar */}
                              <Link
                                to={`/editarips?id=${item._id}`}
                                title="Editar IPS y gestionar archivos"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  border: '1px solid #38bdf8',
                                }}
                              >
                                <FaEdit size={12} /> Editar
                              </Link>

                              {/* Eliminar */}
                              <button
                                type="button"
                                onClick={() => handleEliminar(item)}
                                disabled={deletingId === item._id}
                                title="Eliminar IPS"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: deletingId === item._id ? 'not-allowed' : 'pointer',
                                }}
                              >
                                <FaTrash size={11} /> {deletingId === item._id ? '...' : ''}
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
