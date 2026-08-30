import { useState, useEffect, useRef } from 'react';
import { apiObtenerReporte, apiEliminarReportes } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import generatePDF, { Resolution } from 'react-to-pdf';
import { GrDocumentPdf } from 'react-icons/gr';
import { BsTrash } from 'react-icons/bs';
import { SlPrinter } from 'react-icons/sl';

function ReportePdf() {
  const imgIng = useRef({});
  const imgRec = useRef({});
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const targetRef = useRef();

  const options = {
    filename: `${reporte?.fecha || 'Fecha'} - SN ${reporte?.serie || 'Serie'} - Reporte Nº ${reporte?.numero_reporte || ''}.pdf`,
    method: 'save',
    resolution: Resolution.MEDIUM,
    page: {
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      format: 'letter',
      orientation: 'portrait',
    },
    canvas: {
      mimeType: 'image/jpeg',
      qualityRatio: 1.0,
    },
  };

  const options_2 = {
    filename: `Reporte Nº${reporte?.numero_reporte || ''}.pdf`,
    method: 'open',
    resolution: Resolution.MEDIUM,
    page: {
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      format: 'letter',
      orientation: 'portrait',
    },
    canvas: {
      mimeType: 'image/jpeg',
      qualityRatio: 1.0,
    },
  };

  const deleteReport = async () => {
    let confirmar = window.confirm('¿Deseas eliminar este reporte de servicio?');
    if (confirmar) {
      const body = { _id: reporte._id };
      const response = await request({
        link: apiEliminarReportes,
        body,
        method: 'POST',
      });
      if (response.success) {
        alert('Reporte eliminado exitosamente');
        window.location.href = './reportes';
      } else {
        alert(`${response.message}`);
      }
    }
  };

  const obtenerReporte = async (id) => {
    setLoading(true);
    try {
      const response = await request({
        link: apiObtenerReporte,
        method: 'GET',
        body: { id },
      });
      if (response && response.success) {
        setReporte(response.reporte);
        if (response.reporte.firma_ingeniero && response.reporte.firma_recibe) {
          setTimeout(() => {
            if (imgIng.current?.fromData) imgIng.current.fromData(response.reporte.firma_ingeniero);
            if (imgRec.current?.fromData) imgRec.current.fromData(response.reporte.firma_recibe);
          }, 200);
        }
      } else {
        alert(`${response?.message || 'Error al obtener reporte'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    if (!idEquipo) {
      alert('Por favor Seleccione un reporte en la pestaña de Reportes');
      window.location.href = './reportes';
      return;
    }
    obtenerReporte(idEquipo);
  }, []);

  if (loading) {
    return (
      <div className="contenedor" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        Cargando reporte de servicio...
      </div>
    );
  }

  return (
    <div className="contenedor" style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      {/* Action Toolbar */}
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
        <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '16px' }}>
          📄 Reporte de Servicio Nº {reporte?.numero_reporte}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => generatePDF(targetRef, options)}
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
            <GrDocumentPdf size={18} /> Descargar PDF
          </button>
          <button
            onClick={() => generatePDF(targetRef, options_2)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13.5px',
              cursor: 'pointer',
            }}
          >
            <SlPrinter size={18} /> Imprimir
          </button>
          <button
            onClick={deleteReport}
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
            <BsTrash size={18} /> Eliminar
          </button>
        </div>
      </div>

      {/* Printable Sheet (White Background, Sharp Borders) */}
      <div className="documento-reporte" ref={targetRef}>
        <table className="tabla-documento">
          {/* Document Header */}
          <thead>
            <tr>
              <td colSpan={2} style={{ width: '40%', padding: '12px', verticalAlign: 'middle', borderRight: '1px solid #94a3b8' }}>
                <img
                  src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                  alt="Logo"
                  style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }}
                />
              </td>
              <td
                colSpan={2}
                style={{
                  width: '60%',
                  textAlign: 'center',
                  padding: '12px',
                  verticalAlign: 'middle',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f3b60', letterSpacing: '0.5px' }}>
                  REPORTE DE SERVICIO TÉCNICO
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626', marginTop: '4px' }}>
                  Nº DE REPORTE: {reporte?.numero_reporte}
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {/* Sección: Información Institución */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                1. INFORMACIÓN DE LA INSTITUCIÓN
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">IPS / CLIENTE:</span> {reporte?.institucion}
              </td>
              <td colSpan={2}>
                <span className="label-bold">FECHA:</span> {reporte?.fecha}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">SERVICIO:</span> {reporte?.servicio}
              </td>
              <td colSpan={2}>
                <span className="label-bold">CIUDAD:</span> {reporte?.ciudad}
              </td>
            </tr>

            {/* Sección: Tipo de Servicio */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                2. TIPO DE SERVICIO
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', fontWeight: '700', fontSize: '14px', color: '#0f3b60', padding: '10px' }}>
                {reporte?.tipo_servicio}
              </td>
            </tr>

            {/* Sección: Información del Equipo */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                3. INFORMACIÓN DEL EQUIPO
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">EQUIPO:</span> {reporte?.equipo}
              </td>
              <td colSpan={2}>
                <span className="label-bold">MARCA:</span> {reporte?.marca}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">MODELO:</span> {reporte?.modelo}
              </td>
              <td colSpan={2}>
                <span className="label-bold">SERIE:</span> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{reporte?.serie}</span>
              </td>
            </tr>

            {/* Sección: Problema Reportado */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                4. PROBLEMA REPORTADO POR EL CLIENTE
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ minHeight: '40px', padding: '10px' }}>
                {reporte?.problema_reportado || 'Mantenimiento preventivo programado según cronograma.'}
              </td>
            </tr>

            {/* Sección: Descripción del Servicio */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                5. DESCRIPCIÓN DEL SERVICIO REALIZADO
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ minHeight: '50px', padding: '10px', whiteSpace: 'pre-line' }}>
                {reporte?.desc_servicio}
              </td>
            </tr>

            {/* Sección: Repuestos e Insumos */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                6. REPUESTOS, INSUMOS Y MATERIALES EMPLEADOS
              </td>
            </tr>
            <tr>
              <td className="sub-header" style={{ width: '15%' }}>CANTIDAD</td>
              <td className="sub-header" colSpan={2} style={{ width: '60%' }}>DESCRIPCIÓN</td>
              <td className="sub-header" style={{ width: '25%' }}>VALOR UNITARIO</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>{reporte?.cantidad1 || '-'}</td>
              <td colSpan={2}>{reporte?.descripcion1 || '-'}</td>
              <td style={{ textAlign: 'right' }}>{reporte?.valor1 || '-'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>{reporte?.cantidad2 || '-'}</td>
              <td colSpan={2}>{reporte?.descripcion2 || '-'}</td>
              <td style={{ textAlign: 'right' }}>{reporte?.valor2 || '-'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>{reporte?.cantidad3 || '-'}</td>
              <td colSpan={2}>{reporte?.descripcion3 || '-'}</td>
              <td style={{ textAlign: 'right' }}>{reporte?.valor3 || '-'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>{reporte?.cantidad4 || '-'}</td>
              <td colSpan={2}>{reporte?.descripcion4 || '-'}</td>
              <td style={{ textAlign: 'right' }}>{reporte?.valor4 || '-'}</td>
            </tr>

            {/* Sección: Verificación de Parámetros */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                7. VERIFICACIÓN DE PARÁMETROS DE FUNCIONAMIENTO
              </td>
            </tr>
            <tr>
              <td className="sub-header" style={{ width: '30%' }}>PARÁMETRO</td>
              <td className="sub-header" colSpan={2} style={{ width: '40%' }}>VALOR PROGRAMADO (TOLERANCIA)</td>
              <td className="sub-header" style={{ width: '30%' }}>VALOR MEDIDO</td>
            </tr>
            <tr>
              <td>{reporte?.parametro1 || '-'}</td>
              <td colSpan={2} style={{ textAlign: 'center' }}>{reporte?.valor_programado1 || '-'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{reporte?.valor_medido1 || '-'}</td>
            </tr>
            <tr>
              <td>{reporte?.parametro2 || '-'}</td>
              <td colSpan={2} style={{ textAlign: 'center' }}>{reporte?.valor_programado2 || '-'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{reporte?.valor_medido2 || '-'}</td>
            </tr>
            <tr>
              <td>{reporte?.parametro3 || '-'}</td>
              <td colSpan={2} style={{ textAlign: 'center' }}>{reporte?.valor_programado3 || '-'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{reporte?.valor_medido3 || '-'}</td>
            </tr>
            <tr>
              <td>{reporte?.parametro4 || '-'}</td>
              <td colSpan={2} style={{ textAlign: 'center' }}>{reporte?.valor_programado4 || '-'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{reporte?.valor_medido4 || '-'}</td>
            </tr>

            {/* Sección: Observaciones & Estado Final */}
            <tr>
              <td colSpan={4} className="seccion-titulo">
                8. OBSERVACIONES
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: '10px' }}>
                {reporte?.observaciones || 'Equipo funcionando en óptimas condiciones técnicas y de seguridad.'}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="seccion-titulo">
                9. ESTADO FINAL DEL EQUIPO
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#15803d', padding: '10px' }}>
                {reporte?.estado_final || 'OPERATIVO'}
              </td>
            </tr>

            {/* Sección: Firmas */}
            <tr>
              <td colSpan={2} className="sub-header" style={{ width: '50%' }}>
                INGENIERO / TÉCNICO RESPONSABLE
              </td>
              <td colSpan={2} className="sub-header" style={{ width: '50%' }}>
                RECIBÍ A CONFORMIDAD (CLIENTE)
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ textAlign: 'center', padding: '10px', height: '140px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Firma del Ingeniero</div>
                <SignatureCanvas
                  ref={imgIng}
                  canvasProps={{ width: 340, height: 100, style: { border: '1px dashed #cbd5e1', borderRadius: '4px' } }}
                />
              </td>
              <td colSpan={2} style={{ textAlign: 'center', padding: '10px', height: '140px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Firma de Quien Recibe</div>
                <SignatureCanvas
                  ref={imgRec}
                  canvasProps={{ width: 340, height: 100, style: { border: '1px dashed #cbd5e1', borderRadius: '4px' } }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">NOMBRE:</span> {reporte?.nombre_ingeniero}
              </td>
              <td colSpan={2}>
                <span className="label-bold">NOMBRE:</span> {reporte?.nombre_recibe}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="label-bold">CARGO:</span> {reporte?.cargo_ingeniero}
              </td>
              <td colSpan={2}>
                <span className="label-bold">CARGO:</span> {reporte?.cargo_recibe}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportePdf;
