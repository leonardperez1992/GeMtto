const baseUrl = 'http://192.168.1.59:3002/api';
export const apiUsers = baseUrl + '/users';
export const apiCreateUsers = apiUsers + '/create';
export const apiAuth = baseUrl + '/auth';
export const apiInventario = baseUrl + '/inventario';
export const apiCreateInventario = apiInventario + '/createinventario';
export const apiEditInventario = apiInventario + '/editinventario';
export const apiObtenerEquipo = apiInventario + '/obtenerequipo';
export const apiObtenerEquiposIps = apiInventario + '/obtenerequiposips';
export const apiEliminarEquipo = apiInventario + '/deletequipo';
export const apiFicha = baseUrl + '/ficha';
export const apiCrearFicha = apiFicha + '/create';
export const apiObtenerFicha = apiFicha + '/obtenerficha';
export const apiGetFichaById = apiFicha + '/obtenerfichabyid';
export const apiUpdateFicha = apiFicha + '/updateficha';
export const apiActMtto = baseUrl + '/actmtto';
export const apiCreateActMtto = apiActMtto + '/createactmtto';
export const apiGetActMtto = apiActMtto + '/getactmtto';
export const apiGetByIDActMtto = apiActMtto + '/getByIDactmtto';
export const apiSetActMtto = apiActMtto + '/setactmtto';
export const apiDeleteActMtto = apiActMtto + '/deleteact';
export const apiReportes = baseUrl + '/reportes';
export const apiObtenerReporte = apiReportes + '/obtenerreporte';
export const apiObtenerReportes = apiReportes + '/obtenerreportes';
export const apiCreateReporte = apiReportes + '/createreporte';
export const apiFirmarReportes = apiReportes + '/firmareporte';
export const apiUpdateReporte = apiReportes + '/updatereporte';
export const apiEliminarReportes = apiReportes + '/deletereporte';
export const apiIps = baseUrl + '/ips';
export const apiCreateIps = apiIps + '/createips';
export const apiGetIps = apiIps + '/getips';
export const apiFiles = baseUrl + '/files';
export const apiSetFiles = apiFiles + '/in-local';
