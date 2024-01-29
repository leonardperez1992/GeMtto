// eslint-disable-next-line import/no-anonymous-default-export
export default async ({ link, body, method, file }) => {
  try {
    let requestOptions = {
      body: null,
      headers: {
        'Content-Type': 'application/json' || 'multipart/form-data',
      },
      method: method || (body ? 'POST' : 'GET'),
      file: file,
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
    const resJson = await response.json();
    return resJson;
  } catch (error) {
    console.log(error);
    return { success: false, message: JSON.stringify(error) };
  }
};
