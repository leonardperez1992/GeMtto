import React, { useEffect, useState } from 'react';
import request from '../utils/request';
import { apiReportes } from '../utils/api';
import ExportJsonExcel from 'js-export-excel';

function Informes() {
  const [reportes, setReportes] = useState([]);

  const getReportes = async () => {
    const response = await request({
      link: apiReportes,
      method: 'GET',
    });
    if (response.success) {
      setReportes(response.reporte);
    } else {
      alert(`Sin conexión con el Servidor ${response.message}`);
    }
  };

  useEffect(function () {
    getReportes();
  }, []);

  const downloadFileToExcel = () => {
    let option = {};
    let dataTable = [];
    if (reportes) {
      for (let i in reportes) {
        console.log();
        let obj = {
          Fecha: reportes[i].fecha,
          Equipo: reportes[i].equipo,
          Marca: reportes[i].marca,
          Modelo: reportes[i].modelo,
          Serie: reportes[i].serie,
          Institucion: reportes[i].institucion,
          Servicio: reportes[i].servicio,
          Tipo_mtto: reportes[i].tipo_servicio,
          Repuesto_1: reportes[i].descripcion1,
          Repuesto_2: reportes[i].descripcion2,
          Repuesto_3: reportes[i].descripcion3,
          Repuesto_4: reportes[i].descripcion4,
        };
        dataTable.push(obj);
        i++;
      }
    }

    option.fileName = 'Reporte';
    option.datas = [
      {
        sheetData: dataTable,
        sheetName: 'Reporte',
        sheetFilter: [
          'Fecha',
          'Equipo',
          'Marca',
          'Modelo',
          'Serie',
          'Institucion',
          'Servicio',
          'Tipo_mtto',
          'Repuesto_1',
          'Repuesto_2',
          'Repuesto_3',
          'Repuesto_4',
        ],
        sheetHeader: [
          'Fecha',
          'Equipo',
          'Marca',
          'Modelo',
          'Serie',
          'Institucion',
          'Servicio',
          'Tipo_mtto',
          'Repuesto_1',
          'Repuesto_2',
          'Repuesto_3',
          'Repuesto_4',
        ],
      },
    ];
    let toExcel = new ExportJsonExcel(option);
    toExcel.saveExcel();
  };
  return (
    <div>
      <button onClick={downloadFileToExcel}>Download</button>
    </div>
  );
}
export default Informes;
