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
import ActMtto from './views/ActMtto';
import CreateActMtto from './views/CreateActMtto';
import EditActMtto from './views/EditActMtto';
import CrearIps from './views/CrearIps';
import Reportes from './views/Reportes';
import Repuestos from './views/Repuestos';
import FirmarReportes from './views/FirmarReportes';
import ReportePdf from './views/ReportePdf';
import UpdateReporte from './views/UpdateReporte';
import HojaDeVida from './views/HojadeVida';
import VerPdf from './views/VerPdf';
import EditInventary from './views/EditInventary';
import HojaDeVidaUser from './views/HojadeVidaUser';
import FichasTecnicas from './views/FichasTecnicas';
import CreateFichaTecnica from './views/CreateFichaTecnica';
import EditFichaTecnica from './views/EditFichaTecnica';
import Ips from './views/Ips';
import Informes from './views/Informes';

const RouterContainer = () => {
  const [verify, setVerify] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      dispatch(saveUser(JSON.parse(user)));
    }
    setVerify(true);
  }, [dispatch]);

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
          <Route path="/editarequipo" element={<EditInventary />} />
          <Route path="/hojadevida" element={<HojaDeVida />} />
          <Route path="/hojadevidausuario" element={<HojaDeVidaUser />} />
          <Route path="/fichastecnicas" element={<FichasTecnicas />} />
          <Route path="/crearfichatecnica" element={<CreateFichaTecnica />} />
          <Route path="/editarfichatecnica" element={<EditFichaTecnica />} />
          <Route path="/createinventary" element={<CreateInventary />} />
          <Route path="/reporteService" element={<ReporteService />} />
          <Route path="/reporte" element={<ReportePdf />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/repuestos" element={<Repuestos />} />
          <Route path="/firmareportes" element={<FirmarReportes />} />
          <Route path="/editareporte" element={<UpdateReporte />} />
          <Route path="/actmtto" element={<ActMtto />} />
          <Route path="/createactmtto" element={<CreateActMtto />} />
          <Route path="/editaract" element={<EditActMtto />} />
          <Route path="/ips" element={<Ips />} />
          <Route path="/crearips" element={<CrearIps />} />
          <Route path="/verpdf" element={<VerPdf />} />
          <Route path="/informes" element={<Informes />} />
        </Routes>
      </Router>
    </React.StrictMode>
  );
};

export default RouterContainer;
