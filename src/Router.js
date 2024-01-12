import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { saveUser } from './redux/actions/user.action';
import Login from './views/Login';
import Registro from './views/Registro';
import Informes from './views/Informes';
import Reservar from './views/Reservar';
import Navbar from './components/Navbar';
import EditEmp from './views/EditEmp';
import Inventario from './views/Inventario';
import CreateInventary from './views/CreateInventary';
import ReporteService from './views/ReporteService';
import ReporteForm from './views/ReporteForm';
import CreateActMtto from './views/CreateActMtto';
import CrearIps from './views/CrearIps';
import Reportes from './views/Reportes';
import FirmarReportes from './views/FirmarReportes';
import ReportePdf from './views/ReportePdf';

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
          <Route exact path="/" element={<Inventario />} />
          <Route path="/editempleados" element={<EditEmp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/Informes" element={<Informes />} />
          <Route path="/reservar" element={<Reservar />} />
          <Route path="/inventarioua" element={<Inventario />} />
          <Route path="/createinventary" element={<CreateInventary />} />
          <Route path="/reporteService" element={<ReporteService />} />
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
