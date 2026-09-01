import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  FaTimes,
  FaQrcode,
  FaPrint,
  FaDownload,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
} from 'react-icons/fa';

function QrModal({ isOpen, onClose, equipo }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !equipo) return null;

  const qrUrl = `${window.location.origin}/hojadevidaqr?id=${equipo._id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas-download');
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${equipo.serie || 'equipo'}_${equipo.modelo || ''}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const printSticker = () => {
    window.print();
  };

  return (
    <div
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
    >
      {/* Estilos para impresión exclusiva del sticker de equipo biomédico */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .qr-sticker-printable, .qr-sticker-printable * {
            visibility: visible !important;
          }
          .qr-sticker-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 420px !important;
            border: 2px solid #000 !important;
            padding: 14px !important;
            background: #fff !important;
            color: #000 !important;
            font-family: Arial, sans-serif !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '14px',
          border: '1px solid #38bdf8',
          width: '100%',
          maxWidth: '540px',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #334155',
            paddingBottom: '12px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                padding: '8px',
                borderRadius: '8px',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FaQrcode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: '800' }}>
                CÓDIGO QR DEL EQUIPO
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Acceso directo a la Hoja de Vida, Reportes y Documentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '6px',
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Sticker Preview / Printable Card */}
        <div
          className="qr-sticker-printable"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px',
            color: '#0f172a',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '20px',
            border: '2px solid #cbd5e1',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* QR Code Canvas */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QRCodeCanvas
              id="qr-canvas-download"
              value={qrUrl}
              size={150}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: process.env.PUBLIC_URL + '/img/logoGemtto.png',
                x: undefined,
                y: undefined,
                height: 28,
                width: 28,
                excavate: true,
              }}
            />
            <div
              style={{
                fontSize: '9.5px',
                fontWeight: '800',
                color: '#0369a1',
                marginTop: '4px',
                textAlign: 'center',
                letterSpacing: '0.5px',
              }}
            >
              ESCANEAR HOJA DE VIDA
            </div>
          </div>

          {/* Equipment Info on Sticker */}
          <div style={{ flex: 1, fontSize: '12px', lineHeight: '1.4' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '800',
                color: '#0284c7',
                textTransform: 'uppercase',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '3px',
                marginBottom: '5px',
              }}
            >
              {equipo.institucion || 'GESTIÓN BIOMÉDICA GEMTTO'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
              {equipo.equipo}
            </div>
            <div style={{ color: '#475569', marginTop: '2px' }}>
              <strong>MARCA:</strong> {equipo.marca} | <strong>MOD:</strong> {equipo.modelo}
            </div>
            <div style={{ marginTop: '2px' }}>
              <strong>SERIE:</strong>{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0369a1' }}>
                {equipo.serie}
              </span>
            </div>
            {equipo.servicio && (
              <div style={{ color: '#475569', marginTop: '2px' }}>
                <strong>SERVICIO:</strong> {equipo.servicio}
              </div>
            )}
            {equipo.ubicacion && (
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                <strong>UBICACIÓN:</strong> {equipo.ubicacion}
              </div>
            )}
            {equipo.registro_invima && (
              <div style={{ color: '#64748b', fontSize: '10.5px', marginTop: '2px' }}>
                <strong>INVIMA:</strong> {equipo.registro_invima}
              </div>
            )}
          </div>
        </div>

        {/* URL Box with Copy */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
            Enlace de consulta pública directa:
          </label>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              backgroundColor: '#0f172a',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              readOnly
              value={qrUrl}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '12px',
                width: '100%',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="button"
              onClick={copyToClipboard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                backgroundColor: copied ? '#15803d' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {copied ? <FaCheck /> : <FaCopy />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <button
            type="button"
            onClick={printSticker}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <FaPrint /> Imprimir Rótulo
          </button>
          <button
            type="button"
            onClick={downloadQR}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <FaDownload /> Descargar PNG
          </button>
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            <FaExternalLinkAlt size={12} /> Abrir Vista QR
          </a>
        </div>
      </div>
    </div>
  );
}

export default QrModal;
