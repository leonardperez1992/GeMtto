import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  apiCalibraciones,
  apiEditarCalibracion,
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
} from 'react-icons/fa';

export default function EditCalibracion() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const certId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Referencias de firmas digitales
  const firmaCalibroRef = useRef({});
  const firmaAproboRef = useRef({});

  // Formulario
  const [consecutivo, setConsecutivo] = useState('');
  const [fechaCalibracion, setFechaCalibracion] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaProximaCalibracion, setFechaProximaCalibracion] = useState('');
  const [tipoPlantilla, setTipoPlantilla] = useState('presion_tensiometro');

  // Datos del Equipo (Entrada manual)
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

  // Datos del Cliente / IPS (Entrada manual)
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    nit: '',
    sede: '',
    direccion: '',
    ciudad: '',
    telefono: '',
  });

  const [condiciones, setCondiciones] = useState({
    temperatura: 20,
    incertTemperatura: 0.5,
    humedadRelativa: 55,
    incertHumedad: 2,
    presionAtmosferica: 1013,
  });

  // Patrón Individual (Tensiómetro o Micropipeta)
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

  // Múltiples Patrones / Juego de Pesas (Básculas)
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

  const [procedimiento, setProcedimiento] = useState('');

  // 1. Tensiómetro
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

  const [puntosTensiometro, setPuntosTensiometro] = useState([]);

  // 2. Báscula
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

  const [puntosBascula, setPuntosBascula] = useState([]);

  // 3. Micropipeta
  const [micropipetaInfo, setMicropipetaInfo] = useState({
    tipo: 'Monocanal volumen variable',
    volumenNominal: 1000,
    temperaturaAgua: 20,
    presionAtmosferica: 1013,
    factorZ: 1.0029,
    resolucionBalanza: 0.01,
    incertBalanza: 0.02,
  });

  const [puntosMicropipeta, setPuntosMicropipeta] = useState([]);

  const [calibro, setCalibro] = useState({
    nombre: '',
    cargo: '',
    tarjetaProfesional: '',
    firma: '',
  });

  const [aprobo, setAprobo] = useState({
    nombre: '',
    cargo: '',
    tarjetaProfesional: '',
    firma: '',
  });

  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!certId) return;
      setLoading(true);

      const resCert = await request({ link: `${apiCalibraciones}/${certId}` });

      if (resCert?.success && resCert.certificado) {
        const c = resCert.certificado;
        setConsecutivo(c.numeroCertificado || '');
        setFechaCalibracion(c.fechaCalibracion || '');
        setFechaEmision(c.fechaEmision || '');
        setFechaProximaCalibracion(c.fechaProximaCalibracion || '');
        setTipoPlantilla(c.tipoPlantilla || 'presion_tensiometro');
        if (c.datosEquipo) setDatosEquipo(c.datosEquipo);
        if (c.datosCliente) setDatosCliente(c.datosCliente);
        if (c.condicionesAmbientales) setCondiciones(c.condicionesAmbientales);
        if (c.patron) setDatosPatron(c.patron);
        if (c.patronesLista && c.patronesLista.length > 0) {
          setPatronesLista(c.patronesLista);
        }
        if (c.procedimiento) setProcedimiento(c.procedimiento);
        if (c.observaciones) setObservaciones(c.observaciones);
        if (c.calibro) setCalibro(c.calibro);
        if (c.aprobo) setAprobo(c.aprobo);

        const dc = c.datosCalibracion || {};

        if (c.tipoPlantilla === 'presion_tensiometro') {
          if (dc.hermeticidad) setHermeticidad(dc.hermeticidad);
          if (dc.errorCero) setErrorCero(dc.errorCero);
          if (dc.puntos && dc.puntos.length > 0) {
            setPuntosTensiometro(
              dc.puntos.map((p) => ({
                valorPatron: p.valorNominal ?? p.valorPatron,
                lecturas: p.lecturas || [p.promedio, p.promedio, p.promedio],
              }))
            );
          }
        } else if (c.tipoPlantilla === 'masa_bascula') {
          if (dc.repetibilidadBascula) setRepetibilidadBascula(dc.repetibilidadBascula);
          if (dc.excentricidadBascula) setExcentricidadBascula(dc.excentricidadBascula);
          if (dc.puntos && dc.puntos.length > 0) {
            setPuntosBascula(
              dc.puntos.map((p) => ({
                valorPatron: p.valorNominal ?? p.valorPatron,
                lecturas: p.lecturas || [p.promedio, p.promedio, p.promedio],
              }))
            );
          }
        } else if (c.tipoPlantilla === 'volumen_micropipeta') {
          if (dc.micropipetaInfo) setMicropipetaInfo(dc.micropipetaInfo);
          if (dc.puntos && dc.puntos.length > 0) {
            setPuntosMicropipeta(
              dc.puntos.map((p) => ({
                nominal: p.nominal ?? p.valorNominal,
                porcentaje: p.porcentajeNominal ?? p.porcentaje,
                lecturasMasa: p.lecturasMasa || [p.promedio, p.promedio, p.promedio],
                empSistematicoPct: p.empSistematicoPct || 1.0,
                empAleatorioPct: p.empAleatorioPct || 0.5,
              }))
            );
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [certId]);

  // Recalcular Factor Z
  useEffect(() => {
    const z = calcularFactorZ(
      micropipetaInfo.temperaturaAgua,
      micropipetaInfo.presionAtmosferica
    );
    setMicropipetaInfo((prev) => ({ ...prev, factorZ: z }));
  }, [micropipetaInfo.temperaturaAgua, micropipetaInfo.presionAtmosferica]);

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

  // Cálculos en tiempo real
  const puntosTensiometroCalculados = puntosTensiometro.map((p) =>
    calcularPuntoTensiometro({
      valorPatron: p.valorPatron,
      lecturas: p.lecturas,
      resolucionEquipo: datosEquipo.resolucion,
      patronInfo: datosPatron,
    })
  );

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

  const dictamenCalculado =
    tipoPlantilla === 'presion_tensiometro'
      ? hermeticidad.cumple && errorCero.cumple && puntosTensiometroCalculados.every((p) => p.cumple)
        ? 'CONFORME'
        : 'NO CONFORME'
      : tipoPlantilla === 'masa_bascula'
      ? excentricidadBascula.cumple && puntosBasculaCalculados.every((p) => p.cumple)
        ? 'CONFORME'
        : 'NO CONFORME'
      : puntosMicropipetaCalculados.every((p) => p.cumple)
      ? 'CONFORME'
      : 'NO CONFORME';

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    setGuardando(true);

    let firmaCalibroFinal = calibro.firma;
    let firmaAproboFinal = aprobo.firma;

    if (firmaCalibroRef.current?.toDataURL && !firmaCalibroRef.current.isEmpty()) {
      firmaCalibroFinal = firmaCalibroRef.current.toDataURL();
    }
    if (firmaAproboRef.current?.toDataURL && !firmaAproboRef.current.isEmpty()) {
      firmaAproboFinal = firmaAproboRef.current.toDataURL();
    }

    let datosCalibracion = {};
    if (tipoPlantilla === 'presion_tensiometro') {
      datosCalibracion = {
        hermeticidad,
        errorCero,
        puntos: puntosTensiometroCalculados,
      };
    } else if (tipoPlantilla === 'masa_bascula') {
      datosCalibracion = {
        repetibilidadBascula: {
          ...repetibilidadBascula,
          promedio: promedio(repetibilidadBascula.lecturas),
          desviacionEstandar: desvRep,
        },
        excentricidadBascula,
        puntos: puntosBasculaCalculados,
      };
    } else if (tipoPlantilla === 'volumen_micropipeta') {
      datosCalibracion = {
        micropipetaInfo,
        puntos: puntosMicropipetaCalculados,
      };
    }

    const payload = {
      numeroCertificado: consecutivo,
      fechaCalibracion,
      fechaEmision,
      fechaProximaCalibracion,
      datosEquipo,
      datosCliente,
      tipoPlantilla,
      condicionesAmbientales: condiciones,
      patron: datosPatron,
      patronesLista: tipoPlantilla === 'masa_bascula' ? patronesLista : [],
      procedimiento,
      datosCalibracion,
      dictamenGlobal: dictamenCalculado,
      observaciones,
      calibro: {
        ...calibro,
        firma: firmaCalibroFinal,
      },
      aprobo: {
        ...aprobo,
        firma: firmaAproboFinal,
      },
    };

    const res = await request({
      link: `${apiEditarCalibracion}/${certId}`,
      body: payload,
      method: 'PUT',
    });

    setGuardando(false);

    if (res?.success) {
      alert('Certificado de Calibración actualizado exitosamente');
      navigate(`/certificadocalibracion?id=${certId}`);
    } else {
      alert(res?.message || 'Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Cargando datos del certificado...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
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
            to={`/certificadocalibracion?id=${certId}`}
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
            <FaArrowLeft size={13} /> Volver al Certificado
          </Link>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 800 }}>
              Editar Certificado de Calibración {consecutivo}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Modificación de lecturas, incertidumbres y parámetros metrológicos
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleGuardarCambios}>
        {/* Identificación del cliente e ítem (Entrada Manual) */}
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
            1. Datos del Cliente (IPS) y del Instrumento Calibrado
          </h3>

          {/* Subsección: Cliente */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 10, textTransform: 'uppercase' }}>
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
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>

          {/* Subsección: Instrumento */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 10, textTransform: 'uppercase' }}>
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
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Resolución ({datosEquipo.unidad})
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
                  Fecha Calibración
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

        {/* Sección 2: Patrones de Referencia */}
        {tipoPlantilla === 'masa_bascula' ? (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  2. Juego de Pesas Patrón de Referencia (Masas de 5, 10 y 20 kg)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  Trazabilidad e incertidumbre individual de las pesas patrón.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => agregarPesaPatron(5, `Pesa 5 kg (#${patronesLista.filter((p) => p.valorNominal === 5).length + 1})`)}
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
                  onClick={() => agregarPesaPatron(10, `Pesa 10 kg (#${patronesLista.filter((p) => p.valorNominal === 10).length + 1})`)}
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
                  onClick={() => agregarPesaPatron(20, `Pesa 20 kg (#${patronesLista.filter((p) => p.valorNominal === 20).length + 1})`)}
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

            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Pesa / Identificación</th>
                    <th style={{ padding: '8px 8px' }}>Nominal (kg)</th>
                    <th style={{ padding: '8px 8px' }}>Clase</th>
                    <th style={{ padding: '8px 8px' }}>Serie</th>
                    <th style={{ padding: '8px 8px' }}>Certificado Calibración</th>
                    <th style={{ padding: '8px 8px' }}>Trazabilidad</th>
                    <th style={{ padding: '8px 8px', background: '#fef3c7' }}>U (kg)</th>
                    <th style={{ padding: '8px 8px' }}>k</th>
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
                          style={{ width: '100%', minWidth: 130, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          step="any"
                          value={pesa.valorNominal}
                          onChange={(e) => actualizarPesaPatron(idx, 'valorNominal', Number(e.target.value))}
                          style={{ width: 65, textAlign: 'center', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontWeight: 700 }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.claseExactitud || 'M1'}
                          onChange={(e) => actualizarPesaPatron(idx, 'claseExactitud', e.target.value)}
                          style={{ width: 50, textAlign: 'center', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.serie}
                          onChange={(e) => actualizarPesaPatron(idx, 'serie', e.target.value)}
                          style={{ width: 90, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.certificadoCalibracion}
                          onChange={(e) => actualizarPesaPatron(idx, 'certificadoCalibracion', e.target.value)}
                          style={{ width: 140, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={pesa.trazabilidad}
                          onChange={(e) => actualizarPesaPatron(idx, 'trazabilidad', e.target.value)}
                          style={{ width: 150, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', background: '#fffbeb' }}>
                        <input
                          type="number"
                          step="any"
                          value={pesa.incertidumbreExpandida}
                          onChange={(e) => actualizarPesaPatron(idx, 'incertidumbreExpandida', Number(e.target.value))}
                          style={{ width: 75, textAlign: 'center', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontWeight: 700, color: '#b45309' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          value={pesa.factorK || 2}
                          onChange={(e) => actualizarPesaPatron(idx, 'factorK', Number(e.target.value))}
                          style={{ width: 45, textAlign: 'center', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {patronesLista.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarPesaPatron(idx)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
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
          </div>
        ) : (
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
              2. Patrón de Referencia
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Nombre del Patrón
                </label>
                <input
                  type="text"
                  value={datosPatron.nombre}
                  onChange={(e) => setDatosPatron({ ...datosPatron, nombre: e.target.value })}
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
                  onChange={(e) => setDatosPatron({ ...datosPatron, incertidumbreExpandida: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mediciones según plantilla */}
        {tipoPlantilla === 'presion_tensiometro' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              3. Mediciones de Presión (Tensiómetro)
            </h3>
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px' }}>Punto</th>
                    <th style={{ padding: '8px 10px' }}>Patrón (mmHg)</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 1</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 2</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 3</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Media</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Error</th>
                    <th style={{ padding: '8px 10px', background: '#fef3c7' }}>U (k=2)</th>
                    <th style={{ padding: '8px 10px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {puntosTensiometro.map((p, idx) => {
                    const c = puntosTensiometroCalculados[idx];
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
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
                            style={{ width: 75, padding: '4px 6px', textAlign: 'center', borderRadius: 4, border: '1px solid #cbd5e1' }}
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
                              style={{ width: 70, padding: '4px 6px', textAlign: 'center', borderRadius: 4, border: '1px solid #cbd5e1' }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{c?.promedio}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: c?.cumple ? '#0369a1' : '#dc2626' }}>
                          {c?.error > 0 ? `+${c?.error}` : c?.error}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#b45309' }}>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <CalibrationChart
              puntos={puntosTensiometroCalculados}
              unidad="mmHg"
              titulo="Curva de Error vs. Valor Patrón (Límites EMP ± 3 mmHg)"
            />
          </div>
        )}

        {tipoPlantilla === 'masa_bascula' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  3. Mediciones de Masa (Báscula - Error de Indicación)
                </h3>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Incertidumbre de pesas calculada automáticamente con el juego de masas (5, 10, 20 kg).
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
                <FaPlus size={10} /> Añadir Punto
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px' }}>Punto</th>
                    <th style={{ padding: '8px 10px' }}>Carga Patrón ({datosEquipo.unidad})</th>
                    <th style={{ padding: '8px 10px', background: '#f8fafc' }}>Pesas Combinadas</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 1</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 2</th>
                    <th style={{ padding: '8px 10px' }}>Lectura 3</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Media</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>Error</th>
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
                        <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
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
                            style={{ width: 80, padding: '4px 6px', textAlign: 'center', borderRadius: 4, border: '1px solid #cbd5e1', fontWeight: 700 }}
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
                              style={{ width: 75, padding: '4px 6px', textAlign: 'center', borderRadius: 4, border: '1px solid #cbd5e1' }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{c?.promedio}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: c?.cumple ? '#0369a1' : '#dc2626' }}>
                          {c?.error > 0 ? `+${c?.error}` : c?.error}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#b45309' }}>
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

        {tipoPlantilla === 'volumen_micropipeta' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              3. Mediciones Gravimétricas (Micropipeta)
            </h3>
            {puntosMicropipeta.map((p, idx) => {
              const c = puntosMicropipetaCalculados[idx];
              return (
                <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#0369a1' }}>
                    Punto {idx + 1}: {p.nominal} µL
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                        style={{ width: 85, padding: '4px 6px', textAlign: 'center', borderRadius: 4, border: '1px solid #cbd5e1' }}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    Volumen medio: <strong>{c?.promedio} µL</strong> | Error: <strong>{c?.errorSistematicoPct}%</strong> | Incertidumbre: <strong>± {c?.incertidumbreExpandida} µL</strong>
                  </div>
                </div>
              );
            })}
            <CalibrationChart
              puntos={puntosMicropipetaCalculados}
              unidad="µL"
              titulo="Curva de Calibración Micropipeta (µL)"
            />
          </div>
        )}

        {/* Dictamen y Botón Guardar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              Observaciones
            </label>
            <textarea
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13,
                background: dictamenCalculado === 'CONFORME' ? '#dcfce7' : '#fee2e2',
                color: dictamenCalculado === 'CONFORME' ? '#15803d' : '#b91c1c',
              }}
            >
              {dictamenCalculado === 'CONFORME' ? <FaCheckCircle /> : <FaTimesCircle />}
              DICTAMEN: {dictamenCalculado}
            </div>

            <button
              type="submit"
              disabled={guardando}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              <FaSave size={14} /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
