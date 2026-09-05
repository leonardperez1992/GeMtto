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
  FaFileMedical,
} from 'react-icons/fa';
import { GoEye } from 'react-icons/go';
import { Link } from 'react-router-dom';
import PrintHojaVidaModal from '../components/PrintHojaVidaModal';

function HojaDeVidaQr() {
  const [equipo, setEquipo] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [reportesExternos, setReportesExternos] = useState([]);
  const [imagen, setImagen] = useState('');
  const [ipsLogo, setIpsLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ficha'); // 'ficha' | 'historial' | 'documentos'
  const [modalPrintOpen, setModalPrintOpen] = useState(false);
  const [printMode, setPrintMode] = useState('all'); // 'all' | 'current'

  const handleTriggerPrint = (mode = 'all') => {
    setPrintMode(mode);
    setModalPrintOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
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

  const obtenerIps = async (ips) => {
    if (!ips) return;
    try {
      const response = await request({
        link: apiGetIps,
        method: 'GET',
        body: { ips },
      });
      if (response && response.success && response.institucion?.logo?.[0]) {
        setIpsLogo(response.institucion.logo[0].data_url);
      } else if (response && response.success && response.ips && response.ips.length > 0) {
        const found = response.ips.find(
          (item) => item.ips?.trim().toUpperCase() === ips.trim().toUpperCase()
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

  // Consolidado cronológico de reportes internos y externos con observaciones puras
  const todosLosReportes = [
    ...reportes.map((rep) => ({
      _id: rep._id,
      esExterno: false,
      fecha: rep.fecha || '',
      tipo_servicio: rep.tipo_servicio || '-',
      responsable_proveedor: rep.nombre_ingeniero || 'Ingeniero Biomédico',
      observaciones: rep.observaciones || '-',
      numero_documento: rep.numero_reporte ? `#${rep.numero_reporte}` : '-',
      data: rep,
    })),
    ...reportesExternos.map((rep) => ({
      _id: rep._id,
      esExterno: true,
      fecha: rep.fecha || '',
      tipo_servicio: rep.tipo_servicio || '-',
      responsable_proveedor: rep.proveedor || 'Proveedor Externo',
      observaciones: rep.descripcion || '-',
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
    <div className={`contenedor vista-hoja-vida-wrapper ${printMode === 'all' ? 'imprimir-todas-las-hojas' : 'imprimir-solo-activa'}`} style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 15px' }}>
      {/* Banner de Verificación y Barra de Acción */}
      <div
        className="no-print toolbar-hoja-vida"
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
          onClick={() => setModalPrintOpen(true)}
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
        className="no-print pestañas-hoja-vida"
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

      {/* Indicador de desplazamiento en móviles */}
      <div className="hint-scroll-movil no-print">
        ↔️ Desliza la hoja horizontalmente para ver la tabla completa
      </div>

      {/* PÁGINA 1: IDENTIFICACIÓN Y FICHA TÉCNICA DEL EQUIPO (Formato original) */}
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
              {/* Contenedor de la Foto Centrado */}
              <td
                colSpan={2}
                rowSpan={7}
                style={{
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRight: '1.5px solid #1e293b',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', width: '100%' }}>
                  {imagen ? (
                    <img
                      src={imagen}
                      alt={equipo?.equipo}
                      className="foto-equipo-hoja-vida"
                      style={{
                        maxHeight: '190px',
                        maxWidth: '90%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        display: 'block',
                        margin: '0 auto',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '10px' }}>
                      <FaFileMedical size={42} color="#cbd5e1" style={{ display: 'block', margin: '0 auto 8px auto' }} />
                      Sin fotografía registrada
                    </div>
                  )}
                </div>
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
              <td colSpan={4}>
                <span className="label-bold">FECHA DE FABRICACIÓN:</span> {equipo?.fecha_fabricacion || 'N/A'}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">PERIODICIDAD DE MTTO:</span>{' '}
                <strong style={{ color: '#0f3b60' }}>{equipo?.periodicidad || 'SEMESTRAL'}</strong>
              </td>
              <td colSpan={2}>
                <span className="label-bold">PERIODICIDAD DE CALIBRACIÓN:</span>{' '}
                <strong style={{ color: '#0f3b60' }}>{equipo?.periodicidad_calibracion || 'ANUAL'}</strong>
              </td>
            </tr>

            {/* 3. Información Técnica */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                3. ESPECIFICACIONES TÉCNICAS
              </td>
            </tr>
            <tr>
              <td colSpan={4}>
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
            {Array.from({ length: 10 }, (_, i) => i + 1).some((i) => ficha?.[`accesorio${i}`]) ? (
              Array.from({ length: 10 }, (_, i) => i + 1)
                .filter((i) => ficha?.[`accesorio${i}`])
                .map((i) => (
                  <tr key={i}>
                    <td colSpan={3} style={{ fontWeight: '500' }}>{ficha[`accesorio${i}`]}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{ficha[`cantidad${i}`] || '1'}</td>
                  </tr>
                ))
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
                colSpan={4}
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
              <td colSpan={6} style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', fontSize: '12px', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
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
              <td colSpan={6} className="seccion-titulo" style={{ backgroundColor: '#0f3b60', color: '#ffffff' }}>
                6. REGISTRO HISTÓRICO DE ACTIVIDADES Y MANTENIMIENTOS
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '12px' }}>
              <th style={{ width: '13%', padding: '8px', textAlign: 'left' }}>FECHA</th>
              <th style={{ width: '18%', padding: '8px', textAlign: 'left' }}>TIPO DE SERVICIO</th>
              <th style={{ width: '22%', padding: '8px', textAlign: 'left' }}>RESPONSABLE / PROVEEDOR</th>
              <th style={{ width: '27%', padding: '8px', textAlign: 'left' }}>OBSERVACIONES</th>
              <th style={{ width: '10%', padding: '8px', textAlign: 'center' }}>Nº REP./CERT.</th>
              <th className="no-print columna-acciones-print" style={{ width: '10%', padding: '8px', textAlign: 'center' }}>VER</th>
            </tr>
            {todosLosReportes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontStyle: 'italic' }}>
                  No hay reportes ni actividades de servicio registradas para esta serie.
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
                  <td style={{ fontSize: '12px' }}>{rep.observaciones}</td>
                  <td style={{ textAlign: 'center' }}>
                    <strong style={{ color: '#0284c7', fontSize: '12px' }}>
                      {rep.numero_documento}
                    </strong>
                  </td>
                  <td className="no-print columna-acciones-print" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                        to={`/reporte?id=${rep._id}&returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`}
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
              <th className="no-print columna-acciones-print" style={{ width: '14%', padding: '8px', textAlign: 'center' }}>ACCIONES</th>
            </tr>

            {/* 1. Manual de Uso */}
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>1</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0f3b60' }}>
                  <FaBook color="#0284c7" /> Manual de Uso / Operación
                </div>
              </td>
              <td>{ficha?.manual_uso?.nombre_archivo ? (ficha.manual_uso.nombre_original || 'Manual de Uso adjunto') : 'Sin manual de uso adjunto'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.manual_uso?.nombre_archivo ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td className="no-print columna-acciones-print" style={{ textAlign: 'center' }}>
                {ficha?.manual_uso?.nombre_archivo ? (
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
              <td>{ficha?.guia_rapida?.nombre_archivo ? (ficha.guia_rapida.nombre_original || 'Guía rápida adjunta') : 'Sin guía rápida adjunta'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.guia_rapida?.nombre_archivo ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td className="no-print columna-acciones-print" style={{ textAlign: 'center' }}>
                {ficha?.guia_rapida?.nombre_archivo ? (
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
              <td>{ficha?.registro_invima_doc?.nombre_archivo ? (ficha.registro_invima_doc.nombre_original || 'Registro sanitario adjunto') : `Sin documento adjunto (${equipo?.registro_invima || 'No disponible'})`}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.registro_invima_doc?.nombre_archivo ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td className="no-print columna-acciones-print" style={{ textAlign: 'center' }}>
                {ficha?.registro_invima_doc?.nombre_archivo ? (
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
              <td>{ficha?.declaracion_importacion?.nombre_archivo ? (ficha.declaracion_importacion.nombre_original || 'Declaración de importación adjunta') : 'Sin declaración de importación adjunta'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.declaracion_importacion?.nombre_archivo ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td className="no-print columna-acciones-print" style={{ textAlign: 'center' }}>
                {ficha?.declaracion_importacion?.nombre_archivo ? (
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
              <td>{ficha?.manual_servicio?.nombre_archivo ? (ficha.manual_servicio.nombre_original || 'Manual de servicio adjunto') : 'Sin manual de servicio adjunto'}</td>
              <td style={{ textAlign: 'center' }}>
                {ficha?.manual_servicio?.nombre_archivo ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <FaCheckCircle /> Adjunto
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No adjunto</span>
                )}
              </td>
              <td className="no-print columna-acciones-print" style={{ textAlign: 'center' }}>
                {ficha?.manual_servicio?.nombre_archivo ? (
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

      {/* Modal para Opciones de Impresión de la Hoja de Vida */}
      <PrintHojaVidaModal
        isOpen={modalPrintOpen}
        onClose={() => setModalPrintOpen(false)}
        equipo={equipo}
        activeTab={activeTab}
        onPrint={handleTriggerPrint}
      />
    </div>
  );
}

export default HojaDeVidaQr;
