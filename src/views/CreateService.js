import React, {useState} from 'react';
import { apiCreateServices } from '../utils/api';
import request from '../utils/request';

function CreateService() {


    const [service, setService] = useState({
        name: '',
        description:'',
        price: '',
        duration: ''
    });

    const handleSave = e =>{
        setService(function(prev){
            return ({...prev, [e.target.name]: e.target.value})
        });
    };

    const CreateServ = async() =>{
        
        if(!service.name || !service.description || !service.price || !service.duration){
            alert("Por favor diligencie todos los campos.")
        }else{
            const response = await request({link: apiCreateServices, 
                body:({
                name:service.name,
                description : service.description,
                price: service.price,
                duration: service.duration
            }), method: 'POST'
            })
            if(response.success){
                alert('Servicio creado exitosamente')
                window.location.href='./serviciosua'
            }else{
                alert(`${response.message}`)
            }
        }          
    };
  return (
    <div>
      <main className="flex-shrink-0">
        {/*<!-- Features section-->*/}
        <section className="py-2" id="features">
          <div className="container px-5 my-10">
            <div className="py-2 text-center">
              <div className="container px-5 my-5">
                <div className="row gx-5 justify-content-center">
                  <div className="col-lg-10 col-xl-7">
                    <div className="text-center">
                      {/* < className="formulario" onSubmit={register}> */}
                      <h1>Crear Servicio</h1>
                      <div className="contenedor">
                        <div className="input-contenedor">
                          <input
                            name="name"
                            type="text"
                            placeholder="Nombre del Servicio"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="description"
                            type="text"
                            placeholder="Descripción"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="price"
                            type="text"
                            placeholder="Precio"
                            onChange={handleSave}
                          />
                        </div>
                        <div className="input-contenedor">
                          <input
                            name="duration"
                            type="text"
                            placeholder="Duración"
                            onChange={handleSave}
                          />
                        </div>
                        <input
                          type="button"
                          value="Crear"
                          className="button"
                          onClick={CreateServ}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CreateService;
