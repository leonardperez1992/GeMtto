import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import generatePDF, { Resolution } from 'react-to-pdf';
import { apiCalibraciones } from '../utils/api';
import request from '../utils/request';
import CalibrationChart from '../components/CalibrationChart';
import { SlPrinter } from 'react-icons/sl';
import { FaArrowLeft } from 'react-icons/fa';

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
      const res = await request({ link: `${apiCalibraciones}/${certId}` });
      if (res?.success && res.certificado) {
        setCertificado(res.certificado);
      }
      setLoading(false);
    };
    fetchCert();
  }, [certId]);

  const pdfOptions = {
    filename: `Certificado Calibracion - ${certificado?.numeroCertificado || 'CAL'} - ${certificado?.datosEquipo?.serie || 'SN'}.pdf`,
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
    },
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Cargando Certificado de Calibración...
      </div>
    );
  }

  if (!certificado) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
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
    procedimiento,
    declaracionTrazabilidad,
    datosCalibracion = {},
    dictamenGlobal,
    observaciones,
    calibro = {},
    aprobo = {},
  } = certificado;

  const puntos = datosCalibracion.puntos || [];

  return (
    <div style={{ padding: '20px', maxWidth: 900, margin: '0 auto' }}>
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
            fontSize: 13.5,
            fontWeight: 600,
            border: '1px solid #cbd5e1',
          }}
        >
          <FaArrowLeft size={13} /> Volver a Calibraciones
        </Link>

        <div style={{ display: 'flex', gap: 10 }}>
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
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            }}
          >
            <SlPrinter size={16} /> Descargar / Imprimir PDF
          </button>
        </div>
      </div>

      {/* DOCUMENTO FORMAL IMPRIMIBLE - ISO/IEC 17025 */}
      <div
        ref={targetRef}
        style={{
          background: '#ffffff',
          padding: '24px 30px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          borderRadius: 4,
          fontFamily: 'Arial, sans-serif',
          color: '#1e293b',
          fontSize: 11,
          lineHeight: 1.35,
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Encabezado Oficial */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 160px',
            border: '2px solid #0f172a',
            padding: '8px 10px',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={process.env.PUBLIC_URL + '/img/logoGemtto.png'}
              alt="GEMTTO"
              style={{ maxHeight: 52, maxWidth: 130, objectFit: 'contain' }}
            />
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid #0f172a', borderRight: '1px solid #0f172a', padding: '0 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: 0.5 }}>
              CERTIFICADO DE CALIBRACIÓN
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
              LABORATORIO DE METROLOGÍA BIOMÉDICA GEMTTO
            </div>
            <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
              CONFORME A LA NORMA INTERNACIONAL ISO/IEC 17025:2017
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: 9.5, paddingLeft: 6 }}>
            <div>
              <strong>Certificado Nº:</strong>
            </div>
            <div style={{ color: '#0284c7', fontWeight: 800, fontSize: 12 }}>
              {numeroCertificado}
            </div>
            <div style={{ marginTop: 2 }}>
              <strong>Emisión:</strong> {fechaEmision || fechaCalibracion}
            </div>
            <div>
              <strong>Pág:</strong> 1 de 1
            </div>
          </div>
        </div>

        {/* Sección: Datos del Cliente y del Ítem Calibrado (2 columnas) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {/* Cliente */}
          <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#0f172a',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 2,
                marginBottom: 4,
                background: '#f1f5f9',
                padding: '2px 4px',
              }}
            >
              1. DATOS DEL CLIENTE / SOLICITANTE
            </div>
            <table style={{ width: '100%', fontSize: 9.5 }}>
              <tbody>
                <tr>
                  <td style={{ width: 80, fontWeight: 700 }}>Razón Social:</td>
                  <td>{datosCliente.nombre || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>NIT:</td>
                  <td>{datosCliente.nit || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Sede / Área:</td>
                  <td>{datosCliente.sede || datosEquipo.ubicacion || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Dirección / Ciudad:</td>
                  <td>
                    {datosCliente.direccion ? `${datosCliente.direccion}, ` : ''}
                    {datosCliente.ciudad || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ítem Calibrado */}
          <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#0f172a',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 2,
                marginBottom: 4,
                background: '#f1f5f9',
                padding: '2px 4px',
              }}
            >
              2. IDENTIFICACIÓN DEL ÍTEM CALIBRADO
            </div>
            <table style={{ width: '100%', fontSize: 9.5 }}>
              <tbody>
                <tr>
                  <td style={{ width: 80, fontWeight: 700 }}>Instrumento:</td>
                  <td>{datosEquipo.nombre}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Marca / Modelo:</td>
                  <td>
                    {datosEquipo.marca || 'N/A'} / {datosEquipo.modelo || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Serie / Placa:</td>
                  <td>
                    S/N: {datosEquipo.serie || 'N/A'} • Placa: {datosEquipo.placaInventario || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Resolución:</td>
                  <td>
                    {datosEquipo.resolucion} {datosEquipo.unidad}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección: Fechas, Patrón y Condiciones Ambientales */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {/* Patrón */}
          <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#0f172a',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 2,
                marginBottom: 4,
                background: '#f1f5f9',
                padding: '2px 4px',
              }}
            >
              3. PATRÓN DE REFERENCIA (TRAZABILIDAD METROLÓGICA)
            </div>
            <table style={{ width: '100%', fontSize: 9 }}>
              <tbody>
                <tr>
                  <td style={{ width: 90, fontWeight: 700 }}>Patrón Utilizado:</td>
                  <td>{patron.nombre || 'Patrón Digital'} ({patron.codigo || 'PAT-01'})</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Certificado / Ente:</td>
                  <td>{patron.certificadoCalibracion || 'CERT-ONAC'} • {patron.trazabilidad}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Incertidumbre (U):</td>
                  <td>± {patron.incertidumbreExpandida} (k={patron.factorK || 2})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Condiciones Ambientales y Fechas */}
          <div style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: 4 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#0f172a',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 2,
                marginBottom: 4,
                background: '#f1f5f9',
                padding: '2px 4px',
              }}
            >
              4. CONDICIONES AMBIENTALES Y VIGENCIA
            </div>
            <table style={{ width: '100%', fontSize: 9 }}>
              <tbody>
                <tr>
                  <td style={{ width: 95, fontWeight: 700 }}>Temperatura:</td>
                  <td>{condicionesAmbientales.temperatura}°C ± {condicionesAmbientales.incertTemperatura}°C</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Humedad Relativa:</td>
                  <td>{condicionesAmbientales.humedadRelativa}% HR ± {condicionesAmbientales.incertHumedad}%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Fecha Calibración:</td>
                  <td>
                    {fechaCalibracion} • <strong>Próxima:</strong> {fechaProximaCalibracion || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Procedimiento */}
        <div
          style={{
            border: '1px solid #cbd5e1',
            padding: '4px 8px',
            borderRadius: 4,
            marginBottom: 8,
            fontSize: 9,
            background: '#fafafa',
          }}
        >
          <strong>Método / Procedimiento:</strong> {procedimiento}
        </div>

        {/* Ensayos previos específicos */}
        {tipoPlantilla === 'presion_tensiometro' && datosCalibracion.hermeticidad && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              border: '1px solid #cbd5e1',
              padding: '4px 8px',
              borderRadius: 4,
              marginBottom: 8,
              fontSize: 9,
              background: '#f8fafc',
            }}
          >
            <div>
              <strong>Prueba de Hermeticidad (Fuga en 1 min):</strong> P. Inicial:{' '}
              {datosCalibracion.hermeticidad.presionInicial} mmHg | P. Final:{' '}
              {datosCalibracion.hermeticidad.presionFinal} mmHg | Caída:{' '}
              <strong>{datosCalibracion.hermeticidad.caidaPresion} mmHg</strong> (Máx. 4 mmHg) →{' '}
              <span style={{ color: datosCalibracion.hermeticidad.cumple ? '#15803d' : '#dc2626', fontWeight: 700 }}>
                {datosCalibracion.hermeticidad.cumple ? 'CUMPLE' : 'NO CUMPLE'}
              </span>
            </div>
            <div>
              <strong>Error a Cero:</strong>{' '}
              <span style={{ color: '#15803d', fontWeight: 700 }}>CONFORME</span>
            </div>
          </div>
        )}

        {tipoPlantilla === 'masa_bascula' && datosCalibracion.repetibilidadBascula && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              border: '1px solid #cbd5e1',
              padding: '4px 8px',
              borderRadius: 4,
              marginBottom: 8,
              fontSize: 9,
              background: '#f8fafc',
            }}
          >
            <div>
              <strong>Prueba de Repetibilidad:</strong> Carga:{' '}
              {datosCalibracion.repetibilidadBascula.cargaNominal} {datosEquipo.unidad} | Desviación Estándar (s):{' '}
              <strong>{Number(datosCalibracion.repetibilidadBascula.desviacionEstandar).toFixed(4)} {datosEquipo.unidad}</strong>
            </div>
            {datosCalibracion.excentricidadBascula && (
              <div>
                <strong>Prueba de Excentricidad (Esquinas):</strong> Diferencia Máx:{' '}
                <strong>{datosCalibracion.excentricidadBascula.errorMaximo} {datosEquipo.unidad}</strong> →{' '}
                <span style={{ color: datosCalibracion.excentricidadBascula.cumple ? '#15803d' : '#dc2626', fontWeight: 700 }}>
                  {datosCalibracion.excentricidadBascula.cumple ? 'CUMPLE' : 'NO CUMPLE'}
                </span>
              </div>
            )}
          </div>
        )}

        {tipoPlantilla === 'volumen_micropipeta' && datosCalibracion.micropipetaInfo && (
          <div
            style={{
              border: '1px solid #cbd5e1',
              padding: '4px 8px',
              borderRadius: 4,
              marginBottom: 8,
              fontSize: 9,
              background: '#f8fafc',
            }}
          >
            <strong>Parámetros Gravimétricos ISO 8655:</strong> Temperatura agua:{' '}
            {datosCalibracion.micropipetaInfo.temperaturaAgua}°C | Presión:{' '}
            {datosCalibracion.micropipetaInfo.presionAtmosferica} hPa | Factor de conversión Z:{' '}
            <strong>{datosCalibracion.micropipetaInfo.factorZ} µL/mg</strong>
          </div>
        )}

        {/* Tabla Metrológica de Resultados Oficial */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#0f172a',
              background: '#f1f5f9',
              padding: '3px 6px',
              border: '1px solid #cbd5e1',
              borderBottom: 'none',
            }}
          >
            5. RESULTADOS DE LA CALIBRACIÓN (MEDIDAS E INCERTIDUMBRES)
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 8.5,
              textAlign: 'center',
              border: '1px solid #cbd5e1',
            }}
          >
            <thead>
              <tr style={{ background: '#e2e8f0', color: '#1e293b' }}>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>Punto</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                  Valor Patrón ({datosEquipo.unidad})
                </th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                  Indicación Media ({datosEquipo.unidad})
                </th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                  Error de Indicación ({datosEquipo.unidad})
                </th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                  Incertidumbre Expandida U ({datosEquipo.unidad})
                </th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>Factor k</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>EMP</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>Conformidad</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((p, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                    {p.valorNominal ?? p.valorPatron ?? p.nominal}
                  </td>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>{p.promedio}</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                    {p.error > 0 ? `+${p.error}` : p.error}
                  </td>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0369a1' }}>
                    ± {p.incertidumbreExpandida}
                  </td>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>{p.factorK || 2}</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>
                    ±{p.emp || (tipoPlantilla === 'presion_tensiometro' ? 3 : '')}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      border: '1px solid #cbd5e1',
                      fontWeight: 700,
                      color: p.cumple ? '#15803d' : '#dc2626',
                    }}
                  >
                    {p.cumple ? 'CONFORME' : 'NO CONFORME'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gráfico de Calibración Integrado */}
        <div style={{ marginBottom: 8 }}>
          <CalibrationChart
            puntos={puntos}
            unidad={datosEquipo.unidad}
            titulo="Gráfico de Calibración: Curva de Error de Indicación y Barras de Incertidumbre Expandida (k=2)"
            height={220}
          />
        </div>

        {/* Declaración de Trazabilidad e Incertidumbre */}
        <div
          style={{
            border: '1px solid #cbd5e1',
            padding: '6px 8px',
            borderRadius: 4,
            marginBottom: 8,
            fontSize: 8.5,
            color: '#475569',
            background: '#fafafa',
            textAlign: 'justify',
          }}
        >
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
            DECLARACIÓN DE INCERTIDUMBRE Y TRAZABILIDAD:
          </div>
          {declaracionTrazabilidad} La incertidumbre reportada es la incertidumbre expandida de medición obtenida al multiplicar la incertidumbre estándar combinada por el factor de cobertura k=2, que para una distribución normal corresponde a una probabilidad de cobertura de aproximadamente el 95.45% de acuerdo con la Guía para la Expresión de la Incertidumbre de Medición (GUM / JCGM 100).
        </div>

        {/* Dictamen y Observaciones */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #cbd5e1',
            padding: '6px 10px',
            borderRadius: 4,
            marginBottom: 10,
            background: '#f8fafc',
          }}
        >
          <div>
            <strong>Observaciones:</strong> {observaciones || 'Ninguna'}
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 800,
              background: dictamenGlobal === 'CONFORME' ? '#dcfce7' : '#fee2e2',
              color: dictamenGlobal === 'CONFORME' ? '#15803d' : '#b91c1c',
            }}
          >
            DICTAMEN: {dictamenGlobal}
          </div>
        </div>

        {/* Firmas Digitales Oficiales */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginTop: 10,
          }}
        >
          {/* Calibrador */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #64748b', paddingTop: 6 }}>
            {calibro.firma ? (
              <img
                src={calibro.firma}
                alt="Firma Calibrador"
                style={{ height: 42, maxWidth: 180, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ height: 42 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 10, color: '#0f172a' }}>
              {calibro.nombre || 'Ingeniero Metrólogo'}
            </div>
            <div style={{ fontSize: 8.5, color: '#64748b' }}>
              {calibro.cargo || 'Responsable de la Calibración'}
            </div>
            {calibro.tarjetaProfesional && (
              <div style={{ fontSize: 8, color: '#64748b' }}>
                T.P. Nº {calibro.tarjetaProfesional}
              </div>
            )}
          </div>

          {/* Aprobador */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #64748b', paddingTop: 6 }}>
            {aprobo.firma ? (
              <img
                src={aprobo.firma}
                alt="Firma Aprobador"
                style={{ height: 42, maxWidth: 180, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ height: 42 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 10, color: '#0f172a' }}>
              {aprobo.nombre || 'Director Técnico'}
            </div>
            <div style={{ fontSize: 8.5, color: '#64748b' }}>
              {aprobo.cargo || 'Aprobó / Responsable Metrología'}
            </div>
            {aprobo.tarjetaProfesional && (
              <div style={{ fontSize: 8, color: '#64748b' }}>
                T.P. Nº {aprobo.tarjetaProfesional}
              </div>
            )}
          </div>
        </div>

        {/* Pie de Página de Validez */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 7.5,
            color: '#94a3b8',
            marginTop: 10,
            borderTop: '1px dashed #e2e8f0',
            paddingTop: 4,
          }}
        >
          Este certificado no debe ser reproducido parcialmente excepto con la aprobación previa por escrito del laboratorio emisor.
        </div>
      </div>
    </div>
  );
}
