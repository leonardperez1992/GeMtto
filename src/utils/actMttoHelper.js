const SEPARATOR = ' ::REF:: ';

/**
 * Extrae de forma limpia el nombre del parámetro y su valor de referencia asociado
 * desde un documento de Actividad de Mantenimiento (soportando tanto el campo dedicado
 * valor_referenciaN como el respaldo embebido en parametroN).
 */
export function extraerParametroYReferencia(item, idx) {
  if (!item) return { parametro: '', valorReferencia: '' };

  const rawParam = String(item[`parametro${idx}`] || '').trim();
  const rawRef = String(item[`valor_referencia${idx}`] || '').trim();

  let parametro = rawParam;
  let embebidoRef = '';

  if (rawParam.includes(SEPARATOR)) {
    const parts = rawParam.split(SEPARATOR);
    parametro = (parts[0] || '').trim();
    embebidoRef = (parts.slice(1).join(' ') || '').trim();
  }

  const cleanParam = parametro === 'NA' ? '' : parametro;
  const candidateRef = rawRef && rawRef !== 'NA' ? rawRef : embebidoRef;
  const cleanRef = candidateRef === 'NA' ? '' : candidateRef;

  return {
    parametro: cleanParam,
    valorReferencia: cleanRef,
  };
}

/**
 * Normaliza un objeto de Actividad de Mantenimiento recibido de la API para que
 * tenga separados parametro1..5 y valor_referencia1..5 en el estado de los formularios.
 */
export function normalizarActMttoParaFormulario(item) {
  if (!item) return item;
  const normalized = { ...item };
  for (let idx = 1; idx <= 5; idx++) {
    const { parametro, valorReferencia } = extraerParametroYReferencia(item, idx);
    normalized[`parametro${idx}`] = parametro || 'NA';
    normalized[`valor_referencia${idx}`] = valorReferencia || '';
  }
  return normalized;
}

/**
 * Construye los campos parametro1..5 y valor_referencia1..5 para enviar al backend,
 * incluyendo respaldo embebido por si el backend aún no ha actualizado el esquema.
 */
export function construirPayloadParametrosActMtto(formState) {
  const payload = {};
  for (let idx = 1; idx <= 5; idx++) {
    const rawParam = String(formState[`parametro${idx}`] || '')
      .split(SEPARATOR)[0]
      .trim();
    const rawRef = String(formState[`valor_referencia${idx}`] || '').trim();

    const cleanParam = rawParam || 'NA';
    const cleanRef = rawRef && rawRef !== 'NA' ? rawRef : 'NA';

    payload[`parametro${idx}`] =
      cleanParam !== 'NA' && cleanRef !== 'NA'
        ? `${cleanParam}${SEPARATOR}${cleanRef}`
        : cleanParam;
    payload[`valor_referencia${idx}`] = cleanRef;
  }
  return payload;
}
