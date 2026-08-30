import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiObtenerReporte, apiUpdateReporte } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import {
  FaEdit,
  FaHospital,
  FaWrench,
  FaMicrochip,
  FaExclamationCircle,
  FaClipboardList,
  FaCogs,
  FaSlidersH,
  FaCheckCircle,
  FaSignature,
  FaSave,
  FaArrowLeft,
  FaEraser,
} from 'react-icons/fa';

function UpdateReporte() {
  const [reporte, setReporte] = useState({
    numero_reporte: '',
    institucion: '',
    fecha: '',
    servicio: '',
    ciudad: '',
    tipo_servicio: '',
    equipo: '',
    marca: '',
    modelo: '',
    serie: '',
    inventario: '',
    problema_reportado: '',
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
    observaciones: '',
    estado_final: '',
    nombre_ingeniero: '',
    cargo_ingeniero: '',
    nombre_recibe: '',
    cargo_recibe: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const firmaIngRef = useRef({});
  const firmaRecref = useRef({});

  const obtenerReporte = async (id) => {
    setLoading(true);
    try {
      const response = await request({
        link: apiObtenerReporte,
        method: 'GET',
        body: { id },
      });
      if (response && response.success && response.reporte) {
        setReporte(response.reporte);
        setTimeout(() => {
          if (response.reporte.firma_ingeniero && firmaIngRef.current?.fromData) {
            try { firmaIngRef.current.fromData(response.reporte.firma_ingeniero); } catch (e) {}
          }
          if (response.reporte.firma_recibe && firmaRecref.current?.fromData) {
            try { firmaRecref.current.fromData(response.reporte.firma_recibe); } catch (e) {}
          }
        }, 350);
      } else {
        alert(`${response?.message || 'Error al obtener reporte'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let queryParameters = new URLSearchParams(window.location.search);
    let idReporte = queryParameters.get('id');
    if (idReporte) {
      obtenerReporte(idReporte);
    } else {
      alert('No se especificó el ID del reporte');
      window.location.href = './reportes';
    }
  }, []);

  const handleSave = (e) => {
    const { name, value } = e.target;
    setReporte((prev) => ({ ...prev, [name]: value }));
  };

  const UpdateReport = async (e) => {
    if (e) e.preventDefault();
    if (!reporte.equipo || !reporte.serie) {
      alert('Por favor verifique los campos obligatorios del reporte.');
      return;
    }

    const firmaIngData =
      firmaIngRef.current && !firmaIngRef.current.isEmpty()
        ? firmaIngRef.current.toData()
        : reporte.firma_ingeniero || null;

    const firmaRecData =
      firmaRecref.current && !firmaRecref.current.isEmpty()
        ? firmaRecref.current.toData()
        : reporte.firma_recibe || null;

    setSubmitting(true);
    const body = {
      ...reporte,
      firma_ingeniero: firmaIngData,
      firma_recibe: firmaRecData,
    };

    try {
      const response = await request({
        link: apiUpdateReporte,
        body,
        method: 'POST',
      });
      if (response && response.success) {
        alert('¡Reporte actualizado exitosamente!');
        window.location.href = './reportes';
      } else {
        alert(`${response?.message || 'Error al actualizar el reporte'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al actualizar reporte');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="contenedor" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        Cargando datos del reporte de servicio...
      </div>
    );
  }

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
              <FaEdit color="#38bdf8" /> Editar Reporte de Servicio
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Modifica la información, actividades, mediciones o firmas del reporte #{reporte?.numero_reporte}.
            </p>
          </div>
          <Link
            to="/reportes"
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
            <FaArrowLeft size={13} /> Volver a Reportes
          </Link>
        </div>

        {/* Structured Form */}
        <form onSubmit={UpdateReport}>
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
                      EDITAR REPORTE DE SERVICIO TÉCNICO
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
                      #{reporte?.numero_reporte}
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
                    <input
                      name="institucion"
                      value={reporte.institucion || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
                  </td>
                  <td colSpan={2} style={{ width: '50%' }}>
                    <strong style={{ color: '#38bdf8' }}>FECHA: </strong>
                    <input
                      name="fecha"
                      type="date"
                      value={reporte.fecha || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>SERVICIO: </strong>
                    <input
                      name="servicio"
                      value={reporte.servicio || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
                  </td>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>CIUDAD: </strong>
                    <input
                      name="ciudad"
                      value={reporte.ciudad || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
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
                  <td colSpan={4} style={{ padding: '14px' }}>
                    <input
                      name="tipo_servicio"
                      value={reporte.tipo_servicio || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. MTTO PREVENTIVO, MTTO CORRECTIVO..."
                    />
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
                    <input
                      name="equipo"
                      value={reporte.equipo || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
                  </td>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>MARCA: </strong>
                    <input
                      name="marca"
                      value={reporte.marca || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>MODELO: </strong>
                    <input
                      name="modelo"
                      value={reporte.modelo || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
                  </td>
                  <td colSpan={2}>
                    <strong style={{ color: '#38bdf8' }}>SERIE: </strong>
                    <input
                      name="serie"
                      value={reporte.serie || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
                  </td>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>INVENTARIO: </strong>
                    <input
                      name="inventario"
                      value={reporte.inventario || ''}
                      onChange={handleSave}
                      className="input-report"
                      style={{ marginTop: '4px' }}
                    />
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
                      value={reporte.problema_reportado || ''}
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
                  <td colSpan={4} style={{ padding: '14px' }}>
                    <textarea
                      name="desc_servicio"
                      className="textarea-report"
                      value={reporte.desc_servicio || ''}
                      onChange={handleSave}
                      rows={4}
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
                        value={reporte[`cantidad${idx}`] || ''}
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-report"
                        name={`descripcion${idx}`}
                        type="text"
                        value={reporte[`descripcion${idx}`] || ''}
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-report"
                        name={`valor${idx}`}
                        type="text"
                        value={reporte[`valor${idx}`] || ''}
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                ))}

                {/* 7. Verificacion de Parametros */}
                <tr>
                  <th colSpan={4} style={{ backgroundColor: '#0f2b48', color: '#38bdf8', fontSize: '14px' }}>
                    <FaSlidersH style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    7. VERIFICACIÓN DE PARÁMETROS DE FUNCIONAMIENTO
                  </th>
                </tr>
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
                        value={reporte[`parametro${idx}`] || ''}
                        onChange={handleSave}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        className="input-report"
                        style={{ textAlign: 'center' }}
                        name={`valor_programado${idx}`}
                        type="text"
                        value={reporte[`valor_programado${idx}`] || ''}
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <input
                        className="input-report"
                        style={{ textAlign: 'center' }}
                        name={`valor_medido${idx}`}
                        type="text"
                        value={reporte[`valor_medido${idx}`] || ''}
                        onChange={handleSave}
                      />
                    </td>
                  </tr>
                ))}

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
                      value={reporte.observaciones || ''}
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
                  <td colSpan={4} style={{ padding: '14px' }}>
                    <input
                      name="estado_final"
                      value={reporte.estado_final || ''}
                      onChange={handleSave}
                      className="input-report"
                    />
                  </td>
                </tr>

                {/* 10. Firmas Digitales */}
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
                      FIRMA DEL INGENIERO:
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
                      FIRMA DE QUIEN RECIBE:
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
                        value={reporte.nombre_ingeniero || ''}
                        onChange={handleSave}
                      />
                    </div>
                    <div className="campo-firma-box">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>CARGO:</label>
                      <input
                        className="campo-firma-input"
                        name="cargo_ingeniero"
                        type="text"
                        value={reporte.cargo_ingeniero || ''}
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
                        value={reporte.nombre_recibe || ''}
                        onChange={handleSave}
                      />
                    </div>
                    <div className="campo-firma-box">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#86efac' }}>CARGO:</label>
                      <input
                        className="campo-firma-input"
                        name="cargo_recibe"
                        type="text"
                        value={reporte.cargo_recibe || ''}
                        onChange={handleSave}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginBottom: '40px' }}>
            <Link
              to="/reportes"
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
              <FaSave size={16} /> {submitting ? 'Guardando...' : 'Guardar Cambios del Reporte'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default UpdateReporte;
