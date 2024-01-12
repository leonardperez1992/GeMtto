// import React, {useEffect, useState} from 'react';
// import request from '../utils/request';
// import { apiReservas } from '../utils/api';
// import ExportJsonExcel from 'js-export-excel';

// function Informes() {

//     const [reservas, setReservas] = useState([]); 
  
//     const obtenerReservas = async() =>{
//       const response = await request({
//         link: apiReservas,
//         method: 'GET',
//       });
//       if(response.success){
//         setReservas(response.reservas);
//       }else{
//         alert(`${response.message}`)
//       };
//     };

    
//     useEffect(function (){
//     obtenerReservas();
//     }, []);
//     console.log(reservas);

//     const downloadFileToExcel = () =>{
      
//         let option = {};
//         let dataTable = [];
//         if(reservas){
//           for(let i in reservas){
//             console.log()
//             let obj = {
//               'Nombre' : reservas[i].id_service.name,
//               'Precio' : reservas[i].id_service.price
//             }
//             dataTable.push(obj);
//             i++;
//           }
//         };

//         option.fileName = 'Reporte';
//         option.datas = [
//           {
//             sheetData: dataTable,
//             sheetName: 'Reporte',
//             sheetFilter: ['Nombre', 'Precio'],
//             sheetHeader: ['Nombre', 'Precio']
//           }
//         ]
//         let toExcel = new ExportJsonExcel(option);
//         toExcel.saveExcel();
//     }
//     return (
//       <div>
//         <button onClick={downloadFileToExcel}>Download</button>
//       </div>
//     )   
// }
// export default Informes;
