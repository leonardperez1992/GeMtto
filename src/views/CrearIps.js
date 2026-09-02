import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiCreateIps } from '../utils/api';
import request from '../utils/request';
import ImageUploading from 'react-images-uploading';
import {
  FaHospital,
  FaCity,
  FaIdCard,
  FaSave,
  FaArrowLeft,
  FaCamera,
  FaTrash,
} from 'react-icons/fa';

function CrearIps() {
  const [imagen, setImagen] = useState([]);
  const [loading, setLoading] = useState(false);
  const maxNumber = 1;

  const [ips, setIps] = useState({
    ips: '',
    nit: '',
    ciudad: '',
  });

  const handleSave = (e) => {
    const { name, value } = e.target;
    setIps((prev) => ({ ...prev, [name]: value }));
  };

  const onImageChange = (imageList) => {
    setImagen(imageList);
  };

  const CreateIps = async (e) => {
    if (e) e.preventDefault();
    if (!ips.ips.trim()) {
      alert('Por favor ingresa al menos el nombre de la institución (IPS).');
      return;
    }

    setLoading(true);
    try {
      const response = await request({
        link: apiCreateIps,
        body: {
          logo: imagen,
          ips: ips.ips.trim().toUpperCase(),
          nit: ips.nit.trim(),
          ciudad: ips.ciudad.trim().toUpperCase(),
        },
        method: 'POST',
      });

      if (response && response.success) {
        const newId = response.ips1?._id || response.ips?._id;
        const quiereAdjuntar = window.confirm(
          '¡Institución (IPS) creada exitosamente!\n\n¿Deseas adjuntar ahora los documentos PDF (Plan de Mantenimiento, Capacitación, etc.)?'
        );
        if (quiereAdjuntar && newId) {
          window.location.href = `./editarips?id=${newId}`;
        } else {
          window.location.href = './ips';
        }
      } else {
        alert(`${response?.message || 'Error al crear la institución'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contenedor" style={{ maxWidth: '650px', margin: '0 auto', padding: '24px 15px' }}>
      <main>
        {/* Navigation / Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1.5px solid #334155',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '19px' }}>
              <FaHospital color="#38bdf8" /> Registrar Nueva IPS
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Registra una nueva sede o institución prestadora de salud en GEMTTO.
            </p>
          </div>
          <Link
            to="/ips"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            <FaArrowLeft size={12} /> Volver a IPS
          </Link>
        </div>

        {/* Structured Form Card */}
        <form onSubmit={CreateIps}>
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
            {/* Logo Uploader */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'block', marginBottom: '8px' }}>
                LOGO INSTITUCIONAL (OPCIONAL):
              </label>
              <div
                style={{
                  backgroundColor: '#0f172a',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px dashed #38bdf8',
                  textAlign: 'center',
                }}
              >
                <ImageUploading
                  value={imagen}
                  onChange={onImageChange}
                  maxNumber={maxNumber}
                  dataURLKey="data_url"
                >
                  {({ imageList, onImageUpload, onImageRemoveAll, isDragging, dragProps }) => (
                    <div>
                      {imageList.length === 0 ? (
                        <div
                          onClick={onImageUpload}
                          {...dragProps}
                          style={{
                            cursor: 'pointer',
                            padding: '14px 10px',
                            color: isDragging ? '#38bdf8' : '#94a3b8',
                          }}
                        >
                          <FaCamera size={32} color="#38bdf8" style={{ marginBottom: '6px' }} />
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                            Haz clic para subir el logo institucional
                          </div>
                          <div style={{ fontSize: '11.5px', marginTop: '3px' }}>PNG o JPG recomendado</div>
                        </div>
                      ) : (
                        <div>
                          {imageList.map((img, idx) => (
                            <div key={idx}>
                              <img
                                src={img['data_url']}
                                alt="Logo IPS"
                                style={{
                                  maxHeight: '100px',
                                  maxWidth: '100%',
                                  objectFit: 'contain',
                                  borderRadius: '6px',
                                  marginBottom: '8px',
                                }}
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={onImageRemoveAll}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 10px',
                                    backgroundColor: '#7f1d1d',
                                    color: '#fca5a5',
                                    border: '1px solid #ef4444',
                                    borderRadius: '6px',
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FaTrash size={11} /> Eliminar Logo
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </ImageUploading>
              </div>
            </div>

            {/* Nombre de la IPS */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FaHospital /> NOMBRE DE LA INSTITUCIÓN / IPS:
              </label>
              <input
                className="input-report"
                name="ips"
                type="text"
                placeholder="Ej. CLÍNICA MÉDICA DEL CARIBE, HOSPITAL SAN JUAN..."
                value={ips.ips}
                onChange={handleSave}
                required
                style={{ fontSize: '14px', textTransform: 'uppercase' }}
              />
            </div>

            {/* NIT */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FaIdCard /> NÚMERO DE IDENTIFICACIÓN TRIBUTARIA (NIT):
              </label>
              <input
                className="input-report"
                name="nit"
                type="text"
                placeholder="Ej. 900.123.456-7"
                value={ips.nit}
                onChange={handleSave}
              />
            </div>

            {/* Ciudad */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FaCity /> CIUDAD / MUNICIPIO:
              </label>
              <input
                className="input-report"
                name="ciudad"
                type="text"
                placeholder="Ej. VALLEDUPAR, CODAZZI, AGUACHICA..."
                value={ips.ciudad}
                onChange={handleSave}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '30px' }}>
            <Link
              to="/ips"
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
              <FaSave size={15} /> {loading ? 'Guardando...' : 'Guardar IPS'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CrearIps;
