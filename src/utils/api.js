const baseUrl = 'http://192.168.1.11:3002/api'; //192.168.1.67 o 12
export const apiServicios = baseUrl + '/services';
export const apiUsers = baseUrl + '/users';
export const apiCreateUsers = apiUsers + '/create';
export const apiAuth = baseUrl + '/auth';
export const apiInventario = baseUrl + '/inventario';
export const apiCreateInventario = apiInventario + '/createinventario';
export const apiObtenerEquipo = apiInventario + '/obtenerequipo';
export const apiObtenerEquiposIps = apiInventario + '/obtenerequiposips';
export const apiFicha = baseUrl + '/ficha';
export const apiCrearFicha = apiFicha + '/create';
export const apiObtenerFicha = apiFicha + '/obtenerficha';
export const apiActMtto = baseUrl + '/actmtto';
export const apiCreateActMtto = apiActMtto + '/createactmtto';
export const apiReportes = baseUrl + '/reportes';
export const apiObtenerReporte = apiReportes + '/obtenerreporte';
export const apiObtenerReportes = apiReportes + '/obtenerreportes';
export const apiCreateReporte = apiReportes + '/createreporte';
export const apiCreateReporteExt = apiReportes + '/reportext';
export const apiReporteExterno = apiReportes + '/obtenerreportext';
export const apiFirmarReportes = apiReportes + '/firmareporte';
export const apiEliminarReportes = apiReportes + '/deletereporte';
export const apiIps = baseUrl + '/ips';
export const apiCreateIps = apiIps + '/createips';
export const apiGetIps = apiIps + '/getips';
