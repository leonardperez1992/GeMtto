import React from 'react';
import {
  FaTimes,
  FaPrint,
  FaFileAlt,
  FaInfoCircle,
  FaLayerGroup,
} from 'react-icons/fa';

function PrintHojaVidaModal({ isOpen, onClose, equipo, activeTab, onPrint }) {
  if (!isOpen) return null;

  const getTabName = () => {
    if (activeTab === 'historial') return 'Historial de Mantenimientos';
    if (activeTab === 'documentos') return 'Documentos del Modelo';
    return 'Ficha Técnica / Identificación';
  };

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '14px',
          border: '1px solid #38bdf8',
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          color: '#f8fafc',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '8px', color: '#38bdf8' }}>
              <FaPrint size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                Imprimir Hoja de Vida
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                {equipo?.equipo} {equipo?.marca ? `• ${equipo.marca}` : ''} {equipo?.serie ? `• SN: ${equipo.serie}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13.5px', color: '#cbd5e1', marginBottom: '18px' }}>
          Selecciona cómo deseas imprimir o exportar a PDF la hoja de vida del equipo biomédico:
        </p>

        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Opción 1: Hoja Completa (3 Páginas) */}
          <div
            onClick={() => onPrint('all')}
            style={{
              backgroundColor: '#0f172a',
              border: '1.5px solid #0284c7',
              borderRadius: '10px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.backgroundColor = '#172554';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.backgroundColor = '#0f172a';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.2)', padding: '10px', borderRadius: '8px', color: '#38bdf8', marginTop: '2px' }}>
                <FaLayerGroup size={22} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Documento Completo (3 Páginas)
                  <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '10.5px', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                    Recomendado
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4' }}>
                  Incluye: 1. Ficha Técnica y Especificaciones, 2. Historial de Mantenimientos y 3. Documentación del Modelo.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrint('all');
              }}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FaPrint /> Imprimir Todo
            </button>
          </div>

          {/* Opción 2: Solo la página actual */}
          <div
            onClick={() => onPrint('current')}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#64748b';
              e.currentTarget.style.backgroundColor = '#1e293b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.backgroundColor = '#0f172a';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(100, 116, 139, 0.2)', padding: '10px', borderRadius: '8px', color: '#94a3b8', marginTop: '2px' }}>
                <FaFileAlt size={22} />
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#ffffff' }}>
                  Solo Esta Página ({getTabName()})
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4' }}>
                  Imprime únicamente la sección que estás viendo actualmente en la pantalla.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrint('current');
              }}
              style={{
                backgroundColor: '#334155',
                color: '#ffffff',
                border: '1px solid #475569',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FaPrint /> Imprimir Página
            </button>
          </div>
        </div>

        {/* Consejo para mejor impresión */}
        <div
          style={{
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '12px',
            color: '#7dd3fc',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: '1.4',
          }}
        >
          <FaInfoCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Consejo para guardar como PDF o imprimir:</strong> En la ventana de impresión de tu navegador, asegúrate de activar la casilla <strong>"Gráficos de fondo"</strong> (<em>Background graphics</em>) para conservar los colores y encabezados institucionales.
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintHojaVidaModal;
