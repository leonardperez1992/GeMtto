import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  apiCreateReporte,
  apiActMtto,
  apiSetFiles,
  apiIps,
  apiObtenerEquipo,
} from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import {
  FaFileAlt,
  FaHospital,
  FaWrench,
  FaMicrochip,
  FaExclamationCircle,
  FaClipboardList,
  FaCogs,
  FaSlidersH,
  FaCheckCircle,
  FaSignature,
  FaFileUpload,
  FaSave,
  FaArrowLeft,
  FaEraser,
  FaBolt,
  FaPen,
} from 'react-icons/fa';

function ReporteService() {
  const [allActMtos, setAllActMtos] = useState([]);
  const [actMto, setActmto] = useState('');
  const [equipo, setEquipo] = useState({});
  const [ciudades, setCiudades] = useState([]);
  const [ciudad, setCiudad] = useState('');
  const [file, setFile] = useState(null);
  const [numReporte] = useState(new Date().valueOf());
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);
  const cronogramaUrl = storedUser && storedUser.rol === 'user' ? '/cronogramauser' : '/cronograma';

  const firmaIngRef = useRef({});
  const firmaRecref = useRef({});

  const [reporte, setReporte] = useState({
    fecha: new Date().toISOString().split('T')[0],
    ciudad: '',
    tipo_servicio: 'MTTO PREVENTIVO',
    equipo: '',
    marca: '',
    modelo: '',
    serie: '',
    inventario: 'NA',
    problema_reportado: 'Mantenimiento preventivo programado según cronograma institucional.',
    desc_servicio: '',
    cantidad1: '',
    descripcion1: '',
    valor1: '',
    cantidad2: '',
    descripcion2: '',
    valor2: '',
    cantidad3: '',
    descripcion3: '',
    valor3: '',
    cantidad4: '',
    descripcion4: '',
    valor4: '',
    parametro1: '',
    valor_programado1: '',
    valor_medido1: '',
    parametro2: '',
    valor_programado2: '',
    valor_medido2: '',
    parametro3: '',
    valor_programado3: '',
    valor_medido3: '',
    parametro4: '',
    valor_programado4: '',
    valor_medido4: '',
    observaciones: 'Equipo funcionando en óptimas condiciones técnicas y de seguridad.',
    estado_final: 'EQUIPO FUNCIONANDO CORRECTAMENTE',
    nombre_ingeniero: '',
    cargo_ingeniero: 'INGENIERO BIOMÉDICO',
    nombre_recibe: '',
    cargo_recibe: '',
  });

  function handleFileChange(event) {
    setFile(event.target.files[0]);
  }

  function handleUploadFile(event) {
    event.preventDefault();
    if (!file) {
      alert('Por favor selecciona un archivo primero');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('numReporte', numReporte);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    axios
      .post(apiSetFiles, formData, config)
      .then((response) => {
        alert(response.data.message || 'Archivo adjuntado correctamente');
      })
      .catch((err) => {
        console.error(err);
        alert('Error al subir el archivo');
      })
      .finally(() => setUploading(false));
  }

  const obtenerTodasActividades = async (equipoNombre) => {
    try {
      const response = await request({
        link: apiActMtto,
        method: 'GET',
      });
      if (response && response.success && response.actmtto) {
        const sorted = response.actmtto.sort((a, b) => (a.equipo || '').localeCompare(b.equipo || ''));
        setAllActMtos(sorted);

        // Preload protocol if matching
        if (equipoNombre) {
          const match = sorted.find(
            (a) => a.equipo?.trim().toUpperCase() === equipoNombre.trim().toUpperCase()
          );
          if (match) {
            setActmto(match.actividades);
            setReporte((prev) => {
              const isPreventivo = prev.tipo_servicio === 'MTTO PREVENTIVO';
              return {
                ...prev,
                desc_servicio: isPreventivo ? match.actividades : prev.desc_servicio,
                parametro1: isPreventivo ? (prev.parametro1 || match.parametro1 || '') : '',
                parametro2: isPreventivo ? (prev.parametro2 || match.parametro2 || '') : '',
                parametro3: isPreventivo ? (prev.parametro3 || match.parametro3 || '') : '',
                parametro4: isPreventivo ? (prev.parametro4 || match.parametro4 || '') : '',
              };
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const obtenerIps = async (currentInstitucion) => {
    try {
      const response = await request({ link: apiIps, method: 'GET' });
      if (response && response.success && response.ips) {
        const uniqueCities = Array.from(
          new Set(response.ips.map((item) => (item.ciudad ? item.ciudad.trim().toUpperCase() : '')).filter(Boolean))
        ).sort();
        setCiudades(uniqueCities);

        // Auto-select city if currentInstitucion matches
        if (currentInstitucion) {
          const matchIps = response.ips.find(
            (item) =>
              (item.ips && item.ips.toUpperCase() === currentInstitucion.toUpperCase()) ||
              (item.nombre && item.nombre.toUpperCase() === currentInstitucion.toUpperCase())
          );
          if (matchIps && matchIps.ciudad) {
            const city = matchIps.ciudad.trim().toUpperCase();
            setCiudad(city);
            setReporte((prev) => ({ ...prev, ciudad: city }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const obtenerEquipo = async (id) => {
    try {
      const response = await request({
        link: apiObtenerEquipo,
        method: 'GET',
        body: { id },
      });
      if (response && response.success && response.equipo) {
        const eq = response.equipo;
        setEquipo(eq);
        setReporte((prev) => ({
          ...prev,
          equipo: eq.equipo,
          marca: eq.marca,
          modelo: eq.modelo,
          serie: eq.serie,
          inventario: eq.inventario || 'NA',
          servicio: eq.servicio,
          institucion: eq.institucion,
        }));
        obtenerIps(eq.institucion);
        obtenerTodasActividades(eq.equipo);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let queryParameters = new URLSearchParams(window.location.search);
    let idEquipo = queryParameters.get('id');
    if (idEquipo) {
      obtenerEquipo(idEquipo);
    } else {
      obtenerIps('');
      obtenerTodasActividades('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter activities specifically matching this equipment name
  const actividadesFiltradas = useMemo(() => {
    const eqName = (equipo?.equipo || reporte.equipo || '').trim().toUpperCase();
    if (!eqName) return allActMtos;
    const directMatches = allActMtos.filter(
      (a) => a.equipo?.trim().toUpperCase() === eqName || a.equipo?.trim().toUpperCase().includes(eqName)
    );
    return directMatches.length > 0 ? directMatches : allActMtos;
  }, [allActMtos, equipo, reporte.equipo]);

  const handleSave = (e) => {
    const { name, value } = e.target;
    setReporte((prev) => ({ ...prev, [name]: value }));
  };

  const handleTipoServicio = (tipo) => {
    const isPreventivo = tipo === 'MTTO PREVENTIVO';
    const match = actividadesFiltradas.length > 0 ? actividadesFiltradas[0] : null;

    setReporte((prev) => ({
      ...prev,
      tipo_servicio: tipo,
      problema_reportado:
        tipo === 'MTTO CORRECTIVO'
          ? (prev.problema_reportado.includes('cronograma') ? '' : prev.problema_reportado)
          : (prev.problema_reportado || 'Mantenimiento preventivo programado según cronograma institucional.'),
      desc_servicio:
        isPreventivo
          ? (prev.desc_servicio || match?.actividades || actMto || '')
          : (tipo === 'MTTO CORRECTIVO' ? '' : prev.desc_servicio),
      // Solo cargar parámetros si es mantenimiento preventivo
      parametro1: isPreventivo ? (match?.parametro1 || prev.parametro1 || '') : '',
      valor_programado1: isPreventivo ? prev.valor_programado1 : '',
      valor_medido1: isPreventivo ? prev.valor_medido1 : '',
      parametro2: isPreventivo ? (match?.parametro2 || prev.parametro2 || '') : '',
      valor_programado2: isPreventivo ? prev.valor_programado2 : '',
      valor_medido2: isPreventivo ? prev.valor_medido2 : '',
      parametro3: isPreventivo ? (match?.parametro3 || prev.parametro3 || '') : '',
      valor_programado3: isPreventivo ? prev.valor_programado3 : '',
      valor_medido3: isPreventivo ? prev.valor_medido3 : '',
      parametro4: isPreventivo ? (match?.parametro4 || prev.parametro4 || '') : '',
      valor_programado4: isPreventivo ? prev.valor_programado4 : '',
      valor_medido4: isPreventivo ? prev.valor_medido4 : '',
    }));

    if (!isPreventivo) {
      if (tipo === 'MTTO CORRECTIVO') {
        setActmto('');
      }
    } else if (match?.actividades) {
      setActmto(match.actividades);
    }
  };

  const handleCargarProtocoloDirecto = () => {
    if (actividadesFiltradas.length > 0) {
      const selectedItem = actividadesFiltradas[0];
      const isPreventivo = reporte.tipo_servicio === 'MTTO PREVENTIVO';
      setActmto(selectedItem.actividades);
      setReporte((prev) => ({
        ...prev,
        desc_servicio: selectedItem.actividades,
        // Solo cargar parámetros si es mantenimiento preventivo
        parametro1: isPreventivo ? (selectedItem.parametro1 || '') : '',
        parametro2: isPreventivo ? (selectedItem.parametro2 || '') : '',
        parametro3: isPreventivo ? (selectedItem.parametro3 || '') : '',
        parametro4: isPreventivo ? (selectedItem.parametro4 || '') : '',
      }));
    } else {
      alert(`No se encontró un protocolo de mantenimiento predefinido para "${equipo?.equipo || reporte.equipo}". Puedes escribirlo manualmente.`);
    }
  };

  const CreateReport = async (e) => {
    if (e) e.preventDefault();
    if (!equipo?.equipo && !reporte.equipo) {
      alert('Por favor verifique los datos del equipo');
      return;
    }

    const firmaIngData =
      firmaIngRef.current && !firmaIngRef.current.isEmpty()
        ? firmaIngRef.current.toData()
        : null;

    const firmaRecData =
      firmaRecref.current && !firmaRecref.current.isEmpty()
        ? firmaRecref.current.toData()
        : null;

    const esPreventivo = reporte.tipo_servicio === 'MTTO PREVENTIVO';

    setSubmitting(true);
    const body = {
      numero_reporte: numReporte,
      institucion: equipo.institucion || reporte.institucion,
      fecha: reporte.fecha,
      servicio: equipo.servicio || reporte.servicio,
      ciudad: ciudad || reporte.ciudad,
      tipo_servicio: reporte.tipo_servicio,
      equipo: equipo.equipo || reporte.equipo,
      marca: equipo.marca || reporte.marca,
      modelo: equipo.modelo || reporte.modelo,
      serie: equipo.serie || reporte.serie,
      inventario: equipo.inventario || reporte.inventario || 'NA',
      problema_reportado: reporte.problema_reportado || 'Servicio técnico realizado.',
      desc_servicio: reporte.desc_servicio || actMto,
      cantidad1: reporte.cantidad1 || 'NA',
      descripcion1: reporte.descripcion1 || 'NA',
      valor1: reporte.valor1 || 'NA',
      cantidad2: reporte.cantidad2 || 'NA',
      descripcion2: reporte.descripcion2 || 'NA',
      valor2: reporte.valor2 || 'NA',
      cantidad3: reporte.cantidad3 || 'NA',
      descripcion3: reporte.descripcion3 || 'NA',
      valor3: reporte.valor3 || 'NA',
      cantidad4: reporte.cantidad4 || 'NA',
      descripcion4: reporte.descripcion4 || 'NA',
      valor4: reporte.valor4 || 'NA',
      parametro1: esPreventivo ? (reporte.parametro1 || 'NA') : 'NA',
      valor_programado1: esPreventivo ? (reporte.valor_programado1 || 'NA') : 'NA',
      valor_medido1: esPreventivo ? (reporte.valor_medido1 || 'NA') : 'NA',
      parametro2: esPreventivo ? (reporte.parametro2 || 'NA') : 'NA',
      valor_programado2: esPreventivo ? (reporte.valor_programado2 || 'NA') : 'NA',
      valor_medido2: esPreventivo ? (reporte.valor_medido2 || 'NA') : 'NA',
      parametro3: esPreventivo ? (reporte.parametro3 || 'NA') : 'NA',
      valor_programado3: esPreventivo ? (reporte.valor_programado3 || 'NA') : 'NA',
      valor_medido3: esPreventivo ? (reporte.valor_medido3 || 'NA') : 'NA',
      parametro4: esPreventivo ? (reporte.parametro4 || 'NA') : 'NA',
      valor_programado4: esPreventivo ? (reporte.valor_programado4 || 'NA') : 'NA',
      valor_medido4: esPreventivo ? (reporte.valor_medido4 || 'NA') : 'NA',
      observaciones: reporte.observaciones,
      estado_final: reporte.estado_final,
      firma_ingeniero: firmaIngData,
      nombre_ingeniero: reporte.nombre_ingeniero,
      cargo_ingeniero: reporte.cargo_ingeniero,
      firma_recibe: firmaRecData,
      nombre_recibe: reporte.nombre_recibe,
      cargo_recibe: reporte.cargo_recibe,
    };

    try {
      const response = await request({
        link: apiCreateReporte,
        body,
        method: 'POST',
      });
      if (response && response.success) {
        alert('¡Reporte de servicio creado exitosamente!');
        window.location.href = storedUser && storedUser.rol === 'user' ? './cronogramauser' : './cronograma';
      } else {
        alert(`${response?.message || 'Verifique que todos los campos requeridos estén diligenciados'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al crear el reporte');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contenedor" style={{ maxWidth: '1050px', margin: '0 auto', padding: '20px 15px' }}>
      <main>
        {/* Navigation / Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            padding: '16px 24px',
            borderRadius: '12px',
            border: '1.5px solid #334155',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
              <FaFileAlt color="#38bdf8" /> Diligenciar Reporte de Servicio
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Diligencia los datos técnicos, actividades y firmas del servicio técnico realizado.
            </p>
          </div>
          <Link
            to={cronogramaUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13.5px',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <FaArrowLeft size={13} /> Volver al Cronograma
          </Link>
        </div>

        {/* Structured Form Container */}
        <form onSubmit={CreateReport}>
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid #38bdf8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              marginBottom: '24px',
            }}
          >
            <table className="tabla-reporte" style={{ margin: 0, border: 'none', borderRadius: 0, width: '100%' }}>
              {/* Document Header Row */}
              <thead>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      backgroundColor: '#0f2744',
                      padding: '16px 20px',
                      verticalAlign: 'middle',
                      borderBottom: '2px solid #38bdf8',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.5px' }}>
                      REPORTE DE SERVICIO TÉCNICO
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Gestión y Mantenimiento Biomédico GEMTTO
                    </div>
                  </td>
                  <td
                    colSpan={2}
                    style={{
                      backgroundColor: '#0f2744',
                      textAlign: 'right',
                      padding: '16px 20px',
                      verticalAlign: 'middle',
                      borderBottom: '2px solid #38bdf8',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600' }}>Nº DE REPORTE: </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444', marginLeft: '6px' }}>
                      #{numReporte}
                    </span>
                  </td>
                </tr>
              </thead>
              <tbody>
                {/* 1. Datos Institucion */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaHospital style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    1. INFORMACIÓN DE LA INSTITUCIÓN
                  </th>
                </tr>
                <tr>
                  <td colSpan={2} style={{ width: '50%' }}>
                    <strong style={{ color: '#38bdf8' }}>IPS / CLIENTE: </strong>
                    <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '15px' }}>
                      {equipo?.institucion || reporte.institucion || 'No especificada'}
                    </span>
                  </td>
                  <td colSpan={2} style={{ width: '50%' }}>
                    <strong style={{ color: '#38bdf8', marginRight: '8px' }}>FECHA DEL SERVICIO:</strong>
                    <input
                      name="fecha"
                      type="date"
                      value={reporte.fecha}
                      onChange={handleSave}
                      className="input-report"
                      style={{ maxWidth: '220px', display: 'inline-block', colorScheme: 'dark', cursor: 'pointer' }}
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>SERVICIO / ÁREA: </strong>
                    <span style={{ color: '#f8fafc' }}>{equipo?.servicio || reporte.servicio || '-'}</span>
                  </td>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8', marginRight: '8px' }}>CIUDAD:</strong>
                    <select
                      className="input-report"
                      style={{ maxWidth: '240px', display: 'inline-block' }}
                      value={ciudad}
                      onChange={(e) => {
                        setCiudad(e.target.value);
                        setReporte((prev) => ({ ...prev, ciudad: e.target.value }));
                      }}
                      required
                    >
                      <option value="">-- Seleccionar Ciudad --</option>
                      {ciudades.map((cityName, idx) => (
                        <option key={idx} value={cityName}>
                          {cityName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>

                {/* 2. Tipo de Servicio */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaWrench style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    2. TIPO DE SERVICIO REALIZADO
                  </th>
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      {['MTTO PREVENTIVO', 'MTTO CORRECTIVO', 'INSTALACION', 'OTRO'].map((tipo) => (
                        <label
                          key={tipo}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            backgroundColor: reporte.tipo_servicio === tipo ? '#1e3a8a' : '#0f172a',
                            border: reporte.tipo_servicio === tipo ? '1.5px solid #38bdf8' : '1px solid #334155',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#f8fafc',
                            fontWeight: '600',
                            fontSize: '13.5px',
                            transition: 'all 0.2s',
                          }}
                        >
                          <input
                            name="tipo_servicio"
                            type="radio"
                            value={tipo}
                            checked={reporte.tipo_servicio === tipo}
                            onChange={() => handleTipoServicio(tipo)}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          {tipo}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>

                {/* 3. Informacion del Equipo */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaMicrochip style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    3. INFORMACIÓN DEL EQUIPO
                  </th>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>EQUIPO: </strong>
                    <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{equipo?.equipo || reporte.equipo || '-'}</span>
                  </td>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>MARCA: </strong>
                    <span style={{ color: '#f8fafc' }}>{equipo?.marca || reporte.marca || '-'}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>MODELO: </strong>
                    <span style={{ color: '#f8fafc' }}>{equipo?.modelo || reporte.modelo || '-'}</span>
                  </td>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>SERIE: </strong>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#38bdf8' }}>
                      {equipo?.serie || reporte.serie || '-'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>INVENTARIO: </strong>
                    <span style={{ color: '#f8fafc' }}>{equipo?.inventario || reporte.inventario || 'NA'}</span>
                  </td>
                </tr>

                {/* 4. Problema Reportado */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaExclamationCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    4. PROBLEMA REPORTADO POR EL CLIENTE
                  </th>
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: '14px' }}>
                    <textarea
                      name="problema_reportado"
                      className="textarea-report"
                      placeholder="Describa el motivo del servicio, falla presentada o motivo de la intervención..."
                      value={reporte.problema_reportado}
                      onChange={handleSave}
                      rows={3}
                    />
                  </td>
                </tr>

                {/* 5. Descripcion del Servicio */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaClipboardList style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    5. DESCRIPCIÓN DEL SERVICIO REALIZADO
                  </th>
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: '16px' }}>
                    {/* Action Bar: Cargar Protocolo / Escribir Manualmente */}
                    <div
                      style={{
                        marginBottom: '14px',
                        backgroundColor: '#0f172a',
                        padding: '12px 18px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ color: '#cbd5e1', fontSize: '13.5px' }}>
                        Protocolo asociado: <strong style={{ color: '#38bdf8' }}>{equipo?.equipo || reporte.equipo || 'Equipo'}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleCargarProtocoloDirecto}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '9px 18px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: '1px solid #38bdf8',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <FaBolt color="#fde047" /> Cargar Protocolo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActmto('');
                            setReporte((prev) => ({ ...prev, desc_servicio: '' }));
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 16px',
                            backgroundColor: '#334155',
                            color: '#f8fafc',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          <FaPen /> Escribir Manualmente
                        </button>
                      </div>
                    </div>

                    <textarea
                      name="desc_servicio"
                      className="textarea-report"
                      placeholder="Detalle paso a paso las actividades realizadas, diagnóstico técnico, reparaciones o pruebas de funcionamiento..."
                      value={reporte.desc_servicio || actMto}
                      onChange={(e) => {
                        setActmto(e.target.value);
                        handleSave(e);
                      }}
                      rows={5}
                      required
                    />
                  </td>
                </tr>

                {/* 6. Repuestos y Materiales */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaCogs style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    6. REPUESTOS, INSUMOS Y MATERIALES EMPLEADOS
                  </th>
                </tr>
                <tr style={{ backgroundColor: '#0f172a', fontWeight: '700', fontSize: '12.5px', color: '#94a3b8' }}>
                  <td style={{ width: '15%', textAlign: 'center' }}>CANTIDAD</td>
                  <td colSpan={2} style={{ width: '60%' }}>DESCRIPCIÓN DEL REPUESTO / INSUMO</td>
                  <td style={{ width: '25%', textAlign: 'center' }}>VALOR UNITARIO</td>
                </tr>
                {[1, 2, 3, 4].map((idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        className="input-report"
                        style={{ textAlign: 'center' }}
                        name={`cantidad${idx}`}
                        type="text"
                        placeholder="Ej. 1"
                        value={reporte[`cantidad${idx}`]}
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-report"
                        name={`descripcion${idx}`}
                        type="text"
                        placeholder={`Descripción repuesto o insumo ${idx}`}
                        value={reporte[`descripcion${idx}`]}
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-report"
                        name={`valor${idx}`}
                        type="text"
                        placeholder="Ej. $0"
                        value={reporte[`valor${idx}`]}
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                ))}

                {/* 7. Verificacion de Parametros */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaSlidersH style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    7. VERIFICACIÓN DE PARÁMETROS DE FUNCIONAMIENTO {reporte.tipo_servicio !== 'MTTO PREVENTIVO' ? '(NO APLICA)' : ''}
                  </th>
                </tr>
                {reporte.tipo_servicio === 'MTTO PREVENTIVO' ? (
                  <>
                    <tr style={{ backgroundColor: '#0f172a', fontWeight: '700', fontSize: '12.5px', color: '#94a3b8' }}>
                      <td style={{ width: '30%' }}>PARÁMETRO EVALUADO</td>
                      <td colSpan={2} style={{ width: '40%', textAlign: 'center' }}>VALOR PROGRAMADO (TOLERANCIA)</td>
                      <td style={{ width: '30%', textAlign: 'center' }}>VALOR MEDIDO</td>
                    </tr>
                    {[1, 2, 3, 4].map((idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            className="input-report"
                            name={`parametro${idx}`}
                            type="text"
                            placeholder={`Ej. Voltaje, Presión, SpO2...`}
                            value={reporte[`parametro${idx}`]}
                            onChange={handleSave}
                          />
                        </td>
                        <td colSpan={2}>
                          <input
                            className="input-report"
                            style={{ textAlign: 'center' }}
                            name={`valor_programado${idx}`}
                            type="text"
                            placeholder="Ej. 120V ± 5%"
                            value={reporte[`valor_programado${idx}`]}
                            onChange={handleSave}
                          />
                        </td>
                        <td>
                          <input
                            className="input-report"
                            style={{ textAlign: 'center' }}
                            name={`valor_medido${idx}`}
                            type="text"
                            placeholder="Ej. 119.5V"
                            value={reporte[`valor_medido${idx}`]}
                            onChange={handleSave}
                          />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '16px 20px', backgroundColor: '#0f172a', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: '700' }}>No requiere verificación de parámetros:</span> La calibración y verificación de parámetros cuantitativos aplica exclusivamente a <strong>Mantenimiento Preventivo</strong>. Para {reporte.tipo_servicio} no se cargan ni registran parámetros.
                    </td>
                  </tr>
                )}

                {/* 8. Observaciones */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaClipboardList style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    8. OBSERVACIONES Y RECOMENDACIONES
                  </th>
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: '14px' }}>
                    <textarea
                      name="observaciones"
                      className="textarea-report"
                      placeholder="Observaciones de seguridad, estado operativo o recomendaciones para el personal asistencial..."
                      value={reporte.observaciones}
                      onChange={handleSave}
                      rows={3}
                    />
                  </td>
                </tr>

                {/* 9. Estado Final */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    9. ESTADO FINAL DEL EQUIPO
                  </th>
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {[
                        { val: 'EQUIPO FUNCIONANDO CORRECTAMENTE', label: '🟢 FUNCIONANDO CORRECTAMENTE' },
                        { val: 'EQUIPO EN ESPERA DE REPUESTOS ', label: '🟡 EN ESPERA DE REPUESTOS' },
                        { val: 'EQUIPO FUERA DE SERVICIO', label: '🔴 FUERA DE SERVICIO' },
                        { val: 'EQUIPO PARA BAJA', label: '⚫ EQUIPO PARA BAJA' },
                      ].map((st) => (
                        <label
                          key={st.val}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            backgroundColor: reporte.estado_final === st.val ? '#1e3a8a' : '#0f172a',
                            border: reporte.estado_final === st.val ? '1.5px solid #38bdf8' : '1px solid #334155',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#f8fafc',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.2s',
                          }}
                        >
                          <input
                            name="estado_final"
                            type="radio"
                            value={st.val}
                            checked={reporte.estado_final === st.val}
                            onChange={handleSave}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          {st.label}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>

                {/* 10. Firmas Digitales y Responsables */}
                <tr>
                  <th colSpan={2} style={{ textAlign: 'center', backgroundColor: '#0f3b60', color: '#38bdf8', fontSize: '14px', padding: '12px' }}>
                    <FaSignature style={{ marginRight: '6px' }} /> INGENIERO / TÉCNICO RESPONSABLE
                  </th>
                  <th colSpan={2} style={{ textAlign: 'center', backgroundColor: '#0f3b60', color: '#86efac', fontSize: '14px', padding: '12px' }}>
                    <FaSignature style={{ marginRight: '6px' }} /> RECIBÍ A SATISFACCIÓN (CLIENTE)
                  </th>
                </tr>
                <tr>
                  {/* Firma Ingeniero */}
                  <td colSpan={2} style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#0f172a' }}>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold', marginBottom: '6px' }}>
                      DIBUJE SU FIRMA AQUÍ (RESPUESTA INSTANTÁNEA):
                    </div>
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '2px dashed #0284c7',
                        overflow: 'hidden',
                        display: 'inline-block',
                        touchAction: 'none',
                      }}
                    >
                      <SignatureCanvas
                        canvasProps={{
                          width: 360,
                          height: 140,
                          style: { display: 'block', margin: '0 auto', cursor: 'crosshair', backgroundColor: '#ffffff', touchAction: 'none' },
                        }}
                        penColor="#000000"
                        ref={firmaIngRef}
                        maxWidth={2.2}
                        minWidth={0.8}
                      />
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn-limpiar-firma"
                        onClick={() => firmaIngRef.current?.clear()}
                      >
                        <FaEraser /> Limpiar Firma
                      </button>
                    </div>
                  </td>
                  {/* Firma Recibe */}
                  <td colSpan={2} style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#0f172a' }}>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold', marginBottom: '6px' }}>
                      DIBUJE SU FIRMA AQUÍ (RESPUESTA INSTANTÁNEA):
                    </div>
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '2px dashed #10b981',
                        overflow: 'hidden',
                        display: 'inline-block',
                        touchAction: 'none',
                      }}
                    >
                      <SignatureCanvas
                        canvasProps={{
                          width: 360,
                          height: 140,
                          style: { display: 'block', margin: '0 auto', cursor: 'crosshair', backgroundColor: '#ffffff', touchAction: 'none' },
                        }}
                        penColor="#000000"
                        maxWidth={2.2}
                        minWidth={0.8}
                        ref={firmaRecref}
                      />
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn-limpiar-firma"
                        onClick={() => firmaRecref.current?.clear()}
                      >
                        <FaEraser /> Limpiar Firma
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  {/* Datos Ingeniero */}
                  <td colSpan={2} style={{ padding: '14px', backgroundColor: '#0f172a' }}>
                    <div className="campo-firma-box" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>NOMBRE DEL INGENIERO:</label>
                      <input
                        className="campo-firma-input"
                        name="nombre_ingeniero"
                        type="text"
                        placeholder="Ej. Ing. Carlos Pérez"
                        value={reporte.nombre_ingeniero}
                        onChange={handleSave}
                      />
                    </div>
                    <div className="campo-firma-box">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>CARGO:</label>
                      <input
                        className="campo-firma-input"
                        name="cargo_ingeniero"
                        type="text"
                        placeholder="Ej. Ingeniero Biomédico"
                        value={reporte.cargo_ingeniero}
                        onChange={handleSave}
                      />
                    </div>
                  </td>
                  {/* Datos Recibe */}
                  <td colSpan={2} style={{ padding: '14px', backgroundColor: '#0f172a' }}>
                    <div className="campo-firma-box" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#86efac' }}>NOMBRE DE QUIEN RECIBE:</label>
                      <input
                        className="campo-firma-input"
                        name="nombre_recibe"
                        type="text"
                        placeholder="Ej. Dra. María González"
                        value={reporte.nombre_recibe}
                        onChange={handleSave}
                      />
                    </div>
                    <div className="campo-firma-box">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#86efac' }}>CARGO:</label>
                      <input
                        className="campo-firma-input"
                        name="cargo_recibe"
                        type="text"
                        placeholder="Ej. Coordinador de Área"
                        value={reporte.cargo_recibe}
                        onChange={handleSave}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Soportes y Anexos Upload Box */}
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '18px 24px',
              borderRadius: '12px',
              border: '1.5px solid #334155',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileUpload color="#38bdf8" /> Adjuntar Soporte Fotográfico o Documento (Opcional)
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>
                Formatos permitidos: PDF, JPG, PNG vinculados al reporte #{numReporte}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                onChange={handleFileChange}
                style={{
                  color: '#cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#0f172a',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                }}
              />
              <button
                type="button"
                onClick={handleUploadFile}
                disabled={uploading || !file}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: uploading || !file ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Subiendo...' : 'Subir Anexo'}
              </button>
            </div>
          </div>

          {/* Final Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginBottom: '40px' }}>
            <Link
              to={cronogramaUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                backgroundColor: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 32px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.45)',
                transition: 'all 0.2s',
              }}
            >
              <FaSave size={16} /> {submitting ? 'Creando Reporte...' : 'Crear y Guardar Reporte de Servicio'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ReporteService;
