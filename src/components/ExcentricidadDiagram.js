import React from 'react';

/**
 * Componente gráfico vectorial: Esquema Técnico del Ensayo de Excentricidad
 * Representa la plataforma de pesaje y los puntos de aplicación de carga
 * conforme a OIML R 76-1:2006 (numeral 3.6.2) y EURAMET cg-18 v4.0.
 */
export default function ExcentricidadDiagram({
  excentricidad = {},
  unidad = 'kg',
  width = 380,
  height = 230,
}) {
  const {
    cargaNominal = 0,
    centro = 0,
    pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0,
    errorMaximo = 0,
    emp = 0,
    cumple = true,
  } = excentricidad || {};

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 6,
        padding: '10px 12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#0f172a',
          textTransform: 'uppercase',
          marginBottom: 4,
          letterSpacing: 0.3,
        }}
      >
        Esquema Técnico: Posiciones del Ensayo de Excentricidad (OIML R 76-1)
      </div>
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 8, fontWeight: 500 }}>
        Carga de ensayo aplicada en centro y los 4 cuadrantes del receptor de carga (1/3 Max)
      </div>

      <svg
        viewBox="0 0 380 210"
        style={{
          width: '100%',
          maxWidth: width,
          height: 'auto',
          maxHeight: height,
        }}
      >
        <defs>
          {/* Sombra suave para la plataforma */}
          <filter id="plateShadow" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>

          {/* Gradiente metálico de la plataforma */}
          <linearGradient id="metalPlate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Marcador de flechas */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Marco de fondo / soporte de la báscula */}
        <rect
          x="30"
          y="15"
          width="320"
          height="160"
          rx="12"
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="1.5"
        />

        {/* Plataforma de pesaje (Plato) */}
        <rect
          x="45"
          y="25"
          width="290"
          height="140"
          rx="8"
          fill="url(#metalPlate)"
          stroke="#0284c7"
          strokeWidth="2"
          filter="url(#plateShadow)"
        />

        {/* Ejes centrales cuadrantes (Líneas punteadas) */}
        <line
          x1="190"
          y1="28"
          x2="190"
          y2="162"
          stroke="#94a3b8"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <line
          x1="48"
          y1="95"
          x2="332"
          y2="95"
          stroke="#94a3b8"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Textos de referencia de orientación */}
        <text x="190" y="21" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="800">
          ▲ POSTERIOR (DETRÁS)
        </text>
        <text x="190" y="178" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="800">
          ▼ FRONTAL (DELANTE)
        </text>
        <text x="36" y="98" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="800" transform="rotate(-90 36 98)">
          IZQ
        </text>
        <text x="344" y="98" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="800" transform="rotate(90 344 98)">
          DER
        </text>

        {/* Cotas dimensionales OIML (L/4) */}
        <line x1="50" y1="168" x2="115" y2="168" stroke="#64748b" strokeWidth="0.8" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
        <text x="82" y="176" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">
          L / 4
        </text>

        {/* --- POSICIÓN 1: CENTRO --- */}
        <g transform="translate(190, 95)">
          <circle r="18" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
          <circle r="13" fill="#0284c7" />
          <text y="4" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="900">
            1
          </text>
          <text y="28" textAnchor="middle" fontSize="9.5" fill="#0f172a" fontWeight="800">
            Centro
          </text>
          {centro !== undefined && centro !== 0 && (
            <text y="38" textAnchor="middle" fontSize="9" fill="#0369a1" fontWeight="800">
              {centro} {unidad}
            </text>
          )}
        </g>

        {/* --- POSICIÓN 2: DELANTE - IZQUIERDA --- */}
        <g transform="translate(115, 130)">
          <circle r="16" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
          <circle r="11" fill="#475569" />
          <text y="3.5" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="900">
            2
          </text>
          <text y="-18" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="800">
            Delante - Izq
          </text>
          {pos1 !== undefined && pos1 !== 0 && (
            <text y="24" textAnchor="middle" fontSize="8.5" fill="#0369a1" fontWeight="800">
              {pos1} {unidad}
            </text>
          )}
        </g>

        {/* --- POSICIÓN 3: DETRÁS - IZQUIERDA --- */}
        <g transform="translate(115, 60)">
          <circle r="16" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
          <circle r="11" fill="#475569" />
          <text y="3.5" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="900">
            3
          </text>
          <text y="-18" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="800">
            Detrás - Izq
          </text>
          {pos4 !== undefined && pos4 !== 0 && (
            <text y="24" textAnchor="middle" fontSize="8.5" fill="#0369a1" fontWeight="800">
              {pos4} {unidad}
            </text>
          )}
        </g>

        {/* --- POSICIÓN 4: DETRÁS - DERECHA --- */}
        <g transform="translate(265, 60)">
          <circle r="16" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
          <circle r="11" fill="#475569" />
          <text y="3.5" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="900">
            4
          </text>
          <text y="-18" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="800">
            Detrás - Der
          </text>
          {pos3 !== undefined && pos3 !== 0 && (
            <text y="24" textAnchor="middle" fontSize="8.5" fill="#0369a1" fontWeight="800">
              {pos3} {unidad}
            </text>
          )}
        </g>

        {/* --- POSICIÓN 5: DELANTE - DERECHA --- */}
        <g transform="translate(265, 130)">
          <circle r="16" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
          <circle r="11" fill="#475569" />
          <text y="3.5" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="900">
            5
          </text>
          <text y="-18" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="800">
            Delante - Der
          </text>
          {pos2 !== undefined && pos2 !== 0 && (
            <text y="24" textAnchor="middle" fontSize="8.5" fill="#0369a1" fontWeight="800">
              {pos2} {unidad}
            </text>
          )}
        </g>

        {/* Leyenda de la norma */}
        <rect x="40" y="188" width="300" height="18" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
        <text x="190" y="200" textAnchor="middle" fontSize="8.5" fill="#1e293b" fontWeight="700">
          Carga Nominal: {cargaNominal} {unidad} | Tolerancia EMP: ±{emp} {unidad} | Error Máx: {errorMaximo} {unidad} ({cumple ? 'CUMPLE' : 'NO CUMPLE'})
        </text>
      </svg>
    </div>
  );
}
