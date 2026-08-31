import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  apiSetActMtto,
  apiGetByIDActMtto,
  apiDeleteActMtto,
} from '../utils/api';
import request from '../utils/request';
import {
  FaClipboardList,
  FaMicrochip,
  FaSlidersH,
  FaSave,
  FaArrowLeft,
  FaTrash,
  FaFileAlt,
} from 'react-icons/fa';

function EditActMtto() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actmtto, setActmtto] = useState({
    _id: '',
    equipo: '',
    actividades: '',
    parametro1: '',
    parametro2: '',
    parametro3: '',
    parametro4: '',
    parametro5: '',
  });

  const getActmtto = async (id) => {
    try {
      const response = await request({
        link: apiGetByIDActMtto,
        method: 'GET',
        body: { id },
      });
      if (response && response.success && response.actmtto) {
        setActmtto(response.actmtto);
      } else {
        alert(`${response?.message || 'Error al obtener la actividad'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión con el servidor');
    }
  };

  const handleSave = (e) => {
    const { name, value } = e.target;
    setActmtto((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const queryParameters = new URLSearchParams(window.location.search);
    const idEquipo = queryParameters.get('id');
    if (idEquipo) {
      getActmtto(idEquipo);
    } else {
      alert('Seleccione una actividad de mantenimiento válida');
      window.location.href = './actmtto';
    }
  }, []);

  const UpdateAct = async (e) => {
    if (e) e.preventDefault();
    if (!actmtto.equipo.trim() || !actmtto.actividades.trim()) {
      alert('Por favor diligencie el nombre del equipo y el protocolo de actividades.');
      return;
    }

    setLoading(true);
    try {
      const response = await request({
        link: apiSetActMtto,
        body: {
          id: actmtto._id,
          equipo: actmtto.equipo.trim().toUpperCase(),
          actividades: actmtto.actividades,
          parametro1: actmtto.parametro1 || 'NA',
          parametro2: actmtto.parametro2 || 'NA',
          parametro3: actmtto.parametro3 || 'NA',
          parametro4: actmtto.parametro4 || 'NA',
          parametro5: actmtto.parametro5 || 'NA',
        },
        method: 'POST',
      });
      if (response && response.success) {
        alert('¡Actividad de mantenimiento actualizada exitosamente!');
        window.location.href = './actmtto';
      } else {
        alert(`${response?.message || 'Error al actualizar la actividad'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const deleteact = async () => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar el protocolo para "${actmtto.equipo}"?`);
    if (confirmar) {
      setDeleting(true);
      try {
        const response = await request({
          link: apiDeleteActMtto,
          body: { _id: actmtto._id },
          method: 'POST',
        });
        if (response && response.success) {
          alert('Protocolo de mantenimiento eliminado exitosamente');
          window.location.href = './actmtto';
        } else {
          alert(`${response?.message || 'Error al eliminar el protocolo'}`);
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor');
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="contenedor" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 15px' }}>
      <main>
        {/* Navigation / Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            padding: '16px 22px',
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
              <FaClipboardList color="#38bdf8" /> Editar Protocolo de Mantenimiento
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Modifica las actividades preventivas y parámetros sugeridos para este equipo biomédico.
            </p>
          </div>
          <Link
            to="/actmtto"
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
            }}
          >
            <FaArrowLeft size={13} /> Volver a Actividades
          </Link>
        </div>

        {/* Structured Form Card */}
        <form onSubmit={UpdateAct}>
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            {/* 1. Equipo */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FaMicrochip /> TIPO / NOMBRE DEL EQUIPO BIOMÉDICO:
              </label>
              <input
                className="input-report"
                name="equipo"
                type="text"
                value={actmtto?.equipo || ''}
                onChange={handleSave}
                required
                style={{ fontSize: '14px', textTransform: 'uppercase' }}
              />
            </div>

            {/* 2. Actividades */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FaFileAlt /> PROTOCOLO DE ACTIVIDADES DE MANTENIMIENTO:
              </label>
              <textarea
                className="textarea-report"
                name="actividades"
                rows={8}
                value={actmtto?.actividades || ''}
                onChange={handleSave}
                required
                style={{ minHeight: '160px', lineHeight: '1.6' }}
              />
            </div>

            {/* 3. Parámetros de Prueba */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FaSlidersH /> PARÁMETROS DE VERIFICACIÓN SUGERIDOS:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Parámetro {idx}:
                    </label>
                    <input
                      className="input-report"
                      name={`parametro${idx}`}
                      type="text"
                      value={actmtto[`parametro${idx}`] || ''}
                      onChange={handleSave}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '30px' }}>
            <button
              type="button"
              onClick={deleteact}
              disabled={deleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                border: '1.5px solid #ef4444',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <FaTrash size={14} /> {deleting ? 'Eliminando...' : 'Eliminar Protocolo'}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                to="/actmtto"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
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
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 28px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                <FaSave size={15} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditActMtto;
