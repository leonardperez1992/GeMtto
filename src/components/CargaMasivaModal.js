import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { apiBulkCreateInventario } from '../utils/api';
import request from '../utils/request';
import {
  FaFileExcel,
  FaDownload,
  FaUpload,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';

const MESES_CANONICOS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

const MESES_MAPA = {
  ene: 'ENERO',
  enero: 'ENERO',
  jan: 'ENERO',
  feb: 'FEBRERO',
  febrero: 'FEBRERO',
  mar: 'MARZO',
  marzo: 'MARZO',
  abr: 'ABRIL',
  abril: 'ABRIL',
  apr: 'ABRIL',
  may: 'MAYO',
  mayo: 'MAYO',
  jun: 'JUNIO',
  junio: 'JUNIO',
  jul: 'JULIO',
  julio: 'JULIO',
  ago: 'AGOSTO',
  agosto: 'AGOSTO',
  aug: 'AGOSTO',
  sep: 'SEPTIEMBRE',
  sept: 'SEPTIEMBRE',
  septiembre: 'SEPTIEMBRE',
  oct: 'OCTUBRE',
  octubre: 'OCTUBRE',
  nov: 'NOVIEMBRE',
  noviembre: 'NOVIEMBRE',
  dic: 'DICIEMBRE',
  diciembre: 'DICIEMBRE',
  dec: 'DICIEMBRE',
};

const parsearMeses = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const str = String(val).trim();
  if (!str) return [];
  const tokens = str.split(/[,;\-/|]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const result = [];
  tokens.forEach((t) => {
    const num = parseInt(t, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      const m = MESES_CANONICOS[num - 1];
      if (!result.includes(m)) result.push(m);
      return;
    }
    const found = MESES_MAPA[t] || MESES_CANONICOS.find((m) => m.toLowerCase().startsWith(t) || t.startsWith(m.toLowerCase()));
    if (found && !result.includes(found)) {
      result.push(found);
    }
  });
  return result;
};

const sugerirMesesPorPeriodicidad = (periodicidad) => {
  const p = String(periodicidad || '').toUpperCase();
  if (p.includes('NO APLICA') || p === 'NA' || p === 'N/A') {
    return [];
  }
  if (p.includes('MENSUAL') && !p.includes('BI') && !p.includes('TRI') && !p.includes('CUATRI')) {
    return [...MESES_CANONICOS];
  }
  if (p.includes('BIMESTRAL')) {
    return ['ENERO', 'MARZO', 'MAYO', 'JULIO', 'SEPTIEMBRE', 'NOVIEMBRE'];
  }
  if (p.includes('TRIMESTRAL')) {
    return ['ENERO', 'ABRIL', 'JULIO', 'OCTUBRE'];
  }
  if (p.includes('CUATRIMESTRAL')) {
    return ['ENERO', 'MAYO', 'SEPTIEMBRE'];
  }
  if (p.includes('SEMESTRAL')) {
    return ['ENERO', 'JULIO'];
  }
  if (p.includes('ANUAL')) {
    return ['ENERO'];
  }
  return [];
};

const formatExcelDate = (val) => {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (
    !str ||
    ['na', 'n/a', '-', '--', 'no', 'null', 'undefined', 'no aplica', 'no registra', 'sn', 's/n'].includes(
      str.toLowerCase()
    )
  ) {
    return '';
  }
  // Si es un número serial de Excel (ej: 44927 o 44927.5)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  // Si viene en formato DD/MM/YYYY o DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }
  // Si viene en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return str;
};

function CargaMasivaModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [loadingFile, setLoadingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const normalizeHeader = (str) =>
    String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  // 1. Descargar Plantilla Oficial Excel
  const descargarPlantilla = () => {
    const plantillaData = [
      {
        INSTITUCION: 'HOSPITAL SAN JOSE',
        EQUIPO: 'DESFIBRILADOR BIFASICO',
        MARCA: 'MINDRAY',
        MODELO: 'BENEHEART D3',
        SERIE: 'SN-DESF-001',
        INVENTARIO: 'ACT-00101',
        SERVICIO: 'URGENCIAS',
        UBICACION: 'PISO 1 - SALA REANIMACION',
        REGISTRO_INVIMA: '2019EBC-001234',
        RIESGO: 'III',
        RESPONSABLE: 'GEMTTO SAS',
        PERIODICIDAD: 'SEMESTRAL',
        PERIODICIDAD_CALIBRACION: 'ANUAL',
        MESES_MANTENIMIENTO: 'ENERO, JULIO',
        FORMA_ADQUISICION: 'COMPRA',
        FECHA_INSTALACION: '2023-05-15',
        FECHA_FABRICACION: '2023-01-10',
      },
      {
        INSTITUCION: 'HOSPITAL SAN JOSE',
        EQUIPO: 'MONITOR DE SIGNOS VITALES',
        MARCA: 'PHILIPS',
        MODELO: 'INTELLIVUE MX450',
        SERIE: 'SN-MON-002',
        INVENTARIO: 'ACT-00102',
        SERVICIO: 'UCI ADULTOS',
        UBICACION: 'PISO 3 - CAMA 04',
        REGISTRO_INVIMA: '2020EBC-005678',
        RIESGO: 'IIB',
        RESPONSABLE: 'GEMTTO SAS',
        PERIODICIDAD: 'TRIMESTRAL',
        PERIODICIDAD_CALIBRACION: 'ANUAL',
        MESES_MANTENIMIENTO: 'ENERO, ABRIL, JULIO, OCTUBRE',
        FORMA_ADQUISICION: 'COMPRA',
        FECHA_INSTALACION: '2024-02-10',
        FECHA_FABRICACION: '2023-11-20',
      },
      {
        INSTITUCION: 'CLINICA LAS AMERICAS',
        EQUIPO: 'ELECTROCARDIOGRAFO',
        MARCA: 'EDAN',
        MODELO: 'SE-1200',
        SERIE: 'SN-ECG-003',
        INVENTARIO: 'ACT-00201',
        SERVICIO: 'CONSULTA EXTERNA',
        UBICACION: 'CONSULTORIO 102',
        REGISTRO_INVIMA: '2018EBC-009988',
        RIESGO: 'IIA',
        RESPONSABLE: 'ING. BIOMEDICO',
        PERIODICIDAD: 'SEMESTRAL',
        PERIODICIDAD_CALIBRACION: 'ANUAL',
        MESES_MANTENIMIENTO: 'MARZO, SEPTIEMBRE',
        FORMA_ADQUISICION: 'COMODATO',
        FECHA_INSTALACION: '2023-08-01',
        FECHA_FABRICACION: '2022-10-15',
      },
      {
        INSTITUCION: 'CLINICA LAS AMERICAS',
        EQUIPO: 'BOMBA DE INFUSION',
        MARCA: 'B. BRAUN',
        MODELO: 'INFUSOMAT SPACE',
        SERIE: 'SN-BOM-004',
        INVENTARIO: 'ACT-00202',
        SERVICIO: 'HOSPITALIZACION',
        UBICACION: 'PISO 2 - SALA A',
        REGISTRO_INVIMA: '2021EBC-004321',
        RIESGO: 'IIB',
        RESPONSABLE: 'GEMTTO SAS',
        PERIODICIDAD: 'CUATRIMESTRAL',
        PERIODICIDAD_CALIBRACION: 'ANUAL',
        MESES_MANTENIMIENTO: 'ENERO, MAYO, SEPTIEMBRE',
        FORMA_ADQUISICION: 'COMPRA',
        FECHA_INSTALACION: '2023-10-05',
        FECHA_FABRICACION: '2023-04-12',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(plantillaData);

    // Configurar anchos de columna automáticos
    ws['!cols'] = [
      { wch: 25 }, // INSTITUCION
      { wch: 28 }, // EQUIPO
      { wch: 16 }, // MARCA
      { wch: 18 }, // MODELO
      { wch: 18 }, // SERIE
      { wch: 15 }, // INVENTARIO
      { wch: 20 }, // SERVICIO
      { wch: 25 }, // UBICACION
      { wch: 20 }, // REGISTRO_INVIMA
      { wch: 10 }, // RIESGO
      { wch: 18 }, // RESPONSABLE
      { wch: 16 }, // PERIODICIDAD
      { wch: 24 }, // PERIODICIDAD_CALIBRACION
      { wch: 30 }, // MESES_MANTENIMIENTO
      { wch: 18 }, // FORMA_ADQUISICION
      { wch: 18 }, // FECHA_INSTALACION
      { wch: 18 }, // FECHA_FABRICACION
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario_Equipos');
    XLSX.writeFile(wb, 'Plantilla_Inventario_GEMTTO.xlsx');
  };

  // 2. Procesar Archivo Excel Subido
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoadingFile(true);
    setImportResult(null);
    setImportError('');
    setImportProgress('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (!rawJson || rawJson.length === 0) {
          alert('El archivo no contiene filas de datos.');
          setParsedRows([]);
          setLoadingFile(false);
          return;
        }

        // Mapeo flexible de columnas con sinónimos ampliados
        const processed = rawJson.map((row, idx) => {
          const item = {};
          const mesesFromCols = [];

          Object.keys(row).forEach((colName) => {
            const val = String(row[colName] || '').trim();
            const norm = normalizeHeader(colName);

            if (
              norm.includes('institucion') ||
              norm.includes('ips') ||
              norm.includes('sede') ||
              norm.includes('hospital') ||
              norm.includes('clinica') ||
              norm.includes('cliente') ||
              norm.includes('entidad') ||
              norm.includes('empresa')
            ) {
              item.institucion = val;
            } else if (
              norm.includes('equipo') ||
              norm.includes('dispositivo') ||
              norm.includes('descripcion') ||
              norm === 'nombre' ||
              norm.includes('nombreequipo') ||
              norm.includes('nombredel') ||
              (norm.includes('activo') && !norm.includes('placa') && !norm.includes('inventario') && !norm.includes('fijo'))
            ) {
              item.equipo = val;
            } else if (norm.includes('marca') || norm.includes('fabricante') || norm.includes('brand')) {
              item.marca = val;
            } else if (norm.includes('modelo') || norm.includes('referencia') || norm.includes('ref')) {
              item.modelo = val;
            } else if (norm.includes('serie') || norm.includes('serial') || norm === 'sn' || norm.startsWith('sn')) {
              item.serie = val;
            } else if (norm.includes('inventario') || norm.includes('placa') || norm.includes('codigo') || norm.includes('activo')) {
              item.inventario = val;
            } else if (norm.includes('servicio') || norm.includes('area') || norm.includes('departamento') || norm.includes('seccion')) {
              item.servicio = val;
            } else if (norm.includes('ubicacion') || norm.includes('lugar') || norm.includes('sala') || norm.includes('piso') || norm.includes('consultorio')) {
              item.ubicacion = val;
            } else if (norm.includes('invima') || norm.includes('registro')) {
              item.registro_invima = val;
            } else if (norm.includes('riesgo') || norm.includes('clasificacion')) {
              item.riesgo = val;
            } else if (norm.includes('responsable') || norm.includes('encargado') || norm.includes('proveedor')) {
              item.responsable = val;
            } else if (norm.includes('calibracion')) {
              item.periodicidad_calibracion = val;
            } else if (norm.includes('periodicidad') || norm.includes('frecuencia')) {
              item.periodicidad = val;
            } else if (
              norm.includes('mesesmantenimiento') ||
              norm.includes('mesesmtto') ||
              norm.includes('mesesprogramados') ||
              norm === 'meses' ||
              norm.includes('mesmantenimiento')
            ) {
              item.meses_mantenimiento = val;
            } else if (norm.includes('adquisicion') || norm.includes('compra') || norm.includes('comodato')) {
              item.forma_adquisicion = val;
            } else if (norm.includes('instalacion')) {
              item.fecha_instalacion = formatExcelDate(val);
            } else if (norm.includes('fabricacion')) {
              item.fecha_fabricacion = formatExcelDate(val);
            }

            // Chequeo si vienen columnas de meses individuales (ENE..DIC)
            if (MESES_MAPA[norm] && ['x', '1', 'p', 'si', 's', 'true', 'ok'].includes(val.toLowerCase())) {
              const mesCanonical = MESES_MAPA[norm];
              if (!mesesFromCols.includes(mesCanonical)) {
                mesesFromCols.push(mesCanonical);
              }
            }
          });

          // Validación de campos obligatorios mínimos
          const errors = [];
          if (!item.institucion) errors.push('Falta Institución');
          if (!item.equipo) errors.push('Falta Nombre de Equipo');
          if (!item.serie) errors.push('Falta Número de Serie');

          const periodicidadFinal = (item.periodicidad || 'SEMESTRAL').toUpperCase();

          // Determinar meses de mantenimiento
          let mesesParsed = [];
          if (item.meses_mantenimiento) {
            mesesParsed = parsearMeses(item.meses_mantenimiento);
          }
          if (mesesParsed.length === 0 && mesesFromCols.length > 0) {
            mesesParsed = mesesFromCols;
          }
          if (mesesParsed.length === 0) {
            mesesParsed = sugerirMesesPorPeriodicidad(periodicidadFinal);
          }

          return {
            _index: idx + 1,
            institucion: item.institucion || '',
            equipo: item.equipo || '',
            marca: item.marca || 'GENÉRICA',
            modelo: item.modelo || 'S/M',
            serie: item.serie || '',
            inventario: item.inventario || 'NA',
            servicio: item.servicio || 'GENERAL',
            ubicacion: item.ubicacion || 'ÁREA GENERAL',
            registro_invima: item.registro_invima || 'NO REGISTRA',
            riesgo: (item.riesgo || 'IIB').toUpperCase(),
            responsable: item.responsable || 'GEMTTO SAS',
            periodicidad: periodicidadFinal,
            periodicidad_calibracion: (item.periodicidad_calibracion || 'ANUAL').toUpperCase(),
            meses_mantenimiento: mesesParsed,
            forma_adquisicion: item.forma_adquisicion || 'COMPRA',
            fecha_instalacion: item.fecha_instalacion || '',
            fecha_fabricacion: item.fecha_fabricacion || '',
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(processed);
      } catch (err) {
        console.error('Error al procesar el archivo Excel:', err);
        alert('Hubo un error al leer el archivo Excel. Asegúrate de que sea un archivo válido .xlsx, .xls o .csv.');
      } finally {
        setLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // 3. Confirmar e Importar Equipos en Lotes Seguros
  const handleConfirmarImportacion = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No hay registros válidos para importar.');
      return;
    }

    setImporting(true);
    setImportError('');
    setImportProgress('Iniciando importación...');

    // Limpiar claves internas antes de transferir datos
    const cleanEquipos = validRows.map((r) => ({
      _index: r._index,
      institucion: r.institucion,
      equipo: r.equipo,
      marca: r.marca,
      modelo: r.modelo,
      serie: r.serie,
      inventario: r.inventario,
      servicio: r.servicio,
      ubicacion: r.ubicacion,
      registro_invima: r.registro_invima,
      riesgo: r.riesgo,
      responsable: r.responsable,
      periodicidad: r.periodicidad,
      periodicidad_calibracion: r.periodicidad_calibracion || 'ANUAL',
      meses_mantenimiento: r.meses_mantenimiento,
      forma_adquisicion: r.forma_adquisicion,
      fecha_instalacion: r.fecha_instalacion,
      fecha_fabricacion: r.fecha_fabricacion,
    }));

    const BATCH_SIZE = 150;
    const totalBatches = Math.ceil(cleanEquipos.length / BATCH_SIZE);
    let totalCreated = 0;
    let totalSkipped = 0;
    let allSkippedDetails = [];

    try {
      for (let i = 0; i < cleanEquipos.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const chunk = cleanEquipos.slice(i, i + BATCH_SIZE);
        setImportProgress(`Importando lote ${batchNum} de ${totalBatches} (${chunk.length} equipos)...`);

        const response = await request({
          link: apiBulkCreateInventario,
          method: 'POST',
          body: { equipos: chunk },
        });

        if (response && response.success) {
          totalCreated += (response.createdCount || 0);
          totalSkipped += (response.skippedCount || 0);
          if (Array.isArray(response.skippedDetails)) {
            allSkippedDetails = [...allSkippedDetails, ...response.skippedDetails];
          }
        } else {
          const errMsg = response?.message || 'Error inesperado del servidor al procesar el lote.';
          throw new Error(errMsg);
        }
      }

      setImportResult({
        success: true,
        message: `Importación masiva completada: ${totalCreated} equipos registrados exitosamente, ${totalSkipped} omitidos.`,
        createdCount: totalCreated,
        skippedCount: totalSkipped,
        skippedDetails: allSkippedDetails,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error al importar equipos:', err);
      const msg = err?.message || 'Error de conexión o fallo inesperado al enviar los equipos al servidor.';
      setImportError(msg);
      alert(`Error al importar: ${msg}`);
    } finally {
      setImporting(false);
      setImportProgress('');
    }
  };

  const validosCount = parsedRows.filter((r) => r.isValid).length;
  const invalidosCount = parsedRows.length - validosCount;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1.5px solid #38bdf8',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1.5px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0f172a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaFileExcel size={24} color="#10b981" />
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '800' }}>
                Carga Masiva de Inventario de Equipos
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '12.5px' }}>
                Importación rápida de parque biomédico mediante archivo Excel (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Body Modal */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {importResult ? (
            /* Resultado Exitoso */
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <FaCheckCircle size={54} color="#10b981" style={{ marginBottom: '14px' }} />
              <h3 style={{ color: '#f8fafc', fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>
                ¡Importación Masiva Completada!
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px auto' }}>
                {importResult.message}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '12px 24px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: '700' }}>CREADOS</div>
                  <div style={{ fontSize: '28px', color: '#ffffff', fontWeight: '900' }}>
                    {importResult.createdCount}
                  </div>
                </div>

                {importResult.skippedCount > 0 && (
                  <div
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '10px',
                      padding: '12px 24px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#fcd34d', fontWeight: '700' }}>OMITIDOS</div>
                    <div style={{ fontSize: '28px', color: '#ffffff', fontWeight: '900' }}>
                      {importResult.skippedCount}
                    </div>
                  </div>
                )}
              </div>

              {importResult.skippedDetails && importResult.skippedDetails.length > 0 && (
                <div
                  style={{
                    textAlign: 'left',
                    backgroundColor: '#0f172a',
                    padding: '14px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid #334155',
                  }}
                >
                  <strong style={{ color: '#f59e0b', fontSize: '12.5px', display: 'block', marginBottom: '6px' }}>
                    Detalles de filas omitidas:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                    {importResult.skippedDetails.map((sk, sIdx) => (
                      <li key={sIdx} style={{ marginBottom: '4px' }}>
                        <strong>Fila {sk.fila}</strong> ({sk.equipo} - {sk.serie}): {sk.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  padding: '10px 28px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                Aceptar y Ver Inventario
              </button>
            </div>
          ) : (
            /* Flujo de Carga y Previsualización */
            <div>
              {/* Alerta de Error si ocurre durante la importación */}
              {importError && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: '#fca5a5',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <FaExclamationCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', color: '#f87171', marginBottom: '2px' }}>
                      Error durante la importación:
                    </strong>
                    <span>{importError}</span>
                  </div>
                </div>
              )}

              {/* Barra de Progreso de Importación */}
              {importing && (
                <div
                  style={{
                    backgroundColor: 'rgba(2, 132, 199, 0.15)',
                    border: '1px solid #0284c7',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: '#38bdf8',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <FaSpinner size={18} className="spin" style={{ flexShrink: 0 }} />
                  <span>{importProgress || 'Procesando equipos...'}</span>
                </div>
              )}

              {/* Nota Informativa sobre campos obligatorios vs opcionales */}
              <div
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '16px' }}>💡</span>
                <div style={{ lineHeight: '1.4' }}>
                  <strong style={{ color: '#38bdf8' }}>Campos obligatorios mínimos:</strong>{' '}
                  <span style={{ color: '#f8fafc', fontWeight: '600' }}>INSTITUCIÓN</span>,{' '}
                  <span style={{ color: '#f8fafc', fontWeight: '600' }}>EQUIPO</span> y{' '}
                  <span style={{ color: '#f8fafc', fontWeight: '600' }}>SERIE</span>.{' '}
                  <span>
                    La <strong style={{ color: '#34d399' }}>Fecha de Instalación</strong> y{' '}
                    <strong style={{ color: '#34d399' }}>Fecha de Fabricación</strong> son{' '}
                    <strong style={{ color: '#38bdf8' }}>100% OPCIONALES</strong>. Si no cuentas con ellas en tu archivo,
                    puedes dejarlas en blanco o no incluir esas columnas.
                  </span>
                </div>
              </div>

              {/* Acciones Superiores: Descargar Plantilla y Cargar Archivo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px',
                  marginBottom: '20px',
                }}
              >
                {/* 1. Botón Descargar Plantilla */}
                <div
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1.5px dashed #0284c7',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '13.5px' }}>
                      Paso 1: Plantilla Oficial
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                      Descarga el archivo con las columnas y formatos correctos.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={descargarPlantilla}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <FaDownload size={12} /> Plantilla
                  </button>
                </div>

                {/* 2. Zona de Selección de Archivo */}
                <div
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1.5px dashed #34d399',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '13.5px' }}>
                      Paso 2: Subir tu Excel
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                      {file ? file.name : 'Formatos aceptados: .xlsx, .xls, .csv'}
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx, .xls, .csv"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      disabled={loadingFile}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        cursor: loadingFile ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <FaUpload size={12} /> {file ? 'Cambiar' : 'Seleccionar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Estado de carga */}
              {loadingFile && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#38bdf8' }}>
                  <FaSpinner size={26} className="spin" style={{ marginBottom: '8px' }} />
                  <div>Analizando y validando filas del archivo...</div>
                </div>
              )}

              {/* Previsualización de Datos */}
              {parsedRows.length > 0 && !loadingFile && (
                <div>
                  {/* Resumen de Filas */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#0f172a',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: '1px solid #334155',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '700' }}>
                        Total leídos: <strong>{parsedRows.length}</strong>
                      </span>
                      <span
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.18)',
                          color: '#34d399',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '800',
                        }}
                      >
                        ✓ {validosCount} Válidos
                      </span>
                      {invalidosCount > 0 && (
                        <span
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.18)',
                            color: '#f87171',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800',
                          }}
                        >
                          ✕ {invalidosCount} Incompletos
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      * Se importarán únicamente las filas marcadas como válidas.
                    </div>
                  </div>

                  {/* Tabla Preview */}
                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  >
                    <table className="table" style={{ margin: 0, fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '4%', textAlign: 'center' }}>#</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>ESTADO</th>
                          <th style={{ width: '16%' }}>INSTITUCIÓN</th>
                          <th style={{ width: '18%' }}>EQUIPO</th>
                          <th style={{ width: '14%' }}>MARCA / MODELO</th>
                          <th style={{ width: '12%' }}>SERIE</th>
                          <th style={{ width: '12%' }}>SERVICIO</th>
                          <th style={{ width: '14%' }}>PERIODICIDAD / MESES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row) => (
                          <tr
                            key={row._index}
                            style={{
                              backgroundColor: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.08)',
                            }}
                          >
                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>{row._index}</td>
                            <td style={{ textAlign: 'center' }}>
                              {row.isValid ? (
                                <span
                                  style={{
                                    color: '#34d399',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <FaCheckCircle size={12} /> Válido
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: '#f87171',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title={row.errors.join(', ')}
                                >
                                  <FaExclamationCircle size={12} /> {row.errors[0]}
                                </span>
                              )}
                            </td>
                            <td style={{ color: '#38bdf8', fontWeight: '600' }}>{row.institucion || '-'}</td>
                            <td style={{ color: '#f8fafc', fontWeight: '700' }}>{row.equipo || '-'}</td>
                            <td style={{ color: '#cbd5e1' }}>
                              {row.marca} / {row.modelo}
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', color: '#f59e0b', fontWeight: '700' }}>
                                {row.serie || '-'}
                              </span>
                            </td>
                            <td style={{ color: '#94a3b8' }}>{row.servicio || '-'}</td>
                            <td>
                              <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '11.5px' }}>
                                {row.periodicidad || '-'}
                              </div>
                              <div style={{ color: '#34d399', fontSize: '10.5px', marginTop: '2px' }}>
                                {Array.isArray(row.meses_mantenimiento) && row.meses_mantenimiento.length > 0
                                  ? row.meses_mantenimiento.join(', ')
                                  : (row.periodicidad === 'NO APLICA' || row.periodicidad === 'NA' ? 'No programado' : 'Sin meses')}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        {!importResult && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1.5px solid #334155',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#0f172a',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#94a3b8',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmarImportacion}
              disabled={importing || validosCount === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: validosCount === 0 || importing ? '#334155' : '#0284c7',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                padding: '9px 22px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '13.5px',
                cursor: validosCount === 0 || importing ? 'not-allowed' : 'pointer',
                boxShadow: validosCount > 0 ? '0 4px 14px rgba(2, 132, 199, 0.45)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {importing ? (
                <>
                  <FaSpinner size={14} className="spin" /> {importProgress || 'Importando Equipos...'}
                </>
              ) : (
                <>
                  <FaUpload size={13} /> Importar {validosCount} Equipos Válidos
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CargaMasivaModal;
