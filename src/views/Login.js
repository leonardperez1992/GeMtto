import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { loginUser } from '../redux/actions/user.action';

function Login() {
  const dispatch = useDispatch();

  const [user, setUser] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setUser(function (prev) {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const iniciarSesion = async () => {
    dispatch(loginUser(user));
  };

  return (
    <div className="contenedor">
      <div className="div-form">
        <h2>Iniciar Sesión</h2>
        <div className="input-contenedor">
          <input
            name="email"
            type="text"
            placeholder="Correo Electronico"
            onChange={handleChange}
          />
        </div>
        <div className="input-contenedor">
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            onChange={handleChange}
          />
        </div>
        <div className="button-contenedor">
          <input
            type="button"
            value="Iniciar sesión"
            className="button"
            onClick={iniciarSesion}
          />
        </div>
        <p>
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" className="link">
            Registrate{' '}
          </Link>
        </p>
      </div>
    </div>
  );
}
export default Login;
