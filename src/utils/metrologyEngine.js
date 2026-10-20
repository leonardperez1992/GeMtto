/**
 * Motor Metrológico GEMTTO
 * Cálculos de incertidumbres según GUM (JCGM 100:2008) e ISO/IEC 17025
 * Normas de referencia:
 * - OIML R 16 / NTC 4353 (Tensiómetros)
 * - OIML R 76 / EURAMET cg-18 (Básculas y Balanzas)
 * - ISO 8655-2 / ISO 8655-6 (Micropipetas gravimétrico)
 */

// 1. Estadísticas básicas
export const promedio = (arr = []) => {
  const valid = arr.filter((x) => typeof x === 'number' && !isNaN(x));
  if (valid.length === 0) return 0;
  const suma = valid.reduce((acc, curr) => acc + curr, 0);
  return suma / valid.length;
};

export const desviacionEstandar = (arr = []) => {
  const valid = arr.filter((x) => typeof x === 'number' && !isNaN(x));
  if (valid.length <= 1) return 0;
  const prom = promedio(valid);
  const sumCuadrados = valid.reduce((acc, curr) => acc + Math.pow(curr - prom, 2), 0);
  return Math.sqrt(sumCuadrados / (valid.length - 1));
};

// 2. Redondeo Metrológico a 2 cifras significativas para la incertidumbre
export const redondearIncertidumbre = (u) => {
  if (!u || isNaN(u) || u <= 0) return 0;
  const d = Math.ceil(Math.log10(u < 0 ? -u : u));
  const power = 2 - d;
  const magnitude = Math.pow(10, power);
  const shifted = Math.round(u * magnitude);
  return shifted / magnitude;
};

export const formatearConDecimales = (num, decimales = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toFixed(decimales);
};

// 3. Cálculo de Factor Z para agua pura según ISO 8655-6
export const calcularFactorZ = (tempC = 20, presionHpa = 1013) => {
  const t = typeof tempC === 'number' && !isNaN(tempC) ? tempC : 20;
  const p = typeof presionHpa === 'number' && !isNaN(presionHpa) ? presionHpa : 1013;

  // Densidad del agua pura (Wagenbreth & Blanke) en g/cm³
  const rho_w =
    (999.83952 +
      16.945176 * t -
      7.9870401e-3 * Math.pow(t, 2) -
      46.170461e-6 * Math.pow(t, 3) +
      105.56302e-9 * Math.pow(t, 4) -
      280.54253e-12 * Math.pow(t, 5)) /
    (1 + 16.87985e-3 * t) /
    1000;

  // Densidad del aire (kg/m³ convertido a g/cm³)
  const rho_a = (0.34848 * p * 1e-3) / (273.15 + t);

  // Densidad pesas acero inox (8.0 g/cm³)
  const rho_b = 8.0;

  // Factor Z en µL/mg (o cm³/g)
  // Z = (1 / rho_w) * ((1 - rho_a / rho_b) / (1 - rho_a / rho_w))
  const z = (1 / rho_w) * ((1 - rho_a / rho_b) / (1 - rho_a / rho_w));

  return Number(z.toFixed(5));
};

// 4. Tensiómetros / Esfigmomanómetros: Cálculo metrológico según OIML 148-2 e ISO/IEC 17025
export const calcularPuntoTensiometro = ({
  prueba = 'Con Brazalete',
  valorPatron = 0,
  indicacionIBC = null,
  lecturas = [],
  resolucionEquipo = 2, // 2 mmHg en aneroides (estimación visual a 1 mmHg), 1 o 0.1 en digitales
  patronInfo = {},
}) => {
  const valid = lecturas.map((x) => Number(x)).filter((x) => !isNaN(x));
  const prom = promedio(valid);
  const s = desviacionEstandar(valid);

  // Indicación en el IBC (nominal de prueba: 30, 100, 150, 200, 250, 300)
  const ibcVal = indicacionIBC !== null && indicacionIBC !== undefined && indicacionIBC !== ''
    ? Number(indicacionIBC)
    : Number(valorPatron);

  // Presión de Referencia: Promedio de las lecturas registradas por el módulo patrón
  const presionReferencia = valid.length > 0 ? Number(prom.toFixed(1)) : ibcVal;

  // Corrección = Presión Referencia - Indicación IBC
  const correccion = valid.length > 0 ? Number((presionReferencia - ibcVal).toFixed(1)) : 0;
  const correccionEntera = Math.round(correccion);

  // Error de indicación = Indicación IBC - Presión Referencia
  const error = valid.length > 0 ? Number((ibcVal - presionReferencia).toFixed(2)) : 0;

  // Error para la gráfica de desempeño (Desviación respecto a la referencia)
  const errorDesempeno = valid.length > 0 ? Number((presionReferencia - ibcVal).toFixed(2)) : 0;

  // Tipo A: Repetibilidad de las 4 lecturas
  const n = valid.length || 1;
  const uA = n > 1 ? s / Math.sqrt(n) : 0;

  // Tipo B1: Incertidumbre del patrón calibrador (distribución normal k=2)
  const uPat = (Number(patronInfo.incertidumbreExpandida) || 0.1) / (Number(patronInfo.factorK) || 2);

  // Tipo B2: Resolución del IBC (estimación a media división en aneroides de 2 mmHg: semiamplitud a = 1 / 2)
  // Distribución rectangular: u = a / sqrt(3)
  const estimacionRes = Number(resolucionEquipo) >= 2 ? 1 : (Number(resolucionEquipo) || 1);
  const uResEq = estimacionRes / (2 * Math.sqrt(3));

  // Tipo B3: Resolución del patrón (típicamente 0.01 o 0.1 mmHg)
  const resPat = Number(patronInfo.resolucion) || 0.01;
  const uResPat = resPat / (2 * Math.sqrt(3));

  // Incertidumbre Combinada
  const uc = Math.sqrt(
    Math.pow(uA, 2) + Math.pow(uPat, 2) + Math.pow(uResEq, 2) + Math.pow(uResPat, 2)
  );

  // Incertidumbre Expandida U con factor de cobertura k = 2 (Nivel de confianza 95.45%)
  const U = 2 * uc;

  // Error Máximo Permisible según OIML 148-2 Edition 2020 / OIML R 16: ± 3 mmHg
  const emp = 3.0;
  const cumple = Math.abs(error) <= emp;

  return {
    prueba: prueba || 'Con Brazalete',
    valorPatron: ibcVal,
    indicacionIBC: ibcVal,
    presionReferencia,
    correccion,
    correccionEntera,
    lecturas: valid,
    promedio: presionReferencia,
    error,
    errorDesempeno,
    desviacionEstandar: Number(s.toFixed(3)),
    incertidumbreTipoA: Number(uA.toFixed(3)),
    incertidumbreTipoB: Number(Math.sqrt(Math.pow(uPat, 2) + Math.pow(uResEq, 2) + Math.pow(uResPat, 2)).toFixed(3)),
    incertidumbreCombinada: Number(uc.toFixed(3)),
    incertidumbreExpandida: Number(U.toFixed(2)),
    factorK: 2,
    emp,
    cumple,
  };
};

// 4.1 Cálculo de Hermeticidad y Razón de Cambio de Fuga de Aire (OIML 148-2 Edition 2020)
export const calcularFugaAire = (presionInicial = 200, presionFinal = 198, tiempoMinutos = 1) => {
  const pIni = Number(presionInicial) || 0;
  const pFin = Number(presionFinal) || 0;
  const t = Number(tiempoMinutos) || 1;
  const caida = Number((pIni - pFin).toFixed(2));
  const razonCambio = t > 0 ? Number((caida / t).toFixed(2)) : 0;
  // Límite máximo permisible: menor a 4 mmHg por minuto según OIML 148-2:2020
  const limite = 4.0;
  const cumple = razonCambio <= limite;

  return {
    presionInicial: pIni,
    presionFinal: pFin,
    caidaPresion: caida,
    tiempoMinutos: t,
    fugaRazonCambio: razonCambio,
    limitePermisible: limite,
    normaReferencia: 'OIML 148-2 Edition 2020',
    cumple,
  };
};

/**
 * Determina las pesas que componen una carga nominal dada y calcula la incertidumbre combinada de las pesas patrón.
 * En metrología (EURAMET cg-18 / OIML R 76): u_pat = sqrt( sum( (U_i / k_i)^2 ) )
 */
export const calcularIncertidumbrePesasParaCarga = (cargaNominal, listaPesas = []) => {
  const carga = Number(cargaNominal) || 0;
  if (!listaPesas || listaPesas.length === 0 || carga <= 0) {
    return {
      descripcionPesas: `${carga} kg`,
      pesadasUsadas: [],
      uPat: 0.001,
      incertidumbreExpandida: 0.002,
      factorK: 2,
    };
  }

  // Ordenar de mayor valor nominal a menor
  const ordenadas = [...listaPesas].sort(
    (a, b) => (Number(b.valorNominal) || 0) - (Number(a.valorNominal) || 0)
  );

  let rem = carga;
  const usadas = [];

  for (const p of ordenadas) {
    const val = Number(p.valorNominal) || 0;
    if (val > 0 && val <= rem + 0.0001) {
      usadas.push(p);
      rem = Number((rem - val).toFixed(4));
    }
  }

  // Si no hubo coincidencia o la carga excede las pesas disponibles
  if (usadas.length === 0) {
    const base = ordenadas[0] || { incertidumbreExpandida: 0.0032, valorNominal: 20, factorK: 2 };
    const ratio = carga / (Number(base.valorNominal) || 20);
    const uPat =
      ((Number(base.incertidumbreExpandida) || 0.0032) / (Number(base.factorK) || 2)) *
      Math.sqrt(Math.max(1, ratio));
    return {
      descripcionPesas: `${carga} kg (Proporcional a ${base.nombre || 'Patrón'})`,
      pesadasUsadas: [],
      uPat: Number(uPat.toFixed(6)),
      incertidumbreExpandida: Number((uPat * 2).toFixed(4)),
      factorK: 2,
    };
  }

  // Incertidumbre combinada de las pesas sumadas: u_pat = sqrt( sum( (U_i / k_i)^2 ) )
  let sumSq = 0;
  usadas.forEach((p) => {
    const ui = (Number(p.incertidumbreExpandida) || 0.001) / (Number(p.factorK) || 2);
    sumSq += Math.pow(ui, 2);
  });

  if (rem > 0.0001) {
    const uiRem = (0.001 * (rem / 5)) / 2;
    sumSq += Math.pow(uiRem, 2);
  }

  const uPat = Math.sqrt(sumSq);
  const U_expandida = Number((uPat * 2).toFixed(4));
  const desc =
    usadas.map((p) => `${p.valorNominal} kg`).join(' + ') +
    (rem > 0.0001 ? ` (+${rem} kg)` : '');

  return {
    descripcionPesas: desc,
    pesadasUsadas: usadas,
    uPat: Number(uPat.toFixed(6)),
    incertidumbreExpandida: U_expandida,
    factorK: 2,
  };
};

// 5. Básculas y Balanzas: Cálculo de exactitud por punto según SIM MWG7-cg-01/v.00 y OIML R 76
export const calcularPuntoBascula = ({
  cargaNominal = 0,
  valorPatron = 0,
  valorMasaConvencional = null,
  lecturas = [],
  resolucionEquipo = 0.1,
  patronInfo = {},
  patronesLista = null,
  errorExcentricidadMax = 0,
  desvRepetibilidad = 0,
  emp = null,
}) => {
  const carga = Number(cargaNominal || valorPatron || 0);
  const masaConv =
    valorMasaConvencional !== null && valorMasaConvencional !== undefined && valorMasaConvencional !== ''
      ? Number(valorMasaConvencional)
      : Number(valorPatron || carga);

  const valid = lecturas.map((x) => Number(x)).filter((x) => !isNaN(x));
  const prom = promedio(valid);
  const indicacionPromedio = valid.length > 0 ? Number(prom.toFixed(2)) : carga;
  const error = valid.length > 0 ? Number((indicacionPromedio - masaConv).toFixed(4)) : 0;
  const s = desviacionEstandar(valid);

  // Tipo A: Repetibilidad de las lecturas
  const sFinal = desvRepetibilidad > 0 ? desvRepetibilidad : s;
  const uA = valid.length > 1 ? sFinal / Math.sqrt(valid.length) : (sFinal > 0 ? sFinal : 0.001);

  // Tipo B1: Incertidumbre pesas patrón (individual o combinada según juego de pesas)
  let uPat = 0.001;
  let infoPesasDesc = '';
  if (Array.isArray(patronesLista) && patronesLista.length > 0) {
    const resPesas = calcularIncertidumbrePesasParaCarga(carga, patronesLista);
    uPat = resPesas.uPat;
    infoPesasDesc = resPesas.descripcionPesas;
  } else {
    uPat = (Number(patronInfo.incertidumbreExpandida) || 0.005) / (Number(patronInfo.factorK) || 2);
  }

  // Tipo B2: Resolución del equipo uRes = d / (2 * sqrt(3))
  const resEq = Number(resolucionEquipo) || 0.1;
  const uRes = resEq / (2 * Math.sqrt(3));

  // Tipo B3: Excentricidad
  const uEcc = (Number(errorExcentricidadMax) || 0) / (2 * Math.sqrt(3));

  // Tipo B4: Empuje del aire y deriva según Guía SIM MWG7-cg-01/v.00
  const uAire = (carga * 1.5e-5) / Math.sqrt(3);

  // Incertidumbre Combinada
  const uc = Math.sqrt(
    Math.pow(uA, 2) + Math.pow(uPat, 2) + Math.pow(uRes, 2) + Math.pow(uEcc, 2) + Math.pow(uAire, 2)
  );

  const U = 2 * uc;
  const U_rounded = U < 0.1 ? Number(U.toFixed(3)) : Number(U.toFixed(2));

  // EMP según OIML R 76-1 Clase III (Instrumentos de funcionamiento no automático):
  // 0 a 500 e: EMP = ± 1 e (para d=0.1 kg, e=0.1 kg -> 0 a 50 kg: ± 0.1 kg)
  // > 500 e a 2000 e: EMP = ± 2 e (50 kg a 200 kg: ± 0.2 kg)
  let empCalculado = 0.2;
  const eVal = resEq;
  if (carga <= 500 * eVal) {
    empCalculado = 1 * eVal;
  } else if (carga <= 2000 * eVal) {
    empCalculado = 2 * eVal;
  } else {
    empCalculado = 3 * eVal;
  }
  const empVal = Number(emp) > 0 ? Number(emp) : empCalculado;
  const cumple = Math.abs(error) <= empVal;

  return {
    valorNominal: carga,
    cargaNominal: carga,
    valorPatron: masaConv,
    valorMasaConvencional: masaConv,
    indicacionPromedio,
    promedio: indicacionPromedio,
    pesasUtilizadas: infoPesasDesc,
    lecturas: valid,
    error,
    desviacionEstandar: Number(s.toFixed(4)),
    incertidumbreTipoA: Number(uA.toFixed(4)),
    incertidumbreTipoB: Number(Math.sqrt(Math.pow(uPat, 2) + Math.pow(uRes, 2) + Math.pow(uEcc, 2)).toFixed(4)),
    incertidumbreCombinada: Number(uc.toFixed(4)),
    incertidumbreExpandida: U_rounded,
    factorK: 2,
    emp: empVal,
    cumple,
  };
};

export const calcularRepetibilidadBascula = (lecturas = []) => {
  const valid = lecturas.map((x) => Number(x)).filter((x) => !isNaN(x));
  if (valid.length === 0) return { promedio: 0, desviacionEstandar: 0, deltaMax: 0 };
  const prom = promedio(valid);
  const s = desviacionEstandar(valid);
  const minVal = Math.min(...valid);
  const maxVal = Math.max(...valid);
  const deltaMax = Number((maxVal - minVal).toFixed(2));
  return {
    promedio: Number(prom.toFixed(2)),
    desviacionEstandar: Number(s.toFixed(4)),
    deltaMax,
  };
};

// 6. Micropipetas: Cálculo volumétrico según NTC-ISO 8655-6:2014 e ISO 8655-2
export const calcularPuntoMicropipeta = ({
  nominal = 50, // µL (Volumen Seleccionado)
  volumenSeleccionado = null,
  volumenCalculado = null,
  errorSistematico = null,
  incertidumbreExpandida = null,
  errorAleatorio = null,
  factorK = 2,
  porcentaje = 100,
  lecturasMasa = [], // mg
  factorZ = 1.0029, // µL/mg
  resolucionEquipo = 0.5, // µL
  resolucionBalanza = 0.01, // mg
  incertBalanza = 0.02, // mg
  empSistematicoPct = 1.0, // % según tabla ISO 8655-2
  empAleatorioPct = 0.5, // CV%
}) => {
  const volSel =
    volumenSeleccionado !== null && volumenSeleccionado !== undefined && volumenSeleccionado !== ''
      ? Number(volumenSeleccionado)
      : Number(nominal || 0);

  const validMasa = Array.isArray(lecturasMasa)
    ? lecturasMasa.map((x) => Number(x)).filter((x) => !isNaN(x) && x > 0)
    : [];
  const z = Number(factorZ) || 1.0029;

  // Convertir cada pesada de masa a volumen: V = m * Z
  const volumenesCalculados = validMasa.map((m) => Number((m * z).toFixed(3)));
  const volMedioGrav = validMasa.length > 0 ? promedio(volumenesCalculados) : volSel;

  // Volumen Calculado (µl): usa valor explícito si fue editado directamente o el promedio gravimétrico
  const volCalc =
    volumenCalculado !== null && volumenCalculado !== undefined && volumenCalculado !== ''
      ? Number(volumenCalculado)
      : Number(volMedioGrav.toFixed(2));

  // Error Sistemático Calculado (µl): es = Vcalc - Vsel
  const errSistCalc = Number((volCalc - volSel).toFixed(2));
  const errSistFinal =
    errorSistematico !== null && errorSistematico !== undefined && errorSistematico !== ''
      ? Number(errorSistematico)
      : Number((volCalc - volSel).toFixed(1));

  const errorSistematicoPct = volSel > 0 ? (errSistCalc / volSel) * 100 : 0;

  // Error Aleatorio Calculado (µl): desviación estándar repetibilidad s (µl)
  const sV = validMasa.length > 1 ? desviacionEstandar(volumenesCalculados) : 0.08;
  const errAleatFinal =
    errorAleatorio !== null && errorAleatorio !== undefined && errorAleatorio !== ''
      ? Number(errorAleatorio)
      : Number(sV.toFixed(2));

  const cvPct = volCalc > 0 ? (errAleatFinal / volCalc) * 100 : 0;

  // Incertidumbres (GUM / NTC-ISO 8655-6)
  const n = validMasa.length > 1 ? validMasa.length : 10;
  const uA = errAleatFinal / Math.sqrt(n);
  const uBal = ((Number(incertBalanza) || 0.02) * z) / 2;
  const uRes = (Number(resolucionEquipo) || 0.5) / (2 * Math.sqrt(3));
  const uc = Math.sqrt(Math.pow(uA, 2) + Math.pow(uBal, 2) + Math.pow(uRes, 2));
  const kVal = Number(factorK) || 2;
  const U_calc = kVal * uc;

  const U_final =
    incertidumbreExpandida !== null && incertidumbreExpandida !== undefined && incertidumbreExpandida !== ''
      ? Number(incertidumbreExpandida)
      : Number(Math.max(U_calc, 0.3).toFixed(1));

  const empSistVal = Number(empSistematicoPct) || 2.0;
  const empAleatVal = Number(empAleatorioPct) || 1.0;
  const cumpleSistematico = Math.abs(errorSistematicoPct) <= empSistVal || Math.abs(errSistFinal) <= U_final;
  const cumpleAleatorio = cvPct <= empAleatVal || errAleatFinal <= U_final;
  const cumple = cumpleSistematico && cumpleAleatorio;

  return {
    nominal: volSel,
    volumenSeleccionado: volSel,
    volumenCalculado: volCalc,
    porcentaje: Number(porcentaje),
    lecturasMasa: validMasa,
    volumenesCalculados,
    promedio: Number(volCalc.toFixed(2)),
    error: errSistFinal,
    errorSistematico: errSistFinal,
    errorSistematicoPct: Number(errorSistematicoPct.toFixed(2)),
    errorAleatorio: errAleatFinal,
    desviacionAleatoria: errAleatFinal,
    desviacionEstandar: Number(errAleatFinal.toFixed(2)),
    coeficienteVariacionPct: Number(cvPct.toFixed(2)),
    incertidumbreTipoA: Number(uA.toFixed(4)),
    incertidumbreTipoB: Number(Math.sqrt(Math.pow(uBal, 2) + Math.pow(uRes, 2)).toFixed(4)),
    incertidumbreCombinada: Number(uc.toFixed(4)),
    incertidumbreExpandida: U_final,
    factorK: kVal,
    empSistematicoPct: empSistVal,
    empAleatorioPct: empAleatVal,
    cumple,
  };
};

/**
 * 7. Clasificador inteligente de equipos biomédicos hacia plantillas de calibración
 * Identifica si un equipo es Báscula (masa), Tensiómetro (presión) o Micropipeta (volumen).
 */
export const detectarTipoPlantillaCalibracion = (nombreEquipo) => {
  const norm = String(nombreEquipo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 1. Micropipetas / Pipetas / Aparatos volumétricos accionados por pistón
  if (
    norm.includes('micropipeta') ||
    norm.includes('pipeta') ||
    norm.includes('dispensador') ||
    norm.includes('volumetric') ||
    norm.includes('piston') ||
    norm.includes('bureta') ||
    norm.includes('dilutor')
  ) {
    return {
      tipo: 'volumen_micropipeta',
      etiqueta: 'Micropipeta / Volumen',
      badgeColor: '#7e22ce',
      badgeBg: '#f3e8ff',
    };
  }

  // 2. Básculas / Balanzas / Pesas
  if (
    norm.includes('bascula') ||
    norm.includes('balanza') ||
    norm.includes('pesa') ||
    norm.includes('gramera') ||
    norm.includes('tallimetro') ||
    norm.includes('ipfna')
  ) {
    return {
      tipo: 'masa_bascula',
      etiqueta: 'Báscula / Masa',
      badgeColor: '#b45309',
      badgeBg: '#fef3c7',
    };
  }

  // 3. Tensiómetros / Esfigmomanómetros / Presión
  if (
    norm.includes('tensiometro') ||
    norm.includes('esfigmo') ||
    norm.includes('aneroide') ||
    norm.includes('presion') ||
    norm.includes('baumanometro')
  ) {
    return {
      tipo: 'presion_tensiometro',
      etiqueta: 'Tensiómetro / Presión',
      badgeColor: '#0369a1',
      badgeBg: '#e0f2fe',
    };
  }

  // Por defecto (compatible con calibración analógica/digital general)
  return {
    tipo: 'presion_tensiometro',
    etiqueta: 'Calibración Biomédica',
    badgeColor: '#0284c7',
    badgeBg: '#e0f2fe',
  };
};

/**
 * Determina la plantilla efectiva de un certificado existente evaluando primero
 * el nombre y unidad del equipo (para corregir certificados guardados por error como tensiómetro).
 */
export const resolverTipoPlantillaCertificado = (certificado = {}) => {
  const nombre = String(certificado?.datosEquipo?.nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const unidad = String(certificado?.datosEquipo?.unidad || '').toLowerCase();
  const procedimiento = String(certificado?.procedimiento || '').toLowerCase();

  if (
    nombre.includes('micropipeta') ||
    nombre.includes('pipeta') ||
    nombre.includes('dispensador') ||
    nombre.includes('volumetric') ||
    nombre.includes('piston') ||
    unidad.includes('µl') ||
    unidad.includes('ul') ||
    procedimiento.includes('8655')
  ) {
    return 'volumen_micropipeta';
  }

  if (
    nombre.includes('bascula') ||
    nombre.includes('balanza') ||
    nombre.includes('pesa') ||
    nombre.includes('gramera') ||
    nombre.includes('tallimetro') ||
    nombre.includes('ipfna') ||
    unidad === 'kg' ||
    unidad === 'g' ||
    procedimiento.includes('mc-dt-i-034') ||
    procedimiento.includes('pesaje')
  ) {
    return 'masa_bascula';
  }

  if (
    certificado?.tipoPlantilla === 'masa_bascula' ||
    certificado?.tipoPlantilla === 'volumen_micropipeta' ||
    certificado?.tipoPlantilla === 'presion_tensiometro'
  ) {
    return certificado.tipoPlantilla;
  }

  return 'presion_tensiometro';
};

export const OBS_DEFAULT_TENSIOMETRO =
  '* La fuga de aire del equipo se dió a una razón de cambio de 17,27 mmHg por minuto. Según la Recommendation Noninvasive non-automated sphygmomanometers OIML 148-2 Edition 2020, la fuga de aire para estos equipos debe ser menor a 4 mmHg por minuto.';

export const OBS_DEFAULT_BASCULA =
  'El instrumento de pesar de funcionamiento no automático (IPFNA) fue calibrado en su lugar de uso (Taller Biomédico). Se verificó retorno a cero, nivelación mecánica y estabilidad de lectura. Se adhiere etiqueta metrológica de calibración indicando fecha y vigencia.';

export const OBS_DEFAULT_MICROPIPETA = 'NO HAY OBSERVACIONES.';

export const contieneTextoFugaTensiometro = (texto = '') =>
  /fuga|oiml\s*148|mmhg|sphygmomanometer|esfigmoman|hermeticidad|brazalete|neumatic/i.test(
    String(texto || '')
  );

export const obtenerObservacionesPorPlantilla = (tipoPlantilla, observacionesActuales = '') => {
  const obs = String(observacionesActuales || '').trim();
  if (tipoPlantilla === 'masa_bascula') {
    if (!obs || contieneTextoFugaTensiometro(obs) || /8655|portapuntas|pist[oó]n/i.test(obs) || obs === 'NO HAY OBSERVACIONES.' || obs === 'NINGUNA') {
      return OBS_DEFAULT_BASCULA;
    }
    return obs;
  }
  if (tipoPlantilla === 'volumen_micropipeta') {
    if (!obs || contieneTextoFugaTensiometro(obs) || /ipfna|taller biom[eé]dico|nivelaci[oó]n mec[aá]nica/i.test(obs) || obs === 'NINGUNA') {
      return OBS_DEFAULT_MICROPIPETA;
    }
    return obs;
  }
  if (!obs || obs === OBS_DEFAULT_BASCULA || obs === OBS_DEFAULT_MICROPIPETA || obs === 'NINGUNA' || obs === 'NO HAY OBSERVACIONES.') {
    return OBS_DEFAULT_TENSIOMETRO;
  }
  return obs;
};


