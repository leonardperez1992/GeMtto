import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import {
  apiCrearCalibracion,
  apiSiguienteConsecutivoCalibracion,
  apiPatrones,
} from '../utils/api';
import request from '../utils/request';
import {
  calcularPuntoTensiometro,
  calcularPuntoBascula,
  calcularPuntoMicropipeta,
  calcularFactorZ,
  promedio,
  desviacionEstandar,
} from '../utils/metrologyEngine';
import CalibrationChart from '../components/CalibrationChart';
import {
  FaArrowLeft,
  FaSave,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaTrash,
  FaEraser,
  FaBalanceScale,
  FaFlask,
} from 'react-icons/fa';
import { MdSpeed } from 'react-icons/md';

export default function CreateCalibracion() {
  const navigate = useNavigate();

  // Estados generales de datos
  const [listaPatrones, setListaPatrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Referencias de firmas digitales
  const firmaCalibroRef = useRef({});
  const firmaAproboRef = useRef({});

  // Tipo de plantilla seleccionada
  const [tipoPlantilla, setTipoPlantilla] = useState('presion_tensiometro');

  // Formulario general
  const [consecutivo, setConsecutivo] = useState('');
  const [fechaCalibracion, setFechaCalibracion] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [fechaEmision, setFechaEmision] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [fechaProximaCalibracion, setFechaProximaCalibracion] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  // Datos del Equipo (Entrada 100% manual)
  const [datosEquipo, setDatosEquipo] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    serie: '',
    placaInventario: '',
    ubicacion: '',
    servicio: '',
    resolucion: 2,
    unidad: 'mmHg',
  });

  // Datos del Cliente / IPS (Entrada 100% manual)
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    nit: '',
    sede: '',
    direccion: '',
    ciudad: '',
    telefono: '',
  });

  // Condiciones Ambientales
  const [condiciones, setCondiciones] = useState({
    temperatura: 20,
    incertTemperatura: 0.5,
    humedadRelativa: 55,
    incertHumedad: 2,
    presionAtmosferica: 1013,
  });

  // Patrón Individual de Referencia (Tensiómetros y Micropipetas)
  const [patronSeleccionadoId, setPatronSeleccionadoId] = useState('');
  const [datosPatron, setDatosPatron] = useState({
    codigo: '',
    nombre: '',
    marca: '',
    modelo: '',
    serie: '',
    certificadoCalibracion: '',
    trazabilidad: '',
    fechaVencimiento: '',
    resolucion: 0.1,
    incertidumbreExpandida: 0.2,
    factorK: 2,
  });

  // Múltiples Patrones / Juego de Pesas Patrón (Básculas de Masa: 5, 10, 20 kg...)
  const [patronesLista, setPatronesLista] = useState([
    {
      codigo: 'PAT-M-05K',
      nombre: 'Pesa Patrón 5 kg',
      valorNominal: 5,
      unidad: 'kg',
      claseExactitud: 'M1',
      serie: 'SN-05K-01',
      certificadoCalibracion: 'ONAC-M1-5KG-2025',
      trazabilidad: 'INM / Lab Acreditado ONAC',
      incertidumbreExpandida: 0.0008,
      factorK: 2,
    },
    {
      codigo: 'PAT-M-10K',
      nombre: 'Pesa Patrón 10 kg',
      valorNominal: 10,
      unidad: 'kg',
      claseExactitud: 'M1',
      serie: 'SN-10K-01',
      certificadoCalibracion: 'ONAC-M1-10KG-2025',
      trazabilidad: 'INM / Lab Acreditado ONAC',
      incertidumbreExpandida: 0.0016,
      factorK: 2,
    },
    {
      codigo: 'PAT-M-20K-1',
      nombre: 'Pesa Patrón 20 kg (#1)',
      valorNominal: 20,
      unidad: 'kg',
      claseExactitud: 'M1',
      serie: 'SN-20K-01',
      certificadoCalibracion: 'ONAC-M1-20KG-2025-A',
      trazabilidad: 'INM / Lab Acreditado ONAC',
      incertidumbreExpandida: 0.0032,
      factorK: 2,
    },
    {
      codigo: 'PAT-M-20K-2',
      nombre: 'Pesa Patrón 20 kg (#2)',
      valorNominal: 20,
      unidad: 'kg',
      claseExactitud: 'M1',
      serie: 'SN-20K-02',
      certificadoCalibracion: 'ONAC-M1-20KG-2025-B',
      trazabilidad: 'INM / Lab Acreditado ONAC',
      incertidumbreExpandida: 0.0032,
      factorK: 2,
    },
  ]);

  // Procedimiento Metrológico
  const [procedimiento, setProcedimiento] = useState(
    'Procedimiento de calibración por comparación directa según recomendación OIML R 16.'
  );

  // 1. Datos específicos Tensiómetro
  const [hermeticidad, setHermeticidad] = useState({
    presionInicial: 200,
    presionFinal: 198,
    caidaPresion: 2,
    tiempoMinutos: 1,
    limitePermisible: 4,
    cumple: true,
  });

  const [errorCero, setErrorCero] = useState({
    cumple: true,
    observacion: 'Dentro de la tolerancia del fabricante',
  });

  const [puntosTensiometro, setPuntosTensiometro] = useState([
    { valorPatron: 50, lecturas: [50, 50, 50] },
    { valorPatron: 100, lecturas: [100, 100, 100] },
    { valorPatron: 150, lecturas: [150, 150, 150] },
    { valorPatron: 200, lecturas: [200, 200, 200] },
    { valorPatron: 250, lecturas: [250, 250, 250] },
    { valorPatron: 300, lecturas: [300, 300, 300] },
  ]);

  // 2. Datos específicos Báscula
  const [repetibilidadBascula, setRepetibilidadBascula] = useState({
    cargaNominal: 20,
    lecturas: [20.0, 20.0, 20.0, 20.0, 20.0],
    promedio: 20.0,
    desviacionEstandar: 0,
  });

  const [excentricidadBascula, setExcentricidadBascula] = useState({
    cargaNominal: 20,
    centro: 20.0,
    pos1: 20.0,
    pos2: 20.0,
    pos3: 20.0,
    pos4: 20.0,
    errorMaximo: 0,
    emp: 0.2,
    cumple: true,
  });

  const [puntosBascula, setPuntosBascula] = useState([
    { valorPatron: 5, lecturas: [5.0, 5.0, 5.0] },
    { valorPatron: 10, lecturas: [10.0, 10.0, 10.0] },
    { valorPatron: 20, lecturas: [20.0, 20.0, 20.0] },
    { valorPatron: 30, lecturas: [30.0, 30.0, 30.0] },
    { valorPatron: 50, lecturas: [50.0, 50.0, 50.0] },
  ]);

  // 3. Datos específicos Micropipeta
  const [micropipetaInfo, setMicropipetaInfo] = useState({
    tipo: 'Monocanal volumen variable',
    volumenNominal: 1000,
    temperaturaAgua: 20,
    presionAtmosferica: 1013,
    factorZ: 1.0029,
    resolucionBalanza: 0.01,
    incertBalanza: 0.02,
  });

  const [puntosMicropipeta, setPuntosMicropipeta] = useState([
    {
      nominal: 100,
      porcentaje: 10,
      lecturasMasa: [99.7, 99.8, 99.6, 99.7, 99.8],
      empSistematicoPct: 2.5,
      empAleatorioPct: 1.5,
    },
    {
      nominal: 500,
      porcentaje: 50,
      lecturasMasa: [498.5, 498.7, 498.6, 498.5, 498.6],
      empSistematicoPct: 1.2,
      empAleatorioPct: 0.8,
    },
    {
      nominal: 1000,
      porcentaje: 100,
      lecturasMasa: [997.1, 997.3, 997.2, 997.0, 997.2],
      empSistematicoPct: 0.8,
      empAleatorioPct: 0.4,
    },
  ]);

  // Responsables y firmas
  const [calibro, setCalibro] = useState({
    nombre: '',
    cargo: 'Ingeniero Biomédico / Metrólogo',
    tarjetaProfesional: '',
  });

  const [aprobo, setAprobo] = useState({
    nombre: '',
    cargo: 'Director Técnico de Calibración',
    tarjetaProfesional: '',
  });

  const [observaciones, setObservaciones] = useState(
    'El instrumento fue calibrado en condiciones ambientales controladas y estables. Los resultados aplican únicamente al ítem calibrado.'
  );

  // Cargar consecutivo y patrones
  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      try {
        const [resPat, resCons] = await Promise.all([
          request({ link: apiPatrones, method: 'GET' }).catch(() => null),
          request({ link: apiSiguienteConsecutivoCalibracion, method: 'GET' }).catch(() => null),
        ]);

        if (active) {
          if (resPat?.success && Array.isArray(resPat.patrones)) {
            setListaPatrones(resPat.patrones);
          }

          if (resCons?.success && resCons.consecutivo) {
            setConsecutivo(resCons.consecutivo);
          } else {
            const yr = new Date().getFullYear();
            setConsecutivo(`CAL-${yr}-0001`);
          }
        }
      } catch (e) {
        console.error('Error en inicialización:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, []);

  // Al cambiar la plantilla, ajustar procedimiento y unidades
  useEffect(() => {
    if (tipoPlantilla === 'presion_tensiometro') {
      setProcedimiento(
        'Procedimiento de calibración por comparación directa con manómetro patrón digital según recomendación internacional OIML R 16.'
      );
      setDatosEquipo((prev) => ({ ...prev, unidad: 'mmHg', resolucion: 2 }));
    } else if (tipoPlantilla === 'masa_bascula') {
      setProcedimiento(
        'Procedimiento de calibración para instrumentos de pesaje no automáticos según guía EURAMET cg-18 y OIML R 76.'
      );
      setDatosEquipo((prev) => ({ ...prev, unidad: 'kg', resolucion: 0.1 }));
    } else if (tipoPlantilla === 'volumen_micropipeta') {
      setProcedimiento(
        'Procedimiento gravimétrico de calibración de aparatos volumétricos accionados por pistón según ISO 8655-2 e ISO 8655-6.'
      );
      setDatosEquipo((prev) => ({ ...prev, unidad: 'µL', resolucion: 0.1 }));
    }
  }, [tipoPlantilla]);

  // Al seleccionar un patrón del banco (para tensiómetros o micropipetas)
  const handlePatronChange = (e) => {
    const patId = e.target.value;
    setPatronSeleccionadoId(patId);
    const pat = listaPatrones.find((p) => p._id === patId);
    if (pat) {
      setDatosPatron({
        codigo: pat.codigo || '',
        nombre: pat.nombre || '',
        marca: pat.marca || '',
        modelo: pat.modelo || '',
        serie: pat.serie || '',
        certificadoCalibracion: pat.certificadoCalibracion || '',
        trazabilidad: pat.entidadAcreditadora || '',
        fechaVencimiento: pat.fechaVencimiento || '',
        resolucion: pat.resolucion || 0.1,
        incertidumbreExpandida: pat.incertidumbreExpandida || 0.2,
        factorK: pat.factorK || 2,
      });
    }
  };

  // Manejo de pesas patrón para Básculas
  const agregarPesaPatron = (nominal = 20, nombre = '') => {
    const idx = patronesLista.length + 1;
    let uDefault = 0.0032;
    if (nominal === 5) uDefault = 0.0008;
    if (nominal === 10) uDefault = 0.0016;
    if (nominal === 20) uDefault = 0.0032;

    setPatronesLista((prev) => [
      ...prev,
      {
        codigo: `PAT-M-${nominal}K-${idx}`,
        nombre: nombre || `Pesa Patrón ${nominal} kg`,
        valorNominal: nominal,
        unidad: 'kg',
        claseExactitud: 'M1',
        serie: `SN-${nominal}K-0${idx}`,
        certificadoCalibracion: `ONAC-M1-${nominal}KG-2025`,
        trazabilidad: 'INM / Lab Acreditado ONAC',
        incertidumbreExpandida: uDefault,
        factorK: 2,
      },
    ]);
  };

  const eliminarPesaPatron = (idx) => {
    setPatronesLista((prev) => prev.filter((_, i) => i !== idx));
  };

  const actualizarPesaPatron = (idx, campo, valor) => {
    setPatronesLista((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
  };

  // Recalcular Factor Z de micropipeta automáticamente
  useEffect(() => {
    const z = calcularFactorZ(
      micropipetaInfo.temperaturaAgua,
      micropipetaInfo.presionAtmosferica
    );
    setMicropipetaInfo((prev) => ({ ...prev, factorZ: z }));
  }, [micropipetaInfo.temperaturaAgua, micropipetaInfo.presionAtmosferica]);

  // Recalcular caída de hermeticidad
  const handleHermeticidadChange = (campo, val) => {
    const num = Number(val);
    setHermeticidad((prev) => {
      const updated = { ...prev, [campo]: num };
      const caida = Math.max(0, updated.presionInicial - updated.presionFinal);
      updated.caidaPresion = Number(caida.toFixed(1));
      updated.cumple = caida <= updated.limitePermisible;
      return updated;
    });
  };

  // CÁLCULOS METROLÓGICOS EN TIEMPO REAL

  // 1. Puntos calculados Tensiómetro
  const puntosTensiometroCalculados = puntosTensiometro.map((p) =>
    calcularPuntoTensiometro({
      valorPatron: p.valorPatron,
      lecturas: p.lecturas,
      resolucionEquipo: datosEquipo.resolucion,
      patronInfo: datosPatron,
    })
  );

  // 2. Puntos calculados Báscula (con juego de múltiples pesas patrón)
  const desvRep = desviacionEstandar(repetibilidadBascula.lecturas);
  const puntosBasculaCalculados = puntosBascula.map((p) =>
    calcularPuntoBascula({
      valorPatron: p.valorPatron,
      lecturas: p.lecturas,
      resolucionEquipo: datosEquipo.resolucion,
      patronInfo: datosPatron,
      patronesLista: patronesLista,
      errorExcentricidadMax: excentricidadBascula.errorMaximo,
      desvRepetibilidad: desvRep,
      emp: datosEquipo.resolucion * 2,
    })
  );

  // 3. Puntos calculados Micropipeta
  const puntosMicropipetaCalculados = puntosMicropipeta.map((p) =>
    calcularPuntoMicropipeta({
      nominal: p.nominal,
      porcentaje: p.porcentaje,
      lecturasMasa: p.lecturasMasa,
      factorZ: micropipetaInfo.factorZ,
      resolucionBalanza: micropipetaInfo.resolucionBalanza,
      incertBalanza: micropipetaInfo.incertBalanza,
      empSistematicoPct: p.empSistematicoPct,
      empAleatorioPct: p.empAleatorioPct,
    })
  );

  // Determinar Dictamen Global
  const todosCumplen = () => {
    if (tipoPlantilla === 'presion_tensiometro') {
      return (
        hermeticidad.cumple &&
        errorCero.cumple &&
        puntosTensiometroCalculados.every((p) => p.cumple)
      );
    }
    if (tipoPlantilla === 'masa_bascula') {
      return (
        excentricidadBascula.cumple &&
        puntosBasculaCalculados.every((p) => p.cumple)
      );
    }
    if (tipoPlantilla === 'volumen_micropipeta') {
      return puntosMicropipetaCalculados.every((p) => p.cumple);
    }
    return true;
  };

  const dictamenCalculado = todosCumplen() ? 'CONFORME' : 'NO CONFORME';

  // Guardar certificado
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!consecutivo) {
      alert('Debe tener un número de certificado.');
      return;
    }
    if (!datosCliente.nombre) {
      alert('Por favor ingrese el nombre de la institución / IPS / cliente.');
      return;
    }
    if (!datosEquipo.nombre) {
      alert('Por favor ingrese el nombre del instrumento a calibrar.');
      return;
    }
    if (!datosEquipo.serie) {
      alert('Por favor ingrese el número de serie del instrumento.');
      return;
    }

    setGuardando(true);

    // Captura de firmas
    let firmaCalibro = '';
    let firmaAprobo = '';
    if (firmaCalibroRef.current?.toDataURL && !firmaCalibroRef.current.isEmpty()) {
      firmaCalibro = firmaCalibroRef.current.toDataURL();
    }
    if (firmaAproboRef.current?.toDataURL && !firmaAproboRef.current.isEmpty()) {
      firmaAprobo = firmaAproboRef.current.toDataURL();
    }

    // Estructurar puntos según la plantilla
    let puntosParaGuardar = [];
    let datosCalibracion = {};

    if (tipoPlantilla === 'presion_tensiometro') {
      puntosParaGuardar = puntosTensiometroCalculados;
      datosCalibracion = {
        hermeticidad,
        errorCero,
        puntos: puntosParaGuardar,
      };
    } else if (tipoPlantilla === 'masa_bascula') {
      puntosParaGuardar = puntosBasculaCalculados;
      datosCalibracion = {
        repetibilidadBascula: {
          ...repetibilidadBascula,
          promedio: promedio(repetibilidadBascula.lecturas),
          desviacionEstandar: desvRep,
        },
        excentricidadBascula,
        puntos: puntosParaGuardar,
      };
    } else if (tipoPlantilla === 'volumen_micropipeta') {
      puntosParaGuardar = puntosMicropipetaCalculados;
      datosCalibracion = {
        micropipetaInfo,
        puntos: puntosParaGuardar,
      };
    }

    const payload = {
      numeroCertificado: consecutivo,
      fechaCalibracion,
      fechaEmision,
      fechaProximaCalibracion,
      equipoId: null,
      ipsId: null,
      datosEquipo,
      datosCliente,
      tipoPlantilla,
      condicionesAmbientales: condiciones,
      patron: {
        patronId: patronSeleccionadoId || null,
        ...datosPatron,
      },
      patronesLista: tipoPlantilla === 'masa_bascula' ? patronesLista : [],
      procedimiento,
      datosCalibracion,
      dictamenGlobal: dictamenCalculado,
      observaciones,
      calibro: {
        ...calibro,
        firma: firmaCalibro,
      },
      aprobo: {
        ...aprobo,
        firma: firmaAprobo,
      },
      estado: 'emitido',
    };

    const res = await request({
      link: apiCrearCalibracion,
      body: payload,
      method: 'POST',
    });

    setGuardando(false);

    if (res?.success && res.certificado) {
      alert('¡Certificado de Calibración generado exitosamente!');
      navigate(`/certificadocalibracion?id=${res.certificado._id}`);
    } else {
      alert(res?.message || 'Error al emitir el certificado de calibración');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 15 }}>
        Cargando formulario y motor de calibración...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Barra superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <FaArrowLeft size={13} /> Volver
          </Link>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 800 }}>
              Elaborar Certificado de Calibración
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Cálculo automático de Incertidumbres (GUM) y Gráficos bajo ISO/IEC 17025
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Nº {consecutivo || 'CAL-2026-XXXX'}
          </div>
        </div>
      </div>

      <form onSubmit={handleGuardar}>
        {/* Selector de Plantilla Específica */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 16,
            marginBottom: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>
            SELECCIONE LA PLANTILLA METROLÓGICA:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <button
              type="button"
              onClick={() => setTipoPlantilla('presion_tensiometro')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: tipoPlantilla === 'presion_tensiometro' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: tipoPlantilla === 'presion_tensiometro' ? '#f0f9ff' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <MdSpeed size={30} color={tipoPlantilla === 'presion_tensiometro' ? '#0284c7' : '#64748b'} />
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                  Tensiómetros (Presión)
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Aneroides, Digitales • OIML R 16 (mmHg)
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipoPlantilla('masa_bascula')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: tipoPlantilla === 'masa_bascula' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: tipoPlantilla === 'masa_bascula' ? '#f0f9ff' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <FaBalanceScale size={26} color={tipoPlantilla === 'masa_bascula' ? '#0284c7' : '#64748b'} />
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                  Básculas y Balanzas (Masa)
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Juego de Pesas 5, 10 y 20 kg • OIML R 76
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipoPlantilla('volumen_micropipeta')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: tipoPlantilla === 'volumen_micropipeta' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: tipoPlantilla === 'volumen_micropipeta' ? '#f0f9ff' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <FaFlask size={26} color={tipoPlantilla === 'volumen_micropipeta' ? '#0284c7' : '#64748b'} />
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                  Micropipetas (Volumen)
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Método Gravimétrico + Factor Z • ISO 8655
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Sección 1: Datos del Cliente (IPS) y del Instrumento (Entrada 100% Manual) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            1. Identificación del Cliente (IPS) y del Instrumento Calibrado (Entrada Manual)
          </h3>

          {/* Subsección A: Datos del Cliente */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              A. Datos del Cliente / Solicitante (IPS):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Institución / Razón Social *
                </label>
                <input
                  type="text"
                  value={datosCliente.nombre}
                  onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
                  required
                  placeholder="Ej: Clínica San Rafael S.A.S."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Sede / Área
                </label>
                <input
                  type="text"
                  value={datosCliente.sede}
                  onChange={(e) => setDatosCliente({ ...datosCliente, sede: e.target.value })}
                  placeholder="Ej: Sede Principal / Sede Norte"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  NIT / Identificación
                </label>
                <input
                  type="text"
                  value={datosCliente.nit}
                  onChange={(e) => setDatosCliente({ ...datosCliente, nit: e.target.value })}
                  placeholder="Ej: 900.123.456-7"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Ciudad
                </label>
                <input
                  type="text"
                  value={datosCliente.ciudad}
                  onChange={(e) => setDatosCliente({ ...datosCliente, ciudad: e.target.value })}
                  placeholder="Ej: Barranquilla / Bogotá"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={datosCliente.direccion}
                  onChange={(e) => setDatosCliente({ ...datosCliente, direccion: e.target.value })}
                  placeholder="Ej: Cra. 43 # 84-25"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Teléfono / Contacto
                </label>
                <input
                  type="text"
                  value={datosCliente.telefono}
                  onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
                  placeholder="Ej: 300 123 4567"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>

          {/* Subsección B: Datos del Instrumento / Equipo */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              B. Datos del Instrumento / Equipo a Calibrar:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  value={datosEquipo.nombre}
                  onChange={(e) => setDatosEquipo({ ...datosEquipo, nombre: e.target.value })}
                  required
                  placeholder="Ej: Báscula Digital / Tensiómetro"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Marca
                </label>
                <input
                  type="text"
                  value={datosEquipo.marca}
                  onChange={(e) => setDatosEquipo({ ...datosEquipo, marca: e.target.value })}
                  placeholder="Ej: Seca / Welch Allyn"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Modelo
                </label>
                <input
                  type="text"
                  value={datosEquipo.modelo}
                  onChange={(e) => setDatosEquipo({ ...datosEquipo, modelo: e.target.value })}
                  placeholder="Ej: 703 / DS58"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Número de Serie *
                </label>
                <input
                  type="text"
                  value={datosEquipo.serie}
                  onChange={(e) => setDatosEquipo({ ...datosEquipo, serie: e.target.value })}
                  required
                  placeholder="Ej: SN-987654"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Placa / Código Interno
                </label>
                <input
                  type="text"
                  value={datosEquipo.placaInventario}
                  onChange={(e) => setDatosEquipo({ ...datosEquipo, placaInventario: e.target.value })}
                  placeholder="Ej: ACT-00124"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Ubicación / Servicio
                </label>
                <input
                  type="text"
                  value={datosEquipo.ubicacion || datosEquipo.servicio}
                  onChange={(e) =>
                    setDatosEquipo({ ...datosEquipo, ubicacion: e.target.value, servicio: e.target.value })
                  }
                  placeholder="Ej: Urgencias / Triaje"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Resolución del Instrumento
                </label>
                <input
                  type="number"
                  step="any"
                  value={datosEquipo.resolucion}
                  onChange={(e) => setDatosEquipo({ ...datosEquipo, resolucion: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Unidad de Medida
                </label>
                <input
                  type="text"
                  value={datosEquipo.unidad}
                  onChange={(e) => setDatosEquipo({ ...datosEquipo, unidad: e.target.value })}
                  placeholder="kg, mmHg, µL"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Fecha de Calibración
                </label>
                <input
                  type="date"
                  value={fechaCalibracion}
                  onChange={(e) => setFechaCalibracion(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Próxima Calibración
                </label>
                <input
                  type="date"
                  value={fechaProximaCalibracion}
                  onChange={(e) => setFechaProximaCalibracion(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Patrones de Referencia y Condiciones Ambientales */}
        {tipoPlantilla === 'masa_bascula' ? (
          /* ==================== SECCIÓN PARA BÁSCULAS (MÚLTIPLES PESAS PATRÓN) ==================== */
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  2. Juego de Pesas Patrón de Referencia (Masas de 5 kg, 10 kg, 20 kg)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  Trazabilidad metrológica e incertidumbre individual de cada masa patrón utilizada para componer las cargas de calibración.
                </p>
              </div>

              {/* Botones de acción rápida para agregar pesas */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() =>
                    agregarPesaPatron(5, `Pesa Patrón 5 kg (#${patronesLista.filter((p) => p.valorNominal === 5).length + 1})`)
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#f0f9ff',
                    border: '1px solid #0284c7',
                    color: '#0284c7',
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <FaPlus size={10} /> + Pesa 5 kg
                </button>

                <button
                  type="button"
                  onClick={() =>
                    agregarPesaPatron(10, `Pesa Patrón 10 kg (#${patronesLista.filter((p) => p.valorNominal === 10).length + 1})`)
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#f0f9ff',
                    border: '1px solid #0284c7',
                    color: '#0284c7',
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <FaPlus size={10} /> + Pesa 10 kg
                </button>

                <button
                  type="button"
                  onClick={() =>
                    agregarPesaPatron(20, `Pesa Patrón 20 kg (#${patronesLista.filter((p) => p.valorNominal === 20).length + 1})`)
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <FaPlus size={10} /> + Pesa 20 kg
                </button>
              </div>
            </div>

            {/* Tabla de pesas patrón */}
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Pesa / Identificación</th>
                    <th style={{ padding: '8px 8px' }}>Valor Nominal (kg)</th>
                    <th style={{ padding: '8px 8px' }}>Clase</th>
                    <th style={{ padding: '8px 8px' }}>Nº Serie</th>
                    <th style={{ padding: '8px 8px' }}>Certificado Calibración</th>
                    <th style={{ padding: '8px 8px' }}>Trazabilidad / Lab</th>
                    <th style={{ padding: '8px 8px', background: '#fef3c7' }}>Incertidumbre U (kg)</th>
                    <th style={{ padding: '8px 8px' }}>Factor k</th>
                    <th style={{ padding: '8px 8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {patronesLista.map((pesa, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'left' }}>
                        <input
                          type="text"
                          value={pesa.nombre}
                          onChange={(e) => actualizarPesaPatron(idx, 'nombre', e.target.value)}
                          style={{
                            width: '100%',
                            minWidth: 140,
                            padding: '4px 6px',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            fontSize: 12,
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          step="any"
                          value={pesa.valorNominal}
                          onChange={(e) => actualizarPesaPatron(idx, 'valorNominal', Number(e.target.value))}
                          style={{
                            width: 65,
                            textAlign: 'center',
                            padding: '4px 6px',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            fontWeight: 700,
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.claseExactitud || 'M1'}
                          onChange={(e) => actualizarPesaPatron(idx, 'claseExactitud', e.target.value)}
                          style={{
                            width: 50,
                            textAlign: 'center',
                            padding: '4px 6px',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.serie}
                          onChange={(e) => actualizarPesaPatron(idx, 'serie', e.target.value)}
                          placeholder="Serie"
                          style={{ width: 90, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.certificadoCalibracion}
                          onChange={(e) => actualizarPesaPatron(idx, 'certificadoCalibracion', e.target.value)}
                          placeholder="Nº Certificado"
                          style={{ width: 140, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.trazabilidad}
                          onChange={(e) => actualizarPesaPatron(idx, 'trazabilidad', e.target.value)}
                          placeholder="Entidad"
                          style={{ width: 150, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', background: '#fffbeb' }}>
                        <input
                          type="number"
                          step="any"
                          value={pesa.incertidumbreExpandida}
                          onChange={(e) => actualizarPesaPatron(idx, 'incertidumbreExpandida', Number(e.target.value))}
                          style={{
                            width: 75,
                            textAlign: 'center',
                            padding: '4px 6px',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            fontWeight: 700,
                            color: '#b45309',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          value={pesa.factorK || 2}
                          onChange={(e) => actualizarPesaPatron(idx, 'factorK', Number(e.target.value))}
                          style={{
                            width: 45,
                            textAlign: 'center',
                            padding: '4px 6px',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {patronesLista.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarPesaPatron(idx)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Eliminar pesa"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Condiciones Ambientales */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                Condiciones Ambientales del Ensayo:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Temperatura (°C) ± 0.5
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={condiciones.temperatura}
                    onChange={(e) => setCondiciones({ ...condiciones, temperatura: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Humedad Relativa (%HR) ± 2
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={condiciones.humedadRelativa}
                    onChange={(e) => setCondiciones({ ...condiciones, humedadRelativa: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Presión Atmosférica (hPa)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={condiciones.presionAtmosferica}
                    onChange={(e) => setCondiciones({ ...condiciones, presionAtmosferica: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==================== SECCIÓN PARA TENSIÓMETROS Y MICROPIPETAS ==================== */
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              2. Patrón de Referencia y Condiciones Ambientales
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {listaPatrones.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Cargar del Banco de Patrones (Opcional)
                  </label>
                  <select
                    value={patronSeleccionadoId}
                    onChange={handlePatronChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Selección rápida de patrón --</option>
                    {listaPatrones.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.codigo} - {p.nombre} ({p.magnitud})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Nombre del Patrón *
                </label>
                <input
                  type="text"
                  value={datosPatron.nombre}
                  onChange={(e) => setDatosPatron({ ...datosPatron, nombre: e.target.value })}
                  placeholder="Ej: Manómetro digital patrón"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Nº Certificado del Patrón
                </label>
                <input
                  type="text"
                  value={datosPatron.certificadoCalibracion}
                  onChange={(e) => setDatosPatron({ ...datosPatron, certificadoCalibracion: e.target.value })}
                  placeholder="Ej: ONAC-CAL-2025"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Incertidumbre Patrón (U)
                </label>
                <input
                  type="number"
                  step="any"
                  value={datosPatron.incertidumbreExpandida}
                  onChange={(e) =>
                    setDatosPatron({ ...datosPatron, incertidumbreExpandida: Number(e.target.value) })
                  }
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Temperatura (°C) ± 0.5
                </label>
                <input
                  type="number"
                  step="any"
                  value={condiciones.temperatura}
                  onChange={(e) => setCondiciones({ ...condiciones, temperatura: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Humedad Relativa (%HR) ± 2
                </label>
                <input
                  type="number"
                  step="any"
                  value={condiciones.humedadRelativa}
                  onChange={(e) => setCondiciones({ ...condiciones, humedadRelativa: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Presión Atmosférica (hPa)
                </label>
                <input
                  type="number"
                  step="any"
                  value={condiciones.presionAtmosferica}
                  onChange={(e) => setCondiciones({ ...condiciones, presionAtmosferica: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Sección 3: ENTORNO DE MEDICIÓN ESPECÍFICO SEGÚN PLANTILLA */}

        {/* ===================== PLANTILLA 1: TENSIÓMETROS ===================== */}
        {tipoPlantilla === 'presion_tensiometro' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              3. Ensayos para Tensiómetros (OIML R 16 / NTC 4353)
            </h3>

            {/* Ensayo de Hermeticidad y Error Cero */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
                background: '#f8fafc',
                padding: 16,
                borderRadius: 8,
                marginBottom: 20,
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#0369a1', fontWeight: 700 }}>
                  Prueba de Hermeticidad (Fuga de Presión en 1 min):
                </h4>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>P. Inicial (mmHg):</span>
                    <input
                      type="number"
                      value={hermeticidad.presionInicial}
                      onChange={(e) => handleHermeticidadChange('presionInicial', e.target.value)}
                      style={{ width: 85, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>P. Final (mmHg):</span>
                    <input
                      type="number"
                      value={hermeticidad.presionFinal}
                      onChange={(e) => handleHermeticidadChange('presionFinal', e.target.value)}
                      style={{ width: 85, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Caída:</span>
                    <div style={{ fontWeight: 700, fontSize: 13, color: hermeticidad.cumple ? '#15803d' : '#dc2626' }}>
                      {hermeticidad.caidaPresion} mmHg {hermeticidad.cumple ? '✓ Cumple (≤ 4)' : '✗ Falla (> 4)'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#0369a1', fontWeight: 700 }}>
                  Verificación de Error a Cero:
                </h4>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={errorCero.cumple}
                    onChange={(e) => setErrorCero({ ...errorCero, cumple: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  La aguja / indicación regresa a la zona cero sin presión (Cumple)
                </label>
              </div>
            </div>

            {/* Tabla de Medición de Presión */}
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                Mediciones de Presión (mmHg) y Cálculo Automático de Incertidumbres:
              </div>
              <button
                type="button"
                onClick={() =>
                  setPuntosTensiometro((prev) => [
                    ...prev,
                    {
                      valorPatron: prev.length > 0 ? prev[prev.length - 1].valorPatron + 50 : 50,
                      lecturas: [0, 0, 0],
                    },
                  ])
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FaPlus size={10} /> Añadir Punto
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                    <th style={{ padding: '8px 10px' }}>Punto</th>
                    <th style={{ padding: '8px 10px' }}>Patrón (mmHg)</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 1</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 2</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 3</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Media</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Error (E)</th>
                    <th style={{ padding: '8px 10px' }}>uA</th>
                    <th style={{ padding: '8px 10px' }}>uB</th>
                    <th style={{ padding: '8px 10px', background: '#fef3c7' }}>U (k=2)</th>
                    <th style={{ padding: '8px 10px' }}>Estado</th>
                    <th style={{ padding: '8px 10px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {puntosTensiometro.map((p, idx) => {
                    const c = puntosTensiometroCalculados[idx];
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="number"
                            value={p.valorPatron}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPuntosTensiometro((prev) => {
                                const n = [...prev];
                                n[idx].valorPatron = val;
                                return n;
                              });
                            }}
                            style={{
                              width: 75,
                              padding: '4px 6px',
                              textAlign: 'center',
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        </td>
                        {[0, 1, 2].map((lIdx) => (
                          <td key={lIdx} style={{ padding: '8px 10px' }}>
                            <input
                              type="number"
                              value={p.lecturas[lIdx] ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPuntosTensiometro((prev) => {
                                  const n = [...prev];
                                  const lects = [...n[idx].lecturas];
                                  lects[lIdx] = val;
                                  n[idx].lecturas = lects;
                                  return n;
                                });
                              }}
                              style={{
                                width: 70,
                                padding: '4px 6px',
                                textAlign: 'center',
                                borderRadius: 4,
                                border: '1px solid #cbd5e1',
                              }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '8px 10px', fontWeight: 700, background: '#f0f9ff' }}>
                          {c?.promedio}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            fontWeight: 700,
                            color: c?.cumple ? '#0369a1' : '#dc2626',
                            background: '#f0f9ff',
                          }}
                        >
                          {c?.error > 0 ? `+${c?.error}` : c?.error}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{c?.incertidumbreTipoA}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{c?.incertidumbreTipoB}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#b45309', background: '#fffbeb' }}>
                          ± {c?.incertidumbreExpandida}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              background: c?.cumple ? '#dcfce7' : '#fee2e2',
                              color: c?.cumple ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {c?.cumple ? 'CUMPLE' : 'NO CUMPLE'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {puntosTensiometro.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPuntosTensiometro((prev) => prev.filter((_, i) => i !== idx))}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Gráfico en Tiempo Real Tensiómetros */}
            <CalibrationChart
              puntos={puntosTensiometroCalculados}
              unidad="mmHg"
              titulo="Curva de Calibración: Error de Presión vs. Valor Patrón (Límites EMP ± 3 mmHg)"
            />
          </div>
        )}

        {/* ===================== PLANTILLA 2: BÁSCULAS ===================== */}
        {tipoPlantilla === 'masa_bascula' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              3. Ensayos Metrológicos para Básculas y Balanzas (OIML R 76 / EURAMET cg-18)
            </h3>

            {/* Prueba de Repetibilidad y Excentricidad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Repetibilidad */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#0369a1', fontWeight: 700 }}>
                  A. Prueba de Repetibilidad (5 pesadas continuas):
                </h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>Carga de Prueba ({datosEquipo.unidad}):</span>
                  <input
                    type="number"
                    value={repetibilidadBascula.cargaNominal}
                    onChange={(e) =>
                      setRepetibilidadBascula({ ...repetibilidadBascula, cargaNominal: Number(e.target.value) })
                    }
                    style={{ width: 80, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {repetibilidadBascula.lecturas.map((l, i) => (
                    <input
                      key={i}
                      type="number"
                      step="any"
                      value={l}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRepetibilidadBascula((prev) => {
                          const lects = [...prev.lecturas];
                          lects[i] = val;
                          return { ...prev, lecturas: lects };
                        });
                      }}
                      style={{
                        width: 62,
                        padding: '4px 6px',
                        textAlign: 'center',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#334155' }}>
                  Desviación estándar (s): <strong>{desvRep.toFixed(4)} {datosEquipo.unidad}</strong>
                </div>
              </div>

              {/* Excentricidad */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#0369a1', fontWeight: 700 }}>
                  B. Prueba de Excentricidad (Carga en Esquinas):
                </h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>Carga ({datosEquipo.unidad}):</span>
                  <input
                    type="number"
                    value={excentricidadBascula.cargaNominal}
                    onChange={(e) =>
                      setExcentricidadBascula({ ...excentricidadBascula, cargaNominal: Number(e.target.value) })
                    }
                    style={{ width: 75, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {['centro', 'pos1', 'pos2', 'pos3', 'pos4'].map((pos, i) => (
                    <div key={pos} style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>
                        {pos === 'centro' ? 'Centro' : `Esq ${i}`}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={excentricidadBascula[pos]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setExcentricidadBascula((prev) => {
                            const updated = { ...prev, [pos]: val };
                            const diffs = [
                              Math.abs(updated.pos1 - updated.centro),
                              Math.abs(updated.pos2 - updated.centro),
                              Math.abs(updated.pos3 - updated.centro),
                              Math.abs(updated.pos4 - updated.centro),
                            ];
                            updated.errorMaximo = Number(Math.max(...diffs).toFixed(4));
                            updated.cumple = updated.errorMaximo <= (updated.emp || 0.2);
                            return updated;
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 4px',
                          textAlign: 'center',
                          borderRadius: 4,
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#334155' }}>
                  Diferencia máxima: <strong>{excentricidadBascula.errorMaximo} {datosEquipo.unidad}</strong> (
                  {excentricidadBascula.cumple ? '✓ Cumple' : '✗ Falla'})
                </div>
              </div>
            </div>

            {/* C. Prueba de Exactitud / Puntos de Carga */}
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                  C. Prueba de Exactitud y Error de Indicación ({datosEquipo.unidad}):
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  La incertidumbre del patrón se calcula automáticamente según las pesas combinadas (5, 10 y 20 kg).
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPuntosBascula((prev) => [
                    ...prev,
                    {
                      valorPatron: prev.length > 0 ? prev[prev.length - 1].valorPatron + 20 : 20,
                      lecturas: [0, 0, 0],
                    },
                  ])
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FaPlus size={10} /> Añadir Punto de Carga
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                    <th style={{ padding: '8px 10px' }}>Punto</th>
                    <th style={{ padding: '8px 10px' }}>Carga Patrón ({datosEquipo.unidad})</th>
                    <th style={{ padding: '8px 10px', background: '#f8fafc' }}>Pesas Combinadas</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 1</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 2</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 3</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Media</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Error (E)</th>
                    <th style={{ padding: '8px 10px', background: '#fef3c7' }}>U (k=2)</th>
                    <th style={{ padding: '8px 10px' }}>Estado</th>
                    <th style={{ padding: '8px 10px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {puntosBascula.map((p, idx) => {
                    const c = puntosBasculaCalculados[idx];
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="number"
                            step="any"
                            value={p.valorPatron}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPuntosBascula((prev) => {
                                const n = [...prev];
                                n[idx].valorPatron = val;
                                return n;
                              });
                            }}
                            style={{
                              width: 80,
                              padding: '4px 6px',
                              textAlign: 'center',
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 11.5, color: '#0369a1', fontWeight: 600, background: '#f8fafc' }}>
                          {c?.pesasUtilizadas || `${p.valorPatron} kg`}
                        </td>
                        {[0, 1, 2].map((lIdx) => (
                          <td key={lIdx} style={{ padding: '8px 10px' }}>
                            <input
                              type="number"
                              step="any"
                              value={p.lecturas[lIdx] ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPuntosBascula((prev) => {
                                  const n = [...prev];
                                  const lects = [...n[idx].lecturas];
                                  lects[lIdx] = val;
                                  n[idx].lecturas = lects;
                                  return n;
                                });
                              }}
                              style={{
                                width: 75,
                                padding: '4px 6px',
                                textAlign: 'center',
                                borderRadius: 4,
                                border: '1px solid #cbd5e1',
                              }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '8px 10px', fontWeight: 700, background: '#f0f9ff' }}>
                          {c?.promedio}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            fontWeight: 700,
                            color: c?.cumple ? '#0369a1' : '#dc2626',
                            background: '#f0f9ff',
                          }}
                        >
                          {c?.error > 0 ? `+${c?.error}` : c?.error}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#b45309', background: '#fffbeb' }}>
                          ± {c?.incertidumbreExpandida}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              background: c?.cumple ? '#dcfce7' : '#fee2e2',
                              color: c?.cumple ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {c?.cumple ? 'CUMPLE' : 'NO CUMPLE'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {puntosBascula.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPuntosBascula((prev) => prev.filter((_, i) => i !== idx))}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <CalibrationChart
              puntos={puntosBasculaCalculados}
              unidad={datosEquipo.unidad}
              titulo={`Curva de Exactitud: Error de Carga vs. Carga Patrón (${datosEquipo.unidad})`}
            />
          </div>
        )}

        {/* ===================== PLANTILLA 3: MICROPIPETAS ===================== */}
        {tipoPlantilla === 'volumen_micropipeta' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              3. Calibración Gravimétrica de Micropipetas (ISO 8655-2 / ISO 8655-6)
            </h3>

            {/* Parámetros de conversión y Factor Z */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                background: '#f8fafc',
                padding: 14,
                borderRadius: 8,
                marginBottom: 20,
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>Volumen Nominal (µL):</span>
                <input
                  type="number"
                  value={micropipetaInfo.volumenNominal}
                  onChange={(e) =>
                    setMicropipetaInfo({ ...micropipetaInfo, volumenNominal: Number(e.target.value) })
                  }
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>Temperatura Agua (°C):</span>
                <input
                  type="number"
                  step="any"
                  value={micropipetaInfo.temperaturaAgua}
                  onChange={(e) =>
                    setMicropipetaInfo({ ...micropipetaInfo, temperaturaAgua: Number(e.target.value) })
                  }
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>Factor Z Calculado (µL/mg):</span>
                <div
                  style={{
                    padding: '6px 10px',
                    background: '#e0f2fe',
                    borderRadius: 4,
                    fontWeight: 700,
                    color: '#0369a1',
                    fontSize: 13,
                  }}
                >
                  {micropipetaInfo.factorZ} µL/mg
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>Resolución Balanza (mg):</span>
                <input
                  type="number"
                  step="any"
                  value={micropipetaInfo.resolucionBalanza}
                  onChange={(e) =>
                    setMicropipetaInfo({ ...micropipetaInfo, resolucionBalanza: Number(e.target.value) })
                  }
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            {/* Puntos volumétricos con pesadas repetidas */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                Mediciones de Masa de Agua (mg) por cada volumen y evaluación ISO 8655:
              </div>
            </div>

            {puntosMicropipeta.map((p, idx) => {
              const c = puntosMicropipetaCalculados[idx];
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 16,
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0369a1' }}>
                      Punto {idx + 1}: {p.nominal} µL ({p.porcentaje}% del volumen nominal)
                    </div>

                    <div style={{ display: 'flex', gap: 12, fontSize: 12, alignItems: 'center' }}>
                      <span>EMP Sistemático: ±{p.empSistematicoPct}%</span>
                      <span>EMP Aleatorio (CV): ≤{p.empAleatorioPct}%</span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: c?.cumple ? '#dcfce7' : '#fee2e2',
                          color: c?.cumple ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {c?.cumple ? 'CONFORME' : 'NO CONFORME'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>Pesadas de agua repetidas (mg):</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {p.lecturasMasa.map((m, mIdx) => (
                        <input
                          key={mIdx}
                          type="number"
                          step="any"
                          value={m}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPuntosMicropipeta((prev) => {
                              const n = [...prev];
                              const lects = [...n[idx].lecturasMasa];
                              lects[mIdx] = val;
                              n[idx].lecturasMasa = lects;
                              return n;
                            });
                          }}
                          style={{
                            width: 85,
                            padding: '4px 6px',
                            textAlign: 'center',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resultados calculados del punto */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 8,
                      background: '#f0f9ff',
                      padding: 10,
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      Volumen Medio: <strong>{c?.promedio} µL</strong>
                    </div>
                    <div>
                      Error Sistemático: <strong>{c?.errorSistematicoPct}%</strong> ({c?.error} µL)
                    </div>
                    <div>
                      Desviación Estándar: <strong>{c?.desviacionEstandar} µL</strong>
                    </div>
                    <div>
                      Coeficiente Var (CV): <strong>{c?.coeficienteVariacionPct}%</strong>
                    </div>
                    <div>
                      Incertidumbre Expandida: <strong>± {c?.incertidumbreExpandida} µL</strong>
                    </div>
                  </div>
                </div>
              );
            })}

            <CalibrationChart
              puntos={puntosMicropipetaCalculados}
              unidad="µL"
              titulo="Curva de Error Sistemático vs. Volumen Nominal (µL) con Incertidumbre (k=2)"
            />
          </div>
        )}

        {/* Sección 4: Dictamen Global, Observaciones y Firmas */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}
        >
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            4. Dictamen Metrológico y Firmas Digitales
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Dictamen Metrológico Global:
            </label>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 14,
                background: dictamenCalculado === 'CONFORME' ? '#dcfce7' : '#fee2e2',
                color: dictamenCalculado === 'CONFORME' ? '#15803d' : '#b91c1c',
              }}
            >
              {dictamenCalculado === 'CONFORME' ? <FaCheckCircle size={16} /> : <FaTimesCircle size={16} />}
              DICTAMEN: {dictamenCalculado}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              Observaciones del Certificado
            </label>
            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Firmas Digitales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Firma Calibrador */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13.5, color: '#0f172a' }}>
                Firma: Realizó la Calibración (Metrólogo / Calibrador)
              </h4>
              <div style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Nombre del técnico/ingeniero"
                  value={calibro.nombre}
                  onChange={(e) => setCalibro({ ...calibro, nombre: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    marginBottom: 6,
                  }}
                />
                <input
                  type="text"
                  placeholder="Cargo / Especialidad"
                  value={calibro.cargo}
                  onChange={(e) => setCalibro({ ...calibro, cargo: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ border: '1px dashed #cbd5e1', borderRadius: 6, background: '#ffffff', height: 110 }}>
                <SignatureCanvas
                  ref={firmaCalibroRef}
                  penColor="black"
                  canvasProps={{ width: 340, height: 110, className: 'sigCanvas' }}
                />
              </div>
              <button
                type="button"
                onClick={() => firmaCalibroRef.current?.clear()}
                style={{
                  marginTop: 6,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FaEraser size={11} /> Limpiar Firma
              </button>
            </div>

            {/* Firma Aprobador */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13.5, color: '#0f172a' }}>
                Firma: Aprobó / Responsable Técnico ISO 17025
              </h4>
              <div style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Nombre del responsable técnico"
                  value={aprobo.nombre}
                  onChange={(e) => setAprobo({ ...aprobo, nombre: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    marginBottom: 6,
                  }}
                />
                <input
                  type="text"
                  placeholder="Cargo"
                  value={aprobo.cargo}
                  onChange={(e) => setAprobo({ ...aprobo, cargo: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ border: '1px dashed #cbd5e1', borderRadius: 6, background: '#ffffff', height: 110 }}>
                <SignatureCanvas
                  ref={firmaAproboRef}
                  penColor="black"
                  canvasProps={{ width: 340, height: 110, className: 'sigCanvas' }}
                />
              </div>
              <button
                type="button"
                onClick={() => firmaAproboRef.current?.clear()}
                style={{
                  marginTop: 6,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FaEraser size={11} /> Limpiar Firma
              </button>
            </div>
          </div>
        </div>

        {/* Botón de Enviar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
          <Link
            to="/calibraciones"
            style={{
              padding: '11px 20px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#475569',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={guardando}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 28px',
              borderRadius: 8,
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 15,
              cursor: guardando ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              opacity: guardando ? 0.7 : 1,
            }}
          >
            <FaSave size={15} />
            {guardando ? 'Emitiendo Certificado...' : 'Guardar y Emitir Certificado'}
          </button>
        </div>
      </form>
    </div>
  );
}
