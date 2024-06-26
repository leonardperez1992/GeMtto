import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiIps, apiCreateUsers } from '../utils/api';
import request from '../utils/request';

function Registro() {
  const [ipss, setIpss] = useState([]);
  const [ips, setIps] = useState('');

  const obtenerIps = async () => {
    const response = await request({ link: apiIps, method: 'GET' });
    if (response.success) {
      setIpss(response.ips);
    } else {
      alert(`${response.message}`);
    }
  };

  const [user, setUser] = useState({
    username: '',
    usuario: '',
    password: '',
    institucion: '',
  });

  useEffect(function () {
    obtenerIps();
  }, []);

  const handleSave = (e) => {
    setUser(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const register = async () => {
    if (!user.usuario || !user.password || !user.username) {
      alert('Por favor diligencie todos los campos.');
    } else {
      const response = await request({
        link: apiCreateUsers,
        body: {
          name: user.username,
          usuario: user.usuario,
          password: user.password,
          institucion: ips,
        },
        method: 'POST',
      });
      if (response.success) {
        alert('Usuario creado exitosamente');
        window.location.href = './login';
      } else {
        alert(`${response.message}`);
      }
    }
  };
  return (
    <div>
      <div className="contenedor">
        <h1>Registrate</h1>
        <div className="contenedor">
          <div className="input-contenedor">
            <i className="fas fa-user icon"></i>
            <input
              name="username"
              type="text"
              placeholder="Nombre Completo"
              onChange={handleSave}
            />
          </div>
          <div className="input-contenedor">
            <i className="fas fa-envelope icon"></i>
            <input
              name="usuario"
              type="text"
              placeholder="Usuario"
              onChange={handleSave}
            />
          </div>
          <div className="input-contenedor">
            <i className="fas fa-key icon"></i>
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              onChange={handleSave}
            />
          </div>
          <div className="input-contenedor">
            <select
              className="form-select"
              aria-label="select example"
              onChange={function (e) {
                setIps(e.target.value);
              }}
            >
              <option value={''}>Seleccione la Institución</option>
              {ipss.map(function (value, index) {
                return (
                  <option key={index} value={value.ips}>
                    {value.ips}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="button-contenedor">
            <input
              type="button"
              value="Registrate"
              className="button"
              onClick={register}
            />
          </div>
          <p>
            ¿Ya tienes una cuenta?
            <Link to="/login" className="link">
              Iniciar Sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
export default Registro;
