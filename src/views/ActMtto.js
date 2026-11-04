import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiActMtto } from '../utils/api';
import request from '../utils/request';
import { extraerParametroYReferencia } from '../utils/actMttoHelper';
import { LuClipboardEdit } from 'react-icons/lu';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { GoSearch } from 'react-icons/go';

function ActMtto() {
  const [actmtto, setActmtto] = useState([]);

  const getReportes = async () => {
    const response = await request({
      link: apiActMtto,
      method: 'GET',
    });
    if (response.success) {
      setActmtto(response.actmtto);
    } else {
      alert(`Sin conexión con el Servidor ${response.message}`);
    }
  };

  useEffect(function () {
    getReportes();
  }, []);

  const [buscar, setBuscar] = useState('');
  const handleSave = (e) => {
    setBuscar(e.target.value);
  };

  var actividades = {};
  if (!buscar) {
    actividades = actmtto;
  } else {
    actividades = actmtto.filter((dato) =>
      dato.equipo.toLowerCase().includes(buscar.toLowerCase())
    );
  }

  actividades.sort(function (a, b) {
    if (a.equipo > b.equipo) {
      return 1;
    }
    if (a.equipo < b.equipo) {
      return -1;
    }
    return 0;
  });

  return (
    <div className="contenedor">
      <main>
        <section>
          <div>
            <div className="div-buscar" style={{ display: 'inline-block' }}>
              <Link
                style={{
                  fontSize: '25px',
                  width: '100px',
                  padding: '5px',
                  borderRadius: '10px',
                  backgroundColor: '#dfeaf5',
                  fontStyle: 'normal',
                }}
                to="/createactmtto"
                className="link"
              >
                <HiOutlineDocumentPlus title="Crear" size={25} />
              </Link>
              <input
                className="input-buscar"
                value={buscar}
                placeholder="Equipo"
                onChange={handleSave}
              />
              <GoSearch size={25} className="lupa" />
            </div>
            <table className="tabla-actividades">
              <thead>
                <tr>
                  <th>EQUIPO</th>
                  <th>PARÁMETRO 1 / REF.</th>
                  <th>PARÁMETRO 2 / REF.</th>
                  <th>PARÁMETRO 3 / REF.</th>
                  <th>PARÁMETRO 4 / REF.</th>
                  <th>PARÁMETRO 5 / REF.</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map(function (item) {
                  const renderCeldaParam = (idx) => {
                    const { parametro, valorReferencia } = extraerParametroYReferencia(item, idx);
                    if (!parametro) return <span style={{ color: '#64748b' }}>NA</span>;
                    return (
                      <div>
                        <div style={{ fontWeight: '600' }}>{parametro}</div>
                        {valorReferencia && (
                          <div
                            style={{
                              marginTop: '3px',
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#38bdf8',
                              backgroundColor: 'rgba(56, 189, 248, 0.14)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                            }}
                          >
                            Ref: {valorReferencia}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <tr key={item?._id || item?.equipo}>
                      <td>{item?.equipo}</td>
                      <td>{renderCeldaParam(1)}</td>
                      <td>{renderCeldaParam(2)}</td>
                      <td>{renderCeldaParam(3)}</td>
                      <td>{renderCeldaParam(4)}</td>
                      <td>{renderCeldaParam(5)}</td>
                      <td>
                        <Link
                          to={`/editaract?id=${item?._id}`}
                          className="nav-link"
                        >
                          <LuClipboardEdit size={20} title="Editar" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
export default ActMtto;
