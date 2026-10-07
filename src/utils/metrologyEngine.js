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

// 4. Tensiómetros: Cálculo de incertidumbre por punto
export const calcularPuntoTensiometro = ({
  valorPatron = 0,
  lecturas = [],
  resolucionEquipo = 2, // 2 mmHg típico en aneroides, 1 en digitales
  patronInfo = {},
}) => {
  const valid = lecturas.map((x) => Number(x)).filter((x) => !isNaN(x));
  const prom = promedio(valid);
  const error = valid.length > 0 ? prom - Number(valorPatron) : 0;
  const s = desviacionEstandar(valid);

  // Tipo A: repetibilidad de las medidas
  const uA = valid.length > 1 ? s / Math.sqrt(valid.length) : 0;

  // Tipo B1: Incertidumbre del patrón
  const uPat = (Number(patronInfo.incertidumbreExpandida) || 0.1) / (Number(patronInfo.factorK) || 2);

  // Tipo B2: Resolución del equipo (distribución rectangular a = res / 2)
  const uResEq = (Number(resolucionEquipo) || 2) / (2 * Math.sqrt(3));

  // Tipo B3: Resolución del patrón
  const uResPat = (Number(patronInfo.resolucion) || 0.05) / (2 * Math.sqrt(3));

  // Incertidumbre Combinada
  const uc = Math.sqrt(
    Math.pow(uA, 2) + Math.pow(uPat, 2) + Math.pow(uResEq, 2) + Math.pow(uResPat, 2)
  );

  // Incertidumbre Expandida k = 2 (95.45%)
  const U = 2 * uc;

  // Error Máximo Permisible según OIML R 16: +/- 3 mmHg
  const emp = 3.0;
  const cumple = Math.abs(error) <= emp;

  return {
    valorPatron: Number(valorPatron),
    lecturas: valid,
    promedio: Number(prom.toFixed(2)),
    error: Number(error.toFixed(2)),
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

// 5. Básculas y Balanzas: Cálculo de exactitud por punto
export const calcularPuntoBascula = ({
  valorPatron = 0,
  lecturas = [],
  resolucionEquipo = 0.1,
  patronInfo = {},
  errorExcentricidadMax = 0,
  desvRepetibilidad = 0,
  emp = 0.5,
}) => {
  const valid = lecturas.map((x) => Number(x)).filter((x) => !isNaN(x));
  const prom = promedio(valid);
  const error = valid.length > 0 ? prom - Number(valorPatron) : 0;
  const s = desviacionEstandar(valid);

  // Tipo A: Puede ser la repetibilidad previa o la de este punto
  const sFinal = desvRepetibilidad > 0 ? desvRepetibilidad : s;
  const uA = valid.length > 1 ? sFinal / Math.sqrt(valid.length) : sFinal;

  // Tipo B1: Incertidumbre pesas patrón
  const uPat = (Number(patronInfo.incertidumbreExpandida) || 0.005) / (Number(patronInfo.factorK) || 2);

  // Tipo B2: Resolución del equipo
  const uRes = (Number(resolucionEquipo) || 0.1) / (2 * Math.sqrt(3));

  // Tipo B3: Excentricidad si aplica
  const uEcc = (Number(errorExcentricidadMax) || 0) / (2 * Math.sqrt(3));

  // Incertidumbre Combinada
  const uc = Math.sqrt(
    Math.pow(uA, 2) + Math.pow(uPat, 2) + Math.pow(uRes, 2) + Math.pow(uEcc, 2)
  );

  const U = 2 * uc;
  const empVal = Number(emp) > 0 ? Number(emp) : Number(resolucionEquipo) * 3;
  const cumple = Math.abs(error) <= empVal;

  return {
    valorPatron: Number(valorPatron),
    lecturas: valid,
    promedio: Number(prom.toFixed(3)),
    error: Number(error.toFixed(3)),
    desviacionEstandar: Number(s.toFixed(4)),
    incertidumbreTipoA: Number(uA.toFixed(4)),
    incertidumbreTipoB: Number(Math.sqrt(Math.pow(uPat, 2) + Math.pow(uRes, 2) + Math.pow(uEcc, 2)).toFixed(4)),
    incertidumbreCombinada: Number(uc.toFixed(4)),
    incertidumbreExpandida: Number(U.toFixed(3)),
    factorK: 2,
    emp: empVal,
    cumple,
  };
};

// 6. Micropipetas: Cálculo volumétrico según ISO 8655
export const calcularPuntoMicropipeta = ({
  nominal = 1000, // µL
  porcentaje = 100,
  lecturasMasa = [], // mg
  factorZ = 1.0029, // µL/mg
  resolucionBalanza = 0.01, // mg
  incertBalanza = 0.02, // mg
  empSistematicoPct = 1.0, // % según tabla ISO 8655-2
  empAleatorioPct = 0.5, // CV%
}) => {
  const validMasa = lecturasMasa.map((x) => Number(x)).filter((x) => !isNaN(x));
  const z = Number(factorZ) || 1.0029;

  // Convertir cada pesada de masa a volumen: V = m * Z
  const volumenesCalculados = validMasa.map((m) => Number((m * z).toFixed(3)));
  const volMedio = promedio(volumenesCalculados);

  // Error Sistemático: es = Vmed - V0
  const errorSistematico = validMasa.length > 0 ? volMedio - Number(nominal) : 0;
  const errorSistematicoPct = Number(nominal) > 0 ? (errorSistematico / Number(nominal)) * 100 : 0;

  // Error Aleatorio: desviación estándar y coeficiente de variación CV%
  const sV = desviacionEstandar(volumenesCalculados);
  const cvPct = volMedio > 0 ? (sV / volMedio) * 100 : 0;

  // Incertidumbres
  const uA = validMasa.length > 1 ? sV / Math.sqrt(validMasa.length) : 0;
  const uBal = (Number(incertBalanza) || 0.02) / 2;
  const uRes = (Number(resolucionBalanza) || 0.01) / (2 * Math.sqrt(3));
  const uc = Math.sqrt(Math.pow(uA, 2) + Math.pow(uBal, 2) + Math.pow(uRes, 2));
  const U = 2 * uc;

  const cumpleSistematico = Math.abs(errorSistematicoPct) <= Number(empSistematicoPct);
  const cumpleAleatorio = cvPct <= Number(empAleatorioPct);
  const cumple = cumpleSistematico && cumpleAleatorio;

  return {
    nominal: Number(nominal),
    porcentaje: Number(porcentaje),
    lecturasMasa: validMasa,
    volumenesCalculados,
    promedio: Number(volMedio.toFixed(3)),
    error: Number(errorSistematico.toFixed(3)),
    errorSistematicoPct: Number(errorSistematicoPct.toFixed(2)),
    desviacionEstandar: Number(sV.toFixed(4)),
    coeficienteVariacionPct: Number(cvPct.toFixed(2)),
    incertidumbreTipoA: Number(uA.toFixed(4)),
    incertidumbreTipoB: Number(Math.sqrt(Math.pow(uBal, 2) + Math.pow(uRes, 2)).toFixed(4)),
    incertidumbreCombinada: Number(uc.toFixed(4)),
    incertidumbreExpandida: Number(U.toFixed(3)),
    factorK: 2,
    empSistematicoPct: Number(empSistematicoPct),
    empAleatorioPct: Number(empAleatorioPct),
    cumple,
  };
};
