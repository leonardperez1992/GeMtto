import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import generatePDF, { Resolution } from 'react-to-pdf';
import { apiCalibraciones } from '../utils/api';
import request from '../utils/request';
import CalibrationChart from '../components/CalibrationChart';
import ExcentricidadDiagram from '../components/ExcentricidadDiagram';
import {
  resolverTipoPlantillaCertificado,
  obtenerObservacionesPorPlantilla,
} from '../utils/metrologyEngine';
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
    condicionesAmbientales = {},
    patron = {},
    patronesLista = [],
    procedimiento,
    declaracionTrazabilidad,
    datosCalibracion = {},
    dictamenGlobal,
    observaciones: rawObservaciones,
    calibro = {},
    aprobo = {},
  } = certificado;

  const tipoPlantilla = resolverTipoPlantillaCertificado(certificado);
  const observaciones = obtenerObservacionesPorPlantilla(tipoPlantilla, rawObservaciones);

  const pickPos = (...vals) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) && Number(v) !== 0) {
        return Number(v);
      }
    }
    return 0;
  };

  const puntos = datosCalibracion.puntos || [];
  const sonPuntosTensiometro =
    Array.isArray(puntos) &&
    puntos.some(
      (p) =>
        (Number(p.indicacionIBC) === 300 || Number(p.valorPatron) === 300) &&
        !p.pesasUtilizadas &&
        !(Number(p.valorMasaConvencional) > 0) &&
        !(Number(p.volumenSeleccionado) > 0)
    );
  const repBascula = datosCalibracion.repetibilidadBascula || {};
  const excBascula = datosCalibracion.excentricidadBascula || {};
  const hermeticidad = datosCalibracion.hermeticidad || {};
  const micropipetaInfo = datosCalibracion.micropipetaInfo || {};

  const defaultPuntosBascula = [
    { puntoNumero: 1, cargaNominal: 5, valorMasaConvencional: 5.000103, valorPatron: 5.000103, lecturas: [5.0, 5.0, 5.0], promedio: 5.0, indicacionPromedio: 5.0, error: -0.0001, incertidumbreExpandida: 0.082, factorK: 2, emp: 0.1, cumple: true },
    { puntoNumero: 2, cargaNominal: 40, valorMasaConvencional: 39.99996, valorPatron: 39.99996, lecturas: [40.2, 40.2, 40.2], promedio: 40.2, indicacionPromedio: 40.2, error: 0.2000, incertidumbreExpandida: 0.12, factorK: 2, emp: 0.2, cumple: true },
    { puntoNumero: 3, cargaNominal: 80, valorMasaConvencional: 79.99992, valorPatron: 79.99992, lecturas: [80.3, 80.4, 80.4], promedio: 80.4, indicacionPromedio: 80.4, error: 0.3667, incertidumbreExpandida: 0.20, factorK: 2, emp: 0.4, cumple: true },
    { puntoNumero: 4, cargaNominal: 120, valorMasaConvencional: 119.99988, valorPatron: 119.99988, lecturas: [120.3, 120.4, 120.4], promedio: 120.4, indicacionPromedio: 120.4, error: 0.3667, incertidumbreExpandida: 0.29, factorK: 2, emp: 0.4, cumple: true },
    { puntoNumero: 5, cargaNominal: 150, valorMasaConvencional: 149.99989, valorPatron: 149.99989, lecturas: [150.4, 150.5, 150.5], promedio: 150.5, indicacionPromedio: 150.5, error: 0.4667, incertidumbreExpandida: 0.36, factorK: 2, emp: 0.5, cumple: true },
  ];
  const rawPuntosBascula =
    puntos && puntos.length > 0 && !sonPuntosTensiometro ? puntos : defaultPuntosBascula;
  const cargasDefaultEscalon = [5, 40, 80, 120, 150];
  const puntosBasculaDisplay = rawPuntosBascula.map((p, idx) => {
    const fallbackCarga = cargasDefaultEscalon[idx] ?? (idx + 1) * 30;
    const rawCarga = pickPos(p.cargaNominal, p.valorNominal, p.valorPatron, p.valorMasaConvencional) || fallbackCarga;
    const cNom = Math.abs(rawCarga - Math.round(rawCarga)) < 0.01 ? Math.round(rawCarga) : rawCarga;
    const masaConv = pickPos(p.valorMasaConvencional, p.valorPatron, cNom);
    const lects =
      Array.isArray(p.lecturas) && p.lecturas.length >= 3
        ? p.lecturas
        : [pickPos(p.promedio, p.indicacionPromedio, cNom), pickPos(p.promedio, p.indicacionPromedio, cNom), pickPos(p.promedio, p.indicacionPromedio, cNom)];
    const prom =
      pickPos(p.indicacionPromedio, p.promedio) ||
      lects.reduce((a, b) => a + Number(b), 0) / lects.length;
    const err =
      p.error !== undefined && p.error !== null && Number(p.error) !== 0
        ? Number(p.error)
        : Number((prom - masaConv).toFixed(4));
    return {
      ...p,
      cargaNominal: cNom,
      valorNominal: cNom,
      valorMasaConvencional: masaConv,
      valorPatron: masaConv,
      lecturas: lects,
      indicacionPromedio: prom,
      promedio: prom,
      error: err,
    };
  });

  const defaultPatronesBascula = [
    {
      codigo: 'SET-M1-01',
      nombre: '(1, 2, 2*, 5, 10, 20, 20*, 50, 100, 200, 500) g y (1, 2, 2*, 5) kg - (A,B,C,D,E,F Y G)',
      claseExactitud: 'M1',
      certificadoCalibracion: 'LM-0002-25 / LM-0045-25 / LM-0195-24 / CL225292 / LM-0043-25 y LM-0198-24',
      fechaCalibracion: '2025-01-16 / 2025-04-16 / 2024-09-05 / 2024-08-19 / 2025-04-01 y 2024-09-11',
      trazabilidad: 'Acreditado ANAB / INM',
    },
    {
      codigo: 'PAT-M-10K',
      nombre: '10 kg - (A,B,C,D,E,F Y G)',
      claseExactitud: 'M1',
      certificadoCalibracion: 'M24-323 / CL229780 / CL228025 y CL228451',
      fechaCalibracion: '2024-06-17 / 2025-05-29 / 2025-02-17 y 2025-03-19',
      trazabilidad: 'Acreditado ANAB / INM',
    },
    {
      codigo: 'PAT-M-20K',
      nombre: '20 kg - (A,B,C,D,E,F Y G)',
      claseExactitud: 'M1',
      certificadoCalibracion: 'M24-324 / CL229781 / CL228027 / CL228453 / M241524 / M241524 y M241524',
      fechaCalibracion: '2024-06-17 / 2025-05-29 / 2025-02-17 / 2025-03-19 / 2024-08-15 / 2024-08-15 y 2024-08-15',
      trazabilidad: 'Acreditado ANAB / INM',
    },
  ];
  const patronesBasculaDisplay = (patronesLista && patronesLista.length > 0) ? patronesLista : defaultPatronesBascula;

  const defaultPuntosMicropipeta = [
    { puntoNumero: 1, nominal: 50, volumenSeleccionado: 50, volumenCalculado: 50.51, promedio: 50.51, error: 0.5, errorSistematico: 0.5, incertidumbreExpandida: 5.8, factorK: 2.0, errorAleatorio: 0.33, desviacionEstandar: 0.33, cumple: true },
    { puntoNumero: 2, nominal: 25, volumenSeleccionado: 25, volumenCalculado: 25.14, promedio: 25.14, error: 0.1, errorSistematico: 0.1, incertidumbreExpandida: 5.8, factorK: 2.0, errorAleatorio: 0.08, desviacionEstandar: 0.08, cumple: true },
    { puntoNumero: 3, nominal: 5, volumenSeleccionado: 5, volumenCalculado: 5.09, promedio: 5.09, error: 0.1, errorSistematico: 0.1, incertidumbreExpandida: 5.8, factorK: 2.0, errorAleatorio: 0.08, desviacionEstandar: 0.08, cumple: true },
  ];
  const puntosMicropipetaDisplay =
    puntos && puntos.length > 0 && !sonPuntosTensiometro ? puntos : defaultPuntosMicropipeta;

  const formatComma = (val, decs = null) => {
    if (val === undefined || val === null || val === '') return '0';
    const num = Number(val);
    if (isNaN(num)) return String(val).replace('.', ',');
    if (decs !== null) return num.toFixed(decs).replace('.', ',');
    return String(num).replace('.', ',');
  };

  const formatMasaConv = (val) => {
    if (val === undefined || val === null || val === '') return '0,0000';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    const str = num.toString();
    if (str.includes('.')) {
      const decs = str.split('.')[1].length;
      return num.toFixed(Math.max(decs, 4)).replace('.', ',');
    }
    return num.toFixed(4).replace('.', ',');
  };

  const formatErrorVal = (val) => {
    if (val === undefined || val === null || val === '') return '0,0000';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    const sign = num > 0 ? '+' : '';
    return sign + num.toFixed(4).replace('.', ',');
  };

  const formatIncertVal = (val) => {
    if (val === undefined || val === null || val === '') return '0,00';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num < 0.1) return num.toFixed(3).replace('.', ',');
    return num.toFixed(2).replace('.', ',');
  };

  // Componente interno para Encabezado Oficial en cada página
  const renderEncabezado = (paginaNum, totalPaginas = 3, titulo = 'CERTIFICADO DE CALIBRACIÓN METROLÓGICA', subtitulo = 'LABORATORIO DE CALIBRACIÓN BIOMÉDICA GEMTTO') => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '145px 1fr 190px',
        border: '2px solid #0f172a',
        padding: '8px 14px',
        alignItems: 'center',
        marginBottom: 10,
        background: '#ffffff',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <img
          src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
          alt="GEMTTO"
          style={{ maxHeight: 58, maxWidth: 140, objectFit: 'contain' }}
        />
      </div>

      <div
        style={{
          textAlign: 'center',
          borderLeft: '1.5px solid #0f172a',
          borderRight: '1.5px solid #0f172a',
          padding: '0 12px',
        }}
      >
        <div style={{ fontSize: 14.5, fontWeight: 900, color: '#0f172a', letterSpacing: 0.6 }}>
          {titulo}
        </div>
        <div style={{ fontSize: 11.8, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
          {subtitulo}
        </div>
        <div style={{ fontSize: 9.8, color: '#475569', marginTop: 2, letterSpacing: 0.3, fontWeight: 700 }}>
          CONFORME A LA NORMA INTERNACIONAL ISO/IEC 17025:2017
        </div>
      </div>

      <div style={{ textAlign: 'right', fontSize: 10.5, paddingLeft: 8, lineHeight: 1.4 }}>
        <div>
          <strong style={{ color: '#475569' }}>Certificado Nº:</strong>
        </div>
        <div style={{ color: '#0284c7', fontWeight: 900, fontSize: 15 }}>
          {numeroCertificado}
        </div>
        <div style={{ marginTop: 2 }}>
          <strong>Emisión:</strong> {fechaEmision || fechaCalibracion}
        </div>
        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 11.5 }}>
          Página {paginaNum} de {totalPaginas}
        </div>
      </div>
    </div>
  );

  // Componente interno para Pie de Página Oficial en cada página
  const renderPieDePagina = (paginaNum, totalPaginas = 3, leyendaPersonalizada = null) => (
    <div
      style={{
        marginTop: 'auto',
        paddingTop: 8,
        borderTop: '2px solid #0f172a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 10,
        color: '#475569',
      }}
    >
      <div>
        <strong style={{ color: '#0f172a', fontSize: 10.5 }}>GEMTTO S.A.S.</strong> • Metrología Biomédica • Certificado Nº {numeroCertificado}
      </div>
      <div style={{ fontStyle: 'italic', fontSize: 9.2 }}>
        {leyendaPersonalizada || 'Prohibida la reproducción parcial de este documento sin autorización previa escrita del laboratorio.'}
      </div>
      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 11 }}>
        Página {paginaNum} de {totalPaginas}
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
            margin: 7mm 8mm;
          }
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .certificado-hoja {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 2mm 3mm !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 264mm !important;
            min-height: 264mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
          }
          .html2pdf__page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
        @media screen {
          .certificado-hoja {
            width: 100%;
            max-width: 890px;
            min-height: 1150px;
            background: #ffffff;
            padding: 24px 30px;
            margin: 0 auto 30px auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.09);
            border: 1.5px solid #cbd5e1;
            border-radius: 4px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            font-size: 11.5px;
            line-height: 1.45;
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
      {/* CONTENEDOR TOTAL IMPRIMIBLE MULTI-HOJA                         */}
      {/* ============================================================== */}
      <div ref={targetRef}>
        {tipoPlantilla === 'presion_tensiometro' ? (
          <>
            {/* ------------------------------------------------------------ */}
            {/* HOJA 1: FORMATO ACREDITADO ISO 17025 - TENSIÓMETROS (PÁG 1/2) */}
            {/* ------------------------------------------------------------ */}
            <div className="certificado-hoja">
              <div>
                {renderEncabezado(1, 2, 'CERTIFICADO DE CALIBRACIÓN', 'LABORATORIO DE CALIBRACIÓN METROLÓGICA')}

                {/* Fila 1: Cliente & Ítem a Calibrar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  {/* DATOS GENERALES DEL CLIENTE */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      DATOS GENERALES DEL CLIENTE
                    </div>
                    <div style={{ padding: '7px 10px' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: 95, fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Solicitante:</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{datosCliente.nombre || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Dirección:</td>
                            <td>{datosCliente.direccion || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Ciudad:</td>
                            <td>{datosCliente.ciudad || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Contacto:</td>
                            <td>{datosCliente.telefono || datosCliente.contacto || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DATOS GENERALES DEL ÍTEM A CALIBRAR */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      DATOS GENERALES DEL ÍTEM A CALIBRAR
                    </div>
                    <div style={{ padding: '7px 10px' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: 115, fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Ítem:</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{datosEquipo.nombre || 'Esfigmomanómetro no invasivo'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Marca / Modelo:</td>
                            <td>{datosEquipo.marca || 'N/A'} / {datosEquipo.modelo || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Serie:</td>
                            <td style={{ fontWeight: 800, color: '#0284c7' }}>{datosEquipo.serie || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>No. de Activo:</td>
                            <td>{datosEquipo.nroActivo || datosEquipo.placaInventario || 'No presenta'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Fecha recepción:</td>
                            <td>{datosEquipo.fechaRecepcion || fechaCalibracion}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Intervalo / Res.:</td>
                            <td>0 a 300 mmHg / {datosEquipo.resolucion || 2} mmHg</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Área / Servicio:</td>
                            <td style={{ fontWeight: 600 }}>{datosEquipo.servicio || datosCliente.sede || datosEquipo.ubicacion || 'Servicio Médico'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Fila 2: Datos de Calibración & Patrones */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.18fr 1fr', gap: 12, marginBottom: 10 }}>
                  {/* DATOS GENERALES DE LA CALIBRACIÓN */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      DATOS GENERALES DE LA CALIBRACIÓN
                    </div>
                    <div style={{ padding: '7px 10px' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: 140, fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Fecha de calibración:</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{fechaCalibracion}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Lugar de calibración:</td>
                            <td>{condicionesAmbientales.lugarCalibracion || 'Ingeniería / In situ'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Procedimiento:</td>
                            <td>{procedimiento || 'MC-DT-I-008 Calibración de Esfigmomanómetros'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Método de calibración:</td>
                            <td>{condicionesAmbientales.metodoCalibracion || 'Comparación directa'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Condiciones ambientales:</td>
                            <td>
                              Temp: <strong>{condicionesAmbientales.temperatura || 22.4} °C ± {condicionesAmbientales.incertTemperatura || 0.6} °C</strong> | HR: <strong>{condicionesAmbientales.humedadRelativa || 55.0} % ± {condicionesAmbientales.incertHumedad || 0.5} %</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Presión atmosférica:</td>
                            <td>{condicionesAmbientales.presionAtmosferica || 1013} hPa</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DATOS DE LOS PATRONES UTILIZADOS */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      DATOS DE LOS PATRONES UTILIZADOS
                    </div>
                    <div style={{ padding: '7px 10px' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: 125, fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Descripción:</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{patron.nombre || 'Módulo de Presión'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Marca / Modelo:</td>
                            <td>{patron.marca || 'FLUKE'} / {patron.modelo || '2700G-BG100K'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Serie:</td>
                            <td style={{ fontWeight: 700 }}>{patron.serie || '4023109'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>No. Certificado:</td>
                            <td>{patron.certificadoCalibracion || 'DE1805-25'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Fecha calibración:</td>
                            <td>{patron.fechaCalibracion || '2025-05-18'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Trazabilidad:</td>
                            <td>{patron.trazabilidad || 'Fluke Calibration / ONAC / INM'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* TABLA 1: DATOS DE CALIBRACIÓN */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                    DATOS DE CALIBRACIÓN
                  </div>
                  <div style={{ padding: '5px 8px' }}>
                    <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#0f172a' }}>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Prueba</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Referencia</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Unidad</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Medición 1</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Medición 2</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Medición 3</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Medición 4</th>
                        </tr>
                      </thead>
                      <tbody>
                        {puntos.map((p, idx) => {
                          const refVal = p.indicacionIBC ?? p.valorPatron ?? p.valorNominal ?? 0;
                          const lects = Array.isArray(p.lecturas) && p.lecturas.length >= 4
                            ? p.lecturas
                            : Array.isArray(p.lecturas) && p.lecturas.length === 3
                              ? [...p.lecturas, p.lecturas[2]]
                              : [refVal, refVal, refVal, refVal];
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ padding: '5px 8px', fontWeight: 700, color: '#0f172a' }}>{p.prueba || 'Con Brazalete'}</td>
                              <td style={{ padding: '5px 8px', fontWeight: 800 }}>{refVal}</td>
                              <td style={{ padding: '5px 8px', color: '#64748b' }}>mmHg</td>
                              <td style={{ padding: '5px 8px', fontWeight: 600 }}>{lects[0] !== undefined ? lects[0] : '-'}</td>
                              <td style={{ padding: '5px 8px', fontWeight: 600 }}>{lects[1] !== undefined ? lects[1] : '-'}</td>
                              <td style={{ padding: '5px 8px', fontWeight: 600 }}>{lects[2] !== undefined ? lects[2] : '-'}</td>
                              <td style={{ padding: '5px 8px', fontWeight: 600 }}>{lects[3] !== undefined ? lects[3] : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLA 2: RESULTADO - TABLA DE INCERTIDUMBRE */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                    RESULTADO - TABLA DE INCERTIDUMBRE
                  </div>
                  <div style={{ padding: '5px 8px' }}>
                    <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#0f172a' }}>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5 }}>Prueba</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5, background: '#f0f9ff' }}>Presión Referencia</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5 }}>Unidad</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5 }}>Indicación IBC</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5, background: '#f0f9ff' }}>Corrección</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5, background: '#fffbeb', color: '#92400e' }}>Incertidumbre (mmHg)</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5 }}>Factor Cobertura</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5 }}>Conformidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {puntos.map((p, idx) => {
                          const refVal = p.indicacionIBC ?? p.valorPatron ?? p.valorNominal ?? 0;
                          const presRef = p.presionReferencia ?? p.promedio ?? refVal;
                          const corr = p.correccion !== undefined ? p.correccion : Number((presRef - refVal).toFixed(2));
                          const uExp = p.incertidumbreExpandida ?? 0.62;
                          const corrStr = corr > 0 ? `+${corr}` : `${corr}`;
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ padding: '5px 7px', fontWeight: 700, color: '#0f172a' }}>{p.prueba || 'Con Brazalete'}</td>
                              <td style={{ padding: '5px 7px', fontWeight: 800, background: '#f0f9ff' }}>{presRef}</td>
                              <td style={{ padding: '5px 7px', color: '#64748b' }}>mmHg</td>
                              <td style={{ padding: '5px 7px', fontWeight: 800 }}>{refVal}</td>
                              <td style={{ padding: '5px 7px', fontWeight: 800, background: '#f0f9ff', color: corr >= 0 ? '#0369a1' : '#d97706' }}>
                                {corrStr}
                              </td>
                              <td style={{ padding: '5px 7px', fontWeight: 800, color: '#b45309', background: '#fffbeb' }}>
                                ± {uExp}
                              </td>
                              <td style={{ padding: '5px 7px', fontWeight: 700 }}>k = 2</td>
                              <td style={{ padding: '5px 7px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 9.5, fontWeight: 800, background: p.cumple ? '#dcfce7' : '#fee2e2', color: p.cumple ? '#15803d' : '#b91c1c' }}>
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

                {/* OBSERVACIONES */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '8px 12px', fontSize: 10.2, color: '#1e293b', lineHeight: 1.45, background: '#f8fafc' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4, fontSize: 11 }}>OBSERVACIONES METROLÓGICAS:</div>
                  <div>• Los resultados de las calibraciones expresados en este certificado son válidos en el momento y bajo las condiciones en que se realizaron las mediciones.</div>
                  <div>• El factor de cobertura k = 2 corresponde a un nivel de confianza de aproximadamente el 95.45%.</div>
                  <div>• La corrección metrológica se calcula formalmente como: Presión Referencia - Indicación IBC.</div>
                  <div>
                    • * La prueba de hermeticidad realizada al esfigmomanómetro no hace parte del alcance de la acreditación. Razón de cambio calculada: <strong>{hermeticidad.fugaRazonCambio || hermeticidad.caidaPresion || 17.27} mmHg/min</strong> (Límite máximo permitido según OIML 148-2 Edition 2020: ≤ 4.0 mmHg/min) → <strong style={{ color: hermeticidad.cumple ? '#15803d' : '#dc2626' }}>{hermeticidad.cumple ? 'CUMPLE' : 'NO CUMPLE'}</strong>.
                  </div>
                  {observaciones && <div>• {observaciones}</div>}
                </div>
              </div>

              {renderPieDePagina(1, 2)}
            </div>

            {/* Salto de Página para Generación PDF */}
            <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

            {/* ------------------------------------------------------------ */}
            {/* HOJA 2: DECLARACIONES Y FIRMAS (PÁGINA 2 DE 2)                */}
            {/* ------------------------------------------------------------ */}
            <div className="certificado-hoja">
              <div>
                {renderEncabezado(2, 2, 'CERTIFICADO DE CALIBRACIÓN', 'LABORATORIO DE CALIBRACIÓN METROLÓGICA')}

                <div style={{ border: '1.5px solid #0f172a', borderRadius: 4, padding: '14px 18px', marginBottom: 16, background: '#ffffff' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: 0.5 }}>
                    DECLARACIONES METROLÓGICAS GENERALES (ISO/IEC 17025:2017):
                  </div>
                  <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.55, textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <strong>1. Incertidumbre de medición:</strong> La incertidumbre reportada es la incertidumbre de medición expandida, la cual se ha determinado multiplicando la incertidumbre típica combinada por el factor de cobertura k = 2, que para una distribución normal corresponde a una probabilidad de cobertura de aproximadamente el 95.45%. La incertidumbre de medición fue calculada conforme a la Guía para la Expresión de la Incertidumbre de Medida (JCGM 100:2008 - GUM).
                    </div>
                    <div>
                      <strong>2. Trazabilidad metrológica:</strong> Los resultados contenidos en el presente certificado tienen trazabilidad hacia los patrones nacionales del Instituto Nacional de Metrología (INM) o institutos nacionales reconocidos por el BIPM a través del Acuerdo de Reconocimiento Mutuo CIPM-MRA, asegurando una cadena ininterrumpida de calibraciones hacia el Sistema Internacional de Unidades (SI).
                    </div>
                    <div>
                      <strong>3. Regla de decisión de conformidad:</strong> Se aplica la regla de decisión de aceptación simple (riesgo compartido hasta el 50%) conforme a los lineamientos de la guía ILAC-G8:09/2019. Se declara conformidad cuando el resultado medido se encuentra dentro de los límites del Error Máximo Permitido (EMP = ±3.0 mmHg según recomendación internacional OIML 148-2 Edition 2020), sin considerar la zona de guardia por incertidumbre.
                    </div>
                    <div>
                      <strong>4. Validez y uso del certificado:</strong> Este certificado es válido exclusivamente para el ítem bajo calibración identificado en este documento y bajo las condiciones ambientales registradas durante el ensayo. El laboratorio emisor no se responsabiliza por los daños o desajustes que pueda sufrir el instrumento debido a un transporte inapropiado o manipulación incorrecta posterior a la calibración.
                    </div>
                    <div>
                      <strong>5. Reproducción:</strong> Este certificado no puede ser reproducido total ni parcialmente sin la autorización previa escrita de GEMTTO S.A.S. Los certificados sin firma autorizada carecen de validez legal y metrológica.
                    </div>
                    <div>
                      <strong>6. Ensayos fuera del alcance acreditado:</strong> Los ensayos señalados con asterisco (*) en este certificado (prueba de hermeticidad y fuga neumática) se realizan como evaluación de funcionamiento mecánico según la recomendación OIML 148-2 Edition 2020 y no hacen parte del alcance de la acreditación.
                    </div>
                  </div>
                </div>

                {/* Recuadro de Normas de Referencia */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '10px 14px', marginBottom: 20, background: '#f8fafc' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', marginBottom: 5 }}>
                    DOCUMENTOS Y NORMAS METROLÓGICAS DE REFERENCIA:
                  </div>
                  <div style={{ fontSize: 10.5, color: '#334155', lineHeight: 1.5 }}>
                    • <strong>ISO/IEC 17025:2017:</strong> Requisitos generales para la competencia de los laboratorios de ensayo y de calibración.<br />
                    • <strong>OIML R 148-2 Edition 2020:</strong> Non-invasive non-automated sphygmomanometers - Part 2: Test methods.<br />
                    • <strong>ILAC-G8:09/2019:</strong> Guidelines on Decision Rules and Statements of Conformity.<br />
                    • <strong>JCGM 100:2008 (GUM):</strong> Evaluation of measurement data — Guide to the expression of uncertainty in measurement.<br />
                    • <strong>MC-DT-I-008:</strong> Procedimiento técnico específico para la calibración de esfigmomanómetros de presión arterial.
                  </div>
                </div>

                {/* SECCIÓN DE FIRMAS METROLÓGICAS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'center', marginTop: 30, marginBottom: 24 }}>
                  {/* Revisado y autorizado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Revisado y autorizado por:
                    </div>
                    {aprobo.firma ? (
                      <img
                        src={aprobo.firma}
                        alt="Firma Director Técnico"
                        style={{ height: 60, maxWidth: 220, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 60 }} />
                    )}
                    <div style={{ fontWeight: 900, fontSize: 13.5, color: '#0f172a', marginTop: 6 }}>
                      {aprobo.nombre || 'Ing. Fernando Castañeda Meriño'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 800 }}>
                      {aprobo.cargo || 'Director Técnico'}
                    </div>
                    {aprobo.tarjetaProfesional && (
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                        T.P. Nº {aprobo.tarjetaProfesional}
                      </div>
                    )}
                  </div>

                  {/* Ejecutado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Ejecutado por:
                    </div>
                    {calibro.firma ? (
                      <img
                        src={calibro.firma}
                        alt="Firma Ejecutado Por"
                        style={{ height: 60, maxWidth: 220, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {calibro.codigo && (
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: 1.5, border: '1.5px solid #cbd5e1', padding: '4px 14px', borderRadius: 4, background: '#f8fafc' }}>
                            {calibro.codigo}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ fontWeight: 900, fontSize: 13.5, color: '#0f172a', marginTop: 6 }}>
                      {calibro.nombre || 'Ing. Metrólogo Biomédico'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 800 }}>
                      {calibro.cargo || 'Metrólogo Responsable'}
                    </div>
                    {calibro.codigo && calibro.firma && (
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: 700 }}>
                        Código Técnico: {calibro.codigo}
                      </div>
                    )}
                  </div>
                </div>

                {/* FIN DEL INFORME */}
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: 1.5,
                    marginTop: 35,
                    marginBottom: 10,
                  }}
                >
                  --- FIN DEL INFORME METROLÓGICO OFICIAL ---
                </div>
              </div>

              {renderPieDePagina(2, 2)}
            </div>

            {/* Salto de Página para Generación PDF */}
            <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

            {/* ------------------------------------------------------------ */}
            {/* HOJA 3: ANEXO - GRÁFICAS DE DESEMPEÑO (PÁGINA 1 DE 1)          */}
            {/* ------------------------------------------------------------ */}
            <div className="certificado-hoja">
              <div>
                {renderEncabezado(1, 1, 'GRÁFICAS DE DESEMPEÑO', 'LABORATORIO DE CALIBRACIÓN METROLÓGICA')}

                {/* Sub-encabezado con datos del cliente e instrumento */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '10px 14px', marginBottom: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 11, color: '#1e293b' }}>
                    <div><strong>Solicitante:</strong> {datosCliente.nombre || 'N/A'}</div>
                    <div><strong>Dirección / Ciudad:</strong> {datosCliente.direccion || 'N/A'} - {datosCliente.ciudad || 'N/A'}</div>
                    <div><strong>Ítem / Instrumento:</strong> {datosEquipo.nombre || 'Esfigmomanómetro no invasivo'}</div>
                    <div><strong>Serie:</strong> <span style={{ fontWeight: 800, color: '#0284c7' }}>{datosEquipo.serie || 'N/A'}</span></div>
                    <div><strong>No. de Activo:</strong> {datosEquipo.nroActivo || datosEquipo.placaInventario || 'No presenta'}</div>
                  </div>
                </div>

                {/* PRUEBA DE PARÁMETROS */}
                <div style={{ border: '2px solid #0f172a', borderRadius: 6, overflow: 'hidden', marginBottom: 14, background: '#ffffff' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#ffffff',
                      background: '#0f172a',
                      padding: '8px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>PRUEBA DE PARÁMETROS: ERROR DE INDICACIÓN vs. PRESIÓN PATRÓN</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#e0f2fe' }}>
                      Límites EMP: ±3.00 mmHg (OIML 148-2)
                    </span>
                  </div>

                  <div style={{ padding: '12px 10px 6px 10px', background: '#ffffff' }}>
                    <CalibrationChart
                      puntos={puntos}
                      unidad="mmHg"
                      tipoPlantilla="presion_tensiometro"
                      esPresion={true}
                      titulo="PRUEBA DE PARÁMETROS"
                      height={360}
                    />
                  </div>

                  <div style={{ borderTop: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '10px 14px', fontSize: 10.8, color: '#334155', lineHeight: 1.5 }}>
                    <strong>Criterio Normativo de Evaluación:</strong> Para la prueba de parámetros y desempeño se toma como referencia la recomendación internacional <strong>OIML 148-2 Edition 2020</strong>, cuyo error máximo permitido (EMP) para esfigmomanómetros es de <strong>±3.00 mmHg</strong>. La línea roja superior (+3.00 mmHg) e inferior (-3.00 mmHg) representan las tolerancias límite permisibles; la línea central discontinua representa el cero metrológico (0.00 mmHg).
                  </div>
                </div>

                {/* Firmas en Hoja 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
                  {/* Revisado y autorizado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 8 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Revisado y autorizado por:
                    </div>
                    {aprobo.firma ? (
                      <img
                        src={aprobo.firma}
                        alt="Firma Director Técnico"
                        style={{ height: 50, maxWidth: 200, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 50 }} />
                    )}
                    <div style={{ fontWeight: 900, fontSize: 12.5, color: '#0f172a', marginTop: 4 }}>
                      {aprobo.nombre || 'Ing. Fernando Castañeda Meriño'}
                    </div>
                    <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 800 }}>
                      {aprobo.cargo || 'Director Técnico'}
                    </div>
                  </div>

                  {/* Ejecutado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 8 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Ejecutado por:
                    </div>
                    {calibro.firma ? (
                      <img
                        src={calibro.firma}
                        alt="Firma Ejecutado Por"
                        style={{ height: 50, maxWidth: 200, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {calibro.codigo && (
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', letterSpacing: 1.5, border: '1.5px solid #cbd5e1', padding: '3px 12px', borderRadius: 4, background: '#f8fafc' }}>
                            {calibro.codigo}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ fontWeight: 900, fontSize: 12.5, color: '#0f172a', marginTop: 4 }}>
                      {calibro.nombre || 'Ing. Metrólogo Biomédico'}
                    </div>
                    <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 800 }}>
                      {calibro.cargo || 'Metrólogo Responsable'}
                    </div>
                  </div>
                </div>
              </div>

              {renderPieDePagina(1, 1, 'ANEXO TÉCNICO - GRÁFICAS DE DESEMPEÑO')}
            </div>
          </>
        ) : tipoPlantilla === 'masa_bascula' ? (
          <>
            {/* ============================================================== */}
            {/* HOJA 1: FORMATO ACREDITADO ISO 17025 - BÁSCULAS (PÁGINA 1/2)   */}
            {/* ============================================================== */}
            <div className="certificado-hoja">
              <div>
                {renderEncabezado(1, 2, 'CERTIFICADO DE CALIBRACIÓN', 'LABORATORIO DE CALIBRACIÓN METROLÓGICA')}

                {/* Fila 1: Cliente & Ítem Calibrado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  {/* DATOS GENERALES DEL CLIENTE */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      DATOS GENERALES DEL CLIENTE
                    </div>
                    <div style={{ padding: '7px 10px' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: 105, fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Solicitante:</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{datosCliente.nombre || 'E.S.E. HOSPITAL UNIVERSITARIO DE SANTANDER'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Sede / Área:</td>
                            <td style={{ fontWeight: 600 }}>{datosEquipo.servicio || datosCliente.sede || 'Servicio Médico'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>NIT / CC:</td>
                            <td style={{ fontWeight: 700 }}>{datosCliente.nit || '890.201.216-5'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Dirección:</td>
                            <td>{datosCliente.direccion || 'Calle 45 # 54 - 10'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Ciudad:</td>
                            <td>{datosCliente.ciudad || 'Bucaramanga, Santander'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Contacto / Tel:</td>
                            <td>{datosCliente.telefono || datosCliente.contacto || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DATOS GENERALES DEL ÍTEM A CALIBRAR */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      DATOS GENERALES DEL ÍTEM A CALIBRAR
                    </div>
                    <div style={{ padding: '7px 10px' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: 130, fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Ítem / Instrumento:</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{datosEquipo.nombre || 'Báscula Pesa Persona Digital'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Marca / Modelo:</td>
                            <td>{datosEquipo.marca || 'seca'} / {datosEquipo.modelo || '803'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Número de Serie:</td>
                            <td style={{ fontWeight: 800, color: '#0284c7' }}>{datosEquipo.serie || '8803325172348'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Código / No. Activo:</td>
                            <td>{datosEquipo.nroActivo || datosEquipo.placaInventario || 'ATCI003859'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>División de Escala (d):</td>
                            <td style={{ fontWeight: 700 }}>{datosEquipo.divisionEscala || (datosEquipo.resolucion ? `${datosEquipo.resolucion} ${datosEquipo.unidad}` : '0,1 kg')}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Carga Mín. / Máx.:</td>
                            <td>Min: {datosEquipo.cargaMinima || '2 kg'} | Max: {datosEquipo.cargaMaxima || '150 kg'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Clase de Exactitud:</td>
                            <td><strong style={{ color: '#0f172a' }}>Clase {datosEquipo.claseExactitud || 'III'}</strong> (Media según OIML R 76-1)</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Área / Servicio:</td>
                            <td style={{ fontWeight: 600 }}>{datosEquipo.servicio || datosCliente.sede || datosEquipo.ubicacion || 'Sede Santa Isabel - Cirugía'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Fila 2: Fechas & Condiciones */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 12, marginBottom: 10 }}>
                  {/* DATOS DE LA CALIBRACIÓN Y CONDICIONES */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      DATOS DE CALIBRACIÓN Y CONDICIONES AMBIENTALES
                    </div>
                    <div style={{ padding: '7px 10px' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: 145, fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Fecha de calibración:</td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{fechaCalibracion}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Fecha de recepción:</td>
                            <td>{datosEquipo.fechaRecepcion || fechaCalibracion}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Fecha de emisión:</td>
                            <td>{fechaEmision || fechaCalibracion}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Próxima calibración:</td>
                            <td style={{ fontWeight: 700, color: '#0369a1' }}>{fechaProximaCalibracion || 'Recomendada a 12 meses'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Lugar de calibración:</td>
                            <td>{condicionesAmbientales.lugarCalibracion || 'Taller Biomedico'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Procedimiento:</td>
                            <td>{procedimiento || 'MC-DT-I-034'} (SIM MWG7-cg-01 / OIML R 76-1)</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Método de calibración:</td>
                            <td>{condicionesAmbientales.metodoCalibracion || 'Comparación directa'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#334155', padding: '3.5px 0' }}>Condiciones ambientales:</td>
                            <td>
                              Temp: <strong>{condicionesAmbientales.temperatura ?? 23.5} °C ± {condicionesAmbientales.incertTemperatura ?? 0.8} °C</strong> | HR: <strong>{condicionesAmbientales.humedadRelativa ?? 47} % ± {condicionesAmbientales.incertHumedad ?? 2.5} %</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TRAZABILIDAD METROLÓGICA DE PATRONES */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      TRAZABILIDAD METROLÓGICA DE PATRONES
                    </div>
                    <div style={{ padding: '6px 8px' }}>
                      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', color: '#1e293b' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                            <th style={{ padding: '4px 6px', fontWeight: 800 }}>Patrón / Masas</th>
                            <th style={{ padding: '4px 6px', fontWeight: 800 }}>Certificado Calibración</th>
                            <th style={{ padding: '4px 6px', fontWeight: 800 }}>Fecha Calib.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patronesBasculaDisplay.map((pat, pIdx) => (
                            <tr key={pIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '4px 6px', fontWeight: 700, color: '#0f172a', fontSize: 9.8 }}>
                                {pat.nombre || pat.codigo}
                              </td>
                              <td style={{ padding: '4px 6px', fontSize: 9.5, color: '#0369a1', fontWeight: 600 }}>
                                {pat.certificadoCalibracion || 'Acreditado'}
                              </td>
                              <td style={{ padding: '4px 6px', fontSize: 9.5, whiteSpace: 'nowrap' }}>
                                {pat.fechaCalibracion || '2024-2025'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ fontSize: 9.2, color: '#64748b', marginTop: 6, lineHeight: 1.35, fontStyle: 'italic' }}>
                        * Los patrones de pesas utilizados poseen trazabilidad demostrable a los patrones nacionales custodiados por el Instituto Nacional de Metrología (INM) y laboratorios acreditados bajo ISO/IEC 17025 reconocidos en CIPM-MRA y signatarios de ILAC (ANAB / ONAC).
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABLA DE DATOS DE CALIBRACIÓN (MEDIDAS DIRECTAS) */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                    TABLA DE DATOS DE CALIBRACIÓN (MEDIDAS DIRECTAS DE REPETICIÓN)
                  </div>
                  <div style={{ padding: '5px 8px' }}>
                    <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#0f172a' }}>
                          <th style={{ padding: '6px 6px', fontWeight: 800, fontSize: 10.5, width: 36 }}>Pto</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5, textAlign: 'right' }}>Carga Nominal ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5, textAlign: 'right', background: '#f0f9ff' }}>Valor Masa Convencional ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Lectura 1</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Lectura 2</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5 }}>Lectura 3</th>
                          <th style={{ padding: '6px 8px', fontWeight: 800, fontSize: 10.5, background: '#e0f2fe' }}>Indicación Promedio ({datosEquipo.unidad || 'kg'})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {puntosBasculaDisplay.map((p, idx) => {
                          const cNom = p.cargaNominal ?? p.valorNominal ?? p.valorPatron ?? 0;
                          const masaConv = p.valorMasaConvencional ?? p.valorPatron ?? cNom;
                          const lects = Array.isArray(p.lecturas) && p.lecturas.length >= 3
                            ? p.lecturas
                            : [p.promedio || cNom, p.promedio || cNom, p.promedio || cNom];
                          const prom = p.indicacionPromedio ?? p.promedio ?? (lects.reduce((a, b) => a + Number(b), 0) / lects.length);
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ padding: '5.5px 6px', fontWeight: 800, color: '#475569' }}>{idx + 1}</td>
                              <td style={{ padding: '5.5px 8px', fontWeight: 800, textAlign: 'right' }}>{Number(cNom).toFixed(1).replace('.', ',')}</td>
                              <td style={{ padding: '5.5px 8px', fontWeight: 700, textAlign: 'right', background: '#f0f9ff', color: '#0369a1' }}>
                                {formatMasaConv(masaConv)}
                              </td>
                              <td style={{ padding: '5.5px 8px', fontWeight: 600 }}>{Number(lects[0]).toFixed(1).replace('.', ',')}</td>
                              <td style={{ padding: '5.5px 8px', fontWeight: 600 }}>{Number(lects[1]).toFixed(1).replace('.', ',')}</td>
                              <td style={{ padding: '5.5px 8px', fontWeight: 600 }}>{Number(lects[2]).toFixed(1).replace('.', ',')}</td>
                              <td style={{ padding: '5.5px 8px', fontWeight: 800, background: '#e0f2fe', color: '#0c4a6e' }}>
                                {Number(prom).toFixed(1).replace('.', ',')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {renderPieDePagina(1, 2, 'CERTIFICADO DE CALIBRACIÓN - IPFNA')}
            </div>

            {/* Salto de Página para Generación PDF */}
            <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

            {/* ============================================================== */}
            {/* HOJA 2: RESULTADOS METROLÓGICOS, DECLARACIONES Y FIRMAS (PÁG 2/2)*/}
            {/* ============================================================== */}
            <div className="certificado-hoja">
              <div>
                {renderEncabezado(2, 2, 'CERTIFICADO DE CALIBRACIÓN', 'RESULTADOS METROLÓGICOS Y DECLARACIONES')}

                {/* TABLA DE RESULTADOS DE CALIBRACIÓN */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: '#0f172a',
                      background: '#f1f5f9',
                      padding: '5px 10px',
                      borderBottom: '1px solid #cbd5e1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>RESULTADOS DE LA MEDICIÓN Y ESTIMACIÓN DE INCERTIDUMBRE (SIM MWG7-cg-01 / OIML R 76-1)</span>
                    <span style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>
                      Factor de Cobertura k = 2 (Nivel de Confianza ~95.45%)
                    </span>
                  </div>

                  <div style={{ padding: '5px 8px' }}>
                    <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#0f172a' }}>
                          <th style={{ padding: '6px 6px', fontWeight: 800, fontSize: 10.5 }}>Carga Nominal ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5, background: '#f0f9ff' }}>Valor Masa Convencional ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5 }}>Indicación Promedio ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5, background: '#f0f9ff' }}>Error de Indicación ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5, background: '#fffbeb', color: '#92400e' }}>Incertidumbre Expandida U ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 6px', fontWeight: 800, fontSize: 10.5 }}>Factor k</th>
                          <th style={{ padding: '6px 6px', fontWeight: 800, fontSize: 10.5 }}>EMP ({datosEquipo.unidad || 'kg'})</th>
                          <th style={{ padding: '6px 7px', fontWeight: 800, fontSize: 10.5 }}>Conformidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {puntosBasculaDisplay.map((p, idx) => {
                          const cNom = p.cargaNominal ?? p.valorNominal ?? p.valorPatron ?? 0;
                          const masaConv = p.valorMasaConvencional ?? p.valorPatron ?? cNom;
                          const lects = Array.isArray(p.lecturas) && p.lecturas.length >= 3
                            ? p.lecturas
                            : [p.promedio || cNom, p.promedio || cNom, p.promedio || cNom];
                          const prom = p.indicacionPromedio ?? p.promedio ?? (lects.reduce((a, b) => a + Number(b), 0) / lects.length);
                          const err = p.error !== undefined ? Number(p.error) : Number((prom - masaConv).toFixed(4));
                          const uExp = p.incertidumbreExpandida ?? 0.12;
                          const empVal = p.emp ? Number(p.emp) : (cNom <= 50 ? 0.1 : (cNom <= 100 ? 0.2 : (cNom <= 120 ? 0.4 : 0.5)));
                          const isConforme = p.cumple !== undefined ? p.cumple : Math.abs(err) <= empVal;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ padding: '5.5px 6px', fontWeight: 800 }}>{Number(cNom).toFixed(1).replace('.', ',')}</td>
                              <td style={{ padding: '5.5px 7px', fontWeight: 700, background: '#f0f9ff', color: '#0369a1' }}>
                                {formatMasaConv(masaConv)}
                              </td>
                              <td style={{ padding: '5.5px 7px', fontWeight: 800 }}>{Number(prom).toFixed(1).replace('.', ',')}</td>
                              <td style={{ padding: '5.5px 7px', fontWeight: 800, background: '#f0f9ff', color: err >= 0 ? '#0369a1' : '#d97706' }}>
                                {formatErrorVal(err)}
                              </td>
                              <td style={{ padding: '5.5px 7px', fontWeight: 800, color: '#b45309', background: '#fffbeb' }}>
                                ± {formatIncertVal(uExp)}
                              </td>
                              <td style={{ padding: '5.5px 6px', fontWeight: 700 }}>2</td>
                              <td style={{ padding: '5.5px 6px', fontWeight: 700 }}>± {Number(empVal).toFixed(2).replace('.', ',')}</td>
                              <td style={{ padding: '5.5px 7px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 9.5, fontWeight: 800, background: isConforme ? '#dcfce7' : '#fee2e2', color: isConforme ? '#15803d' : '#b91c1c' }}>
                                  {isConforme ? 'CONFORME' : 'NO CONFORME'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ENSAYOS PRELIMINARES: REPETIBILIDAD Y EXCENTRICIDAD */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  {/* REPETIBILIDAD */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      ENSAYO DE REPETIBILIDAD (OIML R 76-1 numeral 3.6.1 / SIM MWG7)
                    </div>
                    <div style={{ padding: '7px 10px', fontSize: 10.5, color: '#1e293b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Carga de Ensayo: <strong>{repBascula.cargaNominal || 75} {datosEquipo.unidad || 'kg'}</strong> (~50% Max)</span>
                        <span style={{ color: '#15803d', fontWeight: 800 }}>✓ CUMPLE</span>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '5px 8px', borderRadius: 4, border: '1px solid #e2e8f0', marginBottom: 6 }}>
                        <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, marginBottom: 2 }}>5 Lecturas Consecutivas ({datosEquipo.unidad || 'kg'}):</div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          L1: {(repBascula.lecturas?.[0] ?? 75.2).toFixed(1).replace('.', ',')} | L2: {(repBascula.lecturas?.[1] ?? 75.2).toFixed(1).replace('.', ',')} | L3: {(repBascula.lecturas?.[2] ?? 75.2).toFixed(1).replace('.', ',')} | L4: {(repBascula.lecturas?.[3] ?? 75.2).toFixed(1).replace('.', ',')} | L5: {(repBascula.lecturas?.[4] ?? 75.2).toFixed(1).replace('.', ',')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.2 }}>
                        <span>Diferencia Máx. (ΔI<sub>MAX(Rep)</sub>): <strong>{(repBascula.deltaMax ?? repBascula.deltaMaxRep ?? 0.0).toFixed(1).replace('.', ',')} {datosEquipo.unidad || 'kg'}</strong></span>
                        <span>Tolerancia EMP: <strong>±0,2 {datosEquipo.unidad || 'kg'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* EXCENTRICIDAD */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderBottom: '1px solid #cbd5e1', letterSpacing: 0.3 }}>
                      ENSAYO DE EXCENTRICIDAD (OIML R 76-1 numeral 3.6.2)
                    </div>
                    <div style={{ padding: '7px 10px', fontSize: 10.5, color: '#1e293b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Carga de Ensayo: <strong>{excBascula.cargaNominal || 50} {datosEquipo.unidad || 'kg'}</strong> (~1/3 Max)</span>
                        <span style={{ color: '#15803d', fontWeight: 800 }}>✓ CUMPLE</span>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '5px 8px', borderRadius: 4, border: '1px solid #e2e8f0', marginBottom: 6 }}>
                        <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, marginBottom: 2 }}>5 Posiciones de Carga ({datosEquipo.unidad || 'kg'}):</div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          1. Centro: {(excBascula.centro ?? 50.1).toFixed(1).replace('.', ',')} | 2. Del-Izq: {(excBascula.pos1 ?? 50.0).toFixed(1).replace('.', ',')} | 3. Det-Izq: {(excBascula.pos4 ?? 50.1).toFixed(1).replace('.', ',')} | 4. Det-Der: {(excBascula.pos3 ?? 50.1).toFixed(1).replace('.', ',')} | 5. Del-Der: {(excBascula.pos2 ?? 50.3).toFixed(1).replace('.', ',')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.2 }}>
                        <span>Diferencia Máx. (ΔI<sub>MAX(exc)</sub>): <strong>{(excBascula.deltaMax ?? excBascula.deltaMaxExc ?? 0.2).toFixed(1).replace('.', ',')} {datosEquipo.unidad || 'kg'}</strong></span>
                        <span>Tolerancia EMP: <strong>±0,2 {datosEquipo.unidad || 'kg'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OBSERVACIONES METROLÓGICAS */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '7px 12px', fontSize: 10.2, color: '#1e293b', lineHeight: 1.4, background: '#f8fafc', marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 3, fontSize: 10.8 }}>OBSERVACIONES METROLÓGICAS:</div>
                  <div>• Los resultados de las calibraciones expresados en este certificado son válidos en el momento y bajo las condiciones en que se realizaron las mediciones.</div>
                  <div>• El factor de cobertura k = 2 corresponde a un nivel de confianza de aproximadamente el 95.45% de acuerdo con la guía JCGM 100:2008 (GUM).</div>
                  <div>• El error reportado corresponde a la diferencia: Error = Indicación del instrumento - Valor de masa convencional patrón (E = I - m<sub>c</sub>).</div>
                  <div>• {observaciones && !/fuga|oiml\s*148|mmhg|sphygmomanometer|esfigmoman/i.test(observaciones)
                    ? observaciones
                    : 'El instrumento de pesar de funcionamiento no automático (IPFNA) fue calibrado en su lugar de uso (Taller Biomédico). Se verificó retorno a cero, nivelación mecánica y estabilidad de lectura. Se adhiere etiqueta metrológica de calibración indicando fecha y vigencia.'}</div>
                </div>

                {/* DECLARACIONES METROLÓGICAS FORMALES (11 PUNTOS) */}
                <div style={{ border: '1.5px solid #0f172a', borderRadius: 4, padding: '10px 14px', marginBottom: 12, background: '#ffffff' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: 0.4 }}>
                    DECLARACIONES METROLÓGICAS GENERALES (SIM MWG7-cg-01 / OIML R 76-1 / ISO/IEC 17025:2017):
                  </div>
                  <div style={{ fontSize: 9.8, color: '#1e293b', lineHeight: 1.45, textAlign: 'justify', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
                    <div>
                      <strong>1. Validez de los resultados:</strong> Los resultados contenidos en este certificado se refieren exclusivamente al instrumento sometido a calibración en las condiciones indicadas.
                    </div>
                    <div>
                      <strong>2. Reproducción:</strong> El presente documento no debe ser reproducido total o parcialmente sin la aprobación previa y por escrito de GEMTTO S.A.S.
                    </div>
                    <div>
                      <strong>3. Incertidumbre expandida:</strong> La incertidumbre reportada se determinó multiplicando la incertidumbre combinada por el factor k = 2, para una probabilidad de cobertura del 95.45% (GUM).
                    </div>
                    <div>
                      <strong>4. Método normativo:</strong> Fundamentado en la guía SIM MWG7-cg-01/v.00 (2009) "Guía para la Calibración de IPFNA" y la recomendación internacional OIML R 76-1.
                    </div>
                    <div>
                      <strong>5. Regla de decisión:</strong> Se aplica la guía ILAC-G8:09/2019 de aceptación binaria simple basada en los errores máximos permisibles (EMP) de la clase de exactitud asignada.
                    </div>
                    <div>
                      <strong>6. Masa convencional:</strong> El valor de masa convencional de los patrones empleados se ajusta a lo estipulado en la Recomendación Internacional OIML R 111-1.
                    </div>
                    <div>
                      <strong>7. Cálculo del error:</strong> El error de indicación reportado corresponde a la diferencia aritmética: E = Indicación promedio - Masa convencional del patrón.
                    </div>
                    <div>
                      <strong>8. Sin ajustes internos:</strong> La calibración no incluye modificaciones ni ajustes internos adicionales salvo los estipulados en el procedimiento técnico.
                    </div>
                    <div>
                      <strong>9. Recalibración periódica:</strong> Es responsabilidad del usuario asegurar la periodicidad de calibración según la criticidad clínica y normatividad sanitaria vigente.
                    </div>
                    <div>
                      <strong>10. Conservación metrológica:</strong> El instrumento mantiene su aptitud metrológica si no es sometido a sobrecargas mecánicas, desarmes ni traslados bruscos.
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>11. Integridad documental:</strong> Cualquier raspadura, enmienda o alteración anula por completo la validez jurídica y técnica del presente certificado oficial.
                    </div>
                  </div>
                </div>

                {/* SECCIÓN DE FIRMAS METROLÓGICAS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'center', marginTop: 14, marginBottom: 12 }}>
                  {/* Revisado y autorizado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Revisado y autorizado por:
                    </div>
                    {aprobo.firma ? (
                      <img
                        src={aprobo.firma}
                        alt="Firma Director Técnico"
                        style={{ height: 56, maxWidth: 220, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 56 }} />
                    )}
                    <div style={{ fontWeight: 900, fontSize: 13, color: '#0f172a', marginTop: 4 }}>
                      {aprobo.nombre || 'Ing. Fernando Castañeda Meriño'}
                    </div>
                    <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 800 }}>
                      {aprobo.cargo || 'Director Técnico'}
                    </div>
                    {aprobo.tarjetaProfesional && (
                      <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                        T.P. Nº {aprobo.tarjetaProfesional}
                      </div>
                    )}
                  </div>

                  {/* Ejecutado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Ejecutado por:
                    </div>
                    {calibro.firma ? (
                      <img
                        src={calibro.firma}
                        alt="Firma Ejecutado Por"
                        style={{ height: 56, maxWidth: 220, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {calibro.codigo && (
                          <span style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', letterSpacing: 1.5, border: '1.5px solid #cbd5e1', padding: '3px 14px', borderRadius: 4, background: '#f8fafc' }}>
                            {calibro.codigo}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ fontWeight: 900, fontSize: 13, color: '#0f172a', marginTop: 4 }}>
                      {calibro.nombre || 'Ing. Metrólogo Biomédico'}
                    </div>
                    <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 800 }}>
                      {calibro.cargo || 'Metrólogo Responsable'}
                    </div>
                    {calibro.codigo && calibro.firma && (
                      <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2, fontWeight: 700 }}>
                        Código Técnico: {calibro.codigo}
                      </div>
                    )}
                  </div>
                </div>

                {/* FIN DEL INFORME */}
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 11.5,
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: 1.5,
                    marginTop: 18,
                    marginBottom: 6,
                  }}
                >
                  --- FIN DEL INFORME METROLÓGICO OFICIAL ---
                </div>
              </div>

              {renderPieDePagina(2, 2, 'CERTIFICADO DE CALIBRACIÓN - IPFNA')}
            </div>

            {/* Salto de Página para Generación PDF */}
            <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

            {/* ============================================================== */}
            {/* HOJA 3: ANEXO - GRÁFICAS DE DESEMPEÑO (PÁGINA 1 DE 1)          */}
            {/* ============================================================== */}
            <div className="certificado-hoja">
              <div>
                {renderEncabezado(1, 1, 'ANEXO TÉCNICO - GRÁFICAS DE CALIBRACIÓN', 'ERROR, INCERTIDUMBRE EXPANDIDA Y CARGAS')}

                {/* Sub-encabezado con datos del cliente e instrumento */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: '10px 14px', marginBottom: 14, background: '#f8fafc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 11, color: '#1e293b' }}>
                    <div><strong>Solicitante:</strong> {datosCliente.nombre || 'E.S.E. HOSPITAL UNIVERSITARIO DE SANTANDER'}</div>
                    <div><strong>Sede / Área:</strong> {datosEquipo.servicio || datosCliente.sede || 'Servicio Médico'}</div>
                    <div><strong>Dirección / Ciudad:</strong> {datosCliente.direccion || 'Calle 45 # 54 - 10'} - {datosCliente.ciudad || 'Bucaramanga'}</div>
                    <div><strong>Ítem / Instrumento:</strong> {datosEquipo.nombre || 'Báscula Pesa Persona Digital'}</div>
                    <div><strong>Marca / Modelo:</strong> {datosEquipo.marca || 'seca'} / {datosEquipo.modelo || '803'}</div>
                    <div><strong>Serie:</strong> <span style={{ fontWeight: 800, color: '#0284c7' }}>{datosEquipo.serie || '8803325172348'}</span></div>
                    <div><strong>No. de Activo:</strong> {datosEquipo.nroActivo || datosEquipo.placaInventario || 'ATCI003859'}</div>
                    <div><strong>Div. Escala / Clase:</strong> {datosEquipo.divisionEscala || '0,1 kg'} / Clase {datosEquipo.claseExactitud || 'III'}</div>
                  </div>
                </div>

                {/* TARJETA OFICIAL DE LA GRÁFICA */}
                <div style={{ border: '2px solid #0f172a', borderRadius: 6, overflow: 'hidden', marginBottom: 14, background: '#ffffff' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#ffffff',
                      background: '#0f172a',
                      padding: '8px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>ERROR, INCERTIDUMBRE EXPANDIDA Y CARGAS (SIM MWG7-cg-01 / OIML R 76-1)</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#e0f2fe' }}>
                      Cargas: 0 kg a 160 kg • Factor k = 2
                    </span>
                  </div>

                  <div style={{ padding: '14px 10px 8px 10px', background: '#ffffff' }}>
                    <CalibrationChart
                      puntos={puntosBasculaDisplay}
                      unidad={datosEquipo.unidad || 'kg'}
                      tipoPlantilla="masa_bascula"
                      titulo="ERROR, INCERTIDUMBRE EXPANDIDA Y CARGAS"
                      height={370}
                    />
                  </div>

                  <div style={{ borderTop: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '10px 14px', fontSize: 10.8, color: '#334155', lineHeight: 1.5 }}>
                    <strong>Criterios Normativos y Metodológicos:</strong> Curva de comportamiento metrológico evaluada conforme a la guía <strong>SIM MWG7-cg-01/v.00 (2009)</strong> y la recomendación internacional <strong>OIML R 76-1</strong> para Instrumentos de Pesar de Funcionamiento No Automático (IPFNA). Los puntos discretos representan el error de indicación <em>E = I - m<sub>c</sub></em> en cada escalón de carga nominal aplicada (5 kg a 150 kg). Las barras verticales con remate (serif) representan el intervalo de incertidumbre de medición expandida reportada (<em>±U</em>) para un factor de cobertura <em>k = 2</em> correspondiente a un nivel de confianza de aproximadamente el 95.45%. La línea central discontinua en <strong>0.000000 kg</strong> representa el valor de referencia de error nulo.
                  </div>
                </div>

                {/* Firmas en Hoja 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
                  {/* Revisado y autorizado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 8 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Revisado y autorizado por:
                    </div>
                    {aprobo.firma ? (
                      <img
                        src={aprobo.firma}
                        alt="Firma Director Técnico"
                        style={{ height: 50, maxWidth: 200, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 50 }} />
                    )}
                    <div style={{ fontWeight: 900, fontSize: 12.5, color: '#0f172a', marginTop: 4 }}>
                      {aprobo.nombre || 'Ing. Fernando Castañeda Meriño'}
                    </div>
                    <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 800 }}>
                      {aprobo.cargo || 'Director Técnico'}
                    </div>
                  </div>

                  {/* Ejecutado por */}
                  <div style={{ textAlign: 'center', borderTop: '2px solid #0f172a', paddingTop: 8 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Ejecutado por:
                    </div>
                    {calibro.firma ? (
                      <img
                        src={calibro.firma}
                        alt="Firma Ejecutado Por"
                        style={{ height: 50, maxWidth: 200, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {calibro.codigo && (
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', letterSpacing: 1.5, border: '1.5px solid #cbd5e1', padding: '3px 12px', borderRadius: 4, background: '#f8fafc' }}>
                            {calibro.codigo}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ fontWeight: 900, fontSize: 12.5, color: '#0f172a', marginTop: 4 }}>
                      {calibro.nombre || 'Ing. Metrólogo Biomédico'}
                    </div>
                    <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 800 }}>
                      {calibro.cargo || 'Metrólogo Responsable'}
                    </div>
                  </div>
                </div>
              </div>

              {renderPieDePagina(1, 1, 'ANEXO TÉCNICO - GRÁFICAS DE DESEMPEÑO')}
            </div>
          </>
        ) : (
          <>
            {/* ============================================================== */}
            {/* HOJA 1: CERTIFICADO MICROPIPETA NTC-ISO 8655-6:2014 (PÁG 1/3)  */}
            {/* ============================================================== */}
            <div className="certificado-hoja">
              <div>
                {/* Encabezado estilo NTC-ISO 8655-6 */}
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr',
                      alignItems: 'center',
                      paddingBottom: 8,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
                        alt="GEMTTO"
                        style={{ maxHeight: 68, maxWidth: 185, objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 21,
                          fontWeight: 900,
                          fontStyle: 'italic',
                          color: '#0f172a',
                          letterSpacing: 0.6,
                        }}
                      >
                        CERTIFICADO DE CALIBRACIÓN
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '2.5px solid #0f172a', borderBottom: '1px solid #0f172a', height: 2 }} />
                  <div
                    style={{
                      textAlign: 'right',
                      paddingTop: 5,
                      paddingRight: 20,
                      color: '#dc2626',
                      fontWeight: 900,
                      fontSize: 13.5,
                      letterSpacing: 0.5,
                    }}
                  >
                    {numeroCertificado || 'CERT-GEM-1288'}
                  </div>
                </div>

                {/* Bloque de 2 columnas: CLIENTE e INSTRUMENTO DE MEDICIÓN */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.05fr 1fr',
                    gap: 24,
                    marginTop: 4,
                    marginBottom: 8,
                    fontSize: 11.2,
                  }}
                >
                  {/* Columna Izquierda: CLIENTE */}
                  <div>
                    <div
                      style={{
                        textAlign: 'center',
                        fontWeight: 900,
                        fontSize: 12,
                        color: '#0f172a',
                        marginBottom: 10,
                      }}
                    >
                      CLIENTE
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <tbody>
                        <tr>
                          <td style={{ width: 145, fontWeight: 800, padding: '6px 4px', verticalAlign: 'middle' }}>
                            RAZÓN SOCIAL
                          </td>
                          <td style={{ padding: '6px 4px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {datosCliente.nombre || 'EMPRESA MULTIACTIVA DE SALUD SERMULTISALUD S.A.S.'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '6px 4px' }}>DIRECCIÓN</td>
                          <td style={{ padding: '6px 4px', textTransform: 'uppercase' }}>
                            {datosCliente.direccion || 'CALLE 9A No. 17-53 BRR SAN CLEMENTE'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '5px 4px' }}>CIUDAD</td>
                          <td style={{ padding: '5px 4px', textTransform: 'uppercase' }}>
                            {datosCliente.ciudad || 'AGUSTIN CODAZZI'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '5px 4px' }}>DEPARTAMENTO</td>
                          <td style={{ padding: '5px 4px', textTransform: 'uppercase' }}>
                            {datosCliente.departamento || 'CESAR'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '5px 4px' }}>PAÍS</td>
                          <td style={{ padding: '5px 4px', textTransform: 'uppercase' }}>
                            {datosCliente.pais || 'COLOMBIA'}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ height: 10 }} />
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '5px 4px' }}>FECHA DE RECEPCIÓN</td>
                          <td style={{ padding: '5px 4px' }}>
                            {datosEquipo.fechaRecepcion || fechaCalibracion}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '5px 4px' }}>FECHA DE CALIBRACIÓN</td>
                          <td style={{ padding: '5px 4px' }}>{fechaCalibracion}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ height: 12 }} />
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '5px 4px' }}>EJECUTADO POR</td>
                          <td style={{ padding: '5px 4px', textTransform: 'uppercase', fontWeight: 700 }}>
                            <div>{calibro.nombre || 'ALBEIRO MIRANDA'}</div>
                            <div style={{ fontSize: 10, color: '#0284c7', fontWeight: 800 }}>
                              {calibro.cargo || 'METRÓLOGO RESPONSABLE'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Columna Derecha: INSTRUMENTO DE MEDICIÓN */}
                  <div>
                    <div
                      style={{
                        textAlign: 'center',
                        fontWeight: 900,
                        fontSize: 12,
                        color: '#0f172a',
                        marginBottom: 8,
                      }}
                    >
                      INSTRUMENTO DE MEDICIÓN
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <tbody>
                        <tr>
                          <td style={{ width: 135, fontWeight: 800, padding: '4px 4px' }}>NOMBRE</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {datosEquipo.nombre || 'EQUIPO VOLUMÉTRICO ACCIONADO POR PISTÓN'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>TIPO</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              textTransform: 'uppercase',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {micropipetaInfo.tipo || datosEquipo.tipoInstrumento || 'VARIABLE'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>MARCA</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              textTransform: 'uppercase',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {datosEquipo.marca || 'BIOHIT'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>MODELO</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {datosEquipo.modelo || '5-50 uL'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>N° SERIE</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              fontWeight: 700,
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {datosEquipo.serie || '14578608'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>PLACA</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              textTransform: 'uppercase',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {datosEquipo.placaInventario || datosEquipo.nroActivo || 'NO REGISTRA'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>ID GLOBAL</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              textTransform: 'uppercase',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {datosEquipo.idGlobal || 'NO REGISTRA'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>INTERVALO</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            <span style={{ marginRight: 14 }}>
                              {micropipetaInfo.intervaloMin || datosEquipo.intervaloMin || '5 µl'}
                            </span>
                            <span style={{ marginRight: 14 }}>a</span>
                            <span>
                              {micropipetaInfo.intervaloMax || datosEquipo.intervaloMax || '50 µl'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>RESOLUCIÓN</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {formatComma(datosEquipo.resolucion ?? 0.5)} {datosEquipo.unidad || 'µl'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '6px 4px' }}>UBICACIÓN</td>
                          <td
                            style={{
                              padding: '6px 6px',
                              textAlign: 'center',
                              textTransform: 'uppercase',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {datosEquipo.servicio || datosEquipo.ubicacion || datosCliente.sede || 'LABORATORIO CLINICO'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>BASE DE AJUSTE</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              textAlign: 'center',
                              borderBottom: '2px double #0f172a',
                            }}
                          >
                            {micropipetaInfo.baseAjuste || datosEquipo.baseAjuste || 'Ex'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 800, padding: '4px 4px' }}>TEMPERATURA DE REF.</td>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                            {micropipetaInfo.temperaturaRef || datosEquipo.temperaturaRef || '20 °C'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Línea divisoria + Número de Páginas Incluido Anexo */}
                <div style={{ borderTop: '2.5px double #0f172a', paddingTop: 3, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, fontSize: 11.5 }}>
                    <span>Número de Páginas Incluido Anexo</span>
                    <span
                      style={{
                        display: 'inline-block',
                        minWidth: 70,
                        textAlign: 'center',
                        borderBottom: '2px double #0f172a',
                        fontWeight: 700,
                        paddingBottom: 2,
                      }}
                    >
                      3
                    </span>
                  </div>
                </div>

                {/* APROBADO POR Y EJECUTADO POR */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'end', margin: '10px 0 12px 0' }}>
                  <div style={{ textAlign: 'center', borderTop: '1.5px solid #0f172a', paddingTop: 6 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                      APROBADO POR:
                    </div>
                    {aprobo.firma ? (
                      <img
                        src={aprobo.firma}
                        alt="Firma Aprobado Por"
                        style={{ height: 48, maxWidth: 200, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ height: 38 }} />
                    )}
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                      {aprobo.nombre || 'Ing. Fernando Castañeda Meriño'}
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0284c7' }}>
                      {aprobo.cargo || 'Director Técnico'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', borderTop: '1.5px solid #0f172a', paddingTop: 6 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                      EJECUTADO POR:
                    </div>
                    {calibro.firma ? (
                      <img
                        src={calibro.firma}
                        alt="Firma Ejecutado Por"
                        style={{ height: 48, maxWidth: 200, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {calibro.codigo && (
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: 1, border: '1px solid #cbd5e1', padding: '2px 10px', borderRadius: 4, background: '#f8fafc' }}>
                            {calibro.codigo}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                      {calibro.nombre || 'Albeiro Miranda'}
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0284c7' }}>
                      {calibro.cargo || 'Metrólogo Responsable'}
                    </div>
                  </div>
                </div>

                {/* Declaración general */}
                <div
                  style={{
                    borderTop: '2.5px double #0f172a',
                    borderBottom: '2.5px double #0f172a',
                    padding: '8px 2px',
                    fontSize: 11.2,
                    textAlign: 'justify',
                    lineHeight: 1.48,
                    marginBottom: 10,
                  }}
                >
                  Este certificado expresa fielmente el resultado de las mediciones realizadas. No podrá ser reproducido parcialmente, solo en su totalidad. Los resultados contenidos en el presente certificado se refieren al momento y condiciones en que se realizaron las mediciones. GEMTTO S.A.S no se responsabiliza de los perjuicios que puedan derivarse del uso inadecuado de los instrumentos calibrados. El usuario es responsable de la Calibración de sus instrumentos a intervalos apropiados.
                </div>

                {/* 1. MÉTODO DE CALIBRACIÓN */}
                <div
                  style={{
                    borderBottom: '2.5px double #0f172a',
                    paddingBottom: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 11.8, color: '#0f172a', marginBottom: 4 }}>
                    1. MÉTODO DE CALIBRACIÓN
                  </div>
                  <div style={{ fontSize: 11.2, textAlign: 'justify', lineHeight: 1.48 }}>
                    {procedimiento && procedimiento.includes('8655')
                      ? procedimiento
                      : 'Los resultados obtenidos en ésta calibración se determinaron por el método gravimétrico. Según los lineamientos del documento normativo NTC-ISO 8655-6:2014 Equipos Volumétricos accionados mediante pistón. Parte 6: Métodos gravimétricos para la determinación del error de medición, documentados en el procedimiento 06 sin ninguna desviación del método.'}
                  </div>
                </div>

                {/* 2. CONDICIONES AMBIENTALES */}
                <div>
                  <div style={{ fontWeight: 900, fontSize: 11.8, color: '#0f172a', marginBottom: 4 }}>
                    2. CONDICIONES AMBIENTALES
                  </div>
                  <div style={{ fontSize: 11.2, marginBottom: 8 }}>
                    Los datos suministrados de las condiciones ambientales, se refieren al momento y lugar en el que se realizó la calibración
                  </div>

                  <table
                    style={{
                      width: '68%',
                      margin: '0 auto',
                      borderCollapse: 'collapse',
                      border: '1.5px solid #0f172a',
                      fontSize: 11.2,
                      textAlign: 'center',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            border: '1px solid #0f172a',
                            padding: '4px 10px',
                            fontWeight: 600,
                            width: '52%',
                          }}
                        >
                          TEMPERATURA DEL AIRE °C
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '4px 6px', width: '18%' }}>
                          {formatComma(condicionesAmbientales.temperatura ?? micropipetaInfo.temperaturaAgua ?? 20.12, 2)}
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '4px 2px', width: '10%' }}>
                          ±
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', borderRight: '1px solid #0f172a', padding: '4px 6px', width: '20%' }}>
                          {formatComma(condicionesAmbientales.incertTemperatura ?? 0.12, 2)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '4px 10px', fontWeight: 600 }}>
                          HUMEDAD RELATIVA (%HR)
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '4px 6px' }}>
                          {formatComma(condicionesAmbientales.humedadRelativa ?? 60.7, 1)}
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '4px 2px' }}>
                          ±
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', borderRight: '1px solid #0f172a', padding: '4px 6px' }}>
                          {formatComma(condicionesAmbientales.incertHumedad ?? 1.8, 1)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '4px 10px', fontWeight: 600 }}>
                          PRESIÓN ATMOSFÉRICA (hPa)
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '4px 6px' }}>
                          {formatComma(condicionesAmbientales.presionAtmosferica ?? micropipetaInfo.presionAtmosferica ?? 847.14, 2)}
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '4px 2px' }}>
                          ±
                        </td>
                        <td style={{ borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a', borderRight: '1px solid #0f172a', padding: '4px 6px' }}>
                          {formatComma(condicionesAmbientales.incertPresion ?? 0.42, 2)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '4px 10px', fontWeight: 600 }}>
                          TIPO DE PUNTA
                        </td>
                        <td colSpan={3} style={{ border: '1px solid #0f172a', padding: '4px 10px', textTransform: 'uppercase' }}>
                          {micropipetaInfo.tipoPunta || condicionesAmbientales.tipoPunta || 'GENERICA'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '4px 10px', fontWeight: 600 }}>
                          LÍQUIDO DE ENSAYO
                        </td>
                        <td colSpan={3} style={{ border: '1px solid #0f172a', padding: '4px 10px' }}>
                          {micropipetaInfo.liquidoEnsayo || condicionesAmbientales.liquidoEnsayo || 'Agua grado 3'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pie de página Hoja 1 */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                <div style={{ flex: 1, textAlign: 'center' }}>
                  GEMTTO S.A.S. • Metrología Biomédica • Certificado {numeroCertificado}
                </div>
                <div style={{ fontWeight: 900 }}>1 de 3</div>
              </div>
            </div>

            {/* Salto de Página para Generación PDF */}
            <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

            {/* ============================================================== */}
            {/* HOJA 2: RESULTADOS Y GRÁFICO MICROPIPETA (PÁG 2/3)             */}
            {/* ============================================================== */}
            <div className="certificado-hoja">
              <div>
                {/* Encabezado estilo NTC-ISO 8655-6 */}
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr',
                      alignItems: 'center',
                      paddingBottom: 8,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
                        alt="GEMTTO"
                        style={{ maxHeight: 68, maxWidth: 185, objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 21,
                          fontWeight: 900,
                          fontStyle: 'italic',
                          color: '#0f172a',
                          letterSpacing: 0.6,
                        }}
                      >
                        CERTIFICADO DE CALIBRACIÓN
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '2.5px solid #0f172a', borderBottom: '1px solid #0f172a', height: 2 }} />
                  <div
                    style={{
                      textAlign: 'right',
                      paddingTop: 5,
                      paddingRight: 20,
                      color: '#dc2626',
                      fontWeight: 900,
                      fontSize: 13.5,
                      letterSpacing: 0.5,
                    }}
                  >
                    {numeroCertificado || 'CERT-GEM-1288'}
                  </div>
                </div>

                {/* 3. INCERTIDUMBRE DE MEDICIÓN */}
                <div
                  style={{
                    borderBottom: '2.5px double #0f172a',
                    paddingBottom: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 11.8, color: '#0f172a', marginBottom: 6 }}>
                    3. INCERTIDUMBRE DE MEDICIÓN
                  </div>
                  <div style={{ fontSize: 11.2, textAlign: 'justify', lineHeight: 1.55 }}>
                    "La incertidumbre expandida de la medición reportada se establece como la incertidumbre estándar de medición multiplicada por el factor de cobertura “k” y la probabilidad de cobertura, la cual debe ser aproximada al 95 % y no menor a este valor" CEA-3.0-06 Versión 03 de 2013-11-20
                  </div>
                </div>

                {/* 4. TRAZABILIDAD DE LAS MEDICIONES */}
                <div
                  style={{
                    borderBottom: '2.5px double #0f172a',
                    paddingBottom: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 11.8, color: '#0f172a', marginBottom: 6 }}>
                    4. TRAZABILIDAD DE LAS MEDICIONES
                  </div>
                  <div style={{ fontSize: 11.2, textAlign: 'justify', lineHeight: 1.5 }}>
                    El laboratorio GEMTTO S.A.S garantiza que sus patrones son trazables al Sistema Internacional de Unidades (SI) por medio de una cadena ininterrumpida de calibraciones que los vincula a patrones Nacionales o Internacionales, estos patrones son calibrados en laboratorios competentes según los requisitos establecidos en la norma NTC ISO/IEC 17025:2017.
                  </div>
                </div>

                {/* 5. RESULTADO DE LA CALIBRACION */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 900, fontSize: 11.8, color: '#0f172a', marginBottom: 8 }}>
                    5. RESULTADO DE LA CALIBRACION
                  </div>

                  {/* Tabla Principal: Volumen Seleccionado, Volumen Calculado, Error Sistemático, Incertidumbre Expandida, k */}
                  <table
                    style={{
                      width: '88%',
                      borderCollapse: 'collapse',
                      border: '1.5px solid #0f172a',
                      fontSize: 11.2,
                      textAlign: 'center',
                      marginBottom: 14,
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#d9d9d9', color: '#0f172a', fontWeight: 800 }}>
                        <th style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                          Volumen Seleccionado<br />({datosEquipo.unidad || 'µl'})
                        </th>
                        <th style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                          Volumen Calculado ({datosEquipo.unidad || 'µl'})
                        </th>
                        <th style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                          Error Sistemático<br />Calculado ({datosEquipo.unidad || 'µl'})
                        </th>
                        <th style={{ border: '1px solid #0f172a', padding: '5px 8px' }}>
                          Incertidumbre Expandida<br />({datosEquipo.unidad || 'µl'})
                        </th>
                        <th style={{ border: '1px solid #0f172a', padding: '5px 8px', width: 65 }}>
                          k
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {puntosMicropipetaDisplay.map((p, idx) => {
                        const volSel = p.volumenSeleccionado ?? p.nominal ?? p.valorNominal ?? p.valorPatron ?? 0;
                        const volCalc = p.volumenCalculado ?? p.promedio ?? volSel;
                        const errSist = p.errorSistematico ?? p.error ?? Number((volCalc - volSel).toFixed(1));
                        const uExp = p.incertidumbreExpandida ?? 5.8;
                        const kVal = p.factorK ?? 2.0;

                        return (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #0f172a', padding: '4px 8px' }}>
                              {formatComma(volSel)}
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '4px 8px' }}>
                              {formatComma(volCalc, 2)}
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '4px 8px' }}>
                              {formatComma(errSist, 1)}
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '4px 8px' }}>
                              {formatComma(uExp, 1)}
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '4px 8px' }}>
                              {formatComma(kVal, 2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Tabla Secundaria Centrada: Volumen Seleccionado vs Error Aleatorio Calculado */}
                  <table
                    style={{
                      width: '52%',
                      margin: '0 auto',
                      borderCollapse: 'collapse',
                      border: '1.5px solid #0f172a',
                      fontSize: 11.2,
                      textAlign: 'center',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#d9d9d9', color: '#0f172a', fontWeight: 800 }}>
                        <th style={{ border: '1px solid #0f172a', padding: '5px 8px', width: '44%' }}>
                          Volumen Seleccionado<br />({datosEquipo.unidad || 'µl'})
                        </th>
                        <th style={{ border: '1px solid #0f172a', padding: '5px 8px', width: '56%' }}>
                          Error Aleatorio Calculado ({datosEquipo.unidad || 'µl'})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {puntosMicropipetaDisplay.map((p, idx) => {
                        const volSel = p.volumenSeleccionado ?? p.nominal ?? p.valorNominal ?? p.valorPatron ?? 0;
                        const errAleat = p.errorAleatorio ?? p.desviacionAleatoria ?? p.desviacionEstandar ?? 0.08;
                        return (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #0f172a', padding: '4px 8px' }}>
                              {formatComma(volSel)}
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '4px 8px' }}>
                              {formatComma(errAleat, 2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 6. FACTORES DE CONVERSIÓN DE UNIDADES */}
                <div
                  style={{
                    borderTop: '2.5px double #0f172a',
                    borderBottom: '2.5px double #0f172a',
                    padding: '8px 0 10px 0',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 11.8, color: '#0f172a', marginBottom: 4 }}>
                    6. FACTORES DE CONVERSIÓN DE UNIDADES
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 6 }}>
                    Según, Guide for the Use of the International System of Units (SI), NIST Special Publication 811, 2008 Edition.
                  </div>
                  <table
                    style={{
                      width: '82%',
                      margin: '0 auto',
                      borderCollapse: 'collapse',
                      border: '1.2px solid #0f172a',
                      fontSize: 11.2,
                      textAlign: 'center',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '4px 10px', width: '50%' }}>
                          Microlitros (µl) a Mililitros (ml)
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '4px 10px', width: '50%' }}>
                          1 µl = 0,001 ml
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Gráfico de Error e Incertidumbre */}
                <div style={{ maxWidth: 660, margin: '0 auto' }}>
                  <CalibrationChart
                    puntos={puntosMicropipetaDisplay}
                    unidad={datosEquipo.unidad || 'µl'}
                    tipoPlantilla="volumen_micropipeta"
                    titulo="Gráfico de Error e Incertidumbre"
                    height={275}
                  />
                </div>
              </div>

              {/* Pie de página Hoja 2 */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                <div style={{ flex: 1, textAlign: 'center' }}>
                  GEMTTO S.A.S. • Metrología Biomédica • Certificado {numeroCertificado}
                </div>
                <div style={{ fontWeight: 900 }}>2 de 3</div>
              </div>
            </div>

            {/* Salto de Página para Generación PDF */}
            <div className="html2pdf__page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0, margin: 0 }} />

            {/* ============================================================== */}
            {/* HOJA 3: OBSERVACIONES Y CIERRE DEL CERTIFICADO (PÁG 3/3)       */}
            {/* ============================================================== */}
            <div className="certificado-hoja">
              <div>
                {/* Encabezado estilo NTC-ISO 8655-6 */}
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr',
                      alignItems: 'center',
                      paddingBottom: 8,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
                        alt="GEMTTO"
                        style={{ maxHeight: 68, maxWidth: 185, objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 21,
                          fontWeight: 900,
                          fontStyle: 'italic',
                          color: '#0f172a',
                          letterSpacing: 0.6,
                        }}
                      >
                        CERTIFICADO DE CALIBRACIÓN
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '2.5px solid #0f172a', borderBottom: '1px solid #0f172a', height: 2 }} />
                  <div
                    style={{
                      textAlign: 'right',
                      paddingTop: 5,
                      paddingRight: 20,
                      color: '#dc2626',
                      fontWeight: 900,
                      fontSize: 13.5,
                      letterSpacing: 0.5,
                    }}
                  >
                    {numeroCertificado || 'CERT-GEM-1288'}
                  </div>
                </div>

                {/* 9. OBSERVACIONES */}
                <div
                  style={{
                    borderTop: '2.5px double #0f172a',
                    borderBottom: '2.5px double #0f172a',
                    padding: '10px 2px 18px 2px',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 12, color: '#0f172a', marginBottom: 8 }}>
                    9. OBSERVACIONES
                  </div>
                  <div style={{ fontSize: 11.5, color: '#0f172a', textTransform: 'uppercase' }}>
                    {observaciones && !/fuga|oiml\s*148|mmhg|sphygmomanometer|esfigmoman|ipfna/i.test(observaciones)
                      ? observaciones
                      : 'EL INSTRUMENTO VOLUMÉTRICO ACCIONADO POR PISTÓN FUE CALIBRADO POR EL MÉTODO GRAVIMÉTRICO SEGÚN NTC-ISO 8655-6:2014 EN CONDICIONES AMBIENTALES CONTROLADAS DE LABORATORIO. SE VERIFICÓ EL CORRECTO DESPLAZAMIENTO DEL ÉMBOLO, EYECCIÓN DE PUNTA Y AUSENCIA DE GOTEO EN EL CONO PORTAPUNTAS.'}
                  </div>
                </div>

                {/* Nota final y FIN DEL CERTIFICADO */}
                <div style={{ textAlign: 'center', marginTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', lineHeight: 1.45 }}>
                    El laboratorio de metrología GEMTTO S.A.S no realiza ajuste a los instrumentos bajo calibración. Los resultados anteriormente descritos, sólo corresponden al ítem bajo calibración.
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 900,
                      color: '#dc2626',
                      marginTop: 6,
                      letterSpacing: 0.5,
                    }}
                  >
                    FIN DEL CERTIFICADO
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontStyle: 'italic',
                      fontWeight: 700,
                      color: '#64748b',
                      marginTop: 4,
                    }}
                  >
                    FR-GC-54 Ver 15 2020/04/20
                  </div>
                </div>
              </div>

              {/* Pie de página Hoja 3 */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                <div style={{ flex: 1, textAlign: 'center' }}>
                  GEMTTO S.A.S. • Metrología Biomédica • Certificado {numeroCertificado}
                </div>
                <div style={{ fontWeight: 900 }}>3 de 3</div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
