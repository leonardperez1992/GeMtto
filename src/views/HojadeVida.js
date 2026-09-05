import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  apiObtenerEquipo,
  apiObtenerFicha,
  apiObtenerReportes,
  apiGetIps,
  apiEliminarEquipo,
  apiUploadReporteExterno,
  apiObtenerReportesExternos,
  apiEliminarReporteExterno,
  apiVerReporteExterno,
  apiVerDocumentoFicha,
} from '../utils/api';
import request from '../utils/request';
import {
  FaFileMedical,
  FaTrash,
  FaPrint,
  FaArrowLeft,
  FaFileUpload,
  FaTimes,
  FaBook,
  FaFileAlt,
  FaShieldAlt,
  FaBoxOpen,
  FaWrench,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaQrcode,
} from 'react-icons/fa';
import { GoEye } from 'react-icons/go';
import QrModal from '../components/QrModal';
import PrintHojaVidaModal from '../components/PrintHojaVidaModal';

function HojaDeVida() {
  const [equipo, setEquipo] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [reportesExternos, setReportesExternos] = useState([]);
  const [imagen, setImagen] = useState('');
  const [ipsLogo, setIpsLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ficha'); // 'ficha' | 'historial' | 'documentos'
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [modalPrintOpen, setModalPrintOpen] = useState(false);
  const [printMode, setPrintMode] = useState('all'); // 'all' | 'current'

  const handleTriggerPrint = (mode = 'all') => {
    setPrintMode(mode);
    setModalPrintOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Estados para el modal de subir reporte externo
  const [modalExternoOpen, setModalExternoOpen] = useState(false);
  const [subiendoExterno, setSubiendoExterno] = useState(false);
  const [extFile, setExtFile] = useState(null);
  const [extProveedor, setExtProveedor] = useState('');
  const [extFecha, setExtFecha] = useState(new Date().toISOString().split('T')[0]);
  const [extTipoServicio, setExtTipoServicio] = useState('Mantenimiento Preventivo');
  const [extNumeroReporte, setExtNumeroReporte] = useState('');
  const [extDescripcion, setExtDescripcion] = useState('');

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

  const obtenerReportesExternos = async (serie) => {
    if (!serie) return;
    const response = await request({
      link: apiObtenerReportesExternos,
      method: 'GET',
      body: { serie },
    });
    if (response && response.success) {
      setReportesExternos(response.reportes || []);
    }
  };

  const obtenerIps = async (ips) => {
    if (!ips) return;
    const response = await request({
      link: apiGetIps,
      method: 'GET',
      body: { ips },
    });
    if (response && response.success && response.institucion?.logo) {
      const l = response.institucion.logo;
      const logoUrl = Array.isArray(l) ? l[0]?.data_url : (l?.data_url || (typeof l === 'string' ? l : ''));
      if (logoUrl) setIpsLogo(logoUrl);
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

  const handleUploadReporteExterno = async (e) => {
    e.preventDefault();
    if (!extFile) {
      alert('Por favor selecciona un archivo en formato PDF');
      return;
    }
    if (!extProveedor.trim()) {
      alert('Por favor ingresa el nombre del proveedor o empresa externa');
      return;
    }
    if (!extFecha) {
      alert('Por favor selecciona la fecha del servicio');
      return;
    }

    setSubiendoExterno(true);
    try {
      const formData = new FormData();
      formData.append('file', extFile);
      formData.append('serie', equipo?.serie || '');
      formData.append('equipo', equipo?.equipo || '');
      formData.append('marca', equipo?.marca || '');
      formData.append('modelo', equipo?.modelo || '');
      formData.append('institucion', equipo?.institucion || '');
      formData.append('servicio', equipo?.servicio || '');
      formData.append('proveedor', extProveedor.trim());
      formData.append('fecha', extFecha);
      formData.append('tipo_servicio', extTipoServicio);
      formData.append('numero_reporte', extNumeroReporte.trim());
      formData.append('descripcion', extDescripcion.trim());

      const res = await fetch(apiUploadReporteExterno, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data && data.success) {
        alert('¡Reporte de proveedor externo anexado con éxito!');
        setModalExternoOpen(false);
        setExtFile(null);
        setExtProveedor('');
        setExtNumeroReporte('');
        setExtDescripcion('');
        if (equipo?.serie) {
          obtenerReportesExternos(equipo.serie);
        }
      } else {
        alert(data?.message || 'Error al guardar el reporte externo');
      }
    } catch (err) {
      console.error('Error al subir reporte externo:', err);
      alert('Error de conexión al intentar subir el archivo');
    } finally {
      setSubiendoExterno(false);
    }
  };

  const eliminarReporteExterno = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte externo y su PDF adjunto?')) {
      return;
    }
    try {
      const response = await request({
        link: apiEliminarReporteExterno,
        method: 'POST',
        body: { _id: id },
      });
      if (response && response.success) {
        alert('Reporte externo eliminado correctamente');
        if (equipo?.serie) {
          obtenerReportesExternos(equipo.serie);
        }
      } else {
        alert(response?.message || 'Error al eliminar');
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor');
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
        obtenerReportesExternos(serie),
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

  return (
    <div className={`contenedor vista-hoja-vida-wrapper ${printMode === 'all' ? 'imprimir-todas-las-hojas' : 'imprimir-solo-activa'}`} style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      {/* Top Action Toolbar */}
      <div
        className="no-print toolbar-hoja-vida"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '14px 20px',
          borderRadius: '10px',
          border: '1px solid #334155',
          marginBottom: '16px',
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
        <div className="toolbar-hoja-vida-botones" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setModalExternoOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: '1px solid #10b981',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <FaFileUpload /> Anexar Reporte Externo
          </button>
          <button
            onClick={() => setModalQrOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: '1px solid #a855f7',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <FaQrcode /> Código QR
          </button>
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

      {/* PÁGINA 2: HISTORIAL DE ACTIVIDADES Y MANTENIMIENTOS (Página independiente) */}
      <div className={`documento-hoja-vida pagina-2 hoja-pagina ${activeTab !== 'historial' ? 'ocultar-en-pantalla' : ''}`} style={{ marginTop: '0px' }}>
        <table className="tabla-documento">
          {/* Header de la Página 2 */}
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
            {/* Banner resumen del equipo en Página 2 */}
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
            {/* 6. Historial de Actividades y Mantenimientos Unificado */}
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                          title="Ver Reporte"
                        >
                          <GoEye size={13} /> Ver
                        </a>
                        <button
                          onClick={() => eliminarReporteExterno(rep._id)}
                          className="no-print"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            cursor: 'pointer',
                          }}
                          title="Eliminar reporte externo"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    ) : (
                      <Link
                        to={`/reporte?id=${rep._id}&returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`}
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

      {/* PÁGINA 3: DOCUMENTOS Y MANUALES DEL EQUIPO (Página independiente) */}
      <div className={`documento-hoja-vida pagina-3 hoja-pagina ${activeTab !== 'documentos' ? 'ocultar-en-pantalla' : ''}`} style={{ marginTop: '0px' }}>
        <table className="tabla-documento">
          {/* Header de la Página 3 */}
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
            {/* Banner resumen del equipo en Página 3 */}
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>
            ℹ️ Los documentos se asocian al modelo <strong>{equipo?.modelo}</strong> y aplican automáticamente a todos los equipos del mismo modelo.
          </div>
          {ficha?._id && (
            <Link
              to={`/editficha?id=${ficha._id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#0369a1',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontWeight: '600',
              }}
            >
              <FaExternalLinkAlt size={12} /> Gestionar Documentos en Ficha Técnica
            </Link>
          )}
        </div>
      </div>

      {/* Modal para Anexar Reporte Externo */}
      {modalExternoOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #475569',
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              color: '#f8fafc',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #334155',
                paddingBottom: '12px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileUpload color="#10b981" size={20} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
                  Anexar Reporte / Certificado Externo
                </h3>
              </div>
              <button
                onClick={() => setModalExternoOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Equipment Badge */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Equipo:</span>{' '}
                <strong style={{ color: '#38bdf8' }}>{equipo?.equipo}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Serie:</span>{' '}
                <strong style={{ color: '#38bdf8' }}>{equipo?.serie}</strong>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadReporteExterno}>
              {/* PDF File Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>
                  Archivo PDF del Proveedor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) => setExtFile(e.target.files[0] || null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px dashed #64748b',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                />
                {extFile && (
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                    ✓ Archivo seleccionado: {extFile.name} ({(extFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Provider Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>
                  Nombre de la Empresa / Proveedor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. GE Healthcare, Metrología del Caribe S.A.S., Philips..."
                  value={extProveedor}
                  onChange={(e) => setExtProveedor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Date and Service Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>
                    Fecha del Servicio <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={extFecha}
                    onChange={(e) => setExtFecha(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>
                    Tipo de Servicio <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={extTipoServicio}
                    onChange={(e) => setExtTipoServicio(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                    <option value="Mantenimiento Correctivo">Mantenimiento Correctivo</option>
                    <option value="Calibración / Metrología">Calibración / Metrología</option>
                    <option value="Calificación y Validación">Calificación y Validación</option>
                    <option value="Inspección Externa">Inspección Externa</option>
                    <option value="Certificado de Garantía">Certificado de Garantía</option>
                    <option value="Prueba de Seguridad Eléctrica">Prueba de Seguridad Eléctrica</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Number Report / Certificate */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>
                  Nº de Reporte / Certificado Externo
                </label>
                <input
                  type="text"
                  placeholder="Ej. CERT-2026-0982 o REP-4458"
                  value={extNumeroReporte}
                  onChange={(e) => setExtNumeroReporte(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>
                  Observaciones / Descripción del Servicio
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el servicio técnico realizado, certificado de calibración emitido, repuestos cambiados, etc."
                  value={extDescripcion}
                  onChange={(e) => setExtDescripcion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalExternoOpen(false)}
                  disabled={subiendoExterno}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subiendoExterno}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: subiendoExterno ? '#047857' : '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: subiendoExterno ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {subiendoExterno ? 'Subiendo PDF...' : 'Anexar Reporte PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Visualización, Descarga e Impresión de Código QR */}
      <QrModal
        isOpen={modalQrOpen}
        onClose={() => setModalQrOpen(false)}
        equipo={equipo}
      />

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

export default HojaDeVida;

