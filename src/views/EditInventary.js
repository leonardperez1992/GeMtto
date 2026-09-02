import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiEditInventario, apiObtenerEquipo, apiIps } from '../utils/api';
import request from '../utils/request';
import { FaEdit, FaSave, FaArrowLeft, FaHospital, FaMicrochip, FaCalendarAlt } from 'react-icons/fa';
import MesesSelector from '../components/MesesSelector';
import { calcularMesesSugeridos } from '../utils/cronogramaHelper';

function EditInventary() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listaIps, setListaIps] = useState([]);
  const [inventary, setInventary] = useState({
    _id: '',
    equipo: '',
    marca: '',
    modelo: '',
    serie: '',
    inventario: '',
    institucion: '',
    servicio: '',
    ubicacion: '',
    registro_invima: '',
    riesgo: '',
    responsable: '',
    forma_adquisicion: '',
    fecha_instalacion: '',
    fecha_fabricacion: '',
    periodicidad: '',
    meses_mantenimiento: [],
  });

  const fetchIps = async () => {
    try {
      const response = await request({
        link: apiIps,
        method: 'GET',
      });
      if (response && response.success && Array.isArray(response.ips)) {
        setListaIps(response.ips);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const obtenerEquipos = async (id) => {
    setLoading(true);
    try {
      const response = await request({
        link: apiObtenerEquipo,
        method: 'GET',
        body: { id },
      });
      if (response && response.success && response.equipo) {
        const eq = response.equipo;
        // Si no tiene meses guardados, auto-sugerir según periodicidad
        if (!eq.meses_mantenimiento || eq.meses_mantenimiento.length === 0) {
          eq.meses_mantenimiento = calcularMesesSugeridos(eq.periodicidad, eq.fecha_instalacion);
        }
        setInventary(eq);
      } else {
        alert(`${response?.message || 'Error al obtener equipo'}`);
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
    let idEquipo = queryParameters.get('id');
    if (idEquipo) {
      obtenerEquipos(idEquipo);
    } else {
      alert('No se especificó el ID del equipo a editar');
      window.location.href = './inventarioua';
    }
    fetchIps();
  }, []);

  const handleSave = (e) => {
    const { name, value } = e.target;
    setInventary((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'periodicidad' && value) {
        updated.meses_mantenimiento = calcularMesesSugeridos(value, prev.fecha_instalacion);
      }
      return updated;
    });
  };

  const EditEquipo = async (e) => {
    if (e) e.preventDefault();
    if (!inventary.equipo || !inventary.serie) {
      alert('Por favor diligencie los campos obligatorios (Equipo y Serie).');
      return;
    }

    setSubmitting(true);
    try {
      const response = await request({
        link: apiEditInventario,
        body: inventary,
        method: 'POST',
      });
      if (response && response.success) {
        alert('¡Equipo actualizado exitosamente!');
        window.location.href = './inventarioua';
      } else {
        alert(`${response?.message || 'Error al actualizar el equipo'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al actualizar el equipo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="contenedor" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        Cargando datos del equipo...
      </div>
    );
  }

  return (
    <div className="contenedor" style={{ maxWidth: '950px', margin: '0 auto', padding: '20px 15px' }}>
      <main>
        {/* Header Title Toolbar */}
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' }}>
              <FaEdit color="#38bdf8" /> Editar Equipo Biomédico
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Modifica la información técnica, ubicación o periodicidad de mantenimiento del equipo.
            </p>
          </div>
          <Link
            to="/inventarioua"
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
            <FaArrowLeft size={13} /> Volver al Inventario
          </Link>
        </div>

        {/* Structured Form Table */}
        <form onSubmit={EditEquipo}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '2px solid #38bdf8', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
            <table className="tabla-reporte" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
              <thead>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      backgroundColor: '#0f2744',
                      color: '#38bdf8',
                      fontSize: '15px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      padding: '14px 18px',
                      borderBottom: '2px solid #38bdf8',
                    }}
                  >
                    <FaHospital style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    1. DATOS DE LA INSTITUCIÓN Y UBICACIÓN
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th style={{ width: '22%' }}>IPS / CLIENTE:</th>
                  <td colSpan={3}>
                    {listaIps.length > 0 ? (
                      <select
                        name="institucion"
                        value={inventary.institucion || ''}
                        onChange={handleSave}
                        className="input-report"
                      >
                        <option value="">-- Seleccione una IPS --</option>
                        {listaIps.map((ipsItem, idx) => (
                          <option key={idx} value={ipsItem.nombre || ipsItem.institucion}>
                            {ipsItem.nombre || ipsItem.institucion}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name="institucion"
                        value={inventary.institucion || ''}
                        onChange={handleSave}
                        className="input-report"
                        placeholder="Nombre de la IPS / Clínica"
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <th>SERVICIO:</th>
                  <td colSpan={3}>
                    <input
                      name="servicio"
                      value={inventary.servicio || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. UCI Adultos, Quirófano, Urgencias..."
                    />
                  </td>
                </tr>
                <tr>
                  <th>UBICACIÓN ESPECÍFICA:</th>
                  <td colSpan={3}>
                    <input
                      name="ubicacion"
                      value={inventary.ubicacion || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. Cama 4, Sala 2, Estación de enfermería..."
                    />
                  </td>
                </tr>

                {/* Section 2 */}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      backgroundColor: '#0f2744',
                      color: '#38bdf8',
                      fontSize: '15px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      padding: '14px 18px',
                      borderTop: '2px solid #334155',
                      borderBottom: '2px solid #38bdf8',
                    }}
                  >
                    <FaMicrochip style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    2. IDENTIFICACIÓN Y ESPECIFICACIONES TÉCNICAS
                  </td>
                </tr>
                <tr>
                  <th style={{ width: '22%' }}>NOMBRE DEL EQUIPO:</th>
                  <td style={{ width: '28%' }}>
                    <input
                      name="equipo"
                      value={inventary.equipo || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. Monitor de Signos Vitales"
                      required
                    />
                  </td>
                  <th style={{ width: '22%' }}>MARCA:</th>
                  <td style={{ width: '28%' }}>
                    <input
                      name="marca"
                      value={inventary.marca || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. Mindray"
                    />
                  </td>
                </tr>
                <tr>
                  <th>MODELO:</th>
                  <td>
                    <input
                      name="modelo"
                      value={inventary.modelo || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. uMEC10"
                    />
                  </td>
                  <th>SERIE:</th>
                  <td>
                    <input
                      name="serie"
                      value={inventary.serie || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. SN-987654"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th>CÓD. INVENTARIO:</th>
                  <td>
                    <input
                      name="inventario"
                      value={inventary.inventario || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. ACT-00123"
                    />
                  </td>
                  <th>REGISTRO INVIMA:</th>
                  <td>
                    <input
                      name="registro_invima"
                      value={inventary.registro_invima || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. 2018EBC-0012345"
                    />
                  </td>
                </tr>
                <tr>
                  <th>CLASIFICACIÓN DE RIESGO:</th>
                  <td>
                    <select
                      name="riesgo"
                      value={inventary.riesgo || ''}
                      onChange={handleSave}
                      className="input-report"
                    >
                      <option value="">-- Seleccionar Riesgo --</option>
                      <option value="I">Clase I (Bajo Riesgo)</option>
                      <option value="IIA">Clase IIA (Riesgo Moderado)</option>
                      <option value="IIB">Clase IIB (Alto Riesgo)</option>
                      <option value="III">Clase III (Muy Alto Riesgo)</option>
                    </select>
                  </td>
                  <th>FORMA DE ADQUISICIÓN:</th>
                  <td>
                    <select
                      name="forma_adquisicion"
                      value={inventary.forma_adquisicion || ''}
                      onChange={handleSave}
                      className="input-report"
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="COMPRA DIRECTA">COMPRA DIRECTA</option>
                      <option value="COMODATO">COMODATO</option>
                      <option value="ALQUILER">ALQUILER</option>
                      <option value="DONACIÓN">DONACIÓN</option>
                    </select>
                  </td>
                </tr>

                {/* Section 3 */}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      backgroundColor: '#0f2744',
                      color: '#38bdf8',
                      fontSize: '15px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      padding: '14px 18px',
                      borderTop: '2px solid #334155',
                      borderBottom: '2px solid #38bdf8',
                    }}
                  >
                    <FaCalendarAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    3. GESTIÓN, FECHAS Y PERIODICIDAD DE MANTENIMIENTO
                  </td>
                </tr>
                <tr>
                  <th>FECHA INSTALACIÓN:</th>
                  <td>
                    <input
                      name="fecha_instalacion"
                      type="date"
                      value={inventary.fecha_instalacion || ''}
                      onChange={handleSave}
                      className="input-report"
                    />
                  </td>
                  <th>FECHA FABRICACIÓN:</th>
                  <td>
                    <input
                      name="fecha_fabricacion"
                      type="date"
                      value={inventary.fecha_fabricacion || ''}
                      onChange={handleSave}
                      className="input-report"
                    />
                  </td>
                </tr>
                <tr>
                  <th>PERIODICIDAD DE MTTO:</th>
                  <td>
                    <select
                      name="periodicidad"
                      value={inventary.periodicidad || ''}
                      onChange={handleSave}
                      className="input-report"
                    >
                      <option value="">-- Seleccionar Periodicidad --</option>
                      <option value="NO APLICA">NO APLICA (No programar en cronograma)</option>
                      <option value="MENSUAL">MENSUAL (1 mes)</option>
                      <option value="BIMESTRAL">BIMESTRAL (2 meses)</option>
                      <option value="TRIMESTRAL">TRIMESTRAL (3 meses)</option>
                      <option value="CUATRIMESTRAL">CUATRIMESTRAL (4 meses)</option>
                      <option value="SEMESTRAL">SEMESTRAL (6 meses)</option>
                      <option value="ANUAL">ANUAL (12 meses)</option>
                    </select>
                  </td>
                  <th>RESPONSABLE / ASIGNADO:</th>
                  <td>
                    <input
                      name="responsable"
                      value={inventary.responsable || ''}
                      onChange={handleSave}
                      className="input-report"
                      placeholder="Ej. Ing. Biomédico / Departamento Técnico"
                    />
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: '8px 12px' }}>
                    <MesesSelector
                      selectedMonths={inventary.meses_mantenimiento}
                      periodicidad={inventary.periodicidad}
                      fechaBase={inventary.fecha_instalacion}
                      onChange={(newMonths) =>
                        setInventary((prev) => ({ ...prev, meses_mantenimiento: newMonths }))
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Save Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Link
              to="/inventarioua"
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
                padding: '12px 28px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14.5px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
                transition: 'all 0.2s',
              }}
            >
              <FaSave size={16} /> {submitting ? 'Guardando...' : 'Guardar Cambios del Equipo'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditInventary;
