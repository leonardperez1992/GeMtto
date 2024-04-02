import { useState, useEffect, useRef } from 'react';
import { apiReportes, apiFirmarReportes } from '../utils/api';
import request from '../utils/request';
import SignatureCanvas from 'react-signature-canvas';
import { Checkbox } from '../components/Checkbox';

function FirmarReportes() {
  const [reportes, setReportes] = useState([]);
  let reporteFirma = [];
  const [firmaIng, setFirmaIng] = useState('');
  const [firmaRecibe, setFirmaRecibe] = useState('');
  const firmaIngRef = useRef({});
  const firmaRecref = useRef({});

  const handleCheckboxChange = (id, checked) => {
    if (checked) {
      reporteFirma.push(id);
    } else {
      let deleteIndex = reporteFirma.indexOf(id);
      reporteFirma.splice(deleteIndex, 1);
    }
  };

  const [reporte, setReporte] = useState({
    _id: [],
    firma_ingeniero: '',
    nombre_ingeniero: '',
    cargo_ingeniero: '',
    firma_recibe: '',
    nombre_recibe: '',
    cargo_recibe: '',
  });

  const getReportes = async () => {
    const response = await request({
      link: apiReportes,
      method: 'GET',
    });
    if (response.success) {
      setReportes(response.reporte);
    } else {
      alert(`Sin conexión con el Servidor  ${response.message}`);
    }
  };

  const saveFirmaIng = (signature) => {
    setFirmaIng(signature);
  };

  const saveFirmaRecibe = (signature) => {
    setFirmaRecibe(signature);
  };

  const handleSave = (e) => {
    setReporte(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  useEffect(function () {
    getReportes();
  }, []);

  const Firmar = async () => {
    const body = {
      _id: reporteFirma,
      firma_ingeniero: firmaIng,
      nombre_ingeniero: reporte.nombre_ingeniero,
      cargo_ingeniero: reporte.cargo_ingeniero,
      firma_recibe: firmaRecibe,
      nombre_recibe: reporte.nombre_recibe,
      cargo_recibe: reporte.cargo_recibe,
    };
    if (body._id.length === 0) {
      alert('Por favor seleccione un reporte');
    } else {
      const response = await request({
        link: apiFirmarReportes,
        body,
        method: 'POST',
      });
      if (response.success) {
        alert('Reportes firmados exitosamente');
        window.location.href = './reportes';
      } else {
        alert(`${response.message}`);
      }
    }
  };
  const [buscar, setBuscar] = useState('');
  const handleSave2 = (e) => {
    setBuscar(e.target.value);
  };

  var reportesList = [];
  if (!buscar) {
    reportesList = reportes;
  } else {
    reportesList = reportes.filter((dato) =>
      dato.fecha.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  return (
    <div>
      <div>
        <div>
          <h3>Panel de Firma</h3>
          <div>
            <table className="tabla-reportes">
              <tr>
                <th>INGENIERO/TECNICO</th>
                <th>RECIBÍ A SATISFACCION</th>
              </tr>
              <tr>
                <td>
                  <SignatureCanvas
                    canvasProps={{
                      width: 350,
                      height: 150,
                    }}
                    ref={firmaIngRef}
                    onEnd={() => {
                      saveFirmaIng(firmaIngRef.current.toData());
                    }}
                  />
                </td>
                <td>
                  <SignatureCanvas
                    canvasProps={{ width: 350, height: 150 }}
                    ref={firmaRecref}
                    onEnd={() => {
                      saveFirmaRecibe(firmaRecref.current.toData());
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  {' '}
                  <button
                    onClick={() => {
                      firmaIngRef.current.clear();
                      saveFirmaIng(null);
                    }}
                  >
                    {' '}
                    Limpiar{' '}
                  </button>
                </td>
                <td>
                  {' '}
                  <button
                    onClick={() => {
                      firmaRecref.current.clear();
                      saveFirmaRecibe(null);
                    }}
                  >
                    {' '}
                    Limpiar{' '}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <label>NOMBRE: </label>
                  <input
                    className="input-report"
                    name="nombre_ingeniero"
                    type="text"
                    onChange={handleSave}
                  />
                </td>
                <td>
                  <label>NOMBRE: </label>
                  <input
                    className="input-report"
                    name="nombre_recibe"
                    type="text"
                    onChange={handleSave}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <label>CARGO: </label>
                  <input
                    className="input-report"
                    name="cargo_ingeniero"
                    type="text"
                    onChange={handleSave}
                  />
                </td>
                <td>
                  <label>CARGO: </label>
                  <input
                    className="input-report"
                    name="cargo_recibe"
                    type="text"
                    onChange={handleSave}
                  />
                </td>
              </tr>
            </table>
          </div>
          <div className="button-contenedor">
            <input
              type="button"
              value="Firmar"
              className="button"
              onClick={Firmar}
              style={{ background: '#003785' }}
            />
          </div>
        </div>
        <div>
          <table className="tabla-reportes">
            <thead>
              <tr>
                <td colSpan={2}>
                  <input
                    className="input-report"
                    value={buscar}
                    type="text"
                    placeholder="Digite la fecha"
                    onChange={handleSave2}
                  />
                </td>
              </tr>
              <tr>
                <th>FIRMAR</th>
                <th>Nº REPORTE</th>
                <th>FECHA</th>
                <th>EQUIPO</th>
                <th>SERIE</th>
                <th>INSTITUCION</th>
                <th>RESPONSABLE</th>
              </tr>
            </thead>
            <tbody>
              {reportesList.map(function (item) {
                return (
                  <tr>
                    <td>
                      <Checkbox
                        id={item?._id}
                        onChange={handleCheckboxChange}
                      />
                      Seleccione
                    </td>
                    <td>{item?.numero_reporte}</td>
                    <td>{item?.fecha}</td>
                    <td>{item?.equipo}</td>
                    <td>{item?.serie}</td>
                    <td>{item?.institucion}</td>
                    <td>{item?.nombre_ingeniero}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default FirmarReportes;
