import React, { useEffect, useState } from 'react';
import request from '../utils/request';
import { apiReservas, apiEditReservas } from '../utils/api';
import { useSelector } from 'react-redux';

function MisReservas() {
  
  const user = useSelector((state) => state.user);
  const [state, setState] = useState(''); 

  const [reservas, setReservas] = useState([]);

  const obtenerReservas = async() =>{
    const response = await request({
      link: apiReservas,
      body: {id_user: user._id},
      method: 'GET',
    });
    if(response.success){
      setReservas(response.reservas);
    }else{
      alert(`${response.message}`)
    };
  };

  const guardar = async(idReserva) => {
    const response = await request({link: apiEditReservas, 
          body:({
          id_reserva: idReserva,
          stated: state
      }), method: 'POST'
      })
      if(response.success){            
          alert(`${response.message}`)
      }else{
          alert(`${response.message}`)
      }
  }


  useEffect(function (){
    obtenerReservas();
  }, []);


  return (
    <div>
      <main className="flex-shrink-0">
        {/*<!-- Features section-->*/}
        <section>
            <div className="panel-body" style={{ margin: '5%' }}>
              <div className="d-flex justify-content-center fw-bolder">
                <h3>Mis reservas</h3>
              </div>
              <div className="table-responsive">
                <table
                  className="table"
                  style={{
                    color: 'black',
                    width: '100%',
                    alignContent: 'center',
                  }}
                >
                  <thead style={{ backgroundColor: '#343a40', color: 'white' }}>
                    <tr>
                      <th>SERVICIO</th>
                      <th>PRECIO</th>
                      <th>BARBERO</th>
                      <th>FECHA</th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody style={{ backgroundColor: '#C4C4C4' }}>
                    {reservas.map(function(reserva){
                      return(
                        <tr>
                          <td>{reserva?.id_service.name}</td>
                          <td>${reserva?.id_service.price  + " "}COP</td>
                          <td>{reserva?.id_barbero.name}</td>
                          <td>{new Date(reserva?.date).toLocaleString()}</td>
                          {reserva?.estado === 'Completado'&&(
                            <td>{reserva.estado}</td>
                          )}
                          {reserva?.estado === 'Programado' &&(
                            <div>
                              <td>
                                <select
                                  className="form-select"
                                  aria-label="select example"
                                  onChange={function(e){
                                    setState(e.target.value);
                                  }}
                                >
                                  <option value={""}>{reserva.estado}</option>
                                  <option value={'Cancelado'}>Cancelado</option>
                                </select>
                              </td>
                              <td>                        
                              <button onClick={()=> guardar(reserva._id)}>GUARDAR</button>
                              </td>
                            </div>
                          )}
                          {reserva?.estado === 'Cancelado' &&(
                            <td>{reserva.estado}</td>
                          )}
                        </tr>
                      )})}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
      </main>
    </div>
  );
}
export default MisReservas;
