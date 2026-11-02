import React, { useState, useRef } from 'react';
import { FaEraser, FaUpload, FaPenNib, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';

/**
 * Binariza una imagen RGBA detectando trazos de tinta sobre papel o fondo transparente
 * mediante umbral adaptativo local (Integral Image / Summed-Area Table) + percentil global.
 */
function binarizeSignatureImage(rgba, width, height, sensitivity = 0) {
  const lum = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const a = rgba[i * 4 + 3] / 255;
    const rawL = 0.299 * r + 0.587 * g + 0.114 * b;
    // Fondo transparente se mezcla con blanco (255)
    lum[i] = rawL * a + 255 * (1 - a);
  }

  const W1 = width + 1;
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    for (let x = 1; x <= width; x++) {
      rowSum += lum[(y - 1) * width + (x - 1)];
      integral[y * W1 + x] = integral[(y - 1) * W1 + x] + rowSum;
    }
  }

  const hist = new Int32Array(256);
  for (let i = 0; i < lum.length; i++) {
    hist[Math.min(255, Math.max(0, Math.round(lum[i])))]++;
  }
  let count = 0;
  let paperLevel = 240;
  for (let v = 255; v >= 0; v--) {
    count += hist[v];
    if (count >= lum.length * 0.12) {
      paperLevel = v;
      break;
    }
  }

  // sensitivity en [-25, +25]: positivo capta trazos más claros, negativo filtra más fondo
  const localDelta = Math.max(5, 16 - sensitivity * 0.4);
  const globalMaxLum = Math.min(246, Math.max(110, paperLevel - 14 + sensitivity * 1.1));

  const mask = new Uint8Array(width * height);
  const radius = Math.max(12, Math.round(Math.min(width, height) * 0.11));

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width, x + radius + 1);
      const area = (x1 - x0) * (y1 - y0);
      const sum =
        integral[y1 * W1 + x1] -
        integral[y0 * W1 + x1] -
        integral[y1 * W1 + x0] +
        integral[y0 * W1 + x0];
      const localMean = sum / area;
      const val = lum[y * width + x];

      if (val < globalMaxLum && localMean - val > localDelta) {
        mask[y * width + x] = 1;
      }
    }
  }

  // Eliminar ruido aislado de 1 píxel sin vecinos
  const cleaned = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (!mask[idx]) continue;
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (mask[(y + dy) * width + (x + dx)]) neighbors++;
        }
      }
      if (neighbors > 0) cleaned[idx] = 1;
    }
  }

  return cleaned;
}

/**
 * Calcula el campo de distancia al borde del trazo para estimar el grosor local de la firma.
 */
function computeDistanceField(mask, width, height) {
  const dist = new Float32Array(width * height);
  const INF = 1e6;
  for (let i = 0; i < width * height; i++) {
    dist[i] = mask[i] ? INF : 0;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!mask[idx]) continue;
      let d = dist[idx];
      if (x > 0) d = Math.min(d, dist[idx - 1] + 1);
      if (y > 0) d = Math.min(d, dist[idx - width] + 1);
      if (x > 0 && y > 0) d = Math.min(d, dist[idx - width - 1] + 1.414);
      if (x < width - 1 && y > 0) d = Math.min(d, dist[idx - width + 1] + 1.414);
      dist[idx] = d;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const idx = y * width + x;
      if (!mask[idx]) continue;
      let d = dist[idx];
      if (x < width - 1) d = Math.min(d, dist[idx + 1] + 1);
      if (y < height - 1) d = Math.min(d, dist[idx + width] + 1);
      if (x < width - 1 && y < height - 1) d = Math.min(d, dist[idx + width + 1] + 1.414);
      if (x > 0 && y < height - 1) d = Math.min(d, dist[idx + width - 1] + 1.414);
      dist[idx] = d;
    }
  }
  return dist;
}

/**
 * Esqueletización morfológica de Zhang-Suen para obtener ejes centrales de 1px de ancho.
 */
function zhangSuenThinning(mask, width, height) {
  const img = new Uint8Array(mask);
  const toClear = [];

  let changed = true;
  let maxIter = 40;
  while (changed && maxIter-- > 0) {
    changed = false;

    for (let step = 0; step < 2; step++) {
      toClear.length = 0;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          if (!img[idx]) continue;

          const p2 = img[(y - 1) * width + x];
          const p3 = img[(y - 1) * width + (x + 1)];
          const p4 = img[y * width + (x + 1)];
          const p5 = img[(y + 1) * width + (x + 1)];
          const p6 = img[(y + 1) * width + x];
          const p7 = img[(y + 1) * width + (x - 1)];
          const p8 = img[y * width + (x - 1)];
          const p9 = img[(y - 1) * width + (x - 1)];

          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;

          const A =
            (p2 === 0 && p3 === 1 ? 1 : 0) +
            (p3 === 0 && p4 === 1 ? 1 : 0) +
            (p4 === 0 && p5 === 1 ? 1 : 0) +
            (p5 === 0 && p6 === 1 ? 1 : 0) +
            (p6 === 0 && p7 === 1 ? 1 : 0) +
            (p7 === 0 && p8 === 1 ? 1 : 0) +
            (p8 === 0 && p9 === 1 ? 1 : 0) +
            (p9 === 0 && p2 === 1 ? 1 : 0);

          if (A !== 1) continue;

          if (step === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }

          toClear.push(idx);
        }
      }

      if (toClear.length > 0) {
        changed = true;
        for (let i = 0; i < toClear.length; i++) {
          img[toClear[i]] = 0;
        }
      }
    }
  }
  return img;
}

/**
 * Traza polilíneas continuas sobre el esqueleto respetando esquinas en L e intersecciones.
 */
function traceSkeletonPaths(skel, distField, width, height) {
  const visited = new Uint8Array(width * height);
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  function getCandidates(cx, cy) {
    const orth = [];
    const diag = [];
    for (let d = 0; d < 8; d++) {
      const dx = dirs[d][0];
      const dy = dirs[d][1];
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (!skel[nIdx] || visited[nIdx]) continue;
      if (dx === 0 || dy === 0) {
        orth.push([dx, dy, nx, ny]);
      } else {
        const s1 = skel[cy * width + nx] && !visited[cy * width + nx];
        const s2 = skel[ny * width + cx] && !visited[ny * width + cx];
        if (!s1 && !s2) {
          diag.push([dx, dy, nx, ny]);
        }
      }
    }
    return [...orth, ...diag];
  }

  const paths = [];

  function traceFrom(startX, startY) {
    const path = [];
    let cx = startX;
    let cy = startY;
    let prevDx = 0;
    let prevDy = 0;

    // Conectar al nodo de intersección adyacente si ya fue visitado
    for (let d = 0; d < 8; d++) {
      const nx = cx + dirs[d][0];
      const ny = cy + dirs[d][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (skel[nIdx] && visited[nIdx]) {
          path.push({ x: nx, y: ny, r: distField[nIdx] || 1.2 });
          prevDx = cx - nx;
          prevDy = cy - ny;
          break;
        }
      }
    }

    while (true) {
      const idx = cy * width + cx;
      visited[idx] = 1;
      path.push({
        x: cx,
        y: cy,
        r: distField[idx] || 1.2,
      });

      const candidates = getCandidates(cx, cy);
      if (candidates.length === 0) {
        if (path.length >= 3) {
          const prevPt = path[path.length - 2];
          for (let d = 0; d < 8; d++) {
            const nx = cx + dirs[d][0];
            const ny = cy + dirs[d][1];
            if (nx === prevPt.x && ny === prevPt.y) continue;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              if (skel[nIdx] && visited[nIdx] && Math.hypot(nx - prevPt.x, ny - prevPt.y) > 1.5) {
                path.push({ x: nx, y: ny, r: distField[nIdx] || 1.2 });
                break;
              }
            }
          }
        }
        break;
      }

      let best = candidates[0];
      let bestScore = -999;

      for (let i = 0; i < candidates.length; i++) {
        const [dx, dy] = candidates[i];
        let score = 0;
        if (prevDx !== 0 || prevDy !== 0) {
          score = (dx * prevDx + dy * prevDy) / (Math.hypot(dx, dy) * Math.hypot(prevDx, prevDy));
        }
        if (score > bestScore) {
          bestScore = score;
          best = candidates[i];
        }
      }

      prevDx = best[0];
      prevDy = best[1];
      cx = best[2];
      cy = best[3];
    }

    if (path.length > 0) {
      paths.push(path);
    }
  }

  // Paso 1: Iniciar desde extremos (1 vecino)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (skel[idx] && !visited[idx] && getCandidates(x, y).length === 1) {
        traceFrom(x, y);
      }
    }
  }

  // Paso 2: Lazos cerrados o puntos restantes
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (skel[idx] && !visited[idx]) {
        traceFrom(x, y);
      }
    }
  }

  return paths;
}

/**
 * Convierte las polilíneas trazadas al formato exacto de mapa de puntos de SignaturePad (toData / fromData).
 */
function pathsToPointGroups(paths, options = {}) {
  const minWidth = options.minWidth || 0.8;
  const maxWidth = options.maxWidth || 2.2;
  const thicknessScale = options.thicknessScale || 1.0;
  const color = options.color || '#000000';

  const pointGroups = [];
  let currentTime = Date.now() - 120000;

  for (let p = 0; p < paths.length; p++) {
    const raw = paths[p];
    if (raw.length === 1) {
      const pt = raw[0];
      currentTime += 16;
      pointGroups.push([
        {
          x: Number(pt.x.toFixed(1)),
          y: Number(pt.y.toFixed(1)),
          time: currentTime,
          color,
        },
      ]);
      continue;
    }

    // Suavizado ligero para eliminar el escalonado de píxeles
    const smoothed = raw.map((pt, i) => {
      if (i === 0 || i === raw.length - 1) return { ...pt };
      return {
        x: 0.25 * raw[i - 1].x + 0.5 * pt.x + 0.25 * raw[i + 1].x,
        y: 0.25 * raw[i - 1].y + 0.5 * pt.y + 0.25 * raw[i + 1].y,
        r: 0.25 * raw[i - 1].r + 0.5 * pt.r + 0.25 * raw[i + 1].r,
      };
    });

    // Submuestreo preservando extremos y geometría de curvas
    const sampled = [smoothed[0]];
    for (let i = 1; i < smoothed.length - 1; i++) {
      const prev = sampled[sampled.length - 1];
      const curr = smoothed[i];
      const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      if (dist >= 1.9) {
        sampled.push(curr);
      }
    }
    const last = smoothed[smoothed.length - 1];
    if (sampled[sampled.length - 1] !== last) {
      const prev = sampled[sampled.length - 1];
      if (Math.hypot(last.x - prev.x, last.y - prev.y) < 0.15 && sampled.length === 1) {
        sampled.push({ x: last.x + 0.4, y: last.y + 0.1, r: last.r });
      } else if (Math.hypot(last.x - prev.x, last.y - prev.y) >= 0.15) {
        sampled.push(last);
      }
    }

    const group = [];
    for (let i = 0; i < sampled.length; i++) {
      const pt = sampled[i];
      if (i === 0) {
        currentTime += 20;
      } else {
        const prev = sampled[i - 1];
        const dist = Math.max(0.4, Math.hypot(pt.x - prev.x, pt.y - prev.y));
        const desiredR = pt.r * 0.9 * thicknessScale;
        const targetRadius = Math.min(maxWidth * 0.96, Math.max(minWidth * 1.04, desiredR));
        const targetVelocity = Math.max(0.06, maxWidth / targetRadius - 1);
        const dt = Math.max(1, Math.round(dist / targetVelocity));
        currentTime += dt;
      }
      group.push({
        x: Number(pt.x.toFixed(2)),
        y: Number(pt.y.toFixed(2)),
        time: currentTime,
        color,
      });
    }

    // Añadir 2 puntos finales desplazados 0.2px en la tangente para que SignaturePad._fromData
    // dibuje hasta el último segmento sin producir división 0/0 en _calculateCurveControlPoints.
    const finalPt = group[group.length - 1];
    const prevPt = group.length >= 2 ? group[group.length - 2] : { x: finalPt.x - 1, y: finalPt.y };
    const dx = finalPt.x - prevPt.x;
    const dy = finalPt.y - prevPt.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    group.push({
      x: Number((finalPt.x + ux * 0.25).toFixed(2)),
      y: Number((finalPt.y + uy * 0.25).toFixed(2)),
      time: finalPt.time + 2,
      color,
    });
    group.push({
      x: Number((finalPt.x + ux * 0.5).toFixed(2)),
      y: Number((finalPt.y + uy * 0.5).toFixed(2)),
      time: finalPt.time + 4,
      color,
    });

    pointGroups.push(group);
  }

  return pointGroups;
}

/**
 * Carga una imagen desde File, Blob o DataURL y la convierte en mapa de puntos para SignatureCanvas.
 */
export function convertImageToSignaturePoints(imageSource, options = {}) {
  const targetWidth = Math.min(options.width || 360, 360);
  const targetHeight = options.height || 140;
  const sensitivity = options.sensitivity || 0;
  const thicknessScale = options.thicknessScale || 1.0;

  return new Promise((resolve, reject) => {
    const processDataUrl = (dataUrl) => {
      const img = new Image();
      img.onload = () => {
        try {
          // 1. Pre-análisis para detectar la caja delimitadora (bounding box) real de la firma
          const maxScanDim = 640;
          const scanScale = Math.min(1, maxScanDim / Math.max(img.width || 1, img.height || 1));
          const scanW = Math.max(32, Math.round((img.width || 360) * scanScale));
          const scanH = Math.max(32, Math.round((img.height || 140) * scanScale));

          const scanCanvas = document.createElement('canvas');
          scanCanvas.width = scanW;
          scanCanvas.height = scanH;
          const scanCtx = scanCanvas.getContext('2d');
          scanCtx.fillStyle = '#ffffff';
          scanCtx.fillRect(0, 0, scanW, scanH);
          scanCtx.drawImage(img, 0, 0, scanW, scanH);

          const scanData = scanCtx.getImageData(0, 0, scanW, scanH).data;
          const scanMask = binarizeSignatureImage(scanData, scanW, scanH, sensitivity);

          const borderMarginX = Math.max(2, Math.round(scanW * 0.03));
          const borderMarginY = Math.max(2, Math.round(scanH * 0.03));

          let minX = scanW;
          let minY = scanH;
          let maxX = 0;
          let maxY = 0;
          let foundInk = false;

          for (let y = borderMarginY; y < scanH - borderMarginY; y++) {
            for (let x = borderMarginX; x < scanW - borderMarginX; x++) {
              if (scanMask[y * scanW + x]) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                foundInk = true;
              }
            }
          }

          if (!foundInk) {
            minX = 0;
            minY = 0;
            maxX = scanW - 1;
            maxY = scanH - 1;
          }

          // Convertir coordenadas de recorte al tamaño original de la imagen con pequeño margen
          const padScan = 6;
          const cropX = Math.max(0, (minX - padScan) / scanScale);
          const cropY = Math.max(0, (minY - padScan) / scanScale);
          const cropW = Math.min(
            img.width - cropX,
            Math.max(16, (maxX - minX + padScan * 2) / scanScale)
          );
          const cropH = Math.min(
            img.height - cropY,
            Math.max(16, (maxY - minY + padScan * 2) / scanScale)
          );

          // 2. Dibujar la región recortada centrada y escalada proporcionalmente en el lienzo de firma (360x140)
          const workCanvas = document.createElement('canvas');
          workCanvas.width = targetWidth;
          workCanvas.height = targetHeight;
          const workCtx = workCanvas.getContext('2d');
          workCtx.fillStyle = '#ffffff';
          workCtx.fillRect(0, 0, targetWidth, targetHeight);

          const marginX = 18;
          const marginY = 12;
          const availW = targetWidth - marginX * 2;
          const availH = targetHeight - marginY * 2;
          const fitScale = Math.min(availW / cropW, availH / cropH);
          const drawW = cropW * fitScale;
          const drawH = cropH * fitScale;
          const drawX = Math.round((targetWidth - drawW) / 2);
          const drawY = Math.round((targetHeight - drawH) / 2);

          workCtx.drawImage(img, cropX, cropY, cropW, cropH, drawX, drawY, drawW, drawH);

          // 3. Extraer máscara binaria, campo de distancia, esqueleto y mapa de puntos
          const workData = workCtx.getImageData(0, 0, targetWidth, targetHeight).data;
          const mask = binarizeSignatureImage(workData, targetWidth, targetHeight, sensitivity);
          const distField = computeDistanceField(mask, targetWidth, targetHeight);
          const skel = zhangSuenThinning(mask, targetWidth, targetHeight);
          const paths = traceSkeletonPaths(skel, distField, targetWidth, targetHeight);
          const pointGroups = pathsToPointGroups(paths, {
            minWidth: 0.8,
            maxWidth: 2.2,
            thicknessScale,
            color: '#000000',
          });

          const pointCount = pointGroups.reduce((sum, g) => sum + g.length, 0);
          resolve({
            pointGroups,
            strokeCount: pointGroups.length,
            pointCount,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada.'));
      img.src = dataUrl;
    };

    if (typeof imageSource === 'string') {
      processDataUrl(imageSource);
    } else if (imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => processDataUrl(e.target.result);
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error('Formato de imagen no válido.'));
    }
  });
}

/**
 * Barra de controles reutilizable para alternar entre Firma Manual en pantalla táctil
 * y Subir Imagen (convirtiéndola automáticamente en mapa de puntos en el SignatureCanvas).
 */
export function SignatureModeControls({
  canvasRef,
  onClearExtra,
  onPointsGenerated,
  theme = 'dark',
}) {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('manual'); // 'manual' | 'image'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [sensitivity, setSensitivity] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);

  const isLight = theme === 'light';

  const applyImageToCanvas = async (file, customSensitivity) => {
    if (!file || !canvasRef?.current) return;
    setProcessing(true);
    try {
      const canvasEl = canvasRef.current.getCanvas ? canvasRef.current.getCanvas() : null;
      const targetW = Math.min(canvasEl?.width || 360, 360);
      const targetH = canvasEl?.height || 140;

      const result = await convertImageToSignaturePoints(file, {
        width: targetW,
        height: targetH,
        sensitivity: customSensitivity,
      });

      if (!result.pointGroups || result.pointGroups.length === 0) {
        alert(
          'No se detectaron trazos claros en la imagen. Intente con una imagen más nítida o aumente la sensibilidad (+).'
        );
        return;
      }

      canvasRef.current.clear();
      canvasRef.current.fromData(result.pointGroups);
      setStats({ strokeCount: result.strokeCount, pointCount: result.pointCount });

      if (typeof onPointsGenerated === 'function') {
        const dataUrl = canvasRef.current.toDataURL ? canvasRef.current.toDataURL() : '';
        onPointsGenerated(result.pointGroups, dataUrl);
      }
    } catch (err) {
      console.error('Error al convertir imagen en mapa de puntos:', err);
      alert('No fue posible procesar la imagen de la firma.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setMode('image');
    setUploadedFile(file);
    setSensitivity(0);
    await applyImageToCanvas(file, 0);
    e.target.value = '';
  };

  const handleSensitivityChange = async (delta) => {
    if (!uploadedFile) return;
    const next = Math.max(-25, Math.min(25, sensitivity + delta));
    setSensitivity(next);
    await applyImageToCanvas(uploadedFile, next);
  };

  const handleClear = () => {
    if (canvasRef?.current?.clear) {
      canvasRef.current.clear();
    }
    setUploadedFile(null);
    setStats(null);
    setSensitivity(0);
    if (typeof onClearExtra === 'function') {
      onClearExtra();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginTop: '8px',
        alignItems: 'center',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Opción 1: Firmar Manual */}
        <button
          type="button"
          onClick={() => setMode('manual')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: '600',
            cursor: 'pointer',
            border:
              mode === 'manual'
                ? '1.5px solid #0284c7'
                : isLight
                ? '1px solid #cbd5e1'
                : '1px solid #334155',
            backgroundColor:
              mode === 'manual'
                ? 'rgba(2, 132, 199, 0.18)'
                : isLight
                ? '#f8fafc'
                : '#1e293b',
            color: mode === 'manual' ? (isLight ? '#0369a1' : '#38bdf8') : isLight ? '#475569' : '#94a3b8',
          }}
          title="Dibujar la firma manualmente con pantalla táctil o mouse"
        >
          <FaPenNib size={11} /> Firmar Manual
        </button>

        {/* Opción 2: Subir Imagen -> Mapa de Puntos */}
        <button
          type="button"
          onClick={() => {
            setMode('image');
            fileInputRef.current?.click();
          }}
          disabled={processing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: '600',
            cursor: processing ? 'wait' : 'pointer',
            border:
              mode === 'image'
                ? '1.5px solid #10b981'
                : isLight
                ? '1px solid #cbd5e1'
                : '1px solid #334155',
            backgroundColor:
              mode === 'image'
                ? 'rgba(16, 185, 129, 0.18)'
                : isLight
                ? '#f8fafc'
                : '#1e293b',
            color: mode === 'image' ? (isLight ? '#047857' : '#6ee7b7') : isLight ? '#475569' : '#94a3b8',
          }}
          title="Subir imagen de firma y convertirla automáticamente a mapa de puntos"
        >
          <FaUpload size={11} /> {processing ? 'Convirtiendo...' : uploadedFile ? 'Cambiar Imagen' : 'Subir Imagen'}
        </button>

        {/* Botón Limpiar */}
        <button
          type="button"
          className={isLight ? undefined : 'btn-limpiar-firma'}
          onClick={handleClear}
          style={
            isLight
              ? {
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#ef4444',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }
              : undefined
          }
        >
          <FaEraser size={11} /> Limpiar Firma
        </button>
      </div>

      {/* Controles de ajuste fino de conversión cuando se ha cargado una imagen */}
      {uploadedFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            backgroundColor: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.7)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: isLight ? '#334155' : '#cbd5e1',
          }}
        >
          <span style={{ color: isLight ? '#047857' : '#6ee7b7', fontWeight: '600' }}>
            ✓ Mapa de puntos ({stats?.strokeCount || 0} trazos)
          </span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>Detalle trazo:</span>
          <button
            type="button"
            onClick={() => handleSensitivityChange(-6)}
            disabled={processing || sensitivity <= -24}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #475569',
              background: isLight ? '#ffffff' : '#1e293b',
              color: isLight ? '#0f172a' : '#f8fafc',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title="Menos sensibilidad (filtrar fondo/sombras)"
          >
            <FaSearchMinus size={10} />
          </button>
          <button
            type="button"
            onClick={() => handleSensitivityChange(6)}
            disabled={processing || sensitivity >= 24}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #475569',
              background: isLight ? '#ffffff' : '#1e293b',
              color: isLight ? '#0f172a' : '#f8fafc',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title="Más sensibilidad (captar trazos más suaves)"
          >
            <FaSearchPlus size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
