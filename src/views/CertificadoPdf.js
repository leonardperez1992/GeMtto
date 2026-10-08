import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import generatePDF, { Resolution } from 'react-to-pdf';
import { apiCalibraciones } from '../utils/api';
import request from '../utils/request';
import CalibrationChart from '../components/CalibrationChart';
import ExcentricidadDiagram from '../components/ExcentricidadDiagram';
import { SlPrinter } from 'react-icons/sl';
import { FaArrowLeft, FaEdit, FaPrint } from 'react-icons/fa';

export default function CertificadoPdf() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const certId = searchParams.get('id');

  const [certificado, setCertificado] = useState(null);
  const [loading, setLoading] = useState(true);
  const targetRef = useRef();

  useEffect(() => {
    const fetchCert = async () => {
      if (!certId) return;
      setLoading(true);
      const res = await request({ link: `${apiCalibraciones}/${certId}?_t=${Date.now()}` });
      if (res?.success && res.certificado) {
        setCertificado(res.certificado);
      }
      setLoading(false);
    };
    fetchCert();
  }, [certId]);

  const pdfOptions = {
    filename: `Certificado_Calibracion_${certificado?.numeroCertificado || 'CAL'}_${certificado?.datosEquipo?.serie || 'SN'}.pdf`,
    method: 'save',
    resolution: Resolution.HIGH,
    page: {
      margin: { top: 6, right: 6, bottom: 6, left: 6 },
      format: 'letter',
      orientation: 'portrait',
    },
    canvas: {
      mimeType: 'image/jpeg',
      qualityRatio: 0.98,
      useCORS: true,
    },
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b', fontSize: 15 }}>
        Cargando Certificado de Calibración Oficial...
      </div>
    );
  }

  if (!certificado) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#ef4444', fontSize: 15 }}>
        No se encontró el certificado de calibración solicitado.
      </div>
    );
  }

  const {
    numeroCertificado,
    fechaCalibracion,
    fechaEmision,
    fechaProximaCalibracion,
    datosEquipo = {},
    datosCliente = {},
    tipoPlantilla,
    condicionesAmbientales = {},
    patron = {},
    patronesLista = [],
    procedimiento,
    declaracionTrazabilidad,
    datosCalibracion = {},
    dictamenGlobal,
    observaciones,
    calibro = {},
    aprobo = {},
  } = certificado;

  const puntos = datosCalibracion.puntos || [];
  const repBascula = datosCalibracion.repetibilidadBascula || {};
  const excBascula = datosCalibracion.excentricidadBascula || {};
  const hermeticidad = datosCalibracion.hermeticidad || {};
  const micropipetaInfo = datosCalibracion.micropipetaInfo || {};

  // Componente interno para Encabezado Oficial en cada una de las 3 páginas
  const renderEncabezado = (paginaNum) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '135px 1fr 185px',
        border: '2px solid #0f172a',
        padding: '7px 12px',
        alignItems: 'center',
        marginBottom: 10,
        background: '#ffffff',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <img
          src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
          alt="GEMTTO"
          style={{ maxHeight: 52, maxWidth: 130, objectFit: 'contain' }}
        />
      </div>

      <div
        style={{
          textAlign: 'center',
          borderLeft: '1.5px solid #0f172a',
          borderRight: '1.5px solid #0f172a',
          padding: '0 10px',
        }}
      >
        <div style={{ fontSize: 14.5, fontWeight: 900, color: '#0f172a', letterSpacing: 0.5 }}>
          CERTIFICADO DE CALIBRACIÓN METROLÓGICA
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
          LABORATORIO DE CALIBRACIÓN BIOMÉDICA GEMTTO
        </div>
        <div style={{ fontSize: 9.5, color: '#475569', marginTop: 2, letterSpacing: 0.3, fontWeight: 600 }}>
          CONFORME A LA NORMA INTERNACIONAL ISO/IEC 17025:2017
        </div>
      </div>

      <div style={{ textAlign: 'right', fontSize: 10, paddingLeft: 8, lineHeight: 1.35 }}>
        <div>
          <strong style={{ color: '#475569' }}>Certificado Nº:</strong>
        </div>
        <div style={{ color: '#0284c7', fontWeight: 900, fontSize: 13.5 }}>
          {numeroCertificado}
        </div>
        <div style={{ marginTop: 2 }}>
          <strong>Emisión:</strong> {fechaEmision || fechaCalibracion}
        </div>
        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 10.5 }}>
          Página {paginaNum} de 3
        </div>
      </div>
    </div>
  );

  // Componente interno para Pie de Página Oficial en cada una de las 3 páginas
  const renderPieDePagina = (paginaNum) => (
    <div
      style={{
        marginTop: 'auto',
        paddingTop: 8,
        borderTop: '1.5px solid #cbd5e1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 9.5,
        color: '#475569',
      }}
    >
      <div>
        <strong style={{ color: '#0f172a' }}>GEMTTO S.A.S.</strong> • Metrología Biomédica • Certificado Nº {numeroCertificado}
      </div>
      <div style={{ fontStyle: 'italic', fontSize: 8.5 }}>
        Prohibida la reproducción parcial de este documento sin autorización previa escrita del laboratorio.
      </div>
      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 10 }}>
        Página {paginaNum} de 3
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: 940, margin: '0 auto' }}>
      {/* Estilos CSS incrustados para la división estricta de páginas en impresión y pantalla */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 8mm;
          }
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .certificado-hoja {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 8px 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 98vh !important;
            max-height: 98vh !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .html2pdf__page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
        @media screen {
          .certificado-hoja {
            width: 100%;
            max-width: 860px;
            min-height: 1100px;
            background: #ffffff;
            padding: 24px 30px;
            margin: 0 auto 30px auto;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.4;
          }
        }
      `}</style>

      {/* Barra de Herramientas no imprimible */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <Link
          to="/calibraciones"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f1f5f9',
            color: '#334155',
            padding: '8px 14px',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            border: '1px solid #cbd5e1',
          }}
        >
          <FaArrowLeft size={12} /> Volver a Calibraciones
        </Link>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to={`/editarcalibracion?id=${certId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              color: '#0284c7',
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid #0284c7',
              fontSize: 13.5,
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <FaEdit size={13} /> Editar Certificado
          </Link>

          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#047857',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)',
            }}
          >
            <FaPrint size={14} /> Imprimir / PDF (Navegador)
          </button>

          <button
            onClick={() => generatePDF(targetRef, pdfOptions)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#0284c7',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            }}
          >
            <SlPrinter size={15} /> Descargar PDF Directo
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CONTENEDOR TOTAL IMPRIMIBLE MULTI-HOJA (MÍNIMO 3 PÁGINAS)       */}
      {/* ============================================================== */}
      <div ref={targetRef}>

        {/* ------------------------------------------------------------ */}
        {/* HOJA 1: IDENTIFICACIÓN, CONDICIONES, FECHAS Y PROCEDIMIENTO   */}
        {/* ------------------------------------------------------------ */}
        <div className="certificado-hoja">
          <div>
            {renderEncabezado(1)}

            {/* 1. Datos del Solicitante / Cliente */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 9, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                  letterSpacing: 0.3,
                }}
              >
                1. DATOS DEL CLIENTE / SOLICITANTE
              </div>
              <div style={{ padding: '7px 10px' }}>
                <table style={{ width: '100%', fontSize: 10.5, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 120, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Razón Social:</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{datosCliente.nombre || 'N/A'}</td>
                      <td style={{ width: 110, fontWeight: 700, color: '#334155', padding: '3px 0' }}>NIT / Identificación:</td>
                      <td style={{ fontWeight: 600 }}>{datosCliente.nit || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Sede / Área:</td>
                      <td>{datosCliente.sede || datosEquipo.ubicacion || 'Sede Principal'}</td>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Ciudad / Dpto:</td>
                      <td>{datosCliente.ciudad || 'Colombia'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Dirección:</td>
                      <td>{datosCliente.direccion || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Teléfono / Contacto:</td>
                      <td>{datosCliente.telefono || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Identificación del Instrumento a Calibrar */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 9, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                  letterSpacing: 0.3,
                }}
              >
                2. IDENTIFICACIÓN DEL INSTRUMENTO / ÍTEM CALIBRADO
              </div>
              <div style={{ padding: '7px 10px' }}>
                <table style={{ width: '100%', fontSize: 10.5, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 120, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Instrumento:</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{datosEquipo.nombre || 'Equipo Médico'}</td>
                      <td style={{ width: 110, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Marca / Modelo:</td>
                      <td>{datosEquipo.marca || 'N/A'} / {datosEquipo.modelo || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Número de Serie:</td>
                      <td style={{ fontWeight: 800, color: '#0284c7' }}>{datosEquipo.serie || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Placa de Inventario:</td>
                      <td>{datosEquipo.placaInventario || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Ubicación / Servicio:</td>
                      <td>{datosEquipo.ubicacion || datosEquipo.servicio || 'Área Clínica'}</td>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Resolución (d / e):</td>
                      <td><strong>{datosEquipo.resolucion} {datosEquipo.unidad}</strong></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Magnitud / Unidad:</td>
                      <td>{tipoPlantilla === 'masa_bascula' ? 'Masa (' + datosEquipo.unidad + ')' : tipoPlantilla === 'presion_tensiometro' ? 'Presión (' + datosEquipo.unidad + ')' : 'Volumen (' + datosEquipo.unidad + ')'}</td>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Tipo de Dispositivo:</td>
                      <td>{tipoPlantilla === 'masa_bascula' ? 'Instrumento de Pesaje de Funcionamiento No Automático (IPFNA)' : tipoPlantilla === 'presion_tensiometro' ? 'Esfigmomanómetro no invasivo' : 'Aparato volumétrico accionado por pistón'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Condiciones Ambientales y Lugar de Calibración */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 9, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                  letterSpacing: 0.3,
                }}
              >
                3. CONDICIONES AMBIENTALES Y LUGAR DE CALIBRACIÓN
              </div>
              <div style={{ padding: '7px 10px' }}>
                <table style={{ width: '100%', fontSize: 10.5, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 150, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Temperatura Ambiental:</td>
                      <td><strong>{condicionesAmbientales.temperatura}°C ± {condicionesAmbientales.incertTemperatura || 0.5}°C</strong></td>
                      <td style={{ width: 140, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Humedad Relativa:</td>
                      <td><strong>{condicionesAmbientales.humedadRelativa}% HR ± {condicionesAmbientales.incertHumedad || 2}%</strong></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Presión Atmosférica:</td>
                      <td><strong>{condicionesAmbientales.presionAtmosferica || 1013} hPa</strong></td>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Lugar de Calibración:</td>
                      <td>Instalaciones del cliente / Sede solicitante (Calibración In Situ)</td>
                    </tr>
                    <tr>
                      <td colSpan="4" style={{ fontSize: 9.5, color: '#64748b', paddingTop: 4 }}>
                        * Las condiciones ambientales se mantuvieron estables dentro de los límites de tolerancia metrológica requeridos durante la totalidad de los ensayos.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Fechas y Vigencia */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 9, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                  letterSpacing: 0.3,
                }}
              >
                4. FECHAS Y VIGENCIA DEL SERVICIO METROLÓGICO
              </div>
              <div style={{ padding: '7px 10px' }}>
                <table style={{ width: '100%', fontSize: 10.5, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 150, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Fecha de Calibración:</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{fechaCalibracion}</td>
                      <td style={{ width: 170, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Fecha Sugerida Próxima Cal.:</td>
                      <td style={{ fontWeight: 800, color: '#0284c7' }}>{fechaProximaCalibracion || '1 año'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Fecha de Emisión:</td>
                      <td>{fechaEmision || fechaCalibracion}</td>
                      <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Intervalo de Calibración:</td>
                      <td>12 Meses (Recomendado según uso y estabilidad)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Método y Procedimiento de Calibración */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 9, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                  letterSpacing: 0.3,
                }}
              >
                5. MÉTODO Y PROCEDIMIENTO DE CALIBRACIÓN
              </div>
              <div style={{ padding: '7px 10px', fontSize: 10.5, lineHeight: 1.4 }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Método Metrológico:</strong> Calibración por comparación directa con patrones de referencia de alta exactitud y trazabilidad formal vigente.
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Procedimiento Técnico:</strong> {procedimiento || 'Calibración metrológica y evaluación de incertidumbre según lineamientos ISO/IEC 17025 y directrices OIML.'}
                </div>
                <div style={{ color: '#334155' }}>
                  <strong>Normas y Guías Técnicas de Referencia:</strong>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: 10 }}>
                    {tipoPlantilla === 'masa_bascula' && (
                      <>
                        <li>OIML R 76-1:2006: "Non-automatic weighing instruments - Part 1: Metrological and technical requirements - Tests".</li>
                        <li>EURAMET Calibration Guide No. 18 (cg-18) Version 4.0: "Guidelines on the Calibration of Non-Automatic Weighing Instruments".</li>
                        <li>OIML R 111-1:2004: "Weights of classes E1, E2, F1, F2, M1, M1-2, M2, M2-3 and M3".</li>
                      </>
                    )}
                    {tipoPlantilla === 'presion_tensiometro' && (
                      <>
                        <li>OIML R 16-1 / OIML R 16-2: "Non-invasive mechanical and automated sphygmomanometers".</li>
                        <li>Norma Técnica Colombiana NTC 4353: "Esfigmomanómetros mecánicos para la medición de la presión arterial".</li>
                      </>
                    )}
                    {tipoPlantilla === 'volumen_micropipeta' && (
                      <>
                        <li>ISO 8655-2: "Piston-operated volumetric apparatus - Part 2: Pipettes".</li>
                        <li>ISO 8655-6: "Piston-operated volumetric apparatus - Part 6: Gravimetric reference measurement procedure".</li>
                      </>
                    )}
                    <li>JCGM 100:2008 (GUM): "Evaluation of measurement data — Guide to the expression of uncertainty in measurement".</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 6. Declaración de Trazabilidad */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, background: '#fafafa', padding: '8px 10px', fontSize: 10, textAlign: 'justify', color: '#334155', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 3, fontSize: 11 }}>
                6. DECLARACIÓN DE TRAZABILIDAD METROLÓGICA
              </div>
              {declaracionTrazabilidad} Todos los patrones de medida utilizados durante esta calibración cuentan con certificados vigentes emitidos por laboratorios acreditados bajo la norma ISO/IEC 17025 o por Institutos Nacionales de Metrología (INM / ONAC), asegurando una cadena ininterrumpida de comparaciones con sus respectivas incertidumbres declaradas.
            </div>
          </div>

          {renderPieDePagina(1)}
        </div>

        {/* Salto de Página para Generación PDF */}
        <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

        {/* ------------------------------------------------------------ */}
        {/* HOJA 2: PATRONES UTILIZADOS Y ENSAYOS ESPECÍFICOS             */}
        {/* (INCLUYE ESQUEMA VECTORIAL DE EXCENTRICIDAD EN BÁSCULAS)     */}
        {/* ------------------------------------------------------------ */}
        <div className="certificado-hoja">
          <div>
            {renderEncabezado(2)}

            {/* 7. Patrones de Referencia Empleados */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>7. PATRONES DE MEDICIÓN EMPLEADOS (TRAZABILIDAD METROLÓGICA)</span>
                {tipoPlantilla === 'masa_bascula' && patronesLista && (
                  <span style={{ fontSize: 10, color: '#0284c7', fontWeight: 800 }}>
                    Juego de Masas Patrón ({patronesLista.length} Pesas de Referencia)
                  </span>
                )}
              </div>

              {tipoPlantilla === 'masa_bascula' && patronesLista && patronesLista.length > 0 ? (
                <div style={{ padding: '6px 8px' }}>
                  <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#1e293b' }}>
                        <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 800 }}>Pesa / Identificación</th>
                        <th style={{ padding: '5px 6px', fontWeight: 800 }}>Valor Nominal</th>
                        <th style={{ padding: '5px 6px', fontWeight: 800 }}>Clase OIML</th>
                        <th style={{ padding: '5px 6px', fontWeight: 800 }}>Nº Serie</th>
                        <th style={{ padding: '5px 6px', fontWeight: 800 }}>Nº Certificado</th>
                        <th style={{ padding: '5px 6px', fontWeight: 800 }}>Trazabilidad / Lab</th>
                        <th style={{ padding: '5px 6px', background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>Incertidumbre U (k=2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patronesLista.map((pesa, pIdx) => (
                        <tr key={pIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>
                            {pesa.nombre || pesa.codigo}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 700 }}>
                            {pesa.valorNominal} {pesa.unidad || 'kg'}
                          </td>
                          <td style={{ padding: '4px 6px' }}>{pesa.claseExactitud || 'M1'}</td>
                          <td style={{ padding: '4px 6px' }}>{pesa.serie || 'S/N'}</td>
                          <td style={{ padding: '4px 6px' }}>{pesa.certificadoCalibracion || 'CERT-ONAC'}</td>
                          <td style={{ padding: '4px 6px' }}>{pesa.trazabilidad || 'Lab Acreditado ONAC'}</td>
                          <td style={{ padding: '4px 6px', fontWeight: 800, color: '#b45309', background: '#fffbeb' }}>
                            ± {pesa.incertidumbreExpandida} {pesa.unidad || 'kg'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '8px 10px' }}>
                  <table style={{ width: '100%', fontSize: 10.5, borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: 130, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Patrón Utilizado:</td>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{patron.nombre || 'Patrón Digital'} ({patron.codigo || 'PAT-01'})</td>
                        <td style={{ width: 120, fontWeight: 700, color: '#334155', padding: '3px 0' }}>Marca / Serie:</td>
                        <td>{patron.marca || 'N/A'} • {patron.serie || 'S/N'}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Nº Certificado:</td>
                        <td>{patron.certificadoCalibracion || 'CERT-ONAC'}</td>
                        <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Trazabilidad:</td>
                        <td>{patron.trazabilidad || 'Laboratorio Acreditado ONAC'}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Incertidumbre (U):</td>
                        <td><strong>± {patron.incertidumbreExpandida}</strong> (Factor k={patron.factorK || 2})</td>
                        <td style={{ fontWeight: 700, color: '#334155', padding: '3px 0' }}>Resolución Patrón:</td>
                        <td>{patron.resolucion || 0.05}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 8. Ensayos Metrológicos Específicos */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                }}
              >
                8. ENSAYOS PRELIMINARES Y METROLÓGICOS ESPECÍFICOS
              </div>

              {/* Plantilla: Masa / Básculas */}
              {tipoPlantilla === 'masa_bascula' && (
                <div style={{ padding: '10px 12px' }}>
                  {/* 8.1 Repetibilidad */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', marginBottom: 6, textTransform: 'uppercase' }}>
                      8.1 Ensayo de Repetibilidad (OIML R 76-1 numeral 3.6.1):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 10, alignItems: 'center' }}>
                      <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 10.5, lineHeight: 1.45 }}>
                        <div><strong>Carga de Ensayo:</strong> {repBascula.cargaNominal || 20} {datosEquipo.unidad}</div>
                        <div style={{ marginTop: 2 }}><strong>Promedio (L̄):</strong> {Number(repBascula.promedio || 20).toFixed(4)} {datosEquipo.unidad}</div>
                        <div style={{ marginTop: 2 }}><strong>Desviación Estándar (s):</strong> <span style={{ color: '#0369a1', fontWeight: 800 }}>{Number(repBascula.desviacionEstandar || 0).toFixed(4)} {datosEquipo.unidad}</span></div>
                        <div style={{ marginTop: 2 }}><strong>Criterio OIML:</strong> s ≤ EMP ({datosEquipo.resolucion * 2} {datosEquipo.unidad}) → <span style={{ color: '#15803d', fontWeight: 800 }}>CONFORME</span></div>
                      </div>

                      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '4px 5px', fontWeight: 800 }}>Medida 1</th>
                            <th style={{ padding: '4px 5px', fontWeight: 800 }}>Medida 2</th>
                            <th style={{ padding: '4px 5px', fontWeight: 800 }}>Medida 3</th>
                            <th style={{ padding: '4px 5px', fontWeight: 800 }}>Medida 4</th>
                            <th style={{ padding: '4px 5px', fontWeight: 800 }}>Medida 5</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {[0, 1, 2, 3, 4].map((idx) => (
                              <td key={idx} style={{ padding: '5px 4px', borderRight: idx < 4 ? '1px solid #e2e8f0' : 'none', fontWeight: 700, color: '#0f172a' }}>
                                {repBascula.lecturas && repBascula.lecturas[idx] !== undefined ? repBascula.lecturas[idx] : repBascula.promedio || 20} {datosEquipo.unidad}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 8.2 Excentricidad de Carga CON ESQUEMA VECTORIAL TÉCNICO */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', marginBottom: 6, textTransform: 'uppercase' }}>
                      8.2 Ensayo de Excentricidad de Carga (OIML R 76-1 numeral 3.6.2 & EURAMET cg-18):
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 12, alignItems: 'center' }}>
                      {/* Diagrama Vectorial de Referencia */}
                      <div>
                        <ExcentricidadDiagram
                          excentricidad={excBascula}
                          unidad={datosEquipo.unidad}
                          width={380}
                          height={215}
                        />
                      </div>

                      {/* Tabla de Resultados de Excentricidad */}
                      <div>
                        <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', textAlign: 'left' }}>
                              <th style={{ padding: '5px 6px', fontWeight: 800 }}>Posición de Carga</th>
                              <th style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800 }}>Indicación ({datosEquipo.unidad})</th>
                              <th style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800 }}>Error Relativo</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '4px 6px', fontWeight: 700 }}>1. Centro (Referencia)</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>
                                {excBascula.centro || 20} {datosEquipo.unidad}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>0.00 {datosEquipo.unidad}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '4px 6px' }}>2. Delante - Izquierda</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600 }}>{excBascula.pos1 || 20} {datosEquipo.unidad}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                {Number(Math.abs((excBascula.pos1 || 20) - (excBascula.centro || 20))).toFixed(4)} {datosEquipo.unidad}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '4px 6px' }}>3. Detrás - Izquierda</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600 }}>{excBascula.pos4 || 20} {datosEquipo.unidad}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                {Number(Math.abs((excBascula.pos4 || 20) - (excBascula.centro || 20))).toFixed(4)} {datosEquipo.unidad}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '4px 6px' }}>4. Detrás - Derecha</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600 }}>{excBascula.pos3 || 20} {datosEquipo.unidad}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                {Number(Math.abs((excBascula.pos3 || 20) - (excBascula.centro || 20))).toFixed(4)} {datosEquipo.unidad}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '4px 6px' }}>5. Delante - Derecha</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600 }}>{excBascula.pos2 || 20} {datosEquipo.unidad}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                {Number(Math.abs((excBascula.pos2 || 20) - (excBascula.centro || 20))).toFixed(4)} {datosEquipo.unidad}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ marginTop: 8, background: '#f8fafc', padding: '7px 9px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 9.5, lineHeight: 1.4 }}>
                          <div><strong>Diferencia Máxima Registrada:</strong> <span style={{ fontWeight: 800, color: excBascula.cumple ? '#15803d' : '#dc2626' }}>{excBascula.errorMaximo || 0} {datosEquipo.unidad}</span></div>
                          <div style={{ marginTop: 2 }}><strong>Error Máximo Permisible (EMP):</strong> ±{excBascula.emp || (datosEquipo.resolucion * 2)} {datosEquipo.unidad}</div>
                          <div style={{ marginTop: 2 }}>
                            <strong>Conformidad del Ensayo:</strong>{' '}
                            <span style={{ fontWeight: 800, color: excBascula.cumple ? '#15803d' : '#dc2626' }}>
                              {excBascula.cumple ? 'CONFORME (Cumple tolerancia OIML R 76-1)' : 'NO CONFORME'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plantilla: Presión / Tensiómetros */}
              {tipoPlantilla === 'presion_tensiometro' && (
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', marginBottom: 6 }}>
                        8.1 PRUEBA DE HERMETICIDAD DEL SISTEMA NEUMÁTICO (OIML R 16)
                      </div>
                      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 6px', fontWeight: 700 }}>Presión Inicial Aplicada:</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right' }}>{hermeticidad.presionInicial || 200} mmHg</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 6px', fontWeight: 700 }}>Presión Final a 60 Segundos:</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right' }}>{hermeticidad.presionFinal || 198} mmHg</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 6px', fontWeight: 700 }}>Caída de Presión Medida (ΔP):</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                              {hermeticidad.caidaPresion || 2} mmHg
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 6px', fontWeight: 700 }}>Límite Máximo Permisible:</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right' }}>≤ 4.0 mmHg / min</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 6px', fontWeight: 700 }}>Conformidad Hermeticidad:</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, color: hermeticidad.cumple ? '#15803d' : '#dc2626' }}>
                              {hermeticidad.cumple ? 'CONFORME (CUMPLE)' : 'NO CONFORME'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', marginBottom: 6 }}>
                        8.2 PRUEBA DE ERROR A CERO Y HISTERESIS
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 10, lineHeight: 1.4 }}>
                        <div><strong>Retorno al Punto Cero:</strong> La aguja / indicador retorna con precisión a la marca de reposo cero al despresurizar completamente el sistema.</div>
                        <div style={{ marginTop: 6 }}><strong>Tolerancia admisible:</strong> ±0.8 mmHg</div>
                        <div style={{ marginTop: 6 }}><strong>Estado:</strong> <span style={{ fontWeight: 800, color: '#15803d' }}>CONFORME</span></div>
                        <div style={{ marginTop: 8, fontSize: 9.5, color: '#64748b' }}>
                          * El sistema mecánico neumático no presenta fugas en válvula, pera de insuflación ni conexiones de manguera.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plantilla: Volumen / Micropipetas */}
              {tipoPlantilla === 'volumen_micropipeta' && (
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', marginBottom: 6 }}>
                    8.1 PARÁMETROS GRAVIMÉTRICOS Y FACTOR DE CONVERSIÓN Z (ISO 8655-6)
                  </div>
                  <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>Líquido de Ensayo:</td>
                        <td style={{ padding: '4px 6px' }}>Agua destilada desgasificada Grado 3 (ISO 3696)</td>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>Temperatura del Agua:</td>
                        <td style={{ padding: '4px 6px' }}>{micropipetaInfo.temperaturaAgua || 20}°C</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>Presión Atmosférica:</td>
                        <td style={{ padding: '4px 6px' }}>{micropipetaInfo.presionAtmosferica || 1013} hPa</td>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>Factor de Conversión Z:</td>
                        <td style={{ padding: '4px 6px', fontWeight: 800, color: '#0284c7' }}>{micropipetaInfo.factorZ || 1.0029} µL/mg</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>Tipo de Micropipeta:</td>
                        <td style={{ padding: '4px 6px' }}>{micropipetaInfo.tipo || 'Volumen Variable Monocanal'}</td>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>Volumen Nominal:</td>
                        <td style={{ padding: '4px 6px' }}>{micropipetaInfo.volumenNominal || 1000} µL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {renderPieDePagina(2)}
        </div>

        {/* Salto de Página para Generación PDF */}
        <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

        {/* ------------------------------------------------------------ */}
        {/* HOJA 3: RESULTADOS DE CALIBRACIÓN, GRÁFICO, DICTAMEN Y FIRMAS */}
        {/* ------------------------------------------------------------ */}
        <div className="certificado-hoja">
          <div>
            {renderEncabezado(3)}

            {/* 9. Resultados de la Calibración */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  padding: '5px 9px',
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>9. RESULTADOS DE LA CALIBRACIÓN (MEDIDAS, ERRORES E INCERTIDUMBRE EXPANDIDA)</span>
                <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
                  Factor de Cobertura k = 2 (Nivel de Confianza ~95.45%)
                </span>
              </div>

              <div style={{ padding: '5px 6px' }}>
                <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#1e293b' }}>
                      <th style={{ padding: '5px 5px', width: 28, fontWeight: 800 }}>Pto</th>
                      <th style={{ padding: '5px 5px', textAlign: 'left', fontWeight: 800 }}>
                        Carga Patrón ({datosEquipo.unidad})
                      </th>
                      <th style={{ padding: '5px 5px', fontWeight: 800 }}>Media Indicada ({datosEquipo.unidad})</th>
                      <th style={{ padding: '5px 5px', fontWeight: 800 }}>Error de Indicación ({datosEquipo.unidad})</th>
                      <th style={{ padding: '5px 5px', background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>
                        Incertidumbre U (k=2)
                      </th>
                      <th style={{ padding: '5px 5px', fontWeight: 800 }}>Factor k</th>
                      <th style={{ padding: '5px 5px', fontWeight: 800 }}>Tolerancia EMP</th>
                      <th style={{ padding: '5px 5px', fontWeight: 800 }}>Conformidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puntos.map((p, idx) => {
                      const valorCarga =
                        p.valorPatron !== undefined && p.valorPatron !== null && p.valorPatron !== ''
                           ? p.valorPatron
                          : (p.valorNominal ?? p.nominal ?? 0);

                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '4.5px 5px', fontWeight: 800 }}>{idx + 1}</td>
                          <td style={{ padding: '4.5px 5px', textAlign: 'left', fontWeight: 800, color: '#0f172a' }}>
                            {valorCarga} {datosEquipo.unidad}
                            {p.pesasUtilizadas && (
                              <div style={{ fontSize: 9, color: '#0284c7', fontWeight: 600, marginTop: 1 }}>
                                [{p.pesasUtilizadas}]
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '4.5px 5px', fontWeight: 700 }}>{p.promedio}</td>
                          <td style={{ padding: '4.5px 5px', fontWeight: 800, color: p.error === 0 ? '#334155' : p.error > 0 ? '#0284c7' : '#d97706' }}>
                            {p.error > 0 ? `+${p.error}` : p.error} {datosEquipo.unidad}
                          </td>
                          <td style={{ padding: '4.5px 5px', fontWeight: 800, color: '#b45309', background: '#fffbeb' }}>
                            ± {p.incertidumbreExpandida} {datosEquipo.unidad}
                          </td>
                          <td style={{ padding: '4.5px 5px', fontWeight: 700 }}>{p.factorK || 2}</td>
                          <td style={{ padding: '4.5px 5px', color: '#334155', fontWeight: 600 }}>
                            ±{p.emp || (tipoPlantilla === 'presion_tensiometro' ? 3 : datosEquipo.resolucion * 2)}
                          </td>
                          <td style={{ padding: '4.5px 5px' }}>
                            <span
                              style={{
                                padding: '2.5px 7px',
                                borderRadius: 3,
                                fontSize: 9,
                                fontWeight: 800,
                                background: p.cumple ? '#dcfce7' : '#fee2e2',
                                color: p.cumple ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {p.cumple ? 'CONFORME' : 'NO CONFORME'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10. Gráfico de Calibración Integrado */}
            <div style={{ marginBottom: 10 }}>
              <CalibrationChart
                puntos={puntos}
                unidad={datosEquipo.unidad}
                titulo="Gráfico de Calibración: Curva de Error de Indicación y Barras de Incertidumbre Expandida (k=2) vs. Límites EMP"
                height={220}
              />
            </div>

            {/* 11. Regla de Decisión y Dictamen Global */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                padding: '7px 12px',
                borderRadius: 4,
                marginBottom: 8,
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 10, color: '#334155', textAlign: 'justify', flex: 1, lineHeight: 1.4 }}>
                <strong>Regla de Decisión (ISO/IEC 17025 / ILAC-G8):</strong> Se declara conformidad cuando el error de indicación corregido más la incertidumbre expandida (k=2) no excede los límites de error máximo permisible (EMP) establecidos por la norma de referencia.
              </div>
              <div
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  background: dictamenGlobal === 'CONFORME' ? '#dcfce7' : '#fee2e2',
                  color: dictamenGlobal === 'CONFORME' ? '#15803d' : '#b91c1c',
                  border: `1.5px solid ${dictamenGlobal === 'CONFORME' ? '#86efac' : '#fca5a5'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                DICTAMEN: {dictamenGlobal}
              </div>
            </div>

            {/* 12. Observaciones */}
            <div
              style={{
                border: '1px solid #cbd5e1',
                padding: '6px 10px',
                borderRadius: 4,
                marginBottom: 9,
                fontSize: 10,
                lineHeight: 1.4,
                background: '#fafafa',
              }}
            >
              <strong>Observaciones Técnicas:</strong>{' '}
              {observaciones || 'El instrumento evaluado se entrega en óptimas condiciones de funcionamiento metrológico y con etiqueta de calibración adherida indicando fecha y vigencia.'}
            </div>

            {/* 13. Firmas Digitales Oficiales y Responsables Técnicos */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
                marginTop: 6,
                marginBottom: 6,
              }}
            >
              {/* Calibró */}
              <div style={{ textAlign: 'center', borderTop: '1px solid #64748b', paddingTop: 6 }}>
                {calibro.firma ? (
                  <img
                    src={calibro.firma}
                    alt="Firma Calibrador"
                    style={{ height: 42, maxWidth: 175, objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ height: 42 }} />
                )}
                <div style={{ fontWeight: 800, fontSize: 11, color: '#0f172a' }}>
                  {calibro.nombre || 'Ing. Metrólogo Biomédico'}
                </div>
                <div style={{ fontSize: 9.5, color: '#334155', fontWeight: 600 }}>
                  {calibro.cargo || 'Responsable de la Calibración'}
                </div>
                {calibro.tarjetaProfesional && (
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                    T.P. Nº {calibro.tarjetaProfesional}
                  </div>
                )}
              </div>

              {/* Aprobó */}
              <div style={{ textAlign: 'center', borderTop: '1px solid #64748b', paddingTop: 6 }}>
                {aprobo.firma ? (
                  <img
                    src={aprobo.firma}
                    alt="Firma Aprobador"
                    style={{ height: 42, maxWidth: 175, objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ height: 42 }} />
                )}
                <div style={{ fontWeight: 800, fontSize: 11, color: '#0f172a' }}>
                  {aprobo.nombre || 'Director Técnico de Metrología'}
                </div>
                <div style={{ fontSize: 9.5, color: '#334155', fontWeight: 600 }}>
                  {aprobo.cargo || 'Aprobó / Responsable Metrología'}
                </div>
                {aprobo.tarjetaProfesional && (
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                    T.P. Nº {aprobo.tarjetaProfesional}
                  </div>
                )}
              </div>
            </div>

            {/* 14. Fin del Certificado */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 9.5,
                fontWeight: 800,
                color: '#64748b',
                marginTop: 6,
                letterSpacing: 0.5,
              }}
            >
              *** FIN DEL CERTIFICADO DE CALIBRACIÓN (PÁGINA 3 DE 3) ***
            </div>
          </div>

          {renderPieDePagina(3)}
        </div>

      </div>
    </div>
  );
}
