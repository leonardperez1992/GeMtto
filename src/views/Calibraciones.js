import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiCalibraciones, apiEliminarCalibracion, apiIps, apiGetIps } from '../utils/api';
import request from '../utils/request';
import {
  FaPlus,
  FaFilePdf,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
  FaSearch,
} from 'react-icons/fa';
import { MdPrecisionManufacturing } from 'react-icons/md';

export default function Calibraciones() {
  const [certificados, setCertificados] = useState([]);
  const [listaIps, setListaIps] = useState([]);
  const [filtroIps, setFiltroIps] = useState('TODAS');
  const [filtroPlantilla, setFiltroPlantilla] = useState('TODAS');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarIps = async () => {
    const res = await request({ link: apiIps, method: 'GET' });
    if (res?.success && Array.isArray(res.ips)) {
      setListaIps(res.ips);
    } else {
      const fallback = await request({ link: apiGetIps, method: 'GET' });
      if (fallback?.success && Array.isArray(fallback.ips)) {
        setListaIps(fallback.ips);
      }
    }
  };

  const ipsDisponibles = useMemo(() => {
    const set = new Set();
    listaIps.forEach((item) => {
      const val = typeof item === 'string' ? item : item.ips || item.nombre || item.institucion;
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    });
    certificados.forEach((c) => {
      if (c.datosCliente?.nombre) set.add(c.datosCliente.nombre.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [listaIps, certificados]);

  const cargarCertificados = async () => {
    setLoading(true);
    let link = `${apiCalibraciones}?`;
    if (filtroIps !== 'TODAS') link += `ips=${filtroIps}&`;
    if (filtroPlantilla !== 'TODAS') link += `tipoPlantilla=${filtroPlantilla}&`;
    if (search.trim()) link += `search=${encodeURIComponent(search.trim())}&`;

    const res = await request({ link });
    if (res?.success) {
      setCertificados(res.certificados || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarIps();
  }, []);

  useEffect(() => {
    cargarCertificados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroIps, filtroPlantilla]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarCertificados();
  };

  const handleEliminar = async (id, numero) => {
    if (window.confirm(`¿Está seguro de eliminar el Certificado de Calibración ${numero}?`)) {
      const res = await request({
        link: `${apiEliminarCalibracion}/${id}`,
        method: 'DELETE',
      });
      if (res?.success) {
        alert('Certificado eliminado exitosamente');
        cargarCertificados();
      } else {
        alert(res?.message || 'Error al eliminar');
      }
    }
  };

  const getBadgePlantilla = (tipo) => {
    switch (tipo) {
      case 'presion_tensiometro':
        return { label: 'Tensiómetro / Presión', bg: '#e0f2fe', color: '#0369a1' };
      case 'masa_bascula':
        return { label: 'Báscula / Masa', bg: '#fef3c7', color: '#b45309' };
      case 'volumen_micropipeta':
        return { label: 'Micropipeta / Volumen', bg: '#f3e8ff', color: '#7e22ce' };
      default:
        return { label: tipo, bg: '#f1f5f9', color: '#475569' };
    }
  };

  const getDictamenBadge = (dictamen) => {
    if (dictamen === 'CONFORME') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            background: '#dcfce7',
            color: '#15803d',
          }}
        >
          <FaCheckCircle size={11} /> Conforme
        </span>
      );
    }
    if (dictamen === 'NO CONFORME') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            background: '#fee2e2',
            color: '#b91c1c',
          }}
        >
          <FaTimesCircle size={11} /> No Conforme
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          background: '#ffedd5',
          color: '#c2410c',
        }}
      >
        <FaExclamationCircle size={11} /> Observación
      </span>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1300, margin: '0 auto' }}>
      {/* Encabezado con acciones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 800 }}>
            Certificados de Calibración
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13.5 }}>
            Gestión metrológica e informes bajo la norma ISO/IEC 17025
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/patrones"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              color: '#334155',
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <MdPrecisionManufacturing size={17} color="#0284c7" /> Banco de Patrones
          </Link>

          <Link
            to="/crearcalibracion"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#0284c7',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            }}
          >
            <FaPlus size={13} /> Nueva Calibración
          </Link>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div
        style={{
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <form
          onSubmit={handleBuscar}
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: '1 1 280px',
            position: 'relative',
          }}
        >
          <FaSearch
            size={14}
            style={{ position: 'absolute', left: 12, color: '#94a3b8' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nº Certificado, Equipo, Serie o Placa..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              outline: 'none',
            }}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>IPS:</span>
          <select
            value={filtroIps}
            onChange={(e) => setFiltroIps(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="TODAS">Todas las IPS</option>
            {ipsDisponibles.map((nombreIps) => (
              <option key={nombreIps} value={nombreIps}>
                {nombreIps}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Tipo:</span>
          <select
            value={filtroPlantilla}
            onChange={(e) => setFiltroPlantilla(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="TODAS">Todos los tipos</option>
            <option value="presion_tensiometro">Tensiómetro / Presión</option>
            <option value="masa_bascula">Báscula / Masa</option>
            <option value="volumen_micropipeta">Micropipeta / Volumen</option>
          </select>
        </div>

        <button
          onClick={handleBuscar}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Filtrar
        </button>
      </div>

      {/* Tabla de Certificados */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '12px 16px' }}>Nº Certificado</th>
              <th style={{ padding: '12px 16px' }}>Fecha</th>
              <th style={{ padding: '12px 16px' }}>Equipo Calibrado</th>
              <th style={{ padding: '12px 16px' }}>Plantilla / Magnitud</th>
              <th style={{ padding: '12px 16px' }}>Cliente / IPS</th>
              <th style={{ padding: '12px 16px' }}>Dictamen</th>
              <th style={{ padding: '12px 16px' }}>Próx. Calibración</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
                  Cargando certificados de calibración...
                </td>
              </tr>
            ) : certificados.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  No se encontraron certificados de calibración con los filtros aplicados.
                </td>
              </tr>
            ) : (
              certificados.map((cert) => {
                const badge = getBadgePlantilla(cert.tipoPlantilla);
                return (
                  <tr
                    key={cert._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>
                      {cert.numeroCertificado}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {cert.fechaCalibracion}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {cert.datosEquipo?.nombre || 'Equipo'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {cert.datosEquipo?.marca} {cert.datosEquipo?.modelo} • S/N:{' '}
                        {cert.datosEquipo?.serie || 'S/N'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, color: '#334155' }}>
                        {cert.datosCliente?.nombre || 'IPS'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        {cert.datosCliente?.sede || cert.datosEquipo?.ubicacion}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {getDictamenBadge(cert.dictamenGlobal)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: 12.5 }}>
                      {cert.fechaProximaCalibracion || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Link
                          to={`/certificadocalibracion?id=${cert._id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#0284c7',
                            color: '#ffffff',
                            padding: '6px 10px',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                          title="Ver / Descargar PDF Oficial"
                        >
                          <FaFilePdf size={12} /> Ver Certificado
                        </Link>

                        <Link
                          to={`/editarcalibracion?id=${cert._id}`}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: '6px 8px',
                            borderRadius: 6,
                            color: '#0284c7',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Editar"
                        >
                          <FaEdit size={13} />
                        </Link>

                        <button
                          onClick={() => handleEliminar(cert._id, cert.numeroCertificado)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fca5a5',
                            padding: '6px 8px',
                            borderRadius: 6,
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Eliminar"
                        >
                          <FaTrash size={12} />
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
    </div>
  );
}
