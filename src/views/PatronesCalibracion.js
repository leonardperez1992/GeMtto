import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiPatrones, apiCrearPatron, apiEditarPatron, apiEliminarPatron } from '../utils/api';
import request from '../utils/request';
import { FaPlus, FaArrowLeft, FaCheck, FaTimes, FaTrash, FaEdit } from 'react-icons/fa';

export default function PatronesCalibracion() {
  const [patrones, setPatrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    marca: '',
    modelo: '',
    serie: '',
    certificadoCalibracion: '',
    entidadAcreditadora: '',
    fechaCalibracion: '',
    fechaVencimiento: '',
    magnitud: 'Presión',
    rango: '',
    resolucion: 0.1,
    incertidumbreExpandida: 0.2,
    factorK: 2,
    unidad: 'mmHg',
    observaciones: '',
    activo: true,
  });

  const cargarPatrones = async () => {
    setLoading(true);
    const res = await request({ link: apiPatrones });
    if (res?.success) {
      setPatrones(res.patrones || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarPatrones();
  }, []);

  const handleOpenModal = (patron = null) => {
    if (patron) {
      setEditId(patron._id);
      setForm({ ...patron });
    } else {
      setEditId(null);
      setForm({
        codigo: '',
        nombre: '',
        marca: '',
        modelo: '',
        serie: '',
        certificadoCalibracion: '',
        entidadAcreditadora: '',
        fechaCalibracion: '',
        fechaVencimiento: '',
        magnitud: 'Presión',
        rango: '',
        resolucion: 0.1,
        incertidumbreExpandida: 0.2,
        factorK: 2,
        unidad: 'mmHg',
        observaciones: '',
        activo: true,
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.codigo || !form.nombre) {
      alert('El código y el nombre del patrón son obligatorios');
      return;
    }

    const link = editId ? `${apiEditarPatron}/${editId}` : apiCrearPatron;
    const method = editId ? 'PUT' : 'POST';

    const res = await request({ link, body: form, method });
    if (res?.success) {
      alert(editId ? 'Patrón actualizado con éxito' : 'Patrón registrado con éxito');
      setShowModal(false);
      cargarPatrones();
    } else {
      alert(res?.message || 'Error al guardar el patrón');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este patrón de calibración?')) {
      const res = await request({
        link: `${apiEliminarPatron}/${id}`,
        method: 'DELETE',
      });
      if (res?.success) {
        alert('Patrón eliminado correctamente');
        cargarPatrones();
      } else {
        alert(res?.message || 'Error al eliminar');
      }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1250, margin: '0 auto' }}>
      {/* Encabezado */}
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
            <FaArrowLeft size={13} /> Volver a Calibraciones
          </Link>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 700 }}>
              Banco de Patrones de Calibración
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Trazabilidad metrológica e incertidumbres según ISO/IEC 17025
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#0284c7',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: 8,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
          }}
        >
          <FaPlus size={13} /> Nuevo Patrón
        </button>
      </div>

      {/* Tabla de patrones */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '12px 16px' }}>Código</th>
              <th style={{ padding: '12px 16px' }}>Nombre / Instrumento</th>
              <th style={{ padding: '12px 16px' }}>Magnitud</th>
              <th style={{ padding: '12px 16px' }}>Certificado Calibración</th>
              <th style={{ padding: '12px 16px' }}>Incertidumbre (U)</th>
              <th style={{ padding: '12px 16px' }}>Vigencia</th>
              <th style={{ padding: '12px 16px' }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  Cargando banco de patrones...
                </td>
              </tr>
            ) : patrones.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  No se han registrado patrones metrológicos todavía.
                </td>
              </tr>
            ) : (
              patrones.map((p) => {
                const vencido = p.fechaVencimiento && new Date(p.fechaVencimiento) < new Date();
                return (
                  <tr
                    key={p._id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0369a1' }}>
                      {p.codigo}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {p.marca} {p.modelo} {p.serie ? `• S/N: ${p.serie}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {p.magnitud}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{p.certificadoCalibracion || 'S/N'}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{p.entidadAcreditadora}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <strong>± {p.incertidumbreExpandida}</strong> {p.unidad} (k={p.factorK})
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Res: {p.resolucion} {p.unidad}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          color: vencido ? '#dc2626' : '#16a34a',
                          fontWeight: 600,
                        }}
                      >
                        {p.fechaVencimiento || 'Indefinida'}
                      </span>
                      {vencido && (
                        <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                          VENCIDO
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: p.activo ? '#dcfce7' : '#f1f5f9',
                          color: p.activo ? '#15803d' : '#64748b',
                        }}
                      >
                        {p.activo ? <FaCheck size={11} /> : <FaTimes size={11} />}
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          onClick={() => handleOpenModal(p)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: '#0284c7',
                          }}
                          title="Editar patrón"
                        >
                          <FaEdit size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fca5a5',
                            padding: '6px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: '#dc2626',
                          }}
                          title="Eliminar patrón"
                        >
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: 12,
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 700 }}>
                {editId ? 'Editar Patrón de Calibración' : 'Registrar Nuevo Patrón de Calibración'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={form.codigo}
                    onChange={handleChange}
                    required
                    placeholder="Ej: PAT-PRES-01"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Magnitud Metrológica *
                  </label>
                  <select
                    name="magnitud"
                    value={form.magnitud}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  >
                    <option value="Presión">Presión (Tensiómetros, Manómetros)</option>
                    <option value="Masa">Masa (Básculas, Balanzas)</option>
                    <option value="Volumen">Volumen (Micropipetas, Dispensadores)</option>
                    <option value="Temperatura">Temperatura</option>
                    <option value="Eléctrica">Eléctrica</option>
                    <option value="Tiempo/Frecuencia">Tiempo / Frecuencia</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Nombre del Instrumento Patrón *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Manómetro Digital de Precisión / Juego de Pesas Clase M1"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Marca
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={form.marca}
                    onChange={handleChange}
                    placeholder="Ej: Fluke / Ohaus / Keller"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Modelo
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    value={form.modelo}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Número de Serie
                  </label>
                  <input
                    type="text"
                    name="serie"
                    value={form.serie}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    name="unidad"
                    value={form.unidad}
                    onChange={handleChange}
                    placeholder="mmHg, kg, g, mg, µL, °C"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Nº Certificado de Calibración
                  </label>
                  <input
                    type="text"
                    name="certificadoCalibracion"
                    value={form.certificadoCalibracion}
                    onChange={handleChange}
                    placeholder="Ej: CERT-ONAC-2025-1892"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Laboratorio / Ente Acreditador
                  </label>
                  <input
                    type="text"
                    name="entidadAcreditadora"
                    value={form.entidadAcreditadora}
                    onChange={handleChange}
                    placeholder="Ej: Laboratorio Metrológico Acreditado ONAC"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Fecha Calibración Patrón
                  </label>
                  <input
                    type="date"
                    name="fechaCalibracion"
                    value={form.fechaCalibracion}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Fecha Vencimiento Calibración
                  </label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={form.fechaVencimiento}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Resolución Patrón
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="resolucion"
                    value={form.resolucion}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Incertidumbre Expandida (U)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="incertidumbreExpandida"
                    value={form.incertidumbreExpandida}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Factor de Cobertura (k)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="factorK"
                    value={form.factorK}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Rango de Operación
                  </label>
                  <input
                    type="text"
                    name="rango"
                    value={form.rango}
                    onChange={handleChange}
                    placeholder="Ej: 0 a 300 mmHg / 0 a 150 kg"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Observaciones Metrológicas
                  </label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    rows="2"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="activo" style={{ fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    Patrón Activo y habilitado para calibraciones
                  </label>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 20,
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editId ? 'Guardar Cambios' : 'Registrar Patrón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
