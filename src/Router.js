import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { saveUser } from './redux/actions/user.action';
import Login from './views/Login';
import Registro from './views/Registro';
import Navbar from './components/Navbar';
import Inventario from './views/Inventario';
import InventarioUser from './views/InventarioUser';
import CreateInventary from './views/CreateInventary';
import ReporteService from './views/ReporteService';
import ReporteExterno from './views/ReporteExterno';
import CreateActMtto from './views/CreateActMtto';
import CrearIps from './views/CrearIps';
import Reportes from './views/Reportes';
import FirmarReportes from './views/FirmarReportes';
import ReportePdf from './views/ReportePdf';
import HojaDeVida from './views/HojadeVida';
import FichaTecnica from './views/FichaTecnica';

const RouterContainer = () => {
  const [verify, setVerify] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      dispatch(saveUser(JSON.parse(user)));
    }
    setVerify(true);
  }, []);

  if (!verify) {
    return null;
  }
  return (
    <React.StrictMode>
      <Router>
        <Navbar />
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/inventarioua" element={<Inventario />} />
          <Route path="/inventariouser" element={<InventarioUser />} />
          <Route path="/hojadevida" element={<HojaDeVida />} />
          <Route path="/fichatecnica" element={<FichaTecnica />} />
          <Route path="/createinventary" element={<CreateInventary />} />
          <Route path="/reporteService" element={<ReporteService />} />
          <Route path="/reportexterno" element={<ReporteExterno />} />
          <Route path="/reporte" element={<ReportePdf />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/firmareportes" element={<FirmarReportes />} />
          <Route path="/createactmtto" element={<CreateActMtto />} />
          <Route path="/crearips" element={<CrearIps />} />
        </Routes>
      </Router>
    </React.StrictMode>
  );
};

export default RouterContainer;
