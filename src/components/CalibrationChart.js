import React from 'react';

/**
 * Componente gráfico vectorial de Calibración Metrológica
 * Dibuja la curva de Error vs Valor Nominal,
 * incluyendo las Barras de Incertidumbre Expandida (± U)
 * y los Límites de Error Máximo Permisible (± EMP).
 * Totalmente compatible con visualización en pantalla y exportación PDF de alta definición.
 */
export default function CalibrationChart({
  puntos = [],
  unidad = '',
  titulo = 'Curva de Error vs. Valor Patrón con Incertidumbre (k=2)',
  width = 620,
  height = 270,
}) {
  if (!puntos || puntos.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #cbd5e1',
          borderRadius: 8,
          color: '#64748b',
          fontSize: 13,
          background: '#f8fafc',
        }}
      >
        Ingrese lecturas para generar el gráfico de calibración.
      </div>
    );
  }

  const padding = { top: 35, right: 35, bottom: 45, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Filtrar puntos válidos asegurando conversión numérica segura
  const validPuntos = puntos.filter((p) => {
    if (!p) return false;
    const rawVal = p.valorPatron ?? p.nominal ?? p.valorNominal;
    return rawVal !== undefined && rawVal !== null && rawVal !== '' && !isNaN(Number(rawVal));
  });

  if (validPuntos.length === 0) return null;

  // Extraer valores X e Y
  const data = validPuntos.map((p) => {
    const rawX = p.valorPatron ?? p.nominal ?? p.valorNominal ?? 0;
    const x = Number(rawX);
    const rawY = p.error ?? p.errorSistematico ?? 0;
    const y = Number(rawY) || 0;
    const u = Number(p.incertidumbreExpandida) || 0;
    const rawEmp =
      p.emp !== undefined
        ? Number(p.emp)
        : p.empSistematicoPct
        ? (Number(p.empSistematicoPct) * x) / 100
        : 0;
    const emp = isNaN(rawEmp) ? 0 : rawEmp;
    return { x, y, u, emp };
  });

  const xValues = data.map((d) => d.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const rangeX = maxX - minX || (maxX > 0 ? maxX : 1);

  // Determinar rango en Y adaptado matemáticamente según la escala (Masa kg, Presión mmHg o Volumen µL)
  const maxDelta = Math.max(
    ...data.map((d) => Math.max(Math.abs(d.y) + (d.u || 0), Math.abs(d.emp || 0))),
    0.005
  );
  const absMaxY = Number((maxDelta * 1.35).toFixed(4)) || 0.05;

  const formatVal = (v) => {
    if (absMaxY < 0.05) return Number(v).toFixed(4);
    if (absMaxY < 0.5) return Number(v).toFixed(3);
    if (absMaxY < 5) return Number(v).toFixed(2);
    return Number(v).toFixed(1);
  };

  // Funciones de escala
  const getXPos = (val) => {
    if (data.length === 1 || rangeX === 0) return padding.left + plotWidth / 2;
    // Margen interno del 6% para que el primer y último punto no toquen los bordes
    const innerPad = plotWidth * 0.06;
    const available = plotWidth - innerPad * 2;
    return padding.left + innerPad + ((val - minX) / rangeX) * available;
  };

  const getYPos = (val) => {
    return padding.top + plotHeight / 2 - (val / absMaxY) * (plotHeight / 2);
  };

  // Línea conectora de errores
  const linePoints = data.map((d) => `${getXPos(d.x)},${getYPos(d.y)}`).join(' ');

  // Ticks para eje Y
  const yTicks = [
    absMaxY,
    absMaxY / 2,
    0,
    -absMaxY / 2,
    -absMaxY,
  ];

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        padding: '10px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: 6,
          textAlign: 'center',
          letterSpacing: 0.2,
        }}
      >
        {titulo}
      </div>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ width: '100%', maxWidth: width, height: 'auto', display: 'block', margin: '0 auto' }}
      >
        {/* Fondo del área de trazado */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotWidth}
          height={plotHeight}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Líneas de cuadrícula horizontal */}
        {yTicks.map((val, idx) => {
          const y = getYPos(val);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke={val === 0 ? '#10b981' : '#e2e8f0'}
                strokeWidth={val === 0 ? '1.5' : '1'}
                strokeDasharray={val === 0 ? '4 2' : 'none'}
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9.5"
                fill={val === 0 ? '#059669' : '#64748b'}
                fontWeight={val === 0 ? '700' : '500'}
              >
                {val > 0 ? `+${formatVal(val)}` : formatVal(val)}
              </text>
            </g>
          );
        })}

        {/* Límites de Error Máximo Permisible (± EMP) si existen */}
        {data.some((d) => d.emp > 0) && (
          <>
            {/* EMP superior */}
            <path
              d={data.reduce((acc, d, i) => {
                const x = getXPos(d.x);
                const y = getYPos(d.emp);
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.85"
            />
            {/* EMP inferior */}
            <path
              d={data.reduce((acc, d, i) => {
                const x = getXPos(d.x);
                const y = getYPos(-d.emp);
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.85"
            />
          </>
        )}

        {/* Línea conectora de errores */}
        {data.length > 1 && (
          <polyline
            fill="none"
            stroke="#0284c7"
            strokeWidth="2"
            points={linePoints}
          />
        )}

        {/* Barras de Incertidumbre y puntos individuales */}
        {data.map((d, idx) => {
          const cx = getXPos(d.x);
          const cy = getYPos(d.y);
          const topU = getYPos(d.y + d.u);
          const botU = getYPos(d.y - d.u);

          return (
            <g key={idx}>
              {/* Barra de incertidumbre vertical (± U) */}
              {d.u > 0 && (
                <>
                  <line
                    x1={cx}
                    y1={topU}
                    x2={cx}
                    y2={botU}
                    stroke="#0369a1"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={cx - 4}
                    y1={topU}
                    x2={cx + 4}
                    y2={topU}
                    stroke="#0369a1"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={cx - 4}
                    y1={botU}
                    x2={cx + 4}
                    y2={botU}
                    stroke="#0369a1"
                    strokeWidth="1.5"
                  />
                </>
              )}

              {/* Punto de Error */}
              <circle
                cx={cx}
                cy={cy}
                r="4.5"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Etiqueta de valor del punto */}
              <text
                x={cx}
                y={cy - 7}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#0f172a"
              >
                {d.y > 0 ? `+${formatVal(d.y)}` : formatVal(d.y)}
              </text>

              {/* Etiqueta de X en el eje */}
              <text
                x={cx}
                y={padding.top + plotHeight + 16}
                textAnchor="middle"
                fontSize="9.5"
                fill="#475569"
                fontWeight="600"
              >
                {d.x}
              </text>
            </g>
          );
        })}

        {/* Título de ejes */}
        <text
          x={padding.left + plotWidth / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize="10"
          fill="#334155"
          fontWeight="600"
        >
          Valor Patrón {unidad ? `(${unidad})` : ''}
        </text>

        <text
          x={-(padding.top + plotHeight / 2)}
          y="15"
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="10"
          fill="#334155"
          fontWeight="600"
        >
          Error de Indicación {unidad ? `(${unidad})` : ''}
        </text>
      </svg>

      {/* Leyenda explicativa metrológica */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 6,
          fontSize: 10.5,
          color: '#475569',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
          Error de indicación (E)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 2, background: '#0369a1' }} />
          Barra de Incertidumbre expandida (± U, k=2)
        </span>
        {data.some((d) => d.emp > 0) && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 2, borderTop: '2px dashed #ef4444' }} />
            Límite Error Máx. Permisible (EMP)
          </span>
        )}
      </div>
    </div>
  );
}
