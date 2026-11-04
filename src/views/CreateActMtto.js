import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCreateActMtto } from '../utils/api';
import request from '../utils/request';
import { construirPayloadParametrosActMtto } from '../utils/actMttoHelper';
import {
  FaClipboardList,
  FaMicrochip,
  FaSlidersH,
  FaSave,
  FaArrowLeft,
  FaFileAlt,
} from 'react-icons/fa';

function CreateActMtto() {
  const [loading, setLoading] = useState(false);
  const [actMtto, setActmtto] = useState({
    equipo: '',
    actividades: '',
    parametro1: '',
    valor_referencia1: '',
    parametro2: '',
    valor_referencia2: '',
    parametro3: '',
    valor_referencia3: '',
    parametro4: '',
    valor_referencia4: '',
    parametro5: '',
    valor_referencia5: '',
  });

  const handleSave = (e) => {
    const { name, value } = e.target;
    setActmtto((prev) => ({ ...prev, [name]: value }));
  };

  const CreateAct = async (e) => {
    if (e) e.preventDefault();
    if (!actMtto.equipo.trim() || !actMtto.actividades.trim()) {
      alert('Por favor diligencie el nombre del equipo y el protocolo de actividades.');
      return;
    }

    setLoading(true);
    try {
      const parametrosPayload = construirPayloadParametrosActMtto(actMtto);
      const response = await request({
        link: apiCreateActMtto,
        body: {
          equipo: actMtto.equipo.trim().toUpperCase(),
          actividades: actMtto.actividades,
          ...parametrosPayload,
        },
        method: 'POST',
      });

      if (response && response.success) {
        alert('¡Protocolo de mantenimiento creado exitosamente!');
        window.location.href = './actmtto';
      } else {
        alert(`${response?.message || 'Error al crear la actividad de mantenimiento'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
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
              <FaClipboardList color="#38bdf8" /> Crear Protocolo de Mantenimiento
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
              Define los procedimientos técnicos y parámetros de prueba para este tipo de equipo.
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
        <form onSubmit={CreateAct}>
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
                placeholder="Ej. MONITOR DE SIGNOS VITALES, ELECTROCARDIÓGRAFO, DESFIBRILADOR..."
                value={actMtto.equipo}
                onChange={handleSave}
                required
                style={{ fontSize: '14px', textTransform: 'uppercase' }}
              />
            </div>

            {/* 2. Actividades y Protocolo */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FaFileAlt /> PROTOCOLO DE ACTIVIDADES DE MANTENIMIENTO:
              </label>
              <textarea
                className="textarea-report"
                name="actividades"
                rows={8}
                placeholder="Detalla paso a paso las actividades del protocolo:
1. Inspección visual del chasis y conexiones.
2. Limpieza interna y externa del equipo.
3. Verificación de sensores y accesorios.
4. Pruebas de seguridad eléctrica y encendido.
5. Calibración y verificación de parámetros de funcionamiento."
                value={actMtto.actividades}
                onChange={handleSave}
                required
                style={{ minHeight: '160px', lineHeight: '1.6' }}
              />
            </div>

            {/* 3. Parámetros de Prueba Sugeridos y Valores de Referencia */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FaSlidersH /> PARÁMETROS DE VERIFICACIÓN Y VALORES DE REFERENCIA (OPCIONALES):
              </label>
              <div
                style={{
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#0f172a',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 1fr',
                    backgroundColor: '#0f2b48',
                    color: '#38bdf8',
                    fontWeight: '700',
                    fontSize: '12px',
                    padding: '10px 14px',
                    borderBottom: '1px solid #334155',
                    gap: '12px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>Nº</div>
                  <div>PARÁMETRO EVALUADO</div>
                  <div>VALOR DE REFERENCIA / TOLERANCIA</div>
                </div>

                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 1fr',
                      gap: '12px',
                      padding: '10px 14px',
                      alignItems: 'center',
                      borderBottom: idx < 5 ? '1px solid #1e293b' : 'none',
                    }}
                  >
                    <div
                      style={{
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        color: '#94a3b8',
                      }}
                    >
                      #{idx}
                    </div>
                    <div>
                      <input
                        className="input-report"
                        name={`parametro${idx}`}
                        type="text"
                        placeholder={`Ej. ${idx === 1 ? 'Voltaje AC (V)' : idx === 2 ? 'Presión (mmHg)' : idx === 3 ? 'Energía (Joules)' : idx === 4 ? 'Temperatura (°C)' : 'Frecuencia (Hz)'}`}
                        value={actMtto[`parametro${idx}`]}
                        onChange={handleSave}
                      />
                    </div>
                    <div>
                      <input
                        className="input-report"
                        name={`valor_referencia${idx}`}
                        type="text"
                        placeholder={`Ej. ${idx === 1 ? '120V ± 5%' : idx === 2 ? '120/80 mmHg ± 3 mmHg' : idx === 3 ? '200 J ± 10%' : idx === 4 ? '37.0 °C ± 0.2 °C' : '60 bpm ± 1%'}`}
                        value={actMtto[`valor_referencia${idx}`]}
                        onChange={handleSave}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '30px' }}>
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
              <FaSave size={15} /> {loading ? 'Guardando...' : 'Guardar Protocolo'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateActMtto;
