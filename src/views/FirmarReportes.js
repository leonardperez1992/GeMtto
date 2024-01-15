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

  console.log(reporteFirma);

  const firmaIngRef = useRef({});
  const firmaRecref = useRef({});

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

  const CreateReport = async () => {
    const body = {
      _id: reporteFirma,
      firma_ingeniero: firmaIng,
      nombre_ingeniero: reporte.nombre_ingeniero,
      cargo_ingeniero: reporte.cargo_ingeniero,
      firma_recibe: firmaRecibe,
      nombre_recibe: reporte.nombre_recibe,
      cargo_recibe: reporte.cargo_recibe,
    };
    if (!body) {
      alert('Por favor diligencie todos los campos.');
    } else {
      console.log(body);
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

  var inventarios = [];
  if (!buscar) {
    inventarios = reportes;
  } else {
    inventarios = reportes.filter((dato) =>
      dato.fecha.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  const handleCheckboxChange = (id, checked) => {
    if (checked) {
      reporteFirma.push(id);
    } else {
      let deleteIndex = reporteFirma.indexOf(id);
      reporteFirma.splice(deleteIndex, 1);
    }
  };

  return (
    <div>
      <main>
        <section>
          <div>
            <div>
              <h3>Panel de Firma</h3>
            </div>
            <div style={{ border: '2px solid black' }}>
              <div>
                <table className="tabla-reportes">
                  <tr>
                    <th>INGENIERO/TECNICO</th>
                    <th>RECIBÍ A SATISFACCION</th>
                  </tr>
                  <tr>
                    <td>
                      <label style={{ fontSize: '12px' }}>FIRMA: </label>
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
                      <button
                        onClick={() => {
                          firmaIngRef.current.clear();
                          saveFirmaIng(null);
                        }}
                      >
                        {' '}
                        Clear{' '}
                      </button>
                    </td>
                    <td>
                      <label style={{ fontSize: '12px' }}>FIRMA: </label>
                      <SignatureCanvas
                        canvasProps={{ width: 350, height: 150 }}
                        ref={firmaRecref}
                        onEnd={() => {
                          saveFirmaRecibe(firmaRecref.current.toData());
                        }}
                      />
                      <button
                        onClick={() => {
                          firmaRecref.current.clear();
                          saveFirmaRecibe(null);
                        }}
                      >
                        {' '}
                        Clear{' '}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <label style={{ fontSize: '12px' }}>NOMBRE: </label>
                      <input
                        className="input-report"
                        name="nombre_ingeniero"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <label style={{ fontSize: '12px' }}>NOMBRE: </label>
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
                      <label style={{ fontSize: '12px' }}>CARGO: </label>
                      <input
                        className="input-report"
                        name="cargo_ingeniero"
                        type="text"
                        onChange={handleSave}
                      />
                    </td>
                    <td>
                      <label style={{ fontSize: '12px' }}>CARGO: </label>
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
                  onClick={CreateReport}
                  style={{ background: '#003785' }}
                />
              </div>
            </div>
            <div className="d-flex justify-content-center fw-bolder">
              <h3>Listado de Reportes</h3>
            </div>
            <div>
              <div
                style={{
                  width: '20%',
                  margin: 10,
                }}
              >
                <h4>Buscar:</h4>
                <input
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    margin: 5,
                    borderRadius: 10,
                    borderStyle: 'solid',
                    height: 43,
                  }}
                  value={buscar}
                  type="text"
                  placeholder="Digite la fecha"
                  onChange={handleSave2}
                />
              </div>
              <table className="tabla-reportes">
                <thead>
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
                  {inventarios.map(function (item) {
                    return (
                      <tr>
                        <td>
                          <Checkbox
                            id={item?._id}
                            onChange={handleCheckboxChange}
                          />
                          <label>Seleccione</label>
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
        </section>
      </main>
    </div>
  );
}
export default FirmarReportes;
