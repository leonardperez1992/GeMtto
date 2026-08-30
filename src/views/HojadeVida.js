import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  apiObtenerEquipo,
  apiObtenerFicha,
  apiObtenerReportes,
  apiGetIps,
  apiEliminarEquipo,
} from '../utils/api';
import request from '../utils/request';
import { FaFileMedical, FaTrash, FaPrint, FaArrowLeft } from 'react-icons/fa';
import { GoEye } from 'react-icons/go';

function HojaDeVida() {
  const [equipo, setEquipo] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [imagen, setImagen] = useState('');
  const [ipsLogo, setIpsLogo] = useState('');
  const [loading, setLoading] = useState(true);

  const obtenerEquipos = async (id) => {
    const response = await request({
      link: apiObtenerEquipo,
      method: 'GET',
      body: { id },
    });
    if (response && response.success) {
      setEquipo(response.equipo);
    }
  };

  const obtenerFicha = async (modelo) => {
    if (!modelo) return;
    const response = await request({
      link: apiObtenerFicha,
      method: 'GET',
      body: { modelo },
    });
    if (response && response.success && response.ficha) {
      setFicha(response.ficha);
      if (response.ficha.imagen && response.ficha.imagen[0]) {
        setImagen(response.ficha.imagen[0].data_url);
      }
    }
  };

  const obtenerReportes = async (serie) => {
    if (!serie) return;
    const response = await request({
      link: apiObtenerReportes,
      method: 'GET',
      body: { serie },
    });
    if (response && response.success) {
      setReportes(response.reportes || []);
    }
  };

  const obtenerIps = async (ips) => {
    if (!ips) return;
    const response = await request({
      link: apiGetIps,
      method: 'GET',
      body: { ips },
    });
    if (response && response.success && response.institucion?.logo?.[0]) {
      setIpsLogo(response.institucion.logo[0].data_url);
    }
  };

  const deletEquipo = async () => {
    let confirmar = window.confirm('¿Deseas eliminar definitivamente este equipo?');
    if (confirmar) {
      const body = { _id: equipo._id };
      const response = await request({
        link: apiEliminarEquipo,
        body,
        method: 'POST',
      });
      if (response.success) {
        alert('Equipo eliminado exitosamente');
        window.location.href = './inventarioua';
      } else {
        alert(`${response.message}`);
      }
    }
  };

  useEffect(() => {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    let modelo = queryParameters.get('modelo');
    let serie = queryParameters.get('serie');
    let ips = queryParameters.get('institucion');

    if (!idEquipo) {
      alert('Por favor seleccione un equipo en la pestaña de Inventario');
      window.location.href = './inventarioua';
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        obtenerEquipos(idEquipo),
        obtenerFicha(modelo),
        obtenerReportes(serie),
        obtenerIps(ips),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="contenedor" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        Cargando hoja de vida del equipo...
      </div>
    );
  }

  return (
    <div className="contenedor" style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      {/* Top Action Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '14px 20px',
          borderRadius: '10px',
          border: '1px solid #334155',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Link
          to="/inventarioua"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#38bdf8',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          <FaArrowLeft /> Volver a Inventario
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13.5px',
              cursor: 'pointer',
            }}
          >
            <FaPrint /> Imprimir Hoja de Vida
          </button>
          <button
            onClick={deletEquipo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#7f1d1d',
              color: '#fca5a5',
              border: '1px solid #ef4444',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13.5px',
              cursor: 'pointer',
            }}
          >
            <FaTrash /> Eliminar Equipo
          </button>
        </div>
      </div>

      {/* Printable Sheet (Crisp White Background, Sharp Borders) */}
      <div className="documento-hoja-vida">
        <table className="tabla-documento">
          {/* Header */}
          <thead>
            <tr>
              <td colSpan={1} style={{ width: '25%', padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                {ipsLogo ? (
                  <img src={ipsLogo} alt="IPS Logo" style={{ maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontWeight: 'bold', color: '#0f3b60', fontSize: '12px' }}>{equipo?.institucion}</div>
                )}
              </td>
              <td
                colSpan={2}
                style={{
                  width: '50%',
                  textAlign: 'center',
                  padding: '10px',
                  verticalAlign: 'middle',
                }}
              >
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f3b60', letterSpacing: '0.5px' }}>
                  HOJA DE VIDA DE EQUIPO BIOMÉDICO
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  SISTEMA DE GESTIÓN Y MANTENIMIENTO HOSPITALARIO
                </div>
              </td>
              <td colSpan={1} style={{ width: '25%', padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                <img
                  src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                  alt="Logo"
                  style={{ maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' }}
                />
              </td>
            </tr>
          </thead>
          <tbody>
            {/* 1. Ubicación Institucional */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                1. UBICACIÓN INSTITUCIONAL
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">IPS / CLIENTE:</span> {equipo?.institucion}
              </td>
              <td colSpan={2}>
                <span className="label-bold">SERVICIO:</span> {equipo?.servicio}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">UBICACIÓN / ÁREA:</span> {equipo?.ubicacion}
              </td>
              <td colSpan={2}>
                <span className="label-bold">RESPONSABLE:</span> {equipo?.responsable}
              </td>
            </tr>

            {/* 2. Identificación del Equipo */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                2. IDENTIFICACIÓN DEL EQUIPO
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                rowSpan={7}
                style={{
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRight: '1.5px solid #1e293b',
                }}
              >
                {imagen ? (
                  <img
                    src={imagen}
                    alt={equipo?.equipo}
                    style={{
                      maxHeight: '220px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    <FaFileMedical size={40} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                    <br />
                    Sin fotografía registrada
                  </div>
                )}
              </td>
              <td style={{ width: '22%', fontWeight: '700', backgroundColor: '#f1f5f9' }}>NOMBRE EQUIPO:</td>
              <td style={{ width: '28%', fontWeight: 'bold', color: '#0f3b60' }}>{equipo?.equipo}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '700', backgroundColor: '#f1f5f9' }}>MARCA:</td>
              <td>{equipo?.marca}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '700', backgroundColor: '#f1f5f9' }}>MODELO:</td>
              <td>{equipo?.modelo}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '700', backgroundColor: '#f1f5f9' }}>SERIE:</td>
              <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{equipo?.serie}</span></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '700', backgroundColor: '#f1f5f9' }}>CÓDIGO INVENTARIO:</td>
              <td>{equipo?.inventario || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '700', backgroundColor: '#f1f5f9' }}>REGISTRO SANITARIO:</td>
              <td>{equipo?.registro_invima}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '700', backgroundColor: '#f1f5f9' }}>CLASIFICACIÓN DE RIESGO:</td>
              <td>
                <span style={{ fontWeight: 'bold', color: '#0369a1' }}>{equipo?.riesgo}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">FORMA DE ADQUISICIÓN:</span> {equipo?.forma_adquisicion || 'COMPRA'}
              </td>
              <td colSpan={2}>
                <span className="label-bold">FECHA DE INSTALACIÓN:</span> {equipo?.fecha_instalacion || 'N/A'}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">FECHA DE FABRICACIÓN:</span> {equipo?.fecha_fabricacion || 'N/A'}
              </td>
              <td colSpan={2}>
                <span className="label-bold">PERIODICIDAD DE MTTO:</span>{' '}
                <strong style={{ color: '#0f3b60' }}>{equipo?.periodicidad || 'SEMESTRAL'}</strong>
              </td>
            </tr>

            {/* 3. Información Técnica */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                3. ESPECIFICACIONES TÉCNICAS
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">CLASIFICACIÓN BIOMÉDICA:</span> {ficha?.clas_biomedica || '-'}
              </td>
              <td colSpan={2}>
                <span className="label-bold">TECNOLOGÍA PREDOMINANTE:</span> {ficha?.tecnologia || '-'}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">VOLTAJE:</span> {ficha?.voltaje || '-'}
              </td>
              <td colSpan={2}>
                <span className="label-bold">AMPERAJE:</span> {ficha?.amperaje || '-'}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">TEMPERATURA:</span> {ficha?.temperatura || '-'}
              </td>
              <td colSpan={2}>
                <span className="label-bold">FRECUENCIA:</span> {ficha?.frecuencia || '-'}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">POTENCIA:</span> {ficha?.potencia || '-'}
              </td>
              <td colSpan={2}>
                <span className="label-bold">BATERÍA:</span> {ficha?.bateria || '-'}
              </td>
            </tr>

            {/* 4. Accesorios */}
            <tr>
              <td colSpan={3} className="seccion-titulo">
                4. ACCESORIOS ASOCIADOS
              </td>
              <td className="seccion-titulo" style={{ textAlign: 'center', width: '20%' }}>
                CANTIDAD
              </td>
            </tr>
            {ficha?.accesorio1 ? (
              <>
                <tr>
                  <td colSpan={3}>{ficha?.accesorio1}</td>
                  <td style={{ textAlign: 'center' }}>{ficha?.cantidad1 || 1}</td>
                </tr>
                {ficha?.accesorio2 && (
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio2}</td>
                    <td style={{ textAlign: 'center' }}>{ficha?.cantidad2 || 1}</td>
                  </tr>
                )}
                {ficha?.accesorio3 && (
                  <tr>
                    <td colSpan={3}>{ficha?.accesorio3}</td>
                    <td style={{ textAlign: 'center' }}>{ficha?.cantidad3 || 1}</td>
                  </tr>
                )}
              </>
            ) : (
              <tr>
                <td colSpan={3} style={{ color: '#64748b', fontStyle: 'italic' }}>Sin accesorios adicionales</td>
                <td style={{ textAlign: 'center', color: '#64748b' }}>-</td>
              </tr>
            )}

            {/* 5. Recomendaciones */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                5. RECOMENDACIONES DEL FABRICANTE
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: '12px', minHeight: '60px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                {ficha?.recomendaciones || 'Realizar mantenimiento preventivo periódico, limpieza con desinfectante no corrosivo y verificación de calibración periódica.'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 6. Historial de Actividades y Mantenimientos */}
        <div style={{ marginTop: '30px' }}>
          <table className="tabla-documento">
            <thead>
              <tr>
                <td colSpan={6} className="seccion-titulo">
                  6. REGISTRO HISTÓRICO DE ACTIVIDADES Y MANTENIMIENTOS
                </td>
              </tr>
              <tr>
                <th style={{ width: '15%' }}>FECHA</th>
                <th style={{ width: '20%' }}>TIPO DE SERVICIO</th>
                <th style={{ width: '35%' }}>OBSERVACIONES / DESCRIPCIÓN</th>
                <th style={{ width: '15%' }}>RESPONSABLE</th>
                <th style={{ width: '10%' }}>Nº REP.</th>
                <th style={{ width: '5%', textAlign: 'center' }}>VER</th>
              </tr>
            </thead>
            <tbody>
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    No hay reportes de servicio registrados para esta serie.
                  </td>
                </tr>
              ) : (
                reportes.map((rep) => (
                  <tr key={rep._id}>
                    <td>{rep.fecha}</td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: '#0f3b60' }}>{rep.tipo_servicio}</span>
                    </td>
                    <td>{rep.observaciones || rep.desc_servicio || '-'}</td>
                    <td>{rep.nombre_ingeniero || '-'}</td>
                    <td><strong style={{ color: '#0284c7' }}>#{rep.numero_reporte}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <Link
                        to={`/reporte?id=${rep._id}`}
                        style={{
                          display: 'inline-flex',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          textDecoration: 'none',
                        }}
                        title="Ver Reporte"
                      >
                        <GoEye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HojaDeVida;
