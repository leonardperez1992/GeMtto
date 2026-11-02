import { useState, useEffect, useRef } from 'react';
import { apiObtenerReporte, apiEliminarReportes } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { GrDocumentPdf } from 'react-icons/gr';
import { BsTrash } from 'react-icons/bs';
import { SlPrinter } from 'react-icons/sl';
import { FaArrowLeft, FaSync, FaDownload, FaCheckCircle, FaFilePdf } from 'react-icons/fa';

const getReporteFilename = (rep) =>
  `${rep?.fecha || 'Fecha'} - SN ${rep?.serie || 'Serie'} - Reporte Nº ${rep?.numero_reporte || ''}.pdf`;

const renderNodeToSinglePagePdf = async (node) => {
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

  pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);
  return pdf;
};

function ReporteDocumentoSheet({
  reporte,
  index,
  total,
  isLast,
  onDownloadSingle,
  downloadingThis,
  wasDownloaded,
}) {
  const imgIng = useRef(null);
  const imgRec = useRef(null);
  const sheetRef = useRef(null);

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
    <div style={{ marginBottom: isLast ? '10px' : '28px' }}>
      {/* Barra individual por reporte cuando hay varios seleccionados */}
      {total > 1 && (
        <div
          className="no-print"
          style={{
            maxWidth: '820px',
            margin: '0 auto 6px auto',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>
            <span style={{ color: '#38bdf8', fontWeight: '800', marginRight: '8px' }}>
              [{index + 1} de {total}]
            </span>
            Reporte Nº <strong>{reporte?.numero_reporte}</strong> — {reporte?.equipo} (SN:{' '}
            <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{reporte?.serie}</span>) —{' '}
            <span style={{ color: '#94a3b8' }}>{reporte?.fecha}</span>
          </div>

          <button
            type="button"
            onClick={() => onDownloadSingle(sheetRef.current, reporte)}
            disabled={downloadingThis}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: wasDownloaded ? '#065f46' : '#0284c7',
              color: '#ffffff',
              border: wasDownloaded ? '1px solid #10b981' : '1px solid #38bdf8',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: downloadingThis ? 'wait' : 'pointer',
            }}
          >
            {wasDownloaded ? <FaCheckCircle size={12} /> : <FaDownload size={12} />}
            {downloadingThis
              ? 'Generando PDF...'
              : wasDownloaded
              ? 'Descargado (Volver a descargar)'
              : 'Descargar este PDF'}
          </button>
        </div>
      )}

      <div
        ref={sheetRef}
        data-reporte-id={reporte?._id}
        className="documento-reporte reporte-sheet-item"
        style={{
          pageBreakAfter: isLast ? 'auto' : 'always',
          breakAfter: isLast ? 'auto' : 'page',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
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
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadedIds, setDownloadedIds] = useState({});
  // Lista de PDFs individuales generados listos para descarga manual [{ id, filename, blobUrl, reporte }]
  const [generatedIndividualPdfs, setGeneratedIndividualPdfs] = useState([]);
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

  // Descargar un único reporte individualmente
  const handleDownloadSingle = async (node, rep) => {
    if (!node || !rep) return;
    setDownloadingId(rep._id);
    try {
      const pdf = await renderNodeToSinglePagePdf(node);
      const filename = getReporteFilename(rep);
      pdf.save(filename);
      setDownloadedIds((prev) => ({ ...prev, [rep._id]: true }));
    } catch (err) {
      console.error('Error al generar PDF individual:', err);
      alert('No fue posible generar el PDF de este reporte.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Generar todos los PDFs individuales y dejarlos listos en una lista para descarga manual (o secuencial)
  const handleGenerateAllIndividualPdfs = async (autoTriggerDownload = false) => {
    if (!containerRef.current || reportesList.length === 0 || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const sheetNodes = containerRef.current.querySelectorAll('.reporte-sheet-item');
      if (!sheetNodes || sheetNodes.length === 0) return;

      // Liberar URLs previas si existían
      generatedIndividualPdfs.forEach((item) => {
        if (item.blobUrl) URL.revokeObjectURL(item.blobUrl);
      });

      const generated = [];
      for (let i = 0; i < sheetNodes.length; i++) {
        const rep = reportesList[i];
        setPdfProgress(`(${i + 1}/${sheetNodes.length})`);
        const pdf = await renderNodeToSinglePagePdf(sheetNodes[i]);
        const filename = getReporteFilename(rep);
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);

        generated.push({
          id: rep._id || String(i),
          filename,
          blobUrl,
          reporte: rep,
        });

        if (autoTriggerDownload) {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloadedIds((prev) => ({ ...prev, [rep._id]: true }));
          // Pequeña pausa entre descargas para evitar bloqueo del navegador
          await new Promise((r) => setTimeout(r, 420));
        }
      }

      setGeneratedIndividualPdfs(generated);
    } catch (err) {
      console.error('Error al generar los PDFs individuales:', err);
      alert('Ocurrió un error al generar los PDFs individuales.');
    } finally {
      setGeneratingPdf(false);
      setPdfProgress('');
    }
  };

  // Abrir vista de impresión con todos los reportes seleccionados
  const handlePrintAll = async () => {
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
        setPdfProgress(sheetNodes.length > 1 ? `(${i + 1}/${sheetNodes.length})` : '');
        const canvas = await html2canvas(sheetNodes[i], {
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

        if (i > 0) pdf.addPage('letter', 'portrait');
        pdf.setPage(i + 1);
        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);
      }

      window.open(pdf.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Error al preparar impresión:', err);
      alert('Ocurrió un error al preparar la impresión.');
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
              ? `📄 ${reportesList.length} Reportes Seleccionados`
              : `📄 Reporte de Servicio Nº ${reporteUnico?.numero_reporte}`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isMulti ? (
            <>
              <button
                onClick={() => handleGenerateAllIndividualPdfs(false)}
                disabled={generatingPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #38bdf8',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: generatingPdf ? 'wait' : 'pointer',
                }}
                title="Genera todos los archivos PDF por separado y muestra la lista para descargarlos manualmente uno por uno"
              >
                <GrDocumentPdf size={16} />{' '}
                {generatingPdf
                  ? `Generando PDFs ${pdfProgress}...`
                  : `Generar PDFs Individuales (${reportesList.length})`}
              </button>

              <button
                onClick={() => handleGenerateAllIndividualPdfs(true)}
                disabled={generatingPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: '1px solid #10b981',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: generatingPdf ? 'wait' : 'pointer',
                }}
                title="Genera y descarga automáticamente cada reporte en su propio archivo PDF individual"
              >
                <FaDownload size={14} />{' '}
                {generatingPdf
                  ? `Descargando ${pdfProgress}...`
                  : `Descargar Todos Individuales (${reportesList.length})`}
              </button>

              <button
                onClick={handlePrintAll}
                disabled={generatingPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: generatingPdf ? 'wait' : 'pointer',
                }}
              >
                <SlPrinter size={15} /> Imprimir
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const node = containerRef.current?.querySelector('.reporte-sheet-item');
                  handleDownloadSingle(node, reporteUnico);
                }}
                disabled={Boolean(downloadingId)}
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
                  cursor: downloadingId ? 'wait' : 'pointer',
                }}
              >
                <GrDocumentPdf size={16} />{' '}
                {downloadingId ? 'Generando PDF...' : 'Descargar PDF (1 Hoja)'}
              </button>
              <button
                onClick={handlePrintAll}
                disabled={generatingPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  padding: '7px 15px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: generatingPdf ? 'wait' : 'pointer',
                }}
              >
                <SlPrinter size={16} /> Imprimir
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
                  padding: '7px 13px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <BsTrash size={16} /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Panel de PDFs individuales ya generados listos para descarga manual */}
      {isMulti && generatedIndividualPdfs.length > 0 && (
        <div
          className="no-print"
          style={{
            backgroundColor: '#1e293b',
            border: '1.5px solid #0284c7',
            borderRadius: '10px',
            padding: '16px 18px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ color: '#38bdf8', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFilePdf size={16} /> Archivos PDF Individuales Generados ({generatedIndividualPdfs.length}) — Haz clic en cada uno para descargarlo:
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Descargados: <strong style={{ color: '#6ee7b7' }}>{Object.keys(downloadedIds).length}</strong> de {generatedIndividualPdfs.length}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '8px',
              maxHeight: '280px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {generatedIndividualPdfs.map((item, idx) => {
              const isDone = Boolean(downloadedIds[item.id]);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: isDone ? 'rgba(16, 185, 129, 0.12)' : '#0f172a',
                    border: isDone ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#e2e8f0' }}>
                    <strong style={{ color: '#38bdf8', marginRight: '6px' }}>{idx + 1}.</strong>
                    <span title={item.filename}>{item.filename}</span>
                  </div>

                  <a
                    href={item.blobUrl}
                    download={item.filename}
                    onClick={() => setDownloadedIds((prev) => ({ ...prev, [item.id]: true }))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: isDone ? '#065f46' : '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? <FaCheckCircle size={11} /> : <FaDownload size={11} />}
                    {isDone ? 'Descargado' : 'Descargar'}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contenedor de hojas de reportes */}
      <div ref={containerRef}>
        {reportesList.map((rep, idx) => (
          <ReporteDocumentoSheet
            key={rep._id || idx}
            reporte={rep}
            index={idx}
            total={reportesList.length}
            isLast={idx === reportesList.length - 1}
            onDownloadSingle={handleDownloadSingle}
            downloadingThis={downloadingId === rep._id}
            wasDownloaded={Boolean(downloadedIds[rep._id])}
          />
        ))}
      </div>
    </div>
  );
}

export default ReportePdf;
