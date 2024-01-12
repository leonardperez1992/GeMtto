// import React, {useState, useEffect} from 'react';
// import { apiServicios, apiGetBarbers, apiUpdateBarbers } from '../utils/api';
// import request from '../utils/request';

// function EditEmp() {

//   const [services, setServices] = useState([]);
//   const [service, setService] = useState([]);
//   const [barbers, setBarbers] = useState([]);
//   const [barber, setBarber] = useState([]);

//   const obtenerServicios = async() => {
//     const response = await request({
//       link: apiServicios,
//       method: 'GET',
//     });
//     if (response.success) {
//       setServices(response.services)
//     } else {
//       alert(`${response.message}`);
//     }
//   }
  
//   const obtenerBarberos = async() => {
//     const response = await request({
//       link: apiGetBarbers,
//       method: 'GET'
//     });
//     if (response.success) {
//       setBarbers(response.users)
//     } else {
//       alert(`${response.message}`);
//     }
//   }
//   useEffect(function (){
//     obtenerServicios();
//     obtenerBarberos();
//   }, []);

  
//   const guardar = async() =>{
        
//     if(!service || !barber){
//         alert("Por favor diligencie todos los campos.")
//     }else{
//         const response = await request({link: apiUpdateBarbers, 
//             body:({
//             id_service: [service],
//             id_barber: barber,
//         }), method: 'POST'
//         });
//         if(response.success){            
//             alert('Empleado actualizado exitosamente')
//             window.location.href='./empleadosua'
//         }else{
//             alert(`${response.message}`)
//         }
//     }
//   }; 

//   console.log(barber);
//   console.log(service);

// return (
//   <div>
//     <main className="flex-shrink-0">
//       {/*<!-- Features section-->*/}
//       <section className="py-2" id="features">
//         <div className="container px-5 my-10">
//           <div className="py-2 text-center">
//             <div className="container px-5 my-5">
//               <div className="row gx-5 justify-content-center">
//                 <div className="col-lg-10 col-xl-7">
//                   <div className="text-center">
//                     {/* < className="formulario" onSubmit={register}> */}
//                     <h1>Editar Empleados</h1>
//                     <div className="contenedor">
//                       <h4>Empleados</h4>
//                       <select
//                         className="form-select"
//                         aria-label="select example"
//                         onChange={function(e){
//                           setBarber(e.target.value);
//                         }}
//                       >
//                       <option value={""}>Seleccione el Empleado</option>
//                         {barbers.map(function(value, index){
//                         return(
//                           <option key={index} value={value._id}>{value.name}</option>
//                         )
//                       })}
//                       </select><br/>
//                       <br/>
//                       <h4>Servicios</h4>
//                       <select
//                         className="form-select"
//                         aria-label="select example"
//                         onChange={function(e){
//                           setService(e.target.value);
//                         }}
//                       >
//                       <option value={""}>Seleccione el Servicio a realizar</option>
//                         {services.map(function(value, index){
//                         return(
//                           <option key={index} value={value._id}>{value.name}</option>
//                         )
//                       })}
//                       </select>
//                       <br/>
//                       <input
//                         type="button"
//                         value="Guardar"
//                         className="button"
//                         onClick={guardar}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </main>
//   </div>
// );
// }
// export default EditEmp;
