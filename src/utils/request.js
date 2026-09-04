// eslint-disable-next-line import/no-anonymous-default-export
export default async ({ link, body, method }) => {
  try {
    let requestOptions = {
      body: null,
      headers: {
        'Content-Type': 'application/json',
      },
      method: method || (body ? 'POST' : 'GET'),
    };

    if (body) {
      if (method === 'GET') {
        let params = [];
        for (var param in body) {
          params.push(`${param}=${body[param]}`);
        }
        link += `?${params.join('&')}`;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    let response = await fetch(link, requestOptions);
    const text = await response.text();
    let resJson;
    try {
      resJson = JSON.parse(text);
    } catch (e) {
      const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        success: false,
        message: cleanText
          ? `Error del servidor (${response.status}): ${cleanText.slice(0, 180)}`
          : `Error HTTP ${response.status} del servidor`,
      };
    }
    return resJson;
  } catch (error) {
    console.error('Error en request:', error);
    const msg = error?.message || (typeof error === 'string' ? error : 'Error de conexión');
    return { success: false, message: msg };
  }
};
