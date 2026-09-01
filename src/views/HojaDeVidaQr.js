import React, { useState, useEffect } from 'react';
import {
  apiObtenerEquipo,
  apiObtenerFicha,
  apiObtenerReportes,
  apiGetIps,
  apiObtenerReportesExternos,
  apiVerReporteExterno,
  apiVerDocumentoFicha,
} from '../utils/api';
import request from '../utils/request';
import {
  FaPrint,
  FaBook,
  FaFileAlt,
  FaShieldAlt,
  FaBoxOpen,
  FaWrench,
  FaCheckCircle,
  FaQrcode,
  FaHospital,
  FaCheckDouble,
} from 'react-icons/fa';
import { GoEye } from 'react-icons/go';
import { Link } from 'react-router-dom';

function HojaDeVidaQr() {
  const [equipo, setEquipo] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [reportesExternos, setReportesExternos] = useState([]);
  const [imagen, setImagen] = useState('');
  const [ipsLogo, setIpsLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ficha'); // 'ficha' | 'historial' | 'documentos'

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

  const obtenerReportesExternos = async (serie) => {
    if (!serie) return;
    try {
      const response = await request({
        link: `${apiObtenerReportesExternos}?serie=${encodeURIComponent(serie)}`,
        method: 'GET',
      });
      if (response && response.success) {
        setReportesExternos(response.reportes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const obtenerIps = async (institucion) => {
    if (!institucion) return;
    try {
      const response = await request({
        link: apiGetIps,
        method: 'GET',
        body: { institucion },
      });
      if (response && response.success && response.ips && response.ips.length > 0) {
        const found = response.ips.find(
          (item) => item.ips?.trim().toUpperCase() === institucion.trim().toUpperCase()
        );
        if (found && found.logo) {
          setIpsLogo(found.logo);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const queryParameters = new URLSearchParams(window.location.search);
      const id = queryParameters.get('id');

      if (id) {
        try {
          const res = await request({
            link: apiObtenerEquipo,
            method: 'GET',
            body: { id },
          });

          if (res && res.success && res.equipo) {
            setEquipo(res.equipo);
            await Promise.all([
              obtenerFicha(res.equipo.modelo),
              obtenerReportes(res.equipo.serie),
              obtenerReportesExternos(res.equipo.serie),
              obtenerIps(res.equipo.institucion),
            ]);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    };

    init();
  }, []);

  // Consolidado cronológico de reportes internos y externos
  const todosLosReportes = [
    ...reportes.map((rep) => ({
      _id: rep._id,
      esExterno: false,
      fecha: rep.fecha || '',
      tipo_servicio: rep.tipo_servicio || 'MANTENIMIENTO',
      responsable_proveedor: rep.nombre_ingeniero || 'Ingeniero Biomédico',
      descripcion: rep.desc_servicio || rep.problema_reportado || '-',
      numero_documento: rep.numero_reporte ? `#${rep.numero_reporte}` : '-',
      nombre_original: null,
      data: rep,
    })),
    ...reportesExternos.map((rep) => ({
      _id: rep._id,
      esExterno: true,
      fecha: rep.fecha || '',
      tipo_servicio: rep.tipo_servicio || '-',
      responsable_proveedor: rep.proveedor || 'Proveedor Externo',
      descripcion: rep.descripcion || '-',
      numero_documento: rep.numero_reporte ? `#${rep.numero_reporte}` : 'Doc. PDF',
      nombre_original: rep.nombre_original,
      data: rep,
    })),
  ].sort((a, b) => {
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return b.fecha.localeCompare(a.fecha);
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#38bdf8', fontSize: '16px' }}>
        <FaQrcode size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
        <div>Cargando Hoja de Vida digital...</div>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '30px', backgroundColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', border: '1px solid #334155' }}>
        <h3 style={{ color: '#ef4444' }}>Equipo no encontrado</h3>
        <p style={{ color: '#94a3b8' }}>No se encontró información para el código QR escaneado.</p>
        <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>
          Ir al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="contenedor" style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 15px' }}>
      {/* Estilos para pestañas, impresión y salto de página */}
      <style>{`
        @media screen {
          .ocultar-en-pantalla {
            display: none !important;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .hoja-pagina {
            display: block !important;
          }
          .pagina-2, .pagina-3 {
            page-break-before: always !important;
            break-before: page !important;
            margin-top: 0 !important;
            padding-top: 10px !important;
          }
        }
      `}</style>

      {/* Banner de Verificación y Barra de Acción */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid #38bdf8',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '8px', color: '#38bdf8' }}>
            <FaCheckDouble size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              HOJA DE VIDA DIGITAL VERIFICADA
              <span style={{ fontSize: '11px', backgroundColor: '#15803d', color: '#ffffff', padding: '2px 8px', borderRadius: '12px' }}>
                OFICIAL
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {equipo.institucion} • {equipo.equipo} ({equipo.serie})
            </div>
          </div>
        </div>

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
            fontWeight: '700',
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <FaPrint /> Imprimir Hoja de Vida
        </button>
      </div>

      {/* Pestañas de Navegación (Tabs) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: '2px solid #334155',
          paddingBottom: '2px',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('ficha')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: activeTab === 'ficha' ? '#0284c7' : '#1e293b',
            color: activeTab === 'ficha' ? '#ffffff' : '#94a3b8',
            border: activeTab === 'ficha' ? '1px solid #38bdf8' : '1px solid #334155',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          📄 Ficha Técnica / Hoja de Vida
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: activeTab === 'historial' ? '#0284c7' : '#1e293b',
            color: activeTab === 'historial' ? '#ffffff' : '#94a3b8',
            border: activeTab === 'historial' ? '1px solid #38bdf8' : '1px solid #334155',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          📋 Historial de Mantenimientos
        </button>
        <button
          onClick={() => setActiveTab('documentos')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: activeTab === 'documentos' ? '#0284c7' : '#1e293b',
            color: activeTab === 'documentos' ? '#ffffff' : '#94a3b8',
            border: activeTab === 'documentos' ? '1px solid #38bdf8' : '1px solid #334155',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          📁 Documentos del Equipo
        </button>
      </div>

      {/* PÁGINA 1: IDENTIFICACIÓN Y FICHA TÉCNICA DEL EQUIPO */}
      <div className={`documento-hoja-vida hoja-pagina ${activeTab !== 'ficha' ? 'ocultar-en-pantalla' : ''}`}>
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
                colSpan={3}
                style={{
                  width: '50%',
                  textAlign: 'center',
                  padding: '10px',
                  verticalAlign: 'middle',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f3b60', letterSpacing: '0.5px' }}>
                  HOJA DE VIDA DE EQUIPO BIOMÉDICO
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginTop: '2px' }}>
                  GESTIÓN Y CONTROL DE TECNOLOGÍA BIOMÉDICA
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
            {/* 1. Datos de Identificación */}
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                1. DATOS DE IDENTIFICACIÓN DEL EQUIPO
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ verticalAlign: 'top', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                  <tbody>
                    <tr>
                      <th style={{ width: '38%', backgroundColor: '#f8fafc', color: '#0f3b60' }}>EQUIPO:</th>
                      <td><strong>{equipo?.equipo}</strong></td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>MARCA:</th>
                      <td>{equipo?.marca}</td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>MODELO:</th>
                      <td>{equipo?.modelo}</td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>SERIE:</th>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#0284c7' }}>{equipo?.serie}</span></td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>INVENTARIO / ACTIVO:</th>
                      <td>{equipo?.inventario || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>REGISTRO SANITARIO INVIMA:</th>
                      <td>{equipo?.registro_invima || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>FECHA DE COMPRA / INSTALACIÓN:</th>
                      <td>{equipo?.fecha_compra || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>FECHA PUESTA EN SERVICIO:</th>
                      <td>{equipo?.fecha_operacion || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>VENCIMIENTO DE GARANTÍA:</th>
                      <td>{equipo?.vencimiento_garantia || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>VIDA ÚTIL ESTIMADA:</th>
                      <td>{equipo?.vida_util ? `${equipo?.vida_util} Años` : 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              {/* Foto del Equipo */}
              <td colSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px', backgroundColor: '#f8fafc' }}>
                {imagen ? (
                  <img
                    src={imagen}
                    alt="Foto del Equipo"
                    style={{
                      maxHeight: '190px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', padding: '30px 10px' }}>
                    Sin fotografía adjunta
                  </div>
                )}
              </td>
            </tr>

            {/* 2. Ubicación Institucional */}
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                2. UBICACIÓN INSTITUCIONAL Y RESPONSABLE
              </td>
            </tr>
            <tr>
              <th style={{ width: '20%', backgroundColor: '#f8fafc', color: '#0f3b60' }}>INSTITUCIÓN / IPS:</th>
              <td colSpan={2}>{equipo?.institucion}</td>
              <th style={{ width: '20%', backgroundColor: '#f8fafc', color: '#0f3b60' }}>SERVICIO / ÁREA:</th>
              <td>{equipo?.servicio}</td>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>UBICACIÓN EXACTA:</th>
              <td colSpan={2}>{equipo?.ubicacion || 'N/A'}</td>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>RESPONSABLE DEL EQUIPO:</th>
              <td>{equipo?.responsable || 'N/A'}</td>
            </tr>

            {/* 3. Clasificación Técnica y Biomédica */}
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                3. CLASIFICACIÓN TÉCNICA Y BIOMÉDICA
              </td>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>CLASIFICACIÓN BIOMÉDICA:</th>
              <td colSpan={2}>{ficha?.clas_biomedica || equipo?.clasificacion_biomedica || 'N/A'}</td>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>CLASIFICACIÓN DE RIESGO:</th>
              <td>
                <strong style={{ color: '#0284c7' }}>{equipo?.riesgo || 'CLASE IIA'}</strong>
              </td>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>TECNOLOGÍA PREDOMINANTE:</th>
              <td colSpan={2}>{ficha?.tecnologia || equipo?.tecnologia || 'N/A'}</td>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>USO / APLICACIÓN:</th>
              <td>{equipo?.uso || 'CLÍNICO / MÉDICO'}</td>
            </tr>

            {/* 4. Especificaciones Técnicas y Eléctricas */}
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                4. ESPECIFICACIONES TÉCNICAS Y ELÉCTRICAS (MODELO)
              </td>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>VOLTAJE:</th>
              <td>{ficha?.voltaje ? `${ficha?.voltaje} VAC` : 'N/A'}</td>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>AMPERAJE / CORRIENTE:</th>
              <td>{ficha?.amperaje ? `${ficha?.amperaje} A` : 'N/A'}</td>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>POTENCIA:</th>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>FRECUENCIA:</th>
              <td>{ficha?.frecuencia ? `${ficha?.frecuencia} Hz` : 'N/A'}</td>
              <th style={{ backgroundColor: '#f8fafc', color: '#0f3b60' }}>BATERÍA:</th>
              <td>{ficha?.bateria || 'N/A'}</td>
              <td style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                {ficha?.potencia ? `${ficha?.potencia} W` : 'N/A'}
              </td>
            </tr>

            {/* 5. Accesorios y Cantidades */}
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                5. ACCESORIOS REGISTRADOS
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', fontSize: '11px', textAlign: 'left' }}>
                      <th style={{ width: '35%', padding: '6px' }}>ACCESORIO 1</th>
                      <th style={{ width: '15%', padding: '6px' }}>CANTIDAD</th>
                      <th style={{ width: '35%', padding: '6px' }}>ACCESORIO 2</th>
                      <th style={{ width: '15%', padding: '6px' }}>CANTIDAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{ficha?.accesorio1 || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{ficha?.cantidad1 || '-'}</td>
                      <td>{ficha?.accesorio2 || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{ficha?.cantidad2 || '-'}</td>
                    </tr>
                    <tr>
                      <td>{ficha?.accesorio3 || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{ficha?.cantidad3 || '-'}</td>
                      <td>{ficha?.accesorio4 || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{ficha?.cantidad4 || '-'}</td>
                    </tr>
                    <tr>
                      <td>{ficha?.accesorio5 || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{ficha?.cantidad5 || '-'}</td>
                      <td>{ficha?.accesorio6 || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{ficha?.cantidad6 || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* 6. Recomendaciones del Fabricante */}
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                6. RECOMENDACIONES DEL FABRICANTE
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ padding: '10px 14px', fontSize: '12px', lineHeight: '1.5', color: '#334155' }}>
                {ficha?.recomendaciones || 'Realizar mantenimiento preventivo periódico según cronograma institucional y recomendaciones del fabricante.'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PÁGINA 2: HISTORIAL DE ACTIVIDADES Y MANTENIMIENTOS */}
      <div className={`documento-hoja-vida pagina-2 hoja-pagina ${activeTab !== 'historial' ? 'ocultar-en-pantalla' : ''}`} style={{ marginTop: '0px' }}>
        <table className="tabla-documento">
          <thead>
            <tr>
              <td colSpan={1} style={{ width: '25%', padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                {ipsLogo ? (
                  <img src={ipsLogo} alt="IPS Logo" style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontWeight: 'bold', color: '#0f3b60', fontSize: '12px' }}>{equipo?.institucion}</div>
                )}
              </td>
              <td
                colSpan={3}
                style={{
                  width: '50%',
                  textAlign: 'center',
                  padding: '10px',
                  verticalAlign: 'middle',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f3b60', letterSpacing: '0.5px' }}>
                  HOJA DE VIDA DE EQUIPO BIOMÉDICO
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', marginTop: '2px' }}>
                  HISTORIAL DE ACTIVIDADES Y MANTENIMIENTOS
                </div>
              </td>
              <td colSpan={1} style={{ width: '25%', padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                <img
                  src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                  alt="Logo"
                  style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
                />
              </td>
            </tr>
            {/* Banner resumen del equipo */}
            <tr>
              <td colSpan={5} style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', fontSize: '12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                <span style={{ marginRight: '16px' }}><strong>EQUIPO:</strong> {equipo?.equipo}</span>
                <span style={{ marginRight: '16px' }}><strong>MARCA:</strong> {equipo?.marca}</span>
                <span style={{ marginRight: '16px' }}><strong>MODELO:</strong> {equipo?.modelo}</span>
                <span style={{ marginRight: '16px' }}><strong>SERIE:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{equipo?.serie}</span></span>
                <span><strong>SERVICIO:</strong> {equipo?.servicio}</span>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                6. REGISTRO HISTÓRICO DE MANTENIMIENTOS Y SERVICIOS
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '12px' }}>
              <th style={{ width: '14%', padding: '8px', textAlign: 'left' }}>FECHA</th>
              <th style={{ width: '20%', padding: '8px', textAlign: 'left' }}>TIPO DE SERVICIO</th>
              <th style={{ width: '24%', padding: '8px', textAlign: 'left' }}>RESPONSABLE / PROVEEDOR</th>
              <th style={{ width: '30%', padding: '8px', textAlign: 'left' }}>OBSERVACIONES / DETALLE</th>
              <th style={{ width: '12%', padding: '8px', textAlign: 'center' }}>VER REPORTE</th>
            </tr>
            {todosLosReportes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic' }}>
                  No hay reportes ni actividades registradas para este equipo biomédico.
                </td>
              </tr>
            ) : (
              todosLosReportes.map((rep) => (
                <tr key={rep._id}>
                  <td style={{ fontSize: '12.5px' }}>{rep.fecha}</td>
                  <td>
                    <span style={{ fontWeight: 'bold', color: '#0f3b60', fontSize: '12.5px' }}>
                      {rep.tipo_servicio}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: rep.esExterno ? '#0369a1' : '#1e293b', fontSize: '12.5px' }}>
                      {rep.responsable_proveedor}
                    </strong>
                  </td>
                  <td style={{ fontSize: '12px' }}>{rep.descripcion}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {rep.esExterno ? (
                      <a
                        href={`${apiVerReporteExterno}/${rep._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        title="Ver Reporte Externo"
                      >
                        <GoEye size={13} /> Ver
                      </a>
                    ) : (
                      <Link
                        to={`/reporte?id=${rep._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        title="Ver Reporte Interno"
                      >
                        <GoEye size={13} /> Ver
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PÁGINA 3: DOCUMENTOS Y MANUALES DEL MODELO */}
      <div className={`documento-hoja-vida pagina-3 hoja-pagina ${activeTab !== 'documentos' ? 'ocultar-en-pantalla' : ''}`} style={{ marginTop: '0px' }}>
        <table className="tabla-documento">
          <thead>
            <tr>
              <td colSpan={1} style={{ width: '25%', padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                {ipsLogo ? (
                  <img src={ipsLogo} alt="IPS Logo" style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontWeight: 'bold', color: '#0f3b60', fontSize: '12px' }}>{equipo?.institucion}</div>
                )}
              </td>
              <td
                colSpan={3}
                style={{
                  width: '50%',
                  textAlign: 'center',
                  padding: '10px',
                  verticalAlign: 'middle',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f3b60', letterSpacing: '0.5px' }}>
                  HOJA DE VIDA DE EQUIPO BIOMÉDICO
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', marginTop: '2px' }}>
                  DOCUMENTACIÓN TÉCNICA Y MANUALES DEL MODELO
                </div>
              </td>
              <td colSpan={1} style={{ width: '25%', padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                <img
                  src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                  alt="Logo"
                  style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', fontSize: '12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                <span style={{ marginRight: '16px' }}><strong>EQUIPO:</strong> {equipo?.equipo}</span>
                <span style={{ marginRight: '16px' }}><strong>MARCA:</strong> {equipo?.marca}</span>
                <span style={{ marginRight: '16px' }}><strong>MODELO:</strong> {equipo?.modelo}</span>
                <span style={{ marginRight: '16px' }}><strong>SERIE:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{equipo?.serie}</span></span>
                <span><strong>SERVICIO:</strong> {equipo?.servicio}</span>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                7. DOCUMENTACIÓN TÉCNICA ASOCIADA AL MODELO ({equipo?.modelo})
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '12px' }}>
              <th style={{ width: '6%', padding: '8px', textAlign: 'center' }}>#</th>
              <th style={{ width: '28%', padding: '8px', textAlign: 'left' }}>DOCUMENTO</th>
              <th style={{ width: '38%', padding: '8px', textAlign: 'left' }}>DETALLE / NOMBRE DE ARCHIVO</th>
              <th style={{ width: '14%', padding: '8px', textAlign: 'center' }}>ESTADO</th>
              <th style={{ width: '14%', padding: '8px', textAlign: 'center' }}>ACCIONES</th>
            </tr>

            {/* 1. Manual de Uso */}
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>1</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0f3b60' }}>
                  <FaBook color="#0284c7" /> Manual de Uso / Operación
                </div>
              </td>
              <td>{ficha?.manual_uso ? ficha.manual_uso.nombre_original : 'Manual de usuario y operación del fabricante'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.manual_uso ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.manual_uso ? (
                  <a
                    href={`${apiVerDocumentoFicha}/${ficha.manual_uso.nombre_archivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                    title="Ver Manual de Uso"
                  >
                    <GoEye size={13} /> Ver
                  </a>
                ) : (
                  <span style={{ color: '#cbd5e1' }}>-</span>
                )}
              </td>
            </tr>

            {/* 2. Guía Rápida */}
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>2</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0f3b60' }}>
                  <FaFileAlt color="#0284c7" /> Guía Rápida de Manejo
                </div>
              </td>
              <td>{ficha?.guia_rapida ? ficha.guia_rapida.nombre_original : 'Guía rápida de pasos e instrucciones operativas'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.guia_rapida ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.guia_rapida ? (
                  <a
                    href={`${apiVerDocumentoFicha}/${ficha.guia_rapida.nombre_archivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                    title="Ver Guía Rápida"
                  >
                    <GoEye size={13} /> Ver
                  </a>
                ) : (
                  <span style={{ color: '#cbd5e1' }}>-</span>
                )}
              </td>
            </tr>

            {/* 3. Registro INVIMA */}
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>3</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0f3b60' }}>
                  <FaShieldAlt color="#0284c7" /> Registro Sanitario INVIMA
                </div>
              </td>
              <td>{ficha?.registro_invima_doc ? ficha.registro_invima_doc.nombre_original : `Registro sanitario del equipo (${equipo?.registro_invima || 'INVIMA'})`}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.registro_invima_doc ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.registro_invima_doc ? (
                  <a
                    href={`${apiVerDocumentoFicha}/${ficha.registro_invima_doc.nombre_archivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                    title="Ver Registro INVIMA"
                  >
                    <GoEye size={13} /> Ver
                  </a>
                ) : (
                  <span style={{ color: '#cbd5e1' }}>-</span>
                )}
              </td>
            </tr>

            {/* 4. Declaración de Importación */}
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>4</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0f3b60' }}>
                  <FaBoxOpen color="#0284c7" /> Declaración de Importación
                </div>
              </td>
              <td>{ficha?.declaracion_importacion ? ficha.declaracion_importacion.nombre_original : 'Declaración de importación o manifiesto de aduana'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.declaracion_importacion ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.declaracion_importacion ? (
                  <a
                    href={`${apiVerDocumentoFicha}/${ficha.declaracion_importacion.nombre_archivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                    title="Ver Declaración de Importación"
                  >
                    <GoEye size={13} /> Ver
                  </a>
                ) : (
                  <span style={{ color: '#cbd5e1' }}>-</span>
                )}
              </td>
            </tr>

            {/* 5. Manual de Servicio */}
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>5</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0f3b60' }}>
                  <FaWrench color="#0284c7" /> Manual de Servicio y Mtto.
                </div>
              </td>
              <td>{ficha?.manual_servicio ? ficha.manual_servicio.nombre_original : 'Manual técnico de servicio, calibración y mantenimiento'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.manual_servicio ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.manual_servicio ? (
                  <a
                    href={`${apiVerDocumentoFicha}/${ficha.manual_servicio.nombre_archivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                    title="Ver Manual de Servicio"
                  >
                    <GoEye size={13} /> Ver
                  </a>
                ) : (
                  <span style={{ color: '#cbd5e1' }}>-</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Informativo de la Página 3 */}
        <div
          className="no-print"
          style={{
            marginTop: '16px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '12px 18px',
            color: '#94a3b8',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaHospital /> Los documentos corresponden al modelo <strong>{equipo?.modelo}</strong> y se encuentran homologados para este equipo biomédico.
        </div>
      </div>
    </div>
  );
}

export default HojaDeVidaQr;
