import { useState, useEffect, useRef } from 'react';
import { apiObtenerReporte, apiEliminarReportes } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { GrDocumentPdf } from 'react-icons/gr';
import { BsTrash } from 'react-icons/bs';
import { SlPrinter } from 'react-icons/sl';
import { FaArrowLeft, FaSync } from 'react-icons/fa';

function ReporteDocumentoSheet({ reporte, isLast }) {
  const imgIng = useRef(null);
  const imgRec = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (reporte?.firma_ingeniero && imgIng.current?.fromData) {
        try {
          imgIng.current.clear();
          imgIng.current.fromData(reporte.firma_ingeniero);
        } catch (e) {}
      }
      if (reporte?.firma_recibe && imgRec.current?.fromData) {
        try {
          imgRec.current.clear();
          imgRec.current.fromData(reporte.firma_recibe);
        } catch (e) {}
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [reporte]);

  return (
    <div
      className="documento-reporte reporte-sheet-item"
      style={{
        pageBreakAfter: isLast ? 'auto' : 'always',
        breakAfter: isLast ? 'auto' : 'page',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        marginBottom: isLast ? '10px' : '28px',
      }}
    >
      <table className="tabla-documento" style={{ tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>

        {/* Document Header */}
        <thead>
          <tr>
            <td colSpan={2} style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
              <img
                src={process.env.PUBLIC_URL + '/img/logoCobio.png'}
                alt="Logo"
                style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </td>
            <td
              colSpan={2}
              style={{
                textAlign: 'center',
                padding: '6px 10px',
                verticalAlign: 'middle',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f3b60', letterSpacing: '0.4px' }}>
                REPORTE DE SERVICIO TÉCNICO
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', marginTop: '2px' }}>
                Nº DE REPORTE: {reporte?.numero_reporte}
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          {/* 1. Información Institución */}
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

          {/* 2. Tipo de Servicio */}
          <tr>
            <td colSpan={4} className="seccion-titulo">
              2. TIPO DE SERVICIO
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ textAlign: 'center', fontWeight: '700', fontSize: '12px', color: '#0f3b60', padding: '4px' }}>
              {reporte?.tipo_servicio}
            </td>
          </tr>

          {/* 3. Información del Equipo */}
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
              <span className="label-bold">SERIE:</span>{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{reporte?.serie}</span>
            </td>
          </tr>

          {/* 4. Problema Reportado */}
          <tr>
            <td colSpan={4} className="seccion-titulo">
              4. PROBLEMA REPORTADO POR EL CLIENTE
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ padding: '5px 8px' }}>
              {reporte?.problema_reportado || 'Mantenimiento preventivo programado según cronograma.'}
            </td>
          </tr>

          {/* 5. Descripción del Servicio */}
          <tr>
            <td colSpan={4} className="seccion-titulo">
              5. DESCRIPCIÓN DEL SERVICIO REALIZADO
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ padding: '5px 8px', whiteSpace: 'pre-line' }}>
              {reporte?.desc_servicio}
            </td>
          </tr>

          {/* 6. Repuestos e Insumos */}
          <tr>
            <td colSpan={4} className="seccion-titulo">
              6. REPUESTOS, INSUMOS Y MATERIALES EMPLEADOS
            </td>
          </tr>
          <tr>
            <td className="sub-header" style={{ width: '20%' }}>CANTIDAD</td>
            <td className="sub-header" colSpan={2} style={{ width: '55%' }}>DESCRIPCIÓN</td>
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

          {/* 7. Verificación de Parámetros */}
          <tr>
            <td colSpan={4} className="seccion-titulo">
              7. VERIFICACIÓN DE PARÁMETROS DE FUNCIONAMIENTO{' '}
              {reporte?.tipo_servicio && reporte?.tipo_servicio !== 'MTTO PREVENTIVO' ? '(NO APLICA)' : ''}
            </td>
          </tr>
          {reporte?.tipo_servicio === 'MTTO PREVENTIVO' ? (
            <>
              <tr>
                <td className="sub-header">PARÁMETRO</td>
                <td className="sub-header" colSpan={2}>VALOR PROGRAMADO (TOLERANCIA)</td>
                <td className="sub-header">VALOR MEDIDO</td>
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
            </>
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '6px' }}>
                NO APLICA PARA {reporte?.tipo_servicio || 'ESTE TIPO DE SERVICIO'} (EXCLUSIVO DE MTTO PREVENTIVO)
              </td>
            </tr>
          )}

          {/* 8. Observaciones & Estado Final */}
          <tr>
            <td colSpan={4} className="seccion-titulo">
              8. OBSERVACIONES
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ padding: '5px 8px' }}>
              {reporte?.observaciones || 'Equipo funcionando en óptimas condiciones técnicas y de seguridad.'}
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="seccion-titulo">
              9. ESTADO FINAL DEL EQUIPO
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#15803d', padding: '4px' }}>
              {reporte?.estado_final || 'OPERATIVO'}
            </td>
          </tr>

          {/* 10. Firmas Digitales */}
          <tr>
            <td colSpan={2} className="sub-header" style={{ textAlign: 'center' }}>
              INGENIERO / TÉCNICO RESPONSABLE
            </td>
            <td colSpan={2} className="sub-header" style={{ textAlign: 'center' }}>
              RECIBÍ A CONFORMIDAD (CLIENTE)
            </td>
          </tr>
          <tr>
            {/* Firma Ingeniero */}
            <td colSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px 10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{ display: 'inline-block', border: '1px dashed #94a3b8', borderRadius: '4px', backgroundColor: '#ffffff', padding: '2px', overflow: 'hidden', width: '100%', maxWidth: '340px' }}>
                  <SignatureCanvas
                    ref={imgIng}
                    canvasProps={{
                      width: 360,
                      height: 140,
                      style: { display: 'block', margin: '0 auto', width: '100%', height: 'auto', maxHeight: '110px', backgroundColor: '#ffffff' },
                    }}
                  />
                </div>
              </div>
            </td>
            {/* Firma Recibe */}
            <td colSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '8px 10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{ display: 'inline-block', border: '1px dashed #94a3b8', borderRadius: '4px', backgroundColor: '#ffffff', padding: '2px', overflow: 'hidden', width: '100%', maxWidth: '340px' }}>
                  <SignatureCanvas
                    ref={imgRec}
                    canvasProps={{
                      width: 360,
                      height: 140,
                      style: { display: 'block', margin: '0 auto', width: '100%', height: 'auto', maxHeight: '110px', backgroundColor: '#ffffff' },
                    }}
                  />
                </div>
              </div>
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
  );
}

function ReportePdf() {
  const [reportesList, setReportesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalToLoad, setTotalToLoad] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const containerRef = useRef(null);

  const isMulti = reportesList.length > 1;
  const reporteUnico = reportesList[0] || null;

  const deleteReport = async () => {
    if (!reporteUnico) return;
    let confirmar = window.confirm('¿Deseas eliminar este reporte de servicio?');
    if (confirmar) {
      const body = { _id: reporteUnico._id };
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

  const obtenerReportesPorIds = async (ids) => {
    setLoading(true);
    setTotalToLoad(ids.length);
    setLoadedCount(0);

    try {
      const results = [];
      const batchSize = 6;
      for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        const responses = await Promise.all(
          chunk.map((id) =>
            request({
              link: apiObtenerReporte,
              method: 'GET',
              body: { id },
            }).catch(() => null)
          )
        );
        responses.forEach((res) => {
          if (res && res.success && res.reporte) {
            results.push(res.reporte);
          }
        });
        setLoadedCount(Math.min(ids.length, i + chunk.length));
      }

      if (results.length > 0) {
        setReportesList(results);
      } else {
        alert('No se pudieron obtener los reportes seleccionados.');
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
    let idsParam = queryParameters.get('ids');
    let idUnico = queryParameters.get('id');

    const idsList = idsParam
      ? idsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : idUnico
      ? [idUnico.trim()]
      : [];

    if (idsList.length === 0) {
      alert('Por favor seleccione al menos un reporte en la pestaña de Reportes');
      window.location.href = './reportes';
      return;
    }
    obtenerReportesPorIds(idsList);
  }, []);

  const buildAndExportPdf = async (mode = 'save') => {
    if (!containerRef.current || reportesList.length === 0 || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const sheetNodes = containerRef.current.querySelectorAll('.reporte-sheet-item');
      if (!sheetNodes || sheetNodes.length === 0) return;

      const pdf = new jsPDF({
        format: 'letter',
        orientation: 'portrait',
        unit: 'mm',
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;

      for (let i = 0; i < sheetNodes.length; i++) {
        setPdfProgress(
          sheetNodes.length > 1 ? `(${i + 1}/${sheetNodes.length})` : ''
        );
        const node = sheetNodes[i];
        const canvas = await html2canvas(node, {
          useCORS: true,
          logging: false,
          scale: 2.5,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        const ratio = Math.min(availW / canvas.width, availH / canvas.height);
        const drawW = canvas.width * ratio;
        const drawH = canvas.height * ratio;
        const offsetX = margin + (availW - drawW) / 2;
        const offsetY = margin;

        if (i > 0) {
          pdf.addPage('letter', 'portrait');
        }
        pdf.setPage(i + 1);
        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);
      }

      if (mode === 'open') {
        window.open(pdf.output('bloburl'), '_blank');
      } else {
        const filename = isMulti
          ? `Reportes_Mantenimiento_Lote_${reportesList.length}_Reportes.pdf`
          : `${reporteUnico?.fecha || 'Fecha'} - SN ${reporteUnico?.serie || 'Serie'} - Reporte Nº ${reporteUnico?.numero_reporte || ''}.pdf`;
        pdf.save(filename);
      }
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Ocurrió un error al generar el PDF.');
    } finally {
      setGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  if (loading) {
    return (
      <div className="contenedor" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        <FaSync className="fa-spin" style={{ marginRight: '8px' }} />
        {totalToLoad > 1
          ? `Cargando reportes seleccionados (${loadedCount} de ${totalToLoad})...`
          : 'Cargando reporte de servicio...'}
      </div>
    );
  }

  return (
    <div className="contenedor" style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 6mm;
          }
          body, html {
            background: #ffffff !important;
          }
          .no-print, nav, header {
            display: none !important;
          }
          .documento-reporte {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Action Toolbar */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          padding: '12px 18px',
          borderRadius: '10px',
          border: '1px solid #334155',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              const queryParams = new URLSearchParams(window.location.search);
              const returnUrl = queryParams.get('returnUrl');
              if (returnUrl) {
                window.location.href = returnUrl;
              } else if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = './reportes';
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1.5px solid #0284c7',
              padding: '7px 14px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <FaArrowLeft size={13} /> {isMulti ? 'Regresar a Reportes' : 'Regresar'}
          </button>

          <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '15px' }}>
            {isMulti
              ? `📄 ${reportesList.length} Reportes Seleccionados para Impresión`
              : `📄 Reporte de Servicio Nº ${reporteUnico?.numero_reporte}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => buildAndExportPdf('save')}
            disabled={generatingPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              padding: '7px 15px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: generatingPdf ? 'wait' : 'pointer',
            }}
          >
            <GrDocumentPdf size={16} />{' '}
            {generatingPdf
              ? `Procesando ${pdfProgress}...`
              : isMulti
              ? `Descargar PDF (${reportesList.length} Hojas)`
              : 'Descargar PDF (1 Hoja)'}
          </button>
          <button
            onClick={() => buildAndExportPdf('open')}
            disabled={generatingPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#047857',
              color: '#f8fafc',
              border: '1px solid #10b981',
              padding: '7px 15px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: generatingPdf ? 'wait' : 'pointer',
            }}
          >
            <SlPrinter size={16} />{' '}
            {generatingPdf
              ? `Preparando ${pdfProgress}...`
              : isMulti
              ? `Imprimir Todos (${reportesList.length})`
              : 'Imprimir'}
          </button>
          {!isMulti && (
            <button
              onClick={deleteReport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                border: '1px solid #ef4444',
                padding: '7px 13px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <BsTrash size={16} /> Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Contenedor de hojas de reportes */}
      <div ref={containerRef}>
        {reportesList.map((rep, idx) => (
          <ReporteDocumentoSheet
            key={rep._id || idx}
            reporte={rep}
            isLast={idx === reportesList.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

export default ReportePdf;
