import React from 'react';
import { MESES_DEL_ANIO, MESES_ABREV, calcularMesesSugeridos } from '../utils/cronogramaHelper';
import { FaCalendarCheck, FaMagic, FaTimesCircle } from 'react-icons/fa';

function MesesSelector({ selectedMonths = [], onChange, periodicidad, fechaBase }) {
  const currentSelected = Array.isArray(selectedMonths) ? selectedMonths : [];

  const toggleMonth = (monthName) => {
    let updated;
    if (currentSelected.includes(monthName)) {
      updated = currentSelected.filter((m) => m !== monthName);
    } else {
      updated = [...currentSelected, monthName];
    }
    // Ordenar cronológicamente
    updated.sort((a, b) => MESES_DEL_ANIO.indexOf(a) - MESES_DEL_ANIO.indexOf(b));
    onChange(updated);
  };

  const handleAutoSuggest = () => {
    const suggested = calcularMesesSugeridos(periodicidad || 'SEMESTRAL', fechaBase);
    onChange(suggested);
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div style={{ marginTop: '8px', padding: '14px', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaCalendarCheck /> Meses de Mantenimiento Programados:
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleAutoSuggest}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#0369a1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
            title="Calcular automáticamente según la periodicidad seleccionada"
          >
            <FaMagic size={11} /> Auto Sugerir
          </button>
          {currentSelected.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
              title="Limpiar meses seleccionados"
            >
              <FaTimesCircle size={11} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Grid de 12 meses */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        {MESES_DEL_ANIO.map((mes, index) => {
          const isSelected = currentSelected.includes(mes);
          return (
            <button
              key={mes}
              type="button"
              onClick={() => toggleMonth(mes)}
              style={{
                padding: '7px 4px',
                borderRadius: '6px',
                border: isSelected ? '1.5px solid #38bdf8' : '1px solid #334155',
                backgroundColor: isSelected ? '#0284c7' : '#1e293b',
                color: isSelected ? '#ffffff' : '#94a3b8',
                fontWeight: isSelected ? '800' : '500',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease-in-out',
                boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.4)' : 'none',
              }}
              title={`${mes} (${isSelected ? 'Programado' : 'No programado'})`}
            >
              {MESES_ABREV[index]}
            </button>
          );
        })}
      </div>

      {/* Resumen del texto */}
      <div style={{ fontSize: '12px', color: currentSelected.length > 0 ? '#cbd5e1' : '#64748b', fontStyle: currentSelected.length > 0 ? 'normal' : 'italic' }}>
        <strong>Meses seleccionados ({currentSelected.length}):</strong>{' '}
        {currentSelected.length > 0 ? (
          <span style={{ color: '#38bdf8', fontWeight: '600' }}>{currentSelected.join(', ')}</span>
        ) : (
          'Ningún mes seleccionado (se calculará automáticamente por periodicidad)'
        )}
      </div>
    </div>
  );
}

export default MesesSelector;
