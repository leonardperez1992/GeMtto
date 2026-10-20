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
  const normUnidad = String(unidad || '').toLowerCase();
  const isPresion = esPresion || tipoPlantilla === 'presion_tensiometro' || normUnidad === 'mmhg';
  const isBascula = tipoPlantilla === 'masa_bascula' || (!isPresion && (normUnidad === 'kg' || normUnidad === 'g'));
  const isMicropipeta =
    tipoPlantilla === 'volumen_micropipeta' ||
    (!isPresion && !isBascula && (normUnidad === 'µl' || normUnidad === 'ul' || normUnidad === 'ml'));

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

  const padding = isPresion || isBascula || isMicropipeta
    ? { top: 28, right: 35, bottom: 48, left: 75 }
    : { top: 35, right: 35, bottom: 45, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Selecciona el primer valor numérico distinto de cero (evita que los defaults 0 de Mongoose oculten el valor real)
  const pickNonZero = (...vals) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) && Number(v) !== 0) {
        return Number(v);
      }
    }
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) {
        return Number(v);
      }
    }
    return undefined;
  };

  const getPointX = (p) => {
    if (!p) return undefined;
    if (isBascula) {
      return pickNonZero(p.cargaNominal, p.valorNominal, p.valorPatron, p.valorMasaConvencional);
    }
    if (isMicropipeta) {
      return pickNonZero(p.volumenSeleccionado, p.nominal, p.valorNominal, p.valorPatron);
    }
    if (isPresion) {
      return pickNonZero(p.indicacionIBC, p.valorPatron, p.valorNominal, p.nominal);
    }
    return pickNonZero(
      p.cargaNominal,
      p.valorPatron,
      p.valorNominal,
      p.indicacionIBC,
      p.volumenSeleccionado,
      p.nominal
    );
  };

  // Filtrar puntos válidos asegurando conversión numérica segura
  const validPuntos = puntos.filter((p) => {
    const rawVal = getPointX(p);
    return rawVal !== undefined && !isNaN(Number(rawVal));
  });

  if (validPuntos.length === 0) return null;

  const defaultCargasBascula = [5, 40, 80, 120, 150];

  // Extraer valores X e Y según el tipo de plantilla
  let data = validPuntos.map((p, idx) => {
    const rawX = getPointX(p) ?? 0;
    const x = Number(rawX);

    let rawY = 0;
    if (isPresion) {
      // Para presión, en el gráfico se representa el error de desempeño o corrección (Ref - IBC)
      rawY =
        p.errorDesempeno !== undefined && p.errorDesempeno !== null
          ? p.errorDesempeno
          : p.correccion !== undefined && p.correccion !== null
          ? p.correccion
          : -(Number(p.error) || 0);
    } else if (isBascula) {
      // Para básculas, usar el error de indicación E = I - mc (nunca errorSistematico que en BD tiene default 0)
      if (p.error !== undefined && p.error !== null && p.error !== '' && Number(p.error) !== 0) {
        rawY = Number(p.error);
      } else {
        const prom = pickNonZero(p.indicacionPromedio, p.promedio);
        const masa = pickNonZero(p.valorMasaConvencional, p.valorPatron, p.cargaNominal, p.valorNominal);
        if (prom !== undefined && masa !== undefined && prom > 0 && masa > 0) {
          rawY = Number((prom - masa).toFixed(4));
        } else {
          rawY = Number(p.error ?? 0);
        }
      }
    } else if (isMicropipeta) {
      rawY =
        p.errorSistematico !== undefined && p.errorSistematico !== null && Number(p.errorSistematico) !== 0
          ? Number(p.errorSistematico)
          : Number(p.error ?? p.errorSistematico ?? 0);
    } else {
      rawY = Number(p.error ?? p.errorSistematico ?? 0);
    }

    const y = Number(rawY) || 0;
    const u = Number(p.incertidumbreExpandida) || 0;
    const rawEmp = isPresion
      ? 3.0
      : p.emp !== undefined && Number(p.emp) > 0
      ? Number(p.emp)
      : p.empSistematicoPct
      ? (Number(p.empSistematicoPct) * x) / 100
      : 0;
    const emp = isNaN(rawEmp) ? 0 : rawEmp;
    return { x, y, u, emp, idx };
  });

  // Si en báscula todos los puntos quedaron con el mismo X (ej. 0 por registro antiguo sin cargaNominal),
  // distribuirlos horizontalmente usando los escalones nominales de carga
  if (isBascula && data.length > 1) {
    const uniqueX = new Set(data.map((d) => Math.round(d.x * 100)));
    if (uniqueX.size <= 1) {
      data = data.map((d, idx) => ({
        ...d,
        x: defaultCargasBascula[idx] ?? (idx + 1) * 30,
      }));
    }
  }

  // Ordenar por carga / valor X ascendente para trazado horizontal limpio de izquierda a derecha
  if (isBascula || isPresion) {
    data = [...data].sort((a, b) => a.x - b.x);
  }

  const xValues = data.map((d) => d.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const rangeX = maxX - minX || (maxX > 0 ? maxX : 1);

  // Determinar rango en Y:
  // Presión: -5.00 a +5.00
  // Báscula: -0.200 a +1.000 (o adaptado si los errores exceden)
  // Micropipeta: -8.00 a +8.00 con paso 2.00 (o adaptado si error ± U excede 8)
  let absMaxY = 5.0;
  let yTicks = [5.0, 4.0, 3.0, 2.0, 1.0, 0.0, -1.0, -2.0, -3.0, -4.0, -5.0];

  let basculaMinY = -0.2;
  let basculaMaxY = 1.0;
  let basculaMinX = 0;
  let basculaMaxX = 160;
  let xTicksBascula = [0, 20, 40, 60, 80, 100, 120, 140, 160];

  let microMinX = 0;
  let microMaxX = 60;
  let xTicksMicro = [0, 10, 20, 30, 40, 50, 60];

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
  } else if (isMicropipeta) {
    const maxDeltaMicro = Math.max(
      ...data.map((d) => Math.abs(d.y) + (d.u || 0)),
      6.0
    );
    const stepY = maxDeltaMicro <= 8 ? 2 : Math.ceil((maxDeltaMicro * 1.15) / 4);
    absMaxY = stepY * 4;
    yTicks = [
      absMaxY,
      stepY * 3,
      stepY * 2,
      stepY,
      0,
      -stepY,
      -stepY * 2,
      -stepY * 3,
      -absMaxY,
    ];

    const rawMaxMicro = maxX > 0 ? maxX : 50;
    const stepX = rawMaxMicro <= 60 ? 10 : Math.ceil((rawMaxMicro * 1.2) / 6 / 10) * 10;
    microMaxX = stepX * 6;
    xTicksMicro = [];
    for (let vx = 0; vx <= microMaxX + 0.001; vx += stepX) {
      xTicksMicro.push(vx);
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
    if (isMicropipeta) return Number(v).toFixed(2).replace('.', ',');
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
    if (isMicropipeta) {
      return padding.left + ((val - microMinX) / (microMaxX - microMinX)) * plotWidth;
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

  // Línea conectora de errores
  const linePoints = data.map((d) => `${getXPos(d.x)},${getYPos(d.y)}`).join(' ');

  const chartTitle =
    titulo ||
    (isPresion
      ? 'PRUEBA DE PARÁMETROS'
      : isBascula
      ? 'ERROR, INCERTIDUMBRE EXPANDIDA Y CARGAS'
      : isMicropipeta
      ? 'Gráfico de Error e Incertidumbre'
      : 'Curva de Error vs. Valor Patrón con Incertidumbre (k=2)');

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        padding: '10px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          fontSize: 14,
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
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Líneas de cuadrícula vertical para micropipeta */}
        {isMicropipeta &&
          xTicksMicro.map((valX, idx) => {
            const xPos = getXPos(valX);
            return (
              <line
                key={`vgrid-micro-${idx}`}
                x1={xPos}
                y1={padding.top}
                x2={xPos}
                y2={padding.top + plotHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

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
                    ? (isPresion || isMicropipeta ? '#94a3b8' : '#10b981')
                    : '#e2e8f0'
                }
                strokeWidth={isEmpLimit ? '2' : isZero ? '1.3' : '1'}
                strokeDasharray={(!isPresion && !isMicropipeta && isZero) ? '4 2' : 'none'}
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

        {/* Límites de Error Máximo Permisible (± EMP) para Básculas si existen */}
        {!isPresion && !isMicropipeta && data.some((d) => d.emp > 0) && (
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

        {/* Línea conectora de errores (solo para plantillas genéricas) */}
        {!isPresion && !isBascula && !isMicropipeta && data.length > 1 && (
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

        {/* Ticks y etiquetas del eje X para micropipetas (escala continua 0 a 60) */}
        {isMicropipeta &&
          xTicksMicro.map((valX, idx) => {
            const xPos = getXPos(valX);
            return (
              <g key={`xtick-micro-${idx}`}>
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
                  fontSize="11.5"
                  fill="#0f172a"
                  fontWeight="700"
                >
                  {valX}
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
                    stroke={isMicropipeta ? '#334155' : isBascula ? '#0284c7' : '#0369a1'}
                    strokeWidth={isMicropipeta ? '1.5' : '1.8'}
                  />
                  <line
                    x1={cx - 5}
                    y1={topU}
                    x2={cx + 5}
                    y2={topU}
                    stroke={isMicropipeta ? '#334155' : isBascula ? '#0284c7' : '#0369a1'}
                    strokeWidth={isMicropipeta ? '1.5' : '1.8'}
                  />
                  <line
                    x1={cx - 5}
                    y1={botU}
                    x2={cx + 5}
                    y2={botU}
                    stroke={isMicropipeta ? '#334155' : isBascula ? '#0284c7' : '#0369a1'}
                    strokeWidth={isMicropipeta ? '1.5' : '1.8'}
                  />
                </>
              )}

              {/* Punto de Error: círculo con borde nítido (Rojo en micropipeta según formato ISO 8655-6) */}
              <circle
                cx={cx}
                cy={cy}
                r={isPresion || isBascula || isMicropipeta ? '5.5' : '4.5'}
                fill={
                  isMicropipeta
                    ? '#dc2626'
                    : isPresion
                    ? '#000000'
                    : isBascula
                    ? '#0f172a'
                    : '#0284c7'
                }
                stroke="#ffffff"
                strokeWidth="1.2"
              />

              {/* Etiqueta de X en el eje (solo cuando NO es báscula ni micropipeta, que tienen su propio eje continuo) */}
              {!isBascula && !isMicropipeta && (
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
          {isPresion
            ? 'Presión (mmHg)'
            : isBascula
            ? 'Cargas (kg)'
            : isMicropipeta
            ? 'Indicación'
            : `Valor Patrón ${unidad ? `(${unidad})` : ''}`}
        </text>

        <text
          x={-(padding.top + plotHeight / 2)}
          y="18"
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="12"
          fill="#0f172a"
          fontWeight="900"
        >
          {isPresion
            ? 'Error ± Incertidumbre (mmHg)'
            : isBascula
            ? 'Error ± Incertidumbre (kg)'
            : isMicropipeta
            ? 'Error Sistemático ± Incertidumbre'
            : `Error de Indicación ${unidad ? `(${unidad})` : ''}`}
        </text>
      </svg>

      {/* Leyenda explicativa metrológica */}
      {isMicropipeta ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 48,
            marginTop: 8,
            fontSize: 12,
            color: '#0f172a',
            fontWeight: 700,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 14,
                width: 14,
              }}
            >
              <span style={{ width: 12, height: 1.5, background: '#334155' }} />
              <span style={{ width: 1.5, height: 11, background: '#334155' }} />
              <span style={{ width: 12, height: 1.5, background: '#334155' }} />
            </span>
            Incertidumbre
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#dc2626',
                display: 'inline-block',
              }}
            />
            Error sistemático
          </span>
        </div>
      ) : (
        !isPresion && (
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
        )
      )}
    </div>
  );
}
