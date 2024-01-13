import { SAVE_USER, UPDATE_USER_NAME } from '../../constants';
import { apiAuth } from '../../utils/api';
import request from '../../utils/request';

export const saveUser = (payload) => ({
  type: SAVE_USER,
  payload,
});

export const updateUserName = (payload) => ({
  type: UPDATE_USER_NAME,
  payload,
});

export const loginUser = ({ email, password }) => {
  return async (dispatch) => {
    const response = await request({
      link: apiAuth,
      body: {
        email,
        password,
      },
      method: 'POST',
    });
    if (response.success) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      dispatch(saveUser(response.user));
      alert(`Bienvenido ${response.user.name}`);
      if (response.user.rol === 'user') {
        window.location.href = './agendaua';
      } else if (response.user.rol === 'barber') {
        window.location.href = './serviciosui';
      } else if (response.user.rol === 'admin') {
        window.location.href = './inventarioua';
      } else {
        alert('Autenticación incorrecta');
      }
    } else {
      alert(`Sin conexión con el Servidor  ${response.message}`);
    }
  };
};
