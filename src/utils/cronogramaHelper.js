// src/utils/cronogramaHelper.js

export const MESES_DEL_ANIO = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const MESES_ABREV = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];

/**
 * Normaliza el nombre de un mes
 */
export function normalizarMes(mes) {
  if (!mes) return '';
  const m = String(mes).trim();
  const lower = m.toLowerCase();

  for (let i = 0; i < MESES_DEL_ANIO.length; i++) {
    if (
      MESES_DEL_ANIO[i].toLowerCase() === lower ||
      MESES_ABREV[i].toLowerCase() === lower ||
      lower.startsWith(MESES_ABREV[i].toLowerCase())
    ) {
      return MESES_DEL_ANIO[i];
    }
  }

  const num = parseInt(m, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return MESES_DEL_ANIO[num - 1];
  }

  return m;
}

/**
 * Calcula los meses sugeridos por defecto según la periodicidad y fecha base
 */
export function calcularMesesSugeridos(periodicidadStr, fechaBaseStr = null) {
  if (!periodicidadStr) return ['Enero', 'Julio'];
  const per = String(periodicidadStr).toUpperCase().trim();

  let startMonthIndex = 0; // Por defecto Enero (0)
  if (fechaBaseStr && fechaBaseStr.length >= 7) {
    const parts = fechaBaseStr.split('-');
    if (parts.length >= 2) {
      const mNum = parseInt(parts[1], 10);
      if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
        startMonthIndex = mNum - 1;
      }
    }
  }

  let step = 6; // default semestral
  let count = 2;

  if (per.includes('MENSUAL') || per === '1') {
    step = 1;
    count = 12;
  } else if (per.includes('BIMESTRAL') || per === '2') {
    step = 2;
    count = 6;
  } else if (per.includes('TRIMESTRAL') || per === '3') {
    step = 3;
    count = 4;
  } else if (per.includes('CUATRIMESTRAL') || per === '4') {
    step = 4;
    count = 3;
  } else if (per.includes('SEMESTRAL') || per === '6') {
    step = 6;
    count = 2;
  } else if (per.includes('ANUAL') || per === '12') {
    step = 12;
    count = 1;
  }

  const selectedMonths = [];
  for (let i = 0; i < count; i++) {
    const monthIdx = (startMonthIndex + i * step) % 12;
    const monthName = MESES_DEL_ANIO[monthIdx];
    if (!selectedMonths.includes(monthName)) {
      selectedMonths.push(monthName);
    }
  }

  // Ordenar cronológicamente de Enero a Diciembre
  return selectedMonths.sort(
    (a, b) => MESES_DEL_ANIO.indexOf(a) - MESES_DEL_ANIO.indexOf(b)
  );
}

/**
 * Obtiene los meses asignados para un equipo (propios o auto-calculados)
 */
export function obtenerMesesEquipo(equipo) {
  if (!equipo) {
    return {
      nombres: 'No asignado',
      array: [],
      indices: [],
    };
  }

  let meses = [];

  if (
    equipo.meses_mantenimiento &&
    Array.isArray(equipo.meses_mantenimiento) &&
    equipo.meses_mantenimiento.length > 0
  ) {
    meses = equipo.meses_mantenimiento
      .map(normalizarMes)
      .filter((m) => MESES_DEL_ANIO.includes(m));
  } else if (typeof equipo.meses_mantenimiento === 'string' && equipo.meses_mantenimiento.trim()) {
    meses = equipo.meses_mantenimiento
      .split(',')
      .map((m) => normalizarMes(m.trim()))
      .filter((m) => MESES_DEL_ANIO.includes(m));
  }

  // Si no tiene meses explícitos, calcular sugeridos según su periodicidad
  if (meses.length === 0) {
    meses = calcularMesesSugeridos(
      equipo.periodicidad || 'SEMESTRAL',
      equipo.fecha_instalacion || null
    );
  }

  // Ordenar cronológicamente
  meses = Array.from(new Set(meses)).sort(
    (a, b) => MESES_DEL_ANIO.indexOf(a) - MESES_DEL_ANIO.indexOf(b)
  );

  const indices = meses.map((m) => MESES_DEL_ANIO.indexOf(m));

  return {
    nombres: meses.length > 0 ? meses.join(', ') : 'Sin programar',
    array: meses,
    indices: indices,
  };
}
