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
  tipoPlantilla = '',
  esPresion = false,
  titulo = '',
  width = 620,
  height = 270,
}) {
  const isPresion = esPresion || tipoPlantilla === 'presion_tensiometro' || unidad === 'mmHg';
  const isBascula = tipoPlantilla === 'masa_bascula' || (!isPresion && (unidad === 'kg' || unidad === 'g'));

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

  const padding = isPresion || isBascula
    ? { top: 28, right: 35, bottom: 48, left: 75 }
    : { top: 35, right: 35, bottom: 45, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Filtrar puntos válidos asegurando conversión numérica segura
  const validPuntos = puntos.filter((p) => {
    if (!p) return false;
    const rawVal = p.valorPatron ?? p.nominal ?? p.valorNominal ?? p.indicacionIBC ?? p.cargaNominal;
    return rawVal !== undefined && rawVal !== null && rawVal !== '' && !isNaN(Number(rawVal));
  });

  if (validPuntos.length === 0) return null;

  // Extraer valores X e Y
  const data = validPuntos.map((p) => {
    const rawX = p.cargaNominal ?? p.indicacionIBC ?? p.valorPatron ?? p.nominal ?? p.valorNominal ?? 0;
    const x = Number(rawX);
    // Para presión, en el gráfico se representa el error de desempeño o corrección (Ref - IBC)
    const rawY = isPresion
      ? (p.errorDesempeno !== undefined ? p.errorDesempeno : p.correccion !== undefined ? p.correccion : (-(Number(p.error) || 0)))
      : (p.error ?? p.errorSistematico ?? 0);
    const y = Number(rawY) || 0;
    const u = Number(p.incertidumbreExpandida) || 0;
    const rawEmp = isPresion
      ? 3.0
      : (p.emp !== undefined
        ? Number(p.emp)
        : p.empSistematicoPct
        ? (Number(p.empSistematicoPct) * x) / 100
        : 0);
    const emp = isNaN(rawEmp) ? 0 : rawEmp;
    return { x, y, u, emp };
  });

  const xValues = data.map((d) => d.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const rangeX = maxX - minX || (maxX > 0 ? maxX : 1);

  // Determinar rango en Y:
  // Presión: -5.00 a +5.00
  // Báscula: -0.200 a +1.000 (o adaptado si los errores exceden)
  let absMaxY = 5.0;
  let yTicks = [5.0, 4.0, 3.0, 2.0, 1.0, 0.0, -1.0, -2.0, -3.0, -4.0, -5.0];

  let basculaMinY = -0.2;
  let basculaMaxY = 1.0;
  let basculaMinX = 0;
  let basculaMaxX = 160;
  let xTicksBascula = [0, 20, 40, 60, 80, 100, 120, 140, 160];

  if (isBascula) {
    const minValY = Math.min(...data.map((d) => d.y - (d.u || 0)), -0.1);
    const maxValY = Math.max(...data.map((d) => d.y + (d.u || 0)), 0.6);
    basculaMinY = Math.min(-0.2, Number((Math.floor(minValY * 5) / 5).toFixed(2)));
    basculaMaxY = Math.max(1.0, Number((Math.ceil(maxValY * 5) / 5).toFixed(2)));

    yTicks = [];
    for (let v = basculaMaxY; v >= basculaMinY - 0.001; v -= 0.2) {
      yTicks.push(Number(v.toFixed(2)));
    }

    basculaMaxX = Math.max(160, Math.ceil(maxX / 20) * 20);
    xTicksBascula = [];
    for (let vx = 0; vx <= basculaMaxX + 0.1; vx += 20) {
      xTicksBascula.push(vx);
    }
  } else if (!isPresion) {
    const maxDelta = Math.max(
      ...data.map((d) => Math.max(Math.abs(d.y) + (d.u || 0), Math.abs(d.emp || 0))),
      0.005
    );
    absMaxY = Number((maxDelta * 1.35).toFixed(4)) || 0.05;
    yTicks = [
      absMaxY,
      absMaxY / 2,
      0,
      -absMaxY / 2,
      -absMaxY,
    ];
  }

  const formatVal = (v) => {
    if (isPresion) return Number(v).toFixed(2).replace('.', ',');
    if (isBascula) return Number(v).toFixed(2).replace('.', ',');
    if (absMaxY < 0.05) return Number(v).toFixed(4);
    if (absMaxY < 0.5) return Number(v).toFixed(3);
    if (absMaxY < 5) return Number(v).toFixed(2);
    return Number(v).toFixed(1);
  };

  // Funciones de escala
  const getXPos = (val) => {
    if (isBascula) {
      return padding.left + ((val - basculaMinX) / (basculaMaxX - basculaMinX)) * plotWidth;
    }
    if (data.length === 1 || rangeX === 0) return padding.left + plotWidth / 2;
    const innerPad = plotWidth * 0.07;
    const available = plotWidth - innerPad * 2;
    return padding.left + innerPad + ((val - minX) / rangeX) * available;
  };

  const getYPos = (val) => {
    if (isBascula) {
      return (
        padding.top +
        plotHeight -
        ((val - basculaMinY) / (basculaMaxY - basculaMinY)) * plotHeight
      );
    }
    return padding.top + plotHeight / 2 - (val / absMaxY) * (plotHeight / 2);
  };

  // Línea conectora de errores (solo para micropipetas; en presión y básculas met&cal son puntos con barras)
  const linePoints = data.map((d) => `${getXPos(d.x)},${getYPos(d.y)}`).join(' ');

  const chartTitle =
    titulo ||
    (isPresion
      ? 'PRUEBA DE PARÁMETROS'
      : isBascula
      ? 'ERROR, INCERTIDUMBRE EXPANDIDA Y CARGAS'
      : 'Curva de Error vs. Valor Patrón con Incertidumbre (k=2)');

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
          fontSize: 13.5,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 6,
          textAlign: 'center',
          letterSpacing: 0.2,
        }}
      >
        {chartTitle}
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
          fill={isPresion ? '#ffffff' : '#f8fafc'}
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Líneas de cuadrícula horizontal */}
        {yTicks.map((val, idx) => {
          const y = getYPos(val);
          const isEmpLimit = isPresion && (Math.abs(val - 3.0) < 0.01 || Math.abs(val + 3.0) < 0.01);
          const isZero = Math.abs(val) < 0.01;

          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke={
                  isEmpLimit
                    ? '#ef4444'
                    : isZero
                    ? (isPresion ? '#64748b' : '#10b981')
                    : '#e2e8f0'
                }
                strokeWidth={isEmpLimit ? '2' : isZero ? '1.5' : '1'}
                strokeDasharray={(!isPresion && isZero) ? '4 2' : 'none'}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={isEmpLimit ? '12' : '11.5'}
                fill={isEmpLimit ? '#dc2626' : isZero ? '#0f172a' : '#334155'}
                fontWeight={isEmpLimit || isZero ? '900' : '700'}
              >
                {formatVal(val)}
              </text>
            </g>
          );
        })}

        {/* Límites de Error Máximo Permisible (± EMP) para Básculas/Micropipetas si existen */}
        {!isPresion && data.some((d) => d.emp > 0) && (
          <>
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

        {/* Línea conectora de errores (solo para micropipetas; en presión y básculas son puntos con barras) */}
        {!isPresion && !isBascula && data.length > 1 && (
          <polyline
            fill="none"
            stroke="#0284c7"
            strokeWidth="2"
            points={linePoints}
          />
        )}

        {/* Ticks y etiquetas del eje X para básculas (escala continua 0 a 160 kg) */}
        {isBascula &&
          xTicksBascula.map((valX, idx) => {
            const xPos = getXPos(valX);
            return (
              <g key={`xtick-${idx}`}>
                <line
                  x1={xPos}
                  y1={padding.top + plotHeight}
                  x2={xPos}
                  y2={padding.top + plotHeight + 5}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />
                <text
                  x={xPos}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#1e293b"
                  fontWeight="700"
                >
                  {Number(valX).toFixed(1).replace('.', ',')}
                </text>
              </g>
            );
          })}

        {/* Puntos individuales y barras de incertidumbre */}
        {data.map((d, idx) => {
          const cx = getXPos(d.x);
          const cy = getYPos(d.y);
          const topU = getYPos(d.y + d.u);
          const botU = getYPos(d.y - d.u);

          return (
            <g key={idx}>
              {/* Barra de incertidumbre vertical (± U) */}
              {!isPresion && d.u > 0 && (
                <>
                  <line
                    x1={cx}
                    y1={topU}
                    x2={cx}
                    y2={botU}
                    stroke={isBascula ? '#0284c7' : '#0369a1'}
                    strokeWidth="1.8"
                  />
                  <line
                    x1={cx - 5}
                    y1={topU}
                    x2={cx + 5}
                    y2={topU}
                    stroke={isBascula ? '#0284c7' : '#0369a1'}
                    strokeWidth="1.8"
                  />
                  <line
                    x1={cx - 5}
                    y1={botU}
                    x2={cx + 5}
                    y2={botU}
                    stroke={isBascula ? '#0284c7' : '#0369a1'}
                    strokeWidth="1.8"
                  />
                </>
              )}

              {/* Punto de Error: círculo con borde nítido */}
              <circle
                cx={cx}
                cy={cy}
                r={isPresion || isBascula ? '5.5' : '4.5'}
                fill={isPresion ? '#000000' : isBascula ? '#0f172a' : '#0284c7'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Etiqueta de valor del punto (solo en micropipetas o báscula si se desea) */}
              {!isPresion && !isBascula && (
                <text
                  x={cx}
                  y={cy - 7}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="800"
                  fill="#0f172a"
                >
                  {d.y > 0 ? `+${formatVal(d.y)}` : formatVal(d.y)}
                </text>
              )}

              {/* Etiqueta de X en el eje (solo cuando NO es báscula, ya que báscula tiene su propio eje continuo) */}
              {!isBascula && (
                <text
                  x={cx}
                  y={padding.top + plotHeight + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#0f172a"
                  fontWeight="800"
                >
                  {d.x}
                </text>
              )}
            </g>
          );
        })}

        {/* Título de ejes */}
        <text
          x={padding.left + plotWidth / 2}
          y={height - 6}
          textAnchor="middle"
          fontSize="12.5"
          fill="#0f172a"
          fontWeight="900"
        >
          {isPresion ? 'Presión (mmHg)' : isBascula ? 'Cargas (kg)' : `Valor Patrón ${unidad ? `(${unidad})` : ''}`}
        </text>

        <text
          x={-(padding.top + plotHeight / 2)}
          y="18"
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="12.5"
          fill="#0f172a"
          fontWeight="900"
        >
          {isPresion ? 'Error ± Incertidumbre (mmHg)' : isBascula ? 'Error ± Incertidumbre (kg)' : `Error de Indicación ${unidad ? `(${unidad})` : ''}`}
        </text>
      </svg>

      {/* Leyenda explicativa metrológica */}
      {!isPresion && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            marginTop: 6,
            fontSize: 11,
            color: '#334155',
            fontWeight: 600,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: isBascula ? '#0f172a' : '#0284c7' }} />
            Error de indicación (kg)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 2, background: '#0284c7' }} />
            Barra de Incertidumbre expandida (± U, k=2)
          </span>
          {data.some((d) => d.emp > 0) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 2, borderTop: '2px dashed #ef4444' }} />
              Límite Error Máx. Permisible (EMP)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
