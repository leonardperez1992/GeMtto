import React, { useState, useEffect } from 'react';
import { apiFiles } from '../utils/api';
import request from '../utils/request';

function VerPdf() {
  const [pdf, setPdf] = useState([]);

  const obtenerpdf = async (id) => {
    const response = await request({
      link: apiFiles,
      method: 'GET',
      body: { id },
    });
    if (response.success) {
      console.log(response.file);
      setPdf(response);
    } else {
      alert(`${response.message}`);
      console.log(response);
    }
  };

  console.log(pdf);

  useEffect(function () {
    let queryParameters = new URLSearchParams(window.location.search);
    let id = queryParameters.get('id');
    if (!id) {
      alert('No existe el Reporte');
    }
    obtenerpdf(id);
  }, []);

  return (
    <div>
      <div className="div-form"></div>
    </div>
  );
}
export default VerPdf;
